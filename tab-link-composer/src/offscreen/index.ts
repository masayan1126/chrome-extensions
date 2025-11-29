// 起動時に準備完了を通知
void chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' });

chrome.runtime.onMessage.addListener(async (message) => {
  if (message?.type === 'WRITE_CLIPBOARD') {
    const text: string = message.payload?.text ?? '';
    try {
      await navigator.clipboard.writeText(text);
      // 成功ログ（必要に応じて無視）
      // console.log('クリップボード書き込み成功');
    } catch (err) {
      console.error('クリップボード書き込み失敗', err);
    }
  }
});


