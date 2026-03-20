import React from 'react';

interface ExportPreviewProps {
  content: string;
  format: 'markdown' | 'json';
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({ content, format }) => {
  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
        エクスポートするコメントがありません
      </div>
    );
  }

  return (
    <pre className={`flex-1 overflow-auto bg-neutral-900 rounded-lg p-4 text-sm leading-relaxed ${
      format === 'json' ? 'text-green-400' : 'text-neutral-200'
    }`}>
      <code>{content}</code>
    </pre>
  );
};
