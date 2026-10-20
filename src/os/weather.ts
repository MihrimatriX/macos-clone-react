import { useEffect, useState } from "react";

/*
 * Forecast from Open-Meteo (free, no API key). The city comes from the time zone name, so no location
 * permission is ever requested; only that city name and its coordinates leave the browser.
 */

export interface Hour {
  label: string;
  temp: number;
  code: number;
  day: boolean;
}

export interface Weather {
  city: string;
  temp: number;
  code: number;
  day: boolean;
  high: number;
  low: number;
  hours: Hour[];
}

interface GeoResponse {
  results?: { name: string; latitude: number; longitude: number }[];
}

interface ForecastResponse {
  current: { time: string; temperature_2m: number; weather_code: number; is_day: number };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; is_day: number[] };
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
}

const REFRESH_MS = 30 * 60 * 1000;

const json = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

async function fetchWeather(): Promise<Weather> {
  const zoneCity = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replaceAll("_", " ");
  const geo = await json<GeoResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(zoneCity ?? "London")}`,
  );
  const place = geo.results?.[0];
  if (!place) throw new Error("unknown city");

  const unit = navigator.language === "en-US" ? "&temperature_unit=fahrenheit" : "";
  const f = await json<ForecastResponse>(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      "&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day" +
      `&daily=temperature_2m_max,temperature_2m_min&forecast_days=2&timezone=auto${unit}`,
  );

  // Times are local ISO strings like "2026-10-04T11:00", so string comparison orders them.
  const now = f.hourly.time.findIndex((t) => t >= f.current.time.slice(0, 13));
  const hours = f.hourly.time.slice(now + 1, now + 7).map((t, k) => ({
    label: new Date(t).toLocaleTimeString(undefined, { hour: "numeric" }),
    temp: Math.round(f.hourly.temperature_2m[now + 1 + k] ?? 0),
    code: f.hourly.weather_code[now + 1 + k] ?? 0,
    day: f.hourly.is_day[now + 1 + k] === 1,
  }));
  return {
    city: place.name,
    temp: Math.round(f.current.temperature_2m),
    code: f.current.weather_code,
    day: f.current.is_day === 1,
    high: Math.round(f.daily.temperature_2m_max[0] ?? 0),
    low: Math.round(f.daily.temperature_2m_min[0] ?? 0),
    hours,
  };
}

// Notification Center remounts the widget on every open; the cache keeps that from refetching.
let cache: { at: number; weather: Weather } | null = null;

/** Current forecast, refreshed every half hour; null until loaded or when offline. */
export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(cache?.weather ?? null);
  useEffect(() => {
    const load = () => {
      if (cache && Date.now() - cache.at < REFRESH_MS) return;
      fetchWeather().then(
        (fresh) => {
          cache = { at: Date.now(), weather: fresh };
          setWeather(fresh);
        },
        () => setWeather(null),
      );
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  return weather;
}
