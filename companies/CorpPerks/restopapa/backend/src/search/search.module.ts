import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { JobSearchService } from './services/job-search.service';
import { EmployeeSearchService } from './services/employee-search.service';
import { MarketplaceSearchService } from './services/marketplace-search.service';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    JobSearchService,
    EmployeeSearchService,
    MarketplaceSearchService,
  ],
  exports: [
    SearchService,
    JobSearchService,
    EmployeeSearchService,
    MarketplaceSearchService,
  ],
})
export class SearchModule {}