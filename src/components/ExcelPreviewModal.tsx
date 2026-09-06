import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  Layers,
  Table,
  Cpu,
  GitFork,
  CheckCircle2,
} from 'lucide-react';
import { DataStageJob } from '../types';

interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: DataStageJob;
  onDownload: () => void;
}

export const ExcelPreviewModal: React.FC<ExcelPreviewModalProps> = ({
  isOpen,
  onClose,
  job,
  onDownload,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<
    'summary' | 'mapping' | 'tables' | 'transformations' | 'joins_filters'
  >('mapping');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                Excel Workbook Documentation Preview
              </h3>
              <p className="text-xs text-slate-400">
                Multi-sheet workbook generated for: <strong className="text-slate-200 font-mono">{job.jobName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sheet Tabs Bar (Simulating Excel Sheet Tabs) */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 overflow-x-auto gap-1">
          <button
            onClick={() => setSelectedSheet('summary')}
            className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              selectedSheet === 'summary'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            1. Job_Summary
          </button>

          <button
            onClick={() => setSelectedSheet('mapping')}
            className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              selectedSheet === 'mapping'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Table className="w-3 h-3 text-emerald-400" />
            2. Source_Target_Mapping
          </button>

          <button
            onClick={() => setSelectedSheet('tables')}
            className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              selectedSheet === 'tables'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Table className="w-3 h-3 text-emerald-400" />
            3. Tables_and_Columns
          </button>

          <button
            onClick={() => setSelectedSheet('transformations')}
            className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              selectedSheet === 'transformations'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3 h-3 text-emerald-400" />
            4. Transformations_Catalog
          </button>

          <button
            onClick={() => setSelectedSheet('joins_filters')}
            className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              selectedSheet === 'joins_filters'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow-xs'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3 h-3 text-emerald-400" />
            5. Joins_and_Filters
          </button>
        </div>

        {/* Sheet Content View */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950">
          {selectedSheet === 'summary' && (
            <div className="max-w-2xl mx-auto border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <div className="bg-slate-900 border-b border-slate-800 text-emerald-400 font-semibold text-xs p-3">
                Job Documentation Overview
              </div>
              <table className="w-full text-xs text-left">
                <tbody>
                  {[
                    ['DataStage Job Name', job.jobName],
                    ['Category / Folder', job.category],
                    ['Description', job.description],
                    ['Specification Format', job.rawFormat],
                    ['Scan Date', new Date(job.scanTimestamp).toLocaleString()],
                    ['Total Stages Extracted', job.stats.totalStages],
                    ['Source Entities', job.stats.sourceCount],
                    ['Target Entities', job.stats.targetCount],
                    ['Transformations', job.stats.transformCount],
                    ['Joins & Lookups', job.stats.joinCount],
                    ['Filter Conditions', job.stats.filterCount],
                    ['Total Mapped Columns', job.stats.columnCount],
                  ].map(([k, v], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/50'}>
                      <td className="p-2.5 font-medium text-slate-400 w-1/3 border-b border-slate-800/80">
                        {k}
                      </td>
                      <td className="p-2.5 text-slate-200 border-b border-slate-800/80 font-mono">
                        {String(v)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSheet === 'mapping' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-semibold border-b border-slate-800">
                    <th className="p-2.5">Map ID</th>
                    <th className="p-2.5">Target Table</th>
                    <th className="p-2.5">Target Column</th>
                    <th className="p-2.5">Data Type</th>
                    <th className="p-2.5">Source Table</th>
                    <th className="p-2.5">Source Column</th>
                    <th className="p-2.5">Transformation / Derivation</th>
                    <th className="p-2.5">Converted SQL</th>
                    <th className="p-2.5">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {job.mappings.map((m, idx) => (
                    <tr key={m.id} className={idx % 2 === 0 ? 'bg-slate-950 hover:bg-slate-900/40' : 'bg-slate-900/30 hover:bg-slate-900/50'}>
                      <td className="p-2.5 font-mono text-slate-500">M_{idx + 1}</td>
                      <td className="p-2.5 font-mono font-medium text-slate-300">{m.targetTable}</td>
                      <td className="p-2.5 font-mono font-semibold text-white">{m.targetColumn}</td>
                      <td className="p-2.5 font-mono text-slate-400">{m.targetDataType}</td>
                      <td className="p-2.5 font-mono text-slate-400">{m.sourceTable}</td>
                      <td className="p-2.5 font-mono text-slate-300">{m.sourceColumn}</td>
                      <td className="p-2.5 font-mono text-amber-400 max-w-[200px] truncate">
                        {m.transformation}
                      </td>
                      <td className="p-2.5 font-mono text-indigo-400 max-w-[200px] truncate font-medium">
                        {m.sqlExpression}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px] font-medium">
                          {m.ruleType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSheet === 'tables' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-semibold border-b border-slate-800">
                    <th className="p-2.5">Stage Name</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Physical Name</th>
                    <th className="p-2.5">Database / Format</th>
                    <th className="p-2.5">Column Name</th>
                    <th className="p-2.5">SQL Type</th>
                    <th className="p-2.5">Nullable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {job.sources.map((s) =>
                    s.columns.map((c, i) => (
                      <tr key={`src_${s.tableName}_${c.name}_${i}`} className="bg-slate-950 hover:bg-slate-900/40">
                        <td className="p-2.5 font-mono text-slate-400">{s.stageName}</td>
                        <td className="p-2.5 font-semibold text-emerald-400">SOURCE</td>
                        <td className="p-2.5 font-mono text-slate-200">{s.tableName}</td>
                        <td className="p-2.5 text-slate-400">{s.databaseType}</td>
                        <td className="p-2.5 font-mono font-semibold text-white">{c.name}</td>
                        <td className="p-2.5 font-mono text-slate-400">{c.sqlType}</td>
                        <td className="p-2.5 text-slate-500">{c.nullable ? 'YES' : 'NO'}</td>
                      </tr>
                    ))
                  )}
                  {job.targets.map((t) =>
                    t.columns.map((c, i) => (
                      <tr key={`tgt_${t.tableName}_${c.name}_${i}`} className="bg-slate-900/30 hover:bg-slate-900/50">
                        <td className="p-2.5 font-mono text-slate-400">{t.stageName}</td>
                        <td className="p-2.5 font-semibold text-indigo-400">TARGET</td>
                        <td className="p-2.5 font-mono text-slate-200">{t.tableName}</td>
                        <td className="p-2.5 text-slate-400">{t.databaseType}</td>
                        <td className="p-2.5 font-mono font-semibold text-white">{c.name}</td>
                        <td className="p-2.5 font-mono text-slate-400">{c.sqlType}</td>
                        <td className="p-2.5 text-slate-500">{c.nullable ? 'YES' : 'NO'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedSheet === 'transformations' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-semibold border-b border-slate-800">
                    <th className="p-2.5">Transformer Stage</th>
                    <th className="p-2.5">Target Column</th>
                    <th className="p-2.5">Data Type</th>
                    <th className="p-2.5">DataStage Derivation</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Modern SQL Expression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {job.transformations.map((trn, i) => (
                    <tr key={trn.id} className={i % 2 === 0 ? 'bg-slate-950 hover:bg-slate-900/40' : 'bg-slate-900/30 hover:bg-slate-900/50'}>
                      <td className="p-2.5 font-mono text-slate-400">{trn.stageName}</td>
                      <td className="p-2.5 font-mono font-semibold text-white">{trn.targetColumn}</td>
                      <td className="p-2.5 font-mono text-slate-400">{trn.targetDataType}</td>
                      <td className="p-2.5 font-mono text-amber-400">{trn.derivation}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium text-[11px]">
                          {trn.category}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-indigo-300 font-semibold">{trn.sqlEquivalent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSheet === 'joins_filters' && (
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-slate-300 text-xs uppercase mb-2">Joins &amp; Lookups</h5>
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-semibold border-b border-slate-800">
                        <th className="p-2.5">Stage</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Left Stream</th>
                        <th className="p-2.5">Right Stream</th>
                        <th className="p-2.5">Condition</th>
                        <th className="p-2.5">Generated SQL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {job.joins.map((j) => (
                        <tr key={j.id} className="bg-slate-950 hover:bg-slate-900/40">
                          <td className="p-2.5 font-mono font-medium text-slate-200">{j.stageName}</td>
                          <td className="p-2.5 font-semibold text-indigo-400">{j.joinType}</td>
                          <td className="p-2.5 font-mono text-slate-400">{j.leftLink}</td>
                          <td className="p-2.5 font-mono text-slate-400">{j.rightLink}</td>
                          <td className="p-2.5 font-mono text-amber-400">{j.conditionText}</td>
                          <td className="p-2.5 font-mono text-indigo-300">{j.sqlJoinClause}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-slate-300 text-xs uppercase mb-2">Filters &amp; Predicates</h5>
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-semibold border-b border-slate-800">
                        <th className="p-2.5">Stage</th>
                        <th className="p-2.5">Incoming Link</th>
                        <th className="p-2.5">Outgoing Link</th>
                        <th className="p-2.5">Filter Predicate</th>
                        <th className="p-2.5">Generated SQL WHERE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {job.filters.map((f) => (
                        <tr key={f.id} className="bg-slate-950 hover:bg-slate-900/40">
                          <td className="p-2.5 font-mono font-medium text-slate-200">{f.stageName}</td>
                          <td className="p-2.5 font-mono text-slate-400">{f.inputLink}</td>
                          <td className="p-2.5 font-mono text-slate-400">{f.outputLink}</td>
                          <td className="p-2.5 font-mono text-amber-400">{f.filterCondition}</td>
                          <td className="p-2.5 font-mono text-indigo-300">{f.sqlWhereClause}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
