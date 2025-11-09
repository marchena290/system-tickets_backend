import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Tickets } from '../entities/ticket.entity';
import { User } from '../entities/user.entity';
import { Tracking } from '../entities/tracking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tickets, User, Tracking])],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
