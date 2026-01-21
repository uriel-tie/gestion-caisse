# 🔧 GUIDE TECHNIQUE - Intégration SYSCOHADA

## Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React/TS)                        │
│                                                                  │
│  NewRequestPage / DecaissementModal / AdminCaisse              │
│           ↓                          ↓              ↓            │
│  RequestLinesEditor          CompteComptableSelector (NEW)     │
│           │                          │                          │
│           └──────────────────┬───────┘                          │
│                              │                                  │
│    Téléchargement données    ↓                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    POST/PATCH  │ /api/demandes
                                │ /api/caisses
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Symfony)                          │
│                                                                  │
│  DemandeController  /  CaisseController / (implicit)           │
│           │                     │                               │
│           └──────────┬──────────┘                               │
│                      ↓                                          │
│         LigneDemande->setCompte()                              │
│         Caisse->setCompteComptable()                           │
│                      ↓                                          │
│           Doctrine ORM (Entities)                               │
│                      │                                          │
│           ┌──────────┴──────────┐                              │
│           ↓                     ↓                               │
│    LigneDemande          Caisse                                │
│    (compte_id FK)    (compte_comptable_id FK)                 │
│                                                                  │
│    API FILTER ENDPOINTS (NEW):                                 │
│    └─ GET /api/comptes/natures                                │
│    └─ GET /api/comptes/types?nature=XXX                       │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │   Compte Comptable   │
                    │   (inchangée)        │
                    │                      │
                    │  numero (3 ou 4+ ch) │
                    │  libelle             │
                    │  type (CHARGE/...)   │
                    │  societe_id          │
                    └──────────────────────┘
```

---

## Flot de données détaillé

### 1️⃣ Création d'une demande avec lignes

```
USER
  │
  ├─ Entre titre, montant, type
  ├─ Pour chaque ligne :
  │  ├─ Saisit designation, qté, prix
  │  └─ Sélectionne :
  │     ├─ Nature (sélecteur 1) → query /api/comptes/natures
  │     └─ Type (sélecteur 2) → query /api/comptes/types?nature=XXX
  │
  └─ Clique "Créer"
       │
       ├─ Frontend valide :
       │  ├─ titre !== empty
       │  ├─ montant > 0
       │  └─ lignes[].compte_id !== empty (si Type requis)
       │
       └─ POST /api/demandes
            {
              "titre": "Achat fournitures",
              "montant": 150000,
              "type": "FICHE_BESOIN",
              "beneficiaire_id": "user-uuid",
              "lignes": [
                {
                  "designation": "Papier A4",
                  "quantite": 5,
                  "prixUnitaire": 5000,
                  "compte_id": "6061-uuid"  // ← Type sélectionné
                }
              ]
            }
                │
                ↓
            DemandeController::create()
                │
                ├─ Crée Demande
                ├─ Pour chaque ligne :
                │  ├─ Crée LigneDemande
                │  ├─ setCompte(CompteComptable trouve by ID)
                │  └─ addLigne(demande)
                │
                └─ em->flush()
                    │
                    ↓
                  INSERTVINTO ligne_demande (designation, quantite, prix_unitaire_estimatif, demande_id, compte_id)
```

### 2️⃣ Création d'une caisse

```
ADMIN
  │
  ├─ Entre nom, seuil
  ├─ Sélectionne caissier (optionnel)
  ├─ Sélectionne compte :
  │  ├─ Nature (sélecteur 1) → /api/comptes/natures
  │  └─ Type (sélecteur 2) → /api/comptes/types?nature=XXX
  │
  └─ Clique "Ajouter caisse"
       │
       └─ POST /api/caisses
            {
              "nom": "Caisse Centrale",
              "employe_id": "user-uuid" ou null,
              "compte_id": "6111-uuid",  // ← Type seulement
              "seuil": 50000
            }
                │
                ↓
            CaisseController::create()
                │
                ├─ Crée Caisse
                ├─ setCompteComptable(CompteComptable)
                │
                └─ em->flush()
                    │
                    ↓
                  INSERT INTO caisse (nom, compte_comptable_id, seuil_decaissement, ...)
```

---

## Filtrage Nature → Type

### Côté Frontend (TypeScript)

```tsx
// CompteComptableSelector.tsx

// 1. Charge les Natures au montage
useEffect(() => {
    const loadNatures = async () => {
        const res = await fetch('https://127.0.0.1:8000/api/comptes/natures', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setNatures(data);
    };
    loadNatures();
}, [token]);

// 2. Quand Nature change → Charge les Types filtrés
useEffect(() => {
    if (!selectedNatureId) {
        setTypes([]);
        onTypeChange(null);
        return;
    }
    
    const loadTypes = async () => {
        const res = await fetch(
            `https://127.0.0.1:8000/api/comptes/types?nature=${selectedNatureId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await res.json();
        setTypes(data);  // Seuls les Types pour cette Nature
    };
    loadTypes();
}, [selectedNatureId, token]);
```

### Côté Backend (PHP)

```php
// CompteComptableController.php

#[Route('/types', name: 'list_types', methods: ['GET'])]
public function listTypes(Request $request, CompteComptableRepository $repo): JsonResponse
{
    $nature = $request->query->get('nature');  // Ex: "606"
    $allComptes = $repo->findAllSorted();
    $types = [];

    foreach ($allComptes as $c) {
        // Filtre 1: Doit être Type (4+ chiffres)
        if (strlen($c->getNumero()) >= 4) {
            
            // Filtre 2: Si Nature spécifiée, vérifier correspondance
            if ($nature && strpos($c->getNumero(), $nature) !== 0) {
                continue;  // Ignore si ne commence pas par nature
            }

            $types[] = [
                'id' => $c->getId(),
                'numero' => $c->getNumero(),
                'libelle' => $c->getLibelle(),
                'nature' => substr($c->getNumero(), 0, 3),  // Extrait les 3 premiers chiffres
                'label_complet' => $c->__toString()
            ];
        }
    }

    return $this->json($types);
}
```

---

## Validation des données

### Frontend (TypeScript)

```tsx
// Avant d'envoyer au backend
const handleSubmit = async (e) => {
    // ✓ Validations
    if (!titre) {
        throw new Error("Titre obligatoire");
    }
    
    if (totalGeneral <= 0) {
        throw new Error("Montant doit être > 0");
    }
    
    // Validation optionnelle : compte obligatoire
    lignes.forEach(ligne => {
        if (!ligne.compte_id && COMPTE_REQUIRED) {
            throw new Error(`Ligne "${ligne.designation}" : Type obligatoire`);
        }
    });
    
    // ✓ Payload correct
    const payload = {
        titre,
        montant: totalGeneral,
        lignes: lignes.map(l => ({
            designation: l.designation,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            compte_id: l.compte_id || null  // Peut être null
        }))
    };
};
```

### Backend (PHP)

```php
// DemandeController.php - Dans create()

// Traitement des lignes
if (!empty($data['lignes']) && is_array($data['lignes'])) {
    foreach ($data['lignes'] as $l) {
        $ligne = new LigneDemande();
        $ligne->setDesignation($l['designation']);
        $ligne->setQuantite((int)$l['quantite']);
        $ligne->setPrixUnitaireEstimatif((float)$l['prixUnitaire']);
        
        // ✓ Association optionnelle du compte
        if (!empty($l['compte_id'])) {
            $compte = $em->getRepository(CompteComptable::class)->find($l['compte_id']);
            if ($compte) {
                $ligne->setCompte($compte);
            }
        }
        
        $demande->addLigne($ligne);
    }
}
```

---

## Interrogation des données (Requêtes SQL)

### Exemple 1: Lister demandes avec leurs comptes

```sql
SELECT 
    d.id,
    d.titre,
    d.montant_estime,
    ld.designation,
    cc.numero as compte_numero,
    cc.libelle as compte_libelle
FROM demande d
LEFT JOIN ligne_demande ld ON d.id = ld.demande_id
LEFT JOIN compte_comptable cc ON ld.compte_id = cc.id
ORDER BY d.id, ld.id;

-- Résultat:
-- DEM-001 | Fournitures | 15000 | Papier A4    | 6061 | Achats Fournitures
-- DEM-001 | Fournitures | 15000 | Stylos       | 6061 | Achats Fournitures
-- DEM-002 | Transport   | 25000 | Carburant    | 6111 | Transport Charges
```

### Exemple 2: Caisses avec comptes

```sql
SELECT 
    c.nom,
    c.solde,
    SUBSTRING(cc.numero, 1, 3) as nature,
    cc.numero as type,
    cc.libelle
FROM caisse c
LEFT JOIN compte_comptable cc ON c.compte_comptable_id = cc.id;

-- Résultat:
-- Caisse Centrale | 150000 | 611 | 6111 | Transport Marchandises
-- Caisse Chef     | 50000  | 606 | 6061 | Achats Fournitures
```

### Exemple 3: Montants par Nature

```sql
SELECT 
    SUBSTRING(cc.numero, 1, 3) as nature,
    cc_nature.libelle,
    COUNT(*) as nb_lignes,
    SUM(ld.quantite * ld.prix_unitaire_estimatif) as total_montant
FROM ligne_demande ld
JOIN compte_comptable cc ON ld.compte_id = cc.id
JOIN compte_comptable cc_nature ON cc_nature.numero = SUBSTRING(cc.numero, 1, 3)
WHERE CHAR_LENGTH(cc.numero) >= 4
GROUP BY nature, cc_nature.libelle
ORDER BY total_montant DESC;

-- Résultat:
-- 606 | Achats Divers       | 5 | 75000
-- 611 | Transport Charges   | 3 | 45000
-- 601 | Achats Marchandises | 2 | 30000
```

---

## Performance et Optimisations

### Indexation (Database)

```sql
-- Optimise les recherches de comptes par longueur
CREATE INDEX idx_compte_numero_length ON compte_comptable(CHAR_LENGTH(numero));

-- Optimise les JOINs
CREATE INDEX idx_ligne_demande_compte ON ligne_demande(compte_id);
CREATE INDEX idx_caisse_compte ON caisse(compte_comptable_id);

-- Optimise les recherches par Societe
CREATE INDEX idx_compte_societe ON compte_comptable(societe_id);
```

### Caching Frontend (Optionnel)

```tsx
// Mettre en cache les Natures (changent rarement)
const [natures, setNatures] = useState<Nature[]>([]);
const [naturesCache, setNaturesCache] = useState<Date | null>(null);

useEffect(() => {
    // Utiliser cache si < 5 minutes
    const cacheAge = naturesCache ? Date.now() - naturesCache.getTime() : Infinity;
    if (cacheAge < 5 * 60 * 1000) {
        console.log("Using cached natures");
        return;
    }
    
    loadNatures();
    setNaturesCache(new Date());
}, []);
```

---

## Gestion des erreurs

### Frontend (React)

```tsx
try {
    const res = await fetch(`/api/comptes/types?nature=${nature}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const types = await res.json();
    setTypes(types);
} catch (err) {
    console.error("Erreur chargement types:", err);
    setError("Impossible de charger les types. Vérifiez votre connexion.");
    setTypes([]);  // Fallback: liste vide
}
```

### Backend (Symfony)

```php
try {
    $compte = $em->getRepository(CompteComptable::class)->find($compteId);
    
    if (!$compte) {
        return $this->json([
            'error' => 'Compte non trouvé',
            'compte_id' => $compteId
        ], 404);
    }
    
    $ligne->setCompte($compte);
} catch (Exception $e) {
    return $this->json([
        'error' => 'Erreur lors de l\'association du compte',
        'details' => $e->getMessage()
    ], 500);
}
```

---

## Tests (Pseudocode)

```typescript
// test.spec.ts

describe("CompteComptableSelector", () => {
    it("should load natures on mount", async () => {
        const { getByText } = render(<CompteComptableSelector />);
        await waitFor(() => {
            expect(getByText("606")).toBeInTheDocument();
        });
    });
    
    it("should filter types by nature", async () => {
        const { getByRole } = render(<CompteComptableSelector />);
        const natureSelect = getByRole("combobox", { name: /nature/i });
        
        fireEvent.change(natureSelect, { target: { value: "606" } });
        
        await waitFor(() => {
            const typeSelect = getByRole("combobox", { name: /type/i });
            expect(typeSelect).toBeInTheDocument();
            expect(typeSelect).not.toBeDisabled();
        });
    });
});

describe("DemandeController", () => {
    it("should save ligne with compte", async () => {
        const payload = {
            titre: "Test",
            montant: 1000,
            lignes: [{
                designation: "Item",
                quantite: 1,
                prixUnitaire: 1000,
                compte_id: "compte-uuid"  // ← Key point
            }]
        };
        
        const response = await POST("/api/demandes", payload);
        expect(response.status).toBe(201);
        
        // Vérifier en BD
        const ligne = await LigneDemande.find(...);
        expect(ligne.compte_id).toBe("compte-uuid");
    });
});
```

---

## Timeline d'implémentation

| Phase | Tâche | Statut |
|-------|-------|--------|
| 1 | Ajout relation LigneDemande→CompteComptable | ✅ |
| 2 | Endpoints /natures et /types | ✅ |
| 3 | Composant CompteComptableSelector | ✅ |
| 4 | Intégration RequestLinesEditor | ✅ |
| 5 | Intégration AdminCaisse | ✅ |
| 6 | Mise à jour payloads | ✅ |
| 7 | Documentation | ✅ |
| 8 | Tests | ⏳ (À faire) |
| 9 | Déploiement Production | ⏳ (À faire) |

---

## Checklist finale

- [x] Entity LigneDemande modifiée
- [x] Migration créée et appliquée
- [x] Endpoints API créés
- [x] Composant React créé
- [x] Intégrations faites
- [x] Types TypeScript à jour
- [x] Documentation complète
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests E2E

