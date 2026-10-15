"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { CueId } from "@/lib/cue";

/**
 * Anything that emits a "render" event after it has repositioned its own DOM —
 * in practice the MapLibre map. Typed structurally so this component doesn't
 * need to depend on maplibre-gl.
 */
interface RenderSource {
  on(type: "render", listener: () => void): unknown;
  off(type: "render", listener: () => void): unknown;
}

interface Props {
  cue: CueId;
  text: string;
  placement?: "above" | "below";
  /** The app viewport the callout is positioned inside. */
  containerRef: RefObject<HTMLElement | null>;
  /** Map to re-measure against right after it draws, when there is one. */
  renderSource?: RenderSource | null;
  onDismiss: () => void;
}

const GAP = 10; // space between bubble and target
const EDGE = 12; // minimum distance from the viewport edge
const CARET_HALF = 5;
const CARET_INSET = 16;

/**
 * A small pointer anchored to whichever control the demo wants tapped next:
 * a few words and a caret, sitting beside the pulsing ring on the target.
 *
 * The target is found by its `data-cue` attribute rather than a React ref,
 * because one of the targets is a MapLibre marker living outside the React
 * tree.
 *
 * Position is written straight to the DOM inside the animation frame rather
 * than through React state. Routing it through state costs a reconcile and
 * commit before anything paints, which is enough for the bubble to visibly
 * trail the map pin while panning. For the same reason the bubble transitions
 * `opacity` only — a transition on `transform` would animate its position and
 * reintroduce exactly the lag this is avoiding. React state here tracks only
 * whether the target exists at all, which changes rarely.
 */
export function CueCallout({ cue, text, placement, containerRef, renderSource, onDismiss }: Props) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(false);
  const [shown, setShown] = useState(false);
  const placeRef = useRef<() => void>(() => {});

  useEffect(() => {
    shownRef.current = false;
    setShown(false);

    const place = () => {
      const container = containerRef.current;
      const bubble = bubbleRef.current;
      const caret = caretRef.current;
      const target = document.querySelector<HTMLElement>(`[data-cue="${cue}"]`);
      if (!container || !bubble || !caret || !target) {
        if (shownRef.current) {
          shownRef.current = false;
          setShown(false);
        }
        return;
      }

      const c = container.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const w = bubble.offsetWidth;
      const h = bubble.offsetHeight;

      // Prefer sitting above the target; drop below when there isn't room, or
      // when the step asked for below.
      const above = t.top - c.top - GAP - h;
      const below = Math.min(t.bottom - c.top + GAP, c.height - h - EDGE);
      const goBelow = placement === "below" || (placement !== "above" && above < EDGE);

      const centre = t.left + t.width / 2 - c.left;
      const left = Math.max(EDGE, Math.min(centre - w / 2, c.width - w - EDGE));
      const top = goBelow ? below : above;

      // Rounded to whole pixels so the bubble doesn't shimmer on subpixel moves.
      bubble.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;

      // Caret keeps pointing at the target even when the bubble is clamped
      // against a screen edge.
      const offset = Math.max(CARET_INSET, Math.min(centre - left, w - CARET_INSET));
      caret.style.left = `${Math.round(offset) - CARET_HALF}px`;
      caret.style.top = goBelow ? `-${CARET_HALF - 1}px` : "";
      caret.style.bottom = goBelow ? "" : `-${CARET_HALF - 1}px`;

      if (!shownRef.current) {
        shownRef.current = true;
        setShown(true);
      }
    };

    placeRef.current = place;

    // Covers targets that aren't on the map — sheets rising, lists scrolling.
    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      place();
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [cue, placement, containerRef]);

  // When the target is a map marker, the frame loop alone leaves the bubble a
  // frame behind: our callback can run before MapLibre has written the pin's
  // transform for that frame. Re-measuring on the map's own render event runs
  // immediately after it repositions markers, so the bubble tracks exactly.
  useEffect(() => {
    if (!renderSource) return;
    const onRender = () => placeRef.current();
    renderSource.on("render", onRender);
    return () => {
      renderSource.off("render", onRender);
    };
  }, [renderSource]);

  return (
    <div
      ref={bubbleRef}
      role="status"
      className="pointer-events-auto absolute left-0 top-0 z-50 flex w-max max-w-[260px] items-center gap-1 rounded-xl bg-demo-bubble py-2 pl-3 pr-1.5 shadow-card transition-opacity duration-200 will-change-transform"
      style={{ opacity: shown ? 1 : 0, visibility: shown ? "visible" : "hidden" }}
    >
      <span className="text-footnote font-semibold text-demo-fg">{text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="End guided demo"
        className="-my-2 flex h-tap w-7 items-center justify-center text-demo-fg/50 transition hover:text-demo-fg"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Caret. Rotated square tucked under the bubble edge it points from. */}
      <span
        ref={caretRef}
        aria-hidden
        className="absolute h-2.5 w-2.5 rotate-45 rounded-[2px] bg-demo-bubble"
      />
    </div>
  );
}
