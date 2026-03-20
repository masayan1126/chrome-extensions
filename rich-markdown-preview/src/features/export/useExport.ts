import { useState, useCallback } from 'react';
import type { ReviewComment } from '../../shared/types';
import { formatAsMarkdown, formatAsJSON } from './exportFormatter';

export type ExportFormat = 'markdown' | 'json';

export const useExport = (comments: ReviewComment[]) => {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);

  const unresolvedComments = comments.filter((c) => !c.resolved);

  const exportContent = format === 'markdown'
    ? formatAsMarkdown(comments)
    : formatAsJSON(comments);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [exportContent]);

  const downloadAsFile = useCallback(() => {
    const ext = format === 'markdown' ? 'md' : 'json';
    const mimeType = format === 'markdown' ? 'text/markdown' : 'application/json';
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-instructions.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportContent, format]);

  return {
    format,
    setFormat,
    exportContent,
    unresolvedCount: unresolvedComments.length,
    copied,
    copyToClipboard,
    downloadAsFile,
  };
};
