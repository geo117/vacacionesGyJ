import { useState } from 'react';
import { Container, Row, Col, Button, ListGroup, Card, Badge } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaUserTie, FaKey, FaHome } from 'react-icons/fa';
import NuevoUsuarioModal from '../components/NuevoUsuarioModal';
import '../styles/Home.css';

const Adminstrador = () => {
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Invented users data
  const users = [
    { id: 1, name: 'Ana Gómez', email: 'ana.gomez@example.com', password: 'password123', unes: 'UNES 001', cargo: 'Analista' },
    { id: 2, name: 'Carlos Pérez', email: 'carlos.perez@example.com', password: 'secure456', unes: 'UNES 002', cargo: 'Coordinador' },
    { id: 3, name: 'Laura Martínez', email: 'laura.martinez@example.com', password: 'letmein', unes: 'UNES 003', cargo: 'Gerente' },
    { id: 4, name: 'Jorge Sánchez', email: 'jorge.sanchez@example.com', password: 'admin123', unes: 'UNES 004', cargo: 'Supervisor' },
    { id: 5, name: 'María López', email: 'maria.lopez@example.com', password: 'mypass', unes: 'UNES 005', cargo: 'Asistente' },
  ];

  return (
    <div className="adminstrador-page" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '20px' }}>
      <Container className="py-4 px-4">
        {/* === Section 1 === */}
        <Row className="mb-4 g-4 align-items-center">
          <Col md={8}>
            <h4 className="fw-bold mb-0" style={{ color: '#003366' }}>Administración de Usuarios</h4>
            <p className="text-muted small mb-0">Gestiona los usuarios del sistema de vacaciones.</p>
          </Col>
          <Col md={4} className="d-flex justify-content-end gap-2">
            <Button
              variant="primary"
              size="sm"
              className="px-4 rounded-pill shadow-sm"
              style={{ backgroundColor: '#003366', border: 'none' }}
              onClick={() => setShowNuevoUsuario(true)}
            >
              <span className="me-1">➕</span> Nuevo Usuario
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              className="px-4 rounded-pill shadow-sm"
              onClick={() => window.history.back()}
            >
              <FaHome className="me-1" /> Regresar
            </Button>
          </Col>
        </Row>

        {/* === Section 2: Two Columns === */}
        <Row className="g-4">
          {/* Left column: List of users */}
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-0">
                <ListGroup variant="flush" className="list-group-user-list">
                  {users.map((user) => (
                    <ListGroup.Item
                      key={user.id}
                      className="list-group-item list-group-item-action border-0 border-bottom py-3 px-4"
                      onClick={() => setSelectedUser(user)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: '40px', height: '40px', fontSize: '0.9rem', fontWeight: 'bold' }}
                        >
                          {user.name ? user.name.charAt(0) : <FaUser />}
                        </div>
                        <div className="d-flex flex-column flex-grow-1">
                          <h6 className="fw-bold mb-0">{user.name}</h6>
                          <small className="text-muted">{user.email}</small>
                        </div>
                        <Badge bg="light" text="dark" className="fw-normal small px-2 py-1">
                          {user.unes}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Right column: User details */}
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                {selectedUser ? (
                  <div className="p-3">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div
                        className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '80px', height: '80px', fontSize: '1.8rem', fontWeight: 'bold' }}
                      >
                        {selectedUser.name ? selectedUser.name.charAt(0) : <FaUser />}
                      </div>
                      <div>
                        <h4 className="fw-bold mb-1" style={{ color: '#003366' }}>{selectedUser.name}</h4>
                        <p className="text-muted mb-0">{selectedUser.cargo}</p>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">
                          <FaEnvelope className="me-1 text-primary" /> Correo
                        </label>
                        <p className="fw-medium mb-0 mt-1">{selectedUser.email}</p>
                      </div>
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">
                          <FaUserTie className="me-1 text-primary" /> Cargo
                        </label>
                        <p className="fw-medium mb-0 mt-1">{selectedUser.cargo}</p>
                      </div>
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">
                          <FaUser className="me-1 text-primary" /> UNES
                        </label>
                        <p className="fw-medium mb-0 mt-1">{selectedUser.unes}</p>
                      </div>
                      <div className="col-12">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">
                          <FaKey className="me-1 text-primary" /> Contraseña
                        </label>
                        <p className="fw-medium mb-0 mt-1 font-monospace">{selectedUser.password}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <FaUser className="display-4 text-muted mb-3" />
                    <p className="lead text-muted">Selecciona un usuario para ver su información</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal de Nuevo Usuario */}
      <NuevoUsuarioModal show={showNuevoUsuario} onHide={() => setShowNuevoUsuario(false)} />
    </div>
  );
};

export default Adminstrador;