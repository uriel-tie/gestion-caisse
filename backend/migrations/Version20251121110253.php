<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251121110253 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE caisse (id UUID NOT NULL, nom VARCHAR(100) NOT NULL, est_ouverte BOOLEAN NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN caisse.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE session_caisse (id UUID NOT NULL, caissier_id UUID NOT NULL, caisse_id UUID NOT NULL, date_ouverture TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, date_fermeture TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, statut VARCHAR(50) NOT NULL, montant_ouverture NUMERIC(12, 2) NOT NULL, montant_fermeture NUMERIC(12, 2) DEFAULT NULL, montant_theorique NUMERIC(12, 2) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_DDC85991B514973B ON session_caisse (caissier_id)');
        $this->addSql('CREATE INDEX IDX_DDC8599127B4FEBF ON session_caisse (caisse_id)');
        $this->addSql('COMMENT ON COLUMN session_caisse.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.caissier_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.caisse_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.date_ouverture IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.date_fermeture IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE session_caisse ADD CONSTRAINT FK_DDC85991B514973B FOREIGN KEY (caissier_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE session_caisse ADD CONSTRAINT FK_DDC8599127B4FEBF FOREIGN KEY (caisse_id) REFERENCES caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD session_caisse_id UUID NOT NULL');
        $this->addSql('COMMENT ON COLUMN operation.session_caisse_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66D6456BBB5 FOREIGN KEY (session_caisse_id) REFERENCES session_caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_1981A66D6456BBB5 ON operation (session_caisse_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66D6456BBB5');
        $this->addSql('ALTER TABLE session_caisse DROP CONSTRAINT FK_DDC85991B514973B');
        $this->addSql('ALTER TABLE session_caisse DROP CONSTRAINT FK_DDC8599127B4FEBF');
        $this->addSql('DROP TABLE caisse');
        $this->addSql('DROP TABLE session_caisse');
        $this->addSql('DROP INDEX IDX_1981A66D6456BBB5');
        $this->addSql('ALTER TABLE operation DROP session_caisse_id');
    }
}
