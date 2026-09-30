import res1 from "../assets/images/residence-1.webp";
import res2 from "../assets/images/residence-2.webp";
import res3 from "../assets/images/residence-3.webp";

// TODO: replace with the real photo (residence-4)
import res4 from "../assets/images/residence-1.webp";
// TODO: replace with the real photo (residence-5)
import res5 from "../assets/images/residence-2.webp";
// TODO: replace with the real photo (residence-6)
import res6 from "../assets/images/residence-3.webp";

export const residences = [
  { id: "rk-01", slug: "rayonne-appart", ref: "RK-01", layout: "split", type: "Appartement", title: "Rayonne Appart", city: "Abidjan", location: "Cocody Ambassades", area: "Cocody", status: "available", description: "Spectaculaire villa contemporaine avec piscine privée, offrant un cadre intimiste et sécurisé en plein cœur de Cocody.", guests: 6, rooms: 4, highlight: "Piscine", pricePerNight: 150000, amenities: ["pool","generator","fiber"], image: res1, imageAlt: "Piscine et terrasse de Rayonne Appart" },
  { id: "rk-02", slug: "joyau-de-bietry", ref: "RK-02", layout: "split", type: "Villa", title: "Le Joyau de Biétry", city: "Abidjan", location: "Marcory Zone 4 · Front de Lagune", area: "Marcory", status: "available", description: "Appartement de très haut standing avec baies vitrées et vue imprenable sur la lagune Ébrié, design moderne et équipements premium.", guests: 2, rooms: 2, highlight: "Vue Lagune", pricePerNight: 85000, amenities: ["lagoon","fiber"], image: res2, imageAlt: "Salon du Joyau de Biétry" },
  { id: "rk-03", slug: "ecrin-du-plateau", ref: "RK-03", layout: "wide", type: "Penthouse", title: "L'Écrin du Plateau", city: "Abidjan", location: "Le Plateau", area: "Plateau", status: "available", description: "Surplombant les grandes avenues institutionnelles, ce penthouse fusionne les exigences de discrétion absolue d'un cabinet diplomatique avec la sérénité aérienne d'une villa en altitude.", guests: 2, rooms: 2, highlight: "Salon de dégustation", pricePerNight: 120000, amenities: ["security","fiber"], image: res3, imageAlt: "Salon de l'Écrin du Plateau" }
];

export const moreResidences = [
  { id: "rk-04", slug: "villa-oceane", ref: "RK-04", layout: "split", type: "Villa", title: "Villa Océane", city: "Abidjan", location: "Assinie", area: "Assinie", status: "available", description: "Une retraite balnéaire sans compromis, nichée sur la presqu'île d'Assinie-Mafia entre l'océan Atlantique et la lagune. Salon cathédrale ouvert sur ponton privé et pavillon invités.", guests: 8, rooms: 6, highlight: "Piscine à débordement", pricePerNight: 250000, amenities: ["pool","chef","generator"], image: res4, imageAlt: "Terrasse avec transat et parasol rouge de la Villa Océane" },
  { id: "rk-05", slug: "domaine-du-golf", ref: "RK-05", layout: "split", type: "Villa", title: "Domaine du Golf", city: "Abidjan", location: "Riviera Golf", area: "Riviera", status: "available", description: "Propriété d'angle au sein de la Riviera, disposant d'un jardin tropical manucuré, groupe électrogène industriel silencieux et d'une suite parentale avec dressing sur-mesure.", guests: 2, rooms: 2, highlight: "Jardin tropical", pricePerNight: 110000, amenities: ["generator","fiber"], image: res5, imageAlt: "Salon en double hauteur du Domaine du Golf" },
  { id: "rk-06", slug: "duplex-renaissance", ref: "RK-06", layout: "split", type: "Duplex", title: "Le Duplex Renaissance", city: "Abidjan", location: "Cocody", area: "Cocody", status: "available", description: "Architecture en duplex aux volumes généreux sous plafond. Finitions marbre italien, cuisine professionnelle entièrement équipée et sécurité 24/7.", guests: 2, rooms: 2, highlight: "Sécurité 24/7", pricePerNight: 95000, amenities: ["security","fiber"], image: res6, imageAlt: "Chambre du Duplex Renaissance" }
];

export const allResidences = [...residences, ...moreResidences];

export const amenityOptions = [
  { id: "pool", label: "Piscine privée" }, 
  { id: "lagoon", label: "Vue Lagune" }, 
  { id: "chef", label: "Chef de table privé" }, 
  { id: "security", label: "Chauffeur & Sécurité 24/7" }, 
  { id: "generator", label: "Groupe Électrogène" }, 
  { id: "fiber", label: "Fibre optique & Domotique" }
];

export const statusLabels = { 
  available: "Disponible", 
  booked: "Réservé" 
};

export default residences;
