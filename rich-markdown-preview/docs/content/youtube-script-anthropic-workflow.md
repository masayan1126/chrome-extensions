# YouTube台本：Anthropic公式ツールだけで作るChrome拡張機能開発ワークフロー

> **想定尺:** 約18〜20分
> **対象視聴者:** Claude Code ユーザー、Chrome拡張機能開発者
> **動画の概要文:**
> Anthropicが公式に提供するスキル・プラグイン・フックだけを使って、Chrome拡張機能の機能改善を要件定義からリリースノートまで完全にこなす実践ワークフローを紹介します。題材はChrome拡張「Rich Markdown Preview」の Issue #10「同名ファイルが開けない」問題の修正です。

---

## 冒頭（0:00〜1:00）— 問題提起

[画面: Chrome拡張機能「Rich Markdown Preview」を開いた状態。サイドバーに dir1/README.md と dir2/README.md が見えている]

「今日紹介するのは、Anthropicが公式に提供しているツールだけを使って、Chrome拡張機能の開発ワークフロー全体を回す方法です。」

「まず最初に、今回修正するバグを見てもらいます。」

[操作: dir1/README.md をクリックしてタブで開く]

「dir1のREADME.mdを開きました。次にdir2のREADME.mdを開いてみます。」

[操作: dir2/README.md をクリック。タブが増えず、既存のタブがアクティブになるだけ]

「…開けませんよね。同じ名前のファイルがある場合、2つ目が開けない。これがIssue #10です。」

「この修正を、要件定義・設計・実装・レビュー・ドキュメントの全工程、Anthropicの公式ツールだけで完結させます。」

---

## 開発ライフサイクルの全体像（1:00〜2:30）

[画面: CLAUDE.md のライフサイクルテーブルを表示]

「使うツールはこのテーブルに全部書いてあります。これを CLAUDE.md というファイルに書いておくと、Claude Code がセッション開始時に読み込んで、各フェーズで自律的にどのツールを使うか判断してくれます。」

「簡単に整理すると——」

[画面: 各フェーズをハイライト]

「①要件定義は doc-coauthoring。②③設計・デザインは feature-dev と frontend-design。④実装も feature-dev。⑤コミットとPR作成は commit-push-pr。⑥レビューは pr-review-toolkit。そして⑦ドキュメントは revise-claude-md と internal-comms。」

「全部 Anthropic 公式です。サードパーティのツールは一切使いません。」

---

## ガードレール（2:30〜4:00）

[画面: ターミナル、Claude Code のプロンプト]

「フェーズに入る前に、ガードレールを設定します。2種類あります。」

「1つ目は hookify。スラッシュコマンドで呼び出します。」

[画面: `/hookify` コマンドを入力するシーン]

「こんな感じで『テスト実行前にビルドを確認せずにコミットしないこと』と自然言語で伝えると、設定ファイルが自動生成されて次のセッションから適用されます。」

「2つ目は security-guidance というプラグインです。settings.json で有効化しておくと——」

[画面: settings.json の enabledPlugins セクション]

「ファイルを編集するたびに自動でセキュリティスキャンが走ります。XSSやインジェクション系のパターンを検知すると——」

[画面: セキュリティ警告が出てブロックされるターミナル出力]

```
Error: PreToolUse:Write hook error:
⚠️ Security Warning: ...is a major security risk.
```

「このようにファイルの書き込み自体をブロックしてくれます。コードを書いた瞬間にリアルタイムで止まるんですよね。」

「これが全フェーズを通じて常時動いています。」

---

## フェーズ①：要件定義（4:00〜5:30）

[画面: Claude Code に `/doc-coauthoring` と入力]

「じゃあ本題に入ります。まず要件定義から。`/doc-coauthoring` を呼び出します。」

[画面: Claude Code が対話を始める]

「Claude Code が対話形式で仕様書を一緒に作ってくれます。今回は5つのセクションを詰めました。」

[画面: 完成した仕様書 docs/issue-10-same-name-file-spec.md のプレビュー]

「背景・ユーザーストーリー・受け入れ条件・影響範囲・制限事項——これが成果物として保存されます。」

「そして仕様が確定したら——」

[画面: gh コマンドを実行]

「GitHub CLIでIssueのタイトルと説明を確定した要件で上書きします。IssueとコードベースのドキュメントをAIが橋渡ししてくれる形です。」

---

## フェーズ②：設計（5:30〜7:00）

[画面: `/feature-dev` と入力]

「次は設計です。feature-dev を呼び出します。」

「このスキルは内部で複数のサブエージェントが並行稼働します。設計フェーズでは code-explorer と code-architect の2つが動きます。」

[画面: Claude Code が並行してコードを探索している様子]

「code-explorer が根本原因を特定しました。」

[画面: directoryReader.ts のコードをハイライト]

「`directoryReader.ts` のこの部分——再帰呼び出し時に `parentPath` を引き継いでいなかったんです。そのせいで全ファイルが同じパス形式になって、異なるディレクトリでも同一と誤判定されていました。」

「code-architect が提案したアーキテクチャは——」

[画面: プランファイル plans/ の内容]

「`isSameEntry()` APIでのファイル同一性判定、そして `getDirName()` ユーティリティで型に余計なフィールドを持たせないこと。設計の成果物はプランファイルとして自動保存されます。」

---

## フェーズ③：デザイン（7:00〜8:30）

[画面: TabBar.tsx の現在のタブ表示]

「デザインフェーズです。これは『新しいUIコンポーネントが必要な場合のみ』使うフェーズで、今回はタブラベルの表示を変えるだけなので、frontend-design でプロトタイプを出してもらいました。」

[画面: 変更前と変更後のタブラベルのビフォーアフター]

「同名ファイルがないときは今まで通り `README.md`。複数タブで同じ名前が開かれているときだけ `dir1/README.md` という形式に変わります。これがデザインの要件です。」

---

## フェーズ④：実装（8:30〜13:00）

[画面: feature-dev がコードを書き始める様子]

「実装フェーズです。修正するのは3つのファイルです。順番に見ていきます。」

### directoryReader.ts の修正

[画面: directoryReader.ts のdiff表示]

「1つ目、根本修正です。`readDirectory` 関数に `parentPath` というパラメータを追加しました。」

[画面: コードをズームイン]

```typescript
export const readDirectory = async (
  handle: FileSystemDirectoryHandle,
  // ...
  parentPath: string = ''   // ← ここが追加された
): Promise<DirectoryInfo> => {
  const currentPath = parentPath
    ? `${parentPath}/${handle.name}`
    : handle.name;
```

「再帰呼び出し時に `currentPath` を渡すことで、ファイルのパスが常に `root/dir1/file.md` という完全なパスになります。」

### useTabOpen.ts の修正

[画面: useTabOpen.ts のコード]

「2つ目、重複チェックのロジックです。以前は `file.path` の文字列比較だけでした。それを——」

[画面: isSameEntry を使った部分をハイライト]

```typescript
if (await t.file.handle.isSameEntry(file.handle)) {
  existingTab = t;
  break;
}
```

「`isSameEntry()` というFile System Access APIのメソッドに置き換えました。これはファイルシステムレベルで同一性を判定するので、シンボリックリンクや別マウントポイントのケースでも正確に動きます。」

「エラーハンドリングも丁寧にやっています。ハンドルが無効化された場合——権限が失効したとか——は debug ログだけ。予期しないエラーは warn で記録する。これが後でレビューでも評価されました。」

### TabBar.tsx の修正

[画面: TabBar.tsx のコード]

「3つ目、タブのラベル表示です。」

[画面: duplicateNames の useMemo をハイライト]

```typescript
const duplicateNames = useMemo(() => {
  const nameCounts = new Map<string, number>();
  tabs.forEach((tab) => {
    nameCounts.set(tab.file.name, (nameCounts.get(tab.file.name) ?? 0) + 1);
  });
  return new Set(
    Array.from(nameCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
  );
}, [tabs]);
```

「タブ一覧を走査して、同じ名前が2つ以上あるものだけを `duplicateNames` に入れます。`useMemo` を使っているのでタブが変わった時だけ再計算されます。」

[画面: getDisplayLabel 関数をハイライト]

```typescript
const getDisplayLabel = (tab: OpenTab): string => {
  if (!duplicateNames.has(tab.file.name)) {
    return sanitizeFileName(tab.file.name);             // "README.md"
  }
  const dirName = getDirName(tab.file);
  if (dirName) {
    return sanitizeFileName(`${dirName}/${tab.file.name}`); // "dir1/README.md"
  }
  return sanitizeFileName(tab.file.name);
};
```

「重複してないファイルは今まで通り。重複してるものだけ `dir1/README.md` 形式にする。シンプルですよね。」

---

## フェーズ⑤：コミット/PR（13:00〜14:30）

[画面: `/commit-push-pr` を入力]

「実装が終わったら `/commit-push-pr` 一発です。コミット・プッシュ・PR作成が一度に終わります。」

[画面: 自動生成されたコミットメッセージ]

```
fix: 同名ファイルを別タブで開けない問題を修正 (#10)

- directoryReader でフルパスを正しく構築（parentPath 再帰引き継ぎ）
- useTabOpen で FileSystemFileHandle.isSameEntry() による同一性判定を導入
- D&D ファイルは name::size::lastModified 複合キーに統一
- TabBar で同名タブが複数の場合のみ parentDir/filename 形式で表示
```

「semantic commit 形式で自動生成されます。変更のポイントが箇条書きで整理されていて、レビュアーが差分を見る前に全体像を把握できる形になっています。」

[画面: GitHub の PR ページ]

「PRも自動でオープンされました。概要・変更ファイル一覧・テスト手順が入った本文が生成されています。」

---

## フェーズ⑥：レビュー（14:30〜17:00）

[画面: `/pr-review-toolkit:review-pr` を入力]

「次はレビューです。`pr-review-toolkit` を呼び出すと——」

[画面: 複数のエージェントが並行動作している様子]

「`code-reviewer`・`type-design-analyzer`・`silent-failure-hunter` が並列で動きます。それぞれ専門の視点で見てくれるんです。」

「今回は2つの問題が見つかりました。」

[画面: type-design-analyzer の出力]

「まず type-design-analyzer から。」

```
FileInfo 型に dirName フィールドが含まれているが、
これは path から常に導出できる。
冗長なフィールドを持つと path と dirName の不整合が発生しうる。

→ dirName を型から削除し、getDirName(file) ユーティリティで計算することを推奨
```

「これ、自分では気づいていなかったんです。型に `dirName` を持たせていたんですが、それは `path` から計算できるので冗長だと。もし `path` が変わって `dirName` を更新し忘れたら不整合が起きる——というリスクを指摘してくれました。」

[画面: 修正後の fileSystem.ts に getDirName が追加されている様子]

「即座に修正しました。型からフィールドを削除して、`getDirName()` というユーティリティ関数で計算する設計に変えました。」

[画面: silent-failure-hunter の出力]

「もう1つは silent-failure-hunter から。」

```
useDragDrop.ts の catch ブロックがすべてのエラーを無音で飲み込んでいる。
getAsFileSystemHandle の失敗と openTab の失敗が区別できない。
```

「catch ブロックが空だったんですよね。エラーが起きても何も記録されない。これを `console.warn` でログを残すように直しました。」

「こういう『見落としがちだけど積み重なると問題になる』ことを専門エージェントが拾ってくれるのは本当に助かります。」

---

## フェーズ⑦：ドキュメント（17:00〜18:30）

[画面: `/revise-claude-md` を入力]

「最後はドキュメントです。2つのスキルを使います。」

「まず `revise-claude-md`。今回のセッションで学んだことを CLAUDE.md に反映します。」

[画面: CLAUDE.md が更新される様子]

「ビルド・テスト・zip 作成の手順が追加されました。次回以降のセッションでも引き継がれます。」

[画面: `/internal-comms` を入力]

「次に `internal-comms` でリリースノートを作ります。」

[画面: 2種類のリリースノートが生成される]

「GitHub Releases向けの技術者向けバージョンと、Chrome拡張ストア向けの一般ユーザー向けバージョン、2種類が一度に生成されます。」

「技術者向けは変更ファイル・API・影響範囲を詳細に。ユーザー向けは平易な日本語で『こう便利になりました』という伝え方に。文体も詳細度も自動で切り替えてくれます。」

---

## エンディング（18:30〜19:30）

[画面: 最初のバグのビフォーアフターを再度表示]

「最初のバグを見てみましょう。」

[操作: dir1/README.md と dir2/README.md を順番に開く]

「今度は両方が別タブで開けています。タブに `dir1/README.md` と `dir2/README.md` が表示されていて、どちらがどのファイルか一目で分かります。」

「今日やったことを振り返ると——」

[画面: フェーズ一覧のスライド]

「要件定義・設計・デザイン・実装・コミット/PR・レビュー・ドキュメント、7フェーズをすべて Anthropic 公式ツールだけで完結させました。」

「ポイントは、人間が判断すべきこと——要件の優先度や設計方針の選択——には人間が介在して、繰り返し的な作業——コード生成・コミットメッセージ・リリースノート——はツールに任せる、というバランスです。」

「このワークフローはChrome拡張機能に限らず、TypeScript・Reactのプロジェクト全般に使えます。」

「リポジトリのリンクは概要欄に貼っておきます。ぜひ参考にしてみてください。」

「見ていただきありがとうございました。」

---

## 補足：使用したAnthropicツール一覧

| フェーズ | ツール | カテゴリ |
|---|---|---|
| ガードレール | `hookify` | プラグイン |
| ガードレール | `security-guidance@claude-plugins-official` | プラグイン（フック） |
| ① 要件定義 | `doc-coauthoring` | スキル |
| ② 設計 | `feature-dev` | スキル |
| ③ デザイン | `frontend-design` | スキル |
| ④ 実装 | `feature-dev` | スキル |
| ⑤ コミット/PR | `commit-commands:commit-push-pr` | スキル |
| ⑥ レビュー | `pr-review-toolkit:review-pr` | スキル |
| ⑦ ドキュメント | `claude-md-management:revise-claude-md` + `internal-comms` | スキル |
