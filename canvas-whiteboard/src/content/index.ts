import { WhiteboardCanvas } from '@/core/Canvas';
import { Toolbar, type AlignmentType } from '@/ui/Toolbar';
import { ExportDialog, type ExportFormat } from '@/ui/ExportDialog';
import {
  exportAsPNG,
  exportAsSVG,
  exportAsJSON,
  downloadBlob,
  downloadText,
} from '@/utils/export';
import type { ToolType, ConnectionType } from '@/types';

let canvas: WhiteboardCanvas | null = null;
let toolbar: Toolbar | null = null;
let overlay: HTMLDivElement | null = null;
let isActive = false;

function activate(): void {
  if (isActive) return;
  isActive = true;

  // Create overlay
  overlay = document.createElement('div');
  overlay.id = 'canvas-whiteboard-overlay';
  document.body.appendChild(overlay);

  // Initialize canvas
  canvas = new WhiteboardCanvas();
  canvas.mount(overlay);

  // Initialize toolbar
  toolbar = new Toolbar({
    onToolChange: (tool: ToolType) => {
      canvas?.setActiveTool(tool);
      toolbar?.setActiveTool(tool);
    },
    onUndo: () => {
      canvas?.undo();
    },
    onRedo: () => {
      canvas?.redo();
    },
    onDelete: () => {
      canvas?.deleteSelected();
    },
    onExport: () => {
      showExportDialog();
    },
    onImport: () => {
      showImportDialog();
    },
    onClose: () => {
      deactivate();
    },
    onColorChange: (type, color) => {
      canvas?.setShapeStyle(type, color);
    },
    onConnectionTypeChange: (connectionType: ConnectionType) => {
      canvas?.setConnectionType(connectionType);
    },
    onAlign: (alignment: AlignmentType) => {
      switch (alignment) {
        case 'left':
        case 'center':
        case 'right':
          canvas?.alignHorizontal(alignment);
          break;
        case 'top':
        case 'middle':
        case 'bottom':
          canvas?.alignVertical(alignment);
          break;
        case 'distribute-h':
          canvas?.distributeHorizontal();
          break;
        case 'distribute-v':
          canvas?.distributeVertical();
          break;
      }
    },
  });
  overlay.appendChild(toolbar.getElement());

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
}

function showExportDialog(): void {
  const dialog = new ExportDialog(async (format: ExportFormat) => {
    await handleExport(format);
  });
  dialog.show();
}

function showImportDialog(): void {
  // Create hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the imported data
      if (!data.shapes || !Array.isArray(data.shapes)) {
        throw new Error('Invalid file format: missing shapes array');
      }

      const shapes = data.shapes || [];
      const connections = data.connections || [];

      // Ask user whether to merge or replace
      const shouldReplace = confirm(
        chrome.i18n.getMessage('importOptionsTitle') + '\n\n' +
          chrome.i18n.getMessage('importReplace') + '\n' +
          chrome.i18n.getMessage('importMerge')
      );

      if (shouldReplace) {
        canvas?.clearAndImportState(shapes, connections);
      } else {
        canvas?.importState(shapes, connections);
      }
    } catch (error) {
      alert(chrome.i18n.getMessage('importError'));
    }

    input.remove();
  });

  document.body.appendChild(input);
  input.click();
}

async function handleExport(format: ExportFormat): Promise<void> {
  const svg = document.getElementById('canvas-whiteboard-svg') as SVGSVGElement | null;
  const state = canvas?.getState();

  if (!svg || !state) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `whiteboard-${timestamp}`;

  try {
    switch (format) {
      case 'png': {
        const blob = await exportAsPNG(svg);
        downloadBlob(blob, `${filename}.png`);
        break;
      }
      case 'svg': {
        const svgContent = exportAsSVG(svg);
        downloadText(svgContent, `${filename}.svg`, 'image/svg+xml');
        break;
      }
      case 'json': {
        const jsonContent = exportAsJSON(state);
        downloadText(jsonContent, `${filename}.json`, 'application/json');
        break;
      }
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
}

function deactivate(): void {
  if (!isActive) return;
  isActive = false;

  removeKeyboardShortcuts();
  canvas?.unmount();
  toolbar?.destroy();
  overlay?.remove();

  canvas = null;
  toolbar = null;
  overlay = null;
}

function toggle(): void {
  if (isActive) {
    deactivate();
  } else {
    activate();
  }
}

// Keyboard shortcut handler
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

function setupKeyboardShortcuts(): void {
  keydownHandler = (e: KeyboardEvent) => {
    // Ignore if typing in input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      return;
    }

    const key = e.key.toLowerCase();

    // Tool shortcuts
    const toolShortcuts: Record<string, ToolType> = {
      v: 'select',
      r: 'rectangle',
      c: 'circle',
      e: 'ellipse',
      t: 'triangle',
      d: 'diamond',
      a: 'arrow',
    };

    if (toolShortcuts[key]) {
      e.preventDefault();
      canvas?.setActiveTool(toolShortcuts[key]);
      toolbar?.setActiveTool(toolShortcuts[key]);
      return;
    }

    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      canvas?.deleteSelected();
      return;
    }

    // Escape - deselect or close
    if (e.key === 'Escape') {
      e.preventDefault();
      const state = canvas?.getState();
      if (state?.selectedIds.length) {
        canvas?.clearSelection();
      } else {
        deactivate();
      }
      return;
    }

    // Undo/Redo
    if (e.ctrlKey || e.metaKey) {
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          canvas?.redo();
        } else {
          canvas?.undo();
        }
        return;
      }
    }
  };

  document.addEventListener('keydown', keydownHandler);
}

function removeKeyboardShortcuts(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
}

// Global toggle shortcut (Alt+W)
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    toggle();
  }
});

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'toggle') {
    toggle();
    sendResponse({ active: isActive });
  }
  if (message.action === 'getState') {
    sendResponse({ active: isActive, state: canvas?.getState() });
  }
  return true;
});
