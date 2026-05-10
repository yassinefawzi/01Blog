export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
}