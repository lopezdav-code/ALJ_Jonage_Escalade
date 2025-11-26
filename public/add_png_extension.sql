-- Ajouter l'extension .png aux images des exercices "Jeux enfant"
-- Cela ne touche que les fiches avec theme = 'Jeux enfant' et sheet_type = 'educational_game'

UPDATE pedagogy_sheets 
SET illustration_image = illustration_image || '.png'
WHERE theme = 'Jeux enfant' 
  AND sheet_type = 'educational_game'
  AND illustration_image NOT LIKE '%.png';
