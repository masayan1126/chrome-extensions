import { useState, useCallback, useRef, useEffect } from 'react';
import type { DirectoryInfo, FileInfo } from '../types';
import { selectDirectory, readDirectory, readFileContent, getFileLastModified } from '../utils/fileSystem';
import {
  saveDirectoryToStorage,
  loadDirectoryFromStorage,
  hasStoredDirectory,
  restoreDirectoryWithPermission,
} from '../utils/directoryStorage';

export const useFileSystem = () => {
  const [directory, setDirectory] = useState<DirectoryInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canRestore, setCanRestore] = useState(false);

  const watchIntervalRef = useRef<number | null>(null);
  const lastModifiedRef = useRef<number>(0);

  // 初期化時にストレージからディレクトリを復元
  useEffect(() => {
    const restoreDirectory = async () => {
      try {
        const storedHandle = await loadDirectoryFromStorage();
        if (storedHandle) {
          const dirInfo = await readDirectory(storedHandle);
          setDirectory(dirInfo);
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
  }, []);

  // ユーザー操作で権限を要求してディレクトリを復元
  const restoreStoredDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const handle = await restoreDirectoryWithPermission();
      if (handle) {
        const dirInfo = await readDirectory(handle);
        setDirectory(dirInfo);
        setCanRestore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '復元に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const handle = await selectDirectory();
      if (handle) {
        const dirInfo = await readDirectory(handle);
        setDirectory(dirInfo);
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
  }, []);

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
    if (!directory) return;

    setIsLoading(true);
    try {
      const dirInfo = await readDirectory(directory.handle);
      setDirectory(dirInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ディレクトリを更新できませんでした');
    } finally {
      setIsLoading(false);
    }
  }, [directory]);

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
