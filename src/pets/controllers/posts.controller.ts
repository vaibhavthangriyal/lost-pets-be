import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CommentDto, CreatePostDto, SearchDto, StatusDto } from '../dto/pets.dto';
import { PETS_ROUTES } from '../routes/pets.routes';
import { PetsService } from '../services/pets.service';

@Controller(PETS_ROUTES.posts)
export class PostsController {
  constructor(private service: PetsService) { }
  @Get() list(@Query() query: SearchDto) { return this.service.list(query); }
  @Get(PETS_ROUTES.post) get(@Param('id') postId: string) { return this.service.get(postId); }
  @Post() @UseGuards(AuthGuard) create(@Req() req: any, @Body() dto: CreatePostDto) { return this.service.create(req.user.id, dto); }
  @Patch(PETS_ROUTES.status) @UseGuards(AuthGuard) status(@Req() req: any, @Param('id') postId: string, @Body() dto: StatusDto) { return this.service.status(postId, req.user.id, dto.status); }
  @Get(PETS_ROUTES.comments) comments(@Param('id') postId: string) { return this.service.listComments(postId); }
  @Post(PETS_ROUTES.comments) @UseGuards(AuthGuard) comment(@Req() req: any, @Param('id') postId: string, @Body() dto: CommentDto) { return this.service.addComment(postId, req.user.id, dto.text); }
  @Post(PETS_ROUTES.replies) @UseGuards(AuthGuard) reply(@Req() req: any, @Param('id') postId: string, @Param('commentId') commentId: string, @Body() dto: CommentDto) { return this.service.addReply(postId, commentId, req.user.id, dto.text); }
}
