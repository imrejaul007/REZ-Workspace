import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('jobs')
  searchJobs(@Query() query: any) {
    return this.searchService.searchJobs(query);
  }

  @Get('employees')
  searchEmployees(@Query() query: any) {
    return this.searchService.searchEmployees(query);
  }

  @Get('products')
  searchProducts(@Query() query: any) {
    return this.searchService.searchProducts(query);
  }

  @Get('restaurants')
  searchRestaurants(@Query() query: any) {
    return this.searchService.searchRestaurants(query);
  }
}