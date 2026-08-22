import os
import pyodbc
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuración de la base de datos (lectura - PBI)
DB_SERVER = os.getenv('DB_SERVER')
DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_DRIVER = os.getenv('DB_DRIVER')

def get_db_connection():
    try:
        conn_str = (
            f"DRIVER={DB_DRIVER};"
            f"SERVER={DB_SERVER};"
            f"DATABASE={DB_NAME};"
            f"UID={DB_USER};"
            f"PWD={DB_PASSWORD}"
        )
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        print(f"Error de conexión BD1: {e}")
        return None

# Configuración de la base de datos (escritura - vacacionesgyj)
DB_SERVER2 = os.getenv('DB_SERVER2')
DB_NAME2 = os.getenv('DB_NAME2')
DB_USER2 = os.getenv('DB_USER2')
DB_PASSWORD2 = os.getenv('DB_PASSWORD2')
DB_DRIVER2 = os.getenv('DB_DRIVER2')

def get_db_connection2():
    try:
        conn_str = (
            f"DRIVER={DB_DRIVER2};"
            f"SERVER={DB_SERVER2};"
            f"DATABASE={DB_NAME2};"
            f"UID={DB_USER2};"
            f"PWD={DB_PASSWORD2}"
        )
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        print(f"Error de conexión BD2: {e}")
        return None

def guardar_notificacion_db(unes, titulo, mensaje):
    """
    Guarda una notificación en la base de datos (BD2) y la emite por socket.
    Se usa para acciones como aprobado, rechazado y asignación de fechas.
    """
    conn = get_db_connection2()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO notificaciones (unes_notificacion, titulo, mensaje, leida)
                VALUES (?, ?, ?, 0)
            """, (unes, titulo, mensaje))
            conn.commit()
            cursor.close()
            conn.close()
            
            # Emitir la notificación en tiempo real a través de Socket.io
            send_notification(f"{titulo}: {mensaje}", unes=unes, type="success" if "Aprobado" in titulo else "info")
            return True
        except Exception as e:
            print(f"Error al guardar notificación en DB: {e}")
            return False
    return False

# Eventos de Socket.IO
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')
    emit('connected', {'message': 'Conectado al servidor de notificaciones'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

@socketio.on('approve_request')
def handle_approve_request(data):
    unes = data.get('unes')
    nombre = data.get('nombre')
    guardar_notificacion_db(unes, 'Solicitud Aprobada', f'La solicitud de {nombre} ha sido aprobada.')

@socketio.on('reject_request')
def handle_reject_request(data):
    unes = data.get('unes')
    nombre = data.get('nombre')
    motivo = data.get('motivo')
    guardar_notificacion_db(unes, 'Solicitud Rechazada', f'La solicitud de {nombre} fue rechazada. Motivo: {motivo}')

@socketio.on('assign_dates')
def handle_assign_dates(data):
    unes = data.get('unes')
    nombre = data.get('nombre')
    guardar_notificacion_db(unes, 'Fechas Asignadas', f'Se han asignado nuevas fechas de vacaciones para {nombre}.')

@socketio.on('request_notifications')
def handle_request_notifications():
    conn = get_db_connection2()
    notifications = []
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT TOP 20 
                    unes_notificacion, titulo, mensaje, leida, fecha_notificacion
                FROM notificaciones
                WHERE leida = 0
                ORDER BY fecha_notificacion DESC
            """)
            rows = cursor.fetchall()
            for row in rows:
                notifications.append({
                    'id': len(notifications) + 1,
                    'unes': row.unes_notificacion,
                    'text': row.mensaje,
                    'type': row.titulo,
                    'time': format_time(row.fecha_notificacion)
                })
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error al obtener notificaciones: {e}")
    emit('notifications', notifications)

def format_time(fecha):
    from datetime import datetime
    if not fecha:
        return 'Hace un momento'
    try:
        fecha_dt = datetime.strptime(str(fecha), '%Y-%m-%d %H:%M:%S')
        from datetime import timedelta
        diff = datetime.now() - fecha_dt
        if diff.total_seconds() < 60:
            return 'Hace un momento'
        elif diff.total_seconds() < 3600:
            mins = int(diff.total_seconds() / 60)
            return f'Hace {mins} min'
        elif diff.total_seconds() < 86400:
            hours = int(diff.total_seconds() / 3600)
            return f'Hace {hours} hora{"s" if hours > 1 else ""}'
        else:
            days = int(diff.total_seconds() / 86400)
            return f'Hace {days} día{"s" if days > 1 else ""}'
    except:
        return 'Hace un momento'

def send_notification(text, unes=None, type='info'):
    socketio.emit('new_notification', {
        'id': 1,
        'unes': unes,
        'text': text,
        'type': type,
        'time': 'Hace un momento'
    })

@app.route('/marcar_notificaciones_leidas', methods=['POST'])
def marcar_notificaciones_leidas():
    data = request.get_json(silent=True) or {}
    unes = data.get('unes')
    conn = get_db_connection2()
    if not conn:
        return jsonify({'ok': False, 'error': 'No se pudo conectar a vacacionesgyj'}), 500
    try:
        cursor = conn.cursor()
        if unes:
            cursor.execute(
                "UPDATE notificaciones SET leida = 1 WHERE leida = 0 AND unes_notificacion = ?",
                (str(unes),)
            )
        else:
            cursor.execute("UPDATE notificaciones SET leida = 1 WHERE leida = 0")
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'ok': True, 'message': 'Notificaciones marcadas como leídas'}), 200
    except Exception as e:
        print(f"Error al marcar notificaciones leídas: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/pbi-colaborador-vacaciones', methods=['GET'])
def get_pbi_colaborador_vacaciones():
    """Devuelve la información de BD_Integraciones.dbo.PBI_Colaborador_Vacaciones como API, fusionada con inf_asignacion."""

    limit = request.args.get('limit', default=100, type=int)
    if limit is None:
        limit = 100
    limit = max(1, min(limit, 1200))

    conn1 = get_db_connection()
    if not conn1:
        return jsonify({'ok': False, 'error': 'No se pudo conectar a BD_Integraciones'}), 500

    try:
        # 1. Obtener colaboradores de BD1
        cursor1 = conn1.cursor()
        query1 = f"SELECT TOP {limit} * FROM BD_Integraciones.dbo.PBI_Colaborador_Vacaciones"
        cursor1.execute(query1)
        rows1 = cursor1.fetchall()
        columns1 = [col[0] for col in (cursor1.description or [])]

        def serialize(value):
            if value is None:
                return None
            try:
                import decimal
                if isinstance(value, decimal.Decimal):
                    return float(value)
            except Exception:
                pass
            try:
                return value.isoformat()
            except Exception:
                return str(value)

        data = []
        for row in rows1:
            item = {}
            for i, col in enumerate(columns1):
                item[col] = serialize(row[i])
            data.append(item)
        
        cursor1.close()
        conn1.close()

        # 2. Obtener asignaciones de BD2
        asignaciones = {}
        conn2 = get_db_connection2()
        if conn2:
            try:
                cursor2 = conn2.cursor()
                cursor2.execute("SELECT * FROM inf_asignacion")
                rows2 = cursor2.fetchall()
                columns2 = [col[0] for col in (cursor2.description or [])]
                
                for row in rows2:
                    asig_item = {}
                    for i, col in enumerate(columns2):
                        asig_item[col] = row[i]
                    
                    ident = asig_item.get('identificacion')
                    if ident:
                        asignaciones[str(ident)] = asig_item
                cursor2.close()
                conn2.close()
            except Exception as e:
                print(f"Error al obtener asignaciones de BD2: {e}")

        # 3. Fusionar datos
        def format_date(val):
            if not val:
                return ''
            try:
                return val.strftime('%Y-%m-%d')
            except AttributeError:
                return str(val)[:10]

        for emp in data:
            cedula_str = str(emp.get('cedula', ''))
            if cedula_str in asignaciones:
                match = asignaciones[cedula_str]
                emp['estado'] = match.get('estado_asignacion') or 'pendiente'
                emp['totalDiasTomados'] = match.get('total_dias_empleado') or 0
                emp['observaciones'] = match.get('observaciones') or ''
                emp['fechaIngreso'] = format_date(match.get('fecha_regreso'))
                emp['diaFamilia1'] = format_date(match.get('dia_familia1'))
                emp['diaFamilia2'] = format_date(match.get('dia_familia2'))
                emp['motivoRechazo'] = match.get('motivo_rechazo') or ''
                
                emp['periodos'] = [
                    {
                        'inicio': format_date(match.get('periodo1_fecha1')),
                        'fin': format_date(match.get('periodo1_fecha2')),
                        'dias': match.get('periodo1_dias1') or 0
                    },
                    {
                        'inicio': format_date(match.get('periodo2_fecha1')),
                        'fin': format_date(match.get('periodo2_fecha2')),
                        'dias': match.get('periodo2_dias2') or 0
                    },
                    {
                        'inicio': format_date(match.get('periodo3_fecha1')),
                        'fin': format_date(match.get('periodo3_fecha2')),
                        'dias': match.get('periodo3_dias3') or 0
                    }
                ]
            else:
                emp['estado'] = 'pendiente'
                emp['totalDiasTomados'] = 0
                emp['observaciones'] = ''
                emp['fechaIngreso'] = ''
                emp['diaFamilia1'] = ''
                emp['diaFamilia2'] = ''
                emp['motivoRechazo'] = ''
                emp['periodos'] = [
                    {'inicio': '', 'fin': '', 'dias': 0},
                    {'inicio': '', 'fin': '', 'dias': 0},
                    {'inicio': '', 'fin': '', 'dias': 0}
                ]

        return jsonify({'ok': True, 'count': len(data), 'data': data}), 200
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/registrar_data', methods=['POST'])
def registrar_data():
    conn = get_db_connection2()
    if not conn:
        return jsonify({'ok': False, 'error': 'No se pudo conectar a vacacionesgyj'}), 500
    try:
        data = request.get_json() or {}
        
        identificacion = data.get('identificacion')
        empleado = data.get('empleado')
        cargo = data.get('cargo')
        desc_unes = data.get('desc_unes')
        unes = data.get('unes')
        correo = data.get('correo')
        estado_asignacion = data.get('estado_asignacion', 'pendiente')
        dias_a_corte = data.get('dias_a_corte', 0)
        observaciones = data.get('observaciones')
        
        periodo1_fecha1 = data.get('periodo1_fecha1')
        periodo1_fecha2 = data.get('periodo1_fecha2')
        periodo1_dias1 = data.get('periodo1_dias1', 0)
        
        periodo2_fecha1 = data.get('periodo2_fecha1')
        periodo2_fecha2 = data.get('periodo2_fecha2')
        periodo2_dias2 = data.get('periodo2_dias2', 0)
        
        periodo3_fecha1 = data.get('periodo3_fecha1')
        periodo3_fecha2 = data.get('periodo3_fecha2')
        periodo3_dias3 = data.get('periodo3_dias3', 0)
        
        fecha_regreso = data.get('fecha_regreso')
        total_dias_empleado = data.get('total_dias_empleado', 0)

        # Convert empty strings to None (NULL in SQL Server)
        def to_db_val(val, is_number=False):
            if val == '' or val is None:
                return None
            if is_number:
                try:
                    return int(val)
                except ValueError:
                    try:
                        return float(val)
                    except ValueError:
                        return 0
            return val

        identificacion = to_db_val(identificacion, is_number=True)
        dias_a_corte = to_db_val(dias_a_corte, is_number=True)
        periodo1_dias1 = to_db_val(periodo1_dias1, is_number=True)
        periodo2_dias2 = to_db_val(periodo2_dias2, is_number=True)
        periodo3_dias3 = to_db_val(periodo3_dias3, is_number=True)
        total_dias_empleado = to_db_val(total_dias_empleado, is_number=True)

        periodo1_fecha1 = to_db_val(periodo1_fecha1)
        periodo1_fecha2 = to_db_val(periodo1_fecha2)
        periodo2_fecha1 = to_db_val(periodo2_fecha1)
        periodo2_fecha2 = to_db_val(periodo2_fecha2)
        periodo3_fecha1 = to_db_val(periodo3_fecha1)
        periodo3_fecha2 = to_db_val(periodo3_fecha2)
        fecha_regreso = to_db_val(fecha_regreso)

        cursor = conn.cursor()
        
        # Check if record already exists
        cursor.execute("SELECT 1 FROM inf_asignacion WHERE identificacion = ?", (identificacion,))
        exists = cursor.fetchone()
        
        if exists:
            query = """
                UPDATE inf_asignacion
                SET empleado = ?,
                    cargo = ?,
                    desc_unes = ?,
                    unes = ?,
                    correo = ?,
                    estado_asignacion = ?,
                    dias_a_corte = ?,
                    observaciones = ?,
                    periodo1_fecha1 = ?,
                    periodo1_fecha2 = ?,
                    periodo1_dias1 = ?,
                    periodo2_fecha1 = ?,
                    periodo2_fecha2 = ?,
                    periodo2_dias2 = ?,
                    periodo3_fecha1 = ?,
                    periodo3_fecha2 = ?,
                    periodo3_dias3 = ?,
                    fecha_regreso = ?,
                    total_dias_empleado = ?,
                    fecha_update = GETDATE()
                WHERE identificacion = ?
            """
            cursor.execute(query, (
                empleado, cargo, desc_unes, unes, correo, estado_asignacion,
                dias_a_corte, observaciones,
                periodo1_fecha1, periodo1_fecha2, periodo1_dias1,
                periodo2_fecha1, periodo2_fecha2, periodo2_dias2,
                periodo3_fecha1, periodo3_fecha2, periodo3_dias3,
                fecha_regreso, total_dias_empleado, identificacion
            ))
        else:
            query = """
                INSERT INTO inf_asignacion
                (
                    identificacion, empleado, cargo, desc_unes, unes, correo, estado_asignacion,
                    dias_a_corte, observaciones, 
                    periodo1_fecha1, periodo1_fecha2, periodo1_dias1,
                    periodo2_fecha1, periodo2_fecha2, periodo2_dias2,
                    periodo3_fecha1, periodo3_fecha2, periodo3_dias3,
                    fecha_regreso, total_dias_empleado,
                    fecha_registro
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
            """
            cursor.execute(query, (
                identificacion, empleado, cargo, desc_unes, unes, correo, estado_asignacion,
                dias_a_corte, observaciones,
                periodo1_fecha1, periodo1_fecha2, periodo1_dias1,
                periodo2_fecha1, periodo2_fecha2, periodo2_dias2,
                periodo3_fecha1, periodo3_fecha2, periodo3_dias3,
                fecha_regreso, total_dias_empleado
            ))
            
        conn.commit()
        return jsonify({'ok': True, 'message': 'Datos registrados correctamente'}), 200
    except Exception as e:
        print(f"Error en registrar_data: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

@app.route('/ver_data/<int:identificacion>', methods=['GET'])
def ver_data(identificacion):
    conn = get_db_connection2()
    if not conn:
        return jsonify({'ok': False, 'error': 'No se pudo conectar a vacacionesgyj'}), 500
    try:
        cursor1 = conn.cursor()
        # Solo columnas relevantes (para el nuevo modal de edición)
        query1 = """
            SELECT
                identificacion,
                empleado,
                cargo,
                desc_unes,
                unes,
                correo,
                estado_asignacion,
                dias_a_corte,
                observaciones,
                dia_familia1,
                dia_familia2,
                periodo1_fecha1,
                periodo1_fecha2,
                periodo1_dias1,
                periodo2_fecha1,
                periodo2_fecha2,
                periodo2_dias2,
                periodo3_fecha1,
                periodo3_fecha2,
                periodo3_dias3,
                fecha_regreso,
                total_dias_empleado,
                fecha_registro,
                fecha_update
            FROM inf_asignacion
            WHERE identificacion = ?
        """
        cursor1.execute(query1, (identificacion,))
        rows1 = cursor1.fetchall()
        columns1 = [col[0] for col in (cursor1.description or [])]

        def format_date(val):
            if val is None or val == '':
                return ''
            try:
                return val.strftime('%Y-%m-%d')
            except AttributeError:
                # Si ya viene como string
                return str(val)[:10]

        def format_datetime(val):
            if val is None or val == '':
                return ''
            try:
                return val.strftime('%Y-%m-%d %H:%M:%S')
            except AttributeError:
                return str(val)[:19]

        data = []
        for row in rows1:
            emp = dict(zip(columns1, row))

            # Campos estrictamente pedidos
            emp['dias_a_corte'] = float(emp.get('dias_a_corte') or 0)
            emp['total_dias_empleado'] = float(emp.get('total_dias_empleado') or 0)
            emp['observaciones'] = emp.get('observaciones') or ''

            emp['periodo1_fecha1'] = format_date(emp.get('periodo1_fecha1'))
            emp['periodo1_fecha2'] = format_date(emp.get('periodo1_fecha2'))
            emp['periodo2_fecha1'] = format_date(emp.get('periodo2_fecha1'))
            emp['periodo2_fecha2'] = format_date(emp.get('periodo2_fecha2'))
            emp['periodo3_fecha1'] = format_date(emp.get('periodo3_fecha1'))
            emp['periodo3_fecha2'] = format_date(emp.get('periodo3_fecha2'))
            emp['fecha_regreso'] = format_date(emp.get('fecha_regreso'))

            # Campos usados por la UI de asignación
            emp['diaFamilia1'] = format_date(emp.get('dia_familia1'))
            emp['diaFamilia2'] = format_date(emp.get('dia_familia2'))

            emp['fecha_registro'] = format_datetime(emp.get('fecha_registro'))
            emp['fecha_update'] = format_datetime(emp.get('fecha_update'))

            # Alias/estructura para reutilizar la UI actual (periodos + nombres usados en Home.jsx)
            emp['estado'] = emp.get('estado_asignacion') or 'pendiente'
            emp['totalDiasTomados'] = emp.get('total_dias_empleado') or 0
            emp['fechaIngreso'] = emp.get('fecha_regreso')
            emp['periodos'] = [
                {
                    'inicio': emp.get('periodo1_fecha1'),
                    'fin': emp.get('periodo1_fecha2'),
                    'dias': emp.get('periodo1_dias1') or 0
                },
                {
                    'inicio': emp.get('periodo2_fecha1'),
                    'fin': emp.get('periodo2_fecha2'),
                    'dias': emp.get('periodo2_dias2') or 0
                },
                {
                    'inicio': emp.get('periodo3_fecha1'),
                    'fin': emp.get('periodo3_fecha2'),
                    'dias': emp.get('periodo3_dias3') or 0
                }
            ]

            data.append(emp)

        return jsonify({'ok': True, 'data': data}), 200
    except Exception as e:
        print(f"Error en registrar_data: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

@app.route('/actualizar_data/<int:identificacion>', methods=['PUT'])
def actualizar_data(identificacion):
    conn = get_db_connection2()
    if not conn:
        return jsonify({'ok': False, 'error': 'No se pudo conectar a vacacionesgyj'}), 500

    try:
        payload = request.get_json() or {}

        empleado = payload.get('empleado')
        cargo = payload.get('cargo')
        desc_unes = payload.get('desc_unes')
        unes = payload.get('unes')
        correo = payload.get('correo')
        estado_asignacion = payload.get('estado_asignacion', 'pendiente')
        dias_a_corte = payload.get('dias_a_corte', 0)
        observaciones = payload.get('observaciones')

        periodo1_fecha1 = payload.get('periodo1_fecha1')
        periodo1_fecha2 = payload.get('periodo1_fecha2')
        periodo1_dias1 = payload.get('periodo1_dias1', 0)

        periodo2_fecha1 = payload.get('periodo2_fecha1')
        periodo2_fecha2 = payload.get('periodo2_fecha2')
        periodo2_dias2 = payload.get('periodo2_dias2', 0)

        periodo3_fecha1 = payload.get('periodo3_fecha1')
        periodo3_fecha2 = payload.get('periodo3_fecha2')
        periodo3_dias3 = payload.get('periodo3_dias3', 0)

        fecha_regreso = payload.get('fecha_regreso')
        dia_familia1 = payload.get('dia_familia1')
        dia_familia2 = payload.get('dia_familia2')
        total_dias_empleado = payload.get('total_dias_empleado', 0)
        motivo_rechazo = payload.get('motivo_rechazo')

        def to_db_val(val, is_number=False):
            if val == '' or val is None:
                return None
            if is_number:
                try:
                    return int(val)
                except ValueError:
                    try:
                        return float(val)
                    except ValueError:
                        return 0
            return val

        dias_a_corte = to_db_val(dias_a_corte, is_number=True)
        periodo1_dias1 = to_db_val(periodo1_dias1, is_number=True)
        periodo2_dias2 = to_db_val(periodo2_dias2, is_number=True)
        periodo3_dias3 = to_db_val(periodo3_dias3, is_number=True)
        total_dias_empleado = to_db_val(total_dias_empleado, is_number=True)

        periodo1_fecha1 = to_db_val(periodo1_fecha1)
        periodo1_fecha2 = to_db_val(periodo1_fecha2)
        periodo2_fecha1 = to_db_val(periodo2_fecha1)
        periodo2_fecha2 = to_db_val(periodo2_fecha2)
        periodo3_fecha1 = to_db_val(periodo3_fecha1)
        periodo3_fecha2 = to_db_val(periodo3_fecha2)
        fecha_regreso = to_db_val(fecha_regreso)
        dia_familia1 = to_db_val(dia_familia1)
        dia_familia2 = to_db_val(dia_familia2)
        observaciones = to_db_val(observaciones)
        motivo_rechazo = to_db_val(motivo_rechazo)

        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM inf_asignacion WHERE identificacion = ?", (identificacion,))
        exists = cursor.fetchone()
        if not exists:
            return jsonify({'ok': False, 'error': 'Registro no encontrado'}), 404

        query = """
            UPDATE inf_asignacion
            SET empleado = ?,
                cargo = ?,
                desc_unes = ?,
                unes = ?,
                correo = ?,
                estado_asignacion = ?,
                dias_a_corte = ?,
                observaciones = ?,
                periodo1_fecha1 = ?,
                periodo1_fecha2 = ?,
                periodo1_dias1 = ?,
                periodo2_fecha1 = ?,
                periodo2_fecha2 = ?,
                periodo2_dias2 = ?,
                periodo3_fecha1 = ?,
                periodo3_fecha2 = ?,
                periodo3_dias3 = ?,
                fecha_regreso = ?,
                dia_familia1 = ?,
                dia_familia2 = ?,
                total_dias_empleado = ?,
                motivo_rechazo = ?,
                fecha_update = GETDATE()
            WHERE identificacion = ?
        """

        cursor.execute(query, (
            empleado, cargo, desc_unes, unes, correo, estado_asignacion,
            dias_a_corte, observaciones,
            periodo1_fecha1, periodo1_fecha2, periodo1_dias1,
            periodo2_fecha1, periodo2_fecha2, periodo2_dias2,
            periodo3_fecha1, periodo3_fecha2, periodo3_dias3,
            fecha_regreso, dia_familia1, dia_familia2,
            total_dias_empleado, motivo_rechazo,
            identificacion
        ))

        conn.commit()
        return jsonify({'ok': True, 'message': 'Datos actualizados correctamente'}), 200
    except Exception as e:
        print(f"Error en actualizar_data: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

@app.route('/obtener_data/<string:unes>', methods=['GET'])
def obtener_data(unes):
    conn = get_db_connection2()
    if not conn:
        return jsonify({'ok': False, 'error': 'No se pudo conectar a vacacionesgyj'}), 500
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM inf_asignacion WHERE unes = ?"
        cursor.execute(query, (unes,))
        rows = cursor.fetchall()
        if not rows:
            return jsonify({'ok': False, 'error': 'Registro no encontrado'}), 404
        columns = [col[0] for col in (cursor.description or [])]
        data = {item['identificacion']: item for item in [dict(zip(columns, row)) for row in rows]}
        return jsonify({'ok': True, 'data': data}), 200
    except Exception as e:
        print(f"Error en obtener_data: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

if __name__ == '__main__':
    port = int(os.getenv('PORT2', 5000))
    debug2 = os.getenv('DEBUG2', 'True') == 'True'
    socketio.run(app, host='127.0.0.1', port=port, debug=debug2)
