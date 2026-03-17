import { useState, useRef } from 'react';
import type { OpenTab } from '../../shared/types';

export const useTabDrag = (onReorderTabs: (tabs: OpenTab[]) => void) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const draggedTabRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    if (draggedTabRef.current) {
      draggedTabRef.current.style.opacity = '0.5';
    }
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
    if (draggedTabRef.current) {
      draggedTabRef.current.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTabId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string, tabs: OpenTab[]) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTabId) return;

    const newTabs = [...tabs];
    const draggedIndex = newTabs.findIndex((t) => t.id === draggedTabId);
    const targetIndex = newTabs.findIndex((t) => t.id === targetTabId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedTab] = newTabs.splice(draggedIndex, 1);
      newTabs.splice(targetIndex, 0, draggedTab);
      onReorderTabs(newTabs);
    }

    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  return {
    draggedTabId,
    dragOverTabId,
    draggedTabRef,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
