# Week 16 - Interview Consolidation
<!-- lesson-id:w16-section-chapter-introduction -->

Interview problems rarely announce their pattern. This module is a chance to practice recognizing the shape of an unfamiliar problem, asking clarifying questions, and explaining trade-offs aloud. Treat each exercise like a short teaching session: state the brute force idea, improve it, and defend the final complexity.

This week, we will practice solving unfamiliar problems with the tools you have built across the course. The goal is independent reasoning under time pressure: recognize a possible approach, check what makes it valid, and explain how its state preserves the answer. A familiar problem title is less useful than an argument you can adapt when the requirements change.

We will use a repeatable interview workflow, then develop complete solutions for matching symbol frequencies, finding a unique substring, and measuring grid components. You will compare an optimized solution with a simpler exhaustive checker, often called an oracle: an implementation used to tell us the expected answer on small inputs.

By the end, you should be able to clarify a contract, derive a correct baseline, justify an optimization, implement and test it, and explain its time and space costs. We will also practice identifying which part of a solution must change when the contract changes.

Use the final Theory, JavaScript, Practice, and Reflection checklist to record evidence in your progress logs. Keep traces, counterexamples, and concrete repair actions so that review addresses the actual cause of a failure.

## Learning Objectives
<!-- lesson-id:w16-section-learning-objectives -->

- Select an algorithm from input constraints, required output, and the statements its processing must keep true.
- Build a correct direct baseline and identify the repeated work an optimization removes.
- Explain correctness using an invariant, an induction over smaller cases, or an exchange preserving solution quality.
- Design edge cases that challenge your reasoning and compare independently derived implementations on small inputs.
- Complete timed mock interviews and turn their failures into specific review tasks.

## Prerequisite Knowledge
<!-- lesson-id:w16-section-prerequisite-knowledge -->

Review graph modeling in [Week 11](week-11.md), graph-algorithm assumptions in [Week 12](week-12.md), greedy proofs in [Week 13](week-13.md), DP state design in [Week 14](week-14.md), and two-dimensional dependencies and tries in [Week 15](week-15.md).

Earlier tools remain available too: hashing for indexed lookup, two pointers and windows for controlled scans, stacks, binary search, linked lists, recursion, trees, and heaps. Consolidation means choosing among these tools according to the problem, rather than trying to use whichever topic you studied most recently.

## Core Theory
<!-- lesson-id:w16-section-core-theory -->

### A workflow that produces evidence

Start with the contract, meaning the precise rules an answer must satisfy. What counts as an element: a code unit, a Unicode symbol, or a whole word? Do duplicates represent separate resources? May the function change its input? Does “shortest” mean fewest edges, least cost, or least text length? Must the output be a value, indexes, one supporting solution, or every solution?

These are part of the mathematical problem. For example, returning one matching pair and returning every matching pair can have very different output costs even when they share a search idea.

Next, make one ordinary example and one awkward boundary case. Describe a direct baseline that is clearly complete, even if it is slow. Then point to exactly which work repeats. An optimization should eliminate that repetition while preserving the requested answer, not merely replace the baseline with a more impressive-looking template.

Name your state or invariant before writing the optimized loop. Explain initialization, why one iteration preserves it, and why termination supplies the answer. Then design tests that attack that argument and count the dominant operations, including preprocessing and output.

For a twenty-minute rehearsal, try three minutes for the contract and examples, four for baseline and reasoning, eight for implementation, and five for testing and complexity. These allocations are a practice aid, not a universal interview rule. If you get stuck, shrink the input until you can enumerate answers. A correct baseline and a precise bottleneck provide a useful place to recover; unexplained edits to a broken optimization do not.

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

Treat this table as a set of questions, not an automatic classifier. An invariant is a claim that remains true throughout processing; monotone means changing in only one direction. A technique fits only when the contract supports the claim used to discard candidates.

For example, with nonnegative values, a sum window can shrink while its sum is too large: removing values cannot increase the sum. Negative values break that relationship because removing a negative increases the sum. The word “subarray” suggests contiguity, but does not establish a particular repair rule. Similarly, binary search needs a sorted order or monotone feasibility condition to justify eliminating half the candidates; arbitrary unsorted data provides neither.

### Costs depend on the whole workload

For one lookup in an unsorted array, an O(n) scan may be entirely appropriate. Sorting first costs O(n log n) before a binary search can help. For Q lookups against unchanged data, sorting plus searches costs O(n log n+Q log n), compared with O(Qn) repeated scans. Preprocessing can now be worthwhile because many queries share its cost.

A hash index offers expected O(n+Q) construction-plus-query time with extra storage under the usual expected constant-time hash-operation assumption. It does not automatically provide the ordered range queries a sorted structure supports. Compare capabilities as well as one headline cost.

Also count the answer itself. All matching pairs can occupy quadratic output even if finding one pair is linear. A tree can have height n; its name does not promise balance. A head-index queue retains processed references, and a DP table indexed by amount A is pseudo-polynomial in that numeric value rather than its digit count. These details determine whether the whole design fits the constraints.

## JavaScript Implementations
<!-- lesson-id:w16-section-javascript-implementations -->

### Mock A: frequency matching

We will decide whether two strings contain exactly the same symbols with the same multiplicities. Multiplicity means how many times each symbol occurs. The contract is case-sensitive Unicode code points with no normalization: we do not rewrite visually similar Unicode representations into a common form.

A sorting baseline could compare sorted symbol sequences. Instead, we will count the first string and consume those counts with the second. A set is insufficient: `aab` and `abb` have identical distinct symbols, but different counts.

### Demonstration 1 — Consume symbol occurrences to test anagrams

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

In **Demonstration 1**, `listen` supplies exactly the occurrences needed by `silent`. For `aab` and `abb`, the first a and b can be consumed, but the second b has no remaining occurrence and returns false. Empty strings consume nothing and match; uppercase A differs from lowercase a. Iteration treats the emoji in `🙂a` as one code point, so its position does not affect the result.

After any processed prefix of the second string, the map records unused occurrences from the first. An unavailable occurrence proves failure immediately. If processing finishes, zero `remaining` proves no extra occurrences remain either. This invariant justifies both early rejection and final acceptance. Human-perceived graphemes and canonical Unicode normalization would require a different explicit contract rather than an unannounced change to this one.

### Mock B: baseline, window, and a small exhaustive oracle

For this exercise, strings are ASCII, so indexed positions identify characters consistently. The baseline tries each start and extends until its first duplicate. Every longer substring from that start contains that duplicate too, so stopping that extension is safe.

The optimized version remembers each character's last position and the left boundary of a valid contiguous window. When a duplicate is inside the window, jump left past its previous occurrence. When it is outside, keep the existing boundary. We will also enumerate short strings to compare these independently derived methods.

### Demonstration 2 — Compare a unique-character window with a baseline

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

In **Demonstration 2**, `abba` grows from a to ab, then the second b moves left to index two. The last a previously occurred at zero, outside the active window, so `Math.max` keeps left at two and the valid window becomes ba. Both methods return two. Empty text returns zero; `abcabcbb` has maximum three. The small-input generator reports 364 checked strings.

After each update, `[left,right]` has no repeated character and left never decreases. The old window was valid, so only the newly added symbol can cause a repeat. Moving past its previous in-window occurrence repairs that repeat. Keeping the existing boundary when necessary prevents previously discarded duplicates from returning.

Why does this find the longest answer rather than merely some valid windows? Every valid substring ending at right must start at or after the required boundary. The current window is therefore the longest valid candidate for that endpoint. Taking the maximum over all endpoints covers the global optimum.

The generator checks 1+3+9+27+81+243=364 inputs. Agreement on that set is useful evidence, not a proof for all strings. Both functions intentionally use the same character model; differential testing—comparing implementations on the same input—cannot settle a disagreement about what the contract should mean. Keep generator cost separate from solver cost.

### Mock C: connected regions with an explicit adjacency choice

We will count connected land regions and find the largest one's size. Supply a rectangular numeric 0/1 grid. Four-direction adjacency is the default, and the grid is preserved. The optional diagonal rule changes which cells connect without changing the discovery invariant.

### Demonstration 3 — Count and measure regions under two neighbor rules

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

In **Demonstration 3**, opposite-corner land cells have no four-direction path between them, so the result is two regions of size one. Enabling diagonals lets the first traversal discover both, giving one region of size two. Empty input starts no traversal and returns zeros. Each cell is marked when scheduled, so even converging paths cannot place it on the stack twice.

A traversal cannot leave its component because every step follows a legal land edge. It cannot miss reachable land because each discovered cell checks every legal neighbor. The outer scan starts only at unseen land, so it starts exactly once per component. These claims explain both the count and the size calculation; saying only “DFS visits things” would leave those guarantees unstated.

## Worked Examples
<!-- lesson-id:w16-section-worked-examples -->

Trace frequency consumption from **Demonstration 1** in **JavaScript Implementations**. For `aab` against `abb`, counts start a=2,b=1. Consuming a leaves a=1,b=1. Consuming b leaves a=1,b=0. The final b has no available occurrence and fails. Equal total length alone cannot establish equal multiplicity.

For **Demonstration 2** in **JavaScript Implementations**, follow the window boundaries on `abba`:

| right | character | previous occurrence | left after update | valid window | best |
| --- | --- | --- | --- | --- | --- |
| 0 | a | none | 0 | a | 1 |
| 1 | b | none | 0 | ab | 2 |
| 2 | b | 1 | 2 | b | 2 |
| 3 | a | 0 | 2 | ba | 2 |

At the last row, moving left backward to one would admit `bba`, even though the old a lies outside the active window. Keeping left at two retains ba and preserves uniqueness. This trace explains what `Math.max` protects, rather than treating it as a line to memorize.

In **Demonstration 3** in **JavaScript Implementations**, four-direction exploration cannot reach the other corner, so two outer starts occur. With diagonal adjacency, the first traversal marks both cells, and the later scan skips the second one. The changed answer follows from a changed graph definition; it is not a traversal regression.

## Visual Explanations
<!-- lesson-id:w16-section-visual-explanations -->

The workflow diagram loops back from counterexamples because tests can expose an incorrect model or invariant. In the window sketch, the old a is in the discarded prefix. Its last-seen record remains useful history, but cannot reopen that prefix.

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
<!-- lesson-id:w16-section-complexity-analysis -->

For lengths n,m and k distinct symbols in the first string, anagram checking takes expected O(n+m) time and O(k) auxiliary space. This assumes expected constant-time map operations. Early failure can process less input, but the stated bound covers a full successful comparison.

The baseline substring scan has an O(n²) worst-case upper bound and O(min(n,alphabet size)) set storage. A fixed tiny alphabet can force each extension to stop early; the general quadratic analysis allows a growing alphabet or an all-distinct input. The window performs O(n) map operations and keeps O(k) entries for all distinct symbols encountered. Its map retains occurrences outside the current window, so do not count only the active characters.

The region solver takes O(RC+R) time including row-shape validation and O(RC) working storage for nonempty grids. Four versus eight neighbor checks changes a constant factor, not the growth order.

The generator is exponential in maximum length d and visits `(3^(d+1)−1)/2` strings. An O(d²·3^d) upper bound includes baseline comparisons. This is testing cost, not the optimized window's production runtime.

When giving interview estimates, define your variables. Linear graph work means V+E, grid work means RC, and coin-DP work may depend on the amount's numeric value. State separately whether a bound is worst-case, expected, or relies on a balancing promise. Big O describes an upper growth bound; it is not another name for worst case.

## Common Mistakes
<!-- lesson-id:w16-section-common-mistakes -->

- Check direction, contiguity, reuse, and mutation rules before choosing a pattern. A familiar input shape does not settle the contract.
- Give each variable a prefix or state meaning. Calling everything “the answer” hides which updates are legal.
- Treat passing small tests as evidence, while keeping a correctness argument for general inputs.
- Include preprocessing and output costs when describing an optimized function.
- Explain the invariant repaired by a change. “Keep left from moving backward” conveys more than “add Math.max.”
- Test cases that could invalidate the reasoning, not only cases that reinforce your initial intuition.

The deliberately broken update forgets that left must move only forward. Use an earlier duplicate outside the active window to see the failure.

### Demonstration 1 — Broken window boundary that moves backward

```javascript-bug
if (last.has(text[right])) left = last.get(text[right]) + 1;
// On abba, the last a moves left backward from 2 to 1.
```

In broken **Demonstration 1**, process `abba`. The second b has already moved left to two. The final a then reads its old index zero and resets left to one, reopening the invalid window bba. Compare the proposed boundary with the existing one and keep the larger. The repair preserves a monotone boundary; it does more than adjust this single example.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w16-section-interview-and-leetcode-pattern-recognition -->

Use the course as a collection of arguments you can transfer. Hashing avoids repeated membership scans. A pointer that moves only forward can eliminate candidates once. A stack retains unresolved order, while a heap retrieves the next priority. DP reuses equivalent future questions, and a trie shares prefix paths. For each technique, explain both which work it saves and which condition makes saving it safe.

Practice rejecting plausible alternatives aloud. A unique-substring task requires contiguity, so LCS's gapped subsequences answer a different question. Ordinary BFS minimizes weighted cost only when weights are equal. An arbitrary sum constraint with negative numbers may not support a monotone window. No-reuse board search cannot generally cache solely by coordinates.

If an optimization fails during a mock, retain the smallest counterexample you can explain and return to the last justified invariant. If time expires, communicate a correct baseline and its bottleneck. Afterward, distinguish a modeling failure, implementation mistake, and communication gap. Each suggests a different next drill; repeating the same problem without diagnosing the cause may repeat the same failure.

### Interview structures: choose the index that proves the claim

The mock problems deliberately use different data structures because “optimize it” is not a sufficient design. Frequency matching uses a `Map` from symbol to count. The map is an index: one pass increments counts, a second pass decrements them, and a negative or missing count disproves equality. A unique-character window uses a `Set` or last-seen `Map` plus two numeric boundaries. A component traversal uses a grid and a visited structure, often a boolean matrix or a set of encoded coordinates.

| Structure/pattern | Core operations | Total time | Auxiliary space | Trade-off |
| --- | --- | --- | --- | --- |
| Frequency `Map` | `get`, increment, decrement | O(n + m) expected | O(k) symbols | Extra memory buys direct multiplicity checks |
| Set window | `has`, `add`, `delete` while moving bounds | O(n) | O(k) current symbols | Simple invariant; cannot assume monotonicity for every constraint |
| Last-seen `Map` window | read last index, jump left bound | O(n) expected | O(k) symbols | Fewer left moves; index update must never move backward |
| Grid + visited | inspect neighbors, mark/unmark or mark in place | O(RC) | O(RC) worst case | Explicit state is safer; in-place marking mutates input |
| Exhaustive oracle | enumerate candidates and compare | Often quadratic or worse | Depends on output | Slow but excellent for testing optimized code |

Walk a frequency example such as “aab” versus “aba”: after consuming the first string, counts are `a:2, b:1`; consuming the second returns them to zero. For a window, expand the right boundary, repair duplicates by moving the left boundary until the invariant is restored, and record the best width only after repair. If the left boundary is assigned to an old last-seen index without taking the maximum, it can move backward and include an invalid duplicate. For grid components, choose four-way or eight-way adjacency before counting; changing neighbors changes the problem.

JavaScript method choices carry costs and contracts: `Map.get` is a lookup, `Set.has` tests membership, and `Array.slice` in an oracle creates a copy whose cost must be counted. A baseline can use nested loops and still be the correct first implementation. In an interview, explain which repeated work the index removes, what the invariant says after each iteration, and whether expected hash cost is an assumption. Also count output space: returning every matching range can dominate an otherwise linear scan.

### Turning a mock into reusable interview evidence

After a timed problem, separate three outcomes: the answer, the reasoning, and the communication. A passing test does not prove that the invariant was understood, and a polished explanation does not excuse an unchecked edge case. Keep a short record: contract assumptions, baseline, repeated work, optimized state, one adversarial input, and the measured complexity. This turns a mock from a score into a next practice action.

For frequency matching, first decide whether symbols mean code points and whether case or normalization matters. Then test empty strings, different lengths, repeated symbols, and a visually similar but different symbol. For a sliding window, write the left and right boundaries after every expansion and repair. The key invariant is usually that the current window satisfies a constraint; if removing the left item can make the constraint worse, the proposed repair rule is not justified. For grid components, explicitly state whether diagonal neighbors count before writing the neighbor loop.

Beginners often choose a named pattern from a keyword: “substring means window” or “grid means DP.” Instead, inspect what must remain true and what the output requires. A baseline is valuable because it gives an oracle for small random cases and exposes the exact repetition an optimization removes. In an interview, say what your algorithm would change if the contract changed—for example, returning all matches instead of one, or allowing diagonal adjacency.

The final recap is a decision loop: clarify, model, baseline, invariant, optimize, test, then account for preprocessing and output space. If stuck, reduce the input and enumerate it. That is not retreat; it is a way to recover evidence and make the next claim precise.

## Practice Exercises
<!-- lesson-id:w16-section-practice-exercises -->

### Conceptual

1. Compare one unsorted lookup with a million queries on unchanged data. Explain when scanning, sorting, or hashing is appropriate, including memory and preprocessing.
2. Explain why unequal nonnegative edge weights change the minimum-route algorithm but not what it means for a vertex to be reachable.

### Tracing

3. Trace `uniqueWindow('tmmzuxt')`, recording left, right, and best after each character. Explain why the last t does or does not move left.
4. Trace regions on `[[1,1,0],[0,1,0],[1,0,1]]` using four directions and then eight. Report both count and largest size.

### Debugging

5. Remove the protection against moving left backward in **Demonstration 2** in **JavaScript Implementations** and run its small-input oracle. Delete characters from a failure while preserving disagreement. Must the first failure found be shortest?

### Implementation

6. Return a starting index and length from the window, choosing the earliest start on ties. State your indexing model and distinguish returning indexes from copying text.
7. Run a twenty-minute mock on an unseen membership, window, or component problem. Before coding, write a baseline, invariant, three adversarial cases, and expected costs. Afterward, record one concrete repair action.

### LeetCode + HackerRank

- **[Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/)** — LeetCode, Medium. Practice contiguous windows, last-seen positions, and boundaries that never move backward. Defend the `abba` case while explaining how maintained state replaces repeated scans.
- **[Hash Tables: Ransom Note](https://www.hackerrank.com/challenges/ctci-ransom-note/problem)** — HackerRank, Easy. Transfer frequency consumption to case-sensitive whole-word resources. Multiplicity still matters, but unused magazine words are allowed, changing the final acceptance condition.

## Hints and Worked Solutions
<!-- lesson-id:w16-section-hints-and-worked-solutions -->

1. A single scan avoids preprocessing for one lookup. Repeated exact-membership queries can share a hash index's construction cost; this sharing is what amortizing preprocessing means here. Sorted storage supports ordered queries and binary search. Include O(n) index memory, expected hashing assumptions, and O(n log n) sorting. If data changes frequently, count update work too.
2. Reachability asks only whether a legal route exists, so DFS or BFS can still establish it. Minimum cost depends on sums of edge weights, requiring Dijkstra's tentative-cost order for general nonnegative unequal weights. Equal positive weights allow BFS followed by a scale factor.
3. Best lengths are 1,2,2,2,3,4,5. Left becomes two at the second m and remains two afterward. The final t previously occurred at zero, outside the active window, so it cannot move left backward. The longest window is `mzuxt`, length five.
4. Four directions give three components with largest size three. With diagonals, both lower corner cells connect through `(1,1)`, yielding one component of size five. The movement rule is part of the specification, so both results are correct for their respective contracts.
5. The generator explores depth first, so a first failure need not be globally shortest. Keep deleting symbols while disagreement persists; `abba` is a compact explanatory case. Repair the boundary invariant, retain that case as a regression test, and rerun the finite oracle. Agreement establishes only the checked set.
6. Store `bestStart` with `bestLength` and update both only when the current length is strictly larger. With increasing right endpoints and a left boundary that never decreases, this retains the earliest discovered maximum. For ASCII, character indexes and the implementation's indexed string positions agree. Index output needs O(1) storage; a copied substring adds work and output proportional to its length.
7. Score modeling, implementation, and explanation independently from zero to two: absent/incorrect, partly justified, and independently correct. A repair action such as “trace an old duplicate outside the window before coding” is more useful than “practice more.” Later, solve again from a blank editor, then change one constraint and explain whether your argument survives.

For Ransom Note, count magazine words and consume note words, failing when an occurrence is unavailable. Unlike anagrams, leftover magazine resources are allowed. Do not require all counts to become zero. That single contract change tests whether you understand the consumption invariant instead of copying the final return condition.

## Sources and Further Reading
<!-- lesson-id:w16-section-sources-and-further-reading -->

- The [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js) define scope. The timing workflow, examples, oracle, and review rubric are original instructional synthesis.
- MIT OCW's [BFS lecture notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/1208e162775f6f5cedfbb9f2b694ede0_MIT6_006F11_lec13.pdf) were consulted during earlier preparation as graph background, rather than as a source for mock timing or the review rubric.
- The official [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) and [Hash Tables: Ransom Note](https://www.hackerrank.com/challenges/ctci-ransom-note/problem) statements were previously consulted to check contracts and destinations. This rewrite claims neither renewed external verification nor online submission or editorial review.

## Weekly Summary
<!-- lesson-id:w16-section-weekly-summary -->

Independent problem-solving connects a contract to a model, a model to an invariant, and that invariant to implementation and tests. A baseline gives you a recovery point and can supply an oracle for small inputs. An optimization needs a reason discarded work cannot change the answer.

Review with counterexamples, changed constraints, and later attempts from a blank editor. When you find a specific gap, return to the relevant material from [Week 11](week-11.md) through [Week 15](week-15.md). The purpose is to repair an argument you can reuse, rather than memorize another complete answer.

## Weekly Progress Checklist

### Theory

- [ ] Choose a pattern by its invariant and explain why a plausible alternative fails. <!-- checkpoint:w16-justify-pattern-choice -->
- [ ] Account for preprocessing, output, and the distinction between expected and worst-case costs. <!-- checkpoint:w16-account-full-workload -->

### JavaScript

- [ ] Independently implement frequency matching, a unique-character window, and grid components. <!-- checkpoint:w16-implement-core-mocks -->
- [ ] Compare an optimized solution with an independently derived small-input oracle. <!-- checkpoint:w16-run-differential-checks -->

### Practice

- [ ] Complete a timed unseen mock with an explicit contract and adversarial tests. <!-- checkpoint:w16-complete-timed-mock -->
- [ ] Finish both external exercises and explain their different final acceptance conditions. <!-- checkpoint:w16-transfer-counting-invariant -->

### Reflection

- [ ] Record a minimal counterexample, corrected invariant, and specific next drill. <!-- checkpoint:w16-write-failure-review -->
- [ ] Reattempt a prior failure from a blank editor and explain the effect of one changed constraint. <!-- checkpoint:w16-demonstrate-independent-transfer -->
