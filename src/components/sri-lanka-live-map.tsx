"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type MapDistrict = { name: string; slug: string; count: number };

type LeafletWindow = Window & { L?: any };

const CENTERS: Record<string, [number, number]> = {
  ampara: [7.2917, 81.6724],
  anuradhapura: [8.3114, 80.4037],
  badulla: [6.9934, 81.0550],
  batticaloa: [7.7170, 81.7000],
  colombo: [6.9271, 79.8612],
  galle: [6.0535, 80.2210],
  gampaha: [7.0840, 80.0098],
  hambantota: [6.1429, 81.1212],
  jaffna: [9.6615, 80.0255],
  kalutara: [6.5854, 79.9607],
  kandy: [7.2906, 80.6337],
  kegalle: [7.2513, 80.3464],
  kilinochchi: [9.3803, 80.3770],
  kurunegala: [7.4863, 80.3623],
  mannar: [8.9810, 79.9044],
  matale: [7.4675, 80.6234],
  matara: [5.9549, 80.5550],
  monaragala: [6.8728, 81.3507],
  mullaitivu: [9.2671, 80.8142],
  "nuwara-eliya": [6.9497, 80.7891],
  polonnaruwa: [7.9403, 81.0188],
  puttalam: [8.0408, 79.8394],
  ratnapura: [6.6828, 80.3992],
  trincomalee: [8.5874, 81.2152],
  vavuniya: [8.7514, 80.4971],
};

function loadLeaflet() {
  return new Promise<any>((resolve, reject) => {
    const browser = window as LeafletWindow;
    if (browser.L) return resolve(browser.L);

    if (!document.querySelector('link[data-bridgenews-leaflet="true"]')) {
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      style.dataset.bridgenewsLeaflet = "true";
      document.head.appendChild(style);
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-bridgenews-leaflet="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as LeafletWindow).L), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.bridgenewsLeaflet = "true";
    script.onload = () => resolve((window as LeafletWindow).L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function SriLankaLiveMap({ districts }: { districts: MapDistrict[] }) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let map: any;

    loadLeaflet().then((L) => {
      if (cancelled || !L || !elementRef.current) return;
      map = L.map(elementRef.current, { scrollWheelZoom: false, zoomControl: true }).setView([7.8731, 80.7718], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      districts.forEach((district) => {
        const center = CENTERS[district.slug];
        if (!center) return;
        const radius = Math.min(18, 7 + Math.sqrt(Math.max(district.count, 0)) * 2.4);
        const marker = L.circleMarker(center, {
          radius,
          weight: 2,
          fillOpacity: district.count ? 0.78 : 0.35,
        }).addTo(map);
        marker.bindTooltip(`<strong>${district.name}</strong><br>${district.count} recent ${district.count === 1 ? "story" : "stories"}`, { direction: "top" });
        marker.on("click", () => router.push(`/map/${district.slug}`));
      });
    }).catch((error) => console.error("Leaflet map failed to load", error));

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [districts, router]);

  return <div ref={elementRef} className="h-[520px] w-full overflow-hidden rounded-3xl bg-gray-100" aria-label="Interactive map of Sri Lankan districts" />;
}
