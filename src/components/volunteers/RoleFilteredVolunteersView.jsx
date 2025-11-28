import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import VolunteerRow from './VolunteerRow';

const RoleFilteredVolunteersView = ({ members, canEdit, canViewDetail, emergencyContactIds, navigate, activeTab }) => {
    const [activeFilter, setActiveFilter] = useState('all');

    const filteredMembers = useMemo(() => {
        if (activeFilter === 'all') return members;
        if (activeFilter === 'ouvreur') {
            return members.filter(m => m.volunteerRoles && m.volunteerRoles.is_ouvreur);
        }
        if (activeFilter === 'encadrant') {
            return members.filter(m => m.volunteerRoles && m.volunteerRoles.is_encadrant);
        }
        return members;
    }, [members, activeFilter]);

    const counts = useMemo(() => {
        return {
            all: members.length,
            ouvreur: members.filter(m => m.volunteerRoles && m.volunteerRoles.is_ouvreur).length,
            encadrant: members.filter(m => m.volunteerRoles && m.volunteerRoles.is_encadrant).length
        };
    }, [members]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={activeFilter === 'all' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter('all')}
                    className="rounded-full"
                >
                    Tous ({counts.all})
                </Button>
                <Button
                    variant={activeFilter === 'ouvreur' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter('ouvreur')}
                    className="rounded-full"
                >
                    Ouvreur ({counts.ouvreur})
                </Button>
                <Button
                    variant={activeFilter === 'encadrant' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter('encadrant')}
                    className="rounded-full"
                >
                    Encadrant ({counts.encadrant})
                </Button>
            </div>

            <div className="overflow-x-auto border rounded-md">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="text-left p-2 font-medium">Photo</th>
                            <th className="text-left p-2 font-medium">Prénom</th>
                            <th className="text-left p-2 font-medium">Nom</th>
                            <th className="text-left p-2 font-medium">Groupe</th>
                            <th className="text-left p-2 font-medium">Info</th>
                            {(canEdit || canViewDetail) && <th className="text-left p-2 font-medium">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map((member) => (
                            <VolunteerRow
                                key={member.id}
                                member={member}
                                onEdit={(member) => navigate(`/member-edit/${member.id}`, { state: { fromTab: activeTab } })}
                                onView={(member) => navigate(`/member-view/${member.id}`, { state: { fromTab: activeTab } })}
                                isEmergencyContact={emergencyContactIds.has(member.id)}
                                showGroupDetails={true}
                                canEdit={canEdit}
                                canView={canViewDetail}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoleFilteredVolunteersView;
