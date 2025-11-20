<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251120091243 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE demande (id UUID NOT NULL, demandeur_id UUID NOT NULL, operation_id UUID DEFAULT NULL, type VARCHAR(50) NOT NULL, titre VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, montant_estime NUMERIC(12, 2) NOT NULL, statut VARCHAR(50) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_2694D7A595A6EE59 ON demande (demandeur_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_2694D7A544AC3583 ON demande (operation_id)');
        $this->addSql('COMMENT ON COLUMN demande.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.demandeur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.operation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE service (id UUID NOT NULL, chef_id UUID DEFAULT NULL, nom VARCHAR(100) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_E19D9AD2150A48F1 ON service (chef_id)');
        $this->addSql('COMMENT ON COLUMN service.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN service.chef_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A595A6EE59 FOREIGN KEY (demandeur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A544AC3583 FOREIGN KEY (operation_id) REFERENCES operation (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE service ADD CONSTRAINT FK_E19D9AD2150A48F1 FOREIGN KEY (chef_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE utilisateur ADD service_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN utilisateur.service_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE utilisateur ADD CONSTRAINT FK_1D1C63B3ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_1D1C63B3ED5CA9E6 ON utilisateur (service_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE utilisateur DROP CONSTRAINT FK_1D1C63B3ED5CA9E6');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A595A6EE59');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A544AC3583');
        $this->addSql('ALTER TABLE service DROP CONSTRAINT FK_E19D9AD2150A48F1');
        $this->addSql('DROP TABLE demande');
        $this->addSql('DROP TABLE service');
        $this->addSql('DROP INDEX IDX_1D1C63B3ED5CA9E6');
        $this->addSql('ALTER TABLE utilisateur DROP service_id');
    }
}
