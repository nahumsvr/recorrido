# Correcciones a la memoria técnica (PDF del 17/11/2026) contra el modelo 3D

Documento revisado: `EntregableDocumentacionUA_Costos_Corregidos_Final2.pdf` (46 páginas).
Criterio: **el modelo 3D (`recorrido`) es la fuente de verdad.** Las cantidades de abajo salen del código del modelo (`src/data/*`), medidas sobre sus rutas y contra la malla real del edificio; no son estimaciones a mano.

**Veredicto:** el PDF no coincide con el modelo en cámaras, bocinas, puntos de red, cable, canalización, perforaciones y fibra. La aritmética del presupuesto sí es correcta (subtotales, IMSS/INFONAVIT/ISN, contingencia, utilidad e IVA se recalcularon y cuadran), pero parte de cantidades viejas. Con el modelo, el precio total baja de **$1,269,361.62 a $1,248,410.72** (78.03 % del tope), **sin contar** los faltantes de la sección 3, que hoy no tienen precio.

## 1. Discrepancias texto/tablas contra el modelo

| # | Sección del PDF | El PDF dice | El modelo tiene | Corrección |
|---|---|---|---|---|
| 1 | §7 Equipos, Videovigilancia, Matriz, Lista maestra, §8 Hardware | 7 cámaras: 5 C240I (domo) + 2 C340I (bullet); NVR "suficiente para 7 cámaras"; "7 de 16 canales" | **11 cámaras: 8 C240I** (CAM04, 05, 07, 10, 15, 16, 17, 18) **+ 3 C340I** (CAM02, 11, 12) | Cantidades 8 y 3; "11 de 16 canales"; "suficiente para 11 cámaras" |
| 2 | §7 Equipos, Videovigilancia | Descripción del NVR para 7 cámaras; "evitando el sobredimensionamiento" | El rack del modelo dibuja un **NVR4032H (32 canales)**, no el NVR2016H | Ver decisión D1 |
| 3 | §7 Audio (tabla y párrafo), §8 Hardware, Lista maestra | 4 bocinas EON715, "dos por grada", "al frente de las dos gradas" (SPK-W1, W2, E1, E2) | **2 bocinas** (SPK-W1, SPK-E1), una por grada, en el muro lateral de cada una a 3.0 m, a 0.45 m del muro, apuntando al centro de la grada | 2 bocinas; texto de ubicación; quitar "dos unidades por grada" |
| 4 | §7 Matriz (MG12XU → EON715) | "encadenamiento de bocinas por grada" | Cada línea (L, R) termina en **una** bocina; no hay encadenamiento | "salida L/R, una bocina por línea" |
| 5 | §7 Soportes de bocina | 4 | 2 (uno por bocina) | 2 |
| 6 | §7 Cableado, Lista maestra, §14 TIA-568 | ≈ 815 m de corte de Cat6 | **≈ 982 m** (971.2 m de 26 dispositivos + 11.2 m del escritorio) | ≈ 982 m. Las 4 cajas (1,220 m) siguen alcanzando: reserva de 238 m (24 %) |
| 7 | §7 Cableado, Lista maestra, §8 Materiales | 23 salidas/dispositivos (15 AP + 7 cámaras + 1 escritorio) | **27** (15 AP + 11 cámaras + 1 escritorio) | 27 |
| 8 | §7, Lista maestra, §8 Materiales, §14 TIA-569 | Canalización total 390 m con 10 % de reserva | **≈ 328 m netos, ≈ 361 m con 10 %** (ver desglose en §3) | 361 m |
| 9 | §14 TIA-569 | 165.7 m EMT datos, 16.8 m malla, 29 m canaleta, ≈ 108 m de audio | **163.1 m** EMT datos, **20.4 m** malla (16.9 m del anexo + 3.4 m del cuarto de redes), **33.7 m** canaleta (incluye 4.8 m del escritorio), **77.5 m** de audio, 32.4 m de bajadas, 1.0 m de mangas | Usar estas cifras |
| 10 | §7 Cableado | "EMT, RMC para audio a baja altura, bandeja de malla en el anexo…" | **No hay RMC.** El audio va todo en EMT ¾" a 3.0 m, sobre la zona de 2 m. La malla también está en el cuarto de redes | Quitar RMC; "malla en el anexo y en el cuarto de redes" |
| 11 | §14 TIA-569 | "únicamente dos cruces de muro (PEN-3 y PEN-7)" | **4 perforaciones, 6 mangas**: PEN-3 y PEN-7 (2 × Ø100 cada una), PEN-8 y PEN-9 (1 × Ø50 cada una, hacia CAM17 y CAM18, exteriores) | 4 perforaciones, 6 mangas, sellado cortafuego en todas |
| 12 | §7, §8, Matriz, Lista maestra, §14 | Fibra OM3 ≈ 106 m | **103.7 m** (con holgura y bucles) | ≈ 104 m |
| 13 | §7 Audio, Soportes | Cableado XLR "≈ 107 m + reserva" | **77.5 m** de tubo = 6.3 m (línea R) + 71.1 m (línea L), más colas a cada bocina | ≈ 78 m + colas y 2 cables de parcheo al tablero |
| 14 | §14 TIA-568 | Enlace más largo: CAM05, 57.9 m | El más largo es **CAM17, 60.3 m**; CAM05 mide 58.0 m y CAM15 57.5 m | "El enlace más largo es CAM17 con 60.3 m" |
| 15 | §13 Evidencia 12.1 | hostnames "CAM-01…" | Los ids del modelo son CAM02, 04, 05, 07, 10, 11, 12, 15, 16, 17, 18 (sin guion, sin renumerar) | Usar los ids del modelo |
| 16 | §7 Equipos (switch IDF) | "SG3428XMPP en el IDF del muro norte" | Coincide: IDF-N en el muro norte (X 30.0, h 5.4 m), 6U, **7 dispositivos** | Sin cambio; se puede agregar "atiende 7 dispositivos" |

Coinciden con el modelo: 15 access points EAP773 (M01–M18 sin M05, M08, M11, M19), rack 42U, UPS 3000 VA, 2 PDU, controlador OC300, router ER8411, 2 patch panels, 4 organizadores, switch de 48 puertos en el rack, IDF-N y su UPS, 4 transceptores (2 en uso).

## 2. Presupuesto recalculado (precios unitarios y criterios del PDF)

| Concepto | PDF | Modelo | Δ s/IVA |
|---|---:|---:|---:|
| Cámara domo C240I | 5 → $3,814.65 | 8 → $6,103.44 | +$2,288.79 |
| Cámara bullet C340I | 2 → $2,196.56 | 3 → $3,294.84 | +$1,098.28 |
| Bocina JBL EON715 | 4 → $35,675.88 | 2 → $17,837.94 | −$17,837.94 |
| **Subtotal hardware** | $284,885.12 | **$270,434.25** | −$14,450.87 |
| Jack RJ45 Cat6 (2 por salida + 4) | 50 → $15,017.24 | 58 → $17,420.00 | +$2,402.76 |
| Caja superficial (1 por salida) | 23 → $1,586.21 | 27 → $1,862.07 | +$275.86 |
| Soportes de bocina | 4 → $4,800.00 | 2 → $2,400.00 | −$2,400.00 |
| **Subtotal materiales** | $176,115.13 | **$176,393.75** | +$278.62 |
| Mano de obra, cargas, operación | $397,660.50 | sin cambio (ver nota) | — |
| **Costo directo** | $858,660.75 | **$844,488.49** | |
| Contingencia 8 % | $68,692.86 | $67,559.08 | |
| Costo interno | $927,353.61 | $912,047.57 | |
| Utilidad 18 % | $166,923.65 | $164,168.56 | |
| Precio antes de IVA | $1,094,277.26 | $1,076,216.13 | |
| IVA 16 % | $175,084.36 | $172,194.58 | |
| **Precio total al cliente** | **$1,269,361.62** | **$1,248,410.72** | −$20,950.90 |
| % del tope ($1,600,000) | 79.34 % | 78.03 % | |
| Margen | $330,638.38 | $351,589.28 | |

Notas:

- **Sin cambio, a propósito:** faceplates (12), patch cords (48), canalización ($60,517.25), XLR ($12,000), mano de obra. No salen del modelo con una regla que yo pueda justificar, o son partidas globales; ver §3.
- **Mano de obra:** se dejó igual. Con 4 cámaras más, 4 perforaciones (no 2) y 6 mangas, las 12 jornadas de instalación probablemente suben; hay que revisarlo.
- Los $20,950.90 de ahorro **no son margen libre**: los faltantes de la sección 3 todavía no tienen precio.

## 3. ¿Está todo en el presupuesto? Material de instalación contra el modelo

Cantidades medidas sobre las rutas del modelo. "Partida global" = el PDF solo dice que está incluido en *Canalización híbrida y accesorios* ($60,517.25 = $155.17/m × 390 m), sin cantidades ni precios por pieza.

| Material | Cantidad del modelo | En el PDF | Estado |
|---|---|---|---|
| UTP Cat6 | 982 m de corte → 4 cajas de 305 m | 4 cajas | **Alcanza.** Corregir el 815 m del texto |
| Fibra OM3 + 4 SFP+ | 103.7 m; 2 transceptores en uso | ≈ 106 m, 4 SFP+ | Alcanza |
| Tubo EMT (con bajadas y audio) | ½": 23.5 m · ¾": 120.4 m · 1": 55.8 m · 1¼": 73.0 m · 1½": 0.3 m = **272.9 m**; en tramos de 3 m con 10 %: 9 + 45 + 21 + 27 + 1 | Partida global | **Sin desglose.** Falta cantidad por tamaño |
| Abrazaderas EMT | **122** (90 datos + 32 audio), sin contar bajadas; las 26 bajadas (32.4 m) suman ≈ 52 más (2 por bajada, supuesto) | Partida global (mencionadas en el texto) | **Sin cantidad** |
| Cajas de registro | **50** (43 de datos + 7 de audio) | Partida global (mencionadas) | **Sin cantidad** |
| Charola de malla | 20.4 m: 4.0 m de 200×50 y 16.3 m de 100×50; 21 soportes | Partida global | Sin desglose. **6 de los 8 soportes de ANNEX_E2 caen en superficie < 0.10 m** (cruce del vano): pernos pasantes o varilla al techo, confirmar en obra |
| Canaleta plástica 40×25 | 33.7 m; 68 fijaciones (cada ≈ 0.6 m) | Partida global | Sin desglose |
| Mangas de acero | 4 × Ø100 + 2 × Ø50 (6 en total) | Mencionadas en el texto | **Sin cantidad** |
| Sellado cortafuego | 4 perforaciones (+ mangas de reserva vacías) | **No aparece en ninguna partida** | **Falta** |
| Subducto para la fibra | ≈ 104 m dentro del EMT | No aparece | **Falta** |
| Conectores, coples y curvas de EMT | por tramo y por caja | "conectores… y accesorios" en la global | Sin cantidad |
| Taquetes y tornillería | ≈ **400** (supuesto: 1 por abrazadera y por fijación de canaleta, 2 por ménsula y por caja, 4 del IDF, 8 de los brazos de bocina) | "accesorios de fijación" en la global | **Sin cantidad.** Los muros se asumen mampostería/concreto (confirmar) |
| Conductor de tierra e uniones | rack, IDF, EMT y charola | Lote de puesta a tierra | Alcance a confirmar |
| Cable de audio XLR | 77.5 m + colas + 2 de parcheo | Lote $12,000 | Cubre de sobra; ajustar la cifra |

Nota sobre las cajas: el modelo da 23 de entrada, 24 de dispositivo y 3 de paso, **50 en total**; el reparto datos/audio es 43 / 7.

**Faltantes que el modelo dibuja y el PDF no presupuesta (sin precio todavía):**

1. **Alimentación del cuarto de redes.** Contacto dedicado L5-30R para el UPS (OUT-N1, muro norte, h 0.5 m) y su circuito. El PDF solo trae circuito dedicado para el IDF-N y para el audio. Confirmar en la ficha del UPS SMT3000RM2U que su clavija es L5-30P.
2. **Contacto dúplex del escritorio** (OUT-D1) y su circuito.
3. **Salida de red del escritorio:** el modelo la rotula como jack **Cat6A**, pero todo el proyecto es Cat6 (ver decisión D2).
4. **Equipo de operación:** escritorio, PC y monitor del cuarto de redes (la PC y el monitor se ven en el modelo). El PDF cuenta "1 escritorio" como punto de red, pero no hay equipo.
5. **Herramienta para lo que pide el modelo:** las perforaciones de Ø100 y Ø50 en muros de 0.20 m necesitan broca de corona o diamante (la lista solo trae brocas SDS hasta ½"). El EMT con curvas de desvío hechas en obra pide dobladora de tubo y cortatubo. El EMT a 5.7 m y el IDF a 5.4 m no se alcanzan con una escalera de tijera de 1.83 m; falta plataforma o andamio.
6. **Cable exterior** para los ≈ 0.5 m de CAM17 y CAM18 (intemperie), con sellado contra agua.

**Cómo cerrarlo:** desglosar la partida de $60,517.25 en tubo por tamaño, abrazaderas, cajas, charola, canaleta, mangas, cortafuego, subducto y taquetes con las cantidades de arriba, y cotizar. No verifiqué precios de mercado de ninguna de esas piezas: sin cotización no puedo afirmar que $60,517.25 alcance, aunque el modelo pide menos metros (361 m contra 390 m).

## 4. Decisiones abiertas (el modelo no las resuelve solo)

- **D1: NVR.** El rack del modelo muestra NVR4032H de 32 canales; el PDF usa NVR2016H de 16. Con 11 cámaras bastan 16 canales. Propuesta: dejar el NVR2016H en el PDF y corregir la etiqueta del rack en el modelo. Hasta que lo confirmes, el PDF contradice al modelo en este punto.
- **D2: jack del escritorio.** Propuesta: cambiar la etiqueta del modelo de Cat6A a Cat6.
- **D3: almacenamiento.** Supuesto de 4 Mbps por cámara: 11 cámaras ≈ 44 Mbps ≈ 475 GB/día ≈ 14.3 TB a 30 días. Los 16 TB brutos (2 × 8 TB) quedan justos y el NVR2016H tiene solo 2 bahías SATA, así que no admite un tercer disco. El PDF dice que sobra para 7 cámaras; con 11 deja de ser cierto. Bitrate real por validar.

## 5. Lo que no verifiqué

- Precios unitarios del PDF contra los proveedores citados.
- Que faceplates (12) y patch cords (48) correspondan al modelo: no hay regla en el modelo que los dé.
- Las normas citadas (artículos de la NOM, TIA).
- Las 46 páginas completas del PDF: leí el texto extraído (todo lo técnico y de costos) y las primeras 15 páginas como imagen. No revisé el Gantt ni las imágenes de herramientas.

## 6. Pendiente en nuestro propio documento

`docs/memoria-tecnica-adaptada.md` §4.2 todavía lista 4 bocinas (SPK-W1, W2, E1, E2 a 0.5 m de altura) aunque el párrafo de arriba y el modelo ya dicen 2 a 3.0 m, y sus totales de canalización (353 m) no incluyen `ROOM_TRAY_E` ni `ROOM_DESK`. Hay que alinearlo con este documento.
