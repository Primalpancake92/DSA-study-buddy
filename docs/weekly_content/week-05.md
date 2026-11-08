# Week 5 - Stacks and Queues
<!-- lesson-id:w5-section-chapter-introduction -->

🎬 Welcome back—let's make this idea feel familiar before we name the technique. When several jobs are waiting, which one should we handle next? This week we will build two containers that answer that question: a stack handles the newest waiting item, while a queue handles the oldest. You already use both ideas. You close the most recently opened bracket first, but serve the customer who arrived first. Undo histories, programs that read structured expressions, and visits through trees depend on these same rules. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Here's the question to keep in mind as we go: what can we safely rule out, and why? We will give those rules their usual names, LIFO and FIFO, and then build queues that avoid repeatedly moving their contents. We will also build a monotonic stack: a stack whose values stay in a particular order, allowing it to remember questions waiting for future answers. Before you run a program, trace a small input on paper. Predicting each change is how you learn to build the container yourself. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. Our aim is for you to implement both ordering policies and explain their costs. In particular, you should be able to show why a loop inside another loop can still do only linear total work, and why a queue with no waiting items might still retain array storage. We will count actual movements and retained slots rather than guessing from the shape of the program. If you can explain this aloud while tracing an example, you are ready to implement it.

Pause the video for a second and picture the exact range we are describing. Use the final checklist as a practical self-test. Tick an item when you can demonstrate it with the implementation covered, including an awkward input. In your progress logs, keep the example you tried, the mistake it revealed, and the next change you want to practice. Those small counterexamples are useful revision material. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

## Learning Objectives
<!-- lesson-id:w5-section-learning-objectives -->

- Show, by adding and removing items, how newest-first LIFO differs from oldest-first FIFO.
- Build bracket matching, both efficient queue designs, and the ordered pending stack used for warmer-day questions.
- Describe what remains true after every operation—an invariant—and use it to justify each removal.
- Account separately for the most expensive single operation, the average cost across a guaranteed sequence, the waiting items, and the array slots still retained.
- Explain why nesting, arrival-order work, and finding a later greater value suggest different containers.

## Prerequisite Knowledge
<!-- lesson-id:w5-section-prerequisite-knowledge -->

Now let's trace one small example slowly, just as we would on screen. Before starting, make sure you can find an array position, add at the end with `push`, and remove the last item with `pop`; [Arrays](week-17.md) also covers references, which let variables refer to the same object. Bring the loop and time-versus-storage reasoning from [Algorithm Complexity](week-01.md). We use sets to recognize opening symbols and maps to pair closing symbols with their openers, as introduced in [Week 2](week-02.md). Our argument that each item enters and leaves once follows the same accounting idea as [Week 4](week-04.md). Each JavaScript demonstration is independent. JSON outputs make array contents reproducible rather than relying on a console's display style. That is the kind of small check that turns a memorized recipe into a dependable method.

## Core Theory
<!-- lesson-id:w5-section-core-theory -->

### A stack stores obligations in reverse completion order

Before we code, say the rule out loud; that sentence will guide every update. Imagine entering a folder and then a subfolder. To return, you leave the subfolder before its parent: the last thing entered is the first thing left. That is **last in, first out**, abbreviated LIFO. A stack makes this rule available through three operations. `push` adds an item, `pop` removes the newest item, and `peek` lets you inspect that item without removing it. We call this accessible end the top; using an array's last position makes it convenient to implement. If you can explain this aloud while tracing an example, you are ready to implement it.

🎬 Welcome back—let's make this idea feel familiar before we name the technique. For bracket matching, we need a statement that stays true as we read: the stack contains exactly the opening brackets that have not yet been closed, in the part of the input already read. That part is called a prefix, and the statement is our invariant. A closing bracket must match the top because any older opener surrounds the still-open inner pair. In `([)]`, the `)` cannot skip over `[`, even though the total counts look right. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Here's the question to keep in mind as we go: what can we safely rule out, and why? There are two separate failure checks. A closer with an empty stack has no opener to match. An opener left after the scan has no closer. We must reject both. We also need to decide what other characters mean: this implementation ignores them, allowing arithmetic expressions. That is a deliberate rule for accepted input, rather than a property every bracket matcher must share. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. An undo feature follows the same newest-first order, but ordering is only half the design. To undo “delete three characters,” you need the deleted text and enough context to restore it. Saving only the action's name will not recover the data. When you choose a stack, you still have to design a useful record for each item. If you can explain this aloud while tracing an example, you are ready to implement it.

### A queue separates arrival from processing

Pause the video for a second and picture the exact range we are describing. Customers waiting their turn illustrate **first in, first out**, or FIFO: the earliest arrival is served first. A queue adds work at its rear and removes work at its front. We will need this ordering to visit tree levels in [Week 9](week-09.md). Notice that “queue” describes the operations and their behavior—its interface. It does not require a particular storage choice such as a JavaScript array. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Now let's trace one small example slowly, just as we would on screen. You can remove an array's first item with `shift()`, but doing that repeatedly is a poor general guarantee for a queue. Its specified behavior moves later indexed values toward the front; [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift) describes those semantics. In the ordinary array cost model, draining n items requires n + (n−1) + … + 1 work, or Θ(n²). Particular JavaScript engines may optimize particular workloads. We want a design whose reasoning remains valid without depending on that optimization. That is the kind of small check that turns a memorized recipe into a dependable method.

Before we code, say the rule out loud; that sentence will guide every update. One solution is to remember where the front is. A head index identifies the first waiting item, so the live queue is `items[head ... length)`: include head and stop before length. Removing an item advances head instead of moving the suffix. However, the array still has its old length and may still refer to removed objects. Clearing consumed slots releases this container's references. Occasionally copying the live suffix into a new array—compaction—also limits retained slots. These solve different storage problems. If you can explain this aloud while tracing an example, you are ready to implement it.

🎬 Welcome back—let's make this idea feel familiar before we name the technique. You can also build a queue from two stacks. Add arrivals to an incoming stack. When an outgoing stack has no items left, pop everything from incoming onto outgoing. For arrivals A, B, C, that transfer places A on top, ready to leave first. Wait until outgoing is empty before transferring again: its remaining items arrived before anything still in incoming. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### A monotonic stack stores unresolved questions

Here's the question to keep in mind as we go: what can we safely rule out, and why? Suppose you want each day's distance to its first strictly warmer day. Searching forward afresh for every day repeats comparisons. Instead, let unresolved days wait in a stack of indexes. The temperatures at those indexes stay **nonincreasing** from bottom to top: each is no greater than the previous one. This is the monotonic ordering we maintain. When today's temperature is greater than the top reading, today answers that waiting question. Pop it, record the distance, and check the next waiting index too. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. To see why the answer is the *first* warmer day, consider a day still waiting in the stack. Every intervening reading has already had a chance to remove it and did not. Today's successful comparison is therefore the first. Once we record that answer, no later day can improve it, so removal is safe. An equal reading must keep waiting because equal is not strictly warmer. Store indexes rather than just readings: two days may both be 65, yet have different distances to their answer. If you can explain this aloud while tracing an example, you are ready to implement it.

## JavaScript Implementations
<!-- lesson-id:w5-section-javascript-implementations -->

Pause the video for a second and picture the exact range we are describing. We will test both correct nesting and two different reasons for failure, including an unfinished opener. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Demonstration 1 — Match brackets in newest-first order

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

Now let's trace one small example slowly, just as we would on screen. In **Demonstration 1**, `x * {[2 + 3]}` pushes `{` then `[`, ignores ordinary expression characters, and removes `[` before `{`. In `([)]`, `stack.pop()` gives `[`, which does not match `)`'s required `(`, so we return false immediately. The `||` check stops as soon as its left side is true—short-circuit evaluation—so an empty stack fails before removal. Finally, `((` shows why `stack.length === 0` is still needed after the loop. The empty string has no unmatched brackets and succeeds. That is the kind of small check that turns a memorized recipe into a dependable method.

Before we code, say the rule out loud; that sentence will guide every update. We will serve Ana, Bo, and Cy in arrival order, then drain enough items to exercise storage compaction. If you can explain this aloud while tracing an example, you are ready to implement it.

### Demonstration 2 — Advance a queue head and compact consumed slots

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

🎬 Welcome back—let's make this idea feel familiar before we name the technique. In **Demonstration 2**, removing Ana reads slot zero, clears it, and advances head to one. Appending Cy leaves Bo at the front, so `peek()` returns Bo and `size` reports two. Once Bo and Cy leave, another dequeue returns `undefined`. If you allow `undefined` as real data, inspect `size` to distinguish that value from an empty queue. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

Here's the question to keep in mind as we go: what can we safely rule out, and why? Compaction copies just the live suffix when the consumed prefix is at least as large. We can charge those copies to the dequeues that created that prefix. A particular dequeue can still take O(q), where q is the live size; across a sequence, operations have O(1) **amortized** cost under the usual dynamic-array model. Amortized means a guaranteed total-cost argument across the sequence, not a claim that each operation is fast or that random inputs are likely. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. We can also justify the storage bound. Let q be current live size and L array length. Without compaction, either head < 32, giving L < q + 32, or head < L/2, giving L < 2q. Otherwise the compaction condition would have fired. Retained indexed slots are therefore O(q+32), rather than growing with every historical arrival. This counts algorithmic array storage. JavaScript does not guarantee when unreachable objects are reclaimed by garbage collection or how much backing-buffer capacity an engine keeps. An object also remains alive if another variable still references it. If you can explain this aloud while tracing an example, you are ready to implement it.

Pause the video for a second and picture the exact range we are describing. Watch how a new arrival C waits behind B even though A has already left. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Demonstration 3 — Preserve arrival order with two stacks

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

Now let's trace one small example slowly, just as we would on screen. In **Demonstration 3**, the first dequeue transfers B and then A into outgoing, making A the next pop. After C arrives, incoming is `["C"]` and outgoing is `["B"]`. `prepare()` leaves them alone because B must go first. Only after B leaves does C transfer. Each value enters incoming once, transfers once, and leaves outgoing once. That limited lifetime work proves O(1) amortized operation cost even though one call to `prepare()` may loop over many values. That is the kind of small check that turns a memorized recipe into a dependable method.

Before we code, say the rule out loud; that sentence will guide every update. We will keep unresolved day indexes so a single warmer reading can answer several waiting days. If you can explain this aloud while tracing an example, you are ready to implement it.

### Demonstration 4 — Resolve first-warmer-day distances

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

🎬 Welcome back—let's make this idea feel familiar before we name the technique. In **Demonstration 4**, readings 68, 65, 65 leave indexes 0, 1, 2 pending. Day 3's 70 removes index 2 and writes `3 - 2`, then index 1 and writes `3 - 1`, then index 0 and writes `3 - 0`. Days 3 and 4 never find a later warmer reading, so their initialized zeros remain. Zero means no later warmer day; it does not mean today answers itself. Descending input leaves every answer zero, and empty input returns an empty array. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

## Worked Examples
<!-- lesson-id:w5-section-worked-examples -->

Here's the question to keep in mind as we go: what can we safely rule out, and why? Trace `{[()]}` one character at a time: the stack becomes `{`, `{[`, `{[(`, `{[`, `{`, and finally empty. Each closer cancels just the newest opener. Now try `([)]`: after the first two characters, `[` is on top. The next character `)` asks for `(`, so failure occurs immediately, before the final `]`. You can stop there because later characters cannot repair a crossing pair. That is the kind of small check that turns a memorized recipe into a dependable method.

Let's put this on the whiteboard and watch the moving parts together. For the temperature trace, read pending entries as day indexes and look up their temperatures when comparing. The table records every answer written, so you can check both the removal order and the distance arithmetic. If you can explain this aloud while tracing an example, you are ready to implement it.

| Day | Reading | Indexes resolved | Pending after push | Answers written |
| --- | --- | --- | --- | --- |
| 0 | 68 | none | [0] | none |
| 1 | 65 | none | [0,1] | none |
| 2 | 65 | none | [0,1,2] | none |
| 3 | 70 | 2, 1, 0 | [3] | waits[2]=1, waits[1]=2, waits[0]=3 |
| 4 | 69 | none | [3,4] | none |

Pause the video for a second and picture the exact range we are describing. Day 3 does three pops, which may look expensive in isolation. But indexes 2, 1, and 0 are gone permanently: no later iteration can pay for them again. Decreasing temperatures create the largest stack and no scan-time pops; increasing temperatures cause frequent pops but keep the stack small. Both use linear total time because every index has only one arrival and at most one departure. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

## Visual Explanations
<!-- lesson-id:w5-section-visual-explanations -->

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

Now let's trace one small example slowly, just as we would on screen. Cover the operation labels and predict the next item in each drawing. Popping the stack gives C, while dequeuing gives A. In the head-index drawing, the undefined slots are storage history, not waiting jobs. The same visible values can support different policies; you need to know where additions and removals happen. That is the kind of small check that turns a memorized recipe into a dependable method.

## Complexity Analysis
<!-- lesson-id:w5-section-complexity-analysis -->

| Algorithm or operation | Time | Auxiliary storage, excluding returned answers |
| --- | --- | --- |
| Bracket scan of n characters | O(n) worst case | O(n) unmatched openers |
| Head queue enqueue/dequeue | O(1) amortized; occasional linear resize/copy | O(q+32) indexed slots |
| Two-stack queue operations | O(1) amortized; transfer can be O(q) | O(q) live entries |
| Temperature scan | Θ(n) | O(n) pending indexes |
| Temperature answer | Included in Θ(n) time | Θ(n) returned array separately |

Before we code, say the rule out loud; that sentence will guide every update. To account for the temperature loop, count n pushes and at most n successful pops. Each day also has only a bounded number of condition tests that stop its loop, so failed tests do not turn the total into quadratic work. The scan is Θ(n). Keep the storage accounting equally explicit: a head queue without compaction retains O(H) slots after H historical enqueues even when q is tiny. Clearing those slots removes references from this container, but does not shorten the array. If you can explain this aloud while tracing an example, you are ready to implement it.

## Common Mistakes
<!-- lesson-id:w5-section-common-mistakes -->

- If you search for any matching opener, `([)]` can slip through. Compare only with the newest unmatched opener.
- If you return true just because the scan finished, `((` slips through. Check for leftover openers too.
- If you use `>=`, an equal reading answers a question that explicitly asks for a warmer one. Preserve strict `>`.
- If you keep temperatures alone, you cannot recover the waiting distance or distinguish equal readings on different days. Keep indexes.
- If you transfer while outgoing still holds jobs, you put newer arrivals in front of older ones. Empty outgoing first.
- If you describe every dequeue as worst-case O(1), you hide copies and transfers. State both the single-operation bound and the amortized bound.

🎬 Welcome back—let's make this idea feel familiar before we name the technique. Use two equal temperatures to expose this deliberately broken comparison in the warmer-day algorithm. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Demonstration 1 — Broken warmer-day comparison accepts equality

```javascript-bug
while (pending.length && temperatures[day] >= temperatures[pending.at(-1)]) {
  const earlier = pending.pop();
  waits[earlier] = day - earlier;
}
```

Here's the question to keep in mind as we go: what can we safely rule out, and why? **Demonstration 1** is a broken fragment for debugging, not a complete runnable solution. With `[60,60]`, day 1 incorrectly pops day 0 because `60 >= 60` is true, writing a wait of one. The contract requires strictly warmer, so both days should keep zero. This tiny input isolates the comparison error without other readings obscuring it. That is the kind of small check that turns a memorized recipe into a dependable method.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w5-section-interview-and-leetcode-pattern-recognition -->

Let's put this on the whiteboard and watch the moving parts together. When you hear “most recent unmatched,” nested work, undo, or expression evaluation, try a stack. When you hear “oldest pending,” arrival order, or levels, try a queue. A request for the next greater or smaller value, especially its distance, suggests a monotonic stack. Treat these as starting hypotheses. Ask whether equality qualifies and whether the answer needs a value, an index, or a distance before stating what your container remembers. If you can explain this aloud while tracing an example, you are ready to implement it.

Pause the video for a second and picture the exact range we are describing. For Valid Parentheses, use `([)]` to show why counts do not prove nesting. For Implement Queue using Stacks, explain why an existing outgoing item must precede new incoming work. For Daily Temperatures, start with the simple repeated forward searches, then identify the work eliminated by keeping unresolved indexes. Support your proof with an input designed to expose a mistake—an adversarial example—such as all-equal temperatures for the strict comparison rule. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

## Practice Exercises
<!-- lesson-id:w5-section-practice-exercises -->

### Conceptual Questions

Now let's trace one small example slowly, just as we would on screen. 1. **Conceptual:** Decide how to store nested function returns, a printer's arrival-order jobs, and nearest warmer-day queries. Choose a stack or queue for each and give an operation sequence that explains your policy. That is the kind of small check that turns a memorized recipe into a dependable method.

### Code Tracing

Before we code, say the rule out loud; that sentence will guide every update. 2. **Tracing:** Read `([)]` and `(()` character by character, recording the unmatched openers and the exact point of failure. Then compute waits for `[60,60,59,62]`, recording every pending index removed.
3. **Tracing:** With two stacks, enqueue A, enqueue B, dequeue, enqueue C, peek, dequeue, and dequeue again. Draw both arrays after every operation, including operations that leave them unchanged. If you can explain this aloud while tracing an example, you are ready to implement it.

### Debugging Exercises

🎬 Welcome back—let's make this idea feel familiar before we name the technique. 4. **Debugging:** Repair **Demonstration 1** in “Common Mistakes.” Find the smallest input on which its broken comparison and your corrected comparison give different answers, and explain the contract violation. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Implementation Exercises

Here's the question to keep in mind as we go: what can we safely rule out, and why? 5. **Implementation:** Build `peek` and `size` for a stack stored in an array. Extend it into a minimum stack: a stack that can report its smallest value without scanning on every query. Make repeated equal minima work when one copy is popped.
6. **Implementation:** Enqueue and drain 1,000 objects in both an uncompacted head queue and the compacting version. Record array length and live size separately. You may observe elapsed time, but explain complexity by counting operations; one timing cannot prove a growth bound. That is the kind of small check that turns a memorized recipe into a dependable method.

### LeetCode and HackerRank Practice

Let's put this on the whiteboard and watch the moving parts together. 7. **[Daily Temperatures](https://leetcode.com/problems/daily-temperatures/)** — LeetCode lists this as Medium. Practice monotonic stacks, unresolved indexes, strict comparison, and amortized analysis by replacing repeated forward searches with one pass. Predict descending and all-equal results before submitting, then explain why each index leaves at most once. The existing chapter records prior verification of this official page and no HackerRank consultation; this prose rewrite does not reverify it. Continue with the syllabus tasks Valid Parentheses and Implement Queue using Stacks. If you can explain this aloud while tracing an example, you are ready to implement it.

## Hints and Worked Solutions
<!-- lesson-id:w5-section-hints-and-worked-solutions -->

Pause the video for a second and picture the exact range we are describing. 1. A function must finish its newest nested call first, so returns use LIFO. Printer jobs use FIFO to serve earlier arrivals first. Warmer-day queries need a stack of unresolved indexes with nonincreasing temperatures: arrival over time alone does not imply queue removal order.
2. In `([)]`, `)` meets `[` on top and fails. In `(()`, the closer removes only the newest `(`, leaving another at the end. For `[60,60,59,62]`, the answer is `[3,2,1,0]`: the second 60 cannot settle the first 60, but 62 settles all three pending days.
3. Enqueuing A and B leaves incoming `[A,B]`. Dequeuing transfers both and removes A, leaving outgoing `[B]` and incoming empty. C then enters incoming `[C]`; peek sees B without changing either array. The final dequeues remove B, then transfer and remove C.
4. Change `>=` to `>`. Two equal readings `[60,60]` are enough: the broken result is `[1,0]`, while the correct result is `[0,0]`. A single reading cannot expose the error because there is no pair to compare.
5. Keep the smallest value seen so far alongside every pushed value. That stored minimum describes the prefix ending at that entry. Popping restores the earlier entry and its minimum automatically, even with duplicates. The complete solution lets empty methods return `undefined`. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

### Demonstration 1 — Store a minimum with each stack entry

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

Now let's trace one small example slowly, just as we would on screen. In **Demonstration 1**, pushing 4, 2, 2 stores minima 4, 2, 2. Popping the newest 2 exposes another entry whose minimum is still 2. Popping that entry exposes 4, so both `min()` and `peek()` return 4. The optional access `?.value` returns `undefined` when there is no entry. Each operation does constant work apart from amortized array growth, and n entries require O(n) storage. One extra field per entry buys the fast minimum query. That is the kind of small check that turns a memorized recipe into a dependable method.

Before we code, say the rule out loud; that sentence will guide every update. 6. After draining, the uncompacted array still has length 1,000, whereas **Demonstration 2** in “JavaScript Implementations” retains fewer than 32 slots and has zero live items. Check those separately from whether references were cleared. None of those observations guarantees when the engine physically reclaims memory.
7. Rebuild **Demonstration 4** in “JavaScript Implementations” from the statement that pending indexes lack a later warmer answer. On small inputs, compare it with a simple nested-loop implementation used as an oracle—a straightforward reference answer. That independent comparison is especially useful for equality and distance errors. If you can explain this aloud while tracing an example, you are ready to implement it.

## Sources and Further Reading
<!-- lesson-id:w5-section-sources-and-further-reading -->

🎬 Welcome back—let's make this idea feel familiar before we name the technique. The chapter's existing source record dates consultation to 2026-11-07. We retain that historical record; no external links were checked anew for this rewrite. The explanations, traces, and JavaScript examples are original teaching material following the repository syllabus. Keep that picture in mind; it is the intuition that makes the formal rule easier to remember.

- [MDN: Array.prototype.shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift) — the prior consultation supports the explanation of removing the front item and returning from an empty array. It supplies no guarantee about engine allocation or garbage-collection timing.
- [LeetCode: Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) — the prior consultation used the official problem description to establish strictly warmer readings and the practice task. The record reports no editorial consultation.

## Weekly Summary
<!-- lesson-id:w5-section-weekly-summary -->

Here's the question to keep in mind as we go: what can we safely rule out, and why? You can now explain container choice by asking which waiting item may safely leave next. Stacks choose the newest, queues choose the oldest, and a monotonic stack removes a waiting query when its first qualifying answer arrives. Count total item movements to justify performance, and inspect retained storage separately to justify memory. We will use these distinctions again for suspended recursive calls in [Week 8](week-08.md) and tree traversal in [Week 9](week-09.md). That is the kind of small check that turns a memorized recipe into a dependable method.

## Weekly Progress Checklist

### Theory

- [ ] Show where `([)]` fails and explain why equal bracket counts cannot prove nesting. <!-- checkpoint:w5-nesting-invariant -->
- [ ] Account for each index's one possible pop to prove O(n) total pops in the monotonic scan. <!-- checkpoint:w5-amortized-stack-proof -->

### JavaScript

- [ ] Build both queue designs without shift and trace an arrival that occurs between removals. <!-- checkpoint:w5-efficient-queue-implementations -->
- [ ] Measure waiting items, retained array slots, and retained object references as three separate quantities. <!-- checkpoint:w5-retained-memory -->

### Practice

- [ ] Repair the equal-temperature bug and solve Daily Temperatures with a strict warmer comparison. <!-- checkpoint:w5-warmer-day-practice -->
- [ ] Build a minimum stack and show that popping one duplicate minimum preserves the other. <!-- checkpoint:w5-min-stack-practice -->

### Reflection

- [ ] Record a concrete sequence whose amortized operation cost differs from its most expensive operation. <!-- checkpoint:w5-cost-reflection -->
- [ ] Explain aloud which pending item should leave next before consulting an implementation. <!-- checkpoint:w5-pattern-reflection -->
