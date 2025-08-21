# GPU.js Attractor Progressive Rendering Plan

## Current Performance Analysis

Currently, we're calculating 20 million points (4000x5000) in a single pass, which takes around 2000ms total. This introduces a significant delay before the user sees any visualization.

## Proposed Approach: Progressive Rendering

We'll split the calculation into three progressive stages to provide a better user experience:

1. **Quick Preview (10%)**: Fast initial render with reduced quality
2. **Mid Rendering (50%)**: Improved detail while still calculating
3. **Full Rendering (100%)**: Complete rendering

## Implementation Plan

### 1. Worker Architecture Changes

#### A. Split Point Calculation
- Maintain total of 20M points for final output
- For 10%: Calculate 2M points (1000x2000)
- For 50%: Calculate 10M points (2000x5000)
- For 100%: Complete the full 20M points (4000x5000)

#### C. Density Aggregation
- Create a function that can merge/accumulate density maps
- Maintain the current density map as we progress
- Add visualization threshold adjustments based on progress

### 2. Rendering Improvements

#### A. Progressive Rendering Pipeline
```
1. Calculate 10% of points
2. Build initial density map
3. Render to canvas (with adjusted brightness/contrast)
4. Send log to main
5. Calculate to 50%
6. Update density map with new points
7. Render to canvas
8. Send log to main
9. Calculate to 100%
10. Finalize density map
11. Final render with full quality
12. Send "DONE" message
```

#### B. Image Quality Adjustments
- All should use Full quality uses enhanced coloring with better gradient

### 3. User Experience Enhancements

#### B. Cancelation & Adjustments
- Allow parameter changes during calculation
- When parameters change, restart from 0
- When the page resize, restart from 0
- When the component goes out-of-scope (being removed), it should cancel any calculation.

## Technical Details

### Memory Management
- Reuse arrays where possible
- Clear unnecessary data between progress steps

## Performance Expectations

| Stage | Points | Expected Time | Total Elapsed |
|-------|--------|---------------|--------------|
| 10%   | 2M     | ~200ms        | 200ms        |
| 50%   | 8M more| ~800ms        | 1000ms       |
| 100%  | 10M more| ~1000ms      | 2000ms       |

This approach should give users visual feedback within ~200ms rather than waiting the full 2 seconds.

## Next Steps

1. Refactor worker code to support progressive calculation
3. Add controls for adjusting calculation quality/speed
4. Implement cancelation mechanism
5. Fine-tune thresholds based on performance testing
