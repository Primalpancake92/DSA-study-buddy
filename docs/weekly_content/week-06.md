# Week 6 - Binary Search

This week, you will be learning binary search: how one comparison can rule out many possibilities. It helps us locate records in sorted data, find boundaries among duplicates, and choose the smallest feasible operating setting.

We will start with exact search, then develop lower and upper bounds, search a rotated array, and search an answer space. Each version will come with a precise description of what the remaining interval means.

By the end, you will be able to justify every discarded region, implement terminating loops, and include the cost of a feasibility test in your complexity analysis.

There will be a checklist at the end to help you track your progress. Use it after tracing and testing your own code, and capture the boundary cases you missed in your progress logs.

## Learning Objectives

- Distinguish an exact match, an insertion position, and the first feasible answer.
- Maintain closed and half-open interval invariants without mixing conventions.
- Handle duplicates using lower and upper bounds.
- Explain the distinct-values assumption in rotated search.
- Build a monotonic predicate and derive the full cost of answer-space search.

## Prerequisite Knowledge

Review indexing in [Arrays](week-17.md), logarithmic growth in [Algorithm Complexity](week-01.md), and the idea of a safe pointer move in [Week 3](week-03.md). You should understand `Math.floor`, comparisons, and a loop that updates two boundaries. Examples assume finite numeric data, sorted in ascending order where stated, and integer arithmetic within JavaScript's safe range. The programs are independent; none relies on an earlier code block.

## Core Theory

### Elimination needs evidence

Imagine searching a numbered shelf. If the middle label is smaller than the target and labels increase left to right, every label to its left is also too small. That is the reason binary search works. “Look in the middle” is merely an implementation detail; the proof that an entire region is impossible is the actual algorithm.

For exact search, let `[left,right]` be a closed interval: both endpoints are candidates. Initially it includes every array index. If the midpoint is equal, return it. If too small, exclude it and everything before it with `left = middle + 1`. Otherwise use `right = middle - 1`. The loop includes a singleton interval, so its condition is `left <= right`. If the interval becomes empty, no candidate remains.

The distance between the boundaries strictly decreases. This termination argument matters as much as the ordering argument. Assigning `left = middle` can repeat the same state when only one or two candidates remain. [CMU's binary-search notes](https://www.cs.cmu.edu/afs/cs.cmu.edu/academic/class/15122-s14/www/06-binsearch.pdf) provide a formal treatment of loop invariants; here we will express them in ordinary language alongside the code.

### A boundary search should not return on equality

In `[2,4,4,4,9]`, an exact search may find any 4. If we need the first 4, equality says “this position is a candidate,” not “we are finished.” A lower bound is the first index whose value is at least the target. If no such element exists, the answer is n, the insertion position after the array.

Use `[left,right)` for unresolved elements. Everything before left is known too small. Every real index at or after right is known large enough. The answer lies in the boundary interval `[left,right]`, which includes sentinel n. When a midpoint qualifies, set right to middle, preserving it as a possible boundary. Otherwise move left beyond middle. At termination, left equals right and the two proven regions meet.

Upper bound finds the first value strictly greater than the target. The equal values occupy `[lowerBound,upperBound)`. Their count is the difference. This works even when the target is absent: the two boundaries coincide. An insertion position does not establish membership; compare the value at that index after checking it is less than n.

### Rotation preserves enough local order

A rotated sorted array has a break between two increasing runs. With distinct values, at least one half around the midpoint is sorted. After testing midpoint equality, determine the sorted half and check whether its numeric range could contain the target. Keep it if so; otherwise keep the other half.

This is still an elimination proof, but the evidence comes from local order. Duplicates weaken that evidence: if left, middle, and right have the same value, they may conceal which side contains the rotation. A duplicate-aware variant can shrink equal endpoints, but may need Θ(n) time. Our implementation explicitly requires distinct values rather than promising logarithmic search on that different problem.

### Binary search can search answers rather than indexes

Suppose a worker processes one pile per hour at a chosen integer speed, and unused capacity in an hour cannot transfer to another pile. A pile of p units takes `ceil(p/speed)` hours. We seek the minimum speed finishing within h hours, the contract used in Koko Eating Bananas.

At higher speed, no pile takes more hours. Therefore feasibility is false for some initial speeds and true for all later speeds. We can search this transition. Testing “hours equal h” is wrong: required hours can jump past h, and a faster valid speed may use fewer hours. The predicate is `hours <= h`.

Positive piles need at least one hour each. If h is below the pile count, no speed can work. Otherwise the maximum pile size is a feasible upper bound. Establishing that bound prevents the loop from returning a number that merely looks like an answer.

## JavaScript Implementations

### Exact search with a closed interval

```javascript
function binarySearch(values, target) {
  let left = 0, right = values.length - 1;
  while (left <= right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] === target) return middle;
    if (values[middle] < target) left = middle + 1;
    else right = middle - 1;
  }
  return -1;
}
console.log(binarySearch([2, 5, 8, 12, 19], 12));
console.log(binarySearch([2, 5, 8, 12, 19], 7));
console.log(binarySearch([], 7));
console.log(binarySearch([7], 7));
```
```output
3
-1
-1
0
```

The midpoint expression uses ordinary arithmetic rather than bitwise operators, which coerce JavaScript numbers to 32-bit integers. No slices are created, so the algorithm neither copies the search range nor changes the input.

### Lower and upper bounds

```javascript
function lowerBound(values, target) {
  let left = 0, right = values.length;
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] < target) left = middle + 1;
    else right = middle;
  }
  return left;
}
function upperBound(values, target) {
  let left = 0, right = values.length;
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] <= target) left = middle + 1;
    else right = middle;
  }
  return left;
}
const values = [2, 4, 4, 4, 9];
console.log(lowerBound(values, 4), upperBound(values, 4));
console.log(upperBound(values, 4) - lowerBound(values, 4));
console.log(lowerBound(values, 6), upperBound(values, 6));
console.log(lowerBound(values, 20), lowerBound([], 3));
const index = lowerBound(values, 6);
console.log(index < values.length && values[index] === 6);
```
```output
1 4
3
4 4
5 0
false
```

Only one comparison changes between the two functions. Derive that comparison from the predicate instead of memorizing two almost-identical templates.

### Search a rotated array of distinct values

```javascript
function rotatedSearch(values, target) {
  let left = 0, right = values.length - 1;
  while (left <= right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] === target) return middle;
    if (values[left] <= values[middle]) {
      if (values[left] <= target && target < values[middle]) right = middle - 1;
      else left = middle + 1;
    } else {
      if (values[middle] < target && target <= values[right]) left = middle + 1;
      else right = middle - 1;
    }
  }
  return -1;
}
console.log(rotatedSearch([11, 14, 18, 2, 5, 8], 5));
console.log(rotatedSearch([11, 14, 18, 2, 5, 8], 7));
console.log(rotatedSearch([3], 3));
console.log(rotatedSearch([], 3));
```
```output
4
-1
0
-1
```

The inclusive endpoint tests keep a target equal to the left or right value. The midpoint comparisons are strict because equality was already handled. Sorting first would lose original positions and spend more time than this search.

### Minimum feasible speed

```javascript
function minimumSpeed(piles, hours) {
  // Contract: positive safe-integer piles and nonnegative safe-integer hours.
  // Accumulated hour counts must also stay within the safe integer range.
  if (piles.length === 0) return 0;
  if (hours < piles.length) return null;
  let left = 1, right = 1;
  for (const pile of piles) right = Math.max(right, pile);
  function feasible(speed) {
    let required = 0;
    for (const pile of piles) {
      required += Math.ceil(pile / speed);
      if (required > hours) return false;
    }
    return true;
  }
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2);
    if (feasible(middle)) right = middle;
    else left = middle + 1;
  }
  return left;
}
console.log(minimumSpeed([4, 9, 13], 7));
console.log(minimumSpeed([4, 9, 13], 3));
console.log(minimumSpeed([4, 9, 13], 2));
console.log(minimumSpeed([], 0));
```
```output
5
13
null
0
```

The local helper captures piles and hours without copying them. Early failure saves work on some tests, but a worst-case complexity bound still charges a full scan per tested speed. Empty input and impossible schedules have explicitly defined results here; an online problem may exclude those inputs.

## Worked Examples

Trace lower bound of 4 in `[2,4,4,4,9]`:

| left | right, exclusive | middle | value | Decision |
| --- | --- | --- | --- | --- |
| 0 | 5 | 2 | 4 | qualifies; right=2 |
| 0 | 2 | 1 | 4 | qualifies; right=1 |
| 0 | 1 | 0 | 2 | too small; left=1 |

The loop stops at 1. Returning the first equal midpoint would instead return 2 and violate the first-occurrence contract.

For rotated search of 5, the initial interval is `[0,5]`, midpoint 2 with value 18. The left half spans 11 through 18, excluding 5, so left becomes 3. Midpoint 4 then directly matches. For missing 7, the next sorted half `[2,5]` excludes 7, then singleton 8 also fails.

For minimum speed on `[4,9,13]` with seven hours:

| Candidate interval | Tested speed | Hours needed | Next interval |
| --- | --- | --- | --- |
| [1,13] | 7 | 1+2+2=5 | [1,7] |
| [1,7] | 4 | 1+3+4=8 | [5,7] |
| [5,7] | 6 | 1+2+3=6 | [5,6] |
| [5,6] | 5 | 1+2+3=6 | [5,5] |

The answer is 5 even though it uses six, not seven, hours. Speed 4 is infeasible, which proves minimality.

## Visual Explanations

```text
Lower bound of 4:
values:       2   4   4   4   9    [end]
predicate:    F   T   T   T   T
boundary:         ^ first true

During the search:
[ proven < target ][ unresolved elements ][ proven >= target ]
                   left                  right

Feasibility is a similar boundary over speeds, not array positions:
speed:        1  2  3  4 | 5  6  7 ... 13
feasible:     F  F  F  F | T  T  T ... T
```

The n sentinel means “all elements are false.” It need not be read from the array. Ask where the boundary belongs before writing any endpoint update.

## Complexity Analysis

An interval of size n becomes roughly n/2, n/4, and so on. After k reductions, its size is at most about n/2^k. This gives O(log(n+1)) iterations, including a sensible constant bound for empty input. Exact, lower-bound, upper-bound, and distinct-value rotated search all use O(1) auxiliary space.

For p piles and maximum pile M, the speed algorithm takes O(p + p log M), equivalently O(p log(M+1)), and O(1) auxiliary space. The logarithm counts candidate speeds; the p factor counts the work of testing one. If a generic predicate costs C and the integer range has R possibilities, report O(C log(R+1)), plus setup.

Sorting an unsorted array first costs O(n log n) in the standard comparison-sort model. It can be worthwhile for many later queries, but one lookup does not become logarithmic end to end. Sorting must preserve original indexes if those are part of the answer. Default JavaScript sorting is lexical; numeric sorting requires `(a,b) => a-b`.

## Common Mistakes

- Mixing `right = n` with `left <= right` can read beyond the array.
- Using `right = middle - 1` in lower bound discards a possible boundary.
- Returning on equality solves “any match,” not “first match.”
- Assuming a feasibility predicate is monotonic without checking the problem's rules.
- Forgetting ceiling division undercounts partial hours.
- Applying the distinct-value rotated algorithm to arbitrary duplicates.

```javascript-bug
while (left < right) {
  const middle = left + Math.floor((right - left) / 2);
  if (values[middle] < target) left = middle;
  else right = middle;
}
```

On `[1,3]` searching for 3 with left=0 and right=1, middle remains zero and the loop never progresses.

## Interview and LeetCode Pattern Recognition

Sorted input suggests binary search only if comparisons can discard a region. First occurrence, insertion point, and count of duplicates suggest boundaries. Rotated input suggests finding the locally ordered half. “Minimum capacity” or “smallest speed” suggests answer-space search when feasibility moves in one direction.

Before coding, say: “My answer is an index/value/boundary; this is my interval convention; this comparison proves these candidates impossible.” For Koko Eating Bananas, explain why a faster speed cannot hurt. For Search Insert Position, lower bound already matches the requested contract. A linked list does not provide constant-time midpoint access, so the array-search complexity does not transfer automatically.

## Practice Exercises

### Conceptual Questions

1. **Conceptual:** Why does exact binary search need sorted order? Give two unsorted arrays with the same midpoint but targets on different sides.
2. **Conceptual:** For piles `[5]`, can you always find a speed requiring exactly four hours? What does this say about the correct predicate?

### Code Tracing

3. **Tracing:** Compute lower and upper bounds of 2 and 3 in `[2,2,2,4]`. Trace every interval for one of those four calls.

### Debugging Exercises

4. **Debugging:** Repair the nonterminating loop. Explain why your update both progresses and preserves the boundary invariant.

### Implementation Exercises

5. **Implementation:** Write `countOccurrences(values,target)` using two boundary searches. Test empty, absent, and all-equal input.
6. **Implementation:** Reimplement rotated search. Test rotations of a two-element array and a target equal to either endpoint.

### LeetCode and HackerRank Practice

7. **[Binary Search](https://leetcode.com/problems/binary-search/)** — Platform: LeetCode. Official difficulty: Easy. Concepts: sorted-array elimination, closed intervals, missing targets. Why: it isolates the interval invariant before adding boundary or feasibility complications.
8. **[Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/description/)** — Platform: LeetCode. Official difficulty: Medium. Concepts: answer-space search, ceiling division, monotonic feasibility. Why: it tests whether you can search a numeric answer range and include the predicate cost. Both official pages were verified; no HackerRank page was consulted. Follow with the syllabus task Search Insert Position and distinguish its insertion-index contract from exact search.

## Hints and Worked Solutions

1. Consider `[7,1,9]` and `[9,1,7]`, both with midpoint 1 and target 7. Without order, the midpoint cannot select a safe half.
2. Speeds 1, 2, 3, 4, 5 for `[5]` require 5, 3, 2, 2, 1 hours. Four hours is skipped. The valid condition is at most four hours, whose minimum speed is 2.
3. For target 2, bounds are 0 and 3, giving three occurrences. For target 3, both are 3, giving zero. Lower bound of 2 visits middles 2, 1, 0 and repeatedly moves right leftward.
4. Use `left = middle + 1` when the midpoint is too small. It cannot be the first qualifying element, so discarding it is justified. Retain `right = middle` when it qualifies.
5. The following standalone solution factors the strictness into one helper. Its two searches still take logarithmic time.

```javascript
function countOccurrences(values, target) {
  function boundary(strict) {
    let left = 0, right = values.length;
    while (left < right) {
      const middle = left + Math.floor((right - left) / 2);
      const qualifies = strict ? values[middle] > target : values[middle] >= target;
      if (qualifies) right = middle;
      else left = middle + 1;
    }
    return left;
  }
  return boundary(true) - boundary(false);
}
console.log(countOccurrences([2, 2, 2, 4], 2));
console.log(countOccurrences([2, 2, 2, 4], 3));
console.log(countOccurrences([], 2));
```
```output
3
0
0
```

6. On `[8,3]`, target 8 matches midpoint zero; target 3 discards that singleton left half and finds index one. Both endpoint comparisons must be inclusive where the endpoint remains a candidate.
7–8. Exact search and minimum speed above are worked solutions. Explain their invariants from memory before adapting the required function signatures. A useful independent test for speed search enumerates small speeds and compares the first feasible one.

## Sources and Further Reading

Consulted on 2026-11-07; chapter examples and derivations are original and follow the repository syllabus.

- [CMU 15-122: Binary Search lecture notes](https://www.cs.cmu.edu/afs/cs.cmu.edu/academic/class/15122-s14/www/06-binsearch.pdf) — consulted the notes for sorted-search reasoning and invariant-based verification.
- [LeetCode: Binary Search](https://leetcode.com/problems/binary-search/) — read the official sorted-array and return-value contract.
- [LeetCode: Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/description/) — read the official problem description and difficulty for the minimum-speed practice task; no editorial was consulted.

## Weekly Summary

Binary search works when a comparison proves a region impossible. Boundaries require preserving qualifying midpoints; rotated search requires identifying local order; answer-space search requires monotonic feasibility. The small loop is only correct when its contract, invariant, and progress argument agree. Next, [Week 7](week-07.md) changes the data representation from indexes to node references.

## Weekly Progress Checklist

### Theory

- [ ] State the closed and half-open invariants in my own words. <!-- checkpoint:w6-search-invariants -->
- [ ] Prove feasibility is monotonic for the pile-speed problem. <!-- checkpoint:w6-monotonic-feasibility -->

### JavaScript

- [ ] Implement exact, lower-bound, and upper-bound search from memory. <!-- checkpoint:w6-boundary-implementations -->
- [ ] Implement rotated search and state its duplicate limitation. <!-- checkpoint:w6-rotated-search -->

### Practice

- [ ] Trace empty, singleton, duplicate, and missing-target cases. <!-- checkpoint:w6-edge-case-traces -->
- [ ] Solve the two external tasks and explain their different return contracts. <!-- checkpoint:w6-external-practice -->

### Reflection

- [ ] Record a nonterminating update and its smallest counterexample. <!-- checkpoint:w6-termination-reflection -->
- [ ] Include predicate evaluation and preprocessing in my complexity explanation. <!-- checkpoint:w6-full-cost-reflection -->
