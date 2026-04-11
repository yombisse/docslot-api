
DELIMITER $$

CREATE TRIGGER after_rdv_insert
AFTER INSERT ON rendezvous
FOR EACH ROW
BEGIN

    DECLARE patient_prenom VARCHAR(50);
    DECLARE patient_nom VARCHAR(50);

    DECLARE medecin_prenom VARCHAR(50);
    DECLARE medecin_nom VARCHAR(50);

    -- PATIENT
    SELECT u.prenom, u.nom
    INTO patient_prenom, patient_nom
    FROM patients p
    JOIN users u ON p.id_user = u.id_user
    WHERE p.id_patient = NEW.id_patient;

    -- MEDECIN VIA CRENEAU
    SELECT u.prenom, u.nom
    INTO medecin_prenom, medecin_nom
    FROM creneaux c
    JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
    JOIN medecins m ON d.id_medecin = m.id_medecin
    JOIN users u ON m.id_user = u.id_user
    WHERE c.id_creneau = NEW.id_creneau;

    -- NOTIF PATIENT
    INSERT INTO notifications (user_id, rdv_id, message, type)
    VALUES (
        NEW.id_patient,
        NEW.id_rdv,
        CONCAT(
            patient_prenom, ' ', patient_nom,
            ', votre rendez-vous avec Dr ',
            medecin_prenom, ' ', medecin_nom,
            ' a été enregistré'
        ),
        'NEW_RDV_PATIENT'
    );

    -- NOTIF MEDECIN
    INSERT INTO notifications (user_id, rdv_id, message, type)
    VALUES (
        (SELECT m.id_user
         FROM creneaux c
         JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
         JOIN medecins m ON d.id_medecin = m.id_medecin
         WHERE c.id_creneau = NEW.id_creneau),
        NEW.id_rdv,
        CONCAT(
            'Nouveau RDV : ', patient_prenom, ' ', patient_nom,
            ' vous a contacté'
        ),
        'NEW_RDV_MEDECIN'
    );

END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER after_rdv_update
AFTER UPDATE ON rendezvous
FOR EACH ROW
BEGIN

    DECLARE patient_prenom VARCHAR(50);
    DECLARE patient_nom VARCHAR(50);

    DECLARE medecin_prenom VARCHAR(50);
    DECLARE medecin_nom VARCHAR(50);

    DECLARE rdv_date DATE;
    DECLARE rdv_heure TIME;

    IF NEW.statut <> OLD.statut THEN

        -- ======================
        -- PATIENT
        -- ======================
        SELECT u.prenom, u.nom
        INTO patient_prenom, patient_nom
        FROM patients p
        JOIN users u ON p.id_user = u.id_user
        WHERE p.id_patient = NEW.id_patient;

        -- ======================
        -- MEDECIN VIA CRENEAU
        -- ======================
        SELECT u.prenom, u.nom
        INTO medecin_prenom, medecin_nom
        FROM creneaux c
        JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
        JOIN medecins m ON d.id_medecin = m.id_medecin
        JOIN users u ON m.id_user = u.id_user
        WHERE c.id_creneau = NEW.id_creneau;

        -- ======================
        -- CONFIRMATION
        -- ======================
        IF NEW.statut = 'confirme' THEN

            INSERT INTO notifications (user_id, rdv_id, message, type)
            VALUES (
                NEW.id_patient,
                NEW.id_rdv,
                CONCAT(
                    patient_prenom, ' ', patient_nom,
                    ', votre rendez-vous avec Dr ',
                    medecin_prenom, ' ', medecin_nom,
                    ' a été CONFIRMÉ'
                ),
                'RDV_CONFIRME'
            );

        END IF;

        -- ======================
        -- ANNULATION
        -- ======================
        IF NEW.statut = 'annule' THEN

            -- patient
            INSERT INTO notifications (user_id, rdv_id, message, type)
            VALUES (
                NEW.id_patient,
                NEW.id_rdv,
                CONCAT(
                    patient_prenom, ' ', patient_nom,
                    ', votre rendez-vous avec Dr ',
                    medecin_prenom, ' ', medecin_nom,
                    ' a été ANNULÉ'
                ),
                'RDV_ANNULE'
            );

            -- médecin
            INSERT INTO notifications (user_id, rdv_id, message, type)
            VALUES (
                (SELECT m.id_user
                 FROM creneaux c
                 JOIN disponibilites d ON c.id_disponibilite = d.id_disponibilite
                 JOIN medecins m ON d.id_medecin = m.id_medecin
                 WHERE c.id_creneau = NEW.id_creneau),
                NEW.id_rdv,
                CONCAT(
                    'Le rendez-vous avec ', patient_prenom, ' ', patient_nom,
                    ' a été ANNULÉ'
                ),
                'RDV_ANNULE'
            );

        END IF;

    END IF;

END$$

DELIMITER ;