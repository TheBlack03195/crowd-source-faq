import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type PostStatus = 'open' | 'resolved' | 'closed';

export interface IComment extends Types.Subdocument {
  authorId: Types.ObjectId;
  content: string;
  isAccepted: boolean;
  isVerified: boolean;
  upvotes: number;
  downvotes: number;
  votedBy: { userId: Types.ObjectId; direction: 1 | -1 }[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isReported: boolean;
}

export interface ICommunityPost extends Document {
  title: string;
  body: string;
  authorId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId | null;
  batchId: mongoose.Types.ObjectId | null;
  tags: string[];
  status: PostStatus;
  upvotes: number;
  votedBy: { userId: Types.ObjectId; direction: 1 | -1 }[];
  comments: Types.DocumentArray<IComment>;
  acceptedCommentId: mongoose.Types.ObjectId | null;
  isReported: boolean;
  isTakenDown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    isAccepted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    votedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        direction: { type: Number, enum: [1, -1] },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const communityPostSchema = new Schema<ICommunityPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    tags: { type: [String], default: [], index: true },
    status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open', index: true },
    upvotes: { type: Number, default: 0 },
    votedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        direction: { type: Number, enum: [1, -1] },
      },
    ],
    comments: { type: [commentSchema], default: [] },
    acceptedCommentId: { type: Schema.Types.ObjectId, default: null },
    isReported: { type: Boolean, default: false },
    isTakenDown: { type: Boolean, default: false },
  },
  { timestamps: true }
);

communityPostSchema.index({ title: 'text', body: 'text', tags: 'text' });

export const CommunityPost: Model<ICommunityPost> =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>('CommunityPost', communityPostSchema, 'yaksha_faq_communityposts');
