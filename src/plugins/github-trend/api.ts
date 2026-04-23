import * as cheerio from "cheerio";
import fetch from "node-fetch";

export interface TrendingRepo {
  fullName: string;
  url: string;
  description: string;
  language: string;
  stars: string;
  todayStars: string;
}

export async function fetchTrending(): Promise<TrendingRepo[]> {
  const res = await fetch("https://github.com/trending", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub Trending fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  $("article.Box-row").each((_, el) => {
    const anchor = $(el).find("h2 a");
    const href = anchor.attr("href") ?? "";
    const fullName = href.replace(/^\//, "");
    const url = `https://github.com${href}`;
    const description = $(el).find("p").first().text().trim();
    const language = $(el).find('[itemprop="programmingLanguage"]').text().trim();
    const stars = $(el).find('a[href$="/stargazers"]').first().text().trim();
    const todayStars = $(el).find(".float-sm-right").text().replace(/\s+/g, " ").trim();

    if (fullName) {
      repos.push({ fullName, url, description, language, stars, todayStars });
    }
  });

  return repos;
}
