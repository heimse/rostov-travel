import * as React from 'react';
import * as SecureStore from 'expo-secure-store';
import type { Attraction } from './AttractionsListScreen';

export type InterestKey =
  | 'museums'
  | 'theatres'
  | 'parks'
  | 'monuments'
  | 'churches'
  | 'markets'
  | 'restaurants'
  | 'hotels';

export type UserRoute = {
  id: string;
  title: string;
  city: string;
  stops: Attraction[];
  createdAt: number;
};

type PreferencesState = {
  interests: Record<InterestKey, boolean>;
  setInterests: (next: Record<InterestKey, boolean>) => void;
  favoriteRouteIds: Set<string>;
  toggleFavoriteRoute: (routeId: string) => void;
  favoriteAttractionIds: Set<string>;
  toggleFavoriteAttraction: (attractionId: string) => void;
  routeStops: Attraction[];
  addRouteStop: (attraction: Attraction) => void;
  removeRouteStop: (attractionId: string) => void;
  moveRouteStop: (fromIndex: number, toIndex: number) => void;
  clearRouteStops: () => void;
  userRoutes: UserRoute[];
  addUserRoute: (route: UserRoute) => void;
  authToken: string | null;
  authRole: string | null;
  userId: string | null;
  setAuth: (token: string, role: string) => void;
  logout: () => void;
  profile: { username: string; name: string; phone: string; email: string };
  updateProfile: (next: Partial<{ username: string; name: string; phone: string; email: string }>) => void;
};

const defaultInterests: Record<InterestKey, boolean> = {
  museums: false,
  theatres: false,
  parks: false,
  monuments: false,
  churches: false,
  markets: false,
  restaurants: false,
  hotels: false,
};

export const PreferencesContext = React.createContext<PreferencesState>({
  interests: defaultInterests,
  setInterests: () => {},
  favoriteRouteIds: new Set<string>(),
  toggleFavoriteRoute: () => {},
  favoriteAttractionIds: new Set<string>(),
  toggleFavoriteAttraction: () => {},
  routeStops: [],
  addRouteStop: () => {},
  removeRouteStop: () => {},
  moveRouteStop: () => {},
  clearRouteStops: () => {},
  userRoutes: [],
  addUserRoute: () => {},
  authToken: null,
  authRole: null,
  userId: null,
  setAuth: () => {},
  logout: () => {},
  profile: { username: '', name: '', phone: '', email: '' },
  updateProfile: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [interests, setInterests] = React.useState<Record<InterestKey, boolean>>(defaultInterests);
  const [favoriteRouteIds, setFavoriteRouteIds] = React.useState<Set<string>>(new Set());
  const [favoriteAttractionIds, setFavoriteAttractionIds] = React.useState<Set<string>>(new Set());
  const [routeStops, setRouteStops] = React.useState<Attraction[]>([]);
  const [userRoutes, setUserRoutes] = React.useState<UserRoute[]>([]);
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [authRole, setAuthRole] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<{ username: string; name: string; phone: string; email: string }>({ username: '', name: '', phone: '', email: '' });

  // hydrate persisted auth/profile (moved below setAuth definition)

  const toggleFavoriteRoute = React.useCallback((routeId: string) => {
    setFavoriteRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId); else next.add(routeId);
      // persist async (fire and forget)
      (async () => {
        try {
          await SecureStore.setItemAsync('favoriteRoutes', JSON.stringify([...next]));
        } catch {}
      })();
      // try sync to server
      (async () => {
        try {
          await syncFavoritesToServer(next, favoriteAttractionIds, authToken, userId);
        } catch {}
      })();
      return next;
    });
  }, [favoriteAttractionIds, authToken, userId]);

  const toggleFavoriteAttraction = React.useCallback((attractionId: string) => {
    setFavoriteAttractionIds((prev) => {
      const next = new Set(prev);
      if (next.has(attractionId)) next.delete(attractionId); else next.add(attractionId);
      // persist async (fire and forget)
      (async () => {
        try {
          await SecureStore.setItemAsync('favoriteAttractions', JSON.stringify([...next]));
        } catch {}
      })();
      // try sync to server
      (async () => {
        try {
          await syncFavoritesToServer(favoriteRouteIds, next, authToken, userId);
        } catch {}
      })();
      return next;
    });
  }, [favoriteRouteIds, authToken, userId]);

  const addRouteStop = React.useCallback((attraction: Attraction) => {
    setRouteStops((prev) => (prev.find((a) => a.id === attraction.id) ? prev : [...prev, attraction]));
  }, []);

  const removeRouteStop = React.useCallback((attractionId: string) => {
    setRouteStops((prev) => prev.filter((a) => a.id !== attractionId));
  }, []);

  const moveRouteStop = React.useCallback((fromIndex: number, toIndex: number) => {
    setRouteStops((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  const clearRouteStops = React.useCallback(() => setRouteStops([]), []);

  const addUserRoute = React.useCallback((route: UserRoute) => {
    setUserRoutes((prev) => [route, ...prev.filter((r) => r.id !== route.id)]);
  }, []);

  const setAuth = React.useCallback((token: string, role: string) => {
    setAuthToken(token);
    setAuthRole(role);
    // попытка извлечь user_id и username из JWT
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = payloadB64 + '==='.slice((payloadB64.length + 3) % 4);
        const bytes = base64ToBytes(padded);
        const json = utf8Decode(bytes);
        const payload = JSON.parse(json);
        if (payload?.user_id && typeof payload.user_id === 'string') setUserId(payload.user_id);
        if (payload?.username && typeof payload.username === 'string') setProfile((prev) => ({ ...prev, username: payload.username }));
      }
    } catch {}
    // persist auth
    (async () => {
      try {
        await SecureStore.setItemAsync('auth', JSON.stringify({ token, role }));
      } catch {}
    })();
  }, []);

  const logout = React.useCallback(() => {
    setAuthToken(null);
    setAuthRole(null);
    setUserId(null);
    // clear persisted data
    (async () => {
      try {
        await SecureStore.deleteItemAsync('auth');
        await SecureStore.deleteItemAsync('profile');
      } catch {}
    })();
  }, []);

  const updateProfile = React.useCallback((next: Partial<{ username: string; name: string; phone: string; email: string }>) => {
    setProfile((prev) => {
      const merged = { ...prev, ...next };
      (async () => {
        try {
          await SecureStore.setItemAsync('profile', JSON.stringify(merged));
        } catch {}
      })();
      return merged;
    });
  }, []);

  // now safe to hydrate (setAuth is defined)
  React.useEffect(() => {
    (async () => {
      try {
        const rawAuth = await SecureStore.getItemAsync('auth');
        if (rawAuth) {
          const parsed = JSON.parse(rawAuth);
          if (parsed?.token && parsed?.role) {
            setAuth(parsed.token, parsed.role);
          }
        }
        const rawProfile = await SecureStore.getItemAsync('profile');
        if (rawProfile) {
          const parsedProfile = JSON.parse(rawProfile);
          if (parsedProfile && typeof parsedProfile === 'object') {
            setProfile((prev) => ({ ...prev, ...parsedProfile }));
          }
        }
        const rawFavRoutes = await SecureStore.getItemAsync('favoriteRoutes');
        if (rawFavRoutes) {
          try {
            const parsedFavRoutes: unknown = JSON.parse(rawFavRoutes);
            if (Array.isArray(parsedFavRoutes)) {
              const ids = parsedFavRoutes.filter((x) => typeof x === 'string') as string[];
              setFavoriteRouteIds(new Set(ids));
            }
          } catch {}
        }
        const rawFavAttractions = await SecureStore.getItemAsync('favoriteAttractions');
        if (rawFavAttractions) {
          try {
            const parsedFavs: unknown = JSON.parse(rawFavAttractions);
            if (Array.isArray(parsedFavs)) {
              const ids = parsedFavs.filter((x) => typeof x === 'string') as string[];
              setFavoriteAttractionIds(new Set(ids));
            }
          } catch {}
        }
      } catch {}
    })();
  }, [setAuth]);

  const value = React.useMemo(() => ({
    interests,
    setInterests,
    favoriteRouteIds,
    toggleFavoriteRoute,
    favoriteAttractionIds,
    toggleFavoriteAttraction,
    routeStops,
    addRouteStop,
    removeRouteStop,
    moveRouteStop,
    clearRouteStops,
    userRoutes,
    addUserRoute,
    authToken,
    authRole,
    userId,
    setAuth,
    logout,
    profile,
    updateProfile,
  }), [
    interests,
    favoriteRouteIds,
    toggleFavoriteRoute,
    favoriteAttractionIds,
    toggleFavoriteAttraction,
    routeStops,
    addRouteStop,
    removeRouteStop,
    moveRouteStop,
    clearRouteStops,
    userRoutes,
    addUserRoute,
    authToken,
    authRole,
    userId,
    setAuth,
    logout,
    profile,
    updateProfile,
  ]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// --- helpers ---
function base64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;
  for (let i = 0; i < base64.length; i++) {
    const c = base64.charAt(i);
    const val = chars.indexOf(c);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      output.push((buffer >> bitsCollected) & 0xff);
    }
  }
  return new Uint8Array(output);
}

function utf8Decode(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c < 0x80) {
      out += String.fromCharCode(c);
    } else if (c < 0xE0) {
      const c2 = bytes[i++];
      out += String.fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f));
    } else if (c < 0xF0) {
      const c2 = bytes[i++], c3 = bytes[i++];
      out += String.fromCharCode(((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f));
    } else {
      // 4-byte sequences -> surrogate pairs
      const c2 = bytes[i++], c3 = bytes[i++], c4 = bytes[i++];
      const codepoint = ((c & 0x07) << 18) | ((c2 & 0x3f) << 12) | ((c3 & 0x3f) << 6) | (c4 & 0x3f);
      const offset = codepoint - 0x10000;
      out += String.fromCharCode(0xD800 + ((offset >> 10) & 0x3ff));
      out += String.fromCharCode(0xDC00 + (offset & 0x3ff));
    }
  }
  return out;
}

// --- network sync helpers ---
async function putJson(url: string, token: string, body: unknown) {
  await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

async function syncFavoritesToServer(routeIds: Set<string>, attractionIds: Set<string>, token: string | null, userId: string | null) {
  try {
    if (!token || !userId) return;
    const favorites = [
      ...[...routeIds].map((id) => ({ type: 'route', item_id: id })),
      ...[...attractionIds].map((id) => ({ type: 'place', item_id: id })),
    ];
    await putJson(`https://api.heimseweb.ru/api/v1/users/${userId}`, token, { favorites });
  } catch {}
}


