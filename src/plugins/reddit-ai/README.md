# reddit-ai プラグイン

Reddit の AI 関連サブレディットの新着投稿を取得し、タイトルを日本語翻訳して Discordに投稿します。

## 購読サブレディット

| サブレディット | 内容 |
|---|---|
| r/ClaudeAI | Claude AI に関する議論・情報 |
| r/ChatGPT | ChatGPT に関する議論・情報 |
| r/LocalLLaMA | ローカル LLM の話題 |
| r/artificial | AI 全般の話題 |

## 機能

- **自動投稿**: 毎朝 9:00 JST に `#reddit-ai` チャンネルへ新着投稿を送信
- **コマンド**: `/reddit-ai [subreddit]` でいつでも最新投稿を取得
- **翻訳**: MyMemory API を使い英語タイトルを日本語に自動翻訳

## 仕組み

- RSSフィード（`/r/xxx/.rss`）を `rss-parser` で取得
- `data/reddit-ai.json` で既読IDを管理し、新着のみ通知
- 初回実行時は記録のみ行い通知しない（既読なし扱いを防ぐ）
