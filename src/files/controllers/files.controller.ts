import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RequestUploadDto } from '../dto/request-upload.dto';
import { FILE_ROUTES } from '../routes/files.routes';
import { FilesService } from '../services/files.service';

@Controller(FILE_ROUTES.base)
export class FilesController {
  constructor(private service: FilesService) {}
  @Get() @UseGuards(AuthGuard) list(@Req() req: any) { return this.service.list(req.user.id); }
  @Post(FILE_ROUTES.upload) @UseGuards(AuthGuard) request(@Req() req: any, @Body() dto: RequestUploadDto) { return this.service.requestUpload(req.user.id, dto); }
  @Post(FILE_ROUTES.confirm) @UseGuards(AuthGuard) confirm(@Req() req: any, @Param('id') id: string) { return this.service.confirm(req.user.id, id); }
  @Get(FILE_ROUTES.download) @UseGuards(AuthGuard) download(@Req() req: any, @Param('id') id: string) { return this.service.download(req.user.id, id); }
  @Get(FILE_ROUTES.publicContent) async content(@Param('id') id: string, @Res() response: Response) { response.redirect(await this.service.publicDownload(id)); }
}
