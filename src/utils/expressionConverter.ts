import { SqlDialect } from '../types';

/**
 * Translates DataStage Transformer derivation expressions and functions
 * into standard SQL according to target dialect.
 */
export function convertDataStageExpression(
  expr: string,
  dialect: SqlDialect = 'Snowflake'
): { sql: string; category: string; businessRule: string } {
  if (!expr || expr.trim() === '') {
    return {
      sql: 'NULL',
      category: 'Direct Pass-Through',
      businessRule: 'No derivation specified',
    };
  }

  const raw = expr.trim();

  // Check if direct column reference like "Lnk_In.COLUMN_NAME" or "COLUMN_NAME"
  const directMatch = raw.match(/^(?:[A-Za-z0-9_]+\.)?([A-Za-z0-9_]+)$/);
  if (directMatch && !raw.includes('(') && !raw.includes('?')) {
    const col = directMatch[1];
    return {
      sql: col,
      category: 'Direct Pass-Through',
      businessRule: `Direct mapping from ${raw}`,
    };
  }

  // Check if Surrogate Key
  if (raw.toLowerCase().includes('nextsurrogatekey') || raw.toLowerCase().includes('surrogatekey')) {
    let sqlVal = 'ROW_NUMBER() OVER ()';
    if (dialect === 'Snowflake' || dialect === 'PostgreSQL' || dialect === 'BigQuery' || dialect === 'Databricks') {
      sqlVal = 'ROW_NUMBER() OVER (ORDER BY (SELECT NULL))';
    } else if (dialect === 'Oracle') {
      sqlVal = 'SEQ_SURROGATE_KEY.NEXTVAL';
    }
    return {
      sql: sqlVal,
      category: 'Surrogate Key',
      businessRule: 'Auto-generated surrogate primary key sequence',
    };
  }

  let converted = raw;

  // Clean DataStage Link prefixes e.g. "Lnk_In.COL" or "in_link.COL" -> "COL" for standard CTE references
  // We keep the column name or qualify with table alias
  converted = converted.replace(/\b[A-Za-z0-9_]+_?(?:lnk|link|in|out|dslink)\.([A-Za-z0-9_]+)\b/gi, '$1');

  // If...Then...Else conversion
  // Matches: If <cond> Then <val1> Else <val2>
  const ifElseRegex = /\bIf\s+(.+?)\s+Then\s+(.+?)\s+Else\s+(.+?)(?=\s+END|\s*$)/gi;
  if (ifElseRegex.test(converted)) {
    converted = converted.replace(
      /\bIf\s+(.+?)\s+Then\s+(.+?)\s+Else\s+(.+?)(?=\s+END|\s*$)/gi,
      (_match, cond, val1, val2) => `CASE WHEN ${cond.trim()} THEN ${val1.trim()} ELSE ${val2.trim()} END`
    );
  }

  // Ternary: <cond> ? <val1> : <val2> (when not string concat colon)
  const ternaryRegex = /([^:]+?)\s*\?\s*([^:]+?)\s*:\s*([^:]+?)$/;
  if (raw.includes('?') && ternaryRegex.test(raw)) {
    converted = converted.replace(
      ternaryRegex,
      (_m, cond, v1, v2) => `CASE WHEN ${cond.trim()} THEN ${v1.trim()} ELSE ${v2.trim()} END`
    );
  }

  // DataStage String Concatenation: 'A' : ' ' : 'B' or var1 : var2
  // Replace ':' surrounded by whitespace or strings when not part of time or CASE
  if (!converted.includes('CASE') && converted.includes(':')) {
    const parts = converted.split(/\s*:\s*/);
    if (parts.length > 1) {
      if (dialect === 'PostgreSQL' || dialect === 'Snowflake' || dialect === 'Oracle') {
        converted = parts.join(' || ');
      } else {
        converted = `CONCAT(${parts.join(', ')})`;
      }
    }
  }

  // Common DataStage Built-In Functions
  // 1. Trim / Strip
  converted = converted.replace(/\bTrim\s*\(\s*(.+?)\s*\)/gi, 'TRIM($1)');
  converted = converted.replace(/\bTrimB\s*\(\s*(.+?)\s*\)/gi, 'TRIM($1)');
  converted = converted.replace(/\bTrimF\s*\(\s*(.+?)\s*\)/gi, 'LTRIM($1)');

  // 2. UpCase / DownCase
  converted = converted.replace(/\bUpCase\s*\(\s*(.+?)\s*\)/gi, 'UPPER($1)');
  converted = converted.replace(/\bDownCase\s*\(\s*(.+?)\s*\)/gi, 'LOWER($1)');

  // 3. Null handling
  converted = converted.replace(/\bNullToZero\s*\(\s*(.+?)\s*\)/gi, 'COALESCE($1, 0)');
  converted = converted.replace(/\bNullToEmpty\s*\(\s*(.+?)\s*\)/gi, "COALESCE($1, '')");
  converted = converted.replace(/\bNullToValue\s*\(\s*(.+?)\s*,\s*(.+?)\s*\)/gi, 'COALESCE($1, $2)');
  converted = converted.replace(/\bIsNull\s*\(\s*(.+?)\s*\)/gi, '$1 IS NULL');
  converted = converted.replace(/\bIsNotNull\s*\(\s*(.+?)\s*\)/gi, '$1 IS NOT NULL');

  // 4. Dates
  if (dialect === 'Snowflake') {
    converted = converted.replace(/\bStringToDate\s*\(\s*(.+?)\s*,\s*(['"].*?['"])\s*\)/gi, 'TO_DATE($1, $2)');
    converted = converted.replace(/\bCurrentTimestamp\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP()');
    converted = converted.replace(/\bCurrentDate\s*\(\s*\)/gi, 'CURRENT_DATE()');
  } else if (dialect === 'PostgreSQL') {
    converted = converted.replace(/\bStringToDate\s*\(\s*(.+?)\s*,\s*(['"].*?['"])\s*\)/gi, 'TO_DATE($1, $2)');
    converted = converted.replace(/\bCurrentTimestamp\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
    converted = converted.replace(/\bCurrentDate\s*\(\s*\)/gi, 'CURRENT_DATE');
  } else if (dialect === 'BigQuery') {
    converted = converted.replace(/\bStringToDate\s*\(\s*(.+?)\s*,\s*(['"].*?['"])\s*\)/gi, 'PARSE_DATE($2, $1)');
    converted = converted.replace(/\bCurrentTimestamp\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP()');
    converted = converted.replace(/\bCurrentDate\s*\(\s*\)/gi, 'CURRENT_DATE()');
  } else if (dialect === 'Oracle') {
    converted = converted.replace(/\bStringToDate\s*\(\s*(.+?)\s*,\s*(['"].*?['"])\s*\)/gi, 'TO_DATE($1, $2)');
    converted = converted.replace(/\bCurrentTimestamp\s*\(\s*\)/gi, 'SYSTIMESTAMP');
    converted = converted.replace(/\bCurrentDate\s*\(\s*\)/gi, 'TRUNC(SYSDATE)');
  }

  // 5. Substring
  converted = converted.replace(/\bSubstrings?\s*\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)/gi, 'SUBSTRING($1, $2, $3)');

  // Determine category & business rule
  let category = 'String Manipulation';
  let businessRule = `Calculated expression: ${raw}`;

  if (raw.toUpperCase().includes('CASE') || raw.toUpperCase().includes('IF') || raw.includes('?')) {
    category = 'Conditional / CASE';
    businessRule = 'Conditional business rule mapping based on status or flags';
  } else if (raw.toLowerCase().includes('date') || raw.toLowerCase().includes('timestamp') || raw.toLowerCase().includes('year')) {
    category = 'Date/Time Calculation';
    businessRule = 'Date conversion and temporal formatting';
  } else if (raw.includes('+') || raw.includes('*') || raw.includes('/') || raw.toLowerCase().includes('sum') || raw.toLowerCase().includes('round')) {
    category = 'Mathematical';
    businessRule = 'Financial / quantitative arithmetic calculation';
  } else if (raw.toLowerCase().includes('null') || raw.toLowerCase().includes('coalesce')) {
    category = 'Data Quality / Cleansing';
    businessRule = 'Null handling and default value imputation';
  } else if (raw.toLowerCase().includes('trim') || raw.toLowerCase().includes('concat') || raw.includes(':') || raw.toLowerCase().includes('upper')) {
    category = 'String Manipulation';
    businessRule = 'String cleansing, trimming, and concatenation';
  }

  return {
    sql: converted,
    category,
    businessRule,
  };
}

/**
 * Map DataStage SQL datatypes (numbers or strings) to clean standard SQL datatypes
 */
export function normalizeSqlDataType(type: string | number | undefined, length?: any, precision?: any, scale?: any): string {
  if (type === undefined || type === null || type === '') {
    return 'VARCHAR(255)';
  }

  const str = String(type).trim().toUpperCase();

  // Handle DataStage numeric type codes:
  // 1: CHAR, 12: VARCHAR, 4: INTEGER, 5: SMALLINT, 3: DECIMAL/NUMERIC, 8: DOUBLE, 9: DATE, 10: TIME, 11: TIMESTAMP
  switch (str) {
    case '1':
      return length ? `CHAR(${length})` : 'CHAR(1)';
    case '12':
    case 'VARCHAR':
    case 'STRING':
    case 'TEXT':
      return length ? `VARCHAR(${length})` : 'VARCHAR(255)';
    case '4':
    case 'INTEGER':
    case 'INT':
      return 'INTEGER';
    case '5':
    case 'SMALLINT':
      return 'SMALLINT';
    case '3':
    case 'DECIMAL':
    case 'NUMERIC':
      if (precision && scale) return `DECIMAL(${precision},${scale})`;
      if (precision) return `DECIMAL(${precision},2)`;
      return 'DECIMAL(18,2)';
    case '8':
    case 'DOUBLE':
    case 'FLOAT':
      return 'FLOAT';
    case '9':
    case 'DATE':
      return 'DATE';
    case '11':
    case 'TIMESTAMP':
      return 'TIMESTAMP';
    case '-5':
    case 'BIGINT':
      return 'BIGINT';
    default:
      if (str.startsWith('VAR') || str.startsWith('CHAR')) {
        return length ? `${str}(${length})` : str;
      }
      return str;
  }
}
