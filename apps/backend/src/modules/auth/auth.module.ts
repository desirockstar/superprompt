import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../db/db.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CacheModule } from '../cache/cache.module';

@Global()
@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}