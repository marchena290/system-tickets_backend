import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const frontendOrigin =
    process.env.FRONTEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000';
  app.enableCors({
    origin: frontendOrigin,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    logger.log(`Created uploads dir: ${uploadsPath}`);
  }

  const port = Number(process.env.PORT) || 4200;
  await app.listen(port);
  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
