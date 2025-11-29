## Copy Tab Anything - Chrome Extension

**Export browser tabs as formatted lists instantly!** Perfect for researchers, developers, content creators, and anyone managing multiple tabs.

### ✨ Features

- **Flexible Export Scopes**
  - Current window tabs
  - All windows tabs
  - Specific tab groups
  - Custom selection

- **Multiple Output Formats**
  - Markdown: `[title](url)`
  - HTML: `<a href="url">title</a>`
  - Plain text: `title - url`
  - Custom: Title + newline + URL

- **Advanced Options**
  - URL decoding for international characters
  - Punycode decoding for internationalized domain names
  - Tab group support (unique feature!)

- **Quick Access**
  - Extension popup
  - Right-click context menu
  - Keyboard shortcut: `Alt+Shift+C`

### 🚀 Installation

#### From Chrome Web Store
*Coming soon!*

#### Manual Installation (Development)

```bash
npm install
npm run build
```

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist` folder

### 🛠️ Development

```bash
npm run dev
```

### 📦 Build for Production

```bash
npm run build:zip
```

This creates a `tablink-composer.zip` file ready for Chrome Web Store submission.

### ⌨️ Keyboard Shortcuts

- `Alt+Shift+C`: Copy current window tabs

### 🔒 Privacy

- **No data collection** - Everything runs locally
- **No external servers** - Your data never leaves your browser
- **Open source** - Inspect the code anytime

### 📝 Use Cases

- **Researchers**: Save reference lists for papers
- **Developers**: Share debugging tabs with team members
- **Content Creators**: Build link collections for articles
- **Students**: Organize study materials
- **Project Managers**: Export task-related resources

### 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

### 📄 License

ISC

---

**日本語版 README**

タブのタイトルとURLを一括コピーできるChrome拡張機能です。Markdown/HTML/プレーンテキスト形式に対応し、ウィンドウやタブグループ単位でのエクスポートが可能です。


