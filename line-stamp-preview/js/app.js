/**
 * Toast notification utility
 */
const Toast = (() => {
  function show(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3000);
  }

  return { show };
})();

/**
 * App initialization and integration
 */
const App = (() => {
  let currentSender = 'me';

  async function init() {
    // Initialize palette click handler
    Palette.init((stampId) => {
      const stamp = Palette.getStamp(stampId);
      if (stamp) {
        Chat.addMessage(stamp.blob, currentSender, stampId);
      }
    });

    // Initialize uploader
    Uploader.init(async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        await StampStorage.save({
          id: file.id,
          blob: file.blob,
          name: file.name,
          width: file.width,
          height: file.height
        });
        Palette.addStamp(file);
        // アップロードと同時にチャットへ送信
        Chat.addMessage(file.blob, currentSender, file.id);
      }
      Toast.show(`${acceptedFiles.length}個のスタンプを送信しました`, 'success');
    });

    // Load saved stamps from IndexedDB
    try {
      const saved = await StampStorage.getAll();
      for (const stamp of saved) {
        Palette.addStamp(stamp);
      }
    } catch (err) {
      console.error('Failed to load stamps:', err);
    }

    // Sender toggle
    const btnSender = document.getElementById('btn-sender');
    const btnReceiver = document.getElementById('btn-receiver');

    btnSender.addEventListener('click', () => {
      currentSender = 'me';
      btnSender.classList.add('toggle-btn--active');
      btnReceiver.classList.remove('toggle-btn--active');
    });

    btnReceiver.addEventListener('click', () => {
      currentSender = 'other';
      btnReceiver.classList.add('toggle-btn--active');
      btnSender.classList.remove('toggle-btn--active');
    });

    // Chat clear
    document.getElementById('btn-clear-chat').addEventListener('click', () => {
      Chat.clearAll();
      Toast.show('チャットをクリアしました', 'success');
    });

    // Save image
    document.getElementById('btn-save-image').addEventListener('click', () => {
      Chat.exportAsImage();
    });

    // Delete all stamps
    document.getElementById('btn-delete-all-stamps').addEventListener('click', () => {
      if (!Palette.hasStamps()) {
        Toast.show('削除するスタンプがありません', 'warning');
        return;
      }
      Palette.clearAll();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z / Cmd+Z - Undo last message
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const undone = Chat.undoLast();
        if (undone) {
          Toast.show('メッセージを取り消しました', 'success');
        }
      }

      // Tab - Toggle sender
      if (e.key === 'Tab') {
        e.preventDefault();
        if (currentSender === 'me') {
          btnReceiver.click();
        } else {
          btnSender.click();
        }
      }
    });
  }

  return { init };
})();

// Start
document.addEventListener('DOMContentLoaded', App.init);
