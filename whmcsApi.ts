/**
 * Servicio WHMCS API
 * Wrapper alrededor del endpoint /includes/api.php
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
  whmcsUrl: string;
  username: string;
  password: string;
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
  private config: WhmcsApiConfig;

  constructor(config: WhmcsApiConfig) {
    this.config = config;

    this.axiosInstance = axios.create({
      baseURL: config.whmcsUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Interceptor para errores
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('WHMCS API Error:', error);
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
      const data = new URLSearchParams();
      data.append('action', action);
      data.append('username', this.config.username);
      data.append('password', this.config.password);
      data.append('responsetype', 'json');

      // Agregar parámetros adicionales
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          data.append(key, String(value));
        }
      }

      const response = await this.axiosInstance.post<T>(
        '/includes/api.php',
        data
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): WhmcsApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

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
          message: 'No se puede conectar a WHMCS. Verifica la URL y la conexión.',
          code: 'CONNECTION_ERROR',
          originalError: error,
        };
      }

      // Timeout
      if (axiosError.code === 'ECONNREFUSED') {
        return {
          message: 'Conexión rechazada. Verifica que WHMCS esté disponible.',
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

  /**
   * Obtiene todos los grupos de clientes (condominios)
   * GET /api/client-groups
   */
  async getClientGroups(): Promise<GetClientGroupsResponse> {
    return this.request<GetClientGroupsResponse>('GetClientGroups');
  }

  // ========================================================================
  // PUBLIC METHODS - CLIENTS (CONDÓMINOS)
  // ========================================================================

  /**
   * Obtiene lista de clientes (condóminos)
   * Parámetros opcionales:
   * - search: buscar por nombre/email
   * - groupid: filtrar por grupo (condominio)
   * - status: filtrar por estado (Active, Suspended, Inactive, Closed)
   */
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

  /**
   * Obtiene detalles de un cliente específico
   * Incluye custom fields (torre, apartamento, etc.)
   */
  async getClientsDetails(clientid: number | string): Promise<GetClientsDetailsResponse> {
    return this.request<GetClientsDetailsResponse>('GetClientsDetails', {
      clientid,
      stats: true,
    });
  }

  // ========================================================================
  // PUBLIC METHODS - INVOICES
  // ========================================================================

  /**
   * Obtiene lista de invoices
   * Parámetros opcionales:
   * - userid: filtrar por cliente
   * - status: Paid, Unpaid, Overdue, Draft, Cancelled
   * - invoiceid: filtrar por ID de invoice
   * - search: buscar en numero de invoice
   */
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

  /**
   * Obtiene detalles completos de una invoice
   * Incluye items y transacciones
   */
  async getInvoice(invoiceid: number | string): Promise<GetInvoiceResponse> {
    return this.request<GetInvoiceResponse>('GetInvoice', { invoiceid });
  }

  // ========================================================================
  // PUBLIC METHODS - UTILITY
  // ========================================================================

  /**
   * Valida que las credenciales sean correctas
   * Intenta obtener grupos de clientes
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.getClientGroups();
      return response.result === 'success';
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas generales
   * (total clientes, invoices pendientes, etc.)
   */
  async getDashboardStats(): Promise<{
    totalClients: number;
    totalInvoices: number;
    totalPending: number;
    totalPaid: number;
  }> {
    try {
      // Obtener todos los invoices para estadísticas
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

      // Obtener todos los clientes
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

  /**
   * Busca clientes en un condominio específico
   */
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

  /**
   * Obtiene invoices de un cliente específico con filtros
   */
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

/**
 * Factory para crear instancia de WhmcsApi
 */
export function createWhmcsApi(config: WhmcsApiConfig): WhmcsApi {
  return new WhmcsApi(config);
}

/**
 * Singleton instance (opcional)
 */
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
