import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const MemberDetailContext = createContext();

export const useMemberDetail = () => useContext(MemberDetailContext);

export const MemberDetailProvider = ({ children }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const showMemberDetails = useCallback(async (memberId) => {
    if (!memberId) return;
    setLoading(true);
    setIsDetailVisible(true);
    setSelectedMember(null);

    const memberDetailsPromise = supabase
      .from('members')
      .select(`
        *,
        profiles(role),
        emergency_contact_1:emergency_contact_1_id(id, first_name, last_name, phone),
        emergency_contact_2:emergency_contact_2_id(id, first_name, last_name, phone)
      `)
      .eq('id', memberId)
      .single();

    const isEmergencyContactForPromise = supabase
      .from('members')
      .select('id, first_name, last_name')
      .or(`emergency_contact_1_id.eq.${memberId},emergency_contact_2_id.eq.${memberId}`);

    const [
      { data: memberData, error: memberError },
      { data: isEmergencyContactForData, error: isEmergencyContactForError }
    ] = await Promise.all([memberDetailsPromise, isEmergencyContactForPromise]);

    if (memberError) {
      console.error("Error fetching member details:", memberError);
    }
    if (isEmergencyContactForError) {
      console.error("Error fetching 'is emergency contact for' data:", isEmergencyContactForError);
    }

    if (memberData) {
      const formattedMember = {
        ...memberData,
        profiles: Array.isArray(memberData.profiles) ? memberData.profiles[0] : memberData.profiles,
        dynamic_roles: [],
        isEmergencyContactFor: isEmergencyContactForData || []
      };
      setSelectedMember(formattedMember);
    }
    
    setLoading(false);
  }, []);

  const hideMemberDetails = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedMember(null);
  }, []);

  const openEditForm = useCallback((member) => {
    hideMemberDetails();
    setEditingMember(member);
    setIsFormVisible(true);
  }, [hideMemberDetails]);

  const closeEditForm = useCallback(() => {
    setIsFormVisible(false);
    setEditingMember(null);
  }, []);

  const value = useMemo(() => ({
    selectedMember,
    isDetailVisible,
    loading,
    showMemberDetails,
    hideMemberDetails,
    editingMember,
    isFormVisible,
    openEditForm,
    closeEditForm,
  }), [
    selectedMember,
    isDetailVisible,
    loading,
    showMemberDetails,
    hideMemberDetails,
    editingMember,
    isFormVisible,
    openEditForm,
    closeEditForm,
  ]);

  return (
    <MemberDetailContext.Provider value={value}>
      {children}
    </MemberDetailContext.Provider>
  );
};
