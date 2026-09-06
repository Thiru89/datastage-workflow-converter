import React, { useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  GitFork,
  Filter,
  Cpu,
  ArrowRight,
  Info,
  CheckCircle2,
  Table,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { DataStageJob, StageNode } from '../types';

interface PipelineVisualizerProps {
  job: DataStageJob;
  onSelectStage?: (stage: StageNode) => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ job, onSelectStage }) => {
  const [selectedStage, setSelectedStage] = useState<StageNode | null>(job.stages[0] || null);

  // Group stages into logical pipeline columns
  const sources = job.stages.filter((s) => s.category === 'source');
  const joinsAndLookups = job.stages.filter((s) => s.category === 'join' || s.category === 'lookup');
  const filters = job.stages.filter((s) => s.category === 'filter');
  const transformers = job.stages.filter((s) => s.category === 'transformer');
  const targets = job.stages.filter((s) => s.category === 'target');
  const others = job.stages.filter(
    (s) => !['source', 'join', 'lookup', 'filter', 'transformer', 'target'].includes(s.category)
  );

  const getStageBadge = (stage: StageNode) => {
    switch (stage.category) {
      case 'source':
        return {
          bg: 'bg-slate-900/90 border-emerald-500/30 text-slate-200',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          icon: <Database className="w-4 h-4" />,
          label: stage.properties.tableName || stage.name,
          typeLabel: stage.stageType.replace(/^Px/, ''),
        };
      case 'join':
      case 'lookup':
        return {
          bg: 'bg-slate-900/90 border-indigo-500/30 text-slate-200',
          iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
          icon: <GitFork className="w-4 h-4" />,
          label: stage.name,
          typeLabel: stage.stageType.replace(/^Px/, ''),
        };
      case 'filter':
        return {
          bg: 'bg-slate-900/90 border-amber-500/30 text-slate-200',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          icon: <Filter className="w-4 h-4" />,
          label: stage.name,
          typeLabel: 'Filter Predicate',
        };
      case 'transformer':
        return {
          bg: 'bg-slate-900/90 border-purple-500/30 text-slate-200',
          iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
          icon: <Cpu className="w-4 h-4" />,
          label: stage.name,
          typeLabel: 'Transformer Derivations',
        };
      case 'target':
        return {
          bg: 'bg-slate-900/90 border-indigo-500/40 text-slate-200',
          iconBg: 'bg-indigo-500 text-white',
          icon: <Table className="w-4 h-4" />,
          label: stage.properties.tableName || stage.name,
          typeLabel: stage.stageType.replace(/^Px/, ''),
        };
      default:
        return {
          bg: 'bg-slate-900/90 border-slate-700 text-slate-200',
          iconBg: 'bg-slate-800 text-slate-300',
          icon: <Sliders className="w-4 h-4" />,
          label: stage.name,
          typeLabel: stage.stageType,
        };
    }
  };

  const handleStageClick = (stage: StageNode) => {
    setSelectedStage(stage);
    if (onSelectStage) {
      onSelectStage(stage);
    }
  };

  const columns = [
    { title: '1. Extraction Sources', items: sources, badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    { title: '2. Joins & Lookups', items: joinsAndLookups, badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
    { title: '3. Filter Predicates', items: filters, badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    { title: '4. Transformers', items: transformers, badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
    { title: '5. Target Tables', items: targets, badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
  ].filter((col) => col.items.length > 0);

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800 shadow-inner overflow-hidden">
      {/* Visualizer Top Bar */}
      <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Interactive ETL Workflow Graph
          </h3>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-400">
            Click any stage node to inspect schema &amp; expressions
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Source
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Join/Lookup
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Filter
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Transformer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Target
          </span>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="p-6 overflow-x-auto">
        <div className="flex items-start gap-4 min-w-[850px] justify-between relative">
          {columns.map((col, colIdx) => (
            <React.Fragment key={col.title}>
              <div className="flex-1 min-w-[170px] max-w-[220px] flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 tracking-tight">{col.title}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${col.badgeColor}`}>
                    {col.items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {col.items.map((stage) => {
                    const badge = getStageBadge(stage);
                    const isSelected = selectedStage?.id === stage.id;

                    return (
                      <button
                        key={stage.id}
                        onClick={() => handleStageClick(stage)}
                        className={`text-left p-3 rounded-xl border transition-all relative ${badge.bg} ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-950 shadow-lg shadow-indigo-950/50 scale-[1.02] bg-slate-800/90'
                            : 'hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-6 h-6 rounded-lg ${badge.iconBg} flex items-center justify-center shrink-0`}>
                            {badge.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 truncate">
                              {badge.typeLabel}
                            </div>
                            <div className="text-xs font-semibold text-white truncate">
                              {stage.name}
                            </div>
                          </div>
                        </div>

                        {/* Stage Details summary */}
                        <div className="mt-1 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          {stage.columns.length > 0 ? (
                            <span>{stage.columns.length} columns</span>
                          ) : (
                            <span className="italic text-slate-500">Streaming Link</span>
                          )}

                          {stage.category === 'filter' && (
                            <span className="truncate max-w-[90px] font-mono text-amber-400">
                              {stage.properties.Where || 'WHERE'}
                            </span>
                          )}

                          {stage.category === 'join' && (
                            <span className="font-semibold text-indigo-400">
                              {stage.properties.JoinType || 'Inner'}
                            </span>
                          )}

                          {stage.category === 'target' && (
                            <span className="font-medium text-indigo-300 truncate max-w-[80px]">
                              {stage.properties.LoadAction || 'Insert'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {colIdx < columns.length - 1 && (
                <div className="flex items-center justify-center pt-10 text-slate-700">
                  <ArrowRight className="w-5 h-5 animate-pulse text-indigo-500/40" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Selected Stage Detail Drawer */}
      {selectedStage && (
        <div className="border-t border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Selected Stage Inspection:
              </span>
              <span className="text-sm font-semibold text-white">{selectedStage.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {selectedStage.stageType}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Properties Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-white block mb-2">Stage Properties</span>
              {Object.keys(selectedStage.properties).length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {Object.entries(selectedStage.properties).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-medium truncate">{k}:</span>
                      <span className="font-mono text-slate-300 text-right truncate max-w-[160px]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 italic">No custom stage properties declared.</span>
              )}
            </div>

            {/* Links Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-white block mb-2">Pin Connections &amp; Links</span>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">Input Links:</span>
                  {selectedStage.inputLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedStage.inputLinks.map((l) => (
                        <span key={l} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px]">
                          {l}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">None (Primary Pipeline Entry)</span>
                  )}
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Output Links:</span>
                  {selectedStage.outputLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedStage.outputLinks.map((l) => (
                        <span key={l} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                          {l}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">None (Terminal Target Exit)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Columns Sample */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">Columns &amp; Datatypes</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedStage.columns.length} total
                </span>
              </div>
              {selectedStage.columns.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {selectedStage.columns.slice(0, 8).map((col, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-900">
                      <span className="font-mono text-slate-300 font-medium">{col.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 border border-slate-700/60 px-1.5 py-0.5 rounded">
                        {col.sqlType}
                      </span>
                    </div>
                  ))}
                  {selectedStage.columns.length > 8 && (
                    <span className="text-[10px] text-indigo-400 block pt-1 font-medium">
                      + {selectedStage.columns.length - 8} more columns...
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 italic">Inherits schema from source link.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
