# Week 10 - BSTs and Heaps
<!-- lesson-id:w10-section-chapter-introduction -->

If you need to find a particular value, you want comparisons that tell you which direction to search. If you need the next most urgent job, you want that job ready at the front. This week we will build structures for both needs: binary search trees, abbreviated BSTs, and heaps. We will use heaps for scheduling-style priorities and for keeping the largest K observations, usually called top-K selection.

We will add a whole-subtree ordering rule to last week's trees, then search, insert, and check that rule. Next we will store a binary heap in an array and trace how it repairs order after a change. Finally, we will limit a min-heap to k entries and use its smallest retained value as the cutoff for incoming observations in a stream.

By the end, you should be able to explain what each ordering promise lets you conclude and which questions it cannot answer quickly. You will see why a tree with an unfortunate shape makes search slow, build heap operations from local repairs rather than repeated sorting, and account for both the heap and any frequency map or output used by top-K clients.

Use the final checklist after tracing swaps and rebuilding the implementations yourself. In your progress logs, keep a small example that exposed a mistaken assumption about sorted order, duplicates, or tree shape. Explain what the structure actually guaranteed and why that was insufficient for your original claim.

## Learning Objectives
<!-- lesson-id:w10-section-learning-objectives -->

- State a rule covering every descendant in a BST and decide consistently how repeated keys are handled.
- Search for, insert, and validate finite numeric keys in a binary search tree.
- Relate the number of visited ancestors to tree height and explain the unbalanced worst case.
- Encode a complete binary tree by array position and repair order by moving an entry upward or downward.
- Account separately for building a heap, removing its root, and extracting every value in sorted order.
- Keep at most k heap entries for largest-value selection, running stream rank, and ranking by frequency.

## Prerequisite Knowledge
<!-- lesson-id:w10-section-prerequisite-knowledge -->

Review trees and traversals in [Week 9](week-09.md), safe elimination in [Week 6](week-06.md), and maps in [Week 2](week-02.md). You will need references to objects, array indexes, and functions that compare two numeric priorities. Our classes preserve an invariant—a statement that remains true—after each public operation a caller can use. JavaScript has no standard built-in binary heap, so **Demonstration 2** in “JavaScript Implementations” supplies every operation needed by its clients.

## Core Theory
<!-- lesson-id:w10-section-core-theory -->

### A BST orders entire subtrees

A **key** is the value we compare to decide order. Our strict BST rule applies everywhere beneath each node: every key in its left subtree is smaller, and every key in its right subtree is larger. We ignore duplicate insertions, so the tree represents a set of finite numbers. A different design could store a count with each key, but its insertion, search, and validation rules would all need to agree on that policy.

Search for 7 starting at 10. Every key in the right subtree exceeds 10, so none can be 7; move left. At 4, the target is larger, so move right. This is the same safe-elimination reasoning as binary search, expressed through links. To insert, follow that same path until a required child is missing, then attach a new leaf. All earlier comparisons restrict the new key to a range that satisfies every ancestor, not only its immediate parent.

Correct value order does not guarantee a short tree. Inserting 1,2,3,4 into an ordinary BST puts each new key to the right of the last, creating a chain. Search and insertion visit O(h) nodes, where h is height. A balanced shape has comparable path lengths and O(log n) height, while a skewed chain has O(n) height in the worst case. Self-balancing trees perform additional structural work to maintain short paths. Our simple implementation contains no such machinery, so do not assume that guarantee.

### Validation carries ancestor constraints

A parent-child check misses older constraints. Let root be 10, its left child 4, and 4's right child 12. The immediate edges look ordered, yet 12 lies in 10's left subtree and is invalid. Carry an allowed **open interval**, a range excluding both endpoints. Root begins in `(-Infinity,Infinity)`. Moving left tightens the upper limit; moving right tightens the lower limit. Key 12 receives `(4,10)` and fails because it violates the root's remembered constraint.

Infinity can mark a boundary outside every accepted key because keys must be finite. Such a special boundary marker is a sentinel. Reject NaN, JavaScript's “not a number” value, explicitly: ordinary less-than and greater-than comparisons with it do not establish numeric order. Another valid checking strategy is to require strict increase during inorder traversal. That strategy must remember whether a previous key exists; assuming an initial nonnegative key would incorrectly reject valid negative data.

### A heap promises an extreme, not sorted traversal

In a **min-heap**, every parent has priority no greater than either child. Follow the ancestors of any entry: priority never increases as you move toward the root, so the root is a minimum across the whole heap. However, siblings and separate branches have no ordering promise relative to each other. To find an arbitrary value, you may still have to inspect O(n) entries; knowing the minimum does not tell you which branch contains that target.

A heap also maintains a **complete** shape: fill each level before the next, and fill the final level from left to right. That keeps height logarithmic regardless of the values' arrival order. It also lets us represent the tree by consecutive array positions instead of child references. At zero-based index i, children are `2*i+1` and `2*i+2`; the parent is `floor((i-1)/2)` for i>0. For example, index 1 has children 3 and 4.

Appending at the next array position preserves completeness. Only the new leaf's ancestor path can now violate order. Swap it upward while its priority belongs before its parent's; this repair is called **sift-up**. To remove the minimum, save the root, move the final leaf to index zero, remove the last slot, and repair downward, called **sift-down**. Compare both children and choose the smaller before swapping. Using the larger could leave the new parent above an even smaller child, so the repair would already be invalid.

Both repairs follow only one path. A **comparator** is the function that decides priority between two entries: negative puts the first argument earlier, zero means equal priority, and positive puts it later. Numeric `(a,b)=>a-b` makes a min-heap. Returning only true or false cannot consistently express all three outcomes. Also, equal priority does not preserve arrival order automatically. If you need stable ties—earlier arrivals first—include a sequence number in the priority rule.

### Heap construction is cheaper than sorting

Leaves have no children to violate, so they already form valid heaps. To construct from an array, sift down each internal node beginning at the final parent and moving toward the root. This is bottom-up construction, often called heapify. Most nodes are near the leaves and can move only a few levels. Summing those short repairs gives work proportional to `n/2 + 2n/4 + 3n/8 + ...`, which is O(n). Repeatedly inserting n values instead has an O(n log n) upper bound.

Building a heap does not put all entries in sorted array order. Extracting every minimum still costs O(n log n) overall. The distinction is useful: a linear build buys access to the next extreme, while full sorting establishes much more order. MIT's [heap lecture notes](https://courses.csail.mit.edu/6.006/fall09/lecture_notes/lecture09.pdf) discuss these construction and sorting costs.

### Top K keeps the weakest retained winner at the root

To keep the k largest observations, hold at most k entries in a min-heap. The smallest retained observation is the weakest current winner, so it should be easiest to remove. Keep all arrivals until the heap fills. Afterwards, compare each arrival with the root: reject it if no larger, or replace the root and repair downward if it is larger. The root acts as a moving cutoff.

The invariant is that the heap holds the largest-k **multiset** of the processed prefix. A multiset allows repeated occurrences rather than discarding duplicates. If an arrival is no greater than the root, at least k retained observations are already as large. Otherwise replacing the weakest winner keeps exactly the desired winners. Thus the second largest observation of `[9,9,2]` is 9; it is not the second distinct value.

Decide whether the caller wants a collection or a rank. Returning an empty top-K collection makes sense for k=0, but a zeroth-largest observation does not. A stream also cannot report kth largest before k observations arrive. Finally, retaining the correct winners does not sort their array positions. If presentation requires descending output, charge for that final sort separately.

## JavaScript Implementations
<!-- lesson-id:w10-section-javascript-implementations -->

We will insert finite keys, ignore a repeated key, and reject a descendant that violates an ancestor's bound.

### Demonstration 1 — Search and validate a strict binary search tree

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

In **Demonstration 1**, inserting 7 follows 10 to 4 and attaches on the right. A later 7 follows the same path and returns without adding another key. Searching for 7 returns its object, while searching for 99 eventually reaches null. Insertion changes existing links and returns the root, which also lets an empty null root be replaced by the first new node. The invalid example sends 12 the allowed bounds `(4,10)` and correctly returns false. Validation assumes proper tree shape; it does not detect cycles or shared child objects.

We will build a heap from a copied array, repair individual paths after changes, and reuse it for largest-value and frequency clients. This is a self-contained program. The constructor heapifies its copy; `push`, `pop`, and `replaceTop` repair only the affected path. The only sort is `topK`'s explicitly requested final presentation sort, so sorting does not stand in for a heap operation.

### Demonstration 2 — Repair a binary heap and retain top-K observations

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

In **Demonstration 2**, appending 1 to `[2,5,4,9,7]` places it at index 5. Sift-up exchanges it with 4 and then 2, producing `[1,5,2,9,7,4]`. Popping saves 1, moves 4 to the root, and swaps down with 2 to restore `[2,5,4,9,7]`. Empty and singleton handling matters: after removing the only entry, do not assign it back to index zero. `replaceTop` needs only downward repair because the changed root has no parent; only its child relationships can be invalid.

We expose `data` so you can trace the array, but treat it as read-only from a client's perspective. Editing it directly, or changing a stored object's priority, skips the repair that preserves the invariant. A library would normally hide this array and require controlled operations for changes.

For `topK([4,5,8,2,10],3)`, the root becomes the weakest of the largest three retained observations, finally 5. The output sort presents `[10,8,5]`. If k exceeds input length, return every available value descending; if k=0, return empty. The stream instead returns null until it has k observations.

Frequency ranking changes what priority means: entries hold a distinct value and its occurrence count. Our tie rule prefers smaller numeric values, so count ties between 2 and 4 favor 2. A problem permitting arbitrary ties can omit that secondary comparison. Remember that the bounded heap is only part of the storage: the Map must retain counts for every distinct value.

## Worked Examples
<!-- lesson-id:w10-section-worked-examples -->

Trace search for 7 along 10→4→7. At 10, the right subtree is too large; at 4, the left subtree is too small. Each movement has evidence for discarding a whole region. Now trace validation of the bad 12: bounds are `(-∞,∞)` at 10, `(-∞,10)` at 4, and `(4,10)` at 12. The immediate parent permits 12, but the ancestor's upper limit rejects it. This is why the check must carry both bounds.

Begin with min-heap `[2,5,4,9,7]` and append 1 to preserve its complete shape, giving `[2,5,4,9,7,1]`. Index 5's parent index is 2, whose value is 4. Swap to obtain `[2,5,1,9,7,4]`. The moved value is now at index 2, whose parent is index 0. Swap 1 with 2 to obtain `[1,5,2,9,7,4]`. At the root there is no earlier ancestor to check.

To pop, save root 1 and move final value 4 into its place, leaving `[4,5,2,9,7]`. Compare children 5 and 2; the smaller child is 2 at index 2. Swap to obtain `[2,5,4,9,7]`. Index 2 has no children, so repair finishes. If you had chosen child 5, the new root 5 would still exceed child 2. A swap alone is insufficient unless it restores the ordering relationships around that position.

Now retain the top three observations from `[4,5,8,2,10]`. Read each row as the collection after that arrival; the boundary becomes a third-largest answer only after three observations exist.

| Incoming | Retained multiset | Minimum boundary | Reason |
| --- | --- | --- | --- |
| 4 | {4} | unavailable as third-largest | fewer than three values |
| 5 | {4,5} | unavailable | still filling |
| 8 | {4,5,8} | 4 | three observations now exist |
| 2 | {4,5,8} | 4 | reject below boundary |
| 10 | {5,8,10} | 5 | replace weakest retained value |

For the frequency client, 9 occurs three times, while 2 and 4 each occur twice. Count alone leaves second place tied. Our smaller-value tie rule chooses 2, producing `[9,2]`. Put that tie rule in the comparator so the heap's actual eviction decisions follow it; documenting a preference afterwards cannot change which entry was retained.

## Visual Explanations
<!-- lesson-id:w10-section-visual-explanations -->

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

The drawn heap is complete, but left child 5 exceeds root 2, so it violates strict BST order. That is allowed: heap order constrains parents against children and makes the root an extreme. BST order constrains whole subtrees and guides a target search. Use the drawing to explain why one structure's fast operation does not automatically transfer to the other.

## Complexity Analysis
<!-- lesson-id:w10-section-complexity-analysis -->

| Operation | Time under standard comparison/dynamic-array model | Extra working space |
| --- | --- | --- |
| BST search or iterative insertion | O(h) | O(1) |
| BST validation | O(n) worst case | O(h) frames |
| Heap peek | O(1) | O(1) |
| Heap push/pop/root replacement | O(log(n+1)) repair | O(1) repair state |
| Bottom-up heap construction | Θ(n) | Θ(n) copied heap storage |
| Pop all heap entries | O(n log(n+1)) | output-dependent |

Separate repair work from the array's storage management. A repair makes at most logarithmically many comparisons and swaps in the worst case, but an array push can occasionally resize storage. Including ordinary dynamic-array growth makes logarithmic push an amortized bound across a sequence. That is not an average-case assumption about random values. The heap retains O(n) entries, and the constructor deliberately copies the caller's array instead of heapifying it in place.

For top-K, define r=min(n,k), the most entries we can actually retain. When k>0, selection takes O(n log(r+1)) time and O(r) heap space. Sorting the winners descending adds O(r log(r+1)) comparison-sort time, and copying output uses O(r) storage; exact sort workspace depends on the engine. The k=0 branch returns immediately in O(1). The `+1` makes edge cases clear: with k=1, selection is linear, whereas the shorthand O(n log k) would misleadingly substitute log 1=0.

Each stream arrival performs O(log(k+1)) worst-case repair work and keeps at most k entries. For frequencies, let u count distinct values. Counting adds expected O(n) time and O(u) Map storage under the usual hashing model. Selecting among those counts costs O(u log(min(k,u)+1)); draining the final heap adds O(min(k,u) log(min(k,u)+1)). Total auxiliary storage is O(u+min(k,u)), since the counts remain necessary even with a bounded heap. These bounds assume the comparator itself takes constant time; an expensive comparison would need its own factor.

Inserting sorted values into an ordinary BST can repeatedly walk the growing chain, totaling 1+2+…+n comparisons, or Θ(n²). A heap avoids that height growth by preserving complete shape independently of value order. But a short heap still lacks the whole-subtree order needed for target elimination, so arbitrary membership search does not become logarithmic. Height and ordering promise are separate ingredients in a complexity argument.

## Common Mistakes
<!-- lesson-id:w10-section-common-mistakes -->

- Carry ancestor bounds during validation; immediate parent-child checks miss deeper violations.
- Inspect BST shape before claiming logarithmic search, since sorted insertions can create a chain.
- Do not read the heap array as a sorted ranking. Only its root is guaranteed to be the next extreme.
- Choose the smaller child in min-heap sift-down so the new parent does not immediately violate the other child.
- To evict the weakest of the largest k values, expose the minimum; a max-heap exposes the strongest instead.
- Do not replace path repair with a full sort after every insertion and still claim logarithmic heap operations.
- Count duplicate observations when finding kth largest; rank is not automatically distinct-value rank.
- Include the Map's u keys when reporting frequency-ranking space, even if the heap holds only k entries.

This broken min-heap repair chooses the wrong child. Try a parent larger than both children so either swap is tempting.

### Demonstration 1 — Broken sift-down selects the larger child

```javascript-bug
let child = 2 * i + 1;
if (child + 1 < heap.length && heap[child + 1] > heap[child]) child++;
```

In broken **Demonstration 1**, use parent 10 with left child 3 and right child 7. The `>` comparison selects 7. Swapping then leaves parent 7 above child 3, still invalid. Select the smaller child with `<` for min-heap repair. The child choice must ensure that the value moved upward is no greater than either child left beneath it.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w10-section-interview-and-leetcode-pattern-recognition -->

When a prompt asks for ordered membership, neighboring keys—the predecessor or successor—or values in a range, consider a search tree. Repeated requests for the next smallest or largest item, scheduling, and continuing top-K updates suggest a heap. A one-time kth-largest array query also admits quickselect, but an ongoing stream fits the bounded-heap contract naturally. Choose based on the sequence of operations the caller needs.

Before writing a comparator, say what you want at the root. A min-heap exposes the globally smallest entry. A largest-K client wants the weakest retained winner there, which becomes kth largest after k observations exist. A frequency client compares counts rather than original values, with a stated tie rule. That sentence determines both heap direction and eviction behavior.

## Practice Exercises
<!-- lesson-id:w10-section-practice-exercises -->

### Conceptual Questions

1. Explain why a heap's short, balanced shape does not provide the comparison evidence needed for logarithmic arbitrary search.
2. If we want the largest k values, why should the smallest retained one be easiest to remove? Relate your answer to a min-heap.
3. Insert ascending values conceptually into an ordinary BST and into a heap. Decide which loses logarithmic height and justify the shape maintained by each.

### Code Tracing

4. Start with `[2,5,4,9,7]`. Trace appending 1 and then removing the minimum, recording every intermediate array and why each swap is selected.
5. Retain the top two observations of `[6,6,1,8]`. After each arrival, report kth largest or explain why too few observations exist yet.

### Debugging Exercises

6. Draw three nodes whose immediate child comparisons pass but whose placement violates an older ancestor's BST bound.
7. Repair **Demonstration 1** in “Common Mistakes.” Then trace popping a singleton heap and explain why writing unconditionally to `data[0]` would recreate its removed entry.

### Implementation Exercises

8. Write a checker that compares every heap parent-child edge. Use it after mixed pushes and pops, including equal priorities and negative numbers.
9. Rebuild the heap without consulting its implementation. Turn it into a max-heap with a descending comparator, then add a size-k stream client that repairs paths rather than sorting after each arrival.
10. Implement selection by frequency and state how tied counts are ranked. Report the frequency Map, retained heap, and returned output as separate storage costs.

### LeetCode and HackerRank Practice

11. **[Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)** — LeetCode lists this as Medium. Practice bounded min-heaps, occurrence-based rank, and selection. Explain why repeated values count separately and why the root is kth largest once the heap has k entries. The existing record reports prior official-page verification and no HackerRank consultation; this rewrite does not verify it anew. Continue with the syllabus titles Kth Largest Element in a Stream and Top K Frequent Elements after the local clients work.

## Hints and Worked Solutions
<!-- lesson-id:w10-section-hints-and-worked-solutions -->

1. Heap order compares ancestors with descendants but does not order separate branches. A target can lie in either child subtree, so a root comparison cannot generally discard one. Balanced shape alone supplies no safe elimination rule.
2. When a stronger candidate arrives, remove the smallest retained value. A min-heap makes that weakest winner immediately accessible. A max-heap would expose the best retained observation for removal instead, defeating the client's goal.
3. An ordinary BST sends each larger arrival to the end of a right-child chain. A heap appends at the next complete-tree position and swaps values along a repair path, preserving the short shape regardless of numeric arrival order.
4. Insertion gives `[2,5,4,9,7,1]`, then `[2,5,1,9,7,4]`, then `[1,5,2,9,7,4]`. Removing 1 first gives `[4,5,2,9,7]`, then swaps with the smaller child to restore `[2,5,4,9,7]`.
5. The answers are `[null,6,6,6]`: one observation cannot establish second-largest, two 6s can, 1 changes nothing, and 8 replaces one 6. The final multiset is `{6,8}`. The duplicate 6 initially counts as its own observation.
6. Use root 10, left child 4, and 4's right child 12. Each local edge looks ordered, but 12 receives `(4,10)` from the accumulated ancestor constraints and fails.
7. Select the smaller child for min-heap repair. After popping a singleton, size is zero and there is no root to replace. The size guard preserves emptiness; an unconditional assignment to index zero would grow the array again with the removed value.
8. Every non-root entry has exactly one parent, so comparing each such edge checks the whole invariant. This numeric checker handles empty arrays without attempting to read a parent.

### Demonstration 1 — Check every edge of a numeric min-heap

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

In **Demonstration 1**, `[2,5,4,9,7]` passes every edge, while `[7,3,10]` fails immediately because parent 7 exceeds child 3. Equal negative values in `[-4,-4,2]` are valid, and empty input has no violating edges. The checker takes Θ(n) time and O(1) working space. For a generic heap, compare with its comparator instead of numeric `>`. Also compare repeated pops with a numerically sorted copy of the original multiset: valid local order alone cannot prove that no observations were lost.
9. Use `(a,b)=>b-a` for a max-heap. **Demonstration 2** in “JavaScript Implementations” pops 9 from `[2,9,4]` and leaves 4 at the root. Its stream client keeps at most k entries and never sorts on each update.
10. Rebuild `topFrequent` from **Demonstration 2** in “JavaScript Implementations.” Its comparator puts the weakest retained entry first: lower count, then larger numeric value on equal counts. Popping therefore extracts worst first, and reversing those extractions presents best first.
11. Feed all observations into a size-k heap and return its root when the platform guarantees 1≤k≤n. Do not deduplicate with a Set: the official contract ranks occurrences in sorted order, so removing repetitions changes the answer.

## Sources and Further Reading
<!-- lesson-id:w10-section-sources-and-further-reading -->

The existing chapter records source consultation on 2026-11-07. We retain that historical attribution without claiming a new link check during this rewrite. The JavaScript heap, its clients, traces, and proofs are original teaching material following the repository syllabus.

- [MIT 6.006: Binary Trees, Part 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/376714cc85c6c784d90eec9c575ec027_MIT6_006S20_lec6.pdf) — the prior reading informed navigation and the distinction between a general traversal sequence and a tree's search-order promise.
- [MIT 6.006: Sorting II, Heaps](https://courses.csail.mit.edu/6.006/fall09/lecture_notes/lecture09.pdf) — the prior consultation covered priority queues, repairs, bottom-up construction, and the extra work needed to sort all entries.
- [LeetCode: Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) — the prior reading established the official difficulty and ranking of repeated occurrences. The record reports no editorial consultation.

## Weekly Summary
<!-- lesson-id:w10-section-weekly-summary -->

You can now explain a BST's search through whole-subtree elimination and a heap's root access through parent-child priority order. BST performance depends on height; heaps maintain a complete shape but do not supply arbitrary target-search order. For top-K, the root becomes the weakest retained winner, and frequency clients change priority from value to count. The heap implementation will also support the priority-driven graph algorithms in [Week 12](week-12.md).

## Weekly Progress Checklist

### Theory

- [ ] Contrast whole-subtree BST order with parent-child heap order and show why neither implies the other. <!-- checkpoint:w10-ordering-invariants -->
- [ ] Derive BST costs from height and heap construction costs by summing bottom-up repairs. <!-- checkpoint:w10-height-and-build-costs -->

### JavaScript

- [ ] Build BST validation that carries both ancestor bounds into each child call. <!-- checkpoint:w10-bst-validation -->
- [ ] Build heap push, pop, peek, and root replacement using path repairs rather than repeated full sorts. <!-- checkpoint:w10-real-heap -->

### Practice

- [ ] Trace every repair swap and test empty heaps, one entry, equal entries, and negative values. <!-- checkpoint:w10-heap-edge-practice -->
- [ ] Complete kth-largest selection and define a frequency comparator with an explicit tie rule. <!-- checkpoint:w10-top-k-practice -->

### Reflection

- [ ] Explain how exposing the weakest retained winner makes the top-K root a useful cutoff. <!-- checkpoint:w10-boundary-reflection -->
- [ ] Include final output sorting and the full frequency Map in separate cost accounts. <!-- checkpoint:w10-complete-cost-reflection -->
