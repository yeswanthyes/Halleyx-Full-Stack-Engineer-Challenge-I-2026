/**
 * Custom Rule Engine for Workflow Execution
 * Parses expression strings into an AST and evaluates them against a JSON data context.
 * 
 * Supports:
 * - Literals: Numbers, Strings (single or double quoted), Booleans (true, false)
 * - Variables: Alphanumeric identifiers representing keys in the `data` object
 * - Comparison: ==, !=, <, >, <=, >=
 * - Logical: &&, ||
 * - Functions: contains(field, "val"), startsWith(field, "val"), endsWith(field, "val")
 * - Grouping: ()
 * - Keyword: DEFAULT
 */

// --- 1. Tokenizer ---
export type TokenType = 
  | 'STRING' | 'NUMBER' | 'BOOLEAN' | 'IDENTIFIER'
  | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'DEFAULT' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let current = 0;

  while (current < input.length) {
    let char = input[current];

    if (/\s/.test(char)) {
      current++;
      continue;
    }

    if (input.substring(current, current + 7) === 'DEFAULT') {
      tokens.push({ type: 'DEFAULT', value: 'DEFAULT' });
      current += 7;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      current++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      current++;
      continue;
    }

    if (char === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      current++;
      continue;
    }

    // Two-character operators
    if (current + 1 < input.length) {
      const twoChars = input.substring(current, current + 2);
      if (['==', '!=', '<=', '>=', '&&', '||'].includes(twoChars)) {
        tokens.push({ type: 'OPERATOR', value: twoChars });
        current += 2;
        continue;
      }
    }

    // Single-character operators
    if (['<', '>'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      current++;
      continue;
    }

    if (char === '"' || char === "'") {
      let value = '';
      const quoteType = char;
      char = input[++current];
      while (char !== quoteType && current < input.length) {
        value += char;
        char = input[++current];
      }
      current++; // skip closing quote
      tokens.push({ type: 'STRING', value });
      continue;
    }

    if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(input[current + 1]))) {
      let value = '';
      if (char === '-') {
        value += char;
        char = input[++current];
      }
      while (/[0-9.]/.test(char) && current < input.length) {
        value += char;
        char = input[++current];
      }
      tokens.push({ type: 'NUMBER', value });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (/[a-zA-Z0-9_.]/.test(char) && current < input.length) {
        value += char;
        char = input[++current];
      }
      if (value === 'true' || value === 'false') {
        tokens.push({ type: 'BOOLEAN', value });
      } else {
        tokens.push({ type: 'IDENTIFIER', value });
      }
      continue;
    }

    throw new Error(`Unexpected character at index ${current}: ${char}`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// --- 2. Parser ---
export type ASTNode = 
  | { type: 'BinaryExpression'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'CallExpression'; name: string; args: ASTNode[] }
  | { type: 'Identifier'; name: string }
  | { type: 'Literal'; value: any }
  | { type: 'Default' };

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    if (this.tokens.length === 1 && this.tokens[0].type === 'EOF') {
      throw new Error("Empty expression");
    }
    
    if (this.tokens[this.current].type === 'DEFAULT') {
      this.current++;
      return { type: 'Default' };
    }

    // Entry point: lowest precedence is logical OR (||)
    const result = this.parseLogOr();
    if (this.tokens[this.current].type !== 'EOF') {
      throw new Error(`Unexpected token: ${this.tokens[this.current].value}`);
    }
    return result;
  }

  private parseLogOr(): ASTNode {
    let left = this.parseLogAnd();
    while (this.match('OPERATOR', '||')) {
      const right = this.parseLogAnd();
      left = { type: 'BinaryExpression', operator: '||', left, right };
    }
    return left;
  }

  private parseLogAnd(): ASTNode {
    let left = this.parseEquality();
    while (this.match('OPERATOR', '&&')) {
      const right = this.parseEquality();
      left = { type: 'BinaryExpression', operator: '&&', left, right };
    }
    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseRelational();
    while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parseRelational();
      left = { type: 'BinaryExpression', operator, left, right };
    }
    return left;
  }

  private parseRelational(): ASTNode {
    let left = this.parsePrimary();
    while (
      this.match('OPERATOR', '<') || this.match('OPERATOR', '<=') ||
      this.match('OPERATOR', '>') || this.match('OPERATOR', '>=')
    ) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parsePrimary();
      left = { type: 'BinaryExpression', operator, left, right };
    }
    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.tokens[this.current];

    if (this.match('NUMBER')) {
      return { type: 'Literal', value: Number(token.value) };
    }

    if (this.match('STRING')) {
      return { type: 'Literal', value: token.value };
    }

    if (this.match('BOOLEAN')) {
      return { type: 'Literal', value: token.value === 'true' };
    }

    if (this.match('LPAREN')) {
      const expr = this.parseLogOr();
      if (!this.match('RPAREN')) {
        throw new Error('Expected ")"');
      }
      return expr;
    }

    if (this.match('IDENTIFIER')) {
      // Check if it's a function call e.g., contains(...)
      if (this.tokens[this.current] && this.tokens[this.current].type === 'LPAREN') {
        this.current++; // consume '('
        const args: ASTNode[] = [];
        if (this.tokens[this.current].type !== 'RPAREN') {
          args.push(this.parseLogOr());
          while (this.match('COMMA')) {
            args.push(this.parseLogOr());
          }
        }
        if (!this.match('RPAREN')) {
          throw new Error('Expected ")" after arguments');
        }
        return { type: 'CallExpression', name: token.value, args };
      }
      return { type: 'Identifier', name: token.value };
    }

    throw new Error(`Unexpected token at primary: ${token.value} (${token.type})`);
  }

  private match(type: TokenType, value?: string): boolean {
    const token = this.tokens[this.current];
    if (token && token.type === type && (value === undefined || token.value === value)) {
      this.current++;
      return true;
    }
    return false;
  }
}

// --- 3. Evaluator ---
export function evaluateAST(node: ASTNode, data: Record<string, any>): any {
  switch (node.type) {
    case 'Literal':
      return node.value;
      
    case 'Default':
      return true;

    case 'Identifier': {
      // Handle dotted paths e.g., user.address.city
      const parts = node.name.split('.');
      let val = data;
      for (const part of parts) {
        if (val == null) return null;
        val = val[part];
      }
      return val;
    }

    case 'BinaryExpression': {
      const left = evaluateAST(node.left, data);
      
      // Short-circuiting for logical operators
      if (node.operator === '&&' && !left) return false;
      if (node.operator === '||' && !!left) return true;

      const right = evaluateAST(node.right, data);

      switch (node.operator) {
        case '&&': return left && right;
        case '||': return left || right;
        case '==': return left === right;
        case '!=': return left !== right;
        case '<': return left < right;
        case '<=': return left <= right;
        case '>': return left > right;
        case '>=': return left >= right;
        default: throw new Error(`Unknown operator: ${node.operator}`);
      }
    }

    case 'CallExpression': {
      const args = node.args.map(arg => evaluateAST(arg, data));
      switch (node.name) {
        case 'contains':
          if (typeof args[0] !== 'string') return false;
          return args[0].includes(args[1]);
        case 'startsWith':
          if (typeof args[0] !== 'string') return false;
          return args[0].startsWith(args[1]);
        case 'endsWith':
          if (typeof args[0] !== 'string') return false;
          return args[0].endsWith(args[1]);
        default:
          throw new Error(`Unknown function: ${node.name}`);
      }
    }

    default:
      // @ts-ignore
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

// --- 4. Main Entry Point ---
export function evaluateRule(condition: string, data: Record<string, any>): boolean {
  if (condition === 'DEFAULT') return true;
  
  try {
    const tokens = tokenize(condition);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return !!evaluateAST(ast, data);
  } catch (error) {
    console.error(`Rule Evaluation Error [${condition}]:`, error);
    // If a rule fails to evaluate, it's considered to not match to strictly fail safe.
    throw new Error(`Failed to evaluate condition "${condition}": ${(error as Error).message}`);
  }
}
