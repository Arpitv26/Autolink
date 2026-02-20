import { useLocation, useNavigate } from "react-router";
import { Bot, LayoutGrid, Users, User } from "lucide-react";

const tabs = [
  { path: "/ai", label: "AI", icon: Bot },
  { path: "/planner", label: "Planner", icon: LayoutGrid },
  { path: "/feed", label: "Feed", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path === "/profile" && location.pathname === "/");
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 active:scale-95"
              }`}
            >
              <Icon
                className={`transition-all duration-200 ${
                  isActive ? "size-[22px]" : "size-5"
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[11px] transition-all duration-200 ${
                  isActive ? "opacity-100" : "opacity-70"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
