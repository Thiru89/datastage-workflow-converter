import React from 'react';
import {
  FileSpreadsheet,
  FileCode2,
  Sparkles,
  UploadCloud,
  Layers,
  Database,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { DataStageJob, SqlDialect } from '../types';
import { SAMPLE_DATASTAGE_JOBS, SampleJobEntry } from '../data/sampleJobs';

interface NavbarProps {
  currentJob: DataStageJob;
  onLoadSample: (sample: SampleJobEntry) => void;
  onOpenUpload: () => void;
  onExportExcel: () => void;
  onExportSql: () => void;
  onOpenAi: () => void;
  onOpenExcelPreview: () => void;
  selectedDialect: SqlDialect;
  onDialectChange: (dialect: SqlDialect) => void;
  hasAiInsights: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentJob,
  onLoadSample,
  onOpenUpload,
  onExportExcel,
  onExportSql,
  onOpenAi,
  onOpenExcelPreview,
  selectedDialect,
  onDialectChange,
  hasAiInsights,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/50 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Active Job Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-950/40">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white tracking-tight text-base sm:text-lg truncate">
                  FlowMapper <span className="text-slate-500 font-normal">DSX</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {currentJob.rawFormat}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                Job: <strong className="text-slate-200 font-medium">{currentJob.jobName}</strong> • {currentJob.stats.totalStages} stages • {currentJob.stats.columnCount} columns mapped
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sample Selector Dropdown */}
            <div className="relative">
              <button
                id="btn-sample-dropdown"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                title="Load a pre-configured sample DataStage workflow"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Samples</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Preloaded DataStage Workflows
                  </div>
                  {SAMPLE_DATASTAGE_JOBS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onLoadSample(sample);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/70 transition-colors flex flex-col gap-0.5 border-b border-slate-800/50 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{sample.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                          {sample.format}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">{sample.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload File / Scan Button */}
            <button
              id="btn-upload-scanner"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Scan Workflow</span>
            </button>

            {/* AI Assistant */}
            <button
              id="btn-ai-assistant"
              onClick={onOpenAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Analysis</span>
              {hasAiInsights && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              id="btn-export-excel"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/30"
              title="Download structured multi-sheet Excel documentation"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            {/* Export SQL */}
            <button
              id="btn-export-sql"
              onClick={onExportSql}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
              title="Download SQL pipeline migration script"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-200" />
              <span>SQL Script</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
