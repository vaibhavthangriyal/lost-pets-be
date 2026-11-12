import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CommentDto, CreatePostDto, SearchDto, StatusDto } from '../dto/pets.dto';
import { PETS_ROUTES } from '../routes/pets.routes';
import { CommentsService } from '../services/comments.service';
import { PostsService } from '../services/posts.service';

@Controller(PETS_ROUTES.posts)
export class PostsController {
  constructor(private posts: PostsService, private commentsService: CommentsService) { }
  @Get() list(@Query() query: SearchDto) { return this.posts.list(query); }
  @Get(PETS_ROUTES.post) get(@Param('id') postId: string) { return this.posts.get(postId); }
  @Post() @UseGuards(AuthGuard) create(@Req() req: any, @Body() dto: CreatePostDto) { return this.posts.create(req.user.id, dto); }
  @Patch(PETS_ROUTES.status) @UseGuards(AuthGuard) status(@Req() req: any, @Param('id') postId: string, @Body() dto: StatusDto) { return this.posts.status(postId, req.user.id, dto.status); }
  @Get(PETS_ROUTES.comments) comments(@Param('id') postId: string) { return this.commentsService.list(postId); }
  @Post(PETS_ROUTES.comments) @UseGuards(AuthGuard) comment(@Req() req: any, @Param('id') postId: string, @Body() dto: CommentDto) { return this.commentsService.add(postId, req.user.id, dto.text); }
  @Post(PETS_ROUTES.replies) @UseGuards(AuthGuard) reply(@Req() req: any, @Param('id') postId: string, @Param('commentId') commentId: string, @Body() dto: CommentDto) { return this.commentsService.reply(postId, commentId, req.user.id, dto.text); }
}
