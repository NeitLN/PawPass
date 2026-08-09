import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountCard } from "./AccountCard";
import { ACCOUNT_STATUSES, type AccountSummary } from "../../types/account";

const BASE_ACCOUNT: AccountSummary = {
  id: "acc-1",
  platform: "facebook",
  status: "active",
  displayName: "Nguyễn Văn A",
  username: "@nguyenvana",
  loginEmail: "nguyenvana@gmail.com",
  avatarUrl: null,
  followerCount: 1000,
  followerUpdatedAt: new Date(),
};

describe("AccountCard actions", () => {
  it("calls onOpenAccount with the account id, and not onUpdateFollower", () => {
    const onOpenAccount = vi.fn();
    const onUpdateFollower = vi.fn();
    render(
      <AccountCard
        account={BASE_ACCOUNT}
        onOpenAccount={onOpenAccount}
        onUpdateFollower={onUpdateFollower}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mở tài khoản" }));
    expect(onOpenAccount).toHaveBeenCalledWith("acc-1");
    expect(onUpdateFollower).not.toHaveBeenCalled();
  });

  it("calls onUpdateFollower with the account id, and not onOpenAccount", () => {
    const onOpenAccount = vi.fn();
    const onUpdateFollower = vi.fn();
    render(
      <AccountCard
        account={BASE_ACCOUNT}
        onOpenAccount={onOpenAccount}
        onUpdateFollower={onUpdateFollower}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật follower" }));
    expect(onUpdateFollower).toHaveBeenCalledWith("acc-1");
    expect(onOpenAccount).not.toHaveBeenCalled();
  });

  it("disables the open-account button when canOpen is false", () => {
    render(
      <AccountCard
        account={BASE_ACCOUNT}
        canOpen={false}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Mở tài khoản" })).toBeDisabled();
  });

  it("leaves the open-account button enabled by default (canOpen defaults true)", () => {
    render(
      <AccountCard account={BASE_ACCOUNT} onOpenAccount={vi.fn()} onUpdateFollower={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Mở tài khoản" })).not.toBeDisabled();
  });
});

describe("AccountCard status", () => {
  it.each(ACCOUNT_STATUSES)('renders a status pill for "%s"', (status) => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, status }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTestId("status-pill")).toBeInTheDocument();
  });
});

describe("AccountCard archived de-emphasis (§5.4)", () => {
  it('takes the archived branch for status "archived": Surface background, no elevation shadow', () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, status: "archived" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    const card = screen.getByTestId("account-card");
    expect(card).toHaveClass("bg-surface");
    expect(card).not.toHaveClass("bg-white");
    expect(card).not.toHaveClass("shadow-elevation-2");
  });

  it.each(ACCOUNT_STATUSES.filter((status) => status !== "archived"))(
    'takes the normal branch for status "%s": white background, keeps the elevation shadow',
    (status) => {
      render(
        <AccountCard
          account={{ ...BASE_ACCOUNT, status }}
          onOpenAccount={vi.fn()}
          onUpdateFollower={vi.fn()}
        />,
      );
      const card = screen.getByTestId("account-card");
      expect(card).toHaveClass("bg-white");
      expect(card).toHaveClass("shadow-elevation-2");
      expect(card).not.toHaveClass("bg-surface");
    },
  );

  it("keeps the card border on every status, archived included", () => {
    const { rerender } = render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, status: "active" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTestId("account-card")).toHaveClass("border-border");

    rerender(
      <AccountCard
        account={{ ...BASE_ACCOUNT, status: "archived" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTestId("account-card")).toHaveClass("border-border");
  });

  it("never applies an opacity utility to the archived card — §5.4.1", () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, status: "archived" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    const card = screen.getByTestId("account-card");
    expect(card.className).not.toMatch(/(^|\s)opacity-/);
  });
});

describe("AccountCard avatar", () => {
  it("shows initials when avatarUrl is null", () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, avatarUrl: null }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows an img with a non-empty alt when avatarUrl is set", () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, avatarUrl: "data:image/png;base64,abc" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Nguyễn Văn A" })).toBeInTheDocument();
  });

  it("falls back to initials after the avatar image fails to load", () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, avatarUrl: "https://invalid.invalid/a.png" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Nguyễn Văn A" }));
    expect(screen.queryByRole("img", { name: "Nguyễn Văn A" })).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});

describe("AccountCard follower count", () => {
  it('shows "Chưa nhập" when followerCount is null', () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, followerCount: null }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("Chưa nhập")).toBeInTheDocument();
  });

  it('shows "0" when followerCount is exactly zero, never "Chưa nhập" — BR-04', () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, followerCount: 0 }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Chưa nhập")).toBeNull();
  });

  it('shows "Chưa cập nhật follower" when followerUpdatedAt is null', () => {
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, followerUpdatedAt: null }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByText("Chưa cập nhật follower")).toBeInTheDocument();
  });
});

describe("AccountCard platform badge", () => {
  it("shows the correct accessible platform name for each platform", () => {
    const { rerender } = render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, platform: "facebook" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Facebook" })).toBeInTheDocument();

    rerender(
      <AccountCard
        account={{ ...BASE_ACCOUNT, platform: "instagram" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Instagram" })).toBeInTheDocument();

    rerender(
      <AccountCard
        account={{ ...BASE_ACCOUNT, platform: "google" }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Gmail" })).toBeInTheDocument();
  });
});

describe("AccountCard truncation", () => {
  it("sets a title attribute with the full display name for long names", () => {
    const longName = "A".repeat(60);
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, displayName: longName }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTitle(longName)).toBeInTheDocument();
  });

  it("sets a title attribute with the full email for long emails", () => {
    const longEmail = `${"a".repeat(50)}@example.com`;
    render(
      <AccountCard
        account={{ ...BASE_ACCOUNT, loginEmail: longEmail }}
        onOpenAccount={vi.fn()}
        onUpdateFollower={vi.fn()}
      />,
    );
    expect(screen.getByTitle(longEmail)).toBeInTheDocument();
  });
});
