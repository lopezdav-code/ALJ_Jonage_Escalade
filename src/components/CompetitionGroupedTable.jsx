import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Medal, CheckCircle2, Printer, Download, ArrowUpDown } from 'lucide-react';
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
  const [sortByRanking, setSortByRanking] = useState(false);

  // Fonction pour télécharger le tableau en tant qu'image PNG
  const handleDownloadPNG = async () => {
    try {
      if (!contentRef.current) return;

      // Créer un style temporaire pour éviter le clipping pendant la capture
      const style = document.createElement('style');
      style.innerHTML = `
        div[style*="overflow-x-auto"] {
          overflow: visible !important;
        }
        table td, table th {
          overflow: visible !important;
        }
        .truncate {
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: normal !important;
        }
        /* Forcer l'affichage en deux colonnes pour la capture */
        .md\\:grid-cols-2 {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      `;
      document.head.appendChild(style);

      // Attendre que tout soit rendu
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 300);
        });
      });

      // Créer une version temporaire pour la capture (sans les boutons no-print)
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        allowTaint: true,
        useCORS: true,
        logging: false,
        removeModal: true,
      });

      // Nettoyer le style temporaire
      document.head.removeChild(style);

      // Télécharger l'image en PNG
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `participation-${new Date().toISOString().split('T')[0]}.png`;
      link.click();

      toast({
        title: 'Succès',
        description: 'Le tableau a été téléchargé en PNG',
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

  // Extraire la catégorie d'âge depuis member.category
  const extractAgeCategory = (category) => {
    if (!category) return 'Autre';
    // Extraire U13, U15, U17, U19, etc.
    const match = category.match(/U(\d+)/);
    if (match) {
      return `U${match[1]}`;
    }
    return 'Autre';
  };

  // Ordre de tri des catégories
  const categoryOrder = ['U13', 'U15', 'U17', 'U19', 'Autre'];

  // Restructurer les données par compétition → catégorie d'âge → sexe
  const buildCompetitionHierarchy = () => {
    const structure = {};

    // Initialiser la structure pour chaque compétition
    competitions.forEach(comp => {
      structure[comp.id] = {
        competition: comp,
        categories: {}
      };
    });

    // Remplir avec les données des compétiteurs
    allCompetitors.forEach(competitor => {
      const { member, participations } = competitor;

      Object.entries(participations).forEach(([compId, participation]) => {
        if (!structure[compId]) return;

        const categoryKey = extractAgeCategory(member.category);
        const sexKey = member.sexe || 'Non spécifié';

        // Initialiser la catégorie d'âge
        if (!structure[compId].categories[categoryKey]) {
          structure[compId].categories[categoryKey] = {
            title: categoryKey,
            sexes: {}
          };
        }

        // Initialiser le sexe dans cette catégorie
        if (!structure[compId].categories[categoryKey].sexes[sexKey]) {
          structure[compId].categories[categoryKey].sexes[sexKey] = {
            title: sexKey === 'H' ? 'Hommes' : sexKey === 'F' ? 'Femmes' : sexKey,
            members: []
          };
        }

        // Ajouter le compétiteur
        structure[compId].categories[categoryKey].sexes[sexKey].members.push({
          member,
          ranking: participation.ranking,
          nb_competitor: participation.nb_competitor
        });
      });
    });

    // Trier les membres dans chaque sexe de chaque catégorie
    Object.values(structure).forEach(compData => {
      Object.values(compData.categories).forEach(category => {
        Object.values(category.sexes).forEach(sex => {
          sex.members.sort((a, b) => {
            if (sortByRanking) {
              // Tri par classement : classés d'abord (par ordre croissant), puis non-classés par ordre alphabétique
              const rankingA = a.ranking || Infinity;
              const rankingB = b.ranking || Infinity;

              if (rankingA !== rankingB) {
                return rankingA - rankingB;
              }
              // Si même classement (ou pas de classement), trier par nom
              return a.member.first_name.localeCompare(b.member.first_name);
            } else {
              // Tri alphabétique par défaut
              return a.member.first_name.localeCompare(b.member.first_name);
            }
          });
        });
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

      Object.values(compHierarchy.categories).forEach(category => {
        Object.entries(category.sexes).forEach(([sexKey, sex]) => {
          const count = sex.members.length;
          if (sexKey === 'H') menCount += count;
          else if (sexKey === 'F') womenCount += count;
          totalCompetitors += count;
        });
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
      <div className="flex justify-between items-center gap-2 no-print flex-wrap">
        <Button
          onClick={() => setSortByRanking(!sortByRanking)}
          variant={sortByRanking ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortByRanking ? "Tri par résultat" : "Tri alphabétique"}
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPNG} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Télécharger le PNG
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
        </div>
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
            if (!compHierarchy || Object.keys(compHierarchy.categories).length === 0) return null;

            const totalParticipants = Object.values(compHierarchy.categories).reduce(
              (sum, category) => sum + Object.values(category.sexes).reduce(
                (sexSum, sex) => sexSum + sex.members.length,
                0
              ),
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
                  <div className="space-y-6">
                    {/* Trier les catégories selon l'ordre défini */}
                    {Object.entries(compHierarchy.categories)
                      .sort(([keyA], [keyB]) => {
                        const indexA = categoryOrder.indexOf(keyA);
                        const indexB = categoryOrder.indexOf(keyB);
                        return indexA - indexB;
                      })
                      .map(([categoryKey, category]) => {
                        const categoryTotal = Object.values(category.sexes).reduce(
                          (sum, sex) => sum + sex.members.length,
                          0
                        );

                        return (
                          <div key={`${comp.id}-${categoryKey}`} className="space-y-3">
                            {/* En-tête de catégorie d'âge */}
                            <div className="flex items-center justify-between border-b pb-2">
                              <span className="font-bold text-base text-primary">{category.title}</span>
                              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                                {categoryTotal} {categoryTotal > 1 ? 'participants' : 'participant'}
                              </span>
                            </div>

                            {/* Groupes par sexe - Affichage en deux colonnes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                              {Object.entries(category.sexes)
                                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                .map(([sexKey, sex]) => (
                                  <div key={`${comp.id}-${categoryKey}-${sexKey}`} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-sm">{sex.title}</span>
                                      <span className="text-xs bg-muted px-2 py-1 rounded">
                                        {sex.members.length} {sex.members.length > 1 ? 'compétiteurs' : 'compétiteur'}
                                      </span>
                                    </div>
                                    <div className="space-y-1 pl-4">
                                      {sex.members.map(({ member, ranking, nb_competitor }) => (
                                        <div
                                          key={member.id}
                                          className="flex items-center justify-between text-sm py-1"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <User
                                              className={`w-3 h-3 flex-shrink-0 ${member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'
                                                }`}
                                            />
                                            <div className="truncate flex-1">
                                              <span
                                                className={`${member.sexe === 'H' ? 'text-blue-600' : 'text-pink-600'
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
                                          <div className="flex-shrink-0 ml-2 overflow-visible">
                                            {ranking ? (
                                              <div className="flex items-center gap-1 font-bold text-primary">
                                                <Medal className="w-3 h-3" />
                                                <span>{ranking}{nb_competitor ? `/${nb_competitor}` : ''}</span>
                                              </div>
                                            ) : (
                                              <CheckCircle2 className="w-4 h-4 text-green-500 inline-block align-middle" />
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      })}
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
