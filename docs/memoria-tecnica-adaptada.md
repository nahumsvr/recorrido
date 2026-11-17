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
| Canalización | 500 m (estimación) | **390 m** (calculada sobre rutas) |
| Cable UTP Cat6 | 9 cajas (2 745 m) | **5 cajas** (1 525 m; ≈ 1 208 m calculados) |
| Puntos de red (salidas) | 28 | **23** (15 AP + 7 cámaras + 1 escritorio) |
| Perforaciones (muros y losa) | 0 (no estimadas) | **7 puntos, 13 mangas** (§5.3) |
| Precio total al cliente (con IVA) | $1,322,718.15 | **$1,272,879.81** |

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
- Ambas líneas salen del tablero por el muro de oficinas a h 3.0 m (sobre el poste de X 46.5 y el vano) hasta la esquina de la grada este. **Nada cruza en el piso la boca del pasillo central**, para que nadie pise ni se tropiece con el cable.
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

### 5.1 Respuesta corta: ¿hoyos, tubos o bandejas?

- **Hoyos que atraviesan muros o losa: 7 puntos, 13 mangas.** Seis son muros de 0.20 m y uno es la losa de la grada oeste (1.18 m de concreto). Están listados en §5.3.
- **Todo lo demás va en superficie, sin atravesar nada:** bandeja de malla (charola) sobre soportes de pared, canalización EMT para bajadas y tramos cortos, y canaleta de piso para el audio. Solo requiere taquetes de anclaje en muros y techo (no cuentan como perforaciones).
- **Lo que no necesita hoyo:** la puerta del cuarto de redes, el vano del pasillo central y las puertas del muro sur se aprovechan tal cual. El cable no pasa por una puerta: cada paso va por una manga junto a la puerta.
- **Cableado de datos:** bandeja de malla de 200 mm en el cuarto de redes y el vacío oeste (hasta 12 cables) y de 100 mm en el resto; bajadas a cada AP y cámara en EMT de ¾" (un cable PoE por bajada, sin cable de reserva en la bajada).
- **Cableado de audio:** canaleta superficial de 30 × 30 mm, separada ≥ 30 cm de datos y de potencia; la línea L va por arriba (h 6.6 m) y la R por el pie de la grada.

### 5.2 Trayectorias

Los datos salen todos del rack (14.44, 30.1) y se reparten por tres ramas. Alturas: bandejas de las canchas a **5.7 m** (sobre la última fila, 3.77 m, y bajo el techo, 6.85 m); vacíos técnicos a 2.4–2.5 m; anexo a 3.1 m (bajo el dintel del vano, 3.28 m); oficinas a 2.5 m.

| ID | Tipo | Tamaño | Recorrido | Largo (m) | Cables |
|---|---|---|---|---:|---:|
| ROOM_W | Bandeja | 200×50 | Rack → manga PEN-1 (muro oeste del cuarto) | 3.4 | 10 |
| VOID_W | Bandeja | 200×50 | Vacío técnico oeste, pasillo trasero (Y 31.1) | 11.8 | 10 |
| RISER_W | Manga/EMT | Ø100 | Núcleo PEN-2 por la losa y subida | 3.3 | 10 |
| WEST | Bandeja | 100×50 | Muro oeste, sobre grada y canchas | 31.0 | 7 |
| NORTH_W | Bandeja | 100×50 | Muro norte hasta X 37.9 | 37.7 | 5 |
| BACK | Bandeja | 100×50 | Muro trasero, sobre la última fila, hasta X 25.8 | 26.5 | 3 |
| ANNEX_FEED | Bandeja | 200×50 | Rack → manga PEN-3 (muro sur del cuarto) | 4.0 | 12 |
| ANNEX_W | Bandeja | 100×50 | Anexo, hacia el oeste | 7.9 | 2 |
| ANNEX_E | Bandeja | 100×50 | Anexo, hacia el este (cruza colgada el vano del pasillo) | 23.1 | 10 |
| PEN4 | Manga | Ø100 | Muro sur → vacío este | 1.6 | 7 |
| VOID_E | Bandeja | 100×50 | Vacío técnico este | 6.1 | 7 |
| PEN5 | Manga | Ø100 | Muro oeste de oficinas | 2.3 | 7 |
| OFFICES | Bandeja | 100×50 | Oficinas, muros oeste y norte | 11.4 | 7 |
| PEN6 | Manga | Ø100 | Muro norte de oficinas → escenario | 0.5 | 4 |
| STAGE | Bandeja | 100×50 | Borde sur y muro este del escenario | 28.7 | 4 |
| STAGE_N | Bandeja | 100×50 | Muro este del escenario, tramo norte | 4.1 | 1 |
| BR_M18 | Bandeja | 100×50 | Ramal al AP M18 | 5.5 | 1 |
| AUDIO_L / AUDIO_R | Canaleta | 30×30 | Ver §4.3 | 86.3 / 21.4 | — |

Totales: **201.2 m de bandeja de datos, 7.7 m de mangas de datos, ≈ 38 m de bajadas EMT y ≈ 102 m de canaleta de audio**, es decir ≈ 349 m; con 10% de reserva, **390 m**.

#### Pegado a paredes

Cada bandeja, manga y bajada queda a **≤ 0.35 m de un muro, techo o poste** en todo su largo (la prueba mide la distancia al modelo cada 10 cm). Los vacíos técnicos y el cuarto de redes cuentan el techo; el vano del pasillo se cruza pegado al dintel (h 3.1 m, el dintel está a 3.28 m); el muro oeste, el norte y el trasero llevan la bandeja a 0.2 m de la cara. El escenario tiene postes sueltos y su techo está a 8.2 m, así que **4 tramos no pueden pegarse** y se resuelven con soporte propio:

| Tramo | Largo libre | Soporte |
|---|---:|---|
| Bandeja STAGE, más allá del muro de oficinas (X > 50.7) | ≈ 1.7 m | Ménsula en cada extremo |
| Ramal BR_M18 (hacia el poste del AP M18) | ≈ 5.2 m | Charola colgada del techo del escenario con varilla roscada cada 1.5 m |
| Bajada a M17 (poste suelto) | ≈ 2.4 m | Tubo rígido entre el muro de oficinas y el poste, con soporte cada ≤ 1.5 m |
| Bajada a M18 | ≈ 3 m | Tubo rígido a lo largo del poste |

Acercar esos tramos a una pared alargaría el cable de M18 por encima de los 90 m.

### 5.3 Perforaciones (los "hoyos")

Cada una se validó con el modelo: la trayectoria atraviesa realmente ese sólido y ninguna otra trayectoria de datos ni de audio cruza un muro.

| ID | Dónde | Posición (X, Y, h) | Mangas | Espesor |
|---|---|---|---|---|
| PEN-1 | Muro oeste del cuarto de redes → vacío oeste | (12.29, 31.1, 2.4) | 2 × Ø100 | 0.20 m |
| PEN-2 | **Losa** de la grada oeste (techo del vacío → piso de la grada) | (0.2, 31.1, 3.2) | 2 × Ø100 (núcleo) | 1.18 m |
| PEN-3 | Muro sur del cuarto de redes → anexo | (12.9, 32.3, 2.5) | 2 × Ø100 | 0.20 m |
| PEN-4 | Anexo → vacío este (junto a la puerta de X 34.5–35.4) | (36.0, 32.3, 2.5) | 2 × Ø100 | 0.20 m |
| PEN-5 | Vacío este → oficinas (muro oeste de oficinas) | (42.58, 30.0, 2.5) | 2 × Ø100 | 0.20 m |
| PEN-6 | Oficinas → escenario (muro norte de oficinas) | (49.0, 24.6, 2.5) | 2 × Ø100 | 0.20 m |
| PEN-7 | Oficinas → AP M12 (muro oeste de oficinas, lado grada este) | (42.58, 28.47, 3.7) | 1 × Ø50 | 0.20 m |

Para cada perforación:
- manga de acero rígido con 2 cm de sobresalida por lado, para que ni el cable ni el concreto se rocen;
- **sellado cortafuego** del espacio anular y de la manga vacía (TIA-569, NOM-001-SEDE art. 300-21); el sello no se reabre al tender cables nuevos;
- una manga queda **de reserva** (la PEN-7 es de un solo cable).

El **núcleo de la losa (PEN-2)** es la única obra de concreto real: 2 núcleos de Ø100 mm por 1.18 m de espesor. Debe confirmarse con estructuras si hay varilla en esa posición antes de perforar.

### 5.4 Cableado por dispositivo

Charola = distancia por las trayectorias hasta la bajada; enlace permanente = charola + bajada; corte = enlace × 1.10 + 5 m (bucles de servicio).

| ID | Tipo | Última trayectoria | Charola (m) | Bajada (m) | Enlace (m) | Corte (m) |
|---|---|---|---:|---:|---:|---:|
| M01 | AP | NORTH_W | 54.0 | 2.6 | 56.6 | 67.3 |
| M02 | AP | NORTH_W | 65.0 | 2.5 | 67.5 | 79.3 |
| M03 | AP | NORTH_W | 76.1 | 2.5 | 78.6 | 91.4 |
| M04 | AP | NORTH_W | 87.0 | 2.5 | **89.5** | 103.5 |
| M06 | AP | WEST | 30.2 | 2.5 | 32.7 | 40.9 |
| M07 | AP | WEST | 20.4 | 0.8 | 21.2 | 28.3 |
| M09 | AP | BACK | 35.6 | 0.6 | 36.2 | 44.8 |
| M10 | AP | BACK | 44.6 | 0.5 | 45.2 | 54.7 |
| M12 | AP | OFFICES (+ PEN-7) | 38.7 | 2.0 | 40.7 | 49.7 |
| M13 | AP | ANNEX_W | 5.3 | 0.9 | 6.3 | 11.9 |
| M14 | AP | ANNEX_E | 12.4 | 1.8 | 14.2 | 20.6 |
| M15 | AP | ANNEX_E | 21.9 | 0.9 | 22.9 | 30.2 |
| M16 | AP | OFFICES | 45.9 | 0.5 | 46.4 | 56.1 |
| M17 | AP | STAGE | 49.0 | 5.1 | 54.1 | 64.5 |
| M18 | AP | BR_M18 | 83.2 | 3.6 | 86.8 | 100.4 |
| CAM02 | Domo | NORTH_W | 49.5 | 2.4 | 51.9 | 62.1 |
| CAM04 | Domo | STAGE_N | 81.7 | 1.8 | 83.5 | 96.8 |
| CAM05 | Domo | STAGE | 55.9 | 0.8 | 56.7 | 67.4 |
| CAM07 | Domo | OFFICES | 37.1 | 1.3 | 38.4 | 47.3 |
| CAM10 | Domo | BACK | 19.5 | 0.4 | 19.8 | 26.8 |
| CAM11 | Bullet | ANNEX_W | 11.9 | 0.6 | 12.5 | 18.7 |
| CAM12 | Bullet | ANNEX_E | 27.1 | 1.8 | 28.9 | 36.8 |

Se suma 1 salida para el escritorio de operación (≈ 8 m). **Corte total ≈ 1 208 m → 5 cajas de 305 m (1 525 m)**; la quinta caja es reserva por tendido y reterminado.

### 5.5 Cumplimiento

| Requisito | Criterio | Resultado |
|---|---|---|
| ANSI/TIA-568.2 (enlace permanente) | ≤ 90 m | **Cumple.** Máximo 89.5 m (M04); M18 86.8 m, CAM04 83.5 m, M03 78.6 m |
| ANSI/TIA-568.2 (canal) | ≤ 100 m con parcheos | M04 queda justo: hay que medir el tendido real; si pasa de 90 m, el remedio es un switch intermedio en el lado norte (ver §9) |
| ANSI/TIA-569 (llenado de charola) | ≤ 50% con 25% de crecimiento | Cumple en todas (la más cargada, 200 mm con 12 cables, usa ≈ 5%) |
| ANSI/TIA-569 (llenado de ducto) | ≤ 40% con 25% de crecimiento | Cumple: mangas Ø100 mm con ≤ 10 cables usan ≈ 5% |
| ANSI/TIA-569 (cortafuego) | Sellar toda perforación | 7 puntos, 13 mangas (§5.3) |
| ANSI/TIA-569 (curvas) | Radio ≥ 4× Ø del cable (≈ 25 mm); curvas de EMT ≥ 6× Ø | Se define en el procedimiento de tendido |
| ANSI/TIA-607 (puesta a tierra) | Unir cada tramo de bandeja y el rack a la barra de tierra | Cada bandeja lleva puente de unión; el rack va a la barra del cuarto |
| ANSI/TIA-606 (etiquetado) | Identificador único por salida y por trayectoria | Se usan los ids de esta memoria (M01…, CAM02…, PEN-1…) |
| NOM-001-SEDE (potencia vs datos) | Separar datos de potencia | Mínimo 30 cm en paralelo o división metálica (criterio de este proyecto) |
| IEEE 802.3at (PoE) | 30 W en el puerto, ≈ 25.5 W en el AP | 15 AP ≈ 381 W; 7 cámaras ≈ 60–70 W (estimado); reserva en los switches |
| TIA TSB-184 (calentamiento de haz) | Haces PoE de muchos cables | El haz mayor lleva 12 cables Cat6; verificar con la ficha del fabricante |

### 5.6 Supuestos de la trayectoria (confirmar en el levantamiento de obra)

- Los muros miden 0.20 m en el modelo y el material se asume de mampostería o concreto; PEN-2 asume losa de concreto de 1.18 m.
- El pasillo trasero de los vacíos (Y ≥ 31) está libre de instalaciones; no hay partición entre el cuarto de redes y las mangas.
- La bandeja ANNEX_E cruza colgada el vano del pasillo central (≈ 9 m): necesita colgantes anclados al techo del anexo.
- El poste en X ≈ 46.5 del borde del escenario (h hasta 2.9 m) limita la altura de la línea de audio a ≥ 3.0 m.
- Las bajadas son EMT de ¾" en el orden de ejes que evita atravesar muros; la ruta exacta la define el instalador.

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
| Cable UTP Cat6, caja 305 m | 9 | **5** | $23,244.45 |
| Jack RJ45 Cat6 (2 por salida + 4 de reserva) | 40 | **50** | $15,017.24 |
| Faceplate 2 puertos | 20 | **12** | $547.55 |
| Caja superficial y accesorios | 20 | **23** | $1,586.21 |
| Canalización y accesorios (PVC/charola) | 500 m | **390 m** | $60,517.24 |

Sin cambios: patch panels, 48 patch cords, 4 organizadores, etiquetado, tierra, fibra OM3, cableado XLR (lote), soportes de bocinas y micrófono, distribución eléctrica de audio.

Subtotal materiales: **$172,763.98** (antes $205,583.20).

## 8. Resumen de costos

Mano de obra, cargas sociales y costos operativos **no se modificaron** (*supuesto*: se revisan con el nuevo número de salidas y rutas en una siguiente pasada).

| Concepto | Importe MXN |
|---|---:|
| Hardware | $290,616.15 |
| Materiales y consumibles | $172,763.98 |
| Mano de obra directa | $241,850.00 |
| Cargas sociales e ISN | $79,810.50 |
| Seguros, herramientas y operación | $76,000.00 |
| **Costo directo** | **$861,040.63** |
| Contingencia 8% | $68,883.25 |
| Costo interno del proyecto | $929,923.88 |
| Utilidad Dream Team Networks 18% | $167,386.30 |
| Precio de venta antes de IVA | $1,097,310.18 |
| IVA 16% | $175,569.63 |
| **PRECIO TOTAL AL CLIENTE** | **$1,272,879.81** |

Presupuesto máximo $1,600,000.00 → se usa **79.55%**; margen **$327,120.19** (20.45%).

## 9. Supuestos y pendientes

1. **Perforaciones:** las 7 de §5.3 salen de las trayectorias que el modelo muestra libres; confirmar en obra que no haya instalaciones ni varilla (sobre todo el núcleo PEN-2 de 1.18 m en la grada oeste) y que cada muro sea el esperado. **Obra civil no presupuestada:** 13 mangas, 2 núcleos de concreto y el sellado cortafuego no tienen partida en la lista de precios del documento; falta cotizarlos.
1b. **Enlace M04 (89.5 m):** deja 0.5 m de margen respecto a los 90 m. Si en obra el tendido real lo pasa, la solución es un switch PoE de 8 puertos en el lado norte alimentado por la fibra OM3 y los transceptores SFP+ que ya están presupuestados (el switch no está en la lista).
2. Posición del puesto FOH (mesa sobre el escenario en 47.6, 24.2; mesa y tablero a 0.4 m de la cabecera de la escalera sur) y cable de audio L por la parte alta del muro trasero (≈ 86 m de XLR) y lote de XLR por verificar.
3. Cobertura de canchas y escenario sin refuerzo de audio: decisión del cliente. Protección de las bocinas contra balonazos.
4. Mano de obra: sin ajustar por menos cámaras y nuevas rutas.
5. Cámaras: con 7 el diseño se aleja del plano original; confirmar si se reponen (el margen del presupuesto lo permite).
6. NVR y discos sobredimensionados.
7. Longitudes calculadas sobre la geometría del modelo; confirmar con levantamiento de obra.
8. Faltan en el documento (no en esta versión): capítulos de arquitectura/VLAN/IP, cálculo Wi-Fi, normativa, anexos y plan de validación detallado.
