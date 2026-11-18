# Memoria técnica de red — versión adaptada al modelo 3D

Auditorio de la Facultad de Informática, UAQ · Dream Team Networks

> **Regla de esta versión:** el modelo 3D (`recorrido`) es la fuente de verdad. Cantidades, ubicaciones y alturas de este documento salen del modelo; el presupuesto se recalculó con los mismos precios unitarios y criterios financieros de la versión del 17/11/2026.
> **Estado:** borrador de trabajo. Todo lo marcado como *supuesto* debe confirmarse en el modelo o en obra.

## 1. Cambios respecto a la versión entregada

| Concepto | Versión anterior | Esta versión (modelo) |
|---|---|---|
| Access points TP-Link EAP773 | 14 | **15** (M01–M18; faltan M05, M08, M11 y M19, excluidos) |
| Cámaras VIGI C240I (domo) | 10 | **8** |
| Cámaras VIGI C340I (bullet) | 4 | **3** |
| Bocinas JBL EON715 | 4 (sin ubicación) | **2**, 1 por grada, ubicadas (quedan 2 de reserva) |
| Canalización | 500 m (estimación) | **390 m** (calculada sobre rutas) |
| Cable UTP Cat6 | 9 cajas (2 745 m) | **4 cajas** (1 220 m; ≈ 979 m calculados) |
| Puntos de red (salidas) | 28 | **27** (15 AP + 11 cámaras + 1 escritorio) |
| Perforaciones (muros) | 0 (no estimadas) | **4 puntos, 6 mangas** (§5.3) |
| IDF-N en el muro norte | no existía | **1** (usa el switch de 24 puertos que estaba en el rack) + fibra OM3 ≈ 104 m |
| Precio total al cliente (con IVA) | $1,322,718.15 | **$1,274,566.48** |

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

### 2.2 Cámaras de seguridad (11)

| ID | Tipo | Lente | Zona | X | Y | h | Pan / tilt |
|---|---|---|---|---:|---:|---:|---|
| CAM02 | Bullet C340I | 4 mm | Courts - NW corner | 0.25 | 0.3 | 3.5 | -37° / 14° |
| CAM04 | Domo C240I | 2.8 mm | Stage - NE corner | 54.4 | 0.25 | 5.2 | 33° / 49° |
| CAM05 | Domo C240I | 2.8 mm | Stage - SE corner | 54.15 | 24.8 | 4 | -29° / 36° |
| CAM07 | Domo C240I | 2.8 mm | Offices - west side | 42.7 | 30.7 | 3 | 44° / 32° |
| CAM10 | Domo C240I | 4 mm | Stands - west end | 0.2 | 32.2 | 5.5 | -36° / 13° |
| CAM11 | Bullet C340I | 4 mm | Pasillo - NW | 4.8 | 32.55 | 2.8 | -25° / 18° |
| CAM12 | Bullet C340I | 4 mm | Pasillo - NE | 37.4 | 32.7 | 2.8 | -57° / 23° |
| CAM15 | Domo C240I | 4 mm | Stage - audio mixer | 54 | 24.45 | 4 | 62° / 29° |
| CAM16 | Domo C240I | 2.8 mm | Network room | 16.38 | 31.6 | 2.05 | -37° / 31° |
| CAM17 | Domo C240I | 2.8 mm | Exterior - NW corner | -0.25 | 0.8 | 6.2 | 45° / 25° |
| CAM18 | Domo C240I | 2.8 mm | Exterior - SW corner | 1 | 32.45 | 6.2 | 45° / 25° |

Retiradas el 16/11 tras evaluar su necesidad: CAM01, 03, 06, 08, 09, 13 y 14. No se renumeran los ids.

Cámaras agregadas después: **CAM15** ve la mezcladora (muro de oficinas, lado escenario, en el extremo este, junto a CAM05 que está por la cara de las oficinas); **CAM16** está dentro del cuarto de redes, en el muro este, y ve el rack y la zona de trabajo; **CAM17** y **CAM18** son exteriores, en las esquinas noroeste y suroeste, a 6.2 m en la cara de afuera del muro, y ven las fachadas oeste y sur. CAM02 es bullet y CAM04 va a 5.2 m según los ajustes guardados del proyecto.

### 2.3 Cuarto de redes y rack

Rack Tripp Lite SR42UB en (14.44, 30.1), bajo la grada oeste, con puerta hacia el sur (X 14.42–15.34). Contiene UPS, 2 PDU, NVR, controlador OC300, router ER8411, el switch de 48 puertos PoE++, 2 patch panels y 4 organizadores. El switch de 24 puertos PoE++ del presupuesto pasa al IDF del muro norte (§5.4). El escritorio de operación (monitor del CCTV) queda a 1.1 m del rack, contra el muro este del cuarto.

## 3. Geometría relevante del modelo

- **Gradas:** dos estructuras en espejo frente a las canchas, separadas por el pasillo central (X ≈ 18.5–24.5) con rampas laterales.
  - Grada oeste: X 0.2–17.7. Grada este: X 25.3–42.5. Frente en Y 24.7, muro trasero en Y 32.2.
  - 7 niveles; altura de piso de 0.82 m (frente) a 3.77 m (última fila).
- Eje de simetría de las gradas: X ≈ 21.5.
- Bajo las gradas hay un vacío con cielo a 2.59 m (Y ≈ 29–32.2). El cuarto de redes es la única parte que se usa para la red; **el resto son baños y vestidores** y el cableado no pasa por ahí.
- Anexo sur (pasillo): Y 32.4–36.6, techo a 3.3 m, X 4.2–38.3.
- Escenario al este (X ≥ 45.6, piso a 1.18 m); oficinas en X 42.5–50.7, Y 24.4–31.1.

## 4. Sistema de audio (capítulo 6 — nuevo)

### 4.1 Criterio

Una bocina por grada, dos en total, de las 4 JBL EON715 ya presupuestadas (quedan 2 de reserva): el audio no cambia el costo de hardware.

### 4.2 Ubicación de bocinas

Las bocinas van **en el muro lateral de cada grada** (el muro oeste y el muro este), a **3.0 m de altura** (arriba de la cabeza del público de pie, fuera del paso y de los balonazos de piso), sobre un brazo a 0.45 m del muro y cerca del frente de la grada (Y 25.3, a más de 3 m del AP M12 del mismo muro). Cada una **apunta al centro de su grada** (X 9.0 / 34.0, Y 29.0, a la altura de la cabeza de un espectador sentado): ≈ 19° hacia el fondo y ≈ 8° hacia arriba, a lo largo de la grada.

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
- Cada línea va en su **propio tubo conduit de acero** de ¾", pegado al muro (eje a ≈ 2.5 cm de la cara) y sujeto con abrazaderas, igual que el tubo de datos. Ambas salen del tablero (L a la izquierda, R al centro) por el muro de oficinas a h 3.0 m (sobre el poste de X 46.5 y el vano) hasta la esquina de la grada este; en ese tramo L va 3.5 cm más afuera que R para poder subir cruzando sobre R sin tocarla. **Nada cruza en el piso la boca del pasillo central**, para que nadie pise ni se tropiece con el cable.
- **Línea R (grada este):** sigue el muro lateral de la grada este desde la esquina, a h 3.0 m, hasta la bocina SPK-E1 (≈ 6 m en total).
- **Línea L (grada oeste):** sube por la cara norte del muro de oficinas (X 42.9, para no cruzar la canalización de datos del lado del escenario) hasta h 6.6 m, rodea la esquina, sigue el muro este y el muro trasero por arriba de las gradas y del vano del pasillo hasta el muro oeste, recorre ese muro hasta su esquina frontal y baja pegada a él hasta h 3.0 m, donde termina en la bocina SPK-W1; al pasar frente al tubo de datos del muro oeste (h 5.7 m) hace una curva de desvío de 10 cm (dos curvas de 30°) para no tocarlo (≈ 71 m en total).
- Total de XLR: ≈ 77 m más holgura, igual al lote ya calculado (≈ 77 m): sigue por verificar la cotización, porque el documento no trae precio unitario.
- La L pasa a ≈ 3.8 m sobre la última fila (h 3.77): fuera del alcance de público.
- **Nada va por el piso:** las dos líneas terminan a 3.0 m, arriba de la zona protegida de 2 m, así que todo el audio va en EMT de ¾" y ya no hay tubo rígido (RMC). Cada línea termina en una caja de registro junto a la bocina, de donde sale un tramo corto de cable hasta el panel de conectores del cabinete.
- **Abrazaderas y cajas del audio:** solo las que pide la norma (NEC 358.30, fuente secundaria): una a ≤ 0.9 m de cada caja o extremo y una cada ≤ 3 m. Son **32 abrazaderas** (R 3, L 29) y **7 cajas de registro** (entrada en el tablero, una por bocina al final del tubo, y de paso cada ≤ 30 m o cada 360° de curvas).
- **El audio no comparte canalización con los datos.** Sigue en sus propios tubos, a ≥ 0.3 m de la canalización de Cat6; solo se cruzan en ángulo recto: en el lado del escenario el tubo de datos pasa por delante del de audio con una curva de desvío (§5.2) y L pasa por delante del tubo de datos del muro oeste. Los Cat6 de los AP y las cámaras llevan PoE (circuito Clase 2) y el NEC 725.139(F) separa los circuitos de audio de los Clase 2/3; que esa regla aplique a XLR de línea hacia bocinas amplificadas no está confirmado, y las fuentes consultadas no tratan audio en bandeja con datos. Compartirla exigiría separador metálico y confirmar el texto vigente de la NOM-001-SEDE.
- Alimentación: 2 tomas protegidas, una por bocina, junto al muro de cada grada (canalización de potencia separada de la de audio) (circuito de audio, **no** del UPS del rack, igual que en la versión anterior).

### 4.4 Límites a tener claros

- Las 2 bocinas refuerzan **solo las gradas**. Canchas y escenario no tienen refuerzo en este diseño. Si el evento tiene público de pie en canchas, hace falta decidirlo (el presupuesto tiene 2 bocinas de reserva).
- **Asientos junto al muro de la bocina:** los asientos más cercanos a cada bocina, sobre su mismo muro, quedan a más de 45° fuera de su eje (patrón del EON715: 90° horizontal × 60° vertical) y se oirán más bajo; en cambio el nivel al otro extremo de la grada es más parejo que con bocinas al frente. Se compensa con el nivel de la consola y se debe validar en sitio.
- **Cobertura calculada:** el extremo y el centro de la grada, en primera y última fila, quedan dentro de ±45° horizontal y ±30° vertical del eje (la prueba lo verifica).
- **Exposición a golpes:** a 3.0 m del piso y sobre el muro lateral, las bocinas quedan fuera del alcance de los balones y del paso; confirmar en obra la capacidad del muro y de los anclajes del brazo contra el peso del cabinete.
- El MG12XU no tiene retardo: sin DSP externo no se alinean tiempos con el escenario.

## 5. Cableado estructurado (capítulo 7 — nuevo)

### 5.1 Respuesta corta: ¿hoyos, tubos o bandejas?

**Debajo de las gradas hay baños y vestidores, así que ninguna ruta pasa por ahí:** no se usa el vacío bajo las gradas ni se perfora la losa.

- **Hoyos que atraviesan muros: solo 4 puntos, 6 mangas (4 de Ø100 y 2 de Ø50).** PEN-3 (muro sur del cuarto de redes → anexo) y PEN-7 (muro oeste de oficinas, desde la grada este). PEN-8 y PEN-9 (muro oeste y muro sur, a 5.7 m) llevan el cable a las cámaras exteriores CAM17 y CAM18. Están en §5.3. El lado del escenario (CAM05, M17) se alimenta por fuera de las oficinas y no perfora nada.
- **Todo lo demás va en superficie, sin atravesar nada, con tres tipos de canalización de datos (§5.2):** tubo conduit metálico EMT en todo lo que queda a la vista de las gradas y las canchas (muro trasero, subidas, muros oeste y norte, escenario: 163.1 m), bandeja de malla solo dentro del anexo, donde el público no entra (16.8 m), y canaleta plástica superficial en interiores secos de oficinas y anexo (29 m). Además, bajadas en EMT de ¾" y tubos de audio (EMT ¾" y rígido ¾" al pie de las gradas, §4.3). Solo requiere taquetes de anclaje (no cuentan como perforaciones).
- **Cómo se llega a las canchas:** el cable sale del cuarto de redes por PEN-3 al anexo, cruza el **vano del pasillo central** (que ya existe, bajo el dintel) y sube por las **pilas del vano** hasta el muro trasero, por arriba de la última fila de las gradas; de ahí recorre los muros perimetrales a 5.7 m.
- **Un IDF en el muro norte (IDF-N)** alimenta el lado norte (muro norte, esquina del escenario y muro de M18), conectado al rack con **fibra OM3 de ≈ 104 m**. Sin el IDF, con cobre desde el rack por el muro oeste (no hay otra ruta modelada), pasarían de los 90 m permitidos M04 (99.7 m), M18 (113.4 m) y CAM04 (115.8 m); M03 quedaría en 88.7 m, al límite; M01 (66.9 m), M02 (77.8 m) y CAM02 (62.2 m) cumplirían. Además, el cobre de esos 7 dispositivos pasaría de ≈ 195 m a ≈ 722 m de corte.

### 5.2 Trayectorias

Alturas: canalización de las canchas a **5.7 m** (sobre la última fila, 3.77 m, y bajo el techo, 6.85 m); anexo a 3.1 m (bajo el dintel del vano, 3.28 m); entrada a oficinas a 3.8 m (sobre la última fila y bajo el techo de oficinas, 3.9 m); oficinas a 3.4 m (sobre el poste de X 46.5 y la canaleta de audio a 3.0 m). **Lado del escenario:** tubo troncal a 5.7 m pegado a la cara norte del muro de oficinas; una bajada a X 45.9 lo lleva a 2.6 m y de ahí un ramal sigue la cara del muro de 0.2 m que carga a M17, a 3 cm bajo el remate del muro (2.98 m), con la bajada al AP (2.88 m) a unos 0.5 m del final del tubo. Lo mismo en el muro de M18 (AP a 2.84 m). **Todo el EMT va pegado al muro** (eje a ≈ 3 cm de la cara, sujeto con abrazaderas, sin ménsulas ni patas). Los dos tubos de audio cruzan ese tubo en ángulo recto (la línea L sube a X 42.9 y las dos corren a 3.0 m): el tubo de datos pasa 10 cm por delante de cada uno con una curva de desvío (dos curvas de 30°, hechas en obra), así que nunca se tocan.

| ID | Tipo | Tamaño | Recorrido | Largo (m) | Cables |
|---|---|---|---|---:|---:|
| ANNEX_FEED | Bandeja | 200×50 | Rack → manga PEN-3 (muro sur del cuarto) | 4.0 | 19 |
| ANNEX_W | Canaleta plástica | 40×25 | Anexo, rama oeste, pegada al muro (4 cm) | 7.9 | 2 |
| ANNEX_E1 | Bandeja | 100×50 | Anexo, hasta la pila oeste del vano | 3.8 | 16 |
| ANNEX_E2 | Bandeja | 100×50 | Cruza el vano del pasillo colgada bajo el dintel | 9.1 | 10 |
| ANNEX_E3 | Canaleta plástica | 40×25 | Anexo, rama este, pegada al muro (4 cm) | 11.6 | 2 |
| RISER_W | EMT | 1¼" | Subida por la pila oeste del vano hasta el muro trasero | 2.9 | 6 |
| BACK_W | EMT | 1¼" | Muro trasero sobre la grada oeste | 16.6 | 6 |
| WEST | EMT | 1" | Muro oeste, sobre la grada y las canchas (3 Cat6 + fibra OM3) | 32.1 | 3 |
| NORTH_A | EMT | 1¼" | Muro norte hasta el IDF (X 30) | 30.0 | 4 |
| RISER_E | EMT | 1¼" | Subida por la pila este del vano | 2.9 | 7 |
| BACK_E | EMT | 1¼" | Muro trasero sobre la grada este y su muro lateral | 20.6 | 7 |
| OFFICES_IN | EMT | ¾" | Muro lateral de la grada este, bajando hasta la manga PEN-7 (h 3.8 m) | 1.9 | 2 |
| PEN7 | Manga | Ø100 | Muro oeste de oficinas, sobre la última fila de la grada | 0.4 | 2 |
| PEN8 | Manga | Ø50 | Muro oeste, esquina noroeste, a 5.7 m, hacia la cámara exterior CAM17 (§5.3) | 0.3 | 1 |
| PEN9 | Manga | Ø50 | Muro sur, esquina suroeste, a 5.7 m, hacia la cámara exterior CAM18 (§5.3) | 0.3 | 1 |
| OFF_IN | Canaleta plástica | 40×25 | Dentro de oficinas, baja a las canaletas de pared | 0.4 | 2 |
| OFF_S | Canaleta plástica | 40×25 | Oficinas, muro oeste, tramo sur | 1.8 | 1 |
| OFF_N | Canaleta plástica | 40×25 | Oficinas, muros oeste y norte (hasta M16) | 7.2 | 1 |
| STAGE_A | EMT | 1" | Remate del muro de la grada este, rodea la esquina de oficinas y sigue por su cara norte (lado escenario) hasta X 45.9, h 5.7 m | 7.2 | 3 |
| STAGE_B | EMT | ¾" | Cara norte del muro de oficinas, hasta la esquina del escenario (CAM05 y CAM15) | 8.7 | 2 |
| STAGE_R | EMT | ½" | Bajada por la cara norte del muro de oficinas, de 5.7 a 2.6 m | 3.2 | 1 |
| STAGE_M | EMT | ½" | Ramal pegado a la cara del muro que carga a M17 (sube a 2.95 m en la esquina; termina 0.35 m antes del AP) | 5.0 | 1 |
| IDF_UP | EMT | 1½" | Del gabinete IDF (tapa a 5.6 m) al tubo del muro norte (5.7 m) | 0.3 | 7 |
| NORTH_B | EMT | 1" | Muro norte, hasta el muro de M18 | 16.4 | 3 |
| BR_M18 | EMT | ½" | Ramal que baja por el muro norte y sigue pegado a la cara del muro de M18 (h 2.95 m, termina 0.35 m antes del AP) | 7.1 | 1 |
| NORTH_C | EMT | ½" | Muro norte, esquina del escenario (CAM04) | 8.2 | 1 |
| AUDIO_R | EMT | ¾" | Tablero → muro lateral de la grada este, hasta la bocina SPK-E1 (h 3.0 m) | 6.3 | — |
| AUDIO_L | EMT | ¾" | Tablero → muro oficinas, muro lateral y trasero a 6.6 m → muro oeste, hasta la bocina SPK-W1 (h 3.0 m) | 71.1 | — |

Totales: **213 m de canalización de datos (17.0 m de malla, 163.1 m de EMT, 32 m de canaleta plástica y 1.0 m de manga), ≈ 31 m de bajadas EMT y ≈ 77 m de tubo de audio (EMT ¾")** (≈ 321 m); con 10% de reserva, **353 m**. (En la versión anterior el audio se sumaba como 102 m; los dos tubos de la tabla suman 77.4 m.)

**Qué va en cada tipo y por qué.** Las gradas están al alcance del público y las canchas se usan para voleibol y tenis, así que todo el recorrido a la vista (muro trasero, subidas, muros oeste y norte, IDF y escenario) va en **tubo EMT**: cerrado, metálico y atornillado, no se abre ni se desconecta a mano como una malla. La malla se queda solo en el anexo (ANNEX_FEED 17 cables, ANNEX_E1 15, ANNEX_E2 9), donde no entra el público. Tamaños con 40 % de relleno y 25 % de crecimiento, contando la fibra donde pasa: ½" para 1 cable, ¾" para 2, 1" para WEST (3 Cat6 + fibra) y NORTH_B (3 cables), **1¼" para RISER_W, BACK_W, NORTH_A, RISER_E y BACK_E** (4 a 6 cables) y **1½" para IDF_UP** (7 cables + fibra).

**Lo que cuesta pasar los troncos a tubo:** cada dispositivo necesita una caja de registro donde sale su bajada, y sumar cables después exige abrir cajas y volver a jalar; en malla bastaba con colocar el cable encima. La fibra OM3 debe ir en subducto dentro del mismo tubo (no suelta junto al cobre).

- **EMT en canchas y escenario**, donde hay balones y personas: va **pegado al muro con abrazaderas de conduit** (banda alrededor del tubo y oreja atornillada al muro). Solo las que pide la norma (NOM-001-SEDE art. 358.30, fuente secundaria: confirmar): una a ≤ 0.9 m de cada caja o extremo (se colocan a 0.3 m) y una cada ≤ 3 m entre ellas. Son **90 abrazaderas** en todo el EMT, sin ménsulas ni varillas; la malla del anexo y la canaleta plástica conservan sus soportes. Los ramales de M17 y M18 van a 2.95 m, pegados al remate de sus muros (2.98 m), fuera del alcance; solo la bajada de STAGE_M a 2.6 m (≈ 0.9 m de tubo) queda al alcance de personas: si se considera daño físico severo, cambiar a tubo rígido.
- **Canaleta plástica solo en interiores secos** (oficinas y anexo, hasta 3.8 m), pegada al muro a 4 cm y fijada cada ≈ 0.6 m. No se usa en canchas ni en el escenario.
- **Cajas de registro: 42** (20 de entrada y 22 de bajada, una por dispositivo). Ninguna corrida pasa de 30 m ni de dos curvas de 90° entre cajas, así que no hacen falta cajas de paso.
- **Menos soportes:** el EMT se soporta cada ≤ 3 m; la malla pedía ménsulas cada ≤ 1.5 m.

### 5.3 Perforaciones (los "hoyos")

Cada una se validó con el modelo: la trayectoria atraviesa realmente ese muro y ninguna otra trayectoria de datos ni de audio cruza un muro.

| ID | Dónde | Posición (X, Y, h) | Mangas | Espesor |
|---|---|---|---|---|
| PEN-3 | Muro sur del cuarto de redes → anexo | (12.9, 32.3, 2.5) | 2 × Ø100 | 0.20 m |
| PEN-7 | Muro oeste de oficinas (lado grada este → interior), sobre la última fila | (42.58, 28.2, 3.8) | 2 × Ø100 | 0.20 m |
| PEN-8 | Muro oeste, esquina noroeste → cámara exterior CAM17 | (-0.1, 0.8, 5.7) | 1 × Ø50 | 0.20 m |
| PEN-9 | Muro sur, esquina suroeste → cámara exterior CAM18 | (1.0, 32.3, 5.7) | 1 × Ø50 | 0.20 m |

Para cada una: manga de acero rígido con 2 cm de sobresalida por lado y **sellado cortafuego** del espacio anular y de la manga vacía (TIA-569, NOM-001-SEDE art. 300-21). Una de las dos mangas de cada punto queda de reserva.

### 5.4 IDF-N (gabinete del muro norte)

- **Dónde:** muro norte, X 30.0, centro a h 5.4 m, gabinete de pared de 6U (≈ 0.6 × 0.4 × 0.4 m) pegado al muro. La tapa queda a 5.6 m, justo bajo el tubo de datos del muro norte (5.7 m), que pasa por encima; de ahí un tubo de 0.3 m baja hasta el gabinete. Queda fuera del alcance de balones y público y casi no se ve desde las gradas. **Por verificar:** dar servicio a 5.4 m exige escalera alta o plataforma elevadora (el espacio de trabajo frente al equipo energizado, NOM-001-SEDE 110-26, no se revisó).
- **Alimentación de datos:** fibra OM3 de ≈ 104 m desde el rack, por la misma canalización que el cobre (en subducto, dentro del EMT) (rack → anexo → pila oeste → muro trasero → muro oeste → muro norte). 10GBASE-SR sobre OM3 llega a 300 m (TIA-568.3).
- **Equipo:** se mueve el **switch PoE++ de 24 puertos (TP-Link SG3428XMPP)** del rack al IDF; en el rack queda el de 48 puertos. No se compra ningún switch nuevo. Se usan 2 de los 4 transceptores SFP+ del presupuesto (los otros 2 quedan de reserva).
- **Atiende 7 dispositivos:** M01–M04, M18, CAM02, CAM04. Rack: los otros 19 (M06, M07, M09, M10, M12, M13, M14, M15, M16, M17, CAM05, CAM07, CAM10, CAM11, CAM12, CAM15, CAM16, CAM17, CAM18) más el escritorio. Las oficinas se alimentan desde el rack por el muro lateral de la grada este (PEN-7) y el escenario sur (CAM05, M17) por fuera, siguiendo el remate de ese muro y la cara norte del muro de oficinas, sin perforar: ningún cable da la vuelta al auditorio y no hay bandeja en el muro este del escenario.
- **Falta presupuestar (sin precio en este documento):** gabinete de pared de 6U, circuito de 127 V dedicado, y un UPS pequeño para el IDF (el UPS de 3000 VA del rack no llega hasta ahí). Verificar el presupuesto PoE del SG3428XMPP contra las ≈ 145 W de sus 7 dispositivos (estimado).

### 5.5 Cableado por dispositivo

Charola = distancia por las trayectorias desde su origen hasta la bajada; enlace permanente = charola + bajada; corte = enlace × 1.10 + 5 m (bucles de servicio).

| ID | Tipo | Origen | Última trayectoria | Charola (m) | Bajada (m) | Enlace (m) | Corte (m) |
|---|---|---|---|---:|---:|---:|---:|
| M01 | AP | IDF-N | ID_W | 25.6 | 2.8 | 28.4 | 36.2 |
| M02 | AP | IDF-N | ID_W | 14.6 | 2.6 | 17.2 | 24.0 |
| M03 | AP | IDF-N | ID_W | 3.5 | 2.5 | 6.0 | 11.6 |
| M04 | AP | IDF-N | NORTH_B | 8.0 | 2.5 | 10.5 | 16.6 |
| M06 | AP | Rack | WEST | 40.1 | 2.5 | 42.5 | 51.8 |
| M07 | AP | Rack | WEST | 30.2 | 0.6 | 30.9 | 39.0 |
| M09 | AP | Rack | BACK_W | 11.0 | 0.5 | 11.5 | 17.7 |
| M10 | AP | Rack | BACK_E | 19.8 | 0.8 | 20.7 | 27.7 |
| M12 | AP | Rack | BACK_E | 40.2 | 1.6 | 41.8 | 50.9 |
| M13 | AP | Rack | ANNEX_W | 5.3 | 0.8 | 6.2 | 11.8 |
| M14 | AP | Rack | ANNEX_E2 | 12.4 | 1.8 | 14.1 | 20.6 |
| M15 | AP | Rack | ANNEX_E3 | 22.0 | 0.8 | 22.8 | 30.1 |
| M16 | AP | Rack | OFF_N | 50.4 | 0.6 | 50.9 | 61.0 |
| M17 | AP | Rack | STAGE_M | 55.8 | 0.5 | 56.3 | 66.9 |
| M18 | AP | IDF-N | BR_M18 | 23.8 | 0.5 | 24.3 | 31.7 |
| CAM02 | Domo | IDF-N | ID_W | 30.1 | 2.5 | 32.5 | 40.8 |
| CAM04 | Domo | IDF-N | NORTH_C | 24.7 | 0.7 | 25.4 | 33.0 |
| CAM05 | Domo | Rack | STAGE_B | 55.9 | 2.0 | 58.0 | 68.8 |
| CAM07 | Domo | Rack | OFF_S | 44.9 | 1.2 | 46.1 | 55.7 |
| CAM10 | Domo | Rack | BACK_W | 27.1 | 0.2 | 27.4 | 35.1 |
| CAM11 | Bullet | Rack | ANNEX_W | 11.9 | 0.6 | 12.6 | 18.8 |
| CAM12 | Bullet | Rack | ANNEX_E3 | 28.5 | 0.6 | 29.1 | 37.0 |
| CAM15 | Domo | Rack | STAGE_B | 55.8 | 1.7 | 57.5 | 68.2 |
| CAM16 | Domo | Rack | ROOM_TRAY_E | 3.4 | 0.4 | 3.8 | 9.2 |
| CAM17 | Domo | Rack | PEN8 | 59.7 | 0.5 | 60.3 | 71.3 |
| CAM18 | Domo | Rack | PEN9 | 27.6 | 0.5 | 28.1 | 35.9 |

Se suma 1 salida para el escritorio de operación (≈ 8 m). **Corte total ≈ 979 m → 4 cajas de 305 m (1 220 m)**; la cuarta caja es reserva por tendido y reterminado. El enlace más largo es CAM17 con 60.3 m (antes 72.2 m); los de oficinas y escenario sur bajaron de 54–72 m a 46–59 m.

### 5.6 Pegado a paredes

El EMT queda a **≈ 3 cm del muro** (eje del tubo; las subidas bajo el dintel, a 3 cm del techo). Cada bandeja, manga y bajada queda a **≤ 0.35 m de un muro, techo o poste** en todo su largo (la prueba mide la distancia al modelo cada 10 cm). El cruce del vano va pegado al dintel (h 3.1 m; el dintel está a 3.28 m) y las subidas van pegadas a las pilas del vano. El ramal a M18 baja por el muro norte y sigue pegado a la cara del muro de M18 (h 2.95 m, 3 cm bajo el remate), sin cruzar el aire. El lado del escenario no tiene tramos sin pegar: el tronco va pegado a la cara norte del muro de oficinas (salvo las dos curvas de desvío frente al audio, a ≈ 13 cm del muro) y el ramal a M17 sigue la cara del muro que lo carga, así que la bajada a M17 mide 0.5 m (antes ≈ 5 m, con un tramo libre hasta un poste). La excepción documentada del poste suelto desaparece. **Sin excepciones:** la bajada a CAM16, dentro del cuarto de redes, ya no cruza el aire: una charola de malla (`ROOM_TRAY_E`) sale de la parte alta del rack, sigue el techo hacia el muro este y llega a la esquina de la cámara; el enlace del escritorio va aparte, en una canaleta de plástico (`ROOM_DESK`) que sube por el muro este, cruza bajo la charola y llega a la parte alta del rack.

### 5.7 Cumplimiento

| Requisito | Criterio | Resultado |
|---|---|---|
| ANSI/TIA-568.2 (enlace permanente) | ≤ 90 m | **Cumple con holgura.** Máximo 60.3 m (CAM17); CAM05 ≈ 58 m, CAM15 57.5 m, M16 50.9 m |
| ANSI/TIA-568.3 (fibra) | OM3, 10GBASE-SR ≤ 300 m | ≈ 104 m al IDF |
| ANSI/TIA-569 (llenado de charola) | ≤ 50% con 25% de crecimiento | Cumple en las 3 bandejas del anexo (la más cargada, 200 mm con 17 cables, usa ≈ 6%) |
| ANSI/TIA-569 (llenado de ducto) | ≤ 40% con 25% de crecimiento (53 / 31 / 40 % para 1 / 2 / 3+ cables) | Cumple: mangas Ø100 con ≤ 2 cables usan ≈ 1%; los EMT de ½", ¾", 1", 1¼" y 1½" cumplen contando la fibra donde pasa |
| ANSI/TIA-569 (registros) | ≤ 30 m y ≤ 2 curvas de 90° entre cajas | Cumple con 42 cajas (entrada y una por bajada) |
| NOM-001-SEDE art. 358 (EMT) | Soporte cada ≤ 3 m y a ≤ 0.9 m de cada caja; no usar donde haya daño físico severo | 90 abrazaderas: a 0.3 m de cada caja o extremo y cada ≤ 3 m. **Por verificar:** el tramo de STAGE_M a 2.6 m (≈ 0.9 m) queda al alcance de personas; las subidas RISER_W y RISER_E bajan hasta 3.1 m en las pilas del vano |
| NOM-001-SEDE art. 388 (canaleta no metálica) | Solo interior seco y a la vista, sin riesgo de golpes | **Por verificar** (anexo y oficinas): confirmar en la NOM y la clasificación de fuego del cable |
| ANSI/TIA-569 (cortafuego) | Sellar toda perforación | 4 puntos, 6 mangas (§5.3) |
| ANSI/TIA-569 (curvas) | Radio ≥ 4× Ø del cable (≈ 25 mm); curvas de EMT ≥ 6× Ø; ≤ 360° de curvas entre cajas (NEC 358.26) | Se define en el procedimiento de tendido; la corrida con más curvas (STAGE_A, esquina más dos desvíos) suma 210° |
| ANSI/TIA-607 (puesta a tierra) | Unir cada tramo de bandeja o EMT, el rack y el IDF a la barra de tierra | Cada bandeja lleva puente de unión y el EMT va con conectores metálicos continuos; el IDF recibe un conductor de tierra desde la barra del rack por la misma canalización |
| ANSI/TIA-606 (etiquetado) | Identificador único por salida y por trayectoria | Se usan los ids de esta memoria (M01…, CAM02…, PEN-3…, IDF-N) |
| NOM-001-SEDE (potencia vs datos) | Separar datos de potencia | Mínimo 30 cm en paralelo o división metálica (criterio de este proyecto) |
| IEEE 802.3at (PoE) | 30 W en el puerto, ≈ 25.5 W en el AP | 15 AP ≈ 381 W; 11 cámaras ≈ 100–110 W (estimado); rack ≈ 340 W, IDF ≈ 145 W (estimado) |
| TIA TSB-184 (calentamiento de haz) | Haces PoE de muchos cables | El haz mayor lleva 17 cables Cat6; verificar con la ficha del fabricante |

### 5.8 Supuestos (confirmar en el levantamiento de obra)

- Los muros miden 0.20 m en el modelo y el material se asume de mampostería o concreto.
- La bandeja ANNEX_E2 cruza colgada el vano del pasillo central (≈ 9 m) y necesita colgantes anclados al techo del anexo; las subidas van pegadas a las pilas del vano (X 16.75 y X 25.7), que están libres.
- El anexo (pasillo) está disponible para la bandeja a 3.1 m a lo largo de su muro norte.
- El poste en X ≈ 46.5 del borde del escenario (h hasta 2.9 m) limita la altura de la línea de audio y de la bandeja de oficinas.
- Los muros aceptan taquetes para las abrazaderas (el modelo los muestra de 0.2 m; confirmar el material en obra).
- Las bajadas son EMT de ¾" en el orden de ejes que evita atravesar muros; la ruta exacta la define el instalador.
- Los baños y vestidores bajo las gradas no se tocan: no hay cable, manga ni perforación bajo la superficie de las gradas (salvo el cuarto de redes).

## 6. Hardware (capítulo 8 — cambios)

| Concepto | Modelo | Antes | Ahora | Unitario s/IVA | Total s/IVA |
|---|---|---:|---:|---:|---:|
| Access point Wi-Fi 7 | TP-Link EAP773 | 14 | **15** | $5,117.24 | $76,758.60 |
| Cámara domo 4 MP | VIGI C240I | 10 | **8** | $762.93 | $6,103.44 |
| Cámara bullet 4 MP | VIGI C340I | 4 | **3** | $1,098.28 | $3,294.84 |

Subtotal hardware: **$294,003.22** (antes $291,510.12). Resto de equipos, sin cambios.

Observación abierta: con 11 cámaras el NVR de 32 canales y los 4 discos de 8 TB quedan sobredimensionados (≈ 28 Mbps a 4 Mbps/cámara → ≈ 9 TB a 30 días). Se mantienen por ahora para no tocar el diseño sin tu decisión.

## 7. Materiales (capítulo 8 — cambios)

| Material | Antes | Ahora | Total s/IVA |
|---|---:|---:|---:|
| Cable UTP Cat6, caja 305 m | 9 | **4** | $18,595.56 |
| Jack RJ45 Cat6 (2 por salida + 4 de reserva) | 40 | **58** | $17,420.00 |
| Faceplate 2 puertos | 20 | **12** | $547.55 |
| Caja superficial y accesorios | 20 | **23** | $1,586.21 |
| Canalización y accesorios (PVC/charola) | 500 m | **390 m** | $60,517.25 |

Sin cambios: patch panels, 48 patch cords, 4 organizadores, etiquetado, tierra, fibra OM3, cableado XLR (lote), soportes de bocinas y micrófono, distribución eléctrica de audio.

Subtotal materiales: **$170,517.86** (antes $205,583.20).

## 8. Resumen de costos

Mano de obra, cargas sociales y costos operativos **no se modificaron** (*supuesto*: se revisan con el nuevo número de salidas y rutas en una siguiente pasada). Con las 4 cámaras nuevas (CAM15 a CAM18) y con CAM02 como bullet (ajustes guardados del proyecto) se actualizaron el hardware (+3 domos, +1 bullet) y los jacks. **No se recalcularon** los faceplates, la canalización (+≈ 5 m de bajadas), el NVR ni la mano de obra. Jacks: 27 salidas × 2 + 4 de reserva = 58.

| Concepto | Importe MXN |
|---|---:|
| Hardware | $294,003.22 |
| Materiales y consumibles | $170,517.86 |
| Mano de obra directa | $241,850.00 |
| Cargas sociales e ISN | $79,810.50 |
| Seguros, herramientas y operación | $76,000.00 |
| **Costo directo** | **$862,181.58** |
| Contingencia 8% | $68,974.53 |
| Costo interno del proyecto | $931,156.11 |
| Utilidad Dream Team Networks 18% | $167,608.10 |
| Precio de venta antes de IVA | $1,098,764.21 |
| IVA 16% | $175,802.27 |
| **PRECIO TOTAL AL CLIENTE** | **$1,274,566.48** |

Presupuesto máximo $1,600,000.00 → se usa **79.66%**; margen **$325,433.52** (20.34%).

## 9. Supuestos y pendientes

1. **Perforaciones:** PEN-3, PEN-7, PEN-8 y PEN-9 (§5.3) salen de las trayectorias que el modelo muestra libres; confirmar en obra que el muro sea el esperado y no haya instalaciones dentro. PEN-8 y PEN-9 dan a la intemperie: sellar contra el agua y usar cable Cat6 de exterior (cubierta UV) o tubo hasta la cámara en los ≈ 0.5 m de afuera. **Obra civil no presupuestada:** 6 mangas y el sellado cortafuego no tienen partida en la lista de precios del documento; falta cotizarlos.
1b. **IDF-N (§5.4):** faltan por presupuestar el gabinete de pared de 6U, el circuito dedicado y un UPS pequeño; el switch PoE++ de 24 puertos sale del rack. Verificar el presupuesto PoE del SG3428XMPP contra los ≈ 145 W de sus 7 dispositivos (estimado), y que el muro norte permita el montaje (no hay datos de su material).
1d. **Canalización híbrida (§5.2):** falta cotizar el tubo EMT (½", ¾", 1", 1¼" y 1½", 163.1 m), sus abrazaderas y soportes, el subducto para la fibra, las 42 cajas de registro, 17.0 m de malla y 29 m de canaleta plástica; el presupuesto sigue con la partida mezclada "PVC/charola". Las reglas de registros, de relleno por número de cables y del art. 388 salen de fuentes secundarias (no del texto de la TIA-569 ni de la NOM): confirmarlas, y la clasificación de fuego del cable (plenum o LSZH) dentro de canaleta plástica.
1c. **Audio (§4.3):** falta cotizar ≈ 77 m de EMT ¾", sus 32 abrazaderas, 7 cajas de registro y los codos y conectores (sin partida en la lista de precios del documento). Ya no hay canaleta de acero de 50 × 40 mm ni ángulo de guarda.
2. Posición del puesto FOH (mesa sobre el escenario en 47.6, 24.2; mesa y tablero a 0.4 m de la cabecera de la escalera sur) y cable de audio L por la parte alta del muro trasero (≈ 71 m de XLR) y lote de XLR por verificar.
3. Cobertura de canchas y escenario sin refuerzo de audio: decisión del cliente. Capacidad del muro y de los anclajes de las bocinas.
4. Mano de obra: sin ajustar por menos cámaras y nuevas rutas.
5. Cámaras: con 7 el diseño se aleja del plano original; confirmar si se reponen (el margen del presupuesto lo permite).
6. NVR y discos sobredimensionados.
7. Longitudes calculadas sobre la geometría del modelo; confirmar con levantamiento de obra.
8. Faltan en el documento (no en esta versión): capítulos de arquitectura/VLAN/IP, cálculo Wi-Fi, normativa, anexos y plan de validación detallado.
