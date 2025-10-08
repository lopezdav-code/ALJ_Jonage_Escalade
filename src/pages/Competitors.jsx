
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader2, Edit, TrendingUp, Mountain, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { formatName, ProfileIndicator } from '@/lib/utils.jsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import MemberForm from '@/components/MemberForm';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CompetitionListModal = ({ competitions, discipline, onClose }) => {
    const navigate = useNavigate();

    const handleCompetitionClick = (competitionId) => {
        onClose();
        navigate(`/competitions?id=${competitionId}`);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Compétitions de {discipline}</DialogTitle>
                    <DialogDescription>
                        Liste des compétitions auxquelles le membre a participé en 2025
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-60 overflow-y-auto space-y-2 py-4">
                    {competitions.length > 0 ? (
                        competitions.map((comp) => (
                            <div
                                key={comp.id}
                                className="p-2 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => handleCompetitionClick(comp.id)}
                            >
                                <p className="font-medium">{comp.name}</p>
                                <p className="text-sm text-muted-foreground">{new Date(comp.start_date).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground">Aucune compétition dans cette discipline.</p>
                    )}
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const CompetitorCard = ({ member, onEdit, isAdmin, stats, onStatClick }) => {
    const { showMemberDetails } = useMemberDetail();
    const showBlocStat = stats && stats.bloc > 0;
    const showDifficulteStat = stats && stats.difficulte > 0;
    const getInitials = (firstName, lastName) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md relative group cursor-pointer" onClick={() => showMemberDetails(member.id)}>
            <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={member.photo_url} alt={formatName(member.first_name, member.last_name, true)} />
                        <AvatarFallback>{getInitials(member.first_name, member.last_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex items-center">
                            <p className="font-semibold">{formatName(member.first_name, member.last_name, isAdmin)}</p>
                            <ProfileIndicator profile={member.profiles} />
                        </div>
                        {member.category && <p className="text-sm text-primary font-medium">{member.category}</p>}
                    </div>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                            onClick={(e) => { e.stopPropagation(); onEdit(member); }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {(showBlocStat || showDifficulteStat) && (
                    <div className="flex items-center justify-start gap-4 text-xs text-muted-foreground pt-1">
                        {showBlocStat && (
                            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-500" onClick={(e) => { e.stopPropagation(); onStatClick('Bloc'); }}>
                                <TrendingUp className="w-3 h-3 text-blue-500" />
                                <span>Bloc: <span className="font-bold text-foreground">{stats.bloc}</span></span>
                            </div>
                        )}
                        {showDifficulteStat && (
                            <div className="flex items-center gap-1 cursor-pointer hover:text-green-500" onClick={(e) => { e.stopPropagation(); onStatClick('Difficulté'); }}>
                                <Mountain className="w-3 h-3 text-green-500" />
                                <span>Diff: <span className="font-bold text-foreground">{stats.difficulte}</span></span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const CompetitorGroup = ({ title, competitors, onEdit, isAdmin, participationStats, onStatClick }) => {
  const groupedByCategory = useMemo(() => {
    const groups = competitors.reduce((acc, member) => {
      const category = member.category || 'Non classé';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(member);
      return acc;
    }, {});
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Non classé') return 1;
      if (b === 'Non classé') return -1;
      return a.localeCompare(b);
    });
  }, [competitors]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold headline flex items-center gap-3">
        <Trophy className="w-8 h-8 text-primary" />
        {title} ({competitors.length})
      </h2>
      <div className="space-y-6">
        {groupedByCategory.map(([category, members]) => (
          <div key={category}>
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">{category} ({members.length})</h3>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              {members.map((member) => {
                const stats = participationStats[member.id] || { bloc: { count: 0, list: [] }, difficulte: { count: 0, list: [] } };
                const formattedStats = { bloc: stats.bloc.count, difficulte: stats.difficulte.count };
                return (
                  <motion.div key={member.id} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                    <CompetitorCard member={member} onEdit={onEdit} isAdmin={isAdmin} stats={formattedStats} onStatClick={(discipline) => onStatClick(member, discipline)} />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

const Competitors = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [participationStats, setParticipationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalInfo, setModalInfo] = useState({ isOpen: false, competitions: [], discipline: '' });
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { editingMember, isFormVisible, openEditFormForMember, closeEditForm } = useMemberDetail();
  const navigate = useNavigate();

  const fetchCompetitorData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*, profiles(role)')
        .in('title', ['Compétition U11-U15', 'Compétition U15-U19'])
        .order('last_name')
        .order('first_name');
        
      if (membersError) throw membersError;

      const formattedMembers = membersData.map(m => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      }));
      setAllMembers(formattedMembers);

      const { data: participations, error: participationsError } = await supabase
        .from('competition_participants')
        .select(`
          member_id,
          competitions ( id, name, start_date, disciplines )
        `)
        .eq('role', 'Competiteur');

      if (participationsError) throw participationsError;
      
      const stats = participations.reduce((acc, p) => {
        if (!p.member_id || !p.competitions) return acc;
        
        if (!acc[p.member_id]) {
            acc[p.member_id] = { bloc: { count: 0, list: [] }, difficulte: { count: 0, list: [] } };
        }

        const competitionDetails = {
            id: p.competitions.id,
            name: p.competitions.name,
            start_date: p.competitions.start_date
        };

        const disciplines = p.competitions?.disciplines || [];
        if (disciplines.includes('Bloc')) {
            acc[p.member_id].bloc.count++;
            acc[p.member_id].bloc.list.push(competitionDetails);
        }
        if (disciplines.includes('Difficulté')) {
            acc[p.member_id].difficulte.count++;
            acc[p.member_id].difficulte.list.push(competitionDetails);
        }

        return acc;
      }, {});

      setParticipationStats(stats);

    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les données des compétiteurs.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompetitorData();
  }, [fetchCompetitorData]);
  
  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `members_photos/${Date.now()}.${fileExt}`;
    let { error: uploadError } = await supabase.storage.from('member_photos').upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('member_photos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSaveMember = async (memberData, newImageFile) => {
    setIsSaving(true);
    try {
      let photo_url = memberData.photo_url;
      if (newImageFile) {
        photo_url = await uploadImage(newImageFile);
      } else if (memberData.photo_url === null) {
        photo_url = null;
      }
      
      const { profiles, dynamic_roles, isEmergencyContactFor, emergency_contact_1, emergency_contact_2, ...dataToSave } = { ...memberData, photo_url };

      const { error } = await supabase.from('members').update(dataToSave).eq('id', editingMember.id);
      if (error) throw error;
      toast({ title: "Succès", description: "Compétiteur mis à jour." });
      closeEditForm();
      fetchCompetitorData();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le compétiteur.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatClick = (member, discipline) => {
    const memberStats = participationStats[member.id];
    if (!memberStats) return;

    if (discipline === 'Bloc') {
        setModalInfo({ isOpen: true, competitions: memberStats.bloc.list, discipline: 'Bloc' });
    } else if (discipline === 'Difficulté') {
        setModalInfo({ isOpen: true, competitions: memberStats.difficulte.list, discipline: 'Difficulté' });
    }
  };

  const closeModal = () => {
    setModalInfo({ isOpen: false, competitions: [], discipline: '' });
  };

  const competitorsU11U15 = allMembers.filter(
    (member) => member.title === 'Compétition U11-U15'
  );
  const competitorsU15U19 = allMembers.filter(
    (member) => member.title === 'Compétition U15-U19'
  );

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <Helmet>
        <title>Compétiteurs - ALJ Escalade Jonage</title>
        <meta name="description" content="Liste des compétiteurs du club d'escalade, répartis par catégories." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center items-center gap-4 flex-wrap">
            <h1 className="text-4xl font-bold headline">Nos Compétiteurs</h1>
            <Button onClick={() => navigate('/annual-summary?tab=participation')} variant="outline">
                <ListChecks className="w-4 h-4 mr-2" /> Récap Annuel
            </Button>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          La fierté du club, nos athlètes qui nous représentent sur les murs de la région et au-delà.
        </p>
      </motion.div>

      <CompetitorGroup
        title="Compétition U11-U15"
        competitors={competitorsU11U15}
        onEdit={(member) => openEditFormForMember(member)}
        isAdmin={isAdmin}
        participationStats={participationStats}
        onStatClick={handleStatClick}
      />
      <CompetitorGroup
        title="Compétition U15-U19"
        competitors={competitorsU15U19}
        onEdit={(member) => openEditFormForMember(member)}
        isAdmin={isAdmin}
        participationStats={participationStats}
        onStatClick={handleStatClick}
      />

      <AnimatePresence>
        {isFormVisible && isAdmin && (
          <MemberForm
            member={editingMember}
            onSave={handleSaveMember}
            onCancel={closeEditForm}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
      
      {modalInfo.isOpen && (
        <CompetitionListModal
            competitions={modalInfo.competitions}
            discipline={modalInfo.discipline}
            onClose={ closeModal }
        />
      )}
    </div>
  );
};

export default Competitors;
