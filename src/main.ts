// Load .env into process.env before anything reads it (e.g. Alpaca config).
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'public'));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
