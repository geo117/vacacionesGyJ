import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaUserTie, FaKey } from 'react-icons/fa';
import Swal from 'sweetalert2';

const API_URL = 'http://127.0.0.1:5000';

const NuevoUsuarioModal = ({ show, onHide, onUserAdded, onRefreshUsers }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    cargo: '',
    password: '',
    unes: '',
    activo: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unesOptions, setUnesOptions] = useState([]);
  const [loadingUnes, setLoadingUnes] = useState(false);

  // Cargar las UNES disponibles desde el backend al abrir el modal.
  useEffect(() => {
    if (!show) return;
    let cancelled = false;

    const fetchUnes = async () => {
      setLoadingUnes(true);
      try {
        const response = await fetch(`${API_URL}/pbi-colaborador-vacaciones?limit=1200`);
        const data = await response.json();
        if (!cancelled && data.ok && Array.isArray(data.data)) {
          const map = new Map();
          data.data.forEach((emp) => {
            const codigo = emp.IDCia_CO?.toString().slice(-3);
            if (codigo && !map.has(codigo)) {
              map.set(codigo, emp.DescCO || '');
            }
          });
          const options = [...map.entries()]
            .map(([codigo, descripcion]) => ({ codigo, descripcion }))
            .sort((a, b) => a.codigo.localeCompare(b.codigo));
          setUnesOptions(options);
        }
      } catch (error) {
        console.error('Error fetching UNES:', error);
      } finally {
        if (!cancelled) setLoadingUnes(false);
      }
    };

    fetchUnes();
    return () => { cancelled = true; };
  }, [show]);

  const resetForm = () => {
    setFormData({ nombre: '', correo: '', cargo: '', password: '', unes: '', activo: true });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    const nombre = (formData.nombre || '').trim();
    const correo = (formData.correo || '').trim();

    if (!nombre || !correo) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El nombre y el correo son obligatorios.',
        confirmButtonColor: '#003366',
      });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 6 caracteres.',
        confirmButtonColor: '#003366',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/usuarios_nuevos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El backend aplica generate_password_hash() antes de insertar.
        body: JSON.stringify({ ...formData, nombre, correo }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo registrar el usuario.',
          confirmButtonColor: '#003366',
        });
        return;
      }

      // Cierra el modal y refresca la lista del padre antes de confirmar.
      resetForm();
      onHide();

      const refrescar = onRefreshUsers || onUserAdded;
      if (refrescar) {
        await refrescar();
      }

      Swal.fire({
        icon: 'success',
        title: 'Usuario creado',
        text: `El usuario ${nombre} ha sido registrado correctamente.`,
        confirmButtonColor: '#003366',
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo conectar con el servidor.',
        confirmButtonColor: '#003366',
      });
    } finally {
      setSaving(false);
    }
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
              <Form.Group className="position-relative">
                <Form.Label className="small fw-bold">
                  <FaKey className="me-1" /> Contraseña
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="border-0 shadow-sm"
                    style={{ borderColor: '#dee2e6' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 10, color: '#003366' }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </Form.Group>
            </Col>
            <Col md={7}>
              <Form.Group>
                <Form.Label className="small fw-bold">UNES</Form.Label>
                <Form.Select
                  value={formData.unes}
                  onChange={(e) => handleChange('unes', e.target.value)}
                  className="border-0 shadow-sm"
                  style={{ borderColor: '#dee2e6' }}
                  disabled={loadingUnes}
                >
                  <option value="">
                    {loadingUnes ? 'Cargando UNES...' : 'Seleccione una UNES'}
                  </option>
                  {unesOptions.map(({ codigo, descripcion }) => (
                    <option key={codigo} value={codigo}>
                      {descripcion ? `${codigo} - ${descripcion}` : codigo}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5} className="d-flex align-items-end">
              <div className="d-flex align-items-center w-100" style={{ height: '38px', paddingBottom: '2px' }}>
                <Form.Check
                  type="switch"
                  id="user-active-switch"
                  label="Usuario Activo"
                  checked={formData.activo}
                  onChange={(e) => handleChange('activo', e.target.checked)}
                  className="small fw-bold"
                />
              </div>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className="bg-white p-3 border-0">
        <Button variant="outline-secondary" onClick={() => { resetForm(); onHide(); }} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" className="px-4" onClick={handleSubmit} disabled={saving} style={{ backgroundColor: '#003366' }}>
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Guardando...
            </>
          ) : (
            'Guardar Usuario'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NuevoUsuarioModal;