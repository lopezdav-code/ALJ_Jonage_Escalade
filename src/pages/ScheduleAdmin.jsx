import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Edit, Trash2, PlusCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ScheduleAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/schedule');
      return;
    }
    if (isAdmin) {
      fetchScheduleItems();
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchScheduleItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
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
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie d'âge</TableHead>
                    <TableHead>Jour</TableHead>
                    <TableHead>Horaires</TableHead>
                    <TableHead>Encadrants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun créneau dans le planning. Cliquez sur "Nouveau créneau" pour commencer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scheduleItems.map((item) => (
                      <TableRow key={item.id}>
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
  );
};

export default ScheduleAdmin;
