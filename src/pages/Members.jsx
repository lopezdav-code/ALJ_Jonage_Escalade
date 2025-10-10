import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, Edit, Users, Filter, Heart, ShieldCheck, User, AlertTriangle, Info } from 'lucide-react';
import { formatName, ProfileIndicator } from '@/lib/utils.jsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const MemberCard = ({ member, onEdit, onDelete, isAdmin }) => {
  const { showMemberDetails } = useMemberDetail();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4 flex flex-col items-start">
        {isAdmin && (
          <div className="w-full flex justify-end gap-1 mb-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(member); }}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(member); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
        <div className="flex items-center cursor-pointer w-full" onClick={() => showMemberDetails(member.id)}>
          <p className="font-semibold truncate flex-grow" title={formatName(member.first_name, member.last_name, true)}>
            {formatName(member.first_name, member.last_name, isAdmin)}
          </p>
          <div className="flex-shrink-0 flex items-center gap-1 ml-2">
            <ProfileIndicator profile={member.profiles} />
            {member.is_emergency_contact_for_others && <Heart className="h-4 w-4 text-red-500" title="Contact d'urgence pour un autre membre" />}
            {!member.emergency_contact_1_id && !member.emergency_contact_2_id && <AlertTriangle className="h-4 w-4 text-yellow-500" title="Aucun contact d'urgence défini" />}
          </div>
        </div>
        {isAdmin && member.phone && <p className="text-sm text-muted-foreground mt-1">{member.phone}</p>}
      </CardContent>
    </Card>
  );
};

const MemberGrid = ({ members, onEdit, onDelete, isAdmin }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {members.map(member => (
       <div key={member.id}>
          <MemberCard
            member={member}
            onEdit={onEdit}
            onDelete={onDelete}
            isAdmin={isAdmin}
          />
       </div>
    ))}
  </div>
);

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingMember, setDeletingMember] = useState(null);
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { openEditFormForMember } = useMemberDetail();
  const [filters, setFilters] = useState({
    hasPhone: false,
    hasLicense: false,
    hasEmergencyContact: false,
    noEmergencyContact: false,
  });

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const phoneCondition = !filters.hasPhone || (member.phone && member.phone.trim() !== '');
      const licenseCondition = !filters.hasLicense || (member.licence && member.licence.trim() !== '');
      const emergencyCondition = !filters.hasEmergencyContact || (member.emergency_contact_1_id || member.emergency_contact_2_id);
      const noEmergencyCondition = !filters.noEmergencyContact || (!member.emergency_contact_1_id && !member.emergency_contact_2_id);
      return phoneCondition && licenseCondition && emergencyCondition && noEmergencyCondition;
    });
  }, [members, filters]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('members').select('*, profiles(role)').order('last_name').order('first_name');
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les membres.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: emergencyContacts, error: ecError } = await supabase
      .from('members')
      .select('emergency_contact_1_id, emergency_contact_2_id')
      .or('emergency_contact_1_id.not.is.null,emergency_contact_2_id.not.is.null');

    if (ecError) {
        toast({ title: "Erreur", description: "Impossible de charger les infos de contact d'urgence.", variant: "destructive" });
    }

    const emergencyContactIds = new Set();
    if (emergencyContacts) {
        emergencyContacts.forEach(ec => {
            if (ec.emergency_contact_1_id) emergencyContactIds.add(ec.emergency_contact_1_id);
            if (ec.emergency_contact_2_id) emergencyContactIds.add(ec.emergency_contact_2_id);
        });
    }

    const formattedMembers = data.map(m => ({
      ...m,
      profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
      is_emergency_contact_for_others: emergencyContactIds.has(m.id)
    }));
    setMembers(formattedMembers);
    
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    try {
      const { error } = await supabase.from('members').delete().eq('id', deletingMember.id);
      if (error) throw error;
      toast({ title: "Succès", description: "Membre supprimé.", variant: "destructive" });
      setDeletingMember(null);
      fetchMembers();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const memberCategories = useMemo(() => {
    const grouped = filteredMembers.reduce((acc, member) => {
      const title = member.title || 'Autre';
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(member);
      return acc;
    }, {});

    const categoryOrder = [
        "Loisir enfants", "Loisir collége", "Loisir lycée", "Loisir adulte", 
        "Adultes débutants", "Adultes autonomes", 
        "Compétition U11-U15", "Compétition U15-U19",
        "Bénévole", 
        "Bureau",
        "emergency_contact",
        "Autre"
    ];

    return Object.entries(grouped).sort(([a], [b]) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
  }, [filteredMembers]);

  const summary = useMemo(() => {
    return memberCategories.map(([title, membersList]) => ({
      title: title === 'emergency_contact' ? "Contact d'urgence" : title,
      count: membersList.length,
    })).filter(item => item.count > 0);
  }, [memberCategories]);

  const showAdminFeatures = !authLoading && isAdmin;

  const handleEdit = (member) => {
    openEditFormForMember(member);
  };

  const handleDelete = (member) => {
    setDeletingMember(member);
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Adhérents - Club d'Escalade</title>
        <meta name="description" content="Liste des adhérents du club d'escalade." />
      </Helmet>

      <div>
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" />
            Liste des Adhérents
          </h1>
          {showAdminFeatures && (
            <div className="flex gap-2">
              <Button onClick={() => openEditFormForMember(null)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Ajouter un membre
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
                <Checkbox id="hasPhone" checked={filters.hasPhone} onCheckedChange={() => handleFilterChange('hasPhone')} />
                <Label htmlFor="hasPhone">N° de téléphone</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="hasLicense" checked={filters.hasLicense} onCheckedChange={() => handleFilterChange('hasLicense')} />
                <Label htmlFor="hasLicense">N° de licence</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="hasEmergencyContact" checked={filters.hasEmergencyContact} onCheckedChange={() => handleFilterChange('hasEmergencyContact')} />
                <Label htmlFor="hasEmergencyContact">Contact d'urgence</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="noEmergencyContact" checked={filters.noEmergencyContact} onCheckedChange={() => handleFilterChange('noEmergencyContact')} />
                <Label htmlFor="noEmergencyContact">Sans contact d'urgence</Label>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résumé des adhérents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {summary.map(item => (
            <div key={item.title} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
              <span className="font-semibold">{item.title}:</span>
              <span className="font-bold text-primary">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <main>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {memberCategories.map(([category, membersList]) => {
              const subGroups = ['Loisir enfants', 'Loisir collége'].includes(category)
                ? Object.entries(membersList.reduce((acc, member) => {
                    const subGroup = member.sub_group || 'Non spécifié';
                    if (!acc[subGroup]) acc[subGroup] = [];
                    acc[subGroup].push(member);
                    return acc;
                  }, {}))
                : null;

              const categoryTitle = category === 'emergency_contact' ? "Contact d'urgence" : category;

              return (
                <AccordionItem value={category} key={category} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 bg-secondary/50 hover:bg-secondary/70">
                    <h2 className="text-xl font-bold headline">{categoryTitle} ({membersList.length})</h2>
                  </AccordionTrigger>
                  <AccordionContent className="p-6">
                    {subGroups ? (
                      <div className="space-y-6">
                        {subGroups.map(([subGroup, subMembers]) => (
                          <div key={subGroup}>
                            <h3 className="text-lg font-semibold mb-3">{subGroup}</h3>
                            <MemberGrid members={subMembers} onEdit={handleEdit} onDelete={handleDelete} isAdmin={showAdminFeatures} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <MemberGrid members={membersList} onEdit={handleEdit} onDelete={handleDelete} isAdmin={showAdminFeatures} />
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
        {!loading && filteredMembers.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Aucun membre ne correspond aux filtres sélectionnés.</p>
        )}
      </main>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="w-5 h-5" /> Légende des icônes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>Profil Administrateur</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span>Profil Adhérent</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span>Est le contact d'urgence pour un autre membre</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <span>N'a pas de contact d'urgence défini</span>
          </div>
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 flex-shrink-0" />
            <span>Modifier le membre (Admin)</span>
          </div>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive flex-shrink-0" />
            <span>Supprimer le membre (Admin)</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {deletingMember?.first_name} {deletingMember?.last_name} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMember(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteMember}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;