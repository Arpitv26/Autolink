agent_docs/code_patterns.md
Save as: agent_docs/code_patterns.md
Code Patterns — AutoLink
TypeScript Rules (Non-Negotiable)
// ❌ FORBIDDEN — never use any
const data: any = response.json();
// ✅ CORRECT — use unknown with type guards, or define proper types
type ApiResponse<T> = { data: T | null; error: string | null };
function isUserProfile(val: unknown): val is UserProfile {
  return typeof val === 'object' && val !== null && 'username' in val;
}
---
Component Pattern (Functional + Typed Props)
// Prefer types from types/feed.ts and types/planner.ts
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { FeedPost } from '../types/feed';
import { theme } from '../lib/theme';
type PostCardProps = {
  post: FeedPost;
  onLike: (postId: string) => void;
  isLiked: boolean;
};
export function PostCard({ post, onLike, isLiked }: PostCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.username}>{post.authorUsername}</Text>
      <Pressable onPress={() => onLike(post.id)}>
        <Text>{isLiked ? 'Liked' : 'Like'} {post.likesCount}</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, marginBottom: 16 },
  username: { fontWeight: '600', padding: 12, color: theme.colors.textPrimary },
});
---
Custom Hook Pattern
Business logic lives in hooks/. Screens stay thin.
Supabase calls belong in hooks, not components.
AI calls use supabase.functions.invoke('ai-chat') from hooks/useAutoLinkAI.ts only.
---
Optimistic UI (Likes)
Update local state first, then sync with Supabase; rollback on error.
See hooks/useFeed.ts for the production pattern.
---
Auth + Onboarding Guard Pattern
// Reality in app/_layout.tsx:
// - No session → /(auth)/sign-in
// - Session but setup incomplete → /onboarding (display name + first vehicle)
// - Session + complete → /(tabs)/feed
Do not redirect unauthenticated users to /onboarding.
---
Image Upload Pattern (Social Posts)
Use hooks/useCreatePost.ts — uploads to `post-images` bucket, then inserts the post row.
---
NHTSA API Helpers
See lib/nhtsa.ts for make/model/year helpers. CarQuery is not integrated.
---
Constants
MAX_AI_QUERIES_PER_DAY = 20
MAX_POST_IMAGES = 5
AI_MAX_TOKENS = 500
Parts categories live with the catalog in data/parts_catalog.json / lib/partsCatalog.ts
---
Quality Gate
npm run verify
CI mirrors verify. Husky is not installed.
