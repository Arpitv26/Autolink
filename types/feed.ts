export type FeedAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

export type FeedVehicle = {
  id: string;
  label: string;
};

export type FeedPost = {
  id: string;
  userId: string;
  caption: string;
  imageUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: FeedAuthor;
  vehicle: FeedVehicle | null;
  likedByCurrentUser: boolean;
  followedByCurrentUser: boolean;
};

export type FeedComment = {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: FeedAuthor;
};
