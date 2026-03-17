import { useState, useEffect, useRef } from 'react';
import type { DirectoryInfo } from '../../shared/types';
import { readDirectory } from '../../shared/utils/fileSystem';
import { loadDirectoryFromStorage, hasStoredDirectory } from './directoryRestore';

export const useDirectoryInit = (showHiddenFiles: boolean) => {
  const [directory, setDirectory] = useState<DirectoryInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canRestore, setCanRestore] = useState(false);

  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const showHiddenFilesRef = useRef(showHiddenFiles);
  showHiddenFilesRef.current = showHiddenFiles;

  useEffect(() => {
    const restoreDirectory = async () => {
      try {
        const storedHandle = await loadDirectoryFromStorage();
        if (storedHandle) {
          const dirInfo = await readDirectory(storedHandle, 0, 5, showHiddenFilesRef.current);
          setDirectory(dirInfo);
          directoryHandleRef.current = storedHandle;
        } else {
          const hasStored = await hasStoredDirectory();
          setCanRestore(hasStored);
        }
      } catch (error) {
        console.error('Failed to restore directory:', error);
        const hasStored = await hasStoredDirectory();
        setCanRestore(hasStored);
      } finally {
        setIsInitialized(true);
      }
    };

    restoreDirectory();
  }, []);

  useEffect(() => {
    if (!isInitialized || !directoryHandleRef.current) return;

    const refresh = async () => {
      try {
        const dirInfo = await readDirectory(directoryHandleRef.current!, 0, 5, showHiddenFiles);
        setDirectory(dirInfo);
      } catch (err) {
        console.error('Failed to refresh directory:', err);
      }
    };

    refresh();
  }, [showHiddenFiles, isInitialized]);

  return { directory, setDirectory, isInitialized, canRestore, setCanRestore, directoryHandleRef };
};
