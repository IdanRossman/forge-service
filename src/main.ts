import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    
    // Enable CORS for production
    app.enableCors();

    // Swagger Configuration
    const config = new DocumentBuilder()
      .setTitle('Forge Service API')
      .setDescription('MapleStory Starforce Enhancement Cost Calculator API')
      .setVersion('1.0')
      .addTag('starforce', 'Starforce cost calculation endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.init();
  }
  return app;
}

// For local development
async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

// For Vercel serverless
export default async function handler(req: any, res: any) {
  const app = await createApp();
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
}

// Only bootstrap if not in Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  void bootstrap();
}
