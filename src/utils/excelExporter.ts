import * as XLSX from 'xlsx';
import { DataStageJob } from '../types';

/**
 * Auto-calculate column widths based on contents
 */
function fitToColumn(rows: any[]): Array<{ wch: number }> {
  if (!rows || rows.length === 0) return [];
  const colWidths: { [key: string]: number } = {};

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const val = row[key] ? String(row[key]) : '';
      const len = Math.max(val.length, key.length);
      colWidths[key] = Math.min(Math.max(colWidths[key] || 10, len + 3), 60);
    });
  });

  return Object.values(colWidths).map((w) => ({ wch: w }));
}

/**
 * Generates and downloads a multi-tab structured Excel workbook
 */
export function exportJobToExcel(job: DataStageJob): void {
  const wb = XLSX.utils.book_new();

  // --------------------------------------------------------------------------
  // Sheet 1: Job Summary
  // --------------------------------------------------------------------------
  const summaryData = [
    { Metric: 'DataStage Job Name', Value: job.jobName },
    { Metric: 'Category / Folder', Value: job.category },
    { Metric: 'Description', Value: job.description },
    { Metric: 'Source File Name', Value: job.fileName },
    { Metric: 'Specification Format', Value: job.rawFormat },
    { Metric: 'Scan Date & Time', Value: new Date(job.scanTimestamp).toLocaleString() },
    { Metric: 'Total Stages Count', Value: job.stats.totalStages },
    { Metric: 'Source Tables / Datasets', Value: job.stats.sourceCount },
    { Metric: 'Target Tables / Files', Value: job.stats.targetCount },
    { Metric: 'Transformations Count', Value: job.stats.transformCount },
    { Metric: 'Joins & Lookups Count', Value: job.stats.joinCount },
    { Metric: 'Filter Stages Count', Value: job.stats.filterCount },
    { Metric: 'Total Mapped Columns', Value: job.stats.columnCount },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 28 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Job_Summary');

  // --------------------------------------------------------------------------
  // Sheet 2: Source_Target_Mapping (STTM Matrix)
  // --------------------------------------------------------------------------
  const mappingRows = job.mappings.map((m, idx) => ({
    'Map ID': `M_${idx + 1}`,
    'Target Table': m.targetTable,
    'Target Column': m.targetColumn,
    'Target Data Type': m.targetDataType,
    'Nullable': m.targetNullable ? 'YES' : 'NO',
    'Source Table': m.sourceTable,
    'Source Column': m.sourceColumn,
    'Source Data Type': m.sourceDataType,
    'Transformation / Derivation': m.transformation,
    'Modern SQL Expression': m.sqlExpression,
    'Rule Type': m.ruleType,
    'Status': m.status,
    'Business Notes': m.notes || '',
  }));
  const mappingWs = XLSX.utils.json_to_sheet(mappingRows);
  mappingWs['!cols'] = fitToColumn(mappingRows);
  XLSX.utils.book_append_sheet(wb, mappingWs, 'Source_Target_Mapping');

  // --------------------------------------------------------------------------
  // Sheet 3: Tables_and_Columns (Complete Inventory)
  // --------------------------------------------------------------------------
  const tableRows: any[] = [];

  job.sources.forEach((src) => {
    if (src.columns.length > 0) {
      src.columns.forEach((c) => {
        tableRows.push({
          'Stage Name': src.stageName,
          'Entity Role': 'SOURCE',
          'Physical Name': src.tableName,
          'Technology / Type': src.databaseType,
          'Data Asset Type': src.sourceType,
          'Column Name': c.name,
          'SQL Data Type': c.sqlType,
          'Nullable': c.nullable ? 'YES' : 'NO',
          'Extraction Detail': src.query ? 'Custom Query' : (src.filePath || 'Direct Table Read'),
        });
      });
    } else {
      tableRows.push({
        'Stage Name': src.stageName,
        'Entity Role': 'SOURCE',
        'Physical Name': src.tableName,
        'Technology / Type': src.databaseType,
        'Data Asset Type': src.sourceType,
        'Column Name': '*',
        'SQL Data Type': 'N/A',
        'Nullable': 'YES',
        'Extraction Detail': src.query || src.filePath || 'Table',
      });
    }
  });

  job.targets.forEach((tgt) => {
    if (tgt.columns.length > 0) {
      tgt.columns.forEach((c) => {
        tableRows.push({
          'Stage Name': tgt.stageName,
          'Entity Role': 'TARGET',
          'Physical Name': tgt.tableName,
          'Technology / Type': tgt.databaseType,
          'Data Asset Type': tgt.targetType,
          'Column Name': c.name,
          'SQL Data Type': c.sqlType,
          'Nullable': c.nullable ? 'YES' : 'NO',
          'Extraction Detail': `Load Action: ${tgt.loadAction}`,
        });
      });
    } else {
      tableRows.push({
        'Stage Name': tgt.stageName,
        'Entity Role': 'TARGET',
        'Physical Name': tgt.tableName,
        'Technology / Type': tgt.databaseType,
        'Data Asset Type': tgt.targetType,
        'Column Name': '*',
        'SQL Data Type': 'N/A',
        'Nullable': 'YES',
        'Extraction Detail': `Load Action: ${tgt.loadAction}`,
      });
    }
  });

  const tablesWs = XLSX.utils.json_to_sheet(tableRows);
  tablesWs['!cols'] = fitToColumn(tableRows);
  XLSX.utils.book_append_sheet(wb, tablesWs, 'Tables_and_Columns');

  // --------------------------------------------------------------------------
  // Sheet 4: Transformations_Catalog
  // --------------------------------------------------------------------------
  const transformRows = job.transformations.map((t) => ({
    'Transformer Stage': t.stageName,
    'Target Column': t.targetColumn,
    'Target Data Type': t.targetDataType,
    'DataStage Derivation': t.derivation,
    'Source Columns Used': t.sourceColumns.join(', '),
    'Category': t.category,
    'Equivalent SQL Expression': t.sqlEquivalent,
    'Business Rule / Description': t.businessRule || '',
  }));
  const trnWs = XLSX.utils.json_to_sheet(transformRows);
  trnWs['!cols'] = fitToColumn(transformRows);
  XLSX.utils.book_append_sheet(wb, trnWs, 'Transformations_Catalog');

  // --------------------------------------------------------------------------
  // Sheet 5: Joins_and_Filters
  // --------------------------------------------------------------------------
  const logicRows: any[] = [];

  job.joins.forEach((j) => {
    logicRows.push({
      'Logic Type': 'JOIN / LOOKUP',
      'Stage Name': j.stageName,
      'Stage Type': j.stageType,
      'Primary Input': j.leftLink,
      'Secondary Input': j.rightLink,
      'Join Type': j.joinType,
      'Condition / Expression': j.conditionText,
      'Generated SQL Clause': j.sqlJoinClause,
    });
  });

  job.filters.forEach((f) => {
    logicRows.push({
      'Logic Type': 'FILTER',
      'Stage Name': f.stageName,
      'Stage Type': 'PxFilter',
      'Primary Input': f.inputLink,
      'Secondary Input': f.rejectLink || 'N/A (Discards)',
      'Join Type': 'N/A',
      'Condition / Expression': f.filterCondition,
      'Generated SQL Clause': f.sqlWhereClause,
    });
  });

  const logicWs = XLSX.utils.json_to_sheet(logicRows.length > 0 ? logicRows : [{ 'Notice': 'No Join or Filter stages in workflow.' }]);
  logicWs['!cols'] = fitToColumn(logicRows);
  XLSX.utils.book_append_sheet(wb, logicWs, 'Joins_and_Filters');

  // Generate binary and trigger browser download
  const safeJobName = (job.jobName || 'DataStage_ETL').replace(/[^A-Za-z0-9_]/g, '_');
  XLSX.writeFile(wb, `${safeJobName}_Documentation.xlsx`);
}
