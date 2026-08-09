import { useLocation } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/accounts": "Accounts",
  "/settings": "Settings",
};

function Topbar() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "PawPass";

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-border bg-surface px-8">
      <h1 className="text-lg font-semibold text-shield-navy">{title}</h1>

      <div className="flex items-center gap-4">
        <input
          type="search"
          disabled
          placeholder="Tìm tài khoản..."
          className="focus-ring h-10 w-[360px] rounded-control border border-border-strong bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          disabled
          title="Sắp có ở Sprint 1"
          className="focus-ring rounded-control bg-fur-orange px-4 py-2 text-sm font-semibold text-shield-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add account
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muzzle-cream text-sm font-semibold text-fur-orange-text">
          T
        </div>
      </div>
    </header>
  );
}

export default Topbar;
