import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.login(body.email, body.password);
    return { token: user.id, ...user };
  }

  @Post('logout')
  async logout() {
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.authService.getUser(req.user.id);
  }
}