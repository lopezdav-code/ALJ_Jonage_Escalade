import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatName } from '@/lib/utils';
import DisciplineBadge from './DisciplineBadge';
import { Edit, Trash2, Users, Calendar, MapPin, ExternalLink, Info, ChevronsUpDown, Award, UserPlus, ImagePlus, X, Trophy } from 'lucide-react';

const ParticipantList = ({ participants, showAdminFeatures, onRanking, onDeleteParticipant }) => {
  if (!participants || participants.length === 0) return null;

  const roleOrder = { 'belayer': 1, 'judge': 2, 'competitor': 3 };
  const sortedParticipants = [...participants].sort((a, b) => {
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
  
  const roleNames = { belayer: 'Coaches', judge: 'Arbitres', competitor: 'Compétiteurs' };

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
                        <Button variant="ghost" size="sm" onClick={() => onRanking(p)}><Award className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteParticipant(p.id, p.competition_id)}><Trash2 className="w-4 h-4" /></Button>
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
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteParticipant(p.id, p.competition_id)}>
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


const CompetitionCard = ({ comp, participants, showAdminFeatures, onEdit, onDelete, onAddParticipant, onRanking, onDeleteParticipant, onAddPhotos, onDeletePhoto, onImageView }) => {
  return (
    <Card className="overflow-hidden">
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
          <ParticipantList participants={participants} showAdminFeatures={showAdminFeatures} onRanking={onRanking} onDeleteParticipant={onDeleteParticipant} />
        </div>
        {comp.photo_gallery && comp.photo_gallery.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-xl mb-2">Photos</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {comp.photo_gallery.map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img src={photoUrl} alt={`Photo de la compétition ${index + 1}`} className="w-full h-32 object-cover rounded-md cursor-pointer" onClick={() => onImageView(photoUrl, comp.photo_gallery)} />
                  {showAdminFeatures && (
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDeletePhoto(comp.id, photoUrl)}>
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
              <Button variant="outline" onClick={() => onAddPhotos(comp)}>
                <ImagePlus className="w-4 h-4 mr-2" /> Ajouter des photos
              </Button>
            )}
          </div>
          {showAdminFeatures && (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => onAddParticipant(comp)}><UserPlus className="w-4 h-4 mr-2" />Ajouter un participant</Button>
              <Button variant="secondary" onClick={() => onEdit(comp)}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
              <Button variant="destructive" onClick={() => onDelete(comp.id)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitionCard;
