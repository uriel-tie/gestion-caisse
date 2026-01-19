<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118215628 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE "role" (id UUID NOT NULL, societe_id UUID NOT NULL, nom VARCHAR(100) NOT NULL, base_role VARCHAR(50) NOT NULL, restrictions JSON NOT NULL, admin_restrictions JSON NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, is_active BOOLEAN NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_57698A6AFCF77503 ON "role" (societe_id)');
        $this->addSql('COMMENT ON COLUMN "role".id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "role".societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN "role".created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN "role".updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE "role" ADD CONSTRAINT FK_57698A6AFCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE "role" DROP CONSTRAINT FK_57698A6AFCF77503');
        $this->addSql('DROP TABLE "role"');
    }
}
