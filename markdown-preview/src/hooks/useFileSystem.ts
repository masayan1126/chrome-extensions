import { useState, useCallback, useRef, useEffect } from 'react';
import type { DirectoryInfo, FileInfo } from '../types';
import { selectDirectory, readDirectory, readFileContent, getFileLastModified } from '../utils/fileSystem';
import {
  saveDirectoryToStorage,
  loadDirectoryFromStorage,
  hasStoredDirectory,
  restoreDirectoryWithPermission,
} from '../utils/directoryStorage';

export const useFileSystem = (showHiddenFiles: boolean = false) => {
  const [directory, setDirectory] = useState<DirectoryInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canRestore, setCanRestore] = useState(false);

  const watchIntervalRef = useRef<number | null>(null);
  const lastModifiedRef = useRef<number>(0);
  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  // 初期化時にストレージからディレクトリを復元
  useEffect(() => {
    const restoreDirectory = async () => {
      try {
        const storedHandle = await loadDirectoryFromStorage();
        if (storedHandle) {
          const dirInfo = await readDirectory(storedHandle, 0, 5, showHiddenFiles);
          setDirectory(dirInfo);
          directoryHandleRef.current = storedHandle;
        } else {
          // 権限がないが保存されたディレクトリがある場合
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // showHiddenFiles が変更されたらディレクトリを再読み込み
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

  // ユーザー操作で権限を要求してディレクトリを復元
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
  }, [showHiddenFiles]);

  const openDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const handle = await selectDirectory();
      if (handle) {
        const dirInfo = await readDirectory(handle, 0, 5, showHiddenFiles);
        setDirectory(dirInfo);
        directoryHandleRef.current = handle;
        setSelectedFile(null);
        setFileContent('');
        // ディレクトリをストレージに保存
        await saveDirectoryToStorage(handle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ディレクトリを開けませんでした');
    } finally {
      setIsLoading(false);
    }
  }, [showHiddenFiles]);

  const selectFile = useCallback(async (file: FileInfo) => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await readFileContent(file.handle);
      const lastModified = await getFileLastModified(file.handle);
      setSelectedFile(file);
      setFileContent(content);
      lastModifiedRef.current = lastModified;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルを読み込めませんでした');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  }, []);

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
  }, [showHiddenFiles]);

  // ファイル変更の監視
  const startWatching = useCallback(() => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
    }

    watchIntervalRef.current = window.setInterval(async () => {
      if (!selectedFile) return;

      try {
        const lastModified = await getFileLastModified(selectedFile.handle);
        if (lastModified > lastModifiedRef.current) {
          const content = await readFileContent(selectedFile.handle);
          setFileContent(content);
          lastModifiedRef.current = lastModified;
        }
      } catch {
        // ファイルが削除された場合などは無視
      }
    }, 1000);
  }, [selectedFile]);

  const stopWatching = useCallback(() => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
  }, []);

  return {
    directory,
    selectedFile,
    fileContent,
    isLoading,
    isInitialized,
    canRestore,
    error,
    openDirectory,
    selectFile,
    toggleDirectory,
    refreshDirectory,
    restoreStoredDirectory,
    startWatching,
    stopWatching,
  };
};
