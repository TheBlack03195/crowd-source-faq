export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  categoryId: Category | string;
  tags: string[];
  viewCount: number;
  upvotes: number;
  createdAt: string;
}

export interface PostAuthor {
  _id: string;
  name: string;
  reputation: number;
}

export interface Comment {
  _id: string;
  authorId: PostAuthor | string;
  content: string;
  isAccepted: boolean;
  isVerified: boolean;
  upvotes: number;
  downvotes: number;
  isDeleted: boolean;
  createdAt: string;
}

export interface CommunityPost {
  _id: string;
  title: string;
  body: string;
  authorId: PostAuthor | string;
  categoryId: Category | string | null;
  tags: string[];
  status: 'open' | 'resolved' | 'closed';
  upvotes: number;
  comments: Comment[];
  acceptedCommentId: string | null;
  createdAt: string;
}
