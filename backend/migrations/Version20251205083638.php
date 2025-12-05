<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251205083638 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE justificatif ADD type VARCHAR(20) DEFAULT \'fichier\' NOT NULL');
        $this->addSql('ALTER TABLE justificatif ADD contenu_json JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE justificatif ADD signature_data TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE justificatif DROP type');
        $this->addSql('ALTER TABLE justificatif DROP contenu_json');
        $this->addSql('ALTER TABLE justificatif DROP signature_data');
    }
}
