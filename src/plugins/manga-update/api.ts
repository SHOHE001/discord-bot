import * as cheerio from "cheerio";
import fetch from "node-fetch";

export const SITE_URL = "http://galaxyheavyblow.web.fc2.com/";

/**
 * サイトをスクレイピングして、更新テキスト（例:「2026年4月6日 159話更新」）を取得する。
 */
export async function fetchUpdateText(): Promise<string | null> {
  try {
    const res = await fetch(SITE_URL);
    if (!res.ok) {
      console.error(`[manga-update] APIエラー: ${res.status}`);
      return null;
    }
    const buffer = await res.arrayBuffer();

    // サイトがShift-JISエンコーディングなのでデコードする
    const decoder = new TextDecoder("shift-jis");
    const html = decoder.decode(buffer);

    const $ = cheerio.load(html);
    const text = $("body").text();

    // 作者がフォーマットを多少変えても検知できるように柔軟な正規表現にする
    const match = text.match(/((\d{4}年)?\s*\d{1,2}月\s*\d{1,2}日\s*\d+話\s*更新)/);
    if (match) {
      return match[1];
    }

    return null;
  } catch (err) {
    console.error(`[manga-update] スクレイピングに失敗:`, err);
    return null;
  }
}
