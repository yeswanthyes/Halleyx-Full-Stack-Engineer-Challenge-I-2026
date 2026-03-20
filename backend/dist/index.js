"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const connection_1 = require("./db/connection");
const models_1 = require("./db/models");
const workflows_1 = __importDefault(require("./routes/workflows"));
const steps_1 = __importDefault(require("./routes/steps"));
const rules_1 = __importDefault(require("./routes/rules"));
const executions_1 = __importDefault(require("./routes/executions"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/workflows', workflows_1.default);
app.use('/api/steps', steps_1.default);
app.use('/api/steps/:step_id/rules', rules_1.default);
app.use('/api/rules', rules_1.default);
app.use('/api/executions', executions_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Workflow Engine API is running' });
});
// Initialize database and start server
const startServer = async () => {
    await (0, connection_1.connectDB)();
    await (0, models_1.syncDatabase)();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};
startServer();
