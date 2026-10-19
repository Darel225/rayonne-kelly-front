# JOURNAL DE BORD & RÉSUMÉ DE CONVERSATION — PROJET FL STRUCTURES
> **Document de passation et d'historique d'échange**  
> **Dernière mise à jour :** 19 Octobre 2026  
> **Statut actuel :** Projet livré au client — En attente des retours de recette  
> **URL en production :** [https://flstructures.vercel.app](https://flstructures.vercel.app)  
> **Dépôt GitHub :** [https://github.com/Darel225/flstructures.git](https://github.com/Darel225/flstructures.git) (Branche `main`)  
> **Serveur API distant :** [https://flstructures.alwaysdata.net/api/v1](https://flstructures.alwaysdata.net/api/v1)

---

## 1. POURQUOI CE DOCUMENT ?

Ce document récapitule l'intégralité des échanges, décisions, diagnostics et résolutions menés ensemble dans notre conversation sur le projet **FL Structures**.  
Il sert de **repère chronologique exact** : lorsque le client enverra ses retours (demandes de modifications, ajustements de contenu ou de design), nous pourrons reprendre le travail immédiatement sans hésitation ni risque de régression.

---

## 2. CHRONOLOGIE DE NOS TRAVAUX & ÉCHANGES

### 🔹 Phase 1 : Coconstruction de l'Espace Administrateur (Étapes 1 à 6)
Nous avons guidé et structuré le développement du Back-Office complet pour FL Structures :
1. **Étape 1 (Socle technique & Sécurité)** : Mise en place de l'authentification en mémoire vive avec Zustand (anti-XSS), gestion du Refresh Token silencieux via Cookie HttpOnly, mutex Axios anti-401 avec file d'attente intelligente.
2. **Étape 2 (Design System Admin & Boîte à outils UI)** : Création des composants réutilisables (`DataTable`, `TablePagination`, `TableSkeleton`, `EmptyState`, `StatusBadge`, `SlideOverDrawer`, `ConfirmDialog`, `BilingualTabs` FR/EN, showroom de test `/admin/ui-kit`).
3. **Étape 3 (Pôle CRM B2B)** : Gestion des flux entrants (Devis miniers, Réservations d'hébergements, Candidatures partenaires, Messages de contact) avec compteurs en temps réel dans la barre latérale et sur le Dashboard.
4. **Étape 4 (Catalogue Modulaire & Référentiels)** : Gestion des catégories, des produits et du référentiel des 27 équipements de chantier avec le sélecteur d'icônes visuel `IconPicker.jsx`.
5. **Étape 5 (Hébergements, Galeries & Réalisations)** : Gestionnaire multi-photos avec photo de couverture dynamique (`GalleryManager.jsx`), études de cas d'ingénierie structurées selon le triptyque (Besoin client / Contraintes terrain / Solution technique).
6. **Étape 6 (Configuration globale & Dashboard)** : Cartes d'astreinte 24/7, email de routage des leads, mercuriale tarifaire PDF téléchargeable et KPIs connectés en direct.

---

### 🔹 Phase 2 : Raccordement Backend & Base de Données AlwaysData
- La base de données MySQL distante `flstructures_db` sur AlwaysData (`mysql-flstructures.alwaysdata.net`) a été branchée sur l'API REST PHP 8.2 (`https://flstructures.alwaysdata.net/api/v1`).
- **Contrainte absolue respectée :** Aucun code source PHP backend n'a été altéré ou dégradé par nos soins ; tous les ajustements ont été concentrés sur le frontend et la synchronisation des données distantes.

---

### 🔹 Phase 3 : Les Problèmes Rencontrés & Leurs Résolutions Chirurgicales

#### 1. Redirection intempestive sur la page de connexion
- **Problème soulevé :** En ouvrant le site, le visiteur était automatiquement redirigé vers `/connexion` alors qu'il s'agit d'un site vitrine public.
- **Action menée :** Correction de l'arbre de routage dans `AppRoutes` / `AuthGuard` : le site vitrine est désormais accessible à tous par défaut à la racine `/`, et la page `/connexion` est réservée exclusivement aux administrateurs.

#### 2. Cohérence du contenu public avec l'activité réelle (Mines & Agroalimentaire)
- **Problème soulevé :** Les textes des réalisations devaient refléter l'activité réelle de FL Structures (l'approvisionnement alimentaire et logistique pour les sites miniers en Côte d'Ivoire) tout en conservant les photos réelles déjà existantes.
- **Action menée :** Alignement éditorial des fiches projets avec les sites miniers de Tongon (Nord), Ity (Ouest), Bonikro et San Pedro, garantissant une cohérence parfaite entre les images de savane/chantiers et les descriptifs techniques de catering industriel.

#### 3. Diagnostic des modifications non enregistrées en base de données
- **Problème soulevé :** Certaines modifications faites dans l'interface admin semblaient ne pas impacter la base MySQL distante.
- **Action menée :** Analyse des payloads de requêtes, clarification des endpoints d'API et validation des correspondances de clés d'objets entre React Query et les contrôleurs PHP.

#### 4. Le problème critique des images cassées ("Photo Introuvable" & carrés gris)
- **Problème soulevé :** Les images s'affichaient bien sur le site public mais apparaissaient en erreur ("Photo Introuvable") ou disparaissaient sous forme de carrés gris dans le back-office admin (notamment les hébergements et catégories).
- **Analyse de la cause racine :**
  - Des URL en dur `http://localhost:8000` subsistaient dans certains composants admin (`HebergementsListPage.jsx`, helper `formatImageUrl`, `PartenaireRequestsPage.jsx`) au lieu de pointer sur AlwaysData.
  - Les balises `<img>` contenaient `onError={(e) => { e.currentTarget.style.display = 'none' }}`, ce qui effaçait la boîte au lieu d'afficher un fallback.
- **Résolution chirurgicale :**
  - Élimination de 100% des occurrences de `localhost:8000` dans tout le projet `src/`.
  - Centralisation via l'utilitaire `resolveImageUrl()` avec repli automatique vers `https://flstructures.alwaysdata.net`.
  - Remplacement des `onError` destructeurs par `handleImageError` (icône de secours sans briser la mise en page).
  - Téléversement direct sur le serveur AlwaysData des visuels distants manquants (la photo de savane Tongon `39a1d68e5247d0985328f5747ffa518d.webp` et l'image volaille pour la catégorie 8).

#### 5. Dynamisation de la Page Contact (`/contact`) & Image Hero
- **Demande :**
  - Rendre dynamiques les coordonnées de contact (Appel commercial, Email officiel, WhatsApp B2B) depuis les réglages généraux de la base (`/admin/settings`).
  - Mettre une image d'arrière-plan sur le Hero de contact avec dégradé sombre immersif.
- **Incident résolu en direct :** Un crash React temporaire (`ReferenceError: telUrl is not defined`) est apparu suite au rechargement à chaud Vite avant l'écriture de la variable. `telUrl` a été immédiatement injecté, et le build a été validé à 100% sans erreur.

---

### 🔹 Phase 4 : Mise en Ligne sur Vercel & Nettoyage Final

1. **Configuration SPA Vercel :**  
   Création du fichier `vercel.json` pour rediriger toutes les routes `/(.*)` vers `/index.html` afin d'éviter les erreurs 404 lors du rechargement de n'importe quelle page.
2. **Variables d'environnement Vercel :**  
   - `VITE_API_URL` = `https://flstructures.alwaysdata.net/api/v1`  
   - `VITE_STORAGE_URL` = `https://flstructures.alwaysdata.net`
3. **Nettoyage de la page `/connexion` en production :**  
   Suppression du bouton de test *"Tester avec la session Démo Admin"* et du lien *"Retourner au site vitrine"* pour une présentation 100% sobre et institutionnelle.
4. **Push Git final :** Code poussé sur la branche `main` du dépôt [https://github.com/Darel225/flstructures.git](https://github.com/Darel225/flstructures.git).

---

## 3. ÉTAT EXACT OÙ NOUS NOUS SOMMES ARRÊTÉS

À l'instant T de la clôture de cette étape :
- Le site public est en ligne et accessible : **`https://flstructures.vercel.app`**.
- La page contact affiche les numéros réels configurés en base de données avec les liens directs téléphone, mail et WhatsApp.
- Le back-office est accessible via **`https://flstructures.vercel.app/connexion`** avec les identifiants :  
  `admin@fl-structures.ci` / `Admin@2026!`.
- Les images (produits, réalisations, galeries d'hébergements) chargent depuis AlwaysData sans aucune dépendance à localhost.
- Le client final a reçu le lien et teste actuellement la plateforme.

---

## 4. FEUILLE DE ROUTE LORS DU RETOUR DU CLIENT (QUE FAIRE SELON LA DEMANDE ?)

Dès que le client enverra ses remarques, voici le plan d'action immédiat :

| Type de retour client | Où intervenir ? | Faut-il toucher au code ? |
| :--- | :--- | :--- |
| **Changer un numéro, email ou adresse** | Aller sur `/admin/settings` dans le back-office | **NON** (modification en direct dans l'admin) |
| **Modifier un produit, une catégorie ou un prix** | Aller sur `/admin/catalog/...` | **NON** (gestion autonome en base MySQL) |
| **Ajouter ou modifier des photos de chantiers** | Aller sur `/admin/realisations` ou `/admin/hebergements` | **NON** (upload direct via les tiroirs de gestion) |
| **Modifier un texte statique du site vitrine** | Dans `fl-structures-front/src/components/public/...` | **OUI** (éditer le JSX, build `npm run build`, puis `git push origin main`) |
| **Changer les couleurs ou le style graphique** | Dans `fl-structures-front/src/index.css` ou Tailwind | **OUI** (ajustement CSS et redéploiement Vercel) |

Ce document conserve la mémoire exacte de nos sessions de travail.
