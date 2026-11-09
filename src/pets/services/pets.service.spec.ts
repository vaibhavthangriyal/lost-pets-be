import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PetsRepository } from '../repositories/pets.repository';
import { PetsService } from './pets.service';

describe('comment replies', () => {
  const postId = new Types.ObjectId();
  const commentId = new Types.ObjectId();
  const ownerId = new Types.ObjectId();
  let repository: { findPost: jest.Mock; findTopComment: jest.Mock; addReply: jest.Mock };
  let service: PetsService;
  beforeEach(() => {
    repository = { findPost: jest.fn().mockResolvedValue({ author: ownerId }), findTopComment: jest.fn().mockResolvedValue({ _id: commentId }), addReply: jest.fn().mockResolvedValue({ text: 'Thanks' }) };
    service = new PetsService(repository as unknown as PetsRepository);
  });
  it('allows the post owner to reply to a top-level comment', async () => {
    await expect(service.addReply(postId.toString(), commentId.toString(), ownerId.toString(), ' Thanks ')).resolves.toEqual({ text: 'Thanks' });
    expect(repository.findTopComment).toHaveBeenCalledWith(postId, commentId);
    expect(repository.addReply).toHaveBeenCalledWith(postId, commentId, ownerId, 'Thanks');
  });
  it('forbids another user', async () => {
    await expect(service.addReply(postId.toString(), commentId.toString(), new Types.ObjectId().toString(), 'Hello')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.addReply).not.toHaveBeenCalled();
  });
  it('rejects a missing, unrelated or nested comment', async () => {
    repository.findTopComment.mockResolvedValue(null);
    await expect(service.addReply(postId.toString(), commentId.toString(), ownerId.toString(), 'Hello')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects blank replies', async () => {
    await expect(service.addReply(postId.toString(), commentId.toString(), ownerId.toString(), '  ')).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.addReply).not.toHaveBeenCalled();
  });
});
