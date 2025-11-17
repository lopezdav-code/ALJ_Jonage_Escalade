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
  Download
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

  useEffect(() => {
    fetchRegistrations();
  }, []);

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
        // Parser la date de naissance (format DD/MM/YYYY)
        let dateNaissance = null;
        if (row['Date de naissance']) {
          const dateParts = row['Date de naissance'].split('/');
          if (dateParts.length === 3) {
            dateNaissance = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          }
        }

        // Parser la date de commande (format DD/MM/YYYY HH:MM)
        let dateCommande = null;
        if (row['Date de la commande']) {
          const dateTimeParts = row['Date de la commande'].split(' ');
          if (dateTimeParts.length >= 1) {
            const dateParts = dateTimeParts[0].split('/');
            if (dateParts.length === 3) {
              const timePart = dateTimeParts[1] || '00:00';
              dateCommande = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
            }
          }
        }

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
          club: row['Club'] || null,
          numero_licence_ffme: row['Numéro de licence FFME'] || row['Numero de licence FFME'] || null,
          deja_imprimee: false
        };
      });

      // Insérer dans la base de données
      const { error: insertError } = await supabase
        .from('competition_registrations')
        .insert(registrationsToInsert);

      if (insertError) throw insertError;

      // Assigner les numéros de dossards automatiquement
      const { error: assignError } = await supabase.rpc('assign_dossard_numbers');
      if (assignError) throw assignError;

      toast({
        title: "Succès",
        description: `${registrationsToInsert.length} inscription(s) importée(s).`
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

    return filtered;
  }, [registrations, searchTerm, filterPrinted]);

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

  // Déterminer la catégorie en fonction de l'âge
  const getCategory = (dateNaissance) => {
    const age = calculateAge(dateNaissance);
    if (!age) return '';

    if (age < 13) return 'U13';
    if (age < 15) return 'U15';
    if (age < 17) return 'U17';
    if (age < 19) return 'U19';
    if (age < 40) return 'Sénior';
    return 'Vétéran';
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
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      let currentY = 20;
      let pageNumber = 0;

      // Créer le tableau de scoring
      const difficultyLevels = [
        '4a', '4b', '4c', '5a', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+'
      ];
      const pointsALJ = [
        10, 10, 10, 12, 12, 12, 12, 12, 14, 14, 14, 14, 14, 14, 16, 16, 16, 16, 16, 16, 18, 18
      ];
      const pointsExterieur = [
        11, 11, 11, 13, 13, 13, 13, 13, 15, 15, 15, 15, 15, 15, 17, 17, 17, 17, 17, 17, 19, 19
      ];

      selectedRegs.forEach((reg, index) => {
        if (index > 0) {
          doc.addPage();
          currentY = 20;
        }

        // En-tête
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('FEUILLE DE SCORE', pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        // Informations participant
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nom: ${reg.nom_participant?.toUpperCase() || ''}`, 15, currentY);
        currentY += 7;
        doc.text(`Prénom: ${reg.prenom_participant || ''}`, 15, currentY);
        currentY += 7;
        doc.text(`Homme / Femme: ${getSexe(reg)}`, 15, currentY);
        currentY += 7;
        doc.text(`Club: ${reg.club || ''}`, 15, currentY);
        currentY += 7;
        doc.text(`Catégorie: ${getCategory(reg.date_naissance)}`, 15, currentY);
        currentY += 10;

        // Tableau de difficulté et points
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Difficulté', 15, currentY);
        doc.text('Niveau des voies effectuées et barème de points', 60, currentY);
        currentY += 7;

        // En-têtes des niveaux de difficulté (première ligne)
        doc.setFontSize(8);
        let xPos = 15;
        const columnWidth = 8;

        for (let i = 0; i < 11; i++) {
          doc.text(difficultyLevels[i], xPos, currentY, { align: 'center' });
          xPos += columnWidth;
        }
        currentY += 5;

        // Deuxième ligne des niveaux
        xPos = 15;
        for (let i = 11; i < 22; i++) {
          doc.text(difficultyLevels[i], xPos, currentY, { align: 'center' });
          xPos += columnWidth;
        }
        currentY += 5;

        // Points ALJ
        doc.text('Points ALJ', 15, currentY);
        xPos = 35;
        for (let i = 0; i < 11; i++) {
          doc.text(pointsALJ[i].toString(), xPos, currentY, { align: 'center' });
          xPos += columnWidth;
        }
        currentY += 5;

        xPos = 35;
        for (let i = 11; i < 22; i++) {
          doc.text(pointsALJ[i].toString(), xPos, currentY, { align: 'center' });
          xPos += columnWidth;
        }
        currentY += 5;

        // Points Extérieur
        doc.text('Points Extérieur', 15, currentY);
        xPos = 35;
        for (let i = 0; i < 11; i++) {
          doc.text(pointsExterieur[i].toString(), xPos, currentY, { align: 'center' });
          xPos += columnWidth;
        }
        currentY += 5;

        xPos = 35;
        for (let i = 11; i < 22; i++) {
          doc.text(pointsExterieur[i].toString(), xPos, currentY, { align: 'center' });
          xPos += columnWidth;
        }
        currentY += 10;

        // Lignes pour marquer les voies
        doc.text('1 fois Topée', 15, currentY);
        doc.line(50, currentY, 190, currentY);
        currentY += 7;

        doc.text('2 fois Topée', 15, currentY);
        doc.line(50, currentY, 190, currentY);
        currentY += 7;

        doc.text('3 fois Topée', 15, currentY);
        doc.line(50, currentY, 190, currentY);
        currentY += 10;

        // Consignes
        doc.setFont('helvetica', 'bold');
        doc.text('Consignes :', 15, currentY);
        currentY += 7;
        doc.setFont('helvetica', 'normal');
        doc.text('Cocher une case du niveau de difficulté pour chaque voie différente réalisée', 15, currentY);
        currentY += 7;
        doc.text('Pour les U15 et plus, pas de différence entre les voies faites en moulinette ou en tête.', 15, currentY);
      });

      // Sauvegarder le PDF
      doc.save(`dossards_competition_${new Date().toISOString().split('T')[0]}.pdf`);

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
            <CardFooter className="text-sm text-muted-foreground">
              <div>
                <strong>Format attendu :</strong> Référence commande, Date de la commande, Statut, Nom participant,
                Prénom participant, Nom payeur, Prénom payeur, Email payeur, Raison sociale, Moyen de paiement,
                Billet, Numéro de billet, Tarif, Montant tarif, Code Promo, Montant code promo, Date de naissance,
                Club, Numéro de licence FFME
              </div>
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
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, prénom, club, licence, référence..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedIds.length} inscription(s) sélectionnée(s)
                  </span>
                  <Button onClick={generatePDF} size="sm">
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
          <Card>
            <CardHeader>
              <CardTitle>Inscriptions ({filteredRegistrations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || filterPrinted !== 'all'
                    ? 'Aucune inscription trouvée avec ces critères.'
                    : 'Aucune inscription. Importez un fichier Excel pour commencer.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
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
                        <TableHead>Tarif</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>N° Licence FFME</TableHead>
                        <TableHead className="text-center">Imprimé</TableHead>
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
                          <TableCell className="text-xs">{reg.tarif || '-'}</TableCell>
                          <TableCell>{reg.montant_tarif ? `${reg.montant_tarif} €` : '-'}</TableCell>
                          <TableCell>{reg.club || '-'}</TableCell>
                          <TableCell>{reg.numero_licence_ffme || '-'}</TableCell>
                          <TableCell className="text-center">
                            {reg.deja_imprimee ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-orange-600 mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default CompetitionManagement;
