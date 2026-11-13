import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ShortUrlService } from './short-url.service';

@Controller('s')
export class ShortUrlController {
  constructor(private shortUrls: ShortUrlService) {}

  @Get(':code')
  async open(@Param('code') code: string, @Res() response: Response) {
    const result = await this.shortUrls.resolve(code);
    return response.redirect(302, result.targetUrl);
  }
}
