import fetch from "node-fetch";

const NOTION_API_KEY = process.env.NOTION_TOKEN!;
const NOTION_DB_ID = process.env.NOTION_TSUBUYAKI_DB_ID!;

export async function saveMemo(
  content: string,
  timestamp: Date,
  discordUrl: string
): Promise<void> {
  const title = content.length > 50 ? content.slice(0, 50) + "…" : content;

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        メモ: { title: [{ text: { content: title } }] },
        内容: { rich_text: [{ text: { content } }] },
        日時: { date: { start: timestamp.toISOString() } },
        "Discord URL": { url: discordUrl },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API error ${res.status}: ${body}`);
  }
}
