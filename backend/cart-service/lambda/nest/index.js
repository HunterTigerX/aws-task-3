const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../../../frontend-cart/src/app.module");
const serverlessExpress = require("@codegenie/serverless-express");

let server;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

exports.handler = async (event, context, callback) => {
  const expressApp = await bootstrap();
  server = server ?? expressApp;
  return server(event, context, callback);
};
