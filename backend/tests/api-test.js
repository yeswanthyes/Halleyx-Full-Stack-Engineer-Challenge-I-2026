const http = require('http');

const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function runTests() {
  console.log('--- API Tests ---');
  
  try {
    // 1. Get workflows to find "Expense Approval"
    const workflowsRes = await request('GET', '/api/workflows');
    const expenseWf = workflowsRes.data.data.find(w => w.name === 'Expense Approval');
    
    if (!expenseWf) {
      throw new Error('Expense Approval workflow not found in seed data');
    }
    console.log(`✅ Found Workflow: ${expenseWf.name} (${expenseWf.id})`);

    // 2. Start execution
    const startRes = await request('POST', `/api/executions/workflow/${expenseWf.id}`, {
      data: {
        amount: 250,
        country: 'US',
        priority: 'High'
      },
      triggered_by: 'test-script'
    });
    
    if (startRes.status !== 201) throw new Error(`Start failed: ${JSON.stringify(startRes)}`);
    const executionId = startRes.data.id;
    console.log(`✅ Started execution: ${executionId}`);

    // Wait a bit for background engine to process to the approval step
    await delay(500);

    // 3. Check status
    let execRes = await request('GET', `/api/executions/${executionId}`);
    // Should be waiting at Manager Approval
    let exec = execRes.data;
    
    let currentStepId = exec.current_step_id;
    let logs = exec.logs;
    console.log(`✅ Execution status: ${exec.status}, logs count: ${logs.length}`);
    
    if (logs.length > 0) {
      console.log('Latest log step:', logs[logs.length-1].step_name);
    }
    
    // 4. Submit approval
    if (currentStepId) {
      console.log(`Submitting approval for step ${currentStepId}...`);
      await request('POST', `/api/executions/${executionId}/approve/${currentStepId}`, {
        decisionData: { approved: true, comment: 'Looks good' }
      });
      
      await delay(500); // let engine process
      
      execRes = await request('GET', `/api/executions/${executionId}`);
      exec = execRes.data;
      console.log(`✅ After approval status: ${exec.status}, logs count: ${exec.logs.length}`);
      
      // Since amount is 250, country US, priority High -> should hit rule 1 -> Finance Notification -> CEO Approval -> wait.
      const financeLog = exec.logs.find(l => l.step_name === 'Finance Notification');
      if (financeLog) console.log('✅ Reached Finance Notification step');
      else console.error('❌ Missed Finance Notification step');
    }

    console.log('--- Tests completed ---');
  } catch (error) {
    console.error('Test Error:', error.message);
    process.exit(1);
  }
}

runTests();
