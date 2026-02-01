/**
 * Stamp palette management
 */
const Palette = (() => {
  const stampGrid = () => document.getElementById('stamp-grid');
  const dropZone = () => document.getElementById('drop-zone');
  const stamps = new Map(); // id -> { id, blob, name, objectUrl }

  let onStampClick = null;

  function init(callback) {
    onStampClick = callback;
  }

  function addStamp(stampData) {
    const objectUrl = URL.createObjectURL(stampData.blob);
    stamps.set(stampData.id, { ...stampData, objectUrl });

    const item = document.createElement('div');
    item.className = 'stamp-item';
    item.dataset.stampId = stampData.id;

    const img = document.createElement('img');
    img.className = 'stamp-item__img';
    img.src = objectUrl;
    img.alt = stampData.name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'stamp-item__delete';
    deleteBtn.textContent = '\u00D7';
    deleteBtn.title = '削除';

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeStamp(stampData.id);
    });

    item.addEventListener('click', () => {
      if (onStampClick) onStampClick(stampData.id);
    });

    item.appendChild(img);
    item.appendChild(deleteBtn);
    stampGrid().appendChild(item);

    updateDropZoneState();
  }

  async function removeStamp(id) {
    const stamp = stamps.get(id);
    if (!stamp) return;

    URL.revokeObjectURL(stamp.objectUrl);
    stamps.delete(id);

    await StampStorage.remove(id);

    const el = stampGrid().querySelector(`[data-stamp-id="${id}"]`);
    if (el) el.remove();

    updateDropZoneState();
    Toast.show('スタンプを削除しました', 'success');
  }

  async function clearAll() {
    for (const [, stamp] of stamps) {
      URL.revokeObjectURL(stamp.objectUrl);
    }
    stamps.clear();
    stampGrid().innerHTML = '';

    await StampStorage.clear();

    updateDropZoneState();
    Toast.show('全スタンプを削除しました', 'success');
  }

  function getStamp(id) {
    return stamps.get(id);
  }

  function hasStamps() {
    return stamps.size > 0;
  }

  function updateDropZoneState() {
    const zone = dropZone();
    if (stamps.size > 0) {
      zone.classList.add('palette__drop-zone--collapsed');
    } else {
      zone.classList.remove('palette__drop-zone--collapsed');
    }
  }

  return { init, addStamp, removeStamp, clearAll, getStamp, hasStamps };
})();
