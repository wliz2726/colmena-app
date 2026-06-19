/**
 * Types para Colmena App v1 — CORRECCIONES
 * Basados en estructura WHMCS real
 */

// ============================================================================
// AUTH — CORREGIDO
// ============================================================================



// ============================================================================
// CONDOMINIOS / CLIENT GROUPS
// ============================================================================

export interface ClientGroup {
  id: string | number;
  groupname: string;
  groupcolour: string;
  discountpercent: string;
  susptermexempt: string;
  separateinvoices: string;
}

export interface CondominioStats {
  totalUnits: number;
  totalPending: number;
  totalIncome: number;
  color: string;
}

export interface Condominio extends ClientGroup {
  stats?: CondominioStats;
}

// ============================================================================
// CONDÓMINOS / CLIENTS
// ============================================================================

export interface ClientCustomFields {
  torre?: string;
  apartamento?: string;
  [key: string]: string | undefined;
}

export interface Condominimos {
  id: string | number;
  userid: string | number;
  firstname: string;
  lastname: string;
  fullname?: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Inactive' | 'Closed';
  datecreated: string;
  groupid: string | number;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryname?: string;
  companyname?: string;  // ← AGREGADO
  credit: string;
  customfields?: ClientCustomFields | Record<string, string>;
}

export interface CondominoDetalle extends Condominimos {
  phonenumber?: string;
  tax_id?: string;
  taxexempt?: boolean;
  notes?: string;
  email_preferences?: {
    general: string;
    invoice: string;
    support: string;
    product: string;
    domain: string;
    affiliate: string;
  };
  stats?: {
    invoices_count: number;
    invoices_paid_count: number;
    invoices_unpaid_count: number;
  };
}

// ============================================================================
// INVOICES
// ============================================================================

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Draft' | 'Cancelled';

export interface InvoiceItem {
  id: string | number;
  description: string;
  amount: string;
  taxed: boolean;
}

export interface InvoiceTransaction {
  id: string | number;
  transid: string;
  amount: string;
  fee: string;
  date: string;
  gateway: string;
  type: 'payment' | 'refund';
}

export interface Invoice {
  id: string | number;
  userid: string | number;
  invoicenum: string;
  date: string;
  duedate: string;
  datepaid: string;
  status: InvoiceStatus;
  subtotal: string;
  tax: string;
  tax2?: string;
  total: string;
  credit: string;
  notes: string;
  paymentmethod: string;
  firstname?: string;
  lastname?: string;
  companyname?: string;
}

export interface InvoiceDetalle extends Invoice {
  items?: {
    item: InvoiceItem[];
  };
  transactions?: {
    transaction: InvoiceTransaction[];
  };
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface WhmcsApiResponse<T> {
  result: 'success' | 'error';
  totalresults?: number;
  startnumber?: number;
  numreturned?: number;
  error?: string;
  data?: T;
}

export interface GetClientGroupsResponse extends WhmcsApiResponse<any> {
  groups?: {
    group: ClientGroup[];
  };
}

export interface GetClientsResponse extends WhmcsApiResponse<any> {
  clients?: {
    client: Condominimos[];
  };
}

export interface GetClientsDetailsResponse extends WhmcsApiResponse<any> {
  client?: CondominoDetalle;
}

export interface GetInvoicesResponse extends WhmcsApiResponse<any> {
  invoices?: {
    invoice: Invoice[];
  };
}

export interface GetInvoiceResponse extends WhmcsApiResponse<any> {
  invoice?: InvoiceDetalle;
  invoiceid?: string | number;
  invoicenum?: string;
  userid?: string | number;
  date?: string;
  duedate?: string;
  datepaid?: string;
  status?: InvoiceStatus;
  subtotal?: string;
  tax?: string;
  total?: string;
  credit?: string;
  notes?: string;
  paymentmethod?: string;
  items?: {
    item: InvoiceItem[];
  };
  transactions?: {
    transaction: InvoiceTransaction[];
  };
}

// ============================================================================
// UI STATE
// ============================================================================

export interface DashboardStats {
  incomeToday: string;
  incomeThisMonth: string;
  pendingTotal: string;
  totalUnits: number;
}

export interface FilterOptions {
  status?: InvoiceStatus[];
  searchQuery?: string;
  condominioId?: string | number;
  clientId?: string | number;
}

// ============================================================================
// APP STATE
// ============================================================================

export interface AppState {
  auth: AuthState;
  selectedCondominio: Condominio | null;
  condominios: Condominio[];
  condominios_list: Condominimos[];
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

// ============================================================================
// TIPOS PARA TICKETS - Agregar esto a tu types.ts
// ============================================================================

export interface Ticket {
  id: string;
  tid: string;  // Ticket ID visible (ej: #123456)
  did: string;  // Department ID
  deptname: string;  // Department name
  userid: string;
  title: string;
  status: 'Open' | 'Answered' | 'Customer-Reply' | 'On Hold' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  name: string;  // Cliente/Condómino
  email: string;
  datecreated: string;  // Fecha creación (YYYY-MM-DD HH:MM:SS)
  lastreply: string;  // Última respuesta (YYYY-MM-DD HH:MM:SS o 0000-00-00)
  total: string;  // Cantidad de notas
}

export interface TicketDetail extends Ticket {
  department: string;
  subject: string;
  notes?: TicketNote[];
}

export interface TicketNote {
  id: string;
  ticketid: string;
  userid: string;
  name: string;
  email: string;
  message: string;
  datecreated: string;
  attachment?: {
    id: string;
    filename: string;
    type: string;
  }[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface TicketCounts {
  open: number;
  answered: number;
  onhold: number;
  closed: number;
}