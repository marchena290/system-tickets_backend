import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { TrackingModule } from './tracking/tracking.module';
import { ReportsModule } from './reports/reports.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_TICKETS,
      autoLoadEntities: true,
      synchronize: true,
    }),
    // Servir archivos estáticos desde /uploads
    ServeStaticModule.forRoot({
      // Usa process.cwd() para apuntar a la carpeta uploads del proyecto (no a dist/uploads)
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      // evita que rutas /api... sean interceptadas por el servidor de archivos estáticos
      exclude: ['/api*'],
    }),

    AuthModule,

    TicketsModule,

    TrackingModule,

    ReportsModule,

    UsersModule,

    ReportsModule,
    ScheduleModule.forRoot(),
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
