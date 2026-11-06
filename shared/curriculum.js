export const weekCatalog = [
  ['Complexity and Arrays', 'Big O, Big Theta, traversal, mutation, time and space complexity'],
  ['Hash Maps and Sets', 'Hashing, frequency counting, JavaScript Map and Set'],
  ['Two Pointers', 'Opposite pointers, reader/writer, slow/fast, invariants'],
  ['Sliding Window', 'Fixed windows, variable windows, frequency tracking'],
  ['Stacks and Queues', 'LIFO/FIFO, monotonic stacks, efficient queues'],
  ['Binary Search', 'Sorted search, boundaries, invariants, answer-space search'],
  ['Linked Lists', 'Node references, reversing, dummy nodes, cycle detection'],
  ['Recursion and Backtracking', 'Call stacks, base cases, recursion trees, choose/explore/undo'],
  ['Binary Trees', 'DFS, BFS, preorder, inorder, postorder'],
  ['BSTs and Heaps', 'BST properties, priority queues, heaps, top K'],
  ['Graph Foundations', 'Adjacency lists, visited sets, BFS, DFS, components'],
  ['Advanced Graphs', 'Directed cycles, topological sorting, shortest paths, Dijkstra'],
  ['Greedy and Intervals', 'Greedy choices, correctness arguments, sorting intervals'],
  ['Dynamic Programming I', 'Memoisation, tabulation, state, recurrence'],
  ['Dynamic Programming II and Tries', '2D DP, subsequences, grids, prefix trees'],
  ['Interview Consolidation', 'Unseen problems, timed mocks, independent explanations']
].map(([title, concepts], index) => ({ id: index + 1, title, concepts, sourcePath: `weeks/${String(index + 1).padStart(2, '0')}.md` }));

export const weekOne = {
  ...weekCatalog[0],
  status: 'provisional',
  objectives: ['Describe how runtime changes as input grows.', 'Traverse and mutate arrays deliberately.', 'State time and auxiliary space complexity for a solution.'],
  theory: [
    { id: 'w1-complexity', title: 'Complexity is a prediction tool', body: 'Big O describes an upper-growth category: it helps us predict how an algorithm behaves as input size n increases. Big Theta describes a tight growth bound when upper and lower bounds match.' },
    { id: 'w1-arrays', title: 'Arrays give indexed access', body: 'JavaScript arrays provide direct access by index. Traversal is linear, while inserting near the front shifts later elements and changes the cost profile.' }
  ],
  workedExample: `function linearSearch(values, target) {\n  for (let index = 0; index < values.length; index += 1) {\n    if (values[index] === target) return index;\n  }\n  return -1;\n}`,
  checkpoint: ['I can explain why linear search is O(n).', 'I can distinguish input space from auxiliary space.', 'I can name an edge case before coding.'],
  problems: [{ id: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'Easy', topic: 'Arrays + Sets', url: 'https://leetcode.com/problems/contains-duplicate/' }],
  resources: [{ title: 'CS50 Week 3 — Algorithms', provider: 'Harvard CS50', url: 'https://cs50.harvard.edu/x/2024/weeks/3/' }, { title: 'MIT 6.006 — Introduction to Algorithms', provider: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/' }]
};
