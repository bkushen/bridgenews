import { createClient } from "@/lib/supabase/server";

export type WeatherCardData = {
  city: string;
  emoji: string;
  temperature: number | null;
  apparentTemperature: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  high: number | null;
  low: number | null;
  timeZone: string;
};

export type ExchangeStripData = {
  audToLkr: number | null;
  usdToLkr: number | null;
  audToUsd: number | null;
  updatedAt: string | null;
};

type WeatherLocation = { city: string; latitude: number; longitude: number; timezone: string };

const DEFAULT_WEATHER: [WeatherLocation, WeatherLocation] = [
  { city: "Colombo", latitude: 6.9271, longitude: 79.8612, timezone: "Asia/Colombo" },
  { city: "Melbourne", latitude: -37.8136, longitude: 144.9631, timezone: "Australia/Melbourne" },
];

function weatherEmoji(code: number | null) {
  if (code == null) return "🌤️";
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

async function getWeather(city: string, latitude: number, longitude: number, timezone: string): Promise<WeatherCardData> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min",
      timezone,
      forecast_days: "1",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
    const data = await response.json();
    const code = typeof data?.current?.weather_code === "number" ? data.current.weather_code : null;
    return {
      city,
      emoji: weatherEmoji(code),
      temperature: typeof data?.current?.temperature_2m === "number" ? data.current.temperature_2m : null,
      apparentTemperature: typeof data?.current?.apparent_temperature === "number" ? data.current.apparent_temperature : null,
      weatherCode: code,
      windSpeed: typeof data?.current?.wind_speed_10m === "number" ? data.current.wind_speed_10m : null,
      high: typeof data?.daily?.temperature_2m_max?.[0] === "number" ? data.daily.temperature_2m_max[0] : null,
      low: typeof data?.daily?.temperature_2m_min?.[0] === "number" ? data.daily.temperature_2m_min[0] : null,
      timeZone: timezone,
    };
  } catch {
    return { city, emoji: "🌤️", temperature: null, apparentTemperature: null, weatherCode: null, windSpeed: null, high: null, low: null, timeZone: timezone };
  }
}

function stringSetting(settings: Record<string, unknown>, key: string, fallback: string) {
  const value = settings[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberSetting(settings: Record<string, unknown>, key: string, fallback: number) {
  const value = Number(settings[key]);
  return Number.isFinite(value) ? value : fallback;
}

export async function getHomepageWeather() {
  let settings: Record<string, unknown> = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("key,value").like("key", "weather_%");
    settings = Object.fromEntries((data ?? []).map((row: any) => [row.key, row.value]));
  } catch {
    settings = {};
  }

  const locations: [WeatherLocation, WeatherLocation] = [1, 2].map((slot) => {
    const fallback = DEFAULT_WEATHER[slot - 1];
    return {
      city: stringSetting(settings, `weather_city_${slot}_name`, fallback.city),
      latitude: numberSetting(settings, `weather_city_${slot}_latitude`, fallback.latitude),
      longitude: numberSetting(settings, `weather_city_${slot}_longitude`, fallback.longitude),
      timezone: stringSetting(settings, `weather_city_${slot}_timezone`, fallback.timezone),
    };
  }) as [WeatherLocation, WeatherLocation];

  return Promise.all(locations.map((location) => getWeather(location.city, location.latitude, location.longitude, location.timezone)));
}

export async function getExchangeStrip(): Promise<ExchangeStripData> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error(`Rates HTTP ${response.status}`);
    const data = await response.json();
    const usdToAud = typeof data?.rates?.AUD === "number" ? data.rates.AUD : null;
    const usdToLkr = typeof data?.rates?.LKR === "number" ? data.rates.LKR : null;
    return {
      audToLkr: usdToAud && usdToLkr ? usdToLkr / usdToAud : null,
      usdToLkr,
      audToUsd: usdToAud ? 1 / usdToAud : null,
      updatedAt: typeof data?.time_last_update_utc === "string" ? data.time_last_update_utc : null,
    };
  } catch {
    return { audToLkr: null, usdToLkr: null, audToUsd: null, updatedAt: null };
  }
}

export function formatCityTime(timeZone: string) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}
