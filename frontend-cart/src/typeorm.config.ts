import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true, // Set to false in production
  ssl: {
    rejectUnauthorized: false, // For RDS SSL
  },
};

// For Lambda environment with Secrets Manager
export const getTypeOrmConfig = async (): Promise<TypeOrmModuleOptions> => {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: process.env.DB_SECRET_ARN,
    }),
  );

  const secret = JSON.parse(response.SecretString);

  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: secret.username,
    password: secret.password,
    database: process.env.DB_NAME,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true, // Set to false in production
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
