import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PetPost } from '../pets/entities/pet-post.entity';
import { MetaService } from '../meta/meta.service';
import { CreatePosterDto, UpdatePosterDto } from './dto/create-poster.dto';
import { Poster } from './entities/poster.entity';

function id(value: string) { if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid ID'); return new Types.ObjectId(value); }
@Injectable()
export class PosterService {
  constructor(@InjectModel(Poster.name) private posters: Model<Poster>, @InjectModel(PetPost.name) private posts: Model<PetPost>, private metadata: MetaService) {}
  eligiblePosts(userId: string) { return this.posts.find({ author: id(userId), type: 'lost' }).sort({ createdAt: -1 }).select('title description species breed photos location occurredAt status'); }
  async create(userId: string, dto: CreatePosterDto) {
    const user = id(userId); const post = await this.posts.findOne({ _id: id(dto.postId), author: user, type: 'lost' });
    if (!post) throw new NotFoundException('Lost-pet post not found');
    if (dto.rewardAmount !== undefined && !dto.currency) throw new BadRequestException('Currency is required when a reward is included');
    if (dto.currency) await this.metadata.validateCurrency(dto.currency);
    const poster = await this.posters.findOneAndUpdate({ user, post: post._id }, { $set: { mobileNumber: dto.mobileNumber.trim(), ...(dto.rewardAmount !== undefined ? { rewardAmount: dto.rewardAmount, currency: dto.currency } : {}) }, $setOnInsert: { user, post: post._id, heading: 'MISSING PET', title: post.title, description: post.description } }, { upsert: true, new: true, runValidators: true });
    return this.output(poster, post);
  }
  async list(userId: string) {
    const posters = await this.posters.find({ user: id(userId) }).sort({ createdAt: -1 });
    const posts = await this.posts.find({ _id: { $in: posters.map(poster => poster.post) } });
    const byId = new Map(posts.map(post => [post._id.toString(), post]));
    return posters.flatMap(poster => { const post = byId.get(poster.post.toString()); return post ? [this.output(poster, post)] : []; });
  }
  async get(userId: string, posterId: string) {
    const poster = await this.posters.findOne({ _id: id(posterId), user: id(userId) });
    if (!poster) throw new NotFoundException('Poster not found');
    const post = await this.posts.findById(poster.post); if (!post) throw new NotFoundException('Post not found');
    return this.output(poster, post);
  }
  async update(userId: string, posterId: string, dto: UpdatePosterDto) {
    if (dto.rewardAmount !== undefined && !dto.currency) throw new BadRequestException('Currency is required when a reward is included');
    if (dto.currency) await this.metadata.validateCurrency(dto.currency);
    const update = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
    const poster = await this.posters.findOneAndUpdate({ _id: id(posterId), user: id(userId) }, { $set: update }, { new: true, runValidators: true });
    if (!poster) throw new NotFoundException('Poster not found'); const post = await this.posts.findById(poster.post); if (!post) throw new NotFoundException('Post not found'); return this.output(poster, post);
  }
  async remove(userId: string, posterId: string) { const result = await this.posters.deleteOne({ _id: id(posterId), user: id(userId) }); if (!result.deletedCount) throw new NotFoundException('Poster not found'); return { deleted: true }; }
  private output(poster: Poster & { _id: Types.ObjectId }, post: PetPost & { _id: Types.ObjectId }) {
    return { _id: poster._id, postId: post._id, heading: poster.heading || 'MISSING PET', title: poster.title || post.title, description: poster.description || post.description, mobileNumber: poster.mobileNumber, rewardAmount: poster.rewardAmount, currency: poster.currency, species: post.species, breed: post.breed, photo: post.photos?.[0], location: post.location, occurredAt: post.occurredAt, status: post.status, createdAt: (poster as any).createdAt };
  }
}
