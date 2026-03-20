import express from 'express';
import cors from 'cors';
import { connectDB } from './db/connection';
import { syncDatabase } from './db/models';

import workflowRoutes from './routes/workflows';
import stepRoutes from './routes/steps';
import ruleRoutes from './routes/rules';
import executionRoutes from './routes/executions';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/steps/:step_id/rules', ruleRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/executions', executionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Workflow Engine API is running' });
});

// Initialize database and start server
const startServer = async () => {
  await connectDB();
  await syncDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
