import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { CloudStorage, StoredObject } from './cloud-storage';

@Injectable()
export class GcsStorageService implements CloudStorage {
  private readonly storage = new Storage(process.env.GCS_PROJECT_ID ? { projectId: process.env.GCS_PROJECT_ID } : {});
  private bucket() {
    const name = process.env.GCS_BUCKET;
    if (!name) throw new ServiceUnavailableException('GCS_BUCKET is not configured');
    return this.storage.bucket(name);
  }
  async createUploadUrl(key: string, contentType: string, expiresAt: Date) {
    const [url] = await this.bucket().file(key).getSignedUrl({ version: 'v4', action: 'write', expires: expiresAt, contentType, queryParams: { ifGenerationMatch: '0' } });
    return url;
  }
  async getObject(key: string): Promise<StoredObject | null> {
    try {
      const [metadata] = await this.bucket().file(key).getMetadata();
      if (!metadata.generation || !metadata.contentType || metadata.size == null) throw new Error('Incomplete GCS object metadata');
      return { size: Number(metadata.size), contentType: metadata.contentType, generation: String(metadata.generation) };
    } catch (error) {
      if ((error as { code?: number }).code === 404) return null;
      throw error;
    }
  }
  async createDownloadUrl(key: string, generation: string, expiresAt: Date) {
    const [url] = await this.bucket().file(key).getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt, queryParams: { generation } });
    return url;
  }
}
