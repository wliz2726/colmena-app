/**
 * Zustand stores para Colmena App
 * Manejo de estado global - SIN localStorage
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Condominio,
  Condominimos,
  Invoice,
  CondominoDetalle,
} from './types';

// ============================================================================
// AUTH STORE - Credenciales en MEMORIA solamente
// ============================================================================

interface UseAuthStoreState {
  isAuthenticated: boolean;
  token: string | null;
  whmcsUrl: string | null;
  error: string | null;
  loading: boolean;

  setAuth: (token: string, whmcsUrl: string) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  getAuthHeader: () => { Authorization: string } | null;
}

export const useAuthStore = create<UseAuthStoreState>()(
  immer((set, get) => ({
    isAuthenticated: false,
    token: null,
    whmcsUrl: null,
    error: null,
    loading: false,

    setAuth: (token: string, whmcsUrl: string) =>
      set((state) => {
        state.isAuthenticated = true;
        state.token = token;
        state.whmcsUrl = whmcsUrl;
        state.error = null;
      }),

    logout: () =>
      set((state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.whmcsUrl = null;
        state.error = null;
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