import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { getPluginChannelId } from "../../core/channel-manager.js";
import { FEEDS, type FeedSource } from "./feeds.js";
import { fetchSubreddit, type RedditPost } from "./api.js";
import { translateAll } from "./translate.js";

const DATA_DIR = resolve(process.cwd(), "data");
const STATE_FILE_PATH = resolve(DATA_DIR, "reddit-ai.json");
const MAX_SEEN_IDS = 300;
const MAX_POSTS_PER_FEED = 5;

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
    console.error("[reddit-ai] 状態ファイルの読み込みに失敗。空で続行します:", err);
    return {};
  }
}

async function saveState(state: StateMap): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpPath = `${STATE_FILE_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), "utf-8");
  await fs.rename(tmpPath, STATE_FILE_PATH);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
}

export function buildEmbed(source: FeedSource, posts: RedditPost[], translatedTitles: string[]): EmbedBuilder {
  const lines = posts.map((post, i) => {
    const jaTitle = translatedTitles[i] ?? post.title;
    const date = post.pubDate ? ` _(${formatDate(post.pubDate)})_` : "";
    const meta: string[] = [];
    if (post.score) meta.push(`⬆️ ${post.score}`);
    if (post.numComments) meta.push(`💬 ${post.numComments}`);
    const metaStr = meta.length > 0 ? ` · ${meta.join(" · ")}` : "";
    return `• **[${jaTitle}](${post.link})**${metaStr}${date}`;
  });

  return new EmbedBuilder()
    .setTitle(`📡 ${source.label} 新着`)
    .setURL(source.url.replace("/.rss", ""))
    .setDescription(lines.join("\n\n"))
    .setColor(0xff4500)
    .setTimestamp();
}

export async function postRedditAI(client: Client): Promise<void> {
  const channelId = getPluginChannelId("reddit-ai");
  if (!channelId) {
    console.warn("[reddit-ai] チャンネルIDが取得できませんでした");
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!(channel instanceof TextChannel)) {
    console.warn("[reddit-ai] テキストチャンネルを取得できませんでした");
    return;
  }

  const state = await loadState();
  const nextState: StateMap = { ...state };
  const now = new Date().toISOString();

  const results = await Promise.allSettled(
    FEEDS.map(async (source) => {
      const posts = await fetchSubreddit(source.url);
      return { source, posts };
    })
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      console.error(`[reddit-ai] ${FEEDS[i].label} フィード取得失敗:`, result.reason);
      continue;
    }

    const { source, posts } = result.value;
    if (posts.length === 0) continue;

    const allIds = posts.map((p) => p.id).filter(Boolean);
    const prev = state[source.url];

    if (!prev) {
      console.log(`[reddit-ai] ${source.label}: 初回のため通知スキップ（${allIds.length}件を記録）`);
      nextState[source.url] = { seenIds: allIds.slice(0, MAX_SEEN_IDS), lastUpdated: now };
      continue;
    }

    const seen = new Set(prev.seenIds);
    const newPosts = posts.filter((p) => p.id && !seen.has(p.id));

    if (newPosts.length === 0) {
      console.log(`[reddit-ai] ${source.label}: 新着なし`);
      continue;
    }

    const top = newPosts.slice(0, MAX_POSTS_PER_FEED);
    const translatedTitles = await translateAll(top.map((p) => p.title));
    const embed = buildEmbed(source, top, translatedTitles);

    const sent = await channel.send({ embeds: [embed] }).catch((err: unknown) => {
      console.error(`[reddit-ai] ${source.label} Discord送信失敗:`, err);
      return null;
    });

    if (sent) {
      const mergedIds = Array.from(new Set([...allIds, ...prev.seenIds])).slice(0, MAX_SEEN_IDS);
      nextState[source.url] = { seenIds: mergedIds, lastUpdated: now };
      console.log(`[reddit-ai] ${source.label}: ${newPosts.length}件通知`);
    }
  }

  await saveState(nextState).catch((err: unknown) => {
    console.error("[reddit-ai] 状態ファイルの保存に失敗:", err);
  });
}
