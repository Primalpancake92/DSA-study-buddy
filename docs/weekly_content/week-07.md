# Week 7 - Linked Lists

This week, you will be learning linked lists: sequences built from nodes that point to other nodes. They make insertion, removal, and reordering into concrete exercises in preserving references, a useful foundation for trees and other connected structures.

We will start by following a list, then reverse its arrows, merge sorted chains with a dummy node, detect cycles, and combine midpoint finding with reversal to reorder a list.

By the end, you will be able to draw each reference before changing it, handle an empty head, distinguish node identity from equal values, and explain when a supposedly constant-time operation still requires a linear search.

There will be a checklist at the end to help you track your progress. Tick it after drawing and implementing the operations yourself, and keep your smallest pointer-bug examples in your progress logs.

## Learning Objectives

- Represent a singly linked list with objects and a terminating `null` reference.
- Reverse links without losing the unprocessed suffix.
- Merge two disjoint sorted chains with a sentinel node.
- Use slow/fast references for cycle detection and midpoint discovery.
- Reorder a list in place while preserving every original node exactly once.
- Separate traversal cost, rewiring cost, and demonstration-helper allocations.

## Prerequisite Knowledge

Review object references and loops, and revisit slow/fast pointers in [Week 3](week-03.md). LIFO/FIFO from [Week 5](week-05.md) helps distinguish an ordering interface from its storage representation. JavaScript variables hold references to objects: assigning one variable to another does not clone the node. Unless explicitly constructing a cycle, all examples assume finite acyclic singly linked lists.

## Core Theory

### Follow references, not positions

An array gives an index-to-element relationship. A list gives a node-to-next-node relationship. Each node stores `value` and `next`; head points at the first node, and `null` marks the end. The empty list is simply a null head. To reach the fifth node, follow four links from the first. There is no built-in constant-time indexed access.

Two nodes containing 7 can be different objects. Identity answers “is this the same node?” while value equality answers “do these nodes contain equal data?” Cycle detection needs identity. Reversal also preserves identities: the same objects remain, but their links change.

Inserting after a known node is constant work: point the new node at the old successor, then point the predecessor at the new node. Removing its successor is constant work by bypassing it. Finding the predecessor may take O(n). A singly linked list cannot generally delete its tail in O(1) when only head is available. Data-structure claims must include what references the caller already possesses.

### Reversal has two regions

Maintain a reversed prefix headed by previous and an untouched suffix headed by current. Initially the prefix is empty and the suffix is the whole list. Save `current.next` before overwriting it; that saved reference is your route back to the suffix. Then turn current's arrow toward previous, move previous to current, and move current to the saved successor.

After each iteration, the reversed region grows by one node and the untouched region shrinks by one. No node is copied or discarded. When current becomes null, previous heads the entire reversed chain. Returning the original head would return the new tail, which now points to null.

### A dummy node removes the first-node special case

To merge sorted lists, repeatedly attach the smaller current head to a growing result. A dummy node provides a predecessor even before the first real output node exists. Tail always points at the final attached node; the answer starts at `dummy.next`, not at dummy itself. This sentinel idea is also discussed in [Stanford's linked-list section](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1224/section/section7/).

The merge invariant says the completed prefix is sorted, and every remaining value is at least its last value. The smaller current head is safe because each input suffix is already sorted. Once one input empties, attach the entire other suffix. This implementation reuses nodes and changes their links. Inputs must be disjoint: shared suffixes could make rewiring create cycles. Use copied nodes if callers need independent original lists.

### Slow and fast references compare positions through motion

For cycle detection, slow moves one edge and fast moves two. If there is no cycle, fast eventually reaches null. Check both fast and `fast.next` before taking two steps. If a cycle exists, both pointers eventually circulate inside it. Their relative position changes by one modulo the cycle length each iteration, so they must meet.

The meeting must be tested after moving. Both pointers begin at head; testing before moving would falsely claim every nonempty list is cyclic. The equality test is `slow === fast`, not equality of values.

For finding a midpoint in an acyclic list, the same speed difference is useful: when fast reaches the end, slow has covered roughly half the nodes. Which middle you choose for an even-length list depends on initialization and loop conditions. Our reorder algorithm intentionally leaves slow at the end of the first half.

### Reordering combines smaller operations

To transform `a,b,c,d,e` into `a,e,b,d,c`, split at the midpoint, reverse the second half, then weave the two chains. Splitting is essential: without setting the first half's last `next` to null, old links may remain and form a cycle. During weaving, save both next references before overwriting either arrow.

This decomposition is worth practicing. A difficult-looking pointer task often becomes manageable when each stage has one simple invariant: disjoint halves, reversed second half, then alternating prefix.

## JavaScript Implementations

### Construct, inspect, and reverse

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

The conversion helpers are for demonstration and require acyclic lists. Do not use `toArray` on a cycle: it will never reach null. Their O(n) allocations are separate from the reversal's O(1) working memory.

### Merge two sorted lists using a dummy

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

Choosing the left input on equal values gives a deterministic tie rule and preserves each input's internal order. Updating tail is not optional: without it, every assignment overwrites the same link.

### Floyd's cycle test

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

The first two equal values demonstrate why comparing contents is insufficient. The self-loop tests the smallest possible cycle without invoking a traversal helper that expects termination.

### Split, reverse, and weave

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

The first half has at least as many nodes as the second, so a first-half node exists for every weave iteration. For odd length, the final first-half node remains at the end. The algorithm changes links, not values.

## Worked Examples

Reversing nodes A(6), B(2), C(9):

| Iteration | Saved next | Reversed prefix after update | Remaining suffix |
| --- | --- | --- | --- |
| 1 | B | A→null | B→C→null |
| 2 | C | B→A→null | C→null |
| 3 | null | C→B→A→null | empty |

The node labels identify objects; values in parentheses are merely payloads. This drawing still works if all three values are equal.

Merging `[1,4,7]` and `[2,4,8]` attaches 1 from A, 2 from B, 4 from A, 4 from B, then 7 from A. A is now empty, so the remaining B node 8 is attached in one assignment. The dummy never enters the output.

For a cycle `A→B→C→D→B`, the slow/fast pairs after movement are `(B,C)`, `(C,B)`, `(D,D)`. They meet inside the cycle, not necessarily at its entry. This test returns a boolean; locating the entry is a separate problem.

For reorder `[1,2,3,4,5]`, slow stops at 3. Cut into `[1,2,3]` and `[4,5]`, reverse the latter to `[5,4]`, then weave 1→5→2 and 2→4→3. Saving next references is what allows each stage to continue after rewriting links.

## Visual Explanations

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

When a pointer bug is confusing, draw the arrows immediately after each assignment. Drawing only the final desired list can hide the moment the suffix was lost.

## Complexity Analysis

| Operation | Time | Auxiliary space |
| --- | --- | --- |
| Reach index i | O(i+1) | O(1) |
| Insert after a known node | O(1) | O(1), including one new node |
| Iterative reversal of n nodes | Θ(n) | O(1) |
| Merge lengths a and b | O(a+b) | O(1), reusing existing nodes |
| Detect cycle with prefix μ and cycle length λ | O(μ+λ) | O(1) |
| Reorder n nodes | Θ(n) | O(1) |
| Convert n nodes to an array | Θ(n) | Θ(n) returned output |

Floyd's test uses O(n) time on an acyclic chain. In a cyclic list, after entering the cycle it needs at most λ further iterations to meet. Reordering uses three linear passes; adding them gives linear time, not cubic time. Recursive reversal would use O(n) call-stack space and can exceed JavaScript's stack limit. The iterative version avoids that risk.

## Common Mistakes

- Saving the successor after overwriting `next` loses the original successor.
- Returning the old head after reversal returns the tail.
- Comparing values in cycle detection falsely treats equal-valued nodes as identical.
- Omitting the dummy-to-real-head step returns a node that was never input data.
- Forgetting `tail = tail.next` repeatedly replaces the first output link.
- Reordering without severing the halves may leave a cycle.
- Assuming merge preserves the original input chains ignores its mutation contract.

```javascript-bug
current.next = previous;
const next = current.next;
previous = current;
current = next;
```

This fragment saves the new backward link, not the old forward link. On the first step previous is null, so it abandons the remaining list immediately.

## Interview and LeetCode Pattern Recognition

“Change links,” “constant extra space,” “merge sorted lists,” and “cycle” point toward reference algorithms. Ask whether nodes may be reused and whether input lists can share nodes. For Reorder List, recognizing a midpoint plus reversal plus weave is more useful than improvising a single complicated loop.

If a prompt asks only for frequent indexed reads, an array is usually a better fit. If it gives a predecessor reference and asks for local insertion, a list may be convenient. Explain the available references before quoting O(1).

## Practice Exercises

### Conceptual Questions

1. Why is inserting after a known node O(1), but inserting before a value may take O(n)? What changes if the value occurs twice?
2. Explain why two nodes with value 7 do not prove a cycle.

### Code Tracing

3. Reverse `A→B→C` on paper, recording previous/current/next after each assignment.
4. Trace slow and fast on a self-loop and on a four-node acyclic list. Trace the reorder midpoint separately; its stopping rule differs.

### Debugging Exercises

5. Repair the broken reversal fragment. Then explain the effect of omitting the tail update from merge.
6. Remove the split assignment from the reorder algorithm on paper. Identify an old arrow that can corrupt the woven result.

### Implementation Exercises

7. Write `removeAll(head,target)` using a dummy node. Reuse surviving nodes; handle repeated matching nodes at the beginning and end.
8. Rebuild merge and reorder from their invariants. Check node identities as well as output values so lost or duplicated nodes cannot hide behind duplicates.

### LeetCode and HackerRank Practice

9. **[Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/)** — Platform: LeetCode. Official difficulty: Easy. Concepts: reference rewiring, iteration, empty lists. Why: it isolates the save-before-overwrite habit and gives a direct check of the reversal contract. Only this LeetCode link was verified for this chapter; no HackerRank page was consulted. Continue with the syllabus titles Linked List Cycle and Reorder List after the local exercises.

## Hints and Worked Solutions

1. Rewiring needs only the predecessor and successor. Searching for the requested value still scans nodes; duplicate values require a stated “first” or “all” policy.
2. Identity is about the object, not its payload. The cycle demonstration contains two 7s and correctly returns false until a backward link is added.
3. The reversal trace above is the solution. Each saved successor must come from the original forward arrow before mutation.
4. A self-loop meets after one iteration. On four acyclic nodes A,B,C,D, the cycle test moves to `(B,C)`, then `(C,null)` and stops. The reorder midpoint instead stops at B, splitting the list evenly.
5. Save next before assigning `current.next`. Without advancing merge's tail, later choices overwrite `dummy.next`, losing the earlier output prefix.
6. On four nodes, leaving the old 2→3 link while weaving the reversed second half can eventually produce a self-link at 3. Splitting creates genuinely disjoint chains before weaving.
7. Hint: predecessor should advance only when you keep its successor. Here is the complete implementation.

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

Every iteration removes a node from consideration or advances past one, giving O(n) time and O(1) working space. Removed nodes can still exist if some outside variable references them; removal is a structural operation, not a promise about garbage collection.

8. Record input node objects in a Set before mutation. Afterwards, traverse with a second Set, rejecting repeated identities and checking that exactly the expected originals remain. That test uses O(n) memory, but does not change the algorithm's O(1) working-space claim.
9. The iterative reversal above is the worked solution. Adapt `value` to the platform's provided field name if necessary; do not rebuild the input into new nodes when asked to reverse links.

## Sources and Further Reading

Consulted on 2026-11-07. Original explanations and examples follow the repository syllabus.

- [Stanford CS106B: Linked Lists section](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1224/section/section7/) — consulted the archived section for linked-node reasoning and dummy-node exercises. Its language-specific memory-management examples are not JavaScript requirements.
- [LeetCode: Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) — read the official statement, difficulty, and empty-input example. No editorial was consulted.

## Weekly Summary

Lists reward careful sequencing: save the route forward, change an arrow, then advance. Dummy nodes unify head changes with ordinary changes. Slow/fast references exploit movement rather than value equality. Reorder problems become simpler when split into independently understandable stages. In [Week 8](week-08.md), the same discipline will help you track suspended calls and shared mutable state.

## Weekly Progress Checklist

### Theory

- [ ] Explain node identity and the cost of reaching an indexed position. <!-- checkpoint:w7-identity-and-access -->
- [ ] Explain why slow and fast must meet inside a cycle. <!-- checkpoint:w7-cycle-proof -->

### JavaScript

- [ ] Reverse a list while preserving every original node. <!-- checkpoint:w7-reversal-implementation -->
- [ ] Merge disjoint sorted lists with a dummy and moving tail. <!-- checkpoint:w7-dummy-merge -->

### Practice

- [ ] Implement removal of all matching nodes and test head changes. <!-- checkpoint:w7-removal-practice -->
- [ ] Reorder even and odd lists and check for accidental cycles. <!-- checkpoint:w7-reorder-practice -->

### Reflection

- [ ] Record a lost-reference bug as a sequence of drawings. <!-- checkpoint:w7-reference-reflection -->
- [ ] State mutation assumptions and separate helper allocations from working space. <!-- checkpoint:w7-contract-reflection -->
