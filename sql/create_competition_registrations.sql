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

-- Fonction pour assigner automatiquement les numéros de dossards de manière incrémentale
-- Cette fonction sera appelée lors de l'import des données
CREATE OR REPLACE FUNCTION assign_dossard_numbers()
RETURNS void AS $$
DECLARE
  next_number INTEGER := 1;
  reg RECORD;
BEGIN
  -- Parcourir toutes les inscriptions sans numéro de dossard, triées par date de création
  FOR reg IN
    SELECT id
    FROM competition_registrations
    WHERE numero_dossart IS NULL
    ORDER BY created_at, id
  LOOP
    -- Trouver le prochain numéro de dossard disponible
    WHILE EXISTS (SELECT 1 FROM competition_registrations WHERE numero_dossart = next_number) LOOP
      next_number := next_number + 1;
    END LOOP;

    -- Assigner le numéro
    UPDATE competition_registrations
    SET numero_dossart = next_number
    WHERE id = reg.id;

    next_number := next_number + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur la table
COMMENT ON TABLE competition_registrations IS 'Table pour stocker les inscriptions à une compétition importées depuis Excel';
COMMENT ON COLUMN competition_registrations.numero_dossart IS 'Numéro de dossard assigné automatiquement de manière incrémentale';
COMMENT ON COLUMN competition_registrations.deja_imprimee IS 'Indique si le dossard a déjà été imprimé';
