-- Ajouter la colonne statut à competition_participants pour stocker le statut de la commande HelloAsso
alter table competition_participants
add column if not exists statut text;

comment on column competition_participants.statut is 'Statut de la commande HelloAsso (Processed, etc.)';
