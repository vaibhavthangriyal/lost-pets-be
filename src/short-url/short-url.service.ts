import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { ShortUrl } from './entities/short-url.entity';

@Injectable()
export class ShortUrlService {
  constructor(@InjectModel(ShortUrl.name) private shortUrls: Model<ShortUrl>) {}

  async forPost(post: Types.ObjectId) {
    const existing = await this.shortUrls.findOne({ post });
    if (existing) return this.output(existing);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const created = await this.shortUrls.create({ post, code: randomBytes(6).toString('base64url') });
        return this.output(created);
      } catch (error: any) {
        if (error?.code !== 11000) throw error;
        const raced = await this.shortUrls.findOne({ post });
        if (raced) return this.output(raced);
      }
    }
    throw new Error('Could not create a unique short URL');
  }

  async resolve(code: string) {
    const shortUrl = await this.shortUrls.findOne({ code });
    if (!shortUrl) throw new NotFoundException('Short URL not found');
    return { postId: shortUrl.post.toString(), targetUrl: this.postUrl(shortUrl.post) };
  }

  private output(shortUrl: ShortUrl & { code: string; post: Types.ObjectId }) {
    return { code: shortUrl.code, url: `${this.apiBase()}/s/${shortUrl.code}` };
  }

  private apiBase() { return (process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}/api`).replace(/\/$/, ''); }
  private postUrl(post: Types.ObjectId) { const web = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3001').replace(/\/$/, ''); return `${web}/?postId=${post.toString()}`; }
}
