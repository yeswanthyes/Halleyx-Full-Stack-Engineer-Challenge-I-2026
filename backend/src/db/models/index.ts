import { sequelize } from '../connection';
import { Workflow } from './Workflow';
import { Step } from './Step';
import { Rule } from './Rule';
import { Execution } from './Execution';

// Define Associations

// Workflow has many Steps
Workflow.hasMany(Step, { foreignKey: 'workflow_id', as: 'steps' });
Step.belongsTo(Workflow, { foreignKey: 'workflow_id' });

// Workflow has many Executions
Workflow.hasMany(Execution, { foreignKey: 'workflow_id', as: 'executions' });
Execution.belongsTo(Workflow, { foreignKey: 'workflow_id' });

// Step has many Rules
Step.hasMany(Rule, { foreignKey: 'step_id', as: 'rules' });
Rule.belongsTo(Step, { foreignKey: 'step_id' });

// Self-referential Rules for next step
Rule.belongsTo(Step, { foreignKey: 'next_step_id', as: 'next_step' });

// Setup a hook to sync database schema
export const syncDatabase = async () => {
  try {
    // In production, force should be false and use migrations instead.
    // For this challenge, we'll sync the models automatically.
    await sequelize.sync();
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

export {
  Workflow,
  Step,
  Rule,
  Execution,
};
