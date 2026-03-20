import { Execution, Workflow, Step, Rule } from '../db/models';
import { evaluateRule } from './ruleEngine';

const MAX_ITERATIONS = 50;

export class ExecutionEngine {
  
  /**
   * Starts or resumes an execution
   */
  static async run(executionId: string) {
    let execution = await Execution.findByPk(executionId);
    if (!execution) throw new Error('Execution not found');

    if (execution.status !== 'pending' && execution.status !== 'in_progress') {
      console.log(`Execution ${executionId} is ${execution.status}, cannot run.`);
      return;
    }

    // Set to in_progress if starting
    if (execution.status === 'pending') {
      await execution.update({
        status: 'in_progress',
        started_at: new Date()
      });
    }

    let iterations = 0;

    try {
      while (execution.status === 'in_progress' && iterations < MAX_ITERATIONS) {
        iterations++;

        if (!execution.current_step_id) {
          // No next step -> completed
          await execution.update({
            status: 'completed',
            ended_at: new Date()
          });
          break;
        }

        const currentStep = await Step.findByPk(execution.current_step_id, {
          include: [{ model: Rule, as: 'rules' }],
          order: [[{ model: Rule, as: 'rules' }, 'priority', 'ASC']]
        });

        if (!currentStep) {
          throw new Error(`Step ${execution.current_step_id} not found`);
        }

        const stepStartTime = new Date();

        // If it's an approval step, we need external input. Only evaluate rules if the step is explicitly marked as approved in data (for simulation).
        // For MVP, we auto-approve everything, but in reality it would pause here.
        if (currentStep.step_type === 'approval') {
          // Check if data contains 'approval_decision' for this step. If not, pause.
          const approvalKey = `approval_${currentStep.id}`;
          if (execution.data[approvalKey] === undefined) {
            // Missing approval, we stop the engine here so the UI can prompt for it
            console.log(`Execution ${execution.id} waiting for approval on step ${currentStep.name}`);
            return;
          }
        }

        // Evaluate Rules
        let selectedRule: Rule | null = null;
        const evaluatedRulesLog = [];
        let ruleEvaluationError = null;

        // @ts-ignore - rules is populated by include
        const rules: Rule[] = currentStep.rules || [];

        try {
          for (const rule of rules) {
            const conditionMet = evaluateRule(rule.condition, execution.data);
            evaluatedRulesLog.push({
              rule_id: rule.id,
              condition: rule.condition,
              result: conditionMet
            });

            if (conditionMet) {
              selectedRule = rule;
              break; // Priority handles the rest
            }
          }
        } catch (e) {
          ruleEvaluationError = (e as Error).message;
        }

        const stepEndTime = new Date();

        // Create log entry
        const logEntry = {
          step_id: currentStep.id,
          step_name: currentStep.name,
          step_type: currentStep.step_type,
          evaluated_rules: evaluatedRulesLog,
          selected_next_step_id: selectedRule ? selectedRule.next_step_id : null,
          status: ruleEvaluationError ? 'failed' : 'completed',
          error_message: ruleEvaluationError,
          started_at: stepStartTime,
          ended_at: stepEndTime
        };

        const updatedLogs = [...execution.logs, logEntry];

        if (ruleEvaluationError) {
          await execution.update({
            status: 'failed',
            logs: updatedLogs,
            ended_at: new Date()
          });
          break;
        }

        if (!selectedRule) {
          // No rule matched, implicitly stop
          await execution.update({
            status: 'completed', // or failed if explicit DEFAULT is required
            logs: updatedLogs,
            current_step_id: null,
            ended_at: new Date()
          });
          break;
        }

        // Proceed to next step
        await execution.update({
          logs: updatedLogs,
          current_step_id: selectedRule.next_step_id
        });
        
        // Refresh execution object for next iteration
        execution = (await Execution.findByPk(executionId))!;
      }

      if (iterations >= MAX_ITERATIONS && execution.status === 'in_progress') {
        throw new Error(`Max iterations (${MAX_ITERATIONS}) reached. Possible infinite loop.`);
      }

    } catch (error) {
      console.error(`Execution Engine Error for ${executionId}:`, error);
      await execution.update({
        status: 'failed',
        ended_at: new Date(),
        // Cannot cleanly push to logs here if we don't know which step failed, 
        // but we'll leave it as a general failure. 
      });
    }
  }

  /**
   * Helper to submit an approval decision and resume execution
   */
  static async submitApproval(executionId: string, stepId: string, decisionData: any) {
    const execution = await Execution.findByPk(executionId);
    if (!execution || execution.status !== 'in_progress') return false;

    if (execution.current_step_id !== stepId) return false;

    // Merge decision into data
    const newData = { ...execution.data, [`approval_${stepId}`]: decisionData };
    
    await execution.update({ data: newData });

    // Resume execution
    this.run(executionId).catch(console.error);
    return true;
  }
}
