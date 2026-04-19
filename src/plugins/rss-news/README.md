# RSS News Plugin

## 概要
複数のRSSフィードを購読し、前回通知以降の新着記事のみを `rss-news` チャンネルへEmbedで投稿するプラグイン。

## 定期実行
- cron式: `0 8,20 * * *`（毎日 8:00, 20:00 JST）
- 初回実行時は通知せず、現在の記事IDを `data/rss-news.json` に保存するだけ（大量投稿防止）。
- 以降は保存済みIDに無い記事のみを新着として通知。

## 購読カテゴリ

| カテゴリ | ソース | URL |
|---------|--------|-----|
| 主要ニュース | NHK | https://www.nhk.or.jp/rss/news/cat0.xml |
| 社会（事件・事故） | NHK | https://www.nhk.or.jp/rss/news/cat1.xml |
| 政治 | NHK | https://www.nhk.or.jp/rss/news/cat4.xml |
| 経済 | NHK | https://www.nhk.or.jp/rss/news/cat5.xml |
| 国際 | NHK | https://www.nhk.or.jp/rss/news/cat6.xml |
| IT | ITmedia NEWS | https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml |
| AI | ITmedia AI＋ | https://rss.itmedia.co.jp/rss/2.0/aiplus.xml |
| 技術ブログ | Publickey | https://www.publickey1.jp/atom.xml |

フィード追加・削除は `feeds.ts` を編集。

## 環境変数
不要。

## 依存パッケージ
- `rss-parser`

## チャンネル
自動で `rss-news` チャンネルを作成します。

## 通知フォーマット
カテゴリごとに1つのEmbed。タイトル・リンク・公開日時・本文の抜粋（200文字まで）を表示。1通知あたりカテゴリごと最大5件、残件数はfooterに表示。

## 実装上の注意点

- **状態ファイルの復旧**: `data/rss-news.json` が破損・空だった場合、パースに失敗しても空状態で続行し次回から正常動作する。
- **Discord送信失敗時**: 送信に失敗した記事はseenIdsに記録しないため、次回実行時に再通知される（通知漏れを防ぐ）。
- **seenIdsの上限**: 通常は最大500件を保持。フィードのアイテム数が500を超える場合は全件を保持する（重複通知防止）。
- **フィード取得**: 8カテゴリを並列取得。1カテゴリが失敗しても他は続行する。
