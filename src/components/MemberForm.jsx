import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, UploadCloud, Trash2, UserPlus, ChevronsUpDown, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatName } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/components/ui/use-toast';

const categoryOptions = {
  "Loisir enfants": ["mercredi 13h Groupe A", "mercredi 13h Groupe B", "mercredi 16h", "vendredi"],
  "Loisir collége": ["Mardi 18h", "Jeudi 18h"],
  "Loisir lycée": [],
  "Loisir adulte": [],
  "Adultes autonomes": [],
  "Compétition U11-U15": [],
  "Compétition U15-U19": [],
  "Bénévole": [],
  "Bureau": [],
  "emergency_contact": [],
};

const ageCategoryOptions = ['U11', 'U13', 'U15', 'U17', 'U19'];
const passeportOptions = ['Blanc', 'Jaune', 'Orange', 'Vert', 'Bleu', 'Violet', 'Rouge'];
const brevetOptions = [
  'Initiateur SAE', 'Juge Bloc 1', 'Juge Bloc 2', 'Juge Bloc 3',
  'Juge de difficulté 1', 'Juge de difficulté 2', 'Juge de difficulté 3',
  'Gestionanaire EPI', 'Entraineur d\'escalade 1', 'Entraineur d\'escalade 2'
];

const MemberForm = ({ member, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', title: '', sub_group: '', category: '',
    phone: '', photo_url: '',
    sexe: '', licence: '', email: '', passeport: '',
    emergency_contact_1_id: null, emergency_contact_2_id: null,
    ...member,
    brevet_federaux: member?.brevet_federaux || [],
  });
  const [newImageFile, setNewImageFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(member?.photo_url || null);
  const [allMembers, setAllMembers] = useState([]);
  const [isContactForDialogOpen, setIsContactForDialogOpen] = useState(false);
  const [isEmergencyContactDialogOpen, setIsEmergencyContactDialogOpen] = useState(false);
  const [editingContactField, setEditingContactField] = useState(null);
  const [isEmergencyContactFor, setIsEmergencyContactFor] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllMembers = async () => {
      const { data, error } = await supabase.from('members').select('id, first_name, last_name').order('last_name').order('first_name');
      if (!error) {
        setAllMembers(data);
      }
    };
    fetchAllMembers();

    if (member?.id) {
      const fetchIsEmergencyContactFor = async () => {
        const { data, error } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .or(`emergency_contact_1_id.eq.${member.id},emergency_contact_2_id.eq.${member.id}`);
        if (!error) {
          setIsEmergencyContactFor(data);
        }
      };
      fetchIsEmergencyContactFor();
    }
  }, [member]);

  const emergencyContact1 = useMemo(() => allMembers.find(m => m.id === formData.emergency_contact_1_id), [allMembers, formData.emergency_contact_1_id]);
  const emergencyContact2 = useMemo(() => allMembers.find(m => m.id === formData.emergency_contact_2_id), [allMembers, formData.emergency_contact_2_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    const newFormData = { ...formData, [name]: value };
    if (name === 'title') newFormData.sub_group = '';
    setFormData(newFormData);
  };

  const handleCheckboxChange = (value) => {
    setFormData(prev => {
      const newBrevets = prev.brevet_federaux.includes(value)
        ? prev.brevet_federaux.filter(item => item !== value)
        : [...prev.brevet_federaux, value];
      return { ...prev, brevet_federaux: newBrevets };
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, photo_url: URL.createObjectURL(file) }));
    }
  };
  
  const handleDeletePhoto = () => {
    setNewImageFile(null);
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo_url: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isEmergencyContactFor, ...dataToSave } = formData;
    onSave({ ...dataToSave }, newImageFile);
  };

  const handleSetAsEmergencyContact = async (targetMemberId) => {
    if (!member || !member.id) {
      toast({ title: "Erreur", description: "Le membre actuel doit être sauvegardé avant de pouvoir être défini comme contact d'urgence.", variant: "destructive" });
      return;
    }

    const { data: targetMember, error: fetchError } = await supabase
      .from('members')
      .select('emergency_contact_1_id, emergency_contact_2_id')
      .eq('id', targetMemberId)
      .single();

    if (fetchError) {
      toast({ title: "Erreur", description: "Impossible de récupérer les informations du membre cible.", variant: "destructive" });
      return;
    }

    let updateData;
    if (!targetMember.emergency_contact_1_id) {
      updateData = { emergency_contact_1_id: member.id };
    } else if (!targetMember.emergency_contact_2_id) {
      updateData = { emergency_contact_2_id: member.id };
    } else {
      toast({ title: "Information", description: "Ce membre a déjà deux contacts d'urgence.", variant: "default" });
      return;
    }

    const { error: updateError } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', targetMemberId);

    if (updateError) {
      toast({ title: "Erreur", description: "Échec de la mise à jour du contact d'urgence.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Contact d'urgence défini avec succès.", variant: "success" });
      setIsContactForDialogOpen(false);
    }
  };

  const openEmergencyContactDialog = (field) => {
    setEditingContactField(field);
    setIsEmergencyContactDialogOpen(true);
  };

  const handleEmergencyContactSelect = (memberId) => {
    if (editingContactField) {
      handleSelectChange(editingContactField, memberId);
    }
    setIsEmergencyContactDialogOpen(false);
    setEditingContactField(null);
  };

  const subGroupOptions = formData.title ? categoryOptions[formData.title] || [] : [];

  return (
    <>
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{member && member.id ? 'Modifier le membre' : 'Ajouter un membre'}</DialogTitle>
              <DialogDescription>Remplissez les informations ci-dessous.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={photoPreview} alt="Avatar" />
                  <AvatarFallback className="text-3xl"><User className="w-12 h-12" /></AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button type="button" asChild variant="outline">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <UploadCloud className="mr-2 h-4 w-4" /> Changer
                    </Label>
                  </Button>
                  {photoPreview && 
                      <Button type="button" variant="destructive" onClick={handleDeletePhoto}>
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </Button>
                  }
                </div>
                <Input id="photo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Prénom</Label><Input name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
                <div><Label>Nom</Label><Input name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input name="email" type="email" value={formData.email || ''} onChange={handleChange} /></div>
                <div><Label>Téléphone</Label><Input name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Sexe</Label><Select name="sexe" value={formData.sexe || ''} onValueChange={(v) => handleSelectChange('sexe', v)}><SelectTrigger><SelectValue placeholder="Sexe" /></SelectTrigger><SelectContent><SelectItem value="H">Homme</SelectItem><SelectItem value="F">Femme</SelectItem></SelectContent></Select></div>
                <div><Label>Licence</Label><Input name="licence" value={formData.licence || ''} onChange={handleChange} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Titre/Catégorie</Label><Select name="title" value={formData.title} onValueChange={(v) => handleSelectChange('title', v)}><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger><SelectContent>{Object.keys(categoryOptions).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Sous-groupe</Label><Select name="sub_group" value={formData.sub_group} onValueChange={(v) => handleSelectChange('sub_group', v)} disabled={subGroupOptions.length === 0}><SelectTrigger><SelectValue placeholder="Sous-groupe" /></SelectTrigger><SelectContent>{subGroupOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Catégorie d'âge (Compétition)</Label><Select name="category" value={formData.category || ''} onValueChange={(v) => handleSelectChange('category', v)}><SelectTrigger><SelectValue placeholder="Catégorie d'âge" /></SelectTrigger><SelectContent><SelectItem value="">Aucune</SelectItem>{ageCategoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Passeport</Label><Select name="passeport" value={formData.passeport || ''} onValueChange={(v) => handleSelectChange('passeport', v)}><SelectTrigger><SelectValue placeholder="Passeport" /></SelectTrigger><SelectContent><SelectItem value="">Aucun</SelectItem>{passeportOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><Label>Brevets Fédéraux</Label><div className="grid grid-cols-2 gap-2 mt-2">{brevetOptions.map(b => <div key={b} className="flex items-center gap-2"><Checkbox id={`b-${b}`} checked={formData.brevet_federaux.includes(b)} onCheckedChange={() => handleCheckboxChange(b)} /> <Label htmlFor={`b-${b}`} className="font-normal">{b}</Label></div>)}</div></div>
              
              <div>
                <Label>Contact d'urgence 1</Label>
                <Button variant="outline" type="button" className="w-full justify-between" onClick={() => openEmergencyContactDialog('emergency_contact_1_id')}>
                  {emergencyContact1 ? formatName(emergencyContact1.first_name, emergencyContact1.last_name, true) : "Sélectionner un contact"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </div>
              <div>
                <Label>Contact d'urgence 2</Label>
                <Button variant="outline" type="button" className="w-full justify-between" onClick={() => openEmergencyContactDialog('emergency_contact_2_id')}>
                  {emergencyContact2 ? formatName(emergencyContact2.first_name, emergencyContact2.last_name, true) : "Sélectionner un contact"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </div>

              {member?.id && (
                <div className="space-y-2">
                  <Button type="button" variant="secondary" onClick={() => setIsContactForDialogOpen(true)} className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" /> Je suis le contact de...
                  </Button>
                  {isEmergencyContactFor.length > 0 && (
                    <div>
                      <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Contact d'urgence pour :</Label>
                      <ul className="text-sm list-disc list-inside mt-1">
                        {isEmergencyContactFor.map(p => <li key={p.id}>{formatName(p.first_name, p.last_name, true)}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
              <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isContactForDialogOpen} onOpenChange={setIsContactForDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Définir comme contact d'urgence</DialogTitle>
            <DialogDescription>
              Sélectionnez le membre pour lequel {formatName(formData.first_name, formData.last_name, true)} sera le contact d'urgence.
            </DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Rechercher un membre..." />
            <CommandList>
              <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
              <CommandGroup>
                {allMembers.filter(m => m.id !== member?.id).map((targetMember) => (
                  <CommandItem
                    key={targetMember.id}
                    value={`${targetMember.first_name} ${targetMember.last_name}`}
                    onSelect={() => handleSetAsEmergencyContact(targetMember.id)}
                  >
                    {formatName(targetMember.first_name, targetMember.last_name, true)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmergencyContactDialogOpen} onOpenChange={setIsEmergencyContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sélectionner un contact d'urgence</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Rechercher un membre..." />
            <CommandList>
              <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={() => handleEmergencyContactSelect(null)}>
                  Aucun
                </CommandItem>
                {allMembers.filter(m => m.id !== member?.id).map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={`${contact.first_name} ${contact.last_name}`}
                    onSelect={() => handleEmergencyContactSelect(contact.id)}
                  >
                    {formatName(contact.first_name, contact.last_name, true)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MemberForm;