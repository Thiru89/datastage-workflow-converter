import React, { useState } from 'react';
import {
  Sparkles,
  X,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Cpu,
  ArrowRight,
  Code2,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { AiAnalysisResult, DataStageJob } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: DataStageJob;
  analysisResult: AiAnalysisResult | null;
  isLoading: boolean;
  onRunAnalysis: () => void;
  initialExpression?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  job,
  analysisResult,
  isLoading,
  onRunAnalysis,
  initialExpression = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sandbox'>('overview');
  const [customExpr, setCustomExpr] = useState(initialExpression);
  const [targetDialect, setTargetDialect] = useState('Snowflake');
  const [convertingExpr, setConvertingExpr] = useState(false);
  const [conversionResult, setConversionResult] = useState<{
    sqlExpression?: string;
    explanation?: string;
    edgeCases?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleConvertCustomExpression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExpr.trim()) return;

    setConvertingExpr(true);
    setConversionResult(null);

    try {
      const res = await fetch('/api/gemini/convert-expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: customExpr,
          dialect: targetDialect,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConversionResult(data.result);
      } else {
        setConversionResult({
          error: data.error || 'Failed to convert expression with AI.',
        });
      }
    } catch (err: any) {
      setConversionResult({
        error: err.message || 'Network error communicating with server.',
      });
    } finally {
      setConvertingExpr(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <span>AI Migration &amp; ETL Modernization</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  Gemini 2.5 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Architectural insights &amp; expression translation for <strong className="text-slate-200 font-mono">{job.jobName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/60 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Pipeline Architecture &amp; Migration
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sandbox'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            Expression Translator Sandbox
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950">
          {activeTab === 'overview' ? (
            <div className="space-y-5">
              {!analysisResult && !isLoading && (
                <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">
                    Generate Architectural Insights with Gemini
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                    Analyzes job stages, table schemas, join dependencies, and derivation logic to provide a clean business interpretation and cloud modernization recommendations.
                  </p>
                  <button
                    onClick={onRunAnalysis}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950/30 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Analysis</span>
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-slate-200 text-sm">
                    Analyzing DataStage ETL pipeline with Gemini...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluating schemas, link joins, and transformer derivation complexity
                  </p>
                </div>
              )}

              {analysisResult && !isLoading && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Business Purpose */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider block mb-1">
                      Business Purpose &amp; Pipeline Objective
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysisResult.businessPurpose}
                    </p>
                  </div>

                  {/* Transformation Insights */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      Key Transformation Derivations Identified
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysisResult.transformationInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Modernization Strategy */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-sky-400 tracking-wider block mb-1">
                      Recommended Cloud Data Architecture &amp; dbt Mapping
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysisResult.modernizationStrategy}
                    </p>
                  </div>

                  {/* Risks & Watch-outs */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Potential Migration Pitfalls &amp; Edge Cases
                    </h4>
                    <div className="space-y-1.5">
                      {analysisResult.potentialMigrationRisks.map((risk, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={onRunAnalysis}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors border border-slate-800"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-analyze Pipeline</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Test and translate any complex IBM DataStage Transformer expression, routine, or stage variable into optimized SQL.
              </p>

              <form onSubmit={handleConvertCustomExpression} className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      DataStage Expression / Derivation:
                    </label>
                    <input
                      type="text"
                      value={customExpr}
                      onChange={(e) => setCustomExpr(e.target.value)}
                      placeholder="e.g. If IsNull(Lnk_In.AMT) Then 0 Else Lnk_In.AMT * 1.15"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="w-40">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Target SQL:
                    </label>
                    <select
                      value={targetDialect}
                      onChange={(e) => setTargetDialect(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 font-medium focus:ring-indigo-500"
                    >
                      <option value="Snowflake">Snowflake</option>
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="BigQuery">BigQuery</option>
                      <option value="Oracle">Oracle</option>
                      <option value="Databricks">Databricks</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={convertingExpr || !customExpr.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-lg shadow-indigo-950/30 transition-colors flex items-center gap-1.5"
                  >
                    {convertingExpr ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Translate Expression</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Conversion Result */}
              {conversionResult && (
                <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                  {conversionResult.error ? (
                    <div className="text-xs text-rose-400">{conversionResult.error}</div>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                          Translated {targetDialect} SQL:
                        </span>
                        <div className="p-3 bg-slate-950 text-indigo-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto">
                          {conversionResult.sqlExpression}
                        </div>
                      </div>

                      {conversionResult.explanation && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-0.5">
                            Logic Explanation:
                          </span>
                          <p className="text-xs text-slate-300">
                            {conversionResult.explanation}
                          </p>
                        </div>
                      )}

                      {conversionResult.edgeCases && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block mb-0.5">
                            Null &amp; Type Edge Cases:
                          </span>
                          <p className="text-xs text-amber-300/90">
                            {conversionResult.edgeCases}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
