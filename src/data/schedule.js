// ============================================
// Fichier de configuration pour le planning
// Les données du planning sont maintenant stockées en base de données
// Ce fichier ne contient plus que les constantes utilisées par l'interface
// ============================================

// Génération des créneaux horaires de 10h à 23h par pas de 30 minutes
export const timeSlots = Array.from({ length: (23 - 10) * 2 + 1 }, (_, i) => {
  const hour = 10 + Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});


export const days = [
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
];

export const ageCategories = [
  { category: "U9", school: "CE1-CE2" },
  { category: "U11", school: "CM1-CM2" },
  { category: "U13", school: "6ème-5ème" },
  { category: "U15", school: "4ème-3ème" },
  { category: "U17", school: "2nde-1ère" },
  { category: "U19", school: "Terminale-Bac+1" },
  { category: "Senior", school: "Adultes" },
  { category: "Vétéran", school: "40+ ans" }
];