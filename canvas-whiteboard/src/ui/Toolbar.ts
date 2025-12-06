import type { ToolType, ConnectionType } from '@/types';

export type AlignmentType =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'distribute-h'
  | 'distribute-v';

export type ToolbarCallback = {
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
  onClose: () => void;
  onColorChange: (type: 'fill' | 'stroke', color: string) => void;
  onConnectionTypeChange: (type: ConnectionType) => void;
  onAlign: (alignment: AlignmentType) => void;
};

interface ToolConfig {
  id: ToolType;
  icon: string;
  shortcut: string;
}

const SHAPE_TOOLS: ToolConfig[] = [
  { id: 'select', icon: '↖', shortcut: 'V' },
  { id: 'rectangle', icon: '▢', shortcut: 'R' },
  { id: 'circle', icon: '○', shortcut: 'C' },
  { id: 'ellipse', icon: '⬭', shortcut: 'E' },
  { id: 'triangle', icon: '△', shortcut: 'T' },
  { id: 'diamond', icon: '◇', shortcut: 'D' },
  { id: 'arrow', icon: '→', shortcut: 'A' },
];

const COLORS = [
  '#ffffff',
  '#f3f4f6',
  '#fef3c7',
  '#fce7f3',
  '#dbeafe',
  '#d1fae5',
  '#e0e7ff',
  '#333333',
];

export class Toolbar {
  private container: HTMLDivElement;
  private activeTool: ToolType = 'select';
  private connectionType: ConnectionType = 'straight';
  private callbacks: ToolbarCallback;

  constructor(callbacks: ToolbarCallback) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.className = 'canvas-whiteboard-toolbar';
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    // Tool buttons
    for (const tool of SHAPE_TOOLS) {
      const btn = this.createToolButton(tool);
      this.container.appendChild(btn);
    }

    // Connection type toggle
    const connectionTypeBtn = this.createConnectionTypeButton();
    this.container.appendChild(connectionTypeBtn);

    this.container.appendChild(this.createSeparator());

    // Fill color
    const fillBtn = this.createColorButton('#ffffff', 'fill', chrome.i18n.getMessage('fillColor'));
    this.container.appendChild(fillBtn);

    // Stroke color
    const strokeBtn = this.createColorButton('#333333', 'stroke', chrome.i18n.getMessage('strokeColor'));
    this.container.appendChild(strokeBtn);

    this.container.appendChild(this.createSeparator());

    // Undo
    const undoBtn = this.createActionButton('↶', chrome.i18n.getMessage('actionUndo'), () =>
      this.callbacks.onUndo()
    );
    this.container.appendChild(undoBtn);

    // Redo
    const redoBtn = this.createActionButton('↷', chrome.i18n.getMessage('actionRedo'), () =>
      this.callbacks.onRedo()
    );
    this.container.appendChild(redoBtn);

    // Delete
    const deleteBtn = this.createActionButton('🗑', chrome.i18n.getMessage('actionDelete'), () =>
      this.callbacks.onDelete()
    );
    this.container.appendChild(deleteBtn);

    this.container.appendChild(this.createSeparator());

    // Alignment button
    const alignBtn = this.createAlignmentButton();
    this.container.appendChild(alignBtn);

    this.container.appendChild(this.createSeparator());

    // Import
    const importBtn = this.createActionButton('📂', chrome.i18n.getMessage('actionImport'), () =>
      this.callbacks.onImport()
    );
    this.container.appendChild(importBtn);

    // Export
    const exportBtn = this.createActionButton('📥', chrome.i18n.getMessage('actionExport'), () =>
      this.callbacks.onExport()
    );
    this.container.appendChild(exportBtn);

    // Close
    const closeBtn = this.createActionButton('✕', chrome.i18n.getMessage('actionClose'), () =>
      this.callbacks.onClose()
    );
    this.container.appendChild(closeBtn);
  }

  private createToolButton(tool: ToolConfig): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = tool.icon;
    btn.title = `${tool.id} (${tool.shortcut})`;
    btn.dataset.tool = tool.id;

    if (tool.id === this.activeTool) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      this.setActiveTool(tool.id);
      this.callbacks.onToolChange(tool.id);
    });

    return btn;
  }

  private createConnectionTypeButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'connection-type-btn';
    btn.dataset.connectionType = this.connectionType;
    this.updateConnectionTypeButton(btn);

    btn.addEventListener('click', () => {
      this.connectionType = this.connectionType === 'straight' ? 'bezier' : 'straight';
      btn.dataset.connectionType = this.connectionType;
      this.updateConnectionTypeButton(btn);
      this.callbacks.onConnectionTypeChange(this.connectionType);
    });

    return btn;
  }

  private updateConnectionTypeButton(btn: HTMLButtonElement): void {
    if (this.connectionType === 'straight') {
      btn.textContent = '⟋';
      btn.title = chrome.i18n.getMessage('lineStraight');
    } else {
      btn.textContent = '∿';
      btn.title = chrome.i18n.getMessage('lineCurved');
    }
  }

  private createColorButton(
    color: string,
    type: 'fill' | 'stroke',
    title: string
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.style.backgroundColor = color;
    btn.title = title;
    btn.dataset.colorType = type;
    btn.dataset.color = color;

    btn.addEventListener('click', () => {
      this.showColorPicker(btn, type);
    });

    return btn;
  }

  private showColorPicker(btn: HTMLButtonElement, type: 'fill' | 'stroke'): void {
    const existingPicker = document.querySelector('.wb-color-picker');
    if (existingPicker) {
      existingPicker.remove();
      return;
    }

    const picker = document.createElement('div');
    picker.className = 'wb-color-picker';
    picker.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #1e1e1e;
      border-radius: 8px;
      padding: 8px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 10000001;
    `;

    for (const color of COLORS) {
      const colorBtn = document.createElement('button');
      colorBtn.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.3);
        background: ${color};
        cursor: pointer;
      `;
      colorBtn.addEventListener('click', () => {
        btn.style.backgroundColor = color;
        btn.dataset.color = color;
        this.callbacks.onColorChange(type, color);
        picker.remove();
      });
      picker.appendChild(colorBtn);
    }

    this.container.style.position = 'relative';
    this.container.appendChild(picker);

    setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (!picker.contains(e.target as Node)) {
          picker.remove();
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 0);
  }

  private createAlignmentButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = '⊞';
    btn.title = chrome.i18n.getMessage('actionAlign');

    btn.addEventListener('click', () => {
      this.showAlignmentMenu(btn);
    });

    return btn;
  }

  private showAlignmentMenu(btn: HTMLButtonElement): void {
    const existingMenu = document.querySelector('.wb-alignment-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const menu = document.createElement('div');
    menu.className = 'wb-alignment-menu';
    menu.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #1e1e1e;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 10000001;
      min-width: 160px;
    `;

    const alignOptions: { type: AlignmentType; icon: string; labelKey: string }[] = [
      { type: 'left', icon: '⫷', labelKey: 'alignLeft' },
      { type: 'center', icon: '⫿', labelKey: 'alignCenter' },
      { type: 'right', icon: '⫸', labelKey: 'alignRight' },
      { type: 'top', icon: '⊤', labelKey: 'alignTop' },
      { type: 'middle', icon: '⊟', labelKey: 'alignMiddle' },
      { type: 'bottom', icon: '⊥', labelKey: 'alignBottom' },
      { type: 'distribute-h', icon: '⋯', labelKey: 'distributeHorizontal' },
      { type: 'distribute-v', icon: '⋮', labelKey: 'distributeVertical' },
    ];

    for (const opt of alignOptions) {
      const item = document.createElement('button');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
        text-align: left;
        border-radius: 4px;
      `;
      item.innerHTML = `<span style="font-size: 16px; width: 20px;">${opt.icon}</span>${chrome.i18n.getMessage(opt.labelKey)}`;

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.1)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });

      item.addEventListener('click', () => {
        this.callbacks.onAlign(opt.type);
        menu.remove();
      });

      menu.appendChild(item);
    }

    this.container.style.position = 'relative';
    this.container.appendChild(menu);

    setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node) && e.target !== btn) {
          menu.remove();
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 0);
  }

  private createActionButton(
    icon: string,
    title: string,
    onClick: () => void
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = icon;
    btn.title = title;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private createSeparator(): HTMLDivElement {
    const sep = document.createElement('div');
    sep.className = 'separator';
    return sep;
  }

  setActiveTool(tool: ToolType): void {
    this.activeTool = tool;
    const buttons = this.container.querySelectorAll('button[data-tool]');
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }
}
