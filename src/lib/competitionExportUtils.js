import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import ParticipationPosterExport from '@/components/ParticipationPosterExport';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Exporte une compétition en PNG
 * @param {Object} competition - L'objet compétition à exporter
 * @param {Function} toast - Fonction toast pour afficher les notifications
 * @returns {Promise<void>}
 */
export const exportCompetitionToPNG = async (competition, toast) => {
    try {
        // Récupérer les participants de cette compétition
        const { data: participantsData, error: participantsError } = await supabase
            .from('competition_participants')
            .select(`
        role,
        member_id,
        ranking,
        nb_competitor,
        members ( id, first_name, last_name, title, category, sexe )
      `)
            .eq('competition_id', competition.id)
            .eq('role', 'Competiteur');

        if (participantsError) {
            console.error('Erreur Supabase:', participantsError);
            throw participantsError;
        }

        console.log('Participants récupérés:', participantsData);

        // Vérifier s'il y a des participants
        if (!participantsData || participantsData.length === 0) {
            toast({
                title: 'Attention',
                description: 'Aucun compétiteur inscrit pour cette compétition',
                variant: 'default',
            });
            return;
        }

        // Transformer les données pour le format attendu par ParticipationPosterExport
        const competitorsMap = {};
        participantsData?.forEach(p => {
            if (!p.members) return;
            const memberId = p.members.id;
            if (!competitorsMap[memberId]) {
                competitorsMap[memberId] = {
                    member: p.members,
                    participations: {}
                };
            }
            competitorsMap[memberId].participations[competition.id] = {
                ranking: p.ranking,
                nb_competitor: p.nb_competitor
            };
        });

        const competitors = Object.values(competitorsMap);

        console.log('Compétiteurs formatés:', competitors);

        // Créer un conteneur temporaire
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '900px';
        document.body.appendChild(tempDiv);

        // Créer un élément React et le rendre
        const root = ReactDOM.createRoot(tempDiv);
        root.render(
            ParticipationPosterExport({
                competitors,
                competitions: [competition],
                title: "ALJ Escalade",
                subtitle: "Résultat du week-end"
            })
        );

        // Attendre que le rendu soit fait
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = await html2canvas(tempDiv, {
            backgroundColor: '#ffffff',
            scale: 2,
            allowTaint: true,
            useCORS: true,
            logging: false,
            removeModal: true,
        });

        // Nettoyage
        root.unmount();
        document.body.removeChild(tempDiv);

        // Télécharger
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        const fileName = `${competition.short_title || competition.name}-${new Date().toISOString().split('T')[0]}.png`;
        link.download = fileName.replace(/[^a-z0-9-]/gi, '_');
        link.click();

        toast({
            title: 'Succès',
            description: 'L\'affiche a été exportée en PNG',
        });
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        toast({
            title: 'Erreur',
            description: `Impossible d'exporter l'affiche: ${error.message || 'Erreur inconnue'}`,
            variant: 'destructive',
        });
    }
};
