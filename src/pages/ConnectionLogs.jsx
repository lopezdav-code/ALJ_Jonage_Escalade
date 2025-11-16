import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  UserCheck, 
  UserX, 
  Calendar, 
  Filter, 
  Download, 
  Trash2, 
  Eye,
  Users,
  Activity,
  Clock,
  Globe
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const ConnectionLogs = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: 'all',
    dateRange: '7',
    search: ''
  });
  const [stats, setStats] = useState({
    totalConnections: 0,
    uniqueUsers: 0,
    todayConnections: 0,
    activeUsers: 0
  });


  // Charger les logs de connexion
  const fetchConnectionLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('access_logs')
        .select('*')
        .eq('log_type', 'connection')
        .order('created_at', { ascending: false });

      // Filtrer par action
      if (filter.action !== 'all') {
        query = query.eq('action', filter.action);
      }

      // Filtrer par date
      if (filter.dateRange !== 'all') {
        const days = parseInt(filter.dateRange);
        const startDate = subDays(new Date(), days);
        query = query.gte('created_at', startDate.toISOString());
      }

      // Filtrer par recherche
      if (filter.search) {
        query = query.or(`user_name.ilike.%${filter.search}%,user_email.ilike.%${filter.search}%`);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques - Version optimisée
  const fetchStats = async () => {
    try {
      // Récupérer toutes les données de connexion d'un coup
      const { data: allLogins, error } = await supabase
        .from('access_logs')
        .select('user_id, created_at')
        .eq('log_type', 'connection')
        .eq('action', 'login')
        .order('created_at', { ascending: false })
        .limit(1000); // Limite raisonnable

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = subDays(now, 1);

      // Calculer toutes les stats en une fois
      const totalConnections = allLogins?.length || 0;
      const uniqueUsers = new Set(allLogins?.map(log => log.user_id)).size;
      
      const todayConnections = allLogins?.filter(log => 
        new Date(log.created_at) >= today
      ).length || 0;
      
      const activeUsers = new Set(
        allLogins?.filter(log => 
          new Date(log.created_at) >= yesterday
        ).map(log => log.user_id)
      ).size;

      setStats({
        totalConnections,
        uniqueUsers,
        todayConnections,
        activeUsers
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // Valeurs par défaut en cas d'erreur
      setStats({
        totalConnections: 0,
        uniqueUsers: 0,
        todayConnections: 0,
        activeUsers: 0
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // Debouncing pour éviter trop d'appels lors des changements de filtres
      const timeoutId = setTimeout(() => {
        fetchConnectionLogs();
        fetchStats();
      }, 300); // 300ms de délai

      return () => clearTimeout(timeoutId);
    }
  }, [isAdmin, filter]);

  // Exporter les logs
  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Heure', 'Utilisateur', 'Email', 'Action', 'IP', 'Navigateur'].join(','),
      ...logs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy', { locale: fr }),
        format(new Date(log.created_at), 'HH:mm:ss', { locale: fr }),
        log.user_name || 'N/A',
        log.user_email || 'N/A',
        log.action,
        log.ip_address || 'N/A',
        log.metadata?.browser || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-connexion-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Nettoyer les anciens logs
  const cleanOldLogs = async () => {
    if (!confirm('Voulez-vous vraiment supprimer les logs de plus de 30 jours ?')) return;

    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { error } = await supabase
        .from('access_logs')
        .delete()
        .eq('log_type', 'connection')
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      alert('Anciens logs supprimés avec succès');
      fetchConnectionLogs();
      fetchStats();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression des logs');
    }
  };

  const getActionBadge = (action) => {
    const variants = {
      login: { variant: 'default', icon: UserCheck, color: 'text-green-600' },
      logout: { variant: 'secondary', icon: UserX, color: 'text-orange-600' }
    };

    const config = variants[action] || { variant: 'outline', icon: Activity, color: 'text-gray-600' };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {action === 'login' ? 'Connexion' : 'Déconnexion'}
      </Badge>
    );
  };

  return (
    <ProtectedRoute pageTitle="Logs de Connexion" message="Cette page est réservée aux administrateurs.">
      <div className="space-y-6">
        <Helmet>
          <title>Logs de Connexion - Administration</title>
          <meta name="description" content="Suivi des connexions et déconnexions des membres" />
        </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <BackButton to="/admin-dashboard" />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Logs de Connexion</h1>
              <p className="text-muted-foreground">Suivi des connexions des membres</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={cleanOldLogs} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Nettoyer
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Connexions</p>
              <p className="text-2xl font-bold">{stats.totalConnections}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Utilisateurs Uniques</p>
              <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
              <p className="text-2xl font-bold">{stats.todayConnections}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Globe className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Actifs (24h)</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={filter.action} onValueChange={(value) => setFilter({...filter, action: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="login">Connexions</SelectItem>
                  <SelectItem value="logout">Déconnexions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={filter.dateRange} onValueChange={(value) => setFilter({...filter, dateRange: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aujourd'hui</SelectItem>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <Input
                placeholder="Nom ou email..."
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Logs de Connexion ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Navigateur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun log trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: fr })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(log.created_at), 'HH:mm:ss', { locale: fr })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{log.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{log.ip_address || 'N/A'}</code>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {log.metadata?.browser || 'N/A'}
                            {log.metadata?.platform && (
                              <div className="text-xs text-muted-foreground">
                                {log.metadata.platform}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ConnectionLogs;