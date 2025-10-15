import { supabase } from '../src/lib/customSupabaseClient.js';

const emailList = `
lschuller@free.fr,
magali fremy <fremmag@yahoo.fr>,
Elodie C <elodie.courtiade@gmail.com>,
Claude Neime <claude.neime@gmail.com>,
boris catherin <boris.catherin@gmail.com>,
Xavier Chapugier <xavier.chapugier@gmail.com>,
Olivier Bosset <olbosset@gmail.com>,
anthonytesta@live.fr,
avi dede <avi_29@yahoo.fr>,
Marie Manghisi <manghisimarie@gmail.com>,
Julien Sarboni <j.sarboni@gmail.com>,
Nadège Adoneth <nadege.adoneth@gmail.com>,
fanny lagarde <Lagarde.fanny@gmail.com>,
I y <ilhan081004@gmail.com>,
antonin.parrot@free.fr,
benoit gurret <benoit.gurret@gmail.com>,
Philippe Thomas <philippethomas.04@gmail.com>,
Benoit Pagan <benoit.pagan@beclap.fr>,
Aline Caillard <alinecaillard@gmail.com>,
rousseaueliette@gmail.com,
mack.sabine69@yahoo.fr,
Pauline KHALIFA <pauline.khalifa@orange.fr>,
antolinos virginie <v.antolinos@icloud.com>,
elo.houssenbay@gmail.com,
elenaletizia12@gmail.com,
Frederic Faure <frederic.faure@estre.fr>,
Bertrand Aveline <bertrand.aveline78@gmail.com>,
antoine.janel@laposte.net,
jbenech@free.fr,
ella.pyn8@gmail.com,
thouret.nicolas@gmail.com,
Monique Faure <monique.faure@estre.fr>,
olivier.schutter@gmail.com,
William LEROY <william.leroy177@orange.fr>,
ph.couvert@aliceadsl.fr,
iris.nicollet@hotmail.fr,
grace dacostafreitas <grace.dacostafreitas@sfr.fr>,
rastakalou@gmail.com,
HUE <magaly.hue@orange.fr>,
yves.dayre@bbox.fr,
Rodolphe JULLIEN-MOUTELON <rodolphe.jullien@gmail.com>,
antoine.pilon@orange.fr,
Marie COMBES <mariecombes1202@gmail.com>,
Charline Brehon <charline.brehon@gmail.com>,
Johan <Johanlevey@yahoo.fr>,
Ilyess kt <Kazi.ilyess@gmail.com>,
gaillard.cedric@laposte.net,
thomas.stachow1@gmail.com,
TARDIEU FLAVIA <flavia.tardieu38230@gmail.com>,
maxime-42@live.fr,
maxime rigo <maxime.rigo@gmail.com>,
lolasoleymieux210505@gmail.com,
damien rommevaux <darom38@live.fr>,
Vanessa DELCOURT <vanessdelcourt@gmail.com>,
larpent_maths@yahoo.fr,
jeanpauljoannes1@gmail.com,
Stephane LORIDANT <stephane.loridant@orange.fr>,
chavret_estelle2105@yahoo.fr,
BERGER Olivier <olafberger2@yahoo.fr>,
Nathalie BERGER <nathalie-berger@bbox.fr>,
"S. Mollier" <stefmollier@gmail.com>,
Damien Free <d.bron@free.fr>,
Carole TRIGANO <Carole.trigano@gmail.com>,
celine.falda@gmail.com,
Thibaut Martinez <t.martinez1@laposte.net>,
tanguy.meignier@gmail.com,
patrickguichard@netcourrier.com,
Elsa DELHOMME <edelhomme@msn.com>,
bruno.calvier@neuf.fr,
Thierry <moncaro.thierry@orange.fr>,
Frédérique Guérin-Fischer <frederiquegf@orange.fr>,
Fabienne lagarde <fablagarde@sfr.fr>,
Delphine Neime <Delphine0910@gmail.com>,
reynouard.ludovic@live.com,
wleroy@adei-sas.com,
Cyril gauthier <gauthiercyril@hotmail.com>,
Martine Khalifa <martine.khalifa@orange.fr>,
Pascal Parmentier <pascal.parm@gmail.com>,
adrien.petit2@orange.fr,
richard romanet <Rickalapatate@gmail.com>,
t.bruel7@gmail.com,
laurentguenot@sfr.fr,
THOMAS <jlt.thomas@wanadoo.fr>,
flavien.flandrin@gmail.com,
helene serrat <ln7a69@gmail.com>,
marco.69100@yahoo.fr,
Xavier Joassy <xavier.joassy@orange.fr>,
"Fabien Gandola (fgandola)" <fgandola@cisco.com>,
dulong.internet@sfr.fr,
Patrick ROZIE <patrick.rozie@gmail.com>,
Chantal Martin <chant.martin@orange.fr>,
arnaud3.rene@orange.fr,
Adrien Berger <muah.did@gmail.com>,
dd <ddjavelot@orange.fr>,
Lopez David <lopez.dav@gmail.com>,
Magaly CADIERGUES <magaly.marrel@hotmail.fr>,
BARAUD MATHIEU <mathieu.baraud@univ-lyon1.fr>,
marine bourdaud'hui <marine.dui@hotmail.fr>,
nathalie.descamps1@free.fr,
Yves Béroujon <beroujonyves@gmail.com>,
abdelali ben moussa <abdelali_benmoussa@yahoo.fr>,
annelyn.grellier@gmail.com,
Nico Pe <nicocb83@gmail.com>,
Maelle Sola <solamaelle69@gmail.com>,
Aline ABRIAL <alinebenoit.abrial@gmail.com>,
Audrey GANDOLFI <gandolfiaudrey@outlook.fr>,
Johanna Blanquer <johanna.blanquer@gmail.com>,
lucie capron <luciecapron@yahoo.fr>,
Elodie Hatif <elodiehatif@gmail.com>,
Cyrielle Tricot <cyrielle.tricot@gmail.com>,
Matthieu Grellier <matthieu.grellier@gmail.com>,
philippe.lombard@univ-lyon1.fr,
grosnicolas29@gmail.com,
emilientille@yahoo.fr,
siloe.hugg@gmail.com,
Fabrice FANJAT <fabrice.fanjat@dolonis.fr>,
Morgane M <morgane.marcel01@gmail.com>,
Anthony Dos <Anthony.dos@gmail.com>,
pournewsgen@gmail.com,
very79@hotmail.com,
n.martinpascual@gmail.com,
Marion Kolly <ckolly.marion@gmail.com>,
Adeline Garcia <garciadeline@yahoo.fr>,
Stéphane COCHE <steph.coche@gmail.com>,
Zaire Menasri <zairemenasri@gmail.com>,
Céline OTHELET <cel.othelet@gmail.com>,
valerie boy <Valerie_boy@yahoo.fr>,
Mag Tardieu <gabosc14@gmail.com>,
Emilie <0686624903@orange.fr>,
Gaëlle Chapelle <chapelle.gaelle@gmail.com>,
Constance Veleine <constance@veleine.fr>,
mathilde.henriet@gmail.com,
nicolas.premont@me.com,
lucas.janel@laposte.net,
Sophie Balny-Didier <sophie.balny@univ-lyon2.fr>,
pozcyr@laposte.net,
tony.loridant@orange.fr,
romaingoethals15@gmail.com,
madnico.nadrcic@gmail.com,
Laurent JANEL <laurent.janel@gmail.com>,
laure hardouin <hardouinlaure@gmail.com>,
Natacha TRAVERT <natacha.travert@orange.fr>,
"Sandrine P." <spozzobon@live.fr>,
auroremagnaval@hotmail.com,
nmartin69@laposte.net,
guirec.herve@gmail.com,
aemilou@gmail.com,
silvine.allarousse@gmail.com,
Bébé 
 <corneille.guillaume@hotmail.fr>,
Angélique Lecole <lecoleangelique@gmail.com>,
Aurélie <aureliekayabalyan@yahoo.fr>,
Justine A <Justiale@gmail.com>,
Julie Andres <djoule7@gmail.com>,
Laure.morard@gmail.com,
Ludovic Fine <l_fine@hotmail.fr>,
pal_anais@hotmail.fr,
Marie J <jugnet.marie@gmail.com>,
oree lalou <yayajeanchri@hotmail.com>,
Amira Zeguer <amira.zeguer@gmail.com>,
jobombonnel@aol.fr,
morand sandrine <Sandrine.morand78@gmail.com>,
Pauline Bouleau <paulynhayli@gmail.com>,
akhatib87@gmail.com,
julie vatiste <moidabord@hotmail.com>,
Cyril Carnevale <redrital26@gmail.com>,
adam.debili@gmail.com,
Aurelie EYMIN <aurelie.eymin@gmail.com>,
anissa djahnine <djahnine69@yahoo.fr>,
zari malou <malouzari@yahoo.fr>,
zeina_fg@hotmail.com,
Mariam Guilhem-Noureddine <mariam.noureddine@gmail.com>,
valentinenogaret@yahoo.fr,
Christophe Kleine <christophe.kleine@gmail.com>,
m.regisb@laposte.net,
elodie gentina <elo69330@hotmail.fr>,
Anne-Sophie Lannoy <lannoy.as@gmail.com>,
Justine Lopez <justine.colin@gmail.com>,
Coralie ASTIER <c-astier@hotmail.fr>,
chhinceleste87@gmail.com,
Mathilde Chazot <Gwezchaz@gmail.com>,
bufoaudrey@gmail.com,
Elodie Chaumet <elodie.chaumet@gmail.com>,
cédric chrystel MEUNIER <cedric.chrystel@hotmail.fr>,
florian follut <follutf@yahoo.fr>,
Samibouzouina7@icloud.com,
FLORINE T-C <flakba69@hotmail.fr>,
nadine.gastinois@sfr.fr,
Audrey ZILL <audreyzill@outlook.fr>,
Camille Stepowski <camille.stepowski@gmail.com>,
Juliette Caulet <Juliette.caulet@gmail.com>,
Laetitia Fesche <laetitiafesche@hotmail.com>,
Nadège Delorme <nadegedelorme@hotmail.com>,
stephane malsert <stephane.malsert@gmail.com>,
b.mitifiot@gmail.com,
camille lutzler <pitchoune-05@hotmail.fr>,
Aurélie de Lavenère <aureliecabourg@free.fr>,
Virginie GIRAUD <virginiegir@hotmail.fr>,
Lucie Brosse <lucazier@yahoo.fr>,
Pierre Mignon <pierrotmignon@gmail.com>,
yahia nadia <esfane@hotmail.fr>,
Nanou P <payamaya@hotmail.fr>,
Mélanie GILLIN <m.gillin@hotmail.fr>,
Laëtitia DESSAINTJEAN <Dessaintjean.Laetitia@gmail.com>,
Nicolas.bardouillet@gmail.com,
Myriam Drine <myriam.drine@yahoo.fr>,
titiabasso@gmail.com,
camille prudhomme <camilleprudhomme@yahoo.fr>,
h zehouany <hzehouany2@gmail.com>,
Hakime boulghobra <akkenzi@yahoo.com>,
Pauline Cioccolini <pauline.cioccolini@gmail.com>,
leslie s <s.leslie@live.fr>,
Delphine Wanadoo <delmartin@wanadoo.fr>,
josselin.rios.08@gmail.com,
Gaelle Buchet <gaelleeric@aol.com>,
villeneuvelaure@yahoo.fr,
murielle@duvillard.eu,
emmanuel.dellandrea@gmail.com,
Neo Concept <neo.concept@orange.fr>,
Brissy Agnes <dameagnesb@gmail.com>,
Jean-Benoît Rios <jean.benoit.rios@gmail.com>,
fabien@gandola.fr,
lin.quint0n69@gmail.com,
lcleo@wanadoo.fr,
celine.jouvrot@club-internet.fr,
Caroline Capuano <caro.capuano@gmail.com>,
clement.jennequin@outlook.com,
Gui <guillaume.quinton42@gmail.com>,
Christelle kroner <christelle.kroner@gmail.com>,
Olivia Bouclette CAPUANO <oliviacapuano09@gmail.com>,
Delphine Luczkow <delphine.luczkow@gmail.com>,
Cyril Perrier <cperrier@free.fr>,
cecll@free.fr,
estelle gret <estellegret@yahoo.fr>,
Virginie VERMARE <virginie.vermare@icloud.com>,
sylvie.imbert@bbox.fr,
Caroline Orus <caroline.orus@gmail.com>,
caroline Goisbault <carolinegoisbault@gmail.com>,
Stéphanie Laboulais <st.laboulais@gmail.com>,
Laure Dumas <boxatoto@aol.com>,
Aurélie GRATTON <aurelie_gratton@hotmail.fr>,
Frederique Bessueille <frederique.barbier@free.fr>,
renaudfamille@hotmail.fr,
cgagnepain@gmail.com,
benji.bosset@gmail.com,
jaouen.rios@gmail.com,
S&O ROME <nipponkase@yahoo.fr>,
veroniquechaumet@free.fr,
Robin Carine <robin.carine69@yahoo.fr>,
stephane.ducroquet@outlook.com
`;

async function importMemberEmails() {
  console.log('Starting email import process...');
  const unassociatedEmails = [];
  const lines = emailList.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  for (const line of lines) {
    let name = '';
    let email = '';

    // Regex to extract name and email from various formats
    const emailRegex = /(?:(?:[^<>"']+\s)?<([^>]+)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))/;
    const match = line.match(emailRegex);

    if (match) {
      email = match[1] || match[2]; // Group 1 for <email>, Group 2 for direct email
      if (line.includes('<')) {
        name = line.substring(0, line.indexOf('<')).trim();
      } else {
        // For simple email, try to derive a name (e.g., from lschuller@free.fr -> lschuller)
        name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' '); // Basic attempt to get a name-like string
      }
    }

    if (email) {
      console.log(`Processing: Name='${name}', Email='${email}'`);

      let memberId = null;
      let matchReason = 'No confident match found';

      // Try to match by exact email first (if an email already exists for a member)
      const { data: existingMemberByEmail, error: emailSearchError } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('email', email)
        .limit(1);

      if (emailSearchError) {
        console.error(`Error searching by existing email ${email}:`, emailSearchError);
        unassociatedEmails.push({ original: line, name, email, reason: `Database error: ${emailSearchError.message}` });
        continue;
      }

      if (existingMemberByEmail && existingMemberByEmail.length > 0) {
        memberId = existingMemberByEmail[0].id;
        matchReason = `Matched by existing email to ${existingMemberByEmail[0].first_name} ${existingMemberByEmail[0].last_name}`;
        console.log(matchReason);
      } else if (name) {
        // Attempt to match by name if no existing email match
        const nameParts = name.split(' ').filter(part => part.length > 0);
        let firstNameSearch = '';
        let lastNameSearch = '';

        if (nameParts.length === 2) {
          firstNameSearch = nameParts[0];
          lastNameSearch = nameParts[1];
        } else if (nameParts.length === 1) {
          firstNameSearch = nameParts[0]; // Assume it's a first name, or part of a name
        } else if (nameParts.length > 2) {
          firstNameSearch = nameParts[0];
          lastNameSearch = nameParts.slice(1).join(' ');
        } else {
          // If name parsing was too ambiguous, skip name-based matching
          console.log(`Skipping name-based matching for '${name}' due to ambiguity.`);
        }

        if (firstNameSearch || lastNameSearch) {
          console.log(`Attempting name search for: firstName='${firstNameSearch}', lastName='${lastNameSearch}'`);
          let query = supabase.from('members').select('id, first_name, last_name, email');

          if (firstNameSearch && lastNameSearch) {
            query = query
              .ilike('first_name', `%${firstNameSearch}%`)
              .ilike('last_name', `%${lastNameSearch}%`);
          } else if (firstNameSearch) {
            query = query.ilike('first_name', `%${firstNameSearch}%`);
          } else if (lastNameSearch) {
            query = query.ilike('last_name', `%${lastNameSearch}%`);
          }

          const { data: membersByName, error: nameSearchError } = await query;

          if (nameSearchError) {
            console.error(`Error searching by name '${name}':`, nameSearchError);
            unassociatedEmails.push({ original: line, name, email, reason: `Database error: ${nameSearchError.message}` });
            continue;
          }
          
          console.log(`Name search results for '${name}':`, membersByName);

          if (membersByName && membersByName.length === 1) {
            memberId = membersByName[0].id;
            matchReason = `Matched by name to ${membersByName[0].first_name} ${membersByName[0].last_name}`;
            console.log(matchReason);
          } else if (membersByName && membersByName.length > 1) {
            matchReason = `Multiple members found for name '${name}'. Cannot confidently associate.`;
            console.log(matchReason);
          }
        }
      }

      if (memberId) {
        // Update the member's email
        const { error: updateError } = await supabase
          .from('members')
          .update({ email: email })
          .eq('id', memberId);

        if (updateError) {
          console.error(`Error updating email for member ${memberId}:`, updateError);
          unassociatedEmails.push({ original: line, name, email, reason: `Failed to update email: ${updateError.message}` });
        } else {
          console.log(`✅ Successfully updated email for member ${memberId} to ${email}`);
        }
      } else {
        unassociatedEmails.push({ original: line, name, email, reason: matchReason });
      }
    } else {
      console.warn(`Could not parse email from line: ${line}`);
      unassociatedEmails.push({ original: line, reason: 'Failed to parse email' });
    }
  }

  console.log('\n--- Import Process Complete ---');
  if (unassociatedEmails.length > 0) {
    console.log('Emails that could not be associated with a member:');
    unassociatedEmails.forEach(item => console.log(`- ${item.original} (Reason: ${item.reason})`));
  } else {
    console.log('All emails were successfully processed and associated.');
  }
}

importMemberEmails();
