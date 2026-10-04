import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const premiumEase = [0.22, 1, 0.36, 1];

/**
 * Gabarit éditorial commun aux pages juridiques.
 * Props :
 *  - eyebrow : petit libellé doré au-dessus du titre
 *  - title / titleItalic : titre en deux temps (romain + italique)
 *  - intro : paragraphe d'introduction
 *  - updatedAt : date de dernière mise à jour (texte)
 *  - sections : [{ id, title, content: ReactNode }]
 */
export default function LegalLayout({ eyebrow, title, titleItalic, intro, updatedAt, sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [title]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="bg-ivory">
      {/* Bandeau d'en-tête */}
      <header className="relative overflow-hidden bg-night text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-night via-night-soft to-night" />
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <motion.div
          className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-36 md:pb-24 md:pt-44"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: premiumEase }}
        >
          <div className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold">
            <div className="h-1.5 w-1.5 rounded-full bg-gold" />
            {eyebrow}
          </div>
          <h1 className="font-serif text-4xl font-normal leading-[1.1] md:text-6xl">
            {title}
            {titleItalic && <span className="block italic text-gold-light">{titleItalic}</span>}
          </h1>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">{intro}</p>
          <div className="mt-10 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/40">
            <span className="h-px w-10 bg-gold/60" />
            Dernière mise à jour : {updatedAt}
          </div>
        </motion.div>
      </header>

      {/* Corps */}
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[260px_1fr] lg:gap-20">
        {/* Sommaire */}
        <aside className="hidden lg:block">
          <nav aria-label="Sommaire" className="sticky top-32">
            <div className="mb-6 text-[10px] uppercase tracking-[0.25em] text-gold-dark">Sommaire</div>
            <ol className="space-y-1 border-l border-ink/10">
              {sections.map((s, i) => {
                const active = activeId === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`-ml-px block border-l py-2 pl-5 text-xs leading-snug transition-colors ${
                        active
                          ? 'border-gold text-ink'
                          : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                    >
                      <span className="mr-2 font-serif text-gold-dark">{String(i + 1).padStart(2, '0')}</span>
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        {/* Articles */}
        <main className="min-w-0">
          <div className="space-y-14">
            {sections.map((s, i) => (
              <motion.section
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-title`}
                className="scroll-mt-32"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, ease: premiumEase }}
              >
                <div className="mb-5 flex items-baseline gap-4 border-b border-ink/10 pb-4">
                  <span className="font-serif text-3xl italic text-gold-dark">{String(i + 1).padStart(2, '0')}</span>
                  <h2 id={`${s.id}-title`} className="font-serif text-2xl text-ink md:text-3xl">
                    {s.title}
                  </h2>
                </div>
                <div className="space-y-4 text-sm leading-[1.85] text-ink/75 md:text-[15px] [&_a]:text-royal [&_a:hover]:text-royal-dark [&_strong]:font-medium [&_strong]:text-ink [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:marker:text-gold">
                  {s.content}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Bloc contact */}
          <div className="mt-20 border border-gold/30 bg-white p-8 md:p-10">
            <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-gold-dark">Une question ?</div>
            <p className="font-serif text-2xl text-ink">Notre équipe vous répond personnellement.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Rayonne Kelly Immobilier · Marcory Zone 4, Abidjan, Côte d'Ivoire<br />
              WhatsApp / Téléphone : +225 07 10 10 10 52 ·{' '}
              <a className="text-royal hover:text-royal-dark" href="mailto:contact@rayonnekelly.ci">contact@rayonnekelly.ci</a>
            </p>
          </div>

          {/* Navigation entre pages juridiques */}
          <nav aria-label="Autres documents" className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.2em]">
            <Link to="/mentions-legales" className="text-ink-muted transition-colors hover:text-ink">Mentions légales</Link>
            <Link to="/confidentialite" className="text-ink-muted transition-colors hover:text-ink">Confidentialité</Link>
            <Link to="/conditions" className="text-ink-muted transition-colors hover:text-ink">CGV / CGU</Link>
          </nav>

          <Link to="/" className="mt-10 inline-block text-xs uppercase tracking-[0.2em] text-royal hover:text-royal-dark">
            ← Retour à l'accueil
          </Link>
        </main>
      </div>
    </div>
  );
}
