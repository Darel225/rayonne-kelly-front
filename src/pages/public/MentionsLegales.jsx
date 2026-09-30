import { Link } from 'react-router-dom';

export default function MentionsLegales() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-ink">
      <div role="note" className="mb-10 rounded-sm border border-gold/40 bg-gold-light/20 px-5 py-4 text-xs leading-relaxed text-ink/70">
        Contenu provisoire à titre d'exemple. Ce texte doit être relu et validé par un juriste avant toute mise en ligne publique.
      </div>
      
      <h1 className="font-serif text-4xl mb-8">Mentions Légales</h1>
      
      <section aria-labelledby="editeur">
        <h2 id="editeur" className="font-serif text-2xl mt-8 mb-4">Éditeur du site</h2>
        <p className="text-ink/80 leading-relaxed">
          Rayonne Kelly<br />
          Abidjan, Côte d'Ivoire<br />
          [À COMPLÉTER : numéro d'immatriculation au RCCM, numéro de compte contribuable, capital social, adresse complète du siège social, nom du directeur de la publication, coordonnées de contact]
        </p>
      </section>

      <section aria-labelledby="hebergement">
        <h2 id="hebergement" className="font-serif text-2xl mt-8 mb-4">Hébergement</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : Nom de l'hébergeur, adresse complète du siège social de l'hébergeur, numéro de téléphone de l'hébergeur]
        </p>
      </section>

      <section aria-labelledby="propriete">
        <h2 id="propriete" className="font-serif text-2xl mt-8 mb-4">Propriété intellectuelle</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : Déclaration sur les droits d'auteur, la protection des textes, images, logos, et interdiction de reproduction sans autorisation préalable]
        </p>
      </section>

      <Link to="/" className="mt-12 inline-block text-xs uppercase tracking-[0.2em] text-royal hover:text-royal-dark">
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
