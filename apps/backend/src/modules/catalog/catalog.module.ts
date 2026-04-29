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
import { EvaluationModule } from '../evaluation/evaluation.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, AuthModule, AccessModule, EvaluationModule, CacheModule],
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
