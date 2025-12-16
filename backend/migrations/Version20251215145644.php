<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251215145644 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE societe (id UUID NOT NULL, nom VARCHAR(255) NOT NULL, forme VARCHAR(50) DEFAULT NULL, adresse VARCHAR(255) DEFAULT NULL, telephone VARCHAR(20) DEFAULT NULL, numero_registre_commerce VARCHAR(100) DEFAULT NULL, siege_social VARCHAR(255) DEFAULT NULL, capital_social NUMERIC(15, 2) DEFAULT NULL, logo_url VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN societe.id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE cloture ADD billetage JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT fk_2694d7a595a6ee59');
        $this->addSql('DROP INDEX idx_2694d7a595a6ee59');
        $this->addSql('ALTER TABLE demande ADD service_id UUID NOT NULL');
        $this->addSql('ALTER TABLE demande RENAME COLUMN demandeur_id TO emetteur_id');
        $this->addSql('COMMENT ON COLUMN demande.service_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A579E92E8C FOREIGN KEY (emetteur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A5ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_2694D7A579E92E8C ON demande (emetteur_id)');
        $this->addSql('CREATE INDEX IDX_2694D7A5ED5CA9E6 ON demande (service_id)');
        $this->addSql('ALTER TABLE service ADD mode_validation VARCHAR(20) DEFAULT \'STANDARD\' NOT NULL');
        $this->addSql('ALTER TABLE utilisateur ADD is_active BOOLEAN DEFAULT true NOT NULL');
        $this->addSql('ALTER TABLE utilisateur ADD is_deleted BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('DROP TABLE societe');
        $this->addSql('ALTER TABLE cloture DROP billetage');
        $this->addSql('ALTER TABLE utilisateur DROP is_active');
        $this->addSql('ALTER TABLE utilisateur DROP is_deleted');
        $this->addSql('ALTER TABLE service DROP mode_validation');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A579E92E8C');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A5ED5CA9E6');
        $this->addSql('DROP INDEX IDX_2694D7A579E92E8C');
        $this->addSql('DROP INDEX IDX_2694D7A5ED5CA9E6');
        $this->addSql('ALTER TABLE demande ADD demandeur_id UUID NOT NULL');
        $this->addSql('ALTER TABLE demande DROP emetteur_id');
        $this->addSql('ALTER TABLE demande DROP service_id');
        $this->addSql('COMMENT ON COLUMN demande.demandeur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT fk_2694d7a595a6ee59 FOREIGN KEY (demandeur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_2694d7a595a6ee59 ON demande (demandeur_id)');
    }
}
