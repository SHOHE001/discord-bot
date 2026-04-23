import fetch from "node-fetch";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function translateToJa(text: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`;
    const res = await fetch(url, { headers: { "User-Agent": "discord-bot-reddit-ai/1.0" } });
    if (!res.ok) return text;
    const data = await res.json() as { responseStatus: number; responseData: { translatedText: string } };
    if (data.responseStatus !== 200) return text;
    return data.responseData.translatedText || text;
  } catch {
    return text;
  }
}

export async function translateAll(texts: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const text of texts) {
    results.push(await translateToJa(text));
    await sleep(100);
  }
  return results;
}
