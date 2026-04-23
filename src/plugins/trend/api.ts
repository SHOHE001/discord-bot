import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  },
});

export interface TrendItem {
  title: string;
  link: string;
  pubDate?: string;
}

export async function fetchTogetterHot(): Promise<TrendItem[]> {
  const feed = await parser.parseURL("https://togetter.com/rss/hot");
  return feed.items.map((item) => ({
    title: (item.title ?? "(タイトルなし)").trim(),
    link: item.link ?? "",
    pubDate: item.isoDate ?? item.pubDate,
  }));
}
