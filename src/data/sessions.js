import { useState, useEffect } from 'react';

const SESSIONS_STORAGE_KEY = 'climbing_sessions';

const initialSessions = [
  {
    id: 1,
    date: '2025-09-30',
    instructors: ['David LOPEZ'],
    students: ['Arthur ABRIAL', 'Chloe ABRIAL', 'Clement ANTOLINOS', 'Tiago CHAZOT'],
    cycleObjective: 'Reprise début d année',
    sessionObjective: 'Améliorer la technique de pose de pieds et la lecture de voie.',
    equipment: 'Sur cordes.',
    exercises: [
      {
        id: 1,
        operationalObjective: 'Accueil et présentation de la séance',
        situation: 'Enfants assis en rond',
        organisation: '5 min',
        consigne: 'Présentation des objectifs du jour.',
        time: '19h10',
        successCriteria: 'Tous les enfants sont attentifs.',
        regulation: 'Répéter si nécessaire.',
        supportLink: ''
      },
      {
        id: 2,
        operationalObjective: 'Échauffement articulaire',
        situation: 'En autonomie',
        organisation: '5 min',
        consigne: 'Suivre la routine d\'échauffement habituelle.',
        time: '19h15',
        successCriteria: 'Tous les enfants font bien les exercices.',
        regulation: 'Prendre à part un enfant pour lui remontrer les exercices.',
        supportLink: ''
      },
      {
        id: 3,
        operationalObjective: 'Travail en autonomie',
        situation: 'Grimpe libre sur le pan',
        organisation: '5 min',
        consigne: 'Ne pas dépasser la hauteur max autorisée.',
        time: '19h20',
        successCriteria: 'Respect des consignes de sécurité.',
        regulation: 'Rappel à l\'ordre si non-respect.',
        supportLink: ''
      },
      {
        id: 4,
        operationalObjective: 'Renforcement général',
        situation: 'Petit circuit renfo "general" (haut&bas du corps) tous ensemble',
        organisation: '10 min',
        consigne: '10 pompes (sur genoux), Planche, 10 squats, Planche côté D, 10 pompes, Planche côté G.',
        time: '19h30',
        successCriteria: 'Enchaînement des exercices.',
        regulation: 'Adapter le nombre de répétitions si besoin.',
        supportLink: ''
      },
      {
        id: 5,
        operationalObjective: 'Le manchot',
        situation: 'Pénaliser l\'utilisation des prises de main.',
        organisation: '10 min',
        consigne: 'Réussir le passage avec une seule main, l\'autre dans le dos.',
        time: '19h45',
        successCriteria: 'Voie réussie avec la contrainte.',
        regulation: 'Choisir une voie plus simple si trop difficile.',
        supportLink: ''
      },
      {
        id: 6,
        operationalObjective: 'La sieste du chat',
        situation: 'Sur pan incliné puis vertical, en montée-descente ou en traversée.',
        organisation: '10 min',
        consigne: 'Ne pas faire de bruit lors de la pose du pied (sinon le chat se réveille...).',
        time: '20h00',
        successCriteria: 'Déplacement silencieux.',
        regulation: 'Se concentrer sur le bruit pour ajuster le mouvement.',
        supportLink: ''
      },
      {
        id: 7,
        operationalObjective: 'Retour au calme',
        situation: 'Étirements et feedbacks',
        organisation: '10 min',
        consigne: 'Chacun donne son ressenti sur la séance.',
        time: '20h10',
        successCriteria: 'Participation de tous.',
        regulation: '',
        supportLink: ''
      }
    ]
  }
];

export const useSessionStore = () => {
  const [sessions, setSessions] = useState(() => {
    try {
      const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (savedSessions) {
        return JSON.parse(savedSessions);
      }
    } catch (error) {
      console.error("Failed to parse sessions from localStorage", error);
    }
    return initialSessions;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to localStorage", error);
    }
  }, [sessions]);

  const addSession = (session) => {
    setSessions(prevSessions => [...prevSessions, { ...session, id: Date.now() }]);
  };

  const updateSession = (updatedSession) => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
  };

  const deleteSession = (sessionId) => {
    setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
  };

  return { sessions, addSession, updateSession, deleteSession };
};