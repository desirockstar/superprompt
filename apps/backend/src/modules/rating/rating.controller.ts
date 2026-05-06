import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';

@Controller('prompts')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(RequiredAuthGuard)
  @Post(':slug/rate')
  async submitRating(
    @Param('slug') promptSlug: string,
    @Body() body: { rating: number },
    @Req() req: any,
  ) {
    return this.ratingService.submitRating(req.user.id, promptSlug, body.rating);
  }

  @Get(':slug/rating')
  async getRating(@Param('slug') promptSlug: string) {
    return this.ratingService.getRating(promptSlug);
  }
}