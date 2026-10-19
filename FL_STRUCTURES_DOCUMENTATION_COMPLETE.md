# FL STRUCTURES — DOSSIER TECHNIQUE DE LIVRAISON & GUIDE DE MAINTENANCE

> **Date de livraison :** Octobre 2026  
> **Statut :** Livré / En attente des retours clients  
> **Production Frontend :** [https://flstructures.vercel.app](https://flstructures.vercel.app)  
> **Production Backend API :** [https://flstructures.alwaysdata.net/api/v1](https://flstructures.alwaysdata.net/api/v1)  
> **Dépôt GitHub Frontend :** [https://github.com/Darel225/flstructures.git](https://github.com/Darel225/flstructures.git) (Branche `main`)

---

## 1. VUE D'ENSEMBLE DU PROJET

### 1.1. Contexte & Activité
**FL Structures** est une entreprise spécialisée dans la logistique industrielle, l'approvisionnement des sites miniers, l'installation de bases-vie et de structures modulaires (hangars métallo-textiles, réfectoires, bureaux de chantier) en Côte d'Ivoire et en Afrique de l'Ouest.

### 1.2. Objectifs Réalisés
- **Site Vitrine Premium B2B** : Accueil, À Propos, Nos Services, Nos Produits, Réalisations minières, Hébergements & Bases-vie, Contact avec lignes directes.
- **Espace d'Administration Sécurisé (Back-office)** : Gestion dynamique complète (CRUD) des Produits, Catégories, Réalisations, Hébergements, Demandes de contact (CRM), Demandes de partenariats et Paramètres généraux de la plateforme.

---

## 2. ARCHITECTURE TECHNIQUE & HÉBERGEMENT

### 2.1. Frontend
- **Framework & Outils :** React 19, Vite, TailwindCSS, TanStack React Query (v5), React Router DOM (v7), Lucide Icons, Axios.
- **Hébergement :** **Vercel**
  - URL Publique : `https://flstructures.vercel.app`
  - URL Connexion Admin : `https://flstructures.vercel.app/connexion`
  - Déploiement Continu : Déclenché automatiquement à chaque `git push origin main`.
- **Routage SPA (Single Page Application) :** 
  - Fichier `vercel.json` à la racine :
    ```json
    {
      "rewrites": [
        {
          "source": "/(.*)",
          "destination": "/index.html"
        }
      ]
    }
    ```
- **Variables d'environnement Vercel :**
  - `VITE_API_URL` : `https://flstructures.alwaysdata.net/api/v1`
  - `VITE_STORAGE_URL` : `https://flstructures.alwaysdata.net`

### 2.2. Backend & API REST
- **Technologie :** PHP 8.2, Bramus Router, Architecture MVC modulaire, PDO MySQL.
- **Hébergement :** **AlwaysData**
  - Domaine API : `https://flstructures.alwaysdata.net/api/v1`
  - Dossier Public Web : `/home/flstructures/www/public`
  - Répertoire Uploads / Storage : `/home/flstructures/www/public/uploads` (accessible en direct via `https://flstructures.alwaysdata.net/uploads/...`)
- **Sécurité :** Authentification JWT (JSON Web Token), mots de passe hachés avec `password_hash()` BCRYPT, requêtes préparées PDO contre les injections SQL, en-têtes CORS configurés.

### 2.3. Base de Données
- **SGBD :** MySQL (Hébergé sur AlwaysData)
- **Hôte :** `mysql-flstructures.alwaysdata.net`
- **Nom de la base :** `flstructures_db`
- **Utilisateur :** `flstructures`

---

## 3. IDENTIFIANTS & ACCÈS D'ADMINISTRATION

| Service | URL d'accès | Identifiant / Email | Rôle / Droits |
| :--- | :--- | :--- | :--- |
| **Back-office FL Structures** | `https://flstructures.vercel.app/connexion` | `admin@fl-structures.ci` | Super Administrateur |
| **AlwaysData (Panel Hébergement)** | `https://admin.alwaysdata.com` | Compte AlwaysData `flstructures` | Accès Serveur, Fichiers & DB |
| **GitHub Repository** | `https://github.com/Darel225/flstructures` | Compte `Darel225` | Code Source Frontend |
| **Vercel Dashboard** | `https://vercel.com` | Compte lié | Gestion Domaine & Déploiement |

> [!IMPORTANT]
> Sur la page de connexion de production, le bouton de débogage *"Tester avec la session Démo Admin"* et le lien *"Retourner au site vitrine"* ont été retirés pour garantir une sécurité et une présentation professionnelle stricte.

---

## 4. CARTOGRAPHIE DES ENDPOINTS API (BACKEND)

| Module | Méthode | Route API | Rôle |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Connexion administrateur & émission JWT |
| **Auth** | `POST` | `/api/v1/auth/logout` | Déconnexion & révocation de session |
| **Auth** | `GET` | `/api/v1/auth/me` | Récupération du profil admin connecté |
| **Paramètres** | `GET` | `/api/v1/settings` | Paramètres généraux publics (téléphone, email, WhatsApp, adresses) |
| **Paramètres** | `PUT` | `/api/v1/admin/settings` | Mise à jour des paramètres généraux (Admin) |
| **Catégories** | `GET` | `/api/v1/categories` | Liste des catégories de produits |
| **Catégories** | `POST` | `/api/v1/admin/categories` | Création / modification d'une catégorie (avec photo) |
| **Produits** | `GET` | `/api/v1/produits` | Liste des produits avec filtres & pagination |
| **Produits** | `POST` | `/api/v1/admin/produits` | Création / mise à jour produit (avec photo) |
| **Réalisations** | `GET` | `/api/v1/realisations` | Projets miniers & réalisations vitrine |
| **Réalisations** | `POST` | `/api/v1/admin/realisations` | Gestion des réalisations (photos, clients, dates) |
| **Hébergements** | `GET` | `/api/v1/hebergements` | Bases-vie, dortoirs, bungalows modulaires |
| **Hébergements** | `POST` | `/api/v1/admin/hebergements` | Ajout/édition d'hébergements + galeries photos |
| **CRM Contact** | `POST` | `/api/v1/contact` | Envoi d'une demande de contact depuis le site |
| **CRM Contact** | `GET` | `/api/v1/admin/contacts` | Liste & gestion des messages reçus (Admin) |
| **Partenariat** | `POST` | `/api/v1/partenariat` | Envoi d'une demande de partenariat B2B |
| **Partenariat** | `GET` | `/api/v1/admin/partenariats`| Traitement des demandes de partenariat (Admin) |

---

## 5. HISTORIQUE DES INTERVENTIONS & BUGS RÉSOLUS

### 5.1. Élimination totale des références `localhost:8000`
- **Problème initial :** Plusieurs fichiers d'administration (`HebergementsListPage.jsx`, `PartenaireRequestsPage.jsx`) ainsi que l'utilitaire `imageUrl.js` contenaient l'URL en dur `http://localhost:8000`. Cela provoquait des images cassées ("Photo Introuvable") chez le client ou dès que le backend n'était pas lancé localement.
- **Résolution chirurgicale :**
  - Remplacement de tous les appels en dur par la fonction centralisée `resolveImageUrl()` dans `src/utils/imageUrl.js`.
  - Fallback par défaut garanti sur `https://flstructures.alwaysdata.net` si aucune variable d'environnement n'est détectée.
  - Audit global ripgrep : **0 occurrence de `localhost:8000` restante dans le code source**.

### 5.2. Correction des carrés gris dans les tableaux du Back-Office
- **Problème initial :** Dans les tables de `CategoriesListPage.jsx`, `RealisationsListPage.jsx`, `ProduitsListPage.jsx` et `HebergementsListPage.jsx`, l'attribut `onError` masquait complètement l'élément (`e.currentTarget.style.display = 'none'`), laissant un espace gris vide en cas de retard de chargement.
- **Résolution :** Utilisation systématique de la fonction `handleImageError` qui affiche un fallback visuel soigné avec icône d'image sans casser la mise en page du tableau.

### 5.3. Synchronisation des images distantes AlwaysData
- Ré-upload et synchronisation directe sur le serveur AlwaysData des images manquantes :
  - Illustration de la mine de Tongon pour la Réalisation ID 4 (`39a1d68e5247d0985328f5747ffa518d.webp`).
  - Illustration de la catégorie Vivres Frais / Volaille (Catégorie ID 8).
  - Vérification HTTP 200 OK de l'intégralité des galeries d'hébergement.

### 5.4. Dynamisation intégrale de la Page Contact (`/contact`)
- **Lignes directes raccordées aux paramètres généraux (`/admin/settings`) :**
  - Appel direct commercial : `href="tel:..."` affichant la valeur dynamique en base (`+225 07 99 88 77 67`).
  - Email officiel : `href="mailto:..."` affichant `darelkonan149@gmail.com`.
  - WhatsApp dédié B2B : `href="https://wa.me/2250799887767?text=..."` avec message pré-rempli.
- **Hero Contact :** Remplacement du fond noir uni par un arrière-plan immersif (`hero-mines1.webp`) avec double superposition de dégradé sombre (`bg-gradient-to-b from-black/85 via-black/60 to-black/85`) conforme à la charte graphique des autres pages.
- **Correction du crash temporaire :** Déclaration de la variable de lien `telUrl` sous React Query pour éliminer l'erreur `ReferenceError`.

### 5.5. Mise en ligne Vercel & Routage SPA
- Génération du fichier `vercel.json` pour la redirection dynamique des URL vers `index.html`.
- Configuration des variables d'environnement distantes sur Vercel.
- Nettoyage du formulaire `/connexion` pour éliminer les traces de démo.

---

## 6. GUIDE DE TRAITEMENT DES RETOURS CLIENTS (AIDE-MÉMOIRE)

Lorsqu'un retour client arrive, consultez cette section pour intervenir rapidement :

### Cas A : Le client veut modifier les coordonnées (téléphone, email, adresse, WhatsApp)
> **Aucune modification de code nécessaire !**  
> 1. Connectez-vous sur `https://flstructures.vercel.app/connexion`.  
> 2. Allez dans le menu **Paramètres Généraux** (`/admin/settings`).  
> 3. Modifiez le numéro ou l'adresse et cliquez sur **Enregistrer**.  
> 4. Le site vitrine et la page `/contact` s'actualisent instantanément.

### Cas B : Le client veut ajouter / modifier des produits ou des réalisations
> **Gestion 100% autonome dans le back-office :**  
> - Produits : `/admin/produits`  
> - Réalisations minières : `/admin/realisations`  
> - Hébergements & Bases-vie : `/admin/hebergements`  
> Il suffit de renseigner les champs et de glisser-déposer les photos.

### Cas C : Le client demande une modification de design ou de texte statique
> 1. Ouvrez le projet local `c:\Users\Simplon-CI\Documents\fl-structures-front`.  
> 2. Effectuez la modification demandée dans le composant cible (`src/components/public/...`).  
> 3. Testez localement avec `npm run dev`.  
> 4. Validez le build : `npm run build`.  
> 5. Poussez sur GitHub :
>    ```bash
>    git add .
>    git commit -m "fix(client): prise en compte des retours client"
>    git push origin main
>    ```
> 6. Vercel met à jour le site en ligne automatiquement en moins d'une minute.
