import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './auth/seed.service';
import { AuthModule } from './auth/auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Ejecutar el seeder de roles al iniciar la aplicación
  const seedService = app.select(AuthModule).get(SeedService);
  await seedService.seedRoles();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
