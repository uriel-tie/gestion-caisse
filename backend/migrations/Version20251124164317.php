<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251124164317 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE caisse ADD employe_assigne_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN caisse.employe_assigne_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE caisse ADD CONSTRAINT FK_B2A353C8CB25077 FOREIGN KEY (employe_assigne_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_B2A353C8CB25077 ON caisse (employe_assigne_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE caisse DROP CONSTRAINT FK_B2A353C8CB25077');
        $this->addSql('DROP INDEX UNIQ_B2A353C8CB25077');
        $this->addSql('ALTER TABLE caisse DROP employe_assigne_id');
    }
}
