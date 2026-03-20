"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Execution = exports.Rule = exports.Step = exports.Workflow = exports.syncDatabase = void 0;
const connection_1 = require("../connection");
const Workflow_1 = require("./Workflow");
Object.defineProperty(exports, "Workflow", { enumerable: true, get: function () { return Workflow_1.Workflow; } });
const Step_1 = require("./Step");
Object.defineProperty(exports, "Step", { enumerable: true, get: function () { return Step_1.Step; } });
const Rule_1 = require("./Rule");
Object.defineProperty(exports, "Rule", { enumerable: true, get: function () { return Rule_1.Rule; } });
const Execution_1 = require("./Execution");
Object.defineProperty(exports, "Execution", { enumerable: true, get: function () { return Execution_1.Execution; } });
// Define Associations
// Workflow has many Steps
Workflow_1.Workflow.hasMany(Step_1.Step, { foreignKey: 'workflow_id', as: 'steps' });
Step_1.Step.belongsTo(Workflow_1.Workflow, { foreignKey: 'workflow_id' });
// Workflow has many Executions
Workflow_1.Workflow.hasMany(Execution_1.Execution, { foreignKey: 'workflow_id', as: 'executions' });
Execution_1.Execution.belongsTo(Workflow_1.Workflow, { foreignKey: 'workflow_id' });
// Step has many Rules
Step_1.Step.hasMany(Rule_1.Rule, { foreignKey: 'step_id', as: 'rules' });
Rule_1.Rule.belongsTo(Step_1.Step, { foreignKey: 'step_id' });
// Self-referential Rules for next step
Rule_1.Rule.belongsTo(Step_1.Step, { foreignKey: 'next_step_id', as: 'next_step' });
// Setup a hook to sync database schema
const syncDatabase = async () => {
    try {
        // In production, force should be false and use migrations instead.
        // For this challenge, we'll sync the models automatically.
        await connection_1.sequelize.sync();
        console.log('Database synced successfully.');
    }
    catch (error) {
        console.error('Error syncing database:', error);
    }
};
exports.syncDatabase = syncDatabase;
