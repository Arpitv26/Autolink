import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { AIPage } from "./components/ai-page";
import { PlannerPage } from "./components/planner-page";
import { FeedPage } from "./components/feed-page";
import { ProfilePage } from "./components/profile-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: ProfilePage },
      { path: "ai", Component: AIPage },
      { path: "planner", Component: PlannerPage },
      { path: "feed", Component: FeedPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);
