# FIX: Erreur de Conversion UUID dans LigneDemande

## Problème identifié

**Erreur originale :**
```
Doctrine\DBAL\Types\ConversionException: "Could not convert database value "6011" to Doctrine Type uuid"
```

### Cause racine
Le frontend envoyait les numéros de compte ("6011", "606", etc.) au lieu des UUID techniques, alors que la base de données attendait un UUID pour la relation `ManyToOne` vers `CompteComptable`.

**Flux erroné :**
```
Frontend (numeroCompte: "6011") 
  → API POST /api/demandes 
  → Backend essaie: setCompte("6011")  ← ❌ STRING au lieu de CompteComptable OBJECT
  → Doctrine tente: conversion "6011" → UUID ← ❌ ERREUR
```

---

## Corrections appliquées

### 1️⃣ Frontend - `CompteComptableSelector.tsx` ✅

**Avant :**
```tsx
{types.map((t) => (
    <option key={t.id} value={t.numero}>  // ❌ Envoie t.numero
        {t.numero} — {t.libelle}
    </option>
))}
```

**Après :**
```tsx
{types.map((t) => (
    <option key={t.id} value={t.id}>  // ✅ Envoie t.id (UUID)
        {t.numero} — {t.libelle}
    </option>
))}
```

**Impact :** Le sélecteur CompteComptable retourne maintenant l'**UUID** au lieu du numéro.

---

### 2️⃣ Frontend - `AdminCaisse.tsx` ✅

**Avant :**
```tsx
// CompteComptableSelector expects numero values for types, so use numero here
setEditingType(c.compteComptable?.numero || '');  // ❌ Récupère numero
```

**Après :**
```tsx
// CompteComptableSelector now returns UUIDs, not numero values
setEditingType(c.compteComptable?.id || '');  // ✅ Récupère id (UUID)
```

**Impact :** AdminCaisse envoie maintenant l'UUID au lieu du numéro.

---

### 3️⃣ Backend - `DemandeController.php` ✅

**Avant :**
```php
if (!empty($l['compte_id'])) {
    $compte = $em->getRepository(CompteComptable::class)->find($l['compte_id']);
    // Fallback: if not found by id, allow frontend to send the 'numero'
    if (!$compte && is_string($l['compte_id'])) {
        $compte = $em->getRepository(CompteComptable::class)->findOneBy(['numero' => $l['compte_id']]);
        // ❌ Accepte les numéros comme fallback (source du bug)
    }
    if ($compte) {
        $ligne->setCompte($compte);
    }
}
```

**Après :**
```php
// Associer le compte comptable par UUID SEULEMENT
if (!empty($l['compte_id']) && is_string($l['compte_id'])) {
    try {
        $compte = $em->getRepository(CompteComptable::class)->find($l['compte_id']);
        // ✅ UUID UNIQUEMENT - pas de fallback
        if ($compte) {
            $ligne->setCompte($compte);
        }
    } catch (\Exception $e) {
        // UUID invalide - on ignore
        \error_log('Invalid CompteComptable UUID: ' . $l['compte_id']);
    }
}
```

**Impact :** Le backend n'accepte plus que les UUID valides. Les numéros sont ignorés silencieusement avec log.

---

## Flux correct après corrections

```
Frontend (CompteComptableSelector retourne UUID)
  ↓
RequestLinesEditor accumule: { compte_id: "019be02a-...", ... }
  ↓
Payload POST /api/demandes
  {
    "lignes": [
      {
        "designation": "Achat fournitures",
        "quantite": 10,
        "prixUnitaire": 1000,
        "compte_id": "019be02a-5c7d-7e8f-9abc-def012345678"  ✅ UUID
      }
    ]
  }
  ↓
Backend DemandeController
  - Récupère l'UUID: "019be02a-..."
  - find(UUID) → CompteComptable OBJECT
  - ligne->setCompte($compte)  ← OBJECT valide
  ✅ SUCCESS
```

---

## Validation

✅ **EntitéLigneDemande** - Relation correcte :
```php
#[ORM\ManyToOne(targetEntity: CompteComptable::class)]
#[ORM\JoinColumn(nullable: true)]
private ?CompteComptable $compte = null;
```
- Type: `CompteComptable` (OBJECT)
- JoinColumn attend: UUID technique (id du CompteComptable)

✅ **CompteComptable** - Identification correcte :
```php
#[ORM\Id]
#[ORM\Column(type: 'uuid', unique: true)]
private ?Uuid $id = null;  // ← Clé primaire = UUID

#[ORM\Column(length: 20, unique: true)]
private ?string $numero = null;  // ← Affichage = Numéro
```

---

## Composants touchés

| Composant | Changement | Statut |
|-----------|-----------|--------|
| `CompteComptableSelector.tsx` | `t.numero` → `t.id` | ✅ |
| `AdminCaisse.tsx` | `compteComptable?.numero` → `compteComptable?.id` | ✅ |
| `DemandeController.php` | Supprime fallback sur `numero` | ✅ |
| `RequestLinesEditor.tsx` | Pas changement (utilise déjà UUID) | ✓ |
| `DecaissementModal.tsx` | Pas changement (utilise déjà UUID) | ✓ |

---

## Tests recommandés

1. **POST /api/demandes avec lignes**
   - Créer une demande avec lignes et compte sélectionné
   - ✅ Doit réussir sans erreur 500
   - Vérifier la ligne en BD : `compte_id` = UUID valide

2. **PATCH /api/caisses/{id}** (AdminCaisse)
   - Éditer le compte d'une caisse
   - ✅ Doit accepter l'UUID
   - Vérifier en BD : `compteComptable_id` = UUID valide

3. **Cas limite : UUID invalide**
   - Envoyer un UUID mal formé
   - ✅ Backend ignore silencieusement (log warning)
   - Ligne créée sans compte

4. **Régression : Ancien numéro de compte**
   - Si le frontend envoie `"6011"` (ancien comportement)
   - ✅ Backend l'ignore (ne cherche pas le fallback)
   - Ligne créée sans compte (safe)

---

## Notes pour le futur

- ✅ Ne jamais accepter d'identifiants métier (`numero`, `code`) comme clé étrangère Doctrine
- ✅ Utiliser toujours les UUID techniques (`id`) pour les relations
- ✅ Le frontend doit envoyer l'ID, pas le numero
- ✅ Affichage du numero est fait via `__toString()` ou propriété `numero`
