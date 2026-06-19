/**
 * Utilidades de encriptación y validación para credenciales WHMCS
 * Usa AES-256 para proteger credenciales guardadas en localStorage
 */

// ============================================================================
// ENCRIPTACIÓN CON AES-256
// ============================================================================

// Generar una clave derivada de una semilla fija (para la app)
const ENCRYPTION_SEED = 'colmena_app_2026_secure_encryption_key';

/**
 * Genera una clave criptográfica a partir de una semilla usando PBKDF2
 */
async function deriveKey(seed: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);

  // Importar semilla como clave
  const baseKey = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derivar clave AES-256 usando PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('colmena_salt_v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encripta datos usando AES-256-GCM
 */
export async function encryptData(data: any): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    // Generar IV aleatorio
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derivar clave
    const key = await deriveKey(ENCRYPTION_SEED);

    // Encriptar
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext
    );

    // Combinar IV + ciphertext y convertir a Base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Error al encriptar credenciales');
  }
}

/**
 * Desencripta datos usando AES-256-GCM
 */
export async function decryptData(encrypted: string): Promise<any> {
  try {
    // Convertir de Base64
    const combined = new Uint8Array(
      atob(encrypted)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    // Extraer IV y ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // Derivar clave
    const key = await deriveKey(ENCRYPTION_SEED);

    // Desencriptar
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    // Convertir a JSON
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Error al desencriptar credenciales');
  }
}

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