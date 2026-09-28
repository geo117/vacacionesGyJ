import { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaUserTie, FaKey } from 'react-icons/fa';
import Swal from 'sweetalert2';

const NuevoUsuarioModal = ({ show, onHide }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    cargo: '',
    password: '',
    unes: ''
  });

  const resetForm = () => {
    setFormData({ nombre: '', correo: '', cargo: '', password: '', unes: '' });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Datos inventados: no se conecta a la base de datos.
    const nuevoUsuario = { ...formData, id: Date.now() };
    Swal.fire({
      icon: 'success',
      title: 'Usuario creado',
      text: `El usuario ${nuevoUsuario.nombre} ha sido registrado (demo).`,
      confirmButtonColor: '#003366',
    });
    resetForm();
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-primary text-white p-4">
        <Modal.Title className="fw-bold">
          <FaUser className="me-2" /> Nuevo Usuario
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold">
                  <FaUser className="me-1" /> Nombre
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre del usuario"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className="border-0 shadow-sm"
                  style={{ borderColor: '#dee2e6' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold">
                  <FaEnvelope className="me-1" /> Correo
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="usuario@gyj.com.co"
                  value={formData.correo}
                  onChange={(e) => handleChange('correo', e.target.value)}
                  className="border-0 shadow-sm"
                  style={{ borderColor: '#dee2e6' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold">
                  <FaUserTie className="me-1" /> Cargo
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Cargo del usuario"
                  value={formData.cargo}
                  onChange={(e) => handleChange('cargo', e.target.value)}
                  className="border-0 shadow-sm"
                  style={{ borderColor: '#dee2e6' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold">
                  <FaKey className="me-1" /> Contraseña
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="border-0 shadow-sm"
                  style={{ borderColor: '#dee2e6' }}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="small fw-bold">UNES</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej. 106"
                  value={formData.unes}
                  onChange={(e) => handleChange('unes', e.target.value)}
                  className="border-0 shadow-sm"
                  style={{ borderColor: '#dee2e6' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="alert alert-info mt-4 mb-0 py-3" style={{ backgroundColor: '#e7f1ff', borderColor: '#b6d4fe', color: '#084298' }}>
            <div className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm0-1.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z" />
                <path d="M5.255 5.786a.75.75 0 0 1 1.06 1.06L6.31 10.44h3.38a.75.75 0 0 1 0 1.5H6.31l-2.005 3.59a.75.75 0 1 1-1.06-1.06l1.97-3.53H5.12a.75.75 0 0 1 0-1.5h3.39l-1.97-3.53a.75.75 0 0 1 .79-.786z" />
              </svg>
              <span className="small">
                <strong>Nota:</strong> Los datos ingresados son de demostración y no se almacenan en la base de datos.
              </span>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="bg-white p-3 border-0">
        <Button variant="outline-secondary" onClick={() => { resetForm(); onHide(); }}>
          Cancelar
        </Button>
        <Button variant="primary" className="px-4" onClick={handleSubmit} style={{ backgroundColor: '#003366' }}>
          Guardar Usuario
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NuevoUsuarioModal;