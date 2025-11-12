-- Add groupe_id and groupe information to secure_members view
-- This allows Volunteers page to group by groupe.sous_category instead of member.category

DROP VIEW IF EXISTS secure_members;

CREATE VIEW secure_members AS
SELECT
  m.id,
  m.first_name,
  m.last_name,
  m.title,
  m.sub_group,
  m.category,
  m.sexe,
  m.email,
  m.phone,
  m.licence,
  m.photo_url,
  m.passeport,
  m.emergency_contact_1_id,
  m.emergency_contact_2_id,
  m.brevet_federaux,
  m.groupe_id,
  g.category AS groupe_category,
  g.sous_category AS groupe_sous_category
FROM members m
LEFT JOIN groupe g ON m.groupe_id = g.id;

-- Grant appropriate permissions for authenticated users
GRANT SELECT ON secure_members TO authenticated;
GRANT SELECT ON secure_members TO anon;
