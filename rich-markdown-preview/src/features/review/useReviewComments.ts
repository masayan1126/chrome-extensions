import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReviewComment } from '../../shared/types';
import { loadComments, saveComment, deleteComment as dbDeleteComment } from './reviewDb';

/**
 * Markdownソース上でコメント対象テキストが見つかるか判定する。
 * 完全一致 → 先頭40文字一致 の順でフォールバック。
 */
const isTextFoundInContent = (content: string, selectedText: string): boolean => {
  const normalized = selectedText.replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  if (content.includes(normalized)) return true;
  // Markdown構文を除去して再検索
  const stripped = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
  if (stripped.includes(normalized)) return true;
  // 先頭40文字でフォールバック
  const shortText = normalized.substring(0, Math.min(40, normalized.length));
  return content.includes(shortText) || stripped.includes(shortText);
};

export const useReviewComments = (filePath: string | null, content?: string) => {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const prevContentRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!filePath) {
      setComments([]);
      return;
    }
    loadComments(filePath).then(setComments).catch(console.error);
  }, [filePath]);

  // コンテンツ変更時に、対象テキストが消えたコメントを自動解決
  useEffect(() => {
    if (!content || content === prevContentRef.current) return;
    prevContentRef.current = content;

    setComments((prev) => {
      const toResolve: string[] = [];
      for (const comment of prev) {
        if (comment.resolved) continue;
        if (!isTextFoundInContent(content, comment.anchor.selectedText)) {
          toResolve.push(comment.id);
        }
      }
      if (toResolve.length === 0) return prev;

      console.debug(`[AutoResolve] ${toResolve.length} comments auto-resolved (text no longer found)`);
      return prev.map((c) => {
        if (!toResolve.includes(c.id)) return c;
        const resolved = { ...c, resolved: true, updatedAt: new Date().toISOString() };
        saveComment(resolved).catch(console.error);
        return resolved;
      });
    });
  }, [content]);

  const addComment = useCallback(async (comment: ReviewComment) => {
    await saveComment(comment);
    setComments((prev) => [...prev, comment]);
  }, []);

  const updateComment = useCallback(async (id: string, updates: Partial<ReviewComment>) => {
    setComments((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...updates, updatedAt: new Date().toISOString() };
        saveComment(merged).catch(console.error);
        return merged;
      });
      return updated;
    });
  }, []);

  const removeComment = useCallback(async (id: string) => {
    await dbDeleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const resolveComment = useCallback(async (id: string) => {
    await updateComment(id, { resolved: true });
  }, [updateComment]);

  const unresolveComment = useCallback(async (id: string) => {
    await updateComment(id, { resolved: false });
  }, [updateComment]);

  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  return {
    comments,
    unresolvedComments,
    resolvedComments,
    addComment,
    updateComment,
    removeComment,
    resolveComment,
    unresolveComment,
  };
};
