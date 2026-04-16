# weather プラグイン

## 概要

OpenWeatherMap APIを使って天気予報を提供するプラグイン。
- スラッシュコマンドで任意の都市の天気を確認
- 毎朝7:00 JSTに指定チャンネルへ自動投稿

## スラッシュコマンド

| コマンド | 引数 | 説明 |
|---------|------|------|
| `/weather` | `city`（任意）| 天気Embedを返す。省略時は `CITY` env変数の都市 |

## 定期実行

- cron式: `0 7 * * *`（毎朝7:00）
- タイムゾーン: `Asia/Tokyo`
- 動作: `WEATHER_CHANNEL_ID` のチャンネルに天気Embedを投稿

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `OWM_API_KEY` | ✅ | OpenWeatherMap APIキー |
| `WEATHER_CHANNEL_ID` | ✅ | 毎朝の自動投稿先チャンネルID |
| `CITY` | 任意 | デフォルト都市名（デフォルト: Tokyo） |

## 依存パッケージ

追加パッケージなし。coredeps (discord.js, node-cron) のみ。

## ファイル構成

```
weather/
├── README.md      # この仕様書
├── index.ts       # PluginDefinition export（エントリーポイント）
├── commands.ts    # /weather スラッシュコマンド
├── cron.ts        # 毎朝7時の自動投稿ロジック
└── api.ts         # OpenWeatherMap API ラッパー
```

## PluginDefinition

`../../core/types.ts` の `PluginDefinition` インターフェースに準拠。
`index.ts` からdefault exportすること。
