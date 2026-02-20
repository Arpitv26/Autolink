import { LayoutGrid, Clock } from "lucide-react";

export function PlannerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
        <LayoutGrid className="size-8 text-white" />
      </div>
      <h1 className="text-gray-900 mb-2">Mod Planner</h1>
      <p className="text-gray-500 text-center max-w-[260px]">
        Drag-and-drop modification planner with part catalog and compatibility checks.
      </p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 text-sm">
        <Clock className="size-4" />
        Canvas and catalog arrive in Phase 3
      </div>
    </div>
  );
}
