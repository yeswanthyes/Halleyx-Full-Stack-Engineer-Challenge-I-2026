import { connectDB } from './src/db/connection';
import { Step, Rule } from './src/db/models';

async function check() {
  await connectDB();
  const steps = await Step.findAll({ include: [{ model: Rule, as: 'rules' }] });
  console.log('Total steps in DB:', steps.length);
  steps.forEach((s: any) => console.log('Step:', s.id, s.name, 'Rules:', s.rules?.length));
  process.exit(0);
}

check();
