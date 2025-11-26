-- Insertion des fiches pédagogiques d'exercices
-- Table: pedagogy_sheets

INSERT INTO pedagogy_sheets (
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
    'L''ADDITION',
    'image_file',
    'Jeux enfant',
    '- 1 prise de départ repérée ainsi qu''une prise d''arrivée
- par équipes de 3 à 4 joueurs
- escalade en traversée.',
    '- les enfants passent chacun à leur tour
- le grimpeur reproduit la traversée et ajoute un mouvement (utilisation de 2 nouvelles prises pour les mains).',
    'Reproduire le mouvement réalisé précédemment, ajouter un mouvement supplémentaire, pour construire la plus longue traversée possible.',
    'SAE',
    '- coder le déplacement (dessin ou numérotation des prises)
- défi: ajouter un mouvement difficile, pour mettre ses partenaires en difficulté.',
    NULL,
    'Atteindre la prise d''arrivée.',
    '- très bon exercice de mémorisation et d''observation.',
    'Jeux enfant\fichePeda_jeux_1.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'L''ASCENSEUR',
    'image_file',
    'Jeux enfant',
    '- matérialiser une ligne horizontale au-dessus de laquelle l''enfant n''a pas le droit de tenir des prises, mais qu''il pourra dépasser de la main pour aller poser un objet
- placer sur le mur, à bout de bras de l''enfant placé en-dessous de cette ligne, un point d''ancrage
- placer au sol des réserves d''anneaux, de bracelets..., d''objets à ramasser.',
    '- se placer sur le mur
- ramasser un objet au sol sans mettre les pieds à terre (descendre très bas sur ses appuis) et l''accrocher ensuite sur le mur au point imposé sans prendre de prise au-dessus de la ligne.',
    'Ramasser le plus possible d''objets placés au pied du mur et les accrocher sur le mur aux points d''ancrage.',
    'SAE',
    'On peut renouveler l''opération en traversant vers un autre point de ramassage tant qu''on ne met pas le pied à terre.',
    NULL,
    'Avoir ramassé et accroché plus d''objets que les autres grimpeurs sans avoir posé le pied à terre ni dépassé la ligne de blocage pour les mains.',
    NULL,
    'Jeux enfant\fichePeda_jeux_2.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'L''AVEUGLE',
    'image_file',
    'Jeux enfant',
    '- un foulard point d''arrivée, un foulard pour bander les yeux
- par groupe de 2
- un enfant a les yeux bandés
- l''autre en retrait du mur (pas en parade).',
    '- 2 possibilités :
. l''enfant réalise la voie les yeux ouverts, puis essaie de la répéter les yeux bandés
. l''enfant grimpe les yeux bandés, sans avoir auparavant essayé la voie.',
    'Réaliser une voie les yeux bandés.',
    'SAE',
    '- défi à 2, un élève accroche un foulard sur le mur, son partenaire essaie d''aller le décrocher, les yeux bandés, en ayant repéré sa position
- l''élève au sol peut guider oralement son camarade
- l''enfant peut également prendre des informations pendant le passage des autres grimpeurs (travail de mémorisation).',
    NULL,
    'Toucher le foulard.',
    NULL,
    'Jeux enfant\fichePeda_jeux_3.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'L''ARTISTE',
    'image_file',
    'Jeux enfant',
    '- une feuille collée au mur
- un feutre accroché près de la feuille
- un modèle de dessin au pied de chaque voie
- équipes de 5 joueurs.',
    '- grimper à tour de rôle
- ne dessiner qu''un seul élément à chaque passage (le nez, la bouche...).',
    'Reproduire le modèle, chaque joueur dessinant un élément du modèle (une tête, un personnage, une maison...).',
    'SAE',
    'Jeu par équipe en compétition (relais), la première équipe ayant réalisé le dessin a gagné.',
    NULL,
    'Reproduire tous les éléments du modèle.',
    NULL,
    'Jeux enfant\fichePeda_jeux_4.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE BERET',
    'image_file',
    'Jeux enfant',
    '- un foulard ou un objet est accroché sur le mur à 2,50m, 3m de haut
- les enfants sont répartis en 2 équipes équilibrées et sont numérotés de part et d''autre du foulard en bas du mur
- plusieurs jeux peuvent se faire sur un même mur, en parallèle.',
    '- le numéro appelé par le meneur de jeu doit grimper jusqu''au foulard et le toucher avant son adversaire
- l''équipe marque un point si son grimpeur touche le foulard en premier.',
    'Atteindre le foulard ou l''objet avant son adversaire.',
    'SAE',
    NULL,
    NULL,
    'Totaliser plus de points que l''équipe adverse dans le temps donné (ou nombre d''appels donné).',
    NULL,
    'Jeux enfant\fichePeda_jeux_5.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LES CERCLES (dedans dehors)',
    'image_file',
    'Jeux enfant',
    'Cercles dessinés à la craie sur le mur, ou cerceaux accrochés (veiller à englober 4 ou 5 prises à l''intérieur de chaque cercle).',
    '- grimpeur: utiliser les prises à l''intérieur du cercle pour s''y maintenir recroquevillé
- observateur: observe si la règle est respectée, si aucune partie du corps ne sort du cercle.',
    'Être regroupé à l''intérieur du cercle.',
    'SAE',
    '- utiliser les prises à l''extérieur du cercle (les plus proches) pour cacher le cercle avec son corps
- changer de cercle au signal (par équipe)
- un meneur de jeu alterne la consigne (dedans - dehors).',
    NULL,
    'N''avoir plus aucune partie du corps à l''extérieur du cercle.',
    NULL,
    'Jeux enfant\fichePeda_jeux_6.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA CHAINE',
    'image_file',
    'Jeux enfant',
    '- équipes de 4 à 5 grimpeurs
- un objet à se faire passer (descendeur, balle de tennis...)
- une ou plusieurs équipes sur le mur selon la largeur, les pieds à un mètre du sol, chaque grimpeur espacé d''un mètre.',
    '- au signal, les grimpeurs d''une équipe se posent en équilibre sur le mur à l''emplacement indiqué
- dès que l''enseignant ou un enfant donne l''objet au premier grimpeur, celui-ci le fait passer à ses partenaires
- on a le droit de se déplacer sur le mur
- lorsque le dernier grimpeur reçoit l''objet, la chaîne est terminée et réussie.',
    'Faire passer l''objet du grimpeur n°1 au grimpeur n°5 sans le faire tomber.',
    'SAE',
    '- chronométrer le temps de la chaîne pour départager les équipes
- réaliser le plus grand nombre de chaînes aller et retour à la suite.',
    NULL,
    'Avoir réussi toute la chaîne sans faire tomber l''objet.',
    NULL,
    'Jeux enfant\fichePeda_jeux_7.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'CHAT PERCHE',
    'image_file',
    'Jeux enfant',
    '- le camp des souris: le mur d''escalade
- des balises posées à quelques mètres du mur, sur une ligne parallèle à ce dernier
- position de départ: un chat au sol et des souris accrochées au mur.',
    '- le chat n''a pas le droit d''attraper les souris lorsqu''elles sont sur le mur
- chaque souris qui touche une balise marque un point
- lorsque le chat touche une souris, celle-ci perd ses points et devient chat.',
    '- le chat: attraper une souris
- les souris: toucher l''une des balises pour marquer un point, retourner sur le mur, puis aller toucher une autre balise.',
    'SAE',
    NULL,
    NULL,
    'La première souris ayant atteint le capital points défini (5 points, 10 points...) a gagné.',
    NULL,
    'Jeux enfant\fichePeda_jeux_8.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE CHEF D''ORCHESTRE',
    'image_file',
    'Jeux enfant',
    '- une prise ou ligne d''arrivée matérialisée
- par 2, un grimpeur, un chef d''orchestre
- les 2 joueurs sont partenaires.',
    '- le grimpeur ne se déplace qu''en respectant les directives du chef d''orchestre (ex.: pied droit sur prise jaune, main gauche sur prise rouge...)
- un élève grimpe, un élève guide, puis inverser les rôles.',
    'Réaliser la voie en étant oralement guidé par le chef d''orchestre.',
    'SAE',
    '- le grimpeur a les yeux bandés
- on peut téléguider l''escalade et la désescalade
- même jeu en traversée.',
    NULL,
    'Réussir la voie en ne prenant que les prises indiquées par le chef d''orchestre.',
    NULL,
    'Jeux enfant\fichePeda_jeux_9.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LES CIBLES',
    'image_file',
    'Jeux enfant',
    '- entourer les prises avec des craies de couleur (les cibles) et attribuer un certain nombre de points à chaque cible en fonction de la difficulté
- équipes de 2.',
    '- chaque équipe choisit dans un temps donné des cibles à atteindre
- pour que les points des cibles soient validés, il faut que les deux joueurs de l''équipe touchent la cible chacun à leur tour et désescaladent sans sauter.',
    'Toucher les prises choisies par l''équipe.',
    'SAE',
    NULL,
    'Cet exercice est essentiellement un jeu de stratégie d''équipe (à 2, faire les bons choix de cibles accessibles).',
    'L''équipe qui a le plus de points est gagnante.',
    NULL,
    'Jeux enfant\fichePeda_jeux_10.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA CLOCHETTE',
    'image_file',
    'Jeux enfant',
    '- matérialiser un parcours en triangle avec un point de départ et un point d''arrivée
- accrocher une clochette au sommet du triangle
- 5 à 6 joueurs par parcours.',
    'Grimper jusqu''à la clochette, la faire sonner et rejoindre le point d''arrivée.',
    'Effectuer le parcours en faisant sonner la clochette au passage.',
    'SAE',
    NULL,
    NULL,
    'Toucher la prise d''arrivée en ayant fait tinter la clochette.',
    NULL,
    'Jeux enfant\fichePeda_jeux_11.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'COMPETITION INTER-EQUIPES',
    'image_file',
    'Jeux enfant',
    '- classe divisée en deux équipes
- faire des groupes de 3 élèves au pied de chaque voie
- 2 réserves de bracelets de 2 couleurs
- placer dans chaque voie 3 mousquetons repérés à 3 hauteurs différentes (3pts, 2pts, 1pt)
- un chrono pour organiser les rotations.',
    '- chaque groupe de 3 enfants se place au pied d''une voie
- au signal, un grimpeur par groupe escalade pour accrocher un seul bracelet à la fois, désescalade et laisse la place au suivant
- au second signal, les enfants cessent de grimper
- on décale les équipes d''un rang pour changer de voie.',
    'Accrocher dans les mousquetons les plus haut placés, le plus possible de cordelettes de la couleur de son équipe.',
    'SAE',
    NULL,
    'Situation de réinvestissement à proposer en fin de cycle.',
    'Avoir fait plus de points que l''équipe adverse.',
    NULL,
    'Jeux enfant\fichePeda_jeux_12.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE COMPTE A REBOURS',
    'image_file',
    'Jeux enfant',
    '- une ligne de départ à 5 mètres du mur
- tous les joueurs derrière la ligne
- l''enseignant ou un joueur décompte de 10 à zéro...',
    '- il faut être accroché au mur à la fin du décompte (aucun appui au sol)
- les joueurs gagnants retournent au départ pour un nouveau décompte
- changer de place au départ pour ne pas s''accrocher toujours au même endroit.',
    'Atteindre le mur et s''accrocher avant la fin du compte à rebours.',
    'SAE',
    '- s''accrocher au mur en lâchant une main ou un pied...
- remettre tous les enfants en jeu à chaque décompte.',
    'Très bon exercice de mise en train et de découverte du mur.',
    'N''avoir aucun appui au sol et rester 5 secondes sans tomber.',
    NULL,
    'Jeux enfant\fichePeda_jeux_13.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA COURSE POURSUITE',
    'image_file',
    'Jeux enfant',
    '- par équipe de 2 : un chat, une souris poursuivie
- la poursuite s''effectue en traversée, avec un point d''arrivée matérialisé
- position de départ : distance de 2 m entre chaque grimpeur
- un foulard dans le dos pour la souris.',
    'Départ au signal.',
    '- le chat : attraper la queue de la souris avant qu''elle n''atteigne l''arrivée
- la souris : atteindre l''arrivée avant d''être touchée.',
    'SAE',
    NULL,
    NULL,
    '',
    NULL,
    'Jeux enfant\fichePeda_jeux_14.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA COURSE AUX TRESORS',
    'image_file',
    'Jeux enfant',
    '- installer sur le mur des objets (aimants, bouts de laine...) en grand nombre
- 2 équipes s''affrontent.',
    '- au signal, tous les élèves montent sur le mur, ramassent un seul objet, descendent, posent l''objet dans un cerceau et remontent chercher un autre objet
- le jeu s''arrête quand il n''y a plus d''objet sur le mur.',
    'Ramasser le plus grand nombre d''objets posés sur le mur.',
    'SAE',
    'Une équipe pose les objets sur le mur, puis l''autre équipe ramasse tous les objets le plus rapidement possible (chronomètre) et on inverse les rôles.',
    NULL,
    'Ramener plus d''objets que l''autre équipe.',
    NULL,
    'Jeux enfant\fichePeda_jeux_15.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE CROISEMENT',
    'image_file',
    'Jeux enfant',
    '- par équipes de 2
- matérialiser une ligne à 2m du sol, à ne pas dépasser avec les mains
- escalade en traversée.',
    '- choisir une prise de départ
- rejoindre la prise de départ de son partenaire sans mettre un pied au sol.',
    'Les joueurs sont partenaires et essaient de se croiser sur le mur.',
    'SAE',
    'Une "chenille" composée de plusieurs élèves croise une autre "chenille".',
    NULL,
    'Atteindre la prise de son camarade.',
    NULL,
    'Jeux enfant\fichePeda_jeux_16.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'L''ECUREUIL',
    'image_file',
    'Jeux enfant',
    '- un point de départ et un point d''arrivée matérialisés en traversée
- 4 prises repérées, d''une valeur de 1 à 4 points
- équipes de 2 : un grimpeur "écureuil" et un observateur
- l''écureuil dispose d''un capital de 3 graines.',
    '- l''écureuil a 3 essais ; il emporte chaque fois une graine qu''il dépose sur la prise la plus éloignée qu''il pourra atteindre
- l''écureuil ne peut pas reculer ; en cas de chute, il perd le bénéfice de sa graine
- l''observateur compte les points obtenus à l''issue des 3 passages.',
    'Réaliser la traversée en essayant de déposer sa graine sur la prise qui lui rapportera le plus de points possibles.',
    'SAE',
    'Ce jeu peut se faire à la verticale.',
    NULL,
    '- réaliser un maximum de points
- réaliser plus de points que son adversaire.',
    NULL,
    'Jeux enfant\fichePeda_jeux_17.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'L''EGYPTIEN',
    'image_file',
    'Jeux enfant',
    '- une ligne de départ, une ligne d''arrivée
- par 2, un observateur, un grimpeur
- chaque grimpeur a une gommette sur chaque hanche.',
    '- réaliser la voie (traversée ou verticale) en conservant le bassin de profil, toujours du même côté, ou changement de profil au cours de l''escalade
- inverser les rôles.',
    'Grimper en se déplaçant de profil (jamais face au mur).',
    'SAE',
    NULL,
    NULL,
    'Le grimpeur réussit la voie et l''observateur, face au mur, bien aligné avec le grimpeur, doit toujours voir la gommette.',
    NULL,
    'Jeux enfant\fichePeda_jeux_18.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'L''ENTONNOIR',
    'image_file',
    'Jeux enfant',
    'Un parcours en entonnoir, matérialisé sur le mur, avec une prise de départ et une prise d''arrivée.',
    'Garder les pieds et les mains à l''intérieur des 2 lignes de l''entonnoir.',
    'Atteindre la prise d''arrivée en passant dans l''entonnoir.',
    'SAE',
    '- réaliser le parcours avec les prises extérieures à l''entonnoir, du plus étroit au plus large
- l''entonnoir peut être vertical ou horizontal.',
    NULL,
    'Atteindre la ligne d''arrivée en utilisant les prises dans l''entonnoir.',
    NULL,
    'Jeux enfant\fichePeda_jeux_19.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE FIL A PLOMB',
    'image_file',
    'Jeux enfant',
    '- placer sur le baudrier ou à la ceinture une sangle qui pend, avec un descendeur qui arrive au niveau des genoux
- matérialiser une ligne de départ, une ligne d''arrivée
- escalade en traversée
- par 2 : un grimpeur, un observateur.',
    '- grimpeur : il traverse à droite, il n''a le droit de déplacer le pied gauche que lorsque le fil à plomb est au-dessus de son pied droit
- observateur : il observe le déplacement du grimpeur, le renseigne sur le moment où le fil à plomb est aligné sur le pied d''appui.',
    'Réussir la traversée et atteindre l''arrivée en respectant la consigne.',
    'SAE',
    '- faire l''exercice en traversée dans l''autre sens
- faire l''exercice à la verticale.',
    NULL,
    '- réussir la traversée
- à chaque déplacement, le fil est à l''aplomb du point d''appui.',
    NULL,
    'Jeux enfant\fichePeda_jeux_20.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA FRONTIERE',
    'image_file',
    'Jeux enfant',
    '- matérialiser plusieurs voies verticales avec un point d''arrivée repéré
- tracer une ligne verticale sous ce point (la frontière)
- répartir les enfants par équipes de 4 au pied des voies.',
    '- atteindre le repère avec une règle de déplacement à respecter : pendant toute l''escalade, les mains doivent rester d''un côté de la frontière, et les pieds de l''autre
- les observateurs témoignent du respect de la règle du jeu.',
    'Atteindre le haut de la voie sans jamais changer de zone pour les mains et les pieds.',
    'SAE',
    NULL,
    NULL,
    'Atteindre le haut de la voie malgré la contrainte.',
    NULL,
    'Jeux enfant\fichePeda_jeux_21.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LES INDIENS AUX PIEDS COLORES',
    'image_file',
    'Jeux enfant',
    '- un point de départ, un point d''arrivée sur le mur
- les prises de pieds sont marquées de 2 couleurs (rouge, bleu)
- les élèves sont par 2 : un grimpeur "l''indien" (un pied rouge, un pied bleu) et un observateur.',
    '- grimpeur : suivre la piste en posant toujours le pied bleu sur les prises bleues, le pied rouge sur les prises rouges
- observateur : vérifier que l''indien respecte strictement la règle.',
    'Suivre un circuit repéré par 2 couleurs en posant chaque pied sur les prises de couleur correspondantes.',
    'SAE',
    '- simplifier le jeu (sans croisement de pieds) en suivant une piste d''une seule couleur
- transposer ce jeu au niveau des mains.',
    NULL,
    'Respecter strictement la règle (vérifié par l''observateur).',
    NULL,
    'Jeux enfant\fichePeda_jeux_22.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE MANCHOT',
    'image_file',
    'Jeux enfant',
    'Une surface d''escalade en pente (plan incliné).',
    '- grimper avec une main dans le dos, ou une balle dans la main
- on désescalade comme on veut.',
    'Atteindre le sommet en utilisant une seule main.',
    'SAE',
    '- "le gros ventre" : grimper avec un ballon placé devant soi, sous le pull
- grimper les 2 mains à plat à côté des prises
- grimper sans les mains
- jouer à la passe à 5 en grimpant.',
    NULL,
    'Atteindre le sommet de la voie en gardant la main dans le dos, ou sans avoir lâché la balle.',
    NULL,
    'Jeux enfant\fichePeda_jeux_23.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'PARCOURS SANS FIN',
    'image_file',
    'Jeux enfant',
    '- déterminer un parcours fermé sur le mur sous forme de figures géométriques
- 1 équipe de 4 enfants par parcours.',
    '- suivre le parcours indiqué et le réaliser le plus grand nombre de fois possible, sans mettre pied à terre
- un seul essai par grimpeur.',
    'Faire le plus grand nombre de tours, établir le record de l''équipe.',
    'SAE',
    NULL,
    NULL,
    '- individuel : celui qui a réalisé le plus grand nombre de tours
- équipe : l''équipe qui a totalisé le plus grand nombre de tours a gagné.',
    NULL,
    'Jeux enfant\fichePeda_jeux_24.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'PAS DE GEANT, PAS DE FOURMI',
    'image_file',
    'Jeux enfant',
    '- en traversée ou verticale, lignes de départ et d''arrivée
- par 2 : un grimpeur, un observateur.',
    '- pas de fourmi : chaque prise de pieds utilisée marque un point
- pas de géant : chaque prise de pieds utilisée enlève un point (départ avec bonus de 10 points)
- si chute, retour au départ.',
    'Atteindre l''arrivée en utilisant le plus de prises possibles (fourmi) ou le moins de prises possibles (géant).',
    'SAE',
    'Transposer la règle au niveau des mains.',
    NULL,
    'Réussir la voie avec le plus possible de points.',
    NULL,
    'Jeux enfant\fichePeda_jeux_25.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'PASSAGE OBLIGE',
    'image_file',
    'Jeux enfant',
    '- un point de départ, une prise d''arrivée
- des prises repérées disposées sur le mur
- par groupe de 2.',
    'On peut se servir de toutes les prises mais en passant obligatoirement par les prises repérées.',
    'Atteindre l''arrivée en utilisant toutes les prises repérées.',
    'SAE',
    'Organisation par atelier de 4 ou 5 joueurs et rechercher des itinéraires différents.',
    NULL,
    'Atteindre la prise d''arrivée en étant passé par toutes les prises repérées.',
    'Pour stimuler la capacité de choix de l''enfant, on essaiera d''installer les prises repérées de manière à susciter des réponses variées.',
    'Jeux enfant\fichePeda_jeux_26.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA PATINETTE',
    'image_file',
    'Jeux enfant',
    '- surface d''escalade en pente, plan incliné
- atelier de 3, 4 élèves.',
    '- n''utiliser les prises qu''avec les mains (pieds "à plat" sur le mur)
- les prises de pied sont autorisées pour la désescalade
- passer à tour de rôle.',
    'Atteindre le sommet sans poser les pieds sur les prises.',
    'SAE',
    '- faire varier l''inclinaison
- faire varier la contrainte (ex: droit à une seule prise de pieds).',
    NULL,
    'Atteindre le haut de la voie sans avoir touché une seule prise avec ses pieds.',
    NULL,
    'Jeux enfant\fichePeda_jeux_27.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE PETIT POUCET',
    'image_file',
    'Jeux enfant',
    'Placer des petits cailloux en équilibre sur toutes les prises de pieds, le long d''une traversée.',
    '- grimpeur : traverser sans faire tomber de cailloux
- observateur : compter les cailloux tombés.',
    'Réussir la traversée sans faire tomber de cailloux.',
    'SAE',
    NULL,
    NULL,
    'Avoir fait tomber moins de cailloux que son adversaire, ou que l''équipe adverse.',
    NULL,
    'Jeux enfant\fichePeda_jeux_28.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE PIRATE',
    'image_file',
    'Jeux enfant',
    '- groupes de 2 élèves
- une prise d''arrivée matérialisée.',
    '- le grimpeur doit atteindre le sommet en utilisant une seule jambe (changer de jambe à chaque passage)
- l''observateur contrôle le respect de la consigne.',
    'Réaliser la voie sur un seul pied.',
    'SAE',
    NULL,
    NULL,
    'Réaliser la voie en ayant toujours utilisé la même jambe pour les appuis du pied.',
    NULL,
    'Jeux enfant\fichePeda_jeux_29.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'POUSSE-POUSSE',
    'image_file',
    'Jeux enfant',
    '- matérialiser plusieurs voies verticales avec un point d''arrivée repéré à 2m50
- équipes de 2 : un grimpeur, un observateur.',
    '- grimpeur: n''a le droit de poser son deuxième pied que lorsque sa jambe d''appui est complètement tendue (développer chaque appui à fond)
- observateur: veiller à ce que la jambe d''appui ne soit pas encore fléchie quand le deuxième pied se pose.',
    'Atteindre le haut de la voie en respectant la règle de déplacement.',
    'SAE',
    NULL,
    NULL,
    'Toucher le point d''arrivée repéré.',
    NULL,
    'Jeux enfant\fichePeda_jeux_30.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'PRISES ELIMINEES',
    'image_file',
    'Jeux enfant',
    '- une prise est matérialisée sur le mur à une certaine hauteur
- par 2 : partenaires.',
    'Atteindre la prise d''arrivée puis, à chaque passage, éliminer une prise. S''arrêter lorsqu''on ne peut plus éliminer de prise.',
    'Réaliser la voie avec un minimum de prises.',
    'SAE',
    'Depuis le sol, le partenaire peut interdire une prise que le grimpeur est sur le point d''utiliser.',
    NULL,
    'Réaliser la voie en ayant éliminé au moins x prises.',
    NULL,
    'Jeux enfant\fichePeda_jeux_31.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'PRISES TOUCHEES, PRISES TENUES',
    'image_file',
    'Jeux enfant',
    '- un point de départ, un point d''arrivée
- par groupe de 2.',
    '- grimpeur: chaque fois qu''une prise est touchée de la main, elle doit être tenue et utilisée pour la progression
- observateur: compter les points (1 point par prise convertie, -2 points si non utilisée).',
    'Réaliser la voie en utilisant obligatoirement les prises touchées.',
    'SAE',
    'Faire le même jeu en le transposant au niveau des pieds.',
    NULL,
    'Réussir la voie en obtenant plus de points que son partenaire.',
    NULL,
    'Jeux enfant\fichePeda_jeux_32.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'RALENTI - ACCELERE',
    'image_file',
    'Jeux enfant',
    '- un magnétophone (musiques rapides et lentes)
- par 2.',
    '- grimper en respectant le rythme de la musique (vite sur rapide, ralenti sur lente).',
    'Maîtriser son rythme d''escalade: vite ou lent.',
    'SAE',
    'Danse escalade, ballet vertical.',
    NULL,
    'Appréciation de l''observateur sur la variation du rythme.',
    NULL,
    'Jeux enfant\fichePeda_jeux_33.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE RELAIS VERTICAL',
    'image_file',
    'Jeux enfant',
    '- placer 2 équipes de 4 élèves en parallèle sur 2 voies différentes
- matérialiser le départ et l''arrivée.',
    '- chaque équipe se tient à 3m du mur, un grimpeur dans le cerceau de départ
- au signal, aller toucher l''arrivée et désescalader sans sauter.',
    'Réaliser sous forme de relais, le plus rapidement possible, la voie, par équipe.',
    'SAE',
    NULL,
    NULL,
    'L''équipe ayant terminé la première son relais a gagné.',
    NULL,
    'Jeux enfant\fichePeda_jeux_34.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LES STATUES',
    'image_file',
    'Jeux enfant',
    '- par 3, 2 grimpeurs, un contrôleur.',
    '- le premier grimpeur crée une statue originale (position immobile)
- le deuxième grimpeur observe et reproduit la statue.',
    'Reproduire avec exactitude la position réalisée par son partenaire.',
    'SAE',
    '- mémorisation de 2 statues de suite
- tableau collectif
- dessiner la statue.',
    NULL,
    'Réaliser la posture de son partenaire (prises de mains et prises de pieds identiques).',
    NULL,
    'Jeux enfant\fichePeda_jeux_35.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'SEQUENCE HABILLAGE',
    'image_file',
    'Jeux enfant',
    '',
    '',
    '',
    'SAE',
    NULL,
    NULL,
    'L''équipe qui a réalisé le plus grand nombre de tours d''horloge gagne.',
    NULL,
    'Jeux enfant\fichePeda_jeux_36.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'JACQUES A DIT',
    'image_file',
    'Jeux enfant',
    'Un meneur (l''enseignant), tous les enfants sur le mur à un mètre du sol.',
    'Jacques a dit d''enlever la main gauche, le pied droit... Si la consigne n''est pas précédée de la phrase clé, ne pas bouger.',
    'Réaliser les consignes données seulement si elles sont précédées de ''Jacques a dit''.',
    'SAE',
    NULL,
    NULL,
    'Rester sur le mur sans tomber et sans se tromper de consigne.',
    NULL,
    'Jeux enfant\fichePeda_jeux_38.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'JEU DE MASSACRE',
    'image_file',
    'Jeux enfant',
    '- 2 équipes : une traverse le mur, l''autre est au sol avec des ballons mous.
- Zone de tir délimitée au sol.',
    '- Les grimpeurs traversent.
- Les tireurs visent les grimpeurs (corps uniquement, pas la tête) sans entrer dans la zone interdite.',
    'Traverser sans se faire toucher par les ballons.',
    'SAE',
    NULL,
    NULL,
    'Comptabiliser le nombre de traversées réussies (sans touche).',
    NULL,
    'Jeux enfant\fichePeda_jeux_39.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'PARCOURS D''OBSTACLES',
    'image_file',
    'Jeux enfant',
    'Sur un itinéraire (vertical ou traversée), installer des obstacles (cerceaux, fils, objets en relief).',
    'Passer dessus, dessous ou à travers l''obstacle selon sa nature.',
    'Franchir les obstacles sans tomber.',
    'SAE',
    NULL,
    NULL,
    'Atteindre l''arrivée sans toucher l''obstacle (si interdit) et sans chute.',
    NULL,
    'Jeux enfant\fichePeda_jeux_40.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA PIEUVRE',
    'image_file',
    'Jeux enfant',
    '- Une prise de départ cerclée à la craie.
- Par 2 : un grimpeur, un observateur.',
    'Le grimpeur garde une main fixe sur la prise ''tête de pieuvre'' et allonge l''autre main pour toucher des prises éloignées.',
    'Toucher le plus de prises possible en gardant une main sur la prise de départ.',
    'SAE',
    NULL,
    NULL,
    'Nombre de prises touchées validées par l''observateur.',
    NULL,
    'Jeux enfant\fichePeda_jeux_41.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LES PRÉNOMS CACHÉS',
    'image_file',
    'Jeux enfant',
    'Des lettres sont dispersées et accrochées sur les prises du mur.',
    'Le grimpeur doit aller toucher (ou décrocher) les lettres dans l''ordre pour épeler le mot cible.',
    'Reconstituer son prénom ou un mot donné.',
    'SAE',
    NULL,
    NULL,
    'Avoir trouvé toutes les lettres dans le bon ordre.',
    NULL,
    'Jeux enfant\fichePeda_jeux_42.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LE PUZZLE',
    'image_file',
    'Jeux enfant',
    'Des pièces de puzzle sont accrochées sur le mur.',
    'Aller chercher une pièce à la fois, redescendre pour la poser, et remonter chercher la suivante.',
    'Reconstituer le puzzle au sol.',
    'SAE',
    NULL,
    NULL,
    'Puzzle terminé le plus vite possible (en relais ou individuel).',
    NULL,
    'Jeux enfant\fichePeda_jeux_43.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA QUEUE DU DIABLE',
    'image_file',
    'Jeux enfant',
    '- Un foulard accroché au baudrier (dans le dos) ou à la ceinture.
- Jeu en traversée par 2 (poursuite).',
    'Les grimpeurs évoluent sur le mur. Le poursuivant essaie de saisir la ''queue''.',
    'Attraper le foulard de l''adversaire sans se faire prendre le sien.',
    'SAE',
    NULL,
    NULL,
    'Avoir attrapé le foulard de l''autre.',
    NULL,
    'Jeux enfant\fichePeda_jeux_44.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'LA RIVIÈRE AUX CROCODILES',
    'image_file',
    'Jeux enfant',
    '- Le mur est la ''falaise''. Les tapis au sol sont la ''rivière''.
- Un ''crocodile'' (élève) est sur les tapis.',
    'Le crocodile se déplace à quatre pattes sur les tapis et essaie de toucher les pieds des grimpeurs s''ils pendent trop bas.',
    'Traverser la falaise sans se faire ''manger'' (toucher les pieds) par le crocodile.',
    'SAE',
    NULL,
    NULL,
    'Arriver au bout de la traversée sans avoir été touché.',
    NULL,
    'Jeux enfant\fichePeda_jeux_45.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    '1, 2, 3 SOLEIL',
    'image_file',
    'Jeux enfant',
    'Un meneur au pied du mur, les grimpeurs sur le mur.',
    'Le meneur dit ''1, 2, 3 Soleil'' et se retourne. Les grimpeurs doivent s''immobiliser (faire la statue). Si un grimpeur bouge, il redescend.',
    'Atteindre le haut (ou le bout) du mur sans être vu en mouvement.',
    'SAE',
    NULL,
    NULL,
    'Être le premier à toucher la ligne d''arrivée.',
    NULL,
    'Jeux enfant\fichePeda_jeux_46.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;

INSERT INTO pedagogy_sheets (
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
    'VIDER SON CAMP',
    'image_file',
    'Jeux enfant',
    '- Deux équipes sur deux pans de mur ou zones.
- Des objets mous (balles, chaussettes) accrochés ou coincés sur le mur.',
    'Prendre un objet de son mur et aller le mettre sur le mur de l''équipe adverse (ou le jeter dans une zone cible).',
    'Ne plus avoir d''objets dans son camp.',
    'SAE',
    NULL,
    NULL,
    'Avoir le moins d''objets sur son mur à la fin du temps imparti.',
    NULL,
    'Jeux enfant\fichePeda_jeux_47.png',
    '',
    'educational_game'
)
ON CONFLICT (title) DO NOTHING;
