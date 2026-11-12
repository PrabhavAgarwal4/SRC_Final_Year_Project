import { describe, it } from 'vitest';
import { SimulationEngine } from '../src/engine/simulation/simulationEngine';
import { validateStateInvariants } from '../src/engine/validation/invariants';

describe('SRC Empirical Benchmark Suite', () => {
  it('measures exact rounds to completion across grid sizes and configurations', () => {
    const experiments = [
      { name: 'Rooted small (k=4)', L: 6, k: 4, placements: Array.from({ length: 4 }, (_, i) => ({ id: i + 1, pos: { x: 1, y: 1 } })) },
      { name: 'Rooted medium (k=9)', L: 8, k: 9, placements: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, pos: { x: 2, y: 2 } })) },
      { name: 'Rooted intermediate (k=16)', L: 10, k: 16, placements: Array.from({ length: 16 }, (_, i) => ({ id: i + 1, pos: { x: 3, y: 3 } })) },
      { name: 'Rooted large (k=25)', L: 12, k: 25, placements: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, pos: { x: 3, y: 3 } })) },
      { name: 'Rooted scaling (k=36)', L: 14, k: 36, placements: Array.from({ length: 36 }, (_, i) => ({ id: i + 1, pos: { x: 4, y: 4 } })) },
      { name: 'Corner Rooted (k=9, Boundary Bounce)', L: 8, k: 9, placements: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, pos: { x: 0, y: 0 } })) },
      { name: 'Two Clusters (k=8, Absorption/Collision)', L: 8, k: 8, placements: [
        ...Array.from({ length: 4 }, (_, i) => ({ id: i + 1, pos: { x: 1, y: 1 } })),
        ...Array.from({ length: 4 }, (_, i) => ({ id: i + 5, pos: { x: 5, y: 5 } }))
      ]},
      { name: 'Four Clusters (k=16, General Multi-Cluster)', L: 10, k: 16, placements: [
        ...Array.from({ length: 4 }, (_, i) => ({ id: i + 1, pos: { x: 1, y: 1 } })),
        ...Array.from({ length: 4 }, (_, i) => ({ id: i + 5, pos: { x: 1, y: 7 } })),
        ...Array.from({ length: 4 }, (_, i) => ({ id: i + 9, pos: { x: 7, y: 1 } })),
        ...Array.from({ length: 4 }, (_, i) => ({ id: i + 13, pos: { x: 7, y: 7 } }))
      ]}
    ];

    console.log('\n================ EXPERIMENTAL BENCHMARK RESULTS ================');
    console.log('L\tN\tk\tRounds\tDispersed\tViolations\tObservations');
    console.log('----------------------------------------------------------------');

    for (const exp of experiments) {
      const engine = new SimulationEngine(exp.L, exp.L, exp.placements);
      const finalState = engine.runUntilDispersed(150);
      const violations = validateStateInvariants(finalState);
      const isDispersed = finalState.isDispersed;
      const rounds = finalState.round;
      
      console.log(`${exp.L}\t${exp.L * exp.L}\t${exp.k}\t${rounds}\t${isDispersed}\t${violations.length}\t${exp.name}`);
    }
    console.log('================================================================\n');
  });
});
