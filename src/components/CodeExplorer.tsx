import React, { useState } from 'react';
import { ANDROID_PROJECT_FILES, ProjectFile } from '../data/androidProject';
import { FolderTree, FileCode, Copy, Check, Download, Search, Shield, Cpu, Terminal } from 'lucide-react';
import JSZip from 'jszip';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(ANDROID_PROJECT_FILES[3]); // app/build.gradle.kts default
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'gradle', label: 'Gradle & Build' },
    { id: 'manifest', label: 'Manifest & XML' },
    { id: 'service', label: 'Service & App' },
    { id: 'camera', label: 'CameraX Pipeline' },
    { id: 'audio', label: 'Audio Streamer' },
    { id: 'server', label: 'Ktor TLS Server' },
    { id: 'security', label: 'Security & Keystore' },
    { id: 'ui', label: 'Compose UI' },
    { id: 'test', label: 'Unit Tests' },
    { id: 'docs', label: 'Docs & Setup' },
  ];

  const filteredFiles = ANDROID_PROJECT_FILES.filter((file) => {
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    const matchesSearch = file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard?.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LocalCamStreamer-Android-Project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[750px]">
      {/* Explorer Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Android Source Code Repository</h2>
            <p className="text-xs text-slate-400">Complete, production-ready Kotlin & Gradle architecture</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating ZIP...' : 'Download Project (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-2xl">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search filenames..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Two-Pane Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: File Tree */}
        <div className="w-72 bg-slate-950/70 border-r border-slate-800 overflow-y-auto p-2 space-y-1 shrink-0">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Source Files ({filteredFiles.length})
          </div>
          {filteredFiles.map((file) => {
            const isSelected = selectedFile.path === file.path;
            const fileName = file.path.split('/').pop();
            const dir = file.path.substring(0, file.path.lastIndexOf('/'));

            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                  isSelected
                    ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                <div className="overflow-hidden">
                  <div className="font-mono font-medium truncate text-[11px] text-slate-200">
                    {fileName}
                  </div>
                  {dir && (
                    <div className="text-[10px] text-slate-500 truncate font-mono">
                      {dir}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Pane: Code Viewer */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* File Header */}
          <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-emerald-400 font-semibold">{selectedFile.path}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 truncate text-[11px]">{selectedFile.description}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Text Body with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed select-text">
            <pre className="overflow-x-auto whitespace-pre">
              {selectedFile.content.split('\n').map((line, idx) => (
                <div key={idx} className="flex hover:bg-slate-900/50 px-2 rounded">
                  <span className="w-10 text-slate-600 select-none text-right pr-4 shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
