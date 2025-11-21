import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BackButton } from '@/components/ui/back-button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Upload,
  Loader2,
  Trash2,
  FileSpreadsheet,
  Search,
  Printer,
  CheckCircle2,
  XCircle,
  Download,
  Plus,
  Edit2,
  X as IconX,
  RotateCw,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const CompetitionManagement = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterPrinted, setFilterPrinted] = useState('all'); // 'all', 'printed', 'notPrinted'
  const [filterHoraire, setFilterHoraire] = useState('all'); // 'all', 'matin', 'après-midi'
  const [filterTypeInscription, setFilterTypeInscription] = useState('all'); // 'all', 'Compétition', 'Buvette'
  const [filterFileName, setFilterFileName] = useState('all'); // 'all' ou nom du fichier
  const [filterClub, setFilterClub] = useState('all'); // 'all' ou nom du club
  const [filterUnmappedClubs, setFilterUnmappedClubs] = useState(false); // true pour voir seulement les clubs non mappés
  const [filterSexe, setFilterSexe] = useState('all'); // 'all', 'H', 'F', 'empty'
  const [editingClubId, setEditingClubId] = useState(null);
  const [editingClubValue, setEditingClubValue] = useState('');
  const [editingSexeId, setEditingSexeId] = useState(null);
  const [editingSexeValue, setEditingSexeValue] = useState('');
  const [detailsId, setDetailsId] = useState(null);

  // Statistiques des compétiteurs
  const [competitorStats, setCompetitorStats] = useState({
    bySexe: [],
    byAgeCategory: [],
    byHoraire: [],
    combined: null
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Mappings dynamiques depuis la BDD
  const [clubMappings, setClubMappings] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(true);
  const [showAddMappingModal, setShowAddMappingModal] = useState(false);
  const [newMappingOriginal, setNewMappingOriginal] = useState('');
  const [newMappingMapped, setNewMappingMapped] = useState('');
  const [unmappedClubsFromImport, setUnmappedClubsFromImport] = useState([]);
  const [editingMappingId, setEditingMappingId] = useState(null);
  const [editingMappingOriginal, setEditingMappingOriginal] = useState('');
  const [editingMappingMapped, setEditingMappingMapped] = useState('');
  const [filterUnknownMappings, setFilterUnknownMappings] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Options pour l'export PDF
  const [pdfFormat, setPdfFormat] = useState('a5'); // 'a4' ou 'a5'
  const [pdfOrientation, setPdfOrientation] = useState('portrait'); // 'portrait' ou 'landscape'
  const [pdfCardsPerPage, setPdfCardsPerPage] = useState(1); // 1 ou 2
  const [showPdfOptions, setShowPdfOptions] = useState(false);

  // Charger les inscriptions
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select('*')
        .order('numero_dossart', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les inscriptions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les mappings de clubs depuis la BDD
  const loadClubMappings = async () => {
    setMappingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_mapping')
        .select('*')
        .order('original_name', { ascending: true });

      if (error) throw error;
      setClubMappings(data || []);
    } catch (error) {
      console.error('Error loading club mappings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les mappings des clubs.",
        variant: "destructive"
      });
    } finally {
      setMappingsLoading(false);
    }
  };

  // Charger les statistiques des compétiteurs
  const loadCompetitorStats = async () => {
    setStatsLoading(true);
    try {
      // Statistiques par sexe
      const { data: sexeData, error: sexeError } = await supabase
        .from('competition_registrations')
        .select('sexe')
        .eq('type_inscription', 'Compétition');

      if (sexeError) throw sexeError;

      // Statistiques par catégorie d'âge
      const { data: ageData, error: ageError } = await supabase
        .from('competition_registrations')
        .select('categorie_age')
        .eq('type_inscription', 'Compétition');

      if (ageError) throw ageError;

      // Statistiques par horaire
      const { data: horaireData, error: horaireError } = await supabase
        .from('competition_registrations')
        .select('horaire')
        .eq('type_inscription', 'Compétition');

      if (horaireError) throw horaireError;

      // Traiter les données de sexe
      const sexeMap = {};
      sexeData?.forEach(reg => {
        const label = reg.sexe === 'H' ? 'Homme' : reg.sexe === 'F' ? 'Femme' : 'Vide';
        sexeMap[label] = (sexeMap[label] || 0) + 1;
      });
      const sexeStats = [
        { label: 'Homme', count: sexeMap['Homme'] || 0 },
        { label: 'Femme', count: sexeMap['Femme'] || 0 },
        { label: 'Vide', count: sexeMap['Vide'] || 0 }
      ];

      // Traiter les données de catégorie d'âge
      const ageOrder = ['U11', 'U13', 'U15', 'U17', 'U19', 'Sénior', 'Vétéran 1', 'Vétéran 2'];
      const ageMap = {};
      ageData?.forEach(reg => {
        const label = reg.categorie_age || 'Vide';
        ageMap[label] = (ageMap[label] || 0) + 1;
      });
      const ageStats = ageOrder.map(cat => ({
        label: cat,
        count: ageMap[cat] || 0
      })).concat(ageMap['Vide'] ? [{ label: 'Vide', count: ageMap['Vide'] }] : []);

      // Traiter les données d'horaire
      const horaireMap = {};
      horaireData?.forEach(reg => {
        const label = reg.horaire === 'matin' ? 'Matin' : reg.horaire === 'après-midi' ? 'Après-midi' : 'Vide';
        horaireMap[label] = (horaireMap[label] || 0) + 1;
      });
      const horaireStats = [
        { label: 'Matin', count: horaireMap['Matin'] || 0 },
        { label: 'Après-midi', count: horaireMap['Après-midi'] || 0 },
        { label: 'Vide', count: horaireMap['Vide'] || 0 }
      ];

      setCompetitorStats({
        bySexe: sexeStats,
        byAgeCategory: ageStats,
        byHoraire: horaireStats,
        total: (sexeData?.length || 0)
      });
    } catch (error) {
      console.error('Error loading competitor statistics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques.",
        variant: "destructive"
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Convertir le sexe depuis le format Excel au format BDD
  const convertSexeFormat = (sexeValue) => {
    try {
      if (sexeValue === null || sexeValue === undefined || sexeValue === '') return null;
      const sexeStr = String(sexeValue).trim().toLowerCase();

      if (sexeStr === 'masculin' || sexeStr === 'homme' || sexeStr === 'h' || sexeStr === 'm') {
        return 'H';
      } else if (sexeStr === 'féminin' || sexeStr === 'feminin' || sexeStr === 'femme' || sexeStr === 'f') {
        return 'F';
      } else if (sexeStr === 'mixte' || sexeStr === 'mix' || sexeStr === 'autre') {
        return null; // Pas de genre spécifié pour mixte
      }
      return null;
    } catch (error) {
      console.warn('Erreur lors de la conversion du sexe:', error);
      return null;
    }
  };

  // Mapper un club selon la BDD
  const mapClubName = (clubName) => {
    if (!clubName) return clubName;
    const trimmed = String(clubName).trim();
    const mapping = clubMappings.find(m => m.original_name === trimmed);
    return mapping ? mapping.mapped_name : trimmed;
  };

  // Vérifier si un club est mappé
  const isClubMapped = (clubName) => {
    if (!clubName) return false;
    const trimmed = String(clubName).trim();
    // Un club est mappé s'il existe comme original_name (non mappé mais dans la table)
    // OU comme mapped_name (déjà mappé dans les inscriptions)
    return clubMappings.some(m => m.original_name === trimmed || m.mapped_name === trimmed);
  };

  // Ajouter ou modifier un mapping
  const saveClubMapping = async (originalName, mappedName) => {
    if (!originalName.trim() || !mappedName.trim()) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    try {
      if (isEditingMode && editingMappingId) {
        // Mode édition: mettre à jour le mapping
        const { error } = await supabase
          .from('club_mapping')
          .update({ mapped_name: mappedName.trim() })
          .eq('id', editingMappingId);

        if (error) throw error;

        toast({ title: "Succès", description: "Mapping mis à jour avec succès" });
      } else {
        // Mode création: insérer un nouveau mapping
        const { error } = await supabase
          .from('club_mapping')
          .insert({
            original_name: originalName.trim(),
            mapped_name: mappedName.trim()
          });

        if (error) throw error;

        toast({ title: "Succès", description: "Mapping ajouté avec succès" });
      }

      // Réinitialiser et fermer
      closeMappingModal();
      loadClubMappings();
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder le mapping", variant: "destructive" });
    }
  };

  // Ouvrir le modal en mode édition
  const openEditMappingModal = (mapping) => {
    setIsEditingMode(true);
    setEditingMappingId(mapping.id);
    setNewMappingOriginal(mapping.original_name);
    setNewMappingMapped(mapping.mapped_name);
    setShowAddMappingModal(true);
  };

  // Fermer le modal et réinitialiser
  const closeMappingModal = () => {
    setShowAddMappingModal(false);
    setIsEditingMode(false);
    setEditingMappingId(null);
    setNewMappingOriginal('');
    setNewMappingMapped('');
  };

  // Mettre à jour un mapping
  const updateClubMapping = async (id, originalName, mappedName) => {
    if (!originalName.trim() || !mappedName.trim()) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_mapping')
        .update({ mapped_name: mappedName.trim() })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Succès", description: "Mapping mis à jour avec succès" });
      setEditingMappingId(null);
      setEditingMappingOriginal('');
      setEditingMappingMapped('');
      loadClubMappings();
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast({ title: "Erreur", description: "Impossible de mettre à jour le mapping", variant: "destructive" });
    }
  };

  // Supprimer un mapping
  const deleteClubMapping = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce mapping ?')) return;

    try {
      const { error } = await supabase
        .from('club_mapping')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Succès", description: "Mapping supprimé avec succès" });
      loadClubMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({ title: "Erreur", description: "Impossible de supprimer le mapping", variant: "destructive" });
    }
  };

  // Réappliquer la matrice de correspondance à toutes les inscriptions
  const reapplyClubMappings = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir réappliquer la matrice de correspondance des clubs à toutes les inscriptions ?')) {
      return;
    }

    try {
      setLoading(true);
      let updatedCount = 0;

      for (const reg of registrations) {
        // Chercher si le club actuel correspond à un original_name dans les mappings
        const mapping = clubMappings.find(m => m.original_name === reg.club);

        if (mapping && mapping.mapped_name !== reg.club) {
          // Mettre à jour l'inscription avec le club mappé
          const { error } = await supabase
            .from('competition_registrations')
            .update({ club: mapping.mapped_name })
            .eq('id', reg.id);

          if (error) throw error;
          updatedCount++;
        }
      }

      toast({
        title: "Succès",
        description: `Matrice appliquée: ${updatedCount} inscription(s) mise(s) à jour.`
      });

      fetchRegistrations();
    } catch (error) {
      console.error('Error reapplying club mappings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réappliquer la matrice de correspondance.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Ajouter automatiquement les clubs non mappés avec la valeur "INCONNU"
  const addUnknownMappingsForUnmappedClubs = async (unmappedClubs) => {
    if (unmappedClubs.length === 0) return;

    try {
      // Préparer les mappings INCONNU
      const newMappings = unmappedClubs.map(club => ({
        original_name: club.trim(),
        mapped_name: 'INCONNU'
      }));

      // Insérer les mappings (on ignore les conflits si la ligne existe déjà)
      const { error } = await supabase
        .from('club_mapping')
        .insert(newMappings)
        .select();

      if (error && error.code !== '23505') { // 23505 = unique constraint violation
        throw error;
      }

      // Recharger les mappings pour rafraîchir la liste
      await loadClubMappings();
    } catch (error) {
      console.error('Error adding unknown mappings:', error);
      // Ne pas afficher d'erreur toast ici car c'est une action automatique
    }
  };

  useEffect(() => {
    fetchRegistrations();
    loadClubMappings();
    loadCompetitorStats();
  }, []);

  // Recharger les statistiques quand les inscriptions changent
  useEffect(() => {
    if (registrations.length > 0) {
      loadCompetitorStats();
    }
  }, [registrations]);

  // Fonction pour convertir un numéro de série Excel en date
  const excelDateToJsDate = (excelDate) => {
    if (typeof excelDate !== 'number') {
      return null;
    }
    // Excel stocke les dates comme nombre de jours depuis 1900-01-01
    // Mais il y a un bug historique: Excel suppose que 1900 est une année bissextile
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date;
  };

  // Fonction pour extraire horaire et type_inscription du tarif
  const extractInscriptionDetails = (tarif) => {
    let horaire = null;
    let type_inscription = 'Compétition';

    if (tarif) {
      const tarifStr = String(tarif).toLowerCase();

      if (tarifStr.includes('précommande buvette')) {
        type_inscription = 'Buvette';
      } else if (tarifStr.includes('dimanche matin enfants')) {
        horaire = 'matin';
        type_inscription = 'Compétition';
      } else if (tarifStr.includes('après-midi')) {
        horaire = 'après-midi';
        type_inscription = 'Compétition';
      }
    }

    return { horaire, type_inscription };
  };

  // Parser le fichier Excel
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Convertir les données Excel en format de base de données
      const registrationsToInsert = jsonData.map((row) => {
        // Parser la date de naissance - gérer les formats Excel et texte
        let dateNaissance = null;
        if (row['Date de naissance']) {
          let dateObj;
          if (typeof row['Date de naissance'] === 'number') {
            // C'est un numéro de série Excel
            dateObj = excelDateToJsDate(row['Date de naissance']);
          } else {
            // C'est une chaîne de caractères
            const dateStr = String(row['Date de naissance']).trim();
            const dateParts = dateStr.split('/');
            if (dateParts.length === 3) {
              dateNaissance = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            }
          }
          if (dateObj) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            dateNaissance = `${year}-${month}-${day}`;
          }
        }

        // Parser la date de commande - gérer les formats Excel et texte
        let dateCommande = null;
        if (row['Date de la commande']) {
          let dateObj;
          if (typeof row['Date de la commande'] === 'number') {
            // C'est un numéro de série Excel avec potentiellement une fraction pour l'heure
            dateObj = excelDateToJsDate(row['Date de la commande']);
          } else {
            // C'est une chaîne de caractères
            const dateStr = String(row['Date de la commande']).trim();
            const dateTimeParts = dateStr.split(' ');
            if (dateTimeParts.length >= 1) {
              const dateParts = dateTimeParts[0].split('/');
              if (dateParts.length === 3) {
                const timePart = dateTimeParts[1] || '00:00';
                dateCommande = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
              }
            }
          }
          if (dateObj) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            dateCommande = `${year}-${month}-${day} ${hours}:${minutes}`;
          }
        }

        // Extraire horaire et type_inscription du tarif
        const { horaire, type_inscription } = extractInscriptionDetails(row['Tarif']);

        return {
          reference_commande: row['Référence commande'] || row['Reference commande'] || null,
          date_commande: dateCommande,
          statut_commande: row['Statut de la commande'] || null,
          nom_participant: row['Nom participant'] || '',
          prenom_participant: row['Prénom participant'] || row['Prenom participant'] || '',
          nom_payeur: row['Nom payeur'] || null,
          prenom_payeur: row['Prénom payeur'] || row['Prenom payeur'] || null,
          email_payeur: row['Email payeur'] || null,
          raison_sociale: row['Raison sociale'] || null,
          moyen_paiement: row['Moyen de paiement'] || null,
          billet: row['Billet'] || null,
          numero_billet: row['Numéro de billet'] || row['Numero de billet'] || null,
          tarif: row['Tarif'] || null,
          montant_tarif: parseFloat(row['Montant tarif']) || null,
          code_promo: row['Code Promo'] || null,
          montant_code_promo: parseFloat(row['Montant code promo']) || null,
          date_naissance: dateNaissance,
          sexe: convertSexeFormat(row['Sexe'] || row['sexe'] || null),
          club: mapClubName(row['Club']) || null,
          numero_licence_ffme: row['Numéro de licence FFME'] || row['Numero de licence FFME'] || null,
          horaire: horaire,
          type_inscription: type_inscription,
          file_name: file.name,
          deja_imprimee: false
        };
      });

      // Récupérer toutes les références de commande existantes
      const { data: existingRefs, error: fetchError } = await supabase
        .from('competition_registrations')
        .select('reference_commande');

      if (fetchError) throw fetchError;

      // Créer un Set des références existantes pour une recherche rapide
      const existingReferences = new Set(
        existingRefs.map(ref => ref.reference_commande).filter(Boolean)
      );

      // Filtrer les inscriptions pour exclure les doublons
      const newRegistrations = registrationsToInsert.filter(
        reg => !existingReferences.has(reg.reference_commande)
      );

      const duplicateCount = registrationsToInsert.length - newRegistrations.length;

      // Détecter les clubs non mappés du fichier original
      const clubsFromFile = new Set(
        jsonData
          .map(row => String(row['Club']).trim())
          .filter(club => club && club !== 'null')
      );
      const unmappedClubs = Array.from(clubsFromFile).filter(club => !isClubMapped(club));
      setUnmappedClubsFromImport(unmappedClubs);

      // Ajouter automatiquement les clubs non mappés avec la valeur "INCONNU"
      if (unmappedClubs.length > 0) {
        await addUnknownMappingsForUnmappedClubs(unmappedClubs);
      }

      // Insérer seulement les nouvelles inscriptions
      if (newRegistrations.length > 0) {
        const { error: insertError } = await supabase
          .from('competition_registrations')
          .insert(newRegistrations);

        if (insertError) throw insertError;

        // Assigner les numéros de dossards automatiquement
        const { error: assignError } = await supabase.rpc('assign_dossard_numbers');
        if (assignError) throw assignError;
      }

      // Message de notification
      let description = '';
      if (newRegistrations.length > 0) {
        description += `${newRegistrations.length} nouvelle(s) inscription(s) ajoutée(s)`;
      }
      if (duplicateCount > 0) {
        if (description) description += '. ';
        description += `${duplicateCount} doublon(s) ignoré(s)`;
      }

      toast({
        title: "Succès",
        description: description || "Aucune nouvelle inscription"
      });

      // Recharger les données
      fetchRegistrations();
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'importer le fichier Excel. Vérifiez le format.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Réinitialiser la table
  const handleReset = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer TOUTES les inscriptions ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('competition_registrations')
        .delete()
        .neq('id', 0); // Delete all rows

      if (error) throw error;

      setRegistrations([]);
      setSelectedIds([]);
      toast({ title: "Succès", description: "Toutes les inscriptions ont été supprimées." });
    } catch (error) {
      console.error('Error resetting table:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les inscriptions.",
        variant: "destructive"
      });
    }
  };

  // Filtrer les inscriptions
  const filteredRegistrations = useMemo(() => {
    let filtered = registrations;

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(reg =>
        reg.nom_participant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.prenom_participant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.club?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.numero_licence_ffme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.reference_commande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.tarif?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut d'impression
    if (filterPrinted === 'printed') {
      filtered = filtered.filter(reg => reg.deja_imprimee === true);
    } else if (filterPrinted === 'notPrinted') {
      filtered = filtered.filter(reg => reg.deja_imprimee === false);
    }

    // Filtre par horaire
    if (filterHoraire !== 'all') {
      filtered = filtered.filter(reg => reg.horaire === filterHoraire);
    }

    // Filtre par type d'inscription
    if (filterTypeInscription !== 'all') {
      filtered = filtered.filter(reg => reg.type_inscription === filterTypeInscription);
    }

    // Filtre par nom de fichier
    if (filterFileName !== 'all') {
      filtered = filtered.filter(reg => reg.file_name === filterFileName);
    }

    // Filtre par club
    if (filterClub !== 'all') {
      filtered = filtered.filter(reg => reg.club === filterClub);
    }

    // Filtre pour les clubs non mappés
    if (filterUnmappedClubs) {
      filtered = filtered.filter(reg => reg.club && !isClubMapped(reg.club));
    }

    // Filtre par sexe
    if (filterSexe !== 'all') {
      if (filterSexe === 'empty') {
        filtered = filtered.filter(reg => !reg.sexe);
      } else {
        filtered = filtered.filter(reg => reg.sexe === filterSexe);
      }
    }

    return filtered;
  }, [registrations, searchTerm, filterPrinted, filterHoraire, filterTypeInscription, filterFileName, filterClub, filterUnmappedClubs, filterSexe]);

  // Calculer la liste des fichiers uniques uploadés
  const uniqueFileNames = useMemo(() => {
    const fileNames = new Set(
      registrations
        .filter(reg => reg.file_name)
        .map(reg => reg.file_name)
    );
    return Array.from(fileNames).sort();
  }, [registrations]);

  // Calculer les statistiques par club
  const clubStats = useMemo(() => {
    const stats = {};
    registrations.forEach(reg => {
      if (reg.club) {
        if (!stats[reg.club]) {
          stats[reg.club] = 0;
        }
        stats[reg.club]++;
      }
    });
    return stats;
  }, [registrations]);

  // Calculer la liste des clubs uniques
  const uniqueClubs = useMemo(() => {
    const clubs = new Set(
      registrations
        .filter(reg => reg.club)
        .map(reg => reg.club)
    );
    // Trier les clubs par nombre de personnes (décroissant)
    return Array.from(clubs).sort((a, b) => {
      const countA = clubStats[a] || 0;
      const countB = clubStats[b] || 0;
      return countB - countA;
    });
  }, [registrations, clubStats]);

  // Fonction pour éditer un club
  const updateClub = async (registrationId, newClubName) => {
    try {
      const { error } = await supabase
        .from('competition_registrations')
        .update({ club: newClubName })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Club mis à jour."
      });
      fetchRegistrations();
      setEditingClubId(null);
      setEditingClubValue('');
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le club.",
        variant: "destructive"
      });
    }
  };

  // Mettre à jour le sexe
  const updateSexe = async (registrationId, newSexe) => {
    try {
      const { error } = await supabase
        .from('competition_registrations')
        .update({ sexe: newSexe || null })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Sexe mis à jour."
      });
      fetchRegistrations();
      setEditingSexeId(null);
      setEditingSexeValue('');
    } catch (error) {
      console.error('Error updating sexe:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le sexe.",
        variant: "destructive"
      });
    }
  };

  // Réinitialiser tous les filtres
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterPrinted('all');
    setFilterHoraire('all');
    setFilterTypeInscription('all');
    setFilterFileName('all');
    setFilterClub('all');
    setFilterUnmappedClubs(false);
    setFilterSexe('all');
    setSelectedIds([]);
  };

  // Sélection/désélection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRegistrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRegistrations.map(r => r.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return '';
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Déterminer la catégorie en fonction de l'année de naissance
  const getCategory = (dateNaissance) => {
    if (!dateNaissance) return '';
    const birthDate = new Date(dateNaissance);
    const year = birthDate.getFullYear();

    // Règles de catégorisation par année de naissance
    if (year >= 2016) return 'U11';
    if (year >= 2014) return 'U13';
    if (year >= 2012) return 'U15';
    if (year >= 2010) return 'U17';
    if (year >= 2008) return 'U19';
    if (year >= 1987) return 'Sénior';
    if (year >= 1977) return 'Vétéran 1';
    return 'Vétéran 2';
  };

  // Déterminer le sexe (simplifié - à adapter selon les données disponibles)
  const getSexe = (reg) => {
    // Vous pourrez ajouter cette information dans le fichier Excel si nécessaire
    return 'Homme / Femme'; // Placeholder
  };

  // Générer PDF pour les dossards sélectionnés
  const generatePDF = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Attention", description: "Veuillez sélectionner au moins une inscription." });
      return;
    }

    try {
      const selectedRegs = registrations.filter(r => selectedIds.includes(r.id));

      // Déterminer les paramètres en fonction du format et du nombre de fiches par page
      const format = pdfFormat === 'a4' ? 'a4' : 'a5';
      const orientation = pdfOrientation === 'landscape' ? 'landscape' : 'portrait';
      const cardsPerPage = pdfCardsPerPage === 2 ? 2 : 1;

      const doc = new jsPDF({ orientation, unit: 'mm', format });
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      // Ajuster les paramètres en fonction du format, orientation et du nombre de fiches
      let margin, cellHeight, cardHeight, headerSize, dossardSize, logoSize;

      if (orientation === 'portrait') {
        if (format === 'a4' && cardsPerPage === 1) {
          // A4 Portrait - 1 fiche par page
          margin = 5;
          cellHeight = 5;
          cardHeight = pageHeight - 2 * margin;
          headerSize = 36;
          dossardSize = 36;
          logoSize = 30;
        } else if (format === 'a4' && cardsPerPage === 2) {
          // A4 Portrait - 2 fiches par page
          margin = 4;
          cellHeight = 4.5;
          cardHeight = (pageHeight - 3 * margin) / 2;
          headerSize = 26;
          dossardSize = 26;
          logoSize = 22;
        } else if (format === 'a5' && cardsPerPage === 1) {
          // A5 Portrait - 1 fiche par page
          margin = 4;
          cellHeight = 4;
          cardHeight = pageHeight - 2 * margin;
          headerSize = 26;
          dossardSize = 26;
          logoSize = 22;
        } else {
          // A5 Portrait - 2 fiches par page
          margin = 3;
          cellHeight = 3.5;
          cardHeight = (pageHeight - 3 * margin) / 2;
          headerSize = 18;
          dossardSize = 18;
          logoSize = 16;
        }
      } else {
        // Mode Paysage
        if (format === 'a4' && cardsPerPage === 1) {
          // A4 Paysage - 1 fiche par page
          margin = 5;
          cellHeight = 5;
          cardHeight = pageHeight - 2 * margin;
          headerSize = 36;
          dossardSize = 36;
          logoSize = 30;
        } else if (format === 'a4' && cardsPerPage === 2) {
          // A4 Paysage - 2 fiches par page (côte à côte)
          margin = 4;
          cellHeight = 4.5;
          cardHeight = pageHeight - 2 * margin;
          headerSize = 28;
          dossardSize = 28;
          logoSize = 24;
        } else if (format === 'a5' && cardsPerPage === 1) {
          // A5 Paysage - 1 fiche par page
          margin = 4;
          cellHeight = 4;
          cardHeight = pageHeight - 2 * margin;
          headerSize = 28;
          dossardSize = 28;
          logoSize = 24;
        } else {
          // A5 Paysage - 2 fiches par page (côte à côte)
          margin = 3;
          cellHeight = 3.5;
          cardHeight = pageHeight - 2 * margin;
          headerSize = 20;
          dossardSize = 20;
          logoSize = 18;
        }
      }

      let currentY = margin;

      // Fonction helper pour charger une image
      const loadImage = async (filename) => {
        try {
          const imagePath = `${import.meta.env.BASE_URL}${filename}`;
          const imageResponse = await fetch(imagePath);

          if (!imageResponse.ok) {
            throw new Error(`Erreur HTTP ${imageResponse.status}`);
          }

          const imageBlob = await imageResponse.blob();

          // Convertir en base64
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(imageBlob);
          });
        } catch (error) {
          console.error(`Impossible de charger ${filename}:`, error);
          return null;
        }
      };

      // Charger les images
      const logoImage = await loadImage('logoALJ.jpg');
      const scoringTableImage = await loadImage('Competition_Tableau_scoring.png');

      // Données du tableau de scoring
      const difficultyLevels = [
        '4a', '4b', '4c', '5a', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+'
      ];
      const pointsALJ = [
        10, 10, 10, 12, 12, 12, 12, 12, 14, 14, 14, 14, 14, 14, 16, 16, 16, 16, 16, 16, 18, 18
      ];
      const pointsExterieur = [
        11, 11, 11, 13, 13, 13, 13, 13, 15, 15, 15, 15, 15, 15, 17, 17, 17, 17, 17, 17, 19, 19
      ];

      // Fonction pour ajouter une fiche
      const addCard = (reg, cardStartY, cardStartX = margin, cardWidth = null) => {
        const cardMargin = margin;
        let y = cardStartY;
        let x = cardStartX;

        // Largeur de la fiche (pour le paysage avec 2 fiches côte à côte)
        const actualCardWidth = cardWidth || (pageWidth - 2 * cardMargin);
        const logoXPos = x + actualCardWidth - cardMargin - logoSize;

        // === NUMÉRO DE DOSSARD en gros au-dessus du nom ===
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(dossardSize);
        doc.text(String(reg.numero_dossart || '-'), x + 8, y + 12);

        // Initialiser y pour le texte "Nom"
        y = cardStartY + 28;

        // === LOGO en haut à droite ===
        if (logoImage) {
          try {
            doc.addImage(logoImage, 'JPEG', logoXPos, y - 5, logoSize, logoSize);
          } catch (error) {
            console.warn('Erreur lors de l\'ajout du logo:', error);
          }
        }

        // === HEADER: Informations participant ===
        const colWidth = (actualCardWidth - 2 * cardMargin) / 2;
        const fieldHeight = cellHeight;

        // Ligne: Nom
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Nom', x + cardMargin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(reg.nom_participant?.toUpperCase() || '', x + cardMargin + 30, y);
        doc.line(x + cardMargin + 30, y + 0.8, x + cardMargin + colWidth, y + 0.8);
        y += fieldHeight;

        // Ligne: Prénom
        doc.setFont('helvetica', 'bold');
        doc.text('Prénom', x + cardMargin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(reg.prenom_participant || '', x + cardMargin + 30, y);
        doc.line(x + cardMargin + 30, y + 0.8, x + cardMargin + colWidth, y + 0.8);
        y += fieldHeight;

        // Ligne: Sexe
        doc.setFont('helvetica', 'bold');
        doc.text('Sexe', x + cardMargin, y);
        doc.setFont('helvetica', 'normal');
        const sexeDisplay = reg.sexe === 'H' ? 'Homme' : reg.sexe === 'F' ? 'Femme' : '';
        doc.text(sexeDisplay, x + cardMargin + 30, y);
        doc.line(x + cardMargin + 30, y + 0.8, x + cardMargin + colWidth, y + 0.8);
        y += fieldHeight;

        // Ligne: Club
        doc.setFont('helvetica', 'bold');
        doc.text('Club', x + cardMargin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(reg.club || '', x + cardMargin + 30, y);
        doc.line(x + cardMargin + 30, y + 0.8, x + cardMargin + colWidth, y + 0.8);
        y += fieldHeight;

        // Ligne: Catégorie
        doc.setFont('helvetica', 'bold');
        doc.text('Catégorie', x + cardMargin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(getCategory(reg.date_naissance) || '', x + cardMargin + 30, y);
        doc.line(x + cardMargin + 30, y + 0.8, x + cardMargin + colWidth, y + 0.8);
        y += fieldHeight;

        // Ligne: Tarif
        doc.setFont('helvetica', 'bold');
        doc.text('Tarif', x + cardMargin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(reg.tarif || '', x + cardMargin + 30, y);
        doc.line(x + cardMargin + 30, y + 0.8, x + cardMargin + colWidth, y + 0.8);
        y += fieldHeight;

        // Espace
        y += 2;

        // === TABLEAU DE SCORING - IMAGE ===
        // Titre
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Niveau des voies effectuées et bareme de points', x + cardMargin, y);
        y += 5;

        // Image
        if (scoringTableImage) {
          try {
            const imageHeight = (cardsPerPage === 2 && orientation === 'portrait') ? 30 : 40;
            doc.addImage(scoringTableImage, 'PNG', x + cardMargin, y, actualCardWidth - 2 * cardMargin, imageHeight);
            y += imageHeight + 3; // Espacement après l'image
          } catch (error) {
            console.warn('Erreur lors de l\'ajout de l\'image au PDF:', error);
          }
        }

        // Consignes
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Consignes : Cocher une case du niveau de difficulté pour chaque voie différente réalisée', x + cardMargin, y, { maxWidth: actualCardWidth - 2 * cardMargin });
        y += 4;
        doc.text('Pour les U15 et plus, Pas de différence entre les voies faites en moulinette ou en tete.', x + cardMargin, y, { maxWidth: actualCardWidth - 2 * cardMargin });
      };

      // Ajouter les fiches
      if (cardsPerPage === 1) {
        // 1 fiche par page
        selectedRegs.forEach((reg, index) => {
          if (index > 0) {
            doc.addPage();
          }
          addCard(reg, margin);
        });
      } else {
        // 2 fiches par page
        if (orientation === 'portrait') {
          // Portrait: 2 fiches l'une sous l'autre
          for (let i = 0; i < selectedRegs.length; i += 2) {
            if (i > 0) {
              doc.addPage();
            }
            addCard(selectedRegs[i], margin);
            if (i + 1 < selectedRegs.length) {
              addCard(selectedRegs[i + 1], margin + cardHeight + margin);
            }
          }
        } else {
          // Paysage: 2 fiches côte à côte
          const cardWidthLandscape = (pageWidth - 3 * margin) / 2;
          for (let i = 0; i < selectedRegs.length; i += 2) {
            if (i > 0) {
              doc.addPage();
            }
            addCard(selectedRegs[i], margin, margin, cardWidthLandscape);
            if (i + 1 < selectedRegs.length) {
              addCard(selectedRegs[i + 1], margin, margin + cardWidthLandscape + margin, cardWidthLandscape);
            }
          }
        }
      }

      // Sauvegarder le PDF avec un nom informatif
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHmmss
      const numFiches = selectedIds.length;
      const formatLabel = pdfFormat.toUpperCase(); // A4 ou A5
      const orientationLabel = pdfOrientation === 'portrait' ? 'portrait' : 'paysage';
      const cardsPerPageLabel = `${pdfCardsPerPage}page`;

      const filename = `dossards_${dateStr}_${timeStr}_${numFiches}fiches_${formatLabel}_${orientationLabel}_${cardsPerPageLabel}.pdf`;
      doc.save(filename);

      // Marquer comme imprimées
      const { error } = await supabase
        .from('competition_registrations')
        .update({ deja_imprimee: true })
        .in('id', selectedIds);

      if (error) throw error;

      toast({ title: "Succès", description: `${selectedIds.length} dossard(s) généré(s).` });
      fetchRegistrations();
      setSelectedIds([]);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive"
      });
    }
  };

  // Basculer le statut d'impression
  const togglePrintStatus = async (registrationId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('competition_registrations')
        .update({ deja_imprimee: !currentStatus })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Statut d'impression mis à jour.`
      });
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating print status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut d'impression.",
        variant: "destructive"
      });
    }
  };

  // Supprimer une inscription
  const deleteRegistration = async (registrationId, participantName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'inscription de ${participantName} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('competition_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `L'inscription a été supprimée.`
      });
      fetchRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'inscription.",
        variant: "destructive"
      });
    }
  };

  // Supprimer les lignes sélectionnées
  const bulkDeleteRegistrations = async () => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} inscription(s) ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('competition_registrations')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${selectedIds.length} inscription(s) supprimée(s).`
      });
      fetchRegistrations();
      setSelectedIds([]);
    } catch (error) {
      console.error('Error deleting registrations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les inscriptions.",
        variant: "destructive"
      });
    }
  };

  // Marquer les sélectionnés comme non imprimés
  const bulkMarkAsNotPrinted = async () => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('competition_registrations')
        .update({ deja_imprimee: false })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${selectedIds.length} inscription(s) marquée(s) comme non imprimée(s).`
      });
      fetchRegistrations();
      setSelectedIds([]);
    } catch (error) {
      console.error('Error updating registrations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les inscriptions.",
        variant: "destructive"
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute pageTitle="Gestion de Compétition" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-6">
        <Helmet><title>Gestion de Compétition</title></Helmet>

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <FileSpreadsheet className="w-10 h-10 text-primary" />
              Gestion de Compétition
            </h1>
            <p className="text-muted-foreground mt-2">Importez et gérez les inscriptions à la compétition</p>
          </div>
          <BackButton to="/admin-dashboard" variant="outline" size="sm" />
        </motion.div>

        {/* Carte d'upload et reset */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Import et Gestion des Données</CardTitle>
              <CardDescription>
                Importez un fichier Excel avec les inscriptions ou réinitialisez la table
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    <span>{uploading ? 'Import en cours...' : 'Cliquez pour uploader un fichier Excel'}</span>
                  </div>
                </Label>
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={uploading || registrations.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full">
                <strong className="text-sm">Format attendu :</strong>
                <p className="text-sm text-muted-foreground">
                  Référence commande, Date de la commande, Statut, Nom participant,
                  Prénom participant, Nom payeur, Prénom payeur, Email payeur, Raison sociale, Moyen de paiement,
                  Billet, Numéro de billet, Tarif, Montant tarif, Code Promo, Montant code promo, Date de naissance,
                  Club, Numéro de licence FFME
                </p>
              </div>

              {uniqueFileNames.length > 0 && (
                <div className="w-full border-t pt-4">
                  <div className="mb-3">
                    <Label htmlFor="file-filter" className="text-sm font-medium">
                      Fichiers uploadés ({uniqueFileNames.length})
                    </Label>
                    <select
                      id="file-filter"
                      value={filterFileName}
                      onChange={(e) => setFilterFileName(e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="all">Tous les fichiers</option>
                      {uniqueFileNames.map((fileName) => {
                        const count = registrations.filter(reg => reg.file_name === fileName).length;
                        return (
                          <option key={fileName} value={fileName}>
                            {fileName} ({count} inscriptions)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueFileNames.map((fileName) => {
                      const count = registrations.filter(reg => reg.file_name === fileName).length;
                      return (
                        <div
                          key={fileName}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                          onClick={() => setFilterFileName(filterFileName === fileName ? 'all' : fileName)}
                        >
                          {fileName} ({count})
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{registrations.length}</div>
              <p className="text-sm text-muted-foreground">Inscriptions totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {registrations.filter(r => r.deja_imprimee).length}
              </div>
              <p className="text-sm text-muted-foreground">Dossards imprimés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {registrations.filter(r => !r.deja_imprimee).length}
              </div>
              <p className="text-sm text-muted-foreground">En attente d'impression</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistiques par catégorie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {registrations.filter(r => r.horaire === 'matin' && r.type_inscription === 'Compétition').length}
              </div>
              <p className="text-sm text-muted-foreground">Compétition le matin</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-indigo-600">
                {registrations.filter(r => r.horaire === 'après-midi' && r.type_inscription === 'Compétition').length}
              </div>
              <p className="text-sm text-muted-foreground">Compétition l'après-midi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {registrations.filter(r => r.type_inscription === 'Buvette').length}
              </div>
              <p className="text-sm text-muted-foreground">Buvette</p>
              <p className="text-lg font-bold text-purple-600 mt-2">
                {registrations.filter(r => r.type_inscription === 'Buvette')
                  .reduce((sum, r) => sum + (r.montant_tarif || 0), 0).toFixed(2)} €
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-600">
                {registrations.reduce((sum, r) => sum + (r.montant_tarif || 0), 0).toFixed(2)} €
              </div>
              <p className="text-sm text-muted-foreground">Total compétition</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal d'ajout/modification de mapping */}
        {showAddMappingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {isEditingMode ? 'Modifier le mapping' : 'Ajouter un nouveau mapping'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="original-name">Nom original (depuis Excel)</Label>
                  <Input
                    id="original-name"
                    value={newMappingOriginal}
                    onChange={(e) => setNewMappingOriginal(e.target.value)}
                    placeholder="ex: Corb'alp"
                    disabled={isEditingMode}
                  />
                </div>
                <div>
                  <Label htmlFor="mapped-name">Nom standardisé</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mapped-name"
                      value={newMappingMapped}
                      onChange={(e) => setNewMappingMapped(e.target.value)}
                      placeholder="ex: Corb'Alp"
                      className="flex-1"
                    />
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setNewMappingMapped(e.target.value);
                        }
                      }}
                      className="px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">📋 Clubs</option>
                      {Array.from(new Set(clubMappings.map(m => m.mapped_name))).sort().map((mappedName) => (
                        <option key={mappedName} value={mappedName}>
                          {mappedName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sélectionnez un club ou saisissez un nouveau</p>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => closeMappingModal()}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => saveClubMapping(newMappingOriginal, newMappingMapped)}
                >
                  {isEditingMode ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Statistiques des compétiteurs */}
        {registrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des Compétiteurs</CardTitle>
                <CardDescription>
                  Répartition des compétiteurs (type_inscription = "Compétition")
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Statistiques par Sexe */}
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                      <h3 className="font-bold text-lg mb-4 text-blue-900">Par Sexe</h3>
                      <div className="space-y-2">
                        {competitorStats.bySexe && competitorStats.bySexe.map((stat) => (
                          <div key={stat.label} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{stat.label}</span>
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              {stat.count}
                            </span>
                          </div>
                        ))}
                      </div>
                      {competitorStats.total > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-xs text-blue-700">
                            Total: {competitorStats.total} compétiteur(s)
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Statistiques par Catégorie d'Âge */}
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100">
                      <h3 className="font-bold text-lg mb-4 text-green-900">Par Catégorie d'Âge</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {competitorStats.byAgeCategory && competitorStats.byAgeCategory.map((stat) => (
                          <div key={stat.label} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{stat.label}</span>
                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              {stat.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Statistiques par Horaire */}
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-orange-100">
                      <h3 className="font-bold text-lg mb-4 text-orange-900">Par Horaire</h3>
                      <div className="space-y-2">
                        {competitorStats.byHoraire && competitorStats.byHoraire.map((stat) => (
                          <div key={stat.label} className="flex justify-between items-center">
                            <span className="text-sm font-medium">{stat.label}</span>
                            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              {stat.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Statistiques par club */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Participants par club ({uniqueClubs.length})</CardTitle>
                  <CardDescription>Nombre de personnes inscrites par club</CardDescription>
                </div>
                <Button
                  variant={filterUnmappedClubs ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterUnmappedClubs(!filterUnmappedClubs)}
                  className={filterUnmappedClubs ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {filterUnmappedClubs ? '❌ Non mappés' : 'Voir les clubs non mappés'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {uniqueClubs.map((club) => {
                  const isMapped = isClubMapped(club);
                  return (
                    <div
                      key={club}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        isMapped
                          ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                          : 'bg-red-50 border-2 border-red-300 hover:bg-red-100'
                      }`}
                      onClick={() => setFilterClub(filterClub === club ? 'all' : club)}
                      title={isMapped ? 'Club mappé' : 'Club NON mappé - À vérifier!'}
                    >
                      <span className="font-medium text-sm">
                        {club}
                        {!isMapped && <span className="ml-1 text-red-600 font-bold">⚠</span>}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        isMapped
                          ? 'bg-blue-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {clubStats[club]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {uniqueClubs.filter(club => !isClubMapped(club)).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠ {uniqueClubs.filter(club => !isClubMapped(club)).length} club(s) non mappé(s):
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {uniqueClubs.filter(club => !isClubMapped(club)).join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtres et recherche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recherche et Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, prénom, club, licence, référence..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-11 text-base"
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={clearAllFilters}
                  title="Réinitialiser tous les filtres et recherches"
                  className="whitespace-nowrap"
                >
                  Réinitialiser filtres
                </Button>
                <div className="flex gap-2 flex-wrap">
                  {/* Filtres d'impression */}
                  <div className="flex gap-2">
                    <Button
                      variant={filterPrinted === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterPrinted('all')}
                      size="sm"
                    >
                      Tous
                    </Button>
                    <Button
                      variant={filterPrinted === 'printed' ? 'default' : 'outline'}
                      onClick={() => setFilterPrinted('printed')}
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Imprimés
                    </Button>
                    <Button
                      variant={filterPrinted === 'notPrinted' ? 'default' : 'outline'}
                      onClick={() => setFilterPrinted('notPrinted')}
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Non imprimés
                    </Button>
                  </div>

                  {/* Filtres d'horaire */}
                  <div className="flex gap-2">
                    <Button
                      variant={filterHoraire === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterHoraire('all')}
                      size="sm"
                    >
                      Tous horaires
                    </Button>
                    <Button
                      variant={filterHoraire === 'matin' ? 'default' : 'outline'}
                      onClick={() => setFilterHoraire('matin')}
                      size="sm"
                    >
                      Matin
                    </Button>
                    <Button
                      variant={filterHoraire === 'après-midi' ? 'default' : 'outline'}
                      onClick={() => setFilterHoraire('après-midi')}
                      size="sm"
                    >
                      Après-midi
                    </Button>
                  </div>

                  {/* Filtres type d'inscription */}
                  <div className="flex gap-2">
                    <Button
                      variant={filterTypeInscription === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterTypeInscription('all')}
                      size="sm"
                    >
                      Tous types
                    </Button>
                    <Button
                      variant={filterTypeInscription === 'Compétition' ? 'default' : 'outline'}
                      onClick={() => setFilterTypeInscription('Compétition')}
                      size="sm"
                    >
                      Compétition
                    </Button>
                    <Button
                      variant={filterTypeInscription === 'Buvette' ? 'default' : 'outline'}
                      onClick={() => setFilterTypeInscription('Buvette')}
                      size="sm"
                    >
                      Buvette
                    </Button>
                  </div>

                  {/* Filtres par Sexe */}
                  <div className="flex gap-2">
                    <Button
                      variant={filterSexe === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterSexe('all')}
                      size="sm"
                    >
                      Tous sexes
                    </Button>
                    <Button
                      variant={filterSexe === 'H' ? 'default' : 'outline'}
                      onClick={() => setFilterSexe('H')}
                      size="sm"
                    >
                      👨 Homme ({registrations.filter(r => r.sexe === 'H').length})
                    </Button>
                    <Button
                      variant={filterSexe === 'F' ? 'default' : 'outline'}
                      onClick={() => setFilterSexe('F')}
                      size="sm"
                    >
                      👩 Femme ({registrations.filter(r => r.sexe === 'F').length})
                    </Button>
                    <Button
                      variant={filterSexe === 'empty' ? 'default' : 'outline'}
                      onClick={() => setFilterSexe('empty')}
                      size="sm"
                    >
                      ❓ Vide ({registrations.filter(r => !r.sexe).length})
                    </Button>
                  </div>
                </div>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedIds.length} inscription(s) sélectionnée(s)
                  </span>
                  <Button onClick={() => setShowPdfOptions(true)} size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Générer PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tableau des inscriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Inscriptions ({filteredRegistrations.length})</CardTitle>
            </CardHeader>
            <CardContent className="w-full p-0">
              {loading ? (
                <div className="flex justify-center items-center py-8 px-6">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="text-center py-8 px-6 text-muted-foreground">
                  {searchTerm || filterPrinted !== 'all'
                    ? 'Aucune inscription trouvée avec ces critères.'
                    : 'Aucune inscription. Importez un fichier Excel pour commencer.'}
                </div>
              ) : (
                <>
                  {/* Barre d'actions en masse */}
                  {selectedIds.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mx-6 mt-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-blue-900">
                        {selectedIds.length} inscription(s) sélectionnée(s)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={bulkMarkAsNotPrinted}
                          className="text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50"
                          title="Marquer comme non imprimé"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Non imprimé
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={bulkDeleteRegistrations}
                          title="Supprimer les sélectionnés"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="overflow-x-auto w-full px-6 pb-6">
                    <Table className="w-full min-w-max">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>N° Dossard</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Catégorie d'Âge</TableHead>
                        <TableHead>Sexe</TableHead>
                        <TableHead>Horaire</TableHead>
                        <TableHead>Type d'inscription</TableHead>
                        <TableHead>Tarif</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>N° Licence FFME</TableHead>
                        <TableHead className="text-center">Imprimé</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.map((reg) => (
                        <TableRow
                          key={reg.id}
                          className={selectedIds.includes(reg.id) ? 'bg-blue-50' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(reg.id)}
                              onCheckedChange={() => toggleSelect(reg.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {reg.numero_dossart || '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {reg.reference_commande || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {reg.nom_participant?.toUpperCase()}
                          </TableCell>
                          <TableCell>{reg.prenom_participant}</TableCell>
                          <TableCell>
                            {reg.date_naissance ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                getCategory(reg.date_naissance) === 'U11'
                                  ? 'bg-green-100 text-green-700'
                                  : getCategory(reg.date_naissance) === 'U13'
                                  ? 'bg-blue-100 text-blue-700'
                                  : getCategory(reg.date_naissance) === 'U15'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : getCategory(reg.date_naissance) === 'U17'
                                  ? 'bg-purple-100 text-purple-700'
                                  : getCategory(reg.date_naissance) === 'U19'
                                  ? 'bg-pink-100 text-pink-700'
                                  : getCategory(reg.date_naissance) === 'Sénior'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {getCategory(reg.date_naissance)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell
                            className="cursor-pointer hover:bg-blue-50 transition-colors"
                            onClick={() => {
                              setEditingSexeId(reg.id);
                              setEditingSexeValue(reg.sexe || '');
                            }}
                            title="Cliquer pour éditer le sexe"
                          >
                            {editingSexeId === reg.id ? (
                              <select
                                value={editingSexeValue}
                                onChange={(e) => setEditingSexeValue(e.target.value)}
                                onBlur={() => updateSexe(reg.id, editingSexeValue)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateSexe(reg.id, editingSexeValue);
                                  } else if (e.key === 'Escape') {
                                    setEditingSexeId(null);
                                    setEditingSexeValue('');
                                  }
                                }}
                                autoFocus
                                className="w-full px-2 py-1 border border-blue-400 rounded text-sm"
                              >
                                <option value="">Non spécifié</option>
                                <option value="H">Homme</option>
                                <option value="F">Femme</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                reg.sexe === 'H'
                                  ? 'bg-blue-100 text-blue-700'
                                  : reg.sexe === 'F'
                                  ? 'bg-pink-100 text-pink-700'
                                  : 'text-gray-500'
                              }`}>
                                {reg.sexe === 'H' ? 'Homme' : reg.sexe === 'F' ? 'Femme' : '-'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {reg.horaire ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {reg.horaire === 'matin' ? 'Matin' : 'Après-midi'}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              reg.type_inscription === 'Buvette'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {reg.type_inscription || 'Compétition'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{reg.tarif || '-'}</TableCell>
                          <TableCell>{reg.montant_tarif ? `${reg.montant_tarif} €` : '-'}</TableCell>
                          <TableCell
                            className="cursor-pointer hover:bg-blue-50 transition-colors relative"
                            onClick={() => {
                              setEditingClubId(reg.id);
                              setEditingClubValue(reg.club || '');
                            }}
                            title="Cliquer pour éditer le club"
                          >
                            {editingClubId === reg.id ? (
                              <input
                                type="text"
                                value={editingClubValue}
                                onChange={(e) => setEditingClubValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateClub(reg.id, editingClubValue);
                                  } else if (e.key === 'Escape') {
                                    setEditingClubId(null);
                                    setEditingClubValue('');
                                  }
                                }}
                                onBlur={() => updateClub(reg.id, editingClubValue)}
                                autoFocus
                                className="w-full px-2 py-1 border border-blue-400 rounded text-sm"
                              />
                            ) : (
                              <span>{reg.club || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell>{reg.numero_licence_ffme || '-'}</TableCell>
                          <TableCell
                            className="text-center cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => togglePrintStatus(reg.id, reg.deja_imprimee)}
                            title="Cliquer pour basculer le statut d'impression"
                          >
                            {reg.deja_imprimee ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto hover:scale-110 transition-transform" />
                            ) : (
                              <XCircle className="w-5 h-5 text-orange-600 mx-auto hover:scale-110 transition-transform" />
                            )}
                          </TableCell>
                          <TableCell className="text-center flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailsId(reg.id)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              title="Voir plus de détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRegistration(reg.id, `${reg.prenom_participant} ${reg.nom_participant}`)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Supprimer cette inscription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>

                  {/* Modal des détails */}
                  {detailsId && registrations.length > 0 && (
                    <Dialog open={!!detailsId} onOpenChange={(open) => !open && setDetailsId(null)}>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Détails de l'inscription</DialogTitle>
                          <DialogDescription>
                            Toutes les informations relatives à cette inscription
                          </DialogDescription>
                        </DialogHeader>
                        {(() => {
                          const registration = registrations.find(r => r.id === detailsId);
                          if (!registration) return null;

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Informations participant */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-md border-b pb-2">Participant</h3>
                                <div>
                                  <p className="text-sm text-gray-600">Prénom</p>
                                  <p className="font-medium">{registration.prenom_participant || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Nom</p>
                                  <p className="font-medium">{registration.nom_participant || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Date de naissance</p>
                                  <p className="font-medium">{registration.date_naissance ? new Date(registration.date_naissance).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Catégorie d'âge</p>
                                  <p className="font-medium">{registration.categorie_age || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Sexe</p>
                                  <p className="font-medium">{registration.sexe === 'H' ? 'Homme' : registration.sexe === 'F' ? 'Femme' : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Club</p>
                                  <p className="font-medium">{registration.club || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Numéro de licence FFME</p>
                                  <p className="font-medium">{registration.numero_licence_ffme || '-'}</p>
                                </div>
                              </div>

                              {/* Informations de la commande et paiement */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-md border-b pb-2">Commande & Paiement</h3>
                                <div>
                                  <p className="text-sm text-gray-600">Référence</p>
                                  <p className="font-medium">{registration.reference_commande || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Date</p>
                                  <p className="font-medium">{registration.date_commande ? new Date(registration.date_commande).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Statut</p>
                                  <p className="font-medium">{registration.statut_commande || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Type d'inscription</p>
                                  <p className="font-medium">{registration.type_inscription || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Tarif</p>
                                  <p className="font-medium">{registration.tarif || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Montant</p>
                                  <p className="font-medium">{registration.montant_tarif ? `${registration.montant_tarif}€` : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Code promo</p>
                                  <p className="font-medium">{registration.code_promo || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Montant promo</p>
                                  <p className="font-medium">{registration.montant_code_promo ? `${registration.montant_code_promo}€` : '-'}</p>
                                </div>
                              </div>

                              {/* Informations payeur */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-md border-b pb-2">Payeur</h3>
                                <div>
                                  <p className="text-sm text-gray-600">Prénom</p>
                                  <p className="font-medium">{registration.prenom_payeur || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Nom</p>
                                  <p className="font-medium">{registration.nom_payeur || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Email</p>
                                  <p className="font-medium text-blue-600 break-all">{registration.email_payeur || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Raison sociale</p>
                                  <p className="font-medium">{registration.raison_sociale || '-'}</p>
                                </div>
                              </div>

                              {/* Informations dossard et billet */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-md border-b pb-2">Horaire & Dossard</h3>
                                <div>
                                  <p className="text-sm text-gray-600">Horaire</p>
                                  <p className="font-medium">{registration.horaire === 'matin' ? 'Matin' : registration.horaire === 'après-midi' ? 'Après-midi' : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Numéro de dossard</p>
                                  <p className="font-medium">{registration.numero_dossart || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Imprimée</p>
                                  <p className="font-medium">{registration.deja_imprimee ? 'Oui' : 'Non'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Billet</p>
                                  <p className="font-medium">{registration.billet || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Numéro de billet</p>
                                  <p className="font-medium">{registration.numero_billet || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Moyen de paiement</p>
                                  <p className="font-medium">{registration.moyen_paiement || '-'}</p>
                                </div>
                              </div>

                              {/* Informations système */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-md border-b pb-2">Système</h3>
                                <div>
                                  <p className="text-sm text-gray-600">Fichier source</p>
                                  <p className="font-medium">{registration.file_name || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Créé le</p>
                                  <p className="font-medium">{registration.created_at ? new Date(registration.created_at).toLocaleString('fr-FR') : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Modifié le</p>
                                  <p className="font-medium">{registration.updated_at ? new Date(registration.updated_at).toLocaleString('fr-FR') : '-'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Dialog Options PDF */}
                  <Dialog open={showPdfOptions} onOpenChange={setShowPdfOptions}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Options d'export PDF</DialogTitle>
                        <DialogDescription>
                          Configurez le format et la disposition de vos dossards
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Format du document */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Format du document</Label>
                          <div className="flex gap-3">
                            <Button
                              variant={pdfFormat === 'a4' ? 'default' : 'outline'}
                              onClick={() => setPdfFormat('a4')}
                              className="flex-1"
                            >
                              A4
                            </Button>
                            <Button
                              variant={pdfFormat === 'a5' ? 'default' : 'outline'}
                              onClick={() => setPdfFormat('a5')}
                              className="flex-1"
                            >
                              A5
                            </Button>
                          </div>
                        </div>

                        {/* Orientation */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Orientation</Label>
                          <div className="flex gap-3">
                            <Button
                              variant={pdfOrientation === 'portrait' ? 'default' : 'outline'}
                              onClick={() => setPdfOrientation('portrait')}
                              className="flex-1"
                            >
                              Portrait
                            </Button>
                            <Button
                              variant={pdfOrientation === 'landscape' ? 'default' : 'outline'}
                              onClick={() => setPdfOrientation('landscape')}
                              className="flex-1"
                            >
                              Paysage
                            </Button>
                          </div>
                        </div>

                        {/* Fiches par page */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Fiches par page</Label>
                          <div className="flex gap-3">
                            <Button
                              variant={pdfCardsPerPage === 1 ? 'default' : 'outline'}
                              onClick={() => setPdfCardsPerPage(1)}
                              className="flex-1"
                            >
                              1 fiche
                            </Button>
                            <Button
                              variant={pdfCardsPerPage === 2 ? 'default' : 'outline'}
                              onClick={() => setPdfCardsPerPage(2)}
                              className="flex-1"
                            >
                              2 fiches
                            </Button>
                          </div>
                        </div>

                        {/* Aperçu */}
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                          <p className="text-gray-700">
                            📋 <span className="font-semibold">{pdfFormat.toUpperCase()}</span> - {pdfCardsPerPage} fiche{pdfCardsPerPage > 1 ? 's' : ''} par page
                          </p>
                        </div>

                        {/* Boutons */}
                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowPdfOptions(false)}
                            className="flex-1"
                          >
                            Annuler
                          </Button>
                          <Button
                            onClick={() => {
                              generatePDF();
                              setShowPdfOptions(false);
                            }}
                            className="flex-1"
                          >
                            Générer PDF
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gestion du mapping des clubs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion du mapping des clubs</CardTitle>
                  <CardDescription>Gérez la correspondance des noms de clubs</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={reapplyClubMappings}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    title="Réappliquer la matrice de correspondance à toutes les inscriptions"
                  >
                    <RotateCw className="w-4 h-4" />
                    Réappliquer
                  </Button>
                  <Button
                    onClick={() => setShowAddMappingModal(true)}
                    size="sm"
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un mapping
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {/* Accordéon des mappings existants */}
                <AccordionItem value="mappings">
                  <AccordionTrigger className="text-base font-semibold">
                    📋 Mappings existants ({clubMappings.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    {mappingsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : clubMappings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucun mapping configuré. Commencez par en ajouter un.
                      </div>
                    ) : (
                      <>
                        {/* Filtres */}
                        <div className="flex gap-2 mb-4">
                          <Button
                            variant={!filterUnknownMappings ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterUnknownMappings(false)}
                          >
                            Tous les mappings
                          </Button>
                          <Button
                            variant={filterUnknownMappings ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterUnknownMappings(true)}
                            className={filterUnknownMappings ? 'bg-amber-600 hover:bg-amber-700' : ''}
                          >
                            ⚠️ INCONNU ({clubMappings.filter(m => m.mapped_name === 'INCONNU').length})
                          </Button>
                        </div>

                        <div className="overflow-x-auto mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nom original</TableHead>
                                <TableHead>Nom mappé</TableHead>
                                <TableHead className="text-center w-24">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {clubMappings
                                .filter(mapping => !filterUnknownMappings || mapping.mapped_name === 'INCONNU')
                                .map((mapping) => (
                              <TableRow key={mapping.id}>
                                <TableCell>
                                  <span className="font-medium">{mapping.original_name}</span>
                                </TableCell>
                                <TableCell>
                                  {mapping.mapped_name}
                                </TableCell>
                                <TableCell className="text-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditMappingModal(mapping)}
                                    title="Éditer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteClubMapping(mapping.id)}
                                    title="Supprimer"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <IconX className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Accordéon des clubs non mappés */}
                {unmappedClubsFromImport.length > 0 && (
                  <AccordionItem value="unmapped">
                    <AccordionTrigger className="text-base font-semibold text-amber-700">
                      ⚠️ Clubs non mappés détectés ({unmappedClubsFromImport.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 mt-4">
                        {unmappedClubsFromImport.map((club) => (
                          <div
                            key={club}
                            className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                          >
                            <span className="font-medium text-amber-900">{club}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setNewMappingOriginal(club);
                                setNewMappingMapped(club);
                                setShowAddMappingModal(true);
                              }}
                              className="gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Ajouter ce mapping
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tableau des règles de catégorisation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Règles de Catégorisation par Année de Naissance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                      <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">Catégorie</th>
                      <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">Années de Naissance</th>
                      <th className="border border-blue-200 px-4 py-3 text-left font-bold text-blue-900">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 border-b border-blue-100">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded">U11</span></td>
                      <td className="border border-blue-100 px-4 py-3">2016, 2017</td>
                      <td className="border border-blue-100 px-4 py-3">Enfants 11 ans</td>
                    </tr>
                    <tr className="hover:bg-blue-50 border-b border-blue-100">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded">U13</span></td>
                      <td className="border border-blue-100 px-4 py-3">2014, 2015</td>
                      <td className="border border-blue-100 px-4 py-3">Enfants 13 ans</td>
                    </tr>
                    <tr className="hover:bg-blue-50 border-b border-blue-100">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">U15</span></td>
                      <td className="border border-blue-100 px-4 py-3">2012, 2013</td>
                      <td className="border border-blue-100 px-4 py-3">Jeunes 15 ans</td>
                    </tr>
                    <tr className="hover:bg-blue-50 border-b border-blue-100">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">U17</span></td>
                      <td className="border border-blue-100 px-4 py-3">2010, 2011</td>
                      <td className="border border-blue-100 px-4 py-3">Jeunes 17 ans</td>
                    </tr>
                    <tr className="hover:bg-blue-50 border-b border-blue-100">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded">U19</span></td>
                      <td className="border border-blue-100 px-4 py-3">2008, 2009</td>
                      <td className="border border-blue-100 px-4 py-3">Jeunes 19 ans</td>
                    </tr>
                    <tr className="hover:bg-blue-50 border-b border-blue-100">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded">Sénior</span></td>
                      <td className="border border-blue-100 px-4 py-3">1987 à 2007</td>
                      <td className="border border-blue-100 px-4 py-3">Adultes</td>
                    </tr>
                    <tr className="hover:bg-blue-50 border-b border-blue-100">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded">Vétéran 1</span></td>
                      <td className="border border-blue-100 px-4 py-3">1977 à 1986</td>
                      <td className="border border-blue-100 px-4 py-3">Vétérans (47-46 ans)</td>
                    </tr>
                    <tr className="hover:bg-blue-50">
                      <td className="border border-blue-100 px-4 py-3"><span className="font-bold text-red-700 bg-red-50 px-3 py-1 rounded">Vétéran 2</span></td>
                      <td className="border border-blue-100 px-4 py-3">1976 et avant</td>
                      <td className="border border-blue-100 px-4 py-3">Vétérans seniors (≥48 ans)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default CompetitionManagement;
