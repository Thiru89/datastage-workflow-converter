# ⚡ IBM DataStage ETL Modernization & Extraction Suite

> Automated reverse-engineering, documentation, and cloud migration engine for IBM InfoSphere DataStage parallel and server jobs.

[![CI/CD Pipeline](https://github.com/owner/datastage-modernization-suite/actions/workflows/deploy.yml/badge.svg)](https://github.com/owner/datastage-modernization-suite/actions/workflows/deploy.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%20%7C%2022.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache--2.0-yellow.svg)](LICENSE)

---

## 📌 Overview

The **IBM DataStage ETL Modernization Suite** accelerates the migration of legacy data warehouse pipelines to modern cloud data platforms (Snowflake, Google Cloud BigQuery, Databricks, PostgreSQL, Amazon Redshift).

It ingests IBM DataStage job files (`.dsx`, `.xml`, `.isx`, and raw text dumps), deterministically parses job stages, pin link connections, stage variables, and transformer derivations, and produces:

1. **Source-to-Target Mapping (STTM)**: Full attribute-level lineage, SQL expressions, and business classifications.
2. **Interactive Visual Lineage**: DAG pipeline visualization representing stages, streaming links, lookups, and schema propagation.
3. **Multi-Dialect Cloud SQL & dbt Models**: Translates proprietary DataStage macros and derivations into optimized Common Table Expressions (CTEs), DDL schemas, and modular dbt SQL files.
4. **Enterprise Multi-Sheet Excel Documentation (`.xlsx`)**: Ready-to-audit 5-sheet technical workbooks.
5. **AI Modernization Copilot**: Architecture analysis, null/type handling edge case discovery, and interactive expression translation powered by Google Gemini.

---

## ✨ Key Features

- **Automated Offline Parser**: Ingests DataStage exports (`.dsx`, `.xml`, `.isx`) directly in the browser or server without needing an active IBM Information Server or DataStage engine.
- **Stage Support**:
  - **Sources & Targets**: `PxOdbc`, `PxOracle`, `PxDB2`, `PxTeradata`, `PxSequentialFile`, `PxDataSet`
  - **Transformations**: `PxTransformer`, Stage Variables, Derivations, System routines
  - **Joins & Lookups**: `PxJoin` (Inner, Left, Right, Full Outer), `PxLookup`
  - **Filters & Conditions**: `PxFilter`, `PxSwitch`, Predicate pushdowns
  - **Aggregations & Sorting**: `PxSort`, `PxAggregator`
- **Dialect Support**:
  - **Snowflake** (ANSI SQL, CTEs, Snowpark-compatible dbt models)
  - **Google Cloud BigQuery** (Standard SQL, `SAFE_CAST`, struct/array handling)
  - **Databricks** (Spark SQL, Delta Lake syntax)
  - **PostgreSQL / Amazon Redshift** (Standard ANSI SQL CTE pipelines)
- **5-Sheet Excel Workbook Export**:
  - `Job_Summary`: High-level inventory, counts, and metadata
  - `Source_Target_Mapping`: Detailed STTM matrix with rule classifications
  - `Tables_and_Columns`: Full source and target column catalog with data types and nullability
  - `Transformations_Catalog`: Transformer expressions matched with modern SQL equivalents
  - `Joins_and_Filters`: Join conditions, stream links, and WHERE filter predicates
- **Built-in Expression Translator Sandbox**: Test and translate proprietary DataStage syntax (e.g. `If IsNull(A) Then 'N/A' Else UpCase(Trim(A))`) into any target dialect.

---

## 🏗️ Architecture & Tech Stack

- **Client**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons
- **Server**: Express.js (Node.js runtime with CommonJS production bundle)
- **Spreadsheet Generation**: SheetJS (`xlsx`)
- **AI Integration**: Google GenAI SDK (`@google/genai` with Gemini 2.5 Flash)
- **Build System**: Vite 6, esbuild, TypeScript Compiler

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD Pipeline
├── public/                     # Static assets
├── src/
│   ├── components/             # React UI components
│   │   ├── Header.tsx          # Top navigation and sample picker
│   │   ├── SummaryCards.tsx    # Pipeline metric counters
│   │   ├── VisualPipeline.tsx  # Interactive DAG node graph
│   │   ├── MappingTable.tsx    # Source-to-Target mapping grid
│   │   ├── StagesBreakdown.tsx # Stage tabs (sources, transforms, joins, filters)
│   │   ├── SqlViewer.tsx       # Multi-dialect SQL & dbt generator
│   │   ├── ExcelPreviewModal.tsx # Multi-sheet Excel workbook preview
│   │   ├── AiAssistantModal.tsx  # Gemini modernization copilot & sandbox
│   │   └── FileUploaderModal.tsx # .dsx/.xml/.isx file upload and drag-and-drop
│   ├── data/                   # Enterprise DataStage sample jobs
│   ├── utils/                  # DSX/XML parsers, Excel builder, SQL generator
│   ├── App.tsx                 # Main application dashboard
│   ├── main.tsx                # Client entry point
│   └── types.ts                # TypeScript domain models
├── server.ts                   # Express server & Gemini API endpoints
├── Dockerfile                  # Production container image
├── .env.example                # Environment variables template
├── metadata.json               # Application metadata
└── package.json                # Project dependencies and scripts
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x or higher

### 1. Clone the repository
```bash
git clone https://github.com/owner/datastage-modernization-suite.git
cd datastage-modernization-suite
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file from the provided template:
```bash
cp .env.example .env
```
Add your optional Google Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```
*(Note: Core parsing, SQL conversion, and Excel export work offline without an API key. The Gemini key powers the AI Modernization Copilot tab.)*

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production
```bash
npm run build
npm start
```

---

## 🐳 Docker Deployment

You can build and run the application using Docker:

```bash
# Build the Docker image
docker build -t datastage-modernization-suite:latest .

# Run container on port 3000
docker run -d -p 3000:3000 \
  -e GEMINI_API_KEY="your-gemini-api-key" \
  --name datastage-app \
  datastage-modernization-suite:latest
```

Test the container health check:
```bash
curl http://localhost:3000/api/health
```

---

## 🔄 CI/CD Workflow

The repository includes an enterprise-grade GitHub Actions workflow in `.github/workflows/deploy.yml` that:

1. **Continuous Integration (PRs & main)**:
   - Sets up Node.js LTS (20.x, 22.x matrix).
   - Installs dependencies using `npm ci`.
   - Runs TypeScript strict verification (`npm run lint`).
   - Executes the dual production build (`vite build` + `esbuild server.ts`).
2. **Docker Container Validation**:
   - Builds the production Docker image.
   - Verifies the image build and layer caching.
3. **Continuous Deployment (on push to `main`)**:
   - Publishes the container image to GitHub Container Registry (`ghcr.io`) or Google Cloud Artifact Registry.
   - Deploys automatically to Google Cloud Run, AWS ECS, or Kubernetes cluster.

---

## 📄 License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.
