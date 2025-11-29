// アイコン生成用スクリプト（手動実行用）
// 実際の環境ではSVGをPNGに変換するツール（sharp等）を使用
// Chrome拡張ではSVGアイコンも使用可能なため、manifest.jsonを更新してSVGを使用

import fs from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="#1e293b"/>
  <path d="M20 94V34h18l14 28 14-28h18v60h-18V58l-14 28-14-28v36H20z" fill="#f8fafc"/>
  <path d="M108 94V70l-12 14-12-14v24H72V34h12l16 20 16-20h12v60h-20z" fill="#60a5fa"/>
</svg>`;

// 各サイズのSVGを生成
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const scaledSvg = svg.replace('viewBox="0 0 128 128"', `viewBox="0 0 128 128" width="${size}" height="${size}"`);
  fs.writeFileSync(`public/icon${size}.svg`, scaledSvg);
});

console.log('Icons generated successfully');
