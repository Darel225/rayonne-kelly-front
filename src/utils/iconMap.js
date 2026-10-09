import { 
  Wifi, Car, Tv, Coffee, Shield, Wind, Waves, Snowflake, Lock, Eye, 
  Camera, Check, Star, Diamond, Crown, Key, Phone, Utensils, Droplets, 
  Zap, Plug, Monitor, Speaker, Bell, Umbrella, Flame, Heart, Smile, 
  Sparkles, Moon, Sun, Bath, Bed, Book, Briefcase, Calendar, Clock, 
  Compass, Globe, Info, Mail, MapPin, Music, ShieldCheck, User
} from 'lucide-react';

export const AMENITY_ICONS = {
  // Catégorie: Confort & Climat
  Wind, Snowflake, Flame, Droplets, Sun, Moon,
  // Catégorie: Eau & Bain
  Waves, Bath, Umbrella,
  // Catégorie: Nourriture & Boisson
  Coffee, Utensils,
  // Catégorie: Multimédia & Tech
  Wifi, Tv, Monitor, Speaker, Zap, Plug, Phone,
  // Catégorie: Sécurité & Accès
  Shield, ShieldCheck, Lock, Key, Camera, Eye, Bell,
  // Catégorie: Sommeil & Détente
  Bed, Book, Music,
  // Catégorie: Services & Divers
  Car, Briefcase, Calendar, Clock, Compass, Globe, Info, Mail, MapPin, User,
  // Catégorie: Générique / Luxe
  Check, Star, Diamond, Crown, Sparkles, Smile
};

export const getAmenityIcon = (iconName) => {
  if (iconName && AMENITY_ICONS[iconName]) {
    return AMENITY_ICONS[iconName];
  }
  return Check; // Fallback par défaut
};
