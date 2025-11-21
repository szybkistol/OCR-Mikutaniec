import React, { useCallback } from 'react';
import { Upload, X, File as FileIcon, FileImage, AudioLines } from 'lucide-react';

interface FileDropzoneProps {
  files: File[];
  onFilesChanged: (files: File[]) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ files, onFilesChanged }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesChanged([...files, ...droppedFiles]);
    },
    [files, onFilesChanged]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onFilesChanged([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChanged(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer group relative"
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept="image/*,application/pdf,.txt,.csv,audio/*"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="bg-indigo-100 p-3 rounded-full group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, Images, Audio, Text files supported
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0 text-slate-400">
                  {file.type.startsWith('image') ? (
                    <FileImage className="w-5 h-5" />
                  ) : file.type.startsWith('audio') ? (
                    <AudioLines className="w-5 h-5" />
                  ) : (
                    <FileIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};