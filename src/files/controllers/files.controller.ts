import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RequestUploadDto } from '../dto/request-upload.dto';
import { FILE_ROUTES } from '../routes/files.routes';
import { FilesService } from '../services/files.service';

@Controller(FILE_ROUTES.base) @UseGuards(AuthGuard)
export class FilesController {
  constructor(private service: FilesService) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.id); }
  @Post(FILE_ROUTES.upload) request(@Req() req: any, @Body() dto: RequestUploadDto) { return this.service.requestUpload(req.user.id, dto); }
  @Post(FILE_ROUTES.confirm) confirm(@Req() req: any, @Param('id') id: string) { return this.service.confirm(req.user.id, id); }
  @Get(FILE_ROUTES.download) download(@Req() req: any, @Param('id') id: string) { return this.service.download(req.user.id, id); }
}
