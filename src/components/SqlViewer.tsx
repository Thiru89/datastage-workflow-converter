import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  Layers,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { DataStageJob, SqlDialect } from '../types';
import { generateSqlPipeline, generateDdlScripts, generateDbtModel } from '../utils/sqlGenerator';

interface SqlViewerProps {
  job: DataStageJob;
  selectedDialect: SqlDialect;
  onDialectChange: (dialect: SqlDialect) => void;
}

export const SqlViewer: React.FC<SqlViewerProps> = ({
  job,
  selectedDialect,
  onDialectChange,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'ddl' | 'dbt'>('pipeline');
  const [copied, setCopied] = useState(false);

  const dialects: SqlDialect[] = ['Snowflake', 'PostgreSQL', 'BigQuery', 'Oracle', 'Databricks'];

  const sqlContent = useMemo(() => {
    switch (activeTab) {
      case 'pipeline':
        return generateSqlPipeline(job, selectedDialect);
      case 'ddl':
        return generateDdlScripts(job, selectedDialect);
      case 'dbt':
        return generateDbtModel(job);
      default:
        return '';
    }
  }, [job, selectedDialect, activeTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const safeName = (job.jobName || 'datastage_pipeline').replace(/[^A-Za-z0-9_]/g, '_');
    const filename = `${safeName}_${activeTab}_${selectedDialect.toLowerCase()}.sql`;
    const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800 shadow-inner overflow-hidden flex flex-col">
      {/* SQL Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Generated Modern SQL Scripts
            </h3>
            <p className="text-xs text-slate-400">
              Replaces DataStage stages with standard ANSI / Cloud SQL Common Table Expressions
            </p>
          </div>
        </div>

        {/* Dialect Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <span className="font-semibold">Target Dialect:</span>
            <select
              value={selectedDialect}
              onChange={(e) => onDialectChange(e.target.value as SqlDialect)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              {dialects.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors shadow-xs"
            title="Copy SQL code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-950/30"
            title="Download as .sql file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .sql</span>
          </button>
        </div>
      </div>

      {/* Script Sub-tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'pipeline'
              ? 'border-indigo-500 text-white bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
          Full CTE Pipeline
        </button>

        <button
          onClick={() => setActiveTab('ddl')}
          className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ddl'
              ? 'border-indigo-500 text-white bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          DDL Schema (Source &amp; Target)
        </button>

        <button
          onClick={() => setActiveTab('dbt')}
          className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'dbt'
              ? 'border-indigo-500 text-white bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          dbt Model (.sql)
        </button>
      </div>

      {/* Code Display */}
      <div className="relative bg-slate-950 p-4 sm:p-6 overflow-x-auto border-t border-slate-800/80">
        <pre className="font-mono text-xs text-slate-300 leading-relaxed">
          <code>{sqlContent}</code>
        </pre>
      </div>
    </div>
  );
};
