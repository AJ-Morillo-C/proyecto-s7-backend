import { MigrationInterface, QueryRunner } from "typeorm";

export class Libros21785252522721 implements MigrationInterface {
    name = 'Libros21785252522721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "favorite_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "favorite_book_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "review_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "review_book_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "book" DROP CONSTRAINT "book_author_fkey"`);
        await queryRunner.query(`ALTER TABLE "book" DROP CONSTRAINT "book_editorial_fkey"`);
        await queryRunner.query(`ALTER TABLE "book" DROP CONSTRAINT "book_gender_fkey"`);
        await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "unique_user_book_favorite"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "unique_user_book_review"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "refresh_token" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "refresh_token_expires_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "author" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "author" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "editorial" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "editorial" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "book_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "book" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "book" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "gender" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "gender" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "favorite" ADD CONSTRAINT "FK_12cce8678b1fa10d60eeaa0cc95" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorite" ADD CONSTRAINT "FK_e666fc7cc4c80fba1944daa1a74" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_81446f2ee100305f42645d4d6c2" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_c8c387802649e72190078ed5a78" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book" ADD CONSTRAINT "FK_85c8d63d50f8e617e2a49176718" FOREIGN KEY ("author") REFERENCES "author"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book" ADD CONSTRAINT "FK_c438a80785bb31b9b7b950dc009" FOREIGN KEY ("editorial") REFERENCES "editorial"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book" ADD CONSTRAINT "FK_db379bc4e6f321fb9eb623eea4a" FOREIGN KEY ("gender") REFERENCES "gender"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "book" DROP CONSTRAINT "FK_db379bc4e6f321fb9eb623eea4a"`);
        await queryRunner.query(`ALTER TABLE "book" DROP CONSTRAINT "FK_c438a80785bb31b9b7b950dc009"`);
        await queryRunner.query(`ALTER TABLE "book" DROP CONSTRAINT "FK_85c8d63d50f8e617e2a49176718"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_c8c387802649e72190078ed5a78"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_81446f2ee100305f42645d4d6c2"`);
        await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "FK_e666fc7cc4c80fba1944daa1a74"`);
        await queryRunner.query(`ALTER TABLE "favorite" DROP CONSTRAINT "FK_12cce8678b1fa10d60eeaa0cc95"`);
        await queryRunner.query(`ALTER TABLE "gender" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "gender" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "book" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "book" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "review" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "book_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "favorite" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "editorial" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "editorial" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "author" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "author" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refresh_token_expires_at"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refresh_token"`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "unique_user_book_review" UNIQUE ("user_id", "book_id")`);
        await queryRunner.query(`ALTER TABLE "favorite" ADD CONSTRAINT "unique_user_book_favorite" UNIQUE ("user_id", "book_id")`);
        await queryRunner.query(`ALTER TABLE "book" ADD CONSTRAINT "book_gender_fkey" FOREIGN KEY ("gender") REFERENCES "gender"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book" ADD CONSTRAINT "book_editorial_fkey" FOREIGN KEY ("editorial") REFERENCES "editorial"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "book" ADD CONSTRAINT "book_author_fkey" FOREIGN KEY ("author") REFERENCES "author"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "review_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorite" ADD CONSTRAINT "favorite_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
