export interface FeedSource {
  label: string;
  url: string;
}

export const FEEDS: FeedSource[] = [
  { label: "r/ClaudeAI",   url: "https://www.reddit.com/r/ClaudeAI/.rss" },
  { label: "r/ChatGPT",    url: "https://www.reddit.com/r/ChatGPT/.rss" },
  { label: "r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/.rss" },
  { label: "r/artificial", url: "https://www.reddit.com/r/artificial/.rss" },
];
