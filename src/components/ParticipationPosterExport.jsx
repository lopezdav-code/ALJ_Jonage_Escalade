import React from 'react';
import { Trophy, Medal } from 'lucide-react';

const COLORS = {
  bg: '#FFF200', // Jaune vif
  black: '#000000',
  white: '#ffffff',
  textMain: '#000000',
  male: {
    primary: '#2980b9',
    secondary: '#34495e',
    tertiary: '#8e44ad',
    quaternary: '#16a085',
    brown: '#a0522d',
  },
  female: {
    primary: '#e91e63',
    secondary: '#c2185b',
    tertiary: '#d81b60',
    quaternary: '#ad1457',
  },
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

const ParticipationPosterExport = ({
  competitors = [],
  competitions = [],
  title = "ALJ Escalade",
  subtitle = "Résultat du week-end",
  footer = "BRAVO À TOUS !"
}) => {

  // Fonction pour obtenir l'année de naissance
  const getBirthYear = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  // Grouper par Sexe et Catégorie pour une compétition spécifique
  const getCompetitionResults = (competitionId) => {
    const groups = {};

    competitors.forEach(({ member, participations }) => {
      // Vérifier si le membre a participé à CETTE compétition
      const participation = participations[competitionId];
      if (!participation) return;

      const cat = member.category || 'Autre';
      const sex = member.sexe === 'F' ? 'Femmes' : 'Hommes';
      const key = `${cat} ${sex}`;

      if (!groups[key]) {
        groups[key] = {
          category: cat,
          sex: member.sexe,
          members: []
        };
      }

      groups[key].members.push({
        member,
        ranking: participation.ranking,
        nb_competitor: participation.nb_competitor
      });
    });

    // Trier les groupes (catégories)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.match(/\d+/)?.[0] || '999');
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    const sortedGroups = {};
    sortedKeys.forEach(key => {
      // Trier les membres par rang
      groups[key].members.sort((a, b) => {
        const rankA = a.ranking || 999;
        const rankB = b.ranking || 999;
        if (rankA !== rankB) return rankA - rankB;
        return a.member.last_name.localeCompare(b.member.last_name);
      });
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  };

  const getHeaderColor = (groupKey, index) => {
    const isFemale = groupKey.includes('Femmes');
    const maleColors = [COLORS.male.primary, COLORS.male.brown, COLORS.male.secondary, COLORS.male.quaternary];
    const femaleColors = [COLORS.female.primary, COLORS.female.secondary, COLORS.female.tertiary, COLORS.female.quaternary];
    const palette = isFemale ? femaleColors : maleColors;
    return palette[index % palette.length];
  };

  // Composant pour afficher une carte de catégorie
  const CategoryCard = ({ groupKey, groupData, idx }) => {
    const headerColor = getHeaderColor(groupKey, idx);
    const isFemale = groupData.sex === 'F';

    return (
      <div
        style={{
          background: COLORS.white,
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 10px 0 rgba(0,0,0,1)',
          border: '3px solid black',
          width: '100%',
          maxWidth: '500px',
          marginBottom: '30px'
        }}
      >
        {/* En-tête Carte */}
        <div
          style={{
            background: headerColor,
            padding: '15px 25px',
            color: COLORS.white,
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            borderBottom: '3px solid black'
          }}
        >
          {/* Icône Sexe */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.6)',
            flexShrink: 0
          }} >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isFemale ? (
                <>
                  <circle cx="12" cy="8" r="5" />
                  <path d="M12 13v8" />
                  <path d="M9 19h6" />
                </>
              ) : (
                <>
                  <circle cx="10" cy="10" r="5" />
                  <path d="M13.5 6.5L18 2" />
                  <path d="M15 2h3v3" />
                </>
              )}
            </svg>
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>
            {groupKey} ({groupData.members.length})
          </span>
        </div>

        {/* Liste Participants */}
        <div style={{ padding: '5px 0' }}>
          {groupData.members.map(({ member, ranking, nb_competitor }, pIdx) => {
            const bestRank = ranking || 999;
            const isPodium = bestRank <= 3;
            const rankColor = bestRank === 1 ? COLORS.gold : bestRank === 2 ? COLORS.silver : COLORS.bronze;

            return (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: pIdx < groupData.members.length - 1 ? '2px solid #f0f0f0' : 'none',
                  background: pIdx % 2 === 0 ? '#fff' : '#fafafa'
                }}
              >
                {/* Rang */}
                <div style={{
                  minWidth: '38px',
                  height: '38px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  color: isPodium ? COLORS.black : '#666',
                  background: isPodium ? rankColor : '#eee',
                  borderRadius: '20px',
                  marginRight: '15px',
                  border: isPodium ? '2px solid black' : 'none',
                  boxShadow: isPodium ? '2px 2px 0 rgba(0,0,0,0.2)' : 'none',
                  whiteSpace: 'nowrap'
                }}>
                  {bestRank !== 999 ? (
                    nb_competitor ? `${bestRank} / ${nb_competitor}` : bestRank
                  ) : '-'}
                </div>

                {/* Nom et Année */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 800, fontSize: '1.15rem', color: COLORS.black, textTransform: 'uppercase', display: 'block', lineHeight: 1.1 }}>
                    {member.first_name} {member.last_name}
                  </span>
                  {member.birth_date && (
                    <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: 600 }}>
                      {getBirthYear(member.birth_date)}
                    </span>
                  )}
                </div>

                {/* Trophée */}
                {isPodium && (
                  <Trophy size={26} fill={rankColor} color="black" strokeWidth={1.5} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: "'Montserrat', 'Roboto', sans-serif",
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bg} 10%, #FFFFFF 100%)`, // Dégradé Jaune -> Blanc
        padding: '40px',
        minHeight: '100vh',
        color: COLORS.textMain,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>

        {/* Header Global */}
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <h1
            style={{
              fontSize: '5rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: COLORS.black,
              margin: 0,
              lineHeight: 0.9,
              fontStyle: 'italic',
              letterSpacing: '-2px',
              textShadow: '4px 4px 0px rgba(255,255,255,0.5)'
            }}
          >
            {title}
          </h1>
          <div style={{
            height: '6px',
            width: '120px',
            background: COLORS.black,
            margin: '15px auto',
            borderRadius: '10px'
          }} />
          <h2
            style={{
              fontSize: '2.2rem',
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

        {/* Boucle sur les compétitions */}
        {competitions.map((comp, compIndex) => {
          const categoryGroups = getCompetitionResults(comp.id);
          // Si aucun résultat pour cette compétition, on ne l'affiche pas
          if (Object.keys(categoryGroups).length === 0) return null;

          const entries = Object.entries(categoryGroups);
          const maleEntries = entries.filter(([_, data]) => data.sex !== 'F');
          const femaleEntries = entries.filter(([_, data]) => data.sex === 'F');
          const hasBoth = maleEntries.length > 0 && femaleEntries.length > 0;

          return (
            <div key={comp.id} style={{ marginBottom: '60px' }}>

              {/* Titre de la compétition */}
              <div style={{
                textAlign: 'center',
                marginBottom: '30px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: COLORS.black,
                  color: COLORS.white,
                  padding: '10px 40px',
                  borderRadius: '40px',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  transform: compIndex % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
                  border: '3px solid white'
                }}>
                  {comp.short_title || comp.name}
                </div>
              </div>

              {/* Conteneur des résultats */}
              {hasBoth ? (
                // Layout 2 colonnes
                <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                  {/* Colonne Garçons (Gauche) */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {maleEntries.map(([key, data], idx) => (
                      <CategoryCard key={key} groupKey={key} groupData={data} idx={idx} />
                    ))}
                  </div>

                  {/* Colonne Filles (Droite) */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {femaleEntries.map(([key, data], idx) => (
                      <CategoryCard key={key} groupKey={key} groupData={data} idx={idx} />
                    ))}
                  </div>
                </div>
              ) : (
                // Layout centré (un seul sexe)
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {entries.map(([key, data], idx) => (
                    <CategoryCard key={key} groupKey={key} groupData={data} idx={idx} />
                  ))}
                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* Logo en bas à droite */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        zIndex: 10,
        background: 'white',
        padding: '15px',
        borderRadius: '20px',
        border: '3px solid black',
        boxShadow: '5px 5px 0 black',
        transform: 'rotate(-3deg)'
      }}>
        <img
          src="/ALJ_Jonage_Escalade/logoALJ.png"
          alt="Logo Club"
          style={{ height: '130px', display: 'block' }}
        />
      </div>

      {/* Footer Banner */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '40px',
        background: COLORS.black,
        padding: '15px 40px',
        borderRadius: '50px',
        boxShadow: '5px 10px 20px rgba(0,0,0,0.2)',
        zIndex: 9,
        border: '2px solid white'
      }}>
        <h3 style={{
          margin: 0,
          color: COLORS.bg,
          fontSize: '2rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          fontStyle: 'italic',
          letterSpacing: '1px'
        }}>
          {footer}
        </h3>
      </div>
    </div>
  );
};

export default ParticipationPosterExport;
