export const CLOUD_STORAGE = Symbol('CLOUD_STORAGE');
export interface StoredObject { size: number; contentType: string; generation: string; }
export interface CloudStorage {
  createUploadUrl(key: string, contentType: string, expiresAt: Date): Promise<string>;
  getObject(key: string): Promise<StoredObject | null>;
  createDownloadUrl(key: string, generation: string, expiresAt: Date): Promise<string>;
}
