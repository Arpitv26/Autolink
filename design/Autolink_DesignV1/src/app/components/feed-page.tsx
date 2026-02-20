import { Users, Clock } from "lucide-react";

export function FeedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/20">
        <Users className="size-8 text-white" />
      </div>
      <h1 className="text-gray-900 mb-2">Community Feed</h1>
      <p className="text-gray-500 text-center max-w-[260px]">
        Share your builds, get feedback, and discover inspiration from other enthusiasts.
      </p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-orange-600 text-sm">
        <Clock className="size-4" />
        Phase 2 will add posts, likes, and comments
      </div>
    </div>
  );
}
