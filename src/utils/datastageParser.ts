import {
  ColumnDefinition,
  DataStageJob,
  FilterInfo,
  JoinInfo,
  JoinKey,
  SourceTableInfo,
  SourceTargetMapping,
  StageCategory,
  StageLink,
  StageNode,
  StageVariable,
  TargetTableInfo,
  TransformationInfo,
} from '../types';
import { convertDataStageExpression, normalizeSqlDataType } from './expressionConverter';

/**
 * Determine stage category based on stage type or name
 */
function classifyStage(stageType: string, name: string, inputCount: number, outputCount: number): StageCategory {
  const typeLower = (stageType || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  if (
    typeLower.includes('transformer') ||
    typeLower === 'pxtransformer' ||
    nameLower.startsWith('trn_') ||
    nameLower.startsWith('xfm_')
  ) {
    return 'transformer';
  }

  if (
    typeLower.includes('join') ||
    typeLower === 'pxjoin' ||
    nameLower.startsWith('jn_') ||
    nameLower.startsWith('join_')
  ) {
    return 'join';
  }

  if (
    typeLower.includes('lookup') ||
    typeLower === 'pxlookup' ||
    nameLower.startsWith('lkp_') ||
    nameLower.startsWith('lookup_')
  ) {
    return 'lookup';
  }

  if (
    typeLower.includes('filter') ||
    typeLower === 'pxfilter' ||
    nameLower.startsWith('fil_') ||
    nameLower.startsWith('flt_')
  ) {
    return 'filter';
  }

  if (
    typeLower.includes('aggregator') ||
    typeLower === 'pxaggregator' ||
    nameLower.startsWith('agg_')
  ) {
    return 'aggregator';
  }

  if (
    typeLower.includes('sort') ||
    typeLower === 'pxsort' ||
    nameLower.startsWith('srt_')
  ) {
    return 'sort';
  }

  // Source detection: has no inputs (or stage type indicates source)
  if (
    inputCount === 0 ||
    nameLower.startsWith('src_') ||
    nameLower.includes('_source') ||
    nameLower.startsWith('in_')
  ) {
    return 'source';
  }

  // Target detection: has no outputs (or stage type indicates target)
  if (
    outputCount === 0 ||
    nameLower.startsWith('tgt_') ||
    nameLower.includes('_target') ||
    nameLower.startsWith('out_')
  ) {
    return 'target';
  }

  return 'other';
}

/**
 * Clean quoted strings or DataStage escape characters
 */
function cleanValue(val: string | undefined): string {
  if (!val) return '';
  let res = val.trim();
  if (res.startsWith('"') && res.endsWith('"')) {
    res = res.slice(1, -1);
  } else if (res.startsWith("'") && res.endsWith("'")) {
    res = res.slice(1, -1);
  }
  return res.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

/**
 * Parse DataStage DSX format
 */
function parseDsxContent(content: string, fileName: string): DataStageJob {
  let jobName = fileName.replace(/\.[^/.]+$/, '');
  let category = '\\Jobs';
  let description = 'IBM InfoSphere DataStage Parallel Job';

  // Extract Job Name
  const jobIdentMatch = content.match(/BEGIN DSJOB\s+Identifier "([^"]+)"/i);
  if (jobIdentMatch) {
    jobName = jobIdentMatch[1];
  }

  const catMatch = content.match(/Category "([^"]+)"/i);
  if (catMatch) {
    category = catMatch[1];
  }

  const descMatch = content.match(/Description "([^"]+)"/i);
  if (descMatch) {
    description = descMatch[1];
  }

  const rawStages: Array<{
    id: string;
    name: string;
    stageType: string;
    properties: Record<string, string>;
    inputPins: string[];
    outputPins: string[];
    subrecords: Array<Record<string, string>>;
  }> = [];

  const rawLinks: Array<{
    id: string;
    name: string;
    sourceStageId: string;
    targetStageId: string;
    partner: string;
    columns: ColumnDefinition[];
  }> = [];

  // Parse DSRECORD or DSSTAGE blocks
  // DSX files structure stages as BEGIN DSRECORD with OLEType "CCustomStage" or "CTransformerStage"
  const recordRegex = /BEGIN DSRECORD([\s\S]*?)END DSRECORD/g;
  let recMatch;

  while ((recMatch = recordRegex.exec(content)) !== null) {
    const block = recMatch[1];
    const idMatch = block.match(/Identifier "([^"]+)"/);
    const oleTypeMatch = block.match(/OLEType "([^"]+)"/);
    const nameMatch = block.match(/Name "([^"]+)"/);
    const stageTypeMatch = block.match(/StageType "([^"]+)"/);

    const id = idMatch ? idMatch[1] : '';
    const oleType = oleTypeMatch ? oleTypeMatch[1] : '';
    const name = nameMatch ? nameMatch[1] : id;
    const stageType = stageTypeMatch ? stageTypeMatch[1] : oleType;

    // Extract subrecords inside this record
    const subrecords: Array<Record<string, string>> = [];
    const subRegex = /BEGIN DSSUBRECORD([\s\S]*?)END DSSUBRECORD/g;
    let subMatch;
    while ((subMatch = subRegex.exec(block)) !== null) {
      const subBlock = subMatch[1];
      const props: Record<string, string> = {};
      const propLines = subBlock.split('\n');
      for (const line of propLines) {
        const lineMatch = line.trim().match(/^([A-Za-z0-9_]+)\s+"?([^"]*)"?$/);
        if (lineMatch) {
          props[lineMatch[1]] = cleanValue(lineMatch[2]);
        }
      }
      if (Object.keys(props).length > 0) {
        subrecords.push(props);
      }
    }

    // Properties at record level
    const properties: Record<string, string> = {};
    const lines = block.split('\n');
    for (const line of lines) {
      const lineMatch = line.trim().match(/^([A-Za-z0-9_]+)\s+"?([^"]*)"?$/);
      if (lineMatch) {
        properties[lineMatch[1]] = cleanValue(lineMatch[2]);
      }
    }

    // If it's a stage (CCustomStage, CTransformerStage, or has StageType)
    if (
      oleType.includes('Stage') ||
      stageType ||
      block.includes('InputPins') ||
      block.includes('OutputPins')
    ) {
      const inputPins = (properties.InputPins || '')
        .split('|')
        .map((p) => p.trim())
        .filter(Boolean);
      const outputPins = (properties.OutputPins || '')
        .split('|')
        .map((p) => p.trim())
        .filter(Boolean);

      rawStages.push({
        id,
        name: name || id,
        stageType: stageType || 'CustomStage',
        properties,
        inputPins,
        outputPins,
        subrecords,
      });
    }

    // If it's an Output Pin / Link (CCustomOutput, CTrnOutput)
    if (oleType.includes('Output') || block.includes('Partner')) {
      const columns: ColumnDefinition[] = [];

      for (const sub of subrecords) {
        if (sub.Name && (sub.SqlType || sub.Derivation || sub.Precision)) {
          columns.push({
            name: sub.Name,
            sqlType: normalizeSqlDataType(sub.SqlType, sub.Precision, sub.Precision, sub.Scale),
            length: sub.Precision || '255',
            precision: sub.Precision,
            scale: sub.Scale,
            nullable: sub.Nullable !== '0',
            derivation: sub.Derivation || sub.Name,
            description: sub.Description || '',
          });
        }
      }

      rawLinks.push({
        id,
        name: name || id,
        sourceStageId: '', // Will be mapped from stage outputPins
        targetStageId: properties.Partner ? properties.Partner.split('|')[0] : '',
        partner: properties.Partner || '',
        columns,
      });
    }
  }

  // Fallback: If no stages detected using strict OLEType, parse simplified DSSTAGE blocks
  if (rawStages.length === 0) {
    const stageRegex = /BEGIN DSSTAGE([\s\S]*?)END DSSTAGE/g;
    let stgMatch;
    while ((stgMatch = stageRegex.exec(content)) !== null) {
      const block = stgMatch[1];
      const idMatch = block.match(/Identifier "([^"]+)"/);
      const nameMatch = block.match(/Name "([^"]+)"/);
      const stageTypeMatch = block.match(/StageType "([^"]+)"/);

      const id = idMatch ? idMatch[1] : `S_${rawStages.length + 1}`;
      const name = nameMatch ? nameMatch[1] : id;
      const stageType = stageTypeMatch ? stageTypeMatch[1] : 'CustomStage';

      const properties: Record<string, string> = {};
      const subrecords: Array<Record<string, string>> = [];

      rawStages.push({
        id,
        name,
        stageType,
        properties,
        inputPins: [],
        outputPins: [],
        subrecords,
      });
    }
  }

  // Map links to source stages
  for (const stg of rawStages) {
    for (const outPin of stg.outputPins) {
      const link = rawLinks.find((l) => l.id === outPin);
      if (link) {
        link.sourceStageId = stg.id;
      }
    }
  }

  return assembleJobModel(jobName, category, description, 'DSX', fileName, rawStages, rawLinks, content);
}

/**
 * Parse DataStage XML Export format
 */
function parseXmlContent(content: string, fileName: string): DataStageJob {
  let jobName = fileName.replace(/\.[^/.]+$/, '');
  let category = '\\Jobs';
  let description = 'IBM InfoSphere DataStage XML Job';

  // Extract Job Identifier
  const jobMatch = content.match(/<Job[^>]+Identifier="([^"]+)"/i);
  if (jobMatch) {
    jobName = jobMatch[1];
  }

  const rawStages: Array<{
    id: string;
    name: string;
    stageType: string;
    properties: Record<string, string>;
    inputPins: string[];
    outputPins: string[];
    subrecords: Array<Record<string, string>>;
    columns?: ColumnDefinition[];
  }> = [];

  const rawLinks: Array<{
    id: string;
    name: string;
    sourceStageId: string;
    targetStageId: string;
    partner: string;
    columns: ColumnDefinition[];
  }> = [];

  // Match <Stage ...> or <CustomStage ...>
  const stageRegex = /<(?:Stage|CustomStage)([\s\S]*?)<\/(?:Stage|CustomStage)>/gi;
  let stgMatch;

  while ((stgMatch = stageRegex.exec(content)) !== null) {
    const block = stgMatch[1];
    const nameMatch = block.match(/(?:StageName|Name)="([^"]+)"/i);
    const typeMatch = block.match(/(?:StageType|Type)="([^"]+)"/i);
    const idMatch = block.match(/Identifier="([^"]+)"/i);

    const name = nameMatch ? nameMatch[1] : `Stage_${rawStages.length + 1}`;
    const stageType = typeMatch ? typeMatch[1] : 'CustomStage';
    const id = idMatch ? idMatch[1] : name;

    const properties: Record<string, string> = {};

    // Extract <Property Name="...">value</Property>
    const propRegex = /<Property[^>]+Name="([^"]+)"[^>]*>([\s\S]*?)<\/Property>/gi;
    let propMatch;
    while ((propMatch = propRegex.exec(block)) !== null) {
      properties[propMatch[1]] = cleanValue(propMatch[2]);
    }

    // Extract Columns from Pins/Records
    const stageColumns: ColumnDefinition[] = [];
    const colRegex = /<Column[^>]+Name="([^"]+)"([^>]*)(?:\/>|>([\s\S]*?)<\/Column>)/gi;
    let colMatch;

    while ((colMatch = colRegex.exec(block)) !== null) {
      const colName = colMatch[1];
      const attrs = colMatch[2];
      const inner = colMatch[3] || '';

      const typeMatch = attrs.match(/SqlType="([^"]+)"/i);
      const lenMatch = attrs.match(/(?:Length|Precision)="([^"]+)"/i);
      const scaleMatch = attrs.match(/Scale="([^"]+)"/i);
      const nullMatch = attrs.match(/Nullable="([^"]+)"/i);
      const derivMatch = attrs.match(/Derivation="([^"]+)"/i);

      let derivation = derivMatch ? derivMatch[1] : colName;
      if (!derivMatch && inner.includes('<Derivation>')) {
        const dMatch = inner.match(/<Derivation>([\s\S]*?)<\/Derivation>/i);
        if (dMatch) derivation = dMatch[1].trim();
      }

      stageColumns.push({
        name: colName,
        sqlType: normalizeSqlDataType(typeMatch ? typeMatch[1] : 'VARCHAR', lenMatch ? lenMatch[1] : '255', lenMatch ? lenMatch[1] : undefined, scaleMatch ? scaleMatch[1] : undefined),
        length: lenMatch ? lenMatch[1] : '255',
        precision: lenMatch ? lenMatch[1] : undefined,
        scale: scaleMatch ? scaleMatch[1] : undefined,
        nullable: nullMatch ? nullMatch[1] !== '0' : true,
        derivation,
      });
    }

    // Check for Links
    const outPinRegex = /<OutputPin[^>]+Name="([^"]+)"([^>]*)>/gi;
    let outMatch;
    const outputPins: string[] = [];
    while ((outMatch = outPinRegex.exec(block)) !== null) {
      const pinName = outMatch[1];
      outputPins.push(pinName);
      rawLinks.push({
        id: pinName,
        name: pinName,
        sourceStageId: id,
        targetStageId: '',
        partner: '',
        columns: stageColumns,
      });
    }

    rawStages.push({
      id,
      name,
      stageType,
      properties,
      inputPins: [],
      outputPins,
      subrecords: [],
      columns: stageColumns,
    });
  }

  // Parse Link elements if standalone
  const linkRegex = /<Link[^>]+Name="([^"]+)"[^>]+Source="([^"]+)"[^>]+Target="([^"]+)"/gi;
  let lnkMatch;
  while ((lnkMatch = linkRegex.exec(content)) !== null) {
    rawLinks.push({
      id: lnkMatch[1],
      name: lnkMatch[1],
      sourceStageId: lnkMatch[2],
      targetStageId: lnkMatch[3],
      partner: lnkMatch[3],
      columns: [],
    });
  }

  return assembleJobModel(jobName, category, description, 'XML', fileName, rawStages, rawLinks, content);
}

/**
 * Unified assembly of DataStageJob model with full extraction
 */
function assembleJobModel(
  jobName: string,
  category: string,
  description: string,
  rawFormat: 'DSX' | 'XML' | 'JSON' | 'UNKNOWN',
  fileName: string,
  rawStages: any[],
  rawLinks: any[],
  rawContent: string
): DataStageJob {
  const stages: StageNode[] = [];
  const sources: SourceTableInfo[] = [];
  const targets: TargetTableInfo[] = [];
  const transformations: TransformationInfo[] = [];
  const joins: JoinInfo[] = [];
  const filters: FilterInfo[] = [];
  const stageVariables: StageVariable[] = [];

  // Build Links first
  const links: StageLink[] = rawLinks.map((l, idx) => ({
    id: l.id || `L_${idx + 1}`,
    name: l.name || `Link_${idx + 1}`,
    sourceStageId: l.sourceStageId || '',
    sourceStageName: '',
    targetStageId: l.targetStageId || '',
    targetStageName: '',
    columns: l.columns || [],
  }));

  // Build Stages
  rawStages.forEach((stg, index) => {
    // Determine input and output links
    const outLinks = links.filter((l) => l.sourceStageId === stg.id).map((l) => l.name);
    const inLinks = links.filter((l) => l.targetStageId === stg.id).map((l) => l.name);

    // Columns
    let columns: ColumnDefinition[] = stg.columns || [];
    if (columns.length === 0) {
      // Try finding from connected links
      const associatedLink = links.find((l) => l.sourceStageId === stg.id || l.targetStageId === stg.id);
      if (associatedLink && associatedLink.columns) {
        columns = associatedLink.columns;
      }
    }

    const stgCat = classifyStage(stg.stageType, stg.name, inLinks.length, outLinks.length);

    stages.push({
      id: stg.id || `S_${index + 1}`,
      name: stg.name,
      stageType: stg.stageType,
      category: stgCat,
      properties: stg.properties || {},
      inputLinks: inLinks,
      outputLinks: outLinks,
      columns,
      x: 100 + (index % 4) * 260,
      y: 80 + Math.floor(index / 4) * 200,
    });
  });

  // Update Link Stage Names
  links.forEach((lnk) => {
    const src = stages.find((s) => s.id === lnk.sourceStageId || s.name === lnk.sourceStageId);
    if (src) lnk.sourceStageName = src.name;
    const tgt = stages.find((s) => s.id === lnk.targetStageId || s.name === lnk.targetStageId);
    if (tgt) lnk.targetStageName = tgt.name;
  });

  // Extract Sources
  stages.filter((s) => s.category === 'source').forEach((s) => {
    const p = s.properties || {};
    const tableName = p.tableName || p.TableName || p.Table || p.FileName || p.FilePath || s.name;
    const dbType = s.stageType.replace(/^Px/, '') || 'Database / File';
    const isFile = s.stageType.toLowerCase().includes('file') || tableName.includes('.') && (tableName.endsWith('.csv') || tableName.endsWith('.dat') || tableName.endsWith('.txt'));

    sources.push({
      stageName: s.name,
      stageType: s.stageType,
      tableName,
      schema: p.Schema || p.schema || (tableName.includes('.') ? tableName.split('.')[0] : undefined),
      databaseType: dbType,
      sourceType: isFile ? 'Flat File' : 'Database Table',
      query: p.SelectStatement || p.Query || p.query || undefined,
      filePath: p.FilePath || p.FileName || undefined,
      columns: s.columns,
      outputLink: s.outputLinks[0] || 'out_link',
    });
  });

  // Extract Targets
  stages.filter((s) => s.category === 'target').forEach((s) => {
    const p = s.properties || {};
    const tableName = p.tableName || p.TableName || p.Table || p.FileName || p.FilePath || s.name;
    const dbType = s.stageType.replace(/^Px/, '') || 'Database / File';
    const isFile = s.stageType.toLowerCase().includes('file');

    let loadAction: TargetTableInfo['loadAction'] = 'Insert';
    const writeMode = (p.WriteMode || p.LoadAction || p.mode || '').toLowerCase();
    if (writeMode.includes('update')) loadAction = 'Update';
    else if (writeMode.includes('upsert') || writeMode.includes('merge')) loadAction = 'Upsert / Merge';
    else if (writeMode.includes('truncate') || writeMode.includes('replace')) loadAction = 'Truncate & Load';
    else if (writeMode.includes('append')) loadAction = 'Append';

    targets.push({
      stageName: s.name,
      stageType: s.stageType,
      tableName,
      schema: p.Schema || p.schema || (tableName.includes('.') ? tableName.split('.')[0] : undefined),
      databaseType: dbType,
      targetType: isFile ? 'Flat File' : 'Database Table',
      loadAction,
      filePath: p.FilePath || p.FileName || undefined,
      columns: s.columns,
      inputLink: s.inputLinks[0] || 'in_link',
    });
  });

  // Extract Transformations from Transformers
  stages.filter((s) => s.category === 'transformer').forEach((s) => {
    s.columns.forEach((col, colIdx) => {
      const derivation = col.derivation || col.name;
      const converted = convertDataStageExpression(derivation, 'Snowflake');

      // Detect source columns used
      const srcColMatches = derivation.match(/\b([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\b/g) || [];
      const sourceCols = srcColMatches.map((m) => m.split('.')[1]);

      transformations.push({
        id: `TRN_${s.name}_${col.name}_${colIdx}`,
        stageName: s.name,
        outputLink: s.outputLinks[0] || 'out_link',
        targetColumn: col.name,
        targetDataType: col.sqlType,
        derivation,
        sourceColumns: sourceCols.length > 0 ? Array.from(new Set(sourceCols)) : [col.name],
        category: converted.category as any,
        sqlEquivalent: converted.sql,
        businessRule: converted.businessRule,
      });
    });

    // Check for Stage Variables in properties or subrecords
    if (s.properties) {
      Object.entries(s.properties).forEach(([k, v]) => {
        if (k.startsWith('StageVar') || k.toLowerCase().includes('variable')) {
          stageVariables.push({
            name: k,
            stageName: s.name,
            expression: String(v),
            sqlType: 'VARCHAR(255)',
            description: 'Transformer stage calculation intermediate variable',
          });
        }
      });
    }
  });

  // Extract Joins
  stages.filter((s) => s.category === 'join' || s.category === 'lookup').forEach((s, idx) => {
    const p = s.properties || {};
    let joinType: JoinInfo['joinType'] = 'INNER';
    const typeStr = (p.JoinType || p.join_type || p.operator || '').toLowerCase();
    if (typeStr.includes('left') || s.category === 'lookup') joinType = 'LEFT OUTER';
    else if (typeStr.includes('right')) joinType = 'RIGHT OUTER';
    else if (typeStr.includes('full')) joinType = 'FULL OUTER';

    const leftLink = s.inputLinks[0] || 'Lnk_Left';
    const rightLink = s.inputLinks[1] || 'Lnk_Right';

    const joinKeys: JoinKey[] = [];
    const keyVal = p.Key || p.join_key || p.Keys || p.KeyField || 'ID';
    const keysArray = keyVal.split(/[,;|]/).map((k: string) => k.trim()).filter(Boolean);

    keysArray.forEach((k: string) => {
      joinKeys.push({
        leftColumn: k,
        rightColumn: k,
        operator: '=',
      });
    });

    const conditionText = joinKeys.map((k) => `${leftLink}.${k.leftColumn} = ${rightLink}.${k.rightColumn}`).join(' AND ');
    const sqlJoinClause = `${joinType} JOIN right_table ON ${conditionText}`;

    joins.push({
      id: `JN_${idx + 1}`,
      stageName: s.name,
      stageType: s.stageType as any,
      joinType,
      leftLink,
      leftStage: s.inputLinks[0] || 'Source_1',
      rightLink,
      rightStage: s.inputLinks[1] || 'Source_2',
      joinKeys,
      conditionText,
      sqlJoinClause,
    });
  });

  // Extract Filters
  stages.filter((s) => s.category === 'filter').forEach((s, idx) => {
    const p = s.properties || {};
    const condition = p.Where || p.where || p.Condition || p.FilterExpr || p.Expression || '1=1';

    filters.push({
      id: `FIL_${idx + 1}`,
      stageName: s.name,
      inputLink: s.inputLinks[0] || 'in_link',
      outputLink: s.outputLinks[0] || 'out_link',
      rejectLink: s.outputLinks[1] || undefined,
      filterCondition: condition,
      sqlWhereClause: `WHERE ${condition}`,
      description: `Filters record stream passing only criteria: ${condition}`,
    });
  });

  // Build Source to Target Mappings (STTM)
  const mappings: SourceTargetMapping[] = [];

  targets.forEach((tgt) => {
    tgt.columns.forEach((tgtCol, colIdx) => {
      // Find matching transformation
      const matchingTrn = transformations.find((t) => t.targetColumn.toUpperCase() === tgtCol.name.toUpperCase());

      let sourceTable = 'SRC_UNKNOWN';
      let sourceColumn = tgtCol.name;
      let transformationDesc = tgtCol.name;
      let sqlExpr = tgtCol.name;
      let ruleType = 'Direct Mapping';
      let status: SourceTargetMapping['status'] = 'Mapped';

      if (matchingTrn) {
        transformationDesc = matchingTrn.derivation;
        sqlExpr = matchingTrn.sqlEquivalent;
        sourceColumn = matchingTrn.sourceColumns[0] || tgtCol.name;
        ruleType = matchingTrn.category;
        status = matchingTrn.category === 'Direct Pass-Through' ? 'Mapped' : 'Derived';
      }

      // Match source table
      const matchedSource = sources.find((src) =>
        src.columns.some((c) => c.name.toUpperCase() === sourceColumn.toUpperCase())
      );
      if (matchedSource) {
        sourceTable = matchedSource.tableName;
      } else if (sources.length === 1) {
        sourceTable = sources[0].tableName;
      } else if (sources.length > 0) {
        sourceTable = sources[0].tableName;
      }

      if (transformationDesc.toLowerCase().includes('surrogate') || ruleType === 'Surrogate Key') {
        status = 'Surrogate';
        sourceTable = 'SYSTEM_GEN';
        sourceColumn = 'N/A';
      }

      mappings.push({
        id: `MAP_${tgt.tableName}_${tgtCol.name}_${colIdx}`,
        targetTable: tgt.tableName,
        targetColumn: tgtCol.name,
        targetDataType: tgtCol.sqlType,
        targetNullable: tgtCol.nullable,
        sourceTable,
        sourceColumn,
        sourceDataType: tgtCol.sqlType,
        transformation: transformationDesc,
        sqlExpression: sqlExpr,
        ruleType,
        status,
        notes: `Extracted from DataStage ETL link to ${tgt.stageName}`,
      });
    });
  });

  const totalStages = stages.length;
  const sourceCount = sources.length;
  const targetCount = targets.length;
  const transformCount = transformations.length;
  const joinCount = joins.length;
  const filterCount = filters.length;
  const columnCount = mappings.length;

  return {
    jobName,
    category,
    description,
    rawFormat,
    fileName,
    rawContent,
    stages,
    links,
    sources,
    targets,
    transformations,
    joins,
    filters,
    mappings,
    stageVariables,
    parameters: [],
    scanTimestamp: new Date().toISOString(),
    stats: {
      totalStages,
      sourceCount,
      targetCount,
      transformCount,
      joinCount,
      filterCount,
      columnCount,
    },
  };
}

/**
 * Main parser entry point
 */
export function parseDataStageWorkflow(content: string, fileName: string = 'datastage_job.dsx'): DataStageJob {
  const trimmed = content.trim();

  // Detect format
  if (trimmed.startsWith('<?xml') || trimmed.includes('<DSExport>') || trimmed.includes('<Job')) {
    return parseXmlContent(trimmed, fileName);
  } else if (trimmed.includes('BEGIN DSJOB') || trimmed.includes('BEGIN DSRECORD') || trimmed.includes('BEGIN DSSTAGE')) {
    return parseDsxContent(trimmed, fileName);
  }

  // If text or json
  try {
    const json = JSON.parse(trimmed);
    if (json.stages || json.sources || json.targets) {
      return json as DataStageJob;
    }
  } catch {
    // fallback to DSX parser
  }

  return parseDsxContent(trimmed, fileName);
}
