import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { getPluginChannelId } from "../../core/channel-manager.js";
import { AUTO_FEEDS as FEEDS, type FeedSource } from "./feeds.js";
import { fetchFeed, type FeedItem } from "./api.js";

const DATA_DIR = resolve(process.cwd(), "data");
const STATE_FILE_PATH = resolve(DATA_DIR, "rss-news.json");
const MAX_SEEN_IDS = 500;
const MAX_ITEMS_PER_FEED = 5;
const EMBED_DESCRIPTION_LIMIT = 4000;

interface FeedState {
  seenIds: string[];
  lastUpdated: string;
}

type StateMap = Record<string, FeedState>;

async function loadState(): Promise<StateMap> {
  try {
    const raw = await fs.readFile(STATE_FILE_PATH, "utf-8");
    return JSON.parse(raw) as StateMap;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    console.error("[rss-news] 状態ファイルの読み込みに失敗。空で続行します:", err);
    return {};
  }
}

async function saveState(state: StateMap): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpPath = `${STATE_FILE_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), "utf-8");
  await fs.rename(tmpPath, STATE_FILE_PATH);
}

function buildEmbed(source: FeedSource, items: FeedItem[], totalNew: number): EmbedBuilder {
  let description = "";
  for (const item of items) {
    const date = item.pubDate ? ` _(${formatDate(item.pubDate)})_` : "";
    const safeTitle = item.title.replace(/[[\]()]/g, "\\$&");
    const safeSnippet = item.snippet
      ? `\n${item.snippet.replace(/[[\]()]/g, "\\$&")}`
      : "";
    const line = `• **[${safeTitle}](${item.link})**${date}${safeSnippet}\n\n`;
    if ((description + line).length > EMBED_DESCRIPTION_LIMIT - 50) {
      if (description === "") {
        description = line.slice(0, EMBED_DESCRIPTION_LIMIT - 50) + "...(以下略)";
      } else {
        description += "...(以下略)";
      }
      break;
    }
    description += line;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📰 ${source.label}`)
    .setURL(source.url)
    .setDescription(description.trim() || "(新着なし)")
    .setColor(0x2b8cee);

  if (totalNew > items.length) {
    embed.setFooter({ text: `ほか ${totalNew - items.length} 件の新着` });
  }
  return embed;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "日時不明";
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

  const results = await Promise.allSettled(
    FEEDS.map(async (source) => {
      const items = await fetchFeed(source.url);
      return { source, items };
    })
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      console.error(`[rss-news] ${FEEDS[i].label} フィード取得失敗:`, result.reason);
      continue;
    }

    const { source, items } = result.value;
    if (items.length === 0) {
      console.log(`[rss-news] ${source.label}: アイテムなし`);
      continue;
    }

    const prev = state[source.url];
    const allIds = Array.from(new Set(items.map((item) => item.id).filter((id): id is string => Boolean(id))));

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
    const sent = await channel.send({ embeds: [embed] }).catch((err: unknown) => {
      console.error(`[rss-news] ${source.label} Discord送信失敗:`, err);
      return null;
    });

    if (sent) {
      const mergedIds = Array.from(new Set([...allIds, ...prev.seenIds])).slice(0, Math.max(MAX_SEEN_IDS, allIds.length));
      nextState[source.url] = { seenIds: mergedIds, lastUpdated: now };
      console.log(`[rss-news] ${source.label}: ${newItems.length}件通知`);
    }
  }

  await saveState(nextState).catch((err: unknown) => {
    console.error("[rss-news] 状態ファイルの保存に失敗:", err);
  });
}
