import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const InstructorAutocomplete = ({ value, onChange, members, label }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedMember = members?.find(m => m.id === value);

  // Filtrer les membres selon le terme de recherche
  const filteredMembers = (members || []).filter((member) => {
    if (!searchTerm) return true;
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (member) => {
    onChange(member.id);
    setSearchTerm('');
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
    setOpen(false);
  };

  const handleInputClick = () => {
    setOpen(true);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredMembers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredMembers.length) {
          handleSelect(filteredMembers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label && <label className="text-sm font-medium">{label}</label>}

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : "Rechercher un encadrant..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpen(true);
                setHighlightedIndex(-1);
              }}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
              className={cn(
                "pr-8",
                selectedMember && !searchTerm && "font-medium"
              )}
            />
            {selectedMember && !searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-64 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Aucun encadrant trouvé.
              </div>
            ) : (
              filteredMembers.map((member, index) => {
                const fullName = `${member.first_name} ${member.last_name}`;
                const isSelected = value === member.id;
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={member.id}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center gap-2 text-sm",
                      isHighlighted && "bg-accent",
                      isSelected && "font-medium"
                    )}
                    onClick={() => handleSelect(member)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{fullName}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorAutocomplete;
