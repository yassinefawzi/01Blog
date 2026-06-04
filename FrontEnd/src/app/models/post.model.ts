import { User } from './user.model';


export interface Comment {
  id?: number;
  author?: User | string;
  authorName?: string;
  text?: string;
  content?: string;
  createdAt?: Date | string;
}

export interface Post {
  id?: number;
  author: User
  title: string;
  category?: string;
  mediaUrl?: string;
  mediaType?: string;
  content: string;
  createdAt?: Date;
  likes: number;
  dislikes: number;
  commentCount: number;
  comments: Comment[];
}
