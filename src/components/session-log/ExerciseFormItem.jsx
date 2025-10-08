import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, ArrowDown, X, Upload, Image as ImageIcon, BookMarked, Library } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExerciseFormItem = ({ exercise, index, total, onExerciseChange, onRemove, onMove, onImport }) => {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(exercise.image_url || null);
  const navigate = useNavigate();

  useEffect(() => {
    setPreviewUrl(exercise.image_url);
    if (exercise.image_url && imageFile && exercise.image_url !== URL.createObjectURL(imageFile)) {
        setImageFile(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.image_url]);

  const handleFieldChange = (field, value) => {
    onExerciseChange(index, { ...exercise, [field]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
      onExerciseChange(index, { ...exercise, newImageFile: file, image_url: newPreviewUrl });
    }
  };

  const handleGoToSheet = () => {
    if (exercise.pedagogy_sheet_id) {
      navigate(`/pedagogy#sheet-${exercise.pedagogy_sheet_id}`);
    }
  };

  return (
    <Card className="p-4 relative bg-muted/40">
      <div className="absolute top-2 right-2 flex gap-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => onMove(index, -1)} disabled={index === 0}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => onMove(index, 1)} disabled={index === total - 1}>
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
          <X className="w-4 h-4 text-destructive" />
        </Button>
      </div>
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onImport}>
          <BookMarked className="w-4 h-4 mr-2" /> Importer
        </Button>
        {exercise.pedagogy_sheet_id && (
          <Button type="button" variant="secondary" size="sm" onClick={handleGoToSheet} title="Voir la fiche pédagogique">
            <Library className="w-4 h-4 mr-2" /> Fiche
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
        <Input placeholder="Objectifs opérationnels" value={exercise.operational_objective || ''} onChange={(e) => handleFieldChange('operational_objective', e.target.value)} />
        <Input placeholder="Situation" value={exercise.situation || ''} onChange={(e) => handleFieldChange('situation', e.target.value)} />
        <Input placeholder="Organisation Temps/volume" value={exercise.organisation || ''} onChange={(e) => handleFieldChange('organisation', e.target.value)} />
        <Input placeholder="Consigne" value={exercise.consigne || ''} onChange={(e) => handleFieldChange('consigne', e.target.value)} />
        <Input placeholder="Temps (ex: 10min)" value={exercise.time || ''} onChange={(e) => handleFieldChange('time', e.target.value)} />
        <Input placeholder="Critère de réussite" value={exercise.success_criteria || ''} onChange={(e) => handleFieldChange('success_criteria', e.target.value)} />
        <Input placeholder="Régulation" value={exercise.regulation || ''} onChange={(e) => handleFieldChange('regulation', e.target.value)} />
        <Input placeholder="Lien support" value={exercise.support_link || ''} onChange={(e) => handleFieldChange('support_link', e.target.value)} />
        
        <div className="md:col-span-2 flex items-center gap-4">
          <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-background">
            {previewUrl ? (
              <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover rounded-md" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-grow">
            <label htmlFor={`image-upload-${index}`}>
              <Button type="button" variant="outline" size="sm" asChild className="cursor-pointer">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {imageFile ? "Changer l'image" : "Téléverser une image"}
                </span>
              </Button>
            </label>
            <Input id={`image-upload-${index}`} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            {exercise.image_url && !imageFile && <p className="text-xs text-muted-foreground mt-1">Image actuelle. Téléversez pour remplacer.</p>}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExerciseFormItem;