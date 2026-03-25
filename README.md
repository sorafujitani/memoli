# memoli

CLIでMarkdownメモとタスクを管理するツール。日報・メモ・タスクを `~/.memoli` 配下で一元管理し、MCP サーバーとして AI エージェントにデータを公開します。

## インストール

### Homebrew (macOS / Linux)

```bash
brew tap sorafujitani/memoli
brew install memoli
```

### npm

```bash
npm install -g @sorafujitani/memoli
```

インストール後、初期化を実行してディレクトリを作成します:

```bash
memoli init
```

## MCP サーバー

memoli の主要なユースケースは **MCP (Model Context Protocol) サーバー**としての利用です。`memoli serve` を起動すると、Claude Desktop・Claude Code・Cursor などの MCP 対応クライアントから日報・メモ・タスクの読み書きが可能になります。

```bash
memoli serve
```

プロトコルは JSON-RPC over stdio で、MCP spec `2024-11-05` に準拠しています。

### クライアント設定

#### Claude Desktop

`claude_desktop_config.json` に以下を追加します:

```json
{
  "mcpServers": {
    "memoli": {
      "command": "memoli",
      "args": ["serve"]
    }
  }
}
```

> 設定ファイルの場所:
>
> - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
> - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

#### Claude Code

プロジェクトの `.claude/settings.json` またはグローバルの `~/.claude/settings.json` に追加:

```json
{
  "mcpServers": {
    "memoli": {
      "command": "memoli",
      "args": ["serve"]
    }
  }
}
```

#### Cursor

Cursor の設定 (`~/.cursor/mcp.json`) に追加:

```json
{
  "mcpServers": {
    "memoli": {
      "command": "memoli",
      "args": ["serve"]
    }
  }
}
```

#### その他の MCP クライアント

stdio ベースの MCP サーバーに対応している任意のクライアントで利用できます。コマンドは `memoli`、引数は `["serve"]` を指定してください。

### 提供ツール

MCP サーバーは以下の 8 つのツールを公開します。

#### タスク操作

| ツール        | 説明              | 必須パラメータ | 任意パラメータ                                           |
| ------------- | ----------------- | -------------- | -------------------------------------------------------- |
| `task_add`    | タスクを追加      | `title`        | `priority`, `tags`, `dueDate`, `memo`                    |
| `task_list`   | タスク一覧を取得  | —              | `status`, `tag`, `dueDate`                               |
| `task_get`    | ID でタスクを取得 | `id`           | —                                                        |
| `task_update` | タスクを更新      | `id`           | `title`, `status`, `priority`, `tags`, `dueDate`, `memo` |
| `task_remove` | タスクを削除      | `id`           | —                                                        |

#### 日報・メモ操作

| ツール       | 説明           | 必須パラメータ | 任意パラメータ                        |
| ------------ | -------------- | -------------- | ------------------------------------- |
| `daily_read` | 日報を読み取り | —              | `date` (YYYY-MM-DD, デフォルト: 今日) |
| `memo_read`  | メモを読み取り | `name`         | —                                     |
| `memo_list`  | メモ名の一覧   | —              | —                                     |

### ツール詳細

#### `task_add`

新しいタスクを作成します。

```
入力:
  title: string (必須)       — タスクのタイトル
  priority: string           — "high" / "medium" / "low"
  tags: string[]             — タグの配列
  dueDate: string            — 期日 (YYYY-MM-DD)
  memo: string               — 関連するメモ名

出力: Task オブジェクト (JSON)
```

#### `task_list`

タスクの一覧を取得します。フィルタを指定しない場合は全タスクを返します。

```
入力:
  status: string[]           — フィルタするステータス ["todo", "doing", "done", "blocked"]
  tag: string                — タグでフィルタ
  dueDate: string            — 期日でフィルタ (YYYY-MM-DD)

出力: Task[] (JSON 配列)
```

#### `task_get`

ID を指定してタスクを 1 件取得します。ID は前方一致で検索されるため、先頭の数文字だけでも指定できます (例: `"a1b2"` → `"a1b2c3d4"` にマッチ)。

```
入力:
  id: string (必須)          — タスク ID (部分一致可)

出力: Task オブジェクト (JSON)
```

#### `task_update`

タスクのプロパティやステータスを更新します。`status` を指定するとステータスのみを変更し、それ以外のフィールドを指定するとプロパティを更新します。

```
入力:
  id: string (必須)          — タスク ID
  title: string              — 新しいタイトル
  status: string             — "todo" / "doing" / "done" / "blocked"
  priority: string           — "high" / "medium" / "low"
  tags: string[]             — タグの配列
  dueDate: string            — 期日 (YYYY-MM-DD)
  memo: string               — 関連するメモ名

出力: 更新後の Task オブジェクト (JSON)
```

#### `task_remove`

タスクを削除します。

```
入力:
  id: string (必須)          — タスク ID

出力: 削除された Task オブジェクト (JSON)
```

#### `daily_read`

日報ファイルの内容を読み取ります。日付を省略すると今日の日報を返します。

```
入力:
  date: string               — 日付 (YYYY-MM-DD, デフォルト: 今日)

出力: { path: string, content: string }
```

#### `memo_read`

指定した名前のメモファイルを読み取ります。

```
入力:
  name: string (必須)        — メモ名 (.md 拡張子なし)

出力: { path: string, content: string }
```

#### `memo_list`

保存されている全メモの名前一覧を返します。

```
入力: なし

出力: { memos: string[] }
```

### Task オブジェクト

各タスクツールが返す JSON オブジェクトの構造:

```json
{
  "id": "a1b2c3d4",
  "title": "READMEを書く",
  "status": "doing",
  "priority": "high",
  "tags": ["docs", "oss"],
  "dueDate": "2026-04-01",
  "memo": "readme-draft",
  "dailyRef": "2026-03-25",
  "createdAt": "2026-03-25T10:00:00.000Z",
  "updatedAt": "2026-03-25T12:30:00.000Z",
  "blockedBy": []
}
```

| フィールド  | 型                                            | 説明                          |
| ----------- | --------------------------------------------- | ----------------------------- |
| `id`        | string                                        | 8文字の hex ID                |
| `title`     | string                                        | タスクのタイトル              |
| `status`    | `"todo"` / `"doing"` / `"done"` / `"blocked"` | 状態                          |
| `priority`  | `"high"` / `"medium"` / `"low"`               | 優先度（任意）                |
| `tags`      | string[]                                      | タグ（任意）                  |
| `dueDate`   | string                                        | 期日 YYYY-MM-DD（任意）       |
| `memo`      | string                                        | 関連メモ名（任意）            |
| `dailyRef`  | string                                        | 関連日報の日付（任意）        |
| `blockedBy` | string[]                                      | ブロッカーのタスク ID（任意） |
| `createdAt` | string                                        | 作成日時 (ISO 8601)           |
| `updatedAt` | string                                        | 更新日時 (ISO 8601)           |

### エラーレスポンス

ツールでエラーが発生した場合、`isError: true` を含むレスポンスが返されます:

```json
{
  "content": [{ "type": "text", "text": "Task not found: abc123" }],
  "isError": true
}
```

主なエラーメッセージ:

| メッセージ                         | 原因                                 |
| ---------------------------------- | ------------------------------------ |
| `Task not found: <id>`             | 指定した ID にマッチするタスクがない |
| `title is required`                | `task_add` で title が未指定         |
| `Memo not found: <name>`           | 指定した名前のメモが存在しない       |
| `Daily file not found for: <date>` | 指定した日付の日報が存在しない       |
| `Unknown tool: <name>`             | 存在しないツール名が呼ばれた         |

### AI エージェントとの連携例

MCP ツールを通じて、AI エージェントは以下のようなワークフローを実行できます:

- **日次レビュー**: `daily_read` で今日の日報を読み、`task_list` で未完了タスクを確認し、進捗のサマリーを生成
- **タスクの自動整理**: `task_list` で全タスクを取得し、期限切れや長期間 `doing` のタスクを検出して通知
- **メモの横断検索**: `memo_list` + `memo_read` で関連メモを探し、タスクと紐づけて情報を整理
- **作業の記録**: コード修正後に `task_update` でステータスを `done` に変更し、次のタスクを `doing` に更新

## CLI コマンド

MCP サーバー以外に、ターミナルから直接使う CLI コマンドも提供しています。

### コマンド一覧

| コマンド                                     | 説明                       |
| -------------------------------------------- | -------------------------- |
| `memoli init`                                | ディレクトリを初期化       |
| `memoli daily [-t <template>]`               | 今日の日報ファイルを作成   |
| `memoli today`                               | 今日の日報をエディタで開く |
| `memoli memo <name>`                         | メモを作成/編集            |
| `memoli range <start> <end> [-t <template>]` | 日付範囲メモを作成/開く    |
| `memoli task [subcommand]`                   | タスク管理                 |
| `memoli serve`                               | MCP サーバーを起動 (stdio) |

### 日報

```bash
memoli daily              # 今日の日報ファイルを作成
memoli daily -t work      # テンプレートを使用して作成
memoli today              # 今日の日報をエディタで開く
```

- 日報は `~/.memoli/reports/YYYY-MM/YYYY-MM-DD.md` に保存されます
- `-t` オプションで `~/.memoli/temp/<name>.md` をテンプレートとして使用できます
- `today` は `$EDITOR` 環境変数で指定されたエディタを使用します（デフォルト: vi）

### 日付範囲メモ

連休や長期休暇など、複数日を1つのファイルで管理したい場合に使用します。

```bash
memoli range 2026-01-09 2026-01-12            # 日付範囲のメモを作成・開く
memoli range 2026-01-09 2026-01-12 -t vacation  # テンプレートを使用
```

- 範囲メモは `~/.memoli/reports/YYYY-MM/YYYY-MM-DD_YYYY-MM-DD.md` に保存されます
- 範囲内の日付で `memoli today` を実行すると、自動的に範囲ファイルを開きます

### メモ

```bash
memoli memo <name>        # メモを作成/編集
```

- メモは `~/.memoli/memo/<name>.md` に保存されます
- 既存のメモがある場合はエディタで開きます

### タスク管理

```bash
# 一覧表示
memoli task                     # アクティブなタスク (todo/doing/blocked) を表示
memoli task --all               # 完了済みも含めて全タスクを表示
memoli task --status doing      # ステータスでフィルタ
memoli task --tag work          # タグでフィルタ
memoli task --due today         # 期日でフィルタ

# タスク追加
memoli task add "READMEを書く"
memoli task add "レビュー対応" --priority high --tag work,review --due 2026-04-01

# ステータス変更
memoli task doing <id>          # 進行中にする
memoli task done <id>           # 完了にする
memoli task block <id>          # ブロック中にする
memoli task todo <id>           # 未着手に戻す

# 詳細表示・編集・削除
memoli task show <id>           # 詳細を表示
memoli task edit <id> --title "新しいタイトル" --priority low
memoli task rm <id>             # 削除

# JSON 出力 (スクリプト連携用)
memoli task --json
memoli task add "タスク" --json
```

## データ構造

```
~/.memoli/
├── reports/          # 日報・範囲メモ
│   └── YYYY-MM/
│       ├── YYYY-MM-DD.md              # 日報
│       └── YYYY-MM-DD_YYYY-MM-DD.md   # 範囲メモ
├── temp/             # テンプレート
│   └── <name>.md
├── memo/             # 通常メモ
│   └── <name>.md
└── tasks.json        # タスクストア
```

`tasks.json` は以下の形式で保存されます:

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "a1b2c3d4",
      "title": "タスクのタイトル",
      "status": "todo",
      "createdAt": "2026-03-25T10:00:00.000Z",
      "updatedAt": "2026-03-25T10:00:00.000Z"
    }
  ]
}
```

## 開発

### 技術構成

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Toolchain**: [Vite+](https://github.com/nicolo-ribaudo/vite-plus) (`vp` CLI) - lint, format, typecheck, test を統合
- **Validation**: [valibot](https://valibot.dev) - スキーマ定義とバリデーション
- **Type Checker**: [@typescript/native-preview](https://github.com/nicolo-ribaudo/native-typescript) (tsgo)
- **Linter**: oxlint
- **Formatter**: oxfmt

### コマンド

```bash
vp check              # Format + Lint + Type check (1パス)
vp test               # テスト実行 (vitest)
vp lint               # リント
vp fmt                # フォーマット
bun run build         # ビルド (ネイティブバイナリ生成)
bun run release       # リリース
```

### Nix / direnv

Nix flake による開発環境が用意されています。[direnv](https://direnv.net/) を使うと `cd` するだけで環境がアクティベートされます。

```bash
direnv allow    # 初回のみ
```

## ライセンス

MIT
