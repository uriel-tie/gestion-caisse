<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251119100543 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE audit (id BIGSERIAL NOT NULL, utilisateur_id UUID NOT NULL, action VARCHAR(255) NOT NULL, details TEXT DEFAULT NULL, date TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_9218FF79FB88E14F ON audit (utilisateur_id)');
        $this->addSql('CREATE INDEX idx_audit_date ON audit (date)');
        $this->addSql('COMMENT ON COLUMN audit.utilisateur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN audit.date IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE cloture (id UUID NOT NULL, utilisateur_id UUID NOT NULL, periode VARCHAR(50) NOT NULL, solde_theorique NUMERIC(14, 2) NOT NULL, solde_physique NUMERIC(14, 2) NOT NULL, date_cloture TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_D5D0B568FB88E14F ON cloture (utilisateur_id)');
        $this->addSql('COMMENT ON COLUMN cloture.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN cloture.utilisateur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN cloture.date_cloture IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE justificatif (id UUID NOT NULL, operation_id UUID NOT NULL, fichier VARCHAR(255) NOT NULL, chemin VARCHAR(255) NOT NULL, hash VARCHAR(64) DEFAULT NULL, date_upload TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_90D3C5DC44AC3583 ON justificatif (operation_id)');
        $this->addSql('COMMENT ON COLUMN justificatif.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN justificatif.operation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN justificatif.date_upload IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE mode_paiement (id UUID NOT NULL, libelle VARCHAR(100) NOT NULL, type VARCHAR(50) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_B2BB0E85A4D60759 ON mode_paiement (libelle)');
        $this->addSql('COMMENT ON COLUMN mode_paiement.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE operation (id UUID NOT NULL, utilisateur_id UUID NOT NULL, mode_paiement_id UUID NOT NULL, operation_liee_id UUID DEFAULT NULL, type VARCHAR(20) NOT NULL, montant NUMERIC(12, 2) NOT NULL, date TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, compte_comptable VARCHAR(100) DEFAULT NULL, statut VARCHAR(20) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_1981A66DFB88E14F ON operation (utilisateur_id)');
        $this->addSql('CREATE INDEX IDX_1981A66D438F5B63 ON operation (mode_paiement_id)');
        $this->addSql('CREATE INDEX IDX_1981A66D996AC49E ON operation (operation_liee_id)');
        $this->addSql('CREATE INDEX idx_operation_date ON operation (date)');
        $this->addSql('COMMENT ON COLUMN operation.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.utilisateur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.mode_paiement_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.operation_liee_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.date IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE utilisateur (id UUID NOT NULL, nom VARCHAR(255) NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, est_actif BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D1C63B3E7927C74 ON utilisateur (email)');
        $this->addSql('COMMENT ON COLUMN utilisateur.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN utilisateur.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE messenger_messages (id BIGSERIAL NOT NULL, body TEXT NOT NULL, headers TEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, available_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, delivered_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_75EA56E0FB7336F0 ON messenger_messages (queue_name)');
        $this->addSql('CREATE INDEX IDX_75EA56E0E3BD61CE ON messenger_messages (available_at)');
        $this->addSql('CREATE INDEX IDX_75EA56E016BA31DB ON messenger_messages (delivered_at)');
        $this->addSql('COMMENT ON COLUMN messenger_messages.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN messenger_messages.available_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN messenger_messages.delivered_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE OR REPLACE FUNCTION notify_messenger_messages() RETURNS TRIGGER AS $$
            BEGIN
                PERFORM pg_notify(\'messenger_messages\', NEW.queue_name::text);
                RETURN NEW;
            END;
        $$ LANGUAGE plpgsql;');
        $this->addSql('DROP TRIGGER IF EXISTS notify_trigger ON messenger_messages;');
        $this->addSql('CREATE TRIGGER notify_trigger AFTER INSERT OR UPDATE ON messenger_messages FOR EACH ROW EXECUTE PROCEDURE notify_messenger_messages();');
        $this->addSql('ALTER TABLE audit ADD CONSTRAINT FK_9218FF79FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE cloture ADD CONSTRAINT FK_D5D0B568FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE justificatif ADD CONSTRAINT FK_90D3C5DC44AC3583 FOREIGN KEY (operation_id) REFERENCES operation (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66DFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66D438F5B63 FOREIGN KEY (mode_paiement_id) REFERENCES mode_paiement (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66D996AC49E FOREIGN KEY (operation_liee_id) REFERENCES operation (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE audit DROP CONSTRAINT FK_9218FF79FB88E14F');
        $this->addSql('ALTER TABLE cloture DROP CONSTRAINT FK_D5D0B568FB88E14F');
        $this->addSql('ALTER TABLE justificatif DROP CONSTRAINT FK_90D3C5DC44AC3583');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66DFB88E14F');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66D438F5B63');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66D996AC49E');
        $this->addSql('DROP TABLE audit');
        $this->addSql('DROP TABLE cloture');
        $this->addSql('DROP TABLE justificatif');
        $this->addSql('DROP TABLE mode_paiement');
        $this->addSql('DROP TABLE operation');
        $this->addSql('DROP TABLE utilisateur');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
