import { generateQuestion } from '../CosmicQuiz';

describe('CosmicQuiz Logic', () => {
    test('generateQuestion creates valid math problems', () => {
        const q = generateQuestion("easy");

        // Check format "A + B = ?"
        expect(q.text).toMatch(/^\d+ \+ \d+ = \?$/);

        // Extract numbers
        const parts = q.text.split(' ');
        const a = parseInt(parts[0]);
        const b = parseInt(parts[2]);
        const expectedSum = a + b;

        // Check validation
        const correctAnswers = q.answers.filter(a => a.isCorrect);
        expect(correctAnswers.length).toBe(1);
        expect(correctAnswers[0].text).toBe(expectedSum.toString());

        // Check distractors
        const wrongAnswers = q.answers.filter(a => !a.isCorrect);
        expect(wrongAnswers.length).toBe(2);
        wrongAnswers.forEach(ans => {
            expect(ans.text).not.toBe(expectedSum.toString());
        });
    });

    test('generateQuestion produces randomized answers', () => {
        // Run multiple times to ensure we don't always get the same structure
        const results = new Set();
        for (let i = 0; i < 10; i++) {
            results.add(generateQuestion("easy").text);
        }
        expect(results.size).toBeGreaterThan(1);
    });
});
