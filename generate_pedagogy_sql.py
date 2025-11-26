import json
import sys

def escape_sql_string(value):
    """Échappe les caractères spéciaux pour SQL"""
    if value is None:
        return 'NULL'
    # Remplace les apostrophes simples par deux apostrophes
    return "'" + str(value).replace("'", "''") + "'"

def generate_insert_sql(exercises):
    """Génère les requêtes SQL INSERT pour les exercices"""
    sql_statements = []
    
    sql_statements.append("-- Insertion des fiches pédagogiques d'exercices")
    sql_statements.append("-- Table: pedagogy_sheets\n")
    
    for exercise in exercises:
        # Extraction des données du JSON
        num = exercise.get("N° de l'exercice", "")
        titre = exercise.get("Titre", "")
        dispositif = exercise.get("Dispositif", "")
        but = exercise.get("But", "")
        consignes = exercise.get("Consignes", "")
        critere_reussite = exercise.get("Critère de réussite", "")
        variante = exercise.get("Variante", "")
        observation = exercise.get("Observation", "")
        commentaire = exercise.get("Commentaire", "")
        
        # Construction de l'illustration_image avec le sous-dossier et l'extension .png
        illustration_image = f"Jeux enfant\\fichePeda_jeux_{num}.png"
        
        # Construction de la requête INSERT avec ON CONFLICT pour éviter les doublons
        sql = f"""INSERT INTO pedagogy_sheets (
    title,
    type,
    theme,
    starting_situation,
    description,
    game_goal,
    structure,
    evolution,
    remarks,
    success_criteria,
    skill_to_develop,
    illustration_image,
    url,
    sheet_type
) VALUES (
    {escape_sql_string(titre)},
    'image_file',
    'Jeux enfant',
    {escape_sql_string(dispositif)},
    {escape_sql_string(consignes)},
    {escape_sql_string(but)},
    'SAE',
    {escape_sql_string(variante) if variante else 'NULL'},
    {escape_sql_string(commentaire) if commentaire else 'NULL'},
    {escape_sql_string(critere_reussite)},
    {escape_sql_string(observation) if observation else 'NULL'},
    {escape_sql_string(illustration_image)},
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;
"""
        sql_statements.append(sql)
    
    return "\n".join(sql_statements)

def main():
    # Lecture du fichier JSON
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = input("Chemin du fichier JSON d'entrée: ")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            exercises = json.load(f)
        
        # Vérification que c'est bien une liste
        if not isinstance(exercises, list):
            print("Erreur: Le fichier JSON doit contenir une liste d'exercices")
            return
        
        # Génération du SQL
        sql_output = generate_insert_sql(exercises)
        
        # Écriture dans un fichier SQL
        output_file = input_file.replace('.txt', '.sql').replace('.json', '.sql')
        if output_file == input_file:
            output_file = 'pedagogy_inserts.sql'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(sql_output)
        
        print(f"[OK] Fichier SQL genere avec succes: {output_file}")
        print(f"[INFO] Nombre d'exercices traites: {len(exercises)}")
        
    except FileNotFoundError:
        print(f"[ERREUR] Le fichier '{input_file}' n'a pas ete trouve")
    except json.JSONDecodeError as e:
        print(f"[ERREUR] Erreur de parsing JSON: {e}")
    except Exception as e:
        print(f"[ERREUR] {e}")

if __name__ == "__main__":
    main()
