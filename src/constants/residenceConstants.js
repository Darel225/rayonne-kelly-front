export const TRANSACTION_TYPES = [
  { value: 'meuble', label: 'Meublé (Séjour)', shortLabel: 'Meublé', priceSuffix: '/ nuit', priceLabel: 'Tarif par nuitée' },
  { value: 'location', label: 'Location classique', shortLabel: 'Location', priceSuffix: '/ mois', priceLabel: 'Loyer mensuel' },
  { value: 'vente', label: 'Achat / Vente', shortLabel: 'Vente', priceSuffix: '', priceLabel: 'Prix de vente' },
];

export const RESIDENCE_STATUSES = [
  { value: 'disponible', label: 'Disponible', badgeText: 'DISPONIBLE', isAvailable: true },
  { value: 'reserve', label: 'Réservé', badgeText: 'RÉSERVÉ', isAvailable: false },
  { value: 'loue', label: 'Loué', badgeText: 'DÉJÀ LOUÉ', isAvailable: false },
  { value: 'vendu', label: 'Vendu', badgeText: 'DÉJÀ VENDU', isAvailable: false },
];

export const getTransactionType = (val) => {
  if (!val) return TRANSACTION_TYPES[0];
  const normalized = String(val).toLowerCase().trim();
  return TRANSACTION_TYPES.find(t => t.value === normalized || t.label.toLowerCase().includes(normalized)) || TRANSACTION_TYPES[0];
};

export const getResidenceStatus = (val) => {
  if (!val) return RESIDENCE_STATUSES[0];
  const normalized = String(val).toLowerCase().trim();
  return RESIDENCE_STATUSES.find(s => s.value === normalized || s.label.toLowerCase().includes(normalized)) || RESIDENCE_STATUSES[0];
};
