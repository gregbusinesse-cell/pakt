# Debug Guide: Système de Critères

## Instructions de test

### 1. Vérifier les préférences chargées au démarrage

Ouvrez la console du navigateur (F12) et allez sur la page /swipe. Cherchez les logs:

```
[SWIPE] User plan info
[SWIPE] Preferences state changed
[SWIPE] Preferences loaded from DB
```

**À vérifier:**
- `isPro: true` (sinon, les critères ne sont pas appliqués pour les non-Pro)
- Les valeurs de `age_min`, `age_max`, `distance_km` sont bien des **nombres** (pas des strings)
- Les valeurs chargées correspondent à ce que vous avez réglé

### 2. Modifier les critères dans le panel

Ouvrez le panel de critères (bouton "Modifier mes critères") et changez l'âge à 22-28 ans.

Cherchez les logs:
```
[CRITERIA] Age min changed
[CRITERIA] Age max changed
[CRITERIA] Saving preferences
[PREFERENCES] Received request body
[PREFERENCES] Extracted values
```

**À vérifier:**
- Les valeurs changent bien (22 → 28, pas 18 → 99)
- Les types sont bien `number` (pas `string`)
- L'API reçoit les bonnes valeurs

### 3. Vérifier que le filtrage est appliqué

Après avoir modifié les critères, cherchez:
```
[SWIPE] loadProfiles - Filter values
[SWIPE] Raw profiles from DB
[SWIPE] Filtering results
```

**À vérifier:**
- `ageMin: 22, ageMax: 28` (pas 18-99)
- Les profils bruts contiennent des personnes de 20 ans
- Le nombre de `baseEligible` est moins élevé que `totalProfiles`
- Si un profil de 20 ans est affiché : cherchez un log `Age filter FAILED: NAME age=20`

### 4. Cas de test spécifiques

#### Cas A: Profil de 20 ans toujours affiché avec critères 22-28

Vérifiez:
1. Le profil de 20 ans EST dans les profils bruts (check `Raw profiles from DB`)
2. Vous voyez `Age filter FAILED: 20 years name` dans les logs
3. Mais le profil est quand même affiché

**Cause probable:** Le filtrage applique la limite après le chargement, mais les profils affichés ne sont pas filtrés.

#### Cas B: Les préférences ne se sauvegardent pas

Vérifiez:
1. Le log `[CRITERIA] Saving preferences` n'apparaît pas → le panel ne déclenche pas la sauvegarde
2. L'API n'est pas appelée → aucun log `[PREFERENCES] Received request body`

**Cause probable:** `isPro` est false, ou la sauvegarde est bloquée.

#### Cas C: Les préférences sont sauvegardées mais pas chargées

Vérifiez:
1. `[PREFERENCES] Extracted values` montre les bonnes valeurs
2. Mais `[SWIPE] Preferences loaded from DB` ne reçoit rien
3. Les critères restent à 18-99 / 1000km

**Cause probable:** Le chargement des prefs au mount échoue ou est bloqué par `prefLoadedRef`.

---

## Logs clés à surveiller

| Log | Signification |
|-----|-------------|
| `[SWIPE] User plan info: isPro: true` | L'utilisateur est Pro, critères doivent être appliqués |
| `[SWIPE] Preferences loaded from DB: age_min: 22` | Les prefs sont bien chargées |
| `[SWIPE] Age filter FAILED` | Le filtrage fonctionne (profil rejeté) |
| `[SWIPE] Filtering results: eligible: 0` | Tous les profils sont rejetés → vérifier les critères |
| `[PREFERENCES] update error` | L'API de sauvegarde a échoué |

---

## Checklist de débogage

- [ ] Ouvrir F12 (Console)
- [ ] Naviguer vers /swipe
- [ ] Attendre les logs `[SWIPE] Preferences loaded from DB`
- [ ] Ouvrir le panel (bouton "Modifier mes critères")
- [ ] Changer l'âge de 18-99 à 22-28
- [ ] Chercher `[PREFERENCES] update error` → s'il existe, l'API a échoué
- [ ] Chercher `[SWIPE] Raw profiles from DB` → vérifier que des profils de 20 ans y sont
- [ ] Chercher `Age filter FAILED: age=20` → vérifier que ces profils sont rejetés
- [ ] Chercher `[SWIPE] Filtering results` → vérifier le nombre avant/après filtrage
- [ ] Si aucun log `Age filter FAILED` n'apparaît → le filtrage ne s'exécute pas du tout

---

## Points de rupture potentiels

1. **Préférences non chargées** → `preferences` reste à DEFAULT_PREFERENCES
2. **Préférences chargées en string** → `"22"` au lieu de `22` → comparaison échoue
3. **Filtrage côté client ignoré** → les 80 profils bruts sont affichés sans filtrage
4. **Race condition** → `loadProfiles` s'exécute avant le chargement des prefs
5. **isPro incorrect** → non-Pro users voient les critères par défaut

