export type PlaceApi = {
  id: string;
  meta: {
    type?: string;
    id?: string;
    createdAt?: string;
    lastUpdated?: string;
  };
  data: {
    name?: string;
    time?: string;
    description?: string;
    address?: string;
    avgRating?: number;
    location?: string; // "lat,lon"
    price?: string;
    yandexMapsLink?: string;
    twoGisLink?: string;
    bookLink?: string;
    buyTicketsLink?: string;
    reviews?: Array<{ name?: string; review?: string; rating?: number }>;
  };
};

export type CategoryKey =
  | "museum"
  | "theatre"
  | "restaurant"
  | "hotel"
  | "park"
  | "monument"
  | "church"
  | "market";

export function normalizeCategory(raw?: string): CategoryKey {
  const v = (raw || "").toLowerCase();
  switch (v) {
    case "museum":
    case "музей":
      return "museum";
    case "theatre":
    case "театр":
      return "theatre";
    case "restaurant":
    case "ресторан":
      return "restaurant";
    case "hotel":
    case "отель":
      return "hotel";
    case "park":
    case "парк":
      return "park";
    case "monument":
    case "памятник":
      return "monument";
    case "church":
    case "церковь":
      return "church";
    case "market":
    case "рынок":
      return "market";
    default:
      return "park";
  }
}

export function parseLatLon(value?: string): {
  latitude?: number;
  longitude?: number;
} {
  if (!value) return {};
  const parts = value.split(",").map((s) => s.trim());
  if (parts.length !== 2) return {};
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!isFinite(lat) || !isFinite(lon)) return {};
  return { latitude: lat, longitude: lon };
}

export function cityFromAddress(address?: string): string {
  if (!address) return "";
  const idx = address.indexOf(",");
  return idx > 0 ? address.slice(0, idx).trim() : address.trim();
}

export function parsePriceToRub(price?: string): number | undefined {
  if (!price) return undefined;
  const low = price.toLowerCase();
  if (low.includes("бесплат")) return 0;
  const digits = price.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return isFinite(n) ? n : undefined;
}

export async function fetchPlaces(token?: string): Promise<PlaceApi[]> {
  const res = await fetch("https://api.heimseweb.ru/api/v1/places", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (res.status === 401 || res.status === 403) {
    const err = new Error("unauthorized");
    (err as any).code = "UNAUTHORIZED";
    throw err;
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data as PlaceApi[];
  // В случае если API оборачивает в объект
  if (data && Array.isArray((data as any).items))
    return (data as any).items as PlaceApi[];
  return [];
}
