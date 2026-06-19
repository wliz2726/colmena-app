/**
 * whmcsApi.ts - VERSIÓN SEGURA
 * Ahora usa /api/proxy en lugar de llamar directo a WHMCS
 * Las credenciales se quedan en el backend (en el JWT)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GetClientGroupsResponse,
  GetClientsResponse,
  GetClientsDetailsResponse,
  GetInvoicesResponse,
  GetInvoiceResponse,
  InvoiceStatus,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface WhmcsApiConfig {
  token: string;
  baseUrl?: string;
}

export interface WhmcsApiError {
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: Error;
}

// ============================================================================
// CLASS
// ============================================================================

export class WhmcsApi {
  private axiosInstance: AxiosInstance;
  private token: string;
  private baseUrl: string;

  constructor(config: WhmcsApiConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || '';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
    });

    // Interceptor para errores
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('WHMCS Proxy Error:', error);
        throw this.handleError(error);
      }
    );
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async request<T>(
    action: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>('/api/proxy', {
        action,
        params,
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): WhmcsApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Error 401 = Token expirado
      if (axiosError.response?.status === 401) {
        return {
          message: 'Sesión expirada. Por favor, ingresa de nuevo.',
          code: 'TOKEN_EXPIRED',
          statusCode: 401,
          originalError: error,
        };
      }

      // Error de respuesta del servidor
      if (axiosError.response) {
        const responseData = axiosError.response.data as any;
        return {
          message:
            responseData?.error ||
            responseData?.message ||
            'Error en la solicitud a WHMCS',
          code: 'API_ERROR',
          statusCode: axiosError.response.status,
          originalError: error,
        };
      }

      // Error de conexión
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ENOTFOUND') {
        return {
          message: 'No se puede conectar al servidor. Verifica la conexión.',
          code: 'CONNECTION_ERROR',
          originalError: error,
        };
      }

      // Timeout
      if (axiosError.code === 'ECONNREFUSED') {
        return {
          message: 'Conexión rechazada. El servidor no está disponible.',
          code: 'CONNECTION_REFUSED',
          originalError: error,
        };
      }

      return {
        message: axiosError.message || 'Error desconocido',
        code: 'NETWORK_ERROR',
        originalError: error,
      };
    }

    return {
      message: error instanceof Error ? error.message : 'Error desconocido',
      code: 'UNKNOWN_ERROR',
      originalError: error instanceof Error ? error : undefined,
    };
  }

  // ========================================================================
  // PUBLIC METHODS - CLIENT GROUPS
  // ========================================================================

  async getClientGroups(): Promise<GetClientGroupsResponse> {
    return this.request<GetClientGroupsResponse>('GetClientGroups');
  }

  // ========================================================================
  // PUBLIC METHODS - CLIENTS (CONDÓMINOS)
  // ========================================================================

  async getClients(params?: {
    search?: string;
    groupid?: number | string;
    status?: string;
    sortby?: string;
    orderby?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetClientsResponse> {
    return this.request<GetClientsResponse>('GetClients', params);
  }

  async getClientsDetails(clientid: number | string): Promise<GetClientsDetailsResponse> {
    return this.request<GetClientsDetailsResponse>('GetClientsDetails', {
      clientid,
      stats: true,
    });
  }

  // ========================================================================
  // PUBLIC METHODS - INVOICES
  // ========================================================================

  async getInvoices(params?: {
    userid?: number | string;
    status?: InvoiceStatus;
    invoiceid?: number | string;
    search?: string;
    sortby?: string;
    orderby?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetInvoicesResponse> {
    return this.request<GetInvoicesResponse>('GetInvoices', params);
  }

  async getInvoice(invoiceid: number | string): Promise<GetInvoiceResponse> {
    return this.request<GetInvoiceResponse>('GetInvoice', { invoiceid });
  }

  // ========================================================================
  // PUBLIC METHODS - UTILITY
  // ========================================================================

  async validateCredentials(): Promise<boolean> {
    try {
      await this.getClientGroups();
      return true;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  async getDashboardStats(): Promise<{
    totalClients: number;
    totalInvoices: number;
    totalPending: number;
    totalPaid: number;
  }> {
    try {
      const allInvoices = await this.getInvoices({
        limit: 100,
      });

      const paid = allInvoices.invoices?.invoice.filter(
        (inv) => inv.status === 'Paid'
      ) || [];
      const unpaid = allInvoices.invoices?.invoice.filter(
        (inv) => inv.status === 'Unpaid' || inv.status === 'Overdue'
      ) || [];

      const totalPaidAmount = paid.reduce(
        (sum, inv) => sum + parseFloat(inv.total || '0'),
        0
      );
      const totalPendingAmount = unpaid.reduce(
        (sum, inv) => sum + parseFloat(inv.total || '0'),
        0
      );

      const allClients = await this.getClients({ limit: 1000 });

      return {
        totalClients: allClients.totalresults || 0,
        totalInvoices: allInvoices.totalresults || 0,
        totalPending: Math.round(totalPendingAmount * 100) / 100,
        totalPaid: Math.round(totalPaidAmount * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalClients: 0,
        totalInvoices: 0,
        totalPending: 0,
        totalPaid: 0,
      };
    }
  }

  async searchCondominios(
    groupid: number | string,
    query?: string
  ): Promise<GetClientsResponse> {
    return this.getClients({
      groupid,
      search: query,
      limit: 100,
    });
  }

  async getClientInvoices(
    userid: number | string,
    status?: InvoiceStatus
  ): Promise<GetInvoicesResponse> {
    return this.getInvoices({
      userid,
      status,
      limit: 100,
    });
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createWhmcsApi(config: WhmcsApiConfig): WhmcsApi {
  return new WhmcsApi(config);
}

let instance: WhmcsApi | null = null;

export function initializeWhmcsApi(config: WhmcsApiConfig): WhmcsApi {
  instance = new WhmcsApi(config);
  return instance;
}

export function getWhmcsApi(): WhmcsApi {
  if (!instance) {
    throw new Error('WhmcsApi not initialized. Call initializeWhmcsApi first.');
  }
  return instance;
}