import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreatePosterDto, UpdatePosterDto } from './dto/create-poster.dto';
import { PosterService } from './poster.service';

@Controller('posters') @UseGuards(AuthGuard)
export class PosterController {
  constructor(private service: PosterService) {}
  @Get('eligible-posts') eligible(@Req() req: any) { return this.service.eligiblePosts(req.user.id); }
  @Get() list(@Req() req: any) { return this.service.list(req.user.id); }
  @Post() create(@Req() req: any, @Body() dto: CreatePosterDto) { return this.service.create(req.user.id, dto); }
  @Get(':id') get(@Req() req: any, @Param('id') id: string) { return this.service.get(req.user.id, id); }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePosterDto) { return this.service.update(req.user.id, id, dto); }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) { return this.service.remove(req.user.id, id); }
}
