# Week 4 - Sliding Window

This week, you will be learning how to maintain information about a contiguous range without recomputing it from scratch. We will study fixed windows, variable windows, and frequency tracking through sums, unique substrings, distinct-character limits, and minimum coverage.

We will start with overlapping fixed-width sums so the saved work is visible. Then we will let the width vary, define what makes a window valid, and decide whether to shrink until validity is restored or shrink while validity remains true.

By the end, you should be able to write a window invariant, update its state as either boundary moves, and explain why nested contraction loops can still take linear total work. You should also be able to reject a sliding-window approach when its monotonicity assumptions do not hold.

There will be a checklist at the end of the module to complete your progress logs. Use the Theory, JavaScript, Practice, and Reflection categories after tracing the examples, completing the exercises, and explaining the differences between longest-valid and shortest-covering windows.

## Learning Objectives

- Distinguish contiguous subarrays and substrings from subsequences with gaps.
- Derive fixed-window updates by removing outgoing and adding incoming contributions.
- Initialize from a legal candidate and define invalid-width behavior.
- Maintain unique-character and at-most-k-distinct windows with Set or Map state.
- Track required occurrences for Minimum Window Substring, including repeated target characters.
- Prove linear aggregate boundary movement instead of multiplying nested loop bounds.
- Explain when negative values invalidate a variable sum-window argument.
- Account for code-point conversion, frequency state, and final output construction.

## Prerequisite Knowledge

Review [Week 2](week-02.md) for frequency Maps and [Week 3](week-03.md) for monotone pointer movement. A window uses boundaries too, but unlike compaction it represents consecutive positions in the **original** input. It cannot combine separated survivors into a new prefix and still claim they form a substring.

We use inclusive boundaries `[left, right]`, so a nonempty window has length `right − left + 1`. An empty window can be represented by `left = right + 1`. Keep one interval convention throughout an implementation; changing between inclusive and exclusive bounds halfway through produces subtle length errors.

String implementations convert with `Array.from`, so their lengths and boundaries count Unicode code points. This allocates storage and does not combine code points into grapheme clusters. Numeric examples assume finite numbers and sufficiently precise arithmetic. Empty strings, impossible answers, and invalid widths have explicit local return contracts.

## Core Theory

### Reuse the overlap

Consider daily measurements and a request for the largest sum of three consecutive days. The windows starting at positions zero and one share two of their three entries. Recomputing both sums ignores that overlap. Instead, subtract the entry that left the range and add the one that entered. The summary changes in constant work even though most of the window remains in place.

A window is a contiguous range plus state that describes it. For sums, state is a number. For uniqueness, state can be a Set. For multiplicities, state needs a frequency Map. A boundary update and its state update form one logical operation: advancing left without removing its old contribution makes the summary describe a different range than the indexes do.

### Fixed width determines every movement

With width k, legal starts are zero through `n−k`, so there are `n−k+1` windows. A baseline sums k entries at every start, taking Θ((n−k+1)k) time for valid k. That is bounded by O(nk), but the exact expression matters: k near n/2 gives quadratic work, while k=n gives only one linear scan.

The optimized method sums the first k entries once. For each new right endpoint, it subtracts the entry at `right−k`, adds the new entry, and records the best sum. The invariant after the update is that sum equals exactly the entries from `right−k+1` through right. Fixed width works with negative numbers because width, not the sign of the sum, controls movement.

Initialize best from the first legal window. Zero is not a legal candidate unless an actual window sums to zero. On `[-8,-3,-5]` with k=2, legal sums are −11 and −8, so returning zero would invent an empty answer. Invalid widths—zero, negative, noninteger, or larger than n—return null in our local API. An external problem may guarantee validity instead.

### Longest valid windows: expand, repair, record

For the longest substring without repeated characters, the width is unknown. Extend the right boundary one character at a time. If the new character already exists in the current unique window, remove characters from the left until the old occurrence is gone. Then insert the new character and record the now-valid length.

A single removal may not be enough. In `abba`, when the second b arrives, the current window is `ab`. Removing a still leaves the old b, so another removal is necessary. That is why contraction is a while loop. Before adding the candidate, the Set represents a unique range; afterward it again represents a unique range, and best is updated only then.

Why can discarded starts be forgotten? Once a start produces a duplicate with the current right endpoint, extending farther right cannot remove that duplicate. Any future valid window must start later. Moving left therefore discards no future answer that could beat the valid candidates being considered. This is the safety argument behind the loop, not merely a coding recipe.

### Distinctness requires multiplicity-aware removal

For “at most k distinct characters,” duplicates are allowed. A Set cannot tell whether removing one a from `aa` eliminates the last a. Maintain counts instead: increment the incoming character, decrement the outgoing one, and delete a key only when its count reaches zero. Then Map size equals the number of distinct characters actually in the window.

After expansion, shrink while size exceeds k. Removing characters cannot increase distinctness, so contraction can restore validity. Once restored, the current range is the widest valid window ending at this right endpoint among starts not already safely discarded. With k=0, each incoming character must be removed and the empty window has length zero. Our implementation also returns zero for negative or noninteger k, a deliberate local fallback contract.

### Shortest coverage: expand until valid, then exploit validity

Minimum Window Substring asks for the shortest contiguous source range containing every required target occurrence. A target `AAB` requires two As and one B. Merely matching two distinct letters is insufficient. Build a `need` Map and let `missing` be the total number of required occurrences not yet supplied by the current window.

On insertion of a needed character, reduce missing only if its previous count was below the required count. An extra third A does not reduce missing when only two As are required. On removal, increase missing only when the new count falls below the requirement. Irrelevant characters need not be stored in the Map, but their positions remain part of the contiguous window and its length.

While missing is positive, expand to seek coverage. When missing reaches zero, record the current window and repeatedly remove from the left, recording each still-covering candidate before the removal that breaks coverage. This is the opposite recording rule from longest uniqueness: there we repair invalidity before recording; here we record while valid and shrink until invalid.

For a fixed right boundary, removing leftmost characters makes candidate windows shorter until coverage breaks. A discarded start that already produced coverage cannot give a shorter answer at a later right boundary, because extending right only lengthens that same start's window. That observation justifies never moving left backward. Store only the best start and length during the scan; construct the substring once at the end.

### Permutation in String combines fixed width with frequencies

A permutation preserves a multiset: order changes but counts do not. To find a permutation of a pattern of length m inside a source, consider only contiguous windows of exactly m characters. If such a window supplies every required occurrence, its counts must match exactly: its total size leaves no room for irrelevant or surplus characters. This lets us reuse a missing-occurrence counter while controlling width rather than shrinking according to coverage.

On arrival, decrement missing only when the incoming needed character fills a shortage. If the range grows past m, remove its oldest character and increase missing only if that removal creates a shortage. After this fixed-width repair, test missing. Unlike Minimum Window Substring, do not keep shrinking a valid candidate; the required width is already known. A sorting baseline sorts every m-character window and compares it with the sorted pattern, repeating work across overlapping ranges.

### Applicability requires a monotone relationship

“Contiguous” is a clue, not a proof that a window works. For a shortest subarray with sum at least a threshold, a simple shrink-while-sufficient strategy usually assumes nonnegative numbers. Removing a nonnegative value cannot increase sum; extending cannot reduce it. Negative values break that relationship.

For `[1,-1,5]` and threshold 5, the full range has sum 5. Removing 1 leaves sum 4, so the naive rule stops shrinking and misses `[5]`, which would be exposed by removing −1. The optimal candidate was hidden behind a temporarily insufficient range. Fixed-width sums remain valid with negatives; this particular variable-width sum proof does not. More advanced prefix-sum methods handle broader signed-input tasks.

## JavaScript Implementations

### Fixed-width sum and maximum average

The baseline is intentionally included as a simple reference. The optimized implementation shares its invalid-width contract. Maximum average follows from maximum sum because every candidate is divided by the same positive k.

```javascript
function maxFixedWindowSumBrute(values, k) {
  if (!Number.isInteger(k) || k <= 0 || k > values.length) return null;
  let best = -Infinity;
  for (let start = 0; start <= values.length - k; start += 1) {
    let sum = 0;
    for (let offset = 0; offset < k; offset += 1) sum += values[start + offset];
    best = Math.max(best, sum);
  }
  return best;
}
function maxFixedWindowSum(values, k) {
  if (!Number.isInteger(k) || k <= 0 || k > values.length) return null;
  let sum = 0;
  for (let i = 0; i < k; i += 1) sum += values[i];
  let best = sum;
  for (let right = k; right < values.length; right += 1) {
    sum += values[right] - values[right - k];
    best = Math.max(best, sum);
  }
  return best;
}
function maximumAverageSubarray(values, k) {
  const sum = maxFixedWindowSum(values, k);
  return sum === null ? null : sum / k;
}
console.log(maxFixedWindowSumBrute([2, 1, 5, 1, 3, 2], 3));
console.log(maxFixedWindowSum([2, 1, 5, 1, 3, 2], 3));
console.log(maxFixedWindowSum([-8, -3, -5], 2));
console.log(maximumAverageSubarray([1, 12, -5, -6, 50, 3], 4));
console.log(maxFixedWindowSum([1, 2], 0));
console.log(maxFixedWindowSum([], 1));
```
```output
9
9
-8
12.75
null
null
```

### Longest unique substring

The baseline starts a new Set for every left endpoint. The optimized version keeps one Set and advances the existing left boundary. Both count code points, making their results directly comparable even when supplementary-plane symbols are present.

```javascript
function longestUniqueBrute(text) {
  const chars = Array.from(text);
  let best = 0;
  for (let start = 0; start < chars.length; start += 1) {
    const seen = new Set();
    for (let end = start; end < chars.length; end += 1) {
      if (seen.has(chars[end])) break;
      seen.add(chars[end]);
      best = Math.max(best, end - start + 1);
    }
  }
  return best;
}
function longestUniqueRun(text) {
  const chars = Array.from(text);
  const seen = new Set();
  let left = 0;
  let best = 0;
  for (let right = 0; right < chars.length; right += 1) {
    while (seen.has(chars[right])) {
      seen.delete(chars[left]);
      left += 1;
    }
    seen.add(chars[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(longestUniqueBrute('abcabcbb'));
console.log(longestUniqueRun('abcabcbb'));
console.log(longestUniqueRun('abba'));
console.log(longestUniqueRun('aaaa'));
console.log(longestUniqueRun(''));
console.log(longestUniqueRun('🙂a🙂b'));
```
```output
3
3
2
1
0
3
```

### Longest substring with at most k distinct characters

Unlike uniqueness, the current valid window may contain many copies of one character. The outgoing count must be decremented, not blindly deleted. Zero-count keys are removed so `counts.size` remains an accurate distinctness measure.

```javascript
function longestAtMostKDistinct(text, k) {
  if (!Number.isInteger(k) || k < 0) return 0;
  const chars = Array.from(text);
  const counts = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < chars.length; right += 1) {
    const incoming = chars[right];
    counts.set(incoming, (counts.get(incoming) ?? 0) + 1);
    while (counts.size > k) {
      const outgoing = chars[left];
      const remaining = counts.get(outgoing) - 1;
      if (remaining === 0) counts.delete(outgoing);
      else counts.set(outgoing, remaining);
      left += 1;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(longestAtMostKDistinct('eceba', 2));
console.log(longestAtMostKDistinct('aaab', 1));
console.log(longestAtMostKDistinct('aa', 0));
console.log(longestAtMostKDistinct('', 2));
console.log(longestAtMostKDistinct('abc', -1));
```
```output
3
3
0
0
0
```

### Minimum Window Substring

The return value is the shortest covering substring, the earliest one on equal-length ties, or an empty string if coverage is impossible or the target is empty. This extends the external task's input contract deliberately. Need and counts store only target characters, while boundary positions still include irrelevant source characters.

```javascript
function minimumWindowSubstring(source, target) {
  const chars = Array.from(source);
  const required = Array.from(target);
  if (required.length === 0) return '';
  const need = new Map();
  for (const char of required) need.set(char, (need.get(char) ?? 0) + 1);
  const counts = new Map();
  let missing = required.length;
  let left = 0;
  let bestStart = 0;
  let bestLength = Infinity;
  for (let right = 0; right < chars.length; right += 1) {
    const incoming = chars[right];
    if (need.has(incoming)) {
      const before = counts.get(incoming) ?? 0;
      if (before < need.get(incoming)) missing -= 1;
      counts.set(incoming, before + 1);
    }
    while (missing === 0) {
      const length = right - left + 1;
      if (length < bestLength) {
        bestStart = left;
        bestLength = length;
      }
      const outgoing = chars[left];
      left += 1;
      if (need.has(outgoing)) {
        const after = counts.get(outgoing) - 1;
        counts.set(outgoing, after);
        if (after < need.get(outgoing)) missing += 1;
      }
    }
  }
  return bestLength === Infinity ? '' :
    chars.slice(bestStart, bestStart + bestLength).join('');
}
console.log(JSON.stringify(minimumWindowSubstring('ADOBECODEBANC', 'ABC')));
console.log(JSON.stringify(minimumWindowSubstring('AAAB', 'AAB')));
console.log(JSON.stringify(minimumWindowSubstring('a', 'aa')));
console.log(JSON.stringify(minimumWindowSubstring('abc', '')));
console.log(JSON.stringify(minimumWindowSubstring('abxxba', 'ab')));
```
```output
"BANC"
"AAB"
""
""
"ab"
```

### Permutation in String: a fixed-width multiset match

This version counts code points, accepts an empty pattern as matching an empty range, and returns false when the pattern is longer than the source. The external task uses nonempty lowercase English strings, so those are deliberate local extensions. Only required characters are stored in the count Map; source positions still include every character.

```javascript
function containsPermutation(pattern, source) {
  const wanted = Array.from(pattern);
  const chars = Array.from(source);
  if (wanted.length === 0) return true;
  if (wanted.length > chars.length) return false;
  const need = new Map();
  for (const char of wanted) need.set(char, (need.get(char) ?? 0) + 1);
  const counts = new Map();
  let missing = wanted.length;
  let left = 0;
  for (let right = 0; right < chars.length; right += 1) {
    const incoming = chars[right];
    if (need.has(incoming)) {
      const before = counts.get(incoming) ?? 0;
      if (before < need.get(incoming)) missing -= 1;
      counts.set(incoming, before + 1);
    }
    if (right - left + 1 > wanted.length) {
      const outgoing = chars[left];
      left += 1;
      if (need.has(outgoing)) {
        const after = counts.get(outgoing) - 1;
        counts.set(outgoing, after);
        if (after < need.get(outgoing)) missing += 1;
      }
    }
    if (right - left + 1 === wanted.length && missing === 0) return true;
  }
  return false;
}
console.log(containsPermutation('aab', 'caba'));
console.log(containsPermutation('aab', 'cabx'));
console.log(containsPermutation('ab', 'aaxb'));
console.log(containsPermutation('abcd', 'abc'));
console.log(containsPermutation('', 'abc'));
```
```output
true
false
false
false
true
```

One removal suffices here because the previous range had width at most m and expansion adds exactly one character. This is a width argument, unlike uniqueness repair where a duplicate may require many removals. Knowing why if is correct in this implementation and while is required in the other prevents memorizing the wrong template.

## Worked Examples

### Example 1: fixed windows save overlapping additions

For `[2,1,5,1,3,2]` and k=3, the first sum is 8. Moving right once removes 2 and adds 1, giving 7. The next move removes 1 and adds 3, giving 9. The final move removes 5 and adds 2, giving 6. The maximum is 9, from `[5,1,3]`.

The baseline makes four groups of three additions, while the optimized version does three initial additions and three constant-size updates. With this tiny input the savings are modest; with many wide overlapping windows, the repeated work becomes dominant. The proof does not depend on sums being positive.

### Example 2: repeated b requires two removals

Trace `abba`. Reading a creates window `a`, best 1. Reading b creates `ab`, best 2. The next b is already present. Remove a and advance left, but b is still present; remove the old b and advance again. Now add the new b, leaving window `b`. The final a creates `ba`, and best remains 2.

Updating best before repairing would count `abb` as if it were unique. Replacing while with if would leave the duplicate inside the actual range, even though a Set cannot display multiplicity. The boundary length and Set size would disagree, a strong debugging signal for this particular uniqueness invariant.

### Example 3: removing one copy need not remove a key

For `eceba` with k=2, windows `e`, `ec`, and `ece` are valid, reaching length 3. Adding b creates counts e:2, c:1, b:1. Remove the first e: e drops to 1, so there are still three distinct keys. Remove c: its count reaches zero and the key disappears. The valid window is now `eb`.

Adding a again creates three keys. Removing the remaining e restores two, leaving `ba`. The best remains `ece`, length 3. A Set-based outgoing deletion would have removed e too early after the first contraction and treated `ceb` as a two-distinct window, which it is not.

### Example 4: coverage with surplus occurrences

For source `AAAB` and target `AAB`, missing starts at 3. The first A lowers it to 2, the second to 1, and the third leaves it at 1 because the A requirement is already satisfied. B lowers it to zero. Record `AAAB`, then remove the first A: two As remain, so coverage is still valid. Record `AAB`, then remove another A: only one remains, so missing becomes 1 and contraction stops.

The answer is `AAB`. Counting only distinct matched keys would have accepted `AB`, incorrectly ignoring the second required A. Decreasing missing for every extra A would also make the scalar drift away from the actual unmet requirement. Its definition must be maintained exactly on both insertion and removal.

### Example 5: the classic coverage trace

In `ADOBECODEBANC` with target `ABC`, the first covering range ends at the first C: `ADOBEC`, length 6. Removing A breaks coverage. Continue expanding until the A at index 10 restores it. Shrink past irrelevant D and O, then surplus B, then E; `CODEBA` is still covering with length 6. Removing C breaks coverage again.

The final C restores coverage. Shrinking past O, D, and E leaves `BANC`, length 4. Removing B then breaks coverage, so retain `BANC`. The earlier length-six tie is not replaced because the code updates only on strict improvement. Keeping indexes rather than slicing each candidate avoids allocating many intermediate strings.

### Example 6: a valid-looking rule can fail on signed numbers

For `[1,-1,5]`, target sum 5, a naive shortest-sum window reaches the full length-three range and records it. Removing 1 reduces the sum to 4, so a shrink-while-sufficient loop stops. Yet removing the following −1 would increase the sum to 5 and reveal a length-one answer. A temporarily invalid intermediate range blocks the greedy movement rule.

This counterexample does not invalidate all windows or all sum problems. It identifies the precise missing assumption: contraction is not monotone for signed sums. A fixed-width sum still works, and distinct-count constraints still improve under removal. Always test the property that justifies moving left rather than generalizing from the pattern's name.

### Example 7: equal width turns coverage into exact equality

For pattern `aab` and source `caba`, need is a:2,b:1 and missing begins at 3. The first c is irrelevant. The next a lowers missing to 2; b lowers it to 1. The first full window `cab` therefore fails. Adding the final a lowers missing to zero, then removing the outgoing c restores width three without changing any count. The range is `aba`, an exact permutation.

For source `cabx`, adding x and removing c leaves `abx` with one missing a, so no match is reported. A Set comparison cannot express the two-As requirement. For pattern `ab` and source `aaxb`, the a and b both occur somewhere, but no length-two window contains both. This distinguishes substring matching from choosing a subsequence across a gap.

## Visual Explanations

| Fixed range | Outgoing | Incoming | Sum |
| --- | --- | --- | --- |
| indexes 0–2 | none | initial 2+1+5 | 8 |
| indexes 1–3 | 2 | 1 | 7 |
| indexes 2–4 | 1 | 3 | 9 |
| indexes 3–5 | 5 | 2 | 6 |

```text
Contiguous window:      [a b c] d e
Next fixed window:      a [b c d] e
Shared contribution:      b c

Subsequence with gaps:  [a] b [c] d [e]
This is not one window in the original sequence.
```

```text
Longest-valid template:
expand right -> while invalid: remove left -> record valid length

Shortest-covering template:
expand right -> while valid: record length, then remove left

Both boundaries move forward. Their recording rules differ.
```

| Source prefix in AAAB | A count | B count | Missing for AAB | Meaning |
| --- | --- | --- | --- | --- |
| empty | 0 | 0 | 3 | Need two As and one B |
| A | 1 | 0 | 2 | Need one A and one B |
| AA | 2 | 0 | 1 | Need B |
| AAA | 3 | 0 | 1 | Surplus A changes no requirement |
| AAAB | 3 | 1 | 0 | Covered; shrink |
| AAB after removal | 2 | 1 | 0 | Still covered; record shorter |
| AB after removal | 1 | 1 | 1 | Coverage broken |

## Complexity Analysis

The crucial distinction from a generic nested-loop bound is that left never resets. Right advances through n positions, and every contraction increases left, which can advance at most n times total. Charge each insertion and removal to its position: each position enters at most once and leaves at most once. That gives O(n) state updates, assuming constant expected Map/Set operations. It does not give constant memory automatically.

Let n be source length in code points, m target length, and d the number of distinct tracked characters. String conversion allocates a code-point array, so the displayed implementations have more memory than only their Set or Map state. An indexed ASCII version can avoid that conversion under a narrower text contract.

| Algorithm | Time | Additional memory |
| --- | --- | --- |
| Fixed-window baseline | Θ((n−k+1)k) for valid k | O(1) |
| Fixed-window incremental sum | Θ(n) | O(1) |
| Unique-substring baseline | O(n²) worst case, expected table model | O(n) conversion plus Set |
| Unique sliding window | Expected O(n) | O(n) conversion + O(d) Set |
| At most k distinct | Expected O(n) | O(n) conversion + O(min(n,k+1)) Map during expansion |
| Minimum coverage | Expected O(n+m) | O(n+m) conversion + O(d) Maps + output |
| Permutation by fixed frequencies | Expected O(n+m) | O(n+m) code-point arrays + O(d) Maps |

For permutation matching, each source character enters and leaves at most once. A sorting baseline can require O((n−m+1)m log(m+1) + m log(m+1)) time for valid positive m≤n, because it rebuilds and sorts each candidate. With a validated fixed lowercase alphabet, two 26-entry arrays and direct indexed-string access can avoid the displayed code-point allocations; do not claim that constant-space variant's bound for the implementation above.

The quadratic unique baseline reaches its worst case when the available alphabet can provide n distinct characters. Under a fixed alphabet of size σ, its work is more specifically O(n min(n,σ+1)); stopping at duplicates limits each growth. The optimized method still avoids repeatedly rebuilding state and is linear in the input length under the same operation model.

For minimum coverage, building need costs O(m). Each source position enters once and is removed at most once. Creating the final substring costs O(answer length), bounded by O(n). Slicing every candidate inside the contraction loop could add repeated copying and undermine the intended linear processing bound. The algorithm therefore records indexes and allocates the answer only once.

## Common Mistakes

Using `right−left` for an inclusive range loses one element. Initializing the best fixed sum to zero fails on all-negative input. Advancing left without deleting its old contribution makes the state stale. Deleting every outgoing character from a frequency Map loses multiplicity. Failing to advance left inside contraction can loop forever.

The following deliberately broken uniqueness routine repairs only once. It reports 3 for `abba` even though the correct answer is 2:

```javascript-bug
function brokenUnique(text) {
  const seen = new Set();
  let left = 0;
  let best = 0;
  for (let right = 0; right < text.length; right += 1) {
    if (seen.has(text[right])) {
      seen.delete(text[left]);
      left += 1;
    }
    seen.add(text[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(brokenUnique('abba'));
```

It incorrectly prints `3`.

At the second b, removing a leaves the old b. The Set collapses equal values, hiding the fact that the indexed range still contains two bs. The repair is repeated contraction until the candidate is absent, not changing the best formula to match the incorrect state.

For minimum coverage, an empty target needs an early return; otherwise missing starts at zero and a shrink-while-covered loop has no meaningful stopping requirement. Surplus occurrences must not reduce missing below its correct value. Finally, do not mix code-unit indexes with code-point arrays when constructing the returned substring.

## Interview and LeetCode Pattern Recognition

Words such as contiguous, substring, subarray, fixed width, longest, shortest, at most k, and no repetition suggest investigating a window. Then ask what state summarizes the range and whether adding or removing elements changes validity in a predictable direction. A subsequence permits gaps and needs a different model.

For longest uniqueness and at-most-k distinctness, invalidity is repaired before recording. For minimum coverage, validity is the opportunity to record and shrink. Stating that difference aloud is more useful than memorizing one universal template. Minimum Window Substring is a stretch task because it combines two frequency tables, a scalar invariant, and the reversed recording rule.

Start an interview answer with a baseline and identify its repeated work. Fixed windows repeat additions; unique-substring enumeration rebuilds membership; coverage enumeration rebuilds or repeatedly checks counts. The optimized version should explain exactly how the old state can be updated, not simply assert that sliding window is faster.

## Practice Exercises

### Conceptual

1. Explain why `[1,3,5]` selected from `[1,2,3,4,5]` is a subsequence but not a window.
2. Derive the exact fixed-window baseline count and explain why k=n is not quadratic.
3. State the different recording rules for longest-valid and shortest-covering windows.
4. Explain why negative values break the simple shortest-sum contraction proof but not fixed-width sums.

### Tracing

5. Trace every width-three sum in `[2,1,5,1,3,2]` and every width-two sum in `[-8,-3,-5]`.
6. Trace `abca` and `abba` for uniqueness, recording left, right, Set, and best after repair.
7. Trace `eceba`, k=2, with exact counts after every removal.
8. Trace source `AAAB`, target `AAB`, with missing before and after each insertion and contraction.

### Debugging

9. Repair brokenUnique and explain why a single deletion can hide multiplicity in a Set.
10. A distinct-count algorithm decrements counts but keeps zero-count keys. Construct a failing case and repair it.
11. A coverage algorithm decreases missing for every matching target character, even surplus copies. Explain its failure on source `AA`, target `AB`.

### Implementation

12. Implement fixed-window sum and maximum average. Test k=1, k=n, invalid widths, empty input, and all-negative values.
13. Implement unique and at-most-k-distinct windows from their invariants. Explain the code-point conversion cost.
14. Implement minimum coverage and test repeated requirements, irrelevant characters, impossible coverage, empty target, and ties.
15. Write a simple coverage baseline that grows each start independently, and compare it against the optimized implementation on small strings.

### External

The upstream assignment is Maximum Average Subarray I, Longest Substring Without Repeating Characters, and Permutation in String. Minimum Window Substring remains an additional stretch exercise from the local textbook.

16. [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** fixed-width sums, incremental updates, initialization. **Relevance:** isolates overlap reuse without variable-window validity decisions.
17. [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** Set membership, variable width, repeated contraction. **Relevance:** requires restoring a valid range before measuring its length.
18. [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) — **Platform:** LeetCode. **Difficulty:** Hard. **Concepts:** frequency requirements, missing occurrences, shortest coverage. **Relevance:** combines this week's ideas and reverses the recording rule; treat it as a stretch exercise after the first two. The verified difficulty corrects the curriculum guide's Medium label.

19. [Permutation in String](https://leetcode.com/problems/permutation-in-string/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** fixed-width windows, character multiplicity, missing occurrences. **Relevance:** combines the sum window's predictable movement with anagram frequency state. Trace `aab` inside `caba`, explain why coverage is sufficient only at equal width, and compare against a sorted-window baseline.

## Hints and Worked Solutions

### Hints

For 1–4, focus on what removing the leftmost element can and cannot change. For 5–8, update the state and boundary together. For 9–11, use two copies of a character to expose incorrect membership logic. For 12–15, get the baseline contract correct first; only reuse state once you can explain its meaning. For external work, solve fixed width before frequency-based coverage.

### Solutions 1–8

A window has no gaps in original positions; `[1,3,5]` skips 2 and 4. There are `n−k+1` starts and k additions per baseline window, so k=n gives n additions. Longest-valid methods repair invalidity then record; minimum coverage records while valid then removes until invalid. Signed sums can improve when a negative element is removed, defeating the simple monotone contraction argument.

The fixed sums are 8,7,9,6 and −11,−8. For `abca`, best grows to 3 and the final a removes the first a, leaving `bca` of length 3. For `abba`, the second b removes a and the old b, leaving one b; final a gives `ba`, best 2. For `eceba`, adding b produces e:2,c:1,b:1; removing e leaves e:1,c:1,b:1; removing c leaves e:1,b:1. Adding a and removing e leaves b:1,a:1.

For `AAAB` and `AAB`, insertion changes missing through 3→2→1→1→0. Removing the first A preserves zero missing, so `AAB` is recorded. Removing the second A creates one missing occurrence and ends contraction. That trace demonstrates why missing counts required occurrences, not distinct letters or all matching source characters.

### Solutions 9–11: repair state, not symptoms

Replace if with while in brokenUnique, retaining the paired Set deletion and left increment. For zero-count keys, source `ab` with k=1 is enough: after removing a, the Map still has two keys if a:0 remains, so contraction continues incorrectly. Delete exhausted keys so size tracks actual distinctness.

For source `AA` and target `AB`, only the first A should reduce missing. If both do, the algorithm falsely reports coverage even though no B exists. Decrease missing on insertion only when the prior count is below need, and increase it on removal only when the new count falls below need. These conditions follow directly from the scalar's definition.

### Solution 15: an independent baseline for coverage

This baseline builds a fresh supply table for each start and checks all requirements as the end grows. Once it covers the target for a given start, further extension cannot improve that start's shortest answer, so it stops. It is intentionally simpler to inspect than the optimized missing-counter updates, at the cost of repeated work.

```javascript
function minimumWindowBrute(source, target) {
  const chars = Array.from(source);
  const need = new Map();
  for (const char of target) need.set(char, (need.get(char) ?? 0) + 1);
  if (need.size === 0) return '';
  let bestStart = 0;
  let bestLength = Infinity;
  for (let start = 0; start < chars.length; start += 1) {
    const counts = new Map();
    for (let end = start; end < chars.length; end += 1) {
      const char = chars[end];
      counts.set(char, (counts.get(char) ?? 0) + 1);
      let covers = true;
      for (const [required, amount] of need) {
        if ((counts.get(required) ?? 0) < amount) { covers = false; break; }
      }
      if (covers) {
        if (end - start + 1 < bestLength) {
          bestStart = start;
          bestLength = end - start + 1;
        }
        break;
      }
    }
  }
  return bestLength === Infinity ? '' :
    chars.slice(bestStart, bestStart + bestLength).join('');
}
console.log(JSON.stringify(minimumWindowBrute('ADOBECODEBANC', 'ABC')));
console.log(JSON.stringify(minimumWindowBrute('AAAB', 'AAB')));
console.log(JSON.stringify(minimumWindowBrute('AA', 'AB')));
console.log(JSON.stringify(minimumWindowBrute('abxxba', 'ab')));
```
```output
"BANC"
"AAB"
""
"ab"
```

With d distinct target characters, checking coverage can take O(d) per extension, giving O(n²(d+1)+m) expected time in this baseline. It uses O(n+d) auxiliary storage for the source conversion and tables, plus output. The optimized routine replaces repeated coverage scans with an exact missing count and reuses one range across starts.

### Solutions 12–14 and 16–18: evaluate boundary behavior

The implementations above are complete worked solutions under the local contracts. For `[4,-2,7]`, k=1 gives 7 and k=3 gives 9. For uniqueness, an empty input gives zero and repeated copies of one character give one. For at-most-k distinctness, k=0 gives zero. For minimum coverage, impossible or empty-target cases give an empty string, and `abxxba` with target `ab` preserves the earliest equal-length answer `ab`.

When comparing baseline and optimized coverage results, use the same character model and tie rule. Random tests can help reveal errors, but boundary examples explain them: repeated requirements exercise surplus handling, irrelevant characters exercise boundary updates without Map changes, and impossible targets exercise the no-answer path. No external judge acceptance is claimed by these local solutions.

### Solution 19: match the multiset at exactly the pattern width

Hint: there is no need to generate permutations. Their common property is the same count for every character. The full `containsPermutation` implementation above records need and missing, updates the arriving character, removes one outgoing character if width exceeds m, and checks coverage only at width m. In `caba`, windows `cab` and `aba` have missing counts one and zero. In `aaxb`, no width-two window covers `ab`, despite both letters appearing in the whole source.

The equal-width condition is essential: a wider covering range may include unrelated characters and is not itself a permutation. Surplus counts do not reduce missing, and removing an irrelevant character does not increase it. With expected constant-time Map operations, processing is O(n+m); the shown conversion arrays use O(n+m) extra storage. A useful independent test enumerates all length-m substrings, sorts their code-point arrays, and compares them with a sorted pattern. Test repeated requirements and gaps before considering larger random inputs.

## Sources and Further Reading

The [canonical curriculum](../../shared/curriculum.js) and [Weeks 1–4 textbook](../../shared/textbook/weeks01to04.js) supply fixed-window, uniqueness, distinct-count, minimum-coverage, and applicability topics. The chapter expands them with original explanations, proofs, traces, baselines, and exercises.

- [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/): opened to verify fixed-width average requirements and Easy difficulty.
- [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/): opened to verify contiguous uniqueness and Medium difficulty.
- [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/): opened to verify occurrence coverage and Hard difficulty, correcting the local guide's outdated label.
- [Permutation in String](https://leetcode.com/problems/permutation-in-string/): opened to verify substring-permutation requirements, lowercase inputs, and Medium difficulty.
- [Upstream Week 4](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/04.md): fetched through the GitHub connector to reconcile the three assigned problems. Its short teaching example was not copied; the permutation derivation and implementation here are original.

All external URLs were verified on 7 November 2026. The pages were used for task contracts and difficulty, not their editorials. No external submissions, universal Unicode text semantics, or engine-specific table guarantees are claimed. The code-point model and expected table-operation assumptions are explicit so learners can adapt them responsibly.

## Weekly Summary

A sliding window saves work by keeping a summary of a contiguous range and updating it when the range changes. Fixed width determines movement directly; variable width requires a validity rule and a proof that discarded starts will never become useful again. Frequency tracking preserves multiplicity that a Set would lose.

The two central recording rules are now distinct: repair before recording a longest valid range, and record while shrinking a covering range. Both can be linear because boundaries never retreat, but their memory includes any converted character arrays and returned output. Revisit [Week 3](week-03.md) if the movement proof remains unclear, or [Week 2](week-02.md) if count updates still need practice.

## Weekly Progress Checklist

### Theory

- [ ] I can distinguish windows from subsequences and state inclusive range length. <!-- checkpoint:w4-contiguous-range -->
- [ ] I can derive fixed-window reuse and its exact baseline cost. <!-- checkpoint:w4-fixed-window-proof -->
- [ ] I can explain longest-valid versus shortest-covering recording rules. <!-- checkpoint:w4-recording-rules -->
- [ ] I can prove linear total movement and identify a nonmonotone sum constraint. <!-- checkpoint:w4-movement-and-limits -->

### JavaScript

- [ ] I can implement fixed sums and averages with correct negative initialization. <!-- checkpoint:w4-fixed-window-code -->
- [ ] I can implement uniqueness with repeated contraction. <!-- checkpoint:w4-unique-window-code -->
- [ ] I can decrement frequencies and delete zero-count keys correctly. <!-- checkpoint:w4-frequency-maintenance -->
- [ ] I can implement occurrence-based minimum coverage. <!-- checkpoint:w4-minimum-coverage-code -->
- [ ] I can account for code-point arrays and construct the answer only once. <!-- checkpoint:w4-string-space-accounting -->

### Practice

- [ ] I completed fixed, unique, distinct-count, and coverage traces. <!-- checkpoint:w4-tracing-practice -->
- [ ] I repaired the provided bugs and tested boundary contracts. <!-- checkpoint:w4-debugging-practice -->
- [ ] I attempted the two introductory external tasks and the Hard coverage stretch task. <!-- checkpoint:w4-external-practice -->
- [ ] I implemented the assigned Permutation in String task and justified equal-width coverage. <!-- checkpoint:w4-permutation-window -->

### Reflection

- [ ] I recorded a constraint for which ordinary sliding window is unsafe. <!-- checkpoint:w4-applicability-reflection -->
- [ ] I can derive a window implementation from its state invariant without a template. <!-- checkpoint:w4-independent-explanation -->
