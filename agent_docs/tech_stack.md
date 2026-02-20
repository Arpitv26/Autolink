agent_docs/tech_stack.md
Save as: agent_docs/tech_stack.md
Tech Stack &amp; Tools — AutoLink
Core Stack Summary
| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Mobile Framework | Expo (React Native) | SDK 52+ | iOS + Android from one codebase |
| Language | TypeScript | 5.x | Type-safe JS (your Java background transfers well) |
| Backend/BaaS | Supabase | Latest | Database + Auth + Storage + Edge Functions |
| Database | PostgreSQL (via Supabase) | 15+ | Relational data for users/builds/posts |
| AI API | OpenAI GPT-4o mini | Latest | Car modification AI assistant |
| Vehicle Data | NHTSA vPIC + CarQuery | Free | Make/model/year/specs — no key needed |
| Image Storage | Supabase Storage | Free tier | Car build photos, avatars |
| Push Notifications | Expo Push Notifications | Free | Likes, comments, follows |
| Auth | Supabase Auth (Google OAuth) | — | Social login, no passwords |
| Navigation | Expo Router | v3+ | File-based routing like Next.js |
| Deployment | Expo EAS Build | Free tier | iOS TestFlight + Android APK |
---
Project Setup Commands
1. Install Expo CLI
npm install -g @expo/cli
2. Create AutoLink project
npx create-expo-app AutoLink --template
Select: Blank (TypeScript)
3. Install core dependencies
cd AutoLink
npx expo install expo-router expo-image expo-image-picker expo-av
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
4. Install UI/chat libraries
npm install react-native-gifted-chat openai
5. Run on phone (scan QR with Expo Go app)
npx expo start
---
Supabase Client Setup
// lib/supabase.ts
import { createClient } from &apos;@supabase/supabase-js&apos;;
import AsyncStorage from &apos;@react-native-async-storage/async-storage&apos;;
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
---
Key Libraries
Navigation (Expo Router)
// app/(tabs)/index.tsx — file-based routing
// Bottom tabs: (tabs)/ai.tsx, (tabs)/planner.tsx, (tabs)/feed.tsx, (tabs)/profile.tsx
import { Tabs } from &apos;expo-router&apos;;
export default function TabsLayout() {
  return (
    &lt;Tabs&gt;
      &lt;Tabs.Screen name=&quot;ai&quot; options={{ title: &apos;AI&apos;, tabBarIcon: ... }} /&gt;
      &lt;Tabs.Screen name=&quot;planner&quot; options={{ title: &apos;Planner&apos; }} /&gt;
      &lt;Tabs.Screen name=&quot;feed&quot; options={{ title: &apos;Feed&apos; }} /&gt;
      &lt;Tabs.Screen name=&quot;profile&quot; options={{ title: &apos;Profile&apos; }} /&gt;
    &lt;/Tabs&gt;
  );
}
Drag-and-Drop (Reanimated)
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from &apos;react-native-reanimated&apos;;
import { Gesture, GestureDetector } from &apos;react-native-gesture-handler&apos;;
// Use GestureDetector + Pan gesture for draggable mod cards
AI Chat UI
import { GiftedChat, IMessage } from &apos;react-native-gifted-chat&apos;;
// Mature, production-ready chat component — use this, don&apos;t build from scratch
Image Picker (for social posts)
import * as ImagePicker from &apos;expo-image-picker&apos;;
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsMultipleSelection: true,
  quality: 0.8,
});
---
Environment Variables (.env.local)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DO NOT put OPENAI_API_KEY here — use Supabase Edge Function instead
---
Folder Structure
AutoLink/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── ai.tsx          # AI Chat screen
│   │   ├── planner.tsx     # Mod Planner screen
│   │   ├── feed.tsx        # Social Feed screen
│   │   └── profile.tsx     # Profile/Garage screen
│   ├── _layout.tsx         # Root layout + auth guard
│   └── onboarding.tsx      # Onboarding flow
├── components/             # Reusable UI components
│   ├── PostCard.tsx
│   ├── ModCard.tsx
│   ├── VehiclePicker.tsx
│   └── AIMessage.tsx
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── openai.ts           # AI hook (calls Edge Function, not OpenAI directly)
│   └── nhtsa.ts            # NHTSA API helpers
├── data/
│   └── parts_catalog.json  # Mocked ~150 aftermarket parts
├── hooks/
│   ├── useAuth.ts
│   ├── useBuilds.ts
│   └── usePosts.ts
├── supabase/
│   └── functions/
│       └── ai-chat/        # Edge Function for OpenAI proxy
└── agent_docs/             # AI agent documentation (this folder)
---
Free Tier Limits (Feb 2026)
| Service | Free Limit | Risk |
|---------|-----------|------|
| Supabase DB | 500MB storage | Very safe for demo |
| Supabase Storage | 1GB | ~3,000 car photos |
| Supabase Bandwidth | 2GB/month | Fine for 100 users |
| Supabase Auth | Unlimited users | No limit |
| Supabase Edge Functions | 500K invocations/month | Well within demo range |
| Expo EAS Build | 30 builds/month | Plenty for dev cycle |
| NHTSA vPIC | Unlimited | Government API |
| CarQuery | Unlimited (attribution required) | No rate limits at demo scale |
⚠️ **Supabase Pause Warning:** Free tier projects pause after 1 week of inactivity.
Fix: Add a daily health-check ping (cron job or GitHub Action) to keep the project alive.
---
Error Handling Pattern
// Always wrap Supabase calls — never assume they succeed
async function fetchBuilds(userId: string) {
  const { data, error } = await supabase
    .from(&apos;builds&apos;)
    .select(&apos;*, build_items(*)&apos;)
    .eq(&apos;user_id&apos;, userId)
    .order(&apos;created_at&apos;, { ascending: false });
  if (error) {
    console.error(&apos;fetchBuilds error:&apos;, error.message);
    // Show user-friendly error, not raw error message
    throw new Error(&apos;Could not load your builds. Please try again.&apos;);
  }
  return data;
}
---
Naming Conventions
Files: kebab-case.tsx for screens, PascalCase.tsx for components
Types: PascalCase — type UserProfile = { ... }
Hooks: camelCase starting with use — useAuth, useBuilds
Supabase table names: snake_case — build_items, user_profiles
Constants: SCREAMING_SNAKE_CASE — MAX_QUERIES_PER_DAY = 20
No any type — use unknown with type guards, or define interfaces
