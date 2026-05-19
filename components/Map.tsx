"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import { EvoCar } from "@/lib/types";

// Free CartoDB vector styles — no API key required. Dark Matter mirrors the
// real Evo app's home-zone map; Positron is its light counterpart. Style URL
// is swapped at runtime when the theme toggles.
const MAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

type Theme = "dark" | "light";

interface Props {
  cars: EvoCar[];
  selectedCarId: string | null;
  onSelectCar: (id: string) => void;
  // When true, hide the surrounding UI and focus on a structure entrance.
  focusLat?: number;
  focusLng?: number;
  theme?: Theme;
}

export function Map({ cars, selectedCarId, onSelectCar, focusLat, focusLng, theme = "dark" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[theme],
      center: [-123.1196, 49.2818],
      zoom: 14.4,
      attributionControl: { compact: true },
      // Disable rotation/pitch for the phone-feel; the real Evo app is 2D.
      pitchWithRotate: false,
      dragRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Style only used at mount; later changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap basemap style when the theme prop changes. setStyle triggers a fresh
  // `load` event, so the markers effect below will re-attach the pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[theme]);
  }, [theme]);

  // Sync markers when the car list or selection changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      // Remove previous markers.
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const car of cars) {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `Select ${car.plate}`);
        const isSelected = car.id === selectedCarId;
        const inStructure = car.structureId !== null;
        el.className = [
          "block rounded-full border-2 bg-evo-lime transition-transform duration-150",
          isSelected
            ? "scale-110 border-white shadow-[0_0_0_4px_rgba(63,200,244,0.35)]"
            : "border-evo-canvas shadow-[0_2px_6px_rgba(0,0,0,0.35)]",
          "w-8 h-8 flex items-center justify-center",
        ].join(" ");
        el.innerHTML = inStructure
          ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E0F12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V8h4a3 3 0 0 1 0 6H9"/></svg>`
          : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E0F12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/></svg>`;
        el.addEventListener("click", () => onSelectCar(car.id));
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([car.lng, car.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [cars, selectedCarId, onSelectCar]);

  // Camera focus for Phase 2 navigation.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusLat === undefined || focusLng === undefined) return;
    map.flyTo({ center: [focusLng, focusLat], zoom: 17.2, duration: 1000 });
  }, [focusLat, focusLng]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
