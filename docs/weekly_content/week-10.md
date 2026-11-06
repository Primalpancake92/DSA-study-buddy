# Week 10 - BSTs and Heaps

This week, you will be learning binary search trees and heaps: two structures that organize values for different kinds of questions. BSTs guide ordered search, while heaps keep the next highest-priority item accessible for scheduling and top-K selection.

We will start by adding a global ordering rule to last week's trees, then implement BST operations and validation. Next we will build a real array-backed binary heap, trace its repairs, and use a bounded min-heap to retain the largest values in a stream.

By the end, you will be able to distinguish search order from heap order, explain why an unbalanced BST can be slow, implement heap operations without repeated sorting, and derive top-K time and memory costs.

There will be a checklist at the end to help you track your progress. Use it after tracing the swaps and rebuilding the implementations, and record mistaken assumptions about order or balance in your progress logs.

## Learning Objectives

- State the global BST invariant and a consistent duplicate policy.
- Search, insert, and validate finite numeric BST keys.
- Explain how height controls BST performance.
- Map a complete binary tree to array indexes and implement sift-up/sift-down.
- Distinguish heap construction, extraction, and full sorting costs.
- Use a size-k min-heap for top-K values, stream ranking, and frequency ranking.

## Prerequisite Knowledge

Review tree terminology and traversal from [Week 9](week-09.md), elimination reasoning from [Week 6](week-06.md), and maps from [Week 2](week-02.md). You should be comfortable with object references, arrays, numeric comparators, and a class that maintains an invariant after every public operation. JavaScript has no standard built-in binary heap; the implementation below includes all required operations.

## Core Theory

### A BST orders entire subtrees

Under our strict policy, every key anywhere in the left subtree is smaller than the node's key, and every key anywhere in the right subtree is larger. Duplicate insertions are ignored, giving a set of finite numbers. Other policies can store a count per key, but insertion, search, and validation must agree.

To search for 7 under root 10, discard the entire right subtree because every key there exceeds 10. At node 4, move right because 7 is larger. These comparisons are the tree equivalent of binary search's elimination proof. Insertion follows the same path until a missing child provides a place for a new leaf. Every comparison made along the path constrains the new value to the appropriate range.

The shape is not automatically balanced. Inserting 1,2,3,4 into an ordinary BST creates a chain. Search and insertion take O(h), where h is height: O(log n) for a balanced shape, O(n) in the worst skewed case. Self-balancing trees add machinery to preserve logarithmic height; that machinery is not present in the simple implementation below.

### Validation carries ancestor constraints

Checking immediate children is insufficient. Root 10 with left child 4 and 4's right child 12 passes both local comparisons, but 12 is still inside 10's left subtree. A validator must carry an allowed open interval. Root begins in `(-Infinity,Infinity)`. Moving left lowers the upper bound; moving right raises the lower bound. Key 12 reaches the interval `(4,10)` and is rejected.

Finite numeric keys make Infinity safe as a boundary sentinel. Explicitly rejecting NaN matters: comparisons against NaN do not behave like ordinary ordered numbers. An alternative validator checks strict increase during inorder traversal. It must remember whether a previous value exists rather than assuming the first key is nonnegative.

### A heap promises an extreme, not sorted traversal

A min-heap requires each parent to have priority no greater than either child. Following parent links to the root proves the root is a global minimum. Siblings and separate branches need not be ordered. Searching for an arbitrary value may still require O(n) inspection.

The shape is complete: every level is full except possibly the last, which fills left to right. This gives logarithmic height regardless of insertion order and lets an array encode the tree without node references. At zero-based index i, children are `2*i+1` and `2*i+2`; the parent is `floor((i-1)/2)` for i>0.

Appending preserves shape. Only the new leaf-to-root path can violate order, so swap upward while the child outranks its parent. Removing the minimum saves the root, moves the final leaf to index zero, removes the last slot, then repairs downward. Choose the smaller child before swapping: using the larger child could leave the other child smaller than its new parent.

Both repairs follow one path. A comparator returning negative means the first argument has higher priority; zero means equal priority; positive means lower priority. For numbers, `(a,b)=>a-b` makes a min-heap. A boolean comparator is wrong because it does not represent all three outcomes consistently. Equal priority does not imply stable arrival order; add a sequence number if stable ties are required.

### Heap construction is cheaper than sorting

Leaves already satisfy heap order. Bottom-up construction sifts down every internal node from the final parent to the root. Most nodes are near the leaves and can move only a little. The total work is bounded by a series proportional to `n/2 + 2n/4 + 3n/8 + ...`, which is O(n). Repeated insertion gives O(n log n) instead. Extracting all n values still takes O(n log n), because construction is not full sorting. MIT's [heap lecture notes](https://courses.csail.mit.edu/6.006/fall09/lecture_notes/lecture09.pdf) cover this construction-versus-sorting distinction.

### Top K keeps the weakest retained winner at the root

To retain the k largest values, use a min-heap of at most k entries. Its smallest retained value is the one to evict when a better candidate arrives. Before the heap fills, keep everything. Afterwards, reject a new value no larger than the root; otherwise replace the root and repair downward.

This maintains the largest-k multiset for every processed prefix. If a value is no greater than the boundary, at least k retained values are already as large. If it is greater, exchanging it for the minimum preserves the desired set of winners. Duplicates count as separate occurrences: the second largest of `[9,9,2]` is 9.

A top-K collection and a kth-largest answer are different contracts. Retaining zero values is useful when k=0, but “zeroth largest” is undefined. A stream cannot report kth largest until k observations exist. A returned heap array is not sorted; sorting the final retained values costs extra.

## JavaScript Implementations

### BST insertion, search, and global validation

```javascript
function insert(root, value) {
  if (!Number.isFinite(value)) throw new RangeError('Use finite numeric keys');
  const fresh = { value, left: null, right: null };
  if (root === null) return fresh;
  let current = root;
  while (true) {
    if (value === current.value) return root;
    const side = value < current.value ? 'left' : 'right';
    if (current[side] === null) { current[side] = fresh; return root; }
    current = current[side];
  }
}
function search(root, target) {
  if (!Number.isFinite(target)) throw new RangeError('Use a finite target');
  let current = root;
  while (current !== null) {
    if (target === current.value) return current;
    current = target < current.value ? current.left : current.right;
  }
  return null;
}
function isValidBST(root, low = -Infinity, high = Infinity) {
  if (root === null) return true;
  if (!Number.isFinite(root.value) || root.value <= low || root.value >= high) return false;
  return isValidBST(root.left, low, root.value) &&
         isValidBST(root.right, root.value, high);
}
function inorder(root, result = []) {
  if (root !== null) {
    inorder(root.left, result);
    result.push(root.value);
    inorder(root.right, result);
  }
  return result;
}
let root = null;
for (const value of [10,4,16,2,7,12,18,7]) root = insert(root, value);
console.log(JSON.stringify(inorder(root)));
console.log(search(root, 7)?.value, search(root, 99));
console.log(isValidBST(root), isValidBST(null));
const invalid = { value: 10, left: {
  value: 4, left: null, right: { value: 12, left: null, right: null }
}, right: null };
console.log(isValidBST(invalid));
```
```output
[2,4,7,10,12,16,18]
7 null
true true
false
```

The repeated 7 does not create a second node in the set. Search returns a node reference or null. Insertion mutates the existing tree and returns its root so the empty-tree case can replace the caller's null root. Validation assumes proper tree shape; it does not itself detect cycles or shared children.

### A complete binary heap and top-K clients

This block is self-contained. The heap's constructor copies its input and heapifies it; `push`, `pop`, and `replaceTop` repair only the affected path. The only sort is an explicitly requested final presentation sort in `topK`, never the implementation of a heap operation.

```javascript
class BinaryHeap {
  constructor(compare = (a, b) => a - b, values = []) {
    this.compare = compare;
    this.data = [...values];
    for (let i = Math.floor(this.size / 2) - 1; i >= 0; i--) this.siftDown(i);
  }
  get size() { return this.data.length; }
  peek() { return this.data[0]; }
  swap(i, j) { [this.data[i], this.data[j]] = [this.data[j], this.data[i]]; }
  push(value) {
    this.data.push(value);
    let i = this.size - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i], this.data[parent]) >= 0) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  siftDown(i) {
    while (2 * i + 1 < this.size) {
      let child = 2 * i + 1;
      if (child + 1 < this.size &&
          this.compare(this.data[child + 1], this.data[child]) < 0) child++;
      if (this.compare(this.data[i], this.data[child]) <= 0) break;
      this.swap(i, child);
      i = child;
    }
  }
  pop() {
    if (this.size === 0) return undefined;
    const first = this.data[0];
    const last = this.data.pop();
    if (this.size > 0) {
      this.data[0] = last;
      this.siftDown(0);
    }
    return first;
  }
  replaceTop(value) {
    if (this.size === 0) throw new RangeError('Cannot replace an empty root');
    const first = this.data[0];
    this.data[0] = value;
    this.siftDown(0);
    return first;
  }
}
function topK(values, k) {
  if (!Number.isInteger(k) || k < 0) throw new RangeError('k must be nonnegative');
  if (k === 0) return [];
  const heap = new BinaryHeap();
  for (const value of values) {
    if (heap.size < k) heap.push(value);
    else if (value > heap.peek()) heap.replaceTop(value);
  }
  return [...heap.data].sort((a, b) => b - a);
}
class KthLargestStream {
  constructor(k) {
    if (!Number.isInteger(k) || k < 1) throw new RangeError('k must be positive');
    this.k = k;
    this.heap = new BinaryHeap();
  }
  add(value) {
    if (this.heap.size < this.k) this.heap.push(value);
    else if (value > this.heap.peek()) this.heap.replaceTop(value);
    return this.heap.size === this.k ? this.heap.peek() : null;
  }
}
function topFrequent(values, k) {
  if (!Number.isInteger(k) || k < 0) throw new RangeError('k must be nonnegative');
  if (k === 0) return [];
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  // Lower frequency is worse. On ties, larger numeric value is worse.
  const compare = (a, b) => a.count - b.count || b.value - a.value;
  const heap = new BinaryHeap(compare);
  for (const [value, count] of counts) {
    const entry = { value, count };
    if (heap.size < k) heap.push(entry);
    else if (compare(entry, heap.peek()) > 0) heap.replaceTop(entry);
  }
  const worstFirst = [];
  while (heap.size) worstFirst.push(heap.pop().value);
  return worstFirst.reverse();
}
// Numeric clients assume finite numbers; comparators must remain consistent.
const heap = new BinaryHeap((a,b) => a-b, [2,5,4,9,7]);
heap.push(1);
console.log(JSON.stringify(heap.data));
console.log(heap.pop());
console.log(JSON.stringify(heap.data));
const ascending = [];
while (heap.size) ascending.push(heap.pop());
console.log(JSON.stringify(ascending), heap.pop());
console.log(JSON.stringify(topK([4,5,8,2,10], 3)));
console.log(JSON.stringify(topK([9,9,2], 2)));
console.log(JSON.stringify(topK([3,1], 0)));
console.log(JSON.stringify(topK([3,1], 5)));
const stream = new KthLargestStream(3);
console.log(JSON.stringify([4,5,8,2,10].map(value => stream.add(value))));
console.log(JSON.stringify(topFrequent([4,4,2,2,9,9,9,7], 2)));
const maxHeap = new BinaryHeap((a,b) => b-a, [2,9,4]);
console.log(maxHeap.pop(), maxHeap.peek());
```
```output
[1,5,2,9,7,4]
1
[2,5,4,9,7]
[2,4,5,7,9] undefined
[10,8,5]
[9,9]
[]
[3,1]
[null,null,4,4,5]
[9,2]
9 4
```

`pop` treats empty and singleton heaps explicitly. After removing the only entry, it must not write that removed entry back to index zero. `replaceTop` works by downward repair because only root-to-child relationships can become invalid; there is no parent above the root.

The heap exposes `data` for teaching traces, but callers must not edit it or change an object's priority while it is stored. Such mutation bypasses repair and invalidates the guarantee. A library interface would normally hide that array.

`topK` permits k larger than input length and returns all available values in descending order. The stream instead returns null until enough observations exist. For frequency ranking, the heap stores distinct values and their counts. Our explicit tie rule prefers smaller numeric values; a problem allowing arbitrary ties may omit that secondary comparison. Counting needs a Map of all distinct values even though the heap stays bounded.

## Worked Examples

Search for 7 follows 10→4→7. At 10, every right-subtree key is too large; at 4, every left-subtree key is too small. Validation of the bad 12 follows bounds `(-∞,∞)` at 10, `(-∞,10)` at 4, and `(4,10)` at 12. The last check fails due to an ancestor, not the immediate parent.

Start with min-heap `[2,5,4,9,7]`. Appending 1 gives `[2,5,4,9,7,1]`. Index 5's parent is 2: swap 1 and 4, obtaining `[2,5,1,9,7,4]`. Index 2's parent is 0: swap again, obtaining `[1,5,2,9,7,4]`.

To pop, save 1 and move last value 4 to root, leaving `[4,5,2,9,7]`. The smaller child is 2 at index 2, so swap to get `[2,5,4,9,7]`. Index 2 has no children and repair ends. Choosing child 5 instead would produce a root 5 above child 2, still violating heap order.

Top three over `[4,5,8,2,10]`:

| Incoming | Retained multiset | Minimum boundary | Reason |
| --- | --- | --- | --- |
| 4 | {4} | unavailable as third-largest | fewer than three values |
| 5 | {4,5} | unavailable | still filling |
| 8 | {4,5,8} | 4 | three observations now exist |
| 2 | {4,5,8} | 4 | reject below boundary |
| 10 | {5,8,10} | 5 | replace weakest retained value |

For frequencies, 9 appears three times, while 2 and 4 each appear twice. Both are candidates for second place by count; the explicit smaller-value tie rule selects 2. This shows why tie policy belongs in the comparator rather than in a comment after the fact.

## Visual Explanations

```text
BST:                          Min-heap:
         10                        2
        /  \                      / \
       4    16                   5   4
      / \   / \                 / \
     2   7 12 18               9   7

all left keys < node          only parent <= child
all right keys > node         no sibling ordering promise

Heap array:  index  0  1  2  3  4
             value 2  5  4  9  7
node 1's children: 2*1+1=3 and 2*1+2=4

Sorted insertion into ordinary BST:
1 -> 2 -> 3 -> 4 -> 5    (right-child chain, not balanced)
```

The heap has a complete shape but is not a BST: its left child 5 exceeds its root 2. The two structures optimize different operations.

## Complexity Analysis

| Operation | Time under standard comparison/dynamic-array model | Extra working space |
| --- | --- | --- |
| BST search or iterative insertion | O(h) | O(1) |
| BST validation | O(n) worst case | O(h) frames |
| Heap peek | O(1) | O(1) |
| Heap push/pop/root replacement | O(log(n+1)) repair | O(1) repair state |
| Bottom-up heap construction | Θ(n) | Θ(n) copied heap storage |
| Pop all heap entries | O(n log(n+1)) | output-dependent |

Array push may occasionally resize storage; logarithmic push is an amortized bound including ordinary dynamic-array growth, while the comparisons/swaps in a repair have worst-case logarithmic count. The heap itself stores O(n) entries. The constructor intentionally copies the provided array rather than heapifying it in place.

For top-K, let r=min(n,k). For k>0, selection takes O(n log(r+1)) time and O(r) heap space. The final descending sort adds O(r log(r+1)) time under a comparison-sort model, and the copied output uses O(r) storage. Exact sort workspace is engine-dependent. The k=0 branch returns immediately in O(1). Writing O(n log k) alone obscures the k=1 case, where selection is linear even though log 1 is zero.

Each stream update takes O(log(k+1)) worst-case repair work and retains at most k entries. For frequency ranking with u distinct values, counting takes expected O(n) time and O(u) Map storage under the usual hashing model. Selection costs O(u log(min(k,u)+1)), and draining the final heap adds O(min(k,u) log(min(k,u)+1)). Total auxiliary storage is O(u+min(k,u)), not just O(k), because counts must be retained. The comparator must take constant time for these bounds.

Inserting sorted data into an ordinary BST can cost 1+2+…+n comparisons overall, or Θ(n²). A heap retains logarithmic height because its complete shape is maintained, independently of value order. Neither fact makes arbitrary heap membership logarithmic.

## Common Mistakes

- Validating only parent-child pairs misses ancestor-bound violations.
- Assuming every BST is balanced hides a linear-height worst case.
- Treating the heap array as sorted returns incorrect rankings beyond its root.
- Choosing the larger child in min-heap sift-down leaves an immediate violation.
- Using a max-heap to evict from the largest-k set exposes the wrong item.
- Sorting after every insertion and calling it a logarithmic heap operation.
- Forgetting duplicate occurrences in kth-largest ranking.
- Claiming O(k) total frequency-ranking space while storing a Map of u keys.

```javascript-bug
let child = 2 * i + 1;
if (child + 1 < heap.length && heap[child + 1] > heap[child]) child++;
```

This selects the larger child. With parent 10 and children 3 and 7, swapping with 7 leaves parent 7 above child 3. The repair rule must select the minimum child for a min-heap.

## Interview and LeetCode Pattern Recognition

Ordered membership, predecessor/successor, and range queries point toward search trees. Repeated next-smallest/next-largest operations, scheduling, and streaming top-K point toward heaps. A one-time kth-largest array query also admits quickselect, but a bounded heap naturally supports an ongoing stream.

Say what the root means. In a min-heap it is the globally smallest entry; in a top-largest-K heap it is the weakest retained winner, which becomes kth largest once k entries exist. In a frequency heap, priority is count rather than the original value. This one sentence often clarifies which comparator and heap direction you need.

## Practice Exercises

### Conceptual Questions

1. Why can a heap be balanced in shape but not support logarithmic arbitrary search?
2. Explain why a min-heap is appropriate for keeping the largest k values.
3. Does inserting ascending values make an ordinary BST or a heap lose logarithmic height? Justify both answers.

### Code Tracing

4. Trace insertion of 1 and removal of minimum from `[2,5,4,9,7]`, including every array swap.
5. Trace top two over `[6,6,1,8]`. Report kth-largest after each observation.

### Debugging Exercises

6. Construct a three-node BST that passes local child checks but is invalid globally.
7. Repair the broken child selection. Also explain why an unconditional assignment to `data[0]` after popping a singleton heap recreates the removed item.

### Implementation Exercises

8. Implement a heap invariant checker that inspects every parent-child edge. Test it after mixed pushes and pops, including duplicates and negative values.
9. Rebuild the heap from memory, then use a descending comparator to make a max-heap. Add a size-k stream client without sorting on each insertion.
10. Implement top-frequency selection with a stated tie policy. Account separately for the frequency map, heap, and output.

### LeetCode and HackerRank Practice

11. **[Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)** — Platform: LeetCode. Official difficulty: Medium. Concepts: bounded min-heap, rank with duplicates, selection. Why: it checks whether the root represents kth-largest rather than the kth distinct value. This official page was verified; no HackerRank page was consulted. Extend with the syllabus titles Kth Largest Element in a Stream and Top K Frequent Elements after the local clients work.

## Hints and Worked Solutions

1. Heap order only compares ancestors and descendants. The target may occur in either child subtree, so you cannot generally discard one based on a single comparison.
2. Evict the smallest retained value when a stronger candidate arrives. A max-heap would make the best retained value easiest to remove instead.
3. An ordinary BST becomes a chain; a heap appends at the next complete-tree position and repairs order without changing that shape.
4. The arrays are `[2,5,4,9,7,1]`, `[2,5,1,9,7,4]`, `[1,5,2,9,7,4]`. Removing 1 produces `[4,5,2,9,7]`, then `[2,5,4,9,7]`.
5. The stream answers are `[null,6,6,6]`. The final largest-two multiset is `{6,8}`; the duplicate 6 initially counts as a separate observation.
6. Root 10, left child 4, and that child's right child 12. Bounds `(4,10)` reject 12.
7. Choose the smaller child. After popping the only entry, size is zero and no root replacement is needed; the guarded assignment in the implementation preserves emptiness.
8. Every non-root entry has one parent; compare those edges. Here is a standalone numeric checker.

```javascript
function isMinHeap(values) {
  for (let child = 1; child < values.length; child++) {
    const parent = Math.floor((child - 1) / 2);
    if (values[parent] > values[child]) return false;
  }
  return true;
}
console.log(isMinHeap([2,5,4,9,7]));
console.log(isMinHeap([7,3,10]));
console.log(isMinHeap([-4,-4,2]));
console.log(isMinHeap([]));
```
```output
true
false
true
true
```

The checker takes Θ(n) time and O(1) working space. For the generic heap, use its comparator instead of numeric `>`. A useful behavioral check also compares repeated pops with a numerically sorted copy of the original multiset; an invariant check alone does not establish that no values were lost.
9. Use `(a,b)=>b-a`. The implementation block demonstrates that popping `[2,9,4]` returns 9 and leaves 4 at the root. The stream client retains at most k entries and performs no repeated sort.
10. The `topFrequent` implementation is the worked solution. Its comparator places the worst retained entry first: low count, then larger value for equal counts. Reversing the extraction order returns best first.
11. Feed all values to a size-k heap and return its root when the input guarantees 1≤k≤n. Do not remove duplicates with a Set. The official contract counts occurrences in sorted order.

## Sources and Further Reading

Consulted on 2026-11-07. The JavaScript heap, clients, traces, and proofs are original teaching material following the repository syllabus.

- [MIT 6.006: Binary Trees, Part 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/376714cc85c6c784d90eec9c575ec027_MIT6_006S20_lec6.pdf) — consulted tree navigation and the distinction between generic traversal order and search-tree order.
- [MIT 6.006: Sorting II, Heaps](https://courses.csail.mit.edu/6.006/fall09/lecture_notes/lecture09.pdf) — consulted priority-queue operations, heap repair, bottom-up construction, and sorting costs.
- [LeetCode: Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) — read the official difficulty and occurrence-based rank contract. No editorial was consulted.

## Weekly Summary

A BST supports safe elimination using global subtree order, with speed controlled by height. A heap maintains a complete shape and local priority order, exposing one extreme efficiently. Top-K selection uses that extreme as a moving cutoff, and frequency ranking changes what priority means. The real heap implementation will also support priority-driven graph algorithms in [Week 12](week-12.md).

## Weekly Progress Checklist

### Theory

- [ ] Explain BST order, heap order, and why neither implies the other. <!-- checkpoint:w10-ordering-invariants -->
- [ ] Derive height-dependent BST costs and linear bottom-up heap construction. <!-- checkpoint:w10-height-and-build-costs -->

### JavaScript

- [ ] Implement global BST validation with propagated bounds. <!-- checkpoint:w10-bst-validation -->
- [ ] Implement heap push, pop, peek, and root replacement without repeated sorting. <!-- checkpoint:w10-real-heap -->

### Practice

- [ ] Trace heap repairs and test empty, singleton, duplicate, and negative cases. <!-- checkpoint:w10-heap-edge-practice -->
- [ ] Solve kth-largest selection and implement a frequency-based comparator. <!-- checkpoint:w10-top-k-practice -->

### Reflection

- [ ] Explain why the top-K root is the weakest retained winner. <!-- checkpoint:w10-boundary-reflection -->
- [ ] Account for output sorting and frequency-map memory separately. <!-- checkpoint:w10-complete-cost-reflection -->
