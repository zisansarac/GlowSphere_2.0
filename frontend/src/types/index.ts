
export interface User {
    _id: string;
    email: string;
    username?: string;
    bio?: string;
    profileImage?: string;
    createdAt: string;
}

export interface Post {
    _id: string;
    user: User; 
    caption: string;
    imageUrl: string;
    tags: string[];
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    location?: string;
}

export interface AlertState {
    msg: string;
    type: 'error' | 'success' | 'info';
}