import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProcessedFile } from '../types';

export const downloadProcessedFiles = async (files: ProcessedFile[]) => {
  // Allow downloading any file that has content, even if it has an error status.
  // The user might want to inspect the result of the cleaning attempt.
  const validFiles = files.filter(f => f.content && f.content.length > 0);

  if (validFiles.length === 0) {
    alert("No files with content to download.");
    return;
  }

  // Single file download
  if (validFiles.length === 1) {
    const file = validFiles[0];
    const blob = new Blob([file.content], { type: "text/xml;charset=utf-8" });
    saveAs(blob, `fixed_${file.name}`);
    return;
  }

  // Bulk download (Zip)
  const zip = new JSZip();
  
  validFiles.forEach(file => {
    // Add file to zip
    zip.file(file.name, file.content);
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "cleaned_xliff_files.zip");
};