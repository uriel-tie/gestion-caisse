<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251210165129 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE ligne_demande (id UUID NOT NULL, demande_id UUID NOT NULL, designation VARCHAR(255) NOT NULL, quantite INT NOT NULL, prix_unitaire_estimatif DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_B90DE99C80E95E18 ON ligne_demande (demande_id)');
        $this->addSql('COMMENT ON COLUMN ligne_demande.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN ligne_demande.demande_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE ligne_demande ADD CONSTRAINT FK_B90DE99C80E95E18 FOREIGN KEY (demande_id) REFERENCES demande (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD numero_reference VARCHAR(50) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_2694D7A5E3B03F8C ON demande (numero_reference)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE ligne_demande DROP CONSTRAINT FK_B90DE99C80E95E18');
        $this->addSql('DROP TABLE ligne_demande');
        $this->addSql('DROP INDEX UNIQ_2694D7A5E3B03F8C');
        $this->addSql('ALTER TABLE demande DROP numero_reference');
    }
}
