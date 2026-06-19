// src/hooks.ts - ORIGINAL
import { useQuery, UseQueryResult, QueryClient } from '@tanstack/react-query';
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

const QUERY_KEYS = {
  clientGroups: ['clientGroups'],
  clients: (groupid?: string | number) => ['clients', groupid] as const,
  clientDetails: (clientid: string | number) => ['clientDetails', clientid] as const,
  invoices: (userid?: string | number, status?: string) => ['invoices', userid, status] as const,
  invoice: (invoiceid: string | number) => ['invoice', invoiceid] as const,
  dashboardStats: ['dashboardStats'],
};

export function useClientGroups(api: WhmcsApi): UseQueryResult<ClientGroup[], Error> {
  const { setCondominios, setLoading, setError } = useCondoStore();
  const query = useQuery({
    queryKey: QUERY_KEYS.clientGroups,
    queryFn: async () => {
      const response = await api.getClientGroups();
      if (response.result !== 'success') throw new Error(response.error || 'Error');
      return response.groups?.group || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
  useEffect(() => setLoading(query.isPending), [query.isPending, setLoading]);
  useEffect(() => {
    if (query.isError) setError(query.error?.message || 'Error');
    else setError(null);
  }, [query.isError, query.error, setError]);
  useEffect(() => {
    if (query.data) setCondominios(query.data.map(g => ({ ...g, stats: undefined })));
  }, [query.data, setCondominios]);
  return query;
}

export function useClients(api: WhmcsApi, groupid: string | number | undefined, search?: string): UseQueryResult<Condominimos[], Error> {
  const { setCondominios, setLoading, setError } = useCondominiosStore();
  const query = useQuery({
    queryKey: QUERY_KEYS.clients(groupid),
    queryFn: async () => {
      const response = await api.getClients({ groupid: groupid || undefined, search: search || undefined, limit: 100 });
      if (response.result !== 'success') throw new Error(response.error || 'Error');
      return response.clients?.client || [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    retry: 2,
  });
  useEffect(() => setLoading(query.isPending), [query.isPending, setLoading]);
  useEffect(() => {
    if (query.isError) setError(query.error?.message || 'Error');
    else setError(null);
  }, [query.isError, query.error, setError]);
  useEffect(() => {
    if (query.data) setCondominios(query.data);
  }, [query.data, setCondominios]);
  return query;
}

export function useClientDetails(api: WhmcsApi, clientid: string | number | undefined): UseQueryResult<CondominoDetalle, Error> {
  const { setSelectedCondominios } = useCondominiosStore();
  const query = useQuery({
    queryKey: QUERY_KEYS.clientDetails(clientid!),
    queryFn: async () => {
      if (!clientid) throw new Error('Client ID required');
      const response = await api.getClientsDetails(clientid);
      if (response.result !== 'success') throw new Error(response.error || 'Error');
      return (response.client || {}) as CondominoDetalle;
    },
    enabled: !!clientid,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
  useEffect(() => {
    if (query.data) setSelectedCondominios(query.data);
  }, [query.data, setSelectedCondominios]);
  return query;
}

export function useInvoices(api: WhmcsApi, params?: { userid?: string | number; status?: string; limit?: number }): UseQueryResult<Invoice[], Error> {
  const { setInvoices, setLoading, setError } = useInvoicesStore();
  const query = useQuery({
    queryKey: QUERY_KEYS.invoices(params?.userid, params?.status),
    queryFn: async () => {
      const response = await api.getInvoices({ userid: params?.userid, status: (params?.status as any) || undefined, limit: params?.limit || 100 });
      if (response.result !== 'success') throw new Error(response.error || 'Error');
      return response.invoices?.invoice || [];
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    retry: 2,
  });
  useEffect(() => setLoading(query.isPending), [query.isPending, setLoading]);
  useEffect(() => {
    if (query.isError) setError(query.error?.message || 'Error');
    else setError(null);
  }, [query.isError, query.error, setError]);
  useEffect(() => {
    if (query.data) setInvoices(query.data);
  }, [query.data, setInvoices]);
  return query;
}

export function useInvoiceDetails(api: WhmcsApi, invoiceid: string | number | undefined): UseQueryResult<InvoiceDetalle, Error> {
  const { setSelectedInvoice } = useInvoicesStore();
  const query = useQuery({
    queryKey: QUERY_KEYS.invoice(invoiceid!),
    queryFn: async () => {
      if (!invoiceid) throw new Error('Invoice ID required');
      const response = await api.getInvoice(invoiceid);
      if (response.result !== 'success') throw new Error(response.error || 'Error');
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
    },
    enabled: !!invoiceid,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
  useEffect(() => {
    if (query.data) setSelectedInvoice(query.data);
  }, [query.data, setSelectedInvoice]);
  return query;
}

export function useClientInvoices(api: WhmcsApi, clientid: string | number | undefined, status?: string): UseQueryResult<Invoice[], Error> {
  return useInvoices(api, { userid: clientid, status });
}

export function useDashboardStats(api: WhmcsApi): UseQueryResult<{ totalClients: number; totalInvoices: number; totalPending: number; totalPaid: number }, Error> {
  const query = useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => api.getDashboardStats(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
  });
  return query;
}