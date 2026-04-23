import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { Client, TextChannel } from "discord.js";
import { getPluginChannelId } from "../../core/channel-manager.js";
import { fetchUpdateText, SITE_URL } from "./api.js";

const DATA_DIR = resolve(process.cwd(), "data");
const STATE_FILE_PATH = resolve(DATA_DIR, "manga-update.txt");
const NOTIFIED_DATE_PATH = resolve(DATA_DIR, "manga-update-notified-date.txt");

function todayJST(): string {
  return new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

async function getChannel(client: Client): Promise<TextChannel | null> {
  const channelId = getPluginChannelId("manga-update");
  if (!channelId) {
    console.warn("[manga-update] チャンネルIDが取得できませんでした");
    return null;
  }
  const channel = await client.channels.fetch(channelId).catch(() => null);
  return channel instanceof TextChannel ? channel : null;
}

export async function checkMangaUpdate(client: Client): Promise<void> {
  const updateText = await fetchUpdateText();
  if (!updateText) {
    console.warn("[manga-update] 更新テキストの取得に失敗しました");
    return;
  }

  let previousUpdateText = "";
  try {
    previousUpdateText = await fs.readFile(STATE_FILE_PATH, "utf-8");
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.error("[manga-update] 状態ファイルの読み込みに失敗:", err);
      return;
    }
  }

  if (!previousUpdateText) {
    console.log("[manga-update] 初回実行。現在の状態を保存します。");
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STATE_FILE_PATH, updateText, "utf-8");
    return;
  }

  if (updateText === previousUpdateText) {
    console.log("[manga-update] 更新はありませんでした");
    return;
  }

  console.log(`[manga-update] 更新を検知: ${previousUpdateText} -> ${updateText}`);

  const channel = await getChannel(client);
  if (!channel) return;

  try {
    await channel.send(`ワンパンマン（原作）が更新されました！\n${updateText}\n${SITE_URL}`);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STATE_FILE_PATH, updateText, "utf-8");
    await fs.writeFile(NOTIFIED_DATE_PATH, todayJST(), "utf-8");
  } catch (err) {
    console.error("[manga-update] 通知の送信または状態ファイルの保存に失敗:", err);
  }
}

export async function sendNoUpdateIfNeeded(client: Client): Promise<void> {
  const today = todayJST();

  let lastNotifiedDate = "";
  try {
    lastNotifiedDate = await fs.readFile(NOTIFIED_DATE_PATH, "utf-8");
  } catch {
    // ファイルがない = 一度も更新通知していない
  }

  if (lastNotifiedDate.trim() === today) {
    console.log("[manga-update] 本日は更新通知済みのため、未更新メッセージをスキップ");
    return;
  }

  console.log("[manga-update] 本日更新なし → 未更新メッセージを送信");
  const channel = await getChannel(client);
  if (!channel) return;

  await channel.send("今日の更新はありませんでした、、、").catch((err: unknown) => {
    console.error("[manga-update] 未更新メッセージの送信に失敗:", err);
  });
}
