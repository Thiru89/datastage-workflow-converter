import React, { useState } from 'react';
import {
  Database,
  Table,
  Cpu,
  GitFork,
  Filter,
  CheckCircle2,
  Code2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { DataStageJob } from '../types';

interface StagesBreakdownProps {
  job: DataStageJob;
}

export const StagesBreakdown: React.FC<StagesBreakdownProps> = ({ job }) => {
  const [activeTab, setActiveTab] = useState<'sources-targets' | 'transforms' | 'joins' | 'filters'>('sources-targets');

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800 shadow-inner overflow-hidden">
      {/* Category Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sources-targets')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sources-targets'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          Sources &amp; Targets ({job.sources.length + job.targets.length})
        </button>

        <button
          onClick={() => setActiveTab('transforms')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'transforms'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          Transformations &amp; Derivations ({job.transformations.length})
        </button>

        <button
          onClick={() => setActiveTab('joins')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'joins'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 text-sky-400" />
          Joins &amp; Lookups ({job.joins.length})
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'filters'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          Filters &amp; Predicates ({job.filters.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* TAB 1: Sources & Targets */}
        {activeTab === 'sources-targets' && (
          <div className="space-y-6">
            {/* Sources Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  DataStage Extraction Sources ({job.sources.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {job.sources.map((src, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold font-mono text-xs">
                          S{idx + 1}
                        </div>
                        <div>
                          <h5 className="font-semibold text-white text-sm font-mono">{src.tableName}</h5>
                          <span className="text-[11px] text-slate-400">
                            Stage: <strong className="text-slate-300 font-mono">{src.stageName}</strong> ({src.databaseType})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                        {src.sourceType}
                      </span>
                    </div>

                    {src.query && (
                      <div className="mt-2 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300 overflow-x-auto">
                        <span className="text-slate-500 block text-[10px] font-sans font-semibold mb-1">
                          Extraction Query:
                        </span>
                        {src.query}
                      </div>
                    )}

                    {src.filePath && (
                      <div className="mt-2 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-slate-300">
                        <span className="text-slate-500 block text-[10px] font-sans font-semibold">
                          File Path:
                        </span>
                        {src.filePath}
                      </div>
                    )}

                    {/* Column Inventory */}
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Source Columns ({src.columns.length}):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-1">
                        {src.columns.map((col, cIdx) => (
                          <div key={cIdx} className="text-[10px] p-1 bg-slate-950 rounded border border-slate-800/80 flex justify-between">
                            <span className="font-mono text-slate-300 truncate">{col.name}</span>
                            <span className="font-mono text-slate-500 ml-1">{col.sqlType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Targets Section */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  DataStage Target Entities ({job.targets.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {job.targets.map((tgt, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold font-mono text-xs">
                          T{idx + 1}
                        </div>
                        <div>
                          <h5 className="font-semibold text-white text-sm font-mono">{tgt.tableName}</h5>
                          <span className="text-[11px] text-slate-400">
                            Stage: <strong className="text-slate-300 font-mono">{tgt.stageName}</strong> ({tgt.databaseType})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold font-mono">
                        Load: {tgt.loadAction}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Target Table Schema ({tgt.columns.length} columns):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-1">
                        {tgt.columns.map((col, cIdx) => (
                          <div key={cIdx} className="text-[10px] p-1 bg-slate-950 rounded border border-slate-800/80 flex justify-between">
                            <span className="font-mono text-slate-300 truncate">{col.name}</span>
                            <span className="font-mono text-slate-500 ml-1">{col.sqlType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Transformations */}
        {activeTab === 'transforms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Extracted from <code className="font-mono text-purple-400 font-semibold">PxTransformer</code>{' '}
                stages. Translates legacy DataStage expressions into ANSI / Cloud SQL syntax.
              </p>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {job.transformations.length} total derivations
              </span>
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
              {job.transformations.map((trn) => (
                <div key={trn.id} className="p-4 bg-slate-950/40 hover:bg-slate-800/20 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-400 font-mono">
                        {trn.targetColumn}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {trn.targetDataType}
                      </span>
                      <span className="text-xs text-slate-600">in stage</span>
                      <span className="text-xs font-medium text-purple-400 font-mono">
                        {trn.stageName}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {trn.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                        DataStage Original Derivation:
                      </span>
                      <code className="text-xs font-mono text-amber-400 block overflow-x-auto">
                        {trn.derivation}
                      </code>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 block mb-1">
                        Equivalent Modern SQL:
                      </span>
                      <code className="text-xs font-mono text-indigo-300 font-semibold block overflow-x-auto">
                        {trn.sqlEquivalent}
                      </code>
                    </div>
                  </div>

                  {trn.businessRule && (
                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      Rule interpretation: {trn.businessRule}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Stage Variables */}
            {job.stageVariables.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Transformer Stage Variables ({job.stageVariables.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.stageVariables.map((v, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-800 bg-slate-950">
                      <span className="font-mono text-xs font-semibold text-purple-400 block">{v.name}</span>
                      <code className="font-mono text-[11px] text-slate-300 block mt-1">{v.expression}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Joins & Lookups */}
        {activeTab === 'joins' && (
          <div className="space-y-4">
            {job.joins.length > 0 ? (
              job.joins.map((jn) => (
                <div key={jn.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                        <GitFork className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm">{jn.stageName}</h5>
                        <span className="text-xs text-slate-400">
                          Stage Type: <code className="font-mono font-semibold text-slate-300">{jn.stageType}</code>
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      {jn.joinType} JOIN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Left Primary Stream:</span>
                      <span className="font-mono font-medium text-slate-300">{jn.leftLink}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Right Lookup Stream:</span>
                      <span className="font-mono font-medium text-slate-300">{jn.rightLink}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Join Keys / Match:</span>
                      <span className="font-mono font-medium text-indigo-400">{jn.conditionText}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg font-mono text-xs overflow-x-auto">
                    <span className="text-slate-500 block text-[10px] font-sans font-semibold mb-1">
                      Generated SQL JOIN Clause:
                    </span>
                    {jn.sqlJoinClause}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No Join or Lookup stages declared in this DataStage workflow.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Filters & Predicates */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            {job.filters.length > 0 ? (
              job.filters.map((fil) => (
                <div key={fil.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                        <Filter className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-sm">{fil.stageName}</h5>
                        <span className="text-xs text-slate-400">
                          Incoming Link: <code className="font-mono font-semibold text-slate-300">{fil.inputLink}</code> → Outgoing: <code className="font-mono font-semibold text-slate-300">{fil.outputLink}</code>
                        </span>
                      </div>
                    </div>
                    {fil.rejectLink && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold font-mono">
                        Rejects: {fil.rejectLink}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-amber-400 mb-3">
                    <span className="text-slate-500 block text-[10px] font-sans font-semibold mb-1">
                      DataStage Filter Expression:
                    </span>
                    {fil.filterCondition}
                  </div>

                  <div className="p-3 bg-slate-950 text-indigo-300 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto">
                    <span className="text-slate-500 block text-[10px] font-sans font-semibold mb-1">
                      Generated SQL WHERE Predicate:
                    </span>
                    {fil.sqlWhereClause}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No Filter stages declared in this DataStage workflow.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
