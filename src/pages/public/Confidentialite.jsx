import LegalLayout from '../../components/public/LegalLayout';

const sections = [
  {
    id: 'responsable',
    title: 'Responsable du traitement',
    content: (
      <>
        <p>
          <strong>Rayonne Kelly Immobilier</strong>, dont le siège est situé à Marcory Zone 4, Abidjan (Côte
          d'Ivoire), est responsable du traitement des données personnelles collectées sur ce site. Nous nous
          engageons à les traiter conformément à la loi ivoirienne n° 2013-450 du 19 juin 2013 relative à la
          protection des données à caractère personnel.
        </p>
        <p>
          Contact pour toute question relative à vos données :{' '}
          <a href="mailto:contact@rayonnekelly.ci">contact@rayonnekelly.ci</a>
        </p>
      </>
    ),
  },
  {
    id: 'collecte',
    title: 'Données collectées',
    content: (
      <>
        <p>Nous ne collectons que les informations nécessaires aux services que vous demandez :</p>
        <ul>
          <li><strong>Compte client :</strong> nom, adresse email, mot de passe (stocké sous forme chiffrée).</li>
          <li><strong>Réservation :</strong> identité, coordonnées, dates de séjour, résidence choisie, nombre de voyageurs.</li>
          <li><strong>Recherche sur mesure :</strong> nom, numéro WhatsApp, email, type de bien, budget, quartier souhaité, durée et critères.</li>
          <li><strong>Demande entreprise :</strong> raison sociale, interlocuteur, coordonnées, effectif concerné, durée et besoins spécifiques.</li>
          <li><strong>Newsletter « La Gazette Privée » :</strong> adresse email.</li>
          <li><strong>Navigation :</strong> données techniques strictement nécessaires au fonctionnement et à la sécurité du site.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalites',
    title: 'Finalités et bases légales',
    content: (
      <>
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>traiter, confirmer et suivre vos réservations et demandes (exécution du contrat ou de mesures précontractuelles) ;</li>
          <li>vous recontacter par WhatsApp, téléphone ou email au sujet de votre demande ;</li>
          <li>organiser les services de conciergerie liés à votre séjour ;</li>
          <li>vous adresser la newsletter, uniquement si vous vous y êtes inscrit (consentement) ;</li>
          <li>assurer la sécurité du site et respecter nos obligations légales et comptables.</li>
        </ul>
        <p>Nous ne vendons ni ne louons jamais vos données à des tiers.</p>
      </>
    ),
  },
  {
    id: 'destinataires',
    title: 'Destinataires et prestataires',
    content: (
      <>
        <p>
          Vos données sont accessibles uniquement à notre équipe habilitée. Elles peuvent être traitées par des
          prestataires techniques agissant sur nos instructions (hébergement, envoi d'emails transactionnels,
          messagerie WhatsApp), tenus à des obligations de confidentialité et de sécurité.
        </p>
        <p>
          Elles ne sont communiquées à des autorités que sur demande légale. Si un transfert hors de Côte d'Ivoire
          est nécessaire, il s'effectue avec des garanties appropriées.
        </p>
      </>
    ),
  },
  {
    id: 'conservation',
    title: 'Durée de conservation',
    content: (
      <>
        <ul>
          <li><strong>Demandes et prospects :</strong> au maximum 3 ans après le dernier contact.</li>
          <li><strong>Clients et réservations :</strong> pendant la durée de la relation, puis archivage selon les délais légaux (comptabilité, litiges).</li>
          <li><strong>Newsletter :</strong> jusqu'à votre désinscription.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    content: (
      <>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : connexion chiffrée
          (HTTPS), mots de passe chiffrés, accès restreint à l'espace d'administration et journalisation des
          opérations sensibles. Aucun système n'étant infaillible, nous vous invitons à protéger vos identifiants.
        </p>
      </>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    content: (
      <>
        <p>Vous disposez à tout moment des droits suivants sur vos données :</p>
        <ul>
          <li>accès et copie ;</li>
          <li>rectification ;</li>
          <li>suppression ;</li>
          <li>opposition et limitation du traitement ;</li>
          <li>retrait de votre consentement (désinscription newsletter incluse).</li>
        </ul>
        <p>
          Pour les exercer, écrivez-nous à <a href="mailto:contact@rayonnekelly.ci">contact@rayonnekelly.ci</a> en
          précisant votre demande. Nous répondons dans un délai raisonnable. Vous pouvez également saisir
          l'<strong>ARTCI</strong> (Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire), autorité
          de protection des données.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies et stockage local',
    content: (
      <>
        <p>
          Le site utilise uniquement des dispositifs techniques indispensables (maintien de votre connexion,
          préférences d'affichage). Aucun cookie publicitaire n'est déposé sans votre accord. Si des outils de
          mesure d'audience sont ajoutés ultérieurement, cette page sera mise à jour.
        </p>
      </>
    ),
  },
  {
    id: 'evolution',
    title: 'Évolution de la politique',
    content: (
      <>
        <p>
          Cette politique peut être modifiée pour refléter l'évolution de nos services ou de la réglementation. La
          date de dernière mise à jour figure en tête de page.
        </p>
      </>
    ),
  },
];

export default function Confidentialite() {
  return (
    <LegalLayout
      eyebrow="Vie privée"
      title="Politique de"
      titleItalic="confidentialité"
      intro="Vos coordonnées, vos projets et vos séjours relèvent de votre vie privée. Voici, en toute clarté, ce que nous collectons, pourquoi, et comment vous gardez la maîtrise de vos données."
      updatedAt="4 octobre 2026"
      sections={sections}
    />
  );
}
