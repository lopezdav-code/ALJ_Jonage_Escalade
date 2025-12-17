import React from 'react';
import MemberImage from '@/components/MemberImage';
import { Button } from '@/components/ui/button';
import { Shield, Star, Mail, Phone, Award, Eye, Pencil } from 'lucide-react';

const VolunteerRow = React.memo(({ member, onEdit, onView, isEmergencyContact, showGroupDetails, canEdit, canView, showLicense }) => {
    const hasEmergencyContact = !!(member.emergency_contact_1_id || member.emergency_contact_2_id);
    return (
        <tr className="border-b">
            <td className="p-2">
                <MemberImage member={member} />
            </td>
            <td className="p-2">{member.first_name}</td>
            <td className="p-2">{member.last_name}</td>
            {showGroupDetails && (
                <td className="p-2">
                    <div className="text-sm">
                        {member.groupInfo && (
                            <>
                                {member.groupInfo.sous_category && <div>{member.groupInfo.sous_category}</div>}
                                {member.groupInfo.Groupe_schedule && <div className="text-xs text-muted-foreground">{member.groupInfo.Groupe_schedule}</div>}
                            </>
                        )}
                        {member.bureauInfo && member.bureauInfo.role && member.bureauInfo.role !== 'Bénévole' && (
                            <div className="font-medium text-blue-600">
                                {member.bureauInfo.role} {member.bureauInfo.sub_role}
                            </div>
                        )}
                        {member.volunteerRoles && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {member.volunteerRoles.is_ouvreur && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        Ouvreur
                                    </span>
                                )}
                                {member.volunteerRoles.is_encadrant && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                        Encadrant
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </td>
            )}
            {showLicense && (
                <td className="p-2">
                    <div className="text-sm font-mono text-slate-600">
                        {member.licence ? (
                            <a
                                href={`https://mycompet.ffme.fr/resultat/palmares_${member.licence}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                {member.licence}
                            </a>
                        ) : '-'}
                    </div>
                </td>
            )}
            <td className="p-2">
                <div className="flex items-center gap-2">
                    {hasEmergencyContact && <Shield className="h-5 w-5 text-blue-500" title="A un contact d'urgence" />}
                    {isEmergencyContact && <Star className="h-5 w-5 text-yellow-500" title="Est un contact d'urgence" />}
                    {member.sexe === 'H' && <span className="font-bold text-blue-600" title="Homme">♂</span>}
                    {member.sexe === 'F' && <span className="font-bold text-pink-600" title="Femme">♀</span>}
                    {!!member.email && <Mail className="h-4 w-4 text-slate-500" title="Email renseigné" />}
                    {!!member.phone && <Phone className="h-4 w-4 text-slate-500" title="Téléphone renseigné" />}
                    {member.brevet_federaux && member.brevet_federaux.length > 0 && <Award className="h-4 w-4 text-green-500" title="A des brevets fédéraux" />}
                </div>
            </td>
            <td className="p-2">
                <div className="flex items-center gap-1">
                    {canView && (
                        <Button variant="ghost" size="icon" onClick={() => onView(member)} title="Voir le détail">
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(member)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    return prevProps.member.id === nextProps.member.id;
});

VolunteerRow.displayName = 'VolunteerRow';

export default VolunteerRow;
