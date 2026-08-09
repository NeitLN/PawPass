import { createHashRouter } from "react-router-dom";
import AppShell from "./AppShell";
import AccountsPage from "../pages/AccountsPage";
import DashboardPage from "../pages/DashboardPage";
import SettingsPage from "../pages/SettingsPage";

export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/accounts", element: <AccountsPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
