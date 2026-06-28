import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceConfig } from './common/config/data.source';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { AuthorsModule } from './authors/authors.module';
import { EditorialsModule } from './editorials/editorials.module';
import { GendersModule } from './genders/genders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailerModule } from './mailer/mailer.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV.trim()}`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(DataSourceConfig),
    BooksModule,
    UsersModule,
    AuthorsModule,
    EditorialsModule,
    GendersModule,
    ReviewsModule,
    FavoritesModule,
    AuthModule,
    CloudinaryModule,
    MailerModule,
    RecommendationsModule,
  ],
  controllers: [],
  providers: [],
})

export class AppModule { }