import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, CheckCheck, Award } from 'lucide-react';
import ValidatorCombobox from '@/components/ValidatorCombobox';

const PasseportBlancForm = ({ member, onSave, onCancel }) => {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState(''); // 'bloc' ou 'difficulte'
  const [formData, setFormData] = useState({
    // Informations du grimpeur
    nom: member?.last_name || '',
    prenom: member?.first_name || '',
    module: '', // Nouveau champ pour stocker le module validé
    
    // Compétences techniques
    competences: {
      // Module éco-responsabilité
      apporterAffaires: false,
      respecterMoniteur: false,
      respecterCamarades: false,
      respecterInstallations: false,
      respecterConsignes: false,
      etreAttentif: false,
      
      // Module bloc - Avant chaque escalade
      verifierReception: false,
      nePasStationner: false,
      neJamaisGrimperDessus: false,
      
      // Module bloc - Montée-descente
      repererDescente: false,
      descendreRelache: false,
      
      // Module bloc - Saut et réception
      amortirReception: false,
      
      // Module bloc - Déplacements
      deplacerAisance: false,
      
      // Module bloc - Qualités de réalisation
      grimperPoussee: false,
      solutionsVariees: false,
      
      // Module difficulté - Test prise en charge
      seConfierCorde: false,
      demonstrerAisance: false,
      
      // Module difficulté - Voies
      reussirVoies: false,
      progresserPoussees: false,
      nePasImpressioner: false,
      
      // Module sécurité - Attitude
      etreConcentre: false,
      
      // Module sécurité - Équipement
      equiperSansAide: false,
      
      // Module sécurité - Avec partenaire
      realiserNoeud: false,
      controlerFeuVert: false,
      
      // Module sécurité - Situation grimpeur
      noeudEncordement: false,
      communiquerAssureur: false,
      
      // Module sécurité - Situation assureur
      placerMur: false,
      installerCorde: false,
      manipulerCorde: false,
      conserverCordetendue: false,
      descendreVitesse: false,
      bloquerPartenaire: false,
    },
    
    // Validation
    dateValidation: '',
    validateur: '',
    observations: '',
  });

  const handleCheckboxChange = (category, key) => {
    setFormData(prev => ({
      ...prev,
      competences: {
        ...prev.competences,
        [key]: !prev.competences[key],
      },
    }));
  };

  const handleCheckAllCategory = (categoryItems) => {
    const allChecked = categoryItems.every(item => formData.competences[item.key]);
    
    setFormData(prev => ({
      ...prev,
      competences: {
        ...prev.competences,
        ...categoryItems.reduce((acc, item) => {
          acc[item.key] = !allChecked;
          return acc;
        }, {}),
      },
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedModule) {
      toast({
        title: "Module non sélectionné",
        description: "Veuillez sélectionner un module à valider (Bloc ou Difficulté).",
        variant: "destructive",
      });
      return;
    }
    
    // Filtrer les compétences selon le module sélectionné
    const moduleCompetences = getModuleCompetences(selectedModule);
    const moduleCompetenceKeys = moduleCompetences.flatMap(cat => 
      cat.items ? cat.items.map(item => item.key) : cat.subsections.flatMap(sub => sub.items.map(item => item.key))
    );
    
    // Vérifier que toutes les compétences du module sont validées
    const allValidated = moduleCompetenceKeys.every(key => formData.competences[key] === true);
    
    if (!allValidated) {
      toast({
        title: "Validation incomplète",
        description: `Toutes les compétences du module ${selectedModule === 'bloc' ? 'Bloc' : 'Difficulté'} doivent être validées.`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.dateValidation || !formData.validateur) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez renseigner la date de validation et le nom du validateur.",
        variant: "destructive",
      });
      return;
    }

    // Ajouter le module au formData avant de sauvegarder
    const dataToSave = {
      ...formData,
      module: selectedModule,
    };

    onSave(dataToSave);
    toast({
      title: "Passeport Blanc validé",
      description: `Le module ${selectedModule === 'bloc' ? 'Bloc' : 'Difficulté'} du passeport blanc de ${formData.prenom} ${formData.nom} a été validé avec succès.`,
    });
  };

  const competencesCategories = [
    {
      title: "Module éco-responsabilité",
      subtitle: "Validation sous forme de contrôle continu, au fil de la saison",
      module: 'all', // Disponible pour tous les modules
      items: [
        { key: 'apporterAffaires', label: "J'apporte mes affaires et porte une tenue correcte adaptée à l'escalade" },
        { key: 'respecterMoniteur', label: 'Je respecte le moniteur' },
        { key: 'respecterCamarades', label: "Je respecte l'activité de mes camarades et ne les distrais pas" },
        { key: 'respecterInstallations', label: 'Je respecte les installations et les autres utilisateurs de la salle' },
        { key: 'respecterConsignes', label: 'Je respecte les consignes et les règles' },
        { key: 'etreAttentif', label: 'Je suis attentif pendant les explications' },
      ],
    },
    {
      title: "Module bloc",
      subtitle: "En salle de bloc, en pan, au départ des voies d'une SAE à corde ou sur des blocs naturels adaptés à l'initiation",
      module: 'bloc',
      subsections: [
        {
          subtitle: "1. Avant chaque escalade",
          items: [
            { key: 'verifierReception', label: "Je vérifie que la surface de réception n'est pas encombrée" },
            { key: 'nePasStationner', label: "Dans l'attente de mon tour, je ne stationne pas sous un bloc" },
            { key: 'neJamaisGrimperDessus', label: "Je ne grimpe jamais au-dessus ou au-dessous d'un autre grimpeur" },
          ],
        },
        {
          subtitle: "2. Montée-descente d'un bloc",
          items: [
            { key: 'repererDescente', label: 'Je repère une voie de descente très facile' },
            { key: 'descendreRelache', label: 'Je descends relâché' },
          ],
        },
        {
          subtitle: "3. Montée et saut, réception amortie",
          items: [
            { key: 'amortirReception', label: "J'amortis de manière tonique la réception d'un saut (pieds à 20 cm du sol)" },
          ],
        },
        {
          subtitle: "4. Déplacements en toutes directions (avec une grande densité de prises)",
          items: [
            { key: 'deplacerAisance', label: "En toutes prises, je me déplace avec aisance dans toutes les directions en utilisant des réponses variées (petits pas, grands pas, de face, de profil, m-m-p-p, m-p-m-p…)" },
          ],
        },
        {
          subtitle: "5. Démonstration des qualités de réalisation suivantes",
          items: [
            { key: 'grimperPoussee', label: "En montée, en dalle d'inclinaison positive ou verticale, je grimpe à base de poussée d'une ou 2 jambes (et non de tractions), en 4-3-4 appuis ou moins" },
            { key: 'solutionsVariees', label: "En traversée, en dalle d'inclinaison positive, je mets en œuvre des solutions variées au niveau des pieds (écart-rapprochement, croisé de pied et changement de pied)" },
          ],
        },
      ],
    },
    {
      title: "Module difficulté",
      subtitle: "En SAE à corde ou site découverte, voies en moulinette. Validation lors d'un test final.",
      module: 'difficulte',
      subsections: [
        {
          subtitle: "Test de prise en charge (le grimpeur monte à faible hauteur, se fait prendre en charge par l'assureur et descend assis dans son harnais, relâché)",
          items: [
            { key: 'seConfierCorde', label: "Je me confie à la corde après avoir vérifié que l'assureur m'a pris en charge" },
            { key: 'demonstrerAisance', label: 'Je démontre alors mon aisance (petit saut, pendule…)' },
          ],
        },
        {
          subtitle: "Dans 3 voies sur 4 proposées, de niveau 4b et de styles variés",
          items: [
            { key: 'reussirVoies', label: 'Je réussis avec aisance 3 voies au 1er essai' },
            { key: 'progresserPoussees', label: 'En progressant à base de poussées de jambes (et non de tractions)' },
            { key: 'nePasImpressioner', label: "Sans me laisser impressionner par la hauteur (je continue jusqu'au sommet sans m'arrêter de longs moments pour me rassurer et je ne dépense pas 10 fois plus d'énergie qu'il n'en faudrait…)" },
          ],
        },
      ],
    },
    {
      title: "Module sécurité",
      module: 'all', // Disponible pour tous les modules
      subsections: [
        {
          subtitle: "1. Attitude",
          items: [
            { key: 'etreConcentre', label: 'Je suis concentré et reste vigilant quand je réalise une technique de sécurité' },
          ],
        },
        {
          subtitle: "2. Équipement",
          items: [
            { key: 'equiperSansAide', label: "Je m'équipe sans aide et sans erreur : sangles non vrillées, au-dessus des vêtements, sangle de taille serrée au-dessus des hanches" },
          ],
        },
        {
          subtitle: "3. Avec mon partenaire",
          items: [
            { key: 'realiserNoeud', label: 'Je réalise le nœud en bout de corde' },
            { key: 'controlerFeuVert', label: "Je contrôle tout bien et j'attends le feu vert du cadre" },
          ],
        },
        {
          subtitle: "4. En situation de grimpeur (voir aussi contrôles et feux verts)",
          items: [
            { key: 'noeudEncordement', label: "Je réalise mon nœud d'encordement sans aide en respectant les critères de réussite habituels: la corde passe derrière les bons passants, le huit est correctement tressé et serre les passants, le nœud d'arrêt est collé au 8" },
            { key: 'communiquerAssureur', label: "En haut de voie (ou en cas de pb), je communique avec l'assureur" },
          ],
        },
        {
          subtitle: "5. En situation d'assureur (voir aussi contrôles et feux verts), qualité de l'assurage pendant le test de prise en charge et l'assurage d'un partenaire de même poids",
          items: [
            { key: 'placerMur', label: 'Je me place près du mur, légèrement décalé à droite ou à gauche de la voie' },
            { key: 'installerCorde', label: "J'installe la corde correctement dans le frein d'assurage, attache le mousqueton sur le pontet et verrouille la sécurité du mousqueton" },
            { key: 'manipulerCorde', label: "Je manipule la corde sans hésitation et de manière à toujours conserver une main derrière le frein" },
            { key: 'conserverCordetendue', label: 'À la montée, je conserve la corde tendue, sans treuiller mon partenaire' },
            { key: 'descendreVitesse', label: 'Je descends mon partenaire à vitesse modérée sans laisser la corde filer entre mes mains et en conservant toujours une main derrière le frein' },
            { key: 'bloquerPartenaire', label: 'Je bloque mon partenaire (sensiblement de même poids) à la demande (ou en cas de chute) sans être déséquilibré' },
          ],
        },
      ],
    },
  ];

  // Fonction pour filtrer les compétences par module
  const getModuleCompetences = (module) => {
    if (!module) return [];
    return competencesCategories.filter(cat => cat.module === module || cat.module === 'all');
  };

  // Calculer la progression uniquement pour le module sélectionné
  const displayedCategories = selectedModule ? getModuleCompetences(selectedModule) : [];
  const displayedCompetenceKeys = displayedCategories.flatMap(cat => 
    cat.items ? cat.items.map(item => item.key) : cat.subsections.flatMap(sub => sub.items.map(item => item.key))
  );
  const validationProgress = displayedCompetenceKeys.filter(key => formData.competences[key]).length;
  const totalCompetences = displayedCompetenceKeys.length;
  const allValidated = selectedModule && displayedCompetenceKeys.every(key => formData.competences[key] === true);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            Validation du Passeport Blanc
          </CardTitle>
          <p className="text-sm mt-2 text-blue-100">
            Sélectionnez le module à valider : Bloc (salle de bloc) ou Difficulté (salle d'escalade)
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations du grimpeur */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Informations du grimpeur</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sélection du module */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Sélectionnez le module à valider
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={selectedModule === 'bloc' ? 'default' : 'outline'}
                  className={`h-auto py-6 flex flex-col gap-2 ${
                    selectedModule === 'bloc' ? 'bg-blue-600 hover:bg-blue-700' : ''
                  }`}
                  onClick={() => setSelectedModule('bloc')}
                >
                  <span className="text-2xl">🧗</span>
                  <span className="font-semibold text-base">Module Bloc</span>
                  <span className="text-xs opacity-90">Salle de bloc</span>
                </Button>
                <Button
                  type="button"
                  variant={selectedModule === 'difficulte' ? 'default' : 'outline'}
                  className={`h-auto py-6 flex flex-col gap-2 ${
                    selectedModule === 'difficulte' ? 'bg-blue-600 hover:bg-blue-700' : ''
                  }`}
                  onClick={() => setSelectedModule('difficulte')}
                >
                  <span className="text-2xl">🧗‍♀️</span>
                  <span className="font-semibold text-base">Module Difficulté</span>
                  <span className="text-xs opacity-90">Salle d'escalade à cordes</span>
                </Button>
              </div>
            </div>

            {/* Progression */}
            {selectedModule && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    Progression - Module {selectedModule === 'bloc' ? 'Bloc' : 'Difficulté'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {validationProgress} / {totalCompetences} compétences validées
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      allValidated ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${totalCompetences > 0 ? (validationProgress / totalCompetences) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Compétences à valider */}
            {selectedModule && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Compétences à valider</h3>
              
              {displayedCategories.map((category, idx) => {
                // Collecter tous les items, y compris ceux dans les subsections
                const allCategoryItems = category.items 
                  ? category.items 
                  : category.subsections?.flatMap(sub => sub.items) || [];
                
                const categoryAllChecked = allCategoryItems.every(item => formData.competences[item.key]);
                
                return (
                  <Card key={idx} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-blue-700">{category.title}</h4>
                          <Button
                            type="button"
                            variant={categoryAllChecked ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleCheckAllCategory(allCategoryItems)}
                            className="gap-2"
                          >
                            <CheckCheck className="w-4 h-4" />
                            {categoryAllChecked ? "Tout décocher" : "Tout cocher"}
                          </Button>
                        </div>
                        {category.subtitle && (
                          <p className="text-sm text-gray-600 italic">{category.subtitle}</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cas 1: Catégorie avec items directs */}
                      {category.items && category.items.map((item) => (
                        <div key={item.key} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`competence-${item.key}`}
                            checked={formData.competences[item.key]}
                            onCheckedChange={() => handleCheckboxChange(category.title, item.key)}
                          />
                          <Label
                            htmlFor={`competence-${item.key}`}
                            className={`cursor-pointer flex-1 ${
                              formData.competences[item.key] ? 'text-green-700 line-through' : ''
                            }`}
                          >
                            {item.label}
                          </Label>
                          {formData.competences[item.key] && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                      
                      {/* Cas 2: Catégorie avec subsections */}
                      {category.subsections && category.subsections.map((subsection, subIdx) => (
                        <div key={subIdx} className="space-y-3">
                          <h5 className="font-medium text-blue-600 text-sm mt-2">{subsection.subtitle}</h5>
                          {subsection.items.map((item) => (
                            <div key={item.key} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded ml-4">
                              <Checkbox
                                id={`competence-${item.key}`}
                                checked={formData.competences[item.key]}
                                onCheckedChange={() => handleCheckboxChange(category.title, item.key)}
                              />
                              <Label
                                htmlFor={`competence-${item.key}`}
                                className={`cursor-pointer flex-1 text-sm ${
                                  formData.competences[item.key] ? 'text-green-700 line-through' : ''
                                }`}
                              >
                                {item.label}
                              </Label>
                              {formData.competences[item.key] && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}

            {/* Observations */}
            {selectedModule && (
              <div>
                <Label htmlFor="observations">Observations (optionnel)</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Points forts, axes de progression, remarques..."
                  rows={4}
                />
              </div>
            )}

            {/* Validation finale */}
            {selectedModule && (
              <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Validation finale</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateValidation">Date de validation *</Label>
                  <Input
                    id="dateValidation"
                    type="date"
                    value={formData.dateValidation}
                    onChange={(e) => handleInputChange('dateValidation', e.target.value)}
                    required
                  />
                </div>
                <ValidatorCombobox
                  value={formData.validateur}
                  onChange={(value) => handleInputChange('validateur', value)}
                  required
                />
              </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                className={allValidated ? 'bg-green-600 hover:bg-green-700' : ''}
                disabled={!allValidated || !selectedModule}
              >
                {allValidated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Valider le Module {selectedModule === 'bloc' ? 'Bloc' : 'Difficulté'}
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    {!selectedModule ? 'Sélectionner un module' : 'Compléter toutes les compétences'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasseportBlancForm;
