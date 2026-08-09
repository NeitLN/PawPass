import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MochiIllustration, type MochiState } from "./MochiIllustration";

const STATES: MochiState[] = [
  "neutral",
  "wave",
  "search",
  "security",
  "sync",
  "offline",
  "success",
];

describe("MochiIllustration state to asset mapping", () => {
  it.each(STATES)('state "%s" resolves to a src file named after it', (state) => {
    const { container } = render(<MochiIllustration state={state} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain(state);
  });
});

describe("MochiIllustration alt text", () => {
  it("defaults to an empty alt, excluded from the accessibility tree", () => {
    render(<MochiIllustration state="wave" />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("is exposed by name when alt is provided", () => {
    render(<MochiIllustration state="wave" alt="Mochi vẫy tay chào" />);
    expect(screen.getByRole("img", { name: "Mochi vẫy tay chào" })).toBeInTheDocument();
  });
});

describe("MochiIllustration backdrop", () => {
  it('shows the backdrop by default ("auto") at size lg', () => {
    render(<MochiIllustration state="neutral" size="lg" />);
    expect(screen.getByTestId("mochi-backdrop")).toBeInTheDocument();
  });

  it('hides the backdrop by default ("auto") at size sm', () => {
    render(<MochiIllustration state="neutral" size="sm" />);
    expect(screen.queryByTestId("mochi-backdrop")).toBeNull();
  });

  it('backdrop="none" hides it even at size lg', () => {
    render(<MochiIllustration state="neutral" size="lg" backdrop="none" />);
    expect(screen.queryByTestId("mochi-backdrop")).toBeNull();
  });

  it('backdrop="cream" shows it even at size sm', () => {
    render(<MochiIllustration state="neutral" size="sm" backdrop="cream" />);
    expect(screen.getByTestId("mochi-backdrop")).toBeInTheDocument();
  });
});

describe("MochiIllustration sizing", () => {
  it("sets width/height attributes matching the size prop", () => {
    const { container } = render(<MochiIllustration state="neutral" size="sm" />);
    const img = container.querySelector("img");
    expect(img!.getAttribute("width")).toBe("48");
    expect(img!.getAttribute("height")).toBe("48");
  });
});

describe("MochiIllustration drag behavior", () => {
  it("is not draggable", () => {
    const { container } = render(<MochiIllustration state="neutral" />);
    expect(container.querySelector("img")).toHaveAttribute("draggable", "false");
  });
});
