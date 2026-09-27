# Especificación Técnica de Estructura y Estilos PDF: Formato Vacaciones (Basado en 2-106 PETROLEOS)

Este documento contiene las instrucciones precisas de estructura, diseño CSS, HTML y código Python para que el Agente de IA o desarrollador genere reportes PDF que **respeten exactamente la maquetación visual y formato del archivo de referencia (`2-106 PETROLEOS.pdf`)**, evitando la deformación de celdas y saltos de línea indeseados vistos en `2-123_vacaciones.pdf`.

---

## 1. Diagnóstico de Errores del PDF Incorrecto (`2-123_vacaciones.pdf`)

1. **Orientación de Página Incorrecta:** Se generó en formato Vertical (`Portrait`), lo que provocó que 23 columnas intentaran comprimirse en ~210mm, destruyendo las celdas, superponiendo texto y rompiendo cada palabra en líneas verticales.
2. **Falta de Reglas de Salto de Página:** Encabezados repetidos sin control y ruptura desordenada de la tabla a lo largo del documento.
3. **Mapeo Incorrecto de Encabezados:** Celdas desalineadas entre el Nivel 1 (Super-encabezados) y Nivel 2 (Columnas).
4. **Falta de Estilos CSS Contenidos:** Ausencia de `white-space: nowrap` en campos clave (cédulas, fechas, totales) y de `table-layout: fixed` con anchos definidos.

---

## 2. Especificación de Diseño y Formato del PDF Original (`2-106 PETROLEOS.pdf`)

### 2.1 Configuración Global de Página (CSS `@page`)
```css
@page {
    size: A4 landscape; /* MANTENER SIEMPRE HORIZONTAL */
    margin: 8mm 6mm 8mm 6mm; /* Margen mínimo para maximizar área imprimible (297mm x 210mm) */
}

body {
    font-family: Arial, Helvetica, sans-serif;
    margin: 0;
    padding: 0;
    font-size: 6.5pt; /* Tamaño óptimo para 23 columnas */
    color: #000000;
}
```

---

### 2.2 Estructura Jerárquica de la Tabla

La tabla debe construirse con HTML estricto (`<table>`, `<thead>`, `<tbody>`), asegurando que las combinaciones de columnas (`colspan`) coincidan exactamente con la Fila 2:

```html
<table class="vacaciones-table">
    <thead>
        <!-- FILA 1: Super-Encabezados -->
        <tr class="row-superheader">
            <th colspan="7" class="header-blue">FORMATO VACACIONES</th>
            <th colspan="3" class="header-green">PRIMER CORTE 28 DE NOVIEMBRE AL 6 DICIEMBRE<br>FECHA DE PAGO 28 DE NOVIEMBRE</th>
            <th colspan="3" class="header-green">SEGUNDO CORTE 7 AL 18 DE DICIEMBRE<br>FECHA DE PAGO 15 DE DICIEMBRE</th>
            <th class="header-green">24 DE DICIEMBRE UNES</th>
            <th colspan="3" class="header-green">TERCER CORTE 19 DE DICEMBRE AL 12 DE ENERO<br>ARCHIVO PLANO DIFERENTE FECHA DE PAGO 29 DICIEMBRE</th>
            <th class="header-green">31 DE DICIEMBRE UNES</th>
            <th colspan="5" class="header-transparent"></th>
        </tr>
        <!-- FILA 2: Encabezados de Columnas -->
        <tr class="row-colnames">
            <th style="width: 5.5%;">CEDULA</th>
            <th style="width: 11%;">APELLIDOS Y NOMBRES</th>
            <th style="width: 10%;">CARGO</th>
            <th style="width: 3.5%;">UNES</th>
            <th style="width: 5.5%;">FECHA DE INGRESO</th>
            <th style="width: 9%;">Correo personal de la persona (notificacion)</th>
            <th style="width: 4%;">DIAS PENDIENTES DE VACACIONES</th>
            <th style="width: 5%;">FECHA DE INICIO DE VACACIONES</th>
            <th style="width: 5%;">FECHA FIN DE VACACIONES</th>
            <th style="width: 3%;">TOTAL DÍAS</th>
            <th style="width: 5%;">FECHA DE INICIO DE VACACIONES2</th>
            <th style="width: 5%;">FECHA DE TERMINACIÓN DE VACACIONES</th>
            <th style="width: 3%;">TOTAL DÍAS3</th>
            <th style="width: 4.5%;">DIA DE LA FAMILIA</th>
            <th style="width: 5%;">FECHA DE INICIO DE VACACIONES4</th>
            <th style="width: 5%;">FECHA DE TERMINACIÓN DE VACACIONES5</th>
            <th style="width: 3%;">TOTAL DÍAS6</th>
            <th style="width: 4.5%;">DÍA DE LA FAMILIA 7</th>
            <th style="width: 3.5%;">TOTAL DIAS TOMADOS</th>
            <th style="width: 3.5%;">SALDO FINAL A 30 ENERO</th>
            <th style="width: 5.5%;">FECHA DE INGRESO LABORAL (REGRESO A TU LUGAR DE TRABAJO)</th>
            <th style="width: 8%;">OBSERVACIONES</th>
            <th style="width: 4%;">FIRMA</th>
        </tr>
    </thead>
    <tbody>
        <!-- FILAS DE REGISTROS (DATO POR DATO) -->
    </tbody>
</table>
```

---

### 2.3 Reglas de Estilo CSS de la Tabla

```css
table.vacaciones-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Obliga a la tabla a respetar los anchos definidos */
}

/* Estilos de Celda General */
table.vacaciones-table th,
table.vacaciones-table td {
    border: 0.5pt solid #B0C4DE; /* Borde delgado y limpio */
    padding: 3px 2px;
    text-align: center;
    vertical-align: middle;
    word-wrap: break-word; /* Permite salto de línea en texto largo como nombres o cargos */
    font-size: 6.2pt;
}

/* Colores de Encabezados */
.header-blue {
    background-color: #0070C0 !important;
    color: #FFFFFF !important;
    font-weight: bold;
    font-size: 7.5pt;
    text-align: center;
}

.header-green {
    background-color: #00B050 !important;
    color: #FFFFFF !important;
    font-weight: bold;
    font-size: 6.5pt;
    text-align: center;
}

.row-colnames th {
    background-color: #0070C0;
    color: #FFFFFF;
    font-weight: bold;
    font-size: 6pt;
    line-height: 1.1;
    text-transform: uppercase;
}

/* Estilos de Datos */
.nowrap {
    white-space: nowrap; /* Evita que fechas, números o cédulas se dividan en varias líneas */
}

.text-left {
    text-align: left !important;
    padding-left: 3px;
}

.bg-zebra {
    background-color: #F8FAFC;
}

.col-total {
    font-weight: bold;
    background-color: #E6F0FA;
}
```

---

## 3. Lógica de Fórmulas para Python

Al procesar el DataFrame o lista de diccionarios en Python antes de renderizar el HTML para WeasyPrint:

1. **Total Días Tomados:**
   $$	ext{Total Tomados} = 	ext{Días Periodo 1} + 	ext{Días Periodo 2} + 	ext{Días Periodo 3}$$
2. **Saldo Final a 30 de Enero:**
   $$	ext{Saldo Final} =  egin{cases} 0 & 	ext{si Total Tomados} = 0 \ 	ext{Días Pendientes} - 	ext{Total Tomados} & 	ext{en otro caso} \end{cases}$$
3. **Formato de Fechas:** Las fechas vacías deben mostrarse como celdas vacías (`""`), no como `NaN`, `None` o `0`. Las fechas válidas deben ir en formato `DD/MM/YYYY` o `YYYY-MM-DD`.

---

## 4. Código Python de Referencia para Generar el PDF

```python
import pandas as pd
from weasyprint import HTML

def generar_pdf_vacaciones(datos_empleados, ruta_salida_pdf):
    # 1. Construir filas de la tabla HTML
    rows_html = ""
    for idx, emp in enumerate(datos_empleados):
        zebra_class = "bg-zebra" if idx % 2 == 1 else ""
        
        # Formatear valores
        cedula = str(emp.get('cedula', ''))
        nombre = str(emp.get('nombre', '')).upper()
        cargo = str(emp.get('cargo', '')).upper()
        unes = str(emp.get('unes', ''))
        fecha_ingreso = str(emp.get('fecha_ingreso', ''))
        correo = str(emp.get('correo', ''))
        dias_pendientes = emp.get('dias_pendientes', 0)
        
        # Periodos
        p1_ini = emp.get('p1_inicio', '')
        p1_fin = emp.get('p1_fin', '')
        p1_dias = emp.get('p1_dias', 0)
        
        p2_ini = emp.get('p2_inicio', '')
        p2_fin = emp.get('p2_fin', '')
        p2_dias = emp.get('p2_dias', 0)
        dia_fam1 = emp.get('dia_familia1', '')
        
        p3_ini = emp.get('p3_inicio', '')
        p3_fin = emp.get('p3_fin', '')
        p3_dias = emp.get('p3_dias', 0)
        dia_fam2 = emp.get('dia_familia2', '')
        
        # Totales calculados
        total_tomados = p1_dias + p2_dias + p3_dias
        saldo_final = 0 if total_tomados == 0 else (dias_pendientes - total_tomados)
        fecha_regreso = emp.get('fecha_regreso', '')
        obs = emp.get('observaciones', '')

        rows_html += f'''
        <tr class="{zebra_class}">
            <td class="nowrap">{cedula}</td>
            <td class="text-left">{nombre}</td>
            <td class="text-left">{cargo}</td>
            <td class="nowrap">{unes}</td>
            <td class="nowrap">{fecha_ingreso}</td>
            <td class="text-left">{correo}</td>
            <td>{dias_pendientes}</td>
            <td class="nowrap">{p1_ini}</td>
            <td class="nowrap">{p1_fin}</td>
            <td>{p1_dias}</td>
            <td class="nowrap">{p2_ini}</td>
            <td class="nowrap">{p2_fin}</td>
            <td>{p2_dias}</td>
            <td class="nowrap">{dia_fam1}</td>
            <td class="nowrap">{p3_ini}</td>
            <td class="nowrap">{p3_fin}</td>
            <td>{p3_dias}</td>
            <td class="nowrap">{dia_fam2}</td>
            <td class="col-total">{total_tomados}</td>
            <td class="col-total">{saldo_final}</td>
            <td class="nowrap">{fecha_regreso}</td>
            <td class="text-left">{obs}</td>
            <td></td>
        </tr>
        '''

    # 2. Ensamblar HTML completo con plantilla y estilos estritos
    full_html = f'''<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4 landscape;
                margin: 6mm;
            }}
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                font-size: 6pt;
            }}
            table.vacaciones-table {{
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
            }}
            th, td {{
                border: 0.4pt solid #999999;
                padding: 2px 1px;
                text-align: center;
                vertical-align: middle;
                word-wrap: break-word;
                font-size: 5.8pt;
            }}
            .header-blue {{ background-color: #0070C0; color: white; font-weight: bold; font-size: 7.5pt; }}
            .header-green {{ background-color: #00B050; color: white; font-weight: bold; font-size: 6.5pt; }}
            .row-colnames th {{ background-color: #0070C0; color: white; font-weight: bold; font-size: 5.8pt; }}
            .nowrap {{ white-space: nowrap; }}
            .text-left {{ text-align: left; padding-left: 2px; }}
            .bg-zebra {{ background-color: #F4F7FA; }}
            .col-total {{ font-weight: bold; background-color: #EBF3FA; }}
        </style>
    </head>
    <body>
        <table class="vacaciones-table">
            <thead>
                <tr>
                    <th colspan="7" class="header-blue">FORMATO VACACIONES</th>
                    <th colspan="3" class="header-green">PRIMER CORTE 28 DE NOVIEMBRE AL 6 DICIEMBRE<br>FECHA DE PAGO 28 DE NOVIEMBRE</th>
                    <th colspan="3" class="header-green">SEGUNDO CORTE 7 AL 18 DE DICIEMBRE<br>FECHA DE PAGO 15 DE DICIEMBRE</th>
                    <th class="header-green">24 DE DICIEMBRE UNES</th>
                    <th colspan="3" class="header-green">TERCER CORTE 19 DE DICEMBRE AL 12 DE ENERO<br>ARCHIVO PLANO DIFERENTE FECHA DE PAGO 29 DICIEMBRE</th>
                    <th class="header-green">31 DE DICIEMBRE UNES</th>
                    <th colspan="5" style="border:none;"></th>
                </tr>
                <tr class="row-colnames">
                    <th style="width:5.5%;">CEDULA</th>
                    <th style="width:11%;">APELLIDOS Y NOMBRES</th>
                    <th style="width:10%;">CARGO</th>
                    <th style="width:3.5%;">UNES</th>
                    <th style="width:5.5%;">FECHA DE INGRESO</th>
                    <th style="width:9%;">Correo personal de la persona (notificacion)</th>
                    <th style="width:4%;">DIAS PENDIENTES DE VACACIONES</th>
                    <th style="width:5%;">FECHA DE INICIO DE VACACIONES</th>
                    <th style="width:5%;">FECHA FIN DE VACACIONES</th>
                    <th style="width:3%;">TOTAL DÍAS</th>
                    <th style="width:5%;">FECHA DE INICIO DE VACACIONES2</th>
                    <th style="width:5%;">FECHA DE TERMINACIÓN DE VACACIONES</th>
                    <th style="width:3%;">TOTAL DÍAS3</th>
                    <th style="width:4.5%;">DIA DE LA FAMILIA</th>
                    <th style="width:5%;">FECHA DE INICIO DE VACACIONES4</th>
                    <th style="width:5%;">FECHA DE TERMINACIÓN DE VACACIONES5</th>
                    <th style="width:3%;">TOTAL DÍAS6</th>
                    <th style="width:4.5%;">DÍA DE LA FAMILIA 7</th>
                    <th style="width:3.5%;">TOTAL DIAS TOMADOS</th>
                    <th style="width:3.5%;">SALDO FINAL A 30 ENERO</th>
                    <th style="width:5.5%;">FECHA DE INGRESO LABORAL (REGRESO A TU LUGAR DE TRABAJO)</th>
                    <th style="width:8%;">OBSERVACIONES</th>
                    <th style="width:4%;">FIRMA</th>
                </tr>
            </thead>
            <tbody>
                {rows_html}
            </tbody>
        </table>
    </body>
    </html>
    '''

    # 3. Renderizar PDF con WeasyPrint
    HTML(string=full_html).write_pdf(ruta_salida_pdf)
```

---

## 5. Resumen de Checkpoints de Validación
- [x] **Orientación Horizontal (`A4 landscape`)** obligatoria.
- [x] **23 Columnas fijas** con proporciones porcentuales explícitas en el `<tr class="row-colnames">`.
- [x] Uso declado de la clase `.nowrap` para cédulas, códigos de UNES y fechas.
- [x] Tamaño de fuente entre `5.8pt` y `6.5pt` para evitar desbordamientos.
- [x] Respeto estricto del orden y agrupación de los Super-Encabezados Verdes (`#00B050`) y Azules (`#0070C0`).