<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260105115337 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE audit (id BIGSERIAL NOT NULL, utilisateur_id UUID DEFAULT NULL, societe_id UUID NOT NULL, action VARCHAR(50) NOT NULL, actor_name VARCHAR(255) NOT NULL, entity_class VARCHAR(255) NOT NULL, entity_id VARCHAR(255) NOT NULL, changes JSON DEFAULT NULL, ip_address VARCHAR(45) DEFAULT NULL, date TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_9218FF79FB88E14F ON audit (utilisateur_id)');
        $this->addSql('CREATE INDEX IDX_9218FF79FCF77503 ON audit (societe_id)');
        $this->addSql('CREATE INDEX idx_audit_date ON audit (date)');
        $this->addSql('CREATE INDEX idx_audit_entity ON audit (entity_class, entity_id)');
        $this->addSql('COMMENT ON COLUMN audit.utilisateur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN audit.societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN audit.date IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE caisse (id UUID NOT NULL, employe_assigne_id UUID DEFAULT NULL, compte_comptable_id UUID DEFAULT NULL, societe_id UUID NOT NULL, nom VARCHAR(100) NOT NULL, est_ouverte BOOLEAN NOT NULL, solde NUMERIC(12, 2) DEFAULT \'0.00\' NOT NULL, seuil_decaissement NUMERIC(12, 2) DEFAULT \'50000.00\' NOT NULL, is_deleted BOOLEAN DEFAULT false NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_B2A353C8CB25077 ON caisse (employe_assigne_id)');
        $this->addSql('CREATE INDEX IDX_B2A353C8D678252E ON caisse (compte_comptable_id)');
        $this->addSql('CREATE INDEX IDX_B2A353C8FCF77503 ON caisse (societe_id)');
        $this->addSql('COMMENT ON COLUMN caisse.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN caisse.employe_assigne_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN caisse.compte_comptable_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN caisse.societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE cloture (id UUID NOT NULL, utilisateur_id UUID NOT NULL, societe_id UUID NOT NULL, periode VARCHAR(50) NOT NULL, solde_theorique NUMERIC(14, 2) NOT NULL, solde_physique NUMERIC(14, 2) NOT NULL, date_cloture TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_D5D0B568FB88E14F ON cloture (utilisateur_id)');
        $this->addSql('CREATE INDEX IDX_D5D0B568FCF77503 ON cloture (societe_id)');
        $this->addSql('COMMENT ON COLUMN cloture.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN cloture.utilisateur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN cloture.societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN cloture.date_cloture IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE compte_comptable (id UUID NOT NULL, numero VARCHAR(20) NOT NULL, libelle VARCHAR(255) NOT NULL, type VARCHAR(50) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_98EA7D55F55AE19E ON compte_comptable (numero)');
        $this->addSql('COMMENT ON COLUMN compte_comptable.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE demande (id UUID NOT NULL, demandeur_id UUID NOT NULL, operation_id UUID DEFAULT NULL, beneficiaire_id UUID DEFAULT NULL, societe_id UUID NOT NULL, caissier_traitant_id UUID DEFAULT NULL, type VARCHAR(50) NOT NULL, titre VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, montant_estime NUMERIC(12, 2) NOT NULL, statut VARCHAR(50) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, numero_reference VARCHAR(50) DEFAULT NULL, beneficiaire_autre VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_2694D7A5E3B03F8C ON demande (numero_reference)');
        $this->addSql('CREATE INDEX IDX_2694D7A595A6EE59 ON demande (demandeur_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_2694D7A544AC3583 ON demande (operation_id)');
        $this->addSql('CREATE INDEX IDX_2694D7A55AF81F68 ON demande (beneficiaire_id)');
        $this->addSql('CREATE INDEX IDX_2694D7A5FCF77503 ON demande (societe_id)');
        $this->addSql('CREATE INDEX IDX_2694D7A5FD005144 ON demande (caissier_traitant_id)');
        $this->addSql('COMMENT ON COLUMN demande.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.demandeur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.operation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.beneficiaire_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.caissier_traitant_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN demande.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE justificatif (id UUID NOT NULL, operation_id UUID NOT NULL, fichier VARCHAR(255) NOT NULL, chemin VARCHAR(255) NOT NULL, hash VARCHAR(64) DEFAULT NULL, date_upload TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, type VARCHAR(20) DEFAULT \'fichier\' NOT NULL, contenu_json JSON DEFAULT NULL, signature_data TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_90D3C5DC44AC3583 ON justificatif (operation_id)');
        $this->addSql('COMMENT ON COLUMN justificatif.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN justificatif.operation_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN justificatif.date_upload IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE ligne_demande (id UUID NOT NULL, demande_id UUID NOT NULL, designation VARCHAR(255) NOT NULL, quantite INT NOT NULL, prix_unitaire_estimatif DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_B90DE99C80E95E18 ON ligne_demande (demande_id)');
        $this->addSql('COMMENT ON COLUMN ligne_demande.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN ligne_demande.demande_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE mode_paiement (id UUID NOT NULL, libelle VARCHAR(100) NOT NULL, type VARCHAR(50) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_B2BB0E85A4D60759 ON mode_paiement (libelle)');
        $this->addSql('COMMENT ON COLUMN mode_paiement.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE operation (id UUID NOT NULL, utilisateur_id UUID NOT NULL, mode_paiement_id UUID NOT NULL, operation_liee_id UUID DEFAULT NULL, session_caisse_id UUID NOT NULL, societe_id UUID NOT NULL, type VARCHAR(20) NOT NULL, montant NUMERIC(12, 2) NOT NULL, date TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, compte_comptable VARCHAR(100) DEFAULT NULL, statut VARCHAR(20) NOT NULL, motif VARCHAR(255) DEFAULT NULL, est_demande_annulation BOOLEAN DEFAULT false NOT NULL, motif_annulation VARCHAR(255) DEFAULT NULL, beneficiaire VARCHAR(255) DEFAULT NULL, details JSON DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_1981A66DFB88E14F ON operation (utilisateur_id)');
        $this->addSql('CREATE INDEX IDX_1981A66D438F5B63 ON operation (mode_paiement_id)');
        $this->addSql('CREATE INDEX IDX_1981A66D996AC49E ON operation (operation_liee_id)');
        $this->addSql('CREATE INDEX IDX_1981A66D6456BBB5 ON operation (session_caisse_id)');
        $this->addSql('CREATE INDEX IDX_1981A66DFCF77503 ON operation (societe_id)');
        $this->addSql('CREATE INDEX idx_operation_date ON operation (date)');
        $this->addSql('COMMENT ON COLUMN operation.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.utilisateur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.mode_paiement_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.operation_liee_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.session_caisse_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN operation.date IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE service (id UUID NOT NULL, chef_id UUID DEFAULT NULL, societe_id UUID NOT NULL, nom VARCHAR(100) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_E19D9AD2150A48F1 ON service (chef_id)');
        $this->addSql('CREATE INDEX IDX_E19D9AD2FCF77503 ON service (societe_id)');
        $this->addSql('COMMENT ON COLUMN service.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN service.chef_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN service.societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE session_caisse (id UUID NOT NULL, caissier_id UUID NOT NULL, caisse_id UUID NOT NULL, date_ouverture TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, date_fermeture TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, statut VARCHAR(50) NOT NULL, montant_ouverture NUMERIC(12, 2) NOT NULL, montant_fermeture NUMERIC(12, 2) DEFAULT NULL, montant_theorique NUMERIC(12, 2) DEFAULT NULL, billetage JSON DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_DDC85991B514973B ON session_caisse (caissier_id)');
        $this->addSql('CREATE INDEX IDX_DDC8599127B4FEBF ON session_caisse (caisse_id)');
        $this->addSql('COMMENT ON COLUMN session_caisse.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.caissier_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.caisse_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.date_ouverture IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN session_caisse.date_fermeture IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE societe (id UUID NOT NULL, nom VARCHAR(255) NOT NULL, forme VARCHAR(50) DEFAULT NULL, adresse VARCHAR(255) DEFAULT NULL, telephone VARCHAR(50) DEFAULT NULL, registre_commerce VARCHAR(100) DEFAULT NULL, siege_social VARCHAR(255) DEFAULT NULL, capital_social VARCHAR(100) DEFAULT NULL, numero_compte_contribuable VARCHAR(100) DEFAULT NULL, is_active BOOLEAN DEFAULT true NOT NULL, is_deleted BOOLEAN DEFAULT false NOT NULL, mode_validation VARCHAR(50) DEFAULT \'STANDARD\' NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN societe.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE transfert (id UUID NOT NULL, caisse_depart_id UUID NOT NULL, caisse_arrivee_id UUID NOT NULL, emetteur_id UUID NOT NULL, receveur_id UUID DEFAULT NULL, montant VARCHAR(255) NOT NULL, statut VARCHAR(50) NOT NULL, date_creation TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, date_validation TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, motif VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_1E4EACBB5001D256 ON transfert (caisse_depart_id)');
        $this->addSql('CREATE INDEX IDX_1E4EACBB890811B7 ON transfert (caisse_arrivee_id)');
        $this->addSql('CREATE INDEX IDX_1E4EACBB79E92E8C ON transfert (emetteur_id)');
        $this->addSql('CREATE INDEX IDX_1E4EACBBB967E626 ON transfert (receveur_id)');
        $this->addSql('COMMENT ON COLUMN transfert.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfert.caisse_depart_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfert.caisse_arrivee_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfert.emetteur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfert.receveur_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN transfert.date_creation IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN transfert.date_validation IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE utilisateur (id UUID NOT NULL, service_id UUID DEFAULT NULL, societe_id UUID DEFAULT NULL, nom VARCHAR(255) NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, est_actif BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, password_must_be_changed BOOLEAN DEFAULT true NOT NULL, derniere_modification_nom TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, google_authenticator_secret VARCHAR(255) DEFAULT NULL, is2fa_enabled BOOLEAN NOT NULL, is_deleted BOOLEAN DEFAULT false NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D1C63B3E7927C74 ON utilisateur (email)');
        $this->addSql('CREATE INDEX IDX_1D1C63B3ED5CA9E6 ON utilisateur (service_id)');
        $this->addSql('CREATE INDEX IDX_1D1C63B3FCF77503 ON utilisateur (societe_id)');
        $this->addSql('COMMENT ON COLUMN utilisateur.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN utilisateur.service_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN utilisateur.societe_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN utilisateur.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN utilisateur.derniere_modification_nom IS \'(DC2Type:datetime_immutable)\'');
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
        $this->addSql('ALTER TABLE audit ADD CONSTRAINT FK_9218FF79FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE audit ADD CONSTRAINT FK_9218FF79FCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE caisse ADD CONSTRAINT FK_B2A353C8CB25077 FOREIGN KEY (employe_assigne_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE caisse ADD CONSTRAINT FK_B2A353C8D678252E FOREIGN KEY (compte_comptable_id) REFERENCES compte_comptable (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE caisse ADD CONSTRAINT FK_B2A353C8FCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE cloture ADD CONSTRAINT FK_D5D0B568FB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE cloture ADD CONSTRAINT FK_D5D0B568FCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A595A6EE59 FOREIGN KEY (demandeur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A544AC3583 FOREIGN KEY (operation_id) REFERENCES operation (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A55AF81F68 FOREIGN KEY (beneficiaire_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A5FCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE demande ADD CONSTRAINT FK_2694D7A5FD005144 FOREIGN KEY (caissier_traitant_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE justificatif ADD CONSTRAINT FK_90D3C5DC44AC3583 FOREIGN KEY (operation_id) REFERENCES operation (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE ligne_demande ADD CONSTRAINT FK_B90DE99C80E95E18 FOREIGN KEY (demande_id) REFERENCES demande (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66DFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66D438F5B63 FOREIGN KEY (mode_paiement_id) REFERENCES mode_paiement (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66D996AC49E FOREIGN KEY (operation_liee_id) REFERENCES operation (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66D6456BBB5 FOREIGN KEY (session_caisse_id) REFERENCES session_caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66DFCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE service ADD CONSTRAINT FK_E19D9AD2150A48F1 FOREIGN KEY (chef_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE service ADD CONSTRAINT FK_E19D9AD2FCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE session_caisse ADD CONSTRAINT FK_DDC85991B514973B FOREIGN KEY (caissier_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE session_caisse ADD CONSTRAINT FK_DDC8599127B4FEBF FOREIGN KEY (caisse_id) REFERENCES caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB5001D256 FOREIGN KEY (caisse_depart_id) REFERENCES caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB890811B7 FOREIGN KEY (caisse_arrivee_id) REFERENCES caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB79E92E8C FOREIGN KEY (emetteur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBBB967E626 FOREIGN KEY (receveur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE utilisateur ADD CONSTRAINT FK_1D1C63B3ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE utilisateur ADD CONSTRAINT FK_1D1C63B3FCF77503 FOREIGN KEY (societe_id) REFERENCES societe (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE audit DROP CONSTRAINT FK_9218FF79FB88E14F');
        $this->addSql('ALTER TABLE audit DROP CONSTRAINT FK_9218FF79FCF77503');
        $this->addSql('ALTER TABLE caisse DROP CONSTRAINT FK_B2A353C8CB25077');
        $this->addSql('ALTER TABLE caisse DROP CONSTRAINT FK_B2A353C8D678252E');
        $this->addSql('ALTER TABLE caisse DROP CONSTRAINT FK_B2A353C8FCF77503');
        $this->addSql('ALTER TABLE cloture DROP CONSTRAINT FK_D5D0B568FB88E14F');
        $this->addSql('ALTER TABLE cloture DROP CONSTRAINT FK_D5D0B568FCF77503');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A595A6EE59');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A544AC3583');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A55AF81F68');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A5FCF77503');
        $this->addSql('ALTER TABLE demande DROP CONSTRAINT FK_2694D7A5FD005144');
        $this->addSql('ALTER TABLE justificatif DROP CONSTRAINT FK_90D3C5DC44AC3583');
        $this->addSql('ALTER TABLE ligne_demande DROP CONSTRAINT FK_B90DE99C80E95E18');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66DFB88E14F');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66D438F5B63');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66D996AC49E');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66D6456BBB5');
        $this->addSql('ALTER TABLE operation DROP CONSTRAINT FK_1981A66DFCF77503');
        $this->addSql('ALTER TABLE service DROP CONSTRAINT FK_E19D9AD2150A48F1');
        $this->addSql('ALTER TABLE service DROP CONSTRAINT FK_E19D9AD2FCF77503');
        $this->addSql('ALTER TABLE session_caisse DROP CONSTRAINT FK_DDC85991B514973B');
        $this->addSql('ALTER TABLE session_caisse DROP CONSTRAINT FK_DDC8599127B4FEBF');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBB5001D256');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBB890811B7');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBB79E92E8C');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBBB967E626');
        $this->addSql('ALTER TABLE utilisateur DROP CONSTRAINT FK_1D1C63B3ED5CA9E6');
        $this->addSql('ALTER TABLE utilisateur DROP CONSTRAINT FK_1D1C63B3FCF77503');
        $this->addSql('DROP TABLE audit');
        $this->addSql('DROP TABLE caisse');
        $this->addSql('DROP TABLE cloture');
        $this->addSql('DROP TABLE compte_comptable');
        $this->addSql('DROP TABLE demande');
        $this->addSql('DROP TABLE justificatif');
        $this->addSql('DROP TABLE ligne_demande');
        $this->addSql('DROP TABLE mode_paiement');
        $this->addSql('DROP TABLE operation');
        $this->addSql('DROP TABLE service');
        $this->addSql('DROP TABLE session_caisse');
        $this->addSql('DROP TABLE societe');
        $this->addSql('DROP TABLE transfert');
        $this->addSql('DROP TABLE utilisateur');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
