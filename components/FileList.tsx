import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Trash2, FileText, Bug, Eye, Download } from 'lucide-react';
import { ProcessedFile, FileStatus } from '../types';
import { downloadProcessedFiles } from '../services/downloadService';

interface FileListProps {
  files: ProcessedFile[];
  onRemove: (id: string) => void;
  onViewDetails: (file: ProcessedFile) => void;
}

const StatusBadge: React.FC<{ status: FileStatus; nulCount: number }> = ({ status, nulCount }) => {
  switch (status) {
    case FileStatus.CLEAN:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Clean
        </span>
      );
    case FileStatus.FIXED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Bug className="w-3 h-3 mr-1" />
          Fixed ({nulCount})
        </span>
      );
    case FileStatus.ERROR:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Error
        </span>
      );
    default:
      return null;
  }
};

export const FileList: React.FC<FileListProps> = ({ files, onRemove, onViewDetails }) => {
  if (files.length === 0) return null;

  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Processed Files ({files.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/6">File Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Size</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="flex-shrink-0 h-5 w-5 text-slate-400 mr-3" />
                    <div className="text-sm font-medium text-slate-900 truncate max-w-xs" title={file.name}>
                      {file.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={file.status} nulCount={file.nulCount} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {file.errorMessage ? (
                    <span className="text-red-600 flex items-start break-words max-w-md">
                      <XCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="whitespace-normal">{file.errorMessage}</span>
                    </span>
                  ) : (
                    file.status === FileStatus.FIXED 
                      ? <span className="text-slate-600">Removed {file.nulCount} invalid chars</span>
                      : <span className="text-slate-400">No issues found</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => downloadProcessedFiles([file])}
                    className="text-slate-400 hover:text-green-600 transition-colors inline-flex items-center"
                    title="Download this file"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                   {file.status === FileStatus.FIXED && (
                    <button
                      onClick={() => onViewDetails(file)}
                      className="text-primary-600 hover:text-primary-800 transition-colors inline-flex items-center"
                      title="View Change Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                   )}
                  <button
                    onClick={() => onRemove(file.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors inline-flex items-center"
                    title="Remove file"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};