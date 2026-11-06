# Week 5 - Stacks and Queues

This week, you will be learning stacks and queues: structures that decide which unfinished job deserves attention next. Matching a bracket requires the most recent opener; serving customers requires the oldest arrival. These ordering rules also power undo histories, parsers, and tree traversals.

We will start with LIFO and FIFO, then build efficient queues and a monotonic stack that remembers questions whose answers have not arrived yet. Work through one trace with pencil and paper before running each program.

By the end, you will be able to implement both ordering policies, explain why a nested loop can still be linear, and distinguish a queue's live size from the memory its implementation retains.

There will be a checklist at the end to help you track your progress. Tick an item after you can demonstrate it without reading the implementation, and record examples, mistakes, and next steps in your progress logs.

## Learning Objectives

- Explain LIFO and FIFO using an operation sequence.
- Implement bracket matching, two efficient queue designs, and a monotonic stack.
- State an invariant that explains why each removal is safe.
- Separate worst-case cost, amortized cost, live elements, and retained array slots.
- Recognize nesting, arrival-order processing, and next-greater questions.

## Prerequisite Knowledge

You need array indexes, `push`, `pop`, loops, object references, and the time/space distinctions from [Week 1](week-01.md). Sets and maps from [Week 2](week-02.md) help represent bracket categories. The “each item enters and leaves once” argument resembles the pointer accounting in [Week 4](week-04.md). Every JavaScript block below is a complete independent program; collection outputs use JSON so formatting is reproducible.

## Core Theory

### A stack stores obligations in reverse completion order

LIFO means last in, first out. Imagine opening a folder, opening a subfolder, and then returning: you must leave the subfolder before leaving its parent. A stack provides `push` to add an obligation, `pop` to finish the newest one, and `peek` to inspect it without removal. An array's last position is a convenient top.

For brackets, the invariant is that the stack contains exactly the unmatched opening brackets in the prefix already read. A closer must match the top. Matching an older opener would cross a still-open inner pair. Equal counts do not establish nesting: `([)]` contains one of each symbol but is invalid. A closer with an empty stack fails immediately. After the scan, any leftover opener also means failure. Our implementation ignores other characters, so an arithmetic expression is allowed; that is an explicit input policy.

An undo feature uses the same order, but it must save enough information to reverse each action. “Delete three characters” alone is insufficient unless the deleted text was saved. A stack specifies order, not what an adequate record contains.

### A queue separates arrival from processing

FIFO means first in, first out. Append new work at the rear and remove old work at the front. This is the order needed to process tree levels in [Week 9](week-09.md). A queue is an interface, not necessarily a JavaScript array.

Repeated `shift()` is a poor general queue strategy. Its semantics move later indexed values toward the front, as documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift). In the ordinary array cost model, draining n items this way takes n + (n−1) + … + 1 work, or Θ(n²). Engine optimizations vary; our algorithmic guarantee should not depend on one engine special-casing a workload.

With a head index, the live queue is only `items[head ... length)`. Incrementing head avoids movement, but does not shorten the array or release old references. Clearing consumed slots releases those references from this container. Periodic compaction also bounds the number of retained indexed slots. Those are separate improvements.

Another design uses two stacks. Incoming items accumulate in one stack. When the outgoing stack is empty, transfer all incoming items to it. The reversal makes the oldest arrival the next pop. Never transfer while outgoing still contains older jobs.

### A monotonic stack stores unresolved questions

Suppose each temperature asks, “How long until a strictly warmer day?” Scanning forward separately from every day repeats comparisons. Instead, store indexes whose first warmer day has not appeared. Their temperatures are nonincreasing from bottom to top. Today's temperature can resolve several waiting indexes, so keep popping while it is strictly greater than the top temperature.

Why is today the *first* answer? Every intervening day was processed and failed to remove that index. Why can we forget a popped index? Its final answer is now known. Equal temperatures remain pending because the question requires strictly warmer. Indexes, rather than just temperatures, preserve distances and distinguish duplicate readings.

## JavaScript Implementations

### Bracket matching

```javascript
function isBalanced(text) {
  const opening = new Set(['(', '[', '{']);
  const matching = new Map([[')', '('], [']', '['], ['}', '{']]);
  const stack = [];
  for (const character of text) {
    if (opening.has(character)) stack.push(character);
    else if (matching.has(character)) {
      if (stack.length === 0 || stack.pop() !== matching.get(character)) {
        return false;
      }
    }
  }
  return stack.length === 0;
}
console.log(isBalanced('x * {[2 + 3]}'));
console.log(isBalanced('([)]'));
console.log(isBalanced('(('));
console.log(isBalanced(''));
```
```output
true
false
false
true
```

Short-circuit evaluation checks emptiness before removing anything. The final test is necessary even if every closer encountered was valid.

### A head-index queue with compaction

```javascript
class HeadQueue {
  constructor() { this.items = []; this.head = 0; }
  get size() { return this.items.length - this.head; }
  enqueue(value) { this.items.push(value); }
  peek() { return this.size ? this.items[this.head] : undefined; }
  dequeue() {
    if (this.size === 0) return undefined;
    const value = this.items[this.head];
    this.items[this.head++] = undefined;
    if (this.head >= 32 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return value;
  }
}
const queue = new HeadQueue();
queue.enqueue('Ana');
queue.enqueue('Bo');
console.log(queue.dequeue());
queue.enqueue('Cy');
console.log(queue.peek(), queue.size);
console.log(queue.dequeue(), queue.dequeue());
console.log(queue.size, queue.dequeue());
for (let i = 0; i < 100; i++) queue.enqueue(i);
for (let i = 0; i < 100; i++) queue.dequeue();
console.log(queue.size, queue.items.length < 32);
```
```output
Ana
Bo 2
Bo Cy
0 undefined
0 true
```

The empty result is `undefined`; if callers enqueue `undefined`, they must inspect `size` to distinguish it from emptiness. Compaction copies only the live suffix. At that moment, the consumed prefix is at least as large as the suffix, so the copy can be charged to preceding dequeues. One dequeue can cost O(q), but a sequence has O(1) amortized cost per operation under the usual dynamic-array model.

Let q be current live size and L array length. When no compaction occurs, either head < 32, giving L < q + 32, or head < L/2, giving L < 2q. Thus retained indexed slots are O(q+32), not proportional to all historical arrivals. This describes algorithmic array storage; JavaScript does not promise immediate garbage collection or a particular backing-buffer capacity. Other references may still keep an object alive.

### A queue using two stacks

```javascript
class TwoStackQueue {
  constructor() { this.incoming = []; this.outgoing = []; }
  get size() { return this.incoming.length + this.outgoing.length; }
  prepare() {
    if (this.outgoing.length === 0) {
      while (this.incoming.length) this.outgoing.push(this.incoming.pop());
    }
  }
  enqueue(value) { this.incoming.push(value); }
  dequeue() { this.prepare(); return this.outgoing.pop(); }
  peek() { this.prepare(); return this.outgoing[this.outgoing.length - 1]; }
}
const jobs = new TwoStackQueue();
jobs.enqueue('A'); jobs.enqueue('B');
console.log(jobs.dequeue());
jobs.enqueue('C');
console.log(JSON.stringify([jobs.incoming, jobs.outgoing]));
console.log(jobs.dequeue(), jobs.dequeue(), jobs.size);
```
```output
A
[["C"],["B"]]
B C 0
```

Each value is pushed into incoming once, transferred once, and popped from outgoing once. That bounded lifetime work proves the amortized claim even though `prepare` contains a loop.

### Daily temperatures

```javascript
function warmerWaits(temperatures) {
  const waits = Array(temperatures.length).fill(0);
  const pending = [];
  for (let day = 0; day < temperatures.length; day++) {
    while (pending.length &&
           temperatures[day] > temperatures[pending[pending.length - 1]]) {
      const earlier = pending.pop();
      waits[earlier] = day - earlier;
    }
    pending.push(day);
  }
  return waits;
}
console.log(JSON.stringify(warmerWaits([68, 65, 65, 70, 69])));
console.log(JSON.stringify(warmerWaits([80, 70, 60])));
console.log(JSON.stringify(warmerWaits([])));
```
```output
[3,2,1,0,0]
[0,0,0]
[]
```

Unresolved entries retain zero. A zero means no later warmer reading, not “a warmer reading today.”

## Worked Examples

For `{[()]}`, the stack evolves `{`, `{[`, `{[(`, `{[`, `{`, empty. For `([)]`, the first closer is `)`, but the top opener is `[`. Failure occurs there, before examining the final `]`.

Here is the temperature example in full. Pending entries are indexes; compare their associated temperatures.

| Day | Reading | Indexes resolved | Pending after push | Answers written |
| --- | --- | --- | --- | --- |
| 0 | 68 | none | [0] | none |
| 1 | 65 | none | [0,1] | none |
| 2 | 65 | none | [0,1,2] | none |
| 3 | 70 | 2, 1, 0 | [3] | waits[2]=1, waits[1]=2, waits[0]=3 |
| 4 | 69 | none | [3,4] | none |

Day 3 performs three pops, but those indexes can never be popped again. A decreasing input has no pops during scanning and maximum stack size. An increasing input has frequent pops and a small stack. Both take linear total time.

## Visual Explanations

```text
Stack (top on right):      [A, B, C] --pop--> C
Queue (oldest on left):    [A, B, C] --dequeue--> A

Two-stack transfer:
incoming bottom→top [A,B,C]     outgoing []
incoming []                    outgoing bottom→top [C,B,A]
                                                        ^ next

Head-index queue:
physical slots: [undefined, undefined, C, D]
                                      ^ head = 2
logical queue:                       [C, D]
```

Cover the labels and explain where the next item comes from. The data values alone do not determine the policy; the operations do.

## Complexity Analysis

| Algorithm or operation | Time | Auxiliary storage, excluding returned answers |
| --- | --- | --- |
| Bracket scan of n characters | O(n) worst case | O(n) unmatched openers |
| Head queue enqueue/dequeue | O(1) amortized; occasional linear resize/copy | O(q+32) indexed slots |
| Two-stack queue operations | O(1) amortized; transfer can be O(q) | O(q) live entries |
| Temperature scan | Θ(n) | O(n) pending indexes |
| Temperature answer | Included in Θ(n) time | Θ(n) returned array separately |

The temperature scan has n pushes and at most n pops. Even counting the failed condition tests, there are only O(n) stack comparisons. For an uncompacted head queue, report O(H) retained slots after H historical enqueues even if q is tiny. Merely clearing slots removes retained references, not the slots themselves.

## Common Mistakes

- Matching a closer against any opener instead of the newest one accepts crossing pairs.
- Returning true after the loop without checking the stack accepts `((`.
- Using `>=` in the warmer test treats an equal temperature as warmer.
- Saving values instead of indexes loses the information needed for wait lengths.
- Transferring incoming while outgoing is nonempty places newer work ahead of older work.
- Calling every dequeue worst-case O(1) hides occasional transfers and copies.

This deliberately broken fragment belongs to the temperature algorithm:

```javascript-bug
while (pending.length && temperatures[day] >= temperatures[pending.at(-1)]) {
  const earlier = pending.pop();
  waits[earlier] = day - earlier;
}
```

It is a debugging exercise, not a runnable correct example. Two equal readings are enough to expose it.

## Interview and LeetCode Pattern Recognition

“Most recent unmatched,” nesting, undo, and expression evaluation suggest a stack. “Oldest pending,” arrival order, and levels suggest a queue. “Next greater,” “next smaller,” and distance to a future improvement suggest a monotonic stack. These clues are hypotheses: identify the exact strictness and required answer before choosing the invariant.

For Valid Parentheses, explain why counts are insufficient. For Implement Queue using Stacks, explain why transfer is conditional. For Daily Temperatures, first describe the quadratic baseline, then explain which repeated work the pending stack eliminates. A useful interview answer includes both the proof and an adversarial example, such as all-equal temperatures.

## Practice Exercises

### Conceptual Questions

1. **Conceptual:** Choose a stack or queue for nested function returns, a printer's arrival-order jobs, and nearest warmer-day queries. Explain the policy, not just the name.

### Code Tracing

2. **Tracing:** Trace `([)]` and `(()` character by character. Then trace waits for `[60,60,59,62]`.
3. **Tracing:** Enqueue A, enqueue B, dequeue, enqueue C, peek, dequeue, dequeue using two stacks. Show both arrays each time.

### Debugging Exercises

4. **Debugging:** Repair the broken comparison above. Give the smallest input that distinguishes the broken and correct versions.

### Implementation Exercises

5. **Implementation:** Add `peek` and `size` to an array-backed stack. Then design a minimum stack that returns the minimum without scanning on every query. Handle duplicate minima.
6. **Implementation:** Drain 1,000 queued objects. Compare an uncompacted head queue with the compacting version: count array length separately from live size. Do not interpret elapsed milliseconds as a proof of complexity.

### LeetCode and HackerRank Practice

7. **[Daily Temperatures](https://leetcode.com/problems/daily-temperatures/)** — Platform: LeetCode. Official difficulty: Medium. Concepts: monotonic stacks, unresolved indexes, strict comparison, amortized analysis. Why: it turns repeated forward searches into one pass and exposes equality mistakes. Before submitting, predict descending and all-equal results. This official page was verified; no HackerRank page was consulted. Follow with the syllabus tasks Valid Parentheses and Implement Queue using Stacks.

## Hints and Worked Solutions

1. Function returns require LIFO; printer jobs require FIFO. Warmer-day queries use a stack of unresolved indexes with nonincreasing temperatures. It is not a queue simply because days arrive over time.
2. `([)]` fails at `)`; `(()` leaves one `(` after the final character. Temperature waits are `[3,2,1,0]`: the equal second reading does not settle the first.
3. After the first dequeue, outgoing is `[B]` and incoming is empty. Adding C makes incoming `[C]`. Peek returns B without changing either array. Dequeues then return B and C.
4. Replace `>=` with `>`. On `[60,60]`, broken output is `[1,0]`, correct output is `[0,0]`.
5. Hint: save the minimum of every prefix alongside each pushed value. Duplicates then need no special deletion search. Here is a complete solution; the empty methods return `undefined`.

```javascript
class MinStack {
  constructor() { this.entries = []; }
  get size() { return this.entries.length; }
  push(value) {
    const minimum = this.size ? Math.min(value, this.min()) : value;
    this.entries.push({ value, minimum });
  }
  pop() { return this.entries.pop()?.value; }
  peek() { return this.entries[this.size - 1]?.value; }
  min() { return this.entries[this.size - 1]?.minimum; }
}
const stack = new MinStack();
stack.push(4); stack.push(2); stack.push(2);
console.log(stack.min(), stack.pop(), stack.min());
console.log(stack.pop(), stack.min(), stack.peek());
console.log(stack.size);
```
```output
2 2 2
2 4 4
1
```

Each operation does constant work apart from amortized array growth; storage is O(n). The extra minimum field buys fast queries.

6. An uncompacted array still has length 1,000 after draining. The shown compacting queue has fewer than 32 retained slots and zero live items. Clearing references and reclaiming actual engine memory are different observations.
7. The implemented warmer-day scan is a worked solution. Rebuild it from its invariant, then compare output on a small input with a straightforward nested-loop oracle.

## Sources and Further Reading

Consulted on 2026-11-07. The explanations, traces, and JavaScript examples here are original teaching material aligned with the repository syllabus.

- [MDN: Array.prototype.shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift) — consulted for front-removal semantics and the empty return value; it does not specify engine allocation or garbage-collection timing.
- [LeetCode: Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) — consulted the official problem description for the strictly-warmer contract and external practice. No editorial was consulted.

## Weekly Summary

A stack resolves the newest obligation; a queue serves the oldest. A monotonic stack resolves each waiting query once. The performance argument comes from total item movement, while the memory argument must examine actual retained storage. These distinctions will support recursion in [Week 8](week-08.md) and tree traversal in [Week 9](week-09.md).

## Weekly Progress Checklist

### Theory

- [ ] Explain why `([)]` is invalid despite balanced counts. <!-- checkpoint:w5-nesting-invariant -->
- [ ] Prove the monotonic scan has only O(n) total pops. <!-- checkpoint:w5-amortized-stack-proof -->

### JavaScript

- [ ] Implement and trace both queue designs without using shift. <!-- checkpoint:w5-efficient-queue-implementations -->
- [ ] Distinguish queue live size, retained slots, and retained object references. <!-- checkpoint:w5-retained-memory -->

### Practice

- [ ] Solve the equal-temperature debugging exercise and Daily Temperatures. <!-- checkpoint:w5-warmer-day-practice -->
- [ ] Implement a minimum stack that handles duplicate minima. <!-- checkpoint:w5-min-stack-practice -->

### Reflection

- [ ] Write one example where amortized and worst-case operation costs differ. <!-- checkpoint:w5-cost-reflection -->
- [ ] Explain a pattern choice aloud before looking at the code. <!-- checkpoint:w5-pattern-reflection -->
