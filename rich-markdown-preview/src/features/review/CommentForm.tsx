import React, { useState, useRef, useEffect } from 'react';
import type { CommentAnchor, ReviewComment } from '../../shared/types';

interface CommentFormProps {
  anchor: CommentAnchor;
  filePath: string;
  position: { top: number; left: number };
  onSave: (comment: ReviewComment) => void;
  onCancel: () => void;
  editingComment?: ReviewComment | null;
}

const commentTypes = [
  { value: 'modify' as const, label: '修正', color: 'bg-blue-500' },
  { value: 'delete' as const, label: '削除', color: 'bg-red-500' },
];

export const CommentForm: React.FC<CommentFormProps> = ({
  anchor, filePath, position, onSave, onCancel, editingComment,
}) => {
  const [commentType, setCommentType] = useState<ReviewComment['type']>(
    editingComment?.type || 'modify'
  );
  const [commentText, setCommentText] = useState(editingComment?.comment || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    if (commentType !== 'delete' && !commentText.trim()) return;

    const now = new Date().toISOString();
    const comment: ReviewComment = editingComment
      ? { ...editingComment, comment: commentText.trim(), type: commentType, updatedAt: now }
      : {
          id: crypto.randomUUID(),
          filePath,
          anchor,
          comment: commentText.trim(),
          type: commentType,
          createdAt: now,
          updatedAt: now,
          resolved: false,
        };
    onSave(comment);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const displayText = anchor.selectedText.length > 60
    ? anchor.selectedText.substring(0, 60) + '...'
    : anchor.selectedText;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl p-4 w-80"
      style={{
        top: `${position.top}px`,
        left: `${Math.max(0, position.left - 160)}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3">
        <div className="text-xs text-neutral-400 mb-1">選択テキスト:</div>
        <div className="text-sm text-neutral-200 bg-neutral-700 rounded px-2 py-1 truncate">
          {displayText}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-neutral-400 mb-1.5">種類:</div>
        <div className="flex gap-1.5">
          {commentTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setCommentType(t.value)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                commentType === t.value
                  ? `${t.color} text-white`
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <textarea
          ref={textareaRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="レビューコメントを入力..."
          className="w-full h-20 bg-neutral-700 text-neutral-200 text-sm rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-neutral-500"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-neutral-500">Ctrl+Enter で保存</span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs bg-neutral-700 text-neutral-300 rounded hover:bg-neutral-600 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={commentType !== 'delete' && !commentText.trim()}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
