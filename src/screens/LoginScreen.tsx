import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { validateLoginCredentials, normalizeWhmcsUrl } from '../encryption';
import { Button } from '../components/Button';
import { ErrorAlert } from '../components/ErrorAlert';
import './LoginScreen.css';

export function LoginScreen() {
  const navigate = useNavigate();
  const { setAuth, error, setError, loading, setLoading } = useAuthStore();

  const [whmcsUrl, setWhmcsUrl] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validar campos
    const validation = validateLoginCredentials(whmcsUrl, identifier, secret);
    if (!validation.valid) {
      setLocalError(validation.errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const normalizedUrl = normalizeWhmcsUrl(whmcsUrl);

      // Llamar a /api/auth en el backend
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whmcsUrl: normalizedUrl,
          identifier: identifier.trim(),
          secret: secret.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setLocalError(
          errorData.error ||
            'Credenciales incorrectas o WHMCS no disponible.'
        );
        setLoading(false);
        return;
      }

      // Obtener JWT token del backend
      const data = await response.json();
      const { token } = data;

      if (!token) {
        setLocalError('Error al obtener token de autenticación.');
        setLoading(false);
        return;
      }

      // Guardar token Y credenciales encriptadas en el store
      // Las credenciales se guardan para auto-login en futuras sesiones
      setAuth(token, normalizedUrl, {
        whmcsUrl: normalizedUrl,
        identifier: identifier.trim(),
        secret: secret.trim(),
      });

      // Navegar a dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setLocalError(
        err.message ||
          'Error de conexión. Verifica la URL y que WHMCS esté disponible.'
      );
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* HEADER CON LOGOS */}
        <div className="login-header">
          <div className="login-logo" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <img 
              src="/logo-main.png" 
              alt="Colmena Logo" 
              style={{ 
                width: '180px', 
                height: 'auto',
                marginBottom: '32px',
                marginTop: '24px'
              }}
            />
          </div>
          <p className="login-subtitle">Reinventando la vida comunitaria</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="login-form">
          {/* ERROR ALERT */}
          {displayError && (
            <ErrorAlert
              message={displayError}
              onDismiss={() => {
                setLocalError('');
                setError(null);
              }}
            />
          )}

          {/* WHMCS URL */}
          <div className="form-group">
            <label htmlFor="whmcs-url" className="form-label">
              URL de WHMCS
            </label>
            <input
              id="whmcs-url"
              type="text"
              placeholder="https://tu-dominio.com"
              value={whmcsUrl}
              onChange={(e) => setWhmcsUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* IDENTIFIER */}
          <div className="form-group">
            <label htmlFor="identifier" className="form-label">
              Identifier
            </label>
            <input
              id="identifier"
              type="text"
              placeholder="Tu API Identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* SECRET */}
          <div className="form-group">
            <label htmlFor="secret" className="form-label">
              Secret
            </label>
            <input
              id="secret"
              type="password"
              placeholder="Tu API Secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* SUBMIT */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? 'Conectando...' : 'Conectar'}
          </Button>
        </form>

        {/* FOOTER */}
        <div className="login-footer">
          <p className="login-footer-text">
            Las credenciales se validan en el servidor de forma segura y se guardan encriptadas.
          </p>
        </div>
      </div>
    </div>
  );
}