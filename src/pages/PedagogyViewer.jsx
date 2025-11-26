import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { BookMarked, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useParams } from 'react-router-dom';

const BUCKET_NAME = 'pedagogy_files';
const SHEET_TYPES = {
    'educational_game': 'Jeu éducatif',
    'warm_up_exercise': 'Exercice d\'échauffement',
    'strength_exercise': 'Exercice de renfo',
    'review_sheet': 'Fiche de révision',
    'technical_sheet': 'Fiche technique',
    'safety_sheet': 'Fiche sécurité',
    'meeting_report': 'Compte rendu de réunion'
};

const PedagogyViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasAccess, loading: pageAccessLoading } = usePageAccess();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [sheet, setSheet] = useState(null);
    const [illustrationUrl, setIllustrationUrl] = useState(null);
    const [exerciseImageUrl, setExerciseImageUrl] = useState(null);

    // Fonction pour obtenir l'URL signée d'un fichier
    const getSignedUrl = async (fileNameOrUrl) => {
        if (!fileNameOrUrl) return null;

        try {
            // Si c'est déjà une URL complète, on l'utilise directement
            if (fileNameOrUrl.startsWith('http://') || fileNameOrUrl.startsWith('https://')) {
                return fileNameOrUrl;
            }

            // Sinon, générer une URL signée depuis le nom du fichier
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(fileNameOrUrl, 3600); // URL valide 1 heure

            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            console.error('Erreur lors de la génération de l\'URL signée:', error);
            return null;
        }
    };

    // Charger la fiche
    useEffect(() => {
        const fetchSheet = async () => {
            try {
                const { data, error } = await supabase
                    .from('pedagogy_sheets')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                setSheet(data);

                // Charger l'image d'illustration si elle existe
                if (data.illustration_image) {
                    const url = await getSignedUrl(data.illustration_image);
                    setIllustrationUrl(url);
                }

                // Charger l'image de l'exercice si elle existe
                if (data.url && data.type === 'image_file') {
                    const url = await getSignedUrl(data.url);
                    setExerciseImageUrl(url);
                }
            } catch (error) {
                toast({
                    title: "Erreur",
                    description: `Impossible de charger la fiche: ${error.message}`,
                    variant: "destructive",
                });
                navigate('/pedagogy');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchSheet();
        }
    }, [id, navigate, toast]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!sheet) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Fiche introuvable</h2>
                            <p className="text-muted-foreground">
                                La fiche pédagogique demandée n'existe pas.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isGameType = sheet.sheet_type === 'educational_game';
    const isWarmUpType = sheet.sheet_type === 'warm_up_exercise';

    return (
        <>
            <Helmet>
                <title>{sheet.title} - ALJ Escalade</title>
            </Helmet>

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <BackButton to="/pedagogy" className="mb-4">
                            Retour à la pédagogie
                        </BackButton>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            {sheet.title}
                        </h1>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {sheet.sheet_type && (
                                <Badge variant="outline" className="text-sm">
                                    {SHEET_TYPES[sheet.sheet_type]}
                                </Badge>
                            )}
                            {sheet.structure && <Badge variant="secondary">{sheet.structure}</Badge>}
                            {(sheet.categories || []).map(cat => (
                                <Badge key={cat}>{cat}</Badge>
                            ))}
                            {sheet.theme && <Badge variant="game">{sheet.theme}</Badge>}
                        </div>
                    </div>

                    {/* Contenu */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Détails de la fiche</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Image d'illustration */}
                            {illustrationUrl && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">Image d'illustration</p>
                                    <div className="w-full bg-muted rounded-lg overflow-hidden">
                                        <img
                                            src={illustrationUrl}
                                            alt={sheet.title}
                                            className="w-full h-auto object-contain max-h-96"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Image de l'exercice (si différente de l'illustration) */}
                            {exerciseImageUrl && (!illustrationUrl || exerciseImageUrl !== illustrationUrl) && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">Image de l'exercice</p>
                                    <div className="w-full bg-muted rounded-lg overflow-hidden">
                                        <img
                                            src={exerciseImageUrl}
                                            alt={sheet.title}
                                            className="w-full h-auto object-contain max-h-96"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Champs spécifiques aux jeux éducatifs et exercices d'échauffement */}
                            {(isGameType || isWarmUpType) ? (
                                <div className="space-y-4">
                                    {sheet.starting_situation && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Situation de départ</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.starting_situation}
                                            </p>
                                        </div>
                                    )}

                                    {sheet.game_goal && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">{isWarmUpType ? 'Objectif' : 'But du jeu'}</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.game_goal}
                                            </p>
                                        </div>
                                    )}

                                    {sheet.evolution && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Évolution</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.evolution}
                                            </p>
                                        </div>
                                    )}

                                    {sheet.skill_to_develop && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Capacité à développer</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.skill_to_develop}
                                            </p>
                                        </div>
                                    )}

                                    {sheet.success_criteria && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Critères de réussite</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.success_criteria}
                                            </p>
                                        </div>
                                    )}

                                    {sheet.remarks && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Remarques</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.remarks}
                                            </p>
                                        </div>
                                    )}

                                    {/* Description pour les exercices d'échauffement */}
                                    {isWarmUpType && sheet.description && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Description</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Description pour les autres types */}
                                    {sheet.description && (
                                        <div>
                                            <p className="font-semibold text-sm mb-1">Description</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {sheet.description}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Lien vers le média si disponible */}
                            {sheet.url && sheet.type && sheet.type.includes('url') && (
                                <div>
                                    <p className="font-semibold text-sm mb-2">Média</p>
                                    <Button asChild variant="outline">
                                        <a href={sheet.url} target="_blank" rel="noopener noreferrer">
                                            Ouvrir le média
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default PedagogyViewer;
