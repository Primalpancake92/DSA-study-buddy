# Week 7 - Linked Lists
<!-- lesson-id:w7-section-chapter-introduction -->

Imagine a sequence in which each item tells you where the next item lives. That is a linked list. Each item is a node—an object containing a value and a reference to the next object. This week we will use lists to practice inserting, removing, and rearranging items without losing access to the rest. That care with references also prepares you for trees and other connected structures.

First we will follow links to understand how a list differs from an array. Then we will reverse those links, join two sorted chains using a temporary starting node, and detect a chain that loops back on itself. Finally, we will combine midpoint finding, reversal, and alternating links to reorder a list. Each stage has a small, explainable job.

By the end, you should be able to draw the references before each change and handle a list with no first node. You will distinguish two equal values from two references to the very same object. You will also be able to challenge a constant-time claim by asking whether it includes the time needed to find the node being changed.

Use the final checklist after drawing the operations and implementing them yourself. Keep the smallest examples of reference errors in your progress logs. A three-node drawing showing exactly where a link was lost is often more useful than a long description of a failed test.

## Learning Objectives
<!-- lesson-id:w7-section-learning-objectives -->

- Represent a one-way chain of node objects, ending with `null` to mean there is no successor.
- Reverse the arrows while keeping a saved route to every unprocessed node.
- Merge sorted chains that share no objects, using a temporary predecessor to simplify the first attachment.
- Explain how references moving at different speeds can reveal a cycle or locate a midpoint.
- Reorder existing links so every original node appears exactly once, without replacing its value.
- Count walking through the chain separately from changing links and from arrays allocated by teaching helpers.

## Prerequisite Knowledge
<!-- lesson-id:w7-section-prerequisite-knowledge -->

Review loops and variables that refer to objects, plus the different-speed pointers in [Week 3](week-03.md). The ordering policies in [Week 5](week-05.md) also remind us to distinguish what operations promise from how data is stored. In JavaScript, assigning one object variable to another copies a reference, not the object itself. Unless we deliberately construct a cycle, inputs here are finite, acyclic singly linked lists: they have a limited number of nodes, never loop back, and provide only a forward link.

## Core Theory
<!-- lesson-id:w7-section-core-theory -->

### Follow references, not positions

An array lets you ask directly for an element by index. A list instead lets you ask a node for its successor. We store data in `value` and that successor reference in `next`. The **head** is a reference to the first node; `null` means there is no node, either at the end or as the head of an empty list. To reach the fifth node, start at the first and follow four links. This representation provides no built-in constant-time jump to an arbitrary index.

Two objects can both contain 7 without being the same node. **Identity** asks whether two references point to the same object; value equality asks whether the objects hold equal data. A cycle means revisiting an object, not merely seeing a repeated value, so cycle detection needs identity. Reversal must preserve identity too: we change the existing objects' links rather than creating replacement nodes with matching values.

If you already hold a reference to a node, inserting after it takes constant work. Point the new node to the old successor, then point the known node to the new node. To remove its successor, bypass that successor with one link change. However, finding this predecessor—the node immediately before the change—can take O(n). With only head, a singly linked list cannot generally delete its tail in O(1). Whenever you quote a cost, say which references are already available and whether the search for them is included.

### Reversal has two regions

Split your mental picture into two regions. `previous` heads the already reversed beginning, called a prefix; `current` heads the untouched remainder, called a suffix. Initially previous is null and current is the original head. Before changing `current.next`, save it. That reference is your only guaranteed route to the untouched remainder. Now point current back toward previous, move previous onto current, and advance current to the saved successor. The order of these assignments is part of the algorithm.

After one iteration, one more original object belongs to the reversed region and one fewer remains untouched. This invariant explains why every node is retained without copying. When current reaches null, there is no remainder and previous heads the entire reversed list. The original head is now the tail and points to null, so returning it would expose only that final node.

### A dummy node removes the first-node special case

To merge two sorted lists, repeatedly attach the smaller current head to your output. The first attachment seems special because there is no previous output node. A **dummy node**, also called a sentinel, supplies that temporary predecessor. Tail starts there and always moves to the final attached node. Return `dummy.next` so the temporary node never becomes user data. [Stanford's linked-list section](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1224/section/section7/) discusses this same simplifying idea.

Our merge invariant says the completed prefix is sorted and no remaining value is smaller than its last value. Because each remaining input chain is sorted, its head is its smallest value; choosing the smaller head is therefore safe. When one input runs out, the other suffix can be attached whole.

This implementation reuses nodes, so merging changes input links. The inputs must be **disjoint**, meaning they share no node objects. A shared suffix can make rewiring introduce a cycle. If callers need independent unchanged originals, use copied nodes instead and account for their storage. Equal values are fine; shared identities are the concern.

### Slow and fast references compare positions through motion

For cycle detection, let slow move one link per iteration and fast move two. Without a cycle, fast eventually reaches the end. Check both fast and `fast.next` before taking two steps so neither access dereferences null. With a cycle, both references eventually travel around the same loop. Fast gains one position per iteration relative to slow. Thinking of positions wrapping around after the cycle length—arithmetic modulo that length—shows that the gap must eventually become zero and the references must meet.

Test for a meeting after movement. Both references start at head, so testing immediately would incorrectly declare every nonempty list cyclic. Use `slow === fast` to compare objects. Comparing `slow.value` and `fast.value` would confuse repeated data with revisiting the same node.

The same speed difference finds a midpoint when the list has no cycle. By the time fast reaches the end, slow has traveled roughly half as far. An even-length list has two plausible middle nodes, so initialization and stopping conditions determine which you get. For reordering, we deliberately stop slow at the last node of the first half, giving us the place to cut the chain.

### Reordering combines smaller operations

To turn `a,b,c,d,e` into `a,e,b,d,c`, first cut at the midpoint, then reverse the second half, then weave the two chains by taking one node from each. Cutting means setting the first half's last `next` to null. Without that assignment, an old cross-half link can survive and form a cycle. During weaving, save both successors before changing either arrow so both unprocessed chains remain reachable.

Practice explaining these stages separately. After splitting, the chains share no nodes or links. After reversing, the second chain is ready in the required outer-to-inner order. During weaving, the completed prefix alternates between the two halves. Keeping one small invariant per stage makes it easier to locate a reference mistake than trying to reason about a single complicated loop.

## JavaScript Implementations
<!-- lesson-id:w7-section-javascript-implementations -->

We will construct a three-node chain, reverse its existing links, and inspect what happened to the original head.

### Demonstration 1 — Reverse a list without replacing nodes

```javascript
class Node {
  constructor(value, next = null) { this.value = value; this.next = next; }
}
function fromArray(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = new Node(values[i], head);
  return head;
}
function toArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) values.push(node.value);
  return values;
}
function reverseList(head) {
  let previous = null, current = head;
  while (current !== null) {
    const next = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }
  return previous;
}
const originalHead = fromArray([6, 2, 9]);
const reversed = reverseList(originalHead);
console.log(JSON.stringify(toArray(reversed)));
console.log(originalHead.value, originalHead.next);
console.log(reverseList(null));
```
```output
[9,2,6]
6 null
null
```

In **Demonstration 1**, the first node holds 6. The first reversal step saves the node holding 2, then points 6 to null. The next two steps place 2 and then 9 in front, producing `[9,2,6]`. `originalHead` still refers to the same 6 node, now with a null successor. `fromArray` and `toArray` make examples easy to inspect but allocate O(n) storage, separate from reversal's O(1) working memory. Both helpers expect acyclic chains; `toArray` would never reach null on a cycle.

We will reuse nodes from two sorted, disjoint chains and give equal values a consistent attachment order.

### Demonstration 2 — Merge sorted chains behind a temporary predecessor

```javascript
function fromArray(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = { value: values[i], next: head };
  return head;
}
function toArray(head) {
  const result = [];
  for (; head !== null; head = head.next) result.push(head.value);
  return result;
}
function mergeSorted(a, b) {
  const dummy = { next: null };
  let tail = dummy;
  while (a !== null && b !== null) {
    if (a.value <= b.value) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}
console.log(JSON.stringify(toArray(mergeSorted(fromArray([1,4,7]), fromArray([2,4,8])))));
console.log(JSON.stringify(toArray(mergeSorted(null, fromArray([3])))));
console.log(mergeSorted(null, null));
```
```output
[1,2,4,4,7,8]
[3]
null
```

In **Demonstration 2**, attach 1 from a, 2 from b, then the 4 from a before the 4 from b because `<=` gives the left input the tie. Each input retains its internal order. After every attachment, `tail = tail.next` advances the place where the next node will join. Without that line, later assignments would overwrite the same link. When a ends after 7, `a ?? b` attaches b's remaining 8; `??` selects b only when a is null or undefined.

We will distinguish two equal-valued objects from a genuine return to the same object, including a one-node loop.

### Demonstration 3 — Detect a cycle with slow and fast references

```javascript
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
const a = { value: 7, next: null };
const b = { value: 7, next: null };
a.next = b;
console.log(hasCycle(a));
b.next = a;
console.log(hasCycle(a));
console.log(hasCycle(null));
const self = { value: 1, next: null };
self.next = self;
console.log(hasCycle(self));
```
```output
false
true
false
true
```

In **Demonstration 3**, a and b both hold 7, yet the first call returns false because b ends at null. Assigning `b.next = a` creates an actual cycle and the next call returns true. A null head returns false without movement. The self-loop makes slow and fast meet after one iteration, testing the smallest cycle. We deliberately avoid conversion helpers on cyclic input because those helpers expect to reach an end.

We will reorder odd and even chains by cutting them into independent halves before reversing and weaving.

### Demonstration 4 — Reorder existing nodes through three stages

```javascript
function fromArray(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = { value: values[i], next: head };
  return head;
}
function toArray(head) {
  const values = [];
  for (; head !== null; head = head.next) values.push(head.value);
  return values;
}
function reorderList(head) {
  if (head === null || head.next === null) return head;
  let slow = head, fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let current = slow.next;
  slow.next = null;
  let second = null;
  while (current !== null) {
    const next = current.next;
    current.next = second;
    second = current;
    current = next;
  }
  let first = head;
  while (second !== null) {
    const nextFirst = first.next, nextSecond = second.next;
    first.next = second;
    second.next = nextFirst;
    first = nextFirst;
    second = nextSecond;
  }
  return head;
}
console.log(JSON.stringify(toArray(reorderList(fromArray([1,2,3,4,5])))));
console.log(JSON.stringify(toArray(reorderList(fromArray([1,2,3,4])))));
console.log(JSON.stringify(toArray(reorderList(fromArray([1])))));
console.log(reorderList(null));
```
```output
[1,5,2,4,3]
[1,4,2,3]
[1]
null
```

In **Demonstration 4**, `[1,2,3,4,5]` leaves slow at 3. Saving `slow.next` preserves 4 before `slow.next = null` cuts the chain. Reversing gives a second half `[5,4]`; weaving joins 1 to 5 to 2, then 2 to 4 to 3. The first half has at least as many nodes, so every second-half node has a partner. For odd length, the extra first-half node stays at the end. Only links change; node objects and their values are preserved.

## Worked Examples
<!-- lesson-id:w7-section-worked-examples -->

Give the objects names A, B, and C and let them hold 6, 2, and 9. Now follow the saved successor and the two region heads through each reversal step.

| Iteration | Saved next | Reversed prefix after update | Remaining suffix |
| --- | --- | --- | --- |
| 1 | B | A→null | B→C→null |
| 2 | C | B→A→null | C→null |
| 3 | null | C→B→A→null | empty |

A, B, and C identify objects, while the numbers in parentheses are their payloads—the data carried by each node. The reasoning would be unchanged if all three payloads were 7. Drawing object identities prevents equal values from hiding a lost or repeated node.

Merge `[1,4,7]` with `[2,4,8]` by comparing current heads. Attach 1 from A, then 2 from B, then 4 from A because ties go left, then 4 from B, then 7 from A. Now A is empty. Attach B's remaining 8 in one assignment rather than another comparison loop. Returning the link after the dummy keeps that temporary node out of the answer.

For `A→B→C→D→B`, start both references at A and record pairs after movement: `(B,C)`, `(C,B)`, then `(D,D)`. They meet at D, although the loop begins at B. That is enough for a boolean yes/no cycle test. Do not return the meeting node as though it identified the entry; finding the entry is a separate problem.

Trace reordering `[1,2,3,4,5]` as three transformations. Slow stops at 3, so cutting gives `[1,2,3]` and `[4,5]`. Reversing the latter gives `[5,4]`. Weaving first makes 1→5→2, then 2→4→3. At each attachment, the saved next references tell you where to resume even though the original forward arrows have been overwritten.

## Visual Explanations
<!-- lesson-id:w7-section-visual-explanations -->

```text
Before reversal step:
previous -> B -> A -> null       current -> C -> D -> null
                                                ^ save D first
After step:
previous -> C -> B -> A -> null  current -> D -> null

Dummy merge:
dummy -> sorted prefix -> tail       a -> remaining A
                                     b -> remaining B

Reorder:
1 -> 2 -> 3 -> null       5 -> 4 -> null
1 -> 5 -> 2 -> 4 -> 3 -> null
```

When a reference error is hard to see, draw the state immediately after each assignment, including local variables. A drawing of only the desired final list cannot tell you which intermediate assignment lost the suffix. Ask whether every unprocessed node is still reachable from at least one saved reference.

## Complexity Analysis
<!-- lesson-id:w7-section-complexity-analysis -->

| Operation | Time | Auxiliary space |
| --- | --- | --- |
| Reach index i | O(i+1) | O(1) |
| Insert after a known node | O(1) | O(1), including one new node |
| Iterative reversal of n nodes | Θ(n) | O(1) |
| Merge lengths a and b | O(a+b) | O(1), reusing existing nodes |
| Detect cycle with prefix μ and cycle length λ | O(μ+λ) | O(1) |
| Reorder n nodes | Θ(n) | O(1) |
| Convert n nodes to an array | Θ(n) | Θ(n) returned output |

In the cycle bound, μ counts nodes before the loop and λ counts nodes around it. Once both references are in the cycle, Floyd's test meets within at most λ further iterations; an acyclic chain takes O(n) time. Reordering makes three linear passes one after another, so you add their costs and still get linear time. You would multiply only for work repeated inside other work. Recursive reversal would retain O(n) waiting function calls and may exceed JavaScript's call-stack limit; iterative reversal keeps only a fixed number of references.

## Common Mistakes
<!-- lesson-id:w7-section-common-mistakes -->

- Save the original successor before overwriting `next`; afterwards that field leads backward.
- Return the new head after reversal. The old head now exposes only the tail.
- Compare node identities for cycles so repeated values do not create false positives.
- Return the node after the dummy, keeping the temporary predecessor out of the data.
- Advance tail after each merge attachment so the next choice extends the prefix rather than replaces it.
- Cut the reorder halves apart before weaving; old cross-links can create cycles.
- Tell callers that merge changes existing links. Reusing nodes does not preserve independent original chains.

This deliberately broken reversal fragment saves its route forward too late. Trace it with at least two nodes.

### Demonstration 1 — Broken reversal overwrites the saved route

```javascript-bug
current.next = previous;
const next = current.next;
previous = current;
current = next;
```

In broken **Demonstration 1**, take `A→B→null` with previous null and current A. The first assignment changes A's next to null. The next line therefore saves null rather than B. After current becomes null, the loop would stop, abandoning B. Moving the save before the overwrite preserves the original forward route.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w7-section-interview-and-leetcode-pattern-recognition -->

Prompts about changing links, constant extra space, sorted-list merging, or cycles ask you to reason about references. Before coding, ask whether you may reuse nodes and whether inputs can share them. For Reorder List, explain midpoint, reverse, and weave as separate stages. That decomposition lets you justify each change without inventing one large loop whose intermediate structure is hard to describe.

Choose the representation according to access needs. Frequent indexed reads usually favor an array. A prompt that already supplies a predecessor reference and requests a nearby insertion may favor a list. Before claiming O(1), state exactly which node you can already reach without walking from head.

## Practice Exercises
<!-- lesson-id:w7-section-practice-exercises -->

### Conceptual Questions

1. Compare inserting after a node you already hold with inserting before a requested value. Explain the O(1) versus possible O(n) costs, and decide what the request means if that value occurs twice.
2. Draw two different objects containing 7. Explain what extra reference relationship, beyond equal values, would be needed to establish a cycle.

### Code Tracing

3. Reverse `A→B→C` on paper. Record previous, current, and next after each individual assignment so the save-before-overwrite requirement is visible.
4. Trace slow and fast through a self-loop and a four-node chain ending at null. Then separately trace the reorder midpoint: explain how its different stopping rule changes the final slow position.

### Debugging Exercises

5. Repair **Demonstration 1** in “Common Mistakes,” showing which successor is preserved. Then remove merge's tail update on paper and show which attachment gets overwritten.
6. On paper, omit the assignment that cuts the reorder halves apart. Follow an old cross-half arrow and identify how it can corrupt the woven result.

### Implementation Exercises

7. Implement `removeAll(head,target)` with a dummy predecessor and reuse every surviving node. Test consecutive matches at the beginning and end, plus input in which every node matches.
8. Rebuild merge and reorder from the statements each stage preserves. Check original object identities as well as values; equal payloads must not hide missing or duplicated nodes.

### LeetCode and HackerRank Practice

9. **[Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/)** — LeetCode lists this as Easy. Practice changing references, iteration, and empty lists. It isolates saving a successor before overwriting a link, making the reversal contract easy to check directly. The prior chapter record reports verification of only this LeetCode link and no HackerRank consultation; this rewrite does not repeat that verification. Continue with the syllabus titles Linked List Cycle and Reorder List after completing the local exercises.

## Hints and Worked Solutions
<!-- lesson-id:w7-section-hints-and-worked-solutions -->

1. Given predecessor and successor, changing their local links takes constant work. Searching for a value may still visit every node. If values repeat, specify whether insertion is before the first match or before all matches; value alone does not name a unique object.
2. Identity concerns the object carrying a payload. **Demonstration 3** in “JavaScript Implementations” has two 7s but returns false until b links back to a. That backward reference, not the repeated number, creates the cycle.
3. Use the table in “Worked Examples” to check your drawing. Every saved successor must come from the original forward arrow before you mutate that field. A later save cannot recover an overwritten reference.
4. A self-loop meets after one iteration. On A,B,C,D ending at null, cycle detection moves to `(B,C)` and then `(C,null)` before stopping. Reorder's midpoint loop instead stops at B, allowing an even split into A,B and C,D.
5. Save next before assigning `current.next`. In merge, failing to advance tail leaves it at the dummy, so later choices keep overwriting `dummy.next` and discard the previously attached prefix.
6. On four nodes, leaving the original 2→3 link during weaving can eventually create a self-link at 3. Cutting first removes the old connection so the two working chains are genuinely disjoint.
7. Keep the predecessor still when you remove its successor, because its new successor also needs checking. Advance only after keeping a node. A dummy applies this same rule to matches at the original head.

### Demonstration 1 — Remove every matching node with one predecessor

```javascript
function removeAll(head, target) {
  const dummy = { next: head };
  let previous = dummy;
  while (previous.next !== null) {
    if (previous.next.value === target) previous.next = previous.next.next;
    else previous = previous.next;
  }
  return dummy.next;
}
function make(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = { value: values[i], next: head };
  return head;
}
function read(head) {
  const result = [];
  for (; head !== null; head = head.next) result.push(head.value);
  return result;
}
console.log(JSON.stringify(read(removeAll(make([2,2,1,2,3,2]), 2))));
console.log(removeAll(make([2,2]), 2));
console.log(removeAll(null, 2));
```
```output
[1,3]
null
null
```

In **Demonstration 1**, `[2,2,1,2,3,2]` starts with previous at the dummy. Removing the first 2 leaves previous there, ready to remove the second 2. Keeping 1 advances previous; later 2s are bypassed the same way, leaving `[1,3]`. Every iteration removes a node from consideration or advances beyond one, giving O(n) time and O(1) working space. An outside variable may still refer to a removed node. Removal changes chain membership; it does not promise immediate garbage collection.

8. Before mutation, collect input objects in a Set. Afterwards, use another Set while traversing: reject repeated identities and compare the surviving objects with the expected originals. The test uses O(n) memory, but that does not change the algorithm's O(1) working-space claim. Measurement helpers and the operation being measured have separate costs.
9. Use **Demonstration 1** in “JavaScript Implementations” as the worked reversal solution. Adapt the `value` field name if the platform supplies a different one. When the task asks to reverse links, constructing a new chain with reversed values does not satisfy the same object-preservation contract.

## Sources and Further Reading
<!-- lesson-id:w7-section-sources-and-further-reading -->

The existing source record dates consultation to 2026-11-07. We preserve that attribution without claiming a fresh external-link check during this rewrite. The explanations and examples are original material following the repository syllabus.

- [Stanford CS106B: Linked Lists section](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1224/section/section7/) — the prior reading used this archived section for reasoning about linked nodes and dummy-node exercises. Translate the ideas rather than treating its language-specific memory management as JavaScript requirements.
- [LeetCode: Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) — the prior reading established the official statement, difficulty, and empty-input example used for practice. The record reports no editorial consultation.

## Weekly Summary
<!-- lesson-id:w7-section-weekly-summary -->

You can now reason about list changes by saving your route forward, changing one arrow, and only then advancing. Dummy nodes let head changes follow the same rules as other local changes. Different-speed references use motion and object identity rather than payload equality. Splitting reorder into stages keeps those obligations manageable. In [Week 8](week-08.md), the same careful state tracking will help you understand waiting function calls and arrays shared between calls.

## Weekly Progress Checklist

### Theory

- [ ] Distinguish object identity from equal data and count the links needed to reach an index. <!-- checkpoint:w7-identity-and-access -->
- [ ] Explain how the changing relative gap forces slow and fast to meet within a cycle. <!-- checkpoint:w7-cycle-proof -->

### JavaScript

- [ ] Reverse existing links and verify that every original object is still present. <!-- checkpoint:w7-reversal-implementation -->
- [ ] Merge disjoint sorted inputs using a temporary predecessor and an advancing tail. <!-- checkpoint:w7-dummy-merge -->

### Practice

- [ ] Remove all matching nodes, including consecutive matches that change the head. <!-- checkpoint:w7-removal-practice -->
- [ ] Reorder both even and odd chains and test that no node loops back accidentally. <!-- checkpoint:w7-reorder-practice -->

### Reflection

- [ ] Draw each assignment of a bug that loses access to an unprocessed node. <!-- checkpoint:w7-reference-reflection -->
- [ ] Explain which inputs are mutated and distinguish helper storage from algorithm working memory. <!-- checkpoint:w7-contract-reflection -->
