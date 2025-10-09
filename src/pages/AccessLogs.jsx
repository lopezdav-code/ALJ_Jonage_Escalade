import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  Activity, 
  Users, 
  Eye, 
  Calendar,
  Search,
  Filter,
  Download,
  Trash2,
  Clock,
  Globe,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const AccessLogs = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [users, setUsers] = useState([]);

  // Charger les logs d'accès
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('access_logs')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Filtres
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      
      if (userFilter !== 'all') {
        query = query.eq('user_id', userFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      const { data, error } = await query.limit(1000);
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs d'accès.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des utilisateurs pour le filtre
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('last_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
      fetchUsers();
    }
  }, [isAdmin, actionFilter, userFilter, dateFilter]);

  // Filtrer par terme de recherche
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.page?.toLowerCase().includes(searchLower) ||
      log.user_agent?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower) ||
      log.profiles?.first_name?.toLowerCase().includes(searchLower) ||
      log.profiles?.last_name?.toLowerCase().includes(searchLower) ||
      log.profiles?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Supprimer les anciens logs
  const clearOldLogs = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer les logs de plus de 30 jours ?')) {
      return;
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('access_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Anciens logs supprimés avec succès."
      });
      
      fetchLogs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les anciens logs.",
        variant: "destructive"
      });
    }
  };

  // Exporter les logs
  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Utilisateur', 'Email', 'Action', 'Page', 'IP', 'User Agent'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('fr-FR'),
        `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim() || 'Utilisateur inconnu',
        log.profiles?.email || '',
        log.action,
        log.page || '',
        log.ip_address || '',
        `"${log.user_agent || ''}"` // Guillemets pour les virgules dans user agent
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `access-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action) => {
    const variants = {
      'login': 'default',
      'logout': 'secondary',
      'page_view': 'outline',
      'error': 'destructive'
    };

    const labels = {
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'page_view': 'Page visitée',
      'error': 'Erreur'
    };

    return (
      <Badge variant={variants[action] || 'outline'}>
        {labels[action] || action}
      </Badge>
    );
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'login': return <User className="w-4 h-4" />;
      case 'logout': return <User className="w-4 h-4" />;
      case 'page_view': return <Eye className="w-4 h-4" />;
      case 'error': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs d'Accès</h1>
          <p className="text-muted-foreground">Suivi des connexions et navigation des utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <Button onClick={clearOldLogs} variant="outline">
            <Trash2 className="w-4 h-4 mr-2" />
            Nettoyer anciens logs
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connexions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => log.action === 'login').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages vues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => log.action === 'page_view').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs uniques</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map(log => log.user_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="login">Connexions</SelectItem>
                <SelectItem value="logout">Déconnexions</SelectItem>
                <SelectItem value="page_view">Pages vues</SelectItem>
                <SelectItem value="error">Erreurs</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchLogs} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Journal d'activité ({filteredLogs.length} entrées)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement des logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun log trouvé pour les critères sélectionnés.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {log.profiles ? 
                            `${log.profiles.first_name} ${log.profiles.last_name}` : 
                            'Utilisateur inconnu'
                          }
                        </span>
                        {getActionBadge(log.action)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {log.page && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>{log.page}</span>
                          </div>
                        )}
                        
                        {log.ip_address && (
                          <div className="flex items-center gap-1">
                            <span>IP: {log.ip_address}</span>
                          </div>
                        )}
                        
                        {log.user_agent && (
                          <div className="text-xs truncate max-w-md">
                            {log.user_agent}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatDistanceToNow(new Date(log.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessLogs;