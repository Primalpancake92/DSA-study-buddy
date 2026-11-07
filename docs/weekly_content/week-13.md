# Week 13 - Greedy and Intervals
<!-- lesson-id:w13-section-chapter-introduction -->

This week, we will learn when it is safe to make a choice and never reconsider it. That is the central question behind a greedy algorithm. We will use meetings, intervals of coverage, room demand, and cookie assignments to make the reasoning concrete. A short loop is useful only when you can explain why its discarded alternatives are unnecessary.

We will begin by keeping as many compatible meetings as possible, using an exchange argument: show how an optimal answer can be changed to include our choice without becoming worse. Then we will compare that objective with merging coverage and serving every meeting in enough rooms. Those problems accept similar inputs but need different state.

By the end, you should be able to disprove a bad rule with a small example, prove a good choice safe, and state exactly how endpoints and input mutation affect your implementation. Cookie matching will let you transfer the same reasoning beyond intervals.

Use the final Theory, JavaScript, Practice, and Reflection checklist to record your evidence in progress logs. Include a proof and a counterexample, since both are useful tools for judging a greedy proposal.

## Learning Objectives
<!-- lesson-id:w13-section-learning-objectives -->

- State the objective and local choice of a greedy algorithm, including which alternatives the choice permanently discards.
- Prove earliest-finish scheduling by replacing the first meeting of an optimal answer.
- Distinguish keeping the most compatible meetings, preserving all covered points, and finding the fewest rooms for every meeting.
- Deliberately handle touching endpoints, nested intervals, numeric sorting, and changes to caller-owned arrays.
- Account separately for sorting, scanning, temporary collections, and returned output.

## Prerequisite Knowledge
<!-- lesson-id:w13-section-prerequisite-knowledge -->

You will use arrays containing endpoint pairs and numeric comparison functions for sorting. A loop invariant is a statement that remains true as each item is processed; we will use these statements to explain scans. Under a conventional efficient comparison sort, sorting n items takes O(n log n) time.

In [Week 12](week-12.md), Dijkstra made a greedy choice under a specific safety condition: edges must be nonnegative. Here we will develop that proof habit outside graphs. If no local choice can be proved safe, [Week 14](week-14.md) shows how dynamic programming can retain competing possibilities instead.

## Core Theory
<!-- lesson-id:w13-section-core-theory -->

### Greedy means discarding alternatives permanently

A greedy algorithm chooses a locally preferred option, commits to it, and solves what remains. The commitment discards alternatives, so we need to know that at least one optimal completion survives. Passing a collection of examples is evidence, but cannot establish that guarantee for every legal input.

Ask three questions before coding: what are we maximizing or minimizing, what choice do we make now, and why can some best possible answer include that choice? A choice can look appealing while serving the wrong objective.

For the maximum number of meetings in one room, take the compatible meeting finishing earliest. Call that meeting G, and call the first meeting of an optimal schedule O. Replace O with G. G ends no later than O, so every later meeting in the optimal schedule still fits. The number selected is unchanged. We have therefore shown that an optimum exists starting with G. Apply the same reasoning to the remaining compatible meetings. This replacement proof is an exchange argument; Hope College's [interval-scheduling explanation](https://cusack.hope.edu/DAIADS/Content/Algorithms/Greedy/Interval%20Scheduling.html?path=Problems/Optimization/Interval+Scheduling) presents the same reasoning.

Keep its assumptions visible. Each meeting contributes exactly one unit of value. If meetings pay different amounts, replacing a valuable O with a cheap G could lose revenue even while preserving count. The proof does not establish maximum payment.

Shortest duration is also unsafe. With `[0,4)`, `[4,8)`, and `[3,5)`, the uniquely shortest meeting is the middle one from three to five. Taking it blocks both outer meetings, which could otherwise coexist. That small counterexample is enough to reject the rule.

### Three interval questions, three meanings of state

For **scheduling**, we keep a compatible subset. The remembered boundary is the end of the last selected meeting. A rejected meeting must not move it, because it does not occupy our room.

For **merging**, we preserve the union: all points covered by any input interval. Sort by start, then keep the latest merged interval as the active frontier, meaning the furthest connected coverage reached so far.

For **room counting**, we must serve every meeting. We track how many meetings are active at each time and find their peak, the largest simultaneous count. Rejecting overlapping meetings would answer a different question.

Endpoint notation is part of the input contract. A half-open interval `[2,5)` includes its start but excludes its end, so its room is free at five and `[5,7)` can reuse it. Closed intervals `[2,5]` and `[5,7]` both include five and share that point. When representing coverage, a task may deliberately coalesce adjacent half-open ranges too. Establish whether you are measuring occupancy conflicts or making a compact coverage representation before choosing comparisons.

### Why merging and sweeping work

After a sorted prefix is processed, the merged output must represent exactly its union as disjoint increasing intervals. If the next start exceeds the frontier end, a real gap exists. Every later start is at least as large, so no later interval can bridge backward across that gap.

Otherwise the next interval joins the current coverage, whose end becomes the maximum of both ends. Taking the maximum matters: a nested interval such as `[2,3]` must not shorten `[1,10]`.

For rooms, each simultaneous meeting needs a separate room, so peak occupancy is a lower bound on the answer. Conversely, reuse any free room at each start. A new room is necessary only when all existing rooms are occupied, which means the active count has just reached that larger number. Thus peak occupancy is sufficient as well as necessary. With half-open meetings, process an end before a start at the same time so a released room can immediately be reused.

## JavaScript Implementations
<!-- lesson-id:w13-section-javascript-implementations -->

### Maximum compatible meeting subset

We will implement earliest-finish selection for finite numeric endpoints with `start < end`. Copying every pair preserves the caller's order and prevents returned pairs from sharing mutable arrays with the input.

### Demonstration 1 — Select the most compatible meetings

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

In **Demonstration 1**, sorting by finish places `[2,3]`, `[4,5]`, and `[6,7]` before `[1,10]`. All three short meetings are accepted, moving the selected boundary through three, five, and seven. The long meeting is rejected without changing that boundary. Subtracting three accepted meetings from four inputs gives one minimum removal. The touching pair is accepted because equality is compatible; empty input returns an empty selection.

Subtracting the maximum retained count from n gives the minimum removals needed to eliminate overlap under this same endpoint rule. It does not give the number of rooms needed to serve every meeting.

### Merge closed intervals

Now we want all covered points rather than a selected subset. Closed endpoints may satisfy `start <= end`, and touching ranges merge. A shallow copy of the outer input array preserves sorting order at the caller, but still shares the inner pair objects. We therefore allocate fresh result pairs and mutate only those.

### Demonstration 2 — Preserve union coverage through a maximum frontier

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

In **Demonstration 2**, `[1,10]` starts the frontier. Nested `[2,3]` leaves its end at ten. Touching `[10,12]` extends it to twelve; the gap before `[15,18]` starts another result pair. Printing the original input shows it was preserved. Empty input has no coverage and returns an empty list.

### Minimum rooms by event sweep

A sweep processes changes in time order. Here each start adds one active meeting and each end removes one. Require finite, positive-duration half-open meetings. Zero duration is rejected rather than generating an end before its own start; an application allowing it can explicitly define it as taking no room and filter it.

### Demonstration 3 — Measure peak simultaneous room demand

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

In **Demonstration 3**, the long meeting `[0,30]` occupies one room throughout. Each short meeting temporarily raises demand to two, but they never overlap each other, so they reuse the second room. The event comparator orders time first, then −1 before +1 at ties. That makes the touching test require one room. No meetings produce a peak of zero.

### Assign Cookies: preserve scarce large resources

An appetite is the minimum cookie size that satisfies a child. Assume finite nonnegative appetite and size values. Sort both collections and offer the smallest adequate cookie to the least demanding remaining child. A cookie too small for that child cannot help anyone remaining, because their demands are no smaller.

Using the smallest adequate resource leaves larger ones available. If an optimum assigns a larger cookie to this child, we can swap assignments to use the smaller adequate cookie here without decreasing the satisfied count. If the child was unserved while that cookie served a harder demand, serving this child instead also preserves the count. This justifies the local choice.

### Demonstration 4 — Match small adequate cookies before large ones

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

In **Demonstration 4**, appetites `[1,2,3]` and cookies `[1,1]` satisfy the first child only. The second cookie cannot meet appetite two, so the child index stays put. With appetites `[2,1]`, sorting makes the demand order one then two; cookies one and two satisfy both, and the extra cookie need not be used. No children means the loop returns zero.

## Worked Examples
<!-- lesson-id:w13-section-worked-examples -->

For **Demonstration 1** in **JavaScript Implementations**, compare two rules on `[1,10)`, `[2,3)`, `[4,5)`, `[6,7)`. Earliest start keeps only the long meeting. Earliest finish considers ends 3,5,7,10 and keeps the three short meetings. The selected boundary ends at seven and stays there when the long meeting is rejected.

Trace closed-coverage merging from **Demonstration 2** in **JavaScript Implementations**:

| Next interval | Current frontier before | Decision | Resulting output |
| --- | --- | --- | --- |
| [1,10] | none | start coverage | [[1,10]] |
| [2,3] | [1,10] | nested; retain end 10 | [[1,10]] |
| [10,12] | [1,10] | touching; extend | [[1,12]] |
| [15,18] | [1,12] | gap; append | [[1,12],[15,18]] |

For **Demonstration 3** in **JavaScript Implementations**, events at 0,5,10,15,20,30 change active counts to 1,2,1,2,1,0. The short meetings reuse room two. Counting pairs of meetings that overlap does not identify this peak; simultaneous demand is the quantity we need.

For **Demonstration 4** in **JavaScript Implementations**, the first size-one cookie meets appetite one. The next size-one cookie is below appetite two and therefore below appetite three too. Sorted demand proves discarding it is safe; we are not merely hoping it will be unhelpful.

## Visual Explanations
<!-- lesson-id:w13-section-visual-explanations -->

Use the first diagram to compare selected counts, the second to inspect a half-open endpoint tie, and the third to check that nested coverage never shrinks the frontier. Each picture represents a different objective despite using interval-shaped inputs.

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
<!-- lesson-id:w13-section-complexity-analysis -->

Assume an efficient O(n log n) comparison sort. Each interval algorithm then has an O(n log n) total time bound and an O(n) scan after sorting. JavaScript's specification does not guarantee one sorting algorithm or one workspace bound. The table accounts for explicit collections under that conventional sorting model.

| Algorithm | Explicit working storage | Output storage |
| --- | --- | --- |
| Meeting selection | O(n) copied pairs | O(n) selected pairs |
| Merge | O(n) copied references | O(n) merged pairs |
| Room count | O(n) events | O(1) scalar |
| Cookie matching | O(c+k) copied values | O(1) scalar |

For cookie matching, let c count children and k count cookies. Sorting takes O(c log(c+1)+k log(k+1)) time, and scanning takes O(k). Copying the inputs also visits their elements. If data is already sorted in the needed order, you can use the linear scan directly.

Space claims must include what the function actually allocates. A few scalar loop variables do not make selection or merging constant-space when copied input and output pairs remain stored. Returning intervals necessarily requires space proportional to the number returned.

## Common Mistakes
<!-- lesson-id:w13-section-common-mistakes -->

- Sorting by start is appropriate for coverage merging, but not the earliest-finish proof for maximum compatible count.
- Supply a numeric comparator. JavaScript's default sort compares textual representations, so numeric order can be wrong.
- Keep `lastEnd` unchanged on rejection. An unselected meeting must not constrain later choices.
- Use the maximum when extending coverage; directly assigning a nested interval's end can erase already covered points.
- Handle half-open ties with ends before starts, or you will count a room as occupied after it has been released.
- Do not carry the equal-value scheduling proof into weighted profits. Changing the objective invalidates its count-preserving exchange.

The deliberately broken merge loses old coverage when a nested interval arrives. Trace the endpoints before deciding how to repair it.

### Demonstration 1 — Broken merge that shrinks covered space

```javascript-bug
if (start <= last[1]) last[1] = end;
// Processing [1,10] then [2,3] incorrectly shrinks the union to [1,3].
```

In broken **Demonstration 1**, start with `last` equal to `[1,10]` and next interval `[2,3]`. Overlap is detected correctly, but assigning end three erases coverage from three to ten. The new frontier must retain the larger end. A correct overlap test cannot compensate for an update that violates the union invariant.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w13-section-interview-and-leetcode-pattern-recognition -->

First ask what must be preserved. Merge Intervals retains all coverage. Non-overlapping Intervals removes as few meetings as possible to retain a compatible subset. Meeting Rooms II serves every meeting with enough rooms. Assign Cookies maximizes matches under size thresholds. Recognizing that all can use sorting is only the beginning; the output contract decides the scan.

Try small adversarial inputs when judging a greedy rule: one long interval against several short ones, a nested pair, touching boundaries, or a scarce large resource. A failure disproves the rule. If it survives, you still need an exchange argument or invariant. When choices interact without a safe discard, reconsider the model; dynamic programming is one possible alternative.

## Practice Exercises
<!-- lesson-id:w13-section-practice-exercises -->

### Conceptual

1. Prove earliest finish without only saying “it leaves more room.” Name the meeting replaced in an optimum and explain why every later meeting still fits.

### Tracing

2. For `[0,4)`, `[4,8)`, `[3,5)`, find the maximum compatible count and minimum rooms. Explain why the questions differ even if the numbers agree.

### Debugging

3. Repair broken **Demonstration 1** in **Common Mistakes**. Check both a nested interval and a touching endpoint against the union invariant.

### Implementation

4. Return minimum removals without constructing the selected list. Explain which copied-input and sorting costs remain.
5. Extend the room sweep to report one time at which the peak occurs. Specify an empty-input answer and a rule for multiple peak times.

### LeetCode + HackerRank

- **[Merge Intervals](https://leetcode.com/problems/merge-intervals/)** — LeetCode, Medium. Practice start ordering, exact union coverage, and nested or touching ranges. Explain why rejecting a redundant range differs from selecting a compatible meeting subset.
- **[Greedy Florist](https://www.hackerrank.com/challenges/greedy-florist/problem)** — HackerRank, Medium. Practice sorted assignment with increasing purchase multipliers. Transfer the exchange-proof habit by explaining why expensive items should occupy cheaper purchase slots.

## Hints and Worked Solutions
<!-- lesson-id:w13-section-hints-and-worked-solutions -->

1. Let G finish earliest and O be the first meeting of an optimum. Replace O by G. Every later meeting started no earlier than O's end, which is no earlier than G's end. Thus every later meeting remains feasible and the count is preserved. Repeat on the remaining suffix; this induction proves the full greedy schedule.
2. Keep `[0,4)` and `[4,8)` for a selected count of two. Serving all three also requires two rooms, because `[3,5)` overlaps each outer meeting at different times. These equal numbers are incidental: selection rejects a meeting, whereas room allocation serves all three.
3. Extend with `Math.max(last[1], end)`. Merging `[1,10]` with `[2,3]` must keep `[1,10]`; adding `[10,12]` then gives `[1,12]`. Under a different contract that keeps touching ranges separate, use `start >= last[1]` to start a new group.
4. Count accepted meetings with the same selected-end boundary and return n minus accepted. Omitting result pairs saves O(n) output allocation. A copied sorted input still needs O(n) storage, and sorting still dominates runtime.
5. Initialize `peakTime = null`. Whenever a start raises active above the previous peak, store its time. Empty input gives peak zero and time null. Retaining the first time on ties is a consistent policy. Processing ends before starts preserves the half-open interpretation.

For Merge Intervals, test duplicate ranges, a nested pair, negative coordinates, and touching endpoints. Each attacks a specific coverage or ordering assumption.

For Greedy Florist, require a positive friend count. Sort prices descending and assign the item at zero-based index i multiplier `Math.floor(i / friends) + 1`. Why pair large prices with small multipliers? If p≥q and a≤b, then ap+bq≤bp+aq. Swapping a more expensive item into the cheaper slot cannot increase cost. With prices `[2,5,6]` and two friends, the total is 6+5+2×2=15. Sorting costs O(n log n), followed by an O(n) scan.

## Sources and Further Reading
<!-- lesson-id:w13-section-sources-and-further-reading -->

- The [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js) define the course scope for this chapter.
- Hope College's [Greedy Interval Scheduling](https://cusack.hope.edu/DAIADS/Content/Algorithms/Greedy/Interval%20Scheduling.html?path=Problems/Optimization/Interval+Scheduling) was consulted during earlier preparation for the exchange argument. The chapter's examples and JavaScript are original teaching material.
- The official [Merge Intervals](https://leetcode.com/problems/merge-intervals/) and [Greedy Florist](https://www.hackerrank.com/challenges/greedy-florist/problem) statements and difficulties were verified during earlier preparation, without editorial solutions. This prose rewrite does not claim they were checked again.

## Weekly Summary
<!-- lesson-id:w13-section-weekly-summary -->

A greedy solution needs a precise objective and a reason its choice preserves an optimal completion. Earliest finish supports the compatible-count exchange, start order supports exact union merging, and time-ordered events reveal simultaneous room demand. Their loops are short because the ordering and invariants carry the reasoning. In [Week 14](week-14.md), we will retain and reuse smaller answers when no single local choice is enough.

## Weekly Progress Checklist

### Theory

- [ ] Give the earliest-finish exchange proof and disprove shortest-duration scheduling with an example. <!-- checkpoint:w13-prove-greedy-choice -->
- [ ] Explain the difference between preserving coverage, selecting a subset, and measuring peak occupancy. <!-- checkpoint:w13-distinguish-objectives -->

### JavaScript

- [ ] Implement selection, merging, and room sweeping while stating their endpoint rules. <!-- checkpoint:w13-implement-intervals -->
- [ ] Preserve caller order and avoid mutating pairs shared with the input. <!-- checkpoint:w13-control-mutation -->

### Practice

- [ ] Solve examples containing nested, touching, and duplicate intervals. <!-- checkpoint:w13-test-boundaries -->
- [ ] Explain why cookie matching preserves larger resources for harder demands. <!-- checkpoint:w13-explain-resource-matching -->

### Reflection

- [ ] Record the assumption that fails when one greedy problem's objective changes. <!-- checkpoint:w13-review-assumptions -->
