import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AlertDto, CreatePostDto, LocationDto, SearchDto } from '../dto/pets.dto';
import { PetsRepository } from '../repositories/pets.repository';

function id(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid ID');
  return new Types.ObjectId(value);
}
function point(location: LocationDto) { return { type: 'Point', coordinates: [location.longitude, location.latitude] }; }
function nonblank(value: string) {
  const result = value.trim();
  if (!result) throw new BadRequestException('Text cannot be blank');
  return result;
}
@Injectable()
export class PetsService {
  constructor(private repository: PetsRepository) { }
  async create(userId: string, dto: CreatePostDto) {
    if (dto.relatedPostId) {
      if (dto.type !== 'sighting') throw new BadRequestException('Only sightings can link to a lost-pet post');
      if (!await this.repository.lostPostExists(id(dto.relatedPostId))) throw new BadRequestException('Related lost-pet post not found');
    }
    return this.repository.createPost({ ...dto, title: nonblank(dto.title), description: nonblank(dto.description), occurredAt: new Date(dto.occurredAt), location: point(dto.location), author: id(userId), relatedPost: dto.relatedPostId ? id(dto.relatedPostId) : undefined });
  }
  list(query: SearchDto) {
    const { latitude, longitude, radiusKm } = query;
    const geoCount = [latitude, longitude, radiusKm].filter(v => v !== undefined).length;
    if (geoCount !== 0 && geoCount !== 3) throw new BadRequestException('latitude, longitude and radiusKm must be provided together');
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (geoCount === 3) filter.location = { $near: { $geometry: point({ latitude: latitude!, longitude: longitude! }), $maxDistance: radiusKm! * 1000 } };
    return this.repository.listPosts(filter, query.skip ?? 0, query.limit ?? 20, geoCount === 3);
  }
  async get(postId: string) {
    const post = await this.repository.getPost(id(postId));
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
  async status(postId: string, userId: string, status: string) {
    const post = await this.repository.findPost(id(postId));
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== userId) throw new ForbiddenException();
    post.status = status;
    return this.repository.savePost(post);
  }
  async addComment(postId: string, userId: string, text: string) {
    const post = id(postId);
    if (!await this.repository.postExists(post)) throw new NotFoundException('Post not found');
    return this.repository.addComment(post, id(userId), nonblank(text));
  }
  async listComments(postId: string) {
    const post = id(postId);
    if (!await this.repository.postExists(post)) throw new NotFoundException('Post not found');
    return this.repository.listComments(post);
  }
  async addReply(postId: string, commentId: string, userId: string, text: string) {
    const postObjectId = id(postId);
    const commentObjectId = id(commentId);
    const post = await this.repository.findPost(postObjectId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== userId) throw new ForbiddenException('Only the post owner can reply to comments');
    if (!await this.repository.findTopComment(postObjectId, commentObjectId)) throw new NotFoundException('Comment not found');
    return this.repository.addReply(postObjectId, commentObjectId, id(userId), nonblank(text));
  }
  updateAlert(userId: string, dto: AlertDto) { return this.repository.updateAlert(id(userId), point(dto.location), dto.radiusKm, dto.types); }
  getAlert(userId: string) { return this.repository.getAlert(id(userId)); }
  async deleteAlert(userId: string) { await this.repository.deleteAlert(id(userId)); return { disabled: true }; }
}
