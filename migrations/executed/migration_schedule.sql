-- ============================================
-- Migration du Planning vers la base de données
-- ============================================

-- 1. Création de la table schedule
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- Compétition, Loisir, Perf, Autonomes
  age_category VARCHAR(100) NOT NULL, -- U11-U13-U15, Lycéens, etc.
  day VARCHAR(20) NOT NULL, -- Lundi, Mardi, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_1_id UUID REFERENCES members(id) ON DELETE SET NULL,
  instructor_2_id UUID REFERENCES members(id) ON DELETE SET NULL,
  instructor_3_id UUID REFERENCES members(id) ON DELETE SET NULL,
  instructor_4_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_schedule_day ON schedule(day);
CREATE INDEX IF NOT EXISTS idx_schedule_type ON schedule(type);
CREATE INDEX IF NOT EXISTS idx_schedule_start_time ON schedule(start_time);

-- 3. Fonction pour trouver l'ID d'un membre par son nom
-- Cette fonction est utile pour la migration et pour les futurs scripts
CREATE OR REPLACE FUNCTION find_member_id_by_name(full_name TEXT)
RETURNS UUID AS $$
DECLARE
  member_id UUID;
  first_part TEXT;
  last_part TEXT;
  name_parts TEXT[];
BEGIN
  -- Nettoyer le nom (enlever les espaces multiples)
  full_name := TRIM(regexp_replace(full_name, '\s+', ' ', 'g'));

  -- Séparer le prénom et le nom
  name_parts := string_to_array(full_name, ' ');

  IF array_length(name_parts, 1) >= 2 THEN
    first_part := name_parts[1];
    last_part := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');

    -- Recherche exacte (prénom nom)
    SELECT id INTO member_id
    FROM members
    WHERE LOWER(first_name) = LOWER(first_part)
      AND LOWER(last_name) = LOWER(last_part)
    LIMIT 1;

    IF member_id IS NOT NULL THEN
      RETURN member_id;
    END IF;

    -- Recherche inversée (nom prénom)
    SELECT id INTO member_id
    FROM members
    WHERE LOWER(first_name) = LOWER(last_part)
      AND LOWER(last_name) = LOWER(first_part)
    LIMIT 1;

    IF member_id IS NOT NULL THEN
      RETURN member_id;
    END IF;
  END IF;

  -- Si pas trouvé, rechercher par ressemblance
  SELECT id INTO member_id
  FROM members
  WHERE LOWER(first_name || ' ' || last_name) = LOWER(full_name)
     OR LOWER(last_name || ' ' || first_name) = LOWER(full_name)
  LIMIT 1;

  RETURN member_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Insertion des données du planning
-- Note: Les IDs des encadrants seront NULL si le membre n'existe pas dans la table members
-- Vous devrez les corriger manuellement ou créer les membres manquants

INSERT INTO schedule (type, age_category, day, start_time, end_time, instructor_1_id, instructor_2_id, instructor_3_id, instructor_4_id)
VALUES
  -- Compétition U15(2)-U17-U19
  ('Compétition', 'U15(2)-U17-U19', 'Lundi', '18:00', '20:30',
    find_member_id_by_name('Stephane LORIDANT'), NULL, NULL, NULL),
  ('Compétition', 'U15(2)-U17-U19', 'Mercredi', '18:00', '20:00',
    find_member_id_by_name('Clément de Lima FERREIRA'), NULL, NULL, NULL),
  ('Compétition', 'U15(2)-U17-U19', 'Vendredi', '18:30', '20:30',
    find_member_id_by_name('Stephane LORIDANT'), NULL, NULL, NULL),

  -- Compétition U11-U13-U15(1)
  ('Compétition', 'U11-U13-U15(1)', 'Lundi', '18:00', '20:30',
    find_member_id_by_name('Adrien BERGER'), NULL, NULL, NULL),
  ('Compétition', 'U11-U13-U15(1)', 'Mercredi', '16:00', '18:00',
    find_member_id_by_name('Clément de Lima FERREIRA'), NULL, NULL, NULL),
  ('Compétition', 'U11-U13-U15(1)', 'Vendredi', '18:00', '20:00',
    find_member_id_by_name('Clément de Lima FERREIRA'), NULL, NULL, NULL),

  -- Loisir Enfants 2015-2017 Groupe A
  ('Loisir', 'Enfants 2015-2017 Groupe A', 'Mercredi', '13:00', '14:30',
    find_member_id_by_name('Thibault N'),
    find_member_id_by_name('Antoine GAUTHIER'),
    find_member_id_by_name('Edgar Bénévole'),
    find_member_id_by_name('Rodolphe JULLIEN-MOUTELON')),
  ('Loisir', 'Enfants 2015-2017 Groupe A', 'Mercredi', '10:30', '12:00',
    find_member_id_by_name('Tom Bénévole'), NULL, NULL, NULL),

  -- Loisir Enfants 2015-2017 Groupe B
  ('Loisir', 'Enfants 2015-2017 Groupe B', 'Mercredi', '13:00', '14:30',
    find_member_id_by_name('Thibault N'),
    find_member_id_by_name('Antoine GAUTHIER'),
    find_member_id_by_name('Edgar Bénévole'),
    find_member_id_by_name('Rodolphe JULLIEN-MOUTELON')),

  -- Loisir Enfants 2018-2019
  ('Loisir', 'Enfants 2018-2019', 'Mercredi', '16:00', '17:00',
    find_member_id_by_name('Thibault N'), NULL, NULL, NULL),
  ('Loisir', 'Enfants 2018-2019', 'Vendredi', '17:00', '18:00',
    find_member_id_by_name('Camille DIDIER'),
    find_member_id_by_name('Clément ANTOLINOS'),
    find_member_id_by_name('Rodolphe JULLIEN-MOUTELON'), NULL),

  -- Loisir Collégiens
  ('Loisir', 'Collégiens', 'Lundi', '18:30', '20:00',
    find_member_id_by_name('Jean-Benoit RIOS'),
    find_member_id_by_name('Camille DIDIER'),
    find_member_id_by_name('Romain GOETHALS'),
    find_member_id_by_name('Sabine MACKIEWICZ')),
  ('Loisir', 'Collégiens', 'Mercredi', '14:30', '16:00',
    find_member_id_by_name('Antoine GAUTHIER'),
    find_member_id_by_name('Edgar Bénévole'),
    find_member_id_by_name('Rodolphe JULLIEN-MOUTELON'), NULL),

  -- Loisir Lycéens
  ('Loisir', 'Lycéens', 'Mardi', '18:30', '20:00',
    find_member_id_by_name('David LOPEZ'),
    find_member_id_by_name('Magali FREMY'),
    find_member_id_by_name('Olivier BOSSET'),
    find_member_id_by_name('Clement ANTOLINOS')),

  -- Loisir Adulte débutant
  ('Loisir', 'Adulte débutant', 'Mardi', '20:00', '22:00',
    find_member_id_by_name('Olivier BOSSET'),
    find_member_id_by_name('Magaly HUE'), NULL, NULL),

  -- Perf U13(2)-U15-U17-U19
  ('Perf', 'U13(2)-U15-U17-U19', 'Mercredi', '14:30', '16:00',
    find_member_id_by_name('Thibault N'), NULL, NULL, NULL),

  -- Perf Adultes
  ('Perf', 'Adultes', 'Vendredi', '20:00', '22:00',
    find_member_id_by_name('Clément de Lima FERREIRA'), NULL, NULL, NULL),

  -- Autonomes Adultes
  ('Autonomes', 'Adultes', 'Vendredi', '20:30', '22:00',
    find_member_id_by_name('Clément de Lima FERREIRA'), NULL, NULL, NULL),
  ('Autonomes', 'Adultes', 'Lundi', '20:00', '22:00',
    find_member_id_by_name('Nathalie LEROY'),
    find_member_id_by_name('Richard ROMANET'), NULL, NULL),
  ('Autonomes', 'Adultes', 'Mercredi', '20:00', '22:00',
    find_member_id_by_name('Marine BOURDAUD HUI'),
    find_member_id_by_name('Magaly HUE'),
    find_member_id_by_name('Mathieu BARAUD'), NULL),
  ('Autonomes', 'Adultes', 'Jeudi', '18:00', '22:00',
    find_member_id_by_name('Nathalie LEROY'),
    find_member_id_by_name('Boris CATHERIN'),
    find_member_id_by_name('Fabienne LAGARDE'), NULL),
  ('Autonomes', 'Adultes', 'Samedi', '10:30', '12:30',
    find_member_id_by_name('Pascal PARMENTIER'), NULL, NULL, NULL);

-- 5. Vérification : afficher les créneaux où des encadrants n'ont pas été trouvés
SELECT
  type,
  age_category,
  day,
  start_time,
  CASE
    WHEN instructor_1_id IS NULL THEN 'Encadrant 1 non trouvé'
    WHEN instructor_2_id IS NULL AND instructor_3_id IS NOT NULL THEN 'Encadrant 2 non trouvé'
    WHEN instructor_3_id IS NULL AND instructor_4_id IS NOT NULL THEN 'Encadrant 3 non trouvé'
    ELSE 'OK'
  END as status
FROM schedule
WHERE instructor_1_id IS NULL
   OR (instructor_2_id IS NULL AND instructor_3_id IS NOT NULL)
   OR (instructor_3_id IS NULL AND instructor_4_id IS NOT NULL)
ORDER BY day, start_time;

-- 6. Statistiques
SELECT
  'Total de créneaux' as description,
  COUNT(*) as count
FROM schedule
UNION ALL
SELECT
  'Créneaux avec au moins 1 encadrant',
  COUNT(*)
FROM schedule
WHERE instructor_1_id IS NOT NULL;

-- 7. Activer Row Level Security (RLS) - optionnel mais recommandé
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut lire le planning
CREATE POLICY "Planning visible par tous" ON schedule
  FOR SELECT
  USING (true);

-- Politique : seuls les admins peuvent modifier
CREATE POLICY "Seuls les admins peuvent modifier le planning" ON schedule
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
