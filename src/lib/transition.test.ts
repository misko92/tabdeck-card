import { describe, expect, it } from "vitest";
import { panelFrames, slideDirection } from "./transition";

describe("panelFrames", () => {
  it("slides in from the right when moving forward", () => {
    expect(panelFrames("slide", 1)[0].transform).toBe("translateX(32px)");
  });
  it("slides in from the left when moving back", () => {
    expect(panelFrames("slide", -1)[0].transform).toBe("translateX(-32px)");
  });
  it("fades without movement", () => {
    expect(panelFrames("fade", -1)).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });
  it("has no frames for none", () => {
    expect(panelFrames("none", 1)).toEqual([]);
  });
});

describe("slideDirection", () => {
  it("is forward for a higher index and back for a lower one", () => {
    expect(slideDirection(0, 2)).toBe(1);
    expect(slideDirection(2, 1)).toBe(-1);
  });
});
