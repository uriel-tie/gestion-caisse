#!/bin/bash
# Script de test pour l'intégration SYSCOHADA

set -e

BASE_URL="https://127.0.0.1:8000/api"
TOKEN="${TOKEN:-YOUR_TOKEN_HERE}"

echo "🧪 Test de l'intégration SYSCOHADA"
echo "===================================="
echo ""

# Test 1: Récupérer les Natures
echo "1️⃣  Test : Récupérer les Natures (3 chiffres)"
echo "   Endpoint: GET $BASE_URL/comptes/natures"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/comptes/natures" | jq '.[0:2]'
echo ""

# Test 2: Récupérer les Types sans filtre
echo "2️⃣  Test : Récupérer tous les Types (4+ chiffres)"
echo "   Endpoint: GET $BASE_URL/comptes/types"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/comptes/types" | jq '.[0:2]'
echo ""

# Test 3: Récupérer les Types filtrés par Nature
echo "3️⃣  Test : Récupérer Types filtrés par Nature"
echo "   Endpoint: GET $BASE_URL/comptes/types?nature=606"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/comptes/types?nature=606" | jq '.[0:2]'
echo ""

echo "✅ Tests de base complétés !"
echo ""
echo "📝 Notes :"
echo "   - Remplacez YOUR_TOKEN_HERE par votre token JWT"
echo "   - Remplacez 606 par une Nature valide de votre BD"
echo "   - Vérifiez que les comptes retournés ont la bonne longueur"
