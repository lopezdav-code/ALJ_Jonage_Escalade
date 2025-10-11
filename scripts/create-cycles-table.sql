-- Création de la table cycles pour regrouper les séances
CREATE TABLE IF NOT EXISTS public.cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_description TEXT,
    long_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cycles_created_by ON public.cycles(created_by);
CREATE INDEX IF NOT EXISTS idx_cycles_is_active ON public.cycles(is_active);
CREATE INDEX IF NOT EXISTS idx_cycles_created_at ON public.cycles(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_cycles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cycles_updated_at_trigger
    BEFORE UPDATE ON public.cycles
    FOR EACH ROW
    EXECUTE FUNCTION update_cycles_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE public.cycles IS 'Table pour gérer les cycles de séances d''escalade';
COMMENT ON COLUMN public.cycles.name IS 'Nom du cycle';
COMMENT ON COLUMN public.cycles.short_description IS 'Description courte du cycle';
COMMENT ON COLUMN public.cycles.long_description IS 'Description détaillée du cycle';
COMMENT ON COLUMN public.cycles.created_by IS 'ID de l''utilisateur qui a créé le cycle';
COMMENT ON COLUMN public.cycles.is_active IS 'Indique si le cycle est actif ou archivé';

-- Enable Row Level Security
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture : accessible aux utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les cycles"
    ON public.cycles FOR SELECT
    TO authenticated
    USING (true);

-- Politique pour la création : réservé aux encadrants et admins
CREATE POLICY "Les encadrants et admins peuvent créer des cycles"
    ON public.cycles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('encadrant', 'admin')
        )
    );

-- Politique pour la modification : réservé aux encadrants et admins
CREATE POLICY "Les encadrants et admins peuvent modifier des cycles"
    ON public.cycles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('encadrant', 'admin')
        )
    );

-- Politique pour la suppression : réservé aux admins uniquement
CREATE POLICY "Les admins peuvent supprimer des cycles"
    ON public.cycles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
