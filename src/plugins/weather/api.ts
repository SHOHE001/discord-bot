const OWM_BASE = "https://api.openweathermap.org/data/2.5/weather";

export interface WeatherData {
  cityName: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) throw new Error("OWM_API_KEY が設定されていません");

  const url = `${OWM_BASE}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ja`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`天気情報の取得に失敗しました: ${city} (${res.status})`);
  }

  const data = (await res.json()) as {
    name: string;
    main: { temp: number; feels_like: number; humidity: number };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number };
  };

  return {
    cityName: data.name,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    description: data.weather[0]?.description ?? "不明",
    icon: data.weather[0]?.icon ?? "01d",
    windSpeed: Math.round(data.wind.speed * 10) / 10,
  };
}

export function iconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export function embedColor(icon: string): number {
  if (icon.startsWith("01")) return 0xf9c74f; // 晴れ: 黄
  if (icon.startsWith("02") || icon.startsWith("03")) return 0x90e0ef; // 少し曇り: 水色
  if (icon.startsWith("04")) return 0x9b9b9b; // 曇り: グレー
  if (icon.startsWith("09") || icon.startsWith("10")) return 0x4895ef; // 雨: 青
  if (icon.startsWith("11")) return 0x7b2d8b; // 雷: 紫
  if (icon.startsWith("13")) return 0xdff8eb; // 雪: 白
  return 0x4895ef;
}
