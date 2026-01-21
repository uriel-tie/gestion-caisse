# Intégration du Plan Comptable SYSCOHADA - Résumé des Changements

## 📋 Vue d'ensemble
Cette intégration ajoute la logique de Plan Comptable SYSCOHADA à l'application ORBIS CAISSE, permettant de gérer les comptes comptables (Nature et Type) pour les demandes et les caisses.

### Concepts clés
- **Nature** : Compte comptable à 3 chiffres (ex: `601`, `606`, `611`)
- **Type** : Compte comptable à 4 chiffres ou plus (ex: `6011`, `6012`)
- **Relation** : Un Type appartient à une Nature si ses 3 premiers chiffres correspondent

---

## 🔧 Modifications Backend (PHP/Symfony)

### 1. Entité LigneDemande
**Fichier** : `backend/src/Entity/LigneDemande.php`

✅ Ajout d'une relation ManyToOne vers `CompteComptable` :
```php
#[ORM\ManyToOne(targetEntity: CompteComptable::class)]
#[ORM\JoinColumn(nullable: true)]
private ?CompteComptable $compte = null;

public function getCompte(): ?CompteComptable { return $this->compte; }
public function setCompte(?CompteComptable $compte): static { 
    $this->compte = $compte; 
    return $this; 
}
```

✅ Migration créée : `Version20260121081842.php`

### 2. Contrôleur DemandeController
**Fichier** : `backend/src/Controller/DemandeController.php`

✅ Import de `CompteComptable` ajouté
✅ Logique d'association de compte lors de la création de ligne :
```php
// Dans la boucle de création des lignes
if (!empty($l['compte_id'])) {
    $compte = $em->getRepository(CompteComptable::class)->find($l['compte_id']);
    if ($compte) {
        $ligne->setCompte($compte);
    }
}
```

### 3. Contrôleur CompteComptableController
**Fichier** : `backend/src/Controller/CompteComptableController.php`

✅ Deux nouveaux endpoints :

#### `/api/comptes/natures` (GET)
Retourne tous les comptes "Nature" (3 chiffres seulement)
```json
[
  {
    "id": "uuid",
    "numero": "606",
    "libelle": "Achats Marchandises",
    "label_complet": "606 - Achats Marchandises"
  }
]
```

#### `/api/comptes/types` (GET)
Retourne tous les comptes "Type" (4+ chiffres), optionnellement filtrés par Nature
- Query param : `?nature=606` (optionnel)
```json
[
  {
    "id": "uuid",
    "numero": "6061",
    "libelle": "Achats Matières Premières",
    "nature": "606",
    "label_complet": "6061 - Achats Matières Premières"
  }
]
```

### 4. Entité Caisse (Vérification)
**Fichier** : `backend/src/Entity/Caisse.php`

✓ La relation `compteComptable` (ManyToOne) existait déjà
✓ Aucune modification nécessaire

---

## 🎨 Modifications Frontend (React/TypeScript)

### 1. Nouveau Composant : CompteComptableSelector
**Fichier créé** : `frontend/src/components/CompteComptableSelector.tsx`

Composant réutilisable pour sélectionner Nature puis Type :

```tsx
<CompteComptableSelector
  selectedNatureId={nature}
  selectedTypeId={typeId}
  onNatureChange={(n) => setNature(n)}
  onTypeChange={(t) => setTypeId(t)}
  showLabel={true}
  required={false}
/>
```

**Fonctionnalités** :
- Charge les Natures au montage
- Charge dynamiquement les Types filtrés quand une Nature est sélectionnée
- Gère les états de chargement
- Support des labels et des champs requis
- Styled avec Tailwind CSS

### 2. RequestLinesEditor
**Fichier** : `frontend/src/components/RequestLinesEditor.tsx`

✅ Interface `RequestLine` mise à jour :
```tsx
export interface RequestLine {
    id: number;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
    compte_id?: string | null;        // ← NOUVEAU
    nature_numero?: string | null;    // ← NOUVEAU
}
```

✅ Chaque ligne du tableau a maintenant une colonne "Compte" avec le sélecteur Nature/Type
✅ Layout du tableau ajusté pour accommoder la nouvelle colonne

### 3. NewRequestPage
**Fichier** : `frontend/src/pages/NewRequestPage.tsx`

✅ Payload des lignes mis à jour pour inclure `compte_id` :
```tsx
lignes: lignes.map(l => ({
    designation: l.designation,
    quantite: l.quantite,
    prixUnitaire: l.prixUnitaire,
    compte_id: l.compte_id || null  // ← NOUVEAU
}))
```

### 4. AdminCaisse
**Fichier** : `frontend/src/components/AdminCaisse.tsx`

✅ États modifiés :
```tsx
const [newCaisseNature, setNewCaisseNature] = useState('');
const [newCaisseType, setNewCaisseType] = useState('');
```

✅ Formulaire d'ajout mise à jour avec `CompteComptableSelector`
✅ Tableau d'affichage simplifié pour montrer le compte de manière lisible
✅ Remise à zéro du formulaire inclut les nouveaux états

### 5. DecaissementModal
**Fichier** : `frontend/src/components/DecaissementModal.tsx`

✅ Payload mise à jour pour inclure les comptes des lignes :
```tsx
payload.lignes = lignes.map(l => ({
    designation: l.designation,
    quantite: l.quantite,
    prix: l.prixUnitaire,
    total: l.total,
    compte_id: l.compte_id || null  // ← NOUVEAU
}));
```

---

## 🧪 Comment Tester

### 1. Mise en place des données
Assurez-vous que votre base de données contient des comptes comptables valides :
```sql
-- Natures (3 chiffres)
SELECT * FROM compte_comptable WHERE LENGTH(numero) = 3;

-- Types (4+ chiffres)
SELECT * FROM compte_comptable WHERE LENGTH(numero) >= 4;
```

### 2. Tester les endpoints API

#### Récupérer les Natures
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://127.0.0.1:8000/api/comptes/natures
```

#### Récupérer les Types (filtrés)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://127.0.0.1:8000/api/comptes/types?nature=606
```

### 3. Tester l'UI

#### Dans AdminCaisse
1. Allez à la page Admin → Caisses
2. Dans le formulaire d'ajout, vous devriez voir :
   - Sélecteur "Nature" (comptes 3 chiffres)
   - Sélecteur "Type" qui apparaît après sélection d'une Nature
3. Créez une caisse avec un Type sélectionné
4. Vérifiez que le compte est sauvegardé

#### Dans NewRequestPage
1. Créez une nouvelle demande
2. Ajoutez des lignes de besoin
3. Pour chaque ligne, sélectionnez :
   - Une Nature (3 chiffres)
   - Un Type (4+ chiffres, filtré selon la Nature)
4. Soumettez et vérifiez que les comptes sont sauvegardés

#### Dans DecaissementModal
1. Créez un décaissement en mode détaillé
2. Les lignes devraient avoir les sélecteurs Nature/Type
3. Vérifiez que les comptes sont envoyés avec les données

---

## 📊 Structure des Données

### Flux de création d'une demande
```
Front-end                    Back-end
   │
   ├─ POST /api/demandes
   │  ├─ titre
   │  ├─ montant
   │  └─ lignes[]
   │      ├─ designation
   │      ├─ quantite
   │      ├─ prixUnitaire
   │      └─ compte_id ← NOUVEAU
   │
   ↓
   DemandeController::create()
   └─ Pour chaque ligne :
      └─ LigneDemande->setCompte(CompteComptable)
         └─ Persiste en BD
```

### Flux de création d'une caisse
```
Front-end                    Back-end
   │
   ├─ POST /api/caisses
   │  ├─ nom
   │  ├─ employe_id
   │  ├─ compte_id ← NOUVEAU (Type)
   │  └─ seuil
   │
   ↓
   CaisseController::create()
   └─ Caisse->setCompteComptable(CompteComptable)
      └─ Persiste en BD
```

---

## ⚠️ Points importants

1. **Pas de modification de la structure CompteComptable**
   - Le filtrage Nature/Type se fait via la longueur du `numero`
   - Pas de champ supplémentaire ajouté

2. **Les comptes sont optionnels**
   - `compte_id` peut être null dans LigneDemande
   - `compte_id` peut être null dans Caisse

3. **Filtrage client-side**
   - Les Types sont filtrés en front-end basé sur le `nature` retourné
   - Économise les requêtes API

4. **Support des anciennes données**
   - Les lignes et caisses existantes sans compte continuent de fonctionner

---

## 🔄 Prochaines étapes optionnelles

1. **Édition de caisses** : Ajouter un modal pour modifier le compte d'une caisse existante
2. **Rapports** : Générer des rapports groupés par Nature/Type
3. **Validation** : Forcer l'obligation d'un Type pour certains types de demandes
4. **Analytics** : Dashboard montrant les dépenses par Nature/Type

---

## 📝 Notes de développement

- Le composant `CompteComptableSelector` est réutilisable dans d'autres parties de l'app
- Utilise Tailwind CSS pour le styling (cohérent avec le reste de l'app)
- Gestion des erreurs réseau incluse
- Support de l'i18n facilement implémentable

