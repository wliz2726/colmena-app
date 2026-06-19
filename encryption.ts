/**
 * Servicios de encriptación y seguridad
 * AES-256 para credentials en localStorage
 */

import * as nacl from 'tweetnacl';
import { encode as encodeBase64, decode as decodeBase64 } from 'js-base64';

// ============================================================================
// CONSTANTS
// ============================================================================

const ENCRYPTION_KEY_STORAGE = 'colmena_encryption_key';
const CREDENTIALS_STORAGE = 'colmena_credentials';

// ============================================================================
// ENCRYPTION / DECRYPTION
// ============================================================================

/**
 * Genera o recupera una clave de encriptación única por dispositivo
 * Se guarda en localStorage y persiste entre sesiones
 */
function getOrCreateEncryptionKey(): Uint8Array {
  try {
    const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
    if (storedKey) {
      return decodeBase64(storedKey) as unknown as Uint8Array;
    }

    // Generar nueva clave si no existe
    const newKey = nacl.randomBytes(32); // 32 bytes = 256 bits
    localStorage.setItem(ENCRYPTION_KEY_STORAGE, encodeBase64(newKey));
    return newKey;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw new Error('Failed to initialize encryption key');
  }
}

/**
 * Encripta un string con AES-256 usando NaCl
 * Retorna base64 encoded box (nonce + ciphertext)
 */
export function encryptCredentials(plaintext: string): string {
  try {
    const key = getOrCreateEncryptionKey();
    const nonce = nacl.randomBytes(24);
    const message = new TextEncoder().encode(plaintext);

    const box = nacl.secretbox(message, nonce, key);
    const combined = new Uint8Array(nonce.length + box.length);
    combined.set(nonce);
    combined.set(box, nonce.length);

    return encodeBase64(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt credentials');
  }
}

/**
 * Desencripta un string AES-256 desde base64
 */
export function decryptCredentials(encrypted: string): string {
  try {
    const key = getOrCreateEncryptionKey();
    const combined = decodeBase64(encrypted) as unknown as Uint8Array;

    const nonce = combined.slice(0, 24);
    const ciphertext = combined.slice(24);

    const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt credentials');
  }
}

// ============================================================================
// CREDENTIALS STORAGE
// ============================================================================

export interface StoredCredentials {
  whmcsUrl: string;
  username: string;
  password: string;
  encryptedAt: number;
}

/**
 * Guarda credenciales encriptadas en localStorage
 */
export function storeCredentials(
  whmcsUrl: string,
  username: string,
  password: string
): void {
  try {
    const credentials: StoredCredentials = {
      whmcsUrl,
      username,
      password,
      encryptedAt: Date.now(),
    };

    const plaintext = JSON.stringify(credentials);
    const encrypted = encryptCredentials(plaintext);

    localStorage.setItem(CREDENTIALS_STORAGE, encrypted);
  } catch (error) {
    console.error('Error storing credentials:', error);
    throw new Error('Failed to store credentials securely');
  }
}

/**
 * Recupera credenciales desencriptadas desde localStorage
 */
export function retrieveCredentials(): StoredCredentials | null {
  try {
    const encrypted = localStorage.getItem(CREDENTIALS_STORAGE);
    if (!encrypted) {
      return null;
    }

    const plaintext = decryptCredentials(encrypted);
    return JSON.parse(plaintext) as StoredCredentials;
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    // Si falla, limpiar credentials corruptas
    clearCredentials();
    return null;
  }
}

/**
 * Elimina credenciales del almacenamiento (logout)
 */
export function clearCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIALS_STORAGE);
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
}

/**
 * Verifica si hay credenciales válidas guardadas
 */
export function hasStoredCredentials(): boolean {
  try {
    const encrypted = localStorage.getItem(CREDENTIALS_STORAGE);
    return !!encrypted;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// SECURITY UTILS
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

/**
 * Valida credenciales antes de intentar login
 */
export function validateLoginCredentials(
  whmcsUrl: string,
  username: string,
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!whmcsUrl.trim()) {
    errors.push('URL de WHMCS es requerida');
  } else if (!isValidWhmcsUrl(whmcsUrl)) {
    errors.push('URL de WHMCS no es válida');
  }

  if (!username.trim()) {
    errors.push('Usuario es requerido');
  } else if (username.trim().length < 3) {
    errors.push('Usuario debe tener al menos 3 caracteres');
  }

  if (!password.trim()) {
    errors.push('Contraseña es requerida');
  } else if (password.length < 4) {
    errors.push('Contraseña debe tener al menos 4 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Limpia toda la data sensible del navegador (logout total)
 */
export function wipeSensitiveData(): void {
  try {
    clearCredentials();
    // Limpiar otros items si es necesario
    localStorage.removeItem('colmena_selected_condo');
    sessionStorage.clear();
  } catch (error) {
    console.error('Error wiping sensitive data:', error);
  }
}
