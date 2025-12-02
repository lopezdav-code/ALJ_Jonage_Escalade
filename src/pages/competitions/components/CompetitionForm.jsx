import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CompetitionForm = ({ competition, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '', short_title: '', numero: '', start_date: '', end_date: '', location: '',
    more_info_link: '', niveau: '', nature: '', categories: [], disciplines: [],
    image_url: '', details_format: '', details_description: '', details_schedule: [],
    prix: 0,
    ...(competition || {}),
    categories: competition?.categories || [],
    disciplines: competition?.disciplines || [],
    details_schedule: competition?.details_schedule || [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [options, setOptions] = useState({ niveau: [], nature: [], disciplines: [] });
  const categoryOptions = ['U11', 'U13', 'U15', 'U17', 'U19', 'Sénior', 'Vétéran'];

  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase.from('competitions').select('niveau, nature, disciplines');
      if (error) {
        console.error("Error fetching competition options", error);
        return;
      }
      const niveau = [...new Set(data.map(c => c.niveau).filter(Boolean))];
      const nature = [...new Set(data.map(c => c.nature).filter(Boolean))];
      const disciplines = [...new Set(data.flatMap(c => c.disciplines).filter(Boolean))];
      setOptions({ niveau, nature, disciplines });
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, imageFile });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{competition && competition.id ? 'Modifier la compétition' : 'Créer une compétition'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="short_title" className="text-right">Titre court</Label>
              <Input id="short_title" name="short_title" value={formData.short_title} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero" className="text-right">Numéro officiel</Label>
              <Input id="numero" name="numero" value={formData.numero} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_date" className="text-right">Date de début</Label>
              <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_date" className="text-right">Date de fin</Label>
              <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">Lieu</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="more_info_link" className="text-right">Lien d'infos</Label>
              <Input id="more_info_link" name="more_info_link" value={formData.more_info_link} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="niveau" className="text-right">Niveau</Label>
              <Select name="niveau" value={formData.niveau} onValueChange={(v) => handleSelectChange('niveau', v)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Niveau" /></SelectTrigger><SelectContent>{options.niveau.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nature" className="text-right">Nature</Label>
              <Select name="nature" value={formData.nature} onValueChange={(v) => handleSelectChange('nature', v)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Nature" /></SelectTrigger><SelectContent>{options.nature.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Catégories</Label>
              <div className="col-span-3 grid grid-cols-3 gap-2">{categoryOptions.map(c => <div key={c} className="flex items-center gap-2"><Checkbox id={`cat-${c}`} checked={formData.categories.includes(c)} onCheckedChange={() => handleMultiSelectChange('categories', c)} /> <Label htmlFor={`cat-${c}`} className="font-normal">{c}</Label></div>)}</div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Disciplines</Label>
              <div className="col-span-3 grid grid-cols-3 gap-2">{options.disciplines.map(d => <div key={d} className="flex items-center gap-2"><Checkbox id={`dis-${d}`} checked={formData.disciplines.includes(d)} onCheckedChange={() => handleMultiSelectChange('disciplines', d)} /> <Label htmlFor={`dis-${d}`} className="font-normal">{d}</Label></div>)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prix" className="text-right">Prix</Label>
              <Input id="prix" name="prix" type="number" value={formData.prix} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">Image</Label>
              <Input id="image" type="file" onChange={handleFileChange} className="col-span-3" accept="image/*" />
            </div>
            {formData.image_url && !imageFile && <div className="col-start-2 col-span-3"><img src={formData.image_url} alt="Aperçu" className="h-20 rounded-md" /></div>}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details_format" className="text-right">Format détails</Label>
              <Input id="details_format" name="details_format" value={formData.details_format} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details_description" className="text-right">Description détails</Label>
              <Textarea id="details_description" name="details_description" value={formData.details_description} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details_schedule" className="text-right">Programme</Label>
              <Textarea id="details_schedule" name="details_schedule" value={formData.details_schedule.join('\n')} onChange={(e) => setFormData(prev => ({ ...prev, details_schedule: e.target.value.split('\n') }))} className="col-span-3" placeholder="Une entrée par ligne" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompetitionForm;
