import Parser from "rss-parser";
import fetch from "node-fetch";

const parser = new Parser({ timeout: 15000 });

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/rss+xml, application/xml, text/xml, */*",
};

export interface RedditPost {
  id: string;
  title: string;
  link: string;
  score: string;
  numComments: string;
  pubDate: string;
}

function parseContent(content: string): { score: string; numComments: string } {
  const scoreMatch = content.match(/(\d[\d,]*)\s*point/i);
  const commentMatch = content.match(/(\d[\d,]*)\s*comment/i);
  return {
    score: scoreMatch?.[1] ?? "",
    numComments: commentMatch?.[1] ?? "",
  };
}

export async function fetchSubreddit(url: string): Promise<RedditPost[]> {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`Reddit RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  return feed.items.map((item) => {
    const id = item.guid ?? item.id ?? item.link ?? "";
    const content = (item.content ?? item["content:encoded"] ?? "") as string;
    const { score, numComments } = parseContent(content);
    return {
      id: String(id),
      title: (item.title ?? "(no title)").trim(),
      link: item.link ?? "",
      score,
      numComments,
      pubDate: item.isoDate ?? item.pubDate ?? "",
    };
  });
}
