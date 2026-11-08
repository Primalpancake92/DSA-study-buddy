# Week 12 - Advanced Graphs
<!-- lesson-id:w12-section-chapter-introduction -->

This week, we will learn to answer graph questions that require more than knowing whether a route exists. Can you finish a group of tasks if some depend on each other in a circle? If roads have different costs, which route is cheapest? These questions appear in course planning, software build systems, and routing.

We will distinguish work still on the current exploration path from work already finished, then put prerequisites into a legal order. For weighted routes, we will build Dijkstra's algorithm with a binary min-heap, a tree-shaped structure that efficiently retrieves the smallest pending cost. An itinerary extension will ask how to use every ticket exactly once.

By the end, you should be able to defend each algorithm's assumptions, recover weighted routes, and explain outdated heap entries. In particular, you will distinguish discovering a possible route from settling a vertex: proving that its cheapest distance is final.

Use the Theory, JavaScript, Practice, and Reflection checklist at the end to record evidence in your progress logs. Include traces showing what each kind of graph state means.

## Learning Objectives
<!-- lesson-id:w12-section-learning-objectives -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

- Detect directed cycles through active and finished DFS work, and through Kahn's prerequisite-removal algorithm.
- Explain why incoming-edge counts represent prerequisites still remaining, and validate a proposed topological order.
- Find shortest routes with nonnegative weights by improving tentative distances and skipping outdated heap entries.
- Recover routes through parent links and represent vertices that the source cannot reach.
- Distinguish exploring vertices, minimizing route cost, and taking an Euler trail that consumes every edge once.

## Prerequisite Knowledge
<!-- lesson-id:w12-section-prerequisite-knowledge -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Review neighbor lists, marking on discovery, and equal-cost BFS in [Week 11](week-11.md). You will use array indexes and `Map`. For heaps, remember the invariant: a parent's priority is no larger than either child's. Following that relationship down the tree shows that the minimum is at the root. It does not make the whole backing array sorted. We will study the broader question of why a local choice is safe in [Week 13](week-13.md).

## Core Theory
<!-- lesson-id:w12-section-core-theory -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Directed cycles need more than a visited bit

Consider A→B→D and A→C→D. Both branches reach D, but that alone gives no route returning to A. Repeated discovery is therefore insufficient evidence of a directed cycle.

Give each vertex three possible states. Undiscovered means exploration has not begun. Active means its recursive call has started but has not returned, so it lies on the current chain of calls. Finished means all outgoing edges have been explored. An edge returning to an active ancestor closes a cycle because that ancestor already has a directed path to the current vertex. Reaching a finished vertex may merely join another branch's completed work.

Mark active before exploring outgoing edges and finished afterward. Start from every undiscovered vertex, since a disconnected region can contain a cycle even when the first region does not.

### Topological order describes prerequisites

A topological order places the source of every directed edge before its destination. If u→v means “u must finish before v,” that is exactly a legal prerequisite order. Such an order exists precisely for a directed acyclic graph, or DAG: a directed graph without cycles.

Kahn's algorithm counts each vertex's incoming edges, called its indegree. Initially this is the full prerequisite count. During processing, it counts incoming edges from vertices not yet removed. That remaining-count meaning is the invariant. A zero-indegree vertex is ready: output it, decrement the counts for its outgoing edges, and enqueue each vertex whose count becomes zero.

Every output step is legal because no remaining prerequisite points into the chosen vertex. What if the queue empties before every vertex is output? Each remaining vertex has a remaining predecessor. Following predecessors in a finite graph must eventually repeat a vertex, revealing a cycle. A blocked task need not itself lie on that cycle; it may depend on a cyclic group.

Several valid orders may exist. A first-in, first-out queue chooses a legal available order, but does not promise the lexicographically smallest one, meaning the smallest under label-by-label comparison.

### Dijkstra: discovery is not settlement

For each vertex, keep the cheapest route discovered so far. Its cost is tentative because another route may improve it. Relaxing u→v with weight w means asking whether `distance[u] + w` improves `distance[v]`, then updating v if it does.

BFS processes layers of equal edge count. Dijkstra instead removes the smallest tentative cost from a priority queue. With nonnegative weights, removing a current minimum settles that vertex's shortest distance.

Here is the proof. Suppose the chosen vertex u actually has a cheaper route. On that route, take the first unsettled vertex x. Its settled predecessor has already relaxed the edge into x, so x's tentative distance is no larger than the route's cost up to x. Nonnegative remaining edges mean that prefix costs no more than the entire cheaper route. Then x should be removed before u, contradicting the choice of u as the current minimum.

The nonnegative condition is doing real work: continuing a route cannot lower its cost. MIT's [Dijkstra notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6277a1f06100c26a7ff21031af6757b5_MIT6_006F11_lec16.pdf) discuss this relaxation and processing-order argument.

Our lazy heap inserts a fresh entry whenever a distance improves instead of editing an existing entry. The old entry becomes stale: its cost no longer matches the distance array. Skip such entries when removed. Do not permanently mark on insertion, since a cost-eight offer can later improve to three. Require strict improvement rather than `<=`; otherwise zero-cost cycles can keep generating equal-cost entries forever.

## JavaScript Implementations
<!-- lesson-id:w12-section-javascript-implementations -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Three-color cycle detection

We will encode undiscovered, active, and finished as zero, one, and two. Supply an adjacency array for vertices 0 through n−1 with valid integer neighbors. Recursive depth can reach n and exceed JavaScript's call-stack limit. For deep inputs, the iterative topological approach in **Demonstration 2** also detects whether a cycle prevents completion.

### Demonstration 1 — Distinguish a directed diamond from a cycle

```javascript
function hasCycle(graph) {
  const color = Array(graph.length).fill(0);
  function visit(u) {
    color[u] = 1;
    for (const v of graph[u]) {
      if (color[v] === 1) {
        return true;
      }
      if (color[v] === 0 && visit(v)) {
        return true;
      }
    }
    color[u] = 2;
    return false;
  }
  for (let u = 0; u < graph.length; u++) {
    if (color[u] === 0 && visit(u)) {
      return true;
    }
  }
  return false;
}
console.log(hasCycle([[1, 2], [3], [3], []]));
console.log(hasCycle([[1], [2], [0]]));
console.log(hasCycle([]));
```
```output
false
true
false
```

In **Demonstration 1**, 0→1→3 finishes before the branch through 2 reaches 3. Color two at 3 is safe because its call has returned. In the second input, 0→1→2→0 reaches active color one and reports a cycle. The outer loop checks disconnected regions too. Empty input contains no cycle.

### Kahn's algorithm

We now want a legal prerequisite order. Edges are `[before, after]`, so convert a Course Schedule pair `[course, prerequisite]` into that direction. Parallel edges, meaning repeated edges between the same endpoints, are supported because every increment has a matching decrement. The result is `null` when impossible and `[]` for the valid empty order.

### Demonstration 2 — Release tasks after all prerequisites are removed

```javascript
function topologicalOrder(n, edges) {
  const graph = Array.from({
    length: n
  }, () => []);
  const indegree = Array(n).fill(0);
  for (const [u, v] of edges) {
    graph[u].push(v);
    indegree[v]++;
  }
  const ready = [];
  for (let u = 0; u < n; u++) {
    if (indegree[u] === 0) {
      ready.push(u);
    }
  }
  const order = [];
  for (let head = 0; head < ready.length; head++) {
    const u = ready[head];
    order.push(u);
    for (const v of graph[u]) {
      indegree[v]--;
      if (indegree[v] === 0) {
        ready.push(v);
      }
    }
  }
  return order.length === n ? order : null;
}
console.log(JSON.stringify(topologicalOrder(4, [[0, 1], [0, 2], [1, 3], [2, 3]])));
console.log(topologicalOrder(3, [[0, 1], [1, 0], [1, 2]]));
console.log(JSON.stringify(topologicalOrder(0, [])));
```
```output
[0,1,2,3]
null
[]
```

In **Demonstration 2**, the diamond starts with counts `[0,1,1,2]`. Removing 0 releases 1 and 2. Removing 1 leaves one prerequisite for 3; removing 2 finally releases 3. In the cyclic input, the queue cannot release the whole graph, so the output-length check returns `null`. With n zero, an empty order already includes every vertex.

### Complete binary-heap Dijkstra with route reconstruction

We will use a heap to find the cheapest pending route and record parents to recover it. Vertices are integer indexes, and each adjacency entry is `[destination, weight]`. We require finite nonnegative weights and finite accumulated costs. Exact integer answers also require safe-integer sums, within the range `Number` represents exactly.

The function validates every edge, even in unreachable regions. One source search returns all distances and a route function. Unreachable vertices retain `Infinity`; print it directly because JSON changes infinity into `null`.

### Demonstration 3 — Improve and settle routes with a lazy min-heap

```javascript
class MinHeap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
  }
  push(entry) {
    const a = this.items;
    a.push(entry);
    let i = a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (a[p][0] <= a[i][0]) {
        break;
      }
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    if (!a.length) {
      return undefined;
    }
    const result = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      while (2 * i + 1 < a.length) {
        let child = 2 * i + 1;
        if (child + 1 < a.length && a[child + 1][0] < a[child][0]) {
          child++;
        }
        if (a[i][0] <= a[child][0]) {
          break;
        }
        [a[i], a[child]] = [a[child], a[i]];
        i = child;
      }
    }
    return result;
  }
}
function dijkstra(graph, source) {
  const n = graph.length;
  if (!Number.isInteger(source) || source < 0 || source >= n) {
    throw new Error('Invalid source');
  }
  for (const neighbors of graph) {
    for (const [v, w] of neighbors) {
      if (!Number.isInteger(v) || v < 0 || v >= n) {
        throw new Error('Invalid endpoint');
      }
      if (!Number.isFinite(w) || w < 0) {
        throw new Error('Invalid weight');
      }
    }
  }
  const distance = Array(n).fill(Infinity);
  const parent = Array(n).fill(-1);
  const heap = new MinHeap();
  distance[source] = 0;
  heap.push([0, source]);
  while (heap.size) {
    const [cost, u] = heap.pop();
    if (cost !== distance[u]) {
      continue;
    }
    for (const [v, w] of graph[u]) {
      const candidate = cost + w;
      if (!Number.isFinite(candidate)) {
        throw new Error('Cost overflow');
      }
      if (candidate < distance[v]) {
        distance[v] = candidate;
        parent[v] = u;
        heap.push([candidate, v]);
      }
    }
  }
  function pathTo(target) {
    if (!Number.isInteger(target) || target < 0 || target >= n) {
      throw new Error('Invalid target');
    }
    if (distance[target] === Infinity) {
      return null;
    }
    const path = [];
    for (let v = target; v !== -1; v = parent[v]) {
      path.push(v);
    }
    return path.reverse();
  }
  return {
    distance,
    pathTo
  };
}
const result = dijkstra([[[1, 8], [2, 2]], [[3, 2]], [[1, 1], [3, 9]], [], []], 0);
console.log(result.distance.join(','));
console.log(JSON.stringify(result.pathTo(3)));
console.log(result.pathTo(4));
console.log(dijkstra([[[1, 0]], [[0, 0]]], 0).distance.join(','));
```
```output
0,3,2,5,Infinity
[0,2,1,3]
null
0,0
```

In **Demonstration 3**, removing source 0 offers eight for vertex 1 and two for vertex 2. Removing 2 improves vertex 1 to three and offers eleven for vertex 3. Removing 1 improves vertex 3 to five. Later costs eight and eleven fail the stale-entry check and do no edge work. Parents trace 3→1→2→0; reversing gives the returned route. Vertex 4 stays unreachable. The zero-cost cycle stops because equal offers are not improvements.

The heap compares each entry's first field, its cost when inserted. Insertion repairs the new leaf-to-root path. Removal moves the last leaf to the root and repairs downward through the smaller child. Its complete-tree shape fills levels before starting new ones, bounding either path by logarithmic height. Equal priorities need no label tie-break because we promise one shortest route.

Read the distance array as the authoritative current answer and the heap as dated work proposals. Skipping an outdated proposal is safe because its cheaper replacement was already scheduled. Parent changes occur together with successful distance improvements, keeping the recoverable route consistent with its cost.

### Extension: consuming edges with an Euler itinerary

Reconstruct Itinerary asks for every ticket exactly once, permits revisiting airports, and promises a complete itinerary from JFK. A walk consuming every edge once is an Euler trail. Under the existence promise, Hierholzer's algorithm follows unused edges, records airports when stuck, then reverses those records.

Reverse-sorting destinations lets `pop` choose the smallest available label. Delayed output is essential: a dead end belongs after the detours that must precede it, even if we encounter it early.

### Demonstration 4 — Use every ticket with delayed itinerary output

```javascript
function itinerary(tickets) {
  const graph = new Map();
  for (const [from, to] of tickets) {
    if (!graph.has(from)) {
      graph.set(from, []);
    }
    graph.get(from).push(to);
  }
  for (const list of graph.values()) {
    list.sort().reverse();
  }
  const stack = ['JFK'];
  const reverse = [];
  while (stack.length) {
    const list = graph.get(stack[stack.length - 1]);
    if (list?.length) {
      stack.push(list.pop());
    } else {
      reverse.push(stack.pop());
    }
  }
  return reverse.reverse();
}
console.log(JSON.stringify(itinerary([['JFK', 'KUL'], ['JFK', 'NRT'], ['NRT', 'JFK']])));
console.log(JSON.stringify(itinerary([])));
```
```output
["JFK","NRT","JFK","KUL"]
["JFK"]
```

In **Demonstration 4**, JFK takes KUL first, but KUL has no departure and enters reverse output. The stack still contains JFK, allowing JFK→NRT→JFK to be consumed. Reversing the recorded sequence puts KUL last. Empty tickets leave just JFK.

Keep the existence promise attached to this implementation. It is not a general validator: even E+1 returned vertices can contain an invalid consecutive pair on arbitrary input. Without the promise, validate against the ticket multiset, which records each ticket's multiplicity, or check Euler-trail conditions. Duplicate tickets remain separate consumable entries.

## Worked Examples
<!-- lesson-id:w12-section-worked-examples -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Revisit **Demonstration 2** in **JavaScript Implementations**. Initial diamond indegrees are `[0,1,1,2]`. Removing 0 releases 1 and 2, but 3 must wait for both. Its count becomes one after removing 1 and zero after removing 2. Completing one prerequisite is different from completing them all.

Here is the removal trace for **Demonstration 3** in **JavaScript Implementations**:

| Current pop | Relaxations | Logical pending entries afterward |
| --- | --- | --- |
| (0,0) | d1=8, d2=2 | (2,2), (8,1) |
| (2,2) | d1=3, d3=11 | (3,1), (8,1), (11,3) |
| (3,1) | d3=5 | (5,3), (8,1), (11,3) |
| (5,3) | none | (8,1), (11,3) |
| (8,1) | stale; skip | (11,3) |
| (11,3) | stale; skip | empty |

The pending entries are shown in priority order for readability; that is not the heap's literal array layout. Vertex 4 remains unreachable. Walking parents from 3 gives 3→1→2→0; reversing gives a route whose edge costs sum to five.

In **Demonstration 4** in **JavaScript Implementations**, KUL enters reverse output before JFK→NRT→JFK is consumed. Committing JFK,KUL immediately as the forward answer would strand the remaining tickets. Recording an exhausted airport and committing the final route are deliberately different operations.

## Visual Explanations
<!-- lesson-id:w12-section-visual-explanations -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Read the diamond's converging arrows as shared finished work, and the cycle's return arrow as a return to an active ancestor. In the weighted diagram, compare a direct offer with a later cheaper offer before deciding a distance is final.

```text
Directed diamond:       Directed cycle:
0 --> 1 --> 3           0 --> 1
 \--> 2 --/             ^     |
                         |_____|
Finished 3 is safe.      Active 0 closes a cycle.

Weighted routes:
0 --8--> 1 --2--> 3       direct discovery of 1: 8
 \       ^               improved discovery of 1: 2+1=3
  2      1               settled route to 3: 2+1+2=5
   \--> 2 --9--> 3
```

## Complexity Analysis
<!-- lesson-id:w12-section-complexity-analysis -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Let V count vertices and E count directed edges, including parallel edges. DFS coloring and Kahn's traversal take O(V+E) time because each vertex and adjacency entry is processed once. DFS uses O(V) colors and, in the worst case, O(V) nested calls. Kahn builds O(V+E) adjacency storage plus O(V) counts and queue; its order output takes O(V).

For **Demonstration 3** in **JavaScript Implementations**, start with one heap entry and add one per successful relaxation. Each settled vertex's outgoing edges are scanned once, so at most E+1 entries are created over the run. The heap may contain O(E+1) entries. Including validation and initialization gives **O(V+E+(E+1) log(E+2)) time and O(V+E) auxiliary space** beyond the supplied graph.

Recovering a route adds O(V) time and output space in the worst case. For simple graphs, without parallel edges, E≤V² implies the familiar O((V+E) log(V+1)) bound. An indexed decrease-key heap updates existing priorities and maintains O(V) entries. That entry-count guarantee does not apply to our lazy implementation.

Itinerary sorting costs O(E log(E+1)) comparisons in the worst case, then edge consumption costs O(E). Graph, stack, and output require O(E+1) space. This treats airport labels as bounded-length strings and assumes an efficient comparison sort. JavaScript does not mandate a particular sorting algorithm.

## Common Mistakes
<!-- lesson-id:w12-section-common-mistakes -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

- Reaching a previously visited vertex is not enough to prove a directed cycle. A diamond can reach a finished vertex safely; inspect active state.
- Convert prerequisite pairs into the declared edge direction. Correct processing of reversed edges still answers the wrong question.
- Stop a target-specific Dijkstra search only on its current nonstale removal. First insertion may be an expensive offer.
- Keep the nonnegative-weight assumption. For S→A(2), S→B(5), B→A(−10), A's true distance is −5 even though it can be removed at two first.
- Sorting a whole queue on each removal is not a heap and does not provide logarithmic queue operations.
- Track tickets as edges. A vertex-visited set cannot represent “use every ticket” and forbids legal returns to an airport.

The deliberately broken fragment makes a first weighted discovery permanent. Trace an expensive first offer followed by a cheaper one to expose the mistake.

### Demonstration 1 — Broken settlement at insertion time

```javascript-bug
if (!visited.has(v)) {
  visited.add(v); // Too early for Dijkstra settlement.
  distance[v] = distance[u] + weight;
}
```

In broken **Demonstration 1**, source 0 first offers vertex 1 cost eight and marks it visited. Vertex 2 later offers cost three, but the mark blocks that improvement. Allow tentative distances to improve strictly and skip outdated removals. The first offer is not proof that a vertex is settled.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w12-section-interview-and-leetcode-pattern-recognition -->

| Requested result | Candidate | Critical condition |
| --- | --- | --- |
| Reachability | DFS/BFS | follow legal direction |
| Minimum number of moves | BFS | equal edge costs |
| Valid prerequisite order | Kahn/DFS topological order | DAG required |
| Minimum weighted cost | Dijkstra | nonnegative weights |
| Every ticket exactly once | Euler-trail algorithm | edge consumption and valid start |

Use the requested result to choose among these candidates. Course Schedule asks whether an order exists. Network Delay Time asks when all vertices can receive a signal: take the largest finite shortest distance, but report failure if any vertex is unreachable.

Graph promises also matter. A weighted DAG supports topological relaxation even with negative edges because predecessors are processed first. A general graph with negative edges needs another method, such as Bellman–Ford. The word “graph” describes the model, not a complete algorithm choice.

## Practice Exercises
<!-- lesson-id:w12-section-practice-exercises -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Conceptual

1. Explain why reaching a finished DFS vertex differs from reaching an active one. Use a diamond and a cycle to identify which calls are still unfinished.

### Tracing

2. Run Kahn on 0→1, 1→2, 2→1, 2→3, with isolated vertex 4. Record indegrees and removals. Which remaining vertices actually lie on a cycle?

### Debugging

3. Use **Demonstration 3** in **JavaScript Implementations** to refute broken **Demonstration 1** in **Common Mistakes**. Identify the frozen distance and rejected improvement.

### Implementation

4. Adapt the Dijkstra result into network delay. Explicitly handle an unreachable vertex and explain why the maximum shortest distance answers the question.
5. Validate a proposed topological order with a position array. Reject duplicate, missing, and invalid vertices before checking every edge.

### LeetCode + HackerRank

- **[Course Schedule](https://leetcode.com/problems/course-schedule/)** — LeetCode, Medium. Practice directed cycles, indegrees, and prerequisite modeling. Explain the conversion from `[course, prerequisite]` into prerequisite-to-course direction as part of your solution.
- **[Breadth First Search: Shortest Reach](https://www.hackerrank.com/challenges/bfsshortreach/problem)** — HackerRank, Medium. Every edge costs six, so BFS edge counts still determine minimum cost. Practice unreachable vertices and output order, and explain why equal weights make a heap unnecessary.

## Hints and Worked Solutions
<!-- lesson-id:w12-section-hints-and-worked-solutions -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

1. An active vertex is an ancestor on the current call path, so an edge returning to it closes a directed cycle. A finished vertex need not be an ancestor. The diamond reaches D from a second branch only after D's call has returned, without implying any path back.
2. Start with `[0,2,1,1,0]`. Remove 0 and 4 in either available order. The count at 1 remains positive because of 2→1, and 1,2,3 stay blocked. Only 1 and 2 form the cycle; 3 depends on it downstream.
3. The broken fragment freezes vertex 1 at eight while processing source 0. Vertex 2 later offers 2+1=3, but the visited condition refuses it. Permit strict distance improvements, schedule their new entries, and discard stale entries when removed.
4. Finish the full source search. If any distance is `Infinity`, return −1; otherwise scan for the maximum starting at zero. This adds O(V) work. Avoid spreading a huge array into `Math.max`, since JavaScript's argument-count limits can be exceeded even when the array fits in memory.
5. Require exactly V distinct valid IDs, assign each its output index, then check `position[u] < position[v]` for every edge. This costs O(V+E) time and O(V) space. Checking only adjacent output pairs misses prerequisites spanning multiple positions.

For Course Schedule, convert pairs to before→after edges and return whether Kahn outputs V vertices. For Shortest Reach, multiply reachable BFS counts by six, omit the source, preserve the required order, and use the problem's special unreachable value. For itinerary practice, explain why revisiting JFK is legal and why marking airports permanently would forbid a necessary return.

## Sources and Further Reading
<!-- lesson-id:w12-section-sources-and-further-reading -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

- The [curriculum](../../shared/curriculum.js) and [weeks 9–12 textbook](../../shared/textbook/weeks09to12.js) establish scope, including the itinerary extension.
- MIT OCW's [Lecture 16 Dijkstra notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6277a1f06100c26a7ff21031af6757b5_MIT6_006F11_lec16.pdf) were consulted during earlier preparation for relaxation, DAG paths, and nonnegative shortest paths. The lazy-heap analysis describes this chapter's implementation.
- MIT OCW's [lecture index](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/) was previously verified as a further-reading entry for lecture 14 on DFS/topological sorting. That lecture's PDF was not consulted. This rewrite does not claim a new external-link verification.
- The official [Course Schedule](https://leetcode.com/problems/course-schedule/) and [Breadth First Search: Shortest Reach](https://www.hackerrank.com/challenges/bfsshortreach/problem) statements and difficulties were checked during earlier preparation; no editorials were consulted.

## Weekly Summary
<!-- lesson-id:w12-section-weekly-summary -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Tie each graph state to its purpose. Active-path state detects directed cycles, and remaining indegree identifies tasks ready to run. Tentative distance records the best offer so far; a current minimum removal settles it under nonnegative weights. The actual heap entry policy determines storage and runtime bounds. An Euler itinerary instead tracks unused edges and delays output. Continue to [Week 13](week-13.md) to practice proving that other local choices preserve a correct completion.

## Weekly Progress Checklist

### Theory

- [ ] Explain active, finished, ready, tentative, and settled in your own words. <!-- checkpoint:w12-explain-graph-state -->
- [ ] Identify the exact step of Dijkstra's proof that requires nonnegative weights. <!-- checkpoint:w12-prove-settlement -->

### JavaScript

- [ ] Implement Kahn and explain the direction of every prerequisite edge. <!-- checkpoint:w12-implement-kahn -->
- [ ] Build heap-backed Dijkstra and recover a route through parent links. <!-- checkpoint:w12-implement-dijkstra -->

### Practice

- [ ] Trace stale entries and separate a cycle from tasks blocked downstream. <!-- checkpoint:w12-trace-edge-cases -->
- [ ] Explain why minimizing route cost differs from consuming every ticket. <!-- checkpoint:w12-select-graph-pattern -->

### Reflection

- [ ] Derive the lazy heap's time and memory bounds aloud from its entry count. <!-- checkpoint:w12-review-complexity -->
**On the video:** pause here and say the goal out loud: reflection. Then predict the next step before you read the explanation.
