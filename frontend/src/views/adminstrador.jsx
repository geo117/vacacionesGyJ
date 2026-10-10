import { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, ListGroup, Card, Badge, Form } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaUserTie, FaKey, FaHome, FaEdit, FaTrash, FaSave, FaTimes, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import NuevoUsuarioModal from '../components/NuevoUsuarioModal';
import '../styles/Home.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { isTalentoHumanoEmail } from '../constants/talentohumano';

const API_URL = 'http://127.0.0.1:5000';

const Adminstrador = () => {
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [mostrarPasswordDetail, setMostrarPasswordDetail] = useState(false);
  const [plainPassword, setPlainPassword] = useState(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const usuariosRequestRef = useRef(0);

  // Solo Talento Humano puede revelar/reiniciar la contraseña de un usuario.
  const sesionCorreo = (localStorage.getItem('userEmail') || '').toLowerCase();
  const puedeVerPassword = isTalentoHumanoEmail(sesionCorreo);

  /**
   * Carga (o recarga) la lista de usuarios desde el backend.
   * Se pasa como prop al modal de creación para que la columna izquierda se
   * actualice sin recargar la página.
   */
  const fetchUsuarios = useCallback(async () => {
    const requestId = ++usuariosRequestRef.current;
    try {
      const response = await fetch(`${API_URL}/get_usuarios`);
      const data = await response.json();
      // Ignora respuestas de peticiones que ya no son la última.
      if (requestId !== usuariosRequestRef.current) return false;
      if (data.ok && Array.isArray(data.data)) {
        setUsers(data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return false;
    }
  }, []);

  // Cargar usuarios desde la BD al montar la vista.
  useEffect(() => {
    const controller = new AbortController();
    const cargar = async () => {
      try {
        const response = await fetch(`${API_URL}/get_usuarios`, { signal: controller.signal });
        const data = await response.json();
        if (!controller.signal.aborted && data.ok && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al obtener usuarios:', error);
        }
      }
    };
    cargar();
    return () => controller.abort();
  }, []);

  const handleEdit = () => {
    if (!selectedUser) return;
    setFormData({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      cargo: selectedUser.cargo || '',
      unes: selectedUser.unes || '',
      // Vacio a proposito: escribir aqui define una nueva contraseña.
      // El backend ignora el campo si viene vacio y conserva la existente.
      password: '',
    });
    setIsEditing(true);
    setShowPassword(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({});
    setShowPassword(false);
  };

  /**
   * Alterna la visibilidad del campo contraseña en modo lectura.
   *
   * generate_password_hash es unidireccional: el hash original NO se puede
   * recuperar. Por eso nunca se muestra la cadena del hash. Al expandir se
   * muestra la etiqueta de estado protegido; solo las filas legacy que aún
   * guardan texto plano pueden revelar su valor.
   */
  const handleTogglePasswordDetail = async () => {
    if (!puedeVerPassword || !selectedUser) return;

    if (mostrarPasswordDetail) {
      setMostrarPasswordDetail(false);
      setPlainPassword(null);
      return;
    }

    if (!selectedUser.has_password) {
      Swal.fire({
        icon: 'info',
        title: 'Sin contraseña',
        text: 'Este usuario no tiene una contraseña asignada. Use el botón Editar para definir una.',
        confirmButtonColor: '#003366',
      });
      return;
    }

    // Si el backend ya marcó el valor como hash, no hay nada que consultar:
    // se muestra la etiqueta de estado protegido sin llamar al endpoint.
    if (selectedUser.password_is_hashed) {
      setMostrarPasswordDetail(true);
      return;
    }

    // Solo para registros legacy con contraseña en texto plano.
    setLoadingPassword(true);
    try {
      const response = await fetch(`${API_URL}/get_usuario_password/${selectedUser.id}`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo consultar',
          text: data.error || 'No se pudo obtener la contraseña.',
          confirmButtonColor: '#003366',
        });
        return;
      }

      if (data.password_is_hashed) {
        setMostrarPasswordDetail(true);
        setPlainPassword(null);
        return;
      }

      setPlainPassword(data.password);
      setMostrarPasswordDetail(true);
    } catch (error) {
      console.error('Error consultando contraseña:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor.',
        confirmButtonColor: '#003366',
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  /** Restablece la contraseña de un usuario sin exponer la clave anterior. */
  const handleResetPassword = () => {
    if (!puedeVerPassword || !selectedUser) return;

    Swal.fire({
      icon: 'question',
      title: '¿Restablecer contraseña?',
      html: `Se le asignará una <b>contraseña nueva</b> a <b>${selectedUser.name || selectedUser.email}</b>.<br>La contraseña actual dejará de ser válida.`,
      input: 'text',
      inputPlaceholder: 'Ingrese la nueva contraseña',
      inputAttributes: { 'aria-label': 'Nueva contraseña' },
      showCancelButton: true,
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#003366',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const nuevaPassword = (result.value || '').trim();
      if (!nuevaPassword) {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña requerida',
          text: 'Debe ingresar la nueva contraseña.',
          confirmButtonColor: '#003366',
        });
        return;
      }

      handleSaveChanges(nuevaPassword);
    });
  };

  /**
   * Guarda los cambios del usuario.
   *
   * `passwordForzada` permite resetear la contraseña desde modo lectura sin
   * pasar por el formulario de edición. Si no se envía, el payload manda ""
   * y el backend conserva el valor almacenado.
   */
  const handleSaveChanges = async (passwordForzada) => {
    if (!selectedUser) return;

    const passwordAEnviar = passwordForzada !== undefined ? passwordForzada : (formData.password || '');

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/update_usuario/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.name || selectedUser.name || '',
          correo: formData.email || selectedUser.email || '',
          cargo: formData.cargo !== undefined ? formData.cargo : (selectedUser.cargo || ''),
          unes: formData.unes !== undefined ? formData.unes : (selectedUser.unes || ''),
          // Vacío => el backend NO toca la columna password.
          password: passwordAEnviar,
          activo: selectedUser.Activo !== undefined ? selectedUser.Activo : true,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo actualizar el usuario en el servidor.',
          confirmButtonColor: '#003366',
        });
        return;
      }

      const esReset = Boolean(passwordForzada);
      Swal.fire({
        icon: 'success',
        title: esReset ? 'Contraseña restablecida' : 'Usuario actualizado',
        text: esReset
          ? `Se asignó una nueva contraseña a ${selectedUser.name || selectedUser.email}.`
          : 'La información del usuario se actualizó correctamente en el servidor.',
        confirmButtonColor: '#003366',
      });

      setIsEditing(false);
      setFormData({});
      setShowPassword(false);
      setMostrarPasswordDetail(false);
      setPlainPassword(null);

      await fetchUsuarios();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
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
        fetch(`${API_URL}/delete_usuario/${selectedUser.id}`, {
          method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
          if (data.ok) {
            setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
            setIsEditing(false);
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El usuario ha sido eliminado correctamente.',
              confirmButtonColor: '#003366',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: data.error || 'No se pudo eliminar el usuario.',
              confirmButtonColor: '#003366',
            });
          }
        })
        .catch(error => {
          console.error('Error eliminando usuario:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo conectar con el servidor.',
            confirmButtonColor: '#003366',
          });
        });
      }
    });
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsEditing(false);
    setFormData({});
    setMostrarPasswordDetail(false);
    setPlainPassword(null);
    setShowPassword(false);
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
                          <Badge bg="light" text="dark" className="fw-normal small px-2 py-1">
                            {user.unes === 'N/A' ? 'Talento Humano' : 'Unes ' +user.unes}
                          </Badge>
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
                          <div className="position-relative">
                            <Form.Control
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password || ''}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              placeholder="Dejar vacío para conservar la actual"
                              className="pr-5"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="btn btn-sm position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              title={showPassword ? 'Ocultar' : 'Mostrar'}
                              style={{ zIndex: 10, color: '#003366' }}
                            >
                              {showPassword ? <FaEye /> : <FaEyeSlash />}
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center justify-content-between">
                            {!selectedUser?.has_password ? (
                              <p className="fw-medium mb-0 mt-1 text-muted font-monospace">
                                (sin contraseña)
                              </p>
                            ) : mostrarPasswordDetail ? (
                              // Nunca se muestra el hash. Si está hasheada se
                              // informa el estado; si es legacy en texto plano,
                              // se revela el valor real.
                              <div className="d-flex flex-column">
                                {plainPassword ? (
                                  <p className="fw-medium mb-0 mt-1 font-monospace text-break">
                                    {plainPassword}
                                  </p>
                                ) : (
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 align-self-start mt-1">
                                    <FaLock className="me-1" />
                                    Contraseña Encriptada Protegida
                                  </span>
                                )}
                                <small className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                  {plainPassword
                                    ? 'Registro legado en texto plano. Guarde para convertirla en hash.'
                                    : 'El hash es unidireccional: la clave original no se puede recuperar. Restablezca para asignar una nueva.'}
                                </small>
                              </div>
                            ) : (
                              <p className="fw-medium mb-0 mt-1 font-monospace">
                                ••••••••
                              </p>
                            )}

                            {/* El ícono de ojo solo se habilita para Talento Humano */}
                            {puedeVerPassword && selectedUser?.has_password && (
                              <button
                                type="button"
                                className="btn btn-sm border-0 bg-transparent p-0 flex-shrink-0 ms-2"
                                onClick={handleTogglePasswordDetail}
                                disabled={loadingPassword}
                                title={
                                  selectedUser?.password_is_hashed
                                    ? 'Ver estado de la contraseña'
                                    : (mostrarPasswordDetail ? 'Ocultar contraseña' : 'Mostrar contraseña')
                                }
                                style={{ color: loadingPassword ? '#adb5bd' : '#003366', cursor: loadingPassword ? 'wait' : 'pointer' }}
                              >
                                {loadingPassword ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                ) : (
                                  mostrarPasswordDetail ? <FaEye /> : <FaEyeSlash />
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Acciones / avisos en modo lectura */}
                        {!isEditing && (
                          <div className="mt-2">
                            {!puedeVerPassword && (
                              <small className="text-muted d-block">
                                <FaLock className="me-1" />
                                Solo Talento Humano puede consultar o restablecer la contraseña.
                              </small>
                            )}
                            {puedeVerPassword && selectedUser?.has_password && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-decoration-none"
                                style={{ fontSize: '0.8rem' }}
                                onClick={handleResetPassword}
                                disabled={saving}
                              >
                                Restablecer contraseña
                              </Button>
                            )}
                          </div>
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

      <NuevoUsuarioModal
        show={showNuevoUsuario}
        onHide={() => setShowNuevoUsuario(false)}
        onUserAdded={fetchUsuarios}
      />
    </div>
  );
};

export default Adminstrador;
