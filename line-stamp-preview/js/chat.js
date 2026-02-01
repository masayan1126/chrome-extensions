/**
 * Chat area management
 */
const Chat = (() => {
  const chatArea = () => document.getElementById('chat-area');
  const messages = []; // { id, sender, stampId, objectUrl }
  const objectUrls = new Map(); // stampId -> objectUrl (per-message URLs)

  function addMessage(stampBlob, sender, stampId) {
    const area = chatArea();

    // Remove empty state
    const empty = area.querySelector('.chat-area__empty');
    if (empty) empty.remove();

    const objectUrl = URL.createObjectURL(stampBlob);
    const msgId = crypto.randomUUID();

    messages.push({ id: msgId, sender, stampId, objectUrl });
    objectUrls.set(msgId, objectUrl);

    // Build message element
    const row = document.createElement('div');
    row.className = `message message--${sender}`;
    row.dataset.msgId = msgId;

    if (sender === 'other') {
      const avatar = document.createElement('div');
      avatar.className = 'message__avatar';
      avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      row.appendChild(avatar);
    }

    const img = document.createElement('img');
    img.className = 'message__stamp';
    img.src = objectUrl;
    img.alt = 'stamp';
    row.appendChild(img);

    area.appendChild(row);
    area.scrollTop = area.scrollHeight;
  }

  function undoLast() {
    if (messages.length === 0) return false;

    const last = messages.pop();
    const url = objectUrls.get(last.id);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.delete(last.id);
    }

    const area = chatArea();
    const el = area.querySelector(`[data-msg-id="${last.id}"]`);
    if (el) el.remove();

    // Show empty state if no messages left
    if (messages.length === 0) {
      showEmptyState();
    }

    return true;
  }

  function clearAll() {
    // Revoke all object URLs
    for (const [, url] of objectUrls) {
      URL.revokeObjectURL(url);
    }
    objectUrls.clear();
    messages.length = 0;

    const area = chatArea();
    area.innerHTML = '';
    showEmptyState();
  }

  function showEmptyState() {
    const area = chatArea();
    const empty = document.createElement('div');
    empty.className = 'chat-area__empty';
    empty.innerHTML = '<p>スタンプをアップロードして<br>チャットプレビューを開始しましょう</p>';
    area.appendChild(empty);
  }

  function hasMessages() {
    return messages.length > 0;
  }

  /**
   * Export chat area as image using html2canvas-like approach with Canvas API
   */
  async function exportAsImage() {
    const area = chatArea();
    if (!hasMessages()) {
      Toast.show('チャットが空です', 'warning');
      return;
    }

    try {
      // Collect all message data
      const canvas = document.createElement('canvas');
      const padding = 24;
      const msgGap = 12;
      const stampMaxSize = 180;
      const avatarSize = 36;
      const avatarGap = 8;

      // Pre-load all stamp images
      const loadedImages = [];
      for (const msg of messages) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = msg.objectUrl;
        });
        // Calculate display size (max 180x180, maintain aspect ratio)
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > stampMaxSize || h > stampMaxSize) {
          const scale = Math.min(stampMaxSize / w, stampMaxSize / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        loadedImages.push({ img, w, h, sender: msg.sender });
      }

      // Calculate canvas size
      const canvasWidth = 400;
      let totalHeight = padding * 2;
      for (let i = 0; i < loadedImages.length; i++) {
        totalHeight += loadedImages[i].h;
        if (i < loadedImages.length - 1) totalHeight += msgGap;
      }

      canvas.width = canvasWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#7B96A8';
      ctx.fillRect(0, 0, canvasWidth, totalHeight);

      // Draw messages
      let y = padding;
      for (const { img, w, h, sender } of loadedImages) {
        let x;
        if (sender === 'me') {
          x = canvasWidth - padding - w;
        } else {
          // Avatar space
          x = padding + avatarSize + avatarGap;
          // Draw avatar circle
          ctx.fillStyle = '#CCCCCC';
          ctx.beginPath();
          ctx.arc(padding + avatarSize / 2, y + h - avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.drawImage(img, x, y, w, h);
        y += h + msgGap;
      }

      // Download
      const link = document.createElement('a');
      link.download = `chat-stamp-preview-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      Toast.show('画像を保存しました', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      Toast.show('画像の保存に失敗しました', 'error');
    }
  }

  return { addMessage, undoLast, clearAll, hasMessages, exportAsImage };
})();
