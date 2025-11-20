<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251120132253 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE demande ADD caissier_traitant_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN demande.caissier_traitant_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A5FD005144 FOREIGN KEY (caissier_traitant_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_2694D7A5FD005144 ON demande (caissier_traitant_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A5FD005144');
        $this->addSql('DROP INDEX IDX_2694D7A5FD005144');
        $this->addSql('ALTER TABLE demande DROP caissier_traitant_id');
    }
}
