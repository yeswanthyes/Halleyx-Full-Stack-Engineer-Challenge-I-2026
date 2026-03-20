import { connectDB } from './src/db/connection';
import { Step, Rule } from './src/db/models';

async function check() {
  await connectDB();
  
  // Get any step
  const step = await Step.findOne();
  if (!step) {
    console.log('No steps found');
    process.exit(1);
  }
  console.log('Found random step:', step.id);

  // Try findByPk without include
  const stepWithoutInclude = await Step.findByPk(step.id);
  console.log('findByPk without include:', !!stepWithoutInclude);

  // Try findByPk with include and order
  const stepWithInclude = await Step.findByPk(step.id, {
    include: [{ model: Rule, as: 'rules' }],
    order: [[{ model: Rule, as: 'rules' }, 'priority', 'ASC']]
  });
  console.log('findByPk with include:', !!stepWithInclude);

  process.exit(0);
}

check();
