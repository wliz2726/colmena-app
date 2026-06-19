/**
 * Utilidades de validación para credenciales WHMCS
 * SIN localStorage, SIN encriptación
 */

// ============================================================================
// VALIDACIÓN DE URLs
// ============================================================================

/**
 * Normaliza URL de WHMCS (agrega https:// si no tiene, elimina trailing slash)
 */
export function normalizeWhmcsUrl(url: string): string {
  let normalized = url.trim();

  // Agregar https:// si no tiene protocolo
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  // Eliminar trailing slash
  normalized = normalized.replace(/\/$/, '');

  return normalized;
}

/**
 * Valida que la URL de WHMCS sea válida
 */
export function isValidWhmcsUrl(url: string): boolean {
  try {
    const urlObj = new URL(normalizeWhmcsUrl(url));
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
}

// ============================================================================
// VALIDACIÓN DE CREDENCIALES
// ============================================================================

/**
 * Valida credenciales antes de intentar login
 */
export function validateLoginCredentials(
  whmcsUrl: string,
  identifier: string,
  secret: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!whmcsUrl.trim()) {
    errors.push('URL de WHMCS es requerida');
  } else if (!isValidWhmcsUrl(whmcsUrl)) {
    errors.push('URL de WHMCS no es válida');
  }

  if (!identifier.trim()) {
    errors.push('Identifier es requerido');
  }

  if (!secret.trim()) {
    errors.push('Secret es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}