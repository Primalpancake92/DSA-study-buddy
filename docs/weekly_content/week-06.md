# Week 6 - Binary Search
<!-- lesson-id:w6-section-chapter-introduction -->

🎬 Welcome back—let's make this idea feel familiar before we name the technique. Suppose you are looking for a number in an ordered collection. A comparison with the middle number can tell you that a whole side is impossible. That is the useful idea behind binary search, our topic this week. We will use it to locate sorted records, find where repeated values begin and end, and choose the smallest operating setting that can finish a job. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Here's the question to keep in mind as we go: what can we safely rule out, and why? We will first search for an exact value. Then we will find boundaries, search a sorted array whose beginning has been moved to its end, and search possible numeric answers rather than array positions. For each version, we will say exactly which candidates remain between our boundaries. That meaning determines the updates; you do not need to memorize several unrelated loop templates. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. By the end, you should be able to explain why every discarded region is safe to ignore and why the remaining region must shrink. You will also account for the work needed to test a proposed answer. A logarithmic number of tests does not make the complete algorithm logarithmic when each test itself scans many items. If you can explain this aloud while tracing an example, you are ready to implement it.

Pause the video for a second and picture the exact range we are describing. Use the final checklist after tracing and testing your own implementation. Save the smallest boundary case you missed in your progress logs: an empty array, a missing target, or two remaining candidates often teaches more than a large successful example. Explain the update that fixes it before ticking the item. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

## Learning Objectives
<!-- lesson-id:w6-section-learning-objectives -->

- Explain whether a caller needs a matching element, a place to insert, or the smallest answer that works.
- Keep a consistent meaning for intervals that include both endpoints and intervals that exclude the right endpoint.
- Find the beginning and end of a run of duplicates with lower and upper boundary searches.
- Show why our rotated-array implementation needs every value to be distinct.
- Define a yes/no test that changes only once as answers increase, and count the cost of all its evaluations.

## Prerequisite Knowledge
<!-- lesson-id:w6-section-prerequisite-knowledge -->

Now let's trace one small example slowly, just as we would on screen. You will need array positions from [Arrays](week-17.md), repeated-halving growth from [Algorithm Complexity](week-01.md), and the safe pointer-move reasoning of [Week 3](week-03.md). `Math.floor` rounds a number down to an integer; we use it to select an actual midpoint index. Make sure you can trace comparisons and updates to two boundaries. Inputs here contain finite numbers, are ascending where required, and keep integer arithmetic within JavaScript's safe range, where integers are represented exactly. Each demonstration is a standalone program. That is the kind of small check that turns a memorized recipe into a dependable method.

## Core Theory
<!-- lesson-id:w6-section-core-theory -->

### Elimination needs evidence

Before we code, say the rule out loud; that sentence will guide every update. Picture a shelf whose labels increase from left to right. If the middle label is too small, every label before it is too small as well. You have evidence to discard all of them at once. Choosing the middle makes that discarded region large, but the crucial reasoning is why no answer was lost. Whenever you adapt binary search, establish that elimination argument first. If you can explain this aloud while tracing an example, you are ready to implement it.

🎬 Welcome back—let's make this idea feel familiar before we name the technique. For exact search, use `[left,right]`, a **closed interval**, meaning both endpoints are still candidates. Initially they cover every array position. A matching midpoint can be returned immediately. If its value is too small, `left = middle + 1` discards it and everything before it. If too large, `right = middle - 1` discards it and everything after it. One remaining position still needs testing, so the loop uses `left <= right`. Once left passes right, the interval is empty and the target is absent. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Here's the question to keep in mind as we go: what can we safely rule out, and why? We also need a reason the loop finishes: the distance between boundaries strictly decreases on every unsuccessful comparison. Updating `left = middle` may fail to do that when only one or two candidates remain. A statement that stays true through the loop is called an invariant; progress and the invariant together explain both termination and correctness. [CMU's binary-search notes](https://www.cs.cmu.edu/afs/cs.cmu.edu/academic/class/15122-s14/www/06-binsearch.pdf) give the formal treatment, while we will describe the same obligations in everyday language. That is the kind of small check that turns a memorized recipe into a dependable method.

### A boundary search should not return on equality

Let's put this on the whiteboard and watch the moving parts together. In `[2,4,4,4,9]`, finding the middle 4 satisfies exact search but does not find the first 4. For that request, equality tells us to keep looking left while preserving the current candidate. The **lower bound** is the first index whose value is at least the target. If every value is smaller, return n, the position just after the array. This is a valid insertion position even though there is no element there to read. If you can explain this aloud while tracing an example, you are ready to implement it.

Pause the video for a second and picture the exact range we are describing. Use `[left,right)` for elements we have not classified. This **half-open interval** includes left but excludes right. Everything before left is proven too small; every real position at or after right is proven large enough. The answer itself lies in `[left,right]`, including n as a sentinel—a special boundary value representing the end. When the midpoint qualifies, keep it with `right = middle`; otherwise skip it with `left = middle + 1`. When left equals right, the two proven regions meet and identify the boundary. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Now let's trace one small example slowly, just as we would on screen. The **upper bound** is the first position strictly greater than the target. Consequently, equal values fill `[lowerBound,upperBound)`, and subtracting the boundaries counts them. For a missing target, those boundaries coincide and the count is zero. Do not confuse an insertion position with proof of membership. First check that the index is less than n, then compare its value with the target. That is the kind of small check that turns a memorized recipe into a dependable method.

### Rotation preserves enough local order

Before we code, say the rule out loud; that sentence will guide every update. A **rotated sorted array** is an ascending array with some initial values moved to the end; it has a break between two increasing runs. With distinct values, at least one side of the midpoint is sorted. First test midpoint equality. Then identify the sorted half and compare the target with its endpoint values. Keep that half if its range can contain the target; otherwise discard it and keep the other half. If you can explain this aloud while tracing an example, you are ready to implement it.

🎬 Welcome back—let's make this idea feel familiar before we name the technique. The elimination evidence now comes from order within part of the array. Equal values can hide that evidence: identical left, middle, and right values may conceal which side contains the break. A variant that supports duplicates can shrink equal endpoints, but may require Θ(n) time. Keep the precondition—what must be true before the function runs—explicit: our implementation accepts distinct values and its logarithmic guarantee depends on them. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Binary search can search answers rather than indexes

Here's the question to keep in mind as we go: what can we safely rule out, and why? Now imagine choosing a worker's integer processing speed. Each hour can be spent on only one pile, and spare capacity cannot move to another pile during that hour. A pile of p units therefore takes `ceil(p/speed)` hours: round upward because even a partially used final hour counts. We want the smallest speed that finishes within h hours, as in Koko Eating Bananas. The candidates are speeds rather than array indexes. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. A higher speed cannot make any pile take longer. The yes/no test “can we finish?” is therefore **monotonic**: it never changes back to false after becoming true. Such a test is called a predicate. We search its first true answer. Test `hours <= h`, not exact equality. Required hours can jump over h, and finishing early is still valid; a search for exactly h could reject every useful candidate. If you can explain this aloud while tracing an example, you are ready to implement it.

Pause the video for a second and picture the exact range we are describing. Before searching, prove an answer exists in your range. Every positive pile needs at least one hour, so h below the number of piles makes the schedule impossible. Otherwise, a speed equal to the largest pile processes each pile in one hour and is a valid upper bound. Without that guarantee, converging boundaries could produce a number that never passed the actual requirements. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

## JavaScript Implementations
<!-- lesson-id:w6-section-javascript-implementations -->

Now let's trace one small example slowly, just as we would on screen. We will locate 12, reject a missing 7, and check what the interval means for empty and one-element arrays. That is the kind of small check that turns a memorized recipe into a dependable method.

### Demonstration 1 — Find an exact value with inclusive endpoints

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

Before we code, say the rule out loud; that sentence will guide every update. In **Demonstration 1**, searching for 12 first tests index 2, value 8. Moving left to 3 safely removes indexes 0 through 2; the next midpoint is index 3 and succeeds. For 7, the candidates eventually disappear and we return `-1`. Empty input starts with right at -1, so it never reads an element. The midpoint uses ordinary arithmetic; bitwise operators would convert numbers to 32-bit integers. We move boundaries without slicing, copying the range, or changing the input. If you can explain this aloud while tracing an example, you are ready to implement it.

🎬 Welcome back—let's make this idea feel familiar before we name the technique. We will locate both edges of the repeated 4s and distinguish a missing value's insertion point from membership. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Demonstration 2 — Find the first qualifying boundary

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

Here's the question to keep in mind as we go: what can we safely rule out, and why? In **Demonstration 2**, lower bound keeps an equal 4 as a candidate, moving right from 5 to 2 to 1, before left reaches 1. Upper bound skips equal 4s and returns 4. Their difference is three occurrences. For target 6, both return 4, but `values[4]` is 9, so the membership check is false. Only the comparison's strictness differs between the helpers; derive it from “at least” versus “strictly greater” rather than memorizing nearly identical templates. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. We will use a locally sorted half to find 5 without rearranging the rotated array. If you can explain this aloud while tracing an example, you are ready to implement it.

### Demonstration 3 — Search across a rotation with distinct values

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

Pause the video for a second and picture the exact range we are describing. In **Demonstration 3**, the first midpoint is 18 at index 2. The left range 11 through 18 is sorted but cannot contain 5, so left becomes 3. The next midpoint is 5 at index 4. Endpoint comparisons include equality because an endpoint can still be the target; midpoint range checks are strict because we already tested midpoint equality. Sorting first would cost more than this search and destroy the original positions we are asked to report. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Now let's trace one small example slowly, just as we would on screen. We will search speeds for three piles and explicitly represent an impossible schedule and an empty workload. That is the kind of small check that turns a memorized recipe into a dependable method.

### Demonstration 4 — Search for the smallest speed that finishes

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

Before we code, say the rule out loud; that sentence will guide every update. In **Demonstration 4**, speed 4 needs `1 + 3 + 4` hours for `[4,9,13]` and fails the seven-hour limit; speed 5 needs `1 + 2 + 3` and succeeds. The helper can access piles and hours from its enclosing function without copying either. It returns early when the running total is too large, but worst-case analysis still allows a full scan for each tested speed. This API defines `null` for an impossible schedule and zero for no piles; check an online problem's contract because it may exclude those inputs. If you can explain this aloud while tracing an example, you are ready to implement it.

## Worked Examples
<!-- lesson-id:w6-section-worked-examples -->

🎬 Welcome back—let's make this idea feel familiar before we name the technique. Let's find the first position at least 4 in `[2,4,4,4,9]`. Record the exclusive right boundary carefully: it begins at 5 even though the final valid element index is 4. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

| left | right, exclusive | middle | value | Decision |
| --- | --- | --- | --- | --- |
| 0 | 5 | 2 | 4 | qualifies; right=2 |
| 0 | 2 | 1 | 4 | qualifies; right=1 |
| 0 | 1 | 0 | 2 | too small; left=1 |

Here's the question to keep in mind as we go: what can we safely rule out, and why? When the boundaries meet at 1, everything earlier is proven too small and index 1 is the first qualifying position. If you had returned the first equal midpoint, you would have returned 2. That would find a 4 but break the requirement to find the first one. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. Try the rotated array `[11,14,18,2,5,8]`. Searching for 5 begins with interval `[0,5]` and midpoint 2, value 18. The sorted left half spans 11 through 18, so 5 belongs elsewhere; left becomes 3 and midpoint 4 matches. For missing 7, the next sorted value range `[2,5]` cannot contain it. The remaining singleton 8 fails too, leaving no candidates. If you can explain this aloud while tracing an example, you are ready to implement it.

Pause the video for a second and picture the exact range we are describing. For piles `[4,9,13]` and seven hours, trace the candidate speeds as a closed range containing the minimum feasible answer. Notice that a successful midpoint remains in the range rather than being skipped. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

| Candidate interval | Tested speed | Hours needed | Next interval |
| --- | --- | --- | --- |
| [1,13] | 7 | 1+2+2=5 | [1,7] |
| [1,7] | 4 | 1+3+4=8 | [5,7] |
| [5,7] | 6 | 1+2+3=6 | [5,6] |
| [5,6] | 5 | 1+2+3=6 | [5,5] |

Now let's trace one small example slowly, just as we would on screen. The boundaries meet at speed 5. It uses six hours, which is allowed because the limit is seven. Speed 4 fails, and all lower speeds can only take as long or longer. That final comparison plus monotonicity proves that 5 is the minimum, not merely a speed that works. That is the kind of small check that turns a memorized recipe into a dependable method.

## Visual Explanations
<!-- lesson-id:w6-section-visual-explanations -->

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

Before we code, say the rule out loud; that sentence will guide every update. If all elements fail the predicate, the boundary belongs at n, the end sentinel. There is no need to read `values[n]`. In either drawing, first identify where false stops and true begins. Then choose updates that keep that transition possible; this is a more reliable guide than remembering whether a template used `+ 1`. If you can explain this aloud while tracing an example, you are ready to implement it.

## Complexity Analysis
<!-- lesson-id:w6-section-complexity-analysis -->

🎬 Welcome back—let's make this idea feel familiar before we name the technique. Repeated halving takes a size n interval to roughly n/2, then n/4, and so on. After k reductions, it has at most about n/2^k candidates. That gives O(log(n+1)) iterations, with constant handling for empty input. These are upper bounds on work; O does not itself mean “worst case.” For the stated input contracts, they bound worst-case iterations. Exact, lower-bound, upper-bound, and distinct-value rotated search keep only a few indexes, so their auxiliary—additional working—space is O(1). Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Here's the question to keep in mind as we go: what can we safely rule out, and why? For p piles and largest pile M, finding the initial upper bound scans p values. Each speed test can scan them again. The full time is O(p + p log M), equivalently O(p log(M+1)), with O(1) auxiliary space. The logarithm counts tests and the p factor pays for each test. More generally, if a predicate costs C and an integer range contains R possibilities, report O(C log(R+1)), plus any setup work. Do not silently treat a nonconstant test as free. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. If your input is unsorted, preparing it by sorting costs O(n log n) in the standard model that counts value comparisons. That investment may pay off across many later queries, but the first lookup still includes preparation. Preserve original indexes if callers need them. JavaScript's default sort compares text-like representations—lexical order—so numeric ascending order requires `(a,b) => a-b`. If you can explain this aloud while tracing an example, you are ready to implement it.

## Common Mistakes
<!-- lesson-id:w6-section-common-mistakes -->

- If right is the excluded end n, do not use a loop that reads it as an inclusive candidate. Mixing conventions can read past the array.
- In lower bound, keep a qualifying midpoint with `right = middle`; subtracting one can throw away the answer.
- If the request is the first match, equality is evidence to keep searching left, not an immediate return.
- Prove that increasing a candidate cannot turn feasibility back to false before using answer-space search.
- Round partial pile hours upward; ordinary division undercounts the actual time.
- Keep duplicates out of this rotated-search implementation unless you also change its reasoning and complexity guarantee.

Pause the video for a second and picture the exact range we are describing. This broken boundary loop lets a too-small midpoint remain, so a two-element input can expose a failure to progress. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Demonstration 1 — Broken update repeats the same interval

```javascript-bug
while (left < right) {
  const middle = left + Math.floor((right - left) / 2);
  if (values[middle] < target) left = middle;
  else right = middle;
}
```

Now let's trace one small example slowly, just as we would on screen. In broken **Demonstration 1**, use `[1,3]`, target 3, left=0, and right=1. The midpoint is zero, and 1 is too small, but assigning left to zero changes nothing. The next iteration repeats forever. We must skip this proven-too-small midpoint with `middle + 1`, while still retaining a qualifying midpoint on the right. That is the kind of small check that turns a memorized recipe into a dependable method.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w6-section-interview-and-leetcode-pattern-recognition -->

Before we code, say the rule out loud; that sentence will guide every update. Sorted data is a useful clue, but ask what comparison actually eliminates a region. First occurrence, insertion point, and duplicate count suggest boundary searches. A rotation asks you to find a locally sorted half. Minimum capacity or smallest speed suggests searching candidate answers, provided you can prove feasibility changes in only one direction. The words in the prompt guide the proof you need. If you can explain this aloud while tracing an example, you are ready to implement it.

🎬 Welcome back—let's make this idea feel familiar before we name the technique. Before coding, explain the answer type, what each endpoint means, and which candidates a comparison proves impossible. For Koko Eating Bananas, justify why faster processing cannot hurt. For Search Insert Position, show that lower bound is already the desired insertion contract. Also check the representation: a linked list cannot jump to its midpoint in constant time, so you cannot transfer the array's time bound merely because the values are sorted. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

## Practice Exercises
<!-- lesson-id:w6-section-practice-exercises -->

### Conceptual Questions

Here's the question to keep in mind as we go: what can we safely rule out, and why? 1. **Conceptual:** Explain which elimination step requires sorted order in exact search. Construct two unsorted arrays with the same midpoint value but the target on opposite sides.
2. **Conceptual:** Try every relevant integer speed for pile `[5]`. Can any require exactly four hours? Use your results to justify the predicate a minimum-speed search should use. That is the kind of small check that turns a memorized recipe into a dependable method.

### Code Tracing

Let's put this on the whiteboard and watch the moving parts together. 3. **Tracing:** Find both boundaries for target 2 and for target 3 in `[2,2,2,4]`. For one of the four calls, record every interval, midpoint, and reason for the update. If you can explain this aloud while tracing an example, you are ready to implement it.

### Debugging Exercises

Pause the video for a second and picture the exact range we are describing. 4. **Debugging:** Repair **Demonstration 1** in “Common Mistakes.” Explain separately why your change reduces the interval and why it cannot discard the required boundary. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Implementation Exercises

Now let's trace one small example slowly, just as we would on screen. 5. **Implementation:** Write `countOccurrences(values,target)` by subtracting two searched boundaries. Check an empty array, an absent target, and an array in which every value equals the target.
6. **Implementation:** Rebuild distinct-value rotated search from its elimination argument. Test both rotations of a two-element array and searches matching either endpoint. That is the kind of small check that turns a memorized recipe into a dependable method.

### LeetCode and HackerRank Practice

Before we code, say the rule out loud; that sentence will guide every update. 7. **[Binary Search](https://leetcode.com/problems/binary-search/)** — LeetCode lists this as Easy. Practice sorted-array elimination, inclusive endpoints, and missing targets. Concentrate on explaining the remaining candidates before adding the complications of boundaries or feasibility.
8. **[Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/description/)** — LeetCode lists this as Medium. Practice searching candidate answers, rounding partial hours up, and proving monotonic feasibility. Include the predicate's scan in your time bound. The existing record reports both official pages verified and no HackerRank consultation; they were not verified anew during this rewrite. Follow with the syllabus task Search Insert Position, explaining why an insertion index differs from an exact-match result. If you can explain this aloud while tracing an example, you are ready to implement it.

## Hints and Worked Solutions
<!-- lesson-id:w6-section-hints-and-worked-solutions -->

🎬 Welcome back—let's make this idea feel familiar before we name the technique. 1. Compare `[7,1,9]` with `[9,1,7]`, searching for 7. Both show 1 at the midpoint, but 7 lies on opposite sides. Without sorted order, that identical comparison cannot justify choosing either half.
2. Speeds 1, 2, 3, 4, 5 for `[5]` require 5, 3, 2, 2, 1 hours respectively. No speed requires four hours. The condition must be at most four hours; the first speed meeting it is 2.
3. Target 2 has boundaries 0 and 3, so its count is three. Target 3 has both boundaries at 3, so its count is zero. For lower bound of 2, the midpoint indexes are 2, 1, 0; each qualifies and moves right leftward until both boundaries meet at zero.
4. A too-small midpoint cannot be the first qualifying position, so use `left = middle + 1`. This both discards a proven failure and guarantees movement. A qualifying midpoint could be the first one, so retain `right = middle`.
5. We can share the boundary logic by passing whether the comparison is strict. The helper still performs two logarithmic searches; factoring the implementation changes neither contract nor growth rate. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Demonstration 1 — Count equal values by subtracting boundaries

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

Here's the question to keep in mind as we go: what can we safely rule out, and why? In **Demonstration 1**, target 2 in `[2,2,2,4]` makes the nonstrict helper return 0 and the strict helper return 3. Subtracting gives three. Target 3 makes both helpers return 3, and an empty array makes both return zero. The `strict` flag selects `>` or `>=`; it does not alter the interval convention. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. 6. On `[8,3]`, searching for 8 matches midpoint zero. Searching for 3 discards the singleton sorted left half and finds index one. Keep endpoint tests inclusive whenever that endpoint is still a possible answer; midpoint equality is handled separately.
7–8. **Demonstration 1** and **Demonstration 4** in “JavaScript Implementations” solve exact search and minimum speed. Explain their invariants from memory before adapting the platform's function signatures. For an independent speed-search check, enumerate small speeds directly and compare the first feasible result with binary search's result. If you can explain this aloud while tracing an example, you are ready to implement it.

## Sources and Further Reading
<!-- lesson-id:w6-section-sources-and-further-reading -->

Pause the video for a second and picture the exact range we are describing. The existing chapter records source consultation on 2026-11-07. That is a historical attribution, not a new link-verification claim for this rewrite. Examples and derivations are original teaching material following the repository syllabus. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

- [CMU 15-122: Binary Search lecture notes](https://www.cs.cmu.edu/afs/cs.cmu.edu/academic/class/15122-s14/www/06-binsearch.pdf) — the prior consultation informed the sorted-search proof and verification through statements preserved by the loop.
- [LeetCode: Binary Search](https://leetcode.com/problems/binary-search/) — the prior reading established the official sorted-input requirement and return-value contract used for practice.
- [LeetCode: Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/description/) — the prior reading established the minimum-speed problem statement and difficulty. The record reports no editorial consultation.

## Weekly Summary
<!-- lesson-id:w6-section-weekly-summary -->

Now let's trace one small example slowly, just as we would on screen. You can now build binary search by describing what remains possible. Preserve qualifying midpoints when searching boundaries, find local order in a rotated array, and prove one-way feasibility when searching numeric answers. In every version, agree on the requested result, keep the interval's meaning true, and show that it shrinks. Next, [Week 7](week-07.md) replaces direct array indexes with references between nodes, making the representation's access costs especially visible. That is the kind of small check that turns a memorized recipe into a dependable method.

## Weekly Progress Checklist

### Theory

- [ ] Explain in my own words which candidates remain in closed and half-open intervals. <!-- checkpoint:w6-search-invariants -->
- [ ] Show why raising pile-processing speed cannot turn a feasible schedule infeasible. <!-- checkpoint:w6-monotonic-feasibility -->

### JavaScript

- [ ] Rebuild exact search and both boundary searches without copying a template. <!-- checkpoint:w6-boundary-implementations -->
- [ ] Build rotated search and explain exactly where distinct values are required. <!-- checkpoint:w6-rotated-search -->

### Practice

- [ ] Trace an empty array, one candidate, repeated values, and an absent target through all boundary updates. <!-- checkpoint:w6-edge-case-traces -->
- [ ] Complete both external tasks and explain what each returned value promises. <!-- checkpoint:w6-external-practice -->

### Reflection

- [ ] Save the smallest input that exposes an update which fails to shrink the interval. <!-- checkpoint:w6-termination-reflection -->
- [ ] Count setup work and the cost of testing each candidate in my full complexity explanation. <!-- checkpoint:w6-full-cost-reflection -->
