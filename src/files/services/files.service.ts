import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { RequestUploadDto } from '../dto/request-upload.dto';
import { UploadedFile } from '../entities/file.entity';
import { FilesRepository } from '../repositories/files.repository';
import { CLOUD_STORAGE, CloudStorage } from '../storage/cloud-storage';

const URL_LIFETIME_MS = 15 * 60 * 1000;
function objectId(value: string) { if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid file ID'); return new Types.ObjectId(value); }
function publicInfo(file: UploadedFile & { _id: Types.ObjectId }) {
  return { id: file._id.toString(), filename: file.filename, mimeType: file.mimeType, size: file.size, durationSeconds: file.durationSeconds, status: file.status, confirmedAt: file.confirmedAt };
}
@Injectable()
export class FilesService {
  constructor(private repository: FilesRepository, @Inject(CLOUD_STORAGE) private storage: CloudStorage) {}
  async list(userId: string) { return (await this.repository.listOwned(objectId(userId))).map(publicInfo); }
  async requestUpload(userId: string, dto: RequestUploadDto) {
    const owner = objectId(userId);
    const mimeType = dto.mimeType.toLowerCase();
    const fileType = mimeType.split('/')[0];
    const extension = /\.([a-zA-Z0-9]{1,16})$/.exec(dto.filename)?.[1]?.toLowerCase() ?? 'bin';
    const key = `${owner}/${fileType}/${Date.now()}-${randomUUID()}.${extension}`;
    const uploadExpiresAt = new Date(Date.now() + URL_LIFETIME_MS);
    const file = await this.repository.create({ owner, key, filename: dto.filename, mimeType, size: dto.size, durationSeconds: dto.durationSeconds, uploadExpiresAt, status: 'pending' });
    try {
      const url = await this.storage.createUploadUrl(key, mimeType, uploadExpiresAt);
      return { file: publicInfo(file), upload: { url, method: 'PUT', headers: { 'Content-Type': mimeType }, expiresAt: uploadExpiresAt } };
    } catch (error) { await this.repository.markFailed(file._id); throw error; }
  }
  async confirm(userId: string, fileId: string) {
    const owner = objectId(userId); const id = objectId(fileId);
    const file = await this.repository.findOwned(id, owner);
    if (!file) throw new NotFoundException('File not found');
    if (file.status === 'uploaded') return publicInfo(file);
    if (file.status !== 'pending') throw new ConflictException('Upload cannot be confirmed');
    const object = await this.storage.getObject(file.key);
    if (!object) throw new ConflictException('File has not been uploaded');
    if (object.size !== file.size || object.contentType !== file.mimeType) throw new ConflictException('Uploaded file size or content type does not match the request');
    const confirmed = await this.repository.confirm(id, owner, object.generation);
    if (confirmed) return publicInfo(confirmed);
    const current = await this.repository.findOwned(id, owner);
    if (current?.status === 'uploaded') return publicInfo(current);
    throw new ConflictException('Upload cannot be confirmed');
  }
  async download(userId: string, fileId: string) {
    const file = await this.repository.findOwned(objectId(fileId), objectId(userId));
    if (!file) throw new NotFoundException('File not found');
    if (file.status !== 'uploaded' || !file.generation) throw new ConflictException('File is not confirmed');
    const expiresAt = new Date(Date.now() + URL_LIFETIME_MS);
    return { file: publicInfo(file), download: { url: await this.storage.createDownloadUrl(file.key, file.generation, expiresAt), expiresAt } };
  }
  async publishImages(userId: string, fileIds: string[]) {
    const owner = objectId(userId);
    const ids = fileIds.map(objectId);
    const files = await Promise.all(ids.map(id => this.repository.findOwned(id, owner)));
    if (files.some(file => !file || file.status !== 'uploaded' || !file.generation)) throw new BadRequestException('Every post photo must be uploaded and confirmed');
    if (files.some(file => !file!.mimeType.startsWith('image/'))) throw new BadRequestException('Post photos must be image files');
    const result = await this.repository.markPublic(ids, owner);
    if (result.matchedCount !== ids.length) throw new ConflictException('Could not publish all post photos');
    return ids.map(id => `/api/files/${id}/content`);
  }
  async publicDownload(fileId: string) {
    const file = await this.repository.findPublic(objectId(fileId));
    if (!file || !file.generation) throw new NotFoundException('Photo not found');
    const expiresAt = new Date(Date.now() + URL_LIFETIME_MS);
    return this.storage.createDownloadUrl(file.key, file.generation, expiresAt);
  }
}
