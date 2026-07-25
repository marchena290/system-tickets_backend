import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

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

  // 2. Obtener y limpiar los orígenes permitidos
  const rawOrigins =
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000';

  // Elimina espacios y barras diagonales al final (ej: "https://...app/" -> "https://...app")
  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // 3. Habilitar CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Si no hay origin (ej: Postman, llamadas servidor a servidor) o está en la lista
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return callback(null, true);
      }
      logger.warn(`CORS bloqueado para el origen: ${origin}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      return callback(new Error(`CORS rejected for origin: ${origin}`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
