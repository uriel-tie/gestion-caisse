<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251218100200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
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
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB5001D256 FOREIGN KEY (caisse_depart_id) REFERENCES caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB890811B7 FOREIGN KEY (caisse_arrivee_id) REFERENCES caisse (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB79E92E8C FOREIGN KEY (emetteur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBBB967E626 FOREIGN KEY (receveur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBB5001D256');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBB890811B7');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBB79E92E8C');
        $this->addSql('ALTER TABLE transfert DROP CONSTRAINT FK_1E4EACBBB967E626');
        $this->addSql('DROP TABLE transfert');
    }
}
