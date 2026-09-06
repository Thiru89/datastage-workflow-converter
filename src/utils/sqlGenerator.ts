import { DataStageJob, SqlDialect } from '../types';

/**
 * Generate production-ready modern SQL scripts from parsed DataStage ETL job
 */
export function generateSqlPipeline(job: DataStageJob, dialect: SqlDialect = 'Snowflake'): string {
  const target = job.targets[0] || {
    stageName: 'Tgt_Default',
    tableName: 'TGT_OUTPUT_TABLE',
    loadAction: 'Insert' as const,
    databaseType: 'Relational Database',
    columns: [],
  };
  const lines: string[] = [];

  // Header
  lines.push(`-- ==============================================================================`);
  lines.push(`-- Modernized SQL ETL Pipeline`);
  lines.push(`-- Migrated from IBM InfoSphere DataStage Job: ${job.jobName}`);
  lines.push(`-- Target Dialect: ${dialect}`);
  lines.push(`-- Generated At: ${new Date().toISOString()}`);
  lines.push(`-- ==============================================================================`);
  lines.push(``);

  if (dialect === 'Snowflake') {
    lines.push(`-- Environment Configuration`);
    lines.push(`-- USE ROLE DATA_ENGINEER;`);
    lines.push(`-- USE WAREHOUSE TRANSFORMING_WH;`);
    lines.push(`-- USE DATABASE ANALYTICS_DB;`);
    lines.push(`-- USE SCHEMA PUBLIC;`);
    lines.push(``);
  }

  // CTE Pipeline
  lines.push(`WITH`);

  // 1. Source Extraction CTEs
  job.sources.forEach((src, idx) => {
    const cteName = `src_${src.tableName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`;
    const isLastCte = false;

    lines.push(`  -- [Source Stage: ${src.stageName} (${src.databaseType})]`);
    lines.push(`  ${cteName} AS (`);
    if (src.query) {
      lines.push(`    -- Original Extraction Query`);
      lines.push(`    ${src.query.trim()}`);
    } else {
      const colList = src.columns.length > 0
        ? src.columns.map((c) => `      ${c.name}`).join(',\n')
        : '      *';
      lines.push(`    SELECT`);
      lines.push(colList);
      lines.push(`    FROM ${src.tableName}`);
    }
    lines.push(`  ),`);
    lines.push(``);
  });

  // 2. Filter CTEs
  job.filters.forEach((fil, idx) => {
    const filterCte = `flt_${fil.stageName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`;
    const prevSource = job.sources[0]
      ? `src_${job.sources[0].tableName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`
      : 'src_table';

    lines.push(`  -- [Filter Stage: ${fil.stageName}]`);
    lines.push(`  ${filterCte} AS (`);
    lines.push(`    SELECT *`);
    lines.push(`    FROM ${prevSource}`);
    lines.push(`    ${fil.sqlWhereClause}`);
    lines.push(`  ),`);
    lines.push(``);
  });

  // 3. Join / Lookup CTEs
  job.joins.forEach((jn, idx) => {
    const joinCte = `jn_${jn.stageName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`;
    const leftAlias = 't1';
    const rightAlias = 't2';

    const leftSource = job.sources[0]
      ? `src_${job.sources[0].tableName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`
      : 'source_a';
    const rightSource = job.sources[1]
      ? `src_${job.sources[1].tableName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`
      : 'source_b';

    const joinConditions = jn.joinKeys.length > 0
      ? jn.joinKeys.map((k) => `${leftAlias}.${k.leftColumn} = ${rightAlias}.${k.rightColumn}`).join(' AND ')
      : `${leftAlias}.ID = ${rightAlias}.ID`;

    lines.push(`  -- [${jn.joinType} Join Stage: ${jn.stageName}]`);
    lines.push(`  ${joinCte} AS (`);
    lines.push(`    SELECT`);
    lines.push(`      ${leftAlias}.*,`);
    lines.push(`      ${rightAlias}.*`);
    lines.push(`    FROM ${leftSource} ${leftAlias}`);
    lines.push(`    ${jn.joinType} JOIN ${rightSource} ${rightAlias}`);
    lines.push(`      ON ${joinConditions}`);
    lines.push(`  ),`);
    lines.push(``);
  });

  // 4. Transformations CTE
  const transformCte = `transformed_records`;
  const baseTable = job.joins.length > 0
    ? `jn_${job.joins[0].stageName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`
    : job.filters.length > 0
    ? `flt_${job.filters[0].stageName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`
    : job.sources[0]
    ? `src_${job.sources[0].tableName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`
    : 'base_records';

  lines.push(`  -- [Transformer Derivations Stage]`);
  lines.push(`  ${transformCte} AS (`);
  lines.push(`    SELECT`);

  if (job.mappings.length > 0) {
    const colExpressions = job.mappings.map((m) => {
      let expr = m.sqlExpression || m.sourceColumn || 'NULL';
      if (m.status === 'Surrogate') {
        if (dialect === 'Snowflake' || dialect === 'BigQuery' || dialect === 'PostgreSQL') {
          expr = 'ROW_NUMBER() OVER (ORDER BY (SELECT NULL))';
        } else if (dialect === 'Oracle') {
          expr = 'SEQ_SURROGATE.NEXTVAL';
        }
      }
      return `      ${expr} AS ${m.targetColumn}`;
    });
    lines.push(colExpressions.join(',\n'));
  } else if (job.transformations.length > 0) {
    const colExpressions = job.transformations.map((t) => {
      return `      ${t.sqlEquivalent} AS ${t.targetColumn}`;
    });
    lines.push(colExpressions.join(',\n'));
  } else {
    lines.push(`      *`);
  }

  lines.push(`    FROM ${baseTable}`);
  lines.push(`  )`);
  lines.push(``);

  // 5. Final Target Loading (INSERT INTO or MERGE)
  lines.push(`-- ==============================================================================`);
  lines.push(`-- Load Target Table: ${target.tableName} (${target.loadAction})`);
  lines.push(`-- ==============================================================================`);

  const targetCols = job.mappings.length > 0
    ? job.mappings.map((m) => m.targetColumn).join(', ')
    : (target.columns.length > 0 ? target.columns.map((c) => c.name).join(', ') : '*');

  if (target.loadAction === 'Upsert / Merge') {
    lines.push(`MERGE INTO ${target.tableName} AS tgt`);
    lines.push(`USING ${transformCte} AS src`);
    lines.push(`  ON tgt.ID = src.ID -- Update with primary key column`);
    lines.push(`WHEN MATCHED THEN`);
    lines.push(`  UPDATE SET`);
    lines.push(`    tgt.UPDATED_AT = CURRENT_TIMESTAMP()`);
    lines.push(`WHEN NOT MATCHED THEN`);
    lines.push(`  INSERT (${targetCols})`);
    lines.push(`  VALUES (${job.mappings.map((m) => `src.${m.targetColumn}`).join(', ')});`);
  } else if (target.loadAction === 'Truncate & Load') {
    lines.push(`TRUNCATE TABLE ${target.tableName};`);
    lines.push(``);
    lines.push(`INSERT INTO ${target.tableName} (${targetCols})`);
    lines.push(`SELECT ${targetCols}`);
    lines.push(`FROM ${transformCte};`);
  } else {
    lines.push(`INSERT INTO ${target.tableName} (${targetCols})`);
    lines.push(`SELECT ${targetCols}`);
    lines.push(`FROM ${transformCte};`);
  }

  return lines.join('\n');
}

/**
 * Generate DDL Scripts for Source & Target Tables
 */
export function generateDdlScripts(job: DataStageJob, dialect: SqlDialect = 'Snowflake'): string {
  const lines: string[] = [];

  lines.push(`-- ==============================================================================`);
  lines.push(`-- DDL Schema Scripts for DataStage Job: ${job.jobName}`);
  lines.push(`-- Dialect: ${dialect}`);
  lines.push(`-- ==============================================================================`);
  lines.push(``);

  // Source Tables
  lines.push(`-- ------------------------------------------------------------------------------`);
  lines.push(`-- SOURCE TABLES`);
  lines.push(`-- ------------------------------------------------------------------------------`);

  job.sources.forEach((src) => {
    lines.push(`CREATE TABLE IF NOT EXISTS ${src.tableName} (`);
    if (src.columns.length > 0) {
      const colDefs = src.columns.map((c) => {
        const nullable = c.nullable ? '' : ' NOT NULL';
        return `  ${c.name.padEnd(25)} ${c.sqlType}${nullable}`;
      });
      lines.push(colDefs.join(',\n'));
    } else {
      lines.push(`  ID                        INTEGER NOT NULL,`);
      lines.push(`  NAME                      VARCHAR(255)`);
    }
    lines.push(`);`);
    lines.push(``);
  });

  // Target Tables
  lines.push(`-- ------------------------------------------------------------------------------`);
  lines.push(`-- TARGET TABLES`);
  lines.push(`-- ------------------------------------------------------------------------------`);

  job.targets.forEach((tgt) => {
    lines.push(`CREATE TABLE IF NOT EXISTS ${tgt.tableName} (`);
    if (tgt.columns.length > 0) {
      const colDefs = tgt.columns.map((c) => {
        const nullable = c.nullable ? '' : ' NOT NULL';
        return `  ${c.name.padEnd(25)} ${c.sqlType}${nullable}`;
      });
      lines.push(colDefs.join(',\n'));
    } else {
      lines.push(`  ID                        INTEGER NOT NULL,`);
      lines.push(`  NAME                      VARCHAR(255)`);
    }
    lines.push(`);`);
    lines.push(``);
  });

  return lines.join('\n');
}

/**
 * Generate a modern dbt model (.sql)
 */
export function generateDbtModel(job: DataStageJob): string {
  const lines: string[] = [];
  const target = job.targets[0] || { tableName: 'fct_orders' };

  lines.push(`{{ config(`);
  lines.push(`    materialized='table',`);
  lines.push(`    schema='analytics',`);
  lines.push(`    tags=['migrated_from_datastage', '${job.jobName.toLowerCase()}']`);
  lines.push(`) }}`);
  lines.push(``);
  lines.push(`WITH`);

  // Sources via dbt source() or ref()
  job.sources.forEach((src, idx) => {
    const cte = `src_${src.tableName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`;
    lines.push(`  ${cte} AS (`);
    lines.push(`    SELECT * FROM {{ source('${src.databaseType.toLowerCase() || 'raw'}', '${src.tableName.toLowerCase()}') }}`);
    lines.push(`  ),`);
    lines.push(``);
  });

  // Final transformation
  lines.push(`  final AS (`);
  lines.push(`    SELECT`);
  if (job.mappings.length > 0) {
    const exprs = job.mappings.map((m) => `      ${m.sqlExpression || m.sourceColumn} AS ${m.targetColumn}`);
    lines.push(exprs.join(',\n'));
  } else {
    lines.push(`      *`);
  }
  const mainSrc = job.sources[0]
    ? `src_${job.sources[0].tableName.replace(/[^A-Za-z0-9_]/g, '_').toLowerCase()}`
    : 'src_raw';
  lines.push(`    FROM ${mainSrc}`);
  lines.push(`  )`);
  lines.push(``);
  lines.push(`SELECT * FROM final`);

  return lines.join('\n');
}
