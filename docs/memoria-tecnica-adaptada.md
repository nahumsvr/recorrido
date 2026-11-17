# Memoria técnica de red — versión adaptada al modelo 3D

Auditorio de la Facultad de Informática, UAQ · Dream Team Networks

> **Regla de esta versión:** el modelo 3D (`recorrido`) es la fuente de verdad. Cantidades, ubicaciones y alturas de este documento salen del modelo; el presupuesto se recalculó con los mismos precios unitarios y criterios financieros de la versión del 17/11/2026.
> **Estado:** borrador de trabajo. Todo lo marcado como *supuesto* debe confirmarse en el modelo o en obra.

## 1. Cambios respecto a la versión entregada

| Concepto | Versión anterior | Esta versión (modelo) |
|---|---|---|
| Access points TP-Link EAP773 | 14 | **15** (M01–M18; faltan M05, M08, M11 y M19, excluidos) |
| Cámaras VIGI C240I (domo) | 10 | **5** |
| Cámaras VIGI C340I (bullet) | 4 | **2** |
| Bocinas JBL EON715 | 4 (sin ubicación) | **4**, 2 por grada, ubicadas |
| Canalización | 500 m (estimación) | **400 m** (calculada sobre rutas) |
| Cable UTP Cat6 | 9 cajas (2 745 m) | **4 cajas** (1 220 m; 1 112 m calculados) |
| Puntos de red (salidas) | 28 | **23** (15 AP + 7 cámaras + 1 escritorio) |
| Precio total al cliente (con IVA) | $1,322,718.15 | **$1,268,301.26** |

Textos del documento que deben corregirse: "incremento de 12 a 14 access points" → 15; "ampliación puntual de cámaras" pasa a ser una decisión abierta (ver §8); los pies de las tablas 14/14 AP-cámaras.

## 2. Inventario maestro derivado del modelo

Coordenadas del plano: X al este, Y al sur, h hacia arriba; origen en la esquina interior noroeste de las canchas (metros).

### 2.1 Access points (15)

| ID | Zona | X | Y | h | Montaje |
|---|---|---:|---:|---:|---|
| M01 | Courts - north wall | 4.7 | 0.4 | 3.31 | Muro |
| M02 | Courts - north wall | 15.7 | 0.3 | 3.29 | Muro |
| M03 | Courts - north wall | 26.8 | 0.1 | 3.29 | Muro |
| M04 | Courts - north wall | 37.7 | 0.1 | 3.27 | Muro |
| M06 | Courts - west wall | 0.1 | 19.4 | 3.33 | Muro |
| M07 | Stands - west wall | -0.0 | 29.2 | 5.11 | Muro |
| M09 | Stands - south wall | 16.3 | 32.3 | 5.36 | Muro |
| M10 | Stands - south wall | 25.4 | 32.3 | 5.42 | Muro |
| M12 | Stands - east wall | 42.5 | 28.5 | 4.14 | Muro |
| M13 | South annex | 11.6 | 32.5 | 2.31 | Muro |
| M14 | South annex | 21.2 | 34.2 | 3.29 | Techo |
| M15 | South annex | 30.8 | 32.5 | 2.31 | Muro |
| M16 | Offices | 46.5 | 24.8 | 2.90 | Muro |
| M17 | Stage | 48.2 | 20.4 | 2.88 | Muro |
| M18 | Stage | 48.3 | 4.3 | 2.84 | Muro |

### 2.2 Cámaras de seguridad (7)

| ID | Tipo | Lente | Zona | X | Y | h | Pan / tilt |
|---|---|---|---|---:|---:|---:|---|
| CAM02 | Domo C240I | 4 mm | Courts - NW corner | 0.25 | 0.3 | 3.5 | -35° / 14° |
| CAM04 | Domo C240I | 2.8 mm | Stage - NE corner | 54.4 | 0.25 | 4 | 33° / 41° |
| CAM05 | Domo C240I | 2.8 mm | Stage - SE corner | 54.15 | 24.8 | 4 | -29° / 36° |
| CAM07 | Domo C240I | 2.8 mm | Offices - west side | 42.7 | 30.7 | 3 | 44° / 32° |
| CAM10 | Domo C240I | 4 mm | Stands - west end | 0.2 | 32.2 | 5.5 | -36° / 13° |
| CAM11 | Bullet C340I | 4 mm | Pasillo - NW | 4.8 | 32.55 | 2.8 | -25° / 18° |
| CAM12 | Bullet C340I | 4 mm | Pasillo - NE | 37.4 | 32.7 | 2.8 | -57° / 23° |

Retiradas el 16/11 tras evaluar su necesidad: CAM01, 03, 06, 08, 09, 13 y 14. No se renumeran los ids.

### 2.3 Cuarto de redes y rack

Rack Tripp Lite SR42UB en (14.44, 30.1), bajo la grada oeste, con puerta hacia el sur (X 14.42–15.34). Contiene UPS, 2 PDU, NVR, controlador OC300, router ER8411, switches de 24 y 48 puertos PoE++, 2 patch panels y 4 organizadores: coincide con el presupuesto de hardware anterior. El escritorio de operación (monitor del CCTV) queda a 1.1 m del rack, contra el muro este del cuarto.

## 3. Geometría relevante del modelo

- **Gradas:** dos estructuras en espejo frente a las canchas, separadas por el pasillo central (X ≈ 18.5–24.5) con rampas laterales.
  - Grada oeste: X 0.2–17.7. Grada este: X 25.3–42.5. Frente en Y 24.7, muro trasero en Y 32.2.
  - 7 niveles; altura de piso de 0.82 m (frente) a 3.77 m (última fila).
- Eje de simetría de las gradas: X ≈ 21.5.
- Bajo el fondo de cada grada (Y ≈ 29–32.2) hay un vacío técnico con cielo a 2.59 m; ahí está el cuarto de redes.
- Anexo sur (pasillo): Y 32.4–36.6, techo a 3.3 m, X 4.2–38.3.
- Escenario al este (X ≥ 45.6, piso a 1.18 m); oficinas en X 42.5–50.7, Y 24.4–31.1.

## 4. Sistema de audio (capítulo 6 — nuevo)

### 4.1 Criterio

Dos bocinas por grada, cuatro en total: coincide con las 4 JBL EON715 ya presupuestadas, así que el audio no cambia el costo de hardware.

### 4.2 Ubicación de bocinas

Las bocinas van **al frente de cada grada**, apoyadas en la cara del primer contrahuella (Y 24.7), de cara al público sentado. Cada cabinete queda con su centro a 0.45 m del contrahuella y a h 0.5 m (ocupa h 0.1–0.9 m), sujeto con una horquilla a una placa en el contrahuella, y se inclina **42° hacia arriba**. Se colocan a ¼ y ¾ del ancho de cada grada.

| ID | Grada | X | Y | h | Línea |
|---|---|---:|---:|---:|---|
| SPK-W1 | Oeste | 4.5 | 24.25 | 0.5 | L |
| SPK-W2 | Oeste | 13.0 | 24.25 | 0.5 | L |
| SPK-E1 | Este | 30.0 | 24.25 | 0.5 | R |
| SPK-E2 | Este | 38.5 | 24.25 | 0.5 | R |

Las posiciones este son el espejo de las oeste respecto a X = 21.5.

**Por qué 42°:** desde el cabinete, los oídos de la primera fila (h 1.97 m, Y 25.4) quedan a ≈ 57° y los de la última (h 4.92 m, Y 31.4) a ≈ 33°. Con 42° ambos caen dentro de ±30° del eje; la apertura vertical de la EON715 es de 60°. Las 7 filas quedan en cobertura directa.

### 4.3 Mezcla y señal

- Consola Yamaha MG12XU **portátil**, en un puesto de operación (FOH) sobre el escenario (piso h 1.18 m), en su borde sur: mesa de 1.2 × 0.6 m con centro en **(47.6, 24.2)**, contra la cara norte del bloque de oficinas. El borde suroeste del escenario es diagonal (pie de la escalera), por eso la mesa arranca en X 47.0.
- Tablero de pared fijo a **(47.6, 24.5), h 2.23 m** (1.05 m sobre el piso del escenario), con 2 salidas XLR (L / R) y un contacto protegido. La consola solo se conecta con 2 cables XLR de parcheo al tablero: se desconecta y se guarda sin tocar la instalación. Los cables fijos (canaleta, bajadas y bocinas) se quedan instalados.
- Salida principal **L → grada oeste**, **R → grada este**, con línea balanceada XLR; cada bocina lleva el *thru* a la segunda de su grada.
- Ambas líneas salen del tablero por el muro de oficinas a h 2.7 m (sobre el vano) hasta la esquina de la grada este. **Nada cruza en el piso la boca del pasillo central**, para que nadie pise ni se tropiece con el cable.
- **Línea R (grada este):** baja en la esquina y sigue la canaleta de piso al pie de la grada hasta E1 y E2 (≈ 21 m en total).
- **Línea L (grada oeste):** sube la esquina hasta h 6.6 m, sigue el muro este y el muro trasero por arriba de las gradas y del vano del pasillo hasta el muro oeste, recorre ese muro hasta su esquina frontal, baja y sigue la canaleta de piso al pie de la grada hasta W1 y W2 (≈ 86 m en total).
- Total de XLR: ≈ 107 m más holgura. **Verificar el lote de cableado XLR** ($12,000 en la versión anterior, calculado para ≈ 77 m): no se modificó porque no hay precio unitario en el documento.
- La L pasa a ≈ 3.8 m sobre la última fila (h 3.77): fuera del alcance de público.
- Alimentación: 4 tomas protegidas, una por bocina, en el pie de las gradas (canaleta de potencia separada de la de audio) (circuito de audio, **no** del UPS del rack, igual que en la versión anterior).

### 4.4 Límites a tener claros

- Las 4 bocinas refuerzan **solo las gradas**. Canchas y escenario no tienen refuerzo en este diseño. Si el evento tiene público de pie en canchas, hace falta decidirlo (el presupuesto tiene margen).
- **Nivel desigual por filas:** la primera fila queda a ≈ 1.7 m de la bocina y la última a ≈ 8 m (≈ 13 dB de diferencia). Es el costo de poner las bocinas al frente; se compensa con el nivel de la consola y se debe validar en sitio.
- **Huecos laterales en las primeras filas:** a 1.7 m la cobertura horizontal de cada bocina es de ± 1.7 m. Los asientos de las primeras filas, entre bocinas, quedan peor cubiertos que los de atrás.
- **Exposición a golpes:** el frente de la grada es el borde de la cancha. Hay que protegerlas (rejilla o guarda) o aceptar el riesgo de balonazos.
- El MG12XU no tiene retardo: sin DSP externo no se alinean tiempos con el escenario.

## 5. Cableado estructurado (capítulo 7 — nuevo)

### 5.1 Topología

Estrella desde el rack, con tres troncales de charola:

| Troncal | Recorrido | Longitud |
|---|---|---:|
| **TS** | Rack → puerta sur → anexo sur (h 2.9) hasta X 38.0 | 27.1 m |
| **TW** | Rack → vacío técnico oeste (*supuesto*: paso en el muro oeste del cuarto) → muro oeste a h 5.8 → muro norte hasta X 54.3 | 100.7 m |
| **TE** | Continúa TS: anexo → vacío técnico este (*supuesto*: paso en el muro sur en X ≈ 38) → muro oeste de oficinas → sobre oficinas a h 5.8 → muro este del escenario hasta Y 0.5 | 51.1 m |

Bajadas a dispositivos: 78 m. Líneas de audio: ≈ 101 m de canaleta y charola (R ≈ 15 m al pie de la grada este; L ≈ 80 m por la parte alta, ver §4.3), separadas ≥ 30 cm de datos y de potencia. **Canalización total ≈ 358 m, +10% de reserva ≈ 394 m → partida de 400 m.**

### 5.2 Corridas por dispositivo

Charola = distancia de la troncal más cercana; enlace permanente = charola + bajada; corte = enlace × 1.10 + 5 m (bucle de servicio).

| ID | Tipo | Zona | Troncal | Charola (m) | Bajada (m) | Enlace permanente (m) | Corte con holgura (m) |
|---|---|---|---|---:|---:|---:|---:|
| M01 | AP | Courts - north wall | TW | 51.1 | 2.6 | 53.7 | 64.1 |
| M02 | AP | Courts - north wall | TW | 62.1 | 2.8 | 64.9 | 76.4 |
| M03 | AP | Courts - north wall | TW | 73.2 | 2.9 | 76.2 | 88.8 |
| M04 | AP | Courts - north wall | TW | 84.1 | 3 | 87.1 | 100.8 |
| M06 | AP | Courts - west wall | TW | 28 | 2.9 | 30.9 | 39 |
| M07 | AP | Stands - west wall | TW | 18.2 | 1.2 | 19.5 | 26.4 |
| M09 | AP | Stands - south wall | TW | 0 | 7 | 7 | 12.7 |
| M10 | AP | Stands - south wall | TS | 14.5 | 4.3 | 18.8 | 25.7 |
| M12 | AP | Stands - east wall | TE | 35.8 | 1.6 | 37.3 | 46.1 |
| M13 | AP | South annex | TW | 2.9 | 2.5 | 5.4 | 10.9 |
| M14 | AP | South annex | TS | 10.3 | 0.6 | 10.9 | 17 |
| M15 | AP | South annex | TS | 19.9 | 2.1 | 22 | 29.3 |
| M16 | AP | Offices | TE | 46.5 | 3.3 | 49.8 | 59.7 |
| M17 | AP | Stage | TE | 48.2 | 7 | 55.2 | 65.7 |
| M18 | AP | Stage | TE | 74.4 | 9 | 83.4 | 96.8 |
| CAM02 | Domo | Courts - NW corner | TW | 46.9 | 2.8 | 49.7 | 59.7 |
| CAM04 | Domo | Stage - NE corner | TE | 78.1 | 2.2 | 80.4 | 93.4 |
| CAM05 | Domo | Stage - SE corner | TE | 54.1 | 2.2 | 56.4 | 67 |
| CAM07 | Domo | Offices - west side | TS | 27 | 8.2 | 35.2 | 43.7 |
| CAM10 | Domo | Stands - west end | TW | 17 | 2.4 | 19.4 | 26.4 |
| CAM11 | Bullet | Pasillo - NW | TW | 9.6 | 2.9 | 12.5 | 18.7 |
| CAM12 | Bullet | Pasillo - NE | TS | 26.5 | 1.4 | 27.9 | 35.7 |
| DESK | RJ45 | Network room | TS | 0 | 3 | - | 8 |

Total de corte ≈ 1 112 m → 4 cajas de 305 m (1 220 m).

### 5.3 Verificación contra TIA-568

- Límite del enlace permanente: 90 m. **Ningún enlace lo supera.**
- Los más largos: M04 (87.1 m), M18 (83.4 m), CAM04 (80.4 m), M03 (76.2 m). Con la holgura de instalación quedan en el límite; el recorrido real debe medirse con el levantamiento final. Si alguno pasa de 90 m, se resuelve con fibra OM3 (hay reserva y 4 transceptores SFP+ en el presupuesto) a un switch intermedio en el lado norte/este.
- Potencia PoE de los 15 AP: 25.4 W × 15 = 381 W; las 7 cámaras suman ≈ 60–70 W (estimado). Total muy por debajo del presupuesto PoE de los dos switches.
- Puertos: 23 usados de 72 PoE disponibles (24 + 48) → reserva de crecimiento ≈ 68%.

## 6. Hardware (capítulo 8 — cambios)

| Concepto | Modelo | Antes | Ahora | Unitario s/IVA | Total s/IVA |
|---|---|---:|---:|---:|---:|
| Access point Wi-Fi 7 | TP-Link EAP773 | 14 | **15** | $5,117.24 | $76,758.60 |
| Cámara domo 4 MP | VIGI C240I | 10 | **5** | $762.93 | $3,814.65 |
| Cámara bullet 4 MP | VIGI C340I | 4 | **2** | $1,098.28 | $2,196.56 |

Subtotal hardware: **$290,616.15** (antes $291,510.12). Resto de equipos, sin cambios.

Observación abierta: con 7 cámaras el NVR de 32 canales y los 4 discos de 8 TB quedan sobredimensionados (≈ 28 Mbps a 4 Mbps/cámara → ≈ 9 TB a 30 días). Se mantienen por ahora para no tocar el diseño sin tu decisión.

## 7. Materiales (capítulo 8 — cambios)

| Material | Antes | Ahora | Total s/IVA |
|---|---:|---:|---:|
| Cable UTP Cat6, caja 305 m | 9 | **4** | $18,595.56 |
| Jack RJ45 Cat6 (2 por salida + 4 de reserva) | 40 | **50** | $15,017.24 |
| Faceplate 2 puertos | 20 | **12** | $547.55 |
| Caja superficial y accesorios | 20 | **23** | $1,586.21 |
| Canalización y accesorios (PVC/charola) | 500 m | **400 m** | $62,068.97 |

Sin cambios: patch panels, 48 patch cords, 4 organizadores, etiquetado, tierra, fibra OM3, cableado XLR (lote), soportes de bocinas y micrófono, distribución eléctrica de audio.

Subtotal materiales: **$169,666.82** (antes $205,583.20).

## 8. Resumen de costos

Mano de obra, cargas sociales y costos operativos **no se modificaron** (*supuesto*: se revisan con el nuevo número de salidas y rutas en una siguiente pasada).

| Concepto | Importe MXN |
|---|---:|
| Hardware | $290,616.15 |
| Materiales y consumibles | $169,666.82 |
| Mano de obra directa | $241,850.00 |
| Cargas sociales e ISN | $79,810.50 |
| Seguros, herramientas y operación | $76,000.00 |
| **Costo directo** | **$857,943.47** |
| Contingencia 8% | $68,635.48 |
| Costo interno del proyecto | $926,578.95 |
| Utilidad Dream Team Networks 18% | $166,784.21 |
| Precio de venta antes de IVA | $1,093,363.16 |
| IVA 16% | $174,938.10 |
| **PRECIO TOTAL AL CLIENTE** | **$1,268,301.26** |

Presupuesto máximo $1,600,000.00 → se usa **79.27%**; margen **$331,698.74** (20.73%).

## 9. Supuestos y pendientes

1. Pasos físicos entre cuarto de redes y vacíos técnicos (oeste y este): no verificados en el modelo.
2. Posición del puesto FOH (mesa sobre el escenario en 47.6, 24.2; mesa y tablero a 0.4 m de la cabecera de la escalera sur) y cable de audio L por la parte alta del muro trasero (≈ 86 m de XLR) y lote de XLR por verificar.
3. Cobertura de canchas y escenario sin refuerzo de audio: decisión del cliente. Protección de las bocinas contra balonazos.
4. Mano de obra: sin ajustar por menos cámaras y nuevas rutas.
5. Cámaras: con 7 el diseño se aleja del plano original; confirmar si se reponen (el margen del presupuesto lo permite).
6. NVR y discos sobredimensionados.
7. Longitudes calculadas sobre la geometría del modelo; confirmar con levantamiento de obra.
8. Faltan en el documento (no en esta versión): capítulos de arquitectura/VLAN/IP, cálculo Wi-Fi, normativa, anexos y plan de validación detallado.
