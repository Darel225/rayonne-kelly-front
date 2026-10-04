import LegalLayout from '../../components/public/LegalLayout';

const sections = [
  {
    id: 'objet',
    title: 'Objet et champ d\'application',
    content: (
      <>
        <p>
          Les présentes Conditions Générales de Vente et d'Utilisation (« CGV/CGU ») régissent l'usage du site
          <strong> rayonnekelly.ci</strong> et toute réservation ou prestation conclue avec
          <strong> Rayonne Kelly Immobilier</strong> (« Rayonne Kelly »). En naviguant sur le site, en créant un
          compte ou en réservant, vous reconnaissez les avoir lues et acceptées.
        </p>
      </>
    ),
  },
  {
    id: 'services',
    title: 'Services proposés',
    content: (
      <>
        <ul>
          <li><strong>Séjours et locations</strong> en résidences meublées, appartements et villas à Abidjan.</li>
          <li><strong>Conciergerie</strong> : accueil, assistance et services annexes liés au séjour.</li>
          <li><strong>Recherche sur mesure</strong> : accompagnement lorsqu'aucun bien affiché ne correspond à vos critères.</li>
          <li><strong>Offres entreprise</strong> : hébergement de collaborateurs, missions temporaires, séjours longue durée.</li>
        </ul>
        <p>
          Les descriptions, photographies et équipements sont donnés avec le plus grand soin mais restent
          indicatifs.
        </p>
      </>
    ),
  },
  {
    id: 'compte',
    title: 'Compte client',
    content: (
      <>
        <p>
          La création d'un compte exige des informations exactes et à jour. Vous êtes responsable de la
          confidentialité de vos identifiants et de toute activité réalisée depuis votre compte. En cas
          d'utilisation frauduleuse, informez-nous sans délai. Rayonne Kelly peut suspendre un compte en cas de
          manquement grave aux présentes.
        </p>
      </>
    ),
  },
  {
    id: 'reservation',
    title: 'Réservation et confirmation',
    content: (
      <>
        <p>
          Une demande de réservation transmise via le site ne devient ferme qu'après <strong>confirmation de notre
          équipe</strong> (WhatsApp, email ou depuis votre espace client). Aucun paiement n'est demandé lors de la
          réservation. Les disponibilités sont susceptibles d'évoluer tant que la réservation n'est pas
          confirmée.
        </p>
        <p>
          Le séjour est nominatif et le nombre d'occupants ne peut excéder la capacité indiquée pour la résidence.
          Une pièce d'identité peut être demandée à l'arrivée.
        </p>
      </>
    ),
  },
  {
    id: 'prix',
    title: 'Tarifs et paiement',
    content: (
      <>
        <p>
          Les tarifs sont communiqués lors de la confirmation, en francs CFA (FCFA), selon la résidence, la durée et
          la période. Ils incluent les prestations précisées dans l'offre ; tout service additionnel est annoncé au
          préalable.
        </p>
        <p>
          <strong>Le site ne propose pas de paiement en ligne.</strong> L'intégralité du règlement s'effectue
          <strong> le jour de l'arrivée</strong>, directement auprès de notre équipe, selon les moyens de paiement
          qui vous sont indiqués lors de la confirmation. Les séjours professionnels et de longue durée peuvent
          faire l'objet d'une facturation dédiée convenue avec l'entreprise.
        </p>
      </>
    ),
  },
  {
    id: 'annulation',
    title: 'Modification et annulation',
    content: (
      <>
        <p>
          Votre demande de réservation est traitée par notre conciergerie, qui vous répond sous
          <strong> 24 heures</strong>. Tant qu'elle est <strong>« en attente »</strong>, vous pouvez demander sa
          modification ou son annulation directement depuis votre <a href="/client">espace client</a>, via le bouton
          « Modifier / Annuler » : il suffit de choisir le type de demande et, si vous le souhaitez, d'en préciser
          le motif.
        </p>
        <p>
          Votre demande est alors transmise à notre équipe et la réservation passe au statut « modification en
          cours » ou « annulation en cours ». Elle ne prend effet qu'après <strong>validation par notre
          équipe</strong>, qui la confirme et met à jour votre dossier.
        </p>
        <p>
          Une fois la réservation <strong>validée</strong>, la modification ou l'annulation ne se fait plus en ligne :
          contactez-nous directement par WhatsApp ou par téléphone au +225 07 10 10 10 52, le plus tôt possible, afin
          de libérer la résidence pour d'autres voyageurs.
        </p>
        <p>
          Aucun paiement n'étant effectué en ligne, aucun remboursement n'est à prévoir. En cas de force majeure
          empêchant l'exécution du séjour, les parties recherchent ensemble une solution adaptée (report ou
          ajustement).
        </p>
      </>
    ),
  },
  {
    id: 'reglement',
    title: 'Règlement intérieur des résidences',
    content: (
      <>
        <p>Pour le confort de tous, chaque occupant s'engage à :</p>
        <ul>
          <li>respecter la tranquillité des lieux et du voisinage ;</li>
          <li>s'abstenir d'organiser fêtes ou événements sans accord préalable ;</li>
          <li>ne pas fumer à l'intérieur des logements ;</li>
          <li>ne pas accueillir d'animaux sans autorisation ;</li>
          <li>ne pas dépasser le nombre d'occupants autorisé ;</li>
          <li>prendre soin du mobilier, des équipements et des espaces communs.</li>
        </ul>
        <p>
          Tout dommage ou manquement au règlement peut donner lieu à une facturation des réparations ou à la fin
          anticipée du séjour, sans remboursement.
        </p>
      </>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Responsabilités',
    content: (
      <>
        <p>
          Rayonne Kelly s'engage à mettre à disposition un logement conforme à sa description et à assurer un
          service de conciergerie attentif. Sa responsabilité ne saurait être engagée pour la perte, le vol ou la
          dégradation d'effets personnels, sauf faute prouvée de sa part, ni pour les interruptions de services
          tiers (électricité, eau, internet) indépendantes de sa volonté.
        </p>
        <p>
          Le client demeure responsable des dommages causés par lui-même, ses accompagnants ou ses invités.
        </p>
      </>
    ),
  },
  {
    id: 'utilisation',
    title: 'Utilisation du site',
    content: (
      <>
        <p>
          Il est interdit d'utiliser le site à des fins illicites, de perturber son fonctionnement, d'extraire
          massivement son contenu ou de tenter d'accéder à des zones non autorisées. Les contenus du site sont
          protégés (voir <a href="/mentions-legales">Mentions légales</a>).
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    content: (
      <>
        <p>
          Les données sont traitées conformément à notre <a href="/confidentialite">Politique de Confidentialité</a>.
        </p>
      </>
    ),
  },
  {
    id: 'droit',
    title: 'Droit applicable et règlement des litiges',
    content: (
      <>
        <p>
          Les présentes conditions sont soumises au droit ivoirien. Toute réclamation doit d'abord nous être
          adressée à <a href="mailto:contact@rayonnekelly.ci">contact@rayonnekelly.ci</a> afin de rechercher une
          solution amiable. À défaut, les tribunaux compétents d'Abidjan sont seuls compétents.
        </p>
        <p>
          Rayonne Kelly peut modifier les présentes conditions ; la version applicable est celle en vigueur à la
          date de la réservation.
        </p>
      </>
    ),
  },
];

export default function Conditions() {
  return (
    <LegalLayout
      eyebrow="Conditions d'utilisation et de vente"
      title="Conditions"
      titleItalic="générales (CGV / CGU)"
      intro="Un cadre clair pour des séjours sereins : réservation, paiement, annulation, règles de vie et responsabilités, expliqués simplement."
      updatedAt="4 octobre 2026"
      sections={sections}
    />
  );
}
