<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260121085916 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ligne_demande ADD compte_id UUID DEFAULT NULL');
        $this->addSql('COMMENT ON COLUMN ligne_demande.compte_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE ligne_demande ADD CONSTRAINT FK_B90DE99CF2C56620 FOREIGN KEY (compte_id) REFERENCES compte_comptable (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_B90DE99CF2C56620 ON ligne_demande (compte_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE ligne_demande DROP CONSTRAINT FK_B90DE99CF2C56620');
        $this->addSql('DROP INDEX IDX_B90DE99CF2C56620');
        $this->addSql('ALTER TABLE ligne_demande DROP compte_id');
    }
}
