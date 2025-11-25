import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const CompetitionFilters = ({ filters, onFilterChange, onClearFilters, hideClosed, onHideClosedChange }) => {
  const niveaux = ['Tous', 'Départemental', 'Régional', 'National'];
  const natures = ['Toutes', 'Contest', 'Open', 'Coupe', 'Championnat'];
  const disciplines = ['Toutes', 'Bloc', 'Difficulté', 'Vitesse', 'Combiné'];
  const statuts = ['Tous', 'À venir', 'En cours', 'Clos'];

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value === 'Tous' || value === 'Toutes' ? '' : value });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="w-5 h-5" />
          Filtres
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Recherche textuelle */}
        <div className="space-y-2">
          <Label htmlFor="search">Rechercher</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Nom, lieu..."
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtre par statut */}
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select
            value={filters.status || 'Tous'}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              {statuts.map(statut => (
                <SelectItem key={statut} value={statut}>{statut}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par niveau */}
        <div className="space-y-2">
          <Label htmlFor="niveau">Niveau</Label>
          <Select
            value={filters.niveau || 'Tous'}
            onValueChange={(value) => handleChange('niveau', value)}
          >
            <SelectTrigger id="niveau">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              {niveaux.map(niveau => (
                <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par nature */}
        <div className="space-y-2">
          <Label htmlFor="nature">Nature</Label>
          <Select
            value={filters.nature || 'Toutes'}
            onValueChange={(value) => handleChange('nature', value)}
          >
            <SelectTrigger id="nature">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              {natures.map(nature => (
                <SelectItem key={nature} value={nature}>{nature}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par discipline */}
        <div className="space-y-2">
          <Label htmlFor="discipline">Discipline</Label>
          <Select
            value={filters.discipline || 'Toutes'}
            onValueChange={(value) => handleChange('discipline', value)}
          >
            <SelectTrigger id="discipline">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              {disciplines.map(discipline => (
                <SelectItem key={discipline} value={discipline}>{discipline}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-4">
        <Checkbox
          id="hideClosed"
          checked={hideClosed}
          onCheckedChange={onHideClosedChange}
        />
        <Label htmlFor="hideClosed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Masquer les compétitions closes
        </Label>
      </div>
    </div>
  );
};

export default CompetitionFilters;
