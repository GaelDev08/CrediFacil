# Simulador de Créditos – Motor Avanzado de Préstamos (CrediFacil)

> Simulador realista de créditos basado en métodos de cálculo usados en fintechs de microfinanzas de Latinoamérica (amortización francesa y alemana, mora, multi-moneda, simulación de pagos y tipo de cambio).

Construido para demostrar conocimiento profundo de dominio técnico y matemático en sistemas de crédito bancarios y microfinancieros.

[![Vitest Unit Tests](https://img.shields.io/badge/tests-27%20passed-emerald)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)](https://tailwindcss.com)

---

## 🚀 Features / Características

### 1. Core Credit Operations / Operaciones Principales
- **Creación de crédito**: Configuración de capital, tasa de interés (TEA, TEM, TNA), plazo (semanal, quincenal, mensual), fecha de desembolso y primer vencimiento.
- **Tabla de amortización completa**: Desglose período a período de saldo inicial, amortización de capital, interés compensatorio, seguro de desgravamen, comisiones administrativas, cuota total exigible y saldo deudor remanente.
- **Períodos de Gracia**:
  - **Sin gracia**: Amortización continua desde la cuota 1.
  - **Gracia Parcial**: Pago exclusivo de intereses y comisiones durante los períodos de gracia, preservando el saldo capital intacto.
  - **Gracia Total**: Suspensión temporal de pagos donde los intereses devengados se capitalizan al saldo deudor, recalculando el cronograma posterior.
- **Simulador de Pagos en Tiempo Real**: Simula abonos a tiempo, pagos parciales, pagos vencidos y amortizaciones extraordinarias anticipadas.
- **Prelación Bancaria de Pagos (Payment Waterfall)**:
  1. `Mora y penalidades por cobranza`
  2. `Seguros y comisiones fijas`
  3. `Intereses compensatorios vencidos/corrientes`
  4. `Capital corriente exigible`
  5. `Excedente / Amortización anticipada` (opción de **Reducción de Plazo** o **Reducción de Cuota**).
- **Cálculo Avanzado de Mora (Late Fees)**:
  - Días de atraso (*Days Past Due / DPD*).
  - Tasa moratoria diaria sobre capital/cuota vencida.
  - Comisión fija de cobranza tras superar los días de tolerancia (*grace days*).
- **Multi-Moneda & Tipo de Cambio Dinámico**:
  - Soporte de moneda nacional (**PEN, MXN, COP**) y divisas internacionales (**USD**).
  - Ticker de Tipo de Cambio en vivo y selector de divisa de visualización con conversión instantánea.
  - Capacidad de simular pagos en moneda extranjera para un crédito en moneda local (o viceversa) aplicando el tipo de cambio oficial.
- **Métricas Regulatorias**:
  - Cálculo de **TCEA** (*Tasa de Costo Efectivo Anual*) basado en **TIR** (*Tasa Interna de Retorno / IRR*) de los flujos netos de caja según normativa SBS / Condusef.
- **Exportación**:
  - Exportación del cronograma a **CSV** compatible con Microsoft Excel.
  - Formato de impresión limpio para reporte en **PDF**.

---

### 2. Métodos de Amortización

| Método | Dinámica de Cuota | Dinámica de Capital | Intereses Totales | Caso Típico de Uso |
|---|---|---|---|---|
| **Francés** | **Cuota Fija** | Creciente período a período | Medio | Créditos de consumo, personales y vehiculares |
| **Alemán** | **Cuota Decreciente** | **Capital Fijo / Constante** | **Menor costo total** | Préstamos PYME y comerciales |
| **Tasa Plana (Flat)** | **Cuota Fija** | Capital Fijo | Mayor costo relativo | Microcréditos rápidos, comercio informal y mercados |

---

## 🛠️ Tech Stack

| Capa / Layer | Tecnología |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| **Estado Global** | Zustand (reactivo, desacoplado y con persistencia de cálculos) |
| **Gráficos** | Recharts (Evolución de Saldo Deudor y Composición de Cuota) |
| **Motor de Cálculo** | Pure TypeScript Functions (100% libre de efectos secundarios) |
| **Testing** | Vitest + React Testing Library (27 pruebas unitarias) |
| **Iconografía** | Lucide React |

---

## 📁 Project Structure / Estructura del Proyecto

```text
CrediFacil/
├── public/                     # Activos estáticos
├── src/
│   ├── types/                  # Definiciones de tipos de dominio (LoanParams, Installment, etc.)
│   │   ├── credit.ts
│   │   └── index.ts
│   ├── engine/                 # Motor financiero modular en TypeScript puro
│   │   ├── formulas.ts         # Fórmulas base (TEA, TEM, PMT Francés, TIR/TCEA, redondeo)
│   │   ├── amortization.ts     # Generador de tablas (Francés, Alemán, Flat, Gracia)
│   │   ├── lateFees.ts         # Cálculo de DPD, interés moratorio diario y comisiones
│   │   ├── payments.ts         # Prelación de pagos (waterfall), abonos parciales y prepagos
│   │   ├── currency.ts         # Monedas, formateo monetario y conversiones de tipo de cambio
│   │   └── index.ts
│   ├── store/
│   │   └── useCreditStore.ts   # Store de Zustand con gestión reactiva y plantillas (presets)
│   ├── components/
│   │   ├── header/
│   │   │   ├── Navbar.tsx           # Barra superior con marca, plantillas y enlace GitHub
│   │   │   └── ExchangeRateBar.tsx  # Ticker de tipo de cambio y fecha de corte
│   │   ├── form/
│   │   │   └── LoanForm.tsx         # Formulario de parámetros y configuración avanzada
│   │   ├── dashboard/
│   │   │   ├── MetricsSummary.tsx   # Tarjetas ejecutivas (Capital, Intereses, Cuota, TCEA)
│   │   │   └── ComparisonCard.tsx   # Comparativa en tiempo real Francés vs Alemán vs Flat
│   │   ├── charts/
│   │   │   └── AmortizationCharts.tsx # Visualizaciones con Recharts
│   │   ├── table/
│   │   │   └── AmortizationTable.tsx  # Tabla con estados, exportación CSV e impresión
│   │   ├── payment/
│   │   │   ├── PaymentSimulatorModal.tsx # Modal interactivo de abonos
│   │   │   └── PaymentHistoryList.tsx    # Registro de transacciones simuladas
│   │   └── common/
│   │       ├── Badge.tsx            # Insignias de estado (Pendiente, Pagado, Vencido, Gracia)
│   │       └── CurrencyDisplay.tsx  # Componente multi-divisa reactivo
│   ├── test/                   # Suite de pruebas unitarias
│   │   ├── amortization.test.ts
│   │   ├── formulas.test.ts
│   │   ├── payments.test.ts
│   │   ├── lateFees.test.ts
│   │   ├── currency.test.ts
│   │   └── setup.ts
│   ├── App.tsx                 # Contenedor principal de la aplicación
│   ├── main.tsx                # Punto de entrada de React
│   └── index.css               # Estilos globales y Tailwind CSS
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚡ Instalación y Ejecución

### Requisitos previos
- **Node.js** v18+ (recomendado Node 20 o superior)
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

### 3. Iniciar entorno de desarrollo
```bash
npm run dev
```
Abre en tu navegador: `http://localhost:5173`

### 4. Ejecutar Pruebas Unitarias
```bash
npm test
```
Para ejecutar en modo interactivo:
```bash
npm run test:watch
```

### 5. Compilar para producción
```bash
npm run build
```

---

## 📐 Fundamentos Matemáticos

### 1. Conversión de Tasa Efectiva Anual (TEA) a Periódica ($i$)
Convención bancaria de 360 días anuales:
$$i = (1 + TEA)^{\frac{días\_período}{360}} - 1$$

### 2. Fórmula de Cuota Fija (Sistema Francés)
$$R = Saldo \times \left[ \frac{i \times (1 + i)^n}{(1 + i)^n - 1} \right]$$

### 3. Tasa de Costo Efectivo Anual (TCEA)
Calculada mediante el método numérico de Newton-Raphson resolviendo el Valor Actual Neto igual a cero sobre los flujos de caja del crédito:
$$0 = -Desembolso + \sum_{k=1}^n \frac{Cuota\_Total_k}{(1 + TIR)^k}$$
$$TCEA = (1 + TIR)^{períodos\_por\_año} - 1$$

### 4. Interés Moratorio (Mora)
$$Mora = Capital\_Vencido \times \left(\frac{Tasa\_Diaria}{100}\right) \times Días\_Atraso + Comisión\_Fija$$

---

## 📄 Licencia

Este proyecto está disponible bajo la licencia **MIT**. Desarrollado con dedicación para ilustrar las mejores prácticas de arquitectura financiera fintech en frontend y TypeScript.
