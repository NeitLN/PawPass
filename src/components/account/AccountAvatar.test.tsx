import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountAvatar } from "./AccountAvatar";

describe("AccountAvatar", () => {
  it("shows initials, no <img>, when avatarUrl is null", () => {
    const { container } = render(<AccountAvatar avatarUrl={null} displayName="Nguyễn Văn A" />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows an <img> with alt = displayName when avatarUrl is set", () => {
    render(<AccountAvatar avatarUrl="data:image/png;base64,abc" displayName="Nguyễn Văn A" />);
    expect(screen.getByRole("img", { name: "Nguyễn Văn A" })).toBeInTheDocument();
  });

  it("falls back to initials after the image fails to load", () => {
    render(<AccountAvatar avatarUrl="https://invalid.invalid/a.png" displayName="Nguyễn Văn A" />);
    const img = screen.getByRole("img", { name: "Nguyễn Văn A" });
    fireEvent.error(img);
    expect(screen.queryByRole("img", { name: "Nguyễn Văn A" })).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("resets the error state when avatarUrl changes to a new value", () => {
    const { rerender } = render(
      <AccountAvatar avatarUrl="https://invalid.invalid/a.png" displayName="Nguyễn Văn A" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Nguyễn Văn A" }));
    expect(screen.getByText("A")).toBeInTheDocument();

    rerender(<AccountAvatar avatarUrl="data:image/png;base64,def" displayName="Nguyễn Văn A" />);
    expect(screen.getByRole("img", { name: "Nguyễn Văn A" })).toBeInTheDocument();
  });
});
