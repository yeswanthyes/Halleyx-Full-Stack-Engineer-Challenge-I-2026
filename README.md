<div align="center">

<img src="frontend/public/halleyx_logo.jpeg" width="100" height="100" alt="Halleyx Logo" />

# Halleyx — Workflow Engine

**Design workflows. Define rules. Execute processes. Track every step.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## ✨ Overview

**Halleyx** is a full-stack visual workflow automation platform that lets you design multi-step business processes, define conditional routing rules, execute them with real-time tracking, and audit every decision the engine makes.

Think of it as a **programmable flowchart engine** — define the logic once, execute it as many times as you need.

> Built for the **Halleyx Full-Stack Engineer Challenge I — 2026**

---

## 🎥 Video Demo

[Watch the Video Demo](https://drive.google.com/file/d/13-pSMv-s3mRqF3Ek5jVeoMTRaqb1CSYr/view?usp=sharing)

---

## 🖼️ Screenshots

| Workflows | Editor | Execution |
|-----------|--------|-----------|
| List, search, and manage all workflows | Drag-and-drop step builder with schema editor | Live execution log with step-by-step rule evaluation |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     HALLEYX FRONTEND                     │
│  React 18 + TypeScript + Vite   (localhost:5173)         │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Workflow  │ │Workflow  │ │Execute   │ │ Audit Log │  │
│  │  List   │ │ Editor   │ │Workflow  │ │           │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────┘
                         │  REST API
┌─────────────────────────────────────────────────────────┐
│                     HALLEYX BACKEND                      │
│  Node.js + Express + TypeScript   (localhost:3001)       │
│                                                          │
│  ┌──────────────────┐   ┌───────────────────────────┐   │
│  │   REST Routes    │   │     Execution Engine      │   │
│  │  /workflows      │   │  ┌─────────────────────┐  │   │
│  │  /steps          │──▶│  │    Rule Engine      │  │   │
│  │  /rules          │   │  │  (Custom Parser +   │  │   │
│  │  /executions     │   │  │   AST Evaluator)    │  │   │
│  └──────────────────┘   │  └─────────────────────┘  │   │
│                          └───────────────────────────┘   │
│                                    │                      │
│                          ┌─────────▼──────────┐          │
│                          │   SQLite Database   │          │
│                          │   (Sequelize ORM)   │          │
│                          └────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Features

### 🔧 Workflow Designer

- Create named workflows with versioning (auto-increments on every save)
- Define typed **Input Schemas** (`string`, `number`, `boolean`) with required/optional fields
- Add unlimited steps with drag-and-drop ordering

### 🧠 Smart Rule Engine

- Write human-readable conditions: `amount > 1000 && department == "Finance"`
- Supports `&&`, `||`, `==`, `!=`, `>`, `<`, `>=`, `<=`, and `DEFAULT` catch-all
- Custom **tokenizer + AST parser** — no `eval()`, no security risks
- Priority-ordered rules: first match wins

### ⚙️ Step Types

| Type | Behavior |
|------|----------|
| **Task** | Auto-completes and moves to next step |
| **Approval** | Pauses and waits for human Approve / Reject via UI |
| **Notification** | Logs an alert and continues |

### 📊 Execution Engine

- Runs asynchronously after API response
- Real-time polling UI (updates every 1.5s)
- Full audit trail — every rule evaluated, every decision logged
- Supports **Cancel**, **Retry** (on failed), and **Approve/Reject** for approval steps

### 📋 Audit Log

- See all past executions with status, timestamps, and step count
- Drill into individual executions to see the full decision log

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, React Router v6 |
| **Styling** | Vanilla CSS with glassmorphism design system |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | SQLite via Sequelize ORM |
| **Rule Engine** | Custom-built tokenizer + recursive descent AST evaluator |

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/yeswanthyes/Halleyx-Full-Stack-Engineer-Challenge-I-2026.git
cd Halleyx-Full-Stack-Engineer---Challenge-I---2026
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run build
npm start
# Server runs at http://localhost:3001
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### 4. Seed sample data (optional)

```bash
cd backend
npx ts-node seed.ts
```

---

## 📡 API Reference

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workflows` | List all workflows (paginated) |
| `POST` | `/api/workflows` | Create a workflow |
| `GET` | `/api/workflows/:id` | Get workflow with steps & rules |
| `PUT` | `/api/workflows/:id` | Update workflow (auto-increments version) |
| `DELETE` | `/api/workflows/:id` | Soft delete (marks inactive) |

### Steps

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workflows/:id/steps` | List steps for a workflow |
| `POST` | `/api/workflows/:id/steps` | Add a step |
| `PUT` | `/api/steps/:id` | Update a step |
| `DELETE` | `/api/steps/:id` | Delete a step (cascades rules) |

### Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/steps/:id/rules` | List rules for a step |
| `POST` | `/api/steps/:id/rules` | Add a rule |
| `PUT` | `/api/rules/:id` | Update a rule |
| `DELETE` | `/api/rules/:id` | Delete a rule |

### Executions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/executions/workflow/:id` | Start a new execution |
| `GET` | `/api/executions/:id` | Get execution details with live step |
| `POST` | `/api/executions/:id/approve/:step_id` | Approve/reject an approval step |
| `POST` | `/api/executions/:id/cancel` | Cancel a running execution |
| `POST` | `/api/executions/:id/retry` | Retry a failed execution |

---

## 🗂️ Project Structure

```
Halleyx/
├── backend/
│   └── src/
│       ├── db/
│       │   ├── connection.ts       # SQLite connection
│       │   └── models/             # Sequelize models
│       │       ├── Workflow.ts
│       │       ├── Step.ts
│       │       ├── Rule.ts
│       │       ├── Execution.ts
│       │       └── index.ts        # Associations
│       ├── engine/
│       │   ├── executionEngine.ts  # Core workflow runner
│       │   └── ruleEngine.ts       # Custom rule parser + evaluator
│       ├── routes/
│       │   ├── workflows.ts
│       │   ├── steps.ts
│       │   ├── rules.ts
│       │   └── executions.ts
│       └── index.ts                # Express app entry
└── frontend/
    ├── public/
    │   └── halleyx_logo.jpeg
    └── src/
        ├── api/
        │   └── client.ts           # Typed fetch wrapper
        ├── components/
        │   ├── Layout.tsx          # Sidebar + navigation
        │   ├── Modal.tsx
        │   └── StatusBadge.tsx
        └── pages/
            ├── WorkflowList.tsx
            ├── WorkflowEditor.tsx
            ├── StepRuleEditor.tsx
            ├── ExecuteWorkflow.tsx
            └── AuditLog.tsx
```

---

## 🎨 Design System

- **Background:** Deep black `#080808` with subtle colored bloom gradients
- **Panels:** Frosted glassmorphism `backdrop-filter: blur(24px)`
- **Brand color:** Halleyx green `#4CAF7D`
- **Typography:** Inter (UI) + Playfair Display (headings)
- **Motion:** Cubic-bezier transitions, pulse animations for live steps

---

## 📋 Data Model

```
Workflow
  ├── id (UUID)
  ├── name
  ├── version (auto-incremented)
  ├── is_active
  ├── input_schema (JSON)
  ├── start_step_id → Step
  └── steps[] → Step

Step
  ├── id (UUID)
  ├── workflow_id → Workflow
  ├── name
  ├── step_type (task | approval | notification)
  ├── order
  ├── metadata (JSON)
  └── rules[] → Rule

Rule
  ├── id (UUID)
  ├── step_id → Step
  ├── condition (e.g. "amount > 1000 && department == Finance")
  ├── next_step_id → Step | null
  └── priority

Execution
  ├── id (UUID)
  ├── workflow_id → Workflow
  ├── workflow_version
  ├── status (pending | in_progress | completed | failed | canceled)
  ├── data (JSON — input + approval decisions)
  ├── logs[] (JSON — full rule evaluation trail)
  ├── current_step_id → Step
  └── triggered_by
```

---

## 🔐 Security & Safety

- **Zero `eval()`** — The rule engine uses a custom tokenizer and AST, making it immune to code injection
- **Soft deletes** on workflows to preserve execution history
- **Immutable logs** — every execution stores its own snapshot of evaluated rules

---

## 👨‍💻 Author

**Yeswanth S**

- GitHub: [@yeswanthyes](https://github.com/yeswanthyes)
- Challenge: Halleyx Full-Stack Engineer — Challenge I — 2026

---

<div align="center">
  <sub>Built with ❤️ using React, Node.js, and a custom rule engine.</sub>
</div>
