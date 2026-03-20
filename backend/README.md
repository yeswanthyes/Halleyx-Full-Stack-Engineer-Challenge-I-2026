<div align="center">

# Halleyx Backend API

Node.js + Express + TypeScript workflow automation engine backend.

</div>

---

## 🏗️ Architecture

The backend consists of four main systems:
1. **REST API** for building workflows and steps.
2. **SQLite Database** managed by Sequelize ORM for zero-config portable storage.
3. **Execution Engine** (`executionEngine.ts`) that orchestrates running workflows asynchronously.
4. **Custom Rule Engine** (`ruleEngine.ts`) — A bespoke tokenizer and AST parser that safely evaluates user-defined conditions without the security risks of `eval()`.

## ⚙️ Requirements

- Node.js 18+
- npm 9+

## 🚀 Setup & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   *The server runs on `http://localhost:3001`.*

4. **Seed database (optional):**
   ```bash
   npx ts-node src/db/seed.ts
   ```

---

## 📡 API Endpoints

### Workflows
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/workflows` | List paginated workflows |
| `POST` | `/api/workflows` | Create new workflow |
| `GET` | `/api/workflows/:id` | Get workflow with all nested steps & rules |
| `PUT` | `/api/workflows/:id` | Update workflow details |
| `DELETE` | `/api/workflows/:id` | Soft delete a workflow |

### Steps
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/workflows/:id/steps` | List steps for a specific workflow |
| `POST` | `/api/workflows/:id/steps` | Add a step to a workflow |
| `PUT` | `/api/steps/:id` | Update an existing step |
| `DELETE` | `/api/steps/:id` | Delete a step |

### Rules
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/steps/:id/rules` | List routing rules for a step |
| `POST` | `/api/steps/:id/rules` | Add a new prioritized rule |
| `PUT` | `/api/rules/:id` | Update rule condition/priority |
| `DELETE` | `/api/rules/:id` | Delete rule |

### Executions
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/executions/workflow/:id` | Trigger a new workflow execution |
| `GET` | `/api/executions` | List all executions (for Audit Log) |
| `GET` | `/api/executions/:id` | Get live execution status and current step |
| `POST` | `/api/executions/:id/approve/:step_id` | Provide human approval to a paused step |
| `POST` | `/api/executions/:id/cancel` | Cancel an in-progress execution |
| `POST` | `/api/executions/:id/retry` | Retry a failed execution |

---

## 🧠 Rule Engine Syntax

Conditions are written as text strings. Examples:
- `amount > 500 && department == "HR"`
- `country != "US" || priority == "High"`
- `startsWith(title, "Exp")`

The routing logic checks rules in ascending priority order. The first rule to evaluate to `true` is selected. If no rule matches, it looks for the `DEFAULT` keyword. If there is no `DEFAULT`, the workflow stops.
