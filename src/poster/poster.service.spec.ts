import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PosterService } from './poster.service';

describe('PosterService', () => {
  it('creates an owner-scoped poster with details from a lost post', async () => {
    const user = new Types.ObjectId(); const postId = new Types.ObjectId(); const posterId = new Types.ObjectId();
    const post = { _id: postId, author: user, type: 'lost', title: 'Missing Luna', description: 'Blue collar', species: 'dog', breed: 'beagle', photos: ['https://photo'], location: { type: 'Point', coordinates: [78, 30] }, occurredAt: new Date(), status: 'active' };
    const posters = { findOneAndUpdate: jest.fn().mockResolvedValue({ _id: posterId, user, post: postId, mobileNumber: '+91 9876543210' }) }; const posts = { findOne: jest.fn().mockResolvedValue(post) }; const metadata = { validateCurrency: jest.fn() }; const shortUrls = { forPost: jest.fn().mockResolvedValue({ url: 'https://pets.test/api/s/abc123' }) }; const qr = { toDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,qr') };
    const service = new PosterService(posters as any, posts as any, metadata as any, shortUrls as any, qr as any);
    const result = await service.create(user.toString(), { postId: postId.toString(), mobileNumber: '+91 9876543210' });
    expect(posts.findOne).toHaveBeenCalledWith({ _id: postId, author: user, type: 'lost' });
    expect(result).toEqual(expect.objectContaining({ _id: posterId, postId, heading: 'MISSING PET', title: 'Missing Luna', description: 'Blue collar', mobileNumber: '+91 9876543210', breed: 'beagle', photo: 'https://photo', shortUrl: 'https://pets.test/api/s/abc123', qrCodeDataUrl: 'data:image/png;base64,qr' }));
  });
  it('does not create a poster from another users post', async () => { const posts = { findOne: jest.fn().mockResolvedValue(null) }; const service = new PosterService({} as any, posts as any, {} as any, {} as any, {} as any); await expect(service.create(new Types.ObjectId().toString(), { postId: new Types.ObjectId().toString(), mobileNumber: '+91 9876543210' })).rejects.toBeInstanceOf(NotFoundException); });
});
