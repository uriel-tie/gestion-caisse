-- Schéma Database - SYSCOHADA Integration
-- ==========================================

-- Table: compte_comptable (inchangée)
-- Contient tous les comptes : Nature (3 chiffres) + Type (4+ chiffres)
CREATE TABLE compte_comptable (
    id UUID PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL,          -- 606, 6061, 611, 6111, etc.
    libelle VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,                   -- RECETTE, DEPENSE, TRESORERIE
    societe_id UUID NOT NULL
);

-- Table: ligne_demande (MODIFIÉE)
-- Relation ManyToOne vers CompteComptable AJOUTÉE
CREATE TABLE ligne_demande (
    id UUID PRIMARY KEY,
    designation VARCHAR(255) NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire_estimatif FLOAT NOT NULL,
    demande_id UUID NOT NULL REFERENCES demande(id),
    compte_id UUID REFERENCES compte_comptable(id)  -- ← NOUVEAU (nullable)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_ligne_demande_compte ON ligne_demande(compte_id);
CREATE INDEX idx_compte_numero_length ON compte_comptable(numero);

-- Table: caisse (INCHANGÉE)
-- Contient déjà une relation vers CompteComptable
CREATE TABLE caisse (
    id UUID PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    est_ouverte BOOLEAN DEFAULT FALSE,
    solde DECIMAL(12, 2) DEFAULT 0.00,
    employe_assigne_id UUID REFERENCES utilisateur(id),
    compte_comptable_id UUID REFERENCES compte_comptable(id),  -- Type seulement (4+ chiffres)
    seuil_decaissement DECIMAL(12, 2) DEFAULT 50000.00,
    societe_id UUID NOT NULL
);

-- Vue logique : Natures vs Types
-- ================================

-- Natures (3 chiffres)
SELECT * FROM compte_comptable 
WHERE CHAR_LENGTH(numero) = 3;
-- Résultat exemple:
-- 601 - Achats Marchandises
-- 606 - Achats Divers
-- 611 - Transport Charges

-- Types associés à Nature 606 (4+ chiffres)
SELECT * FROM compte_comptable 
WHERE CHAR_LENGTH(numero) >= 4 
  AND numero LIKE '606%';
-- Résultat exemple:
-- 6061 - Achats Matières Premières
-- 6062 - Achats Produits Finis
-- 6063 - Achats Emballages

-- Relation parent-enfant
-- ======================
-- Nature 606 → Types 6061, 6062, 6063, ...
-- Nature 611 → Types 6111, 6112, ...

-- Cette relation est IMPLICITE :
-- Un Type appartient à une Nature si substring(numero, 1, 3) = nature.numero

-- Structure JSON envoyée par l'API
-- ================================

-- GET /api/comptes/natures
-- └─ Retourne les comptes où LENGTH(numero) = 3

-- GET /api/comptes/types
-- └─ Retourne les comptes où LENGTH(numero) >= 4

-- GET /api/comptes/types?nature=606
-- └─ Retourne les comptes où LENGTH(numero) >= 4 ET numero LIKE '606%'

-- Données de démarrage (Exemple)
-- =============================

-- Natures
INSERT INTO compte_comptable (id, numero, libelle, type, societe_id) VALUES 
('uuid-1', '601', 'Achats Marchandises', 'CHARGE', 'societe-uuid'),
('uuid-2', '606', 'Achats Divers', 'CHARGE', 'societe-uuid'),
('uuid-3', '611', 'Transport Charges', 'CHARGE', 'societe-uuid');

-- Types
INSERT INTO compte_comptable (id, numero, libelle, type, societe_id) VALUES 
('uuid-4', '6011', 'Achats Matières Premières', 'CHARGE', 'societe-uuid'),
('uuid-5', '6012', 'Achats Produits Finis', 'CHARGE', 'societe-uuid'),
('uuid-6', '6061', 'Achats Fournitures', 'CHARGE', 'societe-uuid'),
('uuid-7', '6062', 'Achats Emballages', 'CHARGE', 'societe-uuid'),
('uuid-8', '6111', 'Transport Marchandises', 'CHARGE', 'societe-uuid'),
('uuid-9', '6112', 'Transport Divers', 'CHARGE', 'societe-uuid');

-- Exemples de requêtes
-- ====================

-- 1. Demandes avec comptes associés
SELECT 
    d.id,
    d.titre,
    d.montant_estime,
    STRING_AGG(
        ld.designation || ' - ' || cc.numero || ' (' || cc.libelle || ')',
        '; '
    ) as lignes_avec_comptes
FROM demande d
LEFT JOIN ligne_demande ld ON d.id = ld.demande_id
LEFT JOIN compte_comptable cc ON ld.compte_id = cc.id
GROUP BY d.id;

-- 2. Caisses avec comptes (Types)
SELECT 
    c.nom,
    c.solde,
    cc.numero as compte_type,
    cc.libelle as compte_libelle
FROM caisse c
LEFT JOIN compte_comptable cc ON c.compte_comptable_id = cc.id;

-- 3. Montants par Nature (regroupement)
SELECT 
    SUBSTRING(cc.numero, 1, 3) as nature,
    cc_nature.libelle as nature_libelle,
    SUM(ld.quantite * ld.prix_unitaire_estimatif) as total
FROM ligne_demande ld
JOIN compte_comptable cc ON ld.compte_id = cc.id
JOIN compte_comptable cc_nature ON cc_nature.numero = SUBSTRING(cc.numero, 1, 3)
WHERE CHAR_LENGTH(cc.numero) >= 4
GROUP BY SUBSTRING(cc.numero, 1, 3), cc_nature.libelle
ORDER BY nature;

-- Migration Doctrine (généré)
-- ============================
-- File: backend/migrations/Version20260121081842.php
-- 
-- Cette migration ajoute :
-- - Colonne compte_id (UUID) dans ligne_demande
-- - Constraint FK_LIGNE_DEMANDE_COMPTE
-- - Index sur compte_id

