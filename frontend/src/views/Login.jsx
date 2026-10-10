import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaUmbrellaBeach } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../styles/Login.css';
import { TALENTO_HUMANO_USERS } from '../constants/talentohumano';

const API_URL = 'http://127.0.0.1:5000';
const UNES_CACHE_TTL_MS = 5 * 60 * 1000;
const DEBOUNCE_MS = 350;
const REQUEST_TIMEOUT_MS = 5000;

const unesCache = new Map();
const pendingRequests = new Map();

const isValidFormat = (value) => /^\d{3}$/.test(value);

const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

const checkUnesExists = async (unesValue) => {
  const key = String(unesValue);

  const cached = unesCache.get(key);
  if (cached && Date.now() - cached.ts < UNES_CACHE_TTL_MS) {
    return cached.value;
  }

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const request = (async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/pbi-colaborador-vacaciones?unes=${encodeURIComponent(key)}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const exists = !!data?.ok && data?.exists === true;
      unesCache.set(key, { value: exists, ts: Date.now() });
      return exists;
    } catch (error) {
      console.error('Error validando UNES:', error);
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, request);
  return request;
};

/**
 * Busca un usuario en la base de datos por correo.
 * Retorna el usuario encontrado o null.
 */
const fetchUserByEmail = async (emailValue) => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/get_usuarios`);
    if (!response.ok) {
      return null;
    }
    const json = await response.json();
    if (!json?.ok || !Array.isArray(json?.data)) {
      return null;
    }
    return json.data.find((u) => (u.email || '').toLowerCase() === emailValue.toLowerCase()) || null;
  } catch (error) {
    console.error('Error consultando usuarios:', error);
    return null;
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [unes, setUnes] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Usuarios de Talento Humano (unificado con la constante central)
  const talentohumanoHardcoded = TALENTO_HUMANO_USERS;

  const handleUnesChange = (e) => {
    const value = e.target.value;

    if (value === '') {
      setUnes(value);
      return;
    }

    if (!/^\d*$/.test(value)) {
      Swal.fire({
        icon: 'warning',
        title: 'UNES inválida',
        text: 'La UNES solo debe contener números.',
        confirmButtonColor: '#003366',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    if (value.length > 3) {
      Swal.fire({
        icon: 'error',
        title: 'UNES incorrecta',
        text: 'La UNES debe tener exactamente 3 dígitos. Verifique e intente nuevamente.',
        confirmButtonColor: '#003366',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    setUnes(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (email === '') {
      Swal.fire({
        icon: 'error',
        title: 'Correo vacío',
        text: 'Por favor, ingrese su correo corporativo.',
        confirmButtonColor: '#003366'
      });
      return;
    }

    // Talento Humano: acceso sin UNES ni contraseña
    const isTalentoHumanoEmail = talentohumanoHardcoded.some(th => th.correo.toLowerCase() === email.toLowerCase());
    if (isTalentoHumanoEmail) {
      setSubmitting(true);
      Swal.fire({
        title: 'Autenticando...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });
      const nombreTh = talentohumanoHardcoded.find(th => th.correo.toLowerCase() === email.toLowerCase())?.nombre || email;
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Ingreso exitoso, ${nombreTh}`,
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        localStorage.setItem('userUnes', '');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isTalentoHumano', 'true');
        navigate('/home');
      }).finally(() => setSubmitting(false));
      return;
    }

    if (!isValidFormat(unes)) {
      Swal.fire({
        icon: 'warning',
        title: 'UNES requerida',
        text: 'La UNES debe ser de exactamente 3 dígitos.',
        confirmButtonColor: '#003366'
      });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setSubmitting(true);
    Swal.fire({
      title: 'Autenticando...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      // 1. Validar que la UNES exista en BD_Integraciones (PBI_Colaborador_Vacaciones)
      const exists = await new Promise((resolve) => {
        debounceRef.current = setTimeout(async () => {
          const result = await checkUnesExists(unes);
          resolve(result);
        }, DEBOUNCE_MS);
      });

      if (exists === null) {
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo validar la UNES con el servidor. Intente nuevamente.',
          confirmButtonColor: '#003366'
        });
        return;
      }

      if (!exists) {
        Swal.fire({
          icon: 'error',
          title: 'UNES incorrecta',
          text: `La UNES "${unes}" no está registrada en el sistema. Verifique e intente nuevamente.`,
          confirmButtonColor: '#003366'
        });
        return;
      }

      // 2. Consultar usuarios de la tabla users para obtener cargo y credenciales
      const user = await fetchUserByEmail(email);

      if (!user) {
        Swal.fire({
          icon: 'error',
          title: 'Usuario no encontrado',
          text: `No existe un usuario registrado con el correo "${email}".`,
          confirmButtonColor: '#003366'
        });
        return;
      }

      if (!user.Activo) {
        Swal.fire({
          icon: 'error',
          title: 'Usuario inactivo',
          text: 'Su usuario se encuentra inactivo. Contacte al administrador.',
          confirmButtonColor: '#003366'
        });
        return;
      }

      // 3. Determinar si es Talento Humano: por cargo en BD O por lista hardcodeada
      const cargo = (user.cargo || '').toLowerCase();
      const isTalentoHumanoByCargo = cargo.includes('talento humano');
      const isTalentoHumanoHardcoded = talentohumanoHardcoded.some(th => th.correo.toLowerCase() === email.toLowerCase());
      const isTalentoHumano = isTalentoHumanoByCargo || isTalentoHumanoHardcoded;

      // 4. Validar que la UNES ingresada coincida con la UNES del usuario en BD
      const userUnes = user.unes ? String(user.unes) : '';
      const unesMatch = userUnes.endsWith(unes) || userUnes === unes;

      if (!unesMatch) {
        Swal.fire({
          icon: 'error',
          title: 'UNES incorrecta',
          text: `La UNES ingresada no corresponde al usuario "${email}". UNES asignada: ${userUnes || 'N/A'}`,
          confirmButtonColor: '#003366'
        });
        return;
      }

      // 5. Talento Humano accede con UNES válida contra PBI (sin contraseña).
      if (isTalentoHumano) {
        const nombreTh = talentohumanoHardcoded.find(
          th => th.correo.toLowerCase() === email.toLowerCase()
        )?.nombre || user.name || email;

        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: `Ingreso exitoso, ${nombreTh}`,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          localStorage.setItem('userUnes', unes);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('isTalentoHumano', 'true');
          navigate('/home');
        });
        return;
      }

      // 6. Usuarios regulares: la contraseña se verifica en el backend con
      // check_password_hash. El hash nunca llega al navegador.
      if (password === '') {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña requerida',
          text: 'Por favor, ingrese su contraseña.',
          confirmButtonColor: '#003366'
        });
        return;
      }

      let authResponse;
      try {
        authResponse = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: email, password, unes }),
        });
      } catch (error) {
        console.error('Error autenticando:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo validar la contraseña con el servidor. Intente nuevamente.',
          confirmButtonColor: '#003366'
        });
        return;
      }

      const authData = await authResponse.json().catch(() => ({}));

      if (!authResponse.ok || !authData.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Credenciales inválidas',
          text: authData.error || 'El correo o la contraseña no son correctos. Verifique e intente nuevamente.',
          confirmButtonColor: '#003366'
        });
        return;
      }

      // === INGRESO EXITOSO ===
      const nombreSesion = authData.user?.nombre || user.name || email;

      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Ingreso exitoso, ${nombreSesion}`,
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        localStorage.setItem('userUnes', authData.user?.unes || unes);
        localStorage.setItem('userEmail', authData.user?.correo || email);
        localStorage.setItem('isTalentoHumano', 'false');
        navigate('/home');
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <div className="logo-container">
          <FaUmbrellaBeach size={50} color="#ffcc00" />
          <h2>G&J Vacaciones</h2>
          <p className="text-white-50">Intranet Corporativa</p>
        </div>

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-4" controlId="formBasicEmail">
            <Form.Label><FaEnvelope className="me-2" /> Correo Corporativo</Form.Label>
            <Form.Control
              type="email"
              placeholder="usuario@gyj.com.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </Form.Group>

          {/* UNES y Contraseña en la misma fila */}
          <Row className="mb-4 g-3">
            <Col xs={6}>
              <Form.Group className="login-unes-wrapper" controlId="formBasicUnes">
                <Form.Label><FaLock className="me-2" /> UNES</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="3 dígitos"
                  value={unes}
                  onChange={handleUnesChange}
                  maxLength={3}
                  inputMode="numeric"
                  autoComplete="username"
                  disabled={submitting}
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="login-password-wrapper" controlId="formBasicPassword">
                <Form.Label><FaLock className="me-2" /> Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                />
              </Form.Group>
            </Col>
          </Row>

          <Button className="btn-primary-custom" type="submit" disabled={submitting}>
            {submitting ? 'AUTENTICANDO...' : 'INGRESAR'}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Login;