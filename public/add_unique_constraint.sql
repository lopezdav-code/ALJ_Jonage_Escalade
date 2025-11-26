-- Ajouter une contrainte UNIQUE sur la colonne title de pedagogy_sheets
-- Cela permettra d'utiliser ON CONFLICT (title) DO NOTHING

ALTER TABLE pedagogy_sheets 
ADD CONSTRAINT pedagogy_sheets_title_unique UNIQUE (title);
