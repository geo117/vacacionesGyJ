import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import '../styles/Home.css';

const DownloadPlanoModal = ({ show, onHide, uniqueUnes, selectedUnes, onDownload }) => {
  const [downloadType, setDownloadType] = useState('general'); // 'general' | 'unes'
  const [selectedUnesForDownload, setSelectedUnesForDownload] = useState(selectedUnes || '');
  const [isDownloading, setIsDownloading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setDownloadType('general');
      setSelectedUnesForDownload(selectedUnes || '');
    }
  }, [show, selectedUnes]);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // Call the onDownload callback with the selected options
      const result = await onDownload({
        type: downloadType,
        unes: downloadType === 'unes' ? selectedUnesForDownload : null
      });

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Descarga exitosa',
          text: result.message || 'El plano se ha descargado correctamente.',
          confirmButtonColor: '#003366',
          timer: 2500
        });
        onHide();
      } else {
        throw new Error(result.message || 'Error al descargar el plano');
      }
    } catch (error) {
      console.error('Error downloading plano:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al descargar',
        text: error.message || 'No se pudo descargar el plano. Intente nuevamente.',
        confirmButtonColor: '#003366'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton className="bg-primary text-white p-4">
        <Modal.Title className="fw-bold">Descarga de plano para unoee</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Form>
          {/* Section 1: Download Type Selection */}
          <div className="mb-4">
            <label className="text-muted small fw-bold text-uppercase d-block mb-3">Tipo de descarga</label>
            
            <div className="d-flex flex-column gap-3">
              {/* Checkbox: Plano General */}
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="downloadType"
                  id="downloadGeneral"
                  value="general"
                  checked={downloadType === 'general'}
                  onChange={() => setDownloadType('general')}
                />
                <label className="form-check-label fw-medium" htmlFor="downloadGeneral">
                  <span className="me-2">📄</span> Descargar plano general
                </label>
                <div className="form-text ms-4 text-muted">
                  Descarga el plano consolidado de todas las UNES
                </div>
              </div>

              {/* Checkbox: Plano por UNES */}
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="downloadType"
                  id="downloadUnes"
                  value="unes"
                  checked={downloadType === 'unes'}
                  onChange={() => setDownloadType('unes')}
                />
                <label className="form-check-label fw-medium" htmlFor="downloadUnes">
                  <span className="me-2">🏢</span> Descargar plano por UNES
                </label>
                
                {/* UNES Dropdown - only visible when UNES option is selected */}
                {downloadType === 'unes' && (
                  <div className="mt-3 ms-4">
                    <Form.Group>
                      <Form.Label className="small fw-bold">Seleccionar UNES</Form.Label>
                      <Form.Select
                        className="shadow-sm"
                        value={selectedUnesForDownload}
                        onChange={(e) => setSelectedUnesForDownload(e.target.value)}
                        style={{ borderColor: '#dee2e6' }}
                        disabled={!uniqueUnes.length}
                      >
                        <option value="">Seleccione una UNES</option>
                        {uniqueUnes.length === 0 ? (
                          <option value="" disabled>No hay UNES disponibles</option>
                        ) : (
                          uniqueUnes.map(unes => (
                            <option key={unes} value={unes}>{unes}</option>
                          ))
                        )}
                      </Form.Select>
                      <div className="form-text">
                        Seleccione la UNES para descargar su plano específico
                      </div>
                    </Form.Group>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="alert alert-info py-3 mb-4" style={{ backgroundColor: '#e7f1ff', borderColor: '#b6d4fe', color: '#084298' }}>
            <div className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm0-1.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
                <path d="M5.255 5.786a.75.75 0 0 1 1.06 1.06L6.31 10.44h3.38a.75.75 0 0 1 0 1.5H6.31l-2.005 3.59a.75.75 0 1 1-1.06-1.06l1.97-3.53H5.12a.75.75 0 0 1 0-1.5h3.39l-1.97-3.53a.75.75 0 0 1 .79-.786z"/>
              </svg>
              <span className="small">
                <strong>Nota:</strong> El plano se generará en formato Excel con la información actualizada de vacaciones.
              </span>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="bg-white p-3 border-0">
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          disabled={isDownloading}
        >
          Cerrar
        </Button>
        <Button 
          variant="primary" 
          className="px-4"
          onClick={handleDownload}
          disabled={isDownloading || (downloadType === 'unes' && !selectedUnesForDownload)}
          style={{ backgroundColor: '#003366' }}
        >
          {isDownloading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Descargando...
            </>
          ) : (
            'Descargar'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DownloadPlanoModal;