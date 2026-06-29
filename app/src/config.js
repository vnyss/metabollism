// ─── Flask backend URL ────────────────────────────────────────────────────────
// Your public IPv4:  106.222.208.220
// Your IPv6:         2001:4860:7:805::80
//
// Use whichever your phone can reach. Both your phone and PC must be on a
// network where this IP is accessible (e.g. same mobile hotspot / LAN).
// Flask now listens on 0.0.0.0:5000 so it accepts connections from any interface.

export const API_BASE_URL = 'http://106.222.208.220:5000';

// To use IPv6 instead, comment out the line above and uncomment this:
// export const API_BASE_URL = 'http://[2001:4860:7:805::80]:5000';

// Open-Meteo weather API (free, no key needed)
export const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// Open Food Facts (barcode lookup, free, no key needed)
export const FOOD_API = 'https://world.openfoodfacts.org/api/v2/product';
