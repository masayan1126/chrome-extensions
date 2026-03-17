// カラー値のバリデーション
export const isValidColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{3,8}$/.test(color);
};

export const safeColor = (color: string, fallback: string): string => {
  return isValidColor(color) ? color : fallback;
};

// boldカラーがテキストカラーと同一の場合、コントラストを強化
export const ensureBoldContrast = (boldColor: string, textColor: string, isDark: boolean): string => {
  if (boldColor.toLowerCase() !== textColor.toLowerCase()) return boldColor;
  // ダークテーマ: 明るくする、ライトテーマ: 暗くする
  if (isDark) {
    return '#ffffff';
  }
  return '#000000';
};
