<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251216162735 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE societe (id UUID NOT NULL, nom VARCHAR(255) NOT NULL, forme VARCHAR(50) DEFAULT NULL, adresse VARCHAR(255) DEFAULT NULL, telephone VARCHAR(50) DEFAULT NULL, registre_commerce VARCHAR(100) DEFAULT NULL, siege_social VARCHAR(255) DEFAULT NULL, capital_social VARCHAR(100) DEFAULT NULL, mode_validation VARCHAR(50) DEFAULT \'STANDARD\' NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN societe.id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE demande ADD beneficiaire_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN demande.beneficiaire_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A55AF81F68 FOREIGN KEY (beneficiaire_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_2694D7A55AF81F68 ON demande (beneficiaire_id)');
        $this->addSql('ALTER TABLE operation ADD beneficiaire VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('DROP TABLE societe');
        $this->addSql('ALTER TABLE operation DROP beneficiaire');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A55AF81F68');
        $this->addSql('DROP INDEX IDX_2694D7A55AF81F68');
        $this->addSql('ALTER TABLE demande DROP beneficiaire_id');
    }
}
