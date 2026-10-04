import LegalLayout from '../../components/public/LegalLayout';

const sections = [
  {
    id: 'editeur',
    title: "Éditeur du site",
    content: (
      <>
        <p>
          Le présent site, accessible à l'adresse <strong>rayonnekelly.ci</strong>, est édité par
          <strong> Rayonne Kelly Immobilier</strong>, société spécialisée dans la location de résidences meublées,
          d'appartements et de villas de standing à Abidjan.
        </p>
        <ul>
          <li><strong>Dénomination :</strong> Rayonne Kelly Immobilier</li>
          <li><strong>Siège social :</strong> Marcory Zone 4, Abidjan, Côte d'Ivoire</li>
          <li><strong>Téléphone / WhatsApp :</strong> +225 07 10 10 10 52</li>
          <li><strong>Email :</strong> <a href="mailto:contact@rayonnekelly.ci">contact@rayonnekelly.ci</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'activite',
    title: "Nature de l'activité",
    content: (
      <>
        <p>
          Rayonne Kelly Immobilier propose des séjours en résidences meublées, des locations et un accompagnement
          sur des projets immobiliers, ainsi que des services de conciergerie. Les informations présentées sur le
          site (descriptions, photographies, disponibilités) sont données à titre indicatif et peuvent évoluer
          sans préavis. Seule la confirmation écrite de notre équipe engage la société.
        </p>
      </>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    content: (
      <>
        <p>
          L'ensemble des éléments du site — textes, photographies, visuels, logos, identité graphique, structure et
          code — est la propriété exclusive de Rayonne Kelly Immobilier ou fait l'objet d'une autorisation
          d'exploitation. Ils sont protégés par la législation ivoirienne et les conventions internationales
          relatives à la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, représentation, modification, diffusion ou exploitation, totale ou partielle, sans
          autorisation écrite préalable, est interdite et constitue une contrefaçon susceptible de poursuites.
        </p>
      </>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité',
    content: (
      <>
        <p>
          Nous apportons le plus grand soin à l'exactitude des informations publiées. Nous ne pouvons toutefois
          garantir l'absence d'erreur ou d'omission, ni l'accès continu au site, qui peut être interrompu pour
          maintenance ou en raison d'événements indépendants de notre volonté.
        </p>
        <p>
          Le site peut contenir des liens vers des sites tiers (réseaux sociaux notamment). Rayonne Kelly
          Immobilier n'exerce aucun contrôle sur leur contenu et décline toute responsabilité à leur égard.
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles et cookies',
    content: (
      <>
        <p>
          Le traitement des données personnelles est détaillé dans notre{' '}
          <a href="/confidentialite">Politique de Confidentialité</a>. Le site utilise uniquement les dispositifs
          techniques nécessaires à son fonctionnement (session, authentification, préférences).
        </p>
      </>
    ),
  },
  {
    id: 'droit',
    title: 'Droit applicable et litiges',
    content: (
      <>
        <p>
          Les présentes mentions sont régies par le droit ivoirien. En cas de litige, une solution amiable sera
          recherchée en priorité. À défaut, les tribunaux compétents d'Abidjan seront seuls compétents.
        </p>
      </>
    ),
  },
];

export default function MentionsLegales() {
  return (
    <LegalLayout
      eyebrow="Informations légales"
      title="Mentions"
      titleItalic="légales"
      intro="La transparence est le premier signe de confiance. Retrouvez ici l'identité de l'éditeur du site, son hébergement et le cadre juridique qui s'applique à votre navigation."
      updatedAt="4 octobre 2026"
      sections={sections}
    />
  );
}
