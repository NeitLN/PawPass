import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/accounts", label: "Accounts" },
  { to: "/settings", label: "Settings" },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <aside
      className={`flex h-screen flex-col border-r border-border bg-surface transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-60"
      }`}
    >
      <div className="flex h-16 items-center px-4 font-brand text-lg font-bold text-fur-orange-text">
        {collapsed ? "P" : "PawPass"}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `focus-ring rounded-control px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-status-active-bg text-fur-orange-text"
                  : "text-shield-navy hover:bg-status-neutral-bg"
              }`
            }
          >
            {collapsed ? item.label.slice(0, 1) : item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className="focus-ring m-2 rounded-control px-3 py-2 text-left text-sm text-shield-navy hover:bg-status-neutral-bg"
      >
        {collapsed ? "»" : "« Thu gọn"}
      </button>
    </aside>
  );
}

export default Sidebar;
