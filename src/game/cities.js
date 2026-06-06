/* =========================================================================
   « Place la ville » — 50 villes les plus peuplées de France métropolitaine
   avec coordonnées réelles (lat/lng). On projette en équirectangulaire sur
   une boîte englobant la France ; un tracé SVG décoratif sert de fond.
   Les distances sont calculées en km réels (haversine) → fiable et hors-ligne.
   ========================================================================= */

export const CITIES = [
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Marseille", lat: 43.2965, lng: 5.3698 },
  { name: "Lyon", lat: 45.764, lng: 4.8357 },
  { name: "Toulouse", lat: 43.6047, lng: 1.4442 },
  { name: "Nice", lat: 43.7102, lng: 7.262 },
  { name: "Nantes", lat: 47.2184, lng: -1.5536 },
  { name: "Montpellier", lat: 43.6108, lng: 3.8767 },
  { name: "Strasbourg", lat: 48.5734, lng: 7.7521 },
  { name: "Bordeaux", lat: 44.8378, lng: -0.5792 },
  { name: "Lille", lat: 50.6292, lng: 3.0573 },
  { name: "Rennes", lat: 48.1173, lng: -1.6778 },
  { name: "Reims", lat: 49.2583, lng: 4.0317 },
  { name: "Le Havre", lat: 49.4944, lng: 0.1079 },
  { name: "Saint-Étienne", lat: 45.4397, lng: 4.3872 },
  { name: "Toulon", lat: 43.1242, lng: 5.928 },
  { name: "Grenoble", lat: 45.1885, lng: 5.7245 },
  { name: "Dijon", lat: 47.322, lng: 5.0415 },
  { name: "Angers", lat: 47.4784, lng: -0.5632 },
  { name: "Nîmes", lat: 43.8367, lng: 4.3601 },
  { name: "Villeurbanne", lat: 45.7719, lng: 4.8902 },
  { name: "Clermont-Ferrand", lat: 45.7772, lng: 3.087 },
  { name: "Le Mans", lat: 48.0061, lng: 0.1996 },
  { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  { name: "Brest", lat: 48.3904, lng: -4.4861 },
  { name: "Tours", lat: 47.3941, lng: 0.6848 },
  { name: "Amiens", lat: 49.8941, lng: 2.2958 },
  { name: "Limoges", lat: 45.8336, lng: 1.2611 },
  { name: "Annecy", lat: 45.8992, lng: 6.1294 },
  { name: "Perpignan", lat: 42.6886, lng: 2.8948 },
  { name: "Besançon", lat: 47.238, lng: 6.0243 },
  { name: "Metz", lat: 49.1193, lng: 6.1757 },
  { name: "Orléans", lat: 47.9029, lng: 1.909 },
  { name: "Rouen", lat: 49.4432, lng: 1.0993 },
  { name: "Mulhouse", lat: 47.7508, lng: 7.3359 },
  { name: "Caen", lat: 49.1829, lng: -0.3707 },
  { name: "Nancy", lat: 48.6921, lng: 6.1844 },
  { name: "Saint-Denis", lat: 48.9362, lng: 2.3574 },
  { name: "Argenteuil", lat: 48.9472, lng: 2.2467 },
  { name: "Montreuil", lat: 48.8638, lng: 2.4485 },
  { name: "Roubaix", lat: 50.6942, lng: 3.1746 },
  { name: "Dunkerque", lat: 51.0344, lng: 2.3768 },
  { name: "Tourcoing", lat: 50.7236, lng: 3.1612 },
  { name: "Avignon", lat: 43.9493, lng: 4.8055 },
  { name: "Poitiers", lat: 46.5802, lng: 0.3404 },
  { name: "Nanterre", lat: 48.8924, lng: 2.2069 },
  { name: "Versailles", lat: 48.8014, lng: 2.1301 },
  { name: "Pau", lat: 43.2951, lng: -0.3708 },
  { name: "La Rochelle", lat: 46.1603, lng: -1.1511 },
  { name: "Calais", lat: 50.9513, lng: 1.8587 },
  { name: "Ajaccio", lat: 41.9192, lng: 8.7386 },
];

/* Boîte de projection (équirectangulaire) englobant la métropole + Corse. */
const BOX = { lngMin: -5.4, lngMax: 9.8, latMin: 41.2, latMax: 51.3 };

/* lat/lng -> coordonnées normalisées 0..1 (y vers le bas). */
export function project({ lat, lng }) {
  return {
    x: (lng - BOX.lngMin) / (BOX.lngMax - BOX.lngMin),
    y: (BOX.latMax - lat) / (BOX.latMax - BOX.latMin),
  };
}
/* normalisé 0..1 -> lat/lng. */
export function unproject({ x, y }) {
  return {
    lng: BOX.lngMin + x * (BOX.lngMax - BOX.lngMin),
    lat: BOX.latMax - y * (BOX.latMax - BOX.latMin),
  };
}

/* Distance haversine en km. */
export function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/* Contour (simplifié) de la France métropolitaine + Corse, en coordonnées
   géographiques réelles (lng, lat). On le projette avec la MÊME projection que
   les villes → l'outline et les marqueurs sont parfaitement alignés. */
const FRANCE_BORDER = [
  [2.40, 51.05], [1.85, 50.95], [1.58, 50.72], [1.50, 50.20], [1.08, 49.93],
  [0.10, 49.50], [-0.37, 49.30], [-1.60, 49.65], [-1.60, 48.83], [-1.50, 48.62],
  [-2.76, 48.60], [-4.50, 48.39], [-4.79, 48.04], [-4.10, 47.90], [-3.37, 47.65],
  [-2.76, 47.55], [-2.20, 47.27], [-2.25, 46.95], [-1.78, 46.50], [-1.15, 46.16],
  [-1.03, 45.60], [-1.06, 45.10], [-1.16, 44.66], [-1.56, 43.48], [-1.79, 43.35],
  [-0.70, 42.95], [0.65, 42.70], [1.45, 42.55], [2.65, 42.35], [3.17, 42.45],
  [3.03, 42.78], [3.30, 43.20], [3.70, 43.40], [3.87, 43.50], [4.80, 43.35],
  [5.37, 43.27], [5.93, 43.10], [6.64, 43.16], [7.02, 43.50], [7.52, 43.78],
  [7.50, 44.15], [6.85, 44.55], [6.95, 44.90], [6.86, 45.50], [6.86, 45.83],
  [6.15, 46.20], [6.06, 46.42], [5.96, 46.80], [7.00, 47.35], [7.59, 47.59],
  [7.79, 48.58], [7.93, 49.04], [6.85, 49.20], [6.13, 49.46], [5.40, 49.55],
  [4.85, 49.79], [4.20, 50.00], [4.00, 50.35], [3.55, 50.38], [3.06, 50.63],
];
const CORSICA_BORDER = [
  [9.36, 43.00], [9.45, 42.81], [9.55, 42.30], [9.50, 41.92], [9.18, 41.39],
  [8.80, 41.56], [8.74, 41.92], [8.66, 42.27], [8.76, 42.57], [9.10, 42.70],
];

function toPath(border) {
  return border.map((c, i) => {
    const p = project({ lng: c[0], lat: c[1] });
    return `${i === 0 ? "M" : "L"}${(p.x * 100).toFixed(2)},${(p.y * 100).toFixed(2)}`;
  }).join(" ") + " Z";
}

export const FRANCE_PATH = toPath(FRANCE_BORDER);
export const CORSICA_PATH = toPath(CORSICA_BORDER);
