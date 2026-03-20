import { Router } from 'express';
import { Rule, Step } from '../db/models';

// Mounted at /api/rules and /api/steps/:step_id/rules
const router = Router({ mergeParams: true });

// GET /api/steps/:step_id/rules
router.get('/', async (req, res) => {
  try {
    const { step_id } = req.params as { step_id: string };
    
    if (!step_id) {
      return res.status(400).json({ error: 'step_id is required' });
    }

    const rules = await Rule.findAll({
      where: { step_id },
      order: [['priority', 'ASC']]
    });
    
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// POST /api/steps/:step_id/rules
router.post('/', async (req, res) => {
  try {
    const { condition, next_step_id, priority } = req.body;
    const { step_id } = req.params as { step_id: string };

    if (!step_id || !condition) {
      return res.status(400).json({ error: 'step_id and condition are required' });
    }

    // Verify step exists
    const step = await Step.findByPk(step_id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // If next_step_id is provided, verify it exists
    if (next_step_id) {
      const nextStep = await Step.findByPk(next_step_id);
      if (!nextStep) {
        return res.status(404).json({ error: 'next_step_id does not correspond to an existing Step' });
      }
    }

    const newRule = await Rule.create({
      step_id,
      condition,
      next_step_id: next_step_id || null,
      priority: priority !== undefined ? priority : 99 // Default low priority if not specified
    });

    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// PUT /api/rules/:id
router.put('/:id', async (req, res) => {
  try {
    const { condition, next_step_id, priority } = req.body;
    const rule = await Rule.findByPk(req.params.id);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // If next_step_id is being updated to a non-null value, verify it
    if (next_step_id && next_step_id !== rule.next_step_id) {
      const nextStep = await Step.findByPk(next_step_id);
      if (!nextStep) {
        return res.status(404).json({ error: 'next_step_id does not correspond to an existing Step' });
      }
    }

    await rule.update({
      condition: condition || rule.condition,
      next_step_id: next_step_id !== undefined ? next_step_id : rule.next_step_id,
      priority: priority !== undefined ? priority : rule.priority
    });

    res.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// DELETE /api/rules/:id
router.delete('/:id', async (req, res) => {
  try {
    const rule = await Rule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    await rule.destroy();
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// PUT /api/steps/:step_id/rules/reorder - Helper to reorder multiple rules
router.put('/reorder/batch', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, priority }
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates array is required' });
    }

    // In a real production app we'd use a transaction
    await Promise.all(
      updates.map(update => 
        Rule.update({ priority: update.priority }, { where: { id: update.id } })
      )
    );

    res.json({ success: true, message: 'Rules reordered successfully' });
  } catch (error) {
    console.error('Error reordering rules:', error);
    res.status(500).json({ error: 'Failed to reorder rules' });
  }
});

export default router;
