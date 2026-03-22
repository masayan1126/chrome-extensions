import type { ReviewComment } from '../../shared/types';

interface ExportComment {
  section: string | null;
  lineRange: string;
  type: string;
  targetText: string;
  instruction: string;
}

interface ExportFile {
  filePath: string;
  comments: ExportComment[];
}

interface ExportData {
  files: ExportFile[];
}

const typeLabels: Record<ReviewComment['type'], string> = {
  modify: '修正',
  delete: '削除',
};

const toExportComment = (comment: ReviewComment): ExportComment => {
  const lineRange = comment.anchor.markdownLineStart > 0
    ? comment.anchor.markdownLineStart === comment.anchor.markdownLineEnd
      ? `L${comment.anchor.markdownLineStart}`
      : `L${comment.anchor.markdownLineStart}-L${comment.anchor.markdownLineEnd}`
    : '';

  return {
    section: comment.anchor.nearestHeadingText,
    lineRange,
    type: typeLabels[comment.type],
    targetText: comment.anchor.selectedText,
    instruction: comment.comment,
  };
};

const groupByFile = (comments: ReviewComment[]): ExportData => {
  const fileMap = new Map<string, ReviewComment[]>();
  for (const comment of comments) {
    const existing = fileMap.get(comment.filePath) || [];
    existing.push(comment);
    fileMap.set(comment.filePath, existing);
  }

  return {
    files: Array.from(fileMap.entries()).map(([filePath, fileComments]) => ({
      filePath,
      comments: fileComments.map(toExportComment),
    })),
  };
};

export const formatAsMarkdown = (comments: ReviewComment[]): string => {
  const unresolvedComments = comments.filter((c) => !c.resolved);
  if (unresolvedComments.length === 0) return '';

  const data = groupByFile(unresolvedComments);
  const lines: string[] = ['# レビュー指示書', ''];

  for (const file of data.files) {
    lines.push(`## ファイル: ${file.filePath}`, '');

    for (const comment of file.comments) {
      const sectionInfo = comment.section
        ? `### セクション: ${comment.section}${comment.lineRange ? ` (${comment.lineRange})` : ''}`
        : comment.lineRange
          ? `### ${comment.lineRange}`
          : '### (位置不明)';

      lines.push(sectionInfo);
      lines.push(`- **種類**: ${comment.type}`);
      lines.push(`- **対象テキスト**: \`${comment.targetText}\``);
      lines.push(`- **指示**: ${comment.instruction}`);
      lines.push('');
    }
  }

  return lines.join('\n');
};

export const formatAsJSON = (comments: ReviewComment[]): string => {
  const unresolvedComments = comments.filter((c) => !c.resolved);
  if (unresolvedComments.length === 0) return '{"files":[]}';

  const data = groupByFile(unresolvedComments);
  return JSON.stringify(data, null, 2);
};
