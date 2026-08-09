import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformBadge } from "./PlatformBadge";
import { PLATFORMS } from "../../types/account";

describe("PlatformBadge", () => {
  it.each([
    ["facebook", "Facebook"],
    ["instagram", "Instagram"],
    ["google", "Gmail"],
  ] as const)('has an accessible name "%s" -> "%s"', (platform, expectedLabel) => {
    render(<PlatformBadge platform={platform} />);
    expect(screen.getByRole("img", { name: expectedLabel })).toBeInTheDocument();
  });

  it("covers every platform in the shared PLATFORMS list", () => {
    expect(PLATFORMS).toEqual(["facebook", "instagram", "google"]);
  });

  it("defaults to a 32px badge", () => {
    const { container } = render(<PlatformBadge platform="facebook" />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.style.width).toBe("32px");
    expect(badge.style.height).toBe("32px");
  });

  it("accepts a custom size", () => {
    const { container } = render(<PlatformBadge platform="facebook" size={48} />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.style.width).toBe("48px");
    expect(badge.style.height).toBe("48px");
  });
});
