# Week 9 - Binary Trees

This week, you will be learning binary trees: structures in which every node can lead to a left and a right subtree. Trees model hierarchy, from menus to expression syntax, and give recursion a natural shape to follow.

We will start with tree vocabulary and the three depth-first orders, then compute maximum depth, mirror a tree, and visit complete levels with breadth-first search. We will compare implementations on both narrow chains and broad trees.

By the end, you will be able to choose a traversal order, define what a subtree call returns, implement recursive and iterative traversals, and report space in terms of height, width, and retained output.

There will be a checklist at the end to help you track your progress. Use it after drawing traversals and testing your implementations, and keep examples of confusing traversal orders in your progress logs.

## Learning Objectives

- Define root, child, leaf, subtree, height, depth, and width.
- Produce preorder, inorder, and postorder traversals and explain their uses.
- Derive maximum depth from child answers using a consistent convention.
- Implement iterative DFS and level-by-level BFS.
- Invert a tree while stating the mutation contract.
- Distinguish O(h) recursion space, O(w) frontier space, and O(n) retained arrays.

## Prerequisite Knowledge

Review object references in [Week 7](week-07.md), call frames in [Week 8](week-08.md), and stacks/queues in [Week 5](week-05.md). A node will be an object with `value`, `left`, and `right`, with missing children set to `null`. Examples assume a finite tree with no cycles and no child shared by different parents. Arbitrary graphs need the visited-state machinery of [Week 11](week-11.md).

## Core Theory

### A tree contains smaller trees

The root is the starting node. Each child roots a subtree, and a leaf has no children. A binary tree has at most two children per node; it does not require both. Nor does it impose numeric order. A root 4 with left child 9 is a valid binary tree. The search-order promise belongs to binary search trees in [Week 10](week-10.md).

We count maximum depth in nodes: an empty tree has depth zero and a leaf has depth one. Let h be the number of nodes on the longest root-to-leaf path. Some references instead define height using edges, giving a leaf height zero. Translate the convention explicitly rather than mixing base cases. Width w is the maximum number of nodes on any one level. A chain can have h=n and w=1; a complete tree can have h=Θ(log n) and w=Θ(n).

The MIT [binary-tree lecture notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/376714cc85c6c784d90eec9c575ec027_MIT6_006S20_lec6.pdf) separate tree navigation from the meaning assigned to traversal order. That distinction helps prevent the common assumption that every inorder traversal is sorted.

### DFS order tells you when to handle the parent

Depth-first search follows one subtree before the next. In **preorder**, handle the parent before its left and right subtrees. This suits recording a parent before descendants. In **inorder**, handle left subtree, parent, then right subtree. It produces sorted values only when the tree also obeys BST order. In **postorder**, handle both children before their parent, which suits calculations needing completed child answers.

The recursive call stack remembers the unfinished work. After returning from the left subtree, execution continues with the current parent's next statement; it does not restart from the root. A traversal's names describe where the visit occurs relative to those two child calls.

### A subtree answer can be much smaller than a traversal

For maximum depth, a call needs to return only a number. If the left child reports L and the right child reports R, any longest path through this node chooses one child, so return `1 + max(L,R)`. The empty subtree returns zero. Adding both child depths would count work in separate branches rather than the length of a single path.

Correctness follows by structural induction: the empty answer is correct; assuming each smaller subtree reports its correct depth, selecting the larger and adding the current node gives the correct result for the whole subtree. This is a useful proof technique whenever the input itself is recursively defined.

For inversion, the contract is different: mirror each child subtree and exchange their positions. The operation changes the original tree. Save references before overwriting them so neither subtree is lost. Inverting twice restores the original structure, making that a useful test.

### Iteration must remember the work recursion remembered

An explicit DFS stack can store a node together with its depth. Remove a frame, update the best depth, and add child frames. Push right before left if you want left processed first: LIFO reverses insertion order. This avoids the engine's recursion-depth limit, though it still needs memory for pending work.

For inorder, the pending work is subtler. Descend left while pushing ancestors. When there is no left child, pop the nearest waiting ancestor, visit it, and move to its right subtree. Each node is pushed and popped once. The stack represents nodes whose left side is being explored or has finished, but whose own visit is still pending.

### BFS freezes a level before expanding it

Breadth-first search visits nearer levels before deeper ones. A FIFO queue works because children are added after already-discovered nodes. For grouped output, an especially clear implementation uses a current frontier and a next frontier. Process every node in the current frontier, collect its values, and append children to the next one. Only then advance the level.

This avoids an easy bug: looping against a queue length that grows while children are appended can consume later levels as part of the current one. With separate frontiers, each iteration has one unambiguous level. It also makes retained-memory analysis more honest than keeping one growing array of every node ever enqueued.

## JavaScript Implementations

### All three recursive DFS orders

```javascript
function node(value, left = null, right = null) { return { value, left, right }; }
function traversals(root) {
  const preorder = [], inorder = [], postorder = [];
  function visit(current) {
    if (current === null) return;
    preorder.push(current.value);
    visit(current.left);
    inorder.push(current.value);
    visit(current.right);
    postorder.push(current.value);
  }
  visit(root);
  return { preorder, inorder, postorder };
}
const root = node('A', node('B', node('D'), node('E')), node('C'));
console.log(JSON.stringify(traversals(root)));
console.log(JSON.stringify(traversals(null)));
```
```output
{"preorder":["A","B","D","E","C"],"inorder":["D","B","E","A","C"],"postorder":["D","E","B","C","A"]}
{"preorder":[],"inorder":[],"postorder":[]}
```

The three pushes occupy three different moments in one call. If you need only one order, keep only that push and result array. Empty children return immediately and never add phantom values.

### Maximum depth, recursively and iteratively

```javascript
function node(value, left = null, right = null) { return { value, left, right }; }
function maximumDepth(root) {
  if (root === null) return 0;
  return 1 + Math.max(maximumDepth(root.left), maximumDepth(root.right));
}
function maximumDepthIterative(root) {
  if (root === null) return 0;
  const pending = [[root, 1]];
  let best = 0;
  while (pending.length) {
    const [current, depth] = pending.pop();
    best = Math.max(best, depth);
    if (current.right !== null) pending.push([current.right, depth + 1]);
    if (current.left !== null) pending.push([current.left, depth + 1]);
  }
  return best;
}
const root = node(4, node(9, null, node(7)), node(2));
console.log(maximumDepth(root), maximumDepthIterative(root));
console.log(maximumDepth(null), maximumDepthIterative(null));
console.log(maximumDepth(node(8)));
```
```output
3 3
0 0
1
```

Both functions visit every node. The iterative one stores depth explicitly instead of relying on call nesting, so it can handle chains too deep for ordinary JavaScript recursion. It also avoids treating a numeric value of zero as an absent node: existence tests apply to node references.

### Inorder with an explicit stack

```javascript
function inorder(root) {
  const result = [], stack = [];
  let current = root;
  while (current !== null || stack.length > 0) {
    while (current !== null) {
      stack.push(current);
      current = current.left;
    }
    current = stack.pop();
    result.push(current.value);
    current = current.right;
  }
  return result;
}
const root = {
  value: 4,
  left: { value: 9, left: null, right: { value: 7, left: null, right: null } },
  right: { value: 2, left: null, right: null }
};
console.log(JSON.stringify(inorder(root)));
console.log(JSON.stringify(inorder(null)));
```
```output
[9,7,4,2]
[]
```

The outer condition must allow either a current node or saved ancestors. Stopping as soon as current becomes null would abandon the stack just when it is needed.

### Mirror the tree in place

```javascript
function node(value, left = null, right = null) { return { value, left, right }; }
function invert(root) {
  if (root === null) return null;
  const oldLeft = root.left;
  root.left = invert(root.right);
  root.right = invert(oldLeft);
  return root;
}
function preorder(root, output = []) {
  if (root !== null) {
    output.push(root.value);
    preorder(root.left, output);
    preorder(root.right, output);
  }
  return output;
}
const root = node(1, node(2, node(4), null), node(3));
console.log(JSON.stringify(preorder(root)));
console.log(invert(root) === root);
console.log(JSON.stringify(preorder(root)));
invert(root);
console.log(JSON.stringify(preorder(root)));
console.log(invert(null));
```
```output
[1,2,4,3]
true
[1,3,2,4]
[1,2,4,3]
null
```

Returning the same root demonstrates mutation rather than cloning. The saved old-left reference prevents the second assignment from accidentally reusing the newly assigned left subtree.

### Level-order traversal using frontiers

```javascript
function node(value, left = null, right = null) { return { value, left, right }; }
function levelOrder(root) {
  if (root === null) return [];
  const result = [];
  let frontier = [root];
  while (frontier.length > 0) {
    const values = [], next = [];
    for (const current of frontier) {
      values.push(current.value);
      if (current.left !== null) next.push(current.left);
      if (current.right !== null) next.push(current.right);
    }
    result.push(values);
    frontier = next;
  }
  return result;
}
const root = node(1, node(2, node(4), node(5)), node(3, null, node(6)));
console.log(JSON.stringify(levelOrder(root)));
console.log(JSON.stringify(levelOrder(null)));
console.log(JSON.stringify(levelOrder(node(0))));
```
```output
[[1],[2,3],[4,5,6]]
[]
[[0]]
```

Left children are appended before right children, preserving left-to-right order. The current and next frontiers coexist briefly, but each contains at most w nodes, so their combined reference storage is O(w). The result arrays accumulate separately.

## Worked Examples

On the A/B/C/D/E tree, entering A records preorder A and suspends A while visiting B. Entering B records B and visits D. D is a leaf, so it enters all three orders before returning. B then enters inorder, visits E, and only after E finishes does B enter postorder. A resumes next, enters inorder, processes C, and finally enters postorder. The trace explains why postorder B follows both D and E.

For maximum depth on root 4 with left 9, right 2, and 9's right child 7: null children report zero; 7 reports one; 9 reports two; 2 reports one; 4 reports three. The left/right recursive calls visit disjoint subtrees, so there is no exponential recomputation.

The BFS frontiers are `[1]`, then `[2,3]`, then `[4,5,6]`. Processing 2 adds 4 and 5 to next, but does not visit them immediately. Processing 3 adds 6 after them. That ordering is the entire FIFO argument expressed as levels.

## Visual Explanations

```text
        A                  4
       / \                / \
      B   C              9   2
     / \                  \
    D   E                  7

Preorder:  A B D E C     Inorder: 9 7 4 2 (not sorted)
Inorder:   D B E A C
Postorder: D E B C A

Shape comparison:
chain:      1 -> 2 -> 3 -> 4   h=4, w=1
full tree:      1              h=3, w=4
              / \
             2   3
            / \ / \
           4  5 6  7
```

The horizontal chain is shorthand for repeated single-child links, not an array. Which shape makes recursive DFS expensive in stack space? Which makes BFS expensive in frontier space?

## Complexity Analysis

Let n be node count, h node-based maximum depth, and w maximum level width.

| Implementation | Time | Working space | Stored result |
| --- | --- | --- | --- |
| Recursive DFS orders | Θ(n) | O(h) frames | Θ(n) values |
| Recursive maximum depth | Θ(n) | O(h) frames | O(1) number |
| Explicit-stack maximum depth | Θ(n) | O(h) upper bound | O(1) number |
| Iterative inorder | Θ(n) | O(h) stack | Θ(n) values |
| In-place inversion | Θ(n) | O(h) recursive frames | existing tree reused |
| Frontier level order | Θ(n) | O(w) frontier references | Θ(n) values and level arrays |

Each non-null node is visited once, and there are only O(n) null-child checks. Recursive depth follows one active root-to-node path. In explicit DFS, each ancestor can contribute at most one deferred sibling, giving O(h); on a single-child chain the particular depth implementation actually has O(1) pending entries. O(h) is an upper bound, not always a tight bound.

The frontier version's O(w) claim refers to reachable temporary data under a standard garbage-collected memory model. The language does not guarantee immediate physical reclamation of old arrays. It does make old frontier arrays unreachable after reassignment, unlike a never-compacted head-index queue.

If you instead use `queue=[root]` and only advance head while appending children, traversal time is still Θ(n), but that array retains n indexed entries and node references by the end. The active suffix may be O(w); the retained array is O(n). Clearing old slots releases its references but still leaves O(n) slots unless you compact. Also, the input root itself may continue to reference the entire tree regardless of the queue. Report additional traversal storage separately from the input and output.

## Common Mistakes

- Assuming inorder is sorted for every binary tree.
- Returning one for an empty tree while using node-based depth elsewhere.
- Adding left and right depths instead of taking their maximum.
- Checking `node.value` for truthiness and dropping nodes whose value is zero.
- Appending children to the same dynamically sized “current level” loop.
- Saying every DFS uses logarithmic memory without checking tree height.
- Claiming width-bounded BFS storage for an array that retains every processed entry.

```javascript-bug
function depth(node) {
  if (node === null) return 0;
  return 1 + depth(node.left) + depth(node.right);
}
```

This computes node count, not maximum depth. It may look correct on a chain because both quantities coincide there.

## Interview and LeetCode Pattern Recognition

“Levels,” “nearest leaf,” and “first depth satisfying a property” suggest BFS. “Combine child answers,” “subtree,” and “height” suggest postorder reasoning. “Parent before descendants” suggests preorder. Sorted inorder is useful only after confirming BST order.

State the shape assumptions: a cyclic object graph will make these traversals repeat forever. When an input can be a chain with hundreds of thousands of nodes, choose an explicit stack or queue instead of relying on JavaScript recursion. For an ordinary tree, a visited Set is unnecessary because each non-root node has exactly one parent.

## Practice Exercises

### Conceptual Questions

1. Is a root 4 with left child 9 a valid binary tree? Is it a strict BST? Explain the distinction.
2. Compare BFS and recursive DFS working space on a 100,000-node chain and on a complete tree.

### Code Tracing

3. For root 4, left 9, right 2, and 9's right child 7, list all DFS orders and each returned depth.
4. Trace frontier and next after processing each node in the level-order example.

### Debugging Exercises

5. Give the smallest tree where the broken depth function differs from maximum depth. Repair it and name what the original computes.
6. Explain why an inorder loop conditioned only on `current !== null` loses pending work.

### Implementation Exercises

7. Implement iterative maximum depth and verify it on a deep chain without recursive helpers.
8. Implement `leafCount(root)` using a subtree contract. Define the empty-tree result, and test a node with only one child.

### LeetCode and HackerRank Practice

9. **[Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)** — Platform: LeetCode. Official difficulty: Medium. Concepts: BFS, frozen levels, FIFO order. Why: it tests whether you preserve level boundaries while expanding children. The official page was verified; no HackerRank page was consulted. Follow with the syllabus tasks Maximum Depth of Binary Tree and Invert Binary Tree using the local implementations as worked references.

## Hints and Worked Solutions

1. It is a binary tree because each node has at most two children, but it violates strict BST order because a left descendant exceeds the root.
2. A chain has width one and recursive depth n; frontier BFS uses O(1) temporary references while recursive DFS uses O(n) frames. A complete tree has logarithmic height and potentially linear width, reversing that comparison. The shown explicit-stack depth traversal is also O(1) pending space on a chain.
3. Preorder is `[4,9,7,2]`, inorder `[9,7,4,2]`, postorder `[7,9,2,4]`. Depths returned by 7,9,2,4 are 1,2,1,3.
4. After processing root, next is `[2,3]`. During the following level it becomes `[4,5]` after 2, then `[4,5,6]` after 3. None of those new nodes belongs to the level currently being output.
5. A root with two leaf children has depth two but node count three. Replace addition of the child results with `Math.max`.
6. Reaching a null left child is precisely when a saved ancestor must be popped. The condition must allow a nonempty stack as well.
7. Use the iterative implementation above. Construct the chain with a loop; a recursive constructor would fail before testing the iterative algorithm.
8. A leaf contributes one; an empty subtree contributes zero; every other node sums its children's leaf counts.

```javascript
function leafCount(root) {
  if (root === null) return 0;
  if (root.left === null && root.right === null) return 1;
  return leafCount(root.left) + leafCount(root.right);
}
const root = {
  value: 1,
  left: { value: 2, left: null, right: null },
  right: { value: 3, left: { value: 4, left: null, right: null }, right: null }
};
console.log(leafCount(root));
console.log(leafCount(root.right));
console.log(leafCount(null));
```
```output
2
1
0
```

This uses Θ(n) time and O(h) frames. The one-child node 3 is not itself a leaf; only its descendant 4 contributes.
9. The frontier traversal is the worked solution. Test empty input, a zero-valued root, an uneven tree, and a chain. If converting to a queue implementation, freeze the current live queue size at each level and re-evaluate retained memory.

## Sources and Further Reading

Consulted on 2026-11-07. Chapter code, traces, and space comparisons are original and follow the repository syllabus.

- [MIT 6.006: Binary Trees, Part 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/376714cc85c6c784d90eec9c575ec027_MIT6_006S20_lec6.pdf) — read the notes' tree-navigation and traversal-order discussion; distinguish their conventions from the node-based depth used here.
- [LeetCode: Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) — read the official left-to-right, level-by-level output contract and difficulty. No editorial was consulted.

## Weekly Summary

Tree algorithms become manageable when each subtree has a precise contract. DFS orders differ in when they process the parent; BFS preserves complete levels. Depth and width describe different memory pressures, and the actual container implementation determines whether that theoretical bound is achieved. [Week 10](week-10.md) adds ordering promises for search and priority selection.

## Weekly Progress Checklist

### Theory

- [ ] Explain all three DFS orders and the tree/BST distinction. <!-- checkpoint:w9-traversal-theory -->
- [ ] Derive maximum depth from a subtree contract. <!-- checkpoint:w9-subtree-contract -->

### JavaScript

- [ ] Implement recursive and explicit-stack maximum depth. <!-- checkpoint:w9-depth-implementations -->
- [ ] Implement inversion and frontier-based level order. <!-- checkpoint:w9-inversion-and-bfs -->

### Practice

- [ ] Trace an uneven tree and test a zero-valued node. <!-- checkpoint:w9-uneven-tree-practice -->
- [ ] Solve level-order traversal and implement leaf counting. <!-- checkpoint:w9-level-and-leaf-practice -->

### Reflection

- [ ] Compare retained queue storage with active frontier size. <!-- checkpoint:w9-retained-storage-reflection -->
- [ ] Choose a safe traversal for a deep chain and explain why. <!-- checkpoint:w9-shape-reflection -->
