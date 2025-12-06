import type { CanvasState } from '@/types';

/**
 * Convert foreignObject text elements to native SVG text elements
 * This is necessary because foreignObject causes canvas tainting
 */
function convertForeignObjectToSvgText(svg: SVGSVGElement): SVGSVGElement {
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

  // Find all foreignObject elements
  const foreignObjects = clonedSvg.querySelectorAll('foreignObject');

  foreignObjects.forEach((fo) => {
    const x = parseFloat(fo.getAttribute('x') || '0');
    const y = parseFloat(fo.getAttribute('y') || '0');
    const width = parseFloat(fo.getAttribute('width') || '100');
    const height = parseFloat(fo.getAttribute('height') || '100');

    // Get text content from the div inside foreignObject
    const div = fo.querySelector('.wb-shape-text') as HTMLElement | null;
    const textContent = div?.textContent || '';

    if (!textContent.trim()) {
      // No text, just remove the foreignObject
      fo.remove();
      return;
    }

    // Get styles from the div's inline styles
    const fontSize = div?.style.fontSize || '14px';
    const fontFamily = (div?.style.fontFamily || 'sans-serif').replace(/"/g, '');
    const color = div?.style.color || '#333333';

    // Create SVG text element
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', String(x + width / 2));
    textElement.setAttribute('y', String(y + height / 2));
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'middle');
    textElement.setAttribute('font-size', fontSize);
    textElement.setAttribute('font-family', fontFamily);
    textElement.setAttribute('fill', color);
    textElement.textContent = textContent;

    // Replace foreignObject with text element
    fo.parentNode?.replaceChild(textElement, fo);
  });

  return clonedSvg;
}

export async function exportAsPNG(svg: SVGSVGElement): Promise<Blob> {
  // Convert foreignObject to native SVG text to avoid canvas tainting
  const cleanSvg = convertForeignObjectToSvgText(svg);

  const svgData = new XMLSerializer().serializeToString(cleanSvg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create PNG blob'));
        }
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load SVG image'));
    };
    img.src = url;
  });
}

export function exportAsSVG(svg: SVGSVGElement): string {
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

  // Set viewBox and dimensions
  clonedSvg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  clonedSvg.setAttribute('width', String(window.innerWidth));
  clonedSvg.setAttribute('height', String(window.innerHeight));

  // Add white background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#ffffff');
  clonedSvg.insertBefore(bg, clonedSvg.firstChild);

  return new XMLSerializer().serializeToString(clonedSvg);
}

export function exportAsJSON(state: CanvasState): string {
  const exportData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    shapes: state.shapes,
    connections: state.connections,
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}
