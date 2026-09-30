Implementa el endpoint y la lógica de negocio en backend y frontend para la generación del archivo plano de vacaciones en Excel.

### Contexto de los Archivos
- **Backend Entrypoint:** `@backend/app.py`
- **Frontend Component:** `@frontend/src/components/DownloadPlanoModal.jsx`
- **Plantilla Excel Target:** `@backend/planos_unoee/ARCHIVO PLANO TNL-VACACIONES.xlsx`

---

### Instrucciones de Implementación

#### 1. Lógica Backend (`@backend/app.py`)
Crea una función/endpoint llamado `generar_plano` que ejecute las siguientes acciones:

1. **Recepción de Parámetros:**
   - Capturar la opción seleccionada desde `@frontend/src/components/DownloadPlanoModal.jsx` (descarga general o por UNES específica).

2. **Consulta a la Base de Datos (`inf_asignacion`):**
   Utilizar como estructura base la siguiente consulta SQL:

   ```sql
   SELECT 
       vg.identificacion,
       vg.unes,
       vg.periodo1_fecha1,
       vg.periodo1_fecha2,
       vg.periodo1_dias1,
       vg.periodo2_fecha1,
       vg.periodo2_fecha2,
       vg.periodo2_dias2,
       vg.periodo3_fecha1,
       vg.periodo3_fecha2,
       vg.periodo3_dias3
   FROM 
       vacacionesgyj.dbo.inf_asignacion vg
   ```

3. **Consulta a la Base de Datos (`inf_asignacion`):**
   - Extraer los campos: `identificacion`, `unes`, `periodo1_fecha1`, `periodo1_fecha2`, `periodo1_dias1`, `periodo2_fecha1`, `periodo2_fecha2`, `periodo2_dias2`, `periodo3_fecha1`, `periodo3_fecha2`, `periodo3_dias3`.
   - **Filtro por UNES:** Si la opción elegida es por UNES, filtrar la columna `unes` extrayendo únicamente los últimos 3 dígitos del valor guardado (ejemplo: si el campo almacena `"2-106"`, tomar `"106"` como criterio de filtro).
   - **Filtro General:** Consultar la totalidad de registros sin aplicar filtro por UNES.

4. **Regla de Desglose de Filas por Empleado:**
   - Cada periodo registrado/asignado que tenga datos válidos debe convertirse en **una fila independiente** en la hoja de Excel:
     - Si un empleado tiene **1 solo periodo** registrado (`periodo1_*`), se genera **1 fila** con sus datos y las fechas/días de ese periodo.
     - Si un empleado tiene **2 periodos** registrados (`periodo1_*` y `periodo2_*`), se generan **2 filas consecutivas** para la misma identificación, una para cada periodo.
     - Si un empleado tiene **3 periodos** registrados (`periodo1_*`, `periodo2_*` y `periodo3_*`), se generan **3 filas consecutivas** para la misma identificación.
   - Omitir la creación de filas para aquellos periodos que estén vacíos o nulos en la base de datos.

5. **Escritura, Formato y Edición de Plantilla Excel (`openpyxl` / `pandas`):**
   - Abrir la plantilla existente `@backend/planos_unoee/ARCHIVO PLANO TNL-VACACIONES.xlsx`.
   - Escribir las filas generadas a partir de la **fila 2** en adelante.
   - Preservar intactas la fila de encabezados (fila 1) y todas las demás columnas no especificadas.
   - **Mapeo y Formato de Columnas:**
     - **Columna B:** Consecutivo numérico autoincremental (`1, 2, 3...`) por cada fila efectivamente escrita en la hoja.
     - **Columna C:** Identificación del empleado.
     - **Columnas G y H (Fechas del Periodo):** Formatear y guardar la fecha de inicio (Columna G) y fecha de fin (Columna H) estrictamente en formato de texto **`YYYYMMDD`** (ejemplo: `20261201`).
     - **Columna I:** Días correspondientes al periodo de esa fila.

6. **Respuesta HTTP:**
   - Retornar el archivo Excel generado como adjunto descargable (`send_file` o respuesta binaria en Flask).

---

#### 2. Integración Frontend (`@frontend/src/components/DownloadPlanoModal.jsx`)
- Asegurar que al confirmar la selección (General o por UNES), se realice la petición `POST` / `GET` adecuada enviando el valor seleccionado hacia el endpoint `generar_plano`.
- Manejar la descarga del archivo en el navegador como un Blob `.xlsx`.

---

Asegúrate de iterar sobre los periodos (1, 2 y 3) por cada registro de empleado devuelto por la base de datos y validar que contengan fechas válidas antes de agregarlos a la lista de filas para el Excel.