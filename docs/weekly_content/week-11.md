# Week 11 - Graph Foundations
<!-- lesson-id:w11-section-chapter-introduction -->

This week, we will learn to describe connected things precisely enough that a program can explore them. A graph is a collection of things and the connections between them: cities and roads, people and friendships, or cells you can move between on a board. Unlike a tree, those connections can meet again or lead you back to your starting point. Our program needs to remember where it has been.

We will first name the things and connections, formally called vertices and edges. Then we will store neighbors in adjacency lists, remember discoveries in a visited set, and explore with breadth-first search (BFS) and depth-first search (DFS). You will use those tools to find connected groups and routes with the fewest steps. A grid and a graph made of linked objects will help you recognize the same problem in different clothing.

By the end, you should be able to explain why exploration stops, recover an actual shortest route when every edge has equal cost, and count groups that cannot reach each other. You should also be able to copy a graph while preserving which references point to the same object, even when two objects happen to contain equal values.

Use the final Theory, JavaScript, Practice, and Reflection checklist to record evidence in your progress logs. A useful entry includes a trace or counterexample that you can explain yourself, rather than only a note that you read the chapter.

## Learning Objectives
<!-- lesson-id:w11-section-learning-objectives -->

- Turn a story into vertices and edges, and say whether connections work both ways and whether they carry costs.
- Compare a neighbor list, a table of possible connections, and rules that generate neighbors only when needed.
- Write DFS with an explicit stack, recover a BFS route through predecessor links, explore a connected grid region with flood fill, and clone linked graph objects.
- Explain why marking a vertex as soon as you discover it prevents putting the same work on the schedule twice.
- Derive exploration costs by counting vertices and stored neighbor entries across the whole run.

## Prerequisite Knowledge
<!-- lesson-id:w11-section-prerequisite-knowledge -->

**Before exploring:** Turn the story into “things” and “connections,” then decide what must be remembered. Worklists make pending exploration visible, while a visited set prevents cycles and duplicate scheduling.

You will use arrays, references to objects, `Map` for key/value associations, and `Set` for remembering membership without duplicates. A stack takes out the item added most recently; a queue takes out the oldest waiting item. We use these as worklists: collections of vertices still waiting to be explored.

If you know recursion, you can think of the explicit stack as making pending calls visible in an array. This avoids relying on JavaScript's limited call stack. The important change from tree traversal is that several routes may reach the same object, so we must remember discoveries. We develop routes with unequal edge costs next in [Week 12](week-12.md).

## Core Theory
<!-- lesson-id:w11-section-core-theory -->

**Whiteboard route:** model a graph, mark discovery at scheduling time, compare DFS with BFS layers, and finish by preserving object identity while cloning. We will keep representation, correctness, and complexity as three separate questions.

### Start with a model

Before choosing an exploration method, finish this sentence: “A vertex represents ___, and an edge represents ___.” In a friendship network, a person is a vertex and a friendship is an undirected edge: the connection works in both directions. In a follower network, an edge is directed, meaning it has a particular direction. You can follow someone without them following you.

An edge with an attached cost is weighted. In an unweighted graph, we count each edge as one step. A path is a sequence of vertices connected by edges; a cycle returns to a vertex already on that path. Do not forget a person with no connections: that isolated vertex still belongs to the graph, even though its neighbor list is empty.

To find where we can go next, we need a representation. An adjacency list gives each vertex its own collection of neighbors. For an undirected connection A–B, store B in A's list and A in B's list. Those two entries describe one edge.

An adjacency matrix instead reserves a table cell for every ordered pair of vertices. You can inspect a single cell to ask whether A connects to B, but V vertices require V² cells, even when almost none are connected. An edge list is a collection of endpoint pairs. It is convenient input, but repeatedly searching the entire collection for one vertex's neighbors wastes work. On a grid, we can generate neighboring coordinates from movement rules instead. Such a graph is implicit: its edges are described by rules rather than stored individually.

### Discovery is a commitment to process once

Imagine walking around A–B–C–A. If we keep following connections without remembering discoveries, we can circle forever. Mark each vertex when you add it to the worklist, rather than waiting until its exploration ends.

This gives us a statement that stays true throughout the loop, called an invariant: every vertex in the queue or stack is already marked, and no vertex is scheduled twice. Once A schedules B, any other edge reaching B sees that mark and leaves it alone. If recursive exploration marks only after its children return, B can follow its reverse edge back to the unfinished A before A has a mark. The protection arrives too late.

Depth-first search, or DFS, uses a stack to pursue recently discovered work before older alternatives. Breadth-first search, or BFS, uses a queue to explore in layers: first distance zero, then one edge away, then two edges away. Both answer reachability, meaning whether a legal path exists.

BFS also guarantees that first discovery gives a route with the fewest edges when all edges cost the same. To see why, suppose we first discover a vertex at distance three but a two-edge route exists. The preceding vertex on that shorter route is only one edge away. BFS would process that earlier layer first and discover our vertex at distance two, contradicting the supposed first discovery. The same argument works at every distance. DFS's stack does not preserve this layer order. MIT's [BFS notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/1208e162775f6f5cedfbb9f2b694ede0_MIT6_006F11_lec13.pdf) give a formal treatment of layers and predecessors, the vertices through which we first reached later vertices.

### Components and identity

In an undirected graph, a connected component is a maximal set of vertices joined by paths. Here maximal means that you cannot add another vertex while keeping that property. One traversal finds exactly the component containing its start. An outer loop tries every vertex and starts another traversal only when it finds one still unseen. This also counts an isolated vertex as a group of one.

For directed graphs, being able to go from A to B does not imply you can return. A strongly connected component requires mutual reachability: every member can reach every other member following edge directions. The ordinary undirected component algorithm does not establish that stronger property.

Copying, or cloning, a graph adds an identity requirement. Two separate objects can both store the value 7. They still need two separate copies. Conversely, two references to one original object must point to one shared copy, rather than two new objects.

Use a dictionary from original-object → cloned-object, not value → clone. Create and register a copy before scheduling its neighbors. Then an edge returning to that original object can immediately retrieve its existing copy. This preserves cycles and shared references while ensuring that every copied node is newly allocated.

## JavaScript Implementations
<!-- lesson-id:w11-section-javascript-implementations -->

**Let’s run the explorers.** Predict the next stack or queue item, mark it when discovered, and record the predecessor when a route matters. For grids and clones, translate the same discovery invariant into implicit neighbors and object-to-object mappings.

### Adjacency and iterative component traversal

We want to collect all disconnected groups without losing isolated vertices. The input contract requires distinct string labels, edges whose endpoints are in the supplied vertex collection, and undirected connections. Give every label a fresh neighbor array; sharing an array would make an update to one vertex change other vertices' neighbors too.

### Demonstration 1 — Find every undirected component with a stack

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

In **Demonstration 1**, the supplied triangle contains A, B, and C, while D has no edges. Building the map first preserves D. Starting at A marks it before pushing work; discovering B and C marks them too. Because C is pushed last, the stack removes it first, producing the group A,C,B. Its edges back into the triangle schedule nothing new. The outer loop eventually reaches unseen D and creates its one-vertex group. With no vertices, that loop never starts and the result is empty.

### BFS with a route, not just a yes/no answer

Now we want an actual shortest route, so we will remember how each vertex was reached. Supply a complete adjacency `Map` with string labels and valid neighbor entries; directed lists are also supported. We return `null` when a route cannot be found. Reaching the source from itself uses zero edges and returns the single source vertex. The distance map also records discovery. An index into the queue lets us read the oldest waiting item without repeatedly shifting the array.

### Demonstration 2 — Recover a shortest route through BFS parents

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

In **Demonstration 2**, A discovers B and C at distance one. B is removed first and discovers D at distance two, recording B as D's parent. C cannot overwrite that discovery. Starting from D, the reconstruction loop collects D,B,A and reverses it to A,B,D. The separate A-to-A call stops at once with distance zero. E exists in the map but is disconnected, so it never receives a distance and the function returns `null` for A-to-E.

### Islands are implicit components

We can count islands by treating each land cell as a vertex and each legal move between land cells as an edge. Supply a rectangular grid containing string cells `'0'` and `'1'`; we leave the grid unchanged. The key for a cell is its row multiplied by the column count, plus its column. For three columns, `(1,1)` becomes key four. Four movement directions deliberately exclude diagonals.

### Demonstration 3 — Count land components without changing the grid

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

In **Demonstration 3**, the first land cell `(0,0)` starts a traversal covering `(0,1)` and `(1,1)` as well. The outer scan does not count either of those again because their keys are marked. The isolated cells `(2,0)` and `(2,2)` each start another traversal, giving three islands. In the two-by-two test, opposite corners remain two islands because no diagonal move is allowed. Empty input has no cells to start from and returns zero. The initial shape check rejects rows of different lengths before coordinate keys are used.

### Clone shared references faithfully

We will copy the reachable object graph while retaining its reference relationships. Each node has a value and a neighbors array; `null` represents no starting node. The equal-valued example deliberately includes two references to the same neighbor and an edge returning to the start, so we can check more than whether the copied values look right.

### Demonstration 4 — Clone cycles and repeated object references

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

In **Demonstration 4**, `copies` registers a's copy before the queue starts. The first reference from a to b creates and schedules b's copy. The second reference retrieves that same copy and appends it again, preserving the repeated relationship. When b leads back to a, the map returns the already-created copy of a. The identity checks therefore show fresh objects, a shared copied neighbor, and a copied cycle. The final call shows that an absent start remains `null`.

## Worked Examples
<!-- lesson-id:w11-section-worked-examples -->

**Worked-walkthrough pause:** Trace a small cycle and an isolated vertex. Ask when each item becomes discovered, how a shortest route is reconstructed, and which original references must share one clone.

For another view of BFS, follow **Demonstration 2** in **JavaScript Implementations** through the diamond. Pay attention to when a vertex is discovered, not just when it leaves the queue:

| Removed | Newly discovered | Pending queue | Recorded distances |
| --- | --- | --- | --- |
| A | B, C | B, C | A=0, B=1, C=1 |
| B | D | C, D | D=2 |
| C | none | D | D remains 2 |
| D | stop | empty | route A–B–D |

When C is removed, D already has a predecessor. We leave it alone: A–B–D and A–C–D both use two edges, and we promised one shortest route rather than every shortest route. On another graph DFS could discover a longer route first, because it does not finish one distance layer before entering the next. Recording a parent is useful in both searches, but the queue order is what proves BFS's distance guarantee.

Return to **Demonstration 3** in **JavaScript Implementations** and trace the first island: `(0,0)`, `(0,1)`, and `(1,1)`. Later starts at `(2,0)` and `(2,2)` give three components. Why is a start worth exactly one count? A traversal cannot leave its island because it only follows legal land edges. It also cannot miss reachable land: processing each discovered cell schedules every unseen legal neighbor. Together, those facts show that one start covers exactly one island.

The cloning trace in **Demonstration 4** in **JavaScript Implementations** has a different concern. The first A→B reference creates B's copy, the second reuses it, and B→A retrieves A's registered copy. At no point do we ask whether values are equal. Try replacing the identity map with a value map mentally: both 7-valued nodes would collapse into one, destroying the original structure.

## Visual Explanations
<!-- lesson-id:w11-section-visual-explanations -->

**See the frontier move:** DFS dives along a route, BFS expands a layer, and flood fill generates neighbors from movement rules. The picture connects these different-looking tasks to the same exploration idea.

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
<!-- lesson-id:w11-section-complexity-analysis -->

**Complexity checkpoint:** Count vertices and stored neighbor entries across the run, then separate graph storage, pending work, and returned paths or components. For implicit grids, count generated neighbor checks rather than inventing an adjacency list.

Let V count vertices and E count edges, including duplicate edges as separate entries in the input. We assume `Map` and `Set` operations take constant time on average under the usual hash-table model. That expected-operation assumption is separate from whether a traversal bound describes a worst-case graph. Big O gives an upper growth bound; it does not by itself mean “worst case.”

| Operation | Time | Working space beyond supplied input | Output |
| --- | --- | --- | --- |
| Build adjacency and components | O(V+E) | O(V+E), including new graph | O(V) |
| BFS on supplied adjacency | O(V+E) worst case | O(V) | O(V) route |
| Adjacency-matrix traversal | O(V²) worst case | O(V) beyond matrix | depends on task |
| Islands on R×C grid | O(RC+R), including shape validation | O(RC) | O(1) count |
| Clone reachable graph | O(V+E) | O(V) | O(V+E) |

Count the neighbor work across the entire traversal before multiplying loop sizes. Each vertex's list is scanned once, and all lists together contain E directed entries or 2E undirected entries. That is why nesting a neighbor loop inside a vertex-processing loop does not imply V×E work.

Also count the storage that remains allocated. A queue with a head index keeps its processed slots, so its backing array can still use O(V) space. If you mark visited land by changing it to water, you can remove the separate visited set, but the traversal stack can still grow with the grid. Mutating the input alone does not establish constant auxiliary space.

## Common Mistakes
<!-- lesson-id:w11-section-common-mistakes -->

**Debugging pause:** Find the first duplicate schedule or missing vertex. Check mark timing, zero-valued distances, both directions of undirected edges, and object identity in clone maps. Each failure points to one broken invariant.

- Create vertices from the vertex input, not just the edges. Otherwise a label with no connections disappears before exploration starts.
- Ask `distance.has(v)` whether v was discovered. Testing the truthiness of `distance.get(v)` rejects the valid source distance zero.
- Mark before descending recursively. Waiting for a recursive call to finish lets a two-way edge return to an unmarked ancestor indefinitely.
- Store both directions of an undirected edge. Omitting the reverse entry changes which routes exist.
- Key clones by their original objects. Equal values are not evidence that two references identify the same node.
- Distinguish global discovery from a current path's restrictions. A no-reuse Word Search must undo marks between candidate paths, as [Week 15](week-15.md) explains.

Here is a deliberately broken allocation. We want three independent neighbor arrays, but `fill` repeats a single array reference instead. Watch what one push does to all three apparent rows.

### Demonstration 1 — Broken shared neighbor-array allocation

```javascript-bug
const graph = Array(3).fill([]);
graph[0].push(1); // All three rows now contain 1.
```

In broken **Demonstration 1**, pushing 1 into row zero changes the single array also referenced by rows one and two. There are three slots, but only one neighbor-array object. Repair the allocation by calling a factory separately for each row, then check that pushing to one row leaves the others empty. This is an object-sharing error, so changing traversal order cannot repair it.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w11-section-interview-and-leetcode-pattern-recognition -->

**Interview lens:** Start with the model, then state discovery timing and the worklist. “Shortest” means BFS only when edge costs are equal; “clone” means a map keyed by original identity; “islands” means implicit neighbors.

When a question asks for “connected groups,” consider a traversal inside an outer scan. When it asks for “fewest moves,” check whether every move has equal cost before choosing BFS. “Clone” adds the need for an original-to-copy identity map. Number of Islands gives neighbor relationships through coordinates; Clone Graph gives them through object references. We still need the same discovery discipline.

Sometimes an input promise makes traversal unnecessary. In Find Center of Star Graph, a valid star has one center connected to every other vertex. With at least three vertices, the shared endpoint of the first two edges must be that center. Keep the promise attached to the shortcut: it does not find a general graph's center.

Before you write a loop, ask whether the answer concerns every vertex or only the region reachable from one source. Then establish edge direction and whether “shortest” means fewest edges or least total weight. These decisions tell you what must be represented and what your processing order has to guarantee.

## Practice Exercises
<!-- lesson-id:w11-section-practice-exercises -->

**Your turn:** Draw a cycle, an isolated vertex, and a small grid. Trace the marks and queue or stack, then explain the memory ledger. Change one rule at a time so you can see which result and invariant changes.

### Conceptual

1. Explain why the undirected component counter cannot be reused unchanged for strongly connected components. Use a one-way connection to show the difference between reaching another vertex and being able to return.

### Tracing

2. Trace BFS on S–A, A–B, B–T, S–C, C–T, exploring A before C. Write down each first discovery, its parent, and its distance. Check whether discovering B before T forces the final route to pass through B.

### Debugging

3. Repair broken **Demonstration 1** in **Common Mistakes**. Explain aliasing—the fact that multiple slots refer to one object—and show why your replacement creates independent arrays.

### Implementation

4. Extend component traversal to return the largest group size. Decide what to return for an empty graph before coding, and explain which work is still necessary if you no longer return the groups themselves.
5. Add diagonal neighbors to the islands solver. Predict the result for opposite-corner land before running it, and explain how changing adjacency changes the meaning of an island.

### LeetCode + HackerRank

- **[Number of Islands](https://leetcode.com/problems/number-of-islands/)** — LeetCode, Medium. Translate the grid into a graph with four-direction land connections, then mark cells when you discover them. Use the exercise to explain why you chose to preserve or mutate the grid and what memory your traversal still needs.
- **[DFS: Connected Cell in a Grid](https://www.hackerrank.com/challenges/ctci-connected-cell-in-a-grid/problem)** — HackerRank, Hard according to the chapter's earlier official-page verification. Here flood fill means exploring one connected region. You must use eight directions and report the largest region, so both the neighbor rule and the accumulated result differ from the island counter.

## Hints and Worked Solutions
<!-- lesson-id:w11-section-hints-and-worked-solutions -->

**Hint-to-solution walkthrough:** Predict one discovery at a time, reconstruct the route backward from its predecessor map, and compare clone references rather than only values. The solution should confirm the model as well as the output.

1. Try A→B. Starting from A reaches both vertices, but B cannot return to A. Mutual reachability therefore gives two strongly connected components. An ordinary reachability traversal starting at A can put both into one group, and reversing the outer start order can change that grouping. It is answering the wrong question.
2. S first discovers A and C at distance one. A then discovers B at distance two, but C discovers T at distance two before B is removed. B must not overwrite T's parent. Reversing parents gives S,C,T. A DFS pursuing A first could instead discover the three-edge route S,A,B,T; that is a reachable route, but not a shortest one.
3. Use a per-row factory such as `Array.from({length: 3}, () => [])`. Each invocation creates another array object. By contrast, `fill` receives one already-created object and copies its reference into each slot. Verify independence with a push into just one row.
4. Start the maximum at zero. Inside each new traversal, count removed vertices; afterward compare that size with the maximum. An empty graph never starts a traversal and keeps zero. Every vertex and adjacency entry is still processed at most once, giving O(V+E) time. If the maximum is all you need, omit the stored group arrays.
5. Add `(1,1)`, `(1,-1)`, `(-1,1)`, `(-1,-1)` to the movement offsets. The two opposite-corner land cells now connect and form one island. Checking eight directions rather than four changes a constant factor, leaving the O(RC) asymptotic upper bound unchanged.

For Number of Islands, explain the four-direction land graph, why a traversal covers exactly one island, and why the outer scan starts exactly once per island. Test an empty grid, all water, land containing a cycle, and diagonal-only contact. For Connected Cell, switch to numeric cells, eight directions, and a maximum region size. To practice cloning, include two different equal-valued nodes and a node pointing to itself—a self-loop—so your tests exercise identity and cycles rather than only a chain.

## Sources and Further Reading
<!-- lesson-id:w11-section-sources-and-further-reading -->

- Use the [curriculum](../../shared/curriculum.js) and [weeks 9–12 textbook](../../shared/textbook/weeks09to12.js) to place this chapter in the course. Its explanations, examples, and exercises are independently written teaching material.
- MIT OCW's [Lecture 13 BFS notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/1208e162775f6f5cedfbb9f2b694ede0_MIT6_006F11_lec13.pdf) were consulted during the chapter's earlier preparation for representation, layers, and parent-pointer terminology. This rewrite does not claim a new external-link check.
- The official [Number of Islands](https://leetcode.com/problems/number-of-islands/) and [DFS: Connected Cell in a Grid](https://www.hackerrank.com/challenges/ctci-connected-cell-in-a-grid/problem) statements and displayed difficulties were verified during earlier preparation. No editorial solutions were consulted for that work.

## Weekly Summary
<!-- lesson-id:w11-section-weekly-summary -->

**Recap:** Graph algorithms become predictable when the model, discovery commitment, and worklist are explicit. You can now explore components, prove unweighted BFS routes, flood-fill implicit graphs, and clone cycles without losing identity.

Start a graph solution by saying what its vertices and edges mean. Mark on discovery so each vertex enters the worklist once, then choose a stack for depth-first exploration or a queue for distance layers. Scan every vertex when you need every component; generate neighbors from coordinates when the graph is a grid. When copying linked objects, preserve identity as well as values. Before continuing to [Week 12](week-12.md), explain each of those choices with a small example and show what would break if you changed it.

## Weekly Progress Checklist

### Theory

- [ ] Model an example with directed, undirected, weighted, and implicit connections, explaining each term. <!-- checkpoint:w11-model-relationships -->
- [ ] Use BFS layer order to prove that first discovery gives a minimum edge count. <!-- checkpoint:w11-prove-bfs-layers -->

### JavaScript

- [ ] Build components with an explicit stack and recover a BFS path from parent links. <!-- checkpoint:w11-build-traversals -->
- [ ] Copy a cyclic graph and check that repeated references still share the same copied object. <!-- checkpoint:w11-clone-identity -->

### Practice

- [ ] Complete the BFS trace, explain the shared-array repair, and change the islands neighbor rule. <!-- checkpoint:w11-complete-exercises -->
- [ ] Explain separately the memory for the graph, pending work, and returned result. <!-- checkpoint:w11-account-memory -->

### Reflection

- [ ] Record a small graph that disproves an incorrect traversal assumption and explain the failure. <!-- checkpoint:w11-review-counterexample -->
