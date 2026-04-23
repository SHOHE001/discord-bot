# github-trend プラグイン

GitHub Trendingのトップリポジトリを取得してDiscordに投稿します。

## 機能

- **自動投稿**: 毎朝9:00 JSTに `#github-trend` チャンネルへトップ10を投稿
- **コマンド**: `/github-trend` でいつでも最新トレンドを取得

## 表示内容

各リポジトリについて以下を表示します：

- リポジトリ名（リンク付き）
- 言語（絵文字付き）
- 累計スター数
- 今日の増加スター数
- 説明文（80文字まで）

## 仕組み

`https://github.com/trending` をcheerioでスクレイピングして取得します。
追加パッケージは不要（cheerio・node-fetchを利用）。
