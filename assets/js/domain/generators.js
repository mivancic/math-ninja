import { createQuestion, OPS } from './question.js';
import { GAME_CONFIG } from '../config.js';

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffles an array in place
 * @param {Array} array
 * @returns {Array}
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generates distractors (wrong answers)
 * @param {number} correct
 * @param {number} count
 * @param {number} range
 * @returns {number[]}
 */
function generateDistractors(correct, count, range = 10) {
  const distractors = new Set();

  // Strategies to generate plausible wrong answers
  const strategies = [
    () => correct + randomInt(1, range),
    () => correct - randomInt(1, range),
    () => correct + 10,
    () => correct - 10,
    () => { // For multiplication, close multiples
       return correct + randomInt(1, 3);
    }
  ];

  while (distractors.size < count) {
    const strategy = strategies[randomInt(0, strategies.length - 1)];
    let val = strategy();

    // Ensure non-negative if correct is non-negative (simple heuristic)
    if (correct >= 0 && val < 0) val = Math.abs(val);

    // Don't duplicate correct answer or existing distractors
    if (val !== correct && val >= 0) {
      distractors.add(val);
    }

    // Fallback if we're stuck
    if (distractors.size < count) {
        let randomVal = randomInt(Math.max(0, correct - range), correct + range);
        if(randomVal !== correct && randomVal >= 0) distractors.add(randomVal);
    }
  }

  return Array.from(distractors);
}

/**
 * Generates an addition question
 * @param {Object} levelConfig
 * @returns {Object} Question object
 */
export function generateAdd(levelConfig) {
  const { range, allowCarry } = levelConfig;
  const [min, max] = range;

  let a, b;

  // Simple generation for now.
  // TODO: Implement sophisticated logic for "no carry" if strictly required,
  // but for V2 MVP, simple random within range is usually acceptable or we retry.

  // If we need to strictly enforce no carry for L1:
  if (allowCarry === false) {
     // Generate digits that don't sum > 9
     // E.g. for range 0-10, we want a+b <= 10.
     // Actually "no carry" usually means digit-wise sum <= 9.
     // For 0-10 (single digit), it just means sum <= 9 (which is always true for 1-digit except 5+5 etc if we consider 10 as carry? No, 10 has carry).
     // "No carry" usually applies to multi-digit. For 0-10, it just means sum <= 9.

     // Let's keep it simple: Ensure result <= max.
     const sum = randomInt(min, max);
     a = randomInt(0, sum);
     b = sum - a;
  } else {
     a = randomInt(min, max);
     b = randomInt(min, max);
     // Re-roll if sum exceeds likely reasonable bounds for the level?
     // The config says "Do 10" (0-10). It implies result is within 0-10? Or operands?
     // "L1: 0-10". Usually implies operands are 0-10 or Sum is 0-10.
     // PRD: "L1: 0-10, bez prijenosa".
     // Let's assume result <= max for "Do X" levels.
     const sum = randomInt(min, max);
     a = randomInt(0, sum);
     b = sum - a;
  }

  const correct = a + b;
  const options = shuffle([correct, ...generateDistractors(correct, 3)]);

  return createQuestion({
    op: OPS.ADD,
    a,
    b,
    correct,
    options,
    meta: { levelId: levelConfig.id }
  });
}

/**
 * Generates a subtraction question
 * @param {Object} levelConfig
 * @returns {Object} Question object
 */
export function generateSub(levelConfig) {
  const { range, allowNegative } = levelConfig;
  const [min, max] = range;

  let a, b;

  // "Do 10" -> operands within 0-10? Or result within 0-10?
  // Usually for subtraction "Do 10", Minuend (a) is <= 10.

  a = randomInt(min, max);
  b = randomInt(min, max); // This might be too big

  if (!allowNegative) {
    if (a < b) [a, b] = [b, a]; // Swap to ensure positive result
  }

  // If we want to restrict b to be smaller, we effectively did that.

  const correct = a - b;
  const options = shuffle([correct, ...generateDistractors(correct, 3)]);

  return createQuestion({
    op: OPS.SUB,
    a,
    b,
    correct,
    options,
    meta: { levelId: levelConfig.id }
  });
}

/**
 * Generates a multiplication question
 * @param {Object} levelConfig
 * @returns {Object} Question object
 */
export function generateMul(levelConfig) {
  // Config: table: 2, range: [1, 10]
  const { table, range } = levelConfig;
  const [min, max] = range;

  const a = table;
  const b = randomInt(min, max);

  // Randomize order (a*b or b*a)
  const [op1, op2] = Math.random() > 0.5 ? [a, b] : [b, a];

  const correct = op1 * op2;
  const options = shuffle([correct, ...generateDistractors(correct, 3)]);

  return createQuestion({
    op: OPS.MUL,
    a: op1,
    b: op2,
    correct,
    options,
    meta: { levelId: levelConfig.id }
  });
}

/**
 * Generates a division question
 * @param {Object} levelConfig
 * @returns {Object} Question object
 */
export function generateDiv(levelConfig) {
  // Config: divisor: 2, range: [1, 10] (result range)
  const { divisor, range } = levelConfig;
  const [min, max] = range;

  const b = divisor;
  const quotient = randomInt(min, max);
  const a = b * quotient; // Dividend

  const correct = quotient;
  const options = shuffle([correct, ...generateDistractors(correct, 3)]);

  return createQuestion({
    op: OPS.DIV,
    a, // Dividend
    b, // Divisor
    correct,
    options,
    meta: { levelId: levelConfig.id }
  });
}

export const Generators = {
  [OPS.ADD]: generateAdd,
  [OPS.SUB]: generateSub,
  [OPS.MUL]: generateMul,
  [OPS.DIV]: generateDiv
};
