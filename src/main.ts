import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('P3AI X-Node API')
    .setDescription('API documentation for the P3AI X-Node network')
    .setVersion('1.0')
    .addTag('did', 'DID operations')
    .addTag('vc', 'Verifiable Credential operations')
    .addTag('agents', 'Agent operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('node.port') ?? 3000;
  await app.listen(port);

  console.log(`🚀 P3AI X-Node running on port ${port}`);
  console.log(
    `📚 API Documentation available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
