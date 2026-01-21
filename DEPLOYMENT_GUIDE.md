# 🚀 GUIDE DE DÉPLOIEMENT - SYSCOHADA

## ✅ Checklist Pré-déploiement

### Backend

- [ ] Tests PHP : `php bin/console lint:php src/`
- [ ] Validations Doctrine : `php bin/console doctrine:schema:validate`
- [ ] Migration testée localement
- [ ] Endpoints API testés avec Postman/cURL
- [ ] Logs vérifié pour erreurs

```bash
# Vérifications
cd backend

# 1. Lint PHP
php bin/console lint:php src/

# 2. Schéma valide
php bin/console doctrine:schema:validate

# 3. Test endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://127.0.0.1:8000/api/comptes/natures

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://127.0.0.1:8000/api/comptes/types?nature=606
```

### Frontend

- [ ] Build TypeScript sans erreurs : `npm run build`
- [ ] Pas de console warnings
- [ ] Test des composants

```bash
# Vérifications
cd frontend

# 1. Build
npm run build

# 2. Lint
npm run lint

# 3. Tests (si disponibles)
npm run test
```

---

## 📋 Plan de déploiement

### Phase 1: Préparation (30 min)

1. **Créer une branche de feature**
   ```bash
   git checkout -b feat/syscohada-integration
   ```

2. **Vérifier les permissions**
   ```bash
   # Vérifier que les migrations s'exécutent
   php bin/console doctrine:migrations:status
   ```

3. **Backup de la BD**
   ```bash
   # PostgreSQL
   pg_dump -U username database_name > backup_20260121.sql
   
   # MySQL
   mysqldump -u username -p database_name > backup_20260121.sql
   ```

### Phase 2: Mise à jour du Backend (45 min)

1. **Déployer le code**
   ```bash
   # Depuis le répertoire du projet
   git pull origin feat/syscohada-integration
   cd backend
   composer install --no-dev  # Si nouveau package (non applicable ici)
   ```

2. **Exécuter les migrations**
   ```bash
   php bin/console doctrine:migrations:migrate --no-interaction
   ```

3. **Vérifier les migrations**
   ```bash
   php bin/console doctrine:migrations:status
   # Output: 2 executed, 0 pending
   ```

4. **Test des endpoints**
   ```bash
   # Test 1: Natures
   curl -X GET \
     -H "Authorization: Bearer $TOKEN" \
     -H "Accept: application/json" \
     https://api.example.com/api/comptes/natures
   
   # Test 2: Types filtrés
   curl -X GET \
     -H "Authorization: Bearer $TOKEN" \
     -H "Accept: application/json" \
     https://api.example.com/api/comptes/types?nature=606
   ```

5. **Vérifier les logs**
   ```bash
   tail -f backend/var/log/prod.log
   # Ne doit pas contenir d'erreurs CRITICAL
   ```

### Phase 3: Mise à jour du Frontend (30 min)

1. **Déployer le code**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Copier les assets**
   ```bash
   # Selon votre setup (par ex. Docker, nginx, etc.)
   cp -r dist/* /var/www/html/app/
   ```

3. **Cache clear (si applicable)**
   ```bash
   # Nginx/Apache
   sudo systemctl reload nginx
   # ou
   sudo systemctl reload apache2
   ```

4. **Test du navigateur**
   - Accédez à https://app.example.com/admin/caisses
   - Vérifiez que les sélecteurs chargent correctement
   - Testez la création d'une caisse

### Phase 4: Validation (30 min)

1. **Créer une demande de test**
   - Titre: "Test SYSCOHADA"
   - Ajouter une ligne
   - Sélectionner Nature puis Type
   - Valider et soumettre

2. **Vérifier en BD**
   ```sql
   SELECT ld.*, cc.numero as compte_numero
   FROM ligne_demande ld
   LEFT JOIN compte_comptable cc ON ld.compte_id = cc.id
   WHERE ld.id = 'YOUR_LINE_ID';
   ```

3. **Créer une caisse de test**
   - Nom: "Test SYSCOHADA"
   - Sélectionner Nature puis Type
   - Vérifier la sauvegarde en BD

4. **Tester le décaissement**
   - Créer un décaissement en mode détaillé
   - Vérifier que les comptes sont envoyés

---

## 🔄 Rollback Plan

### Si erreur détectée

1. **Arrêter immédiatement le trafic**
   ```bash
   # Diriger vers version précédente
   git revert HEAD
   cd backend
   php bin/console doctrine:migrations:migrate --no-interaction
   ```

2. **Restaurer la BD**
   ```bash
   # PostgreSQL
   psql -U username database_name < backup_20260121.sql
   
   # MySQL
   mysql -u username -p database_name < backup_20260121.sql
   ```

3. **Redéployer le frontend ancien**
   ```bash
   git checkout main
   cd frontend
   npm install
   npm run build
   cp -r dist/* /var/www/html/app/
   ```

4. **Vérifier les services**
   ```bash
   curl https://api.example.com/api/comptes/natures
   # Doit retourner une réponse 200
   ```

---

## 📊 Monitoring Post-déploiement

### Vérifications toutes les heures pendant 24h

1. **Logs d'erreur**
   ```bash
   # Backend
   grep "ERROR\|CRITICAL" backend/var/log/prod.log | tail -20
   
   # Frontend (DevTools console)
   # Pas d'erreur non gérée
   ```

2. **Métriques**
   ```bash
   # Charge CPU
   top -b -n 1 | head -5
   
   # Utilisation mémoire
   free -h
   
   # Connexions BD
   psql -U username -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. **Requêtes API**
   ```bash
   # Nombre de requêtes /api/comptes/natures
   grep "GET /api/comptes/natures" /var/log/nginx/access.log | wc -l
   
   # Temps de réponse moyen
   grep "GET /api/comptes/natures" /var/log/nginx/access.log | \
     awk '{print $(NF-1)}' | \
     awk '{sum+=$1} END {print sum/NR}'
   ```

---

## 📝 Checklist Finale

- [ ] Migrations appliquées
- [ ] Endpoints /natures et /types actifs
- [ ] Composant TypeScript compile
- [ ] Sélecteurs affichés dans l'UI
- [ ] Comptes sauvegardés en BD
- [ ] Pas d'erreur dans les logs
- [ ] Performance acceptable (< 200ms)
- [ ] Utilisateurs peuvent créer demandes/caisses
- [ ] Test de rollback documenté
- [ ] Documentation déployée

---

## 🎯 Métriques de succès

### Avant déploiement

- Temps moyen réponse API: < 100ms
- Taux de succès: 100%
- Erreurs: 0

### Après déploiement (24h)

- Temps moyen réponse /api/comptes/natures: < 150ms
- Temps moyen réponse /api/comptes/types: < 200ms
- Taux d'erreur: < 0.1%
- Aucun error 500

---

## 📞 Support et Escalade

### En cas de problème

1. **Niveau 1 - Logs et Monitoring**
   - Vérifier backend/var/log/prod.log
   - Vérifier frontend console
   - Vérifier BD connectivity

2. **Niveau 2 - Rollback**
   - Exécuter rollback plan
   - Restaurer depuis backup
   - Notifier l'équipe

3. **Niveau 3 - Analyse**
   - Comparaison avant/après
   - Audit des changements
   - Tests supplémentaires

---

## 📅 Timeline recommandée

```
Jour 1 (Mardi)
├─ 09:00 - Préparation
├─ 09:30 - Backup BD
├─ 10:00 - Déploiement Backend
├─ 10:45 - Tests Backend
├─ 11:00 - Déploiement Frontend
├─ 11:30 - Tests Frontend
└─ 12:00 - Validation

Jour 2-3 (Mercredi-Jeudi)
├─ Monitoring continu
├─ Support utilisateurs
└─ Corrections mineurs

Jour 4 (Vendredi)
├─ Rapport final
└─ Documentation mise à jour
```

---

## ✨ Post-déploiement

1. **Notification utilisateurs**
   ```
   Titre: Nouvelle fonctionnalité - Plan Comptable SYSCOHADA
   
   Nouvelle interface pour sélectionner les comptes comptables
   dans les demandes et les caisses.
   
   Plus d'information: [LIEN DOCUMENTATION]
   ```

2. **Traçabilité**
   ```bash
   git tag -a v1.2.0-syscohada -m "Intégration SYSCOHADA"
   git push origin v1.2.0-syscohada
   ```

3. **Documentation interne**
   - Ajouter lien docs dans wiki
   - Créer ticket support FAQ
   - Former l'équipe support

