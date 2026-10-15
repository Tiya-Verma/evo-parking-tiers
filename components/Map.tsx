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
  // Car the guided demo is pointing at — its pin gets a pulsing halo.
  cueCarId?: string | null;
  // Hands the map instance up so overlays anchored to a marker can reposition
  // themselves on the map's own render event instead of a frame behind it.
  onReady?: (map: MLMap | null) => void;
}

export function Map({ cars, selectedCarId, onSelectCar, focusLat, focusLng, theme = "dark", cueCarId = null, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  // Held in a ref so a changing callback identity can't re-run map setup.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[theme],
      // Framed on the downtown cluster, biased slightly north so the pins sit
      // just below centre — leaving room for a demo callout above the cued pin
      // without stranding the cluster at the bottom edge. UBC cars are a short
      // pan west.
      center: [-123.1215, 49.2845],
      zoom: 14,
      attributionControl: { compact: true },
      // Disable rotation/pitch for the phone-feel; the real Evo app is 2D.
      pitchWithRotate: false,
      dragRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    onReadyRef.current?.(map);
    return () => {
      onReadyRef.current?.(null);
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
        // No transition and no `transform` on this element: MapLibre rewrites
        // its `transform` every frame to position the marker, so a transition
        // here animates the pin's POSITION and it visibly drifts behind the map
        // while panning. Selection scaling lives on the inner wrapper instead.
        el.className = "block";
        el.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.35))";
        // Black teardrop pin (SVG) with the branded car silhouette overlaid
        // in the head. The PNG is used as a CSS mask and filled with the
        // Evo brand cyan, so it reads sharp and on-brand regardless of the
        // source PNG's original tint.
        // Pin head shows the Evo brand wordmark ("evo" + underline) in cyan
        // on a black teardrop. Wordmark is centered on the pin's vertical
        // axis (x=19) using text-anchor="middle"; the underline mirrors that
        // centerline so the whole logo sits visually inside the head.
        el.innerHTML = `
          <div style="position:relative;width:38px;height:48px;pointer-events:none;transform:scale(${isSelected ? 1.25 : 1});transform-origin:50% 100%;transition:transform 150ms ease-out;">
            ${car.id === cueCarId ? '<span class="cue-halo-static"></span><span class="cue-halo"></span>' : ""}
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
        // MapLibre overwrites a custom marker element's aria-label with a
        // generic "Map marker", so restore ours after the marker is attached —
        // otherwise every pin reads identically to a screen reader.
        el.setAttribute("aria-label", `Select ${car.plate}`);
        el.setAttribute("data-car-id", car.id);
        if (car.id === cueCarId) el.setAttribute("data-cue", "car-pin");
        markersRef.current.push(marker);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [cars, selectedCarId, onSelectCar, cueCarId]);

  // Camera focus for Phase 2 navigation.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusLat === undefined || focusLng === undefined) return;
    // `offset` pushes the target below the floating guide card rather than
    // under it.
    map.flyTo({ center: [focusLng, focusLat], zoom: 17.2, duration: 1000, offset: [0, 90] });
  }, [focusLat, focusLng]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

