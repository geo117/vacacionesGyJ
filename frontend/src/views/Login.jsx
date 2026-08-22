import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaUmbrellaBeach } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [unes, setUnes] = useState('');
  const navigate = useNavigate();

  const talentohumano = [
    'talentohumano@gyj.com.co',
    'direccion_th@gyj.com.co'
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (email === '') {
      Swal.fire({
        icon: 'error',
        title: 'Correo vacío',
        text: 'Por favor, ingrese su correo corporativo.',
        confirmButtonColor: '#003366'
      });
      return;
    }

    const isTalentoHumano = talentohumano.includes(email.toLowerCase());

    if (!isTalentoHumano) {
      // Check if UNES is provided and is exactly 3 digits
      const isThreeDigits = /^\d{3}$/.test(unes);
      if (!isThreeDigits) {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña requerida',
          text: 'Para este usuario, la contraseña es su UNES y debe ser de exactamente 3 dígitos.',
          confirmButtonColor: '#003366'
        });
        return;
      }
    }

    // If it's Talento Humano or a valid UNES was provided
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
            <Form.Label><FaEnvelope className="me-2" /> Correo Corporativo</  Form.Label>
            <Form.Control 
              type="email" 
              placeholder="usuario@gyj.com.co" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="formBasicPassword">
            <Form.Label><FaLock className="me-2" /> Contraseña (UNES)</Form.Label>
            <Form.Control 
              type="password" 
              placeholder="Ingrese su UNES" 
              value={unes}
              onChange={(e) => setUnes(e.target.value)}
            />
          </Form.Group>

          <Button className="btn-primary-custom" type="submit">
            INGRESAR
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Login;
