/**
 * Custom hooks con React Query para Colmena App
 * Manejo de data fetching, caching, y sincronización con stores
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  GetClientGroupsResponse,
  GetClientsResponse,
  GetClientsDetailsResponse,
  GetInvoicesResponse,
  GetInvoiceResponse,
  ClientGroup,
  Condominimos,
  CondominoDetalle,
  Invoice,
  InvoiceDetalle,
} from './types';
import { WhmcsApi } from './whmcsApi';
import {
  useCondoStore,
  useCondominiosStore,
  useInvoicesStore,
} from './stores';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUERY_KEYS = {
  clientGroups: ['clientGroups'],
  clients: (groupid?: string | number) => ['clients', groupid] as const,
  clientDetails: (clientid: string | number) => ['clientDetails', clientid] as const,
  invoices: (userid?: string | number, status?: string) =>
    ['invoices', userid, status] as const,
  invoice: (invoiceid: string | number) => ['invoice', invoiceid] as const,
  dashboardStats: ['dashboardStats'],
};

// ============================================================================
// CLIENT GROUPS / CONDOMINIOS
// ============================================================================

/**
 * Hook para obtener lista de condominios (Client Groups)
 */
export function useClientGroups(
  api: WhmcsApi
): UseQueryResult<ClientGroup[], Error> {
  const { setCondominios, setLoading, setError } = useCondoStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.clientGroups,
    queryFn: async () => {
      try {
        const response = await api.getClientGroups();
        if (response.result !== 'success') {
          throw new Error(response.error || 'Error fetching client groups');
        }

        const groups = response.groups?.group || [];
        return groups;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
    retry: 2,
  });

  // Sincronizar con store
  useEffect(() => {
    setLoading(query.isPending);
  }, [query.isPending, setLoading]);

  useEffect(() => {
    if (query.isError) {
      setError(query.error?.message || 'Error obteniendo condominios');
    } else {
      setError(null);
    }
  }, [query.isError, query.error, setError]);

  useEffect(() => {
    if (query.data) {
      setCondominios(
        query.data.map((group) => ({
          ...group,
          stats: undefined, // Stats se calculan desde invoices
        }))
      );
    }
  }, [query.data, setCondominios]);

  return query;
}

// ============================================================================
// CLIENTS / CONDÓMINOS
// ============================================================================

/**
 * Hook para obtener lista de clientes en un condominio
 */
export function useClients(
  api: WhmcsApi,
  groupid: string | number | undefined,
  search?: string
): UseQueryResult<Condominimos[], Error> {
  const { setCondominios, setLoading, setError } = useCondominiosStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.clients(groupid),
    queryFn: async () => {
      if (!groupid) {
        throw new Error('Group ID is required');
      }

      try {
        const response = await api.getClients({
          groupid,
          search: search || undefined,
          limit: 100,
        });

        if (response.result !== 'success') {
          throw new Error(response.error || 'Error fetching clients');
        }

        return response.clients?.client || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!groupid, // Solo ejecutar si groupid existe
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Sincronizar con store
  useEffect(() => {
    setLoading(query.isPending);
  }, [query.isPending, setLoading]);

  useEffect(() => {
    if (query.isError) {
      setError(query.error?.message || 'Error obteniendo clientes');
    } else {
      setError(null);
    }
  }, [query.isError, query.error, setError]);

  useEffect(() => {
    if (query.data) {
      setCondominios(query.data);
    }
  }, [query.data, setCondominios]);

  return query;
}

/**
 * Hook para obtener detalles de un cliente específico
 */
export function useClientDetails(
  api: WhmcsApi,
  clientid: string | number | undefined
): UseQueryResult<CondominoDetalle, Error> {
  const { setSelectedCondominios } = useCondominiosStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.clientDetails(clientid!),
    queryFn: async () => {
      if (!clientid) {
        throw new Error('Client ID is required');
      }

      try {
        const response = await api.getClientsDetails(clientid);

        if (response.result !== 'success') {
          throw new Error(response.error || 'Error fetching client details');
        }

        return (response.client || {}) as CondominoDetalle;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!clientid,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  // Sincronizar con store
  useEffect(() => {
    if (query.data) {
      setSelectedCondominios(query.data);
    }
  }, [query.data, setSelectedCondominios]);

  return query;
}

// ============================================================================
// INVOICES
// ============================================================================

/**
 * Hook para obtener lista de invoices
 */
export function useInvoices(
  api: WhmcsApi,
  params?: {
    userid?: string | number;
    status?: string;
    limit?: number;
  }
): UseQueryResult<Invoice[], Error> {
  const { setInvoices, setLoading, setError } = useInvoicesStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.invoices(params?.userid, params?.status),
    queryFn: async () => {
      try {
        const response = await api.getInvoices({
          userid: params?.userid,
          status: (params?.status as any) || undefined,
          limit: params?.limit || 100,
        });

        if (response.result !== 'success') {
          throw new Error(response.error || 'Error fetching invoices');
        }

        return response.invoices?.invoice || [];
      } catch (error) {
        throw error;
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minuto
    gcTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Sincronizar con store
  useEffect(() => {
    setLoading(query.isPending);
  }, [query.isPending, setLoading]);

  useEffect(() => {
    if (query.isError) {
      setError(query.error?.message || 'Error obteniendo invoices');
    } else {
      setError(null);
    }
  }, [query.isError, query.error, setError]);

  useEffect(() => {
    if (query.data) {
      setInvoices(query.data);
    }
  }, [query.data, setInvoices]);

  return query;
}

/**
 * Hook para obtener detalles de una invoice específica
 */
export function useInvoiceDetails(
  api: WhmcsApi,
  invoiceid: string | number | undefined
): UseQueryResult<InvoiceDetalle, Error> {
  const { setSelectedInvoice } = useInvoicesStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.invoice(invoiceid!),
    queryFn: async () => {
      if (!invoiceid) {
        throw new Error('Invoice ID is required');
      }

      try {
        const response = await api.getInvoice(invoiceid);

        if (response.result !== 'success') {
          throw new Error(response.error || 'Error fetching invoice details');
        }

        // Construir objeto Invoice desde la respuesta
        const invoice: InvoiceDetalle = {
          id: response.invoiceid!,
          userid: response.userid!,
          invoicenum: response.invoicenum!,
          date: response.date!,
          duedate: response.duedate!,
          datepaid: response.datepaid!,
          status: response.status as any,
          subtotal: response.subtotal!,
          tax: response.tax!,
          total: response.total!,
          credit: response.credit!,
          notes: response.notes!,
          paymentmethod: response.paymentmethod!,
          items: response.items,
          transactions: response.transactions,
        };

        return invoice;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!invoiceid,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });

  // Sincronizar con store
  useEffect(() => {
    if (query.data) {
      setSelectedInvoice(query.data);
    }
  }, [query.data, setSelectedInvoice]);

  return query;
}

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Hook para obtener invoice de un cliente con detalles
 * Combina getInvoices + getInvoiceDetails
 */
export function useClientInvoices(
  api: WhmcsApi,
  clientid: string | number | undefined,
  status?: string
): UseQueryResult<Invoice[], Error> {
  return useInvoices(api, {
    userid: clientid,
    status,
  });
}

/**
 * Hook para obtener estadísticas del dashboard
 */
export function useDashboardStats(
  api: WhmcsApi
): UseQueryResult<
  {
    totalClients: number;
    totalInvoices: number;
    totalPending: number;
    totalPaid: number;
  },
  Error
> {
  const query = useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => api.getDashboardStats(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
  });

  return query;
}
