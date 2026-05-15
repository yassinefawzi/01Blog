import { User } from './user.model';


export interface Comment {
  id?: number;
  author: User;
  text: string;
  createdAt?: Date;
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
