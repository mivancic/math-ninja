/**
 * Math Ninja - Question Domain Model
 */

export const OPS = {
  ADD: 'add',
  SUB: 'sub',
  MUL: 'mul',
  DIV: 'div'
};

export const OP_SYMBOLS = {
  [OPS.ADD]: '+',
  [OPS.SUB]: '−',
  [OPS.MUL]: '×',
  [OPS.DIV]: '÷'
};

/**
 * Get the symbol for a given operation
 * @param {string} op
 * @returns {string}
 */
export function getOpSymbol(op) {
  return OP_SYMBOLS[op] || '?';
}

/**
 * Creates a canonical question object
 * @param {Object} params
 * @param {string} params.op - Operation type
 * @param {number} params.a - First operand
 * @param {number} params.b - Second operand
 * @param {number} params.correct - Correct answer
 * @param {number[]} params.options - Array of possible answers (including correct)
 * @param {Object} params.meta - Metadata (levelId, isReview, etc.)
 * @returns {Object} Question object
 */
export function createQuestion({ op, a, b, correct, options, meta = {} }) {
  const symbol = getOpSymbol(op);
  return {
    id: `${op}_${a}_${b}`,
    op,
    a,
    b,
    text: `${a} ${symbol} ${b} = ?`,
    correct,
    options,
    meta
  };
}
