import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../db/db.module';
import { AuthGuard } from '../../common/guards/auth.guard';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}