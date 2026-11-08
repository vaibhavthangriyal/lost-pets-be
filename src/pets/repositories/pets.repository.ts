import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertPreference } from '../entities/alert-preference.entity';
import { Comment } from '../entities/comment.entity';
import { PetPost } from '../entities/pet-post.entity';
import { Point } from '../entities/point.entity';

const publicAuthor = { path: 'author', select: 'displayName' };
@Injectable()
export class PetsRepository {
  constructor(@InjectModel(PetPost.name) private posts: Model<PetPost>, @InjectModel(Comment.name) private comments: Model<Comment>, @InjectModel(AlertPreference.name) private alerts: Model<AlertPreference>) {}
  lostPostExists(id: Types.ObjectId) { return this.posts.exists({ _id: id, type: 'lost' }); }
  postExists(id: Types.ObjectId) { return this.posts.exists({ _id: id }); }
  async createPost(data: Partial<PetPost>) { return (await this.posts.create(data)).populate(publicAuthor); }
  listPosts(filter: Record<string, unknown>, skip: number, limit: number, nearby: boolean) {
    const query = this.posts.find(filter).populate(publicAuthor).skip(skip).limit(limit);
    return nearby ? query : query.sort({ createdAt: -1, _id: -1 });
  }
  getPost(id: Types.ObjectId) { return this.posts.findById(id).populate(publicAuthor); }
  findPost(id: Types.ObjectId) { return this.posts.findById(id); }
  async savePost(post: Awaited<ReturnType<PetsRepository['findPost']>> & {}) { await post.save(); return post.populate(publicAuthor); }
  async addComment(post: Types.ObjectId, author: Types.ObjectId, text: string) { return (await this.comments.create({ post, author, text })).populate(publicAuthor); }
  listComments(post: Types.ObjectId) { return this.comments.find({ post }).populate(publicAuthor).sort({ createdAt: 1 }).limit(100); }
  updateAlert(user: Types.ObjectId, location: Point, radiusKm: number, types: string[]) {
    return this.alerts.findOneAndUpdate({ user }, { user, location, radiusKm, types }, { upsert: true, new: true, runValidators: true });
  }
  getAlert(user: Types.ObjectId) { return this.alerts.findOne({ user }); }
  deleteAlert(user: Types.ObjectId) { return this.alerts.deleteOne({ user }); }
}
