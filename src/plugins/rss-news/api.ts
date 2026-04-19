import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "discord-bot-rss-news/1.0",
  },
});

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  snippet?: string;
}

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(url);
  return feed.items.map((item) => {
    const id = item.guid ?? item.id ?? item.link ?? item.title ?? "";
    return {
      id: String(id),
      title: (item.title ?? "(no title)").trim(),
      link: /^https?:\/\//i.test(item.link ?? "") ? (item.link ?? "") : "",
      pubDate: item.isoDate ?? item.pubDate,
      snippet: (item.contentSnippet ?? "").trim().slice(0, 200),
    };
  });
}
