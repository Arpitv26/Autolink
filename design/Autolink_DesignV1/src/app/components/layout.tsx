import { Outlet } from "react-router";
import { BottomNav } from "./bottom-nav";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50/50 max-w-md mx-auto relative">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
