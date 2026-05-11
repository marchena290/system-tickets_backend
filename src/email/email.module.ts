import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { NotificationLog } from '../entities/notification-log.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([NotificationLog])],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
