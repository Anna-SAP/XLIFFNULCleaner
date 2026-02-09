import React, { useCallback, useState } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  }, [onFilesSelected]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out
        ${isDragActive 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-slate-300 hover:border-slate-400 bg-white'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        multiple
        accept=".xlf,.xliff,.xml"
        onChange={handleFileInput}
        disabled={isProcessing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary-100' : 'bg-slate-100'}`}>
          {isDragActive ? (
            <FileUp className="w-10 h-10 text-primary-600" />
          ) : (
            <UploadCloud className="w-10 h-10 text-slate-400" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium text-slate-700">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Support for .xlf, .xliff, .xml
          </p>
        </div>
        <button 
          className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          disabled={isProcessing}
        >
          Browse Files
        </button>
      </div>
    </div>
  );
};