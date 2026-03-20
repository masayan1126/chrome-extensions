import React, { useState, useEffect, useCallback } from 'react';
import type { ReviewComment } from '../../shared/types';

interface CommentTooltipProps {
  comments: ReviewComment[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const typeLabels: Record<ReviewComment['type'], string> = {
  modify: '修正',
  delete: '削除',
  add: '追加',
  question: '質問',
};

const typeBadgeColors: Record<ReviewComment['type'], string> = {
  modify: 'bg-blue-500',
  delete: 'bg-red-500',
  add: 'bg-green-500',
  question: 'bg-yellow-500',
};

export const CommentTooltip: React.FC<CommentTooltipProps> = ({ comments, containerRef }) => {
  const [tooltip, setTooltip] = useState<{
    comment: ReviewComment;
    position: { top: number; left: number };
  } | null>(null);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-comment-id]');
    if (!target || !containerRef.current) return;

    const commentId = target.getAttribute('data-comment-id');
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const rect = target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setTooltip({
      comment,
      position: {
        top: rect.bottom - containerRect.top + 4,
        left: rect.left - containerRect.left,
      },
    });
  }, [comments, containerRef]);

  const handleMouseOut = useCallback((e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-comment-id]');
    const relatedTarget = (e.relatedTarget as HTMLElement)?.closest?.('[data-comment-id]');
    if (target && !relatedTarget) {
      setTooltip(null);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [containerRef, handleMouseOver, handleMouseOut]);

  if (!tooltip) return null;

  return (
    <div
      className="absolute z-40 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none"
      style={{
        top: `${tooltip.position.top}px`,
        left: `${tooltip.position.left}px`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`px-1.5 py-0.5 text-[10px] rounded text-white ${typeBadgeColors[tooltip.comment.type]}`}>
          {typeLabels[tooltip.comment.type]}
        </span>
      </div>
      <p className="text-sm text-neutral-200 leading-relaxed">{tooltip.comment.comment}</p>
    </div>
  );
};
