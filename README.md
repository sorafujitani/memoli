# memoli

CLIでMarkdownメモを管理するツール。日報やメモを `~/.memoli` 配下で一元管理します。

## インストール

### Homebrew (macOS / Linux)

```bash
brew tap fs0414/memoli
brew install memoli
```

### npm

```bash
npm install -g @fs0414/memoli
```

## 機能とコマンド

### 初期化

```bash
memoli init
```

`~/.memoli` 配下に必要なディレクトリを作成します:

- `reports/` - 日報
- `temp/` - テンプレート
- `memo/` - 通常メモ

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
memoli range 2026-01-09 2026-01-12    # 日付範囲のメモを作成・開く
memoli range 2026-01-09 2026-01-12 -t vacation  # テンプレートを使用
```

- 範囲メモは `~/.memoli/reports/YYYY-MM/YYYY-MM-DD_YYYY-MM-DD.md` に保存されます
- 範囲内の日付で `memoli today` を実行すると、自動的に範囲ファイルを開きます
- 範囲内の日付で `memoli daily` を実行すると、範囲ファイルが存在することを通知します

### メモ

```bash
memoli memo <name>        # メモを作成/編集
```

- メモは `~/.memoli/memo/<name>.md` に保存されます
- 既存のメモがある場合はエディタで開きます

### ヘルプ

```bash
memoli --help
memoli --version
```

## 開発

### 技術構成

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Type Checker**: [@typescript/native-preview](https://github.com/nicolo-ribaudo/native-typescript) (tsgo)
- **Linter**: oxlint
- **Formatter**: oxfmt

### コマンド

```bash
bun run typecheck   # 型チェック
bun test            # テスト実行
bun run lint        # リント
bun run fmt         # フォーマット
```

### ディレクトリ構成

```
~/.memoli/
├── reports/          # 日報・範囲メモ
│   └── YYYY-MM/
│       ├── YYYY-MM-DD.md              # 日報
│       └── YYYY-MM-DD_YYYY-MM-DD.md   # 範囲メモ
├── temp/             # テンプレート
│   └── <name>.md
└── memo/             # 通常メモ
    └── <name>.md
```

## ライセンス

MIT
