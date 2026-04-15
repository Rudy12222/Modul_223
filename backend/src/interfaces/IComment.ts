export interface IComment {
    id?: number;
    content: string;
    userId: number;
    postId: number;
    createdAt?: string;
    updatedAt?: string;
}
