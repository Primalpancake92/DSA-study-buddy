# Week 13 - Greedy and Intervals

This week, you will be learning greedy choices, exchange arguments, interval scheduling, coverage merging, and simultaneous room demand. These ideas matter whenever a local decision permanently removes alternatives and you need to know that an optimal completion survives.

We will start with earliest-finish scheduling, then compare it with start-sorted merging and event sweeping. Cookie matching will show how the same proof habits apply outside intervals.

By the end, you should be able to construct a counterexample to a bad rule, prove a good choice safe, distinguish interval objectives, and implement each scan with explicit endpoint and mutation rules.

There will be a checklist at the end of this lesson covering Theory, JavaScript, Practice, and Reflection. Use it to record evidence in your progress logs.

## Learning Objectives

- State a greedy choice and explain what alternatives it discards.
- Prove earliest-finish scheduling with an exchange argument.
- Distinguish maximum compatible count, coverage union, and minimum rooms.
- Handle touching endpoints, nested intervals, numeric sorting, and mutation deliberately.
- Separate sorting cost, scanning cost, working memory, and output size.

## Prerequisite Knowledge

You need arrays of pairs, numeric comparators, loop invariants, and basic O(n log n) sorting analysis. [Week 12](week-12.md) supplied a greedy algorithm with a special safety condition: Dijkstra needs nonnegative edges. This week develops the proof habit independently of graphs. When a safe local choice cannot be established, [Week 14](week-14.md) shows how dynamic programming retains alternatives.

## Core Theory

### Greedy means discarding alternatives permanently

A greedy algorithm commits to a locally selected option and solves the remaining problem. That commitment is useful only if some optimal completion remains possible. “It passed my examples” is evidence, but not a proof. Ask three questions: what is the objective, what is the local choice, and why can an optimum be changed to include it without losing quality?

For maximum meeting count in one room, select the compatible meeting finishing earliest. Suppose an optimal schedule starts with O and the earliest-finishing candidate is G. Replace O with G. Because G ends no later, every later meeting still fits, and the count is unchanged. An optimum therefore exists starting with G. Repeat the argument on the remaining compatible meetings. This exchange reasoning is also presented in Hope College's [interval-scheduling explanation](https://cusack.hope.edu/DAIADS/Content/Algorithms/Greedy/Interval%20Scheduling.html?path=Problems/Optimization/Interval+Scheduling).

The assumptions matter. Every accepted meeting contributes one unit of value. If meetings have unequal payments, replacing a valuable meeting with a cheap one may reduce the objective. Earliest finish is not automatically correct for maximum revenue. Likewise, selecting the shortest duration is unsafe: `[0,4)`, `[4,8)`, and `[3,5)` have a uniquely shortest middle interval that blocks both compatible outer intervals.

### Three interval questions, three meanings of state

**Scheduling** keeps a compatible subset. Its boundary is the last selected end; rejected meetings must not move it. **Merging** returns the union of coverage. Sort by start, then keep the last merged interval as an active frontier. **Room counting** serves every meeting and measures peak overlap. Sort start/end events, then track active occupancy. A shared input format does not make these algorithms interchangeable.

Endpoint conventions are part of the contract. A half-open meeting `[2,5)` releases its room at time 5, so `[5,7)` is compatible. Closed intervals `[2,5]` and `[5,7]` share point 5 and merge when representing closed coverage. A union representation may deliberately coalesce adjacent half-open intervals too, so clarify whether the task asks about occupancy conflicts or a compact coverage representation.

### Why merging and sweeping work

After processing a sorted prefix, the merged output represents exactly its union, in disjoint increasing intervals. If the next start exceeds the frontier end, no later start can bridge backward across that gap. Otherwise the union extends to the maximum of the two ends. The maximum is essential: a nested interval cannot shrink coverage.

For rooms, every simultaneous meeting needs its own room, giving a lower bound equal to peak occupancy. Conversely, allocate a free room at each start. A new room is required only when all existing rooms are occupied; then the active count has reached that larger number. Thus the peak is both necessary and sufficient. For half-open meetings, process an end before a start at the same timestamp.

## JavaScript Implementations

### Maximum compatible meeting subset

Assume finite numeric endpoints with `start < end`. We copy pairs to preserve the caller's order and avoid sharing returned pairs with the input.

```javascript
function selectMeetings(intervals) {
  const sorted = intervals.map(pair => [...pair]).sort((a, b) => a[1] - b[1]);
  const selected = [];
  let lastEnd = -Infinity;
  for (const [start, end] of sorted) {
    if (start < lastEnd) {
      continue;
    }
    selected.push([start, end]);
    lastEnd = end;
  }
  return selected;
}
const meetings = [[1, 10], [2, 3], [4, 5], [6, 7]];
console.log(JSON.stringify(selectMeetings(meetings)));
console.log(meetings.length - selectMeetings(meetings).length);
console.log(JSON.stringify(selectMeetings([[0, 2], [2, 4]])));
console.log(JSON.stringify(selectMeetings([])));
```
```output
[[2,3],[4,5],[6,7]]
1
[[0,2],[2,4]]
[]
```

Subtracting the maximum retained count from n gives the minimum removals needed to eliminate overlap under the same compatibility convention. It does not tell you how many rooms serve every meeting.

### Merge closed intervals

Here `start <= end` is allowed and touching endpoints merge. Sorting a shallow copy of the outer array would preserve input order, but mutating its inner pairs would still affect the input. This implementation creates new result pairs and only changes those.

```javascript
function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (!last || start > last[1]) {
      merged.push([start, end]);
    } else {
      last[1] = Math.max(last[1], end);
    }
  }
  return merged;
}
const input = [[1, 10], [2, 3], [10, 12], [15, 18]];
console.log(JSON.stringify(mergeIntervals(input)));
console.log(JSON.stringify(input));
console.log(JSON.stringify(mergeIntervals([])));
```
```output
[[1,12],[15,18]]
[[1,10],[2,3],[10,12],[15,18]]
[]
```

### Minimum rooms by event sweep

The contract requires finite, positive-duration half-open meetings. Zero-duration meetings are rejected rather than creating an end event before their own start. An application that allows them can instead define them as occupying no room and filter them explicitly.

```javascript
function minimumRooms(meetings) {
  const events = [];
  for (const [start, end] of meetings) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      throw new Error('Positive-duration meetings required');
    }
    events.push([start, 1], [end, -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let active = 0;
  let peak = 0;
  for (const [, change] of events) {
    active += change;
    peak = Math.max(peak, active);
  }
  return peak;
}
console.log(minimumRooms([[0, 30], [5, 10], [15, 20]]));
console.log(minimumRooms([[0, 2], [2, 4]]));
console.log(minimumRooms([]));
```
```output
2
1
0
```

### Assign Cookies: preserve scarce large resources

Assume finite nonnegative appetite and size values. Sort both collections. The least demanding remaining child gets the smallest adequate cookie. A cookie too small for that child cannot help any remaining child. Using a smaller adequate cookie preserves larger ones for harder demands; swapping such assignments in an optimum cannot decrease the number satisfied.

```javascript
function satisfiedChildren(appetites, sizes) {
  const children = [...appetites].sort((a, b) => a - b);
  const cookies = [...sizes].sort((a, b) => a - b);
  let child = 0;
  for (const cookie of cookies) {
    if (child === children.length) {
      break;
    }
    if (cookie >= children[child]) {
      child++;
    }
  }
  return child;
}
console.log(satisfiedChildren([1, 2, 3], [1, 1]));
console.log(satisfiedChildren([2, 1], [3, 1, 2]));
console.log(satisfiedChildren([], [1]));
```
```output
1
2
0
```

## Worked Examples

Take `[1,10)`, `[2,3)`, `[4,5)`, `[6,7)`. Earliest start chooses the long meeting and blocks three others. Earliest finish orders them as ends 3,5,7,10 and retains the first three. The accepted boundary moves through 3,5,7; rejecting the long interval leaves it at 7.

For closed-interval merging:

| Next interval | Current frontier before | Decision | Resulting output |
| --- | --- | --- | --- |
| [1,10] | none | start coverage | [[1,10]] |
| [2,3] | [1,10] | nested; retain end 10 | [[1,10]] |
| [10,12] | [1,10] | touching; extend | [[1,12]] |
| [15,18] | [1,12] | gap; append | [[1,12],[15,18]] |

For rooms `[0,30)`, `[5,10)`, `[15,20)`, the active counts after events at 0,5,10,15,20,30 are 1,2,1,2,1,0. Two rooms suffice even though the long meeting overlaps both short ones: the short meetings reuse the second room. Counting pairwise overlaps would not express the required peak.

For children `[1,2,3]` and cookies `[1,1]`, the first cookie satisfies appetite 1. The second cannot satisfy appetite 2, and therefore cannot satisfy appetite 3 either. Discarding it is justified by sorted demand, not by optimism.

## Visual Explanations

```text
One-room selection:
long:   [1----------------10)
shorts:   [2--3) [4--5) [6--7)
Keeping the long meeting gives 1; keeping the short meetings gives 3.

Half-open tie at time 2:
room: [0---2)[2---4)
events: end(-1), then start(+1)
The room is released before it is reused.

Closed coverage:
[1----------10]
   [2--3]           nested coverage cannot shorten the frontier
             [10--12]  => [1----------------12]
```

## Complexity Analysis

Assuming an O(n log n) comparison sort, all three interval algorithms take O(n log n) time overall and O(n) time after sorting. JavaScript's language specification does not promise a particular sorting algorithm or workspace bound; the accounting below describes the explicit collections and conventional efficient sorting model.

| Algorithm | Explicit working storage | Output storage |
| --- | --- | --- |
| Meeting selection | O(n) copied pairs | O(n) selected pairs |
| Merge | O(n) copied references | O(n) merged pairs |
| Room count | O(n) events | O(1) scalar |
| Cookie matching | O(c+k) copied values | O(1) scalar |

Cookie sorting takes O(c log(c+1)+k log(k+1)) time and scanning takes O(k). If data is already sorted in the required order, the scan alone is linear. Returning intervals necessarily costs space proportional to the number returned; a few scalar loop variables do not make the whole function constant-space.

## Common Mistakes

- Sorting by start for maximum compatible count confuses scheduling with merging.
- Using default numeric-array sort gives lexicographic ordering; supply a comparator.
- Updating `lastEnd` after rejection allows an unselected meeting to constrain the solution.
- Assigning the new end directly can shrink a merged frontier.
- Processing starts first at a half-open boundary overcounts rooms.
- Applying an unweighted exchange proof to weighted profits silently changes the objective.

```javascript-bug
if (start <= last[1]) last[1] = end;
// Processing [1,10] then [2,3] incorrectly shrinks the union to [1,3].
```

## Interview and LeetCode Pattern Recognition

Ask what must be preserved: all coverage, all meetings, or only the largest compatible subset? Merge Intervals preserves coverage. Non-overlapping Intervals removes as few meetings as possible. Meeting Rooms II serves every meeting. Assign Cookies maximizes successful matches under threshold constraints. None is solved merely by noticing that sorting is available.

For an unfamiliar greedy rule, try the smallest adversarial example: one long interval versus several short ones, a nested interval, equal endpoints, or a scarce large resource. If the rule survives, articulate an exchange or invariant. If it fails, keep the counterexample and reconsider the model; dynamic programming is one alternative when choices interact.

## Practice Exercises

### Conceptual

1. Give the exchange proof for earliest finish without saying only “it leaves more room.” Identify the replaced meeting and why every later meeting remains feasible.

### Tracing

2. For `[0,4)`, `[4,8)`, `[3,5)`, compute the maximum compatible count and minimum rooms. Why are those different questions?

### Debugging

3. Repair the broken merge and test a nested interval plus a touching endpoint.

### Implementation

4. Return minimum removals without constructing the selected subset. State the remaining copy/sort cost.
5. Extend the room sweep to report one timestamp at which the peak occurs. Define what happens for empty input.

### LeetCode + HackerRank

- **[Merge Intervals](https://leetcode.com/problems/merge-intervals/)** — Platform: LeetCode. Difficulty: Medium. Concepts: start ordering, union invariants, nested and touching ranges. Why: tests whether your frontier preserves exact coverage rather than selecting a subset.
- **[Greedy Florist](https://www.hackerrank.com/challenges/greedy-florist/problem)** — Platform: HackerRank. Difficulty: Medium. Concepts: sorted greedy assignment, increasing purchase multipliers, exchange reasoning. Why: asks you to transfer a safety argument from meeting selection to assigning expensive items to cheaper purchase slots.

## Hints and Worked Solutions

1. Let G finish earliest and O be the first meeting of an optimum. Replace O by G. Every later start was at least O's end and is therefore at least G's end. Count is preserved, and induction handles the suffix.
2. Select `[0,4)` and `[4,8)` for count two. Two rooms are also required because `[3,5)` overlaps each at different times. The equal numeric answers are incidental: one objective rejects a meeting, the other serves all three.
3. Use `Math.max(last[1], end)`. `[1,10]` plus `[2,3]` remains `[1,10]`; adding `[10,12]` gives `[1,12]`. To keep touching ranges separate under a different contract, make the new-group comparison `start >= last[1]`.
4. Count accepted meetings using the same boundary, then return n minus accepted. This removes O(n) result allocation but a copied sorted input still occupies O(n); sorting still dominates runtime.
5. Keep `peakTime = null`. Whenever a start raises active above the previous peak, save its time. Empty input returns peak zero and time null. Ties between multiple peak times can retain the first. Ends before starts preserve the half-open interpretation.
For Merge Intervals, test duplicates, a nested pair, negative coordinates, and touching endpoints. For Greedy Florist, sort prices descending and assign the item at zero-based index i the multiplier `Math.floor(i / friends) + 1`. An exchange proves the order: if p≥q and multipliers a≤b, then ap+bq≤bp+aq, so placing the larger price in the cheaper slot cannot increase cost. With prices `[2,5,6]` and two friends, the cost is 6+5+2×2=15. This extension assumes a positive friend count and takes O(n log n) sorting plus O(n) scanning.

## Sources and Further Reading

- Canonical scope consulted: [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js).
- Hope College, [Greedy Interval Scheduling](https://cusack.hope.edu/DAIADS/Content/Algorithms/Greedy/Interval%20Scheduling.html?path=Problems/Optimization/Interval+Scheduling): opened and consulted for the exchange argument. This chapter's examples and JavaScript are original teaching material.
- LeetCode, [Merge Intervals](https://leetcode.com/problems/merge-intervals/), and HackerRank, [Greedy Florist](https://www.hackerrank.com/challenges/greedy-florist/problem): official statements and displayed difficulty opened and verified; no editorial solutions consulted.

## Weekly Summary

A useful greedy solution needs a precise objective and a safety argument. Earliest finish preserves an optimal compatible schedule; start order makes union merging safe; event order reveals simultaneous demand. Their loops are short because the sorting and invariants do the reasoning. In [Week 14](week-14.md), you will retain and reuse subproblem answers when a single local choice is insufficient.

## Weekly Progress Checklist

### Theory

- [ ] Give an exchange proof and a counterexample to shortest-duration scheduling. <!-- checkpoint:w13-prove-greedy-choice -->
- [ ] Distinguish union, subset selection, and peak occupancy. <!-- checkpoint:w13-distinguish-objectives -->

### JavaScript

- [ ] Implement selection, merging, and room sweeping with explicit endpoint rules. <!-- checkpoint:w13-implement-intervals -->
- [ ] Preserve input order and avoid shared-pair mutation. <!-- checkpoint:w13-control-mutation -->

### Practice

- [ ] Solve nested, touching, and duplicate interval cases. <!-- checkpoint:w13-test-boundaries -->
- [ ] Explain why cookie matching preserves larger resources. <!-- checkpoint:w13-explain-resource-matching -->

### Reflection

- [ ] Record which assumption makes one greedy proof fail when the objective changes. <!-- checkpoint:w13-review-assumptions -->
