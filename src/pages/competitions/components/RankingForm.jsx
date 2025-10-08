import React, { useState } from 'react';
import { Loader2, Eye, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import { formatName } from '@/lib/utils';
import { Link } from 'react-router-dom';

const RankingForm = ({ participant, onSave, onCancel, isSaving }) => {
  const [ranking, setRanking] = useState(participant.ranking || '');
  const [nbCompetitor, setNbCompetitor] = useState(participant.nb_competitor || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(participant.id, ranking, nbCompetitor);
  };

  const { showMemberDetail } = useMemberDetail();

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Classement de {formatName(participant.members.first_name, participant.members.last_name, true)}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
                <Label htmlFor="ranking">Classement</Label>
                <Input id="ranking" type="number" value={ranking} onChange={(e) => setRanking(e.target.value)} placeholder="Entrez le classement" />
            </div>
            <div>
                <Label htmlFor="nb_competitor">Nombre de compétiteurs</Label>
                <Input id="nb_competitor" type="number" value={nbCompetitor} onChange={(e) => setNbCompetitor(e.target.value)} placeholder="Nombre total" />
            </div>
          </div>
          <DialogFooter className="justify-between w-full">
            <div>
              <Button type="button" variant="outline" onClick={() => showMemberDetail(participant.member_id)} className="mr-2">
                <Eye className="w-4 h-4 mr-2" /> Fiche détail
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to={`/competitor-summary/${participant.member_id}`} target="_blank">
                  <Award className="w-4 h-4 mr-2" /> Voir palmarès
                </Link>
              </Button>
            </div>
            <div>
              <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : 'Sauvegarder'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RankingForm;
