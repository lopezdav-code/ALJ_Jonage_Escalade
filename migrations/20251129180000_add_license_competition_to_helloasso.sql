-- Ajouter les colonnes license et competition_id à la table helloasso_orders

alter table helloasso_orders
add column if not exists license text,
add column if not exists competition_id integer;

-- Commentaires pour documenter les colonnes
comment on column helloasso_orders.license is 'Numéro de licence du membre lié à cette commande';
comment on column helloasso_orders.competition_id is 'ID de la compétition liée à cette commande';
