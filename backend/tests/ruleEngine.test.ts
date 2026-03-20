import { evaluateRule } from '../src/engine/ruleEngine';

const runTests = () => {
  let passed = 0;
  let failed = 0;

  const test = (name: string, condition: string, data: any, expected: boolean) => {
    try {
      const result = evaluateRule(condition, data);
      if (result === expected) {
        console.log(`✅ PASS: ${name}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${name} | Expected ${expected}, got ${result}`);
        failed++;
      }
    } catch (e) {
      if (expected === false && (e as Error).message.includes('Failed to evaluate')) {
        // When evaluateRule catches an error, it throws an error. We want it to be considered false in our engine tests.
        console.log(`✅ PASS: ${name} (threw expected error)`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${name} | Threw unexpected error: ${(e as Error).message}`);
        failed++;
      }
    }
  };

  const data = {
    amount: 250,
    country: 'US',
    priority: 'High',
    department: 'Finance',
    user: {
      is_active: true,
      role: 'admin'
    }
  };

  console.log('--- Running Rule Engine Tests ---');
  
  test('DEFAULT keyword', 'DEFAULT', data, true);
  test('Simple greater than', 'amount > 100', data, true);
  test('Simple less than', 'amount < 100', data, false);
  test('Equality string', 'country == "US"', data, true);
  test('Equality string (single quote)', "country == 'US'", data, true);
  test('Inequality', 'department != "HR"', data, true);
  
  test('Logical AND (both true)', 'amount > 100 && country == "US"', data, true);
  test('Logical AND (one false)', 'amount > 100 && country == "UK"', data, false);
  
  test('Logical OR (one true)', 'amount < 100 || department == "Finance"', data, true);
  test('Logical OR (both false)', 'amount < 100 || department == "HR"', data, false);
  
  test('Complex Logic 1', 'amount > 100 && country == "US" && priority == "High"', data, true);
  test('Complex Logic 2', '(amount > 300 || country == "US") && priority == "High"', data, true);
  test('Complex Logic 3', '(amount > 300 || country == "UK") && priority == "High"', data, false);
  
  test('Nested properties', 'user.is_active == true', data, true);
  test('Nested properties mismatch', 'user.role == "user"', data, false);
  
  test('Function: contains (true)', 'contains(department, "Fin")', data, true);
  test('Function: contains (false)', 'contains(department, "HR")', data, false);
  
  test('Function: startsWith (true)', 'startsWith(country, "U")', data, true);
  test('Function: endsWith (true)', 'endsWith(priority, "gh")', data, true);
  
  test('Invalid Syntax (fails gracefully)', 'amount >> 100', data, false);
  test('Missing function (fails gracefully)', 'unknownFunc(country)', data, false);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

runTests();
