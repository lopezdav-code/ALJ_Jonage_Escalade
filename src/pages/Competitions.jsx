import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, PlusCircle, Loader2, Edit, Trash2, Users, Calendar, MapPin, ExternalLink, Info, ChevronsUpDown, Eye, Award, UserPlus, ImagePlus, X, BookOpen, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMemberDetail } from '@/contexts/MemberDetailContext';
import { formatName } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';

const DisciplineBadge = ({ discipline }) => {
  const normalizedDiscipline = discipline.toLowerCase().replace(/ /g, '');
  let variant = 'default';
  if (normalizedDiscipline.includes('bloc')) variant = 'bloc';
  else if (normalizedDiscipline.includes('difficulté')) variant = 'difficulte';
  else if (normalizedDiscipline.includes('vitesse')) variant = 'vitesse';

  return <Badge variant={variant}>{discipline}</Badge>;
};

const CompetitionForm = ({ competition, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '', short_title: '', start_date: '', end_date: '', location: '',
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

const AddParticipantForm = ({ onSave, onCancel, isSaving, members, competition }) => {
  const [selectedMember, setSelectedMember] = useState('');
  const [role, setRole] = useState('competitor');

  const filteredMembers = useMemo(() => {
    if (role === 'competitor') {
      return members.filter(m => 
        (m.title?.toLowerCase().includes('compétition') || m.sub_group?.toLowerCase().includes('compétition')) &&
        // protect against competition being null/undefined
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
                  <SelectItem value="belayer">Coach</SelectItem>
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
                <Input
                  id="ranking"
                  type="number"
                  value={ranking}
                  onChange={(e) => setRanking(e.target.value)}
                  placeholder="Entrez le classement"
                />
            </div>
            <div>
                <Label htmlFor="nb_competitor">Nombre de compétiteurs</Label>
                <Input
                  id="nb_competitor"
                  type="number"
                  value={nbCompetitor}
                  onChange={(e) => setNbCompetitor(e.target.value)}
                  placeholder="Nombre total"
                />
            </div>
          </div>
          <DialogFooter className="justify-between w-full">
            <div>
              <Button type="button" variant="outline" onClick={() => showMemberDetail(participant.member_id)} className="mr-2">
                <Eye className="w-4 h-4 mr-2" />
                Fiche détail
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to={`/competitor-summary/${participant.member_id}`} target="_blank">
                  <Award className="w-4 h-4 mr-2" />
                  Voir palmarès
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
            <Input
              id="photos"
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*"
            />
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

const VocabularySection = () => (
  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
    <h2 className="text-3xl font-bold headline flex items-center gap-3"><BookOpen className="w-8 h-8 text-primary" /> Vocabulaire</h2>
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg">Contest</h3>
          <p className="text-muted-foreground">Manifestation avec un règlement souple (idéal pour commencer). Ouvert aux compétiteurs concernés sous certaines réserves (niveau trop élevé notamment). À ne pas confondre avec une compétition en ‘mode contest’.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Open</h3>
          <p className="text-muted-foreground">Ouvert aux compétiteurs concernés sous certaines réserves (géographiques, nombre de places,…).</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Coupe</h3>
          <p className="text-muted-foreground">Ensemble de compétitions ouvert aux compétiteurs concernés avec ou sans critère de sélection.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Championnat</h3>
          <p className="text-muted-foreground">Une compétition avec généralement un critère de sélection.</p>
        </div>
      </CardContent>
    </Card>
  </motion.section>
);

const RegionalCupsSection = () => {
  const u13u15 = [
    { type: 'Coupes Régionales', location: 'Ambérieu en Bugey', date: 'samedi 11 octobre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Cusset Vichy Escalade', date: 'samedi 8 novembre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Voiron (U13)', date: 'samedi 28 février 2026', discipline: 'Vitesse', note: '' },
    { type: 'Coupes Régionales', location: 'La Dégaine Charbonnière', date: 'samedi 28 mars 2026', discipline: 'Difficulté et Vitesse', note: '' },
    { type: 'Championnats', location: 'Voiron (U15)', date: 'samedi 28 février 2026', discipline: 'Vitesse', note: '' },
    { type: 'Championnats', location: 'Jonage (U13/U11)', date: '25 et 26 avril 2026', discipline: 'Bloc/Difficulté et Vitesse', note: 'Organisé par notre club ! Qualificatif France.' },
  ];
  const u17plus = [
    { type: 'Coupes Régionales', location: 'Marignier', date: 'samedi 4 octobre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Clermont Ferrand', date: 'samedi 22 novembre 2025', discipline: 'Bloc', note: '' },
    { type: 'Coupes Régionales', location: 'Le Pouzin', date: 'samedi 31 janvier 2026', discipline: 'Difficulté', note: '' },
    { type: 'Coupes Régionales', location: 'Pont En Royans', date: 'samedi 21 mars 2026', discipline: 'Difficulté', note: '' },
    { type: 'Championnats', location: 'Anse', date: '13 et 14 décembre 2025', discipline: 'Bloc', note: 'Qualificatif France' },
    { type: 'Championnats', location: 'Voiron', date: 'samedi 28 février 2026', discipline: 'Vitesse', note: 'Qualificatif France' },
    { type: 'Championnats', location: 'Voiron', date: '18 et 19 avril 2026', discipline: 'Difficulté', note: 'Qualificatif France' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
      <h2 className="text-3xl font-bold headline">Coupes Régionales AURA</h2>
      <p className="text-muted-foreground">Le circuit de la Fédération Française de Montagne et d'Escalade – Ligue Auvergne Rhône Alpes. Notre club participe aux Coupes régionales escalade AURA. La ligue met en place 2 circuits de compétitions répartis sur l’ensemble de la région.</p>
      <div className="flex gap-4 flex-wrap">
        <Button asChild variant="link">
          <a href="https://www.ffmeaura.fr/competition/coupes-regionales-escalade/" target="_blank" rel="noreferrer">
            Plus d'infos sur les Coupes Régionales <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
        <Button asChild variant="link">
          <a href="https://www.ffmeaura.fr/competition/championnats-regionaux-escalade/" target="_blank" rel="noreferrer">
            Plus d'infos sur les Championnats Régionaux <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </div>
      <div className="space-y-8">
        <Card>
          <CardHeader><CardTitle>U13 / U15</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Lieu</TableHead><TableHead>Date</TableHead><TableHead>Discipline</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
              <TableBody>{u13u15.map((c, i) => <TableRow key={i}><TableCell>{c.location}</TableCell><TableCell>{c.date}</TableCell><TableCell><DisciplineBadge discipline={c.discipline} /></TableCell><TableCell>{c.note}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>U17 / U19 / Senior / Vétéran</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Lieu</TableHead><TableHead>Date</TableHead><TableHead>Discipline</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
              <TableBody>{u17plus.map((c, i) => <TableRow key={i}><TableCell>{c.location}</TableCell><TableCell>{c.date}</TableCell><TableCell><DisciplineBadge discipline={c.discipline} /></TableCell><TableCell>{c.note}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
};

const ContestTourSection = () => {
  const contests = [
    { location: 'Corbas', date: 'Dimanche 12 Octobre', discipline: 'Difficulté', category: 'U11/U13/U15', note: '' },
    { location: 'Saint-Genis-Laval (Mousteclip)', date: 'Dimanche 9 Novembre', discipline: 'Difficulté', category: 'De U11 à Vet', note: '' },
    { location: 'Anse', date: 'Mardi 11 Novembre', discipline: 'Vitesse', category: 'Championnat dep', note: '' },
    { location: 'St Pierre de Chandieu', date: 'Le samedi 15 et Dimanche 16 Novembre', discipline: 'Bloc', category: 'De U13 à Vet', note: 'Championnat dep' },
  ];
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-6">
      <h2 className="text-3xl font-bold headline">Le contest Tour : Le circuit pour tous !</h2>
      <p className="text-muted-foreground">Ce sont des compétitions, près de chez vous, accessibles à tous : débutants, handi-grimpeurs, adultes et enfants. Elles sont conviviales et festives, le format favorise la grimpe : essais illimités, prises bonus, voies en moulinette… Pour garantir l’équité, les meilleurs grimpeurs du territoire n’ont pas le droit de concourir sur ce circuit.</p>
      <Button asChild variant="link">
        <a href="https://www.ffme69.fr/competition/departementales-et-metropolitaines/" target="_blank" rel="noreferrer">
          Info FFME69 <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </Button>      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Lieu</TableHead><TableHead>Date</TableHead><TableHead>Discipline</TableHead><TableHead>Catégorie</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
            <TableBody>{contests.map((c, i) => <TableRow key={i}><TableCell>{c.location}</TableCell><TableCell>{c.date}</TableCell><TableCell><DisciplineBadge discipline={c.discipline} /></TableCell><TableCell>{c.category}</TableCell><TableCell>{c.note}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.section>
  );
};

const PalmaresSection = () => {
  const results = [
    { name: 'DIDIER Camille', category: 'DIFFICULTE-u20', rank: 31 },
    { name: 'ANTOLINOS Clément', category: 'BLOC-u18', rank: 42 },
    { name: 'SOLEYMIEUX OUSSELIN Lola', category: 'DIFFICULTE-Sen', rank: 77 },
    { name: 'NADRCIC Arsène', category: 'BLOC-u18', rank: 60 },
    { name: 'CAPUANO Olivia', category: 'DIFFICULTE-u20', rank: 144 },
    { name: 'COCHE Eden', category: 'DIFFICULTE-u16', rank: 63 },
    { name: 'POZZOBON Lucie', category: 'DIFFICULTE-u18', rank: 169 },
    { name: 'ROZIE Benoit', category: 'DIFFICULTE-u18', rank: 70 },
  ];
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-6">
      <h2 className="text-3xl font-bold headline flex items-center gap-3"><Star className="w-8 h-8 text-primary" /> Palmarès 2025</h2>
      <p className="text-xl font-semibold">ALJ Escalade Jonage : 83ème club de France !</p>
      <p className="text-muted-foreground">Félicitations à tous nos compétiteurs pour cette saison exceptionnelle ! Voici les résultats individuels qui ont contribué à ce classement historique.</p>
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Discipline/Catégorie</TableHead><TableHead>Classement</TableHead></TableRow></TableHeader>
            <TableBody>{results.map((r, i) => {
              const [discipline, cat] = r.category.split('-');
              return (
                <TableRow key={i}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <DisciplineBadge discipline={discipline} />
                    <span>{cat}</span>
                  </TableCell>
                  <TableCell>{r.rank}</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.section>
  );
};

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [participants, setParticipants] = useState({});
  const [members, setMembers] = useState([]);
  const [isAddParticipantFormVisible, setIsAddParticipantFormVisible] = useState(false);
  const [competitionForParticipant, setCompetitionForParticipant] = useState(null);
  const [isRankingFormVisible, setIsRankingFormVisible] = useState(false);
  const [participantForRanking, setParticipantForRanking] = useState(null);
  const [isPhotoUploadFormVisible, setIsPhotoUploadFormVisible] = useState(false);
  const [competitionForPhotos, setCompetitionForPhotos] = useState(null);
  const [viewingImage, setViewingImage] = useState({ url: null, index: -1, gallery: [] });

  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const fetchAllParticipants = useCallback(async (competitionIds) => {
    // two-step fetch: participants then members, merge into `members` property expected by UI
    if (!competitionIds || competitionIds.length === 0) return;
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from('competition_participants')
        .select('*')
        .in('competition_id', competitionIds);

      if (participantsError) {
        toast({ title: "Erreur", description: "Impossible de charger les participants.", variant: "destructive" });
        return;
      }

      const memberIds = [...new Set(participantsData.map(p => p.member_id).filter(Boolean))];

      let membersMap = {};
      if (memberIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, first_name, last_name, sexe, category')
          .in('id', memberIds);

        if (!membersError && membersData) {
          membersMap = Object.fromEntries(membersData.map(m => [m.id, m]));
        }
      }

      // attach member object under `members` (UI expects p.members)
      const merged = participantsData.map(p => ({ ...p, members: membersMap[p.member_id] || null }));

      const participantsByCompetition = merged.reduce((acc, p) => {
        if (!acc[p.competition_id]) acc[p.competition_id] = [];
        acc[p.competition_id].push(p);
        return acc;
       }, {});

    setParticipants(prev => ({ ...prev, ...participantsByCompetition }));
  } catch (err) {
    toast({ title: "Erreur", description: "Impossible de charger les participants.", variant: "destructive" });
  }
}, [toast]);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('competitions').select('*').order('start_date', { ascending: false });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les compétitions.", variant: "destructive" });
    } else {
      setCompetitions(data);
      if (data.length > 0) {
        fetchAllParticipants(data.map(c => c.id));
      }
    }
    setLoading(false);
  }, [toast, fetchAllParticipants]);


  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase.from('members').select('id, first_name, last_name, title, sub_group, category').order('last_name');
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les membres.", variant: "destructive" });
    } else {
      setMembers(data);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompetitions();
    fetchMembers();
  }, [fetchCompetitions, fetchMembers]);

  const uploadFile = async (file, bucket) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `competitions/${Date.now()}-${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const { imageFile, ...compData } = formData;
      
      if (imageFile) {
        const imageUrl = await uploadFile(imageFile, 'exercise_images');
        if (imageUrl) compData.image_url = imageUrl;
      }

      if (editingCompetition && editingCompetition.id) {
        const { error } = await supabase.from('competitions').update(compData).eq('id', editingCompetition.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('competitions').insert(compData).select().single();
        if (error) throw error;
      }
      toast({ title: "Succès", description: "Compétition sauvegardée." });
      setIsFormVisible(false);
      setEditingCompetition(null);
      await fetchCompetitions();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (competitionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette compétition ?")) return;
    try {
      await supabase.from('competition_participants').delete().eq('competition_id', competitionId);
      const { error } = await supabase.from('competitions').delete().eq('id', competitionId);
      if (error) throw error;
      toast({ title: "Succès", description: "Compétition supprimée." });
      fetchCompetitions();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleAddParticipant = async (participantData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_participants').insert(participantData);
      if (error) throw error;
      toast({ title: "Succès", description: "Participant ajouté." });
      fetchAllParticipants([participantData.competition_id]);
      setIsAddParticipantFormVisible(false);
      setCompetitionForParticipant(null);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParticipant = async (participantId, competitionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer ce participant ?")) return;
    try {
      const { error } = await supabase.from('competition_participants').delete().eq('id', participantId);
      if (error) throw error;
      toast({ title: "Succès", description: "Participant retiré." });
      fetchAllParticipants([competitionId]);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveRanking = async (participantId, ranking, nbCompetitor) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('competition_participants').update({ ranking: ranking || null, nb_competitor: nbCompetitor || null }).eq('id', participantId);
      if (error) throw error;
      toast({ title: "Succès", description: "Classement sauvegardé." });
      fetchAllParticipants([participantForRanking.competition_id]);
      setIsRankingFormVisible(false);
      setParticipantForRanking(null);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhotos = async (competitionId, files) => {
    setIsSaving(true);
    try {
      const uploadPromises = files.map(file => uploadFile(file, 'exercise_images'));
      const photoUrls = await Promise.all(uploadPromises);

      const { data: currentCompetition, error: fetchError } = await supabase
        .from('competitions')
        .select('photo_gallery')
        .eq('id', competitionId)
        .single();

      if (fetchError) throw fetchError;

      const existingPhotos = currentCompetition.photo_gallery || [];
      const updatedPhotos = [...existingPhotos, ...photoUrls.filter(url => url)];

      const { error: updateError } = await supabase
        .from('competitions')
        .update({ photo_gallery: updatedPhotos })
        .eq('id', competitionId);

      if (updateError) throw updateError;

      toast({ title: "Succès", description: "Photos ajoutées." });
      setIsPhotoUploadFormVisible(false);
      setCompetitionForPhotos(null);
      await fetchCompetitions();
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async (competitionId, photoUrl) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;
    
    const { data: currentCompetition, error: fetchError } = await supabase
      .from('competitions')
      .select('photo_gallery')
      .eq('id', competitionId)
      .single();

    if (fetchError) {
      toast({ title: "Erreur", description: "Impossible de récupérer les photos actuelles.", variant: "destructive" });
      return;
    }

    const updatedPhotos = (currentCompetition.photo_gallery || []).filter(p => p !== photoUrl);

    const { error: updateError } = await supabase
      .from('competitions')
      .update({ photo_gallery: updatedPhotos })
      .eq('id', competitionId);

    if (updateError) {
      toast({ title: "Erreur", description: "Impossible de supprimer la photo.", variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Photo supprimée." });
      await fetchCompetitions();
      
      const path = photoUrl.split('/').slice(-2).join('/');
      await supabase.storage.from('exercise_images').remove([path]);
    }
  };

  const showAdminFeatures = !authLoading && isAdmin;

  const renderParticipantList = (competitionId) => {
    const currentParticipants = participants[competitionId] || [];
    if (currentParticipants.length === 0) {
      return null;
    }

    const roleOrder = { 'belayer': 1, 'judge': 2, 'competitor': 3 };

    const sortedParticipants = [...currentParticipants].sort((a, b) => {
      const roleDiff = (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
      if (roleDiff !== 0) return roleDiff;

      if (a.role === 'competitor') {
        const categoryA = a.members?.category || '';
        const categoryB = b.members?.category || '';
        const categoryDiff = categoryA.localeCompare(categoryB);
        if (categoryDiff !== 0) return categoryDiff;

        const sexeA = a.members?.sexe || '';
        const sexeB = b.members?.sexe || '';
        return sexeA.localeCompare(sexeB);
      }
      
      return (a.members?.last_name || '').localeCompare(b.members?.last_name || '');
    });

    const groupedByRole = sortedParticipants.reduce((acc, p) => {
      if (!p.members) return acc;
      const role = p.role;
      if (!acc[role]) acc[role] = [];
      acc[role].push(p);
      return acc;
    }, {});
    
    const roleNames = {
      belayer: 'Coaches',
      judge: 'Arbitres',
      competitor: 'Compétiteurs',
    };

    return ['belayer', 'judge', 'competitor'].map(role => {
      const group = groupedByRole[role];
      if (!group || group.length === 0) return null;

      if (role === 'competitor') {
        const groupedCompetitors = group.reduce((acc, p) => {
          const key = `${p.members.category || 'N/A'} ${p.members.sexe || 'N/A'}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(p);
          return acc;
        }, {});

        return (
          <div key={role} className="mt-4">
            <h4 className="font-semibold text-lg mb-2">{roleNames[role]}</h4>
            {Object.entries(groupedCompetitors).map(([groupKey, competitors]) => (
              <div key={groupKey} className="mb-3">
                <p className="font-medium text-md text-muted-foreground">{groupKey}</p>
                <ul className="space-y-1 pl-4">
                  {competitors.map(p => (
                    <li key={p.id} className="flex items-center justify-between p-1 rounded-md">
                      <div className="flex items-center gap-2">
                        <span>{formatName(p.members.first_name, p.members.last_name, false)}</span>
                        {p.ranking && (
                          <span className="text-sm font-bold text-primary">
                            – {p.ranking}ème{p.nb_competitor ? ` / ${p.nb_competitor}` : ''}
                          </span>
                        )}
                      </div>
                      {showAdminFeatures && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setParticipantForRanking(p); setIsRankingFormVisible(true); }}><Award className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteParticipant(p.id, competitionId)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div key={role} className="mt-4">
          <h4 className="font-semibold text-lg mb-2">{roleNames[role]}</h4>
          <ul className="space-y-2">
            {group.map(p => (
              <li key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="font-medium">{formatName(p.members.first_name, p.members.last_name, true)}</span>
                {showAdminFeatures && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteParticipant(p.id, competitionId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const handleImageView = (url, gallery) => {
    const index = gallery.indexOf(url);
    setViewingImage({ url, index, gallery });
  };

  const showNextImage = () => {
    setViewingImage(prev => {
      const nextIndex = (prev.index + 1) % prev.gallery.length;
      return { ...prev, url: prev.gallery[nextIndex], index: nextIndex };
    });
  };

  const showPrevImage = () => {
    setViewingImage(prev => {
      const prevIndex = (prev.index - 1 + prev.gallery.length) % prev.gallery.length;
      return { ...prev, url: prev.gallery[prevIndex], index: prevIndex };
    });
  };

  const renderContent = () => {
    if (loading || authLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    if (competitions.length === 0) {
      return <p className="text-center text-muted-foreground py-16">Aucune compétition pour le moment.</p>;
    }

    return (
      <div className="space-y-8">
        {competitions.map((comp) => (
          <Card key={comp.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 p-4">
              {comp.image_url && <img src={comp.image_url} alt={comp.name} className="w-24 h-24 object-cover rounded-md" />}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{comp.name}</CardTitle>
                <p className="text-md text-muted-foreground">{new Date(comp.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Separator className="my-4" />
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-xl mb-2">Informations</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> <strong>Date:</strong> {new Date(comp.start_date).toLocaleDateString('fr-FR')} {comp.end_date && ` - ${new Date(comp.end_date).toLocaleDateString('fr-FR')}`}</li>
                    <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> <strong>Lieu:</strong> {comp.location}</li>
                    <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> <strong>Niveau:</strong> {comp.niveau}</li>
                    <li className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> <strong>Nature:</strong> {comp.nature}</li>
                    {comp.categories?.length > 0 && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> <strong>Catégories:</strong> {comp.categories.join(', ')}</li>}
                    {comp.disciplines?.length > 0 && <li className="flex items-center gap-2"><ChevronsUpDown className="w-4 h-4 text-primary" /> <strong>Disciplines:</strong> <div className="flex flex-wrap gap-1">{comp.disciplines.map(d => <DisciplineBadge key={d} discipline={d} />)}</div></li>}
                    {comp.prix > 0 && <li className="flex items-center gap-2"><span className="text-primary font-bold">€</span> <strong>Prix:</strong> {comp.prix} €</li>}
                  </ul>
                </div>
                <div>
                  {comp.details_description && <p className="mb-4">{comp.details_description}</p>}
                  {comp.details_schedule?.length > 0 && (
                    <>
                      <h5 className="font-semibold mb-2">Programme</h5>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {comp.details_schedule.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-xl mb-2">Participants</h4>
                {renderParticipantList(comp.id)}
              </div>
              
              {comp.photo_gallery && comp.photo_gallery.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-xl mb-2">Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {comp.photo_gallery.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Photo de la compétition ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md cursor-pointer"
                          onClick={() => handleImageView(photoUrl, comp.photo_gallery)}
                        />
                        {showAdminFeatures && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeletePhoto(comp.id, photoUrl)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  {comp.more_info_link && <Button asChild variant="outline"><a href={comp.more_info_link} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Plus d'infos</a></Button>}
                  {showAdminFeatures && (
                    <Button variant="outline" onClick={() => { setCompetitionForPhotos(comp); setIsPhotoUploadFormVisible(true); }}>
                      <ImagePlus className="w-4 h-4 mr-2" /> Ajouter des photos
                    </Button>
                  )}
                </div>
                {showAdminFeatures && (
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => { setCompetitionForParticipant(comp); setIsAddParticipantFormVisible(true); }}><UserPlus className="w-4 h-4 mr-2" />Ajouter un participant</Button>
                    <Button variant="secondary" onClick={() => { setEditingCompetition(comp); setIsFormVisible(true); }}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
                    <Button variant="destructive" onClick={() => handleDelete(comp.id)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Compétitions - ALJ Escalade Jonage</title>
        <meta name="description" content="Consultez le calendrier des compétitions d'escalade et les résultats." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold headline flex items-center gap-3">
            <Trophy className="w-10 h-10 text-primary" />
            Compétitions
          </h1>
          {showAdminFeatures && (
            <Button onClick={() => { setEditingCompetition(null); setIsFormVisible(true); }}>
              <PlusCircle className="w-4 h-4 mr-2" /> Ajouter une compétition
            </Button>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="club" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="club">Compétitions du club</TabsTrigger>
          <TabsTrigger value="federal">Calendrier des compétitions</TabsTrigger>
          <TabsTrigger value="palmares">Palmarès 2024-2025</TabsTrigger>
          <TabsTrigger value="vocabulaire">Vocabulaire</TabsTrigger>
        </TabsList>
        <TabsContent value="club" className="mt-6">
          {renderContent()}
        </TabsContent>
        <TabsContent value="federal" className="mt-6 space-y-12">
          <RegionalCupsSection />
          <ContestTourSection />
        </TabsContent>
        <TabsContent value="palmares" className="mt-6">
          <PalmaresSection />
        </TabsContent>
        <TabsContent value="vocabulaire" className="mt-6">
          <VocabularySection />
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {isFormVisible && showAdminFeatures && (
          <CompetitionForm
            key={editingCompetition && editingCompetition.id ? editingCompetition.id : 'new'}
            competition={editingCompetition}
            onSave={handleSave}
            onCancel={() => { setIsFormVisible(false); setEditingCompetition(null); }}
            isSaving={isSaving}
          />
        )}
        {isAddParticipantFormVisible && showAdminFeatures && (
          <AddParticipantForm
            onSave={handleAddParticipant}
            onCancel={() => { setIsAddParticipantFormVisible(false); setCompetitionForParticipant(null); }}
            isSaving={isSaving}
            members={members}
            competition={competitionForParticipant}
          />
        )}
        {isRankingFormVisible && showAdminFeatures && (
          <RankingForm
            participant={participantForRanking}
            onSave={handleSaveRanking}
            onCancel={() => { setIsRankingFormVisible(false); setParticipantForRanking(null); }}
            isSaving={isSaving}
          />
        )}
        {isPhotoUploadFormVisible && showAdminFeatures && (
          <PhotoUploadForm
            competition={competitionForPhotos}
            onSave={handleSavePhotos}
            onCancel={() => { setIsPhotoUploadFormVisible(false); setCompetitionForPhotos(null); }}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      <Dialog open={!!viewingImage.url} onOpenChange={() => setViewingImage({ url: null, index: -1, gallery: [] })}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
          <div className="relative">
            <img src={viewingImage.url} alt="Aperçu de la photo" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
            {viewingImage.gallery.length > 1 && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showPrevImage}>
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white" onClick={showNextImage}>
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Competitions;