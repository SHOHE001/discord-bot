export interface FeedSource {
  label: string;
  url: string;
}

export const FEEDS: FeedSource[] = [
  { label: "主要ニュース", url: "https://www.nhk.or.jp/rss/news/cat0.xml" },
  { label: "社会", url: "https://www.nhk.or.jp/rss/news/cat1.xml" },
  { label: "政治", url: "https://www.nhk.or.jp/rss/news/cat4.xml" },
  { label: "経済", url: "https://www.nhk.or.jp/rss/news/cat5.xml" },
  { label: "国際", url: "https://www.nhk.or.jp/rss/news/cat6.xml" },
  { label: "IT", url: "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml" },
  { label: "AI", url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml" },
  { label: "技術ブログ", url: "https://www.publickey1.jp/atom.xml" },
];
