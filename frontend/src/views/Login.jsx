import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaUmbrellaBeach } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../styles/Login.css';

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

const Login = () => {
  const [email, setEmail] = useState('');
  const [unes, setUnes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  const talentohumano = [
    {'correo':'talentohumano@gyj.com.co', 'nombre': 'Jessica Alexandra Diaz'},
    {'correo':'direccion_th@gyj.com.co', 'nombre': 'Carolina Rivera Vargas'},
    {'correo':'auxiliar.nomina@gyj.com.co', 'nombre': 'Kerrin Yesenia Collazos'}
  ];

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

    const talentoHumanoUser = talentohumano.find(th => th.correo.toLowerCase() === email.toLowerCase());
    const isTalentoHumano = !!talentoHumanoUser;

    if (!isTalentoHumano) {
      if (!isValidFormat(unes)) {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña requerida',
          text: 'Para este usuario, la contraseña es su UNES y debe ser de exactamente 3 dígitos.',
          confirmButtonColor: '#003366'
        });
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      setSubmitting(true);
      Swal.fire({
        title: 'Validando UNES...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });

      try {
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
      } finally {
        setSubmitting(false);
      }
    }

    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: 'Ingreso exitoso al sistema de vacaciones.',
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      localStorage.setItem('userUnes', unes);
      localStorage.setItem('userEmail', email);
      navigate('/home');
    });
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

          <Form.Group className="mb-4" controlId="formBasicPassword">
            <Form.Label><FaLock className="me-2" /> Contraseña (UNES)</Form.Label>
            <Form.Control
              type="password"
              placeholder="Ingrese su UNES"
              value={unes}
              onChange={handleUnesChange}
              maxLength={3}
              inputMode="numeric"
              autoComplete="current-password"
              disabled={submitting}
            />
          </Form.Group>

          <Button className="btn-primary-custom" type="submit" disabled={submitting}>
            {submitting ? 'VALIDANDO...' : 'INGRESAR'}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Login;
