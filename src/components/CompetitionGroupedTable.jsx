import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Medal, CheckCircle2, Printer, Copy } from 'lucide-react';
import { formatName } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';

const DISCIPLINE_COLORS = {
  'Bloc': 'bloc',
  'Difficulté': 'difficulte',
  'Vitesse': 'vitesse'
};

const CompetitionGroupedTable = ({
  competitions,
  allCompetitors,
  dateDebut,
  dateFin,
  showOnlyWithParticipation
}) => {
  const { toast } = useToast();
  const contentRef = useRef(null);

  // Fonction pour copier le tableau en tant qu'image
  const handleCopyAsImage = async () => {
    try {
      if (!contentRef.current) return;

      // Cloner l'élément et agrandir les icônes pour la capture
      const clone = contentRef.current.cloneNode(true);

      // Agrandir toutes les icônes SVG dans le clone pour une meilleure capture
      const svgs = clone.querySelectorAll('svg');
      svgs.forEach(svg => {
        const currentWidth = svg.getAttribute('width') || svg.style.width || '';
        const currentHeight = svg.getAttribute('height') || svg.style.height || '';

        // Augmenter la taille des petites icônes
        if (currentWidth.includes('3') || currentHeight.includes('3') || currentWidth.includes('4') || currentHeight.includes('4')) {
          svg.setAttribute('width', '24');
          svg.setAttribute('height', '24');
          svg.style.width = '24px';
          svg.style.height = '24px';
        }
      });

      // Ajouter le clone au DOM temporairement
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      // Attendre que les icônes agrandies soient rendues
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200);
        });
      });

      // Créer une version temporaire pour la capture (sans les boutons no-print)
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 1.5,
        allowTaint: true,
        useCORS: true,
        logging: false,
        removeModal: true,
      });

      // Nettoyer le clone
      document.body.removeChild(tempContainer);

      // Convertir en blob et copier dans le clipboard
      canvas.toBlob(async (blob) => {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          toast({
            title: 'Succès',
            description: 'Tableau copié dans le presse-papier',
          });
        } catch (err) {
          toast({
            title: 'Erreur',
            description: 'Impossible de copier dans le presse-papier',
            variant: 'destructive',
          });
        }
      });
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de capturer le tableau',
        variant: 'destructive',
      });
    }
  };

  // Restructurer les données par compétition → sexe
  const buildCompetitionHierarchy = () => {
    const structure = {};

    // Initialiser la structure pour chaque compétition
    competitions.forEach(comp => {
      structure[comp.id] = {
        competition: comp,
        sexes: {}
      };
    });

    // Remplir avec les données des compétiteurs
    allCompetitors.forEach(competitor => {
      const { member, participations } = competitor;

      Object.entries(participations).forEach(([compId, participation]) => {
        if (!structure[compId]) return;

        const sexKey = member.sexe || 'Non spécifié';

        // Initialiser le sexe
        if (!structure[compId].sexes[sexKey]) {
          structure[compId].sexes[sexKey] = {
            title: sexKey === 'H' ? 'Hommes' : sexKey === 'F' ? 'Femmes' : sexKey,
            members: []
          };
        }

        // Ajouter le compétiteur
        structure[compId].sexes[sexKey].members.push({
          member,
          ranking: participation.ranking
        });
      });
    });

    // Trier les membres dans chaque sexe
    Object.values(structure).forEach(compData => {
      Object.values(compData.sexes).forEach(sex => {
        sex.members.sort((a, b) =>
          a.member.first_name.localeCompare(b.member.first_name)
        );
      });
    });

    return structure;
  };

  const hierarchy = buildCompetitionHierarchy();

  // Filtrer les compétitions par plage de dates
  const filteredCompetitions = competitions.filter(comp => {
    const compDate = new Date(comp.start_date);
    if (dateDebut && new Date(dateDebut) > compDate) return false;
    if (dateFin && new Date(dateFin) < compDate) return false;
    return true;
  });

  if (filteredCompetitions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">Aucune compétition dans cette plage de dates.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculer les compteurs
  const calculateStats = () => {
    let totalCompetitors = 0;
    let menCount = 0;
    let womenCount = 0;

    filteredCompetitions.forEach(comp => {
      const compHierarchy = hierarchy[comp.id];
      if (!compHierarchy) return;

      Object.entries(compHierarchy.sexes).forEach(([sexKey, sex]) => {
        const count = sex.members.length;
        if (sexKey === 'H') menCount += count;
        else if (sexKey === 'F') womenCount += count;
        totalCompetitors += count;
      });
    });

    return { totalCompetitors, menCount, womenCount };
  };

  const { totalCompetitors, menCount, womenCount } = calculateStats();

  // Fonction d'impression
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Boutons d'action */}
      <div className="flex justify-end gap-2 no-print">
        <Button onClick={handleCopyAsImage} variant="outline" size="sm" className="gap-2">
          <Copy className="w-4 h-4" />
          Copier l'image
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimer
        </Button>
      </div>

      {/* Contenu principal à capturer */}
      <div ref={contentRef} className="space-y-4">
        {/* Statistiques générales */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-2xl font-bold text-primary">{totalCompetitors}</div>
              <div className="text-sm text-muted-foreground">
                {totalCompetitors > 1 ? 'compétiteurs' : 'compétiteur'}
              </div>
            </div>
            {menCount > 0 && (
              <div>
                <div className="text-2xl font-bold text-blue-600">{menCount}</div>
                <div className="text-sm text-muted-foreground">Hommes</div>
              </div>
            )}
            {womenCount > 0 && (
              <div>
                <div className="text-2xl font-bold text-pink-600">{womenCount}</div>
                <div className="text-sm text-muted-foreground">Femmes</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compétitions groupées */}
      <div className="space-y-4">
        {filteredCompetitions.map(comp => {
          const compHierarchy = hierarchy[comp.id];
          if (!compHierarchy || Object.keys(compHierarchy.sexes).length === 0) return null;

          const totalParticipants = Object.values(compHierarchy.sexes).reduce(
            (sum, sex) => sum + sex.members.length,
            0
          );

          return (
            <Card key={comp.id}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="text-lg">{comp.name}</div>
                    <div className="text-xs text-muted-foreground font-normal mt-2">
                      {new Date(comp.start_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {comp.disciplines.map(d => (
                        <Badge key={d} variant={DISCIPLINE_COLORS[d] || 'default'}>
                          {d}
                        </Badge>
                      ))}
                      {comp.nature && <Badge variant="outline">{comp.nature}</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-lg font-semibold">{totalParticipants}</div>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {Object.entries(compHierarchy.sexes)
                    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                    .map(([sexKey, sex]) => (
                      <div key={`${comp.id}-${sexKey}`} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{sex.title}</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {sex.members.length} {sex.members.length > 1 ? 'compétiteurs' : 'compétiteur'}
                          </span>
                        </div>
                        <div className="space-y-1 pl-4">
                          {sex.members.map(({ member, ranking }) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <User
                                  className={`w-3 h-3 flex-shrink-0 ${
                                    member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'
                                  }`}
                                />
                                <div className="truncate flex-1">
                                  <span
                                    className={`${
                                      member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'
                                    }`}
                                  >
                                    {formatName(member.first_name, member.last_name, true)}
                                  </span>
                                  {member.category && (
                                    <span className="text-muted-foreground text-xs ml-2">
                                      ({member.category})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {ranking ? (
                                  <div className="flex items-center gap-1 font-bold text-primary">
                                    <Medal className="w-3 h-3" />
                                    <span>{ranking}</span>
                                  </div>
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>  {/* Fin du ref contentRef */}

      {/* Styles d'impression */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white;
          }

          .accordion {
            border: none;
          }

          [data-state="open"] {
            display: block;
          }

          button[type="button"] {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CompetitionGroupedTable;
