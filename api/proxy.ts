import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'colmena-secret-key-change-this';

interface JwtPayload {
  whmcsUrl: string;
  identifier: string;
  secret: string;
}

/**
 * POST /api/proxy
 * Proxy seguro a WHMCS API
 * El frontend envía: { action, params, token }
 * El backend valida el JWT, extrae credenciales, y llama a WHMCS
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  // Permitir CORS desde el frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://app.colmena.do');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, params = {} } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Validar JWT
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Validar action
    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    // Llamar a WHMCS API
    const result = await callWhmcsApi(
      payload.whmcsUrl,
      payload.identifier,
      payload.secret,
      action,
      params
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Llama a WHMCS API con credenciales del backend
 * Las credenciales NUNCA se exponen al frontend
 */
async function callWhmcsApi(
  whmcsUrl: string,
  identifier: string,
  secret: string,
  action: string,
  params: Record<string, any>
): Promise<any> {
  try {
    const data = new URLSearchParams();
    data.append('action', action);
    data.append('identifier', identifier);
    data.append('secret', secret);
    data.append('accesskey', 'colmena_api_key_secure_2026_vercel_access');
    data.append('responsetype', 'json');

    // Agregar parámetros adicionales
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    }

    const response = await fetch(`${whmcsUrl}/includes/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    });

    if (!response.ok) {
      throw new Error(`WHMCS API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('WHMCS API call failed:', error);
    throw error;
  }
}