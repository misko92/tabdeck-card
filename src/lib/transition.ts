import type { PanelTransition } from "./config";

// 1 = moving to a later tab (new content comes in from the right),
// -1 = moving to an earlier tab (new content comes in from the left).
export type SlideDirection = 1 | -1;

// Gentle start and a long soft landing, like a native carousel.
export const PANEL_EASING = "cubic-bezier(0.25, 0.8, 0.25, 1)";

export interface PanelFrames {
  enter: Keyframe[];
  leave: Keyframe[];
}

// Keyframes for the panel coming in and the one going out.
// slide: a full-width carousel move, both panels travelling together.
// fade: a crossfade in place.
export function panelFrames(mode: PanelTransition, dir: SlideDirection): PanelFrames {
  if (mode === "slide") {
    return {
      enter: [{ transform: `translateX(${dir * 100}%)` }, { transform: "translateX(0)" }],
      leave: [{ transform: "translateX(0)" }, { transform: `translateX(${-dir * 100}%)` }],
    };
  }
  if (mode === "fade") {
    return {
      enter: [{ opacity: 0 }, { opacity: 1 }],
      leave: [{ opacity: 1 }, { opacity: 0 }],
    };
  }
  return { enter: [], leave: [] };
}

// Direction of a move from one tab index to another. When wrapping around the
// ends, use the swipe direction instead so the motion matches the gesture.
export function slideDirection(from: number, to: number): SlideDirection {
  return to < from ? -1 : 1;
}
