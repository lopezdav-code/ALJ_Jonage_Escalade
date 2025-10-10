import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Calendar, User as UserIcon, FileText, Loader2, Award, ArrowLeft, Search, Filter, TrendingUp, Download, X, Eye, Edit, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatName } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PasseportViewer = () => {
  const { isAdmin, isAdherent } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [allValidations, setAllValidations] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [validations, setValidations] = useState([]);
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPasseport, setFilterPasseport] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'table'
  const [isEditing, setIsEditing] = useState(false);
  const [editedValidation, setEditedValidation] = useState(null);

  useEffect(() => {
    fetchMembersAndValidations();
  }, []);

  const fetchMembersAndValidations = async () => {
    setLoading(true);
    try {
      // Charger tous les membres avec passeport
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .not('passeport', 'is', null)
        .order('last_name')
        .order('first_name');

      if (membersError) throw membersError;

      // Charger toutes les validations
      const { data: validationsData, error: validationsError } = await supabase
        .from('passeport_validations')
        .select('*')
        .order('date_validation', { ascending: false });

      if (validationsError) throw validationsError;

      setMembers(membersData || []);
      setAllValidations(validationsData || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchValidations = async (memberId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('passeport_validations')
        .select('*')
        .eq('member_id', memberId)
        .order('date_validation', { ascending: false });

      if (error) throw error;
      setValidations(data || []);
      
      if (data && data.length > 0) {
        setSelectedValidation(data[0]);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les validations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (memberId) => {
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member);
    setValidations([]);
    setSelectedValidation(null);
    if (member) {
      fetchValidations(memberId);
    }
  };

  const handleStartEdit = () => {
    setEditedValidation({ ...selectedValidation });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedValidation(null);
    setIsEditing(false);
  };

  const handleCompetenceChange = (key) => {
    setEditedValidation(prev => ({
      ...prev,
      competences: {
        ...prev.competences,
        [key]: !prev.competences[key],
      },
    }));
  };

  const handleObservationsChange = (value) => {
    setEditedValidation(prev => ({
      ...prev,
      observations: value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('passeport_validations')
        .update({
          competences: editedValidation.competences,
          observations: editedValidation.observations,
        })
        .eq('id', editedValidation.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le passeport a été mis à jour avec succès.",
      });

      // Recharger les validations
      await fetchValidations(selectedMember.id);
      await fetchMembersAndValidations();

      // Mettre à jour la validation sélectionnée
      setSelectedValidation(editedValidation);
      setIsEditing(false);
      setEditedValidation(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le passeport.",
        variant: "destructive",
      });
      console.error('Erreur de mise à jour:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintDiploma = () => {
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les popups ne sont pas bloquées.",
        variant: "destructive",
      });
      return;
    }

    const validation = selectedValidation;
    const member = selectedMember;
    const passeportType = validation.passeport_type.charAt(0).toUpperCase() + validation.passeport_type.slice(1);
    const moduleText = validation.module ? ` - Module ${validation.module === 'bloc' ? 'Bloc' : 'Difficulté'}` : '';
    
    // Calculer le nombre de compétences validées
    const competencesEntries = Object.entries(validation.competences || {});
    const validatedCount = competencesEntries.filter(([_, value]) => value === true).length;
    const totalCount = competencesEntries.length;
    
    // Logo ALJ en SVG pour garantir l'affichage lors de l'impression
    const logoSVG = `<svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <text x="100" y="120" font-family="Arial Black, sans-serif" font-size="80" font-weight="900" text-anchor="middle" fill="#1a1a1a">ALJ</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#666">JONAGE</text>
    </svg>`;
    
    // Générer le contenu HTML du diplôme
    const diplomaHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diplôme Passeport ${passeportType}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 10px;
    }
    
    .diploma {
      background: white;
      width: 210mm;
      height: 297mm;
      padding: 30px 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      border: 15px solid ${validation.passeport_type === 'blanc' ? '#3b82f6' : 
                             validation.passeport_type === 'jaune' ? '#eab308' : 
                             validation.passeport_type === 'orange' ? '#f97316' : '#ef4444'};
      border-image: linear-gradient(135deg, 
        ${validation.passeport_type === 'blanc' ? '#3b82f6, #60a5fa' : 
          validation.passeport_type === 'jaune' ? '#eab308, #fbbf24' : 
          validation.passeport_type === 'orange' ? '#f97316, #fb923c' : '#ef4444, #f87171'}) 1;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .diploma::before {
      content: '';
      position: absolute;
      top: 35px;
      left: 35px;
      right: 35px;
      bottom: 35px;
      border: 2px solid rgba(0,0,0,0.1);
      pointer-events: none;
    }
    
    .logo {
      text-align: center;
      margin-bottom: 15px;
    }
    
    .logo img, .logo svg {
      width: 120px;
      height: auto;
      display: inline-block;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .club-name {
      font-size: 16px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .diploma-title {
      font-size: 42px;
      color: #1a1a1a;
      margin: 15px 0;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      font-style: italic;
    }
    
    .content {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px 0;
    }
    
    .awarded-to {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .recipient-name {
      font-size: 36px;
      color: #1a1a1a;
      font-weight: bold;
      margin: 12px 0;
      border-bottom: 3px solid ${validation.passeport_type === 'blanc' ? '#3b82f6' : 
                                   validation.passeport_type === 'jaune' ? '#eab308' : 
                                   validation.passeport_type === 'orange' ? '#f97316' : '#ef4444'};
      padding-bottom: 8px;
      display: inline-block;
    }
    
    .achievement {
      font-size: 14px;
      color: #444;
      margin: 15px auto;
      max-width: 600px;
      line-height: 1.6;
    }
    
    .details {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 15px auto;
      max-width: 600px;
      text-align: left;
    }
    
    .details-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #1a1a1a;
      text-align: center;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 14px;
      color: #555;
    }
    
    .detail-label {
      font-weight: bold;
      color: #333;
    }
    
    .comments {
      background: #fff9e6;
      padding: 15px;
      border-left: 4px solid ${validation.passeport_type === 'blanc' ? '#3b82f6' : 
                                validation.passeport_type === 'jaune' ? '#eab308' : 
                                validation.passeport_type === 'orange' ? '#f97316' : '#ef4444'};
      margin: 15px auto;
      max-width: 600px;
      border-radius: 5px;
      font-style: italic;
      color: #666;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
    }
    
    .date-section, .signature-section {
      text-align: center;
      flex: 1;
    }
    
    .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .date, .validator-name {
      font-size: 14px;
      color: #1a1a1a;
      font-weight: bold;
    }
    
    .signature {
      font-family: 'Brush Script MT', cursive;
      font-size: 32px;
      color: ${validation.passeport_type === 'blanc' ? '#3b82f6' : 
               validation.passeport_type === 'jaune' ? '#eab308' : 
               validation.passeport_type === 'orange' ? '#f97316' : '#ef4444'};
      margin: 12px 0;
      transform: rotate(-5deg);
      font-weight: bold;
      font-style: italic;
    }
    
    .badge {
      position: absolute;
      top: 30px;
      right: 40px;
      width: 80px;
      height: 80px;
      background: ${validation.passeport_type === 'blanc' ? '#3b82f6' : 
                    validation.passeport_type === 'jaune' ? '#eab308' : 
                    validation.passeport_type === 'orange' ? '#f97316' : '#ef4444'};
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .badge-text {
      font-size: 10px;
      text-transform: uppercase;
    }
    
    .badge-score {
      font-size: 20px;
      margin: 3px 0;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .diploma {
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="diploma">
    <!-- Badge de réussite -->
    <div class="badge">
      <span class="badge-text">Réussite</span>
      <span class="badge-score">${validatedCount}/${totalCount}</span>
    </div>
    
    <!-- Logo -->
    <div class="logo">
      ${logoSVG}
    </div>
    
    <!-- En-tête -->
    <div class="header">
      <div class="club-name">ALJ Escalade Amicalelaique Jonage</div>
      <div class="diploma-title">Diplôme</div>
      <div class="subtitle">Passeport ${passeportType}${moduleText}</div>
    </div>
    
    <!-- Contenu principal -->
    <div class="content">
      <div class="awarded-to">Ce diplôme est décerné à</div>
      <div class="recipient-name">${member.first_name} ${member.last_name}</div>
      
      <div class="achievement">
        En reconnaissance de sa réussite au <strong>Passeport ${passeportType}${moduleText}</strong>
        avec succès, ayant validé <strong>${validatedCount} compétences sur ${totalCount}</strong>
        dans le domaine de l'escalade.
      </div>
      
      <!-- Détails -->
      <div class="details">
        <div class="details-title">Détails de la validation</div>
        <div class="detail-item">
          <span class="detail-label">Niveau :</span>
          <span>Passeport ${passeportType}</span>
        </div>
        ${validation.module ? `
        <div class="detail-item">
          <span class="detail-label">Module :</span>
          <span>${validation.module === 'bloc' ? 'Bloc' : 'Difficulté'}</span>
        </div>
        ` : ''}
        <div class="detail-item">
          <span class="detail-label">Compétences validées :</span>
          <span>${validatedCount} / ${totalCount}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Taux de réussite :</span>
          <span>${Math.round((validatedCount / totalCount) * 100)}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date de validation :</span>
          <span>${new Date(validation.date_validation).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}</span>
        </div>
      </div>
      
      ${validation.observations ? `
      <!-- Commentaires du validateur -->
      <div class="comments">
        <strong>Commentaire du validateur :</strong><br/>
        ${validation.observations}
      </div>
      ` : ''}
    </div>
    
    <!-- Pied de page avec signature -->
    <div class="footer">
      <div class="date-section">
        <div class="label">Fait à Jonage, le</div>
        <div class="date">${new Date(validation.date_validation).toLocaleDateString('fr-FR')}</div>
      </div>
      
      <div class="signature-section">
        <div class="label">Le validateur</div>
        <div class="signature">${validation.validateur}</div>
        <div class="validator-name">${validation.validateur}</div>
      </div>
    </div>
  </div>
  
  <script>
    // Lancer l'impression automatiquement
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(diplomaHTML);
    printWindow.document.close();
  };

  const getPasseportColor = (type) => {
    const colors = {
      blanc: 'from-blue-500 to-blue-600',
      jaune: 'from-yellow-500 to-yellow-600',
      orange: 'from-orange-500 to-orange-600',
      rouge: 'from-red-500 to-red-600',
    };
    return colors[type?.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

  const getPasseportBadgeColor = (type) => {
    const colors = {
      blanc: 'bg-white border-2 border-gray-400 text-gray-800',
      jaune: 'bg-yellow-400 text-gray-900',
      orange: 'bg-orange-500 text-white',
      rouge: 'bg-red-500 text-white',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-400 text-white';
  };

  // Retourne les catégories de compétences selon le type de passeport et le module
  const getCompetencesStructure = (passeportType, module) => {
    const type = passeportType?.toLowerCase();
    
    if (type === 'blanc') {
      const categories = [
        {
          title: "Module éco-responsabilité",
          items: [
            { key: 'apporterAffaires', label: "J'apporte mes affaires et porte une tenue correcte adaptée à l'escalade" },
            { key: 'respecterMoniteur', label: 'Je respecte le moniteur' },
            { key: 'respecterCamarades', label: "Je respecte l'activité de mes camarades et ne les distrais pas" },
            { key: 'respecterInstallations', label: 'Je respecte les installations et les autres utilisateurs de la salle' },
            { key: 'respecterConsignes', label: 'Je respecte les consignes et les règles' },
            { key: 'etreAttentif', label: 'Je suis attentif pendant les explications' },
          ],
        },
      ];

      if (module === 'bloc') {
        categories.push({
          title: "Module bloc",
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
              subtitle: "4. Déplacements en toutes directions",
              items: [
                { key: 'deplacerAisance', label: "En toutes prises, je me déplace avec aisance dans toutes les directions" },
              ],
            },
            {
              subtitle: "5. Démonstration des qualités de réalisation",
              items: [
                { key: 'grimperPoussee', label: "En montée, je grimpe à base de poussée d'une ou 2 jambes" },
                { key: 'solutionsVariees', label: "En traversée, je mets en œuvre des solutions variées au niveau des pieds" },
              ],
            },
          ],
        });
      }

      if (module === 'difficulte') {
        categories.push({
          title: "Module difficulté",
          subsections: [
            {
              subtitle: "Test de prise en charge",
              items: [
                { key: 'seConfierCorde', label: "Je me confie à la corde après avoir vérifié que l'assureur m'a pris en charge" },
                { key: 'demonstrerAisance', label: 'Je démontre alors mon aisance (petit saut, pendule…)' },
              ],
            },
            {
              subtitle: "Dans 3 voies sur 4 proposées",
              items: [
                { key: 'reussirVoies', label: 'Je réussis avec aisance 3 voies au 1er essai' },
                { key: 'progresserPoussees', label: 'En progressant à base de poussées de jambes' },
                { key: 'nePasImpressioner', label: "Sans me laisser impressionner par la hauteur" },
              ],
            },
          ],
        });
      }

      categories.push({
        title: "Module sécurité",
        subsections: [
          {
            subtitle: "1. Attitude",
            items: [
              { key: 'etreConcentre', label: 'Je suis concentré et reste vigilant' },
            ],
          },
          {
            subtitle: "2. Équipement",
            items: [
              { key: 'equiperSansAide', label: "Je m'équipe sans aide et sans erreur" },
            ],
          },
          {
            subtitle: "3. Avec mon partenaire",
            items: [
              { key: 'realiserNoeud', label: 'Je réalise le nœud en bout de corde' },
              { key: 'controlerFeuVert', label: "Je contrôle tout bien et j'attends le feu vert" },
            ],
          },
          {
            subtitle: "4. En situation de grimpeur",
            items: [
              { key: 'noeudEncordement', label: "Je réalise mon nœud d'encordement sans aide" },
              { key: 'communiquerAssureur', label: "En haut de voie, je communique avec l'assureur" },
            ],
          },
          {
            subtitle: "5. En situation d'assureur",
            items: [
              { key: 'mousquetonnerAppareil', label: "Je mousquetonne l'appareil au pontet ventral" },
              { key: 'installerCorde', label: "J'installe la corde dans l'appareil" },
              { key: 'avoirMainAval', label: "J'ai ma main aval en aval de l'appareil" },
              { key: 'assurerVoieMoulinette', label: "J'assure une voie en moulinette" },
            ],
          },
        ],
      });

      return categories;
    }

    if (type === 'jaune') {
      const categories = [
        {
          title: "Module éco-responsabilité",
          items: [
            { key: 'preserverIntegrite', label: "Je préserve l'intégrité du lieu de pratique" },
            { key: 'eviterGaspillage', label: "J'évite le gaspillage de matériel" },
            { key: 'prendreSoinMateriel', label: 'Je prends soin du matériel' },
            { key: 'respecterConsignes', label: 'Je respecte les consignes' },
          ],
        },
      ];

      if (module === 'bloc') {
        categories.push({
          title: "Module bloc",
          subsections: [
            {
              subtitle: "Principes de sécurité",
              items: [
                { key: 'connaitreRegles', label: 'Je connais les règles de sécurité' },
                { key: 'connaitreZones', label: 'Je connais les zones interdites' },
                { key: 'verifierTapis', label: 'Je vérifie les tapis de réception' },
              ],
            },
            {
              subtitle: "Montée-descente",
              items: [
                { key: 'apprecierHauteurs', label: "J'apprécie les hauteurs en fonction de ma capacité" },
                { key: 'anticiperChute', label: "J'anticipe la chute et le retour au sol" },
                { key: 'privilegierDesescalade', label: 'Je privilégie la désescalade' },
                { key: 'monterRedescendre', label: 'Je monte et redescends en contrôle' },
              ],
            },
            {
              subtitle: "Saut et réception",
              items: [
                { key: 'amortirSaut', label: "J'amortis le saut de manière tonique" },
              ],
            },
            {
              subtitle: "Réussite blocs",
              items: [
                { key: 'reussirPoussees', label: 'Je réussis des blocs à base de poussées' },
                { key: 'repererChangements', label: 'Je repère les changements de direction' },
              ],
            },
            {
              subtitle: "Qualités de réalisation",
              items: [
                { key: 'solutionsVarieesPieds', label: 'Je mets en œuvre des solutions variées (pieds)' },
                { key: 'realisationDalle', label: 'Je réalise des déplacements en dalle' },
              ],
            },
          ],
        });
      }

      if (module === 'difficulte') {
        categories.push({
          title: "Module difficulté",
          subsections: [
            {
              subtitle: "Test prise en charge",
              items: [
                { key: 'communiquerAssureur', label: "Je communique avec l'assureur" },
                { key: 'seConfierCorde', label: 'Je me confie à la corde' },
              ],
            },
            {
              subtitle: "Voies",
              items: [
                { key: 'reussirVoies', label: 'Je réussis des voies avec aisance' },
                { key: 'nePasImpressioner', label: 'Je ne me laisse pas impressionner par la hauteur' },
                { key: 'utiliserMouvements', label: "J'utilise des mouvements variés" },
              ],
            },
          ],
        });
      }

      categories.push({
        title: "Module sécurité",
        subsections: [
          {
            subtitle: "Attitude",
            items: [
              { key: 'etreConcentre', label: 'Je suis concentré sur la sécurité' },
            ],
          },
          {
            subtitle: "Avec partenaire",
            items: [
              { key: 'realiserNoeud', label: 'Je réalise le nœud en bout de corde' },
              { key: 'controlerFeuVert', label: "Je contrôle et j'attends le feu vert" },
            ],
          },
          {
            subtitle: "Situation grimpeur",
            items: [
              { key: 'attentionJambe', label: 'Je fais attention à ma jambe libre' },
              { key: 'trouverPosition', label: 'Je trouve une position de repos' },
              { key: 'mousquetonnerDegaines', label: 'Je mousquetonne les dégaines' },
              { key: 'choisirDescente', label: 'Je choisis ma descente' },
            ],
          },
          {
            subtitle: "Situation assureur",
            items: [
              { key: 'preparerCorde', label: 'Je prépare la corde' },
              { key: 'placerMur', label: 'Je me place par rapport au mur' },
              { key: 'donnerReprendreMou', label: 'Je donne et reprends le mou' },
              { key: 'bloquerPartenaire', label: 'Je bloque mon partenaire' },
              { key: 'communiquerProbleme', label: 'Je communique en cas de problème' },
            ],
          },
        ],
      });

      return categories;
    }

    if (type === 'orange') {
      return [
        {
          title: "1. Préparer une sortie en falaise école",
          items: [
            { key: 'choisirSite', label: 'Choisir un site adapté à son niveau' },
            { key: 'verifierMeteo', label: 'Vérifier les conditions météorologiques' },
            { key: 'preparerMateriel', label: 'Préparer le matériel nécessaire' },
            { key: 'evaluerNiveau', label: 'Évaluer le niveau de difficulté des voies' },
            { key: 'planifierSortie', label: "Planifier l'horaire et l'organisation" },
          ],
        },
        {
          title: "2. S'équiper pour grimper en falaise",
          items: [
            { key: 'choisirEquipement', label: "Choisir l'équipement adapté" },
            { key: 'controlerMateriel', label: "Contrôler l'état du matériel" },
            { key: 'enfilerBaudrier', label: 'Enfiler correctement son baudrier et casque' },
            { key: 'faireEncordement', label: "Faire son encordement (nœud de huit)" },
          ],
        },
        {
          title: "3. Grimper en tête en falaise école",
          items: [
            { key: 'choisirVoie', label: 'Choisir une voie adaptée' },
            { key: 'evaluerDifficulte', label: 'Évaluer la difficulté' },
            { key: 'progresserFluidite', label: 'Progresser avec fluidité' },
            { key: 'gererEffort', label: "Gérer son effort et son stress" },
            { key: 'mousquetonnerSecurite', label: 'Mousquetonner en sécurité' },
            { key: 'gererChute', label: 'Gérer une chute en tête' },
          ],
        },
        {
          title: "4. Assurer un grimpeur en tête",
          items: [
            { key: 'installerSysteme', label: "Installer le système d'assurage" },
            { key: 'controlerEncordement', label: "Contrôler l'encordement" },
            { key: 'gererCorde', label: 'Gérer la corde pendant la montée' },
            { key: 'assurerChute', label: 'Assurer une chute dynamique' },
            { key: 'ravaleCorde', label: 'Ravaler la corde à la descente' },
          ],
        },
        {
          title: "5. Installer un relais",
          items: [
            { key: 'choisirRelais', label: 'Choisir un relais adapté' },
            { key: 'seVacher', label: 'Se vacher correctement' },
            { key: 'installerMouflage', label: 'Installer un système de mouflage si besoin' },
            { key: 'rapatrierCorde', label: 'Rapatrier la corde' },
          ],
        },
        {
          title: "6. Descendre en rappel",
          items: [
            { key: 'installerRappel', label: 'Installer le matériel de rappel' },
            { key: 'controlerInstallation', label: "Contrôler l'installation" },
            { key: 'descendreControle', label: 'Descendre en contrôle' },
            { key: 'recupererCorde', label: 'Récupérer la corde' },
          ],
        },
      ];
    }

    return [];
  };

  // Computed values - Filtrer les membres selon recherche et filtres
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Recherche par nom/prénom
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        if (!fullName.includes(searchLower)) return false;
      }

      // Filtre par niveau de passeport
      if (filterPasseport !== 'all') {
        if (member.passeport !== filterPasseport) return false;
      }

      // Filtre par module (vérifier dans les validations du membre)
      if (filterModule !== 'all') {
        const memberValidations = allValidations.filter(v => v.member_id === member.id);
        const hasModule = memberValidations.some(v => v.module === filterModule);
        if (!hasModule) return false;
      }

      return true;
    });
  }, [members, searchQuery, filterPasseport, filterModule, allValidations]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalValidations = allValidations.length;
    const byPasseport = {
      blanc: allValidations.filter(v => v.passeport_type === 'blanc').length,
      jaune: allValidations.filter(v => v.passeport_type === 'jaune').length,
      orange: allValidations.filter(v => v.passeport_type === 'orange').length,
    };
    const byModule = {
      bloc: allValidations.filter(v => v.module === 'bloc').length,
      difficulte: allValidations.filter(v => v.module === 'difficulte').length,
      none: allValidations.filter(v => !v.module).length,
    };

    return { totalValidations, byPasseport, byModule };
  }, [allValidations]);

  if (!isAdherent && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Accès réservé aux membres du club</p>
      </div>
    );
  }

  if (loading && !selectedMember) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Vue détail d'une validation
  if (selectedValidation) {
    const currentValidation = isEditing ? editedValidation : selectedValidation;
    const competencesEntries = Object.entries(currentValidation.competences || {});
    const validatedCount = competencesEntries.filter(([_, value]) => value === true).length;
    const totalCount = competencesEntries.length;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => {
            setSelectedValidation(null);
            setIsEditing(false);
            setEditedValidation(null);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>

          <div className="flex gap-2">
            {!isEditing && (
              <Button onClick={handlePrintDiploma} className="bg-purple-600 hover:bg-purple-700">
                <Printer className="w-4 h-4 mr-2" />
                Imprimer le diplôme
              </Button>
            )}

            {isAdmin && !isEditing && (
              <Button onClick={handleStartEdit} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="w-4 h-4 mr-2" />
                Éditer le passeport
              </Button>
            )}

            {isEditing && (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Mode édition :</strong> Vous pouvez modifier les compétences validées et le commentaire. Les modifications seront enregistrées dans la base de données.
            </p>
          </div>
        )}

        <Card>
          <CardHeader className={`bg-gradient-to-r ${getPasseportColor(selectedValidation.passeport_type)} text-white`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="w-8 h-8" />
                Passeport {selectedValidation.passeport_type.charAt(0).toUpperCase() + selectedValidation.passeport_type.slice(1)}
                {selectedValidation.module && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                    Module: {selectedValidation.module === 'bloc' ? '🧗 Bloc' : '🧗‍♀️ Difficulté'}
                  </Badge>
                )}
              </CardTitle>
              <Badge className={getPasseportBadgeColor(selectedValidation.passeport_type)}>
                {validatedCount}/{totalCount} compétences
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Informations du grimpeur */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Informations du grimpeur</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="font-medium">{selectedMember.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prénom</p>
                  <p className="font-medium">{selectedMember.first_name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Club</p>
                  <p className="font-medium">Association Lyonnaise de Jonage Escalade</p>
                </div>
              </div>
            </div>

            {/* Informations de validation */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de validation</p>
                    <p className="font-semibold">
                      {new Date(selectedValidation.date_validation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Validateur</p>
                    <p className="font-semibold">{selectedValidation.validateur}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compétences validées */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Compétences validées ({validatedCount}/{totalCount})</h3>
              
              {getCompetencesStructure(currentValidation.passeport_type, currentValidation.module).map((category, catIndex) => (
                <div key={catIndex} className="mb-6">
                  <h4 className="font-semibold text-md mb-3 text-primary flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {category.title}
                  </h4>
                  
                  {/* Catégorie avec items directs (sans subsections) */}
                  {category.items && (
                    <div className="space-y-2 ml-6">
                      {category.items.map((item) => {
                        const isValidated = currentValidation.competences[item.key] === true;
                        return (
                          <div 
                            key={item.key} 
                            className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${isEditing ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            onClick={() => isEditing && handleCompetenceChange(item.key)}
                          >
                            {isEditing ? (
                              <Checkbox
                                checked={isValidated}
                                onCheckedChange={() => handleCompetenceChange(item.key)}
                                className="mt-0.5"
                              />
                            ) : (
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                isValidated ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                {isValidated && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                            )}
                            <span className={`flex-1 text-sm ${isValidated ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Catégorie avec subsections */}
                  {category.subsections && (
                    <div className="space-y-4 ml-6">
                      {category.subsections.map((subsection, subIndex) => (
                        <div key={subIndex}>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">{subsection.subtitle}</h5>
                          <div className="space-y-2">
                            {subsection.items.map((item) => {
                              const isValidated = currentValidation.competences[item.key] === true;
                              return (
                                <div 
                                  key={item.key} 
                                  className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${isEditing ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                  onClick={() => isEditing && handleCompetenceChange(item.key)}
                                >
                                  {isEditing ? (
                                    <Checkbox
                                      checked={isValidated}
                                      onCheckedChange={() => handleCompetenceChange(item.key)}
                                      className="mt-0.5"
                                    />
                                  ) : (
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                      isValidated ? 'bg-green-500' : 'bg-gray-300'
                                    }`}>
                                      {isValidated && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                  )}
                                  <span className={`flex-1 text-sm ${isValidated ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Commentaire */}
            {(currentValidation.observations || isEditing) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Commentaire</h3>
                    {isEditing ? (
                      <Textarea
                        value={currentValidation.observations || ''}
                        onChange={(e) => handleObservationsChange(e.target.value)}
                        placeholder="Ajoutez un commentaire sur la validation (points forts, axes d'amélioration...)"
                        rows={4}
                        className="bg-white"
                      />
                    ) : (
                      <p className="text-sm text-gray-700">{currentValidation.observations}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue principale avec recherche, filtres et liste
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Award className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold headline">Consultation des Passeports</h1>
          <p className="text-muted-foreground">Consultez les passeports validés et suivez la progression des membres</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Validations</p>
                <p className="text-2xl font-bold">{stats.totalValidations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-white border-2 border-gray-400 text-gray-800">Blanc</Badge>
              <div>
                <p className="text-xs text-muted-foreground">Passeports Blancs</p>
                <p className="text-2xl font-bold">{stats.byPasseport.blanc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-yellow-400 text-gray-900">Jaune</Badge>
              <div>
                <p className="text-xs text-muted-foreground">Passeports Jaunes</p>
                <p className="text-2xl font-bold">{stats.byPasseport.jaune}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-500 text-white">Orange</Badge>
              <div>
                <p className="text-xs text-muted-foreground">Passeports Orange</p>
                <p className="text-2xl font-bold">{stats.byPasseport.orange}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Recherche et filtres
          </CardTitle>
          <CardDescription>
            Trouvez rapidement un membre et filtrez par niveau ou module
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche par nom */}
            <div className="md:col-span-1">
              <Label htmlFor="search">Rechercher par nom</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Nom ou prénom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtre par passeport */}
            <div>
              <Label htmlFor="filter-passeport">Niveau de passeport</Label>
              <Select value={filterPasseport} onValueChange={setFilterPasseport}>
                <SelectTrigger id="filter-passeport">
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="blanc">⚪ Blanc</SelectItem>
                  <SelectItem value="jaune">🟡 Jaune</SelectItem>
                  <SelectItem value="orange">🟠 Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par module */}
            <div>
              <Label htmlFor="filter-module">Module</Label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger id="filter-module">
                  <SelectValue placeholder="Tous les modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  <SelectItem value="bloc">🧗 Bloc</SelectItem>
                  <SelectItem value="difficulte">🧗‍♀️ Difficulté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Résumé des résultats */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>{filteredMembers.length} membre(s) trouvé(s)</span>
          </div>
        </CardContent>
      </Card>

      {/* Liste des membres avec leurs passeports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const memberValidations = allValidations.filter(v => v.member_id === member.id);
          const latestValidation = memberValidations[0];
          const modulesValidated = {
            bloc: memberValidations.some(v => v.module === 'bloc'),
            difficulte: memberValidations.some(v => v.module === 'difficulte'),
          };

          return (
            <Card 
              key={member.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleMemberSelect(member.id)}
            >
              <CardHeader className={`bg-gradient-to-r ${getPasseportColor(member.passeport?.toLowerCase())} text-white`}>
                <CardTitle className="flex items-center justify-between">
                  <span>{member.last_name} {member.first_name}</span>
                  <Badge className={getPasseportBadgeColor(member.passeport?.toLowerCase())}>
                    {member.passeport}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Modules validés */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Modules validés</p>
                  <div className="flex gap-2">
                    <Badge 
                      variant={modulesValidated.bloc ? "default" : "outline"}
                      className={modulesValidated.bloc ? "bg-green-500" : ""}
                    >
                      🧗 Bloc {modulesValidated.bloc && '✓'}
                    </Badge>
                    <Badge 
                      variant={modulesValidated.difficulte ? "default" : "outline"}
                      className={modulesValidated.difficulte ? "bg-green-500" : ""}
                    >
                      🧗‍♀️ Difficulté {modulesValidated.difficulte && '✓'}
                    </Badge>
                  </div>
                </div>

                {/* Nombre de validations */}
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="font-semibold">{memberValidations.length}</span> validation(s)
                  </p>
                </div>

                {/* Dernière validation */}
                {latestValidation && (
                  <div className="text-xs text-muted-foreground">
                    Dernière validation: {new Date(latestValidation.date_validation).toLocaleDateString('fr-FR')}
                  </div>
                )}

                {/* Bouton détails */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMemberSelect(member.id);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Voir les détails
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message si aucun résultat */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Aucun membre ne correspond aux critères de recherche</p>
          </CardContent>
        </Card>
      )}

      {/* Vue sélection membre avec historique */}
      {selectedMember && validations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Historique de {selectedMember.first_name} {selectedMember.last_name}
            </CardTitle>
            <CardDescription>
              Cliquez sur une validation pour voir les détails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {validations.map((validation) => (
                <div
                  key={validation.id}
                  onClick={() => setSelectedValidation(validation)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getPasseportBadgeColor(validation.passeport_type)}>
                      {validation.passeport_type}
                    </Badge>
                    {validation.module && (
                      <Badge variant="outline">
                        {validation.module === 'bloc' ? '🧗 Bloc' : '🧗‍♀️ Difficulté'}
                      </Badge>
                    )}
                    <span className="text-sm">
                      {new Date(validation.date_validation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PasseportViewer;
