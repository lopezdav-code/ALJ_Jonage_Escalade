import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PhotoUploadForm = ({ competition, onSave, onCancel, isSaving }) => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length > 0) {
      onSave(competition.id, files);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter des photos pour {competition.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="photos">Sélectionner des photos</Label>
            <Input id="photos" type="file" multiple onChange={handleFileChange} accept="image/*" />
            {files.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">{files.length} photo(s) sélectionnée(s)</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={isSaving || files.length === 0}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Télécharger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUploadForm;
