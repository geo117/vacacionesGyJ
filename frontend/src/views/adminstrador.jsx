import { useState } from 'react';
import Header from '../components/Header';
import { Container, Row, Col, Button, ListGroup, Card } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaKey, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Adminstrador = () => {
  const navigate = useNavigate();

  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Invented users data
  const users = [
    { id: 1, name: 'Ana Gómez', email: 'ana.gomez@example.com', password: 'password123', unes: 'UNES 001' },
    { id: 2, name: 'Carlos Pérez', email: 'carlos.perez@example.com', password: 'secure456', unes: 'UNES 002' },
    { id: 3, name: 'Laura Martínez', email: 'laura.martinez@example.com', password: 'letmein', unes: 'UNES 003' },
    { id: 4, name: 'Jorge Sánchez', email: 'jorge.sanchez@example.com', password: 'admin123', unes: 'UNES 004' },
    { id: 5, name: 'María López', email: 'maria.lopez@example.com', password: 'mypass', unes: 'UNES 005' },
  ];

  return (
    <div className="adminstrador-page">
      <Header />
      <Container fluid className="my-5">
        {/* Section 1: Nuevo Usuario button */}
        <Row className="mb-4">
          <Col md="5" />
          <Col md="7" className="d-flex justify-content-end">
            <Button variant="primary" size="sm" onClick={() => setNewUserDialogOpen(true)}>
              Nuevo Usuario
            </Button>
          </Col>
        </Row>

        {/* Section 2: Two columns */}
        <Row>
          {/* Left column: List of users */}
          <Col md="6">
            <ListGroup variant="flush" className="list-group-user-list">
              {users.map(user => (
                <ListGroup.Item
                  key={user.id}
                  className="list-group-item list-group-item-action py-1"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-0">{user.name}</h6>
                    <small className="text-muted">{user.email}</small>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>

          {/* Right column: User details */}
          <Col md="6">
            {selectedUser ? (
              <Card className="user-detail-card">
                <Card.Body>
                  <Card.Title className="text-primary">{selectedUser.name}</Card.Title>
                  <Card.Text>
                    <div className="row g-2">
                      <div className="col-5">
                        <FaEnvelope className="text-primary me-2" /> <strong>Correo:</strong> {selectedUser.email}
                      </div>
                      <div className="col-5">
                        <FaKey className="text-primary me-2" /> <strong>Contraseña:</strong> {selectedUser.password}
                      </div>
                      <div className="col-2">
                        <FaUserTie className="text-primary me-2" /> <strong>UNES:</strong> {selectedUser.unes}
                      </div>
                    </div>
                  </Card.Text>
                </Card.Body>
              </Card>
            ) : (
              <div className="text-center py-5">
                <FaUser className="display-4 text-muted" />
                <p className="lead">Seleccione un usuario para ver sus datos</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Adminstrador;