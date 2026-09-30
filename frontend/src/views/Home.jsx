import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Container, Card, Row, Col, Button, Table, Dropdown, Modal, Form } from 'react-bootstrap';
import { FaEllipsisV, FaUser, FaInfoCircle, FaCalendarCheck, FaClock, FaEdit, FaAngleDoubleRight, FaAngleRight, FaAngleLeft, FaAngleDoubleLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ApprovedEmployeesModal from '../components/ApprovedEmployeesModal';
import RejectedEmployeesModal from '../components/RejectedEmployeesModal';
import DownloadPlanoModal from '../components/DownloadPlanoModal';
import '../styles/Home.css';

const Home = () => {
  const { socket } = useSocket();
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectionDetailModal, setShowRejectionDetailModal] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showDownloadPlanoModal, setShowDownloadPlanoModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnes, setSelectedUnes] = useState(localStorage.getItem('userUnes') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [userDiasPendientes, setUserDiasPendientes] = useState(0);
  const [userUnesFechaCorte, setUserUnesFechaCorte] = useState(0);
  const [dataAsignacion, setDataAsignacion] = useState([]);
  const itemsPerPage = 10;
  const API_URL = 'http://127.0.0.1:5000';

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_URL}/pbi-colaborador-vacaciones?limit=1200`);
        const data = await response.json();
        if (data.ok) {
          setEmployees(data.data);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const uniqueUnes = [...new Set(employees.map(emp => emp.IDCia_CO?.toString().slice(-3)))].filter(Boolean);

  const [formData, setFormData] = useState({
    fechaIngreso: '',
    fechaInicio1: '',
    fechaFin1: '',
    totalDias1: 0,
    fechaInicio2: '',
    fechaFin2: '',
    totalDias2: 0,
    diaFamilia1: '',
    fechaInicio3: '',
    fechaFin3: '',
    totalDias3: 0,
    totalTomados: 0,
    saldoFinal: 0,
    observaciones: ''
  });

  const holidays = [
    '2026-12-06', '2026-12-08', '2026-12-13', '2026-12-20', '2026-12-24', '2026-12-25', '2026-12-27',
    '2027-01-01', '2027-01-03', '2027-01-10', '2027-01-11', '2027-01-17', '2027-01-24', '2027-01-31'
  ];

  const talentohumano = [
    {'correo':'talentohumano@gyj.com.co', 'nombre': 'Jessica Alexandra Diaz'},
    {'correo':'direccion_th@gyj.com.co', 'nombre': 'Carolina Rivera Vargas'},
    {'correo':'auxiliar.nomina@gyj.com.co', 'nombre': 'Kerrin Yesenia Collazos'}
  ];

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    
    if (startDate > endDate) return 0;

    let count = 0;
    let current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
      const dateString = current.toISOString().split('T')[0];
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 7;
      const isHoliday = holidays.includes(dateString);

      if (!isWeekend && !isHoliday) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const getEmployeeKey = (emp) => {
    return emp?.id ?? emp?.cedula ?? emp?.email ?? emp?.IDCia_CO;
  };

  const handleDateChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value };
    
    // Validation: Start date should not be greater than end date
    const checkValidation = (start, end) => {
      if (start && end && new Date(start) > new Date(end)) {
        Swal.fire({
          icon: 'error',
          title: 'Error en fechas',
          text: 'La fecha de inicio no puede ser posterior a la fecha fin.',
          confirmButtonColor: '#003366'
        });
        return false;
      }
      return true;
    };

    // Auto calculate days for each block
    if (field === 'fechaFin1' || field === 'fechaInicio1') {
      const start = updatedForm.fechaInicio1 || selectedEmployee?.inicioVacaciones;
      if (!checkValidation(start, updatedForm.fechaFin1)) return;
      updatedForm.totalDias1 = calculateDays(start, updatedForm.fechaFin1);
    }
    if (field === 'fechaInicio2' || field === 'fechaFin2') {
      if (!checkValidation(updatedForm.fechaInicio2, updatedForm.fechaFin2)) return;
      updatedForm.totalDias2 = calculateDays(updatedForm.fechaInicio2, updatedForm.fechaFin2);
    }
    if (field === 'fechaInicio3' || field === 'fechaFin3') {
      if (!checkValidation(updatedForm.fechaInicio3, updatedForm.fechaFin3)) return;
      updatedForm.totalDias3 = calculateDays(updatedForm.fechaInicio3, updatedForm.fechaFin3);
    }

    updatedForm.totalTomados = (Number(updatedForm.totalDias1) || 0) + (Number(updatedForm.totalDias2) || 0) + (Number(updatedForm.totalDias3) || 0);
    updatedForm.saldoFinal = (selectedEmployee?.diasPendientes || 0) - updatedForm.totalTomados;

    setFormData(updatedForm);
  };

  const handleSaveAsignacion = async () => {
    // Preparar datos para el backend
    const payload = {
      identificacion: selectedEmployee.cedula,
      empleado: selectedEmployee.Empleado,
      cargo: selectedEmployee.Cargo,
      desc_unes: selectedEmployee.DescCO,
      unes: selectedEmployee.IDCia_CO,
      correo: selectedEmployee.email,
      estado_asignacion: selectedEmployee.estado || 'pendiente',
      dias_a_corte: selectedEmployee.dias_vacaciones_corteDic,
      observaciones: formData.observaciones,
      motivo_rechazo: selectedEmployee.motivoRechazo || '',
      periodo1_fecha1: formData.fechaInicio1 || null,
      periodo1_fecha2: formData.fechaFin1 || null,
      periodo1_dias1: formData.totalDias1 || 0,
      periodo2_fecha1: formData.fechaInicio2 || null,
      periodo2_fecha2: formData.fechaFin2 || null,
      periodo2_dias2: formData.totalDias2 || 0,
      periodo3_fecha1: formData.fechaInicio3 || null,
      periodo3_fecha2: formData.fechaFin3 || null,
      periodo3_dias3: formData.totalDias3 || 0,
      fecha_regreso: formData.fechaIngreso || null,
      total_dias_empleado: (userDiasPendientes-formData.totalTomados).toFixed(1) || 0
    };

    try {
      const response = await fetch(`${API_URL}/registrar_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al guardar en el servidor');
      }

      // Emitir evento de notificación por socket
      if (socket && selectedEmployee) {
        socket.emit('assign_dates', { 
          unes: selectedEmployee.IDCia_CO?.toString().slice(-3) || 'N/A', 
          nombre: selectedEmployee.Empleado 
        });
      }
      
      const newPeriodos = [
        { inicio: formData.fechaInicio1, fin: formData.fechaFin1, dias: formData.totalDias1 },
        { inicio: formData.fechaInicio2, fin: formData.fechaFin2, dias: formData.totalDias2 },
        { inicio: formData.fechaInicio3, fin: formData.fechaFin3, dias: formData.totalDias3 }
      ];

      // Update only the selected employee in the local state
      const selectedKey = getEmployeeKey(selectedEmployee);
      setEmployees(employees.map(emp => 
        getEmployeeKey(emp) === selectedKey
          ? { 
              ...emp, 
              totalDiasTomados: formData.totalTomados, 
              saldoFinal: formData.saldoFinal, 
              observaciones: formData.observaciones, 
              periodos: newPeriodos,
              fechaIngreso: formData.fechaIngreso,
              diaFamilia1: formData.diaFamilia1
            } 
          : emp
      ));

      setSelectedEmployee(prev => prev ? {
        ...prev,
        totalDiasTomados: formData.totalTomados,
        saldoFinal: formData.saldoFinal,
        observaciones: formData.observaciones,
        periodos: newPeriodos,
        fechaIngreso: formData.fechaIngreso,
        diaFamilia1: formData.diaFamilia1
      } : prev);

      setShowAssignModal(false);
      Swal.fire('¡Éxito!', 'Las fechas han sido asignadas correctamente.', 'success');
      
    } catch (error) {
      console.error('Error saving assignment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la asignación en el servidor.',
        confirmButtonColor: '#003366'
      });
    }
  };

  const handleViewEmployee = (emp) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const handleAssignDates = (emp) => {
    setSelectedEmployee(emp);
    
    const p1 = emp.periodos?.[0] || {};
    const p2 = emp.periodos?.[1] || {};
    const p3 = emp.periodos?.[2] || {};
    setUserDiasPendientes(emp.dias_vacaciones_corteDic);
    setUserUnesFechaCorte(emp.IDCia_CO?.toString().slice(-3) || 'N/A');

    // Reset form for the selected employee, pre-loading saved values if available
    setFormData({
      fechaIngreso: emp.fechaIngreso || '',
      fechaInicio1: p1.inicio || '',
      fechaFin1: p1.fin || '',
      totalDias1: p1.dias || 0,
      fechaInicio2: p2.inicio || '',
      fechaFin2: p2.fin || '',
      totalDias2: p2.dias || 0,
      diaFamilia1: emp.diaFamilia1 || '',
      fechaInicio3: p3.inicio || '',
      fechaFin3: p3.fin || '',
      totalDias3: p3.dias || 0,
      totalTomados: emp.totalDiasTomados || 0,
      saldoFinal: emp.saldoFinal || emp.diasPendientes,
      observaciones: emp.observaciones || ''
    });
    setShowAssignModal(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'rechazada') {
      initiateReject(id);
      return;
    }

    const emp = employees.find(e => e.cedula === id);
    if (!emp) return;

    try {
      const p1 = emp.periodos?.[0] || {};
      const p2 = emp.periodos?.[1] || {};
      const p3 = emp.periodos?.[2] || {};

      const payload = {
        identificacion: emp.cedula,
        empleado: emp.Empleado,
        cargo: emp.Cargo,
        desc_unes: emp.DescCO,
        unes: emp.IDCia_CO,
        correo: emp.email,
        estado_asignacion: newStatus,
        dias_a_corte: emp.dias_vacaciones_corteDic,
        observaciones: emp.observaciones || '',
        motivo_rechazo: emp.motivoRechazo || '',
        th_asignacion: talentoHumanoUser?.nombre || '',
        periodo1_fecha1: p1.inicio || null,
        periodo1_fecha2: p1.fin || null,
        periodo1_dias1: p1.dias || 0,
        periodo2_fecha1: p2.inicio || null,
        periodo2_fecha2: p2.fin || null,
        periodo2_dias2: p2.dias || 0,
        periodo3_fecha1: p3.inicio || null,
        periodo3_fecha2: p3.fin || null,
        periodo3_dias3: p3.dias || 0,
        fecha_regreso: emp.fechaIngreso || null,
        total_dias_empleado: emp.totalDiasTomados || 0
      };

      const response = await fetch(`${API_URL}/registrar_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado en el servidor');
      }

      setEmployees(employees.map(e => 
        e.cedula === id ? { ...e, estado: newStatus, th_asignacion: talentoHumanoUser?.nombre } : e
      ));

      if (socket) {
        socket.emit('approve_request', { unes: emp.IDCia_CO?.toString().slice(-3) || 'N/A', nombre: emp.Empleado });
      }

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `La solicitud ha sido aprobada correctamente.`,
        confirmButtonColor: '#003366'
      });

    } catch (error) {
      console.error('Error changing status:', error);
      Swal.fire('Error', 'No se pudo actualizar el estado en el servidor.', 'error');
    }
  };

  const handleViewRejection = (emp) => {
    setSelectedEmployee(emp);
    setShowRejectionDetailModal(true);
  };

  const initiateReject = (id) => {
    setCurrentEmployeeId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      Swal.fire('Error', 'Debe ingresar un motivo para el rechazo.', 'error');
      return;
    }

    const targetEmployee = employees.find(emp => emp.cedula === currentEmployeeId);
    if (!targetEmployee) return;

    try {
      const p1 = targetEmployee.periodos?.[0] || {};
      const p2 = targetEmployee.periodos?.[1] || {};
      const p3 = targetEmployee.periodos?.[2] || {};

      const payload = {
        identificacion: targetEmployee.cedula,
        empleado: targetEmployee.Empleado,
        cargo: targetEmployee.Cargo,
        desc_unes: targetEmployee.DescCO,
        unes: targetEmployee.IDCia_CO,
        correo: targetEmployee.email,
        estado_asignacion: 'rechazada',
        dias_a_corte: targetEmployee.dias_vacaciones_corteDic,
        observaciones: targetEmployee.observaciones || '',
        motivo_rechazo: rejectionReason,
        th_asignacion: talentoHumanoUser?.nombre || '',
        periodo1_fecha1: p1.inicio || null,
        periodo1_fecha2: p1.fin || null,
        periodo1_dias1: p1.dias || 0,
        periodo2_fecha1: p2.inicio || null,
        periodo2_fecha2: p2.fin || null,
        periodo2_dias2: p2.dias || 0,
        periodo3_fecha1: p3.inicio || null,
        periodo3_fecha2: p3.fin || null,
        periodo3_dias3: p3.dias || 0,
        fecha_regreso: targetEmployee.fechaIngreso || null,
        total_dias_empleado: targetEmployee.totalDiasTomados || 0
      };

      const response = await fetch(`${API_URL}/registrar_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el rechazo en el servidor');
      }

      setEmployees(employees.map(emp => 
        emp.cedula === currentEmployeeId ? { ...emp, estado: 'rechazada', motivoRechazo: rejectionReason, th_asignacion: talentoHumanoUser?.nombre } : emp
      ));

      if (socket) {
        socket.emit('reject_request', { 
          unes: targetEmployee.IDCia_CO?.toString().slice(-3) || 'N/A', 
          nombre: targetEmployee.Empleado, 
          motivo: rejectionReason 
        });
      }

      setShowRejectModal(false);
      Swal.fire('Rechazada', 'La solicitud ha sido rechazada.', 'success');

    } catch (error) {
      console.error('Error rejecting request:', error);
      Swal.fire('Error', 'No se pudo registrar el rechazo en el servidor.', 'error');
    }
  }; 

  const userUnes = localStorage.getItem('userUnes') || '';
  const userEmail = (localStorage.getItem('userEmail') || '').toLowerCase();
  const talentoHumanoUser = talentohumano.find(th => th.correo.toLowerCase() === userEmail);
  const isTalentoHumano = !!talentoHumanoUser;
  
  const userEmployee = employees.find(emp => emp.IDCia_CO?.toString().slice(-3) === userUnes);
  const userDesc = userEmployee?.DescCO || '';
  
  /*const totalDaysBalance = employees.reduce((sum, emp) => {
    const balance = emp.saldoFinal !== undefined ? emp.saldoFinal : emp.diasPendientes;
    return sum + (Number(balance) || 0);
  }, 0);*/

  const filteredByUnes = selectedUnes 
    ? employees.filter(emp => emp.IDCia_CO?.toString().slice(-3) === selectedUnes.toString()) 
    : employees;

  let filteredEmployees;
  if (isTalentoHumano) {
    filteredEmployees = searchQuery.trim()
      ? filteredByUnes.filter(emp => {
          const q = searchQuery.toLowerCase();
          return (
            (emp.IDCia_CO && emp.IDCia_CO.toString().toLowerCase().includes(q)) ||
            (emp.Empleado && emp.Empleado.toString().toLowerCase().includes(q)) ||
            (emp.cedula && emp.cedula.toString().toLowerCase().includes(q))
          );
        })
      : filteredByUnes;
  } else {
    filteredEmployees = employees.filter(emp => emp.IDCia_CO?.toString().slice(-3) === userUnes.toString());
  }
  
  const totalEmployees = filteredEmployees.length;
  const approvedCount = filteredEmployees.filter(emp => emp.estado === 'aprobado').length;
  const rejectedCount = filteredEmployees.filter(emp => emp.estado === 'rechazada').length;

  // Verificar si todos los empleados están aprobados
  const allApproved = filteredEmployees.length > 0 && filteredEmployees.every(emp => emp.estado === 'aprobado');

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

  const getConfirmaFechasStyle = (estado) => {
    if (estado === 'aprobado') return { color: '#198754', fontWeight: 'bold' };
    if (estado === 'rechazada') return { color: '#dc3545', fontWeight: 'bold' };
    return { color: '#6c757d', fontWeight: 'bold' };
  };

  const getTotalDiasStyle = (total) => {
    const n = Number(total);
    if (Number.isFinite(n)) {
      if (n < 3) return { color: '#dc3545', fontWeight: 'bold' };
      if (n <= 5) return { color: '#ffc107', fontWeight: 'bold' };
      return { color: '#198754', fontWeight: 'bold' };
    }
    return {};
  };

  useEffect(() => {
    const fetchDataAsignacion = async () => {
      let unesFilter;
      
      if (isTalentoHumano) {
        // Para Talento Humano: si hay UNES seleccionada, usar esa; si es "Todas", no filtrar
        unesFilter = selectedUnes || 'todas';
      } else {
        // Para usuarios normales: usar su UNES
        unesFilter = userUnes;
      }
      
      if (!unesFilter) {
        setDataAsignacion({});
        return;
      }
      
      try {
        // Si es "todas", llamar endpoint sin filtro de UNES específico
        const url = unesFilter === 'todas' 
          ? `${API_URL}/obtener_data/2-todas`
          : `${API_URL}/obtener_data/2-${unesFilter}`;
          
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 404) {
            setDataAsignacion({});
            return;
          }
          throw new Error(`Error HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.ok) {
          setDataAsignacion(data.data);
        }
      } catch (error) {
        console.error('Error fetching data asignación:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataAsignacion();
  }, [userUnes, selectedUnes, isTalentoHumano]);

  const handleExportarReporte = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      // Determinar la UNES a filtrar según el rol
      let unesParam = '';
      if (isTalentoHumano) {
        unesParam = selectedUnes || '';
      } else {
        unesParam = userUnes || '';
      }

      // Construir URL: si hay UNES, agregar query param
      let url = `${API_URL}/exportar_reporte_pdf`;
      if (unesParam) {
        const unesQuery = unesParam.toString().startsWith('2-')
          ? unesParam.toString().slice(-3)
          : unesParam.toString();
        url += `?unes=${encodeURIComponent(unesQuery)}`;
      }

      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        let errMsg = 'No se pudo generar el reporte PDF.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      // Obtener nombre del archivo desde el header Content-Disposition
      const disposition = response.headers.get('Content-Disposition') || '';
      let filename = '2-vacaciones.pdf';
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      } else {
        // Fallback: armar nombre dinámico
        const unesPart = unesParam
          ? (unesParam.toString().startsWith('2-') ? unesParam.toString() : `2-${unesParam}`)
          : '2';
        filename = `${unesPart}_vacaciones.pdf`;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      Swal.fire({
        icon: 'success',
        title: 'Reporte generado',
        text: `El archivo ${filename} se ha descargado correctamente.`,
        confirmButtonColor: '#003366',
        timer: 2500
      });
    } catch (error) {
      console.error('Error exportando reporte:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al exportar',
        text: error.message || 'No se pudo generar el reporte PDF.',
        confirmButtonColor: '#003366'
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadPlano = async ({ type, unes }) => {
    try {
      let url = `${API_URL}/generar_plano`;
      let filename = 'plano_vacaciones_general.xlsx';

      if (type === 'unes' && unes) {
        url += `?type=unes&unes=${encodeURIComponent(unes)}`;
        filename = `plano_vacaciones_unes_${unes}.xlsx`;
      } else {
        url += `?type=general`;
      }

      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        let errMsg = 'No se pudo generar el plano Excel.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      // Obtener nombre del archivo desde el header Content-Disposition
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, message: `El archivo ${filename} se ha descargado correctamente.` };
    } catch (error) {
      console.error('Error descargando plano:', error);
      return { success: false, message: error.message || 'No se pudo descargar el plano.' };
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '20px' }}>

      <div style={{ backgroundColor: 'rgb(255, 204, 0)', padding: '8px 0' }}>
        <Container fluid className="px-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h4 className="fw-bold" style={{ color: '#000000', letterSpacing: '-0.5px', marginBottom: '5px' }}>
                PORTAL DE GESTION VACACIONES
              </h4>
              <p className="mb-0" style={{ color: '#000000', fontSize: '1rem' }}>
                Administra y asigna los días de vacaciones a los empleados.
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <div className="bg-white p-3 rounded-3 shadow-sm border-start border-primary border-4 d-inline-block">
                {/*<span className="text-muted small fw-bold text-uppercase d-block text-center">
                  {isTalentoHumano ? 'Departamento' : 'UNES'}
                </span>*/}
                <span className="fs-5 fw-bold" style={{ color: '#003366' }}>
                  {isTalentoHumano ? talentoHumanoUser.nombre : `${userUnes}${userDesc ? ` - ${userDesc}` : ''}`}
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="py-4 px-4">

        <Row className="g-4 mb-5">
          <Col md={3}>
            <Card className="border-0 shadow-sm text-center p-3" style={{ borderLeft: '5px solid #003366' }}>
              <div className="text-muted small fw-bold text-uppercase">Colaboradores</div>
              <div className="fs-2 fw-bold text-dark">{totalEmployees}</div>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm text-center p-3 position-relative" style={{ borderLeft: '5px solid #198754' }}>
              <div className="text-muted small fw-bold text-uppercase">Aprobadas</div>
              <div className="fs-2 fw-bold text-dark">{approvedCount}</div>
              {approvedCount > 0 && (
                <a
                  href="#"
                  role="button"
                  className="position-absolute fw-bold text-success text-decoration-none"
                  style={{ bottom: '8px', right: '12px', fontSize: '0.8rem', cursor: 'pointer', zIndex: 5 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowApprovedModal(true);
                  }}
                >
                  Ver más →
                </a>
              )}
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm text-center p-3 position-relative" style={{ borderLeft: '5px solid #dc3545' }}>
              <div className="text-muted small fw-bold text-uppercase">Rechazadas</div>
              <div className="fs-2 fw-bold text-dark">{rejectedCount}</div>
              {rejectedCount > 0 && (
                <a
                  href="#"
                  role="button"
                  className="position-absolute fw-bold text-danger text-decoration-none"
                  style={{ bottom: '8px', right: '12px', fontSize: '0.8rem', cursor: 'pointer', zIndex: 5 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRejectedModal(true);
                  }}
                >
                  Ver más →
                </a>
              )}
            </Card>
          </Col>
          {/*<Col md={3}>
            <Card className="border-0 shadow-sm text-center p-3" style={{ borderLeft: '5px solid #0dcaf0' }}>
              <div className="text-muted small fw-bold text-uppercase">Total Días</div>
              <div className="fs-2 fw-bold text-dark">{totalDaysBalance}</div>
            </Card>
          </Col>*/}
        </Row>

        {isTalentoHumano && (
          <Row className="mb-4 g-3">
            <Col md={6}>
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#dee2e6' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6c757d" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                  </svg>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Buscar por UNES, apellidos y nombres, o cédula..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ borderColor: '#dee2e6' }}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    style={{ borderColor: '#dee2e6' }}
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
            </Col>
            <Col md={2}>
              <Form.Select
                className="shadow-sm"
                value={selectedUnes}
                onChange={(e) => { setSelectedUnes(e.target.value); setCurrentPage(1); }}
                style={{ borderColor: '#dee2e6' }}
              >
                <option value="">Todas las UNES</option>
                {uniqueUnes.map(unes => (
                  <option key={unes} value={unes}>{unes}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        )}

        <Card className="border-0 shadow-sm overflow-hidden">
          <Card.Header className="bg-white py-3 border-0 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold" style={{ color: '#003366' }}>Listado de Empleados</h5>
            <div className="d-flex gap-2">
              {isTalentoHumano && (
                <Button
                  variant="primary"
                  size="sm"
                  className="px-4 rounded-pill"
                  style={{ backgroundColor: '#003366' }}
                  onClick={() => setShowDownloadPlanoModal(true)}
                >
                  Descargar Plano
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                className="px-4 rounded-pill"
                style={{ backgroundColor: '#003366' }}
                disabled={!isTalentoHumano || exportingPdf || !allApproved}
                onClick={handleExportarReporte}
                title={!isTalentoHumano ? 'Solo disponible para Talento Humano' : !allApproved ? 'Todos los empleados deben estar aprobados' : ''}
              >
                {exportingPdf ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generando...
                  </>
                ) : (
                  'Exportar Reporte'
                )}
              </Button>
            </div>
          </Card.Header>
          <div style={{ maxHeight: filteredEmployees.length > 10 ? '900px' : 'auto', overflowY: filteredEmployees.length > 10 ? 'auto' : 'visible' }} className={filteredEmployees.length > 10 ? 'scrollbar-hidden' : ''}>
            <Table hover className="align-middle mb-0 custom-table">
              <thead className="bg-light" style={{ position: filteredEmployees.length > 10 ? 'sticky' : 'static', top: 0, zIndex: 1 }}>
                <tr>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase">Cédula</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase">Empleado</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase">Desc. Unes</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase">Cargo</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase">Unes</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase text-center" style={{ width: '150px' }}>Vacaciones a Corte</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase text-center">Total dias</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase text-center">Estado</th>
                  <th className="py-3 px-4 text-muted small fw-bold text-uppercase text-center">Acciones</th>
                </tr>
              </thead>
              <tbody style={{fontSize: '13px'}}>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  currentEmployees.map((emp, index) => (
                    <tr key={index} className="border-bottom">
                      <td className="px-4 py-3 fw-medium">{emp.cedula || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-3" style={{ width: '38px', height: '38px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {emp.Empleado ? emp.Empleado.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="fw-bold text-dark mb-0">{emp.Empleado || '-'}</div>
                            <div className="text-dark mb-0">{emp.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{emp.DescCO}</td>
                      <td className="px-4 py-3 text-muted">{emp.Cargo || '-'}</td>
                      <td className="px-4 py-3"><span className="badge bg-light text-dark border fw-normal">{emp.IDCia_CO}</span></td>
                      <td className="px-4 py-3 text-center fw-bold text-primary">{emp.dias_vacaciones_corteDic ?? '-'}</td>
                       <td className="px-4 py-3 text-center">
                         {(() => {
                           // Calcular SALDO FINAL = dias_vacaciones_corteDic - totalDiasTomados
                           // Priorizar datos locales cuando se han asignado fechas
                           const diasCorte = Number(emp.dias_vacaciones_corteDic) || 0;
                           const localTomados = emp.totalDiasTomados;
                           const backendTomados = dataAsignacion?.[String(emp.cedula)]?.total_dias_empleado;
                           
                           // Usar total local si existe y es > 0, sino usar backend
                           const totalTomados = (localTomados !== undefined && localTomados !== null && Number(localTomados) > 0) 
                             ? Number(localTomados) 
                             : (backendTomados !== undefined && backendTomados !== null ? Number(backendTomados) : 0);
                           
                           // Si no se han asignado fechas (totalTomados = 0), mostrar 0.0
                           if (totalTomados === 0) {
                             return <span style={getTotalDiasStyle(0)}>0.0</span>;
                           }
                           
                           const saldoFinal = diasCorte - totalTomados;
                           const displayN = Number.isFinite(saldoFinal) ? saldoFinal.toFixed(1) : 0;
                           return <span style={getTotalDiasStyle(saldoFinal)}>{displayN}</span>;
                         })()}
                       </td>
                      <td className="px-4 py-3 text-center">
                        {emp.estado === 'aprobado' ? (
                          <FaCheckCircle className="text-success fs-4" title="Aprobado" />
                        ) : emp.estado === 'rechazada' ? (
                          <FaTimesCircle className="text-danger fs-4" style={{ cursor: 'pointer' }} title="Rechazada - Ver motivo" onClick={() => handleViewRejection(emp)} />
                        ) : (
                          <FaClock className="text-warning fs-4" title="Pendiente" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Dropdown align="end">
                          <Dropdown.Toggle as="button" className="btn btn-link p-2 cursor-pointer action-btn no-caret border-0 shadow-none">
                            <FaEllipsisV className="text-muted" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="border-0 shadow-sm py-2">
                            <Dropdown.Header className="text-uppercase small fw-bold pb-1" style={{ fontSize: '0.65rem' }}>Gestión</Dropdown.Header>
                            <Dropdown.Item onClick={() => handleViewEmployee(emp)} className="py-2"><span className="me-2">👁️</span> Ver Empleado</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleAssignDates(emp)} className="py-2"><span className="me-2">📅</span> Asignar Fechas</Dropdown.Item>
                            {isTalentoHumano && (
                              <>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleStatusChange(emp.cedula, 'aprobado')} className="py-2 text-success"><span className="me-2">✅</span> Aprobar</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange(emp.cedula, 'rechazada')} className="py-2 text-danger"><span className="me-2">❌</span> Rechazar</Dropdown.Item>
                              </>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <span className="text-muted small">Total de registros: {filteredEmployees.length}</span>
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="Ir al inicio"
              >
                <FaAngleDoubleLeft />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                title="Retroceder"
              >
                <FaAngleLeft />
              </Button>
              {totalPages > 0 && (
                <>
                  {currentPage > 2 && <span className="text-muted">...</span>}
                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    if (totalPages > 8) {
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            style={currentPage === page ? { backgroundColor: '#003366' } : {}}
                          >
                            {page}
                          </Button>
                        );
                      }
                      if ((page === currentPage - 2 && currentPage > 3) || (page === currentPage + 2 && currentPage < totalPages - 2)) {
                        return <span key={page} className="text-muted">...</span>;
                      }
                      return null;
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        style={currentPage === page ? { backgroundColor: '#003366' } : {}}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {currentPage < totalPages - 1 && totalPages > 8 && <span className="text-muted">...</span>}
                </>
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
                title="Avanzar"
              >
                <FaAngleRight />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(totalPages)}
                title="Ir al final"
              >
                <FaAngleDoubleRight />
              </Button>
            </div>
          </div>
        </Card>
      </Container>

      {/* Modal: Ver Empleado */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#003366' }}>Detalles del Empleado</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedEmployee && (
            <Row className="g-4">
              <Col md={4} className="text-center border-end">
                <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '100px', height: '100px', fontSize: '2rem', fontWeight: 'bold' }}>
                  <FaUser />
                </div>
                <h6 className="fw-bold mb-1">{selectedEmployee.Empleado}</h6>
                <p className="text-muted small">{selectedEmployee.Cargo}</p>
                <span className="badge bg-primary px-3 py-2 rounded-pill">UNES {selectedEmployee.unes}</span>
              </Col>
              <Col md={8}>
                <div className="mb-4">
                  <label className="text-muted small fw-bold text-uppercase d-block mb-1"><FaInfoCircle className="me-2" />Observaciones</label>
                  <p className="bg-light p-3 rounded border-start border-primary border-4">{selectedEmployee.observaciones}</p>
                </div>
                <Row className="g-3 text-center">
                  <Col md={4}>
                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Confirma Fechas</label>
                    <p className="fw-bold fs-6" style={getConfirmaFechasStyle(selectedEmployee.estado)}>
                      {selectedEmployee.estado === 'aprobado' ? 'Aprobado' : selectedEmployee.estado === 'rechazada' ? 'Rechazado' : 'Pendiente'}
                    </p>
                  </Col>
                  <Col md={4}>
                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Aplica licencia</label>
                    {(() => {
                      // Calcular saldo final para determinar si mostrar licencia no remunerada
                      const diasCorte = Number(selectedEmployee.dias_vacaciones_corteDic) || 0;
                      const localTomados = selectedEmployee.totalDiasTomados;
                      const backendTomados = dataAsignacion?.[String(selectedEmployee.cedula)]?.total_dias_empleado;
                      const totalTomados = (localTomados !== undefined && localTomados !== null && Number(localTomados) > 0) 
                        ? Number(localTomados) 
                        : (backendTomados !== undefined && backendTomados !== null ? Number(backendTomados) : 0);
                      const saldoFinal = diasCorte - totalTomados;
                      
                      // Si saldo final < 3, mostrar "licencia no remunerada" en rojo
                      if (saldoFinal < 3 && totalTomados > 0) {
                        return <p className="fw-bold fs-6 text-danger">licencia no remunerada</p>;
                      }
                      return <p className="fw-bold fs-6 text-warning">{selectedEmployee.diaNoRemunerado || 'No aplica'}</p>;
                    })()}
                  </Col>
                  <Col md={4}>
                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">Aprobado por</label>
                    <p className="fw-bold fs-6 text-success">
                      {selectedEmployee.th_asignacion 
                        ? `${selectedEmployee.th_asignacion}`
                        : (selectedEmployee.aprobadoPorGeovanny ? 'Aprobadas por Geovanny' : 'Pendiente de aprobación')}
                    </p>
                  </Col>
                  {selectedEmployee.estado === 'rechazada' && (
                    <Col md={12}>
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">
                        <FaTimesCircle className="me-2 text-danger" />Motivo del Rechazo
                      </label>
                      <div className="bg-light p-3 rounded border-start border-danger border-4" style={{ fontSize: '0.85rem', minHeight: '38px' }}>
                        {selectedEmployee.motivoRechazo || 'Sin motivo especificado.'}
                      </div>
                    </Col>
                  )}
                </Row>
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-0">Fechas Asignadas</label>
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => { setShowViewModal(false); handleAssignDates(selectedEmployee); }}
                      title="Editar fechas"
                    >
                      <FaEdit className="text-primary fs-5" />
                    </Button>
                  </div>
                  <Row className="g-3">
                    {selectedEmployee.periodos && selectedEmployee.periodos.map((periodo, idx) => (
                      <Col key={idx} md={4}>
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="p-3">
                            <div className="text-center mb-2">
                              <span className="text-muted small fw-bold text-uppercase">Periodo {idx + 1}</span>
                            </div>
                            <div className="text-center mb-2">
                              {periodo.inicio && periodo.fin ? (
                                <span className="text-dark fw-bold">{periodo.inicio} {periodo.fin}</span>
                              ) : (
                                <span className="text-muted">Sin fechas asignadas</span>
                              )}
                            </div>
                            <div className="text-center">
                              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold fs-6">
                                {periodo.dias} días
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <div className="d-flex justify-content-end mt-3">
                    <span className="text-muted small fw-bold">Total días tomados: </span>
                    <span className="fw-bold ms-2 text-success">{selectedEmployee.totalDiasTomados}</span>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Asignar Fechas */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered size="xl" scrollable>
        <Modal.Header closeButton className="bg-primary text-white p-4">
          <Modal.Title className="fw-bold"><FaCalendarCheck className="me-3" />Asignación de Fechas de Vacaciones</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-light">
          {selectedEmployee && (
            <Form>
              <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">Información de Programación - {selectedEmployee.nombre}</h6>
              
              <Row className="mb-4 g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">FECHA DE INGRESO</Form.Label>
                    <Form.Control type="date" className="border-0 shadow-sm" value={formData.fechaIngreso} onChange={(e) => setFormData({...formData, fechaIngreso: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  {userUnes === '106' ?
                    <Form.Group>
                      <Form.Label className="small fw-bold">DÍA DE LA FAMILIA</Form.Label>
                      <Form.Control type="date" className="border-0 shadow-sm" value={formData.diaFamilia1} onChange={(e) => setFormData({...formData, diaFamilia1: e.target.value})} />
                    </Form.Group>
                    :
                    ''
                  }
                </Col>
              </Row>

              <Row className="g-4">
                {/* Bloque 1 */}
                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h6 className="fw-bold text-muted mb-3">Periodo 1</h6>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">FECHA INICIO</Form.Label>
                        <Form.Control type="date" className="border-0 shadow-sm" value={formData.fechaInicio1} onChange={(e) => handleDateChange('fechaInicio1', e.target.value)} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">FECHA FIN</Form.Label>
                        <Form.Control type="date" className="border-0 shadow-sm" value={formData.fechaFin1} onChange={(e) => handleDateChange('fechaFin1', e.target.value)} />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label className="small fw-bold">TOTAL DÍAS</Form.Label>
                        <Form.Control type="number" className="border-0 bg-primary bg-opacity-10 fw-bold text-primary" value={formData.totalDias1} readOnly />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Bloque 2 */}
                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h6 className="fw-bold text-muted mb-3">Periodo 2</h6>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">FECHA INICIO 2</Form.Label>
                        <Form.Control type="date" className="border-0 shadow-sm" value={formData.fechaInicio2} onChange={(e) => handleDateChange('fechaInicio2', e.target.value)} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">FECHA FIN</Form.Label>
                        <Form.Control type="date" className="border-0 shadow-sm" value={formData.fechaFin2} onChange={(e) => handleDateChange('fechaFin2', e.target.value)} />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label className="small fw-bold">TOTAL DÍAS 3</Form.Label>
                        <Form.Control type="number" className="border-0 bg-primary bg-opacity-10 fw-bold text-primary" value={formData.totalDias2} readOnly />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Bloque 3 */}
                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h6 className="fw-bold text-muted mb-3">Periodo 3</h6>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">FECHA INICIO 4</Form.Label>
                        <Form.Control type="date" className="border-0 shadow-sm" value={formData.fechaInicio3} onChange={(e) => handleDateChange('fechaInicio3', e.target.value)} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">FECHA FIN</Form.Label>
                        <Form.Control type="date" className="border-0 shadow-sm" value={formData.fechaFin3} onChange={(e) => handleDateChange('fechaFin3', e.target.value)} />
                      </Form.Group>
                      <Form.Group>
                        <Form.Label className="small fw-bold">TOTAL DÍAS 6</Form.Label>
                        <Form.Control type="number" className="border-0 bg-primary bg-opacity-10 fw-bold text-primary" value={formData.totalDias3} readOnly />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="mt-4">
                <Col>
                  <Form.Group>
                    <Form.Label className="small fw-bold">OBSERVACIONES ADICIONALES</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      className="border-0 shadow-sm" 
                      placeholder="Ingrese anotaciones o comentarios sobre esta asignación..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-4 g-3">
                <Col md={6}>
                  <Card className="border-0 shadow-sm bg-primary text-white h-100">
                    <Card.Body className="d-flex align-items-center justify-content-between p-3">
                      <span className="fw-bold">TOTAL DIAS TOMADOS</span>
                      <span className="fs-4 fw-bold">{formData.totalTomados}</span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 shadow-sm bg-dark text-white h-100">
                    <Card.Body className="d-flex align-items-center justify-content-between p-3">
                      <span className="fw-bold">SALDO FINAL A 30 ENERO</span>
                      <span className="fs-4 fw-bold">
                        {
                          formData.totalTomados > 0 ? (userDiasPendientes-formData.totalTomados).toFixed(1) : 0
                        }
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-white p-3">
          <Button variant="outline-secondary" onClick={() => setShowAssignModal(false)}>Cancelar</Button>
          <Button variant="primary" className="px-4" onClick={handleSaveAsignacion} style={{ backgroundColor: '#003366' }}>Guardar Asignación</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Ver Motivo de Rechazo */}
      <Modal show={showRejectionDetailModal} onHide={() => setShowRejectionDetailModal(false)} centered>
        <Modal.Header closeButton className="border-0 bg-danger text-white">
          <Modal.Title className="fw-bold fs-6">Motivo del Rechazo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{fontSize: '13px'}}>
        <div className='rounded-3 shadow-sm border-start border-danger p-3 border-4' style={{fontSize: '16px'}}>
            <p className="text-muted fw-bold">{selectedEmployee?.motivoRechazo || 'Sin motivo especificado.'}</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowRejectionDetailModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Ver Empleados Aprobados */}
      <ApprovedEmployeesModal
        show={showApprovedModal}
        onHide={() => setShowApprovedModal(false)}
        employees={filteredEmployees}
        dataAsignacion={dataAsignacion}
        onViewEmployee={(emp) => {
          setShowApprovedModal(false);
          handleViewEmployee(emp);
        }}
      />

      {/* Modal: Ver Empleados Rechazados */}
      <RejectedEmployeesModal
        show={showRejectedModal}
        onHide={() => setShowRejectedModal(false)}
        employees={filteredEmployees}
        onViewEmployee={(emp) => {
          setShowRejectedModal(false);
          handleViewEmployee(emp);
        }}
        onViewRejection={(emp) => {
          setShowRejectedModal(false);
          handleViewRejection(emp);
        }}
      />

      {/* Modal: Ingresar Motivo de Rechazo */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold small">Justificación de Rechazo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group>
            <Form.Label className="small fw-bold">MOTIVO DEL RECHAZO</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={4} 
              placeholder="Describa brevemente la razón por la cual se rechaza esta solicitud..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="border-0 bg-light shadow-sm"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowRejectModal(false)}>Cancelar</Button>
          <Button variant="danger" size="sm" className="px-4" onClick={confirmReject}>Confirmar Rechazo</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Descargar Plano */}
      <DownloadPlanoModal
        show={showDownloadPlanoModal}
        onHide={() => setShowDownloadPlanoModal(false)}
        uniqueUnes={uniqueUnes}
        selectedUnes={selectedUnes}
        onDownload={handleDownloadPlano}
      />

    </div>
  );
};

export default Home;
