-- Table pour stocker les inscriptions à une compétition depuis un fichier Excel
-- Cette table permet de gérer les participants, leurs paiements et l'impression des dossards

CREATE TABLE IF NOT EXISTS competition_registrations (
  id SERIAL PRIMARY KEY,

  -- Informations de commande
  reference_commande TEXT,
  date_commande TIMESTAMP WITH TIME ZONE,
  statut_commande TEXT,

  -- Informations participant
  nom_participant TEXT NOT NULL,
  prenom_participant TEXT NOT NULL,
  date_naissance DATE,
  club TEXT,
  numero_licence_ffme TEXT,

  -- Informations payeur
  nom_payeur TEXT,
  prenom_payeur TEXT,
  email_payeur TEXT,
  raison_sociale TEXT,

  -- Informations de paiement
  moyen_paiement TEXT,
  tarif TEXT,
  montant_tarif DECIMAL(10, 2),
  code_promo TEXT,
  montant_code_promo DECIMAL(10, 2),

  -- Informations billet
  billet TEXT,
  numero_billet TEXT,

  -- Gestion des dossards
  deja_imprimee BOOLEAN DEFAULT FALSE,
  numero_dossart INTEGER,

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_competition_registrations_nom_participant ON competition_registrations(nom_participant);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_prenom_participant ON competition_registrations(prenom_participant);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_numero_licence ON competition_registrations(numero_licence_ffme);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_club ON competition_registrations(club);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_numero_dossart ON competition_registrations(numero_dossart);
CREATE INDEX IF NOT EXISTS idx_competition_registrations_reference ON competition_registrations(reference_commande);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_competition_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_competition_registrations_updated_at
  BEFORE UPDATE ON competition_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_registrations_updated_at();

-- Fonction pour assigner automatiquement les numéros de dossards en fonction de l'horaire
-- Logique:
--   - MATIN (U9-U11-U13): numéros 1-500
--   - APRÈS-MIDI (U15-U17-U19): numéros 501-999
--   - BUVETTE: aucun numéro
-- Cette fonction sera appelée lors de l'import des données
CREATE OR REPLACE FUNCTION assign_dossard_numbers()
RETURNS void AS $$
DECLARE
  next_matin INTEGER := 1;        -- Matin: 1-500
  next_apres_midi INTEGER := 501; -- Après-midi: 501-999
  reg RECORD;
BEGIN
  -- Assigner les numéros de dossards pour le MATIN (U9-U11-U13)
  -- Range: 1-500
  FOR reg IN
    SELECT id
    FROM competition_registrations
    WHERE numero_dossart IS NULL
      AND horaire = 'matin'
    ORDER BY created_at, id
  LOOP
    -- Vérifier que nous ne dépassons pas 500
    IF next_matin > 500 THEN
      RAISE EXCEPTION 'Trop de participants pour le matin (max 500). Actuellement: %', next_matin;
    END IF;

    UPDATE competition_registrations
    SET numero_dossart = next_matin
    WHERE id = reg.id;

    next_matin := next_matin + 1;
  END LOOP;

  -- Assigner les numéros de dossards pour l'APRÈS-MIDI (U15-U17-U19)
  -- Range: 501-999
  FOR reg IN
    SELECT id
    FROM competition_registrations
    WHERE numero_dossart IS NULL
      AND horaire = 'après-midi'
    ORDER BY created_at, id
  LOOP
    -- Vérifier que nous ne dépassons pas 999
    IF next_apres_midi > 999 THEN
      RAISE EXCEPTION 'Trop de participants pour l''après-midi (max 999). Actuellement: %', next_apres_midi;
    END IF;

    UPDATE competition_registrations
    SET numero_dossart = next_apres_midi
    WHERE id = reg.id;

    next_apres_midi := next_apres_midi + 1;
  END LOOP;

  -- Les inscriptions Buvette (horaire IS NULL) ne reçoivent pas de numéro de dossard
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur la table
COMMENT ON TABLE competition_registrations IS 'Table pour stocker les inscriptions à une compétition importées depuis Excel';
COMMENT ON COLUMN competition_registrations.numero_dossart IS 'Numéro de dossard assigné automatiquement de manière incrémentale';
COMMENT ON COLUMN competition_registrations.deja_imprimee IS 'Indique si le dossard a déjà été imprimé';
