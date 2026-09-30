
const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    className: 'bg-gold-light/40 text-gold-dark',
  },
  validated: {
    label: 'Validée',
    className: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-700',
  },
};

const DEFAULT_STATUS = {
  className: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    ...DEFAULT_STATUS,
    label: status || '—',
  };

  const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide';
  const combinedClassName = [baseClasses, config.className, className].filter(Boolean).join(' ');

  return (
    <span className={combinedClassName}>
      {config.label}
    </span>
  );
}
