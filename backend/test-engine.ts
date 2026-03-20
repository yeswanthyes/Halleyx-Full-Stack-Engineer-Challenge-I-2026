import { ExecutionEngine } from './src/engine/executionEngine';
import { connectDB } from './src/db/connection';
import { syncDatabase, Workflow, Execution } from './src/db/models';

const testEngine = async () => {
  await connectDB();
  await syncDatabase();

  const expenseWf = await Workflow.findOne({ where: { name: 'Expense Approval' } });
  if (!expenseWf) {
    console.log('Workflow not found');
    process.exit(1);
  }

  // Create a pending execution
  const newExecution = await Execution.create({
    workflow_id: expenseWf.id,
    workflow_version: expenseWf.version,
    status: 'pending',
    data: { amount: 250, country: 'US', priority: 'High' },
    logs: [],
    current_step_id: expenseWf.start_step_id,
    triggered_by: 'test-script'
  });

  console.log('Starting ExecutionEngine.run for id:', newExecution.id);
  
  try {
    await ExecutionEngine.run(newExecution.id);
    
    // Fetch result
    const result = await Execution.findByPk(newExecution.id);
    console.log('Execution result:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Test Engine Error:', err);
  }

  process.exit(0);
};

testEngine();
