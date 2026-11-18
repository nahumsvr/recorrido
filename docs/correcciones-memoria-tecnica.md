# Correcciones a la memoria técnica (PDF del 17/11/2026) contra el modelo 3D

Documento revisado: `EntregableDocumentacionUA_Costos_Corregidos_Final2.pdf` (46 páginas).
Criterio: **el modelo 3D (`recorrido`) es la fuente de verdad.** Las cantidades de abajo salen del código del modelo (`src/data/*`), medidas sobre sus rutas y contra la malla real del edificio; no son estimaciones a mano.

**Veredicto:** el PDF no coincide con el modelo en cámaras, bocinas, puntos de red, cable, canalización, perforaciones y fibra. La aritmética del presupuesto sí es correcta (subtotales, IMSS/INFONAVIT/ISN, contingencia, utilidad e IVA se recalcularon y cuadran), pero parte de cantidades viejas. Con el modelo, el precio total baja de **$1,269,361.62 a $1,248,410.72** (78.03 % del tope), **sin contar** los faltantes de la sección 3, que hoy no tienen precio.

## 1. Discrepancias texto/tablas contra el modelo (17)

| # | Sección del PDF | El PDF dice | El modelo tiene | Corrección |
|---|---|---|---|---|
| 1 | §7 Equipos, Videovigilancia, Matriz, Lista maestra, §8 Hardware | 7 cámaras: 5 C240I (domo) + 2 C340I (bullet); NVR "suficiente para 7 cámaras"; "7 de 16 canales" | **11 cámaras: 8 C240I** (CAM04, 05, 07, 10, 15, 16, 17, 18) **+ 3 C340I** (CAM02, 11, 12) | Cantidades 8 y 3; "11 de 16 canales"; "suficiente para 11 cámaras" |
| 2 | §7 Equipos, Videovigilancia | Descripción del NVR para 7 cámaras; "evitando el sobredimensionamiento" | El rack del modelo dibuja un **NVR4032H (32 canales)**, no el NVR2016H | Ver decisión D1 |
| 3 | §7 Audio (tabla y párrafo), §8 Hardware, Lista maestra | 4 bocinas EON715, "dos por grada", "al frente de las dos gradas" (SPK-W1, W2, E1, E2) | **2 bocinas** (SPK-W1, SPK-E1), una por grada, en el muro lateral de cada una a 3.0 m, a 0.45 m del muro, apuntando al centro de la grada | 2 bocinas; texto de ubicación; quitar "dos unidades por grada" |
| 4 | §7 Matriz (MG12XU → EON715) | "encadenamiento de bocinas por grada" | Cada línea (L, R) termina en **una** bocina; no hay encadenamiento | "salida L/R, una bocina por línea" |
| 5 | §7 Soportes de bocina | 4 | 2 (uno por bocina) | 2 |
| 6 | §7 Cableado, Lista maestra, §14 TIA-568 | ≈ 815 m de corte de Cat6 | **≈ 995 m** (983.3 m de 26 dispositivos + 11.7 m del escritorio) | ≈ 995 m. Las 4 cajas (1,220 m) siguen alcanzando: reserva de 225 m (18 %) |
| 7 | §7 Cableado, Lista maestra, §8 Materiales | 23 salidas/dispositivos (15 AP + 7 cámaras + 1 escritorio) | **27** (15 AP + 11 cámaras + 1 escritorio) | 27 |
| 8 | §7, Lista maestra, §8 Materiales, §14 TIA-569 | Canalización total 390 m con 10 % de reserva | **≈ 403 m netos, ≈ 443 m con 10 %**, de los cuales 77 m son la alimentación de las bocinas (sin ella: ≈ 326 m netos, ≈ 359 m con 10 %) | 443 m con la potencia; 359 m sin ella (ver §3) |
| 9 | §14 TIA-569 | 165.7 m EMT datos, 16.8 m malla, 29 m canaleta, ≈ 108 m de audio | **168.7 m** EMT de datos (incluye 5.6 m del cuarto de redes), **17.6 m** de malla (solo el anexo), **28.9 m** de canaleta plástica, **77.5 m** de EMT de audio, **77.0 m** de EMT de potencia (nuevo), 32.6 m de bajadas, 1.0 m de mangas | Usar estas cifras |
| 10 | §7 Cableado | "EMT, RMC para audio a baja altura, bandeja de malla en el anexo…" | **No hay RMC.** El audio va todo en EMT ¾" a 3.0 m, sobre la zona de 2 m. La malla queda solo en el anexo; el cuarto de redes usa un EMT ¾" compartido (CAM16 y escritorio) | Quitar RMC; "malla solo en el anexo"; agregar el EMT del cuarto de redes |
| 11 | §14 TIA-569 | "únicamente dos cruces de muro (PEN-3 y PEN-7)" | **4 perforaciones, 6 mangas**: PEN-3 y PEN-7 (2 × Ø100 cada una), PEN-8 y PEN-9 (1 × Ø50 cada una, hacia CAM17 y CAM18, exteriores) | 4 perforaciones, 6 mangas, sellado cortafuego en todas |
| 12 | §7, §8, Matriz, Lista maestra, §14 | Fibra OM3 ≈ 106 m | **104.4 m** (con holgura y bucles) | ≈ 104 m |
| 13 | §7 Audio, Soportes | Cableado XLR "≈ 107 m + reserva" | **77.5 m** de tubo = 6.3 m (línea R) + 71.1 m (línea L), más colas a cada bocina | ≈ 78 m + colas y 2 cables de parcheo al tablero |
| 14 | §14 TIA-568 | Enlace más largo: CAM05, 57.9 m | El más largo es **CAM17, 60.9 m**; CAM05 mide 58.6 m y CAM15 58.1 m | "El enlace más largo es CAM17 con 60.9 m" |
| 15 | §13 Evidencia 12.1 | hostnames "CAM-01…" | Los ids del modelo son CAM02, 04, 05, 07, 10, 11, 12, 15, 16, 17, 18 (sin guion, sin renumerar) | Usar los ids del modelo |
| 16 | §7 Equipos (switch IDF) | "SG3428XMPP en el IDF del muro norte" | Coincide: IDF-N en el muro norte (X 30.0, h 5.4 m), 6U, **7 dispositivos** | Sin cambio; se puede agregar "atiende 7 dispositivos" |
| 17 | §7 Alimentación | Circuito dedicado de audio, sin canalización ni cable de potencia hasta las bocinas | Las EON715 son **activas** (llevan el amplificador adentro) y necesitan 127 V: **2 tubos EMT ½"** de potencia (PWR_R 6.1 m, PWR_L 70.8 m) desde un tablero de audio TA-1 hasta una caja con contacto protegido junto a cada bocina | Agregar la canalización, el cable 12 AWG, TA-1 y 2 contactos GFCI (ver §3) |

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
| UTP Cat6 | 995 m de corte → 4 cajas de 305 m | 4 cajas | **Alcanza.** Corregir el 815 m del texto |
| Fibra OM3 + 4 SFP+ | 104.4 m; 2 transceptores en uso | ≈ 106 m, 4 SFP+ | Alcanza |
| Tubo EMT (datos, audio, potencia y bajadas) | ½": 102.6 m · ¾": 124.0 m · 1": 55.8 m · 1¼": 73.0 m · 1½": 0.3 m = **355.7 m** (datos 168.7 + bajadas 32.6 + audio 77.5 + potencia 77.0); en tramos de 3 m con 10 %: 38 + 46 + 21 + 27 + 1 | Partida global | **Sin desglose.** Falta cantidad por tamaño |
| Abrazaderas EMT | **156** (94 datos, 32 audio, 30 potencia), sin contar bajadas; las 26 bajadas (32.6 m) suman ≈ 52 más (2 por bajada, supuesto) | Partida global (mencionadas en el texto) | **Sin cantidad** |
| Cajas de registro | **58** (45 de datos, 7 de audio y 6 de potencia) | Partida global (mencionadas) | **Sin cantidad** |
| Charola de malla | 17.6 m, solo en el anexo: 4.6 m de 200×50 y 12.9 m de 100×50; 18 soportes | Partida global | Sin desglose. **6 de los 8 soportes de ANNEX_E2 caen en superficie < 0.10 m** (cruce del vano): pernos pasantes o varilla al techo, confirmar en obra |
| Canaleta plástica 40×25 | 28.9 m; 57 fijaciones (cada ≈ 0.6 m) | Partida global | Sin desglose |
| Mangas de acero | 4 × Ø100 + 2 × Ø50 (6 en total) | Mencionadas en el texto | **Sin cantidad** |
| Sellado cortafuego | 4 perforaciones (+ mangas de reserva vacías) | **No aparece en ninguna partida** | **Falta** |
| Subducto para la fibra | ≈ 104 m dentro del EMT | No aparece | **Falta** |
| Conectores, coples y curvas de EMT | por tramo y por caja | "conectores… y accesorios" en la global | Sin cantidad |
| Taquetes y tornillería | ≈ **430** (supuesto: 1 por abrazadera y por fijación de canaleta, 2 por ménsula y por caja, 4 del IDF, 8 de los brazos de bocina) | "accesorios de fijación" en la global | **Sin cantidad.** Los muros se asumen mampostería/concreto (confirmar) |
| Conductor de tierra e uniones | rack, IDF, EMT y charola | Lote de puesta a tierra | Alcance a confirmar |
| Cable de audio XLR | 77.5 m + colas + 2 de parcheo | Lote $12,000 | Cubre de sobra; ajustar la cifra |
| Cable de potencia 12 AWG (bocinas) | 3 conductores × 77 m ≈ 231 m, ≈ 254 m con 10 % | **No aparece** | **Falta** |
| Tablero TA-1 y 2 contactos GFCI | 1 y 2 | Circuito de audio, sin tablero ni contactos | **Falta** |

Nota sobre las cajas: el modelo da **58 en total** (45 de datos, 7 de audio y 6 de potencia), contando las de entrada, las de dispositivo y las de paso.

**Faltantes que el modelo dibuja y el PDF no presupuesta (sin precio todavía):**

1. **Alimentación de las bocinas.** Las EON715 son activas. El modelo dibuja una canalización de potencia por bocina (PWR_R, 6.1 m; PWR_L, 70.8 m, en EMT ½", pegada al tubo de audio de su línea), con 30 abrazaderas, 6 cajas, ≈ 254 m de 12 AWG, un tablero TA-1 y un contacto protegido junto a cada bocina. Falta confirmar el consumo en la ficha de la EON715 y de dónde sale el circuito: TA-1 es un supuesto, y si hay un tablero más cerca de la grada oeste, PWR_L se acorta mucho.
2. **Alimentación del cuarto de redes.** Contacto dedicado L5-30R para el UPS (OUT-N1, muro norte, h 0.5 m) y su circuito. El PDF solo trae circuito dedicado para el IDF-N y para el audio. Confirmar en la ficha del UPS SMT3000RM2U que su clavija es L5-30P.
3. **Contacto dúplex del escritorio** (OUT-D1) y su circuito.
4. **Salida de red del escritorio:** el modelo la rotula como jack **Cat6A**, pero todo el proyecto es Cat6 (ver decisión D2).
5. **Equipo de operación:** escritorio, PC y monitor del cuarto de redes (la PC y el monitor se ven en el modelo). El PDF cuenta "1 escritorio" como punto de red, pero no hay equipo.
6. **Herramienta para lo que pide el modelo:** las perforaciones de Ø100 y Ø50 en muros de 0.20 m necesitan broca de corona o diamante (la lista solo trae brocas SDS hasta ½"). El EMT con curvas de desvío hechas en obra pide dobladora de tubo y cortatubo. El EMT a 5.7 m y el IDF a 5.4 m no se alcanzan con una escalera de tijera de 1.83 m; falta plataforma o andamio.
7. **Cable exterior** para los ≈ 0.5 m de CAM17 y CAM18 (intemperie), con sellado contra agua.

**Cómo cerrarlo:** desglosar la partida de $60,517.25 en tubo por tamaño, abrazaderas, cajas, charola, canaleta, mangas, cortafuego, subducto y taquetes con las cantidades de arriba, y cotizar. No verifiqué precios de mercado de ninguna de esas piezas: sin cotización no puedo afirmar que $60,517.25 alcance. Sin la potencia el modelo pide menos metros (359 m contra 390 m); con ella pide más (443 m).

## 4. Decisiones abiertas (el modelo no las resuelve solo)

- **D1: NVR.** El rack del modelo muestra NVR4032H de 32 canales; el PDF usa NVR2016H de 16. Con 11 cámaras bastan 16 canales. Propuesta: dejar el NVR2016H en el PDF y corregir la etiqueta del rack en el modelo. Hasta que lo confirmes, el PDF contradice al modelo en este punto.
- **D2: jack del escritorio.** Propuesta: cambiar la etiqueta del modelo de Cat6A a Cat6.
- **D3: almacenamiento.** Supuesto de 4 Mbps por cámara: 11 cámaras ≈ 44 Mbps ≈ 475 GB/día ≈ 14.3 TB a 30 días. Los 16 TB brutos (2 × 8 TB) quedan justos y el NVR2016H tiene solo 2 bahías SATA, así que no admite un tercer disco. El PDF dice que sobra para 7 cámaras; con 11 deja de ser cierto. Bitrate real por validar.

## 5. Lo que no verifiqué

- Precios unitarios del PDF contra los proveedores citados.
- Que faceplates (12) y patch cords (48) correspondan al modelo: no hay regla en el modelo que los dé.
- Las normas citadas (artículos de la NOM, TIA). La regla de que potencia y comunicaciones pueden ir en tubos metálicos separados, lado a lado, la tomé de fuentes secundarias del NEC (art. 800), no del texto de la NOM-001-SEDE: confirmarla con el electricista.
- El consumo de la bocina JBL EON715 y el origen del circuito de audio (TA-1 es un supuesto).
- Las 46 páginas completas del PDF: leí el texto extraído (todo lo técnico y de costos) y las primeras 15 páginas como imagen. No revisé el Gantt ni las imágenes de herramientas.

## 6. Cambios hechos al modelo desde la primera versión

Todo lo siguiente ya está en el modelo y publicado (https://nahumsvr.github.io/recorrido/). Las cifras de este documento salen de esa versión.

- **Cuarto de redes:** alimentación y cableado (contactos, UPS, PDU, escritorio con PC y monitor); la cámara CAM16 y el enlace del escritorio comparten **un solo tubo EMT ¾"** que sale de la parte alta del rack, corre por el techo al muro este y baja a la cámara; el escritorio se une con un tubo EMT ½" desde su jack. El tubo va a 2.56 m, 3 cm bajo el techo (2.59 m), para que todas sus abrazaderas encuentren superficie sólida. Reemplaza a la charola y a la canaleta plástica de la versión anterior.
- **Charola del anexo (ANNEX_FEED):** terminaba a 2.5 m, 0.6 m abajo de la troncal del anexo (3.1 m), así que el hoyo PEN-3 no llevaba a nada. Ahora sube esos 0.6 m pegada al muro y empata con la troncal.
- **Alimentación de las bocinas:** dos tubos EMT ½" (PWR_R y PWR_L), cada uno pegado, 7 cm arriba, al tubo de audio de su línea, desde el tablero TA-1 hasta una caja con contacto protegido junto a cada bocina. El criterio de 0.3 m de separación que usé primero era un criterio del proyecto, no un límite de la norma: tubos metálicos separados pueden ir lado a lado.
- **Pasto:** el modelo muestra pasto alrededor del auditorio (solo visual; no cambia cantidades).
- **Tests:** 184 pasan; las abrazaderas de toda la canalización encuentran superficie sólida, salvo 6 de las 8 de ANNEX_E2 (techo delgado, en ámbar).

## 7. Pendiente

- Confirmar en obra o con el electricista: origen del circuito de las bocinas (TA-1), su consumo, la separación entre potencia y señal, y el material de los muros para los taquetes.
- Cotizar todo lo de las secciones 3 y 4 (no se verificó ningún precio) y ajustar la mano de obra.
- Decidir D1–D3 (NVR, jack del escritorio, almacenamiento).
