import { describe, expect, it } from "vitest";
import { panelFrames, slideDirection } from "./transition";

describe("panelFrames", () => {
  it("slide forward: new panel enters from the right, old leaves to the left", () => {
    const f = panelFrames("slide", 1);
    expect(f.enter[0].transform).toBe("translateX(100%)");
    expect(f.leave[1].transform).toBe("translateX(-100%)");
  });
  it("slide back: new panel enters from the left, old leaves to the right", () => {
    const f = panelFrames("slide", -1);
    expect(f.enter[0].transform).toBe("translateX(-100%)");
    expect(f.leave[1].transform).toBe("translateX(100%)");
  });
  it("fade crossfades without movement", () => {
    const f = panelFrames("fade", 1);
    expect(f.enter).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(f.leave).toEqual([{ opacity: 1 }, { opacity: 0 }]);
  });
  it("none has no frames", () => {
    expect(panelFrames("none", 1)).toEqual({ enter: [], leave: [] });
  });
});

describe("slideDirection", () => {
  it("is forward for a higher index and back for a lower one", () => {
    expect(slideDirection(0, 2)).toBe(1);
    expect(slideDirection(2, 1)).toBe(-1);
  });
});
