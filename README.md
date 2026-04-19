# Discord Bot

プラグイン方式で機能を自由に追加できる Discord Bot。
discord.js v14 + TypeScript 製。

## 🚀 デプロイ状態

**現在 Google Cloud Compute Engine で 24時間稼働中**
- **プラットフォーム**: Google Cloud (e2-micro, Ubuntu 22.04 LTS)
- **ランタイム**: Node.js v18.20.4
- **プロセス管理**: PM2（自動起動対応）
- **状態**: Online ✅

## 機能一覧

| プラグイン | コマンド | 定期実行 |
|-----------|---------|---------|
| weather | `/weather [city]` | 毎朝7:00 JST に天気を自動投稿 |
| manga-update | - | 毎日 8:00/20:00 JST にワンパンマン更新を通知 |
| rss-news | - | 毎日 8:00/20:00 JST にRSSニュース新着を通知（NHK主要/社会/政治/経済/国際、ITmedia IT/AI、Publickey） |

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、各値を入力する。

```bash
cp .env.example .env
```

| 変数名 | 説明 | 取得場所 |
|--------|------|---------|
| `DISCORD_TOKEN` | Bot のトークン | Discord Developer Portal → Bot |
| `DISCORD_CLIENT_ID` | Bot のアプリID | Discord Developer Portal → General Information |
| `DISCORD_GUILD_ID` | 開発用サーバーID（任意） | サーバーを右クリック → サーバーIDをコピー |
| `OWM_API_KEY` | OpenWeatherMap APIキー | openweathermap.org → My API Keys |
| `WEATHER_CHANNEL_ID` | 天気を自動投稿するチャンネルID | チャンネルを右クリック → チャンネルIDをコピー |
| `CITY` | デフォルト都市（例: Tokyo） | 任意 |

> **注意**: `DISCORD_GUILD_ID` を設定するとスラッシュコマンドが即時反映される（開発推奨）。未設定の場合はグローバル登録（最大1時間かかる）。

### 3. 起動

```bash
npm run dev
```

---

## デプロイ（Google Cloud）

### ローカル開発 → VM へのデプロイ

#### ローカル側: コード修正・push

```bash
cd discord-bot
# コード修正
git add .
git commit -m "機能追加: ○○"
git push origin main
```

#### VM 側: pull & 再起動

Google Cloud Web SSH で接続:

```bash
cd ~/discord-bot
git pull origin main
npm install  # 依存関係が変わった場合のみ
pm2 restart discord-bot

# ログ確認
pm2 logs discord-bot
```

#### ワンライナー版

```bash
cd ~/discord-bot && git pull && npm install && pm2 restart discord-bot && pm2 logs discord-bot
```

### デプロイスクリプト（VM に配置済み）

```bash
bash ~/deploy.sh
```

### トラブルシューティング

| 問題 | 対応 |
|------|------|
| Bot が offline | `pm2 restart discord-bot` |
| ログが見えない | `pm2 logs discord-bot` |
| 変更が反映されない | `git status` → `git pull` → `pm2 restart` |

詳細は `.company/secretary/notes/discord-bot-deploy.md` を参照。

---

## プロジェクト構成

```
discord-bot/
├── src/
│   ├── index.ts              # エントリーポイント
│   │                         # Client作成・コマンド登録・ログイン
│   │
│   ├── core/
│   │   ├── types.ts          # プラグインのインターフェース定義
│   │   ├── plugin-loader.ts  # src/plugins/ を自動スキャンして登録
│   │   └── channel-manager.ts # プラグイン別チャンネルの自動作成・管理
│   │
│   └── plugins/              # ここにプラグインを追加していく
│       └── weather/          # 天気プラグイン（実装例）
│           ├── README.md     # プラグイン仕様書
│           ├── index.ts      # PluginDefinition をexport（必須）
│           ├── commands.ts   # スラッシュコマンド定義
│           ├── cron.ts       # 定期実行ロジック
│           └── api.ts        # 外部API呼び出し
│
├── .env                      # 環境変数（Git管理外）
├── .env.example              # 環境変数のテンプレート
├── package.json
└── tsconfig.json
```

### コアの仕組み

起動時に `plugin-loader.ts` が `src/plugins/` 内のフォルダを自動スキャンし、各プラグインの `index.ts` を読み込む。

```
src/plugins/ を全スキャン
  └─ 各フォルダの index.ts を動的 import
       └─ PluginDefinition を取得
            ├─ commands      → スラッシュコマンドとして登録
            ├─ cronJobs      → node-cron でスケジュール登録
            ├─ onReady       → Bot起動時に実行
            └─ channelName   → 指定した名前のチャンネルを自動作成
```

**新しいプラグインを追加してもコアファイルの変更は不要。フォルダを追加して再起動するだけ。**

### チャンネル自動作成の仕組み

`channelName` を指定したプラグインは、Bot 起動時に `DISCORD_GUILD_ID` のサーバーへ自動でテキストチャンネルを作成する。
すでに同名チャンネルが存在する場合はそのまま使用する（重複作成しない）。

```
Bot 起動（clientReady）
  └─ channel-manager.ts が各プラグインの channelName を確認
       ├─ チャンネルが存在する → そのまま使用
       └─ チャンネルが存在しない → 自動作成 → channelId をキャッシュ
```

cronジョブやメッセージ送信時は `getPluginChannelId("plugin-name")` でチャンネルIDを取得できる。

---

## 新機能の追加方法（Jules向け）

### 基本手順

1. `src/plugins/` に新しいフォルダを作る
2. `index.ts` で `PluginDefinition` を `export default` する
3. Bot を再起動する → 自動で認識される

### プラグインの構造

最小構成（コマンドのみ）:

```
src/plugins/[plugin-name]/
├── README.md     # 仕様書（必須）
├── index.ts      # PluginDefinition export（必須）
└── commands.ts   # コマンド定義
```

フル構成（コマンド + 定期実行 + 外部API）:

```
src/plugins/[plugin-name]/
├── README.md
├── index.ts
├── commands.ts
├── cron.ts
└── api.ts
```

### PluginDefinition インターフェース

`src/core/types.ts` に定義されている。

```typescript
interface PluginDefinition {
  name: string;                    // プラグイン名（ログに表示）
  channelName?: string;            // 自動作成するチャンネル名（任意）
  commands?: PluginCommand[];      // スラッシュコマンド（任意）
  cronJobs?: PluginCronJob[];      // 定期実行タスク（任意）
  onReady?: (client: Client) => Promise<void>;  // 起動時フック（任意）
}

interface PluginCommand {
  data: SlashCommandBuilder;       // コマンド定義
  execute: (interaction) => Promise<void>;  // 実行処理
}

interface PluginCronJob {
  schedule: string;                // cron式（例: "0 7 * * *"）
  timezone?: string;               // タイムゾーン（デフォルト: Asia/Tokyo）
  execute: (client: Client) => Promise<void>;
}
```

### index.ts のテンプレート

```typescript
import type { PluginDefinition } from "../../core/types.js";
import { myCommand } from "./commands.js";
import { myJob } from "./cron.js";

const plugin: PluginDefinition = {
  name: "plugin-name",
  channelName: "チャンネル名",  // Bot起動時に自動作成（省略可）
  commands: [myCommand],
  cronJobs: [
    {
      schedule: "0 9 * * *",    // 毎朝9時
      timezone: "Asia/Tokyo",
      execute: myJob,
    },
  ],
};

export default plugin;
```

### README.md のテンプレート（プラグインごとに作成）

```markdown
# [プラグイン名]

## 概要
何をするプラグインか

## スラッシュコマンド
| コマンド | 引数 | 説明 |
|---------|------|------|
| `/command` | `arg`（任意）| 説明 |

## 定期実行
- cron式: `0 7 * * *`（毎朝7:00 JST）
- 動作: 説明

## 環境変数
| 変数名 | 必須 | 説明 |
|--------|------|------|
| `VAR_NAME` | ✅ | 説明 |

## 依存パッケージ
- なし（or 追加パッケージ名）

## PluginDefinition
src/core/types.ts の PluginDefinition に準拠。
index.ts から export default すること。
```

### 実装例: 既存の weather プラグインを参考にする

新機能を追加する際は `src/plugins/weather/` を雛形として使うこと。

```
Julesへの指示例:
「src/plugins/weather/ を参考に、src/plugins/reminder/ を作ってください。
 /remind [時間] [メッセージ] コマンドで、指定時間後にメンションで通知する機能です。」
```

### よくある実装パターン

**外部APIを叩く場合（api.ts）**

```typescript
export async function fetchSomething(): Promise<SomeData> {
  const apiKey = process.env.SOME_API_KEY;
  if (!apiKey) throw new Error("SOME_API_KEY が設定されていません");

  const res = await fetch(`https://api.example.com/data?key=${apiKey}`);
  if (!res.ok) throw new Error(`API エラー: ${res.status}`);

  return (await res.json()) as SomeData;
}
```

**Embed メッセージを送る（commands.ts）**

```typescript
const embed = new EmbedBuilder()
  .setColor(0x4895ef)
  .setTitle("タイトル")
  .setDescription("説明文")
  .addFields({ name: "フィールド名", value: "値", inline: true })
  .setTimestamp();

await interaction.reply({ embeds: [embed] });
```

**定期的にチャンネルへ投稿する（cron.ts）**

`channelName` を設定していれば `getPluginChannelId` で自動取得できる。

```typescript
import { getPluginChannelId } from "../../core/channel-manager.js";

export async function myJob(client: Client): Promise<void> {
  // channel-manager で自動作成されたチャンネルIDを取得
  const channelId = getPluginChannelId("plugin-name");
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId);
  if (!(channel instanceof TextChannel)) return;

  await channel.send("定期メッセージ");
}
```

---

## 追加予定のプラグインアイデア

| プラグイン名 | 概要 |
|-------------|------|
| `manga` | Web漫画の更新通知（RSS/スクレイピング） |
| `tasks` | タスク管理（/task add, /task list, /task done） |
| `reminder` | リマインダー（/remind 30m 〇〇） |
| `weather-weekly` | 週間天気予報 |
