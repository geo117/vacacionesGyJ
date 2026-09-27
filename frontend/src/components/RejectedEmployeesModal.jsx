import { Modal, Table, Button } from 'react-bootstrap';
import { FaTimesCircle, FaTimes } from 'react-icons/fa';

const RejectedEmployeesModal = ({ show, onHide, employees, onViewEmployee }) => {
  const rejected = (employees || []).filter(emp => emp.estado === 'rechazada');

  return (
    <Modal show={show} onHide={onHide} centered size="xl" scrollable>
      <Modal.Header closeButton className="bg-danger text-white border-0">
        <Modal.Title className="fw-bold">
          <FaTimesCircle className="me-2" />
          Empleados con Solicitudes Rechazadas ({rejected.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {rejected.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FaTimesCircle className="fs-1 mb-3 text-danger opacity-25" />
            <p className="mb-0">No hay solicitudes rechazadas para mostrar.</p>
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
                  <th className="py-3 px-3 text-muted small fw-bold text-uppercase">Motivo</th>
                  <th className="py-3 px-3 text-muted small fw-bold text-uppercase text-center">Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px' }}>
                {rejected.map((emp, idx) => (
                  <tr key={emp.cedula || idx} className="border-bottom">
                    <td className="px-3 py-3 fw-medium">{emp.cedula || '-'}</td>
                    <td className="px-3 py-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center me-2"
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
                    <td className="px-3 py-3">
                      <span
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: '200px' }}
                        title={emp.motivoRechazo || 'Sin motivo especificado.'}
                      >
                        {emp.motivoRechazo || 'Sin motivo especificado.'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onViewEmployee && onViewEmployee(emp)}
                          title="Ver detalle"
                        >
                          Ver detalle
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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

export default RejectedEmployeesModal;
