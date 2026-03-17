import { useState, useCallback } from 'react';
import type { DirectoryInfo } from '../../shared/types';
import { selectDirectory, readDirectory } from '../../shared/utils/fileSystem';
import { saveDirectoryToStorage } from './directorySave';
import { restoreDirectoryWithPermission } from './directoryRestore';
import { useDirectoryInit } from './useDirectoryInit';

export const useFileSystem = (showHiddenFiles: boolean = false) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { directory, setDirectory, isInitialized, canRestore, setCanRestore, directoryHandleRef } =
    useDirectoryInit(showHiddenFiles);

  const restoreStoredDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const handle = await restoreDirectoryWithPermission();
      if (handle) {
        const dirInfo = await readDirectory(handle, 0, 5, showHiddenFiles);
        setDirectory(dirInfo);
        directoryHandleRef.current = handle;
        setCanRestore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '復元に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [showHiddenFiles, setDirectory, directoryHandleRef, setCanRestore]);

  const openDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const handle = await selectDirectory();
      if (handle) {
        const dirInfo = await readDirectory(handle, 0, 5, showHiddenFiles);
        setDirectory(dirInfo);
        directoryHandleRef.current = handle;
        await saveDirectoryToStorage(handle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ディレクトリを開けませんでした');
    } finally {
      setIsLoading(false);
    }
  }, [showHiddenFiles, setDirectory, directoryHandleRef]);

  const toggleDirectory = useCallback((targetDir: DirectoryInfo) => {
    const toggleRecursive = (dir: DirectoryInfo): DirectoryInfo => {
      if (dir === targetDir) {
        return { ...dir, isExpanded: !dir.isExpanded };
      }
      return {
        ...dir,
        directories: dir.directories.map(toggleRecursive),
      };
    };

    setDirectory((prev) => (prev ? toggleRecursive(prev) : null));
  }, [setDirectory]);

  const refreshDirectory = useCallback(async () => {
    if (!directoryHandleRef.current) return;

    setIsLoading(true);
    try {
      const dirInfo = await readDirectory(directoryHandleRef.current, 0, 5, showHiddenFiles);
      setDirectory(dirInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ディレクトリを更新できませんでした');
    } finally {
      setIsLoading(false);
    }
  }, [showHiddenFiles, setDirectory, directoryHandleRef]);

  return {
    directory,
    isLoading,
    isInitialized,
    canRestore,
    error,
    openDirectory,
    toggleDirectory,
    refreshDirectory,
    restoreStoredDirectory,
  };
};
