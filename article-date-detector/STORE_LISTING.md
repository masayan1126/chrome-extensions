# Chrome Web Store Listing Information

## Single Purpose Description
**English:**
This extension detects and displays the publication and update dates of web articles to help users identify outdated content.

**Japanese:**
この拡張機能は、Web記事の公開日・更新日を検出して表示し、古い記事の判別を支援します。

---

## Short Description (132 characters max)
**English:**
Instantly detect and display article publish/update dates with freshness color coding. Never read outdated articles by mistake again.

**Japanese:**
記事の公開日・更新日を自動検出し、鮮度を色分け表示。古い記事を知らずに読んでしまう問題を解決します。

---

## Detailed Description (English)

Article Date Detector instantly shows when an article was published or updated, so you never waste time reading outdated content. Perfect for researchers, journalists, and anyone who relies on up-to-date information.

**Key Features:**

- **Automatic Date Detection** - Detects article dates from 6 different sources: JSON-LD, Open Graph, meta tags, HTML5 time elements, Microdata, and common CSS patterns
- **Freshness Color Coding** - Green (< 1 month), Yellow (1-6 months), Orange (6-12 months), Red (> 1 year)
- **Floating Badge** - Shows date info at the top-right of the page, auto-collapses after 5 seconds
- **Dual Timezone Display** - Shows both local time and UTC to avoid confusion with international articles
- **Icon Badge** - See article age directly on the extension icon in the toolbar
- **Per-Site Toggle** - Easily disable the extension on specific websites
- **Multi-language Support** - Available in English and Japanese

**How to Use:**

1. Open any article page - the floating badge appears automatically
2. Hover over the collapsed badge to see full date details
3. Click the arrow button to scroll to the date element in the article
4. Click the extension icon for detailed information and site settings

**Privacy First:**
All processing happens locally in your browser. No data is sent to external servers. The only stored data is your list of disabled sites.

**Perfect for:**
- Verifying article freshness when researching with AI tools
- Academic research and fact-checking
- News monitoring and journalism
- Avoiding outdated technical documentation

---

## Detailed Description (Japanese)

Article Date Detectorは、記事の公開日・更新日を即座に表示し、古い記事を読んでしまう問題を防ぎます。AIで情報収集する際に提示された記事リンクの鮮度を一瞬で確認できます。

**主な機能：**

- **自動日付検出** - JSON-LD、Open Graph、メタタグ、HTML5 time要素、Microdata、CSSパターンの6段階で検出
- **鮮度の色コーディング** - 緑（1か月以内）、黄（1〜6か月）、オレンジ（6〜12か月）、赤（1年以上）
- **フローティングバッジ** - ページ右上に日付情報を表示、5秒後に自動縮小
- **デュアルタイムゾーン表示** - ローカル時間とUTCを並列表示、海外記事でも日付のずれを把握
- **アイコンバッジ** - ツールバーのアイコンで記事の経過時間を一目で確認
- **サイト別切替** - 特定のサイトで拡張機能を無効化可能
- **多言語対応** - 日本語と英語に対応

**使い方：**

1. 記事ページを開くと、フローティングバッジが自動的に表示されます
2. 縮小状態のバッジにホバーすると詳細が表示されます
3. ↗ ボタンで記事内の日付要素へスクロール
4. 拡張機能アイコンをクリックして詳細情報やサイト設定を確認

**プライバシー重視：**
すべての処理はブラウザ内で完結します。外部サーバーには一切送信されません。保存されるデータは無効化サイトリストのみです。

**こんな方におすすめ：**
- AIツールで情報収集する際に記事の鮮度を確認したい方
- 学術研究やファクトチェック
- ニュースモニタリングやジャーナリズム
- 古い技術ドキュメントを避けたい開発者

---

## Category
Productivity

## Language
English, Japanese

---

## Screenshots Required (1280x800 or 640x400)

1. **メイン機能** - ニュース記事で緑色のバッジが展開表示されている画面
2. **古い記事** - 赤色のバッジで「1年以上前」と表示されている画面
3. **ポップアップ** - 拡張機能ポップアップの詳細表示画面
4. **縮小状態** - バッジが縮小された状態の画面

---

## Promotional Images

### Small Promo Tile (440x280)
Required for featuring in the Chrome Web Store

### Marquee Promo Tile (1400x560)
Optional, but recommended for better visibility

---

## Host Permission Justification

### English
This extension requires access to all URLs (`<all_urls>`) because it needs to read the HTML content of any article page the user visits in order to detect publication and update dates. The date detection engine analyzes structured data (JSON-LD, Open Graph, meta tags, HTML5 time elements, Microdata, and CSS class patterns) embedded in the page's HTML. Without broad host access, the extension cannot function on arbitrary news sites, blogs, and documentation pages. No page content is collected, stored, or transmitted externally — all processing occurs locally within the browser.

### Japanese
この拡張機能は、ユーザーが訪問するあらゆる記事ページのHTMLコンテンツを読み取り、公開日・更新日を検出するために、すべてのURL（`<all_urls>`）へのアクセス権限が必要です。日付検出エンジンは、ページのHTMLに埋め込まれた構造化データ（JSON-LD、Open Graph、メタタグ、HTML5 time要素、Microdata、CSSクラスパターン）を解析します。広範なホストアクセスがなければ、任意のニュースサイト、ブログ、ドキュメントページで機能できません。ページコンテンツの収集・保存・外部送信は一切行わず、すべての処理はブラウザ内でローカルに完結します。

---

## Privacy Policy URL
Host your PRIVACY_POLICY.md on GitHub Pages or another hosting service and provide the URL.

Example: `https://yourusername.github.io/article-date-detector/privacy-policy`

---

## Support URL (Optional)
Link to your GitHub repository issues page:
`https://github.com/yourusername/article-date-detector/issues`
