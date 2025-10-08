const scheduleCsvData = `Type;Age;Jour;Heure debut;Heure fin;Encadrant 1;Encadrant 2;Encadrant 3;Encadrant 4
Compétition;U15(2)-U17-U19;Lundi;18h;20h30;Stephane LORIDANT;;;
Compétition;U15(2)-U17-U19;Mercredi;18h;20h;Clément de Lima FERREIRA;;;
Compétition;U15(2)-U17-U19;Vendredi;18h30;20h30;Stephane LORIDANT;;;
Compétition;U11-U13-U15(1);Lundi;18h;20h30;Adrien BERGER;;;
Compétition;U11-U13-U15(1);Mercredi;16h;18h;Clément de Lima FERREIRA;;;
Compétition;U11-U13-U15(1);Vendredi;18h;20h;Clément de Lima FERREIRA;;;
Loisir;Enfants 2015-2017 Groupe A;Mercredi;13h;14h30;Thibault N;Antoine GAUTHIER;Edgar Bénévole;Rodolphe JULLIEN-MOUTELON
Loisir;Enfants 2015-2017 Groupe B;Mercredi;13h;14h30;Thibault N;Antoine GAUTHIER;Edgar Bénévole;Rodolphe JULLIEN-MOUTELON
Loisir;Enfants 2018-2019;Mercredi;16h;17h;Thibault N;;;
Loisir;Enfants 2018-2019;Vendredi;17h;18h;Camille DIDIER;Clément ANTOLINOS;Rodolphe JULLIEN-MOUTELON;
Loisir;Collégiens;Lundi;18h30;20h;Jean-Benoit RIOS;Camille DIDIER;Romain GOETHALS;Sabine MACKIEWICZ
Loisir;Collégiens;Mercredi;14h30;16h;Antoine GAUTHIER;Edgar Bénévole;Rodolphe JULLIEN-MOUTELON;
Loisir;Lycéens;Mardi;18h30;20h;David LOPEZ;Magali FREMY;Olivier BOSSET;Clement ANTOLINOS
Loisir;Adulte débutant;Mardi;20h;22h;Olivier BOSSET;Magaly HUE;;
Loisir;Enfants 2015-2017 Groupe A;Mercredi;10h30;12h;Tom Bénévole;;;
Perf;U13(2)-U15-U17-U19;Mercredi;14h30;16h;Thibault N;;;
Autonomes;Adultes;Vendredi;20h30;22h;Clément de Lima FERREIRA;;;
Autonomes;Adultes;Lundi;20h;22h;Nathalie LEROY;Richard ROMANET;;
Autonomes;Adultes;Mercredi;20h;22h;Marine BOURDAUD HUI;Magaly HUE;Mathieu BARAUD;
Autonomes;Adultes;Jeudi;18h;22h;Nathalie LEROY;Boris CATHERIN;Fabienne LAGARDE;
Perf;Adultes;Vendredi;20h;22h;Clément de Lima FERREIRA;;;
Autonomes;Adultes;Samedi;10h30;12h30;Pascal PARMENTIER;;;`;

const parseSchedule = (csvData) => {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(';').map(h => h.trim());
  const data = lines.slice(1).map((line, index) => {
    const values = line.split(';');
    const entry = { id: index + 1 };
    headers.forEach((header, i) => {
      entry[header] = values[i] ? values[i].trim() : '';
    });
    return entry;
  });
  return data;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '00:00';
  let formatted = timeStr.replace('h', ':');
  if (!formatted.includes(':')) formatted += ':00';
  if (formatted.endsWith(':')) formatted += '00';
  const parts = formatted.split(':');
  const hour = parts[0].padStart(2, '0');
  const minute = (parts[1] || '00').padStart(2, '0');
  return `${hour}:${minute}`;
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const BASE_START_MINUTES = 10 * 60;
const SLOT_LENGTH_MIN = 30;

const getColorForGroup = (group) => {
  switch (group) {
    case 'Compétition':
      return 'bg-red-200 text-red-800 border-red-300';
    case 'Loisir':
      return 'bg-blue-200 text-blue-800 border-blue-300';
    case 'Perf':
      return 'bg-green-200 text-green-800 border-green-300';
    case 'Autonomes':
      return 'bg-yellow-200 text-yellow-800 border-yellow-300';
    default:
      return 'bg-gray-200 text-gray-800 border-gray-300';
  }
};

const parsedData = parseSchedule(scheduleCsvData);

export const timeSlots = Array.from({ length: (23 - 10) * 2 + 1 }, (_, i) => {
  const hour = 10 + Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

export const scheduleData = parsedData.map(item => {
  const start = formatTime(item['Heure debut']);
  const end = formatTime(item['Heure fin']);
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  
  let spanSlots = Math.round((endMin - startMin) / SLOT_LENGTH_MIN);
  if (spanSlots < 1) spanSlots = 1;

  const startIndex = Math.floor((startMin - BASE_START_MINUTES) / SLOT_LENGTH_MIN);

  if (startIndex < 0 || startIndex >= timeSlots.length) {
    return null;
  }

  const instructors = [item['Encadrant 1'], item['Encadrant 2'], item['Encadrant 3'], item['Encadrant 4']]
    .filter(Boolean);

  return {
    id: item.id,
    title: item['Age'],
    day: item['Jour'],
    startTime: start,
    endTime: end,
    spanSlots,
    startIndex,
    instructors: instructors,
    group: item['Type'],
    color: getColorForGroup(item['Type']),
  };
}).filter(Boolean);


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