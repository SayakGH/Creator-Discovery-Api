import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddToShortlistDto } from './dto/add-to-shortlist.dto';
import { ShortlistService } from './shortlist.service';

@Controller('shortlist')
@UseGuards(JwtAuthGuard)
export class ShortlistController {
  constructor(private shortlistService: ShortlistService) {}

  @Post()
  add(@Request() req, @Body() dto: AddToShortlistDto) {
    return this.shortlistService.add(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.shortlistService.findAll(req.user.id);
  }

  @Delete(':creatorId')
  remove(@Request() req, @Param('creatorId') creatorId: string) {
    return this.shortlistService.remove(req.user.id, creatorId);
  }
}
