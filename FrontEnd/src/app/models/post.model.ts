export interface Comment {
    id?: number;
    author: string;
    text: string;
    createdAt?: Date;
}

export interface Post {
	id?: number;
	author: string;
	title: string;
	content: string;
	createdAt?: Date;
	likes: number;
	dislikes: number;
	commentCount: number;
	comments: Comment[];
}