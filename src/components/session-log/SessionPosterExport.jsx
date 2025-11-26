import React from 'react';
import { Calendar, Clock, Target, Users, Dumbbell, MessageSquare, Package } from 'lucide-react';

const COLORS = {
    bg: '#FFF200', // Jaune vif
    black: '#000000',
    white: '#ffffff',
    textMain: '#000000',
    primary: '#2980b9',
    secondary: '#34495e',
    tertiary: '#8e44ad',
    quaternary: '#16a085',
    brown: '#a0522d',
};

const SessionPosterExport = ({
    session,
    exerciseImages = {},
    cycleSessionInfo = null,
    title = "ALJ Escalade",
    subtitle = "Séance d'entraînement",
    footer = "BONNE SÉANCE !"
}) => {

    if (!session) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            weekday: 'long',
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    const SectionCard = ({ title, icon: Icon, children, color = COLORS.black }) => (
        <div
            style={{
                background: COLORS.white,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 0 rgba(0,0,0,0.1)',
                border: '2px solid black',
                marginBottom: '20px',
                width: '100%'
            }}
        >
            <div
                style={{
                    background: color,
                    padding: '10px 20px',
                    color: COLORS.white,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: '2px solid black'
                }}
            >
                {Icon && <Icon size={20} strokeWidth={2.5} />}
                <span style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {title}
                </span>
            </div>
            <div style={{ padding: '15px 20px' }}>
                {children}
            </div>
        </div>
    );

    return (
        <div
            id="session-poster-export"
            className="relative w-[794px] min-h-[1123px] mx-auto overflow-hidden flex flex-col"
            style={{
                background: `linear-gradient(to bottom, ${COLORS.bg} 0%, ${COLORS.white} 100%)`,
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
        >
            {/* Image de fond murJonage.png en haut */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(/ALJ_Jonage_Escalade/murJonage.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.15,
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Motif à pois subtil en haut seulement */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '30%',
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Formes décoratives */}
            <div style={{
                position: 'absolute',
                top: '-100px',
                right: '-100px',
                width: '300px',
                height: '300px',
                background: COLORS.black,
                borderRadius: '50%',
                zIndex: 0,
                opacity: 0.05
            }} />

            {/* Logo en haut à droite */}
            <div style={{
                position: 'absolute',
                top: '30px',
                right: '30px',
                zIndex: 2,
                background: 'white',
                padding: '10px',
                borderRadius: '16px',
                border: '3px solid black',
                boxShadow: '5px 5px 0 black',
                transform: 'rotate(2deg)'
            }}>
                <img
                    src="/ALJ_Jonage_Escalade/logoALJ.png"
                    alt="Logo Club"
                    style={{ height: '60px', display: 'block' }}
                />
            </div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto', width: '100%', flex: 1, padding: '40px 0' }}>

                {/* Header Global */}
                <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
                    <h1
                        style={{
                            fontSize: '3rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            color: COLORS.black,
                            margin: 0,
                            lineHeight: 0.9,
                            fontStyle: 'italic',
                            letterSpacing: '-2px',
                            textShadow: '3px 3px 0px rgba(255,255,255,0.5)'
                        }}
                    >
                        {title}
                    </h1>

                    <h2
                        style={{
                            fontSize: '1.4rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: COLORS.black,
                            margin: 0,
                            fontStyle: 'italic',
                        }}
                    >
                        {subtitle}
                    </h2>
                </div>

                {/* Info Principales & Objectifs (Merged) */}
                <div style={{ marginBottom: '20px' }}>
                    <SectionCard
                        title={`${session.cycles?.name || "Informations"}${cycleSessionInfo ? ` (${cycleSessionInfo.current}/${cycleSessionInfo.total})` : ''}`}
                        icon={Target}
                        color={COLORS.primary}
                    >
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Date</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                    {formatDate(session.date)}
                                </div>
                            </div>

                            {session.session_objective && (
                                <div style={{ flex: 2, borderLeft: '2px solid #eee', paddingLeft: '20px' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', color: COLORS.tertiary }}>Séance: </span>
                                        <span>{session.session_objective}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                {/* Exercices */}
                {session.exercises && session.exercises.length > 0 && (
                    <SectionCard title="Programme de la séance" icon={Dumbbell} color={COLORS.black}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {session.exercises.map((ex, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    gap: '15px',
                                    padding: '10px',
                                    background: idx % 2 === 0 ? '#f8f9fa' : '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #eee'
                                }}>
                                    <div style={{
                                        background: COLORS.black,
                                        color: 'white',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        flexShrink: 0,
                                        marginTop: '2px'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                                            {ex.operational_objective || 'Exercice sans titre'}
                                        </div>
                                        {ex.time && (
                                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px', display: 'inline-block', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                                                ⏱ {ex.time}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.4' }}>
                                            {ex.situation || ex.consigne || ex.organisation}
                                        </div>

                                        {/* Image de l'exercice */}
                                        {exerciseImages[ex.id] && (
                                            <div style={{ marginTop: '10px' }}>
                                                <img
                                                    src={exerciseImages[ex.id]}
                                                    alt="Illustration"
                                                    style={{
                                                        maxHeight: '150px',
                                                        maxWidth: '100%',
                                                        borderRadius: '8px',
                                                        border: '1px solid #ddd'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Commentaires */}
                {session.comment && (
                    <div style={{ marginBottom: '20px' }}>
                        <SectionCard title="Notes" icon={MessageSquare} color={COLORS.quaternary}>
                            <div style={{ fontSize: '0.95rem', fontStyle: 'italic' }}>"{session.comment}"</div>
                        </SectionCard>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SessionPosterExport;
