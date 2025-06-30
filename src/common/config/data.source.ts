import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ConfigModule, ConfigService } from '@nestjs/config';

ConfigModule.forRoot({
  envFilePath: `.env.${process.env.NODE_ENV.trim()}`,
});

const configService = new ConfigService();

const databaseUrl = configService.get<string>('DATABASE_URL');

export const DataSourceConfig: DataSourceOptions = databaseUrl
  ? {
    type: 'postgres',
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
    entities: [__dirname + './../../**/**/*.entity{.ts,.js}'],
    migrations: [__dirname + './../../migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: true,
    logging: false,
    namingStrategy: new SnakeNamingStrategy(),
  }
  : {
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: +configService.get('DB_PORT'),
    username: configService.get('POSTGRES_USER'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: configService.get('POSTGRES_DB'),
    ssl: { rejectUnauthorized: false },
    entities: [__dirname + './../../**/**/*.entity{.ts,.js}'],
    migrations: [__dirname + './../../migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: true,
    logging: false,
    namingStrategy: new SnakeNamingStrategy(),
  };

export const AppDS = new DataSource(DataSourceConfig);
