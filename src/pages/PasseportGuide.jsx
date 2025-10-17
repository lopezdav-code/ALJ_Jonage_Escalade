import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, CheckCircle2, Target, TrendingUp, Book, Download } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const PasseportGuide = () => {
  const [selectedPasseport, setSelectedPasseport] = useState('blanc');

  // Read the passport param once on mount to initialize the selected tab.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const param = (params.get('passport') || params.get('passeport') || '').toLowerCase();
      if (param && Object.keys(passeportsData).includes(param)) {
        setSelectedPasseport(param);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passeportsData = {
    blanc: {
      title: 'Passeport Blanc',
      subtitle: 'Je grimpe en moulinette en autonomie sur SAE',
      color: 'from-blue-500 to-blue-600',
      badgeColor: 'bg-white border-2 border-gray-400 text-gray-800',
      emoji: '⚪',
      pdfUrl: '/ALJ_Jonage_Escalade/assets/passeports/passeport-blanc.pdf',
      description: 'Le passeport blanc permet de grimper en moulinette en autonomie sur structure artificielle d\'escalade.',
      objectifs: [
        'Validation sous forme de contrôle continu au fil de la saison',
        'Validation en salle de bloc, en pan, au départ des voies d\'une SAE à corde',
        'Validation en SAE à corde ou site découverte, voies en moulinette',
        'Tests de prise en charge et assurage',
      ],
      categories: [
        {
          name: 'Module éco-responsabilité',
          description: 'Validation sous forme de contrôle continu, au fil de la saison',
          competences: [
            'J\'apporte mes affaires et porte une tenue correcte adaptée à l\'escalade',
            'Je respecte le moniteur',
            'Je respecte l\'activité de mes camarades et ne les distrais pas',
            'Je respecte les installations et les autres utilisateurs de la salle',
            'Je respecte les consignes et les règles',
            'Je suis attentif pendant les explications',
          ]
        },
        {
          name: 'Module bloc',
          description: 'En salle de bloc, en pan, au départ des voies d\'une SAE à corde ou sur des blocs naturels adaptés à l\'initiation',
          competences: [
            'Avant chaque escalade : Je vérifie que la surface de réception n\'est pas encombrée',
            'Dans l\'attente de mon tour, je ne stationne pas sous un bloc',
            'Je ne grimpe jamais au-dessus ou au-dessous d\'un autre grimpeur',
            'Montée-descente : Je repère une voie de descente très facile',
            'Je descends relâché',
            'Montée et saut : J\'amortis de manière tonique la réception d\'un saut (pieds à 20 cm du sol)',
            'Déplacements : Je me déplace avec aisance dans toutes les directions en utilisant des réponses variées',
            'En montée, en dalle, je grimpe à base de poussée d\'une ou 2 jambes (et non de tractions)',
            'En traversée, je mets en œuvre des solutions variées au niveau des pieds',
          ]
        },
        {
          name: 'Module difficulté',
          description: 'En SAE à corde ou site découverte, voies en moulinette. Validation lors d\'un test final.',
          competences: [
            'Test de prise en charge : Je me confie à la corde après avoir vérifié que l\'assureur m\'a pris en charge',
            'Je démontre alors mon aisance (petit saut, pendule…)',
            'Je réussis avec aisance 3 voies sur 4 proposées (niveau 4b) au 1er essai',
            'En progressant à base de poussées de jambes (et non de tractions)',
            'Sans me laisser impressionner par la hauteur',
          ]
        },
        {
          name: 'Module sécurité - Attitude et équipement',
          competences: [
            'Je suis concentré et reste vigilant quand je réalise une technique de sécurité',
            'Je m\'équipe sans aide et sans erreur : sangles non vrillées, au-dessus des vêtements, sangle de taille serrée',
          ]
        },
        {
          name: 'Module sécurité - Avec mon partenaire',
          competences: [
            'Je réalise le nœud en bout de corde',
            'Je contrôle tout bien et j\'attends le feu vert du cadre',
          ]
        },
        {
          name: 'Module sécurité - En situation de grimpeur',
          competences: [
            'Je réalise mon nœud d\'encordement sans aide (huit correctement tressé, nœud d\'arrêt collé)',
            'En haut de voie (ou en cas de pb), je communique avec l\'assureur',
          ]
        },
        {
          name: 'Module sécurité - En situation d\'assureur',
          competences: [
            'Je me place près du mur, légèrement décalé à droite ou à gauche de la voie',
            'J\'installe la corde correctement dans le frein d\'assurage',
            'Je manipule la corde sans hésitation et conserve toujours une main derrière le frein',
            'À la montée, je conserve la corde tendue, sans treuiller mon partenaire',
            'Je descends mon partenaire à vitesse modérée sans laisser la corde filer',
            'Je bloque mon partenaire à la demande sans être déséquilibré',
          ]
        },
      ],
      totalCompetences: 39,
    },
    jaune: {
      title: 'Passeport Jaune',
      subtitle: 'Je grimpe en tête sur SAE',
      color: 'from-yellow-500 to-yellow-600',
      badgeColor: 'bg-yellow-400 text-gray-900',
      emoji: '🟡',
      description: 'Le passeport jaune permet de grimper en tête sur structure artificielle d\'escalade.',
      objectifs: [
        'Validation en salle de bloc avec blocs faciles de niveau 4a',
        'Validation en SAE à corde (ou site découverte), voies en tête de niveau 5b',
        'Test de prise en charge avec blocage au niveau d\'un point d\'ancrage',
        'Contrôle continu pendant la session',
      ],
      categories: [
        {
          name: 'Module éco-responsabilité',
          description: 'Pendant la session',
          competences: [
            'Je préserve l\'intégrité et la propreté de la salle',
            'J\'évite tout gaspillage',
            'Je prends soin du matériel',
            'Je respecte les consignes et les règles',
          ]
        },
        {
          name: 'Module bloc - Principes de sécurité',
          description: 'En salle de bloc, en pan, au départ des voies d\'une SAE à corde ou sur des blocs naturels adaptés à l\'initiation',
          competences: [
            'En salle, je connais et j\'applique les règles de sécurité affichées',
            'Je connais les zones possibles de circulation et de stationnement lorsque je ne grimpe pas',
            'En début de séance : Je vérifie l\'agencement des tapis',
          ]
        },
        {
          name: 'Module bloc - Montée-descente des blocs',
          competences: [
            'Je suis capable d\'apprécier les hauteurs à ne pas dépasser',
            'Je sais anticiper la manière dont je vais chuter et la zone de réception',
            'Je privilégie la désescalade, si possible par un itinéraire de descente',
            'Je monte et redescends 3 blocs faciles',
          ]
        },
        {
          name: 'Module bloc - Saut, réception et réalisation',
          competences: [
            'En SAE, j\'amortis de manière tonique la réception d\'un saut (pieds à 50 cm du sol) et enchaîne avec une chute arrière ou un roulé-boulé',
            'Je réussi des passages induisant des poussées sur une ou deux jambes',
            'Je repère et réalise les passages induisant changements de pied et de main, voire légers croisés de main',
            'En traversée, je mets en œuvre des solutions variées au niveau des pieds',
            'En montée, en dalle, je réalise un passage avec de petites prises pour les mains mais des prises correctes pour les pieds, à base de poussées',
          ]
        },
        {
          name: 'Module difficulté - Test de prise en charge',
          description: 'Le grimpeur en tête se fait bloquer par l\'assureur au niveau d\'un point d\'ancrage',
          competences: [
            'Je communique avec l\'assureur',
            'Je me confie à la corde après avoir vérifié que l\'assureur m\'a pris en charge',
          ]
        },
        {
          name: 'Module difficulté - Voies en tête',
          description: 'Dans 3 voies sur 4 proposées, pas forcément à vue, de niveau 5b et de styles variés',
          competences: [
            'Je réussis avec aisance 3 voies au 1er essai',
            'Sans me laisser impressionner par la hauteur et le risque de chute',
            'En utilisant les mouvements de base (ne pas rester en grimpe main-main-pied-pied)',
          ]
        },
        {
          name: 'Module sécurité - Attitude et partenaire',
          competences: [
            'Je suis concentré et reste vigilant quand je réalise une technique de sécurité',
            'Je réalise le nœud en bout de corde',
            'Je contrôle tout bien et j\'attends le feu vert du cadre',
          ]
        },
        {
          name: 'Module sécurité - En situation de grimpeur',
          competences: [
            'Je fais attention à ne pas laisser ma jambe derrière la corde',
            'Je trouve une position confortable pour mousquetonner',
            'Je mousquetonne toutes les dégaines, dans le bon sens',
            'En haut de voie, je choisis un système de descente libre, place correctement ma corde dedans et communique avec l\'assureur',
          ]
        },
        {
          name: 'Module sécurité - En situation d\'assureur',
          description: 'Pendant le test de prise en charge et l\'assurage des 3-4 voies d\'un partenaire',
          competences: [
            'Je prépare la corde pour qu\'elle vienne sans nœud',
            'Je me place près du mur, légèrement décalé, et après le 3ème point je me recule pour suivre le grimpeur',
            'Je donne la corde et reprend le mou en fonction des besoins du grimpeur',
            'Je bloque mon partenaire au niveau d\'un point d\'ancrage (ou en cas de chute) sans être déséquilibré',
            'En cas de problème, je communique avec le grimpeur',
          ]
        },
      ],
      totalCompetences: 38,
    },
    orange: {
      title: 'Passeport Orange',
      subtitle: 'Je grimpe en autonomie sur SAE',
      color: 'from-orange-500 to-orange-600',
      badgeColor: 'bg-orange-500 text-white',
      emoji: '🟠',
      description: 'Le passeport orange permet de grimper en totale autonomie sur SAE, incluant la gestion des relais.',
      objectifs: [
        'Maîtriser l\'autonomie complète sur SAE',
        'Gérer les relais en sécurité',
        'Préparer une sortie escalade',
        'Connaître la réglementation',
      ],
      categories: [
        {
          name: 'Préparer une sortie SAE',
          competences: [
            'Vérifier l\'état du matériel',
            'Planifier la session',
            'Gérer le matériel collectif',
            'Connaître les règles de la salle',
          ]
        },
        {
          name: 'S\'équiper pour la falaise',
          competences: [
            'Faire un nœud de vache',
            'S\'auto-assurer au relais',
            'Utiliser une longe',
            'Gérer son matériel en hauteur',
          ]
        },
        {
          name: 'Grimper en tête',
          competences: [
            'Optimiser le clippage',
            'Gérer les voies déversantes',
            'Clipper en opposition',
            'Grimper économiquement',
            'Gérer son stress en tête',
          ]
        },
        {
          name: 'Assurer',
          competences: [
            'Assurer avec différents systèmes',
            'Gérer l\'assurage dynamique avancé',
            'Parer efficacement',
            'Communiquer à distance',
          ]
        },
        {
          name: 'Gérer un relais',
          competences: [
            'S\'installer au relais',
            'Faire descendre son partenaire',
            'Faire monter son second',
            'Redescendre en rappel (initiation)',
            'Gérer la corde au relais',
          ]
        },
        {
          name: 'Réglementation et sécurité',
          competences: [
            'Connaître les normes du matériel',
            'Savoir quand réformer son matériel',
            'Connaître les règles de priorité',
            'Gérer une situation d\'urgence',
            'Connaître les gestes de premiers secours',
          ]
        },
      ],
      totalCompetences: 30,
    },
    rouge: {
      title: 'Passeport Rouge',
      subtitle: 'Je grimpe en tête en falaise école',
      color: 'from-red-500 to-red-600',
      badgeColor: 'bg-red-500 text-white',
      emoji: '🔴',
      description: 'Le passeport rouge permet de grimper en tête en falaise école en extérieur.',
      objectifs: [
        'Maîtriser l\'escalade en extérieur',
        'Gérer les spécificités de la falaise',
        'Assurer en milieu naturel',
        'Respecter l\'environnement',
      ],
      categories: [
        {
          name: 'Préparation sortie falaise',
          competences: [
            'Consulter le topo',
            'Vérifier la météo',
            'Préparer le sac à dos',
            'Organiser le transport',
          ]
        },
        {
          name: 'S\'équiper en falaise',
          competences: [
            'S\'encorder en bout de corde',
            'Gérer le matériel en milieu naturel',
            'S\'équiper selon les conditions',
          ]
        },
        {
          name: 'Grimper en falaise',
          competences: [
            'Lire le rocher',
            'Clipper sur dégaines en place',
            'Gérer la peur en extérieur',
            'Grimper sur différents types de roches',
          ]
        },
        {
          name: 'Spécificités de la falaise',
          competences: [
            'Gérer les vires et terrasses',
            'Respecter l\'environnement',
            'Connaître les risques spécifiques',
            'Communiquer en extérieur',
          ]
        },
      ],
      totalCompetences: 15,
    },
  };

  const passeport = passeportsData[selectedPasseport];

  return (
    <ProtectedRoute pageTitle="Guide des passeports">
      <div className="space-y-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Book className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold headline">Guide des Passeports</h1>
          <p className="text-muted-foreground">Découvrez les compétences à maîtriser pour chaque niveau</p>
        </div>
      </div>

      {/* Sélection du passeport */}
      <Tabs value={selectedPasseport} onValueChange={setSelectedPasseport} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="blanc" className="flex items-center gap-2">
            <span className="text-2xl">⚪</span>
            <span>Blanc</span>
          </TabsTrigger>
          <TabsTrigger value="jaune" className="flex items-center gap-2">
            <span className="text-2xl">🟡</span>
            <span>Jaune</span>
          </TabsTrigger>
          <TabsTrigger value="orange" className="flex items-center gap-2">
            <span className="text-2xl">🟠</span>
            <span>Orange</span>
          </TabsTrigger>
          <TabsTrigger value="rouge" className="flex items-center gap-2">
            <span className="text-2xl">🔴</span>
            <span>Rouge</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPasseport} className="space-y-6 mt-6">
          {/* Carte principale */}
          <Card>
            <CardHeader className={`bg-gradient-to-r ${passeport.color} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <span className="text-4xl">{passeport.emoji}</span>
                    {passeport.title}
                  </CardTitle>
                  <CardDescription className="text-white/90 mt-2 text-lg">
                    {passeport.subtitle}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${passeport.badgeColor} text-lg px-4 py-2`}>
                    {passeport.totalCompetences} compétences
                  </Badge>
                  {passeport.pdfUrl && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <a href={passeport.pdfUrl} download="passeport-blanc.pdf" target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                        Télécharger PDF
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Description */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700">{passeport.description}</p>
              </div>

              {/* Objectifs */}
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Objectifs
                </h3>
                <div className="grid gap-2">
                  {passeport.objectifs.map((objectif, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{objectif}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compétences par catégorie */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Compétences à valider
                </h3>
                <div className="space-y-4">
                  {passeport.categories.map((category, catIndex) => (
                    <Card key={catIndex} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="space-y-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Badge variant="outline" className="text-base">
                              {catIndex + 1}
                            </Badge>
                            {category.name}
                          </CardTitle>
                          {category.description && (
                            <p className="text-sm text-gray-600 italic">{category.description}</p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {category.competences.map((competence, compIndex) => (
                            <div
                              key={compIndex}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              </div>
                              <span className="flex-1 text-sm">{competence}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Pied de page avec infos pratiques */}
              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <div className="flex items-start gap-2">
                  <Award className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Comment obtenir ce passeport ?</h4>
                    <p className="text-sm text-amber-800">
                      Pour valider ce passeport, vous devez démontrer la maîtrise de toutes les compétences listées 
                      ci-dessus auprès d'un initiateur ou d'un moniteur du club. La validation est enregistrée dans 
                      votre profil et vous pourrez consulter votre historique à tout moment.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ProtectedRoute>
  );
};

export default PasseportGuide;
