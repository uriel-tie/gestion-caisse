<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118215738 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE utilisateur ADD custom_role_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN utilisateur.custom_role_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE utilisateur ADD CONSTRAINT FK_1D1C63B3D15A4B61 FOREIGN KEY (custom_role_id) REFERENCES "role" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_1D1C63B3D15A4B61 ON utilisateur (custom_role_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE utilisateur DROP CONSTRAINT FK_1D1C63B3D15A4B61');
        $this->addSql('DROP INDEX IDX_1D1C63B3D15A4B61');
        $this->addSql('ALTER TABLE utilisateur DROP custom_role_id');
    }
}
