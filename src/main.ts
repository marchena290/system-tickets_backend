import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 1. Configurar Helmet para no interferir con CORS ni peticiones entre dominios
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim().replace(/\/$/, '');

  if (isProduction && !frontendOrigin) {
    throw new Error(
      'FALTA CONFIGURAR FRONTEND_ORIGIN EN LAS VARIABLES DE ENTORNO DE PRODUCCIÓN',
    );
  }

  const allowedOrigins = isProduction
    ? [frontendOrigin]
    : ['http://localhost:3000', 'http://localhost:4200'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
        return;
      }
      logger.warn(`CORS bloqueado para el origen: ${origin}`);
      callback(new Error('CORS origin not allowed'), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.set('trust proxy', 1);
  app.useGlobalFilters(new AllExceptionsFilter());

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
