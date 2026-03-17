import React, { useState } from 'react';
import { parseMarkdown } from '../../shared/utils/markdown';

interface CopyButtonsProps {
  markdownContent: string;
}

export const CopyButtons: React.FC<CopyButtonsProps> = ({ markdownContent }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [htmlCopySuccess, setHtmlCopySuccess] = useState(false);

  const handleCopyMarkdown = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleCopyHtml = async () => {
    if (!markdownContent) return;
    try {
      const { html } = parseMarkdown(markdownContent);
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([html], { type: 'text/plain' }) });
      await navigator.clipboard.write([item]);
      setHtmlCopySuccess(true);
      setTimeout(() => setHtmlCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  if (!markdownContent) return null;

  return (
    <>
      {/* マークダウンコピーボタン */}
      <button
        onClick={handleCopyMarkdown}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
          copySuccess
            ? 'bg-green-600 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
        }`}
        title="マークダウンをコピー"
      >
        {copySuccess ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>コピー完了</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>MDコピー</span>
          </>
        )}
      </button>

      {/* HTMLコピーボタン */}
      <button
        onClick={handleCopyHtml}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
          htmlCopySuccess
            ? 'bg-green-600 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
        }`}
        title="HTMLとしてコピー"
      >
        {htmlCopySuccess ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>コピー完了</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>HTMLコピー</span>
          </>
        )}
      </button>
    </>
  );
};
