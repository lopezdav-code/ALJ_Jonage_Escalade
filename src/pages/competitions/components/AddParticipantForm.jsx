import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatName } from '@/lib/utils';

const AddParticipantForm = ({ onSave, onCancel, members, competition }) => {
  const [selectedMember, setSelectedMember] = useState('');
  const [role, setRole] = useState('competitor');

  const filteredMembers = useMemo(() => {
    if (role === 'competitor') {
      return members.filter(m => 
        (m.title?.toLowerCase().includes('compétition') || m.sub_group?.toLowerCase().includes('compétition')) &&
        ((competition?.categories?.length || 0) === 0 || competition?.categories?.includes(m.category))
      );
    }
    return members;
  }, [members, role, competition]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedMember) {
      onSave({
        competition_id: competition.id,
        member_id: selectedMember,
        role: role,
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter un participant</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="competitor">Compétiteur</SelectItem>
                  <SelectItem value="judge">Arbitre</SelectItem>
                  <SelectItem value="belayer">Coachs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="member">Membre</Label>
              <Command>
                <CommandInput placeholder="Rechercher un membre..." />
                <CommandList>
                  <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                  <CommandGroup>
                    {filteredMembers.map(member => (
                      <CommandItem
                        key={member.id}
                        value={`${member.first_name} ${member.last_name}`}
                        onSelect={() => {
                          setSelectedMember(member.id);
                          handleSubmit({ preventDefault: () => {} });
                        }}
                      >
                        {formatName(member.first_name, member.last_name, true)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParticipantForm;
