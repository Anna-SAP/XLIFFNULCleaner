import { ProcessedFile, FileStatus, ChangeRecord } from '../types';

/**
 * Checks if a string contains valid XML using the browser's DOMParser.
 */
const isValidXml = (xmlString: string): { valid: boolean; error?: string } => {
  if (!xmlString || xmlString.trim() === '') {
    return { valid: false, error: 'File is empty' };
  }
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  // DOMParser returns a document containing a <parsererror> element if parsing fails
  const errorNode = xmlDoc.querySelector('parsererror');
  if (errorNode) {
    return { valid: false, error: errorNode.textContent || 'XML Parsing Error' };
  }
  
  return { valid: true };
};

/**
 * Heuristic function to repair common XML line errors.
 * Returns the repaired line and the number of fixes applied.
 */
const repairLine = (line: string): { cleaned: string; fixes: number } => {
  let current = line;
  let fixes = 0;

  // 1. Remove XML 1.0 Illegal Control Characters
  // Ranges: \x00-\x08, \x0B, \x0C, \x0E-\x1F
  // eslint-disable-next-line no-control-regex
  const controlCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
  if (controlCharRegex.test(current)) {
    const matches = current.match(controlCharRegex);
    fixes += matches ? matches.length : 0;
    current = current.replace(controlCharRegex, '');
  }

  // 2. Fix Invalid Start Tags (Crucial for "<200" error)
  // Finds '<' that is NOT followed by a valid tag character (letter, /, !, ?, or _)
  // This converts "<200" -> "&lt;200" while leaving "<trans-unit>" or "</target>" alone.
  const invalidStartTagRegex = /<(?![a-zA-Z\/\!_\?])/g;
  if (invalidStartTagRegex.test(current)) {
    fixes += (current.match(invalidStartTagRegex) || []).length;
    current = current.replace(invalidStartTagRegex, '&lt;');
  }

  // 3. Fix Unquoted Attributes
  // Finds pattern: space + key + = + value(no quotes)
  // Example: id=123 -> id="123"
  const unquotedAttrRegex = /(\s)([a-zA-Z0-9_:-]+)=([^"'\s><]+)(?=\s|>|\/)/g;
  if (unquotedAttrRegex.test(current)) {
    fixes += (current.match(unquotedAttrRegex) || []).length;
    current = current.replace(unquotedAttrRegex, '$1$2="$3"');
  }

  // 4. Fix Missing Space Between Attributes
  // Finds pattern: quote + word + =
  // Example: "value"id= -> "value" id=
  const missingSpaceRegex = /"([a-zA-Z0-9_:-]+=)/g;
  if (missingSpaceRegex.test(current)) {
    fixes += (current.match(missingSpaceRegex) || []).length;
    current = current.replace(missingSpaceRegex, '" $1');
  }

  // 5. Fix Unescaped Ampersands
  // Finds '&' that is NOT followed by a valid entity pattern
  const unescapedAmpRegex = /&(?!(?:amp|lt|gt|apos|quot|#\d+|#x[a-fA-F0-9]+);)/g;
  if (unescapedAmpRegex.test(current)) {
    fixes += (current.match(unescapedAmpRegex) || []).length;
    current = current.replace(unescapedAmpRegex, '&amp;');
  }

  return { cleaned: current, fixes };
};

/**
 * Reads a file, runs heuristic repairs line-by-line, and validates the result.
 */
export const processFile = (file: File): Promise<ProcessedFile> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let rawContent = e.target?.result as string;
        
        // 0. Handle BOM (Byte Order Mark) if present at start
        if (rawContent.charCodeAt(0) === 0xFEFF) {
          rawContent = rawContent.slice(1);
        }

        // Split content into lines to track locations
        const lines = rawContent.split(/\r\n|\n|\r/);
        const changes: ChangeRecord[] = [];
        let totalFixes = 0;

        const cleanLines = lines.map((line, index) => {
          const { cleaned, fixes } = repairLine(line);

          if (fixes > 0 || line !== cleaned) {
            totalFixes += fixes > 0 ? fixes : 1; // Ensure at least 1 count if string changed
            
            changes.push({
              lineNumber: index + 1,
              originalContent: line,
              cleanedContent: cleaned,
              nulCount: fixes // Reusing property to indicate generic "Fix Count"
            });
            return cleaned;
          }
          
          return line;
        });

        // Reassemble the content
        const cleanContent = cleanLines.join('\n');

        // Validate XML
        const xmlValidation = isValidXml(cleanContent);
        
        let status = FileStatus.ERROR;
        
        // Priority Logic:
        // 1. If we applied fixes, marked as FIXED (so user can download).
        // 2. If valid XML without fixes, CLEAN.
        // 3. Else ERROR.
        if (totalFixes > 0) {
            status = FileStatus.FIXED;
        } else if (xmlValidation.valid) {
            status = FileStatus.CLEAN;
        } else {
            status = FileStatus.ERROR;
        }

        const processed: ProcessedFile = {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          content: cleanContent,
          nulCount: totalFixes,
          status,
          errorMessage: xmlValidation.valid ? undefined : xmlValidation.error,
          timestamp: Date.now(),
          changes: changes
        };

        resolve(processed);

      } catch (err) {
        resolve({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          content: '',
          nulCount: 0,
          status: FileStatus.ERROR,
          errorMessage: 'Failed to read file content',
          timestamp: Date.now(),
          changes: []
        });
      }
    };

    reader.onerror = () => {
       resolve({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          content: '',
          nulCount: 0,
          status: FileStatus.ERROR,
          errorMessage: 'Read error',
          timestamp: Date.now(),
          changes: []
        });
    };

    // Read as UTF-8 text
    reader.readAsText(file, 'UTF-8');
  });
};