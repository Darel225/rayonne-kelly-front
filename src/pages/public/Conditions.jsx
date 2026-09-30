import { Link } from 'react-router-dom';

export default function Conditions() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-ink">
      <div role="note" className="mb-10 rounded-sm border border-gold/40 bg-gold-light/20 px-5 py-4 text-xs leading-relaxed text-ink/70">
        Contenu provisoire à titre d'exemple. Ce texte doit être relu et validé par un juriste avant toute mise en ligne publique.
      </div>
      
      <h1 className="font-serif text-4xl mb-8">Conditions Générales (CGV/CGU)</h1>
      
      <section aria-labelledby="reservation">
        <h2 id="reservation" className="font-serif text-2xl mt-8 mb-4">Réservation et Paiement</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : conditions de réservation, méthodes de paiement acceptées, acomptes requis, cautions de garantie, processus de validation, et règles de facturation pour les résidences et services annexes]
        </p>
      </section>

      <section aria-labelledby="annulation">
        <h2 id="annulation" className="font-serif text-2xl mt-8 mb-4">Politique d'annulation</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : délais d'annulation autorisés, pénalités applicables en cas d'annulation tardive, conditions de remboursement, et gestion des cas de force majeure]
        </p>
      </section>

      <section aria-labelledby="reglement">
        <h2 id="reglement" className="font-serif text-2xl mt-8 mb-4">Règlement intérieur des résidences</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : règles applicables durant les séjours (bruit, événements festifs, tabagisme, animaux de compagnie), nombre maximum d'occupants, et pénalités en cas de dégradation ou de non-respect du règlement]
        </p>
      </section>

      <section aria-labelledby="responsabilites">
        <h2 id="responsabilites" className="font-serif text-2xl mt-8 mb-4">Responsabilités</h2>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER : limites de responsabilité de Rayonne Kelly concernant les vols, accidents, ou pertes dans les résidences, ainsi que les responsabilités incombant au client]
        </p>
      </section>

      <Link to="/" className="mt-12 inline-block text-xs uppercase tracking-[0.2em] text-royal hover:text-royal-dark">
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
