# Week 12 - Advanced Graphs

This week, you will be learning directed cycle detection, topological sorting, weighted shortest paths, and Dijkstra's algorithm. These ideas power course planning, build systems, and routing, where ordinary reachability alone does not answer the question.

We will start by distinguishing active DFS paths from finished work, then order dependencies with indegrees and implement Dijkstra with a real binary min-heap. An itinerary extension will contrast visiting vertices with consuming every edge.

By the end, you should be able to choose the right graph algorithm, defend its assumptions, reconstruct weighted routes, and trace stale entries without confusing discovery with settlement.

There will be a checklist at the end of this lesson covering Theory, JavaScript, Practice, and Reflection. Use it to record evidence in your progress logs.

## Learning Objectives

- Detect directed cycles using active/finished DFS states and Kahn's algorithm.
- Explain the remaining-indegree invariant and validate a topological order.
- Implement nonnegative weighted shortest paths with relaxation and stale-entry skipping.
- Reconstruct routes and account for unreachable vertices.
- Distinguish vertex traversal, shortest paths, and Euler trails.

## Prerequisite Knowledge

Review adjacency lists, discovery-time marking, and unweighted BFS in [Week 11](week-11.md). You need array indexes, `Map`, and the heap invariant: a parent's priority is no larger than either child's. A heap is not a sorted array; it guarantees only that the minimum is at the root. Greedy correctness will be studied more generally in [Week 13](week-13.md).

## Core Theory

### Directed cycles need more than a visited bit

Consider A→B→D and A→C→D. Reaching D twice does not form a cycle. In recursive DFS, distinguish undiscovered, active, and finished vertices. An edge to an active vertex returns to an ancestor on the current call path and closes a cycle. An edge to a finished vertex may merely join previously explored work. Mark active before visiting outgoing edges, then finished afterward. Start from every undiscovered vertex so disconnected cycles are included.

### Topological order describes prerequisites

A topological order places the source of every directed edge before its destination. Such an order exists exactly for a directed acyclic graph, or DAG. Kahn's algorithm stores each vertex's indegree: initially its number of incoming edges, then its number of incoming edges from vertices not yet removed. A zero-indegree vertex is ready. Output it, remove its outgoing edges by decrementing the corresponding counts, and enqueue each newly ready vertex.

Every output step is legal because the chosen vertex has no remaining prerequisite. If the queue empties before all vertices are output, every remaining vertex has a remaining predecessor. Following predecessors in a finite graph must repeat a vertex, revealing a cycle. Not every blocked vertex is itself on that cycle: a task downstream from a cycle is also blocked. Several valid orders may exist; FIFO does not promise the smallest lexicographic order.

### Dijkstra: discovery is not settlement

For each vertex, store the cheapest route discovered so far. Relaxing u→v with weight w asks whether `distance[u] + w` improves `distance[v]`. BFS processes edge-count layers; Dijkstra processes increasing tentative cost using a priority queue. With nonnegative weights, popping a current minimum settles its shortest distance.

Why is that safe? Suppose the chosen vertex u had a cheaper route. On that route, consider the first unsettled vertex x. Its settled predecessor already relaxed the edge into x. Thus x has a tentative distance no larger than the cost of that route's prefix. Nonnegative remaining edges make that prefix no more expensive than the whole cheaper route. Then x should have been popped before u, a contradiction. The role of nonnegativity is explicit; it is not a cosmetic input restriction. MIT's [Dijkstra notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6277a1f06100c26a7ff21031af6757b5_MIT6_006F11_lec16.pdf) discuss relaxation and shortest-path ordering.

A lazy heap inserts a fresh entry whenever a distance improves. The old entry remains but becomes stale. Compare the popped cost with the current distance and skip stale entries. Do not permanently mark a vertex when inserting it: a cheaper route may be found before it reaches the heap root. Strict improvement, rather than `<=`, also prevents zero-cost cycles from creating endless equal-cost entries.

## JavaScript Implementations

### Three-color cycle detection

The adjacency array represents vertices 0 through n−1 with valid integer neighbors. Recursive depth can reach n; use the following iterative topological method for very deep inputs.

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

### Kahn's algorithm

Edges here are `[before, after]`. Convert a Course Schedule pair `[course, prerequisite]` into that direction before calling. Parallel edges are supported because increments and decrements match. `null` means impossible; `[]` is the valid empty order.

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

### Complete binary-heap Dijkstra with route reconstruction

Vertices are integer indexes. Each adjacency entry is `[destination, weight]`. We require finite, nonnegative weights and finite accumulated costs; exact integer answers additionally require safe-integer sums. The function validates edges even in unreachable regions. A single-source run returns all distances and a route function. `Infinity` represents unreachable vertices; print it directly because JSON converts infinity to `null`.

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

Heap insertion repairs only the new leaf-to-root path. Removal moves the last leaf to the root and repairs downward through the smaller child. The complete-tree shape bounds either path by logarithmic height. Equal priorities need no lexical tie-break because this contract asks for one shortest route.

Read each heap entry as a pair of facts: the cost at the moment it was inserted, and the vertex to which that cost belongs. The heap compares only the first field. The distance array is the authoritative current answer; the heap contains work proposals that may be outdated. This separation explains why skipping a stale entry is safe: a newer, cheaper proposal has already been inserted for that vertex, so expanding the old proposal would only repeat inferior work. Parent links change at the same moment as a successful improvement, keeping the reconstructed route consistent with the stored cost.

### Extension: consuming edges with an Euler itinerary

Reconstruct Itinerary asks to use each ticket exactly once, permits revisiting airports, and promises a valid complete itinerary from JFK. Under that promise, Hierholzer's algorithm follows unused edges and appends vertices when stuck, then reverses the result. Reverse-sorting destinations lets `pop` choose the smallest available destination. Delayed output places dead-end segments after the detours that must precede them.

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

This is not a general validator. On arbitrary inputs, even a route of E+1 vertices can contain an invalid consecutive pair. Validate against the ticket multiset or check Euler-trail conditions if the existence promise is removed. Duplicate tickets remain separate list entries.

## Worked Examples

For Kahn's diamond, initial indegrees are `[0,1,1,2]`. Removing 0 releases 1 and 2. Removing 1 decreases 3 to one, so it still waits. Removing 2 releases 3. This is why “one prerequisite completed” is not the same as “all prerequisites completed.”

For the Dijkstra example:

| Current pop | Relaxations | Logical pending entries afterward |
| --- | --- | --- |
| (0,0) | d1=8, d2=2 | (2,2), (8,1) |
| (2,2) | d1=3, d3=11 | (3,1), (8,1), (11,3) |
| (3,1) | d3=5 | (5,3), (8,1), (11,3) |
| (5,3) | none | (8,1), (11,3) |
| (8,1) | stale; skip | (11,3) |
| (11,3) | stale; skip | empty |

The table lists pending entries by priority for readability, not the heap's literal array order. Vertex 4 stays unreachable. Route reconstruction walks 3→1→2→0 and reverses it.

In the itinerary, KUL is popped into reverse output first because it has no outgoing tickets. Traversal then consumes JFK→NRT→JFK. Reversing the completed sequence puts KUL last; committing it immediately as the second output airport would strand the other tickets.

## Visual Explanations

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

V counts vertices and E counts directed edges, including parallel edges. DFS colors and Kahn traversal take O(V+E) time. DFS uses O(V) colors and worst-case call stack; Kahn builds O(V+E) adjacency plus O(V) counts and queue. Its output is O(V).

The lazy Dijkstra above creates at most E+1 heap entries over the run. Each successful relaxation adds one; every settled vertex's outgoing edges are scanned once. The heap can contain O(E+1) entries, so the general bound is **O(V+E+(E+1) log(E+2)) time and O(V+E) auxiliary space** beyond the supplied graph. A reconstructed route takes O(V) time and output space. For simple graphs E≤V², this implies the familiar O((V+E) log(V+1)) bound. An indexed decrease-key heap instead maintains O(V) entries; do not silently attribute that memory bound to the lazy implementation.

Itinerary sorting costs O(E log(E+1)) comparisons in the worst case, followed by O(E) edge consumption. Graph, stack, and output take O(E+1) space. These bounds treat airport labels as bounded-length strings. Sorting complexity assumes a conventional efficient comparison-sort implementation; JavaScript does not mandate one algorithm.

## Common Mistakes

- Treating every edge to a visited node as a directed cycle rejects diamonds.
- Reversing prerequisite edges can yield an order that violates the question.
- Stopping Dijkstra when a target is inserted can return an expensive initial route. Stop only on its current, nonstale pop.
- Using negative weights breaks settlement. For S→A(2), S→B(5), B→A(−10), A's true distance is −5.
- Sorting a queue on every pop is not a heap and does not have logarithmic queue cost.
- A vertex-visited set cannot enforce “use every ticket”: tickets are edges.

```javascript-bug
if (!visited.has(v)) {
  visited.add(v); // Too early for Dijkstra settlement.
  distance[v] = distance[u] + weight;
}
```

## Interview and LeetCode Pattern Recognition

| Requested result | Candidate | Critical condition |
| --- | --- | --- |
| Reachability | DFS/BFS | follow legal direction |
| Minimum number of moves | BFS | equal edge costs |
| Valid prerequisite order | Kahn/DFS topological order | DAG required |
| Minimum weighted cost | Dijkstra | nonnegative weights |
| Every ticket exactly once | Euler-trail algorithm | edge consumption and valid start |

Course Schedule asks whether a valid order exists. Network Delay Time asks for the maximum finite shortest distance from a source, returning failure if any vertex is unreachable. A weighted DAG can use topological relaxation even with negative edges; a general graph with negative edges needs a different method such as Bellman–Ford. Do not choose from the word “graph” alone.

## Practice Exercises

### Conceptual

1. Why is an edge to a finished DFS vertex different from an edge to an active vertex?

### Tracing

2. Run Kahn on 0→1, 1→2, 2→1, 2→3, with isolated vertex 4. Which vertices remain, and which are on a cycle?

### Debugging

3. Use the weighted worked example to refute the broken visited fragment.

### Implementation

4. Adapt the Dijkstra result into a network-delay function. Handle an unreachable vertex explicitly.
5. Validate a proposed topological order with a position array. Include duplicate and missing vertices.

### LeetCode + HackerRank

- **[Course Schedule](https://leetcode.com/problems/course-schedule/)** — Platform: LeetCode. Difficulty: Medium. Concepts: directed cycles, indegrees, prerequisite modeling. Why: tests the conversion from `[course, prerequisite]` input to the correct dependency direction.
- **[Breadth First Search: Shortest Reach](https://www.hackerrank.com/challenges/bfsshortreach/problem)** — Platform: HackerRank. Difficulty: Medium. Concepts: equal-weight shortest paths, unreachable vertices, output ordering. Why: its edges all cost six, so it tests whether you recognize when BFS still suffices instead of automatically using Dijkstra.

## Hints and Worked Solutions

1. Active vertices lie on the current ancestor path, so a return edge closes a directed walk into a cycle. Finished vertices need not be ancestors; the diamond is the minimal useful contrast.
2. Initial indegrees are `[0,2,1,1,0]`. Remove 0 and 4 in either available order. Vertices 1,2,3 remain. Only 1 and 2 lie on the cycle; 3 is blocked downstream.
3. The fragment freezes vertex 1 at 8 after exploring 0. Vertex 2 later offers 2+1=3. Tentative discovery cannot be permanent; allow strict improvements and skip stale pops.
4. Run the full source search. If any distance is `Infinity`, return −1; otherwise take the maximum with an initial maximum of zero. This adds O(V) work. Avoid spreading a huge array into `Math.max`, which can exceed argument limits.
5. Require exactly V distinct valid vertex IDs. Assign each its index, then check `position[u] < position[v]` for every edge. That is O(V+E) time and O(V) space. Checking only adjacent output pairs misses dependencies spanning several positions.
For Course Schedule, first convert prerequisite pairs into before→after edges. Returning whether Kahn outputs V vertices solves the boolean task. For Shortest Reach, compute BFS edge counts, multiply reachable counts by six, omit the source from the ordered result, and use the problem's unreachable sentinel. For itinerary practice, explain why a visited-vertex set would prevent legal returns to JFK.

## Sources and Further Reading

- Canonical scope: [curriculum](../../shared/curriculum.js) and [weeks 9–12 textbook](../../shared/textbook/weeks09to12.js), including the itinerary extension.
- MIT OCW, [Lecture 16 Dijkstra notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6277a1f06100c26a7ff21031af6757b5_MIT6_006F11_lec16.pdf): opened and consulted for relaxation, DAG paths, and nonnegative shortest paths. The lazy-heap analysis here is specific to this chapter's implementation.
- MIT OCW, [lecture index](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/): verified further-reading entry for lecture 14 on DFS/topological sorting; that lecture's PDF was not consulted.
- LeetCode, [Course Schedule](https://leetcode.com/problems/course-schedule/), and HackerRank, [Breadth First Search: Shortest Reach](https://www.hackerrank.com/challenges/bfsshortreach/problem): official statements and displayed difficulty opened and verified; no editorials consulted.

## Weekly Summary

Directed cycles require active-path or remaining-indegree reasoning. Weighted paths require tentative costs and a justified processing order. Dijkstra's proof depends on nonnegative edges, while its actual heap design determines the precise cost bound. Euler itineraries consume edges and need a different invariant. Continue to [Week 13](week-13.md) to practice proving local choices safe.

## Weekly Progress Checklist

### Theory

- [ ] Distinguish active, finished, ready, tentative, and settled state. <!-- checkpoint:w12-explain-graph-state -->
- [ ] Explain the nonnegative-weight step in Dijkstra's proof. <!-- checkpoint:w12-prove-settlement -->

### JavaScript

- [ ] Implement Kahn's algorithm with the correct edge direction. <!-- checkpoint:w12-implement-kahn -->
- [ ] Implement heap-backed Dijkstra and reconstruct a route. <!-- checkpoint:w12-implement-dijkstra -->

### Practice

- [ ] Trace stale entries and a cycle with a blocked downstream vertex. <!-- checkpoint:w12-trace-edge-cases -->
- [ ] Separate shortest paths from consuming every ticket. <!-- checkpoint:w12-select-graph-pattern -->

### Reflection

- [ ] State the lazy heap's actual time and memory bounds aloud. <!-- checkpoint:w12-review-complexity -->
