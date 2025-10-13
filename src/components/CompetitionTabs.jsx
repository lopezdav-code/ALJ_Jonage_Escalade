import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MemberImage from '@/components/MemberImage';
import { Button } from '@/components/ui/button';
import { Pencil, Shield, Star, Mail, Phone, Award } from 'lucide-react';

const CompetitionTabs = ({ members, onEdit }) => {
  // Members are already filtered in the parent component
  const competitionMembers = members;

  // Group by category
  const membersByCategory = competitionMembers.reduce((acc, member) => {
    const category = member.category || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(member);
    return acc;
  }, {});

  const categories = Object.keys(membersByCategory).sort();

  const CompetitionRow = ({ member, onEdit }) => {
    const hasEmergencyContact = !!(member.emergency_contact_1_id || member.emergency_contact_2_id);

    return (
      <tr className="border-b">
        <td className="p-2">
          <MemberImage member={member} />
        </td>
        <td className="p-2">{member.first_name}</td>
        <td className="p-2">{member.last_name}</td>
        <td className="p-2">{member.title}</td>
        <td className="p-2">
          <div className="flex items-center gap-2">
            {hasEmergencyContact && <Shield className="h-5 w-5 text-blue-500" title="A un contact d'urgence" />}
            {member.sexe === 'H' && <span className="font-bold text-blue-600" title="Homme">♂</span>}
            {member.sexe === 'F' && <span className="font-bold text-pink-600" title="Femme">♀</span>}
            {!!member.email && <Mail className="h-4 w-4 text-slate-500" title="Email renseigné" />}
            {!!member.phone && <Phone className="h-4 w-4 text-slate-500" title="Téléphone renseigné" />}
            {member.brevet_federaux && member.brevet_federaux.length > 0 && <Award className="h-4 w-4 text-green-500" title="A des brevets fédéraux" />}
          </div>
        </td>
        <td className="p-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(member)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <Tabs defaultValue={categories[0]} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category}>
            {category} ({membersByCategory[category].length})
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category} value={category}>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4">{category}</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Photo</th>
                  <th className="p-2 text-left">Prénom</th>
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2 text-left">Groupe</th>
                  <th className="p-2 text-left">Info</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {membersByCategory[category].map((member) => (
                  <CompetitionRow key={member.id} member={member} onEdit={onEdit} />
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default CompetitionTabs;