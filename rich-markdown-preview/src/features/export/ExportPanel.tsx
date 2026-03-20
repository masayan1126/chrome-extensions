import React, { useEffect, useRef } from 'react';
import type { ReviewComment } from '../../shared/types';
import { useExport, type ExportFormat } from './useExport';
import { ExportPreview } from './ExportPreview';

interface ExportPanelProps {
  comments: ReviewComment[];
  filePath: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  comments, filePath, isOpen, onClose,
}) => {
  const {
    format, setFormat, exportContent, unresolvedCount,
    copied, copyToClipboard, downloadAsFile,
  } = useExport(comments);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        ref={panelRef}
        className="bg-neutral-800 border border-neutral-600 rounded-xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">AIエージェント指示書エクスポート</h2>
            {unresolvedCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {unresolvedCount}件の未解決コメント
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* フォーマット選択 */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-700">
          <span className="text-sm text-neutral-400">出力形式:</span>
          <div className="flex gap-2">
            {(['markdown', 'json'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  format === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                {f === 'markdown' ? 'Markdown' : 'JSON'}
              </button>
            ))}
          </div>
          {filePath && (
            <span className="text-xs text-neutral-500 ml-auto truncate max-w-[200px]" title={filePath}>
              {filePath}
            </span>
          )}
        </div>

        {/* プレビュー */}
        <div className="flex-1 overflow-hidden p-4 min-h-[200px] flex flex-col">
          <ExportPreview content={exportContent} format={format} />
        </div>

        {/* アクション */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-700">
          <button
            onClick={downloadAsFile}
            disabled={!exportContent}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-700 text-neutral-200 rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ダウンロード
          </button>
          <button
            onClick={copyToClipboard}
            disabled={!exportContent}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                コピーしました
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                クリップボードにコピー
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
