DROP TRIGGER IF EXISTS after_rdv_insert;
DROP TRIGGER IF EXISTS after_rdv_update;

DELIMITER $$

CREATE TRIGGER after_rdv_insert
AFTER INSERT ON rendezvous
FOR EACH ROW
BEGIN

    DECLARE patient_prenom VARCHAR(50);
    DECLARE patient_nom VARCHAR(50);
    DECLARE patient_user_id INT;

    DECLARE medecin_prenom VARCHAR(50);
    DECLARE medecin_nom VARCHAR(50);
    DECLARE medecin_user_id INT;

    -- PATIENT + USER ID
    SELECT u.id_user, u.prenom, u.nom
    INTO patient_user_id, patient_prenom, patient_nom
    FROM patients p
    JOIN users u ON p.id_user = u.id_user
    WHERE p.id_patient = NEW.id_patient;

    -- MEDECIN + USER ID
    SELECT u.id_user, u.prenom, u.nom
    INTO medecin_user_id, medecin_prenom, medecin_nom
    FROM creneaux c
    JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
    JOIN medecins m ON d.id_medecin = m.id_medecin
    JOIN users u ON m.id_user = u.id_user
    WHERE c.id_creneau = NEW.id_creneau;

    -- NOTIF PATIENT ✅
    INSERT INTO notifications (id_user, type, message, lu, target_role)
    VALUES (
        patient_user_id,
        'new_rdv',
        CONCAT(patient_prenom, ' ', patient_nom,
            ', votre rendez-vous avec Dr ',
            medecin_prenom, ' ', medecin_nom,
            ' a été enregistré'),
        0,
        'patient'
    );

    -- NOTIF MEDECIN ✅
    INSERT INTO notifications (id_user, type, message, lu, target_role)
    VALUES (
        medecin_user_id,
        'new_rdv',
        CONCAT('Nouveau RDV : ', patient_prenom, ' ', patient_nom,
            ' vous a contacté'),
        0,
        'medecin'
    );

END$$


CREATE TRIGGER after_rdv_update
AFTER UPDATE ON rendezvous
FOR EACH ROW
BEGIN

    DECLARE patient_prenom VARCHAR(50);
    DECLARE patient_nom VARCHAR(50);
    DECLARE patient_user_id INT;

    DECLARE medecin_prenom VARCHAR(50);
    DECLARE medecin_nom VARCHAR(50);
    DECLARE medecin_user_id INT;

    IF NEW.statut <> OLD.statut THEN

        SELECT u.id_user, u.prenom, u.nom
        INTO patient_user_id, patient_prenom, patient_nom
        FROM patients p
        JOIN users u ON p.id_user = u.id_user
        WHERE p.id_patient = NEW.id_patient;

        SELECT u.id_user, u.prenom, u.nom
        INTO medecin_user_id, medecin_prenom, medecin_nom
        FROM creneaux c
        JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
        JOIN medecins m ON d.id_medecin = m.id_medecin
        JOIN users u ON m.id_user = u.id_user
        WHERE c.id_creneau = NEW.id_creneau;

        IF NEW.statut = 'confirme' THEN
            INSERT INTO notifications (id_user, type, message, lu, target_role)
            VALUES (
                patient_user_id,
                'rdv_confirme',
                CONCAT(patient_prenom, ' ', patient_nom,
                    ', votre rendez-vous avec Dr ',
                    medecin_prenom, ' ', medecin_nom,
                    ' a été CONFIRMÉ'),
                0,
                'patient'
            );
        END IF;

        IF NEW.statut = 'annule' THEN

            INSERT INTO notifications (id_user, type, message, lu, target_role)
            VALUES (
                patient_user_id,
                'rdv_annule',
                CONCAT(patient_prenom, ' ', patient_nom,
                    ', votre rendez-vous avec Dr ',
                    medecin_prenom, ' ', medecin_nom,
                    ' a été ANNULÉ'),
                0,
                'patient'
            );

            INSERT INTO notifications (id_user, type, message, lu, target_role)
            VALUES (
                medecin_user_id,
                'rdv_annule',
                CONCAT('Le rendez-vous avec ', patient_prenom, ' ', patient_nom,
                    ' a été ANNULÉ'),
                0,
                'medecin'
            );

        END IF;

    END IF;

END$$

DELIMITER ;