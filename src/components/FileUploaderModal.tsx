import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Code2,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { SAMPLE_DATASTAGE_JOBS, SampleJobEntry } from '../data/sampleJobs';

interface FileUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileParsed: (content: string, filename: string) => void;
  onSelectSample: (sample: SampleJobEntry) => void;
}

export const FileUploaderModal: React.FC<FileUploaderModalProps> = ({
  isOpen,
  onClose,
  onFileParsed,
  onSelectSample,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileNameInput, setFileNameInput] = useState('custom_datastage_job.dsx');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || content.trim().length === 0) {
        setErrorMsg('The selected file appears to be empty.');
        return;
      }
      onFileParsed(content, file.name);
      onClose();
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file. Please check file permissions.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setErrorMsg('Please paste DataStage workflow content.');
      return;
    }
    onFileParsed(pastedText, fileNameInput || 'pasted_job.dsx');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Scan DataStage ETL Workflow</h3>
              <p className="text-xs text-slate-400">
                Supports IBM InfoSphere DataStage DSX, XML, ISX, and SQL/JSON exports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            File Upload (.dsx, .xml, .txt)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Paste Raw Code
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                    : 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/30 bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dsx,.xml,.isx,.txt,.json"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click to browse or drag and drop your DataStage file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts standard DataStage exports: <code className="font-mono text-indigo-300">.dsx</code>,{' '}
                    <code className="font-mono text-indigo-300">.xml</code>,{' '}
                    <code className="font-mono text-indigo-300">.isx</code>, or text dumps
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-medium">
                    No size limit
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                    Instant Deterministic Scan
                  </span>
                </div>
              </div>

              {/* Quick Enterprise Samples */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Or test with a preloaded enterprise DataStage job:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SAMPLE_DATASTAGE_JOBS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onSelectSample(sample);
                        onClose();
                      }}
                      className="p-3 rounded-xl border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/40 bg-slate-950/50 text-left transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 font-medium">
                            {sample.format}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                          {sample.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {sample.description}
                        </p>
                      </div>
                      <div className="mt-2 text-[10px] text-indigo-400 font-medium flex items-center gap-1">
                        <span>Load Sample</span> →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  File Name / Identifier:
                </label>
                <input
                  type="text"
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  placeholder="e.g. Job_Customer_Enrichment.dsx"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  DataStage Code Snippet (DSX or XML):
                </label>
                <textarea
                  rows={10}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="BEGIN DSJOB&#10;   Identifier &quot;Job_Sample&quot;&#10;   BEGIN DSRECORD...&#10;END DSJOB"
                  className="w-full p-3 text-xs font-mono rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-950 text-slate-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-950/30 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Scan &amp; Process Code</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
