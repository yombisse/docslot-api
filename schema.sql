-- =========================================
-- Base de données
-- =========================================
CREATE DATABASE IF NOT EXISTS docslot_db;
USE docslot_db;

-- TABLE users

CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50),
    prenom VARCHAR(50),
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) UNIQUE,
    profile_url VARCHAR(255) DEFAULT NULL,
    role ENUM('patient','medecin','administrateur') DEFAULT 'patient' NOT NULL,
    deleted_at DATETIME DEFAULT NULL
);

-- TABLE medecins
CREATE TABLE medecins (
    id_medecin INT AUTO_INCREMENT PRIMARY KEY,
    specialite VARCHAR(50),
    id_user INT NOT NULL UNIQUE,
    duree_creneau INT NOT NULL DEFAULT 30, 
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);


-- TABLE patients
CREATE TABLE patients (
    id_patient INT AUTO_INCREMENT PRIMARY KEY,
    date_naissance DATE,
    adresse VARCHAR(100),
    sexe ENUM('Masculin','Feminin'),
    id_user INT NOT NULL UNIQUE,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- TABLE disponibilites (créneaux médecins)

CREATE TABLE disponibilites (
    id_disponibilite INT AUTO_INCREMENT PRIMARY KEY,
    id_medecin INT NOT NULL,
    date_disponibilite DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    statut ENUM('active','inactive') DEFAULT 'active' NOT NULL,
    FOREIGN KEY (id_medecin) REFERENCES medecins(id_medecin) ON DELETE CASCADE
);

CREATE TABLE creneaux (
    id_creneau INT AUTO_INCREMENT PRIMARY KEY,
    id_disponibilite INT NOT NULL,
    date_creneau DATE NOT NULL,
    heure_creneau TIME NOT NULL,
    statut ENUM('libre','reserve','bloque') DEFAULT 'libre',
    FOREIGN KEY (id_disponibilite) REFERENCES disponibilites(id_disponibilite) ON DELETE CASCADE,
    UNIQUE (id_disponibilite, heure_creneau)
);
-- TABLE rendezvous (RDV)
CREATE TABLE rendezvous (
    id_rdv INT AUTO_INCREMENT PRIMARY KEY,
    id_patient INT NOT NULL,
    id_creneau INT NOT NULL,
    statut ENUM('en_attente','confirme','annule') DEFAULT 'en_attente',
    FOREIGN KEY (id_patient) REFERENCES patients(id_patient) ON DELETE CASCADE,
    FOREIGN KEY (id_creneau) REFERENCES creneaux(id_creneau) ON DELETE CASCADE,
    UNIQUE (id_creneau)
);
CREATE TABLE notifications (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL, -- destinataire (patient ou médecin)
    type VARCHAR(255),
    message VARCHAR(255) NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);


