agent_docs/code_patterns.md
Save as: agent_docs/code_patterns.md
Code Patterns — AutoLink
TypeScript Rules (Non-Negotiable)
// ❌ FORBIDDEN — never use any
const data: any = response.json();
// ✅ CORRECT — use unknown with type guards, or define proper types
type ApiResponse&lt;T&gt; = { data: T | null; error: string | null };
function isUserProfile(val: unknown): val is UserProfile {
  return typeof val === &apos;object&apos; &amp;&amp; val !== null &amp;&amp; &apos;username&apos; in val;
}
---
Component Pattern (Functional + Typed Props)
// components/PostCard.tsx
import { View, Text, Image, Pressable, StyleSheet } from &apos;react-native&apos;;
import { Post } from &apos;../types/database&apos;;
type PostCardProps = {
  post: Post;
  onLike: (postId: string) =&gt; void;
  isLiked: boolean;
};
export function PostCard({ post, onLike, isLiked }: PostCardProps) {
  return (
    &lt;View style={styles.card}&gt;
      &lt;Text style={styles.username}&gt;{post.profiles.username}&lt;/Text&gt;
      {post.image_urls[0] &amp;&amp; (
        &lt;Image source={{ uri: post.image_urls[0] }} style={styles.image} /&gt;
      )}
      &lt;Pressable onPress={() =&gt; onLike(post.id)} style={styles.likeButton}&gt;
        &lt;Text&gt;{isLiked ? &apos;❤️&apos; : &apos;🤍&apos;} {post.likes_count}&lt;/Text&gt;
      &lt;/Pressable&gt;
    &lt;/View&gt;
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: &apos;#fff&apos;, borderRadius: 12, marginBottom: 16, overflow: &apos;hidden&apos; },
  username: { fontWeight: &apos;600&apos;, padding: 12 },
  image: { width: &apos;100%&apos;, aspectRatio: 1 },
  likeButton: { padding: 12 },
});
---
Custom Hook Pattern
// hooks/usePosts.ts
import { useState, useEffect } from &apos;react&apos;;
import { supabase } from &apos;../lib/supabase&apos;;
import { Post } from &apos;../types/database&apos;;
export function usePosts() {
  const [posts, setPosts] = useState&lt;Post[]&gt;([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState&lt;string | null&gt;(null);
  useEffect(() =&gt; {
    fetchPosts();
  }, []);
  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from(&apos;posts&apos;)
      .select(&apos;*, profiles(username, avatar_url)&apos;)
      .order(&apos;created_at&apos;, { ascending: false })
      .limit(20);
    if (error) {
      setError(&apos;Could not load posts. Please try again.&apos;);
    } else {
      setPosts(data ?? []);
    }
    setLoading(false);
  }
  return { posts, loading, error, refresh: fetchPosts };
}
---
Optimistic UI (Likes)
// Optimistic update — update UI immediately, sync with DB after
async function handleLike(postId: string) {
  // 1. Update UI immediately (feels instant)
  setPosts(prev =&gt;
    prev.map(p =&gt;
      p.id === postId
        ? { ...p, likes_count: p.likes_count + 1, is_liked: true }
        : p
    )
  );
  // 2. Sync with database (may fail silently at demo scale)
  const { error } = await supabase
    .from(&apos;likes&apos;)
    .insert({ post_id: postId, user_id: currentUser.id });
  // 3. Rollback if failed
  if (error) {
    setPosts(prev =&gt;
      prev.map(p =&gt;
        p.id === postId
          ? { ...p, likes_count: p.likes_count - 1, is_liked: false }
          : p
      )
    );
  }
}
---
Auth Guard Pattern
// app/_layout.tsx
import { useEffect } from &apos;react&apos;;
import { router, Stack } from &apos;expo-router&apos;;
import { supabase } from &apos;../lib/supabase&apos;;
export default function RootLayout() {
  useEffect(() =&gt; {
    supabase.auth.onAuthStateChange((event, session) =&gt; {
      if (!session) {
        router.replace(&apos;/onboarding&apos;);
      }
    });
  }, []);
  return &lt;Stack /&gt;;
}
---
Image Upload Pattern (Social Posts)
async function uploadPostImage(uri: string, userId: string): Promise&lt;string&gt; {
  const fileName = `${userId}/${Date.now()}.jpg`;
  // Convert URI to blob
  const response = await fetch(uri);
  const blob = await response.blob();
  const { data, error } = await supabase.storage
    .from(&apos;post-images&apos;)
    .upload(fileName, blob, { contentType: &apos;image/jpeg&apos;, upsert: false });
  if (error) throw new Error(&apos;Image upload failed&apos;);
  const { data: urlData } = supabase.storage
    .from(&apos;post-images&apos;)
    .getPublicUrl(data.path);
  return urlData.publicUrl;
}
---
NHTSA API Helpers
// lib/nhtsa.ts
const NHTSA_BASE = &apos;https://vpic.nhtsa.dot.gov/api/vehicles&apos;;
export async function getMakesForYear(year: number): Promise&lt;string[]&gt; {
  const res = await fetch(`${NHTSA_BASE}/getallmakes?format=json`);
  const data = await res.json();
  return data.Results.map((r: { MakeName: string }) =&gt; r.MakeName).sort();
}
export async function getModelsForMakeYear(make: string, year: number): Promise&lt;string[]&gt; {
  const res = await fetch(
    `${NHTSA_BASE}/getmodelsformakeyear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
  );
  const data = await res.json();
  return data.Results.map((r: { Model_Name: string }) =&gt; r.Model_Name).sort();
}
export async function decodeVIN(vin: string) {
  const res = await fetch(`${NHTSA_BASE}/decodevinvalues/${vin}?format=json`);
  const data = await res.json();
  return data.Results[0]; // { Make, Model, ModelYear, Trim, EngineCylinders, ... }
}
---
Constants
// lib/constants.ts
export const MAX_AI_QUERIES_PER_DAY = 20;
export const MAX_POST_IMAGES = 5;
export const MAX_GARAGE_VEHICLES = 5;
export const AI_MAX_TOKENS = 500; // Keep costs predictable
export const PARTS_CATEGORIES = [
  &apos;Suspension&apos;, &apos;Exhaust&apos;, &apos;Intake&apos;, &apos;Wheels &amp; Tires&apos;,
  &apos;Brakes&apos;, &apos;Exterior&apos;, &apos;Interior&apos;, &apos;Engine&apos;, &apos;Lighting&apos;
] as const;
---
Pre-Commit Hooks Setup
Install husky for pre-commit hooks
npm install --save-dev husky lint-staged
Initialize husky
npx husky init
.husky/pre-commit
#!/bin/sh
npx lint-staged
package.json additions
&quot;lint-staged&quot;: {
  &quot;*.{ts,tsx}&quot;: [&quot;eslint --fix&quot;, &quot;prettier --write&quot;]
},
&quot;scripts&quot;: {
  &quot;lint&quot;: &quot;eslint . --ext .ts,.tsx&quot;,
  &quot;type-check&quot;: &quot;tsc --noEmit&quot;
}
