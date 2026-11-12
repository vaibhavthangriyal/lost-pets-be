import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types }                                                                  from 'mongoose';
import { PetsRepository }                                                         from '../repositories/pets.repository';

function id(value: string) { if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid ID'); return new Types.ObjectId(value); }
function nonblank(value: string) { const result = value.trim(); if (!result) throw new BadRequestException('Text cannot be blank'); return result; }

@Injectable()
export class CommentsService {
  constructor(private repository: PetsRepository) {}
  async add(postId: string, userId: string, text: string) { const post = id(postId); if (!await this.repository.postExists(post)) throw new NotFoundException('Post not found'); return this.repository.addComment(post, id(userId), nonblank(text)); }
  async list(postId: string) { const post = id(postId); if (!await this.repository.postExists(post)) throw new NotFoundException('Post not found'); return this.repository.listComments(post); }
  async reply(postId: string, commentId: string, userId: string, text: string) {
    const postObjectId = id(postId); const commentObjectId = id(commentId);
    const post         = await this.repository.findPost(postObjectId);
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== userId) throw new ForbiddenException('Only the post owner can reply to comments');
    if (!await this.repository.findTopComment(postObjectId, commentObjectId)) throw new NotFoundException('Comment not found');
    return this.repository.addReply(postObjectId, commentObjectId, id(userId), nonblank(text));
  }
}
