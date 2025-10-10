import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, CheckCheck } from 'lucide-react';
import ValidatorCombobox from '@/components/ValidatorCombobox';

const PasseportOrangeForm = ({ member, onSave, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    // Informations du grimpeur
    nom: member?.last_name || '',
    prenom: member?.first_name || '',
    
    // Compétences techniques
    competences: {
      // 1. Préparer une sortie en falaise école
      choisirSite: false,
      verifierMeteo: false,
      preparerMateriel: false,
      evaluerNiveau: false,
      planifierSortie: false,
      
      // 2. S'équiper pour grimper en falaise
      choisirEquipement: false,
      controlerMateriel: false,
      enfilerBaudrier: false,
      faireEncordement: false,
      preparerRelais: false,
      
      // 3. Grimper en tête en falaise école
      grimperTete: false,
      clipperCorrectement: false,
      gererCorde: false,
      evaluerItineraire: false,
      gererEffort: false,
      
      // 4. Assurer en falaise
      assurerTete: false,
      gererMou: false,
      pararChute: false,
      installerRelais: false,
      mouflageSecours: false,
      
      // 5. Installer et vérifier un relais
      choisirEmplacement: false,
      installerAnneaux: false,
      triangulation: false,
      verifierSolidite: false,
      communiquerRelais: false,
      
      // 6. Connaître la réglementation et l'environnement
      respecterReglementation: false,
      connaitreAcces: false,
      preserverEnvironnement: false,
      gererDechets: false,
      respecterAutresUsagers: false,
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
    
    // Vérifier que toutes les compétences sont validées
    const allValidated = Object.values(formData.competences).every(val => val === true);
    
    if (!allValidated) {
      toast({
        title: "Validation incomplète",
        description: "Toutes les compétences doivent être validées pour obtenir le passeport orange.",
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

    onSave(formData);
    toast({
      title: "Passeport Orange validé",
      description: `Le passeport orange de ${formData.prenom} ${formData.nom} a été validé avec succès.`,
    });
  };

  const competencesCategories = [
    {
      title: "1. Préparer une sortie en falaise école",
      items: [
        { key: 'choisirSite', label: 'Choisir un site adapté à son niveau' },
        { key: 'verifierMeteo', label: 'Vérifier les conditions météorologiques' },
        { key: 'preparerMateriel', label: 'Préparer le matériel nécessaire (corde, dégaines, casque...)' },
        { key: 'evaluerNiveau', label: 'Évaluer le niveau de difficulté des voies' },
        { key: 'planifierSortie', label: 'Planifier l\'horaire et l\'organisation de la sortie' },
      ],
    },
    {
      title: "2. S'équiper pour grimper en falaise",
      items: [
        { key: 'choisirEquipement', label: 'Choisir l\'équipement adapté (chaussons, baudrier, casque)' },
        { key: 'controlerMateriel', label: 'Contrôler l\'état du matériel avant utilisation' },
        { key: 'enfilerBaudrier', label: 'Enfiler correctement son baudrier et son casque' },
        { key: 'faireEncordement', label: 'Faire son encordement (nœud de huit)' },
        { key: 'preparerRelais', label: 'Préparer ses dégaines et son matériel de relais' },
      ],
    },
    {
      title: "3. Grimper en tête en falaise école",
      items: [
        { key: 'grimperTete', label: 'Grimper en tête sur voie équipée' },
        { key: 'clipperCorrectement', label: 'Clipper correctement dans les dégaines' },
        { key: 'gererCorde', label: 'Gérer sa corde (éviter les frottements, tirage)' },
        { key: 'evaluerItineraire', label: 'Évaluer et choisir son itinéraire' },
        { key: 'gererEffort', label: 'Gérer son effort et ses points de repos' },
      ],
    },
    {
      title: "4. Assurer un grimpeur en falaise",
      items: [
        { key: 'assurerTete', label: 'Assurer un grimpeur en tête' },
        { key: 'gererMou', label: 'Gérer le mou de corde' },
        { key: 'pararChute', label: 'Parer une éventuelle chute' },
        { key: 'installerRelais', label: 'Installer un relais en tête de voie' },
        { key: 'mouflageSecours', label: 'Connaître les techniques de mouflage et secours de base' },
      ],
    },
    {
      title: "5. Installer et vérifier un relais",
      items: [
        { key: 'choisirEmplacement', label: 'Choisir un bon emplacement de relais' },
        { key: 'installerAnneaux', label: 'Installer des anneaux de sangle ou utiliser les points en place' },
        { key: 'triangulation', label: 'Réaliser une triangulation correcte' },
        { key: 'verifierSolidite', label: 'Vérifier la solidité du relais' },
        { key: 'communiquerRelais', label: 'Communiquer clairement lors de l\'installation du relais' },
      ],
    },
    {
      title: "6. Connaître la réglementation et l'environnement",
      items: [
        { key: 'respecterReglementation', label: 'Respecter la réglementation locale (accès, horaires)' },
        { key: 'connaitreAcces', label: 'Connaître les voies d\'accès et parkings' },
        { key: 'preserverEnvironnement', label: 'Préserver l\'environnement naturel' },
        { key: 'gererDechets', label: 'Gérer ses déchets et ne rien laisser sur place' },
        { key: 'respecterAutresUsagers', label: 'Respecter les autres usagers du site' },
      ],
    },
  ];

  const allValidated = Object.values(formData.competences).every(val => val === true);
  const validationProgress = Object.values(formData.competences).filter(val => val).length;
  const totalCompetences = Object.values(formData.competences).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            Validation du Passeport Orange
          </CardTitle>
          <p className="text-sm mt-2 text-orange-100">
            Le passeport orange valide les compétences pour grimper en autonomie sur SAE
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

            {/* Progression */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Progression</span>
                <span className="text-sm text-gray-600">
                  {validationProgress} / {totalCompetences} compétences validées
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    allValidated ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${(validationProgress / totalCompetences) * 100}%` }}
                />
              </div>
            </div>

            {/* Compétences à valider */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">Compétences à valider</h3>
              
              {competencesCategories.map((category, idx) => {
                const categoryAllChecked = category.items.every(item => formData.competences[item.key]);
                
                return (
                  <Card key={idx} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-orange-700">{category.title}</h4>
                        <Button
                          type="button"
                          variant={categoryAllChecked ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleCheckAllCategory(category.items)}
                          className="gap-2"
                        >
                          <CheckCheck className="w-4 h-4" />
                          {categoryAllChecked ? "Tout décocher" : "Tout cocher"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {category.items.map((item) => (
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Commentaire */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label htmlFor="observations">Commentaire (optionnel)</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Ajoutez un commentaire sur la validation (points forts, axes d'amélioration...)"
                rows={3}
              />
            </div>

            {/* Validation finale */}
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

            {/* Boutons d'action */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                className={allValidated ? 'bg-green-600 hover:bg-green-700' : ''}
                disabled={!allValidated}
              >
                {allValidated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Valider le Passeport Orange
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Compléter toutes les compétences
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

export default PasseportOrangeForm;
