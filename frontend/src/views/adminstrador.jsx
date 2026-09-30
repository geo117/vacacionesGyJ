import { useState } from 'react';
import { Container, Row, Col, Button, ListGroup, Card, Badge, Form } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaUserTie, FaKey, FaHome, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import NuevoUsuarioModal from '../components/NuevoUsuarioModal';
import '../styles/Home.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Adminstrador = () => {
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const [users, setUsers] = useState([
    { id: 1, name: 'Ana Gómez', email: 'ana.gomez@example.com', password: 'password123', unes: 'UNES 001', cargo: 'Analista' },
    { id: 2, name: 'Carlos Pérez', email: 'carlos.perez@example.com', password: 'secure456', unes: 'UNES 002', cargo: 'Coordinador' },
    { id: 3, name: 'Laura Martínez', email: 'laura.martinez@example.com', password: 'letmein', unes: 'UNES 003', cargo: 'Gerente' },
    { id: 4, name: 'Jorge Sánchez', email: 'jorge.sanchez@example.com', password: 'admin123', unes: 'UNES 004', cargo: 'Supervisor' },
    { id: 5, name: 'María López', email: 'maria.lopez@example.com', password: 'mypass', unes: 'UNES 005', cargo: 'Asistente' },
    { id: 6, name: 'Pedro Ramírez', email: 'pedro.ramirez@example.com', password: 'demo789', unes: 'UNES 006', cargo: 'Analista' },
    { id: 7, name: 'Sofía Torres', email: 'sofia.torres@example.com', password: 'pass2025', unes: 'UNES 007', cargo: 'Coordinador' },
    { id: 8, name: 'Sofía Torres', email: 'sofia.torres@example.com', password: 'pass2025', unes: 'UNES 007', cargo: 'Coordinador' },
  ]);

  const handleEdit = () => {
    if (!selectedUser) return;
    setFormData({
      name: selectedUser.name,
      email: selectedUser.email,
      cargo: selectedUser.cargo,
      unes: selectedUser.unes,
      password: selectedUser.password,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;
    const updatedUser = { ...selectedUser, ...formData };
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
    setIsEditing(false);
    setFormData({});

    Swal.fire({
      icon: 'success',
      title: 'Usuario actualizado',
      text: 'La información del usuario se actualizó correctamente.',
      confirmButtonColor: '#003366',
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    Swal.fire({
      title: '¿Estás seguro de eliminar este usuario?',
      text: `${selectedUser.name} será eliminado permanentemente de la lista.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        setSelectedUser(null);
        setIsEditing(false);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El usuario ha sido eliminado correctamente.',
          confirmButtonColor: '#003366',
        });
      }
    });
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsEditing(false);
    setFormData({});
  };

  return (
    <div className="adminstrador-page" style={{ height: 'calc(100vh - 56px)', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
      <Container className="py-4 px-4">
        <Row className="mb-4 g-4 align-items-center">
          <Col md={8}>
            <h4 className="fw-bold mb-0" style={{ color: '#003366' }}>Administración de Usuarios</h4>
            <p className="text-muted small mb-0">Gestiona los usuarios del sistema de vacaciones.</p>
          </Col>
          <Col md={4} className="d-flex justify-content-end gap-2">
            <Button variant="primary" size="sm" className="px-4 rounded-pill shadow-sm" style={{ backgroundColor: '#003366', border: 'none' }} onClick={() => setShowNuevoUsuario(true)}>
              <span className="me-1">➕</span> Nuevo Usuario
            </Button>
            <Button variant="outline-secondary" size="sm" className="px-4 rounded-pill shadow-sm" onClick={() => window.history.back()}>
              <FaHome className="me-1" /> Regresar
            </Button>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-0">
                <div className={users.length > 5 ? 'scrollbar-hidden' : ''} style={users.length > 5 ? { maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' } : {}}>
                  <ListGroup variant="flush">
                    {users.map((user) => (
                      <ListGroup.Item
                        key={user.id}
                        className={`list-group-item list-group-item-action border-0 border-bottom py-3 px-4 ${selectedUser?.id === user.id ? 'bg-light' : ''}`}
                        onClick={() => handleUserSelect(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {user.name ? user.name.charAt(0) : <FaUser />}
                          </div>
                          <div className="d-flex flex-column flex-grow-1">
                            <h6 className="fw-bold mb-0">{user.name}</h6>
                            <small className="text-muted">{user.email}</small>
                          </div>
                          <Badge bg="light" text="dark" className="fw-normal small px-2 py-1">{user.unes}</Badge>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                {selectedUser ? (
                  <div className="p-3">
                    <div className="d-flex align-items-start justify-content-between mb-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '80px', height: '80px', fontSize: '1.8rem', fontWeight: 'bold' }}>
                          {selectedUser?.name ? selectedUser.name.charAt(0) : <FaUser />}
                        </div>
                        <div>
                          <h4 className="fw-bold mb-1" style={{ color: '#003366' }}>
                            {isEditing ? <Form.Control size="sm" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /> : selectedUser?.name}
                          </h4>
                          <p className="text-muted mb-0">
                            {isEditing ? <Form.Control size="sm" value={formData.cargo || ''} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} /> : selectedUser?.cargo}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        {!isEditing ? (
                          <>
                            <Button variant="link" className="p-0 text-primary action-btn" title="Editar" onClick={handleEdit}>
                              <FaEdit size={18} />
                            </Button>
                            <Button variant="link" className="p-0 text-danger action-btn" title="Eliminar" onClick={handleDeleteUser}>
                              <FaTrash size={18} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="link" className="p-0 text-success action-btn" title="Guardar" onClick={handleSaveChanges}>
                              <FaSave size={18} />
                            </Button>
                            <Button variant="link" className="p-0 text-danger action-btn" title="Cancelar" onClick={handleCancelEdit}>
                              <FaTimes size={18}/>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1"><FaEnvelope className="me-1 text-primary" /> Correo</label>
                        {isEditing ? (
                          <Form.Control value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        ) : (
                          <p className="fw-medium mb-0 mt-1">{selectedUser?.email}</p>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1"><FaUserTie className="me-1 text-primary" /> Cargo</label>
                        {isEditing ? (
                          <Form.Control value={formData.cargo || ''} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} />
                        ) : (
                          <p className="fw-medium mb-0 mt-1">{selectedUser?.cargo}</p>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1"><FaUser className="me-1 text-primary" /> UNES</label>
                        {isEditing ? (
                          <Form.Control value={formData.unes || ''} onChange={(e) => setFormData({ ...formData, unes: e.target.value })} />
                        ) : (
                          <p className="fw-medium mb-0 mt-1">{selectedUser?.unes}</p>
                        )}
                      </div>
                      <div className="col-12">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1"><FaKey className="me-1 text-primary" /> Contraseña</label>
                        {isEditing ? (
                          <Form.Control type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        ) : (
                          <p className="fw-medium mb-0 mt-1 font-monospace">{selectedUser?.password}</p>
                        )}
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

      <NuevoUsuarioModal show={showNuevoUsuario} onHide={() => setShowNuevoUsuario(false)} />
    </div>
  );
};

export default Adminstrador;
