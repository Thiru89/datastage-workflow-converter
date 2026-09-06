import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Copy,
  Check,
  Code2,
  Table,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Download,
} from 'lucide-react';
import { DataStageJob, SourceTargetMapping } from '../types';

interface SourceTargetMappingTableProps {
  job: DataStageJob;
  onExplainExpression?: (expression: string) => void;
}

export const SourceTargetMappingTable: React.FC<SourceTargetMappingTableProps> = ({
  job,
  onExplainExpression,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTargetTable, setSelectedTargetTable] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const targetTables = useMemo(() => {
    const list = Array.from(new Set(job.mappings.map((m) => m.targetTable)));
    return ['All', ...list];
  }, [job.mappings]);

  const filteredMappings = useMemo(() => {
    return job.mappings.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.targetColumn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sourceColumn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.transformation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sqlExpression.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.targetTable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sourceTable.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus;
      const matchesTable = selectedTargetTable === 'All' || m.targetTable === selectedTargetTable;

      return matchesSearch && matchesStatus && matchesTable;
    });
  }, [job.mappings, searchQuery, selectedStatus, selectedTargetTable]);

  const handleCopySql = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRuleBadge = (ruleType: string) => {
    switch (ruleType) {
      case 'Conditional / CASE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'String Manipulation':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Date/Time Calculation':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Mathematical':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Surrogate Key':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Data Quality / Cleansing':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/40 rounded-xl border border-slate-800 shadow-inner overflow-hidden flex flex-col">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Table className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">
            Source-to-Target Mapping (STTM) Specification
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {filteredMappings.length} of {job.mappings.length} columns
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search column, table, logic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-300 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Mapped">Direct Mapped</option>
            <option value="Derived">Derived Logic</option>
            <option value="Surrogate">Surrogate Key</option>
            <option value="Lookup">Lookup Reference</option>
          </select>

          {/* Target Table Filter */}
          {targetTables.length > 2 && (
            <select
              value={selectedTargetTable}
              onChange={(e) => setSelectedTargetTable(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-300 font-medium"
            >
              {targetTables.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Target Tables' : t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 border-b border-slate-700">Target Column</th>
              <th className="py-3 px-4 border-b border-slate-700">Target Data Type</th>
              <th className="py-3 px-4 border-b border-slate-700">Source Table &amp; Column</th>
              <th className="py-3 px-4 border-b border-slate-700 min-w-[260px]">DataStage Derivation</th>
              <th className="py-3 px-4 border-b border-slate-700 min-w-[260px]">Converted SQL Expression</th>
              <th className="py-3 px-4 border-b border-slate-700">Classification</th>
              <th className="py-3 px-4 border-b border-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredMappings.length > 0 ? (
              filteredMappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors group">
                  {/* Target Column */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-indigo-400 font-mono flex items-center gap-1.5">
                      <span>{m.targetColumn}</span>
                      {!m.targetNullable && (
                        <span className="text-[10px] text-rose-400 font-sans font-semibold" title="Required (NOT NULL)">
                          *
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                      {m.targetTable}
                    </span>
                  </td>

                  {/* Target Data Type */}
                  <td className="py-3 px-4">
                    <span className="inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700/60">
                      {m.targetDataType}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                      {m.targetNullable ? 'NULL' : 'NOT NULL'}
                    </span>
                  </td>

                  {/* Source Table & Column */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200 font-mono">
                      {m.sourceColumn}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {m.sourceTable}
                    </span>
                  </td>

                  {/* DataStage Derivation */}
                  <td className="py-3 px-4">
                    <div className="font-mono text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800 text-amber-400 overflow-x-auto max-w-[300px]">
                      {m.transformation}
                    </div>
                    {m.notes && (
                      <span className="text-[10px] text-slate-500 block mt-1 truncate max-w-[280px]">
                        {m.notes}
                      </span>
                    )}
                  </td>

                  {/* Converted SQL Expression */}
                  <td className="py-3 px-4">
                    <div className="font-mono text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800 text-indigo-300 flex items-center justify-between gap-2 max-w-[320px]">
                      <span className="truncate">{m.sqlExpression}</span>
                      <button
                        onClick={() => handleCopySql(m.id, m.sqlExpression)}
                        className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors shrink-0"
                        title="Copy SQL Expression"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Classification */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[11px] px-2 py-0.5 rounded-md border font-medium ${getRuleBadge(
                        m.ruleType
                      )}`}
                    >
                      {m.ruleType}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 font-medium">
                      Status: {m.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    {onExplainExpression && m.status === 'Derived' && (
                      <button
                        onClick={() => onExplainExpression(m.transformation)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-1 rounded-md transition-colors"
                        title="Explain this DataStage expression with AI"
                      >
                        <Sparkles className="w-3 h-3" />
                        Explain
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  No columns found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
