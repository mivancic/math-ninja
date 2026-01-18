/**
 * Math Ninja - Review System Logic
 * Helper functions to reconstruct questions from wrong answer records.
 */

import { createQuestion, OPS } from './question.js';
import { Generators } from './generators.js';

/**
 * Reconstructs a question object from a wrong answer record.
 * Uses the generator logic to create fresh distractors while forcing the operands.
 *
 * @param {Object} record - The wrong answer record from StatisticsManager
 * @returns {Object} Canonical Question object
 */
export function createReviewQuestion(record) {
    // Record structure: { op, a, b, levelId, ... }
    const { op, a, b, levelId } = record;

    // We need to generate distractors.
    // Since generators usually take a config, we might need a lower-level helper.
    // However, looking at generators.js, we can reuse the logic if we extract 'generateDistractors'
    // or simply manually generate options here.
    // For robustness, let's implement option generation here similar to generators.

    let correct;
    let symbol;

    switch(op) {
        case OPS.ADD: correct = a + b; symbol = '+'; break;
        case OPS.SUB: correct = a - b; symbol = '−'; break;
        case OPS.MUL: correct = a * b; symbol = '×'; break;
        case OPS.DIV: correct = a / b; symbol = '÷'; break; // Assuming a is dividend
        default: correct = 0; symbol = '?';
    }

    const options = generateOptions(correct);

    return createQuestion({
        op,
        a,
        b,
        correct,
        options,
        meta: {
            levelId: levelId,
            isReview: true,
            source: 'wrong-answer'
        }
    });
}

/**
 * Generate 4 options including the correct one
 */
function generateOptions(correct) {
    const options = new Set([correct]);
    const range = Math.max(10, Math.floor(correct * 0.5)); // Variation range

    while(options.size < 4) {
        // Simple distractor logic
        const offset = Math.floor(Math.random() * range) + 1;
        const sign = Math.random() > 0.5 ? 1 : -1;
        let val = correct + (offset * sign);

        if (val < 0) val = Math.abs(val); // No negatives unless intended? Keeping simple.
        if (val !== correct) options.add(val);

        // Safety break
        if (options.size < 4 && Math.random() < 0.1) {
             options.add(correct + options.size + 1);
        }
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
}
