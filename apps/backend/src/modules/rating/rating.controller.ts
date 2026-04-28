import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';

@Controller('prompts')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(RequiredAuthGuard)
  @Post(':id/rate')
  async submitRating(
    @Param('id') promptId: string,
    @Body() body: { rating: number },
    @Req() req: any,
  ) {
    return this.ratingService.submitRating(req.user.id, promptId, body.rating);
  }

  @Get(':id/rating')
  async getRating(@Param('id') promptId: string) {
    return this.ratingService.getRating(promptId);
  }
}