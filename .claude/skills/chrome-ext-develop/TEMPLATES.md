# テンプレート集

ストア申請に必要なドキュメントのテンプレートです。

---

## store-listing-ja.md テンプレート

```markdown
# Chrome Web Store 掲載情報 - 日本語

## 短い説明 (132文字以内)

[主な機能]。[特徴1]、[特徴2]、[特徴3]に対応。

(文字数: XX)

---

## 詳細な説明

[拡張機能名]は、[主な目的]のためのChrome拡張機能です。[ターゲットユーザー]に最適です。

### 主な機能

**[機能カテゴリ1]**
- 機能詳細1
- 機能詳細2

**[機能カテゴリ2]**
- 機能詳細1
- 機能詳細2

### 使い方

1. 手順1
2. 手順2
3. 手順3

### 活用シーン

- **[ユーザータイプ1]**: 使用例
- **[ユーザータイプ2]**: 使用例
- **[ユーザータイプ3]**: 使用例

### プライバシー

- データ収集なし
- すべてブラウザ内でローカル動作
- 外部サーバーなし

---

## カテゴリ

[生産性向上 / 開発者ツール / etc.]

## 言語

日本語
```

---

## store-listing-en.md テンプレート

```markdown
# Chrome Web Store Listing - English

## Short Description (132 characters max)

[Main feature]. Supports [feature1], [feature2], [feature3]!

(Characters: XX)

---

## Detailed Description

[Extension Name] is a Chrome extension for [main purpose]. Perfect for [target users].

### Key Features

**[Feature Category 1]**
- Feature detail 1
- Feature detail 2

**[Feature Category 2]**
- Feature detail 1
- Feature detail 2

### How to Use

1. Step 1
2. Step 2
3. Step 3

### Use Cases

- **[User Type 1]**: Usage example
- **[User Type 2]**: Usage example
- **[User Type 3]**: Usage example

### Privacy

- No data collection
- Everything runs locally in your browser
- No external servers

---

## Category

[Productivity / Developer Tools / etc.]

## Language

English
```

---

## PRIVACY_POLICY.md テンプレート

```markdown
# Privacy Policy for [Extension Name]

**Last Updated: [Date]**

## Overview

[Extension Name] is a Chrome extension that [brief description]. This privacy policy explains how we handle your data.

## Data Collection

**We do not collect any personal data.**

This extension operates entirely locally within your browser. No data is transmitted to external servers.

## Data Storage

The extension may store the following information locally using Chrome's storage API:

- [Stored item 1 - e.g., User preferences]
- [Stored item 2 - e.g., Extension settings]

All data remains on your device and is never shared with third parties.

## Permissions Used

This extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `[permission1]` | [Purpose] |
| `[permission2]` | [Purpose] |

## Third-Party Services

This extension does not use any third-party services or analytics.

## Data Sharing

We do not share, sell, or transfer any user data to third parties.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date above.

## Contact

If you have any questions about this privacy policy, please open an issue on our GitHub repository:

[GitHub URL]

---

# プライバシーポリシー - [拡張機能名]

**最終更新日: [日付]**

## 概要

[拡張機能名]は、[簡単な説明]のChrome拡張機能です。このプライバシーポリシーでは、データの取り扱いについて説明します。

## データ収集

**個人データは一切収集しません。**

この拡張機能はブラウザ内でローカルに動作します。外部サーバーにデータが送信されることはありません。

## データ保存

この拡張機能は、ChromeのストレージAPIを使用して以下の情報をローカルに保存する場合があります：

- [保存項目1 - 例: ユーザー設定]
- [保存項目2 - 例: 拡張機能の設定]

すべてのデータはデバイス上に保持され、第三者と共有されることはありません。

## 使用する権限

この拡張機能は以下の権限を必要とします：

| 権限 | 用途 |
|------|------|
| `[permission1]` | [用途] |
| `[permission2]` | [用途] |

## サードパーティサービス

この拡張機能はサードパーティサービスやアナリティクスを使用しません。

## データ共有

ユーザーデータを第三者と共有、販売、または転送することはありません。

## ポリシーの変更

このプライバシーポリシーは随時更新される場合があります。変更は上記の「最終更新日」に反映されます。

## お問い合わせ

このプライバシーポリシーに関するご質問は、GitHubリポジトリでIssueを作成してください：

[GitHub URL]
```

---

## messages.json テンプレート（日本語）

```json
{
  "extensionName": {
    "message": "[拡張機能名]",
    "description": "拡張機能の名前"
  },
  "extensionDescription": {
    "message": "[132文字以内の説明]",
    "description": "拡張機能の説明"
  }
}
```

---

## messages.json テンプレート（英語）

```json
{
  "extensionName": {
    "message": "[Extension Name]",
    "description": "Name of the extension"
  },
  "extensionDescription": {
    "message": "[Description within 132 characters]",
    "description": "Description of the extension"
  }
}
```

---

## アイコン生成プロンプトテンプレート

画像生成AIに使用するプロンプト：

```
Create a Chrome extension icon for "[Extension Name]".

Requirements:
- Size: 128x128 pixels
- Format: PNG with transparent background
- Style: Modern, minimalist, flat design
- Primary color: [color]
- Secondary color: [color]

The icon should represent [main concept] and include:
- [Visual element 1]
- [Visual element 2]

The design should be recognizable at small sizes (16x16) and work well against both light and dark backgrounds.
```

---

## 権限説明テンプレート

申請時に権限の正当性を説明するためのテンプレート：

| 権限 | 説明テンプレート |
|------|------------------|
| `tabs` | タブのタイトルとURLを取得し、[機能]を提供するために必要です |
| `storage` | ユーザーの設定をローカルに保存するために必要です |
| `activeTab` | 現在のタブで[機能]を実行するために必要です |
| `contextMenus` | 右クリックメニューから[機能]にアクセスするために必要です |
| `clipboardWrite` | [データ]をクリップボードにコピーするために必要です |
| `notifications` | [イベント]をユーザーに通知するために必要です |
