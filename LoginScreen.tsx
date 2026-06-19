import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validar campos
    const validation = validateLoginCredentials(whmcsUrl, username, password);
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
        username: username.trim(),
        password: password.trim(),
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

      // Guardar credenciales (automáticamente encriptadas)
      login({
        whmcsUrl: normalizedUrl,
        username: username.trim(),
        password: password.trim(),
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
        {/* HEADER */}
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-hexagon">
              <div className="logo-inner"></div>
            </div>
          </div>
          <h1 className="login-title">colmena®</h1>
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

          {/* INPUTS */}
          <div className="form-group">
            <label htmlFor="whmcs-url" className="form-label">
              URL de WHMCS
            </label>
            <input
              id="whmcs-url"
              type="url"
              placeholder="ej: https://whmcs.tudominio.com"
              value={whmcsUrl}
              onChange={(e) => setWhmcsUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              placeholder="Tu usuario de administrador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* SUBMIT */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
          >
            {loading ? 'Conectando...' : 'Conectar'}
          </Button>
        </form>

        {/* FOOTER */}
        <div className="login-footer">
          <p className="login-footer-text">
            Tus credenciales se guardan{' '}
            <span className="text-primary">encriptadas</span> en tu dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
}
