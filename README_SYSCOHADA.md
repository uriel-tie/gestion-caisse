# 🎯 ORBIS CAISSE - Intégration SYSCOHADA

## 📦 Fichiers Modifiés / Créés

### Backend (PHP/Symfony)

| Fichier | Type | Modifications |
|---------|------|----------------|
| `backend/src/Entity/LigneDemande.php` | ✏️ Modifié | Ajout relation ManyToOne vers CompteComptable |
| `backend/src/Controller/DemandeController.php` | ✏️ Modifié | Import CompteComptable + logique d'association |
| `backend/src/Controller/CompteComptableController.php` | ✏️ Modifié | 2 endpoints : `/natures` et `/types` |
| `backend/migrations/Version20260121081842.php` | ✨ Créé | Migration pour la relation LigneDemande->compte |

### Frontend (React/TypeScript)

| Fichier | Type | Modifications |
|---------|------|----------------|
| `frontend/src/components/CompteComptableSelector.tsx` | ✨ Créé | Composant réutilisable Nature/Type |
| `frontend/src/components/RequestLinesEditor.tsx` | ✏️ Modifié | Intégration CompteComptableSelector dans chaque ligne |
| `frontend/src/components/AdminCaisse.tsx` | ✏️ Modifié | Utilise CompteComptableSelector pour les caisses |
| `frontend/src/components/DecaissementModal.tsx` | ✏️ Modifié | Payload avec compte_id |
| `frontend/src/pages/NewRequestPage.tsx` | ✏️ Modifié | Payload avec compte_id dans les lignes |

### Documentation

| Fichier | Description |
|---------|-------------|
| `SYSCOHADA_INTEGRATION.md` | 📖 Documentation complète (ce que vous faites en ce moment !) |
| `test_syscohada.sh` | 🧪 Script de test API |

---

## 🔑 Concepts Clés

```
Plan Comptable SYSCOHADA
│
├─ Nature (3 chiffres)
│  ├─ 601 : Achats
│  ├─ 606 : Achats Divers
│  └─ 611 : Transport
│
└─ Type (4+ chiffres) - Enfant de Nature
   ├─ 6011 : Achats Matières Premières
   ├─ 6012 : Achats Produits Finis
   ├─ 6061 : Achats Fournitures
   ├─ 6111 : Transport de Marchandises
   └─ 6112 : Transport Divers
```

---

## 🚀 Démarrage Rapide

### 1. Préparation de la BD
```bash
# Créer des comptes valides si nécessaire
cd backend
php bin/console doctrine:fixtures:load  # ou créer manuellement
```

### 2. Tester l'API
```bash
bash test_syscohada.sh
# N'oubliez pas de remplacer TOKEN et nature=606 par vos valeurs
```

### 3. Tester l'UI
- Admin → Caisses → Voir le sélecteur Nature/Type
- Fiches de Besoin → Nouvelle Demande → Voir les sélecteurs par ligne
- Décaissements → Mode Détaillé → Voir les sélecteurs

---

## 🎨 Interface Utilisateur

### AdminCaisse - Formulaire d'ajout
```
┌────────────────────────────────────────────┐
│ Nom de caisse      │  Seuil (FCFA)        │
│ [________]         │  [______] FCFA       │
│                    │                      │
│ Caissier (opt)     │  Nature ↓            │
│ [______]           │  [__606__]           │
│                                           │
│ Type (filtré) ↓ (apparaît si Nature ok)   │
│ [__6061__]                                │
│                                           │
│ + Ajouter la caisse                       │
└────────────────────────────────────────────┘
```

### RequestLinesEditor - Tableau des lignes
```
┌─────────────────────────────────────────────────────────┐
│ Désignation │ Qté │ P.U. │ Total │ Compte      │ ✕    │
│ [   ]       │ [1] │ [  ] │ 0,00  │ Nature │Type│      │
│             │     │      │       │[____][____] │      │
│ [+] Ajouter ligne                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 API Endpoints

### GET /api/comptes/natures
**Retourne** : Tous les comptes avec 3 chiffres
```json
[
  {
    "id": "uuid",
    "numero": "606",
    "libelle": "Achats Divers",
    "label_complet": "606 - Achats Divers"
  }
]
```

### GET /api/comptes/types?nature=606
**Retourne** : Tous les comptes 4+ chiffres commençant par 606
```json
[
  {
    "id": "uuid",
    "numero": "6061",
    "libelle": "Achats Fournitures",
    "nature": "606",
    "label_complet": "6061 - Achats Fournitures"
  }
]
```

---

## ✅ Checklist de Validation

- [ ] Base de données migrate : `php bin/console doctrine:migrations:migrate`
- [ ] Comptes SYSCOHADA créés (3 et 4+ chiffres)
- [ ] Frontend compile sans erreurs : `npm run build`
- [ ] API /api/comptes/natures répond avec données
- [ ] API /api/comptes/types?nature=XXX répond avec filtres
- [ ] AdminCaisse affiche sélecteurs Nature/Type
- [ ] RequestLinesEditor montre colonne "Compte"
- [ ] Nouvelle demande sauvegarde compte_id
- [ ] Création caisse sauvegarde le compte

---

## 🐛 Troubleshooting

### Les sélecteurs ne chargent pas ?
1. Vérifiez le token JWT
2. Vérifiez que les comptes existent en BD
3. Ouvrez la DevTools (F12) → Console pour voir les erreurs

### Les Types ne se filtrent pas ?
1. Vérifiez que les comptes Type commencent bien par les 3 chiffres de la Nature
2. Exemple : Nature=606, Types doivent être 6061, 6062, etc.

### Les données ne se sauvegardent pas ?
1. Vérifiez les logs backend : `tail -f backend/var/log/dev.log`
2. Vérifiez que compte_id est envoyé dans le payload
3. Vérifiez la migration est appliquée

---

## 📚 Ressources

- [Plan SYSCOHADA Wikipedia](https://en.wikipedia.org/wiki/SYSCOHADA)
- [Documentation Symfony Relations](https://symfony.com/doc/current/doctrine/associations/index.html)
- [Documentation React Hooks](https://react.dev/reference/react)

---

## 👥 Support

Pour toute question, consultez :
1. `SYSCOHADA_INTEGRATION.md` - Documentation détaillée
2. Les fichiers source - Commentaires inclus
3. `test_syscohada.sh` - Pour tester l'API manuellement

---

**Mise à jour** : 21 Janvier 2026
**Statut** : ✅ Intégration Complète
