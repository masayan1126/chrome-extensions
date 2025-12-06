export type ExportFormat = 'png' | 'svg' | 'json';

export type ExportCallback = (format: ExportFormat) => void;

export class ExportDialog {
  private container: HTMLDivElement;
  private callback: ExportCallback;

  constructor(callback: ExportCallback) {
    this.callback = callback;
    this.container = document.createElement('div');
    this.container.className = 'wb-export-dialog';
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2147483647;
      background: #1e1e1e;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      min-width: 280px;
    `;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #fff;">
        ${chrome.i18n.getMessage('exportTitle')}
      </h2>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="wb-export-btn" data-format="png" style="
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        ">
          ${chrome.i18n.getMessage('exportPNG')}
        </button>
        <button class="wb-export-btn" data-format="svg" style="
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          background: #10b981;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        ">
          ${chrome.i18n.getMessage('exportSVG')}
        </button>
        <button class="wb-export-btn" data-format="json" style="
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          background: #8b5cf6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        ">
          ${chrome.i18n.getMessage('exportJSON')}
        </button>
      </div>
      <button class="wb-export-cancel" style="
        margin-top: 16px;
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        color: #9ca3af;
        background: transparent;
        border: 1px solid #374151;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s ease;
      ">
        ${chrome.i18n.getMessage('cancel')}
      </button>
    `;

    // Add event listeners
    this.container.querySelectorAll('.wb-export-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const format = (btn as HTMLButtonElement).dataset.format as ExportFormat;
        this.callback(format);
        this.close();
      });
    });

    this.container.querySelector('.wb-export-cancel')?.addEventListener('click', () => {
      this.close();
    });

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'wb-export-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483646;
      background: rgba(0, 0, 0, 0.5);
    `;
    backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(backdrop);
  }

  show(): void {
    document.body.appendChild(this.container);
  }

  close(): void {
    this.container.remove();
    document.querySelector('.wb-export-backdrop')?.remove();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
