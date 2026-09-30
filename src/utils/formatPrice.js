export default function formatPrice(amount, currency = "FCFA") {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " " + currency;
}
