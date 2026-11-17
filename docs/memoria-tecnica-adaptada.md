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
| Cable UTP Cat6 | 9 cajas (2 745 m) | **4 cajas** (1 220 m; ≈ 890 m calculados) |
| Puntos de red (salidas) | 28 | **23** (15 AP + 7 cámaras + 1 escritorio) |
| Perforaciones (muros) | 0 (no estimadas) | **2 puntos, 4 mangas** (§5.3) |
| IDF-N en el muro norte | no existía | **1** (usa el switch de 24 puertos que estaba en el rack) + fibra OM3 ≈ 106 m |
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

**Debajo de las gradas hay baños y vestidores, así que ninguna ruta pasa por ahí:** no se usa el vacío bajo las gradas ni se perfora la losa.

- **Hoyos que atraviesan muros: solo 2 puntos, 4 mangas de Ø100.** PEN-3 (muro sur del cuarto de redes → anexo) y PEN-6 (muro norte de oficinas). Están en §5.3.
- **Todo lo demás va en superficie, sin atravesar nada:** bandeja de malla (charola) sobre soportes de pared, bajadas en EMT de ¾" y canaleta de piso para el audio. Solo requiere taquetes de anclaje (no cuentan como perforaciones).
- **Cómo se llega a las canchas:** el cable sale del cuarto de redes por PEN-3 al anexo, cruza el **vano del pasillo central** (que ya existe, bajo el dintel) y sube por las **pilas del vano** hasta el muro trasero, por arriba de la última fila de las gradas; de ahí recorre los muros perimetrales a 5.7 m.
- **Un IDF en el muro norte (IDF-N)** alimenta el lado norte y el escenario, conectado al rack con **fibra OM3 de ≈ 106 m**. Sin el IDF, el AP M04 quedaría a 99.5 m del rack (más de los 90 m permitidos).

### 5.2 Trayectorias

Alturas: bandejas de las canchas a **5.7 m** (sobre la última fila, 3.77 m, y bajo el techo, 6.85 m); anexo a 3.1 m (bajo el dintel del vano, 3.28 m); oficinas y escenario sur a 3.4 m (sobre el poste de X 46.5 y la canaleta de audio a 3.0 m).

| ID | Tipo | Tamaño | Recorrido | Largo (m) | Cables |
|---|---|---|---|---:|---:|
| ANNEX_FEED | Bandeja | 200×50 | Rack → manga PEN-3 (muro sur del cuarto) | 4.0 | 10 |
| ANNEX_W | Bandeja | 100×50 | Anexo, hacia el oeste | 7.9 | 2 |
| ANNEX_E1 | Bandeja | 100×50 | Anexo, hasta la pila oeste del vano | 3.8 | 8 |
| ANNEX_E2 | Bandeja | 100×50 | Cruza el vano del pasillo colgada bajo el dintel | 8.9 | 5 |
| ANNEX_E3 | Bandeja | 100×50 | Anexo, hacia el este | 11.7 | 3 |
| RISER_W | Bandeja | 200×50 | Subida por la pila oeste del vano hasta el muro trasero | 3.2 | 3 |
| BACK_W | Bandeja | 200×50 | Muro trasero sobre la grada oeste | 16.6 | 3 |
| WEST | Bandeja | 200×50 | Muro oeste, sobre la grada y las canchas | 31.9 | 2 |
| NORTH_A | Bandeja | 200×50 | Muro norte hasta el IDF (X 30) | 29.8 | 5 |
| RISER_E | Bandeja | 100×50 | Subida por la pila este del vano | 3.2 | 2 |
| BACK_E | Bandeja | 100×50 | Muro trasero sobre la grada este y su muro lateral | 20.5 | 2 |
| IDF_UP | Bandeja | 200×50 | Del gabinete IDF a la bandeja del muro norte | 2.7 | 12 |
| NORTH_B | Bandeja | 100×50 | Muro norte, parte este | 24.5 | 7 |
| STAGE_N | Bandeja | 100×50 | Muro este del escenario, tramo norte | 4.1 | 6 |
| BR_M18 | Bandeja | 100×50 | Ramal al poste del AP M18 | 5.5 | 1 |
| STAGE_S | Bandeja | 100×50 | Muro este del escenario, tramo sur | 22.4 | 4 |
| STAGE_W | Bandeja | 100×50 | Cara norte del muro de oficinas, lado escenario | 5.5 | 3 |
| PEN6 | Manga | Ø100 | Muro norte de oficinas | 0.5 | 2 |
| OFFICES | Bandeja | 100×50 | Oficinas, muros norte y oeste | 11.4 | 2 |
| AUDIO_L / AUDIO_R | Canaleta | 30×30 | Ver §4.3 | 86.3 / 21.4 | — |

Totales: **217.4 m de bandeja de datos, 0.5 m de manga, ≈ 37 m de bajadas EMT y ≈ 102 m de canaleta de audio** (≈ 357 m); con 10% de reserva, **400 m**.

### 5.3 Perforaciones (los "hoyos")

Cada una se validó con el modelo: la trayectoria atraviesa realmente ese muro y ninguna otra trayectoria de datos ni de audio cruza un muro.

| ID | Dónde | Posición (X, Y, h) | Mangas | Espesor |
|---|---|---|---|---|
| PEN-3 | Muro sur del cuarto de redes → anexo | (12.9, 32.3, 2.5) | 2 × Ø100 | 0.20 m |
| PEN-6 | Muro norte de oficinas (lado escenario → interior) | (49.0, 24.6, 3.4) | 2 × Ø100 | 0.20 m |

Para cada una: manga de acero rígido con 2 cm de sobresalida por lado y **sellado cortafuego** del espacio anular y de la manga vacía (TIA-569, NOM-001-SEDE art. 300-21). Una de las dos mangas de cada punto queda de reserva.

### 5.4 IDF-N (gabinete del muro norte)

- **Dónde:** muro norte, X 30.0, centro a h 3.0 m (fuera del alcance de los balones), gabinete de pared de 6U (≈ 0.6 × 0.4 × 0.4 m) pegado al muro, por debajo de la bandeja de h 5.7 m.
- **Alimentación de datos:** fibra OM3 de ≈ 106 m desde el rack, por las mismas bandejas que el cobre (rack → anexo → pila oeste → muro trasero → muro oeste → muro norte). 10GBASE-SR sobre OM3 llega a 300 m (TIA-568.3).
- **Equipo:** se mueve el **switch PoE++ de 24 puertos (TP-Link SG3428XMPP)** del rack al IDF; en el rack queda el de 48 puertos. No se compra ningún switch nuevo. Se usan 2 de los 4 transceptores SFP+ del presupuesto (los otros 2 quedan de reserva).
- **Atiende 12 dispositivos:** M01–M04, M06, M16, M17, M18, CAM02, CAM04, CAM05, CAM07. Rack: los otros 10 (M07, M09, M10, M12, M13, M14, M15, CAM10, CAM11, CAM12) más el escritorio.
- **Falta presupuestar (sin precio en este documento):** gabinete de pared de 6U, circuito de 127 V dedicado, y un UPS pequeño para el IDF (el UPS de 3000 VA del rack no llega hasta ahí). Verificar el presupuesto PoE del SG3428XMPP contra las ≈ 265 W de los 12 dispositivos.

### 5.5 Cableado por dispositivo

Charola = distancia por las trayectorias desde su origen hasta la bajada; enlace permanente = charola + bajada; corte = enlace × 1.10 + 5 m (bucles de servicio).

| ID | Tipo | Origen | Última trayectoria | Charola (m) | Bajada (m) | Enlace (m) | Corte (m) |
|---|---|---|---|---:|---:|---:|---:|
| M01 | AP | IDF-N | ID_W | 28.0 | 2.6 | 30.6 | 38.7 |
| M02 | AP | IDF-N | ID_W | 17.0 | 2.5 | 19.5 | 26.5 |
| M03 | AP | IDF-N | ID_W | 5.9 | 2.5 | 8.4 | 14.2 |
| M04 | AP | IDF-N | NORTH_B | 10.4 | 2.5 | 13.0 | 19.3 |
| M06 | AP | IDF-N | WEST_R | 51.8 | 2.5 | 54.3 | 64.7 |
| M07 | AP | Rack | WEST | 30.4 | 0.8 | 31.2 | 39.3 |
| M09 | AP | Rack | BACK_W | 11.4 | 0.6 | 12.0 | 18.2 |
| M10 | AP | Rack | BACK_E | 20.0 | 0.9 | 20.9 | 27.9 |
| M12 | AP | Rack | BACK_E | 40.2 | 1.7 | 42.0 | 51.1 |
| M13 | AP | Rack | ANNEX_W | 5.3 | 0.9 | 6.3 | 11.9 |
| M14 | AP | Rack | ANNEX_E2 | 12.4 | 1.8 | 14.2 | 20.6 |
| M15 | AP | Rack | ANNEX_E3 | 21.9 | 0.9 | 22.9 | 30.2 |
| M16 | AP | IDF-N | OFFICES | 62.2 | 0.6 | 62.7 | 74.0 |
| M17 | AP | IDF-N | STAGE_W | 59.1 | 5.2 | 64.3 | 75.8 |
| M18 | AP | IDF-N | BR_M18 | 36.7 | 3.6 | 40.3 | 49.3 |
| CAM02 | Domo | IDF-N | ID_W | 32.5 | 2.4 | 34.8 | 43.3 |
| CAM04 | Domo | IDF-N | STAGE_N | 27.3 | 1.8 | 29.0 | 36.9 |
| CAM05 | Domo | IDF-N | STAGE_S | 53.1 | 0.8 | 53.8 | 64.2 |
| CAM07 | Domo | IDF-N | OFFICES | 71.0 | 1.2 | 72.2 | 84.4 |
| CAM10 | Domo | Rack | BACK_W | 27.5 | 0.4 | 27.9 | 35.7 |
| CAM11 | Bullet | Rack | ANNEX_W | 11.9 | 0.6 | 12.5 | 18.7 |
| CAM12 | Bullet | Rack | ANNEX_E3 | 28.5 | 0.4 | 28.9 | 36.8 |

Se suma 1 salida para el escritorio de operación (≈ 8 m). **Corte total ≈ 890 m → 4 cajas de 305 m (1 220 m)**; la cuarta caja es reserva por tendido y reterminado. El enlace más largo es CAM07 con 72.2 m.

### 5.6 Pegado a paredes

Cada bandeja, manga y bajada queda a **≤ 0.35 m de un muro, techo o poste** en todo su largo (la prueba mide la distancia al modelo cada 10 cm). El cruce del vano va pegado al dintel (h 3.1 m; el dintel está a 3.28 m) y las subidas van pegadas a las pilas del vano. El escenario tiene postes sueltos y su techo está a 8.2 m, así que **3 tramos no pueden pegarse** y llevan soporte propio:

| Tramo | Largo libre | Soporte |
|---|---:|---|
| Ramal BR_M18 (hacia el poste del AP M18) | ≈ 5.2 m | Charola colgada del techo del escenario con varilla roscada cada 1.5 m |
| Bajada a M17 (poste suelto) | ≈ 2.4 m | Tubo rígido entre el muro de oficinas y el poste, con soporte cada ≤ 1.5 m |
| Bajada a M18 | ≈ 3 m | Tubo rígido a lo largo del poste |

### 5.7 Cumplimiento

| Requisito | Criterio | Resultado |
|---|---|---|
| ANSI/TIA-568.2 (enlace permanente) | ≤ 90 m | **Cumple con holgura.** Máximo 72.2 m (CAM07); M16 62.7 m, M17 64.3 m |
| ANSI/TIA-568.3 (fibra) | OM3, 10GBASE-SR ≤ 300 m | ≈ 106 m al IDF |
| ANSI/TIA-569 (llenado de charola) | ≤ 50% con 25% de crecimiento | Cumple en todas (la más cargada, 200 mm con 12 cables, usa ≈ 5%) |
| ANSI/TIA-569 (llenado de ducto) | ≤ 40% con 25% de crecimiento | Cumple: mangas Ø100 con ≤ 4 cables usan ≈ 2% |
| ANSI/TIA-569 (cortafuego) | Sellar toda perforación | 2 puntos, 4 mangas (§5.3) |
| ANSI/TIA-569 (curvas) | Radio ≥ 4× Ø del cable (≈ 25 mm); curvas de EMT ≥ 6× Ø | Se define en el procedimiento de tendido |
| ANSI/TIA-607 (puesta a tierra) | Unir cada tramo de bandeja, el rack y el IDF a la barra de tierra | Cada bandeja lleva puente de unión; el IDF recibe un conductor de tierra desde la barra del rack por la misma bandeja |
| ANSI/TIA-606 (etiquetado) | Identificador único por salida y por trayectoria | Se usan los ids de esta memoria (M01…, CAM02…, PEN-3…, IDF-N) |
| NOM-001-SEDE (potencia vs datos) | Separar datos de potencia | Mínimo 30 cm en paralelo o división metálica (criterio de este proyecto) |
| IEEE 802.3at (PoE) | 30 W en el puerto, ≈ 25.5 W en el AP | 15 AP ≈ 381 W; 7 cámaras ≈ 60–70 W (estimado); rack ≈ 120 W, IDF ≈ 265 W |
| TIA TSB-184 (calentamiento de haz) | Haces PoE de muchos cables | El haz mayor lleva 12 cables Cat6; verificar con la ficha del fabricante |

### 5.8 Supuestos (confirmar en el levantamiento de obra)

- Los muros miden 0.20 m en el modelo y el material se asume de mampostería o concreto.
- La bandeja ANNEX_E2 cruza colgada el vano del pasillo central (≈ 9 m) y necesita colgantes anclados al techo del anexo; las subidas van pegadas a las pilas del vano (X 16.75 y X 25.7), que están libres.
- El anexo (pasillo) está disponible para la bandeja a 3.1 m a lo largo de su muro norte.
- El poste en X ≈ 46.5 del borde del escenario (h hasta 2.9 m) limita la altura de la línea de audio y de la bandeja de oficinas.
- Las bajadas son EMT de ¾" en el orden de ejes que evita atravesar muros; la ruta exacta la define el instalador.
- Los baños y vestidores bajo las gradas no se tocan: no hay cable, manga ni perforación bajo la superficie de las gradas (salvo el cuarto de redes).

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

1. **Perforaciones:** PEN-3 y PEN-6 (§5.3) salen de las trayectorias que el modelo muestra libres; confirmar en obra que el muro sea el esperado y no haya instalaciones dentro. **Obra civil no presupuestada:** 4 mangas y el sellado cortafuego no tienen partida en la lista de precios del documento; falta cotizarlos.
1b. **IDF-N (§5.4):** faltan por presupuestar el gabinete de pared de 6U, el circuito dedicado y un UPS pequeño; el switch PoE++ de 24 puertos sale del rack. Verificar el presupuesto PoE del SG3428XMPP contra los ≈ 265 W de sus 12 dispositivos, y que el muro norte permita el montaje (no hay datos de su material).
2. Posición del puesto FOH (mesa sobre el escenario en 47.6, 24.2; mesa y tablero a 0.4 m de la cabecera de la escalera sur) y cable de audio L por la parte alta del muro trasero (≈ 86 m de XLR) y lote de XLR por verificar.
3. Cobertura de canchas y escenario sin refuerzo de audio: decisión del cliente. Protección de las bocinas contra balonazos.
4. Mano de obra: sin ajustar por menos cámaras y nuevas rutas.
5. Cámaras: con 7 el diseño se aleja del plano original; confirmar si se reponen (el margen del presupuesto lo permite).
6. NVR y discos sobredimensionados.
7. Longitudes calculadas sobre la geometría del modelo; confirmar con levantamiento de obra.
8. Faltan en el documento (no en esta versión): capítulos de arquitectura/VLAN/IP, cálculo Wi-Fi, normativa, anexos y plan de validación detallado.
