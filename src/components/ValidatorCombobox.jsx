import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/lib/customSupabaseClient';
import { Label } from '@/components/ui/label';

const ValidatorCombobox = ({ value, onChange, required = false }) => {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, title')
        .order('last_name')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (memberName) => {
    onChange(memberName);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="validateur">
        Nom du validateur {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className={cn(!value && "text-muted-foreground")}>
              {value || "Sélectionner un validateur..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un membre..." />
            <CommandEmpty>
              {loading ? "Chargement..." : "Aucun membre trouvé."}
            </CommandEmpty>
            <CommandList>
              <CommandGroup>
                {members.map((member) => {
                  const memberName = `${member.first_name} ${member.last_name}`;
                  return (
                    <CommandItem
                      key={member.id}
                      value={memberName}
                      onSelect={() => handleSelect(memberName)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === memberName ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{memberName}</span>
                        {member.title && (
                          <span className="text-xs text-muted-foreground">
                            {member.title}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ValidatorCombobox;
