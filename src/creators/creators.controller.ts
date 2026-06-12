import { Controller, Get, Param, Query } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { QueryCreatorsDto } from './dto/query-creators.dto';

@Controller('creators')
export class CreatorsController {
  constructor(private creatorsService: CreatorsService) {}

  @Get()
  findAll(@Query() query: QueryCreatorsDto) {
    return this.creatorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creatorsService.findOne(id);
  }
}
