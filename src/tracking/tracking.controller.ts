import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';

import { User } from 'src/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTrackingDto: CreateTrackingDto, @GetUser() user: User) {
    return this.trackingService.create(createTrackingDto, user);
  }

  @Get('ticket/:ticketId')
  @UseGuards(JwtAuthGuard)
  findAll(@Param('ticketId') ticketId: number, @GetUser() user: User) {
    return this.trackingService.findAll(ticketId, user);
  }
}
