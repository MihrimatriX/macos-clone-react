import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Moon,
  Navigation,
  Sun,
} from "lucide-react";
import { useWeather } from "../../os/weather";
import { Widget } from "./Widget";

/** WMO weather codes grouped the way the Weather app names them. */
function condition(code: number, day: boolean): [LucideIcon, string] {
  if (code === 0) return day ? [Sun, "Sunny"] : [Moon, "Clear"];
  if (code <= 2) return [day ? CloudSun : CloudMoon, "Mostly Clear"];
  if (code === 3) return [Cloud, "Cloudy"];
  if (code <= 48) return [CloudFog, "Fog"];
  if (code <= 57) return [CloudDrizzle, "Drizzle"];
  if (code <= 67 || (code >= 80 && code <= 82)) return [CloudRain, "Rain"];
  if (code <= 86) return [CloudSnow, "Snow"];
  return [CloudLightning, "Thunderstorms"];
}
export function WeatherWidget() {
  const weather = useWeather();
  if (!weather) return null;
  const [Icon, label] = condition(weather.code, weather.day);
  const sky = weather.day ? "from-[#4b93e6]/85 to-[#2563c9]/85" : "from-[#1b2a55]/85 to-[#0d1630]/85";
  return (
    <Widget wide className={`bg-gradient-to-b text-white ${sky}`}>
      <div className="flex justify-between">
        <div>
          <p className="flex items-center gap-1 font-semibold text-[13px]">
            {weather.city} <Navigation size={10} fill="currentColor" />
          </p>
          <p className="font-light text-[38px] leading-none">{weather.temp}°</p>
        </div>
        <div className="flex flex-col items-end text-[11px]">
          <Icon size={16} className="mb-1" />
          <span className="font-semibold">{label}</span>
          <span>
            H:{weather.high}° L:{weather.low}°
          </span>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-center text-[11px]">
        {weather.hours.map((hour) => {
          const [HourIcon] = condition(hour.code, hour.day);
          return (
            <div key={hour.label} className="flex flex-col items-center gap-1">
              <span className="opacity-80">{hour.label}</span>
              <HourIcon size={14} />
              <span className="font-semibold">{hour.temp}°</span>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
