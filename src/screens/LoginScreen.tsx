import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Logo como SVG Data URL
const LogoMain = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwMjE1MkYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db2xtZW5hPC90ZXh0Pjwvc3ZnPg==';
const LogoFooter = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjAwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+V2Vic3RvcmUgRG9taW5pY2FuYTwvdGV4dD48L3N2Zz4=';
import { useAuthStore } from '../stores';
import { validateLoginCredentials, normalizeWhmcsUrl } from '../encryption';
import { WhmcsApi } from '../whmcsApi';
import { Button } from '../components/Button';
import { ErrorAlert } from '../components/ErrorAlert';
import './LoginScreen.css';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login, error, setError, loading, setLoading } = useAuthStore();

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

      // Intentar conectar a WHMCS
      const api = new WhmcsApi({
        whmcsUrl: normalizedUrl,
        identifier: identifier.trim(),
        secret: secret.trim(),
      });

      // Validar credenciales
      const isValid = await api.validateCredentials();
      if (!isValid) {
        setLocalError(
          'Credenciales incorrectas o WHMCS no disponible.\nVerifica URL, usuario y contraseña.'
        );
        setLoading(false);
        return;
      }

      // Guardar credenciales en MEMORIA solamente (sin encriptación)
      login({
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
            Tus credenciales se guardan en la sesión del navegador.
          </p>
        </div>
      </div>
    </div>
  );
}