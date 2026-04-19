import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { getPluginChannelId } from "../../core/channel-manager.js";
import { FEEDS, type FeedSource } from "./feeds.js";
import { fetchFeed, type FeedItem } from "./api.js";

const DATA_DIR = resolve(process.cwd(), "data");
const STATE_FILE_PATH = resolve(DATA_DIR, "rss-news.json");
const MAX_SEEN_IDS = 200;
const MAX_ITEMS_PER_FEED = 5;

interface FeedState {
  seenIds: string[];
  lastUpdated: string;
}

type StateMap = Record<string, FeedState>;

async function loadState(): Promise<StateMap> {
  try {
    const raw = await fs.readFile(STATE_FILE_PATH, "utf-8");
    return JSON.parse(raw) as StateMap;
  } catch (err: any) {
    if (err.code === "ENOENT") return {};
    console.error("[rss-news] 状態ファイルの読み込みに失敗:", err);
    throw err;
  }
}

async function saveState(state: StateMap): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

function buildEmbed(source: FeedSource, items: FeedItem[], totalNew: number): EmbedBuilder {
  const lines = items.map((item) => {
    const date = item.pubDate ? ` _(${formatDate(item.pubDate)})_` : "";
    const snippet = item.snippet ? `\n${item.snippet}` : "";
    return `• **[${item.title}](${item.link})**${date}${snippet}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`📰 ${source.label}`)
    .setURL(source.url)
    .setDescription(lines.join("\n\n").slice(0, 4000))
    .setColor(0x2b8cee);

  if (totalNew > items.length) {
    embed.setFooter({ text: `ほか ${totalNew - items.length} 件の新着` });
  }
  return embed;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
}

export async function checkRssFeeds(client: Client): Promise<void> {
  const channelId = getPluginChannelId("rss-news");
  if (!channelId) {
    console.warn("[rss-news] チャンネルIDが取得できませんでした");
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!(channel instanceof TextChannel)) {
    console.warn("[rss-news] テキストチャンネルを取得できませんでした");
    return;
  }

  const state = await loadState();
  const nextState: StateMap = { ...state };
  const now = new Date().toISOString();

  for (const source of FEEDS) {
    try {
      const items = await fetchFeed(source.url);
      if (items.length === 0) {
        console.log(`[rss-news] ${source.label}: アイテムなし`);
        continue;
      }

      const prev = state[source.url];
      const allIds = items.map((i) => i.id).filter(Boolean);

      if (!prev) {
        console.log(`[rss-news] ${source.label}: 初回のため通知スキップ（${allIds.length}件を記録）`);
        nextState[source.url] = {
          seenIds: allIds.slice(0, MAX_SEEN_IDS),
          lastUpdated: now,
        };
        continue;
      }

      const seen = new Set(prev.seenIds);
      const newItems = items.filter((item) => item.id && !seen.has(item.id));

      if (newItems.length === 0) {
        console.log(`[rss-news] ${source.label}: 新着なし`);
        continue;
      }

      const embed = buildEmbed(source, newItems.slice(0, MAX_ITEMS_PER_FEED), newItems.length);
      await channel.send({ embeds: [embed] });
      console.log(`[rss-news] ${source.label}: ${newItems.length}件通知`);

      const mergedIds = [...allIds, ...prev.seenIds];
      const uniqueIds = Array.from(new Set(mergedIds)).slice(0, MAX_SEEN_IDS);
      nextState[source.url] = { seenIds: uniqueIds, lastUpdated: now };
    } catch (err) {
      console.error(`[rss-news] ${source.label} (${source.url}) の処理に失敗:`, err);
    }
  }

  try {
    await saveState(nextState);
  } catch (err) {
    console.error("[rss-news] 状態ファイルの保存に失敗:", err);
  }
}
