import { connectDB } from './connection';
import { syncDatabase, Workflow, Step, Rule } from './models';

const seedDatabase = async () => {
  try {
    await connectDB();
    await syncDatabase();

    // Check if workflows already exist
    const count = await Workflow.count();
    if (count > 0) {
      console.log('Database already seeded. Skipping.');
      return;
    }

    console.log('Seeding database with sample workflows...');

    // 1. Expense Approval Workflow
    const expenseWorkflow = await Workflow.create({
      name: 'Expense Approval',
      version: 1,
      is_active: true,
      input_schema: {
        amount: { type: 'number', required: true },
        country: { type: 'string', required: true },
        department: { type: 'string', required: false },
        priority: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
      },
    });

    // Steps for Expense Approval
    const managerApproval = await Step.create({
      workflow_id: expenseWorkflow.id,
      name: 'Manager Approval',
      step_type: 'approval',
      order: 1,
      metadata: { assignee_role: 'Manager' },
    });

    const financeNotification = await Step.create({
      workflow_id: expenseWorkflow.id,
      name: 'Finance Notification',
      step_type: 'notification',
      order: 2,
      metadata: { channel: 'email', template: 'big_expense_alert' },
    });

    const ceoApproval = await Step.create({
      workflow_id: expenseWorkflow.id,
      name: 'CEO Approval',
      step_type: 'approval',
      order: 3,
      metadata: { assignee_role: 'CEO' },
    });

    const taskRejection = await Step.create({
      workflow_id: expenseWorkflow.id,
      name: 'Task Rejection',
      step_type: 'task',
      order: 4,
      metadata: { action: 'mark_rejected' },
    });
    
    const taskCompletion = await Step.create({
      workflow_id: expenseWorkflow.id,
      name: 'Task Completion',
      step_type: 'task',
      order: 5,
      metadata: { action: 'mark_approved', payout: true },
    });

    // Set start step
    await expenseWorkflow.update({ start_step_id: managerApproval.id });

    // Rules for Manager Approval
    await Rule.create({
      step_id: managerApproval.id,
      condition: 'amount > 100 && country == "US" && priority == "High"',
      next_step_id: financeNotification.id,
      priority: 1,
    });

    await Rule.create({
      step_id: managerApproval.id,
      condition: 'amount <= 100 || department == "HR"',
      next_step_id: ceoApproval.id,
      priority: 2,
    });

    await Rule.create({
      step_id: managerApproval.id,
      condition: 'priority == "Low" && country != "US"',
      next_step_id: taskRejection.id,
      priority: 3,
    });

    await Rule.create({
      step_id: managerApproval.id,
      condition: 'DEFAULT',
      next_step_id: taskRejection.id,
      priority: 4,
    });
    
    // Default linear rules for remaining steps
    await Rule.create({
      step_id: financeNotification.id,
      condition: 'DEFAULT',
      next_step_id: ceoApproval.id,
      priority: 1,
    });
    
    await Rule.create({
      step_id: ceoApproval.id,
      condition: 'DEFAULT',
      next_step_id: taskCompletion.id,
      priority: 1,
    });


    // 2. Employee Onboarding Workflow
    const onboardingWorkflow = await Workflow.create({
      name: 'Employee Onboarding',
      version: 1,
      is_active: true,
      input_schema: {
        employee_name: { type: 'string', required: true },
        role: { type: 'string', required: true },
        start_date: { type: 'string', required: true },
      },
    });

    const hrNotification = await Step.create({
      workflow_id: onboardingWorkflow.id,
      name: 'HR Notification',
      step_type: 'notification',
      order: 1,
      metadata: { channel: 'slack', target: '#hr-channel' },
    });

    const itSetup = await Step.create({
      workflow_id: onboardingWorkflow.id,
      name: 'IT Account Setup',
      step_type: 'task',
      order: 2,
      metadata: { action: 'provision_accounts' },
    });

    await onboardingWorkflow.update({ start_step_id: hrNotification.id });

    await Rule.create({
      step_id: hrNotification.id,
      condition: 'DEFAULT',
      next_step_id: itSetup.id,
      priority: 1,
    });

    // End of onboarding workflow (no next step)
    await Rule.create({
      step_id: itSetup.id,
      condition: 'DEFAULT',
      next_step_id: null,
      priority: 1,
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
