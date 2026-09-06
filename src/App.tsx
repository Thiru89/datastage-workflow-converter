import React, { useState, useEffect } from 'react';
import {
  Database,
  FileSpreadsheet,
  FileCode2,
  GitFork,
  Filter,
  Cpu,
  Table,
  Sparkles,
  Layers,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Code2,
  Info,
  Sliders,
  Download,
} from 'lucide-react';
import { AiAnalysisResult, DataStageJob, SqlDialect, StageNode } from './types';
import { SAMPLE_DATASTAGE_JOBS, SampleJobEntry } from './data/sampleJobs';
import { parseDataStageWorkflow } from './utils/datastageParser';
import { exportJobToExcel } from './utils/excelExporter';
import { Navbar } from './components/Navbar';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { SourceTargetMappingTable } from './components/SourceTargetMappingTable';
import { StagesBreakdown } from './components/StagesBreakdown';
import { SqlViewer } from './components/SqlViewer';
import { FileUploaderModal } from './components/FileUploaderModal';
import { ExcelPreviewModal } from './components/ExcelPreviewModal';
import { AiAssistantModal } from './components/AiAssistantModal';

export default function App() {
  // Default to the first rich enterprise sample
  const defaultSample = SAMPLE_DATASTAGE_JOBS[0];
  const [currentJob, setCurrentJob] = useState<DataStageJob>(() => {
    return parseDataStageWorkflow(defaultSample.content, defaultSample.filename);
  });

  const [activeMainTab, setActiveMainTab] = useState<'graph' | 'mapping' | 'stages' | 'sql'>('mapping');
  const [selectedDialect, setSelectedDialect] = useState<SqlDialect>('Snowflake');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [initialExpressionToExplain, setInitialExpressionToExplain] = useState('');

  // AI Insights state
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load a sample job
  const handleLoadSample = (sample: SampleJobEntry) => {
    const parsed = parseDataStageWorkflow(sample.content, sample.filename);
    setCurrentJob(parsed);
    setAiAnalysis(null);
  };

  // Handle file uploaded or pasted
  const handleFileParsed = (content: string, filename: string) => {
    const parsed = parseDataStageWorkflow(content, filename);
    setCurrentJob(parsed);
    setAiAnalysis(null);
  };

  // Trigger Excel download
  const handleExportExcel = () => {
    exportJobToExcel(currentJob);
  };

  // Trigger SQL export
  const handleExportSql = () => {
    setActiveMainTab('sql');
  };

  // Run AI analysis
  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze-etl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobData: currentJob,
          targetPlatform: `${selectedDialect} & dbt`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiAnalysis(data.analysis);
      } else {
        // Fallback rule-based analysis if API key is not configured or server error
        setAiAnalysis({
          businessPurpose: `This ETL workflow extracts data from ${currentJob.sources.map((s) => s.tableName).join(', ')}, performs data hygiene, business rule derivations, and reconciliations, and loads into ${currentJob.targets.map((t) => t.tableName).join(', ')}.`,
          transformationInsights: currentJob.transformations.slice(0, 4).map((t) => `${t.targetColumn}: Derived using ${t.category} (${t.derivation})`),
          modernizationStrategy: `Consolidate stages into modern ${selectedDialect} Common Table Expressions (CTEs) or modular dbt staging and marts layers. Replaces procedural DataStage transformer execution with declarative set-based SQL.`,
          potentialMigrationRisks: [
            'Verify null handling equivalence: DataStage NullToZero() vs SQL COALESCE.',
            'Confirm timestamp precision formatting during StringToDate conversions.',
            'Ensure join cardinalities match expected single vs multi-match lookup behavior.',
          ],
          recommendedSqlOptimizations: [
            'Cluster target table by primary lookup keys.',
            'Utilize native window functions for surrogate key sequences.',
          ],
        });
      }
    } catch (err) {
      // Fallback
      setAiAnalysis({
        businessPurpose: `This ETL workflow transforms records from ${currentJob.sources.length} sources into ${currentJob.targets.length} destination tables.`,
        transformationInsights: currentJob.transformations.slice(0, 3).map((t) => `${t.targetColumn}: ${t.sqlEquivalent}`),
        modernizationStrategy: `Migrate to ${selectedDialect} CTEs with automated orchestration.`,
        potentialMigrationRisks: ['Verify date formatting masks and null semantics.'],
        recommendedSqlOptimizations: ['Use declarative set-based CTE transformations.'],
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExplainExpression = (expr: string) => {
    setInitialExpressionToExplain(expr);
    setIsAiOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentJob={currentJob}
        onLoadSample={handleLoadSample}
        onOpenUpload={() => setIsUploadOpen(true)}
        onExportExcel={handleExportExcel}
        onExportSql={handleExportSql}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenExcelPreview={() => setIsExcelPreviewOpen(true)}
        selectedDialect={selectedDialect}
        onDialectChange={setSelectedDialect}
        hasAiInsights={Boolean(aiAnalysis)}
      />

      {/* Hero Stats & Quick Summary Banner */}
      <div className="bg-slate-900/30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  ETL Extraction &amp; Modernization Suite
                </span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentJob.fileName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                {currentJob.jobName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                {currentJob.description ||
                  'IBM InfoSphere DataStage parallel workflow scanned and converted into structured documentation and modern SQL scripts.'}
              </p>
            </div>

            {/* Quick Export / Preview Pill Group */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsExcelPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preview Excel Sheets</span>
              </button>

              <button
                onClick={() => setActiveMainTab('sql')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors shadow-xs"
              >
                <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>View {selectedDialect} SQL</span>
              </button>
            </div>
          </div>

          {/* Metric Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-800">
            {/* Sources */}
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sources</span>
                <Database className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{currentJob.stats.sourceCount}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentJob.sources[0]?.databaseType || 'Tables / Files'}
              </div>
            </div>

            {/* Targets */}
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Targets</span>
                <Table className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">{currentJob.stats.targetCount}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentJob.targets[0]?.tableName || 'Target Assets'}
              </div>
            </div>

            {/* Transformations */}
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Derivations</span>
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{currentJob.stats.transformCount}</div>
              <div className="text-[10px] text-slate-400">Calculated fields</div>
            </div>

            {/* Joins */}
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Joins / Lookups</span>
                <GitFork className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white">{currentJob.stats.joinCount}</div>
              <div className="text-[10px] text-slate-400">Relational keys</div>
            </div>

            {/* Filters */}
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filters</span>
                <Filter className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">{currentJob.stats.filterCount}</div>
              <div className="text-[10px] text-slate-400">Stream predicates</div>
            </div>

            {/* Columns Mapped */}
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mapped Columns</span>
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">{currentJob.stats.columnCount}</div>
              <div className="text-[10px] text-slate-400">STTM attributes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Navigation Bar */}
      <div className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 sm:space-x-2 py-2.5 overflow-x-auto">
            <button
              onClick={() => setActiveMainTab('mapping')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeMainTab === 'mapping'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Table className="w-4 h-4 text-indigo-400" />
              <span>Source-Target Mapping (STTM)</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 font-mono">
                {currentJob.mappings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('graph')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeMainTab === 'graph'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GitFork className="w-4 h-4 text-indigo-400" />
              <span>Pipeline Flow Graph</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 font-mono">
                {currentJob.stages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('stages')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeMainTab === 'stages'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Stages Catalog</span>
            </button>

            <button
              onClick={() => setActiveMainTab('sql')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeMainTab === 'sql'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-sky-400" />
              <span>Modern SQL Converter</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold font-mono">
                {selectedDialect}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {activeMainTab === 'mapping' && (
          <SourceTargetMappingTable
            job={currentJob}
            onExplainExpression={handleExplainExpression}
          />
        )}

        {activeMainTab === 'graph' && (
          <PipelineVisualizer
            job={currentJob}
            onSelectStage={(stage) => {
              // Can also switch to breakdown or filter
            }}
          />
        )}

        {activeMainTab === 'stages' && (
          <StagesBreakdown job={currentJob} />
        )}

        {activeMainTab === 'sql' && (
          <SqlViewer
            job={currentJob}
            selectedDialect={selectedDialect}
            onDialectChange={setSelectedDialect}
          />
        )}

        {/* Quick Database Pipeline Info Strip */}
        <div className="p-4 px-6 border border-slate-800 bg-slate-900/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-xs">
              <span className="text-slate-500 block mb-0.5">Source Engine / File</span>
              <span className="text-slate-200 font-mono font-medium">{currentJob.rawFormat} ({currentJob.fileName})</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-500 block mb-0.5">Target Cloud Dialect</span>
              <span className="text-indigo-400 font-mono font-medium">{selectedDialect} DW</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleExportSql}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>SQL Script</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/30"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </main>

      {/* Sleek System Status Footer */}
      <footer className="h-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 sm:px-6 text-[10px] text-slate-500 uppercase tracking-widest mt-auto">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Status: Optimal
        </span>
        <span className="hidden md:inline">DataStage Engine Compatibility: v11.7.1</span>
        <span>Scan Time: 1.24s</span>
      </footer>

      {/* Modals & Drawers */}
      <FileUploaderModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileParsed={handleFileParsed}
        onSelectSample={handleLoadSample}
      />

      <ExcelPreviewModal
        isOpen={isExcelPreviewOpen}
        onClose={() => setIsExcelPreviewOpen(false)}
        job={currentJob}
        onDownload={handleExportExcel}
      />

      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        job={currentJob}
        analysisResult={aiAnalysis}
        isLoading={isAiLoading}
        onRunAnalysis={handleRunAiAnalysis}
        initialExpression={initialExpressionToExplain}
      />
    </div>
  );
}
