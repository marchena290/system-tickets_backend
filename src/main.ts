import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './auth/seed.service';
import { AuthModule } from './auth/auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para la app (permitir peticiones desde el frontend)
  // En desarrollo: permitir solo el origen del frontend.
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  //Ejecutar el seeder de roles al iniciar la aplicación
  const seedService = app.select(AuthModule).get(SeedService);
  await seedService.seedRoles();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
