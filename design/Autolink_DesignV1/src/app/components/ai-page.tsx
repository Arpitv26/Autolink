import { Bot, Sparkles } from "lucide-react";

export function AIPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
        <Bot className="size-8 text-white" />
      </div>
      <h1 className="text-gray-900 mb-2">AI Assistant</h1>
      <p className="text-gray-500 text-center max-w-[260px]">
        Get personalized mod recommendations based on your vehicle, goals, and budget.
      </p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm">
        <Sparkles className="size-4" />
        Coming in Phase 4
      </div>
    </div>
  );
}
