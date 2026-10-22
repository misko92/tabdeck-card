import type { PanelTransition } from "./config";

// 1 = moving to a later tab (content enters from the right),
// -1 = moving to an earlier tab (content enters from the left).
export type SlideDirection = 1 | -1;

export const PANEL_DURATION_MS = 260;
// Fast start, soft landing: feels like the content follows the finger.
export const PANEL_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const SLIDE_OFFSET_PX = 32;

// Keyframes for the panel that is becoming visible.
export function panelFrames(mode: PanelTransition, dir: SlideDirection): Keyframe[] {
  if (mode === "slide") {
    return [
      { opacity: 0, transform: `translateX(${dir * SLIDE_OFFSET_PX}px)` },
      { opacity: 1, transform: "translateX(0)" },
    ];
  }
  if (mode === "fade") return [{ opacity: 0 }, { opacity: 1 }];
  return [];
}

// Direction of a move from one tab index to another. When wrapping around the
// ends, pass the swipe direction instead so the motion matches the gesture.
export function slideDirection(from: number, to: number): SlideDirection {
  return to < from ? -1 : 1;
}
