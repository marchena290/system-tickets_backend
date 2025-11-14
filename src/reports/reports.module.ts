import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tickets } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tickets, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
