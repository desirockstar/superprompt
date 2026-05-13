import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { SearchService } from './search.service';
import { ViewCounterService } from './view-counter.service';
import { FilesystemContentAdapter } from './adapters/filesystem-content.adapter';
import { CONTENT_REPOSITORY } from './ports/content-repository.port';
import { DatabaseModule } from '../db/db.module';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';
import { CacheModule } from '../cache/cache.module';
import { UnlockModule } from '../unlock/unlock.module';
import { RatingModule } from '../rating/rating.module';
import { AdModule } from '../ad/ad.module';

@Module({
  imports: [DatabaseModule, AuthModule, AccessModule, CacheModule, UnlockModule, RatingModule, AdModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    SearchService,
    ViewCounterService,
    {
      provide: CONTENT_REPOSITORY,
      useClass: FilesystemContentAdapter,
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
