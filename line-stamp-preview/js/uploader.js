/**
 * File upload handling (D&D + file picker)
 */
const Uploader = (() => {
  const MAX_SIZE = 1 * 1024 * 1024; // 1MB
  const RECOMMENDED_WIDTH = 370;
  const RECOMMENDED_HEIGHT = 320;

  let onFilesAccepted = null;

  function init(callback) {
    onFilesAccepted = callback;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    // Click to open file picker
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      fileInput.value = '';
    });

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('palette__drop-zone--active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('palette__drop-zone--active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('palette__drop-zone--active');
      handleFiles(e.dataTransfer.files);
    });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    const accepted = [];

    for (const file of files) {
      // Check PNG
      if (file.type !== 'image/png') {
        Toast.show(`"${file.name}" はPNG形式ではありません`, 'error');
        continue;
      }

      // Check size
      if (file.size > MAX_SIZE) {
        Toast.show(`"${file.name}" は1MBを超えています`, 'error');
        continue;
      }

      // Read image dimensions
      const dimensions = await getImageDimensions(file);

      // Warn if not recommended size (don't block)
      if (dimensions.width !== RECOMMENDED_WIDTH || dimensions.height !== RECOMMENDED_HEIGHT) {
        Toast.show(
          `"${file.name}" (${dimensions.width}x${dimensions.height}) — 推奨サイズは${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}px`,
          'warning'
        );
      }

      accepted.push({
        id: crypto.randomUUID(),
        blob: file,
        name: file.name,
        width: dimensions.width,
        height: dimensions.height
      });
    }

    if (accepted.length > 0 && onFilesAccepted) {
      onFilesAccepted(accepted);
    }
  }

  function getImageDimensions(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  }

  return { init };
})();
