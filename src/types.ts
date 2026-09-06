export type SqlDialect = 'Snowflake' | 'PostgreSQL' | 'BigQuery' | 'Oracle' | 'Databricks';

export type StageCategory = 
  | 'source' 
  | 'target' 
  | 'transformer' 
  | 'join' 
  | 'lookup' 
  | 'filter' 
  | 'aggregator' 
  | 'sort' 
  | 'other';

export interface ColumnDefinition {
  name: string;
  sqlType: string;
  length?: number | string;
  precision?: number | string;
  scale?: number | string;
  nullable: boolean;
  derivation?: string;
  sourceColumn?: string;
  sourceTable?: string;
  description?: string;
}

export interface StageLink {
  id: string;
  name: string;
  sourceStageId: string;
  sourceStageName: string;
  targetStageId: string;
  targetStageName: string;
  linkType?: 'primary' | 'lookup' | 'reject' | 'reference';
  recordCount?: number;
  columns?: ColumnDefinition[];
}

export interface StageNode {
  id: string;
  name: string;
  stageType: string; // e.g. PxSequentialFile, PxTransformer, PxJoin, PxLookup, PxFilter
  category: StageCategory;
  properties: Record<string, any>;
  inputLinks: string[];
  outputLinks: string[];
  columns: ColumnDefinition[];
  x?: number;
  y?: number;
}

export interface SourceTableInfo {
  stageName: string;
  stageType: string;
  tableName: string;
  schema?: string;
  databaseType: string; // Oracle, DB2, Sequential File, Teradata, ODBC, Snowflake, DataSet
  sourceType: 'Database Table' | 'Flat File' | 'Data Set' | 'SQL Query / View';
  query?: string;
  filePath?: string;
  columns: ColumnDefinition[];
  outputLink: string;
}

export interface TargetTableInfo {
  stageName: string;
  stageType: string;
  tableName: string;
  schema?: string;
  databaseType: string;
  targetType: 'Database Table' | 'Flat File' | 'Data Set';
  loadAction: 'Insert' | 'Update' | 'Upsert / Merge' | 'Append' | 'Truncate & Load';
  filePath?: string;
  columns: ColumnDefinition[];
  inputLink: string;
}

export interface TransformationInfo {
  id: string;
  stageName: string;
  outputLink: string;
  targetColumn: string;
  targetDataType: string;
  derivation: string;
  sourceColumns: string[];
  category: 
    | 'Direct Pass-Through' 
    | 'String Manipulation' 
    | 'Date/Time Calculation' 
    | 'Mathematical' 
    | 'Conditional / CASE' 
    | 'Lookup / Reference' 
    | 'Data Quality / Cleansing' 
    | 'Surrogate Key'
    | 'Type Conversion';
  sqlEquivalent: string;
  businessRule?: string;
}

export interface JoinKey {
  leftColumn: string;
  rightColumn: string;
  operator: string;
}

export interface JoinInfo {
  id: string;
  stageName: string;
  stageType: 'PxJoin' | 'PxLookup' | string;
  joinType: 'INNER' | 'LEFT OUTER' | 'RIGHT OUTER' | 'FULL OUTER';
  leftLink: string;
  leftStage: string;
  rightLink: string;
  rightStage: string;
  joinKeys: JoinKey[];
  conditionText: string;
  sqlJoinClause: string;
}

export interface FilterInfo {
  id: string;
  stageName: string;
  inputLink: string;
  outputLink: string;
  rejectLink?: string;
  filterCondition: string;
  sqlWhereClause: string;
  description?: string;
}

export interface SourceTargetMapping {
  id: string;
  targetTable: string;
  targetColumn: string;
  targetDataType: string;
  targetNullable: boolean;
  sourceTable: string;
  sourceColumn: string;
  sourceDataType: string;
  transformation: string;
  sqlExpression: string;
  ruleType: string;
  status: 'Mapped' | 'Derived' | 'Constant' | 'Surrogate' | 'Lookup';
  notes?: string;
}

export interface StageVariable {
  name: string;
  stageName: string;
  expression: string;
  sqlType?: string;
  description?: string;
}

export interface JobParameter {
  name: string;
  prompt?: string;
  defaultValue?: string;
  type?: string;
}

export interface DataStageJob {
  jobName: string;
  category: string;
  description: string;
  rawFormat: 'DSX' | 'XML' | 'JSON' | 'UNKNOWN';
  fileName: string;
  rawContent?: string;
  stages: StageNode[];
  links: StageLink[];
  sources: SourceTableInfo[];
  targets: TargetTableInfo[];
  transformations: TransformationInfo[];
  joins: JoinInfo[];
  filters: FilterInfo[];
  mappings: SourceTargetMapping[];
  stageVariables: StageVariable[];
  parameters: JobParameter[];
  scanTimestamp: string;
  stats: {
    totalStages: number;
    sourceCount: number;
    targetCount: number;
    transformCount: number;
    joinCount: number;
    filterCount: number;
    columnCount: number;
  };
}

export interface AiAnalysisResult {
  businessPurpose: string;
  transformationInsights: string[];
  modernizationStrategy: string;
  potentialMigrationRisks: string[];
  recommendedSqlOptimizations: string[];
}
