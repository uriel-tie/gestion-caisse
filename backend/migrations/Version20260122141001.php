<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260122141001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE compte_lie DROP CONSTRAINT FK_672323527D2BB0C5');
        $this->addSql('ALTER TABLE compte_lie DROP CONSTRAINT FK_67232352F8451079');
        $this->addSql('ALTER TABLE compte_lie ADD CONSTRAINT FK_672323527D2BB0C5 FOREIGN KEY (compte_type_id) REFERENCES compte_comptable (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE compte_lie ADD CONSTRAINT FK_67232352F8451079 FOREIGN KEY (compte_nature_id) REFERENCES compte_comptable (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE compte_lie DROP CONSTRAINT fk_67232352f8451079');
        $this->addSql('ALTER TABLE compte_lie DROP CONSTRAINT fk_672323527d2bb0c5');
        $this->addSql('ALTER TABLE compte_lie ADD CONSTRAINT fk_67232352f8451079 FOREIGN KEY (compte_nature_id) REFERENCES compte_comptable (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE compte_lie ADD CONSTRAINT fk_672323527d2bb0c5 FOREIGN KEY (compte_type_id) REFERENCES compte_comptable (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
