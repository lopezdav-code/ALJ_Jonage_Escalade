import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { appConfig } from "@/config";
import { ShieldCheck, User } from 'lucide-react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatName(firstName, lastName, forceFullName = false) {
  if (!firstName) return lastName || '';
  if (!lastName) return firstName || '';

  const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  
  if (forceFullName) {
    const formattedLastName = lastName.toUpperCase();
    return `${formattedFirstName} ${formattedLastName}`;
  }

  const formattedLastNameInitial = `${lastName.charAt(0).toUpperCase()}.`;
  return `${formattedFirstName} ${formattedLastNameInitial}`;
}

export function formatParticipantName(fullName) {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length < 2) return fullName;

    const firstName = parts.slice(0, -1).join(' ');
    const lastName = parts[parts.length - 1];
    
    return formatName(firstName, lastName);
}

export const ProfileIndicator = ({ profile }) => {
  if (!profile) return null;

  const roleDetails = {
    admin: { Icon: ShieldCheck, color: 'text-green-500', title: 'Administrateur' },
    adherent: { Icon: User, color: 'text-blue-500', title: 'Adhérent' },
    user: { Icon: User, color: 'text-gray-500', title: 'Utilisateur' },
  };

  const details = roleDetails[profile.role] || roleDetails.user;

  return (
    <details.Icon className={`h-4 w-4 ml-2 flex-shrink-0 ${details.color}`} title={details.title} />
  );
};