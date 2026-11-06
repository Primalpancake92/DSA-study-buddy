# Week 3 - Two Pointers

This week, you will be learning how two positions can organize an efficient search, comparison, or in-place transformation. We will study opposite pointers, reader/writer pointers, and slow/fast pointers, with invariants that explain why each movement is safe.

We will start with sorted pair search and the proof that lets us discard an endpoint. Then we will compare mirrored characters, compact arrays without destroying unread data, follow linked nodes at different speeds, and extend pair search into 3Sum.

By the end, you should be able to choose a pointer relationship, state its preconditions, trace every boundary change, and prove progress toward termination. You should also be able to explain when sorting is an acceptable preprocessing step and when it would violate an index or mutation contract.

There will be a checklist at the end of the module to complete your progress logs. Use the Theory, JavaScript, Practice, and Reflection categories to record both working implementations and explanations you can give without looking at the code.

## Learning Objectives

- Distinguish inward, reader/writer, and slow/fast pointer roles.
- Prove safe endpoint elimination using sorted order.
- Compare mirrored characters under an explicit normalization contract.
- Maintain a stable retained prefix while compacting an array in place.
- Distinguish a logical output length from the physical array length.
- Find a linked chain's middle and detect a cycle using node identity.
- Derive 3Sum from a fixed anchor and sorted pair search, including duplicate suppression.
- Account for preprocessing, traversal, output, and engine-dependent sorting space.

## Prerequisite Knowledge

Review [Week 1](week-01.md) for arrays, references, mutation, and numeric sorting, and [Week 2](week-02.md) for the complement-Map alternative to pair search. You need to understand why copying an array protects its order but still consumes memory.

A pointer in an array example is simply an integer index. In a linked-chain example it is a reference to a node object. There is no manual memory-address arithmetic here. A node has a value and a `next` reference; null means there is no next node. Two nodes can store the same value while remaining distinct objects.

We use finite numeric values whose sums are sufficiently exact for comparisons. The palindrome implementation has an explicit ASCII alphanumeric contract. Defining those boundaries is part of correctness, not an optional note added after coding.

## Core Theory

### Two positions need a relationship

Declaring two index variables does not by itself create a useful technique. The algorithm needs a reason their movement reduces the remaining problem. Inward pointers surround candidates not yet ruled out. Reader/writer pointers divide processed input from meaningful output. Slow/fast pointers compare progress through a structure whose length or cycle shape is not initially known.

For any variant, ask three questions. What does each position mean before an iteration? Why does the update preserve all possible answers or the required output? What quantity changes toward termination? These questions are the basis of an invariant-and-progress proof. An implementation that happens to pass an example can still fail if one of these arguments is missing.

### Opposite pointers use order as evidence

Suppose an array is sorted in nondecreasing numeric order and we need two distinct positions summing to a target. Start with the smallest and largest remaining values. If their sum is too small, pairing the smallest with anything smaller than the current largest cannot improve it enough. Every pair using that left endpoint is impossible, so discard the left endpoint.

If the sum is too large, even the smallest available partner makes the right endpoint too large. Any larger partner is at least as bad, so discard the right endpoint. Notice the asymmetry: a mismatch proves one endpoint unusable, not both. Moving both on every mismatch can skip a valid pair.

The invariant says any pair not already excluded lies between the current boundaries. Initially all positions lie there. A justified endpoint move excludes only impossible pairs, preserving the invariant. If boundaries meet, fewer than two distinct positions remain; no pair is possible. If equality is found, return immediately or follow an explicitly defined enumeration rule.

Sorted order is the evidence behind this proof. On unsorted `[3,2,4]` with target 6, inward search first sees 7 and discards 4, then sees 5 and discards 3, missing 2+4. The code runs; the proof is what failed. If sorting is allowed, a sorted copy may repair the precondition at O(n log n) modeled time and O(n) copy space. If original indexes are required, sort value/index records or use a complement Map instead.

### Mirror comparisons certify the outside

A palindrome has equal characters at corresponding positions from both ends. Compare the two outside characters, reject a mismatch, and move inward after a match. The invariant is that all already-consumed meaningful characters match their mirror partners. An odd-length center needs no partner; an empty meaningful sequence is a palindrome.

Normalization changes what a character means. Our Valid Palindrome routine ignores everything except ASCII letters and digits and compares letters without case. It can skip unwanted code units directly without allocating a cleaned copy. This is not a general multilingual palindrome definition. Unicode normalization, combining marks, and grapheme clusters require a deliberate broader contract.

### Reader and writer protect the unread suffix

For stable filtering, the reader examines each original entry once and the writer identifies the next retained slot. Before reading position r, the prefix before writer contains exactly the retained values from positions before r, in original order. Writer never exceeds reader, so writing at writer cannot destroy a value that has not yet been examined.

Sorted deduplication retains a value when it differs from the last retained value. That works because equal values are adjacent. On unsorted `[1,2,1]`, comparing only with the previous retained entry does not remove the final 1. Move Zeroes uses a different retention rule—nonzero—and does not require sorted input. Both share the same safe compaction structure.

What happens to the suffix depends on the contract. Sorted deduplication commonly returns the number of valid prefix entries and leaves the remaining slots unspecified. Move Zeroes must preserve physical length, so it fills the remaining suffix with zeros after reading finishes. A truncating filter can instead set array length to the retained count. These contracts are not interchangeable.

### Slow and fast measure structural progress

In an acyclic singly linked chain, move slow one link and fast two links per round. When fast reaches the end, slow has advanced approximately half as far. With the loop convention used here, an even-length chain returns the second of its two middle nodes. That is a chosen contract rather than an accidental off-by-one result.

For cycle detection, a visited Set provides a simple baseline: revisiting the same node reference proves a cycle. Slow/fast pointers avoid retaining every node. Once both are in a cycle of length c, fast gains one position relative to slow per round. The relative gap changes modulo c and must become zero within c rounds. Compare after moving, since both pointers start at the head and initial equality proves nothing.

If there is a noncyclic prefix of length p followed by a cycle of length c, slow/fast detection takes O(p+c) steps and O(1) auxiliary space. Equal values do not prove a cycle; equal node identities do. The middle-finding routine assumes an acyclic chain and must not be used blindly on a cycle.

### 3Sum reuses the pair proof

Brute force chooses three distinct positions, requiring Θ(n³) combinations in the worst case. Sorting lets us fix the first value and solve a pair-sum problem in the suffix. For anchor a, the other two values must sum to −a. The inward-pointer proof applies unchanged because that suffix is sorted.

The result consists of unique **value triples**, not every index triple. Skip repeated anchor values because they would repeat the same value search. After recording a matching pair, move both pointers inward and skip repetitions of the just-used values. For a fixed anchor and left value, the required right value is fixed too, so repeating it would only duplicate an already emitted triple.

## JavaScript Implementations

### Sorted pair search and a baseline

Both functions return a boolean and require distinct positions. Only the optimized version requires sorted input. Empty and singleton arrays return false without needing a separate branch.

```javascript
function hasPairBrute(values, target) {
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (values[i] + values[j] === target) return true;
    }
  }
  return false;
}
function hasPairWithSum(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    const sum = values[left] + values[right];
    if (sum === target) return true;
    if (sum < target) left += 1;
    else right -= 1;
  }
  return false;
}
console.log(hasPairBrute([1, 2, 4, 8], 6));
console.log(hasPairWithSum([1, 2, 4, 8], 6));
console.log(hasPairWithSum([2, 2], 4));
console.log(hasPairWithSum([2], 4));
console.log(hasPairWithSum([], 4));
console.log(hasPairWithSum([1, 3, 9], 8));
```
```output
true
true
true
false
false
false
```

### Two Sum II: preserve the proof, adapt the answer

Two Sum II asks for one-based positions in an already sorted array and requires constant extra space. The movement proof is identical to boolean pair search; only the success return changes. Keep zero-based indexes internally for JavaScript access, then add one exactly when returning. Sorting again would be unnecessary, and a Map would violate the intended constant-space constraint.

```javascript
function twoSumSorted(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    const sum = values[left] + values[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left += 1;
    else right -= 1;
  }
  return null;
}
console.log(JSON.stringify(twoSumSorted([1, 2, 4, 8], 6)));
console.log(JSON.stringify(twoSumSorted([2, 2], 4)));
console.log(JSON.stringify(twoSumSorted([2], 4)));
```
```output
[2,3]
[1,2]
null
```

On `[1,2,4,8]`, the same sums 9, 5, and 6 lead to internal positions 1 and 2, returned as `[2,3]`. Returning `[1,2]` would report the wrong one-based pair even though the search was correct. The local function defines null for no solution; the external task guarantees a solution. Worst-case time remains O(n), and the two-element answer plus working indexes use O(1) space.

### Valid Palindrome without building the reverse

The baseline allocates normalized and reversed strings. The inward version classifies one code unit at a time. Each skip also moves a boundary, so punctuation cannot trap the loop in place.

```javascript
function palindromeBrute(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}
function isPalindrome(text) {
  const allowed = char => /^[a-z0-9]$/i.test(char);
  let left = 0;
  let right = text.length - 1;
  while (left < right) {
    if (!allowed(text[left])) { left += 1; continue; }
    if (!allowed(text[right])) { right -= 1; continue; }
    if (text[left].toLowerCase() !== text[right].toLowerCase()) return false;
    left += 1;
    right -= 1;
  }
  return true;
}
console.log(palindromeBrute('Never odd or even'));
console.log(isPalindrome('Never odd or even'));
console.log(isPalindrome('race a car'));
console.log(isPalindrome('!!!'));
console.log(isPalindrome(''));
console.log(isPalindrome('0P'));
```
```output
true
true
false
true
true
false
```

### Stable compaction and logical output length

Write the retained value before advancing writer. The first function returns a length; the second returns the same mutated array for convenient demonstration. Neither allocates a new array internally. The logging slices used to display a valid prefix are outside the algorithm's working-space claim.

```javascript
function removeSortedDuplicates(values) {
  let writer = 0;
  for (let reader = 0; reader < values.length; reader += 1) {
    if (writer === 0 || values[reader] !== values[writer - 1]) {
      values[writer] = values[reader];
      writer += 1;
    }
  }
  return writer;
}
function moveZeroes(values) {
  let writer = 0;
  for (let reader = 0; reader < values.length; reader += 1) {
    if (values[reader] !== 0) {
      values[writer] = values[reader];
      writer += 1;
    }
  }
  while (writer < values.length) {
    values[writer] = 0;
    writer += 1;
  }
  return values;
}
const sorted = [1, 1, 2, 2, 3];
const length = removeSortedDuplicates(sorted);
console.log(length, JSON.stringify(sorted.slice(0, length)));
console.log(sorted.length);
console.log(JSON.stringify(moveZeroes([0, 1, 0, 3, 12])));
console.log(JSON.stringify(moveZeroes([0, 0])));
console.log(removeSortedDuplicates([]));
```
```output
3 [1,2,3]
5
[1,3,12,0,0]
[0,0]
0
```

### Node identity, the middle, and cycles

The chain construction is included so the example runs independently. Repeated numeric values deliberately show why value equality would be misleading. The middle is found before adding a cycle; calling the middle routine afterward would violate its precondition.

```javascript
function hasCycleWithSet(head) {
  const seen = new Set();
  for (let node = head; node !== null; node = node.next) {
    if (seen.has(node)) return true;
    seen.add(node);
  }
  return false;
}
function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
const a = { value: 7, next: null };
const b = { value: 7, next: null };
const c = { value: 9, next: null };
const d = { value: 10, next: null };
a.next = b; b.next = c; c.next = d;
console.log(middleNode(a) === c);
console.log(hasCycle(a), hasCycleWithSet(a));
d.next = b;
console.log(hasCycle(a), hasCycleWithSet(a));
console.log(hasCycle(null), middleNode(null));
const self = { value: 1, next: null };
self.next = self;
console.log(hasCycle(self));
```
```output
true
false false
true true
false null
true
```

### 3Sum with unique value triples

The sorted copy preserves the caller's order. The anchor is always before left, and left is always before right, which establishes three distinct positions. Duplicate-skipping loops still move boundaries monotonically and therefore do not add another independent factor of n.

```javascript
function threeSum(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const result = [];
  for (let anchor = 0; anchor < sorted.length - 2; anchor += 1) {
    if (anchor > 0 && sorted[anchor] === sorted[anchor - 1]) continue;
    let left = anchor + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[anchor] + sorted[left] + sorted[right];
      if (sum < 0) left += 1;
      else if (sum > 0) right -= 1;
      else {
        result.push([sorted[anchor], sorted[left], sorted[right]]);
        left += 1;
        right -= 1;
        while (left < right && sorted[left] === sorted[left - 1]) left += 1;
        while (left < right && sorted[right] === sorted[right + 1]) right -= 1;
      }
    }
  }
  return result;
}
const input = [-1, 0, 1, 2, -1, -4];
console.log(JSON.stringify(threeSum(input)));
console.log(JSON.stringify(input));
console.log(JSON.stringify(threeSum([0, 0, 0, 0])));
console.log(JSON.stringify(threeSum([1, 2])));
```
```output
[[-1,-1,2],[-1,0,1]]
[-1,0,1,2,-1,-4]
[[0,0,0]]
[]
```

## Worked Examples

### Example 1: prove each discarded endpoint

On `[1,2,4,8]` with target 6, the first sum is 9. Because even the smallest available partner 1 makes 8 too large, discard 8. Now the sum is 5 from 1+4. Because even the largest remaining partner 4 makes 1 too small, discard 1. The next pair is 2+4, which succeeds.

This is stronger than saying “move right when the sum is large.” Each movement eliminates a family of pairs. The family is safe to eliminate only because the input is sorted. On `[2,2]`, equal values at distinct positions are allowed, while `[2]` cannot satisfy target 4.

### Example 2: skip punctuation while preserving mirror alignment

For `A,b:a`, left starts at A and right at a. They match after case conversion, so both move inward. The right boundary now points at a colon and must skip it. The left boundary points at a comma and skips it too. Both boundaries meet at b; no further pair is needed, and the result is true.

The skip operations do not pair punctuation with letters. They discard characters excluded by the contract. On `0P`, both characters are meaningful, but 0 and p differ, so the answer is false. On punctuation-only text, every meaningful comparison is vacuously satisfied.

### Example 3: a retained prefix is not the entire array

For `[1,1,2,2,3]`, the first 1 is written at position 0 and writer becomes 1. The next 1 equals the last retained value and is skipped. The first 2 is written at position 1, writer becomes 2, and the repeated 2 is skipped. Finally 3 is written at position 2 and writer becomes 3.

The logical answer is the prefix `[1,2,3]`. The array can physically contain `[1,2,3,2,3]`; the final two positions are unspecified under this contract. A caller that reads all five entries misunderstands the API, even though the compaction itself is correct. If truncation is wanted, it must be an explicit extra operation permitted by the problem.

### Example 4: delay filling zeros until input is consumed

For `[0,1,0,3,12]`, reader 0 sees a zero and writer remains 0. Reader 1 copies 1 to position 0. Reader 2 skips zero. Reader 3 copies 3 to position 1. Reader 4 copies 12 to position 2. Only now is it safe to fill positions 3 and 4 with zeros.

Filling the suffix early could destroy a nonzero value the reader has not reached. The order of survivors remains 1,3,12 because the reader visits them in that order and writer advances once for each survivor. No sorting or swapping proof is needed; stability follows directly from the invariant.

### Example 5: relative speed in a cycle

Use nodes A→B→C→D→B. Starting at A, after one round slow is B and fast is C. After two rounds slow is C and fast is B. After three rounds both are D. The meeting proves repeated reachability of a node, not equality of values. In the acyclic A→B→C→D→null version, fast reaches null after two rounds and slow is C, the second middle.

Once inside the three-node cycle, fast gains one relative position each round. That arithmetic explains why a meeting must occur even if the entry point and initial gap differ. The two-pointer method retains only references to current nodes, while the Set baseline retains every visited identity.

### Example 6: lift pair search into 3Sum

Sort `[-1,0,1,2,-1,-4]` to `[-4,-1,-1,0,1,2]`. Anchor −4 cannot reach zero with any suffix pair. With anchor −1 at index 1, left −1 and right 2 give zero, so record `[-1,-1,2]`. Moving inward gives 0 and 1, so record `[-1,0,1]`. The next anchor is another −1 and is skipped.

Without skipping the repeated anchor, the second value triple could be rediscovered. On `[0,0,0,0]`, the first anchor records one zero triple and skips repeated pair values; the next equal anchor is skipped. There are several index triples but only one required value triple.

## Visual Explanations

```text
Opposite pointers:
excluded | left ... possible pairs ... right | excluded
          move left OR right after a mismatch

Reader/writer:
retained prefix | processed leftovers | unread suffix
0 ........ w-1   w ............. r-1   r ........ n-1
writer <= reader keeps writes out of unread input

Slow/fast:
A -> B -> C -> D -> null
round 0: slow=A, fast=A
round 1: slow=B, fast=C
round 2: slow=C, fast=null
```

These diagrams show three different meanings for “two pointers.” Inward pointers describe a candidate region, compaction pointers describe a valid prefix and an unread suffix, and slow/fast pointers describe relative travel. Borrowing movement rules between them without their invariants is a source of bugs.

| Reader | Input value | Writer before | Retained prefix afterward |
| --- | --- | --- | --- |
| 0 | 0 | 0 | empty |
| 1 | 1 | 0 | 1 |
| 2 | 0 | 1 | 1 |
| 3 | 3 | 1 | 1, 3 |
| 4 | 12 | 2 | 1, 3, 12 |

## Complexity Analysis

For inward pair search, each mismatch reduces `right − left`. There are at most n−1 such reductions, so worst-case traversal is Θ(n) with O(1) auxiliary state. The pair baseline has Θ(n²) worst-case checks. Sorting an unsorted array first changes the complete algorithm to O(n log n) under the usual sort model, even if the subsequent scan is linear.

The palindrome scan moves each boundary inward at most n times in total and performs constant-cost ASCII classification, so worst-case time is Θ(n) and auxiliary space O(1). The baseline remains linear time but allocates O(n) cleaned and reversed representations. The constant-space claim depends on inspecting characters in place, not building a code-point array first.

Compaction reads n positions and writes at most n retained values. Move Zeroes additionally fills at most n positions, so its total is Θ(n), not quadratic. Both compaction routines use O(1) working memory. A filtered-copy baseline also takes linear time but uses O(n) output storage; repeated splice operations can be quadratic.

| Task | Time under stated model | Additional space |
| --- | --- | --- |
| Sorted pair search | O(n) | O(1) |
| ASCII palindrome scan | O(n) | O(1) |
| Sorted deduplication / Move Zeroes | Θ(n) | O(1) |
| Acyclic middle | O(n) | O(1) |
| Cycle detection with Set | Expected O(p+c), or O(n) acyclic | O(p+c), or O(n) |
| Slow/fast cycle detection | O(p+c), or O(n) acyclic | O(1) |
| Brute-force triple enumeration | Θ(n³) candidate checks | Depends on collected output |
| 3Sum with sorting and pointers | O(n²) after O(n log n) modeled sorting | O(n) copy + sort workspace + output |

For 3Sum, each anchor has one monotone suffix traversal. Summing suffix lengths gives O(n²). The number of unique reported triples can itself be O(n²), so returning all answers is not constant-space. Engine sort workspace is not specified by JavaScript. State the copied-array cost and output cost separately instead of hiding them behind “two pointers use constant space.”

## Common Mistakes

An equality branch that neither returns nor moves can run forever. A `left <= right` condition can reuse one position in a pair problem. Moving both pointers after a mismatch discards one endpoint without proof. This intentionally broken example misses 2+4:

```javascript-bug
function brokenPair(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    if (values[left] + values[right] === target) return true;
    left += 1;
    right -= 1;
  }
  return false;
}
console.log(brokenPair([1, 2, 4, 8], 6));
console.log(brokenPair([1, 2, 4, 8, 16], 6));
```

It prints `true` for the first input and `false` for the second.

The first input happens to work, which is useful evidence about testing: one successful trace cannot establish the movement rule. In the second input, oversized sums justify moving right, but the simultaneous left moves wrongly discard 1 and then 2. The needed 2+4 pair is lost.

In compaction, incrementing writer before writing leaves the first slot incorrect. In cycle detection, comparing node values reports false cycles when values repeat, and testing initial pointer equality reports a cycle for every nonempty chain. In 3Sum, sorting without a numeric comparator or forgetting duplicate suppression changes the result's meaning. Every one of these errors is easier to detect by restating the invariant than by adding random conditionals.

## Interview and LeetCode Pattern Recognition

“Sorted pair,” “closest sum,” or “compare both ends” suggests inward pointers, but verify order and output requirements. A closest-sum task needs a best-so-far update and a tie rule beyond the existence implementation. “In place” and “preserve relative order” suggest reader/writer compaction. “Middle” or “cycle” in a linked chain suggests slow/fast pointers.

When asked for original pair indexes in unsorted data, the Map solution from [Week 2](week-02.md) is often the cleaner choice. Sorting may cost more than the eventual scan and destroys positional meaning unless indexes travel with values. Explain this before choosing the pattern. For 3Sum, returning value triples makes sorted-copy preprocessing natural.

Do not confuse reader/writer processing with a sliding window. A compacted prefix may combine originally nonadjacent survivors, while a window represents a contiguous interval of original input. [Week 4](week-04.md) will use the latter structure and a different invariant.

## Practice Exercises

### Conceptual

1. Prove the safe movement rule for a too-small and a too-large pair sum. Give an unsorted counterexample.
2. Explain why sorted deduplication needs order while Move Zeroes does not. Define stable output.
3. Explain why cycle detection compares identities, why the equality test occurs after movement, and why fast gains one relative cycle position per round.

### Tracing

4. Trace pair search on `[1,2,4,8]`, target 6, and `[2,2]`, target 4. Record each excluded family of pairs.
5. Trace palindrome boundaries on `A,b:a`, including every skipped punctuation mark.
6. Trace sorted deduplication on `[2,2,2]` and Move Zeroes on `[0,4,0,5]`. Separate logical output from physical storage.
7. Trace slow/fast on A→B→C→D→B and 3Sum on `[0,0,0,0]`.

### Debugging

8. Repair brokenPair above and find a singleton failure for an implementation using `left <= right`.
9. A Move Zeroes implementation writes zeros into all positions after writer during each reader iteration. Explain how this can erase unread values.
10. A cycle checker uses `slow.value === fast.value`. Build an acyclic counterexample and repair the comparison.

### Implementation

11. Reimplement sorted pair search and ASCII Valid Palindrome from their invariants. Test empty, singleton, duplicate, punctuation-only, and no-answer inputs.
12. Implement a stable in-place filter that removes negatives and returns a logical length without truncating the array.
13. Implement middleNode and hasCycle with complete node fixtures. Test odd and even lengths, null, a self-loop, and a tail linking into the middle.
14. Implement 3Sum without mutating input. Explain duplicate handling and compare results against triple enumeration on small finite integer arrays.

### External

The upstream assignment is Valid Palindrome, Remove Duplicates from Sorted Array, Two Sum II, and 3Sum. Move Zeroes remains supporting practice from the local textbook.

15. [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** inward pointers, normalization, boundary skipping. **Relevance:** requires a clear comparison contract and progress even when characters are ignored.
16. [Move Zeroes](https://leetcode.com/problems/move-zeroes/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** stable compaction, in-place mutation, reader/writer invariants. **Relevance:** tests safe writes without allocating a replacement array.
17. [3Sum](https://leetcode.com/problems/3sum/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** numeric sorting, anchored pair search, duplicate suppression. **Relevance:** combines the pair proof with an outer choice and requires unique value triples.

18. [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** reader/writer compaction, sorted adjacency, logical prefix. **Relevance:** directly exercises the chapter's `removeSortedDuplicates` contract. Trace `[1,1,2]`, return the retained count, and explain why the remaining physical suffix is irrelevant.
19. [Two Sum II — Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** opposite pointers, ordered elimination, one-based indexes. **Relevance:** adapts the pair-search proof to a constant-space index-returning API. Explain why adding one belongs only in the return expression and why a singleton cannot supply both positions.

## Hints and Worked Solutions

### Hints

For 1–3, describe the region or nodes you are eliminating, rather than naming the pattern. For 4–7, include the initial state and the state after each movement. For 8–10, use the smallest input that violates an assumption. For 11–17, begin with the contracts in the implementation section, then write code from the invariant without consulting the finished version.

### Solutions 1–7

A too-small sum excludes left because all its other available partners are no larger than right. A too-large sum excludes right because all its other available partners are no smaller than left. Unsorted `[3,2,4]`, target 6, breaks that argument. Sorted deduplication depends on equal values being consecutive; Move Zeroes tests each value independently. Stability means retained values keep their original relative order.

Identity equality detects revisiting the same node, while value equality merely detects repeated data. Both pointers begin equal regardless of cycles, so compare after a movement. Within the cycle, fast travels two edges and slow one, giving a relative gain of one modulo cycle length.

For pair tracing, sums are 9, 5, and 6. For `[2,2]`, the initial pair succeeds. For `A,b:a`, compare A/a, skip the right colon, skip the left comma, and finish at b. Deduplicating `[2,2,2]` returns length 1; only its first 2 is meaningful. Moving zeros in `[0,4,0,5]` produces `[4,5,0,0]`. On the cycle, rounds yield `(B,C)`, `(C,B)`, then `(D,D)`. Four zeros produce one unique triple `[0,0,0]` after duplicate skipping.

### Solutions 8–10: repair the violated proof

The correct pair implementation above moves only the endpoint proved impossible. With `left <= right`, `[2]` incorrectly satisfies target 4. For premature zero filling, `[0,4]` is enough: after seeing the initial zero, filling from writer 0 destroys the unread 4. Fill only after the reader finishes.

For identity debugging, use three separate nodes all holding 7. After one round slow and fast refer to different nodes with equal values. A value comparison falsely reports a cycle; reference comparison correctly continues and eventually reaches the end.

### Solution 12: a logical-prefix filter

This variation makes the output contract explicit. The function returns a count, leaves the physical length alone, and guarantees only the prefix before that count. The suffix shown in the second log is intentionally not part of the answer.

```javascript
function retainNonnegative(values) {
  let writer = 0;
  for (let reader = 0; reader < values.length; reader += 1) {
    if (values[reader] >= 0) {
      values[writer] = values[reader];
      writer += 1;
    }
  }
  return writer;
}
const values = [-2, 4, -1, 0, 5];
const length = retainNonnegative(values);
console.log(length, JSON.stringify(values.slice(0, length)));
console.log(values.length);
console.log(retainNonnegative([-1, -2]));
```
```output
3 [4,0,5]
5
0
```

Each input is examined once and each retained value written once, giving Θ(n) time and O(1) working space. The display slice allocates outside the function and is not necessary for a caller that reads only the prefix.

### Solutions 11, 13–17: what a complete answer must establish

The full implementations above solve these tasks under their stated contracts. A correct pair answer explains sortedness and distinct positions. A palindrome answer explains ignored characters and empty meaningful input. A middle answer specifies the second middle for even length and assumes no cycle. A cycle answer handles null and a self-loop without dereferencing null.

For 3Sum comparison, enumerate `i < j < k`, normalize each matching value triple, and compare collections of unique triples rather than discovery order. Each emitted optimized triple has distinct positions and sum zero. Repeated anchors and pair values cannot add a new value triple, so skipping them is safe. State the copied array and potentially quadratic output storage alongside the O(n²) traversal bound. External judge submissions are left to the learner; the local examples do not imply an accepted submission.

### Solutions 18–19: match the caller's contract

For sorted deduplication, the complete reader/writer implementation above returns 2 on `[1,1,2]` and leaves a valid prefix `[1,2]`. No promise is made about later positions. Reading only that prefix and returning its length is part of the solution, not a formatting detail. The algorithm is Θ(n) time and O(1) auxiliary space because each original position is read once and writer never moves ahead of reader.

For Two Sum II, use `twoSumSorted` above. The internal pair for `[1,2,4,8]`, target 6, is `(1,2)` in zero-based indexing, so the answer is `[2,3]`. The strict boundary condition prevents position reuse. The sorted-order proof justifies each discard, and the interval shortens on every mismatch, establishing O(n) time and O(1) space. A Map solves a related unsorted task but is unnecessary and exceeds this problem's space requirement.

## Sources and Further Reading

The [curriculum](../../shared/curriculum.js) and [Weeks 1–4 textbook](../../shared/textbook/weeks01to04.js) supply the canonical scope and preconditions. This chapter develops the pointer proofs, traces, executable fixtures, and exercises in original prose.

- [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/): opened to verify the normalization task and Easy difficulty.
- [Move Zeroes](https://leetcode.com/problems/move-zeroes/): opened to verify in-place mutation, preserved nonzero order, and Easy difficulty.
- [3Sum](https://leetcode.com/problems/3sum/): opened to verify distinct positions, unique value triples, and Medium difficulty.
- [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) and [Two Sum II](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/): opened to verify prefix-return and one-based-index contracts, respectively, and their Easy/Medium difficulties.
- [Upstream Week 3](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/03.md): fetched through the GitHub connector to reconcile the four assigned problems. The chapter's proofs and examples are original teaching rather than copied upstream prose.

These pages were verified on 7 November 2026 and used for problem contracts, not editorial implementations. The algorithm proofs were derived from the local syllabus and standard invariant reasoning. No external judge submission or engine-specific sorting benchmark is claimed. Full linked-list rewiring and multilingual text normalization are beyond this week's scope.

## Weekly Summary

Two-pointer methods work because positions carry evidence. Sorted order rules out entire families of pairs; mirror matches certify the outside; writer boundaries protect a valid prefix; relative speed reveals a cycle. Each technique needs its own invariant and termination argument.

You can now explain why linear movement stays linear, why sorted preprocessing must be counted, and why an in-place result may be only a logical prefix. Continue to [Week 4 — Sliding Window](week-04.md), where two forward-moving boundaries maintain a contiguous range and its summary state.

## Weekly Progress Checklist

### Theory

- [ ] I can prove both sorted pair-search movement rules. <!-- checkpoint:w3-safe-endpoint-elimination -->
- [ ] I can distinguish inward, reader/writer, and slow/fast invariants. <!-- checkpoint:w3-pointer-relationships -->
- [ ] I can explain logical length, stability, and protection of unread input. <!-- checkpoint:w3-compaction-contract -->
- [ ] I can explain relative motion inside a cycle. <!-- checkpoint:w3-cycle-proof -->

### JavaScript

- [ ] I can implement pair search with distinct positions and numeric order. <!-- checkpoint:w3-pair-implementation -->
- [ ] I can implement ASCII palindrome scanning with safe skips. <!-- checkpoint:w3-palindrome-implementation -->
- [ ] I can implement sorted deduplication and Move Zeroes in place. <!-- checkpoint:w3-reader-writer-implementation -->
- [ ] I can build node fixtures and compare node identity. <!-- checkpoint:w3-node-identity -->
- [ ] I can implement unique 3Sum triples while preserving input. <!-- checkpoint:w3-three-sum-implementation -->

### Practice

- [ ] I completed all boundary traces and debugging counterexamples. <!-- checkpoint:w3-tracing-debugging -->
- [ ] I attempted Valid Palindrome, Move Zeroes, and 3Sum. <!-- checkpoint:w3-external-practice -->
- [ ] I completed sorted deduplication and Two Sum II with the correct return contracts. <!-- checkpoint:w3-assigned-return-contracts -->
- [ ] I included preprocessing and output in complexity explanations. <!-- checkpoint:w3-complexity-practice -->

### Reflection

- [ ] I can explain a pointer move without appealing only to a pattern name. <!-- checkpoint:w3-movement-reflection -->
- [ ] I recorded a case where a Map is preferable to sorted pointers. <!-- checkpoint:w3-alternative-reflection -->
