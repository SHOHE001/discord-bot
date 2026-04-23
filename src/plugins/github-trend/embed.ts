import { EmbedBuilder } from "discord.js";
import type { TrendingRepo } from "./api.js";

const LANG_EMOJI: Record<string, string> = {
  TypeScript: "🔷",
  JavaScript: "🟨",
  Python: "🐍",
  Rust: "🦀",
  Go: "🐹",
  Java: "☕",
  "C++": "⚙️",
  C: "🔩",
  "C#": "💜",
  Ruby: "💎",
  Swift: "🧡",
  Kotlin: "🟣",
  PHP: "🐘",
  Shell: "🐚",
  Dart: "🎯",
  Scala: "🔴",
  Zig: "⚡",
  Lua: "🌙",
  Haskell: "🟤",
  Elixir: "💧",
};

function langEmoji(lang: string): string {
  return LANG_EMOJI[lang] ?? "📦";
}

export function buildTrendingEmbed(repos: TrendingRepo[], top = 10): EmbedBuilder {
  const lines = repos.slice(0, top).map((repo, i) => {
    const emoji = repo.language ? `${langEmoji(repo.language)} ${repo.language}` : "";
    const desc = repo.description ? ` — ${repo.description.slice(0, 80)}` : "";
    const stars = repo.stars ? `⭐ ${repo.stars}` : "";
    const today = repo.todayStars ? `(${repo.todayStars})` : "";
    return `**${i + 1}.** [${repo.fullName}](${repo.url})\n${[emoji, stars, today].filter(Boolean).join(" · ")}${desc}`;
  });

  return new EmbedBuilder()
    .setTitle("🐙 GitHub Trending Top 10")
    .setURL("https://github.com/trending")
    .setDescription(lines.join("\n\n"))
    .setColor(0x24292e)
    .setTimestamp()
    .setFooter({ text: "GitHub Trending" });
}
