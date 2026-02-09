import React, { useState, useMemo } from 'react';
import { Download, ShieldCheck, FileCheck, Bug, AlertOctagon, RefreshCcw } from 'lucide-react';
import { DropZone } from './components/DropZone';
import { FileList } from './components/FileList';
import { StatsCard } from './components/StatsCard';
import { ChangeDetailsModal } from './components/ChangeDetailsModal';
import { processFile } from './services/fileProcessor';
import { downloadProcessedFiles } from './services/downloadService';
import { ProcessedFile, FileStats, FileStatus } from './types';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<ProcessedFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFilesSelected = async (newFiles: File[]) => {
    setIsProcessing(true);
    
    // Process files in parallel
    const processedResults = await Promise.all(newFiles.map(processFile));
    
    setFiles(prev => [...processedResults, ...prev]);
    setIsProcessing(false);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all files?')) {
      setFiles([]);
    }
  };

  const handleViewDetails = (file: ProcessedFile) => {
    setSelectedFileForDetails(file);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFileForDetails(null);
  };

  const stats: FileStats = useMemo(() => {
    return files.reduce((acc, file) => {
      acc.total++;
      acc.totalNulRemoved += file.nulCount;
      if (file.status === FileStatus.CLEAN) acc.clean++;
      if (file.status === FileStatus.FIXED) acc.fixed++;
      if (file.status === FileStatus.ERROR) acc.error++;
      return acc;
    }, { total: 0, clean: 0, fixed: 0, error: 0, totalNulRemoved: 0 });
  }, [files]);

  const handleDownloadAll = () => {
    downloadProcessedFiles(files);
  };

  // Enable download if there is at least one file with content
  const canDownload = files.some(f => f.content && f.content.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">XLIFF NUL Cleaner</h1>
          </div>
          <div className="flex items-center space-x-4">
             <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">Client-side processing • Privacy First</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro / Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Files" 
            value={stats.total} 
            icon={FileCheck} 
            colorClass="bg-blue-500 text-blue-600"
          />
          <StatsCard 
            title="Files Fixed" 
            value={stats.fixed} 
            icon={Bug} 
            colorClass="bg-yellow-500 text-yellow-600"
            subtext={`${stats.totalNulRemoved} invalid chars removed`}
          />
           <StatsCard 
            title="Clean Files" 
            value={stats.clean} 
            icon={ShieldCheck} 
            colorClass="bg-green-500 text-green-600" 
          />
          <StatsCard 
            title="Errors" 
            value={stats.error} 
            icon={AlertOctagon} 
            colorClass="bg-red-500 text-red-600" 
          />
        </div>

        {/* Action Area */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Upload Translations</h2>
                    <p className="text-slate-500 text-sm mt-1">Drag and drop multiple .xlf, .xliff, or .xml files to sanitize them.</p>
                </div>
                <div className="flex space-x-3">
                     {files.length > 0 && (
                        <button 
                            onClick={handleClearAll}
                            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Reset
                        </button>
                    )}
                    <button 
                        onClick={handleDownloadAll}
                        disabled={!canDownload}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                    </button>
                </div>
            </div>

            <DropZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        </div>

        {/* File List */}
        <FileList 
          files={files} 
          onRemove={handleRemoveFile} 
          onViewDetails={handleViewDetails}
        />

      </main>

      {/* Details Modal */}
      <ChangeDetailsModal 
        file={selectedFileForDetails}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default App;