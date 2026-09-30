import { Link } from 'react-router-dom';

export default function Confidentialite() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-ink">
      <div role="note" className="mb-10 rounded-sm border border-gold/40 bg-gold-light/20 px-5 py-4 text-xs leading-relaxed text-ink/70">
        Contenu provisoire à titre d'exemple. Ce texte doit être relu et validé par un juriste avant toute mise en ligne publique.
      </div>
      
      <h1 className="font-serif text-4xl mb-8">Politique de Confidentialité</h1>
      
      <section aria-labelledby="collecte">
        <h2 id="collecte" className="font-serif text-2xl mt-8 mb-4">Collecte des données</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : description de la collecte des données personnelles telles que les noms, adresses e-mail, numéros de téléphone (WhatsApp), informations de facturation, ou données de navigation lors de l'utilisation du site]
        </p>
      </section>

      <section aria-labelledby="utilisation">
        <h2 id="utilisation" className="font-serif text-2xl mt-8 mb-4">Utilisation des données</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : explication sur l'utilisation des données pour la gestion des réservations, l'organisation des services de conciergerie, l'envoi de la newsletter "La Gazette Privée", et les communications liées au séjour]
        </p>
      </section>

      <section aria-labelledby="droits">
        <h2 id="droits" className="font-serif text-2xl mt-8 mb-4">Vos droits</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : détail des droits des utilisateurs concernant l'accès, la rectification, la portabilité et la suppression de leurs données personnelles, ainsi que la méthode pour exercer ces droits (ex: adresse e-mail de contact)]
        </p>
      </section>

      <Link to="/" className="mt-12 inline-block text-xs uppercase tracking-[0.2em] text-royal hover:text-royal-dark">
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
