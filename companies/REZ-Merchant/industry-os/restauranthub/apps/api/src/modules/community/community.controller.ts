import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);

  constructor(private readonly communityService: CommunityService) {}

  // NOTE: Static sub-routes (/trending, /recommended/:userId) must come BEFORE
  // the dynamic /:id route to avoid NestJS matching them as post IDs.
  @Get('posts/trending')
  async getTrendingPosts() {
    return this.communityService.getTrendingPosts();
  }

  @Get('posts/recommended/:userId')
  @UseGuards(JwtAuthGuard)
  async getRecommendedPosts(@Param('userId') userId: string) {
    return this.communityService.getRecommendedPosts(userId);
  }

  @Get('posts')
  async listPosts(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.listPosts({
      search,
      category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('posts/:id')
  @UseGuards(JwtAuthGuard)
  async getPost(@Param('id') id: string) {
    return this.communityService.getPost(id);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Request() req,
    @Body() body: { title: string; content: string; category?: string; tags?: string[] },
  ) {
    this.logger.log(`User ${req.user.id} creating post`);
    return this.communityService.createPost(req.user.id, body);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param('id') id: string,
    @Body() dto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.id} updating post ${id}`);
    return this.communityService.updatePost(id, dto, req.user.id);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Param('id') id: string, @Request() req) {
    return this.communityService.toggleLike(id, req.user.id);
  }

  @Post('posts/:id/bookmark')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async bookmarkPost(@Param('id') id: string, @Request() req) {
    return this.communityService.toggleBookmark(id, req.user.id);
  }

  @Post('posts/:id/report')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reportPost(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @Request() req,
  ) {
    return this.communityService.reportPost(id, req.user.id, dto.reason);
  }

  @Get('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  async getComments(@Param('id') postId: string) {
    return this.communityService.getComments(postId);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('id') postId: string,
    @Body() dto: { content: string },
    @Request() req,
  ) {
    return this.communityService.addComment(postId, req.user.id, dto.content);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string, @Request() req) {
    this.logger.log(`User ${req.user.id} deleting post ${id}`);
    await this.communityService.deletePost(id, req.user.id);
  }
}
