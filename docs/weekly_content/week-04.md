# Week 4 - Sliding Window
<!-- lesson-id:w4-section-chapter-introduction -->

Sliding windows become much easier when you imagine a frame moving across a stream of data. At every step, one value enters the frame and another may leave. We will use that picture to avoid recomputing the same totals and frequencies, then make the boundary rules precise enough for an interview explanation.

This week, we will work with ranges of consecutive input positions, called contiguous ranges. Instead of recomputing everything when a range moves, we will update the information that changed. That is the sliding-window idea. We will use fixed and changing widths to calculate sums, find substrings without repeats, limit distinct characters, and locate the smallest range supplying required characters.

We will start with fixed-width sums because adjacent ranges visibly share most of their entries. Then we will let width vary and define what makes each range valid. Some tasks require us to shrink an invalid range until it becomes valid. Others require us to shrink a valid range while it still covers everything needed. We will derive those different decisions rather than memorize a single loop template.

By the end, you should be able to say what a window's stored state means and preserve that invariant as either boundary moves. You will explain why a loop that shrinks inside another loop can still do linear total work. Just as importantly, you will check whether validity changes predictably in one direction—a property called monotonicity—and reject a proposed window argument when that assumption fails.

After tracing the examples and attempting the exercises, update your progress logs with the final checklist. Use Theory, JavaScript, Practice, and Reflection to record both implementations and explanations. In particular, practice saying when a longest-valid range may be measured and when a shortest-covering range may be measured. That decision is where many superficially similar window routines diverge.

## Learning Objectives
<!-- lesson-id:w4-section-learning-objectives -->

- Explain why a subarray or substring uses consecutive original positions, while a subsequence may skip positions.
- Derive a fixed-width update by subtracting the outgoing entry and adding the incoming one.
- Start the best answer from an actual legal candidate and specify what invalid widths return.
- Use Set membership for unique-character windows and Map counts for windows allowing at most k distinct characters.
- Track every required occurrence in Minimum Window Substring, including several copies of the same target character.
- Add up total boundary advances to prove linear work, rather than automatically multiplying nested-loop bounds.
- Show exactly why negative values can break a variable-width sum argument while leaving fixed-width updates valid.
- Include converted character arrays, count state, and construction of the final returned string when accounting for costs.

## Prerequisite Knowledge
<!-- lesson-id:w4-section-prerequisite-knowledge -->

Review frequency Maps in [Week 2](week-02.md) and pointers that keep moving in one direction in [Week 3](week-03.md). A window also uses boundaries, but its range consists of consecutive positions in the **original** input. Compaction may pack separated survivors together; a substring cannot do that. If we skip original positions between selected characters, we have changed the kind of answer we are describing.

Our boundaries are inclusive: `[left, right]` includes both named positions. A nonempty window therefore has length `right − left + 1`; for example, positions 2 through 4 contain three entries. We can represent an empty range by `left = right + 1`. Other conventions are possible, but choose one for the entire implementation. Mixing inclusive and exclusive ends is a common source of answers that are off by one.

Our string routines call `Array.from` to build arrays of Unicode code points, the numbered units representing text. Their indexes and lengths refer to those arrays. Conversion allocates storage, and it does not merge code points into grapheme clusters, the groups people perceive as whole visible characters. Assume finite numeric inputs and sufficiently precise arithmetic in number examples. We will explicitly define local behavior for empty strings, impossible answers, and invalid widths so boundary behavior is part of the contract.

## Core Theory
<!-- lesson-id:w4-section-core-theory -->

### Reuse the overlap

Suppose we want the largest total across three consecutive daily measurements. The ranges beginning at positions zero and one share two measurements. Adding all three again wastes that overlap. Keep the old sum, subtract the measurement that left, and add the one that arrived. Only two contributions changed, so updating the summary takes constant work even though the range still contains three entries. The same saving matters more as the width grows.

Think of a window as both a contiguous range and state describing that exact range. A sum needs one number. Uniqueness can use a Set. Multiplicity, meaning how many times each character occurs, needs frequency counts in a Map. Changing a boundary and updating its contribution belong to one logical operation. If left advances but its old character remains counted, your indexes and stored summary describe different ranges, so later validity tests cannot be trusted.

### Fixed width determines every movement

For width k, the first legal start is zero and the last is `n−k`, giving `n−k+1` candidate windows. A simple baseline adds k entries at each start, so valid k gives Θ((n−k+1)k) time. O(nk) is a valid upper bound, but keeping the more precise expression explains different widths. With k near n/2, both factors grow with n and the work is quadratic. With k=n, there is one window and only one linear scan.

To reuse work, sum the first k entries once. Each new right endpoint introduces one value and removes the entry at `right−k`. After that update, our invariant is that sum equals exactly the entries from `right−k+1` through right. We can then compare it with the best sum. Negative entries do not interfere: width tells us which entry leaves, regardless of whether the current sum rises or falls.

Initialize best with the first legal window's sum rather than a convenient zero. On `[-8,-3,-5]` with k=2, the only sums are −11 and −8. A result of zero would invent an empty answer even though the task requires two entries. Our local interface returns null for widths that are zero, negative, noninteger, or greater than n. An external task may rule those inputs out, so preserve its contract when adapting the function.

### Longest valid windows: expand, repair, record

For the longest substring without repetition, we do not know the correct width beforehand. Extend right one character at a time. If that character already belongs to the current unique range, remove entries from the left until its old occurrence is gone. Only then insert the new character and measure the range. We are looking for a longest valid window, so measuring before validity is restored would count a candidate that does not satisfy the question.

Trace the second b in `abba`. The existing window is `ab`. Removing a moves left, but the old b remains; we must remove that too before adding the arriving b. Shrinking, also called contraction, therefore needs a while loop rather than one conditional removal. Before adding the candidate, the Set represents a unique range. After repair and insertion, it again represents a unique range. We update best only in that restored state.

We also need to justify forgetting old starts. If a start already includes a duplicate at the current right endpoint, extending farther right will not remove either occurrence. Any future valid window must start later. Advancing left therefore cannot lose a future valid answer beginning at a discarded start. This is the proof behind contraction. Without it, “move left until it works” would be only a recipe, not an explanation of correctness.

### Distinctness requires multiplicity-aware removal

“At most k distinct characters” allows repeated copies of a character. A Set is insufficient for removal: after taking one a out of `aa`, one a still belongs to the range. Keep counts instead. Increment an incoming character, decrement an outgoing one, and delete its key only when the count reaches zero. Map size then measures the number of different characters actually present, because every stored key has a positive count.

After adding a character, shrink while the Map has more than k keys. Removal cannot increase distinctness, so it can restore validity. Once restored, we have the widest valid range ending at this right endpoint among starts not already safely discarded. With k=0, every arriving character must leave again, yielding length zero. We deliberately return zero for negative or noninteger k too. That fallback is a local contract choice rather than a universal definition for invalid input.

### Shortest coverage: expand until valid, then exploit validity

Minimum Window Substring asks for the shortest consecutive range of the source that contains every target occurrence. For target `AAB`, we need two As and one B, not just the presence of two different letters. Build a `need` Map recording required counts. Let `missing` count how many required occurrences are still unsupplied by the current range. Initially it is the target length, so repeated requirements contribute separately.

When a needed character arrives, inspect its previous count. Reduce missing only if that count was below need: the new occurrence must fill a real shortage. A third A does not help when two are required and two are already present. On removal, increase missing only when the new count drops below need. Characters absent from the target need not occupy the counts Map. Their original positions still belong to the contiguous range, however, and still contribute to its length.

While missing is positive, keep expanding to find coverage. Once missing reaches zero, the range is a valid answer, so record it and try removing its leftmost character. Continue recording every still-covering candidate before the next removal. Stop shrinking when coverage breaks. Compare this with longest uniqueness: there we repair invalidity before measuring; here validity is our opportunity to measure and seek something shorter. The time to record follows the goal of the task.

For one fixed right endpoint, removing leftmost entries shortens candidates until coverage fails. Why can we forget a start after removing it? It already produced a covering candidate, and a later right endpoint would only make that same start's range longer. It cannot improve the shortest answer we considered. This justifies never moving left backward. Remember only the best start and length while scanning; build the actual substring once after the search to avoid repeated copying.

### Permutation in String combines fixed width with frequencies

A permutation rearranges a collection while preserving how many copies of each value it contains. That count-aware collection is a multiset. For a pattern of length m, inspect only source windows of exactly m characters. If one supplies every required occurrence, its counts must match exactly: all m positions are needed, leaving no room for irrelevant or surplus characters. We can therefore reuse a missing-occurrence counter, but control the width rather than shrinking whenever coverage holds.

On arrival, decrease missing only when a needed character fills a shortage. If width exceeds m, remove the oldest character and increase missing only if that removal creates a shortage. After restoring the fixed width, test missing. Do not keep shrinking a valid candidate as in minimum coverage; a permutation's width is already determined. As a baseline, sort every m-character window and compare it with the sorted pattern. That is straightforward to verify, but repeatedly rebuilds overlapping character collections.

### Applicability requires a monotone relationship

Seeing “contiguous” suggests investigating a window, but we still need a safe movement argument. Consider finding a shortest subarray whose sum reaches a threshold. A simple shrink-while-sufficient method usually assumes nonnegative values. Adding one cannot reduce the sum, and removing one cannot increase it. These predictable directions justify its decisions. If negative values are allowed, both claims can fail, so the same loop is no longer justified.

On `[1,-1,5]` with threshold 5, the full range sums to 5. Removing 1 leaves 4, so the naive method stops shrinking. But removing the next value, −1, would raise the sum to 5 and expose `[5]`, the shortest answer. A temporarily insufficient intermediate range hid the optimum. This breaks that variable-width sum proof, while fixed-width sums still work with negatives. Broader signed-input tasks require other reasoning, such as more advanced methods using sums accumulated from the beginning; we do not develop those methods here.

## JavaScript Implementations
<!-- lesson-id:w4-section-javascript-implementations -->

### Fixed-width sum and maximum average

Let's compare recomputing every legal sum with updating one running sum. Both versions return null for an invalid width, so differences in behavior cannot be blamed on different contracts. We can also find the maximum average through the maximum sum: dividing every candidate by the same positive k preserves their order.

### Demonstration 1 — Reuse fixed-width sums and derive maximum average

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

In **Demonstration 1**, `[2, 1, 5, 1, 3, 2]` with width three starts at sum 8. At `right = 3`, `values[right - k]` is the outgoing 2 and the incoming value is 1, giving 7. The next update yields 9, which becomes best. Initializing best from the first legal sum lets `[-8, -3, -5]` correctly return −8 rather than an invented zero. For the average example, the maximum width-four sum is 51, giving 12.75 after division by four.

### Longest unique substring

The baseline will create a new Set for each possible start. The optimized version will keep one Set and move its existing left boundary forward. Both convert text to code points, so they answer the same length question even for symbols such as the emoji used here, which occupy more than one JavaScript string code unit.

### Demonstration 2 — Repair repeated characters before measuring a unique range

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

In **Demonstration 2**, reading the second b in `'abba'` enters the while loop with Set a,b. Deleting a is insufficient, so the loop runs again and deletes the old b. Only then does `seen.add(chars[right])` create the valid one-character window b. The later a gives ba, keeping best at two. For `'🙂a🙂b'`, conversion makes each emoji one indexed element, so the final unique range a,🙂,b has length three.

### Longest substring with at most k distinct characters

Now duplicates are allowed as long as no more than k different characters occur. We need counts because removing one copy may leave another in the range. Decrement the outgoing count and remove its key only at zero. This keeps `counts.size` equal to actual distinctness, the property the contraction condition tests.

### Demonstration 3 — Maintain counts for an at-most-k-distinct window

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

In **Demonstration 3**, `'eceba'` with k=2 reaches ece with counts e:2,c:1 and length three. Adding b creates a third key. Removing the first e leaves e:1, so size is still three; removing c deletes that key and restores validity for eb. Updating best after this repair prevents counting eceb as an allowed range. With k=0, each insertion is removed immediately, leaving an empty range and best zero.

### Minimum Window Substring

Our function returns the shortest covering substring, keeping the earliest candidate when lengths tie. Impossible coverage and an empty target both return an empty string; these are deliberate local extensions of the external contract. The need and counts Maps store only target characters, but left and right still count every source position, including characters irrelevant to coverage.

### Demonstration 4 — Count missing occurrences and shrink a covering window

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

In **Demonstration 4**, target `'AAB'` starts `missing` at three. On source `'AAAB'`, the first two As lower it to one; the third is surplus and leaves it unchanged. B lowers it to zero. Contraction records AAAB, removes one surplus A, then records the shorter AAB. Removing another A breaks coverage. The strict `length < bestLength` test preserves the earliest equal-length answer, which explains `'ab'` for source `'abxxba'`. The final `slice(...).join('')` constructs only the chosen answer.

### Permutation in String: a fixed-width multiset match

We will count code points and define an empty pattern as matching an empty range. A pattern longer than the source cannot fit and returns false. The external task uses nonempty lowercase English strings, so our boundary behavior and character model deliberately extend that contract. As in minimum coverage, the count Map stores only required characters while range boundaries still include every source character.

### Demonstration 5 — Match required counts at exactly the pattern width

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

In **Demonstration 5**, pattern `'aab'` needs a:2,b:1. Source `'caba'` first produces full window cab with one missing a. Adding the last a fills that shortage; removing outgoing c restores width three without changing needed counts. Window aba therefore succeeds. For `'aaxb'` and pattern `'ab'`, both letters exist in the source but never together in a width-two range.

One removal is sufficient here because the previous width was at most m and expansion adds exactly one character. Uniqueness repair can instead require several removals before an old duplicate disappears. Deriving that difference explains why an if is enough in this routine and a while is needed in the unique-range routine; the choice comes from the invariant, not the appearance of the loop.

## Worked Examples
<!-- lesson-id:w4-section-worked-examples -->

### Example 1: fixed windows save overlapping additions

Write the four width-three ranges of `[2,1,5,1,3,2]`. The initial sum is 8. Slide once by subtracting 2 and adding 1 to get 7. Subtract the next outgoing 1 and add 3 to get 9. Finally, subtract 5 and add 2 to get 6. Comparing those legal candidates gives maximum 9 from `[5,1,3]`. At every move, most entries stay in place; we update only the changed contributions.

The baseline performs four separate groups of three additions. Reuse needs three additions to initialize and three updates of constant size. This small input makes the saving modest, but many wide overlapping ranges repeat much more work in the baseline. None of the update reasoning requires a positive sum: we subtract the outgoing contribution because it left, regardless of its sign.

### Example 2: repeated b requires two removals

For `abba`, start empty. Reading a produces window `a` and best 1; reading b produces `ab` and best 2. The next b conflicts with an existing member. Remove a first, but observe that b is still present. Remove the old b as well, then add the arriving b. The repaired range is just `b`. Finally a extends it to `ba`, length two, so best remains 2.

If you measured before repair, `abb` would incorrectly count as a unique range of length three. A single if-removal is also insufficient: the indexed range would still contain two bs even though the Set displays only one b. For this uniqueness invariant, range length and Set size should agree after repair. A mismatch between them is a useful signal that the summary no longer matches the boundaries.

### Example 3: removing one copy need not remove a key

On `eceba` with k=2, the ranges `e`, `ec`, and `ece` are valid, growing best to three. Adding b produces e:2, c:1, b:1, which is invalid because three keys remain. Remove the first e and its count drops to one. There are still three distinct characters, so continue. Removing c reduces its count to zero and deletes its key, leaving valid window `eb`. Removing a copy and removing a distinct character are different events.

When a arrives, distinctness rises to three again. Remove the remaining e to restore two keys, leaving `ba`. The earlier `ece` remains best at length three. If we had deleted e from a Set on its first removal, we would have treated `ceb` as containing only two characters even though three distinct characters remained. Count-aware removal prevents that mismatch between the summary and the actual range.

### Example 4: coverage with surplus occurrences

Target `AAB` requires three occurrences, so missing starts at 3 for source `AAAB`. The first A changes it to 2 and the second to 1. The third A fills no shortage, leaving 1. B finally changes it to zero. Record `AAAB`. Removing its first A still leaves the required two As, so record the shorter `AAB`. Remove another A and only one remains; missing becomes 1, which ends contraction. The point at which removal creates a shortage determines where shrinking stops.

We return `AAB`. A check based only on distinct matched keys would wrongly accept `AB`, losing the second A requirement. Decreasing missing for every surplus A would also make that single number disagree with the real shortage. This scalar—a single numeric state value—is useful only because its exact meaning is preserved on insertion as well as removal. Derive both update conditions from that meaning.

### Example 5: the classic coverage trace

For `ADOBECODEBANC` and target `ABC`, the first C completes `ADOBEC`, length six. Record it, then remove A and lose coverage. Expand until A at index 10 supplies the missing requirement. Shrink past irrelevant D and O, then a surplus B, then E. We reach `CODEBA`, another length-six covering candidate. Removing C next loses coverage, so expansion must resume. Irrelevant positions affect range length even though they never alter target counts.

The last C restores coverage again. Shrinking past O, D, and E exposes `BANC`, length four. Record it before removing B breaks coverage. We keep `BANC` as the answer. The earlier length-six tie did not replace the first candidate because updates require a strictly smaller length. Throughout the trace we remember positions and lengths rather than copying every candidate string, avoiding repeated intermediate allocations.

### Example 6: a valid-looking rule can fail on signed numbers

Try a naive shortest-sum loop on `[1,-1,5]` with target 5. It first reaches the full length-three range with enough sum and records it. After removing 1, the sum becomes 4, so the shrink-while-sufficient rule stops. But the next removal, −1, would increase the sum and reveal the one-entry answer `[5]`. The loop commits to stopping based on an intermediate failure that does not persist under further removal.

The counterexample identifies one broken assumption: signed sums do not change monotonically under contraction. It does not undermine fixed-width sums, whose movement is prescribed by width, or distinctness limits, which cannot worsen when entries are removed. When deciding whether a window works, test the actual property used to justify left's movement. A shared pattern name says nothing by itself about whether that property holds.

### Example 7: equal width turns coverage into exact equality

For pattern `aab`, build need a:2,b:1 and set missing to 3. In source `caba`, c changes no requirement. The first a lowers missing to 2 and b lowers it to 1, so the first full range `cab` fails. The final a lowers missing to zero. We then remove outgoing c to restore width three; no needed count changes. The resulting `aba` has exactly the required counts and is a permutation.

Compare source `cabx`. Adding x and removing c leaves `abx`, still short of one a, so it fails. A Set comparison would lose the two-As requirement. Also try pattern `ab` in `aaxb`: both letters appear somewhere, but no width-two range contains them together. Selecting separated letters would produce a subsequence with a gap, not the required substring. Both the count condition and equal-width condition matter.

## Visual Explanations
<!-- lesson-id:w4-section-visual-explanations -->

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
<!-- lesson-id:w4-section-complexity-analysis -->

The inner contraction loop does not start left over at zero. Right advances through n positions, and left advances at most n times across the entire run. Charge each insertion and removal to the position it handles: a position enters once and leaves at most once. Adding those charges gives O(n) state updates under expected constant-time Map/Set operations. Nested syntax alone does not make the work quadratic. This movement argument describes time, however, and says nothing by itself about constant memory.

For the string tasks, let n be source length in code points, m be target length, and d count distinct tracked characters. Include conversion arrays in memory accounting, not just the Set or Map. The displayed routines allocate those arrays with `Array.from`. An ASCII implementation accessing strings directly can avoid that conversion, but it answers a narrower text contract and has a different storage analysis.

| Algorithm | Time | Additional memory |
| --- | --- | --- |
| Fixed-window baseline | Θ((n−k+1)k) for valid k | O(1) |
| Fixed-window incremental sum | Θ(n) | O(1) |
| Unique-substring baseline | O(n²) worst case, expected table model | O(n) conversion plus Set |
| Unique sliding window | Expected O(n) | O(n) conversion + O(d) Set |
| At most k distinct | Expected O(n) | O(n) conversion + O(min(n,k+1)) Map during expansion |
| Minimum coverage | Expected O(n+m) | O(n+m) conversion + O(d) Maps + output |
| Permutation by fixed frequencies | Expected O(n+m) | O(n+m) code-point arrays + O(d) Maps |

In permutation matching, each source position arrives once and departs at most once. The sorting baseline instead rebuilds and sorts every candidate, costing O((n−m+1)m log(m+1) + m log(m+1)) for valid positive m≤n. The final term includes sorting the pattern. Under a validated fixed lowercase alphabet, direct indexed-string access and two 26-entry arrays can avoid the conversion arrays. That variant can have constant auxiliary state, but it is not the implementation in **Demonstration 5** of **JavaScript Implementations**. Do not transfer its space bound to different code.

The unique-substring baseline needs an alphabet large enough to supply n distinct characters to reach its quadratic worst case. If the alphabet has fixed size σ, each independent expansion soon stops at a repeat, giving the sharper bound O(n min(n,σ+1)). Here σ simply counts available character choices. The optimized version still avoids rebuilding membership for every start and remains linear in input length under the same table-operation model.

Minimum coverage first builds need in O(m), then inserts each source position once and removes it at most once. Constructing the final string costs O(answer length), which is bounded by O(n). If we sliced every candidate during contraction, many overlapping characters could be copied repeatedly, undermining the intended linear processing cost. Recording just the best indexes avoids that repeated work and defers allocation until the answer is known.

## Common Mistakes
<!-- lesson-id:w4-section-common-mistakes -->

Check that length, state, and boundaries agree. An inclusive range needs the extra one; `right−left` loses an entry. Starting a best fixed sum at zero invents a candidate on all-negative input. Moving left without removing its old contribution leaves stale state, while deleting a frequency key on every removal loses remaining copies. Finally, contraction must actually advance left or it may repeat the same failing state forever.

Let's expose the danger of repairing uniqueness only once. This deliberately broken routine reports 3 for `abba`, whose correct answer is 2. Trace the actual indexed range as well as the Set so you can see the duplicate the collection hides.

### Demonstration 1 — Broken uniqueness repair removes only one character

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

In **Demonstration 1**, `'abba'` reaches its second b with a,b already stored. One deletion removes a but leaves the old b in the range. Adding b again does not show that repetition in the Set. The later length update incorrectly prints `3`, even though no unique substring of that length exists.

Repair the cause by contracting repeatedly until the candidate is absent, keeping each deletion paired with a left increment. The Set cannot represent two copies, so you must preserve its unique-range invariant yourself. Changing the best-length formula to hide this output would leave the range and summary inconsistent and would fail on other inputs.

Minimum coverage has another boundary trap: return early for an empty target. Otherwise missing begins at zero and the shrink-while-covered loop has no unmet requirement to stop it. Surplus matches must also leave missing unchanged once a requirement is satisfied. When constructing the answer, use indexes from the same character model as the scan. A code-point array's positions do not necessarily match JavaScript string code-unit positions.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w4-section-interview-and-leetcode-pattern-recognition -->

When you hear contiguous, substring, subarray, fixed width, longest, shortest, at most k, or no repetition, consider a window. Then do the real design work: choose a summary for the range and explain whether adding or removing entries changes validity predictably. Check that the answer truly requires consecutive original positions. A subsequence allows gaps, so the same boundary model may not describe its candidates.

For longest uniqueness and at-most-k distinctness, restore validity before measuring. For minimum coverage, measure while valid and keep shrinking to seek improvement. Say that distinction aloud as part of your solution. Minimum Window Substring is a stretch task because you must coordinate two frequency tables, one exact shortage count, and this reversed recording rule. Understand each piece independently before putting them into one loop.

Begin an interview explanation with a correct baseline and point to the repeated work. Fixed sums repeat additions; independently growing unique substrings rebuilds membership; coverage enumeration rebuilds tables or repeatedly checks all requirements. Then show how an arriving or departing entry changes the previous state. That specific update is the optimization. Merely saying “sliding window is faster” leaves both the saving and the correctness unexplained.

### Make the window a small state machine

A sliding window is not merely two indices moving together. It is a state machine with three questions: what does the current interval contain, when is it valid, and what update repairs or records it? For a fixed-width window, add the entering item and remove the leaving item, so each element participates in constant work. For a longest-valid problem, expand the right edge, repair by advancing the left edge while invalid, then record the valid width. For a shortest-cover problem, expand until valid, record the candidate, and shrink while validity survives. Naming that order prevents accidental measurement of an invalid window.

Trace a repeated character slowly. If a window contains two copies of `b`, removing one `b` decreases its count but does not make `b` absent; delete the key only when its count reaches zero. The same multiplicity rule explains minimum coverage: surplus copies are useful, but they must not be mistaken for required copies. For permutation matching, equal width removes the “surplus” possibility, so matching every required count is enough.

### When the pattern does not apply

The classic expand-and-repair proof relies on monotonicity: enlarging a window should not make a previously valid “at most” condition invalid in an unpredictable way, and shrinking should move toward validity for a coverage condition. Signed-number sums can break that assumption because adding a negative value may improve a sum. In an interview, state the predicate and its monotonic direction before choosing a window; if no such direction exists, consider prefix sums, dynamic programming, or a different baseline.

### Three-line recap

1. Define the window’s invariant and its exact boundary convention.
2. Update state incrementally; never rescan the whole window.
3. Repair before measuring for longest windows, and measure before further shrinking for shortest windows.

### Window representation and JavaScript operations

A window is represented by boundaries, usually inclusive `left` and `right`, plus a summary of the values between them. The summary might be a running sum, a `Map` of frequencies, a `Set` of present values, or a `missing` counter. `right - left + 1` is the inclusive length; writing that formula beside the code prevents the common off-by-one error. `slice(left, right + 1)` creates a copy in O(w) time and space for width w, so use indices while searching and materialise the answer only after choosing the best boundaries. `Set.add`, `Set.delete`, `Map.get`, and `Map.set` are expected O(1), which is what keeps a repaired window linear.

The operation order is part of the proof. On expansion, add the incoming value before testing validity. On contraction, remove the outgoing value, decrement its count, and delete a key only when its count becomes zero. A `while` loop is needed when one expansion can leave several violations; each leftward move permanently removes one position, so all left moves across the scan total at most n. A fixed-width window uses an `if` because expansion creates exactly one extra position and one removal restores the width.

### Complexity and trade-offs in an interview

For an input of n characters, longest-unique and at-most-k-distinct scans take expected O(n) time and O(min(n, alphabet)) auxiliary space. Minimum coverage takes O(n + m) time when m is the pattern length and O(u) space for the required keys. A fixed-width numeric scan is O(n) time and O(1) auxiliary space when it stores only a sum and best value. Returning the actual substring adds O(w) result space; that output space should be reported separately from working memory.

The trade-off is state versus rescanning. Recomputing each window’s counts is easier to write but can cost O(nw); maintaining counts is more delicate but preserves linear time. In interview language: “The invariant says the current boundaries and summary agree. I expand once, repair monotonically, and charge each index at most one right move and one left move.” If the predicate is not monotone, explain why this proof fails and choose another technique instead of forcing a window.

## Practice Exercises
<!-- lesson-id:w4-section-practice-exercises -->

### Conceptual

1. Select `[1,3,5]` from `[1,2,3,4,5]` and identify the gaps in original positions. Explain why this forms a subsequence and cannot be one window.
2. Count legal starts and additions per start for the fixed-window baseline. Use that exact count to explain why k=n gives linear rather than quadratic work.
3. Explain when to record a candidate in longest-valid search and when to record one in shortest-coverage search. Connect each rule to what the task optimizes.
4. Use a signed-number example to explain the failure of simple shortest-sum contraction, then explain why fixed-width sum updates still work.

### Tracing

5. List every width-three range sum in `[2,1,5,1,3,2]` and every width-two sum in `[-8,-3,-5]`. Show the outgoing and incoming contribution for each move.
6. Trace unique-range search on `abca` and `abba`. Record left, right, the Set, and best after repair so each measured length can be checked for validity.
7. Trace `eceba` with k=2. Keep exact frequencies after every removal, including removals that lower a count without deleting its key.
8. Work through source `AAAB` and target `AAB`. Record missing before and after each arrival and contraction, explaining when surplus supply leaves it unchanged.

### Debugging

9. Repair **Demonstration 1** in **Common Mistakes**. Explain why one deletion can leave a repeated character in the indexed range even when the Set cannot display its multiplicity.
10. Suppose a distinct-count routine keeps keys after their counts reach zero. Construct a failing input, then restore the connection between Map size and actual distinctness.
11. A coverage routine decreases missing for every source character belonging to the target, including surplus copies. Trace its failure on source `AA` with target `AB` and repair the shortage condition.

### Implementation

12. Write fixed-window sum and maximum average. Cover k=1, k=n, invalid widths, empty input, and all-negative values, explaining why initialization uses a legal candidate.
13. Derive unique and at-most-k-distinct routines from their state invariants. Include the time and storage needed to convert text into code points.
14. Build minimum coverage and test repeated target occurrences, irrelevant source characters, impossible coverage, an empty target, and equal-length ties.
15. Write an independent coverage baseline that starts fresh at each position. Compare it with the optimized function on small strings using the same text model and tie rule.

### External

The upstream assignment includes Maximum Average Subarray I, Longest Substring Without Repeating Characters, and Permutation in String. Minimum Window Substring remains an additional stretch exercise from the local textbook. Work through fixed-width reuse and longest-valid repair before attempting the combined frequency and coverage reasoning of that stretch task.

16. [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** fixed-width totals, incremental updates, and legal-candidate initialization. **Relevance:** practice reusing overlap before adding the validity decisions needed for variable widths. Explain why maximizing sum also maximizes average here.
17. [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** Set membership, changing widths, and repeated contraction. **Relevance:** explain why a range must be unique before you measure it, and why one removal may not restore that condition.
18. [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) — **Platform:** LeetCode. **Difficulty:** Hard. **Concepts:** required frequencies, missing occurrences, and shortest coverage. **Relevance:** combine the chapter's ideas using the record-while-valid rule. Attempt it as a stretch after the first two tasks. The original verification recorded Hard, correcting the curriculum guide's Medium label; this rewrite does not claim another check.

19. [Permutation in String](https://leetcode.com/problems/permutation-in-string/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** fixed widths, repeated-character counts, and missing occurrences. **Relevance:** combine predictable fixed-width movement with anagram frequency state. Trace `aab` in `caba`, justify why coverage implies equality only at the pattern's width, and compare the result with a baseline that sorts each candidate window.

## Hints and Worked Solutions
<!-- lesson-id:w4-section-hints-and-worked-solutions -->

### Hints

For 1–4, ask what removal of the leftmost entry can change and which directions are guaranteed. For 5–8, move the boundary and update its state as one operation. For 9–11, repeated copies of one character help expose membership logic that has lost counts. For 12–15, make the baseline contract precise before reusing state. For the external tasks, establish fixed-width reasoning first, then add frequency requirements and coverage.

### Solutions 1–8

For questions 1–4, `[1,3,5]` skips original positions containing 2 and 4, so it is not a window. A fixed-width baseline has `n−k+1` starts with k additions each; k=n leaves one candidate and n additions. Longest-valid methods repair before recording, whereas minimum coverage records valid ranges and removes until invalid. With signed numbers, removing a negative can improve the sum after an earlier removal made it insufficient, breaking the simple monotone contraction proof.

For question 5, the sum sequences are 8,7,9,6 and −11,−8. For question 6, `abca` reaches best three; its final a forces removal of the first a, leaving `bca`, also length three. In `abba`, the second b removes a and the old b before insertion; the final range `ba` leaves best two. For question 7, adding b in `eceba` gives e:2,c:1,b:1. Removing e leaves e:1,c:1,b:1; removing c leaves e:1,b:1. Finally adding a and removing e produces b:1,a:1.

For question 8, source `AAAB` and target `AAB` move missing through 3→2→1→1→0. The unchanged step corresponds to a surplus A. Removing the first A leaves enough supply, so missing stays zero and `AAB` is recorded. Removing the next A creates one shortage and stops contraction. Missing therefore counts required occurrences still lacking, rather than distinct letters or every source character that belongs to the target.

### Solutions 9–11: repair state, not symptoms

In the broken uniqueness routine, replace if with while and keep the Set deletion paired with left's increment. For the zero-count-key error, source `ab` with k=1 is enough. After removing a, keeping a:0 leaves two Map keys even though the range contains only b, so contraction continues incorrectly. Delete the exhausted key to restore the size invariant. In both repairs, the goal is an accurate summary of the indexed range.

Source `AA` with target `AB` supplies only one useful A. The second A cannot replace the missing B, so it must not reduce missing. Otherwise the routine falsely reports coverage. On insertion, compare the prior count with need; on removal, compare the new count with need. Reduce missing only when filling a shortage and increase it only when creating one. These conditions follow from the definition, so you can reconstruct them instead of memorizing inequalities.

### Solution 15: an independent baseline for coverage

For an independent coverage check, build a fresh supply table at every start and inspect every requirement as the end grows. Once that start covers the target, extending farther can only lengthen its answer, so stop its inner scan. This baseline repeats work, but its direct requirement checks are easier to inspect independently than the optimized missing-counter updates. That makes it a useful comparison for small inputs.

### Demonstration 1 — Check minimum coverage with independent scans from each start

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

In **Demonstration 1**, source `'AAAB'` with target `'AAB'` first finds AAAB from start zero. Restarting at one finds AAB, which replaces it with a shorter answer. The loop over need checks both required amounts directly. With d distinct target characters, each extension can spend O(d) checking coverage, giving O(n²(d+1)+m) expected time. Source conversion and tables use O(n+d) auxiliary storage, plus output. **Demonstration 4** in **JavaScript Implementations** avoids those repeated checks with exact missing state and one reused range.

### Solutions 12–14 and 16–18: evaluate boundary behavior

Use **Demonstrations 1–4** in **JavaScript Implementations** as the worked solutions under our local contracts. For `[4,-2,7]`, width one gives 7 and width three gives 9. Unique-substring length is zero for empty text and one for repetitions of a single character. At-most-k distinctness returns zero for k=0. Minimum coverage returns an empty string for impossible coverage or an empty target; `abxxba` with target `ab` keeps earliest equal-length answer `ab`. Each boundary case checks a specific part of the contract.

Compare baseline and optimized results only after aligning their character model and tie rule. Random inputs can reveal discrepancies, but focused boundaries explain the cause. Repeated requirements test surplus handling; irrelevant characters test boundary movement without target-count updates; impossible targets test the no-answer path. Passing local comparisons is useful evidence, while these worked solutions make no claim of external judge acceptance.

### Solution 19: match the multiset at exactly the pattern width

The useful hint is that you need not generate permutations. All permutations share the same character counts. **Demonstration 5** in **JavaScript Implementations** records need and missing, handles the arriving character, removes one outgoing character if width exceeds m, and tests coverage only at width m. For `caba`, ranges `cab` and `aba` have missing counts one and zero. For `aaxb`, no width-two range covers `ab`, even though both required letters occur somewhere in the source.

Equal width is essential because a wider covering range may contain unrelated characters and need not be a permutation. Extra supply does not reduce missing, and removing an irrelevant character creates no shortage. Under expected constant-time Map operations, processing costs O(n+m), while the conversion arrays use O(n+m) extra storage. For an independent check, enumerate length-m substrings, sort their code-point arrays, and compare with the sorted pattern. Begin with repeated requirements and gaps; those focused examples explain errors before larger random tests add volume.

## Sources and Further Reading
<!-- lesson-id:w4-section-sources-and-further-reading -->

The [canonical curriculum](../../shared/curriculum.js) and [Weeks 1–4 textbook](../../shared/textbook/weeks01to04.js) establish the scope: fixed widths, uniqueness, distinct counts, minimum coverage, and deciding when windows apply. This chapter develops those topics through proofs, traces, reference baselines, and exercises. The external source notes preserve preparation history; no external page was rechecked as part of this rewrite.

- [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/): original preparation confirmed the fixed-width average contract and Easy difficulty. That fixed width explains why sum and average rank candidates identically.
- [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/): original preparation confirmed consecutive-position uniqueness and Medium difficulty. Keep both parts of that contract when interpreting an answer.
- [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/): the preparation check confirmed occurrence-based coverage and Hard difficulty, correcting the older local guide label.
- [Permutation in String](https://leetcode.com/problems/permutation-in-string/): preparation confirmed the substring-permutation contract, lowercase inputs, and Medium difficulty. Our broader local boundaries are explicit extensions.
- [Upstream Week 4](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/04.md): the preparation record reports a GitHub connector fetch to reconcile the three assignments. The short upstream example was not copied; our permutation derivation and implementation were developed independently.

The original preparation notes report external URL verification on 7 November 2026. That historical verification covered task contracts and difficulty rather than editorial solutions; this rewrite does not claim another check. No external submissions, universal Unicode character semantics, or engine-specific table guarantees are claimed. Use the explicit code-point model and expected table-operation assumptions when adapting an implementation to different requirements.

## Weekly Summary
<!-- lesson-id:w4-section-weekly-summary -->

A sliding window saves repeated work because its summary changes with the range. For fixed width, we know exactly which contribution leaves when another arrives. For variable width, we also need a validity rule and a proof that forgotten starts cannot improve a future answer. Counts preserve repeated occurrences that a Set would lose. Choose the state from the question, then derive every arrival and departure update from its meaning.

Keep the two recording rules separate: restore validity before measuring a longest-valid range, and measure covering ranges while shrinking toward invalidity. Both can do linear total movement because boundaries never retreat. Their memory claims must still include converted character arrays and returned output. Revisit [Week 3](week-03.md) for movement proofs or [Week 2](week-02.md) for count updates if either part remains difficult to explain without the code.

## Weekly Progress Checklist

### Theory

- [ ] I can distinguish consecutive-position windows from subsequences with gaps and calculate inclusive range length. <!-- checkpoint:w4-contiguous-range -->
- [ ] I can derive outgoing/incoming sum updates and count the exact repeated work in the baseline. <!-- checkpoint:w4-fixed-window-proof -->
- [ ] I can explain why longest-valid search records after repair and shortest coverage records during valid contraction. <!-- checkpoint:w4-recording-rules -->
- [ ] I can add up boundary movement to prove linear work and show a signed-sum constraint where simple contraction fails. <!-- checkpoint:w4-movement-and-limits -->

### JavaScript

- [ ] I can implement fixed sums and averages starting from a legal candidate, including all-negative inputs. <!-- checkpoint:w4-fixed-window-code -->
- [ ] I can restore unique membership with as many left removals as the arriving character requires. <!-- checkpoint:w4-unique-window-code -->
- [ ] I can lower outgoing counts and delete a key exactly when its final occurrence leaves. <!-- checkpoint:w4-frequency-maintenance -->
- [ ] I can implement minimum coverage using missing required occurrences rather than just matched letters. <!-- checkpoint:w4-minimum-coverage-code -->
- [ ] I can include converted code-point arrays in space claims and build only the final chosen answer. <!-- checkpoint:w4-string-space-accounting -->

### Practice

- [ ] I traced state and boundaries for fixed sums, unique ranges, distinct-count limits, and minimum coverage. <!-- checkpoint:w4-tracing-practice -->
- [ ] I repaired the supplied bugs and checked empty, invalid, and repeated-character boundary contracts. <!-- checkpoint:w4-debugging-practice -->
- [ ] I attempted both introductory external assignments and the Hard minimum-coverage stretch exercise. <!-- checkpoint:w4-external-practice -->
- [ ] I completed Permutation in String and explained why coverage proves a match only at equal width. <!-- checkpoint:w4-permutation-window -->

### Reflection

- [ ] I recorded an input constraint that breaks an ordinary sliding-window movement proof and explained why. <!-- checkpoint:w4-applicability-reflection -->
- [ ] I can reconstruct a window routine from its range and state invariant instead of copying a template. <!-- checkpoint:w4-independent-explanation -->
