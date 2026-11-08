# Week 9 - Binary Trees
<!-- lesson-id:w9-section-chapter-introduction -->

A menu can contain submenus, and an expression can contain smaller expressions. A tree represents that kind of hierarchy by connecting parent objects to children. This week we will study binary trees, where each node has at most a left child and a right child. Each child begins a smaller tree, making recursion a natural way to describe the work.

First we will name the parts of a tree and learn three ways to visit a parent relative to its descendants. Then we will calculate the longest downward path, mirror the child relationships, and visit one complete level at a time. We will compare narrow chains with broad trees because shape changes memory needs even when the node count stays the same.

By the end, you should be able to choose an order for visiting nodes—a traversal—and state exactly what each smaller-subtree call returns. You will implement visits with both recursive calls and explicit containers. When discussing storage, you will distinguish the longest active path, the widest level, and the results retained after the traversal finishes.

Use the final checklist after drawing traversal orders and testing your own implementations. Save an uneven tree in your progress logs whenever an order surprises you. Include the point where a parent resumes after a child returns; that is often the missing step in understanding a traversal.

## Learning Objectives
<!-- lesson-id:w9-section-learning-objectives -->

- Explain the starting node, children, leaves, smaller subtrees, and the height, depth, and width measures we use.
- Produce preorder, inorder, and postorder sequences and relate each visit position to useful work.
- Calculate maximum depth from child answers without mixing node-count and edge-count conventions.
- Build depth-first visits with an explicit stack and breadth-first visits grouped into levels.
- Mirror existing child links and tell callers that the original tree changes.
- Separate O(h) waiting-call storage, O(w) current-level storage, and O(n) arrays retained as results or queue history.

## Prerequisite Knowledge
<!-- lesson-id:w9-section-prerequisite-knowledge -->

Review references to objects in [Week 7](week-07.md), waiting-call frames in [Week 8](week-08.md), and newest-first versus oldest-first containers in [Week 5](week-05.md). Our nodes contain `value`, `left`, and `right`; a missing child is explicitly `null`. Inputs must be finite trees: they cannot loop back, and two parents cannot share a child object. Otherwise a traversal may revisit nodes forever or count them repeatedly. More general connected structures need the remembered-visited-state techniques of [Week 11](week-11.md).

## Core Theory
<!-- lesson-id:w9-section-core-theory -->

### A tree contains smaller trees

The **root** is where we begin. A node's **children** are the nodes reached by its left and right links, and each child together with its descendants forms a **subtree**. A **leaf** has no children. Binary means at most two children, not exactly two. It also says nothing about numeric order: root 4 with left child 9 is a perfectly valid binary tree. The additional search-order rule belongs to binary search trees in [Week 10](week-10.md).

Depth describes how far downward a path reaches; a level groups nodes at the same distance from the root. We count maximum depth in nodes: empty input has depth zero and a leaf alone has depth one. Let h count nodes on the longest root-to-leaf path. Some references call the longest downward measure height and count edges instead, making a leaf height zero. Translate explicitly between those conventions before borrowing a base case.

**Width** w is the largest number of nodes on a single level. A chain of n nodes can have h=n and w=1. A complete tree, whose levels fill from the top and whose final level fills left to right, can have h=Θ(log n) and w=Θ(n). These describe very different storage pressures despite the same node count.

Keep the mechanics of moving through links separate from any meaning assigned to the values. The MIT [binary-tree lecture notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/376714cc85c6c784d90eec9c575ec027_MIT6_006S20_lec6.pdf) make that distinction too. It prevents a common mistake: expecting an inorder traversal to sort a tree that never promised search order in the first place.

### DFS order tells you when to handle the parent

**Depth-first search**, or DFS, explores one subtree before moving to the next. We have three useful moments to handle the current parent. In **preorder**, handle it before either child, useful when recording parents before descendants. In **inorder**, handle the left subtree, then the parent, then the right subtree; values are sorted only if the tree also obeys binary-search-tree order. In **postorder**, finish both children first, useful when the parent's calculation needs their answers. The names describe the parent's visit position, not a different shape of tree.

The recursive stack remembers where each parent paused. After the left-subtree call returns, execution continues at the current parent's next statement. It does not restart at the root. To trace an order, place the parent's visit before, between, or after its two child calls and then follow ordinary call-and-return behavior.

### A subtree answer can be much smaller than a traversal

For maximum depth, we do not need to save a traversal at all: each call can return one number. Suppose the left child reports L and the right reports R. A downward path can choose only one child, so return `1 + max(L,R)`, counting the current node too. Empty children report zero. Adding L and R would combine separate branches, which measures something other than the length of one path.

We can prove this by first checking the empty tree, then explaining why correct answers for the smaller pieces give a correct answer for their parent. This reasoning is **structural induction**. Zero is correct for empty input. Assuming both child depths are correct, choosing the larger and adding the current node produces the correct whole-subtree depth. The proof follows the same smaller-tree structure as the code.

To **invert** a tree means to mirror it: mirror both smaller subtrees and exchange their left and right positions. Here the contract changes the original objects rather than returning a clone. Save the old references before overwriting fields so neither child is lost. Mirroring twice should restore every original link, giving you a useful check on the mutation.

### Iteration must remember the work recursion remembered

We can replace waiting calls with a stack we manage ourselves. For depth, store a node and its current depth together as a frame. Pop a frame, update the best depth seen, and push its children with depth increased by one. Push right before left when you want to process left first, because the stack removes the newest addition. This avoids the engine's call-depth limit, but still allocates memory for pending frames.

For inorder, the stack must remember parents whose own visit is waiting. Walk left and push each ancestor. When you reach null, pop the nearest waiting ancestor, visit it, and continue from its right child. Each node is pushed once and popped once. The saved nodes are precisely those whose left side is underway or complete but whose own value has not yet been visited.

### BFS freezes a level before expanding it

**Breadth-first search**, or BFS, finishes nearer levels before deeper ones. An oldest-first queue achieves this because children join after nodes already discovered. For grouped answers, use a **frontier**, meaning all nodes on the current level, and a separate next frontier for their children. Read every current node, collect its value, and append its children to next. Advance only after the whole current frontier is finished.

Separate frontiers make a level's membership fixed while you process it. If you instead loop against a queue length that grows as children arrive, you may accidentally consume later levels inside the current level. Separate arrays also stop traversal history from accumulating in one never-shortened queue, which matters when we claim a width-based memory bound.

## JavaScript Implementations
<!-- lesson-id:w9-section-javascript-implementations -->

We will record each parent at three moments to make preorder, inorder, and postorder directly comparable.

### Demonstration 1 — Record three depth-first visit orders

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

In **Demonstration 1**, A enters preorder before visiting B. B visits D, then enters inorder, visits E, and only then enters postorder. A similarly enters inorder after B and postorder after C. The three pushes belong to different moments of the same call. If you need just one traversal, retain only its push and array. Null children immediately return, so empty input produces three empty arrays rather than phantom node values.

We will calculate depth both from returned child answers and from explicit node/depth frames.

### Demonstration 2 — Compute maximum depth with calls or a stack

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

In **Demonstration 2**, node 7 reports depth one, its parent 9 reports two, and root 4 chooses that longer side to report three. The iterative version reaches the same answer by carrying depths 1, 2, and 3 in frames. Both visit every node; the explicit stack avoids failing on chains too deep for ordinary recursive calls. Check references against null rather than testing the truthiness of values, because a real node may legitimately contain zero.

We will visit a tree that is not a search tree, preserving inorder without relying on recursive calls.

### Demonstration 3 — Resume inorder visits from saved ancestors

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

In **Demonstration 3**, push 4 and 9 while walking left. At null, pop and visit 9, then walk to its right child 7. After 7 finishes, 4 is still waiting and must be visited before 2. That gives `[9,7,4,2]`, which is deliberately unsorted. The outer loop must continue when either current exists or the stack is nonempty. Reaching null is the signal to use a saved ancestor, not to abandon the traversal.

We will mirror the original objects, verify the returned root's identity, and mirror again to restore the structure.

### Demonstration 4 — Invert a tree while preserving its objects

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

In **Demonstration 4**, root 1 initially visits as `[1,2,4,3]`. Mirroring moves 3 to the left and the mirrored 2 subtree to the right, giving `[1,3,2,4]`. `invert(root) === root` is true because the existing root object changes. `oldLeft` keeps the original 2 subtree reachable while left is overwritten; without it, the second assignment could reuse the newly assigned child. A second inversion restores `[1,2,4,3]`.

We will freeze each level's nodes before collecting the next level, including a valid zero-valued root.

### Demonstration 5 — Visit complete levels with separate frontiers

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

In **Demonstration 5**, frontier begins `[1]`, then becomes `[2,3]`, then `[4,5,6]`. Processing 2 adds 4 and 5 to next without visiting them; processing 3 adds 6 after them. Appending left before right preserves left-to-right order. Current and next arrays coexist, but each holds at most w nodes, so together they need O(w) temporary references. Saved level arrays accumulate separately. The final call shows that a node holding zero produces `[[0]]` rather than being mistaken for absence.

## Worked Examples
<!-- lesson-id:w9-section-worked-examples -->

Walk through the A/B/C/D/E tree while keeping a finger at each paused call. Enter A, record preorder A, and pause it to visit B. Enter B, record preorder B, and visit D. D has no children, so all three of its visits finish before it returns. B resumes, records inorder B, visits E, then records postorder B. A resumes after B, records inorder A, processes C, and finally records postorder A. In particular, postorder B must follow both D and E because its push comes after both child calls.

For root 4 with left 9, right 2, and 9's right child 7, begin at the leaves. Null children return zero, so 7 returns one; 9 takes the larger child depth and returns two. Node 2 returns one, and root 4 returns three. Although each call makes two child calls, those subtrees share no nodes. We visit different pieces of the input, so the branching syntax does not imply exponential recomputation.

For BFS, write the frontiers `[1]`, `[2,3]`, and `[4,5,6]` on separate lines. While processing 2, append 4 and 5 to next but keep working on the current line. Processing 3 appends 6 after them. Only then move to that next line. This is FIFO reasoning expressed through whole levels: earlier discovered nodes stay ahead of later children.

## Visual Explanations
<!-- lesson-id:w9-section-visual-explanations -->

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

Read the horizontal chain as repeated single-child links, not as an array layout. In that shape, recursive DFS must remember a long path, while BFS holds only one level node. In the broad full tree, many nodes share a level and BFS needs a large frontier. Use the two shapes to explain which measure, h or w, controls each working container.

## Complexity Analysis
<!-- lesson-id:w9-section-complexity-analysis -->

For the table, let n count all nodes, h count nodes on the longest root-to-leaf path, and w count nodes on the widest level. Working space means temporary storage in addition to the input and the separately reported saved result.

| Implementation | Time | Working space | Stored result |
| --- | --- | --- | --- |
| Recursive DFS orders | Θ(n) | O(h) frames | Θ(n) values |
| Recursive maximum depth | Θ(n) | O(h) frames | O(1) number |
| Explicit-stack maximum depth | Θ(n) | O(h) upper bound | O(1) number |
| Iterative inorder | Θ(n) | O(h) stack | Θ(n) values |
| In-place inversion | Θ(n) | O(h) recursive frames | existing tree reused |
| Frontier level order | Θ(n) | O(w) frontier references | Θ(n) values and level arrays |

Every non-null node is visited once, and the number of missing-child checks is O(n), so traversal time is Θ(n). Recursive frames follow one active root-to-node path. In explicit DFS, each ancestor can leave at most one sibling waiting, giving O(h) pending frames. Yet the particular iterative depth algorithm holds only O(1) pending entries on a single-child chain. An upper bound need not be tight on every shape. Also keep bounds separate from cases: O describes an upper growth bound, not automatically a worst-case input category.

The frontier version's O(w) claim counts temporary data still reachable under the usual garbage-collected memory model. Once frontier is reassigned, the old array has no retained reference from this traversal. JavaScript does not promise immediate physical reclamation, but the program no longer keeps that array alive. A head-index queue that never compacts has a different retention pattern.

Suppose you use `queue=[root]`, append children, and remove work only by advancing head. Time remains Θ(n), but by the end the array retains n indexed entries and node references. Its active suffix may be O(w), yet its retained storage is O(n). Clearing old slots removes those references, but only compaction shortens the retained indexed region. The input root may itself continue to reach the entire tree; that is input storage, separate from the additional traversal container and returned output. State which quantity your memory claim counts.

## Common Mistakes
<!-- lesson-id:w9-section-common-mistakes -->

- Check search-tree order before expecting inorder to be sorted; binary shape alone is insufficient.
- Keep empty depth zero when counting nodes, so leaves correctly produce one.
- Choose the larger child depth for one longest path; adding branches counts different work.
- Test whether a node reference is null, not whether its stored value is truthy, or zero-valued nodes disappear.
- Freeze current-level membership before appending children, keeping deeper nodes out of this level's output.
- Inspect actual height before claiming logarithmic DFS memory; a chain has linear height.
- Inspect retained queue history before claiming width-bounded BFS storage; the active suffix alone is not the whole array.

This broken depth routine combines both branches by addition. Use a branching tree to see why that measures a different quantity.

### Demonstration 1 — Broken depth calculation adds separate paths

```javascript-bug
function depth(node) {
  if (node === null) return 0;
  return 1 + depth(node.left) + depth(node.right);
}
```

In broken **Demonstration 1**, a root with two leaf children returns `1 + 1 + 1`, or three. Its longest downward path has only two nodes. The routine actually counts all nodes. A chain conceals the bug because its node count equals its maximum depth, so include branching input when testing the contract.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w9-section-interview-and-leetcode-pattern-recognition -->

Prompts about levels, the nearest leaf, or the first depth meeting a condition suggest BFS because it finishes shallower work first. Combining child answers, subtree calculations, and height suggest postorder reasoning. Recording a parent before descendants suggests preorder. Sorted inorder can help only after you establish binary-search-tree order. Choose the visit moment based on what information the task needs.

Say what shape the input guarantees. A cyclic object graph can make these traversals repeat forever. A proper tree needs no visited Set because every non-root node has exactly one parent and cannot be reached by competing paths. If the tree may be a chain hundreds of thousands of nodes long, use an explicit stack or queue so the runtime's recursion limit does not stop an otherwise correct traversal.

## Practice Exercises
<!-- lesson-id:w9-section-practice-exercises -->

### Conceptual Questions

1. Draw root 4 with left child 9. Decide separately whether it satisfies binary-tree shape and strict binary-search-tree order, explaining each requirement.
2. Compare temporary storage for BFS and recursive DFS on a 100,000-node chain and on a complete tree. Name the shape measure behind each bound.

### Code Tracing

3. For root 4, left 9, right 2, and 9's right child 7, write all three DFS sequences. Then record the depth returned by every non-null subtree call.
4. Trace **Demonstration 5** in “JavaScript Implementations,” recording frontier and next after each processed node. Identify when an array becomes the new current level.

### Debugging Exercises

5. Find the smallest tree exposing broken **Demonstration 1** in “Common Mistakes.” Repair the recurrence and explain what the original addition actually calculates.
6. Trace an inorder loop whose outer condition is only `current !== null`. Show which saved ancestor gets abandoned when current first reaches null.

### Implementation Exercises

7. Build iterative maximum depth and test a deep chain. Construct and inspect the test input without recursive helpers so they cannot fail before the algorithm under test.
8. Implement `leafCount(root)`, first stating what one subtree call promises. Define the empty result and test a parent with only one child, which must not count as a leaf.

### LeetCode and HackerRank Practice

9. **[Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)** — LeetCode lists this as Medium. Practice BFS, fixed level membership, and FIFO ordering. Explain why children discovered while processing one level cannot belong to that same output group. The existing record reports prior official-page verification and no HackerRank consultation; no fresh verification occurred for this rewrite. Continue with the syllabus tasks Maximum Depth of Binary Tree and Invert Binary Tree, using the local demonstrations as worked references.

## Hints and Worked Solutions
<!-- lesson-id:w9-section-hints-and-worked-solutions -->

1. The drawing is a binary tree because no node has more than two children. It fails strict BST order because its left descendant 9 is larger than root 4. Shape and value order are separate requirements.
2. A chain has width one and depth n. Frontier BFS uses O(1) temporary references, while recursive DFS retains O(n) frames. A complete tree has logarithmic height and potentially linear width, reversing the comparison. The explicit-stack depth traversal in this chapter also keeps only O(1) pending entries on a chain, so distinguish it from recursive DFS.
3. The sequences are preorder `[4,9,7,2]`, inorder `[9,7,4,2]`, and postorder `[7,9,2,4]`. Nodes 7,9,2,4 return depths 1,2,1,3 respectively. Inorder is unsorted because no search-order promise was made.
4. Processing root builds next `[2,3]`. On the next level, processing 2 builds `[4,5]` and processing 3 extends it to `[4,5,6]`. Those newly discovered children wait until the following iteration rather than entering the level being output now.
5. Three nodes—a root with two leaves—are enough: node count is three but maximum depth is two. Replace addition of child results with `Math.max`, keeping the added one for the parent.
6. At a null left child, you need to resume the nearest saved ancestor. Therefore the outer condition must allow a nonempty stack even when current is null. Otherwise the traversal stops at precisely its first required return step.
7. Rebuild **Demonstration 2** in “JavaScript Implementations” and construct a deep chain with a loop. A recursive test constructor could hit the call limit before your iterative algorithm even starts, invalidating the intended test.
8. Promise to return the number of leaves in the supplied subtree. An empty subtree contributes zero, a node with no children contributes one, and any other node adds its children's counts. Here addition is appropriate because both branches contribute separate leaves.

### Demonstration 1 — Count leaves with a subtree return contract

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

In **Demonstration 1**, node 2 contributes one leaf and node 4 contributes one. Node 3 has a child, so it returns that child's count without adding another leaf for itself. Root returns two; the subtree rooted at 3 returns one; null returns zero. Every node is visited once, giving Θ(n) time and O(h) waiting frames.
9. Use **Demonstration 5** in “JavaScript Implementations” as the worked level-order solution. Test empty input, a zero-valued root, uneven shape, and a chain. If you convert it to a queue, freeze the live queue size at each level and analyze retained memory again; changing the container can change the space claim.

## Sources and Further Reading
<!-- lesson-id:w9-section-sources-and-further-reading -->

The existing source record dates consultation to 2026-11-07. We preserve that history without claiming a new external-link check. Code, traces, and storage comparisons are original teaching material following the repository syllabus.

- [MIT 6.006: Binary Trees, Part 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/376714cc85c6c784d90eec9c575ec027_MIT6_006S20_lec6.pdf) — the prior reading informed tree navigation and traversal-order discussion. Compare its conventions explicitly with our node-based depth before translating formulas.
- [LeetCode: Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) — the prior reading established the official left-to-right, level-grouped result contract and difficulty. The record reports no editorial consultation.

## Weekly Summary
<!-- lesson-id:w9-section-weekly-summary -->

You can now approach a tree by deciding what one smaller-subtree call must accomplish. DFS orders place the parent before, between, or after child work; BFS groups visits by complete levels. Track depth for waiting paths, width for frontiers, and actual retained containers for the final storage claim. [Week 10](week-10.md) builds on these shapes by adding value-order promises for search and priority selection.

## Weekly Progress Checklist

### Theory

- [ ] Produce all three DFS sequences and explain why binary shape does not establish BST order. <!-- checkpoint:w9-traversal-theory -->
- [ ] Derive maximum depth from correct child answers and a stated empty-tree convention. <!-- checkpoint:w9-subtree-contract -->

### JavaScript

- [ ] Build maximum depth using both waiting recursive calls and explicit node/depth frames. <!-- checkpoint:w9-depth-implementations -->
- [ ] Mirror existing links and collect complete levels with separate frontiers. <!-- checkpoint:w9-inversion-and-bfs -->

### Practice

- [ ] Trace an uneven shape and verify that zero-valued nodes remain in the results. <!-- checkpoint:w9-uneven-tree-practice -->
- [ ] Complete level-order traversal and derive a working leaf-count implementation. <!-- checkpoint:w9-level-and-leaf-practice -->

### Reflection

- [ ] Explain why retained queue history can exceed the active level frontier. <!-- checkpoint:w9-retained-storage-reflection -->
- [ ] Choose a traversal for a very deep chain and justify its behavior at JavaScript's recursion limit. <!-- checkpoint:w9-shape-reflection -->
