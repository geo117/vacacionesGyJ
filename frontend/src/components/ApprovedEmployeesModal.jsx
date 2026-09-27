import { Modal, Table, Button } from 'react-bootstrap';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

const ApprovedEmployeesModal = ({ show, onHide, employees, onViewEmployee }) => {
  const approved = (employees || []).filter(emp => emp.estado === 'aprobado');

  return (
    <Modal show={show} onHide={onHide} centered size="lg" scrollable>
      <Modal.Header closeButton className="bg-success text-white border-0">
        <Modal.Title className="fw-bold">
          <FaCheckCircle className="me-2" />
          Empleados con Solicitudes Aprobadas ({approved.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {approved.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaCheckCircle className="fs-1 mb-3 text-success opacity-25" />
            <p className="mb-0">No hay solicitudes aprobadas para mostrar.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Table hover className="align-middle mb-0">
              <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th className="py-3 px-3 text-muted small fw-bold text-uppercase">Cédula</th>
                  <th className="py-3 px-3 text-muted small fw-bold text-uppercase">Empleado</th>
                  <th className="py-3 px-3 text-muted small fw-bold text-uppercase">Unes</th>
                  <th className="py-3 px-3 text-muted small fw-bold text-uppercase">Desc. Unes</th>
                  <th className="py-3 px-3 text-muted small fw-bold text-uppercase text-center">Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {approved.map((emp, idx) => {
                  return (
                    <tr key={emp.cedula || idx} className="border-bottom">
                      <td className="px-3 py-3 fw-medium">{emp.cedula || '-'}</td>
                      <td className="px-3 py-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center me-2"
                            style={{ width: '32px', height: '32px', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            {emp.Empleado ? emp.Empleado.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="fw-bold text-dark mb-0">{emp.Empleado || '-'}</div>
                            <div className="text-muted small">{emp.Cargo || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="badge bg-light text-dark border fw-normal">
                          {emp.IDCia_CO?.toString().slice(-3) || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3">{emp.DescCO || '-'}</td>
                      <td className="px-3 py-3 text-center">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1 text-primary"
                          onClick={() => onViewEmployee && onViewEmployee(emp)}
                          title="Ver detalle"
                        >
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>
          <FaTimes className="me-1" /> Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApprovedEmployeesModal;
