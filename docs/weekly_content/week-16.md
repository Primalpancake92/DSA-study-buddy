# Week 16 - Interview Consolidation

This week, you will be learning how to solve unfamiliar problems by combining the models, invariants, and implementation habits developed across the course. The focus is independent reasoning under time pressure: recognizing a possible pattern, checking its assumptions, and explaining why it works.

We will start with a repeatable interview workflow, then develop complete solutions for frequency matching, a unique substring, and grid components. You will compare a brute-force oracle with an optimized implementation and practice changing the model when a requirement changes.

By the end, you should be able to clarify a contract, derive a baseline, justify an optimization, implement and test it, and communicate time and space costs without relying on a memorized problem title.

There will be a checklist at the end of this lesson covering Theory, JavaScript, Practice, and Reflection. Use it to record evidence in your progress logs.

## Learning Objectives

- Select algorithms from constraints, output requirements, and preserved invariants.
- Build a correct baseline before optimizing repeated work.
- Explain correctness with a loop invariant, induction, or exchange argument.
- Test edge cases and compare independently derived implementations.
- Complete timed mocks and turn failures into specific review actions.

## Prerequisite Knowledge

Review graph modeling in [Week 11](week-11.md), graph assumptions in [Week 12](week-12.md), greedy proofs in [Week 13](week-13.md), DP states in [Week 14](week-14.md), and two-dimensional dependencies and tries in [Week 15](week-15.md). Earlier skills—hashing, two pointers, windows, stacks, binary search, linked lists, recursion, trees, and heaps—remain available. Consolidation means choosing among them, not forcing every problem into the most recent topic.

## Core Theory

### A workflow that produces evidence

Start with the contract. What counts as an element? Are duplicates meaningful? Is mutation allowed? Does “shortest” mean edges, cost, or text length? Must you return a value, indexes, a witness, or all solutions? These are mathematical requirements, not preliminary conversation to rush through.

Next, construct one ordinary example and one awkward boundary case. Describe a direct baseline that is obviously complete, even if slow. Identify exactly which work repeats. An optimization should remove that repeated work while preserving the answer. Name the invariant or state before coding, then describe initialization, preservation, and termination. Finally, test cases designed to attack that argument and count the dominant operations.

A useful twenty-minute rehearsal allocates about three minutes to contract/examples, four to baseline and reasoning, eight to implementation, and five to tests and complexity. This is a practice aid, not a universal interview rule. If stuck, shrink the instance until you can enumerate answers. A correct baseline and a precise bottleneck provide a better recovery point than random edits to an unjustified optimization.

### Select by structure, not keywords

| Evidence in the contract | Candidate idea | Question that can rule it out |
| --- | --- | --- |
| Membership or multiplicity | Set or frequency Map | Does order or identity also matter? |
| Sorted pair search | Opposite pointers | Can sorting destroy required indexes? |
| Contiguous range with repairable constraint | Sliding window | Can moving left restore validity monotonically? |
| Nested structure or nearest unresolved neighbor | Stack | Is FIFO processing actually required? |
| Sorted boundary or monotone feasibility | Binary search | Is the predicate truly monotone? |
| Pointer rewiring | Linked-list references/dummy node | Must original nodes or order be preserved? |
| Hierarchical aggregation | Tree DFS/postorder | Can nodes be shared or cyclic? |
| Repeated minimum/maximum selection | Heap | Is arbitrary membership needed instead? |
| Reachability or components | DFS/BFS | Are edges directed; what is adjacency? |
| Prerequisites or weighted routes | Topological order/Dijkstra | DAG? Nonnegative weights? |
| Local selection after sorting | Greedy | What exchange proves the discard safe? |
| Repeated smaller decisions | DP | Is the state sufficient for every future? |
| Dictionary prefix queries | Trie | Would exact membership alone suffice? |

For example, a sum window on nonnegative numbers can shrink while its sum is too large. Negative values remove that monotonicity: removing a negative number can increase the sum. A problem saying “subarray” is therefore a clue, not permission to paste any window template. Likewise, a binary search on an unsorted array has no elimination proof.

### Costs depend on the whole workload

For one unsorted lookup, a scan is O(n); sorting first costs O(n log n) before binary search can help. For Q queries against unchanged data, sorting plus searches costs O(n log n+Q log n), compared with O(Qn) scans. A hash index can give expected O(n+Q) time with extra memory, but its capabilities differ from sorted range queries. Count preprocessing and describe the expected hash-table assumption.

Output matters too. Returning all matching pairs can require quadratic output even if finding one pair is linear. A tree can have height n despite its name; a head-index queue retains processed references; a DP table with amount A has pseudo-polynomial cost. These are not footnotes: they determine whether the design fits the constraints.

## JavaScript Implementations

### Mock A: frequency matching

Contract: case-sensitive Unicode code points, no normalization, and exactly the same multiset of symbols. A sorting baseline compares sorted symbol sequences. The optimized version counts the first string and consumes those counts with the second. A set would lose multiplicity: `aab` and `abb` have the same distinct symbols but are not anagrams.

```javascript
function isAnagram(first, second) {
  const counts = new Map();
  let remaining = 0;
  for (const symbol of first) {
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    remaining++;
  }
  for (const symbol of second) {
    const available = counts.get(symbol) ?? 0;
    if (available === 0) {
      return false;
    }
    counts.set(symbol, available - 1);
    remaining--;
  }
  return remaining === 0;
}
console.log(isAnagram('listen', 'silent'));
console.log(isAnagram('aab', 'abb'));
console.log(isAnagram('', ''), isAnagram('A', 'a'));
console.log(isAnagram('🙂a', 'a🙂'));
```
```output
true
false
true false
true
```

After consuming a prefix of the second string, counts represent the still-unused occurrences from the first. A missing occurrence makes equality impossible; finishing with zero remaining proves equal multiplicities. This invariant gives both early rejection and final acceptance. Human-perceived graphemes and canonical Unicode normalization would need an explicitly different contract.

### Mock B: baseline, window, and a small exhaustive oracle

For this exercise, strings are ASCII. The baseline tries every start, extending until the first duplicate. Any longer substring from that start still contains the duplicate, so stopping there is safe. The optimized version stores the last seen position of each character and a left boundary. It jumps left past a duplicate only when that increases left.

```javascript
function uniqueBaseline(text) {
  let best = 0;
  for (let start = 0; start < text.length; start++) {
    const seen = new Set();
    for (let end = start; end < text.length; end++) {
      if (seen.has(text[end])) {
        break;
      }
      seen.add(text[end]);
      best = Math.max(best, end - start + 1);
    }
  }
  return best;
}
function uniqueWindow(text) {
  const last = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < text.length; right++) {
    if (last.has(text[right])) {
      left = Math.max(left, last.get(text[right]) + 1);
    }
    last.set(text[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
function compareSmallInputs(maxLength) {
  let checked = 0;
  function visit(text) {
    if (uniqueBaseline(text) !== uniqueWindow(text)) {
      throw new Error('Mismatch: ' + text);
    }
    checked++;
    if (text.length === maxLength) {
      return;
    }
    for (const char of ['a', 'b', 'c']) {
      visit(text + char);
    }
  }
  visit('');
  return checked;
}
console.log(uniqueBaseline('abba'), uniqueWindow('abba'));
console.log(uniqueWindow(''), uniqueWindow('abcabcbb'));
console.log(compareSmallInputs(5));
```
```output
2 2
0 3
364
```

The window invariant is that `[left,right]` has no repeated character after each update, and left never decreases. The old window was valid; only the newly added symbol can introduce a repeat. Moving past its previous occurrence repairs that repeat, while retaining the existing left boundary avoids resurrecting already discarded characters. Every valid substring ending at right starts at or after this boundary, so its longest candidate is exactly the current window. Taking the maximum over all right endpoints proves the result.

The generator checks 1+3+9+27+81+243=364 inputs. Agreement is useful evidence, not proof over every string. Keep oracle work separate from the optimized function's runtime. Both implementations deliberately use the same character model; differential testing cannot resolve inconsistent contracts.

### Mock C: connected regions with an explicit adjacency choice

Contract: rectangular numeric 0/1 grid, four-direction adjacency by default, no mutation. The function returns both component count and largest component size. The optional diagonal rule demonstrates how changing the graph definition changes the answer without changing the traversal invariant.

```javascript
function regions(grid, diagonal = false) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (grid.some(row => row.length !== cols)) {
    throw new Error('Ragged grid');
  }
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  if (diagonal) {
    directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
  }
  const seen = new Set();
  let count = 0;
  let largest = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = r * cols + c;
      if (grid[r][c] !== 1 || seen.has(key)) {
        continue;
      }
      count++;
      let size = 0;
      const stack = [[r, c]];
      seen.add(key);
      while (stack.length) {
        const [x, y] = stack.pop();
        size++;
        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= rows || ny < 0 || ny >= cols) {
            continue;
          }
          const nextKey = nx * cols + ny;
          if (grid[nx][ny] !== 1 || seen.has(nextKey)) {
            continue;
          }
          seen.add(nextKey);
          stack.push([nx, ny]);
        }
      }
      largest = Math.max(largest, size);
    }
  }
  return {
    count,
    largest
  };
}
const grid = [[1, 0], [0, 1]];
console.log(JSON.stringify(regions(grid)));
console.log(JSON.stringify(regions(grid, true)));
console.log(JSON.stringify(regions([])));
```
```output
{"count":2,"largest":1}
{"count":1,"largest":2}
{"count":0,"largest":0}
```

A traversal cannot escape its component because every step follows a legal land edge. It cannot miss reachable land because every discovered cell scans all its legal neighbors. The outer scan starts exactly once per component. This is a complete correctness argument, not merely “DFS visits things.”

## Worked Examples

For `aab` versus `abb`, initial counts are a=2,b=1. Consuming a leaves a=1,b=1; consuming b leaves a=1,b=0; the final b requests an unavailable occurrence and fails. The result depends on counts, not on total length alone.

Trace the window on `abba`:

| right | character | previous occurrence | left after update | valid window | best |
| --- | --- | --- | --- | --- | --- |
| 0 | a | none | 0 | a | 1 |
| 1 | b | none | 0 | ab | 2 |
| 2 | b | 1 | 2 | b | 2 |
| 3 | a | 0 | 2 | ba | 2 |

At the last row, moving left to one would admit `bba`, which is invalid. The previous a lies outside the active window and should not move the boundary backward. This tiny trace explains the purpose of `Math.max` better than memorizing it.

For the opposite-corner grid, four-direction neighbors never reach the other land cell, so two outer starts occur. With diagonals, the first traversal discovers both cells and the second scan position is already seen. The changed answer is required by the changed contract, not a regression.

## Visual Explanations

```text
Problem-solving flow:
contract -> examples -> complete baseline -> repeated work
         -> state/invariant -> implementation -> adversarial tests -> costs
                      ^                              |
                      +------ counterexample --------+

Window on abba after reading the last a:
index:  0 1 | 2 3
text:   a b | b a
discarded   | active unique window
left stays 2; the earlier a cannot reopen the discarded prefix.
```

## Complexity Analysis

Anagram checking takes expected O(n+m) time and O(k) auxiliary space for k distinct symbols in the first string. The baseline substring enumeration is O(n²) worst-case time and O(min(n,alphabet size)) set space. For a fixed tiny alphabet, it may terminate each start early; the general quadratic bound allows a growing alphabet or all-distinct input. The window does O(n) map operations and uses O(k) map storage, under expected constant-time map access. Its map retains last occurrences outside the active window, so count all distinct symbols encountered.

The region solver uses O(RC+R) time including shape validation and O(RC) working memory for nonempty grids. Four versus eight neighbor checks changes a constant, not the order. The test generator is exponential in maximum generated length d, visiting `(3^(d+1)−1)/2` strings; an O(d²·3^d) upper bound includes running the baseline on each. That is testing cost, not the production solver's complexity.

For interview estimates, name the variables and constraints. “Linear” in a graph means V+E, in a grid means RC, and in coin DP may mean the numeric amount rather than its digit count. Explain whether the bound is worst-case, expected, or dependent on a promised balanced structure.

## Common Mistakes

- Choosing a pattern before checking direction, contiguity, reuse, or mutation rules.
- Describing a variable only as “the answer” instead of giving its prefix or state meaning.
- Treating passing small tests as a proof.
- Optimizing a function but omitting preprocessing or output cost from the explanation.
- Reporting a fix as “added Math.max” instead of identifying the violated boundary invariant.
- Testing only examples that already fit the intuition behind the solution.

```javascript-bug
if (last.has(text[right])) left = last.get(text[right]) + 1;
// On abba, the last a moves left backward from 2 to 1.
```

## Interview and LeetCode Pattern Recognition

Use the course as a set of arguments you can transfer. Hashing avoids repeated membership scans. A monotonic pointer movement eliminates candidates once. A stack preserves unresolved order. A heap maintains the next priority. DP merges equivalent future questions. A trie merges shared prefixes. Each technique has a reason it saves work and a condition that keeps the saved work safe.

Practice rejecting plausible alternatives aloud. A unique-substring task needs contiguity, so LCS is the wrong model. A weighted route cannot use ordinary BFS unless all weights are equal. An arbitrary negative-number sum constraint may not support a monotone window. A no-reuse board search cannot cache solely by coordinates. That explanation demonstrates understanding even before code appears.

During a mock, if an optimization fails, preserve the smallest counterexample and return to the last justified invariant. Report a correct baseline if time runs out, along with its bottleneck. Afterward, separate a modeling failure from a coding error or a communication gap; they need different practice.

## Practice Exercises

### Conceptual

1. Compare one unsorted lookup with a million queries on unchanged data. When do sorting, hashing, and scanning each make sense?
2. Explain why a graph with unequal nonnegative weights changes the minimum-route algorithm but not the definition of reachability.

### Tracing

3. Trace `uniqueWindow('tmmzuxt')`, recording left, right, and best. Explain the final t update.
4. Trace numeric-grid regions on `[[1,1,0],[0,1,0],[1,0,1]]` with four directions and then eight.

### Debugging

5. Remove the monotone-left protection and run the small-input oracle. Reduce a failing input by deleting characters while preserving disagreement. Does the first discovered failure have to be the shortest?

### Implementation

6. Extend the window to return starting index and length, choosing the earliest start on ties. State the indexing model.
7. Run a twenty-minute mock on an unseen membership, window, or component problem. Before coding, write a baseline, an invariant, three adversarial cases, and expected costs. Afterward, record one concrete repair action.

### LeetCode + HackerRank

- **[Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/)** — Platform: LeetCode. Difficulty: Medium. Concepts: contiguous windows, last-seen positions, monotone boundaries. Why: tests the ability to replace repeated scans with maintained state and defend the `abba` case.
- **[Hash Tables: Ransom Note](https://www.hackerrank.com/challenges/ctci-ransom-note/problem)** — Platform: HackerRank. Difficulty: Easy. Concepts: frequency maps, multiplicity, case-sensitive word matching. Why: transfers the anagram consumption invariant to whole-word resources with leftover magazine words allowed.

## Hints and Worked Solutions

1. A single scan avoids unnecessary preprocessing. Repeated exact membership queries can amortize a hash index; sorted storage supports ordered queries and binary search. Include O(n) index memory, expected hashing, and O(n log n) sorting. If the data changes frequently, updates also belong in the workload comparison.
2. Reachability asks only whether a legal route exists, so DFS/BFS still works. Minimum cost depends on sums of weights; Dijkstra orders tentative cost rather than edge count. Equal positive weights permit BFS and a final scale factor.
3. Best lengths after each character are 1,2,2,2,3,4,5. Left becomes two at the second m and stays two. At the final t, its old index zero is outside the current window. The longest length is five, for `mzuxt`.
4. Four directions give three components, largest size three. Eight directions connect the lower corner cells through `(1,1)`, giving one component of size five. The neighbor rule is part of the answer specification.
5. The generator uses depth-first order, so its first failure need not be globally shortest. Delete symbols while the discrepancy remains; `abba` is a compact explanatory case. Repair the invariant, retain the case as a regression, and rerun the finite oracle. Passing it establishes agreement on that set only.
6. Track `bestStart` alongside `bestLength`, updating both only when the current length is strictly greater. This preserves the earliest discovered maximum; right endpoints increase, and the boundary never decreases. Returning indexes adds O(1) result storage. Returning a copied substring adds work and output space proportional to its length.
7. Score modeling, implementation, and explanation separately from zero to two: absent/incorrect, partially justified, independently correct. A useful repair action is “trace a duplicate outside the window before coding,” not “practice more.” Repeat the problem later from a blank editor, then vary one constraint and explain whether the algorithm survives.

For Ransom Note, count magazine words, consume note words, and fail on unavailable occurrences. Unlike anagrams, unused magazine words are allowed, so do not require all counts to end at zero. This single contract change is a useful test of whether you understand the invariant rather than copied a final return condition.

## Sources and Further Reading

- Canonical scope consulted: [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js). The timed workflow, examples, oracle, and review rubric here are original instructional synthesis.
- MIT OCW, [BFS lecture notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/1208e162775f6f5cedfbb9f2b694ede0_MIT6_006F11_lec13.pdf): consulted as graph background; it is not a source for the mock timing or review rubric.
- LeetCode, [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/), and HackerRank, [Hash Tables: Ransom Note](https://www.hackerrank.com/challenges/ctci-ransom-note/problem): official statements consulted to verify practice contracts and destinations. No claim of online submission or editorial review is made.

## Weekly Summary

Independent problem-solving means connecting a contract to a model, a model to an invariant, and an invariant to code and tests. A baseline supplies a recovery point and sometimes an oracle; an optimization needs a proof that discarded work cannot change the answer. Keep reviewing with counterexamples, changed constraints, and blank-editor reattempts. Use [Week 11](week-11.md) through [Week 15](week-15.md) as targeted references when your review identifies a specific gap.

## Weekly Progress Checklist

### Theory

- [ ] Choose a pattern from its invariant and reject an unsuitable alternative. <!-- checkpoint:w16-justify-pattern-choice -->
- [ ] Explain preprocessing, output size, and expected versus worst-case costs. <!-- checkpoint:w16-account-full-workload -->

### JavaScript

- [ ] Implement frequency matching, a unique window, and components independently. <!-- checkpoint:w16-implement-core-mocks -->
- [ ] Compare an optimized solution against a small independent oracle. <!-- checkpoint:w16-run-differential-checks -->

### Practice

- [ ] Complete a timed unseen mock with explicit contract and adversarial tests. <!-- checkpoint:w16-complete-timed-mock -->
- [ ] Complete both external exercises and explain their differing final conditions. <!-- checkpoint:w16-transfer-counting-invariant -->

### Reflection

- [ ] Record a minimal counterexample, corrected invariant, and concrete next drill. <!-- checkpoint:w16-write-failure-review -->
- [ ] Reattempt a previous failure from a blank editor and explain one changed constraint. <!-- checkpoint:w16-demonstrate-independent-transfer -->
