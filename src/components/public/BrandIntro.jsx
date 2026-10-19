import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

export default function BrandIntro() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forceIntro = searchParams.get('intro') === '1' || searchParams.get('replay') === '1';

  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (location.pathname !== '/') return false;
    if (forceIntro) return true;
    return !sessionStorage.getItem('rk_brand_intro_seen');
  });

  const [isExiting, setIsExiting] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  const completeIntro = useCallback((skipImmediately = false) => {
    try {
      sessionStorage.setItem('rk_brand_intro_seen', '1');
    } catch {
      // Ignore storage access errors in private modes
    }

    if (skipImmediately) {
      setIsSkipped(true);
      setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 250);
    } else {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 700);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Lock scroll during intro
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-lift curtain after animation finishes (3.4s)
    const timer = setTimeout(() => {
      completeIntro(false);
    }, 3400);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isVisible, completeIntro]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introduction Rayonne Kelly"
      className={`rk-intro-overlay ${isSkipped ? 'rk-intro-skip-fade' : ''} ${isExiting ? 'rk-intro-lift' : ''}`}
    >
      {/* Background Starry Glow & Aura */}
      <div className="rk-intro-ambient-glow" />
      <div className="rk-intro-stars-layer" />

      {/* Main SVG Animation Stage */}
      <div className="rk-intro-stage">
        <svg
          viewBox="0 0 1000 600"
          className="rk-intro-svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            {/* Golden Linear Gradient */}
            <linearGradient id="rk-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2D6" />
              <stop offset="35%" stopColor="#E8D9B5" />
              <stop offset="70%" stopColor="#C9A96E" />
              <stop offset="100%" stopColor="#A88B4A" />
            </linearGradient>

            {/* Glowing Golden Trail Mask */}
            <mask id="rk-flight-trail-mask" maskUnits="userSpaceOnUse" x="-500" y="-500" width="2000" height="2000">
              <path
                d="M 80 500 C 220 440 330 330 460 270 C 580 210 680 230 760 330 C 785 365 805 400 820 425"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="10"
                pathLength="1"
                className="rk-intro-trail-reveal"
              />
            </mask>

            {/* Jet Engine Glow Filter */}
            <filter id="rk-engine-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Flight Phase Layer: Jet, Trail, Coordinates, Pin and Ripples */}
          <g className="rk-intro-flight-layer">
            {/* Golden Coordinates & Header Subtitle */}
            <text x="500" y="80" textAnchor="middle" className="rk-intro-geo-text">
              5°19&apos;N · 4°01&apos;W — VOL PRIVÉ EN APPROCHE
            </text>

            {/* Animated Flight Path (Dashed Gold Trail) */}
            <path
              d="M 120 440 C 260 380 370 240 500 200 C 600 170 680 210 720 290"
              fill="none"
              stroke="url(#rk-gold-grad)"
              strokeWidth="2.4"
              strokeDasharray="6 8"
              strokeLinecap="round"
              mask="url(#rk-flight-trail-mask)"
              className="rk-intro-trail-path"
            />

            {/* Flying Private Jet */}
            <g className="rk-intro-jet-group">
              <g transform="translate(0, 0)">
                {/* Twin Engine Afterburner Glow */}
                <circle cx="-22" cy="-4" r="3" fill="#FFE29A" filter="url(#rk-engine-glow)" opacity="0.9" />
                <circle cx="-22" cy="4" r="3" fill="#FFE29A" filter="url(#rk-engine-glow)" opacity="0.9" />

                {/* Private Jet Fuselage & Swept Wings */}
                <path
                  d="M 28 0 
                     L 8 -2.8 
                     L -2 -19 
                     L -8 -19 
                     L -3 -3.5 
                     L -16 -3.5 
                     L -21 -10 
                     L -24 -10 
                     L -22 0 
                     L -24 10 
                     L -21 10 
                     L -16 3.5 
                     L -3 3.5 
                     L -8 19 
                     L -2 19 
                     L 8 2.8 
                     Z"
                  fill="url(#rk-gold-grad)"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                  className="rk-intro-jet-body"
                />

                {/* Jet Cockpit Glass Highlight */}
                <ellipse cx="14" cy="0" rx="4" ry="1.2" fill="#0B1426" opacity="0.8" />
              </g>

              {/* animateMotion along the flight curve */}
              <animateMotion
                path="M 120 440 C 260 380 370 240 500 200 C 600 170 680 210 720 290"
                begin="0.2s"
                dur="1.15s"
                fill="freeze"
                rotate="auto"
                calcMode="spline"
                keyPoints="0;1"
                keyTimes="0;1"
                keySplines="0.4 0 0.2 1"
              />
            </g>

            {/* Touchdown Ripple Waves (at destination coordinates: 720, 290) */}
            <circle cx="720" cy="290" r="8" className="rk-intro-ripple-1" />
            <circle cx="720" cy="290" r="8" className="rk-intro-ripple-2" />

            {/* Royal Destination Pin & Jewel (Abidjan) */}
            <g className="rk-intro-pin-group" transform="translate(720, 290)">
              {/* Faceted Diamond Pin */}
              <path
                d="M 0 -36 
                   C 9 -36 16 -29 16 -20 
                   C 16 -10 5 -2 0 0 
                   C -5 -2 -16 -10 -16 -20 
                   C -16 -29 -9 -36 0 -36 Z"
                fill="url(#rk-gold-grad)"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                className="rk-intro-pin-shape"
              />
              {/* Jewel Center Core */}
              <circle cx="0" cy="-20" r="5" fill="#0B1426" stroke="#FFFFFF" strokeWidth="0.8" />
              <circle cx="0" cy="-20" r="2.5" fill="url(#rk-gold-grad)" />

              {/* City Destination Label */}
              <text x="0" y="24" textAnchor="middle" className="rk-intro-city-label">
                ABIDJAN
              </text>
            </g>
          </g>
        </svg>

        {/* Phase 3: The Golden Reveal (Medallion & Prestige Branding) */}
        <div className="rk-intro-brand-reveal">
          {/* Circular Luxury Seal with Official Logo */}
          <div className="rk-intro-medallion-container">
            <div className="rk-intro-medallion-halo" />
            <div className="rk-intro-medallion">
              <img
                src={logo}
                alt="Rayonne Kelly"
                className="w-full h-full object-contain p-1.5"
              />
            </div>
          </div>

          {/* Prestige Typography */}
          <div className="rk-intro-text-block">
            <div className="rk-intro-gold-line" />
            <h1 className="rk-intro-title">RAYONNE KELLY</h1>
            <p className="rk-intro-subtitle">
              HAUTE CONCIERGERIE PRIVÉE · RÉSIDENCES DE PRESTIGE
            </p>
            <span className="rk-intro-city-tag">ABIDJAN · CÔTE D&apos;IVOIRE</span>
          </div>
        </div>
      </div>

      {/* Skip Intro Button */}
      <button
        type="button"
        onClick={() => completeIntro(true)}
        className="rk-intro-skip-btn"
        aria-label="Passer l'introduction"
      >
        <span>Passer</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
