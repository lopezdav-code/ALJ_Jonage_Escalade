import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, Award, Star, Heart, Briefcase, Edit, Users, Trophy, CreditCard } from 'lucide-react';
import { formatName } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const MemberDetailCard = () => {
  const { isDetailVisible, hideMemberDetails, selectedMember, loading, openEditFormForMember, showMemberDetails } = useMemberDetail();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const getInitials = (firstName, lastName) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const handleEditClick = () => {
    if (selectedMember) {
      openEditFormForMember(selectedMember);
    }
  };

  const handleContactClick = (memberId) => {
    if (!memberId) return;
    showMemberDetails(memberId);
  };

  const handleSummaryClick = () => {
    if (selectedMember) {
      hideMemberDetails();
      navigate(`/competitor-summary/${selectedMember.id}`);
    }
  };

  const allRoles = [
    ...(selectedMember?.sub_group ? [selectedMember.sub_group] : []),
    ...(selectedMember?.dynamic_roles || [])
  ].filter(Boolean);

  const isCompetitor = selectedMember?.title?.startsWith('Compétition');

  return (
    <Dialog open={isDetailVisible} onOpenChange={hideMemberDetails}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence>
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-96"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </motion.div>
          ) : selectedMember && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <DialogHeader className="items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={selectedMember.photo_url} alt={formatName(selectedMember.first_name, selectedMember.last_name, isAdmin)} />
                  <AvatarFallback className="text-3xl">
                    {getInitials(selectedMember.first_name, selectedMember.last_name)}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl">{formatName(selectedMember.first_name, selectedMember.last_name, isAdmin)}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {allRoles.map(role => (
                    <Badge key={role} variant="secondary"><Briefcase className="w-3 h-3 mr-1.5" />{role}</Badge>
                  ))}
                  {selectedMember.passeport && <Badge variant="outline"><Star className="w-3 h-3 mr-1.5" />Passeport {selectedMember.passeport}</Badge>}
                </div>

                <div className="space-y-2">
                  {selectedMember.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedMember.email}`} className="hover:underline">{selectedMember.email}</a>
                    </div>
                  )}
                  {selectedMember.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedMember.phone}`} className="hover:underline">{selectedMember.phone}</a>
                    </div>
                  )}
                  {selectedMember.licence && (
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>Licence FFME: {selectedMember.licence}</span>
                    </div>
                  )}
                </div>

                {selectedMember.brevet_federaux && selectedMember.brevet_federaux.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Award className="w-4 h-4" /> Brevets Fédéraux</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.brevet_federaux.map(brevet => (
                        <Badge key={brevet} variant="default">{brevet}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedMember.emergency_contact_1 || selectedMember.emergency_contact_2) && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Heart className="w-4 h-4" /> Contacts d'urgence</h4>
                    <ul className="text-sm list-inside space-y-1">
                      {selectedMember.emergency_contact_1 && (
                        <li 
                          className="cursor-pointer hover:underline"
                          onClick={() => handleContactClick(selectedMember.emergency_contact_1.id)}
                        >
                          {formatName(selectedMember.emergency_contact_1.first_name, selectedMember.emergency_contact_1.last_name, isAdmin)} {isAdmin && selectedMember.emergency_contact_1.phone && `(${selectedMember.emergency_contact_1.phone})`}
                        </li>
                      )}
                      {selectedMember.emergency_contact_2 && (
                        <li 
                          className="cursor-pointer hover:underline"
                          onClick={() => handleContactClick(selectedMember.emergency_contact_2.id)}
                        >
                          {formatName(selectedMember.emergency_contact_2.first_name, selectedMember.emergency_contact_2.last_name, isAdmin)} {isAdmin && selectedMember.emergency_contact_2.phone && `(${selectedMember.emergency_contact_2.phone})`}
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {selectedMember.isEmergencyContactFor && selectedMember.isEmergencyContactFor.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Contact d'urgence pour</h4>
                    <ul className="text-sm list-inside space-y-1">
                      {selectedMember.isEmergencyContactFor.map(person => (
                        <li 
                          key={person.id}
                          className="cursor-pointer hover:underline"
                          onClick={() => handleContactClick(person.id)}
                        >
                          {formatName(person.first_name, person.last_name, isAdmin)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2">
                {isCompetitor && (
                  <Button onClick={handleSummaryClick} variant="outline" className="w-full">
                    <Trophy className="mr-2 h-4 w-4" /> Voir le palmarès
                  </Button>
                )}
                {isAdmin && (
                  <Button onClick={handleEditClick} className="w-full">
                    <Edit className="mr-2 h-4 w-4" /> Modifier le membre
                  </Button>
                )}
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailCard;