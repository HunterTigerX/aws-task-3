import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 4000;

  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  await app.init();

  await app.listen(port, () => {
    console.log('App is running on %s port', port);
  });
}

try {
  bootstrap();
} catch (error) {
  console.error(error);
}
