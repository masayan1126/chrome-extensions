/**
 * 選択テキストからMarkdownソース行番号を推定する
 * 100%精度は不要。見出しベース + テキスト検索の組み合わせ
 */

const stripMarkdownSyntax = (line: string): string => {
  return line
    .replace(/^#{1,6}\s+/, '')      // 見出し
    .replace(/\*\*(.+?)\*\*/g, '$1') // 太字
    .replace(/\*(.+?)\*/g, '$1')     // イタリック
    .replace(/`(.+?)`/g, '$1')       // インラインコード
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // リンク
    .replace(/!\[.*?\]\(.+?\)/g, '')  // 画像
    .replace(/^[-*+]\s+/, '')         // リストマーカー
    .replace(/^\d+\.\s+/, '')         // 番号付きリスト
    .replace(/^>\s+/, '')             // 引用
    .trim();
};

export const findMarkdownLines = (
  markdownContent: string,
  selectedText: string
): { lineStart: number; lineEnd: number } => {
  if (!markdownContent || !selectedText) {
    return { lineStart: 0, lineEnd: 0 };
  }

  const lines = markdownContent.split('\n');
  const normalizedSelected = selectedText.trim().replace(/\s+/g, ' ');

  // まずテキスト全体から直接検索
  for (let i = 0; i < lines.length; i++) {
    const stripped = stripMarkdownSyntax(lines[i]);
    if (stripped.includes(normalizedSelected)) {
      return { lineStart: i + 1, lineEnd: i + 1 };
    }
  }

  // 複数行にまたがる場合、最初の行の先頭部分で検索
  const firstWords = normalizedSelected.split(' ').slice(0, 5).join(' ');
  for (let i = 0; i < lines.length; i++) {
    const stripped = stripMarkdownSyntax(lines[i]);
    if (stripped.includes(firstWords)) {
      // 終了行を推定
      const lastWords = normalizedSelected.split(' ').slice(-5).join(' ');
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        const endStripped = stripMarkdownSyntax(lines[j]);
        if (endStripped.includes(lastWords)) {
          return { lineStart: i + 1, lineEnd: j + 1 };
        }
      }
      return { lineStart: i + 1, lineEnd: i + 1 };
    }
  }

  return { lineStart: 0, lineEnd: 0 };
};
