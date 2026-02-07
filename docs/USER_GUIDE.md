# Guide Utilisateur - Clinical Storage System

## Bienvenue

Bienvenue dans le système de gestion d'entreposage pour les études cliniques. Ce guide vous aidera à utiliser efficacement l'application pour gérer vos documents et matériel de laboratoire.

**Version:** 1.0  
**Date:** 2026-02-03  
**Public:** Tous les utilisateurs (Investigateurs, ARC, Moniteurs, Archivistes, Data Managers, Data Clerks)

---

## Table des Matières

1. [Premiers Pas](#1-premiers-pas)
2. [Connexion et Authentification](#2-connexion-et-authentification)
3. [Tableau de Bord](#3-tableau-de-bord)
4. [Gestion des Documents](#4-gestion-des-documents)
5. [Gestion des Équipements](#5-gestion-des-équipements)
6. [Gestion des Consommables](#6-gestion-des-consommables)
7. [Demandes d'Accès](#7-demandes-daccès)
8. [Interface RFID](#8-interface-rfid)
9. [Rapports](#9-rapports)
10. [Mode Hors Ligne](#10-mode-hors-ligne)
11. [Administration](#11-administration)
12. [FAQ et Dépannage](#12-faq-et-dépannage)

---

## 1. PREMIERS PAS

### 1.1 Accès au Système

**URL de connexion:** `https://clinical-storage.votreorganisation.com`

**Navigateurs supportés:**
- Google Chrome 100+ (recommandé)
- Mozilla Firefox 95+
- Microsoft Edge 100+
- Safari 15+

**Appareils mobiles:**
- iOS 14+ (Safari)
- Android 10+ (Chrome)

---

### 1.2 Prérequis

✅ Compte utilisateur créé par votre administrateur  
✅ Accès réseau ou Wi-Fi  
✅ Navigateur web à jour  
✅ (Optionnel) Application mobile installée pour mode hors ligne  

---

### 1.3 Obtenir Vos Identifiants

Lors de la création de votre compte, vous recevrez un email contenant:
- Votre nom d'utilisateur
- Un lien pour définir votre mot de passe
- Les sites auxquels vous avez accès

**📧 Email de bienvenue exemple:**

```
Objet: Bienvenue sur Clinical Storage System

Bonjour Jean Archiviste,

Votre compte a été créé avec succès.

Nom d'utilisateur: jean.archiviste
Rôle: Archiviste
Sites: CHU Paris, CHU Lyon

Veuillez cliquer sur le lien ci-dessous pour définir votre mot de passe:
https://clinical-storage.org/set-password?token=abc123...

Ce lien expire dans 24 heures.

Cordialement,
L'équipe Clinical Storage
```

---

## 2. CONNEXION ET AUTHENTIFICATION

### 2.1 Première Connexion

**Étape 1: Définir votre mot de passe**

1. Cliquez sur le lien reçu par email
2. Entrez un mot de passe sécurisé:
   - Minimum 12 caractères
   - Au moins 1 majuscule
   - Au moins 1 chiffre
   - Au moins 1 caractère spécial (@, #, $, etc.)
3. Confirmez le mot de passe
4. Cliquez sur "Définir le mot de passe"

✅ **Exemple de mot de passe fort:** `MonP@ssw0rd2026!`  
❌ **Exemple de mot de passe faible:** `password123`

**Étape 2: Connexion**

1. Allez sur la page de connexion
2. Entrez votre nom d'utilisateur
3. Entrez votre mot de passe
4. Cochez "Se souvenir de moi" si appareil personnel
5. Cliquez sur "Se connecter"

---

### 2.2 Authentification Multi-Facteurs (MFA)

Si MFA est activé sur votre compte:

1. Après avoir entré votre mot de passe, un code à 6 chiffres vous sera demandé
2. Ouvrez votre application d'authentification (Google Authenticator, Authy, etc.)
3. Entrez le code affiché
4. Cliquez sur "Vérifier"

**⏰ Note:** Le code change toutes les 30 secondes.

---

### 2.3 Mot de Passe Oublié

1. Cliquez sur "Mot de passe oublié ?" sur la page de connexion
2. Entrez votre adresse email
3. Cliquez sur "Envoyer"
4. Vérifiez votre email pour le lien de réinitialisation
5. Suivez les instructions pour créer un nouveau mot de passe

⚠️ **Le lien de réinitialisation expire après 1 heure.**

---

### 2.4 Déconnexion

Pour vous déconnecter en toute sécurité:

1. Cliquez sur votre nom en haut à droite
2. Sélectionnez "Déconnexion"

💡 **Conseil:** Déconnectez-vous toujours après utilisation sur un ordinateur partagé.

---

## 3. TABLEAU DE BORD

### 3.1 Vue d'Ensemble

Le tableau de bord est votre page d'accueil. Il affiche:

📊 **Statistiques Clés:**
- Nombre total de documents
- Nombre d'équipements
- Nombre de consommables
- Demandes d'accès en attente
- Items en retard
- Taux d'occupation du stockage

📈 **Graphiques:**
- Activité récente (30 derniers jours)
- État du stockage par site
- Évolution des mouvements

🔔 **Notifications:**
- Nouvelles demandes d'accès
- Retours en retard
- Alertes système

---

### 3.2 Navigation

**Menu Principal (barre latérale):**

```
📊 Tableau de bord      - Vue d'ensemble
🔬 Études               - Liste des études cliniques
🏢 Sites                - Sites de l'étude
📦 Stockage             - Localisations et conteneurs
📄 Documents            - Gestion documents
🔬 Équipements          - Gestion équipements
🧪 Consommables         - Gestion consommables
📋 Demandes d'Accès     - Workflow d'accès
🏷️ RFID                 - Gestion tags RFID
📊 Rapports             - Génération rapports
⚙️ Administration       - Paramètres (admin uniquement)
```

**Barre Supérieure:**

```
[☰ Menu]  [🔍 Recherche]  [🔔 Notifications]  [👤 Profil ▼]
```

---

### 3.3 Recherche Globale

La barre de recherche en haut vous permet de chercher dans tout le système:

1. Cliquez sur l'icône 🔍
2. Tapez votre recherche (code sujet, numéro document, etc.)
3. Appuyez sur Entrée
4. Les résultats s'affichent par catégorie:
   - Documents
   - Équipements
   - Consommables
   - Demandes d'accès

**💡 Astuces de recherche:**
- `SUBJ-001` → Trouve tous les documents du sujet 001
- `CONSENT` → Trouve tous les consentements
- `AR-2026-` → Trouve les demandes d'accès de 2026

---

### 3.4 Centre de Notifications

Pour accéder à vos notifications:

1. Cliquez sur l'icône 🔔 (le chiffre indique les non lues)
2. Une liste déroulante s'affiche avec:
   - 🔴 **Urgent:** Demandes urgentes, retards
   - 🟠 **Important:** Alertes capacité, calibrations
   - 🔵 **Info:** Confirmations, mises à jour

3. Cliquez sur une notification pour accéder à l'élément concerné
4. Marquez comme lu en cliquant sur ✓
5. Ou "Tout marquer comme lu" pour tout effacer

---

## 4. GESTION DES DOCUMENTS

### 4.1 Vue Liste Documents

**Accéder à la liste:**

1. Menu → 📄 Documents
2. Vous verrez un tableau avec tous vos documents

**Colonnes affichées:**
- Type (CONSENT, CRF, SOURCE_DOC, etc.)
- Sujet ID
- Description
- Site
- Statut (🟢 IN, 🔴 OUT, 🟡 ARCHIVED)
- Tag RFID (si présent)
- Actions

---

### 4.2 Rechercher et Filtrer

**Recherche Texte:**

1. Dans le champ "🔍 Rechercher...", tapez:
   - ID sujet: `SUBJ-015`
   - Code document: `CONSENT-001`
   - Mots-clés dans description

2. Les résultats s'affichent en temps réel

**Filtres:**

1. **Par Type:** Sélectionnez dans le menu déroulant
   - CONSENT (Consentement éclairé)
   - CRF (Case Report Form)
   - SOURCE_DOC (Document source)
   - Autre...

2. **Par Site:** Choisissez le site
   - CHU Paris
   - CHU Lyon
   - etc.

3. **Par Statut:**
   - 🟢 IN STORAGE (En stockage)
   - 🔴 OUT (Sorti)
   - 🟡 ARCHIVED (Archivé)

4. Cliquez sur "Appliquer les filtres"

**💡 Combiner les filtres:**
```
Type: CONSENT + Site: Paris + Statut: IN STORAGE
→ Affiche tous les consentements en stockage à Paris
```

---

### 4.3 Enregistrer un Nouveau Document

**Profils autorisés:** Archiviste, ARC, Data Clerk

**Étapes:**

1. Cliquez sur le bouton **[+ Nouveau]**
2. Remplissez le formulaire:

**Section 1: Informations Générales**

| Champ              | Description                          | Requis |
|--------------------|--------------------------------------|--------|
| Étude              | Sélectionnez l'étude clinique        | ✓      |
| Site               | Site de stockage                     | ✓      |
| Type de document   | CONSENT, CRF, SOURCE_DOC, etc.       | ✓      |
| Sujet ID           | Format: SUBJ-XXX                     | ✓      |
| Visite             | V1, V2, V3, etc.                     |        |
| Formulaire         | Nom du formulaire                    |        |
| Description        | Description détaillée                |        |

**Section 2: Caractéristiques Document**

| Champ                  | Description                      | Requis |
|------------------------|----------------------------------|--------|
| Nombre de pages        | Nombre total de pages            |        |
| Version                | Version du formulaire            |        |
| Date de signature      | Si formulaire signé              |        |
| Signature requise      | ☑ Oui / ☐ Non                    |        |
| Niveau confidentialité | HIGH, MEDIUM, LOW                | ✓      |

**Section 3: Stockage Physique**

| Champ                  | Description                      | Requis |
|------------------------|----------------------------------|--------|
| Localisation           | Archive Room 1, etc.             | ✓      |
| Conteneur              | Cabinet A1, Shelf B2, etc.       | ✓      |
| Date de stockage       | Date d'enregistrement            | ✓      |
| Rétention jusqu'au     | Date de fin de rétention         |        |
| Notes localisation     | Position détaillée               |        |

**Section 4: Tag RFID (optionnel)**

Si vous avez un tag RFID:
1. Cliquez sur **[📡 Scanner tag RFID]**
2. Placez le tag sur le lecteur
3. Le système affiche: "✓ Tag scanné: E2801170..."
4. Le tag est automatiquement associé

3. Vérifiez toutes les informations
4. Cliquez sur **[💾 Enregistrer]**

✅ **Succès:** "Document créé avec succès"

---

### 4.4 Voir les Détails d'un Document

1. Dans la liste, trouvez le document
2. Cliquez sur le bouton **[👁️ Voir]** ou cliquez directement sur la ligne
3. Une fenêtre modale s'ouvre avec 4 onglets:

**Onglet "Informations":**
- Type, statut, confidentialité
- Localisation physique complète
- Tag RFID et dernière lecture
- Détails du formulaire
- Dates importantes

**Onglet "Historique":**
- Tous les mouvements (entrées, sorties, retours)
- Date, utilisateur, raison
- Historique de modifications

**Onglet "Demandes d'accès":**
- Liste de toutes les demandes liées
- Statut de chaque demande
- Dates et demandeurs

**Onglet "RFID":**
- Informations du tag
- Historique de lectures
- Statistiques

4. Cliquez sur **[Fermer]** ou **[✕]** pour sortir

---

### 4.5 Modifier un Document

**Profils autorisés:** Archiviste, ARC

**Ce qui peut être modifié:**
- Conteneur/Localisation
- État physique (GOOD, FAIR, DAMAGED)
- Notes de localisation
- Certaines métadonnées

**Ce qui NE peut PAS être modifié:**
- Type de document
- Sujet ID
- Étude/Site
- Tag RFID associé

**Procédure:**

1. Ouvrez les détails du document
2. Cliquez sur **[✏️ Modifier]**
3. Modifiez les champs autorisés
4. Cliquez sur **[💾 Sauvegarder]**

⚠️ **Note:** Toute modification est enregistrée dans l'audit trail.

---

### 4.6 Demander l'Accès à un Document

Si vous n'êtes pas archiviste et souhaitez consulter un document physique:

1. Trouvez le document dans la liste
2. Cliquez sur **[📋 Demander accès]**
3. Remplissez le formulaire:
   - **Type:** Consultation, Copie, Emprunt
   - **Motif:** Pourquoi vous avez besoin du document
   - **Urgence:** NORMAL, HIGH, CRITICAL
   - **Requis pour le:** Date limite

4. Cliquez sur **[Soumettre]**

✅ L'archiviste recevra une notification et pourra approuver/rejeter votre demande.

➡️ Voir section [7. Demandes d'Accès](#7-demandes-daccès) pour plus de détails.

---

## 5. GESTION DES ÉQUIPEMENTS

### 5.1 Types d'Équipements

Le système gère différents types d'équipements:

- **ANALYZER** - Analyseurs
- **CENTRIFUGE** - Centrifugeuses
- **REFRIGERATOR** - Réfrigérateurs
- **FREEZER** - Congélateurs
- **INCUBATOR** - Incubateurs
- **MICROSCOPE** - Microscopes
- **BALANCE** - Balances
- **SPECTROPHOTOMETER** - Spectrophotomètres
- **AUTRE** - Autre équipement

---

### 5.2 Enregistrer un Nouvel Équipement

**Profils autorisés:** Archiviste, ARC, Data Clerk

1. Menu → 🔬 Équipements
2. Cliquez sur **[+ Nouveau]**
3. Remplissez le formulaire:

**Informations Générales:**
- Étude
- Site
- Type d'équipement
- Code interne (optionnel)
- Description

**Détails Équipement:**
- Fabricant
- Modèle
- Numéro de série
- Date d'achat
- Coût d'achat

**Calibration & Maintenance:**
- ☑ Calibration requise ?
- Dernière calibration
- Prochaine calibration
- Planning de maintenance
- Dernière maintenance

**Stockage:**
- Localisation
- Conteneur
- Date de stockage
- Statut opérationnel:
  - OPERATIONAL (Opérationnel)
  - MAINTENANCE (En maintenance)
  - DEFECTIVE (Défectueux)
  - RETIRED (Retiré du service)

4. Scanner tag RFID si disponible
5. Cliquez sur **[💾 Enregistrer]**

---

### 5.3 Alertes Calibration

Le système génère automatiquement des alertes pour:

⚠️ **Calibration due dans 30 jours:** Notification normale  
🔴 **Calibration dépassée:** Alerte urgente

**Consulter les équipements nécessitant calibration:**

1. Menu → 🔬 Équipements
2. Filtre "Statut" → "Calibration due"
3. Liste des équipements à calibrer

**Enregistrer une calibration:**

1. Ouvrez les détails de l'équipement
2. Cliquez sur **[✏️ Modifier]**
3. Mettez à jour:
   - Dernière calibration: [Date d'aujourd'hui]
   - Prochaine calibration: [Date + intervalle]
4. Cliquez sur **[💾 Sauvegarder]**

✅ L'alerte disparaît automatiquement.

---

## 6. GESTION DES CONSOMMABLES

### 6.1 Types de Consommables

- **REAGENT** - Réactifs
- **TUBE** - Tubes
- **SYRINGE** - Seringues
- **PIPETTE** - Pipettes
- **GLOVE** - Gants
- **MASK** - Masques
- **PLATE** - Plaques
- **AUTRE** - Autre consommable

---

### 6.2 Enregistrer des Consommables

**Profils autorisés:** Archiviste, ARC, Data Clerk

1. Menu → 🧪 Consommables
2. Cliquez sur **[+ Nouveau]**
3. Remplissez:

**Informations Produit:**
- Type de consommable
- Fabricant
- Numéro catalogue
- Numéro de lot
- Date d'expiration
- Conditions de stockage (ex: 2-8°C)

**Quantité:**
- Quantité
- Unité (VIAL, BOX, PIECE, etc.)

**Sécurité:**
- ☑ Produit dangereux ?
- Classification danger (H315, H319, etc.)

**Stockage:**
- Localisation
- Conteneur
- Date de stockage

4. Cliquez sur **[💾 Enregistrer]**

---

### 6.3 Gestion des Stocks

**Niveaux de Stock:**

Le système peut gérer:
- **Niveau minimum:** Quantité en dessous de laquelle une alerte est générée
- **Point de recommande:** Seuil pour déclencher une nouvelle commande

**Configuration:**

1. Ouvrez les détails du consommable
2. **[✏️ Modifier]**
3. Renseignez:
   - Niveau minimum: 10
   - Point de recommande: 20
4. **[💾 Sauvegarder]**

🔔 **Le système alertera automatiquement quand le stock est bas.**

---

### 6.4 Alertes Expiration

⚠️ **Produits expirant dans 30 jours:** Notification  
🔴 **Produits expirés:** Alerte critique

**Consulter les produits proches expiration:**

1. Menu → 🧪 Consommables
2. Filtre → "Expiration proche"
3. Liste des produits à vérifier

---

## 7. DEMANDES D'ACCÈS

### 7.1 Comprendre le Workflow

```
1. DEMANDE CRÉÉE
   ↓ (Moniteur/ARC crée demande)
   
2. EN ATTENTE APPROBATION
   ↓ (Archiviste reçoit notification)
   
3a. APPROUVÉE                  3b. REJETÉE
    ↓                               ↓
4. ACCÈS ACCORDÉ               DEMANDE CLÔTURÉE
   ↓ (Archiviste sort l'item)
   
5. ITEM SORTI
   ↓ (En consultation)
   
6. ITEM RETOURNÉ
   ↓ (Archiviste enregistre retour)
   
7. DEMANDE CLÔTURÉE
```

---

### 7.2 Créer une Demande (Moniteur/ARC)

1. Menu → 📋 Demandes d'Accès
2. Cliquez sur **[+ Nouvelle]**
3. Recherchez l'item (document/équipement):
   - Tapez le code ou sujet
   - Sélectionnez dans les résultats

4. Remplissez:
   - **Type de demande:**
     - CONSULTATION (Consulter sur place)
     - COPY (Faire une copie)
     - LOAN (Emprunter)
   
   - **Motif:** Expliquez pourquoi
     - Ex: "Monitoring visit - verification source documents"
   
   - **Urgence:**
     - 🔵 LOW (Basse)
     - 🟡 NORMAL (Normale)
     - 🟠 HIGH (Haute)
     - 🔴 CRITICAL (Critique)
   
   - **Requis pour le:** Date limite

5. Cliquez sur **[Soumettre]**

✅ **Confirmation:** "Demande AR-2026-XXXX créée. L'archiviste a été notifié."

---

### 7.3 Approuver/Rejeter une Demande (Archiviste)

**Recevoir une notification:**

🔔 Vous recevrez une notification quand une demande est créée.

**Traiter la demande:**

1. Menu → 📋 Demandes d'Accès
2. Onglet **[En attente]** → Liste des demandes
3. Cliquez sur une demande pour voir détails
4. Deux options:

**Option A: Approuver**

1. Cliquez sur **[✓ Approuver]**
2. Remplissez:
   - **Durée approuvée:** 7 jours (par défaut)
   - **Notes:** Commentaires éventuels
   - ☑ Envoyer email au demandeur
   - ☑ Rappel automatique avant échéance

3. Cliquez sur **[✓ Approuver]**

✅ **Le demandeur reçoit un email de confirmation.**

**Option B: Rejeter**

1. Cliquez sur **[❌ Rejeter]**
2. Indiquez la raison:
   - Ex: "Document actuellement utilisé par un autre moniteur. Disponible après le 15 février."

3. Cliquez sur **[❌ Rejeter]**

✅ **Le demandeur reçoit un email avec la raison.**

---

### 7.4 Marquer comme Sorti (Archiviste)

Quand vous remettez physiquement l'item au demandeur:

1. Ouvrez la demande approuvée
2. Cliquez sur **[📤 Marquer comme sorti]**
3. Confirmez:
   - Date/heure de sortie (pré-remplie)
   - Notes (optionnel)

4. Cliquez sur **[Confirmer]**

✅ **L'item passe en statut OUT dans le système.**

---

### 7.5 Enregistrer un Retour (Archiviste)

Quand l'item vous est retourné:

1. Trouvez la demande (Onglet "En cours")
2. Cliquez sur **[📥 Enregistrer retour]**
3. Confirmez:
   - Date/heure de retour (pré-remplie)
   - État physique de l'item
   - Notes (optionnel)

4. Cliquez sur **[Confirmer]**

✅ **L'item repasse en statut IN_STORAGE.**

---

### 7.6 Gérer les Retours en Retard

**Alertes automatiques:**

- **J-2:** Email de rappel au demandeur
- **Jour J:** Email d'alerte
- **J+1 et suivants:** Alertes quotidiennes + notification archiviste

**Procédure:**

1. Menu → 📋 Demandes d'Accès
2. Onglet **[En retard]**
3. Pour chaque demande en retard:

**Actions possibles:**

- **[📧 Relancer]** - Envoyer email de rappel
- **[📞 Contacter]** - Voir coordonnées du demandeur
- **[⚠️ Escalader]** - Notifier le responsable de l'étude

---

### 7.7 Prolonger une Demande

Si le demandeur a besoin de plus de temps:

**Côté Demandeur:**

1. Ouvrez votre demande en cours
2. Cliquez sur **[⏱️ Demander prolongation]**
3. Indiquez:
   - Jours supplémentaires souhaités
   - Raison de la prolongation

4. Cliquez sur **[Soumettre]**

**Côté Archiviste:**

1. Vous recevez une notification
2. Ouvrez la demande
3. **[✓ Approuver prolongation]** ou **[❌ Refuser]**

⚠️ **Note:** 1 seule prolongation autorisée par défaut (max 7 jours).

---

## 8. INTERFACE RFID

### 8.1 Qu'est-ce qu'un Tag RFID ?

Un tag RFID (Radio-Frequency Identification) est une étiquette électronique collée sur chaque document/équipement qui permet:

✅ Lecture sans contact (0-5 mètres)  
✅ Identification unique et sécurisée  
✅ Inventaires rapides (lecture multiple)  
✅ Traçabilité complète  

---

### 8.2 Encoder un Nouveau Tag

**Profil autorisé:** Archiviste

**Matériel nécessaire:**
- Tag RFID vierge
- Lecteur RFID connecté

**Procédure:**

1. Menu → 🏷️ RFID
2. Cliquez sur **[Encoder nouveau tag]**

**Étape 1: Sélection élément**

3. Choisissez le type: Document / Équipement / Consommable
4. Recherchez l'élément à associer
5. Sélectionnez l'élément
6. Cliquez sur **[Suivant →]**

**Étape 2: Scan du tag**

7. Placez le tag RFID vierge sur le lecteur
8. Attendez la détection: "✓ Tag détecté"
9. Le système affiche:
   - EPC: E2801170000001234567890A
   - TID: E28011050000000000000001
   - Type: UHF Gen2

**Étape 3: Encodage**

10. Le système encode automatiquement:
    - Données de l'élément
    - Étude/Site
    - Type
    - Checksum

11. Progression: ▓▓▓▓▓▓▓▓▓▓░░░░░ 75%

**Étape 4: Confirmation**

12. "✓ Encodage réussi"
13. Optionnel: **[📋 Imprimer étiquette]**
14. Collez le tag sur l'élément physique

✅ **Le tag est maintenant associé et fonctionnel.**

---

### 8.3 Lire un Tag

**Usage:** Vérifier l'identité d'un item

1. Menu → 🏷️ RFID
2. Onglet **[Lecture]**
3. Placez l'item avec tag près du lecteur
4. Le système affiche instantanément:
   - Type d'élément
   - Code/Sujet
   - Description
   - Localisation actuelle
   - Statut

---

### 8.4 Inventaire par RFID

**Usage:** Vérifier le contenu d'une localisation

**Profil autorisé:** Archiviste

1. Menu → 🏷️ RFID
2. Onglet **[Inventaire]**
3. Sélectionnez la localisation:
   - Archive Room 1 → Cabinet A1

4. Cliquez sur **[🔍 Démarrer scan]**

**Scan en cours:**

```
📡 Scan en cours...
▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 75%

Tags détectés: 290 / 387 attendus

Derniers tags lus:
✓ E2801170...890A - CONSENT-SUBJ-001
✓ E2801170...890B - CRF-SUBJ-015
✓ E2801170...890C - SOURCE-SUBJ-022
```

5. Le scan prend 30 secondes à 2 minutes selon la taille

**Résultats:**

```
✓ Scan terminé

Tags scannés: 385 / 387 attendus
Taux de lecture: 99.5%

⚠️ Anomalies détectées: 2

├─ Items NON détectés (dans système mais pas scannés):
│  • CONSENT-SUBJ-033 (E2801170...890D)
│  • CRF-SUBJ-045 (E2801170...890E)
│
└─ Items INCONNUS (scannés mais pas dans système):
   • Aucun
```

6. Actions possibles:
   - **[📊 Voir rapport détaillé]** - PDF complet
   - **[🔄 Nouveau scan]** - Relancer
   - **[🔍 Localiser manquants]** - Aide à trouver les 2 items

---

### 8.5 Résolution des Anomalies

**Cas 1: Item non détecté**

Causes possibles:
- Tag endommagé
- Item déplacé ailleurs
- Mauvaise position du lecteur

**Solutions:**
1. Vérifier physiquement l'item dans le conteneur
2. Repositionner et relancer scan
3. Si tag endommagé → Encoder nouveau tag
4. Si item introuvable → Créer incident

**Cas 2: Item inconnu détecté**

Causes:
- Item mal enregistré
- Tag d'une autre localisation
- Erreur d'encodage

**Solutions:**
1. Vérifier le tag avec lecture simple
2. Identifier l'item physique
3. Corriger la localisation dans le système
4. Si erreur d'encodage → Réencoder

---

## 9. RAPPORTS

### 9.1 Types de Rapports Disponibles

| Rapport                | Description                              | Format       |
|------------------------|------------------------------------------|--------------|
| 📦 Inventaire complet  | Liste complète items par site/localisation | PDF, Excel  |
| 🔄 Mouvements          | Historique entrées/sorties               | PDF, Excel, CSV |
| 📋 Demandes d'accès    | Statistiques et détails demandes         | PDF, Excel  |
| 🔍 Audit trail         | Piste d'audit pour entité spécifique     | PDF         |
| 📈 Statistiques        | Vue d'ensemble analytique                | PDF, Excel  |
| 💾 Capacité stockage   | Occupation par localisation              | PDF, Excel  |
| ⚠️ Alertes             | Retards, expirations, calibrations       | PDF, Excel  |

---

### 9.2 Générer un Rapport

1. Menu → 📊 Rapports
2. Cliquez sur **[Générateur]**
3. Sélectionnez le type de rapport

**Configuration:**

**Filtres:**
- Étude (optionnel)
- Site (optionnel)
- Période:
  - Du: 2026-01-01
  - Au: 2026-01-31

**Options rapport mouvements:**
- ☑ Entrées
- ☑ Sorties
- ☑ Retours
- ☑ Transferts

**Format de sortie:**
- ○ PDF (Impression/Archive)
- ● Excel (Analyse)
- ○ CSV (Export données)

**Options additionnelles:**
- ☑ Inclure graphiques
- ☑ Inclure détails complets
- ☐ Grouper par localisation
- ☐ Inclure tags RFID

4. Cliquez sur **[📊 Générer rapport]**

⏳ **Génération en cours... (5-30 secondes)**

✅ **Téléchargement automatique du fichier**

---

### 9.3 Rapports Programmés

**Profil autorisé:** Data Manager, Admin

Automatisez l'envoi de rapports récurrents:

1. Menu → 📊 Rapports
2. Onglet **[Programmés]**
3. Cliquez sur **[+ Nouveau]**

**Configuration:**

- **Nom:** "Rapport mensuel inventaire Paris"
- **Type:** Inventaire complet
- **Filtres:** Site = Paris
- **Fréquence:**
  - ○ Quotidien
  - ○ Hebdomadaire
  - ● Mensuel (1er du mois)
  - ○ Trimestriel
- **Format:** PDF
- **Destinataires:**
  - jean.archiviste@chu-paris.fr
  - marie.arc@chu-paris.fr
- **Actif:** ☑

4. Cliquez sur **[💾 Créer]**

✅ **Le rapport sera généré et envoyé automatiquement.**

---

### 9.4 Historique des Rapports

**Accéder aux rapports générés:**

1. Menu → 📊 Rapports
2. Section **"Rapports récents"** en bas de page

**Affichage:**
```
📊 Mouvements_Janvier_2026.xlsx     Il y a 2h
   Généré par: Jean Archiviste | Taille: 2.3 MB
   [📥 Télécharger] [👁️ Aperçu] [🗑️ Supprimer]

📄 Inventaire_Site_Paris.pdf        Il y a 1j
   Généré par: Marie ARC | Taille: 1.8 MB
   [📥 Télécharger] [👁️ Aperçu] [🗑️ Supprimer]
```

**Actions:**
- **📥 Télécharger** - Re-télécharger le rapport
- **👁️ Aperçu** - Voir dans navigateur
- **🗑️ Supprimer** - Effacer (admin uniquement)

⏰ **Rétention:** Les rapports sont conservés 90 jours.

---

## 10. MODE HORS LIGNE

### 10.1 Qu'est-ce que le Mode Hors Ligne ?

Le mode hors ligne vous permet de continuer à travailler sans connexion internet:

✅ Consulter documents/équipements  
✅ Créer nouveaux éléments  
✅ Modifier localisations  
✅ Enregistrer mouvements  
✅ Synchronisation automatique à la reconnexion  

---

### 10.2 Installation PWA (Application Web Progressive)

**Sur ordinateur (Chrome/Edge):**

1. Ouvrez le site dans Chrome
2. Cliquez sur l'icône ➕ dans la barre d'adresse
3. "Installer Clinical Storage"
4. Cliquez sur **[Installer]**

✅ **L'application est maintenant disponible hors ligne.**

**Sur mobile (iOS/Android):**

**iOS:**
1. Ouvrez Safari
2. Tapez sur l'icône Partage 📤
3. Sélectionnez "Sur l'écran d'accueil"
4. Tapez "Ajouter"

**Android:**
1. Ouvrez Chrome
2. Menu ⋮ → "Ajouter à l'écran d'accueil"
3. Tapez "Ajouter"

---

### 10.3 Travailler Hors Ligne

**Indicateur de connexion:**

En haut de la page:
- 🟢 **En ligne** - Connexion active
- 🔴 **Hors ligne** - Mode déconnecté
- 🟡 **Synchronisation...** - Envoi des modifications

**Fonctionnalités disponibles hors ligne:**

✅ **Disponible:**
- Consultation documents/équipements
- Recherche dans données locales
- Création nouveaux éléments
- Modification localisations
- Scan RFID (si lecteur local)

❌ **Non disponible:**
- Génération rapports (serveur requis)
- Demandes d'accès (workflow nécessite connexion)
- Administration système

---

### 10.4 Synchronisation

**Automatique:**

Dès que la connexion est rétablie:

```
🟡 Synchronisation en cours...
   15 modifications à envoyer
   ▓▓▓▓▓▓▓▓▓░░░░░ 60%
   [Voir détails]
```

**Manuelle:**

1. Cliquez sur l'indicateur 🟡
2. Cliquez sur **[🔄 Synchroniser maintenant]**

---

### 10.5 Gestion des Conflits

**Qu'est-ce qu'un conflit ?**

Un conflit survient quand:
- Vous modifiez un élément hors ligne
- Un autre utilisateur modifie le même élément en ligne
- Les deux modifications sont incompatibles

**Résolution:**

1. Lors de la synchronisation, vous recevez une alerte:

```
🔴 CONFLIT détecté

Document: CRF-SUBJ-022
Modifié par vous ET par Marie ARC

Votre version:
  Localisation: Cabinet A1

Version serveur (Marie ARC):
  Localisation: Cabinet B3

[Conserver ma version]  [Accepter version serveur]
          [Voir différences]
```

2. Options:
   - **Conserver ma version** - Votre modification écrase celle du serveur
   - **Accepter version serveur** - Vous perdez vos modifications
   - **Voir différences** - Comparer en détail

3. Choisissez et confirmez

✅ **Le conflit est résolu et la synchronisation continue.**

---

### 10.6 Centre de Synchronisation

Pour voir l'état de toutes vos modifications:

1. Cliquez sur l'indicateur de connexion
2. **[Voir détails]**

**Onglets:**

**[En attente]** - Modifications pas encore envoyées
```
🟡 EN ATTENTE
Il y a 15 min | Document créé
CONSENT-SUBJ-055 | CHU Paris
Sera synchronisé à la reconnexion
```

**[Synchronisées]** - Modifications confirmées
```
✓ SYNCHRONISÉE
Il y a 1h | Demande approuvée
AR-2026-0042 | Confirmé par serveur
```

**[Conflits]** - Nécessitent votre attention
```
🔴 CONFLIT
Il y a 32 min | Document modifié
CRF-SUBJ-022
[Résoudre]
```

---

## 11. ADMINISTRATION

### 11.1 Gestion des Utilisateurs

**Profil autorisé:** Administrateur système

**Créer un utilisateur:**

1. Menu → ⚙️ Administration → Utilisateurs
2. Cliquez sur **[+ Nouveau]**
3. Remplissez:
   - Nom d'utilisateur
   - Email
   - Prénom / Nom
   - Téléphone
   - Rôle principal
   - Sites assignés
   - ☑ Actif

4. Cliquez sur **[💾 Créer]**

✅ **Un email est envoyé à l'utilisateur pour définir son mot de passe.**

**Modifier un utilisateur:**

1. Recherchez l'utilisateur dans la liste
2. Menu ⋮ → **[✏️ Modifier]**
3. Modifiez les champs
4. **[💾 Sauvegarder]**

**Réinitialiser mot de passe:**

1. Menu ⋮ → **[🔑 Réinitialiser mot de passe]**
2. Confirmez
3. Un email est envoyé à l'utilisateur

**Désactiver un utilisateur:**

1. Menu ⋮ → **[🔒 Désactiver]**
2. Confirmez

⚠️ **L'utilisateur ne pourra plus se connecter mais ses données sont conservées.**

---

### 11.2 Gestion des Rôles

**Rôles prédéfinis:**

| Rôle              | Code          | Permissions Principales                    |
|-------------------|---------------|--------------------------------------------|
| Admin Système     | ADMIN         | Accès complet                              |
| Investigateur     | INVESTIGATOR  | Consultation études dont responsable       |
| ARC               | ARC           | Gestion opérationnelle études              |
| Moniteur          | MONITOR       | Demandes accès, consultation               |
| Archiviste        | ARCHIVIST     | Gestion physique, approbations             |
| Data Manager      | DATA_MANAGER  | Rapports, statistiques                     |
| Data Clerk        | DATA_CLERK    | Saisie données                             |

**Permissions par module:**

```
Documents:
  ✓ Consulter    - Tous les rôles
  ✓ Créer        - ARCHIVIST, ARC, DATA_CLERK
  ✓ Modifier     - ARCHIVIST, ARC
  ✗ Supprimer    - ADMIN uniquement

Demandes d'Accès:
  ✓ Créer        - MONITOR, ARC, INVESTIGATOR
  ✓ Approuver    - ARCHIVIST
  ✗ Supprimer    - Personne (audit trail)

Administration:
  ✓ Tout         - ADMIN uniquement
```

---

### 11.3 Paramètres Système

**Profil autorisé:** Administrateur

1. Menu → ⚙️ Administration → Paramètres

**Onglets disponibles:**

**[Sécurité]**
- Politique mots de passe
- Timeout sessions
- Verrouillage compte
- MFA

**[Notifications]**
- Délai rappel approbation (24h)
- Rappel retour avant échéance (2j)
- Alerte retard (12h après échéance)

**[Workflows]**
- Durée accès par défaut (7j)
- Prolongation max autorisée (7j)
- Clôture auto demandes (30j)

**[RFID]**
- Timeout lecteur (5s)
- Tentatives relecture si échec (3)

**[Stockage]**
- Alerte capacité (90%)
- Rétention par défaut (10 ans)

**[Général]**
- Nom organisation
- Logo
- Fuseau horaire
- Langue par défaut

2. Modifiez les paramètres
3. **[💾 Enregistrer les modifications]**

---

### 11.4 Audit Trail

**Consulter l'audit trail:**

1. Menu → ⚙️ Administration → Audit Trail
2. Filtres:
   - Utilisateur
   - Type d'événement (CREATE, UPDATE, DELETE)
   - Table (documents, users, etc.)
   - Période

3. Cliquez sur **[Rechercher]**

**Informations affichées:**
- Date/Heure exacte
- Utilisateur (nom complet)
- Action effectuée
- Table et enregistrement concerné
- Valeurs avant/après modification
- Adresse IP
- Site

**Exporter l'audit:**

1. Sélectionnez la période
2. **[📥 Exporter]**
3. Format: PDF ou CSV
4. Téléchargement

💡 **Usage:** Conformité réglementaire, investigations, audit externe

---

## 12. FAQ ET DÉPANNAGE

### 12.1 Questions Fréquentes

**Q: J'ai oublié mon mot de passe, que faire ?**

R: Cliquez sur "Mot de passe oublié ?" sur la page de connexion. Un email de réinitialisation vous sera envoyé.

---

**Q: Comment savoir si je suis en mode hors ligne ?**

R: L'indicateur en haut de la page affiche:
- 🟢 En ligne
- 🔴 Hors ligne

---

**Q: Mes modifications hors ligne seront-elles perdues ?**

R: Non, elles sont stockées localement et synchronisées automatiquement à la reconnexion.

---

**Q: Puis-je modifier un document déjà enregistré ?**

R: Oui, si vous êtes archiviste ou ARC. Certains champs (type, sujet ID) ne peuvent pas être modifiés.

---

**Q: Combien de temps puis-je garder un document en consultation ?**

R: La durée est définie lors de l'approbation (généralement 7 jours, prolongeable 1 fois).

---

**Q: Comment savoir si un document est disponible ?**

R: Consultez la fiche du document:
- 🟢 IN STORAGE = Disponible
- 🔴 OUT = Déjà sorti
- 🟡 ARCHIVED = Archivé

---

**Q: Le tag RFID ne se lit pas, que faire ?**

R: 
1. Vérifiez que le lecteur est allumé
2. Rapprochez le tag du lecteur (5cm max)
3. Vérifiez que le tag n'est pas endommagé
4. Si problème persiste, contactez votre archiviste

---

**Q: Comment générer un rapport mensuel automatique ?**

R: Menu → Rapports → Programmés → Créer un nouveau rapport programmé avec fréquence "Mensuel".

---

**Q: Puis-je créer des documents depuis mon téléphone ?**

R: Oui, l'application est responsive et fonctionne sur mobile. Installez la PWA pour une meilleure expérience.

---

**Q: Qui peut voir mes demandes d'accès ?**

R: 
- Les archivistes du site concerné
- Les administrateurs système
- Vous-même (vos propres demandes)

---

### 12.2 Problèmes Courants

**Problème: "Session expirée"**

**Cause:** Inactivité > 30 minutes

**Solution:**
1. Reconnectez-vous
2. Si ordinateur personnel, cochez "Se souvenir de moi"

---

**Problème: "Erreur de synchronisation"**

**Cause:** Conflit ou problème réseau

**Solution:**
1. Vérifiez votre connexion internet
2. Ouvrez le centre de synchronisation
3. Résolvez les conflits affichés
4. Réessayez la synchronisation

---

**Problème: "Capacité stockage pleine"**

**Cause:** Conteneur saturé

**Solution:**
1. Archiviste: Créer nouveau conteneur
2. Ou déplacer items vers autre conteneur
3. Ou archiver documents anciens

---

**Problème: "Document introuvable lors de l'inventaire RFID"**

**Cause:** Tag endommagé ou item déplacé

**Solution:**
1. Vérifier physiquement présence
2. Si présent: Scanner à nouveau ou réencoder
3. Si absent: Créer incident et rechercher

---

**Problème: "Impossible d'approuver une demande"**

**Cause:** Permissions insuffisantes

**Solution:**
- Seuls les archivistes peuvent approuver
- Contactez l'archiviste de votre site

---

**Problème: "Lecteur RFID ne fonctionne pas"**

**Solutions:**
1. Vérifier branchement USB
2. Redémarrer le navigateur
3. Vérifier autorisations matériel
4. Contacter support IT si problème persiste

---

### 12.3 Support Technique

**Besoin d'aide ?**

**📧 Email:** support@clinical-storage.votreorg.com  
**📞 Téléphone:** +33 (0)1 XX XX XX XX  
**💬 Chat:** Disponible en bas à droite de l'écran (9h-18h)

**Heures d'ouverture:**
- Lundi - Vendredi: 9h00 - 18h00
- Support critique 24/7: +33 (0)6 XX XX XX XX

**Avant de contacter le support:**

✓ Notez le message d'erreur exact  
✓ Prenez une capture d'écran  
✓ Notez ce que vous faisiez  
✓ Vérifiez votre connexion internet  

---

### 12.4 Ressources Additionnelles

**📚 Documentation:**
- Guide administrateur (pour admins)
- Guide technique API (pour développeurs)
- Procédures SOPs (conformité GCP/ICH)

**🎥 Tutoriels Vidéo:**
- Enregistrer un document (5 min)
- Workflow demandes d'accès (8 min)
- Inventaire RFID (10 min)
- Mode hors ligne (6 min)

**📝 Notes de Version:**
- Nouvelles fonctionnalités
- Corrections de bugs
- Améliorations

Accès: Menu → Aide → Documentation

---

## GLOSSAIRE

| Terme              | Définition                                                      |
|--------------------|-----------------------------------------------------------------|
| **ARC**            | Attaché de Recherche Clinique                                   |
| **Audit Trail**    | Piste d'audit - Historique complet et immuable des actions      |
| **CRF**            | Case Report Form - Formulaire de recueil de données            |
| **EPC**            | Electronic Product Code - Code unique du tag RFID               |
| **GCP**            | Good Clinical Practice - Bonnes Pratiques Cliniques            |
| **ICH**            | International Council for Harmonisation                         |
| **MFA**            | Multi-Factor Authentication - Authentification multi-facteurs   |
| **PWA**            | Progressive Web App - Application web installable               |
| **RFID**           | Radio-Frequency Identification                                  |
| **RGPD**           | Règlement Général sur la Protection des Données                |
| **SOP**            | Standard Operating Procedure - Procédure opératoire standard   |
| **Tag**            | Étiquette RFID                                                  |
| **TID**            | Tag Identifier - Identifiant unique hardware du tag             |
| **UHF**            | Ultra High Frequency - Fréquence ultra-haute (RFID)             |

---

## INDEX

A
- Accès (Demandes) ........................ 7
- Administration .......................... 11
- Alertes ................................ 3.4, 5.3, 6.3
- Authentification ....................... 2
- Audit Trail ............................ 11.4

C
- Calibration ............................ 5.3
- Conflits (Synchronisation) ............. 10.5
- Consommables ........................... 6

D
- Dashboard .............................. 3
- Demandes d'Accès ....................... 7
- Documents .............................. 4

E
- Équipements ............................ 5
- Expiration ............................. 6.3

F
- Filtres ................................ 4.2, 9.2

I
- Inventaire RFID ........................ 8.4

M
- Mode Hors Ligne ........................ 10
- Mot de passe ........................... 2.1, 2.3

N
- Notifications .......................... 3.4, 9.1

P
- Paramètres ............................. 11.3
- PWA .................................... 10.2

R
- Rapports ............................... 9
- Recherche .............................. 3.3, 4.2
- RFID ................................... 8
- Rôles .................................. 11.2

S
- Support ................................ 12.3
- Synchronisation ........................ 10.4

U
- Utilisateurs ........................... 11.1

---

**Document créé le:** 2026-02-03  
**Version:** 1.0  
**Auteur:** Équipe Clinical Storage System  
**Contact:** support@clinical-storage.votreorganisation.com

---

**© 2026 Votre Organisation - Tous droits réservés**

*Ce guide est confidentiel et destiné uniquement aux utilisateurs autorisés du système Clinical Storage.*
