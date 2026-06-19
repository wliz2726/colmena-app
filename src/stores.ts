/**
 * Zustand stores para Colmena App
 * Manejo de estado global con localStorage para auto-login
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Condominio,
  Condominimos,
  Invoice,
  CondominoDetalle,
} from './types';
import { encryptData, decryptData, normalizeWhmcsUrl } from './encryption';

// ============================================================================
// AUTH STORE - Con localStorage para credenciales encriptadas
// ============================================================================

interface SavedCredentials {
  whmcsUrl: string;
  identifier: string;
  secret: string;
}

interface UseAuthStoreState {
  isAuthenticated: boolean;
  token: string | null;
  whmcsUrl: string | null;
  error: string | null;
  loading: boolean;
  savedCredentials: SavedCredentials | null;

  setAuth: (token: string, whmcsUrl: string, saveCredentials?: SavedCredentials) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  getAuthHeader: () => { Authorization: string } | null;
  
  // Nueva: Cargar sesión guardada
  loadFromStorage: () => Promise<void>;
  clearStorage: () => void;
}

const STORAGE_KEYS = {
  token: 'colmena_auth_token',
  credentials: 'colmena_saved_credentials',
};

export const useAuthStore = create<UseAuthStoreState>()(
  immer((set, get) => ({
    isAuthenticated: false,
    token: null,
    whmcsUrl: null,
    error: null,
    loading: false,
    savedCredentials: null,

    // ========================================================================
    // SETAUTH - AHORA ASYNC
    // ========================================================================
    setAuth: async (token: string, whmcsUrl: string, saveCredentials?: SavedCredentials) => {
      // Guardar credenciales encriptadas si se proporcionan
      if (saveCredentials) {
        try {
          const encrypted = await encryptData(saveCredentials);
          localStorage.setItem(STORAGE_KEYS.credentials, encrypted);
        } catch (err) {
          console.error('Error saving credentials:', err);
        }
      }

      // Guardar token
      try {
        localStorage.setItem(STORAGE_KEYS.token, token);
      } catch (err) {
        console.error('Error saving token:', err);
      }

      // Actualizar estado
      set((state) => {
        state.isAuthenticated = true;
        state.token = token;
        state.whmcsUrl = whmcsUrl;
        state.error = null;

        if (saveCredentials) {
          state.savedCredentials = saveCredentials;
        }
      });
    },

    logout: () =>
      set((state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.whmcsUrl = null;
        state.error = null;
        state.savedCredentials = null;

        // Limpiar localStorage
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.credentials);
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error;
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.loading = loading;
      }),

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    getAuthHeader: () => {
      const token = get().token;
      return token ? { Authorization: `Bearer ${token}` } : null;
    },

    // ========================================================================
    // NUEVA FUNCIONALIDAD: Cargar sesión desde localStorage
    // ========================================================================

    loadFromStorage: async () => {
      set((state) => {
        state.loading = true;
      });

      try {
        // Primero intentar cargar JWT
        const savedToken = localStorage.getItem(STORAGE_KEYS.token);
        if (savedToken) {
          set((state) => {
            state.token = savedToken;
            state.isAuthenticated = true;
            state.loading = false;
          });
          return;
        }

        // Si no hay JWT, intentar auto-login con credenciales guardadas
        const encryptedCreds = localStorage.getItem(STORAGE_KEYS.credentials);
        if (encryptedCreds) {
          try {
            const savedCreds = await decryptData(encryptedCreds) as SavedCredentials;

            set((state) => {
              state.savedCredentials = savedCreds;
              state.whmcsUrl = savedCreds.whmcsUrl;
            });

            // Hacer auto-login
            const response = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                whmcsUrl: normalizeWhmcsUrl(savedCreds.whmcsUrl),
                identifier: savedCreds.identifier,
                secret: savedCreds.secret,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              set((state) => {
                state.token = data.token;
                state.isAuthenticated = true;
                state.whmcsUrl = savedCreds.whmcsUrl;
                state.loading = false;
              });
              localStorage.setItem(STORAGE_KEYS.token, data.token);
            } else {
              // Si falla auto-login, limpiar credenciales guardadas
              set((state) => {
                state.loading = false;
              });
              localStorage.removeItem(STORAGE_KEYS.credentials);
              localStorage.removeItem(STORAGE_KEYS.token);
            }
          } catch (decryptError) {
            console.error('Error decrypting credentials:', decryptError);
            set((state) => {
              state.loading = false;
            });
            localStorage.removeItem(STORAGE_KEYS.credentials);
          }
        } else {
          // No hay JWT ni credenciales guardadas
          set((state) => {
            state.loading = false;
          });
        }
      } catch (error) {
        console.error('Error loading from storage:', error);
        set((state) => {
          state.loading = false;
        });
      }
    },

    clearStorage: () => {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.credentials);
      set((state) => {
        state.token = null;
        state.savedCredentials = null;
        state.isAuthenticated = false;
      });
    },
  }))
);

// ============================================================================
// CONDOMINIO STORE
// ============================================================================

interface UseCondoStoreState {
  selectedCondominio: Condominio | null;
  condominios: Condominio[];
  loading: boolean;
  error: string | null;

  setSelectedCondominio: (condominio: Condominio | null) => void;
  setCondominios: (condominios: Condominio[]) => void;
  addCondominio: (condominio: Condominio) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCondoStore = create<UseCondoStoreState>()(
  immer((set) => ({
    selectedCondominio: null,
    condominios: [],
    loading: false,
    error: null,

    setSelectedCondominio: (condominio: Condominio | null) =>
      set((state) => {
        state.selectedCondominio = condominio;
      }),

    setCondominios: (condominios: Condominio[]) =>
      set((state) => {
        state.condominios = condominios;
      }),

    addCondominio: (condominio: Condominio) =>
      set((state) => {
        if (!state.condominios.find((c) => c.id === condominio.id)) {
          state.condominios.push(condominio);
        }
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.loading = loading;
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error;
      }),

    clearError: () =>
      set((state) => {
        state.error = null;
      }),
  }))
);

// ============================================================================
// CONDOMINIOS (RESIDENTES) STORE
// ============================================================================

interface UseCondominiosStoreState {
  condominios: Condominimos[];
  selectedCondominios: CondominoDetalle | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterStatus: string;

  setCondominios: (condominios: Condominimos[]) => void;
  setSelectedCondominios: (condominios: CondominoDetalle | null) => void;
  addCondominios: (condominios: Condominimos) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string) => void;
  clearError: () => void;
  clear: () => void;
  getFiltered: () => Condominimos[];
}

export const useCondominiosStore = create<UseCondominiosStoreState>()(
  immer((set, get) => ({
    condominios: [],
    selectedCondominios: null,
    loading: false,
    error: null,
    searchQuery: '',
    filterStatus: 'Todos',

    setCondominios: (condominios: Condominimos[]) =>
      set((state) => {
        state.condominios = condominios;
      }),

    setSelectedCondominios: (condominios: CondominoDetalle | null) =>
      set((state) => {
        state.selectedCondominios = condominios;
      }),

    addCondominios: (condominios: Condominimos) =>
      set((state) => {
        if (!state.condominios.find((c) => c.id === condominios.id)) {
          state.condominios.push(condominios);
        }
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.loading = loading;
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error;
      }),

    setSearchQuery: (query: string) =>
      set((state) => {
        state.searchQuery = query;
      }),

    setFilterStatus: (status: string) =>
      set((state) => {
        state.filterStatus = status;
      }),

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    clear: () =>
      set((state) => {
        state.condominios = [];
        state.selectedCondominios = null;
        state.searchQuery = '';
        state.filterStatus = 'Todos';
        state.error = null;
      }),

    getFiltered: () => {
      const state = get();
      let filtered = [...state.condominios];

      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            `${c.firstname} ${c.lastname}`.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query)
        );
      }

      if (state.filterStatus !== 'Todos') {
        filtered = filtered.filter((c) => c.status === state.filterStatus);
      }

      return filtered;
    },
  }))
);

// ============================================================================
// INVOICES STORE
// ============================================================================

interface UseInvoicesStoreState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
  filterStatus: string;

  setInvoices: (invoices: Invoice[]) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  addInvoice: (invoice: Invoice) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilterStatus: (status: string) => void;
  clearError: () => void;
  clear: () => void;
  getFiltered: () => Invoice[];
  getPendingTotal: () => number;
}

export const useInvoicesStore = create<UseInvoicesStoreState>()(
  immer((set, get) => ({
    invoices: [],
    selectedInvoice: null,
    loading: false,
    error: null,
    filterStatus: 'Todas',

    setInvoices: (invoices: Invoice[]) =>
      set((state) => {
        state.invoices = invoices;
      }),

    setSelectedInvoice: (invoice: Invoice | null) =>
      set((state) => {
        state.selectedInvoice = invoice;
      }),

    addInvoice: (invoice: Invoice) =>
      set((state) => {
        if (!state.invoices.find((i) => i.id === invoice.id)) {
          state.invoices.push(invoice);
        }
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.loading = loading;
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error;
      }),

    setFilterStatus: (status: string) =>
      set((state) => {
        state.filterStatus = status;
      }),

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    clear: () =>
      set((state) => {
        state.invoices = [];
        state.selectedInvoice = null;
        state.filterStatus = 'Todas';
        state.error = null;
      }),

    getFiltered: () => {
      const state = get();

      if (state.filterStatus === 'Todas') {
        return state.invoices;
      }

      return state.invoices.filter((inv) => inv.status === state.filterStatus);
    },

    getPendingTotal: () => {
      const state = get();
      return state.invoices
        .filter((inv) => inv.status === 'Unpaid' || inv.status === 'Overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    },
  }))
);

// ============================================================================
// COMBINED STORE (OPCIONAL)
// ============================================================================

interface UseCombinedStoreState {
  auth: ReturnType<typeof useAuthStore.getState>;
  condo: ReturnType<typeof useCondoStore.getState>;
  condominios: ReturnType<typeof useCondominiosStore.getState>;
  invoices: ReturnType<typeof useInvoicesStore.getState>;
}

export function useCombinedStore(): UseCombinedStoreState {
  return {
    auth: useAuthStore.getState(),
    condo: useCondoStore.getState(),
    condominios: useCondominiosStore.getState(),
    invoices: useInvoicesStore.getState(),
  };
}