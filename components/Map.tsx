"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";
import { EvoCar } from "@/lib/types";

// Free CartoDB vector styles — no API key required. Voyager is closer to the
// real Evo app's Mapbox light style (cyan water, colored landscape) than the
// neutral Positron; Dark Matter is kept for the dark-theme variant.
const MAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
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
      // Widened view: centered between downtown (~-123.119) and UBC (~-123.250)
      // so cars in both zones are visible at first paint.
      center: [-123.185, 49.272],
      zoom: 12,
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
        el.className = "block transition-transform duration-150";
        el.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.35))";
        if (isSelected) el.style.transform = "scale(1.4)";
        // Black teardrop pin (SVG) with the branded car silhouette overlaid
        // in the head. The PNG is used as a CSS mask and filled with the
        // Evo brand cyan, so it reads sharp and on-brand regardless of the
        // source PNG's original tint.
        // Pin head shows the Evo brand wordmark ("evo" + underline) in cyan
        // on a black teardrop. Wordmark is centered on the pin's vertical
        // axis (x=19) using text-anchor="middle"; the underline mirrors that
        // centerline so the whole logo sits visually inside the head.
        el.innerHTML = `
          <div style="position:relative;width:38px;height:48px;pointer-events:none;">
            <svg width="38" height="48" viewBox="0 0 38 48" style="position:absolute;inset:0;">
              <path d="M19 1 C9 1, 1 9, 1 18 C 1 29, 19 47, 19 47 C 19 47, 37 29, 37 18 C 37 9, 29 1, 19 1 Z" fill="#0E0F12"/>
              <text x="19" y="18" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-weight="800" font-style="italic" font-size="11" fill="#1FB6E5" letter-spacing="-0.3">evo</text>
              <line x1="9" y1="22" x2="29" y2="22" stroke="#1FB6E5" stroke-width="1" stroke-linecap="round"/>
            </svg>
          </div>
        `;
        el.addEventListener("click", () => onSelectCar(car.id));
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
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

