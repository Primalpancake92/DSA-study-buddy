# Week 8 - Recursion and Backtracking

This week, you will be learning recursion and backtracking: ways to describe smaller problems and explore possible answers systematically. They are useful for hierarchical data, generating combinations, and searching choices that cannot be settled by one greedy step.

We will start with a single chain of recursive calls, then draw branching call trees and implement subsets, permutations, reusable-candidate sums, and phone-letter combinations. We will pay special attention to restoring shared state and measuring the output we actually produce.

By the end, you will be able to state a recursive contract, prove progress toward a base case, write choose/explore/undo code, and distinguish recursion depth from total runtime and stored output size.

There will be a checklist at the end to help you track your progress. Use it after explaining a call tree and rebuilding an example without copying, and record the state-restoration bugs you discover in your progress logs.

## Learning Objectives

- Explain suspended call frames and the difference between calling and returning.
- Identify a base case and a strictly decreasing measure for every recursive path.
- Define state, allowed choices, completion, and undo for four enumeration patterns.
- Save independent result snapshots rather than references to a changing path.
- Prove a pruning condition cannot remove a valid answer.
- Analyze explored work plus output-copying work using clearly named parameters.

## Prerequisite Knowledge

Review functions, arrays, object identity from [Week 7](week-07.md), and stacks from [Week 5](week-05.md). Each function call gets its own local bindings, but two calls can still refer to the same array. That distinction is central to backtracking. Examples use small inputs suitable for demonstration; JavaScript recursion depth is limited by the runtime, and large result sets can exhaust memory even with shallow recursion.

## Core Theory

### A recursive call makes a smaller promise

Instead of imagining that a function magically solves everything, give it a precise contract. For `sumFrom(values,index)`, the promise is “return the sum from index to the end.” If index is at the end, the answer is zero. Otherwise the answer is the current value plus the answer for index+1. The measure `values.length-index` decreases, so every path reaches the base case.

Calling the helper does not erase the caller. The caller waits with its local index and its unfinished addition. After the child returns, the addition finishes and the result returns to the next waiting caller. The pending frames form a stack, as illustrated in [MDN's recursion discussion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions). A missing base case or a recursive call with unchanged state can overflow that stack.

### A call tree counts work; a path counts stack depth

A function making one call on n−1 has a chain of n calls. A function making two calls on n−1 has a branching tree with about 2^n nodes, although only O(n) frames are active at once. Two calls on disjoint halves are different again: with linear combining work, each level costs O(n), and O(log n) levels give O(n log n). Count the sizes and overlap of subproblems; the number of call expressions alone proves little.

Passing array slices can hide additional copying. The first example passes an index and shares the input without mutation. This makes the work in each frame explicit.

### Backtracking temporarily borrows mutable state

Backtracking explores a decision tree. Before descending, make a choice; after that entire branch returns, undo it so the next sibling starts from exactly the same state. Stanford's [backtracking lecture](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1242/lectures/11-backtracking1/) uses this choose/explore/unchoose framework. Here the path array is a shared scratchpad, while saved answers are snapshots.

`result.push(path)` stores a reference to that scratchpad. Later pops modify what every saved reference sees. `result.push([...path])` creates a new array containing the chosen values. This is a shallow copy: if the values themselves are mutable objects, those objects remain shared. Our examples use primitive values.

For each pattern, ask five questions: What does the state mean? Which choices are allowed? When is an answer complete? What guarantees progress? What must be restored? Answering them before coding prevents most backtracking bugs.

### Four choice rules, four contracts

**Subsets:** At input position i, exclude or include that element. Completion occurs after all positions are decided. Index always advances, and an included value must be popped after its branch. Distinct input values give unique value subsets. Equal input values at distinct indexes can produce duplicate arrays unless a separate duplicate policy is added.

**Permutations:** At output position depth, choose any unused input index. Completion is path length n. The path and used flags must agree: a flag is true exactly when that position already appears in the path. Restore both after exploring. Distinct values yield n! unique value permutations.

**Combination Sum:** Choose a candidate at or after a start index, allowing the same index again. Choices are nondecreasing, so `[2,3,2]` is represented only as `[2,2,3]`. Positive candidates make the remaining target decrease even when the index stays the same. Sorting allows us to stop when a candidate exceeds the remainder. Zero would remove progress; negative values would invalidate this pruning proof.

**Phone letters:** Each digit supplies a small alphabet. Depth selects the digit, and the path holds one letter for each earlier digit. There is no used flag: choosing a letter for one digit does not consume it for another. This API returns an empty result for an empty digit string, unlike the mathematical one empty subset or one empty permutation.

## JavaScript Implementations

### A recursive sum with visible entry and return

```javascript
function sum(values) {
  function sumFrom(index) {
    console.log('enter', index);
    if (index === values.length) {
      console.log('return', index, 0);
      return 0;
    }
    const answer = values[index] + sumFrom(index + 1);
    console.log('return', index, answer);
    return answer;
  }
  return sumFrom(0);
}
console.log('total', sum([4, 7]));
```
```output
enter 0
enter 1
enter 2
return 2 0
return 1 7
return 0 11
total 11
```

The output shows descent and unwinding separately. Each call returns one value to its caller; `return` does not return from every surrounding call simultaneously. Ignoring demonstration logging, time is Θ(n) and active-frame space is Θ(n). A simple iterative sum would use O(1) working space, so recursion is not automatically the best implementation for a flat array.

### Subsets through exclude/include decisions

```javascript
function subsets(values) {
  const result = [], path = [];
  function visit(index) {
    if (index === values.length) {
      result.push([...path]);
      return;
    }
    visit(index + 1);
    path.push(values[index]);
    visit(index + 1);
    path.pop();
  }
  visit(0);
  return result;
}
const answers = subsets(['A', 'B']);
console.log(JSON.stringify(answers));
console.log(JSON.stringify(subsets([])));
answers[0].push('changed');
console.log(JSON.stringify(answers[1]));
```
```output
[[],["B"],["A"],["A","B"]]
[[]]
["B"]
```

Before each call, path contains exactly the included values among earlier positions. The exclude branch does not change path. The include branch adds one value and restores it afterwards. Mutating one returned array does not change another, which checks that snapshots are independent.

### Permutations using index flags

```javascript
function permutations(values) {
  const result = [], path = [], used = Array(values.length).fill(false);
  function visit() {
    if (path.length === values.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < values.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(values[i]);
      visit();
      path.pop();
      used[i] = false;
    }
  }
  visit();
  return result;
}
console.log(JSON.stringify(permutations([1,2,3])));
console.log(JSON.stringify(permutations([])));
```
```output
[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
[[]]
```

The input is unchanged. Flags represent positions, so duplicated input values would generate repeated value permutations; uniqueness here assumes distinct values. The early return at a complete path prevents a useless candidate scan at leaves.

### Combination sum with reuse and safe pruning

```javascript
function combinationSum(candidates, target) {
  if (!Number.isSafeInteger(target) || target < 0 ||
      candidates.some(x => !Number.isSafeInteger(x) || x <= 0)) {
    throw new RangeError('Use positive integer candidates and a nonnegative target');
  }
  const choices = [...new Set(candidates)].sort((a, b) => a - b);
  const result = [], path = [];
  function visit(start, remaining) {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < choices.length; i++) {
      if (choices[i] > remaining) break;
      path.push(choices[i]);
      visit(i, remaining - choices[i]);
      path.pop();
    }
  }
  visit(0, target);
  return result;
}
console.log(JSON.stringify(combinationSum([2,3,5], 8)));
console.log(JSON.stringify(combinationSum([4,6], 3)));
console.log(JSON.stringify(combinationSum([], 0)));
console.log(JSON.stringify(combinationSum([2,2], 4)));
```
```output
[[2,2,2,2],[2,3,3],[3,5]]
[]
[[]]
[[2,2]]
```

The function normalizes repeated candidates and sorts a new array, preserving the caller's input. Passing i, rather than i+1, permits reuse. Passing start onward prevents reordering duplicates. A zero remainder is handled before searching for another candidate, so the empty combination correctly solves target zero.

### Letters by digit position

```javascript
function phoneLetters(digits) {
  if (digits === '') return [];
  const letters = {
    2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl',
    6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz'
  };
  if (!/^[2-9]+$/.test(digits)) throw new RangeError('Digits must be 2 through 9');
  const result = [], path = [];
  function visit(index) {
    if (index === digits.length) {
      result.push(path.join(''));
      return;
    }
    for (const letter of letters[digits[index]]) {
      path.push(letter);
      visit(index + 1);
      path.pop();
    }
  }
  visit(0);
  return result;
}
console.log(JSON.stringify(phoneLetters('23')));
console.log(phoneLetters('79').length);
console.log(JSON.stringify(phoneLetters('')));
```
```output
["ad","ae","af","bd","be","bf","cd","ce","cf"]
16
[]
```

The join creates each completed output string. It costs proportional to the digit count; do not hide that cost when deriving runtime. Digits 0 and 1 are rejected rather than silently omitted.

## Worked Examples

For subsets `[A,B]`, the first branch excludes A. Excluding B then saves `[]`; including B saves `[B]` and is undone. Returning to the root, include A. Excluding B saves `[A]`; including B saves `[A,B]`. The final two pops restore the shared path to empty. Every binary include/exclude decision sequence identifies one subset, establishing completeness without duplicates for distinct input.

For permutations `[1,2,3]`, choose 1, then 2, then 3 and save. Undo 3 and 2, leaving path `[1]` and only flag 0 true. Now choose 3 then 2 and save `[1,3,2]`. Only after the entire prefix-1 subtree finishes do we remove 1 and explore prefix 2. Undo restores the parent state, not some global blank state.

For combination sum target 8, prefix `[2,2,2]` leaves remainder 2, so another 2 completes `[2,2,2,2]`. Backtracking to `[2]`, choosing 3 leaves 3 and another 3 completes `[2,3,3]`. Starting at 3 can later choose 5, completing `[3,5]`. Starting at 5 cannot choose an earlier 3, which prevents `[5,3]` from duplicating the same combination.

For phone digits `23`, the a-prefix explores d/e/f completely before the b-prefix begins. Three choices at the first position times three at the second means nine results. Digits `79` have four choices each, yielding sixteen.

## Visual Explanations

```text
Subsets [A,B]:
                         [] at index 0
                    / exclude A       \ include A
             [] at index 1             [A] at index 1
              /       \                 /       \
             []       [B]              [A]      [A,B]

One active path is at most n choices long.
The whole call tree contains all branches, not just that path.

Mutable state discipline:
parent path -> PUSH -> child explores -> POP -> same parent path
saved answer = a separate snapshot, not the path object itself
```

For permutations, redraw the branches with 3 choices, then 2, then 1. For phone letters, choices do not shrink because using a letter at one position does not remove it from future alphabets.

## Complexity Analysis

### Output is part of the work

For n distinct subset elements, there are 2^n answers. The binary call tree has Θ(2^n) nodes, but copying arrays is not constant work. Each element belongs to exactly half the subsets, so the total copied element count is n·2^(n−1) for n≥1. Time and stored output are Θ(n·2^n); working path and stack space are O(n). Including the empty-input case uniformly gives Θ((n+1)2^n). Counting subsets alone is a different task and does not require constructing them.

For permutations, there are n! outputs of length n. Copying them costs Θ(n·n!) for n≥1. The implementation also scans n flags at each internal node. The number of internal nodes is `sum(n!/(n-d)!, d=0..n-1)`, which is O(n!), so these scans fit O(n·n!). Output establishes the matching lower bound. Path, used flags, and active frames need O(n) working space; stored output needs Θ(n·n!). Empty input has one empty permutation and constant cost.

For d nonempty phone digits with branching factors b₁…b_d, define P=∏bᵢ. The tree has O(P) nodes because every factor is at least three. Joining P strings of length d gives Θ(dP) time and output storage, and O(d) working space. P is at most 4^d, but using the actual product is more informative.

### Combination sum needs different parameters

Let c be the input candidate count, m the distinct count, T the target, and D=floor(T/minimumCandidate) when m>0. Define V as recursive calls actually visited, A as candidate-loop tests actually performed, S as saved answers, and L as the sum of their lengths. The search costs Θ(V+A+S+L). This is an output-sensitive accounting of actual work, **not** a claim of O(L) alone: many explored branches may produce no answer.

Every call scans at most m candidates, so A≤mV. Depth is at most D, and a loose m-ary-tree upper bound is V≤1+m+…+m^D. For m≥2 this yields O(m^(D+1)+S+L) search time. The nondecreasing-index restriction often makes actual exploration much smaller. With m=1, the search is a chain of at most D+1 calls, so use O(D+1+S+L), not a misleading exponential formula. With m=0, only the root call occurs.

Preprocessing adds expected O(c) Set work and O(m log(m+1)) comparison-sort work under the usual sorting model. Exact JavaScript sort internals are engine-dependent. Working space is O(m+D+1) for candidates, path, and frames, plus any sort workspace; output is O(S+L), including empty answer arrays. A huge D can overflow the call stack even when branching is one. Positive candidates are essential to the depth bound.

## Common Mistakes

- Writing a base case but failing to move toward it.
- Forgetting `return` after saving a complete answer.
- Saving the path reference and later changing every “saved” result.
- Restoring the path but forgetting to clear a used flag.
- Using i+1 when the combination contract permits repeated use.
- Breaking on an oversized candidate before sorting the candidates.
- Calling all recursion O(2^n), or claiming O(n) total space while retaining exponential output.

```javascript-bug
if (index === values.length) {
  result.push(path);
  return;
}
```

This stores aliases. An output-length test alone will not catch it: there can be the right number of arrays, all pointing to the same object.

## Interview and LeetCode Pattern Recognition

“All subsets” suggests binary include/exclude choices; “all orders” suggests unused-item choices. “Reuse candidates” requires a progress measure other than advancing the index. A fixed alphabet per position suggests a product of choices. “Is there any solution?” can short-circuit, while “return every solution” must pay for every returned value.

Before proposing pruning, explain why no completion below that branch can succeed. In combination sum, positive sorted candidates justify the break. With negative candidates, an overshoot might later be repaired, so the same pruning would be unsound. Recognizing that a familiar optimization has lost its preconditions is an interview skill.

## Practice Exercises

### Conceptual Questions

1. Compare two calls on n/2 with two calls on n−1. What extra information do you need to analyze time?
2. Why do subsets and permutations return `[[]]` on empty input while this phone-letter API returns `[]`?

### Code Tracing

3. Draw the full subset tree for `[X,Y]`, then trace only the prefix-2 subtree of permutations `[1,2,3]`.
4. Trace combination sum for `[2,5]`, target 7. Mark pruned branches and the saved answer.

### Debugging Exercises

5. Repair the aliased-result fragment and design a test that catches aliasing rather than just counting outputs.
6. A permutation solver never clears `used[i]`. Explain why later branches disappear. A combination solver uses i+1: what problem does it solve instead?

### Implementation Exercises

7. Write a function returning all length-k combinations of distinct input values without reuse. Add safe pruning when too few elements remain. Define k=0 and k>n.
8. Rebuild phone letters and reject unmapped digits. Explain the result count for `279` without generating it.

### LeetCode and HackerRank Practice

9. **[Subsets](https://leetcode.com/problems/subsets/)** — Platform: LeetCode. Official difficulty: Medium. Concepts: decision trees, include/exclude, output snapshots. Why: it exposes the difference between O(n) recursion depth and exponential stored output. This official page was verified; no HackerRank exercise was consulted. Extend practice with the syllabus topics Permutations, Combination Sum, and Letter Combinations of a Phone Number after reproducing the local examples.

## Hints and Worked Solutions

1. You need nonrecursive work and whether subproblems overlap. Two half-size calls with Θ(n) local work give Θ(n log n) time and O(log n) frame depth, excluding any local allocations. Two size-(n−1) calls with constant work give Θ(2^n) time and O(n) depth.
2. There is one way to choose nothing and one way to order nothing. The phone API deliberately treats no requested digits as no requested combinations. Base cases follow contracts, not a universal rule about empty arrays.
3. Subset order is `[],[Y],[X],[X,Y]`. The prefix-2 permutation subtree emits `[2,1,3]` then `[2,3,1]`. Flags for 1 and 3 must be reset before leaving that subtree.
4. The path `[2,2,2]` leaves 1 and fails. Restoring to `[2]` permits 5, which completes `[2,5]`. A branch starting with 5 cannot go backward to 2, preventing a duplicate ordering.
5. Save `[...path]`. Mutate one returned answer and verify the others do not change; also check distinct array identities.
6. A true flag left behind means that position appears used in unrelated siblings. Passing i+1 in combination sum forbids reusing the same candidate position, solving a different selection contract.
7. Hint: compare remaining positions with missing slots before branching. Here is a complete solution.

```javascript
function chooseK(values, k) {
  if (!Number.isInteger(k) || k < 0) throw new RangeError('k must be nonnegative');
  const result = [], path = [];
  function visit(start) {
    if (path.length === k) { result.push([...path]); return; }
    const missing = k - path.length;
    if (values.length - start < missing) return;
    for (let i = start; i <= values.length - missing; i++) {
      path.push(values[i]);
      visit(i + 1);
      path.pop();
    }
  }
  visit(0);
  return result;
}
console.log(JSON.stringify(chooseK(['A','B','C'], 2)));
console.log(JSON.stringify(chooseK(['A'], 0)));
console.log(JSON.stringify(chooseK(['A'], 2)));
```
```output
[["A","B"],["A","C"],["B","C"]]
[[]]
[]
```

For 1≤k≤n, there are C(n,k) outputs of length k. Every explored prefix can complete and has at most k ancestors, so time is O(k·C(n,k)), matching the copying lower bound; working space is O(k). Output costs Θ(k·C(n,k)). Handle k=0 and k>n as constant-size cases rather than substituting zero into that formula.
8. Digit 2 has three choices; 7 and 9 each have four. There are 3·4·4=48 strings, each of length three.
9. The subset implementation is a worked solution. To test completeness on small distinct inputs, check 2^n results, unique normalized subsets, and membership drawn only from input values.

## Sources and Further Reading

Consulted on 2026-11-07. The implementations, traces, and output-cost derivations are original and aligned with the repository syllabus.

- [MDN: Functions, recursion discussion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) — read the recursive-call and function-stack discussion.
- [Stanford CS106B: Recursive Backtracking and Enumeration](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1242/lectures/11-backtracking1/) — consulted the choose/explore/unchoose framework and subset-enumeration discussion.
- [LeetCode: Subsets](https://leetcode.com/problems/subsets/) — read the official unique-input and unique-output contract. No editorial was consulted.

## Weekly Summary

Recursion delegates a smaller problem and resumes when it returns. Backtracking restores state so sibling branches remain independent. Pruning requires a proof, and enumeration requires paying for output construction as well as search. These ideas transfer directly to the recursive structure of [Week 9's binary trees](week-09.md).

## Weekly Progress Checklist

### Theory

- [ ] State a base case, contract, and decreasing measure for each pattern. <!-- checkpoint:w8-recursive-contracts -->
- [ ] Derive subset and permutation bounds including output copies. <!-- checkpoint:w8-output-sensitive-analysis -->

### JavaScript

- [ ] Implement choose/explore/undo with independent saved arrays. <!-- checkpoint:w8-snapshot-and-undo -->
- [ ] Implement positive-candidate pruning and explain its assumptions. <!-- checkpoint:w8-safe-pruning -->

### Practice

- [ ] Trace both descent and return in a complete small search tree. <!-- checkpoint:w8-call-tree-trace -->
- [ ] Solve Subsets and implement fixed-size combinations. <!-- checkpoint:w8-enumeration-practice -->

### Reflection

- [ ] Explain why stack depth and total runtime are different quantities. <!-- checkpoint:w8-depth-reflection -->
- [ ] Record an aliasing bug and a test that detects shared results. <!-- checkpoint:w8-aliasing-reflection -->
