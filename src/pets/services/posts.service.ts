import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FilesService } from '../../files/services/files.service';
import { MetaService } from '../../meta/meta.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreatePostDto, LocationDto, SearchDto } from '../dto/pets.dto';
import { PetsRepository } from '../repositories/pets.repository';

function id(value: string) { if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid ID'); return new Types.ObjectId(value); }
function point(location: LocationDto) { return { type: 'Point', coordinates: [location.longitude, location.latitude] }; }
function nonblank(value: string) { const result = value.trim(); if (!result) throw new BadRequestException('Text cannot be blank'); return result; }

@Injectable()
export class PostsService {
  constructor(private repository: PetsRepository, private files: FilesService, private metadata: MetaService, private notifications: NotificationsService) {}
  async create(userId: string, dto: CreatePostDto) {
    await this.metadata.validatePost(dto.type, dto.species, dto.breed);
    if (dto.relatedPostId) {
      if (dto.type !== 'sighting') throw new BadRequestException('Only sightings can link to a lost-pet post');
      if (!await this.repository.lostPostExists(id(dto.relatedPostId))) throw new BadRequestException('Related lost-pet post not found');
    }
    const { photoFileIds = [], ...post } = dto;
    if ((post.photos?.length ?? 0) + photoFileIds.length > 10) throw new BadRequestException('A post can have at most 10 photos');
    const uploadedPhotos = photoFileIds.length ? await this.files.publishImages(userId, photoFileIds) : [];
    const created = await this.repository.createPost({ ...post, photos: [...(post.photos ?? []), ...uploadedPhotos], title: nonblank(dto.title), description: nonblank(dto.description), occurredAt: new Date(dto.occurredAt), location: point(dto.location), author: id(userId), relatedPost: dto.relatedPostId ? id(dto.relatedPostId) : undefined });
    void this.notifications.saveAutomaticLocation(userId, dto.location, 'post').catch(error => console.error('Automatic post location save failed', error));
    void this.notifications.postCreated(created as any, userId).catch(error => console.error('Notification processing failed', error));
    return created;
  }
  list(query: SearchDto) {
    const { latitude, longitude, radiusKm } = query;
    const geoCount = [latitude, longitude, radiusKm].filter(value => value !== undefined).length;
    if (geoCount !== 0 && geoCount !== 3) throw new BadRequestException('latitude, longitude and radiusKm must be provided together');
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (geoCount === 3) filter.location = { $near: { $geometry: point({ latitude: latitude!, longitude: longitude! }), $maxDistance: radiusKm! * 1000 } };
    return this.repository.listPosts(filter, query.skip ?? 0, query.limit ?? 20, geoCount === 3);
  }
  async get(postId: string) { const post = await this.repository.getPost(id(postId)); if (!post) throw new NotFoundException('Post not found'); return post; }
  async status(postId: string, userId: string, status: string) { const post = await this.repository.findPost(id(postId)); if (!post) throw new NotFoundException('Post not found'); if (post.author.toString() !== userId) throw new ForbiddenException(); post.status = status; return this.repository.savePost(post); }
}
