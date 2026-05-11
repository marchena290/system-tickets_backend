import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { Tracking } from '../entities/tracking.entity';
import { Tickets } from '../entities/ticket.entity';
import { User } from '../entities/user.entity';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tracking, Tickets, User]), EmailModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
