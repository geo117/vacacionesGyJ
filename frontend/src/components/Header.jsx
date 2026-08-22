import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Container, Navbar, Nav, Button, Dropdown, Badge } from 'react-bootstrap';
import { FaSignOutAlt, FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import imagen from '../assets/logo_blanco.png';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { socket, notifications } = useSocket();
  const userUnes = localStorage.getItem('userUnes') || '';
  const userEmail = (localStorage.getItem('userEmail') || '').toLowerCase();
  const API_URL = 'http://127.0.0.1:5000';
  
  const talentohumano = [
    'talentohumano@gyj.com.co','direccion_th@gyj.com.co'
  ];
  const isTalentoHumano = talentohumano.map(e => e.toLowerCase()).includes(userEmail);

  const filteredNotifications = isTalentoHumano 
    ? notifications 
    : notifications.filter(notif => notif.unes?.toString() === userUnes.toString());
  
  const [showBadge, setShowBadge] = useState(false);
  const prevLength = useRef(0);

  useEffect(() => {
    if (filteredNotifications.length > prevLength.current) {
      setShowBadge(true);
    } else if (filteredNotifications.length === 0) {
      setShowBadge(false);
    }
    prevLength.current = filteredNotifications.length;
  }, [filteredNotifications.length]);

  const handleLogout = () => {
    navigate('/', { replace: true });
  };

  const handleToggle = async (isOpen) => {
    if (isOpen) {
      try {
        await fetch(`${API_URL}/marcar_notificaciones_leidas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ unes: isTalentoHumano ? null : userUnes }),
        });
        socket.emit('request_notifications');
      } catch (error) {
        console.error('Error marcando notificaciones como leídas:', error);
      }
    }
  };

  return (
    <Navbar className="navbar-custom" variant="dark" expand="lg" fixed="top">
      <Container fluid>
        <Navbar.Brand href="#home">
          <img
            alt=""
            src={imagen}
            width="80"
            height="50"
            className="d-inline-block align-top me-2"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center">
            
            <Dropdown onToggle={handleToggle} align="end" className="notification-dropdown">
                <Dropdown.Toggle 
                  as="button" 
                  className="btn btn-link position-relative p-2 border-0 text-white shadow-none no-caret"
                >
                  <FaBell size={20} />
                  {showBadge && (
                    <Badge 
                      pill 
                      bg="danger" 
                      className="position-absolute top-0 start-100 translate-middle"
                      style={{ fontSize: '0.6rem', marginTop: '5px', marginLeft: '-5px' }}
                    >
                      {filteredNotifications.length}
                    </Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 py-0 mt-3 notification-menu">
                  <div className="p-3 border-bottom bg-light">
                    <h6 className="mb-0 fw-bold">Notificaciones Recientes</h6>
                  </div>
                  <div className="notification-list">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notif, index) => (
                        <Dropdown.Item key={index} className="p-3 border-bottom whitespace-normal">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <Badge bg={notif.type === 'success' ? 'success' : 'info'} className="me-2" style={{ fontSize: '0.6rem' }}>
                              {notif.type || 'info'}
                            </Badge>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{notif.time}</small>
                          </div>
                          <div className="small text-dark fw-medium" style={{ lineHeight: '1.2' }}>{notif.text}</div>
                        </Dropdown.Item>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted">
                        <small>No hay notificaciones nuevas</small>
                      </div>
                    )}
                  </div>
                {/* <div className="p-2 text-center bg-light">
                  <small className="text-primary cursor-pointer">Ver todas</small>
                </div> */}
              </Dropdown.Menu>
            </Dropdown>

            <Button 
              variant="outline-light" 
              className="ms-lg-4 mt-2 mt-lg-0"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" /> Salir
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
