import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Rôles gérés
const BUREAU_ROLES = [
  'Présidente',
  'Présidente Adjointe',
  'Trésorier',
  'Trésorier Adjoint',
  'Secrétaire',
  'Secrétaire Adjoint',
];

const BureauManagement = () => {
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]); // cache complet pour recherche
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState({});
  // états de recherche séparés par rôle pour éviter que tous les champs se mettent à jour en même temps
  const [searchTextByRole, setSearchTextByRole] = useState({});
  const [suggestionsByRole, setSuggestionsByRole] = useState({});
  const [assignments, setAssignments] = useState({}); // role -> member object or null

  // Charger membres et affectations actuelles
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Charger les membres pour la recherche
        const { data: membersData, error: mErr } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .order('last_name')
          .order('first_name');

        if (mErr) throw mErr;
        setMembers(membersData || []);

        // Charger la table bureau (role assignments)
        const { data: bureauData, error: bErr } = await supabase
          .from('bureau')
          .select('id, members_id, role, sub_role');

        if (bErr) throw bErr;

        const map = {};
        (bureauData || []).forEach((b) => {
          // construire la clé complète (ex: 'Trésorier Adjoint')
          const fullRole = b.sub_role ? `${b.role} ${b.sub_role}` : b.role;
          // associe le membre au rôle si présent
          const member = (membersData || []).find(m => m.id === b.members_id);
          map[fullRole] = member ? { ...member, bureau_id: b.id } : null;
        });

        setAssignments(map);
      } catch (err) {
        console.error('Erreur BureauManagement fetch:', err);
        toast({ title: 'Erreur', description: 'Impossible de charger les données du bureau.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [authLoading, isAdmin, navigate, toast]);

  // Recherche basique côté client, par rôle
  const handleSearch = useCallback((role, text) => {
    setSearchTextByRole(prev => ({ ...prev, [role]: text }));
    if (!text) {
      setSuggestionsByRole(prev => ({ ...prev, [role]: [] }));
      return;
    }

    const q = text.toLowerCase();
    const results = members
      .filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || `${m.last_name} ${m.first_name}`.toLowerCase().includes(q))
      .slice(0, 10);
    setSuggestionsByRole(prev => ({ ...prev, [role]: results }));
  }, [members]);

  const handleSelectSuggestion = (role, member) => {
    // Conserver l'ancien bureau_id lié au rôle si présent, pour pouvoir faire un update
    setAssignments(prev => ({ ...prev, [role]: { ...member, bureau_id: prev?.[role]?.bureau_id || null } }));
    setSearchTextByRole(prev => ({ ...prev, [role]: '' }));
    setSuggestionsByRole(prev => ({ ...prev, [role]: [] }));
  };

  const handleClearRole = async (role) => {
    const assigned = assignments[role];
    if (!assigned || !assigned.bureau_id) {
      setAssignments(prev => ({ ...prev, [role]: null }));
      return;
    }

    setSavingRole(prev => ({ ...prev, [role]: true }));
    try {
      // supprimer l'entrée en base
      const { error } = await supabase.from('bureau').delete().eq('id', assigned.bureau_id);
      if (error) throw error;

      toast({ title: 'Supprimé', description: `Rôle ${role} libéré.` });
      setAssignments(prev => ({ ...prev, [role]: null }));
    } catch (err) {
      console.error('Erreur suppression rôle:', err);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le rôle.', variant: 'destructive' });
    } finally {
      setSavingRole(prev => ({ ...prev, [role]: false }));
    }
  };

  const handleSaveRole = async (role) => {
    const member = assignments[role];
    if (!member) {
      toast({ title: 'Aucune sélection', description: `Sélectionnez un membre pour ${role}.`, variant: 'destructive' });
      return;
    }

    setSavingRole(prev => ({ ...prev, [role]: true }));
    try {
      // Décomposer role complet en role + sub_role si nécessaire
      // Exemple: 'Trésorier Adjoint' => role='Trésorier', sub_role='Adjoint'
      let baseRole = role;
      let subRole = null;
      const parts = role.split(' ');
      // si le dernier mot est 'Adjoint' ou 'Adjointe', on le considère comme sub_role
      const last = parts[parts.length - 1];
      if (last === 'Adjoint' || last === 'Adjointe') {
        subRole = last;
        baseRole = parts.slice(0, parts.length - 1).join(' ');
      }

      // Si bureau_id est présent -> update, sinon insert
      if (member.bureau_id) {
        const updates = { members_id: member.id, role: baseRole, sub_role: subRole };
        const { error } = await supabase.from('bureau').update(updates).eq('id', member.bureau_id);
        if (error) throw error;
      } else {
        const toInsert = { members_id: member.id, role: baseRole };
        if (subRole) toInsert.sub_role = subRole;
        const { error } = await supabase.from('bureau').insert([toInsert]);
        if (error) throw error;
      }

      toast({ title: 'Enregistré', description: `Le rôle ${role} a été attribué à ${member.first_name} ${member.last_name}.` });
      // recharger pour récupérer bureau_id et assurer cohérence
      const { data: refreshed } = await supabase.from('bureau').select('id, members_id, role, sub_role');
      const map = {};
      (refreshed || []).forEach((b) => {
        const fullRole = b.sub_role ? `${b.role} ${b.sub_role}` : b.role;
        const mem = members.find(m => m.id === b.members_id);
        map[fullRole] = mem ? { ...mem, bureau_id: b.id } : null;
      });
      setAssignments(map);
    } catch (err) {
      console.error('Erreur save rôle:', err);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le rôle.', variant: 'destructive' });
    } finally {
      setSavingRole(prev => ({ ...prev, [role]: false }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Gestion du Bureau</title>
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Users className="w-10 h-10 text-primary" /> Gestion des membres du Bureau
        </h1>
        <Button variant="outline" onClick={() => navigate('/member-group-test')}>
          Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attribuer les rôles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {BUREAU_ROLES.map((role) => (
              <div key={role} className="border p-4 rounded">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{role}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleClearRole(role)} disabled={savingRole[role]}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleSaveRole(role)} disabled={savingRole[role]}>
                      {savingRole[role] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="ml-2">Sauvegarder</span>
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <Label>Actuellement :</Label>
                  <div className="mt-1">
                    {assignments[role] ? (
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>{assignments[role].first_name} {assignments[role].last_name}</div>
                        <div className="text-xs text-muted-foreground">id: {assignments[role].id}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Aucun membre assigné</div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <Label>Rechercher un membre</Label>
                  <div className="relative mt-1">
                    <Input
                      placeholder="Tapez nom ou prénom..."
                      value={searchTextByRole[role] || ''}
                      onChange={(e) => handleSearch(role, e.target.value)}
                    />
                    <div className="absolute right-3 top-3 text-muted-foreground"><Search className="w-4 h-4" /></div>
                    {(suggestionsByRole[role] || []).length > 0 && (
                      <div className="absolute left-0 right-0 bg-background border mt-1 max-h-60 overflow-auto z-20">
                        {(suggestionsByRole[role] || []).map(s => (
                          <div key={s.id} className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center" onClick={() => handleSelectSuggestion(role, s)}>
                            <div>{s.first_name} {s.last_name}</div>
                            <div className="text-xs text-muted-foreground">id: {s.id}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BureauManagement;
