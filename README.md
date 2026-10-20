# 💰 CrediFacil – Motor Avanzado de Simulación y Amortización Financiera

> **Simulador financiero de grado bancario y fintech para Latinoamérica**. Diseñado con una arquitectura desacoplada y modular para modelar créditos comerciales, de consumo y microfinanzas con soporte multimoneda, sincronización oficial con Bancos Centrales, amortización francesa, alemana, tasa plana e interés sobre saldo deudor, prelación bancaria de pagos, liquidación de mora y reportes ejecutivos.

[![Vitest Unit Tests](https://img.shields.io/badge/Vitest-36%20tests%20passing-emerald?style=flat-square&logo=vitest)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber?style=flat-square)](LICENSE)

---

## 🌟 ¿Por qué este simulador demuestra experiencia de un Dev Senior & Fintech Architect?

A diferencia de simuladores básicos que se limitan a dividir el capital entre el número de meses, **CrediFacil** fue diseñado desde cero implementando la **lógica real de una entidad financiera o core bancario moderno**:

### 1. Dominio de Negocio Financiero Real (Fintech & Microfinanzas)
- **Prelación Bancaria de Pagos (Payment Waterfall)**: Cuando un cliente abona dinero, el sistema aplica la prelación regulatoria estricta:
  1. *Gastos de cobranza e interés moratorio devengado*.
  2. *Seguros (desgravamen) y comisiones administrativas*.
  3. *Interés compensatorio vencido y del período*.
  4. *Capital corriente exigible*.
  5. *Excedente aplicado a amortización extraordinaria anticipada* (recalculando el cronograma por **Reducción de Plazo** o **Reducción de Cuota**).
- **Gestión de Entornos Multidivisa y Volatilidad Cambiaria**:
  - En mercados latinoamericanos con regímenes cambiarios dinámicos (Perú con el BCRP, México con Banxico, Colombia con BanRep y Venezuela con el **Banco Central de Venezuela - BCV**), el sistema permite otorgar créditos pactados en moneda dura (**USD**) y visualizarlos/liquidarlos en moneda local (**VES, PEN, MXN, COP**) o viceversa con su contravalor exacto en tiempo real.
- **Rigor Matemático y Precisión Financiera**:
  - Mitigación de errores de redondeo de coma flotante IEEE 754 mediante compensación con `Number.EPSILON` y ajuste de cierre en la última cuota para garantizar un **saldo deudor remanente exactamente en `0.00`**.
  - Cálculo de la **TCEA (Tasa de Costo Efectivo Anual)** mediante el algoritmo numérico de **Newton-Raphson** calculando la **TIR** de los flujos de caja netos del crédito.

### 2. Arquitectura Limpia y Desacoplamiento (Clean Architecture)
- **Motor Financiero Aislado (`src/engine/`)**: Libre de dependencias externas o librerías de UI. Son funciones de TypeScript 100% puras, inmutables y fácilmente migrables a un backend en Go, Node.js, Python o microservicios.
- **Gestión de Estado Reactiva (`src/store/useCreditStore.ts`)**: Basada en Zustand con re-cálculo reactivo determinista: permite simular múltiples pagos sucesivos reejecutando el pipeline cronológico con total fidelidad.
- **Cero Sorpresas en Exportación**:
  - Resuelve el error clásico de Microsoft Excel en Windows con codificación UTF-8 inyectando un **BOM binario estricto** (`0xEF, 0xBB, 0xBF`) y eliminando directivas conflictivas.
  - Generador nativo de hojas de cálculo **Microsoft Excel (`.xls`)** con marcado XML Spreadsheet 2003, cabecera corporativa y formato de moneda automático sin dependencias pesadas.

---

## 🚀 Funcionalidades Principales

### 1. Métodos de Amortización Integrados
1. **Sistema Francés (Cuota Fija)**: El estándar en créditos de consumo y personales.
2. **Sistema Alemán (Amortización Constante de Capital)**: Cuotas decrecientes con menor costo financiero total.
3. **Interés sobre Saldo Deudor**: Interés calculado sobre el capital vivo insoluto; ante abonos de más, el crédito se recalcula en tiempo real ajustando las cuotas restantes.
4. **Tasa Plana (Flat Rate)**: Interés simple fijo por período, muy utilizado en microcréditos de comercio ágil.

### 2. Frecuencias de Pago (5 Frecuencias Bancarias)
- **Anual**: 360 días (1 período/año).
- **Mensual**: 30 días (12 períodos/año).
- **Quincenal**: 15 días (24 períodos/año).
- **Semanal**: 7 días (52 períodos/año).
- **Diario**: 1 día (360 períodos/año en convención bancaria LATAM).

### 3. Conexión Oficial con Bancos Centrales
El simulador incorpora un servicio de consulta en vivo y de contingencia para las tasas de cambio de los principales bancos centrales:
- 🇻🇪 **Banco Central de Venezuela (BCV)**: Tasa oficial para Bolívares (`VES`).
- 🇵🇪 **Banco Central de Reserva del Perú (BCRP / SBS)**: Tasa interbancaria oficial para Soles (`PEN`).
- 🇲🇽 **Banco de México (Banxico)**: Tipo de cambio FIX para Pesos Mexicanos (`MXN`).
- 🇨🇴 **Banco de la República de Colombia (BanRep / TRM)**: TRM oficial para Pesos Colombianos (`COP`).
- 🇺🇸 **Sistema de la Reserva Federal (Fed)**: Dólar estadounidense como moneda base.

### 4. Períodos de Gracia
- **Sin Gracia**: Inicio de amortización inmediato en la cuota 1.
- **Gracia Parcial**: Pago exclusivo de intereses compensatorios y comisiones; el saldo de capital permanece intacto.
- **Gracia Total**: Suspensión temporal de pagos con capitalización de intereses al saldo insoluto (*anatocismo legal*).

### 5. Control de Mora, Cobranza y Fechas de Corte
- Tasa moratoria diaria porcentual configurable.
- Comisión fija de cobranza administrativa.
- Días de tolerancia (*grace days*) antes del devengo de penalidades.
- Selector dinámico de **Fecha de Corte** para auditar morosidad proyectada cuota por cuota.

### 6. Comisiones y Gastos Administrativos
- **Comisión de Desembolso**: Definida en porcentaje, calculando tanto el capital adeudado como el monto neto líquido entregado al cliente.
- **Gastos Administrativos**: Fijos por cuota o porcentuales sobre saldo deudor insoluto.
- **Seguro de Desgravamen**: Cobertura porcentual sobre el saldo deudor remanente.

### 7. Reportes y Exportación Profesional
- **Reporte Oficial Excel (`.xls`)**: Formato ejecutivo con colores institucionales, datos de la operación, celdas de moneda y totales destacados.
- **Reporte CSV Estructurado (`.csv`)**: Delimitado por punto y coma (`;`), con BOM UTF-8 estricto para abrir directamente en Excel en español sin problemas de acentos (`ó`, `é`, `í`, `ñ`, `°`).
- **Impresión Limpia (`window.print`)**: Vista estilizada que oculta la barra de navegación y formularios, imprimiendo únicamente la ficha ejecutiva y el cronograma limpio.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Renderizado concurrente y UI declarativa de alto rendimiento. |
| **Lenguaje** | **TypeScript 5.8 (Strict)** | Tipado estricto en todas las estructuras de dominio financiero. |
| **Build Tool** | **Vite 8** | HMR instantáneo y empaquetado optimizado para producción. |
| **Estilos** | **Tailwind CSS v4** | Diseño responsivo moderno, paleta financiera y modo de impresión `@media print`. |
| **Estado Global** | **Zustand** | Store ligero, desacoplado y sin boilerplate para cálculos reactivos. |
| **Pruebas Unitarias** | **Vitest** | 36 tests unitarios verificando fórmulas financieras, mora, pagos y tipos de cambio. |
| **Linter** | **Oxlint** | Análisis estático ultrarrápido con 0 errores y 0 advertencias. |
| **Iconos** | **Lucide React** | Iconografía limpia y accesible. |

---

## 📁 Estructura del Código

```text
CrediFacil/
├── src/
│   ├── types/                  # Modelos de dominio financiero (LoanParams, Installment, etc.)
│   │   ├── credit.ts
│   │   └── index.ts
│   ├── engine/                 # Motor financiero modular (TypeScript Puro, 0 dependencias UI)
│   │   ├── formulas.ts         # Fórmulas de tasas (TEA/TEM/TNA), PMT, Newton-Raphson TCEA, días
│   │   ├── amortization.ts     # Algoritmos Francés, Alemán, Tasa Plana e Interés sobre Saldo
│   │   ├── lateFees.ts         # Cálculo de días de atraso (DPD), mora diaria y cobranza
│   │   ├── payments.ts         # Prelación de pagos (waterfall), abonos parciales y prepagos
│   │   ├── currency.ts         # Monedas soportadas, formato financiero y conversión cruzada
│   │   └── index.ts
│   ├── services/               # Conexión con APIs y Bancos Centrales
│   │   ├── bcvService.ts       # Consulta oficial Banco Central de Venezuela
│   │   └── exchangeRateService.ts # Snapshot global de divisas (BCV, BCRP, Banxico, BanRep, Fed)
│   ├── utils/                  # Generación y exportación de reportes
│   │   └── reportExporter.ts   # Generador nativo Excel (.xls) y CSV UTF-8 estructurado
│   ├── store/                  # Estado reactivo global
│   │   └── useCreditStore.ts   # Store Zustand con re-cálculo automático y presets
│   ├── components/             # Componentes modulares de interfaz
│   │   ├── header/             # Barra de tipo de cambio, fecha de corte y navegación
│   │   ├── form/               # Formulario de configuración de crédito y frecuencias
│   │   ├── dashboard/          # Tarjetas de resumen ejecutivo y comparativas
│   │   ├── table/              # Tabla de amortización con filtros, sticky actions e impresión
│   │   ├── payment/            # Modal de simulación de pagos y amortización extraordinaria
│   │   ├── charts/             # Gráficos de saldo deudor y composición de cuotas
│   │   └── common/             # Visualizador de monedas equivalentes (CurrencyDisplay)
│   └── test/                   # Suite de 36 pruebas unitarias con Vitest
│       ├── amortization.test.ts
│       ├── currency.test.ts
│       ├── formulas.test.ts
│       ├── lateFees.test.ts
│       └── payments.test.ts
```

---

## ⚡ Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** v18 o superior (recomendado v20+)
- **npm** o **pnpm**

### 1. Clonar el repositorio
```bash
git clone https://github.com/GaelDev08/CrediFacil.git
cd CrediFacil
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abra en su navegador: `http://localhost:5173`

### 4. Ejecutar la suite de pruebas unitarias
```bash
npm test
```
*Se ejecutarán los 36 tests con verificación matemática de amortización, mora y conversiones.*

### 5. Compilar para producción
```bash
npm run build
```
Genera la compilación optimizada en la carpeta `dist/`.

---

## 📐 Fundamentos Matemáticos

### 1. Tasa Periódica ($i$) desde Tasa Efectiva Anual (TEA)
Bajo convención de 360 días bancarios:
$$i = (1 + \text{TEA})^{\frac{\text{días\_período}}{360}} - 1$$

### 2. Cuota Fija del Sistema Francés (PMT)
$$R = \text{Saldo} \times \left[ \frac{i \times (1 + i)^n}{(1 + i)^n - 1} \right]$$

### 3. Tasa de Costo Efectivo Anual (TCEA)
Calculada numéricamente igualando el Valor Actual Neto (VAN) a cero mediante iteración de Newton-Raphson:
$$0 = -\text{DesembolsoNeto} + \sum_{k=1}^n \frac{\text{CuotaTotal}_k}{(1 + \text{TIR})^k}$$
$$\text{TCEA} = (1 + \text{TIR})^{\text{períodos\_por\_año}} - 1$$

### 4. Interés Moratorio Diario
$$\text{Mora} = \text{CapitalVencido} \times \left( \frac{\text{TasaMoratoriaDiaria}}{100} \right) \times (\text{DíasAtraso} - \text{DíasTolerancia}) + \text{ComisiónFija}$$

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Desarrollado con dedicación para reflejar las mejores prácticas de ingeniería de software, arquitectura limpia y tecnología financiera (Fintech).
