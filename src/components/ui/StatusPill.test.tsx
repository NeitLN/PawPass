import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";
import { ACCOUNT_STATUSES } from "../../types/account";
import { strings } from "../../lib/strings";

const EXPECTED_LABEL: Record<(typeof ACCOUNT_STATUSES)[number], string> = {
  active: strings.status.active,
  review: strings.status.review,
  inactive: strings.status.inactive,
  locked: strings.status.locked,
  archived: strings.status.archived,
};

describe("StatusPill", () => {
  it.each(ACCOUNT_STATUSES)('renders the Vietnamese label and an icon for "%s"', (status) => {
    render(<StatusPill status={status} />);
    expect(screen.getByText(EXPECTED_LABEL[status])).toBeInTheDocument();
    const pill = screen.getByTestId("status-pill");
    expect(pill.querySelector("svg")).not.toBeNull();
  });

  it('renders literal Vietnamese text "Đã khoá" for the locked status', () => {
    render(<StatusPill status="locked" />);
    expect(screen.getByText("Đã khoá")).toBeInTheDocument();
  });
});
