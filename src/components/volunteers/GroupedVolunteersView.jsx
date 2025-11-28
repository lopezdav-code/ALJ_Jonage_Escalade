import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import VolunteerRow from './VolunteerRow';

const GroupedVolunteersView = ({ members, canEdit, canViewDetail, emergencyContactIds, navigate, activeTab }) => {
    const [activeFilter, setActiveFilter] = useState('all');

    const membersBySubGroup = useMemo(() => {
        return members.reduce((acc, member) => {
            const subGroup = member.groupInfo?.sous_category || 'Sans sous-groupe';
            if (!acc[subGroup]) {
                acc[subGroup] = [];
            }
            acc[subGroup].push(member);
            return acc;
        }, {});
    }, [members]);

    const subGroups = useMemo(() => Object.keys(membersBySubGroup).sort(), [membersBySubGroup]);

    const filteredMembers = useMemo(() => {
        if (activeFilter === 'all') return members;
        return membersBySubGroup[activeFilter] || [];
    }, [members, membersBySubGroup, activeFilter]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={activeFilter === 'all' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter('all')}
                    className="rounded-full"
                >
                    Tous ({members.length})
                </Button>
                {subGroups.map(subGroup => (
                    <Button
                        key={subGroup}
                        variant={activeFilter === subGroup ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter(subGroup)}
                        className="rounded-full"
                    >
                        {subGroup} ({membersBySubGroup[subGroup].length})
                    </Button>
                ))}
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

export default GroupedVolunteersView;
