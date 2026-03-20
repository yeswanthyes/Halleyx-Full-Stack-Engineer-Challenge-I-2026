"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../db/models");
const router = (0, express_1.Router)();
// ── Steps nested under workflows ──────────────────────────────────────────
// GET /api/workflows/:workflowId/steps
router.get('/:workflowId/steps', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const steps = await models_1.Step.findAll({
            where: { workflow_id: workflowId },
            order: [['order', 'ASC']],
            include: [{ model: models_1.Rule, as: 'rules' }],
        });
        res.json(steps);
    }
    catch (error) {
        console.error('Error fetching steps:', error);
        res.status(500).json({ error: 'Failed to fetch steps' });
    }
});
// POST /api/workflows/:workflowId/steps
router.post('/:workflowId/steps', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { name, step_type, order, metadata } = req.body;
        if (!name || !step_type) {
            return res.status(400).json({ error: 'name and step_type are required' });
        }
        const workflow = await models_1.Workflow.findByPk(workflowId);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        const newStep = await models_1.Step.create({
            workflow_id: workflowId,
            name,
            step_type,
            order: order !== undefined ? order : 0,
            metadata: metadata || {},
        });
        // Auto-set as start step if first step
        if (!workflow.start_step_id) {
            await workflow.update({ start_step_id: newStep.id });
        }
        res.status(201).json(newStep);
    }
    catch (error) {
        console.error('Error creating step:', error);
        res.status(500).json({ error: 'Failed to create step' });
    }
});
// GET /api/workflows - List all workflows
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        // Simple pagination
        const offset = (Number(page) - 1) * Number(limit);
        // In a real app we'd add where clause for search
        const { count, rows } = await models_1.Workflow.findAndCountAll({
            where: { is_active: true },
            order: [['updated_at', 'DESC']],
            limit: Number(limit),
            offset,
        });
        // We also want step counts, but for simplicity we'll fetch them separately or lean on frontend
        // Or we could use associations, but SQLite makes nested aggregations a bit tricky without raw queries.
        // For this challenge, let's keep it simple.
        res.json({
            data: rows,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit))
        });
    }
    catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
});
// GET /api/workflows/:id - Get specific workflow with steps and rules
router.get('/:id', async (req, res) => {
    try {
        const workflow = await models_1.Workflow.findByPk(req.params.id, {
            include: [
                {
                    model: models_1.Step,
                    as: 'steps',
                    include: [
                        {
                            model: models_1.Rule,
                            as: 'rules'
                        }
                    ]
                }
            ],
            order: [
                [{ model: models_1.Step, as: 'steps' }, 'order', 'ASC'],
                [{ model: models_1.Step, as: 'steps' }, { model: models_1.Rule, as: 'rules' }, 'priority', 'ASC']
            ]
        });
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(workflow);
    }
    catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ error: 'Failed to fetch workflow details' });
    }
});
// POST /api/workflows - Create new workflow
router.post('/', async (req, res) => {
    try {
        const { name, description, input_schema } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const newWorkflow = await models_1.Workflow.create({
            name,
            input_schema: input_schema || {},
            version: 1,
            is_active: true
        });
        res.status(201).json(newWorkflow);
    }
    catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
    }
});
// PUT /api/workflows/:id - Update workflow (creates new version)
router.put('/:id', async (req, res) => {
    try {
        const { name, input_schema, start_step_id } = req.body;
        const workflowId = req.params.id;
        const workflow = await models_1.Workflow.findByPk(workflowId);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        // In a strict append-only event-sourced system, we'd duplicate the workflow.
        // For this challenge, we'll just increment the version and update in place.
        const newVersion = workflow.version + 1;
        await workflow.update({
            name: name || workflow.name,
            input_schema: input_schema || workflow.input_schema,
            start_step_id: start_step_id !== undefined ? start_step_id : workflow.start_step_id,
            version: newVersion
        });
        res.json(workflow);
    }
    catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'Failed to update workflow' });
    }
});
// DELETE /api/workflows/:id - Soft delete
router.delete('/:id', async (req, res) => {
    try {
        const workflow = await models_1.Workflow.findByPk(req.params.id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        await workflow.update({ is_active: false });
        res.json({ success: true, message: 'Workflow marked as inactive' });
    }
    catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});
exports.default = router;
