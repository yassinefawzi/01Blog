export type Role = 'USER' | 'ADMIN';
export type MediaType = 'NONE' | 'IMAGE' | 'VIDEO';
export type NotificationType = 'NEW_POST' | 'NEW_FOLLOWER' | 'NEW_COMMENT' | 'NEW_LIKE';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface UserSummary {
  id: number;
  username: string;
  avatarUrl?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: Role;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  subscribed: boolean;
  ownProfile: boolean;
  banned?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: UserSummary;
}

export interface Post {
  id: number;
  description: string;
  mediaUrl?: string;
  mediaType: MediaType;
  createdAt: string;
  updatedAt?: string;
  author: UserSummary;
  likesCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
  comments?: Comment[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedPostId?: number;
  relatedUserId?: number;
  createdAt: string;
}

export interface Report {
  id: number;
  reporter: UserSummary;
  reportedUser?: UserSummary;
  reportedPostId?: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  bannedUsers: number;
}
