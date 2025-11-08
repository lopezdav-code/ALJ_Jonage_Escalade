import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Edit, Trash2, PlusCircle, ArrowLeft, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const ScheduleAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    if (isAdmin) {
      fetchScheduleItems();
    }
  }, [isAdmin]);

  const fetchScheduleItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          groupe:Groupe(id, category, sous_category, Groupe_schedule),
          instructor_1:instructor_1_id(id, first_name, last_name),
          instructor_2:instructor_2_id(id, first_name, last_name),
          instructor_3:instructor_3_id(id, first_name, last_name),
          instructor_4:instructor_4_id(id, first_name, last_name)
        `)
        .order('day')
        .order('start_time');

      if (error) throw error;
      setScheduleItems(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le planning.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Créneau supprimé',
        description: 'Le créneau a été supprimé avec succès.',
      });

      fetchScheduleItems();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le créneau.',
        variant: 'destructive',
      });
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Compétition':
        return 'bg-red-100 text-red-800';
      case 'Loisir':
        return 'bg-blue-100 text-blue-800';
      case 'Perf':
        return 'bg-green-100 text-green-800';
      case 'Autonomes':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatInstructors = (item) => {
    const instructors = [
      item.instructor_1,
      item.instructor_2,
      item.instructor_3,
      item.instructor_4
    ].filter(Boolean);

    if (instructors.length === 0) return 'Aucun';

    return instructors
      .map(i => `${i.first_name} ${i.last_name}`)
      .join(', ');
  };

  const formatGroupe = (groupe) => {
    if (!groupe) return '-';

    let display = groupe.category;
    if (groupe.sous_category) {
      display += ` - ${groupe.sous_category}`;
    }
    if (groupe.Groupe_schedule) {
      display += ` (${groupe.Groupe_schedule})`;
    }
    return display;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const getSortedItems = () => {
    if (!sortConfig.key) return scheduleItems;

    const sorted = [...scheduleItems].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'groupe':
          aValue = formatGroupe(a.groupe);
          bValue = formatGroupe(b.groupe);
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'age_category':
          aValue = a.age_category || '';
          bValue = b.age_category || '';
          break;
        case 'day':
          // Ordre des jours de la semaine
          const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
          aValue = daysOrder.indexOf(a.day);
          bValue = daysOrder.indexOf(b.day);
          break;
        case 'time':
          aValue = a.start_time || '';
          bValue = b.start_time || '';
          break;
        case 'instructors':
          aValue = formatInstructors(a);
          bValue = formatInstructors(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute pageTitle="Gestion du Planning" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-8">
        <Helmet>
          <title>Gestion du Planning - Admin</title>
          <meta name="description" content="Administration du planning des cours" />
        </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/schedule')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au planning
            </Button>
            <h1 className="text-4xl font-bold headline flex items-center gap-3">
              <Calendar className="w-10 h-10 text-primary" />
              Gestion du Planning
            </h1>
          </div>
          <Button onClick={() => navigate('/schedule/admin/new')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nouveau créneau
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Liste des créneaux ({scheduleItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('groupe')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Groupe
                        {getSortIcon('groupe')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('type')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Type
                        {getSortIcon('type')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('age_category')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Catégorie d'âge
                        {getSortIcon('age_category')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('day')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Jour
                        {getSortIcon('day')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('time')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Horaires
                        {getSortIcon('time')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('instructors')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        Encadrants
                        {getSortIcon('instructors')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun créneau dans le planning. Cliquez sur "Nouveau créneau" pour commencer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    getSortedItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {formatGroupe(item.groupe)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.age_category}</TableCell>
                        <TableCell>{item.day}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatInstructors(item)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/schedule/admin/edit/${item.id}`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </ProtectedRoute>
  );
};

export default ScheduleAdmin;
