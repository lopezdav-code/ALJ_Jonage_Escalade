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

const PasseportJauneForm = ({ member, onSave, onCancel }) => {
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
      preserverIntegrite: false,
      eviterGaspillage: false,
      prendreSoinMateriel: false,
      respecterConsignes: false,
      
      // Module bloc - Principes de sécurité
      connaitreRegles: false,
      connaitreZones: false,
      verifierTapis: false,
      
      // Module bloc - Montée-descente
      apprecierHauteurs: false,
      anticiperChute: false,
      privilegierDesescalade: false,
      monterRedescendre: false,
      
      // Module bloc - Saut et réception
      amortirSaut: false,
      
      // Module bloc - Réussite blocs
      reussirPoussees: false,
      repererChangements: false,
      
      // Module bloc - Qualités de réalisation
      solutionsVarieesPieds: false,
      realisationDalle: false,
      
      // Module difficulté - Test prise en charge
      communiquerAssureur: false,
      seConfierCorde: false,
      
      // Module difficulté - Voies
      reussirVoies: false,
      nePasImpressioner: false,
      utiliserMouvements: false,
      
      // Module sécurité - Attitude
      etreConcentre: false,
      
      // Module sécurité - Avec partenaire
      realiserNoeud: false,
      controlerFeuVert: false,
      
      // Module sécurité - Situation grimpeur
      attentionJambe: false,
      trouverPosition: false,
      mousquetonnerDegaines: false,
      choisirDescente: false,
      
      // Module sécurité - Situation assureur
      preparerCorde: false,
      placerMur: false,
      donnerReprendreMou: false,
      bloquerPartenaire: false,
      communiquerProbleme: false,
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
      title: "Passeport Jaune validé",
      description: `Le module ${selectedModule === 'bloc' ? 'Bloc' : 'Difficulté'} du passeport jaune de ${formData.prenom} ${formData.nom} a été validé avec succès.`,
    });
  };

  const competencesCategories = [
    {
      title: "Module éco-responsabilité",
      subtitle: "Pendant la session",
      module: 'all',
      items: [
        { key: 'preserverIntegrite', label: "Je préserve l'intégrité et la propreté de la salle" },
        { key: 'eviterGaspillage', label: "J'évite tout gaspillage" },
        { key: 'prendreSoinMateriel', label: 'Je prends soin du matériel' },
        { key: 'respecterConsignes', label: 'Je respecte les consignes et les règles' },
      ],
    },
    {
      title: "Module bloc",
      subtitle: "En salle de bloc, en pan, au départ des voies d'une SAE à corde ou sur des blocs naturels adaptés à l'initiation. Validation test final : blocs faciles de niveau 4a",
      module: 'bloc',
      subsections: [
        {
          subtitle: "1. Principes généraux de sécurité",
          items: [
            { key: 'connaitreRegles', label: "En salle, je connais et j'applique les règles de sécurité affichées" },
            { key: 'connaitreZones', label: 'Je connais les zones possibles de circulation et de stationnement lorsque je ne grimpe pas' },
          ],
        },
        {
          subtitle: "2. En début de séance (selon la salle)",
          items: [
            { key: 'verifierTapis', label: "Je vérifie l'agencement des tapis" },
          ],
        },
        {
          subtitle: "3. Montée-descente des blocs",
          items: [
            { key: 'apprecierHauteurs', label: 'Je suis capable d\'apprécier les hauteurs à ne pas dépasser' },
            { key: 'anticiperChute', label: 'Je sais anticiper la manière dont je vais chuter et la zone de réception' },
            { key: 'privilegierDesescalade', label: 'Je privilégie la désescalade, si possible par un itinéraire de descente' },
            { key: 'monterRedescendre', label: 'Je monte et redescends 3 blocs faciles' },
          ],
        },
        {
          subtitle: "4. Montée et saut, réception amortie",
          items: [
            { key: 'amortirSaut', label: "En SAE, j'amortis de manière tonique la réception d'un saut (pieds à 50 cm du sol) et enchaîne avec une chute arrière ou un roulé-boulé" },
          ],
        },
        {
          subtitle: "5. Réussite avec aisance de blocs faciles, induisant les réponses suivantes, en montée, dans des passages verticaux",
          items: [
            { key: 'reussirPoussees', label: 'Je réussi des passages induisant des poussées sur une ou deux jambes' },
            { key: 'repererChangements', label: 'Je repère et réalise les passages induisant changements de pied et de main, voire légers croisés de main' },
          ],
        },
        {
          subtitle: "6. Démonstration des qualités de réalisation suivantes",
          items: [
            { key: 'solutionsVarieesPieds', label: "En traversée, dans des passages verticaux, je mets en œuvre des solutions variées au niveau des pieds (écart-rapprochement, croisé de pied et changement de pied)" },
            { key: 'realisationDalle', label: 'En montée, en dalle, je réalise un passage avec de petites prises pour les mains mais des prises correctes pour les pieds, à base de poussées' },
          ],
        },
      ],
    },
    {
      title: "Module difficulté",
      subtitle: "En SAE à corde (ou site découverte), voies en tête",
      module: 'difficulte',
      subsections: [
        {
          subtitle: "Test de prise en charge (le grimpeur en tête se fait bloquer par l'assureur au niveau d'un point d'ancrage)",
          items: [
            { key: 'communiquerAssureur', label: "Je communique avec l'assureur" },
            { key: 'seConfierCorde', label: "Je me confie à la corde après avoir vérifié que l'assureur m'a pris en charge" },
          ],
        },
        {
          subtitle: "Dans 3 voies sur 4 proposées, pas forcément à vue, de niveau 5b et de styles variés",
          items: [
            { key: 'reussirVoies', label: 'Je réussis avec aisance 3 voies au 1er essai' },
            { key: 'nePasImpressioner', label: 'Sans me laisser impressionner par la hauteur et le risque de chute (contre-exemple : serrer les prises, hésiter longuement…)' },
            { key: 'utiliserMouvements', label: 'En utilisant les mouvements de base (ne pas rester en grimpe main-main-pied-pied)' },
          ],
        },
      ],
    },
    {
      title: "Module sécurité",
      module: 'all',
      subsections: [
        {
          subtitle: "1. Attitude",
          items: [
            { key: 'etreConcentre', label: 'Je suis concentré et reste vigilant quand je réalise une technique de sécurité' },
          ],
        },
        {
          subtitle: "2. Avec mon partenaire",
          items: [
            { key: 'realiserNoeud', label: 'Je réalise le nœud en bout de corde' },
            { key: 'controlerFeuVert', label: "Je contrôle tout bien et j'attends le feu vert du cadre" },
          ],
        },
        {
          subtitle: "3. En situation de grimpeur (voir aussi contrôles et feux verts)",
          items: [
            { key: 'attentionJambe', label: 'Je fais attention à ne pas laisser ma jambe derrière la corde' },
            { key: 'trouverPosition', label: 'Je trouve une position confortable pour mousquetonner' },
            { key: 'mousquetonnerDegaines', label: 'Je mousquetonne toutes les dégaines, dans le bon sens' },
            { key: 'choisirDescente', label: 'En haut de voie, je choisis un système de descente libre, place correctement ma corde dedans et communique avec l\'assureur avant de me confier à la corde' },
          ],
        },
        {
          subtitle: "4. En situation d'assureur (voir aussi contrôles et feux verts), pendant le test de prise en charge et l'assurage des 3-4 voies d'un partenaire",
          items: [
            { key: 'preparerCorde', label: 'Je prépare la corde pour qu\'elle vienne sans nœud' },
            { key: 'placerMur', label: 'Je me place près du mur, légèrement décalé à droite ou à gauche de la voie et éventuellement après le 3ème point d\'ancrage, je me recule pour suivre la progression du grimpeur' },
            { key: 'donnerReprendreMou', label: 'Je donne la corde et reprend le mou en fonction des besoins du grimpeur' },
            { key: 'bloquerPartenaire', label: 'Je bloque mon partenaire (sensiblement de même poids) au niveau d\'un point d\'ancrage (ou en cas de chute) sans être déséquilibré' },
            { key: 'communiquerProbleme', label: 'En cas de problème, je communique avec le grimpeur' },
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
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            Validation du Passeport Jaune
          </CardTitle>
          <p className="text-sm mt-2 text-yellow-100">
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
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border-2 border-yellow-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Sélectionnez le module à valider
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={selectedModule === 'bloc' ? 'default' : 'outline'}
                  className={`h-auto py-6 flex flex-col gap-2 ${
                    selectedModule === 'bloc' ? 'bg-yellow-600 hover:bg-yellow-700' : ''
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
                    selectedModule === 'difficulte' ? 'bg-yellow-600 hover:bg-yellow-700' : ''
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
              <div className="bg-yellow-50 p-4 rounded-lg">
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
                      allValidated ? 'bg-green-500' : 'bg-yellow-500'
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
                  <Card key={idx} className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-yellow-700">{category.title}</h4>
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
                          <h5 className="font-medium text-yellow-600 text-sm mt-2">{subsection.subtitle}</h5>
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

export default PasseportJauneForm;
