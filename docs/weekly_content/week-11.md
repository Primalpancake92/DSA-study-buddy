# Week 11 - Graph Foundations

This week, you will be learning graph modeling, adjacency lists, visited sets, BFS, DFS, and connected components. These skills matter whenever routes converge, relationships cross, or a connection leads back to somewhere you have already been.

We will start by deciding what vertices and edges represent, then implement component traversal and shortest unweighted routes. Grids and graph cloning will show how the same ideas apply when no ordinary edge list is supplied.

By the end, you should be able to explain why traversal terminates, reconstruct a shortest unweighted route, count disconnected groups, and preserve object identity while cloning a graph.

There will be a checklist at the end of this lesson covering Theory, JavaScript, Practice, and Reflection. Use it to record evidence in your progress logs.

## Learning Objectives

- Translate a story into explicit vertices, edges, direction, and weights.
- Compare adjacency lists, matrices, and implicit neighbor generation.
- Implement iterative DFS, BFS with predecessors, flood fill, and graph cloning.
- Prove discovery-time marking prevents repeated scheduling.
- Derive traversal costs by counting vertices and adjacency entries.

## Prerequisite Knowledge

You need arrays, object references, `Map`, `Set`, and stack/queue behavior. A stack removes the latest item; a queue removes the oldest. Recursion is useful background, but the implementations use explicit worklists to avoid JavaScript call-stack limits. Graph traversal extends tree traversal by remembering discoveries: a graph may have multiple routes to the same object. Weighted traversal is developed next in [Week 12](week-12.md).

## Core Theory

### Start with a model

Before choosing BFS or DFS, finish this sentence: “A vertex represents ___, and an edge represents ___.” For a friendship network, people are vertices and friendships are undirected edges. For a follower network, edges are directed: following someone does not imply they follow you. A weighted edge carries a cost; an unweighted edge counts as one step. A path follows edges, and a cycle returns to a vertex already on that path. An isolated vertex still belongs to the graph even though it has no neighbors.

An adjacency list stores neighbors separately for every vertex. An undirected edge contributes two entries, one at each endpoint. A matrix stores one cell for every possible ordered pair: it makes an edge query direct but allocates quadratic space. An edge list is convenient input, yet scanning the entire list every time you want neighbors repeats work. For a grid, generate neighboring coordinates when needed instead of storing all edges.

### Discovery is a commitment to process once

Imagine a triangle A–B–C–A. Without a visited set, following connections can continue forever. Mark a vertex when you add it to the worklist. The invariant is: every queued or stacked vertex has already been marked, and no vertex is scheduled twice. Marking only after exploring children fails because a child can return to an unfinished ancestor before that mark exists.

DFS uses a stack and follows recently discovered work. BFS uses a queue and explores distance layers. Both solve reachability. Only BFS first discovery guarantees a route with the fewest edges when every edge costs the same. If a shorter route to a newly discovered vertex existed, its preceding vertex would have appeared in an earlier BFS layer and discovered it already. That contradiction proves the distance claim. MIT's [BFS notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/1208e162775f6f5cedfbb9f2b694ede0_MIT6_006F11_lec13.pdf) provide a formal treatment of layers and predecessors.

### Components and identity

An undirected connected component is a maximal set of vertices joined by paths. One traversal finds one component; an outer loop over every vertex finds all components, including isolated ones. This is not a strongly connected component algorithm for directed graphs: one-way reachability is not mutual reachability.

Cloning adds another requirement. Two nodes with equal values can still be different objects. A correct clone preserves cycles and shared references while allocating new nodes. The useful dictionary is original-object → cloned-object, not value → clone. Register a new clone before scheduling its neighbors so a back edge can reuse it immediately.

## JavaScript Implementations

### Adjacency and iterative component traversal

The contract uses distinct string vertex labels, known edge endpoints, and an undirected graph. Creating a fresh neighbor array for each label matters; a shared array would connect unrelated vertices accidentally.

```javascript
function components(vertices, edges) {
  const graph = new Map(vertices.map(v => [v, []]));
  for (const [a, b] of edges) {
    if (!graph.has(a) || !graph.has(b)) {
      throw new Error('Unknown vertex');
    }
    graph.get(a).push(b);
    graph.get(b).push(a);
  }
  const seen = new Set();
  const groups = [];
  for (const start of vertices) {
    if (seen.has(start)) {
      continue;
    }
    const stack = [start];
    const group = [];
    seen.add(start);
    while (stack.length) {
      const node = stack.pop();
      group.push(node);
      for (const next of graph.get(node)) {
        if (seen.has(next)) {
          continue;
        }
        seen.add(next);
        stack.push(next);
      }
    }
    groups.push(group);
  }
  return groups;
}
console.log(JSON.stringify(components(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'A']])));
console.log(JSON.stringify(components([], [])));
```
```output
[["A","C","B"],["D"]]
[]
```

### BFS with a route, not just a yes/no answer

This function accepts a complete adjacency `Map` with string labels. Directed lists work too. `null` means no route; a source-to-itself route contains one vertex and zero edges. The distance map doubles as the visited structure. A head index avoids repeatedly shifting an array.

```javascript
function shortestPath(graph, source, target) {
  if (!graph.has(source) || !graph.has(target)) {
    return null;
  }
  const distance = new Map([[source, 0]]);
  const parent = new Map();
  const queue = [source];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    if (node === target) {
      break;
    }
    for (const next of graph.get(node)) {
      if (distance.has(next)) {
        continue;
      }
      distance.set(next, distance.get(node) + 1);
      parent.set(next, node);
      queue.push(next);
    }
  }
  if (!distance.has(target)) {
    return null;
  }
  const path = [target];
  while (path[path.length - 1] !== source) {
    path.push(parent.get(path[path.length - 1]));
  }
  path.reverse();
  return {
    distance: distance.get(target),
    path
  };
}
const graph = new Map([['A', ['B', 'C']], ['B', ['A', 'D']], ['C', ['A', 'D']], ['D', ['B', 'C']], ['E', []]]);
console.log(JSON.stringify(shortestPath(graph, 'A', 'D')));
console.log(JSON.stringify(shortestPath(graph, 'A', 'A')));
console.log(shortestPath(graph, 'A', 'E'));
```
```output
{"distance":2,"path":["A","B","D"]}
{"distance":0,"path":["A"]}
null
```

### Islands are implicit components

The input is a rectangular grid of string cells `'0'` and `'1'`. This version leaves it unchanged. Multiplying row by column count gives each cell a unique integer key. Four directions deliberately exclude diagonal connections.

```javascript
function islands(grid) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (grid.some(row => row.length !== cols)) {
    throw new Error('Ragged grid');
  }
  const seen = new Set();
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = r * cols + c;
      if (grid[r][c] !== '1' || seen.has(key)) {
        continue;
      }
      count++;
      seen.add(key);
      const stack = [[r, c]];
      while (stack.length) {
        const [x, y] = stack.pop();
        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= rows || ny < 0 || ny >= cols) {
            continue;
          }
          const nextKey = nx * cols + ny;
          if (grid[nx][ny] !== '1' || seen.has(nextKey)) {
            continue;
          }
          seen.add(nextKey);
          stack.push([nx, ny]);
        }
      }
    }
  }
  return count;
}
console.log(islands([['1', '1', '0'], ['0', '1', '0'], ['1', '0', '1']]));
console.log(islands([['1', '0'], ['0', '1']]));
console.log(islands([]));
```
```output
3
2
0
```

### Clone shared references faithfully

```javascript
function cloneGraph(start) {
  if (start === null) {
    return null;
  }
  const copies = new Map([[start, {
    value: start.value,
    neighbors: []
  }]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    for (const next of node.neighbors) {
      if (!copies.has(next)) {
        copies.set(next, {
          value: next.value,
          neighbors: []
        });
        queue.push(next);
      }
      copies.get(node).neighbors.push(copies.get(next));
    }
  }
  return copies.get(start);
}
const a = {
  value: 7,
  neighbors: []
};
const b = {
  value: 7,
  neighbors: []
};
a.neighbors = [b, b];
b.neighbors = [a];
const copy = cloneGraph(a);
console.log(copy !== a, copy.neighbors[0] !== b);
console.log(copy.neighbors[0] === copy.neighbors[1]);
console.log(copy.neighbors[0].neighbors[0] === copy);
console.log(cloneGraph(null));
```
```output
true true
true
true
null
```

## Worked Examples

For the BFS diamond, watch discovery rather than removal alone:

| Removed | Newly discovered | Pending queue | Recorded distances |
| --- | --- | --- | --- |
| A | B, C | B, C | A=0, B=1, C=1 |
| B | D | C, D | D=2 |
| C | none | D | D remains 2 |
| D | stop | empty | route A–B–D |

C does not replace D's predecessor merely because another route exists. Both routes have length two, and the contract asks for one. DFS might find a longer route first on a different graph, so its first parent assignment lacks the same distance proof.

In the islands example, the first traversal covers `(0,0)`, `(0,1)`, and `(1,1)`. The outer scan later starts at `(2,0)` and `(2,2)`, producing three components. Every traversal stays inside one component because it follows only legal land edges; every reachable land cell is eventually scheduled. Those two facts justify counting once per new start.

For cloning, the first A→B edge creates B's copy. The second A→B edge reuses it. B→A retrieves the already registered A copy. Equal values never enter the identity decision.

## Visual Explanations

```text
      B                 BFS layers
     / \                0: A
    A   D      E        1: B C
     \ /                2: D       unreachable: E
      C

Original: A --two references--> B --back reference--> A
Clone:    A'--two references--> B'--back reference--> A'
No clone edge points into the original graph.
```

## Complexity Analysis

Let V be vertices and E edges, counting duplicate edges separately. Assume expected constant-time `Map`/`Set` operations.

| Operation | Time | Working space beyond supplied input | Output |
| --- | --- | --- | --- |
| Build adjacency and components | O(V+E) | O(V+E), including new graph | O(V) |
| BFS on supplied adjacency | O(V+E) worst case | O(V) | O(V) route |
| Adjacency-matrix traversal | O(V²) worst case | O(V) beyond matrix | depends on task |
| Islands on R×C grid | O(RC+R), including shape validation | O(RC) | O(1) count |
| Clone reachable graph | O(V+E) | O(V) | O(V+E) |

The nested neighbor loop does not imply V×E: across the entire traversal, all neighbor lists contain E directed entries or 2E undirected entries. A head-index queue retains processed slots, so report O(V) backing storage. Replacing land with water removes the visited set but does not remove the traversal stack; mutation alone does not prove constant space.

## Common Mistakes

- Building vertices only from edges loses isolated vertices.
- Testing `distance.get(v)` for truthiness mistakes distance zero for absence; use `has`.
- Marking after recursion permits a two-way edge to recurse forever.
- Forgetting reverse edges changes an undirected graph into a directed one.
- Treating labels as identity corrupts a clone when values repeat.
- Using one global visited set for a no-reuse word-search path is wrong: path-specific restrictions must be undone, as [Week 15](week-15.md) explains.

This intentionally broken fragment shares one array across all vertices:

```javascript-bug
const graph = Array(3).fill([]);
graph[0].push(1); // All three rows now contain 1.
```

## Interview and LeetCode Pattern Recognition

“Connected groups” suggests an outer scan plus traversal; “fewest moves” suggests BFS only if moves have equal cost. “Clone” suggests an identity map as well as traversal. Number of Islands hides adjacency in coordinate rules; Clone Graph exposes it as object references. Find Center of Star Graph permits a shortcut: under a valid-star guarantee with at least three vertices, the common endpoint of the first two edges is the center. That shortcut is not a general center-finding algorithm.

Ask whether you need all vertices or only the source's reachable region, whether edges are directed, and whether a shortest answer means fewest edges or minimum weight. Those questions determine the model before any loop is written.

## Practice Exercises

### Conceptual

1. Explain why undirected component counting cannot be reused unchanged to count strongly connected components.

### Tracing

2. Trace BFS on S–A, A–B, B–T, S–C, C–T. Explore A before C. Record parents and distances.

### Debugging

3. Repair the shared-array fragment and explain the aliasing, not just the replacement syntax.

### Implementation

4. Extend component traversal to return the largest component size, including an empty graph.
5. Add diagonal neighbors to the islands solver. Predict the opposite-corner result before running it.

### LeetCode + HackerRank

- **[Number of Islands](https://leetcode.com/problems/number-of-islands/)** — Platform: LeetCode. Difficulty: Medium. Concepts: implicit graphs, four-direction components, discovery-time marking. Why: tests whether you can translate a grid into traversal while explaining mutation and memory choices.
- **[DFS: Connected Cell in a Grid](https://www.hackerrank.com/challenges/ctci-connected-cell-in-a-grid/problem)** — Platform: HackerRank. Difficulty: Hard, as displayed on the verified official page. Concepts: flood fill, eight-direction adjacency, largest component. Why: changes both the neighborhood and requested aggregate, testing your model rather than a memorized island counter.

## Hints and Worked Solutions

1. Hint: try A→B. Both vertices are reachable from A, but B cannot return. They form two strongly connected components; the ordinary outer traversal can group them as one depending on start order.
2. S discovers A and C at distance one. A discovers B at two; C discovers T at two. B cannot overwrite T. A valid shortest route is S,C,T. A DFS taking A first could return the three-edge route S,A,B,T.
3. Use a factory such as `Array.from({length: 3}, () => [])`. `fill` repeats the same reference; a factory creates three distinct arrays.
4. Keep a size counter inside each traversal and update a maximum afterward, initially zero. Every vertex is still processed once, so time remains O(V+E). You can omit group output if only the maximum is requested.
5. Add offsets `(1,1)`, `(1,-1)`, `(-1,1)`, `(-1,-1)`. Opposite-corner land becomes one island. Eight remains a constant number of neighbor checks, so asymptotic cost stays O(RC).
For Number of Islands, a complete argument names the four-direction land graph, proves traversal covers exactly one island, and shows the outer scan starts once per island. Test empty input, all water, a cycle of land, and diagonal-only contact. For Connected Cell, use numeric cells, eight directions, and a maximum size rather than a component count. For cloning practice, test two equal-valued nodes and a self-loop, not only a chain.

## Sources and Further Reading

- Canonical scope consulted: [curriculum](../../shared/curriculum.js) and [weeks 9–12 textbook](../../shared/textbook/weeks09to12.js). Explanations, examples, and exercises here are independently written for this chapter.
- MIT OCW, [Lecture 13 BFS notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/1208e162775f6f5cedfbb9f2b694ede0_MIT6_006F11_lec13.pdf): opened and consulted for representation, layers, and parent-pointer terminology.
- LeetCode, [Number of Islands](https://leetcode.com/problems/number-of-islands/), and HackerRank, [DFS: Connected Cell in a Grid](https://www.hackerrank.com/challenges/ctci-connected-cell-in-a-grid/problem): official statements and displayed difficulty opened and verified; no editorial solutions consulted.

## Weekly Summary

Graph traversal begins with a precise relationship model. Discovery-time marking prevents duplicate work; the worklist order decides whether you explore deeply or by distance layer. Components require an outer scan, grids can generate edges implicitly, and cloning requires object identity. Continue to [Week 12](week-12.md) when you can explain those choices without relying on memorized code.

## Weekly Progress Checklist

### Theory

- [ ] Explain directed, undirected, weighted, and implicit graphs. <!-- checkpoint:w11-model-relationships -->
- [ ] Prove why BFS first discovery gives minimum edge count. <!-- checkpoint:w11-prove-bfs-layers -->

### JavaScript

- [ ] Implement iterative components and BFS with path reconstruction. <!-- checkpoint:w11-build-traversals -->
- [ ] Clone a cycle while preserving shared object references. <!-- checkpoint:w11-clone-identity -->

### Practice

- [ ] Complete the trace, aliasing repair, and islands exercise. <!-- checkpoint:w11-complete-exercises -->
- [ ] Account separately for graph storage, working memory, and output. <!-- checkpoint:w11-account-memory -->

### Reflection

- [ ] Record a counterexample to one incorrect traversal assumption. <!-- checkpoint:w11-review-counterexample -->
