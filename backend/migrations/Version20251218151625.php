<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251218151625 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE notification DROP CONSTRAINT fk_bf5476caa76ed395');
        $this->addSql('DROP INDEX idx_bf5476caa76ed395');
        $this->addSql('ALTER TABLE notification RENAME COLUMN user_id TO utilisateur_id');
        $this->addSql('ALTER TABLE notification RENAME COLUMN link TO lien');
        $this->addSql('ALTER TABLE notification RENAME COLUMN is_read TO est_lu');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_BF5476CAFB88E14F ON notification (utilisateur_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE notification DROP CONSTRAINT FK_BF5476CAFB88E14F');
        $this->addSql('DROP INDEX IDX_BF5476CAFB88E14F');
        $this->addSql('ALTER TABLE notification RENAME COLUMN utilisateur_id TO user_id');
        $this->addSql('ALTER TABLE notification RENAME COLUMN lien TO link');
        $this->addSql('ALTER TABLE notification RENAME COLUMN est_lu TO is_read');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT fk_bf5476caa76ed395 FOREIGN KEY (user_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_bf5476caa76ed395 ON notification (user_id)');
    }
}
