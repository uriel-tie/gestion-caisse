# 📊 DIFF Résumé - Intégration SYSCOHADA

## Fichiers Backend

### 1. backend/src/Entity/LigneDemande.php

```diff
+ use App\Entity\CompteComptable;

  #[ORM\Column]
  private ?float $prixUnitaireEstimatif = null;

  #[ORM\ManyToOne(inversedBy: 'lignes')]
  #[ORM\JoinColumn(nullable: false)]
  private ?Demande $demande = null;

+ #[ORM\ManyToOne(targetEntity: CompteComptable::class)]
+ #[ORM\JoinColumn(nullable: true)]
+ private ?CompteComptable $compte = null;

  // ... getters/setters existants ...

+ public function getCompte(): ?CompteComptable { return $this->compte; }
+ public function setCompte(?CompteComptable $compte): static { 
+     $this->compte = $compte; 
+     return $this; 
+ }
```

### 2. backend/src/Controller/DemandeController.php

```diff
  use App\Entity\Demande;
  use App\Entity\LigneDemande;
  use App\Entity\Utilisateur;
  use App\Entity\Societe;
+ use App\Entity\CompteComptable;
  use App\Repository\DemandeRepository;

  // ... dans la méthode create() ...

  // LIGNES
  if (!empty($data['lignes']) && is_array($data['lignes'])) {
      foreach ($data['lignes'] as $l) {
          $ligne = new LigneDemande();
          $ligne->setDesignation($l['designation']);
          $ligne->setQuantite((int)$l['quantite']);
          $ligne->setPrixUnitaireEstimatif((float)$l['prixUnitaire']);
          
+         // Associer le compte comptable (Type) si fourni
+         if (!empty($l['compte_id'])) {
+             $compte = $em->getRepository(CompteComptable::class)->find($l['compte_id']);
+             if ($compte) {
+                 $ligne->setCompte($compte);
+             }
+         }
          
          $demande->addLigne($ligne);
      }
  }
```

### 3. backend/src/Controller/CompteComptableController.php

```diff
  // ... méthodes existantes ...

+ /**
+  * Récupère les comptes "Nature" (3 chiffres seulement)
+  */
+ #[Route('/natures', name: 'list_natures', methods: ['GET'])]
+ public function listNatures(CompteComptableRepository $repo): JsonResponse
+ {
+     $allComptes = $repo->findAllSorted();
+     $natures = [];
+
+     foreach ($allComptes as $c) {
+         if (strlen($c->getNumero()) === 3) {
+             $natures[] = [
+                 'id' => $c->getId(),
+                 'numero' => $c->getNumero(),
+                 'libelle' => $c->getLibelle(),
+                 'label_complet' => $c->__toString()
+             ];
+         }
+     }
+
+     return $this->json($natures);
+ }
+
+ /**
+  * Récupère les comptes "Type" (4+ chiffres), optionnellement filtrés par Nature
+  */
+ #[Route('/types', name: 'list_types', methods: ['GET'])]
+ public function listTypes(Request $request, CompteComptableRepository $repo): JsonResponse
+ {
+     $nature = $request->query->get('nature');
+     $allComptes = $repo->findAllSorted();
+     $types = [];
+
+     foreach ($allComptes as $c) {
+         if (strlen($c->getNumero()) >= 4) {
+             if ($nature && strpos($c->getNumero(), $nature) !== 0) {
+                 continue;
+             }
+
+             $types[] = [
+                 'id' => $c->getId(),
+                 'numero' => $c->getNumero(),
+                 'libelle' => $c->getLibelle(),
+                 'nature' => substr($c->getNumero(), 0, 3),
+                 'label_complet' => $c->__toString()
+             ];
+         }
+     }
+
+     return $this->json($types);
+ }
```

---

## Fichiers Frontend

### 1. frontend/src/components/CompteComptableSelector.tsx (NEW)

```typescript
✨ NOUVEAU FICHIER (105 lignes)

- Interface CompteComptableSelector
- Charge Natures au montage via /api/comptes/natures
- Charge Types au montage et quand Nature change via /api/comptes/types?nature=X
- Tailwind CSS styling
- Support showLabel, required, className props
- Gestion des états de chargement
- Callbacks onNatureChange et onTypeChange
```

### 2. frontend/src/components/RequestLinesEditor.tsx

```diff
+ import { CompteComptableSelector } from './CompteComptableSelector';

  export interface RequestLine {
      id: number;
      designation: string;
      quantite: number;
      prixUnitaire: number;
      total: number;
+     compte_id?: string | null;
+     nature_numero?: string | null;
  }

  // ... dans le rendu du tableau ...

  <tr key={line.id} className="hover:bg-gray-50 transition-colors">
      <td className="p-2">
          {/* designation input */}
      </td>
      <td className="p-2">
          {/* quantite input */}
      </td>
      <td className="p-2">
          {/* prixUnitaire input */}
      </td>
      <td className="p-2 text-right font-mono font-medium text-gray-700">
          {line.total.toLocaleString()}
      </td>
+     <td className="p-2">
+         <CompteComptableSelector
+             selectedNatureId={line.nature_numero}
+             selectedTypeId={line.compte_id}
+             onNatureChange={(nature) => {
+                 const newLines = lines.map(l => 
+                     l.id === line.id 
+                         ? { ...l, nature_numero: nature, compte_id: null }
+                         : l
+                 );
+                 onChange(newLines);
+             }}
+             onTypeChange={(typeId) => {
+                 const newLines = lines.map(l => 
+                     l.id === line.id 
+                         ? { ...l, compte_id: typeId }
+                         : l
+                 );
+                 onChange(newLines);
+             }}
+             showLabel={false}
+             className="text-xs"
+         />
+     </td>
      <td className="p-2 text-center">
          {/* delete button */}
      </td>
  </tr>
```

### 3. frontend/src/pages/NewRequestPage.tsx

```diff
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // ... validations ...
      
      const payload = {
          titre,
          type,
          motif,
          montant: totalGeneral,
          beneficiaire_id: beneficiaireMode === 'LIST' ? beneficiaireId : null,
          beneficiaire_autre: beneficiaireMode === 'MANUAL' ? beneficiaireNom : null,
          
          lignes: lignes.map(l => ({
              designation: l.designation,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
+             compte_id: l.compte_id || null
          }))
      };
```

### 4. frontend/src/components/AdminCaisse.tsx

```diff
- import React, { useState, useEffect } from 'react';
  import { Plus, Monitor, Trash2 } from 'lucide-react';
+ import { CompteComptableSelector } from './CompteComptableSelector';
+ import { useState, useEffect } from 'react';

  export default function AdminCaisse() {
      const [caisses, setCaisses] = useState<any[]>([]);
      const [caissiers, setCaissiers] = useState<any[]>([]);
-     const [comptes, setComptes] = useState<any[]>([]);
      const [newCaisse, setNewCaisse] = useState('');
      const [newCaisseEmploye, setNewCaisseEmploye] = useState('');
-     const [newCaisseCompte, setNewCaisseCompte] = useState('');
+     const [newCaisseNature, setNewCaisseNature] = useState('');
+     const [newCaisseType, setNewCaisseType] = useState('');

      useEffect(() => {
          fetchData('caisses', setCaisses);
-         fetchData('comptes', setComptes);
          fetchUsers();
      }, []);

      // ... dans le formulaire ...

-     <select
-         value={newCaisseCompte}
-         onChange={(e) => setNewCaisseCompte(e.target.value)}
-         className="border rounded-lg px-3 py-2"
-     >
-         <option value="">-- Compte Comptable --</option>
-         {comptes.map((c: any) => (
-             <option key={c.id} value={c.id}>{c.numero} - {c.libelle}</option>
-         ))}
-     </select>

+     <div className="md:col-span-2">
+         <CompteComptableSelector
+             selectedNatureId={newCaisseNature}
+             selectedTypeId={newCaisseType}
+             onNatureChange={(nature) => {
+                 setNewCaisseNature(nature || '');
+                 setNewCaisseType('');
+             }}
+             onTypeChange={(typeId) => setNewCaisseType(typeId || '')}
+             showLabel={true}
+             className="text-sm"
+         />
+     </div>

      // ... dans handleCreate ...
-     { nom: newCaisse, employe_id: newCaisseEmploye || null, compte_id: newCaisseCompte || null, seuil: newCaisseSeuil }
+     { nom: newCaisse, employe_id: newCaisseEmploye || null, compte_id: newCaisseType || null, seuil: newCaisseSeuil }

      // ... dans le reset ...
-     () => { setNewCaisse(''); setNewCaisseSeuil(DEFAULT_SEUIL_DECAISSEMENT); setNewCaisseEmploye(''); setNewCaisseCompte(''); }
+     () => { setNewCaisse(''); setNewCaisseSeuil(DEFAULT_SEUIL_DECAISSEMENT); setNewCaisseEmploye(''); setNewCaisseNature(''); setNewCaisseType(''); }

      // ... dans le tableau ...
-     <select
-         value={c.compte?.id || ''}
-         onChange={(e) =>
-             handleUpdateCaisse(c.id, { compte_id: e.target.value || null })
-         }
-         className="w-full border rounded px-2 py-1 text-xs"
-     >
-         <option value="">-- Aucun --</option>
-         {comptes.map((cc: any) => (
-             <option key={cc.id} value={cc.id}>
-                 {cc.numero}
-             </option>
-         ))}
-     </select>

+     {c.compteComptable ? (
+         <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
+             {c.compteComptable.numero}
+         </span>
+     ) : (
+         <span className="text-gray-400 text-xs">Aucun</span>
+     )}
```

### 5. frontend/src/components/DecaissementModal.tsx

```diff
  const handleSubmit = async (e: React.FormEvent) => {
      // ...
      if (!demande?.id) {
          payload.beneficiaire = beneficiaire;
          if (modeDetaille) {
              payload.lignes = lignes.map(l => ({
                  designation: l.designation,
                  quantite: l.quantite,
                  prix: l.prixUnitaire,
                  total: l.total,
+                 compte_id: l.compte_id || null
              }));
          }
      }
```

---

## Fichiers Créés (Documentation)

### 📄 Fichiers de documentation

```
✨ SYSCOHADA_INTEGRATION.md      (413 lignes) - Vue d'ensemble complète
✨ TECHNICAL_DETAILS.md          (380 lignes) - Détails techniques et architecture
✨ README_SYSCOHADA.md           (150 lignes) - Guide rapide
✨ DATABASE_SCHEMA.sql           (180 lignes) - Schéma et exemples SQL
✨ test_syscohada.sh             (40 lignes) - Script de test API

```

### 🗄️ Migrations

```
✨ backend/migrations/Version20260121081842.php
   - Ajoute colonne compte_id (UUID, nullable) dans ligne_demande
   - Ajoute contrainte FK vers compte_comptable
   - Crée index sur compte_id
```

---

## Statistiques des changements

```
Backend:
  ├─ Entity modifiée       : 1 fichier (LigneDemande.php)
  ├─ Contrôleur modifié    : 2 fichiers (+60 lignes)
  ├─ Migration nouvelle    : 1 fichier
  └─ Total                 : 3 fichiers modifiés, 1 nouvelle migration

Frontend:
  ├─ Nouveau composant     : 1 fichier (CompteComptableSelector.tsx)
  ├─ Composant modifié     : 1 fichier (RequestLinesEditor.tsx, +30 lignes)
  ├─ Page modifiée         : 2 fichiers (NewRequestPage.tsx +1, AdminCaisse.tsx +35)
  ├─ Modal modifiée        : 1 fichier (DecaissementModal.tsx +1)
  └─ Total                 : 5 fichiers modifiés, 1 nouveau

Documentation:
  └─ 5 fichiers créés (total ~1200 lignes)

Total: 10 fichiers modifiés/créés, 1 migration
```

---

## Checklist d'intégration

- [x] Entity relation créée
- [x] Migration générée
- [x] Endpoints API créés
- [x] Composant réutilisable créé
- [x] RequestLinesEditor mis à jour
- [x] NewRequestPage mis à jour
- [x] AdminCaisse mis à jour
- [x] DecaissementModal mis à jour
- [x] Types TypeScript à jour
- [x] Documentation complète
- [x] Tests manuels possibles
- [ ] Tests automatisés
- [ ] Déploiement production

