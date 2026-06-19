import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// Secret para JWT - cambiar en producción a variable de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'colmena-secret-key-change-this';
const JWT_EXPIRES_IN = '24h';

interface LoginBody {
  whmcsUrl: string;
  identifier: string;
  secret: string;
}

interface JwtPayload {
  whmcsUrl: string;
  identifier: string;
  secret: string;
  iat: number;
  exp: number;
}

/**
 * POST /api/auth
 * Autentica con WHMCS y devuelve JWT token
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { whmcsUrl, identifier, secret } = req.body as LoginBody;

    // Validar campos
    if (!whmcsUrl || !identifier || !secret) {
      return res.status(400).json({
        error: 'Missing required fields: whmcsUrl, identifier, secret',
      });
    }

    // Normalizar URL
    let normalizedUrl = whmcsUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    // Validar credenciales con WHMCS
    const isValid = await validateWhmcsCredentials(normalizedUrl, identifier, secret);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid WHMCS credentials',
      });
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        whmcsUrl: normalizedUrl,
        identifier: identifier.trim(),
        secret: secret.trim(),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Devolver token (credenciales WHMCS NO se envían al frontend)
    return res.status(200).json({
      token,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Valida credenciales con WHMCS
 * Intenta llamar a GetClientGroups
 */
async function validateWhmcsCredentials(
  whmcsUrl: string,
  identifier: string,
  secret: string
): Promise<boolean> {
  try {
    const data = new URLSearchParams();
    data.append('action', 'GetClientGroups');
    data.append('identifier', identifier);
    data.append('secret', secret);
    data.append('responsetype', 'json');

    const response = await fetch(`${whmcsUrl}/includes/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    });

    if (!response.ok) {
      console.error(`WHMCS validation failed: ${response.status}`);
      return false;
    }

    const result = await response.json();
    return result.result === 'success';
  } catch (error) {
    console.error('WHMCS validation error:', error);
    return false;
  }
}