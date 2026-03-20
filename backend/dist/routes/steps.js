"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../db/models");
// This router will be mounted at /api/steps and /api/workflows/:workflow_id/steps
const router = (0, express_1.Router)({ mergeParams: true });
// GET /api/workflows/:workflow_id/steps
router.get('/', async (req, res) => {
    try {
        const { workflow_id } = req.params;
        if (!workflow_id) {
            return res.status(400).json({ error: 'workflow_id is required' });
        }
        const steps = await models_1.Step.findAll({
            where: { workflow_id },
            order: [['order', 'ASC']],
            include: [
                {
                    model: models_1.Rule,
                    as: 'rules',
                }
            ]
        });
        res.json(steps);
    }
    catch (error) {
        console.error('Error fetching steps:', error);
        res.status(500).json({ error: 'Failed to fetch steps' });
    }
});
// POST /api/workflows/:workflow_id/steps
router.post('/', async (req, res) => {
    try {
        const { name, step_type, order, metadata } = req.body;
        const { workflow_id } = req.params;
        if (!workflow_id || !name || !step_type) {
            return res.status(400).json({ error: 'workflow_id, name, and step_type are required' });
        }
        // Verify workflow exists
        const workflow = await models_1.Workflow.findByPk(workflow_id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        const newStep = await models_1.Step.create({
            workflow_id,
            name,
            step_type,
            order: order !== undefined ? order : 0,
            metadata: metadata || {}
        });
        // If it's the first step being added to a workflow that doesn't have a start_step_id yet, update it
        if (!workflow.start_step_id && newStep.order === 1) {
            await workflow.update({ start_step_id: newStep.id });
        }
        res.status(201).json(newStep);
    }
    catch (error) {
        console.error('Error creating step:', error);
        res.status(500).json({ error: 'Failed to create step' });
    }
});
// PUT /api/steps/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, step_type, order, metadata } = req.body;
        const step = await models_1.Step.findByPk(req.params.id);
        if (!step) {
            return res.status(404).json({ error: 'Step not found' });
        }
        await step.update({
            name: name || step.name,
            step_type: step_type || step.step_type,
            order: order !== undefined ? order : step.order,
            metadata: metadata !== undefined ? metadata : step.metadata
        });
        res.json(step);
    }
    catch (error) {
        console.error('Error updating step:', error);
        res.status(500).json({ error: 'Failed to update step' });
    }
});
// DELETE /api/steps/:id
router.delete('/:id', async (req, res) => {
    try {
        const step = await models_1.Step.findByPk(req.params.id);
        if (!step) {
            return res.status(404).json({ error: 'Step not found' });
        }
        // Cascade delete handles rules
        await step.destroy();
        res.json({ success: true, message: 'Step deleted' });
    }
    catch (error) {
        console.error('Error deleting step:', error);
        res.status(500).json({ error: 'Failed to delete step' });
    }
});
exports.default = router;
