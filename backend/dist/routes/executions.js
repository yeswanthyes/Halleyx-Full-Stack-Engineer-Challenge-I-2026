"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../db/models");
const executionEngine_1 = require("../engine/executionEngine");
const router = (0, express_1.Router)();
// GET /api/executions
router.get('/', async (req, res) => {
    try {
        const executions = await models_1.Execution.findAll({
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: models_1.Workflow,
                    attributes: ['name']
                }
            ]
        });
        res.json(executions);
    }
    catch (error) {
        console.error('Error fetching executions:', error);
        res.status(500).json({ error: 'Failed to fetch executions' });
    }
});
// GET /api/executions/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await models_1.Execution.findByPk(id, {
            include: [
                {
                    model: models_1.Workflow,
                    include: [{ model: models_1.Step, as: 'steps' }]
                }
            ]
        });
        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        // Attach current step info for easy frontend consumption
        let current_step = null;
        if (execution.current_step_id) {
            current_step = await models_1.Step.findByPk(execution.current_step_id);
        }
        const responseData = execution.toJSON();
        responseData.current_step = current_step ? current_step.toJSON() : null;
        res.json(responseData);
    }
    catch (error) {
        console.error('Error fetching execution details:', error);
        res.status(500).json({ error: 'Failed to fetch execution details' });
    }
});
// POST /api/workflows/:workflow_id/execute - Trigger execution
router.post('/workflow/:workflow_id', async (req, res) => {
    try {
        const { workflow_id } = req.params;
        const { data, triggered_by } = req.body;
        // We will implement the full ExecutionEngine later that does the actual work.
        // For now, this just creates the initial record.
        const workflow = await models_1.Workflow.findByPk(workflow_id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        if (!workflow.is_active) {
            return res.status(400).json({ error: 'Workflow is not active' });
        }
        if (!workflow.start_step_id) {
            return res.status(400).json({ error: 'Workflow has no start step defined' });
        }
        // Basic schema validation placeholder (would expand this)
        // Create execution record
        const newExecution = await models_1.Execution.create({
            workflow_id,
            workflow_version: workflow.version,
            status: 'pending',
            data: data || {},
            logs: [],
            current_step_id: workflow.start_step_id,
            triggered_by: triggered_by || 'system',
        });
        // Start engine asynchronously
        executionEngine_1.ExecutionEngine.run(newExecution.id).catch(err => {
            console.error('Background execution failed:', err);
        });
        res.status(201).json(newExecution);
    }
    catch (error) {
        console.error('Error triggering execution:', error);
        res.status(500).json({ error: 'Failed to trigger execution' });
    }
});
// POST /api/executions/:id/cancel
router.post('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await models_1.Execution.findByPk(id);
        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        if (['completed', 'failed', 'canceled'].includes(execution.status)) {
            return res.status(400).json({ error: `Cannot cancel execution in state: ${execution.status}` });
        }
        await execution.update({
            status: 'canceled',
            ended_at: new Date()
        });
        res.json({ success: true, message: 'Execution canceled' });
    }
    catch (error) {
        console.error('Error canceling execution:', error);
        res.status(500).json({ error: 'Failed to cancel execution' });
    }
});
// POST /api/executions/:id/retry
router.post('/:id/retry', async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await models_1.Execution.findByPk(id);
        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        if (execution.status !== 'failed') {
            return res.status(400).json({ error: `Can only retry failed executions. Current state: ${execution.status}` });
        }
        await execution.update({
            status: 'pending',
            retries: execution.retries + 1,
            ended_at: null
        });
        // Start engine asynchronously
        executionEngine_1.ExecutionEngine.run(execution.id).catch(err => {
            console.error('Background execution retry failed:', err);
        });
        res.json({ success: true, message: 'Execution retry queued' });
    }
    catch (error) {
        console.error('Error retrying execution:', error);
        res.status(500).json({ error: 'Failed to retry execution' });
    }
});
// POST /api/executions/:id/approve/:step_id
router.post('/:id/approve/:step_id', async (req, res) => {
    try {
        const { id, step_id } = req.params;
        const { decisionData } = req.body;
        const result = await executionEngine_1.ExecutionEngine.submitApproval(id, step_id, decisionData);
        if (!result) {
            return res.status(400).json({ error: 'Could not submit approval. Execution might not be waiting at this step.' });
        }
        res.json({ success: true, message: 'Approval submitted' });
    }
    catch (error) {
        console.error('Error submitting approval:', error);
        res.status(500).json({ error: 'Failed to submit approval' });
    }
});
exports.default = router;
