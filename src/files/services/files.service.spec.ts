import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FilesRepository } from '../repositories/files.repository';
import { CloudStorage } from '../storage/cloud-storage';
import { FilesService } from './files.service';

describe('FilesService', () => {
  const owner = new Types.ObjectId(); const fileId = new Types.ObjectId();
  const record = { _id: fileId, owner, key: `${owner}/image/123-id.jpg`, filename: 'pet.jpg', mimeType: 'image/jpeg', size: 10, status: 'pending' };
  let repository: { create: jest.Mock; markFailed: jest.Mock; findOwned: jest.Mock; findPublic: jest.Mock; confirm: jest.Mock; markPublic: jest.Mock };
  let storage: { createUploadUrl: jest.Mock; getObject: jest.Mock; createDownloadUrl: jest.Mock };
  let service: FilesService;
  beforeEach(() => {
    repository = { create: jest.fn().mockResolvedValue(record), markFailed: jest.fn(), findOwned: jest.fn().mockResolvedValue(record), findPublic: jest.fn(), confirm: jest.fn().mockResolvedValue({ ...record, status: 'uploaded', generation: '123' }), markPublic: jest.fn().mockResolvedValue({ matchedCount: 1 }) };
    storage = { createUploadUrl: jest.fn().mockResolvedValue('https://upload'), getObject: jest.fn().mockResolvedValue({ size: 10, contentType: 'image/jpeg', generation: '123' }), createDownloadUrl: jest.fn().mockResolvedValue('https://download') };
    service = new FilesService(repository as unknown as FilesRepository, storage as CloudStorage);
  });
  it('creates a unique owner/type scoped key and logs metadata before signing', async () => {
    const result = await service.requestUpload(owner.toString(), { filename: 'pet.jpg', mimeType: 'image/jpeg', size: 10 });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ owner, key: expect.stringMatching(new RegExp(`^${owner}/image/\\d+-[a-f0-9-]+\\.jpg$`)), size: 10, status: 'pending' }));
    expect(result.upload.headers).toEqual({ 'Content-Type': 'image/jpeg' });
  });
  it('marks the record failed when signing fails', async () => { storage.createUploadUrl.mockRejectedValue(new Error('signing')); await expect(service.requestUpload(owner.toString(), { filename: 'pet.jpg', mimeType: 'image/jpeg', size: 10 })).rejects.toThrow('signing'); expect(repository.markFailed).toHaveBeenCalledWith(fileId); });
  it('confirms only after verifying storage metadata', async () => { const result = await service.confirm(owner.toString(), fileId.toString()); expect(repository.confirm).toHaveBeenCalledWith(fileId, owner, '123'); expect(result.status).toBe('uploaded'); });
  it('rejects absent or mismatched uploads', async () => { storage.getObject.mockResolvedValueOnce(null).mockResolvedValueOnce({ size: 11, contentType: 'image/jpeg', generation: '123' }); await expect(service.confirm(owner.toString(), fileId.toString())).rejects.toBeInstanceOf(ConflictException); await expect(service.confirm(owner.toString(), fileId.toString())).rejects.toBeInstanceOf(ConflictException); expect(repository.confirm).not.toHaveBeenCalled(); });
  it('does not reveal another users file', async () => { repository.findOwned.mockResolvedValue(null); await expect(service.download(owner.toString(), fileId.toString())).rejects.toBeInstanceOf(NotFoundException); expect(storage.createDownloadUrl).not.toHaveBeenCalled(); });
  it('signs downloads for the verified generation only', async () => { repository.findOwned.mockResolvedValue({ ...record, status: 'uploaded', generation: '123' }); await service.download(owner.toString(), fileId.toString()); expect(storage.createDownloadUrl).toHaveBeenCalledWith(record.key, '123', expect.any(Date)); });
  it('publishes confirmed images for their owner', async () => { repository.findOwned.mockResolvedValue({ ...record, status: 'uploaded', generation: '123' }); await expect(service.publishImages(owner.toString(), [fileId.toString()])).resolves.toEqual([`/api/files/${fileId}/content`]); expect(repository.markPublic).toHaveBeenCalledWith([fileId], owner); });
  it('does not publish unconfirmed files', async () => { await expect(service.publishImages(owner.toString(), [fileId.toString()])).rejects.toBeInstanceOf(BadRequestException); expect(repository.markPublic).not.toHaveBeenCalled(); });
  it('signs public content without exposing private files', async () => { repository.findPublic.mockResolvedValueOnce({ ...record, status: 'uploaded', generation: '123', public: true }).mockResolvedValueOnce(null); await expect(service.publicDownload(fileId.toString())).resolves.toBe('https://download'); await expect(service.publicDownload(fileId.toString())).rejects.toBeInstanceOf(NotFoundException); });
});
