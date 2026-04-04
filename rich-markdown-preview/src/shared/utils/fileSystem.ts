import type { FileInfo } from '../types';

const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdx', '.mkd'];

// path から直親ディレクトリ名を導出する（同名ファイルのタブラベル表示用）
// サイドバー経由: "rootDir/subDir/file.md" → "subDir"
// D&D 経由: ファイル名のみのため undefined を返す
export const getDirName = (file: FileInfo): string | undefined => {
  const parts = file.path.split('/');
  return parts.length >= 2 ? parts[parts.length - 2] : undefined;
};

// 同名ファイル群に対して、区別に必要な最小パスラベルを計算する（VS Code 式）
// 返り値: Map<path, displayLabel>
export const getDisambiguatedLabels = (
  files: { name: string; path: string }[]
): Map<string, string> => {
  const result = new Map<string, string>();

  // ファイル名ごとにグループ化
  const groups = new Map<string, { name: string; path: string }[]>();
  for (const file of files) {
    const group = groups.get(file.name) ?? [];
    group.push(file);
    groups.set(file.name, group);
  }

  for (const [fileName, group] of groups) {
    // 同名ファイルがなければファイル名のみ
    if (group.length === 1) {
      result.set(group[0].path, fileName);
      continue;
    }

    // 各ファイルのパスセグメント（ファイル名除く）を逆順に用意
    const segmentsList = group.map((f) => {
      const parts = f.path.split('/');
      // ファイル名を除いたディレクトリ部分を逆順に
      return parts.slice(0, -1).reverse();
    });

    // 各ファイルに必要なセグメント深度を決定
    for (let i = 0; i < group.length; i++) {
      let depth = 1;
      const maxDepth = segmentsList[i].length;

      while (depth <= maxDepth) {
        const label = [...segmentsList[i].slice(0, depth)].reverse().join('/');
        // 同じ深度で同じラベルになる他ファイルがあるか
        const hasDuplicate = segmentsList.some((segs, j) => {
          if (i === j) return false;
          const otherLabel = [...segs.slice(0, depth)].reverse().join('/');
          return otherLabel === label;
        });
        if (!hasDuplicate) break;
        depth++;
      }

      if (maxDepth === 0) {
        // パス情報なし（D&D経由など）
        result.set(group[i].path, fileName);
      } else {
        const dirLabel = [...segmentsList[i].slice(0, Math.min(depth, maxDepth))].reverse().join('/');
        result.set(group[i].path, `${dirLabel}/${fileName}`);
      }
    }
  }

  return result;
};

// ファイル名のサニタイズ（Unicodeの方向制御文字や制御文字を除去）
export const sanitizeFileName = (name: string): string => {
  return name.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\u0000-\u001F]/g, '');
};

export const isMarkdownFile = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

export const selectDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
    });
    return handle;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
};

export { readDirectory } from './directoryReader';

export const readFileContent = async (handle: FileSystemFileHandle): Promise<string> => {
  const file = await handle.getFile();
  return await file.text();
};

export const getFileLastModified = async (handle: FileSystemFileHandle): Promise<number> => {
  const file = await handle.getFile();
  return file.lastModified;
};
