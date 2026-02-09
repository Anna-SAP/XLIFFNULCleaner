import React from 'react';
import { X, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { ProcessedFile, ChangeRecord } from '../types';

interface ChangeDetailsModalProps {
  file: ProcessedFile | null;
  isOpen: boolean;
  onClose: () => void;
}

// Regex matching invalid XML chars: 00-08, 0B, 0C, 0E-1F
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

const InvalidCharBadge: React.FC<{ charCode: number }> = ({ charCode }) => (
  <span className="inline-block px-1 mx-0.5 text-[10px] font-bold text-white bg-red-500 rounded border border-red-600 select-none" title={`Invalid Character (ASCII ${charCode})`}>
    {charCode === 0 ? 'NUL' : `x${charCode.toString(16).toUpperCase().padStart(2, '0')}`}
  </span>
);

export const ChangeDetailsModal: React.FC<ChangeDetailsModalProps> = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  // Function to render text with visible invalid characters
  const renderVisualizedText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Reset regex state
    INVALID_CHAR_REGEX.lastIndex = 0;
    
    let match;
    while ((match = INVALID_CHAR_REGEX.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add badge for the match
      const charCode = match[0].charCodeAt(0);
      parts.push(<InvalidCharBadge key={match.index} charCode={charCode} />);
      
      lastIndex = match.index + 1;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return <>{parts}</>;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          
          {/* Header */}
          <div className="bg-slate-50 px-4 py-3 sm:px-6 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-6 text-slate-900" id="modal-title">
                  Change Details
                </h3>
                <p className="text-sm text-slate-500">{file.name}</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
            {file.changes.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p>No invalid characters were found in this file.</p>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Found and removed <span className="font-bold">{file.nulCount}</span> invalid characters across <span className="font-bold">{file.changes.length}</span> lines.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  {file.changes.map((change: ChangeRecord, idx) => (
                    <div key={idx} className={`p-4 ${idx !== file.changes.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          Line {change.lineNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          {change.nulCount} character{change.nulCount > 1 ? 's' : ''} removed
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm font-mono bg-slate-50 p-3 rounded-md overflow-x-auto">
                        {/* Original */}
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Original</p>
                          <div className="whitespace-pre-wrap break-all text-slate-600 bg-red-50/50 p-2 rounded border border-red-100">
                            {renderVisualizedText(change.originalContent)}
                          </div>
                        </div>

                        {/* Cleaned */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cleaned</p>
                          </div>
                          <div className="whitespace-pre-wrap break-all text-slate-800 bg-green-50/50 p-2 rounded border border-green-100">
                            {change.cleanedContent}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-200">
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};