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

const moduleGuides = {
  1: {
    introduction: 'Complexity is the habit of predicting how an algorithm scales before we run it. Arrays are the first structure to study because indexed storage makes the cost of reading, searching, inserting and deleting visible. These ideas appear in every service that processes collections: search, pagination, logs and in-memory caches.',
    theory: 'An array stores values in an ordered sequence. An index is a position, not a value. A linear scan checks positions one at a time, while a mutation can move many later values. Big O describes an upper growth category, Big Theta describes a tight bound, and auxiliary space counts extra memory rather than the input itself.',
    code: `function firstIndexOf(values, target) {\n  for (let index = 0; index < values.length; index += 1) {\n    if (values[index] === target) return index;\n  }\n  return -1;\n}`,
    walkthrough: 'The loop starts at zero, checks the current cell, advances by one, and stops early on a match. If the target is absent, every cell is read. No second collection is allocated, so the auxiliary space is constant.',
    examples: ['[4, 8, 2] searching for 8 returns index 1 after two reads.', 'Searching [1, 3, 5, 7, 9] for 9 demonstrates the worst case: five reads.', 'Searching [] returns -1 without entering the loop; this is the empty-input edge case.'],
    complexity: 'A linear scan is O(1) best case when the first item matches, O(n) average case, and O(n) worst case. Its auxiliary space is O(1). Array access by a known index is O(1), but inserting at index 0 is O(n) because later elements must shift.',
    patterns: 'Use a scan when the input is unsorted or when one pass is enough. Ask whether the prompt permits sorting, a Set, or a second pass. Do not call every loop O(n²): nested loops are only quadratic when the inner work grows with the outer input.',
    mistakes: ['Using index <= values.length reads one position past the end.', 'Using splice while iterating forward can skip the item shifted into the deleted index.', 'Treating a shallow slice as a deep copy causes nested objects to remain shared.'],
    exercises: ['Explain the difference between input space and auxiliary space.', 'Trace firstIndexOf([9, 2, 6], 6) in a table.', 'Implement removeDuplicates with a Set and state its trade-off.', 'Easy: Contains Duplicate.', 'Medium: Product of Array Except Self.', 'Debug a loop that mutates an array while incrementing its index.'],
    checklist: ['I can derive the cost of array reads and mutations.', 'I can trace a loop before coding.', 'I can state time and auxiliary space separately.']
  },
  2: {
    introduction: 'Hash maps and sets turn repeated searching into direct membership checks. They are used for indexes, caches, deduplication, frequency counts and joins between records.',
    theory: 'A hash function maps a key to a bucket. A Map stores key-value pairs; a Set stores unique keys. Average lookup is close to O(1), but collisions and adversarial keys mean it is not a mathematical guarantee. JavaScript Map preserves key identity and does not coerce every key to a string.',
    code: `function firstDuplicate(values) {\n  const seen = new Set();\n  for (const value of values) {\n    if (seen.has(value)) return value;\n    seen.add(value);\n  }\n  return null;\n}`,
    walkthrough: 'The Set represents the prefix already processed. Test membership before insertion so the first repeated value is returned at the moment it becomes known.',
    examples: ['[4, 1, 4] returns 4 on the third read.', 'A frequency Map for "aab" becomes a→2, b→1.', '[] returns null and never creates a false duplicate.'],
    complexity: 'A single pass with a Set is O(n) expected time and O(n) auxiliary space. Sorting can reduce some memory but changes the order and costs O(n log n). The common mistake is claiming O(1) space because each lookup is O(1); the collection of keys still grows.',
    patterns: 'Look for words such as duplicate, frequency, pair, complement, count or first occurrence. Use Map when each key needs data, Set for membership only, and avoid an object when arbitrary key types matter.',
    mistakes: ['Map.get(key) returning undefined is not the same as Map.has(key) being false.', 'Objects use string-like property keys; Map can distinguish 1 from "1".', 'Forgetting to update the count after reading it creates an off-by-one frequency.'],
    exercises: ['Trace a frequency map for "banana".', 'Implement twoSum with a complement Map.', 'Easy: Valid Anagram.', 'Easy: Contains Duplicate.', 'Medium: Group Anagrams.', 'Debug code that uses map.get(key) || 0 when zero is a meaningful stored value.'],
    checklist: ['I can choose Map versus Set.', 'I can explain expected versus worst-case hashing.', 'I can build a frequency table without losing key types.']
  },
  3: {
    introduction: 'Two pointers reduce repeated work when two positions move through a sequence. The pattern appears in sorted pair problems, in-place filtering and linked-list speed comparisons.',
    theory: 'Pointers are indexes or references that describe a boundary. Opposite pointers move inward; reader-writer pointers compact valid values; slow-fast pointers compare different speeds. The invariant explains what the unprocessed region means after every move.',
    code: `function hasPairWithSum(values, target) {\n  let left = 0;\n  let right = values.length - 1;\n  while (left < right) {\n    const sum = values[left] + values[right];\n    if (sum === target) return true;\n    if (sum < target) left += 1;\n    else right -= 1;\n  }\n  return false;\n}`,
    walkthrough: 'Sorted order makes a move safe: if the sum is too small, keeping the current left value cannot help with a smaller right value, so left advances.',
    examples: ['[1, 3, 4, 7], target 10 finds 3+7.', '[1, 2, 4, 8], target 6 moves right leftward after an oversized sum.', '[2, 2], target 4 works because the condition is left < right, not left <= right.'],
    complexity: 'Each pointer only moves forward or backward, so total pointer movement is O(n), with O(1) auxiliary space. Sorting first costs O(n log n) and may destroy original indexes unless pairs are retained.',
    patterns: 'Sorted input, pair sums, palindromes, removing duplicates in place and “closest” language are clues. Do not use the pattern on arbitrary unsorted data unless you can sort or maintain another index structure.',
    mistakes: ['Moving both pointers after every mismatch can skip a valid pair.', 'Using <= when two distinct positions are required reuses one element.', 'A reader-writer loop must write before incrementing the writer.'],
    exercises: ['Trace the pointer invariant on a sorted pair search.', 'Implement isPalindrome without creating a reversed copy.', 'Easy: Valid Palindrome.', 'Easy: Move Zeroes.', 'Medium: 3Sum.', 'Debug a loop that never moves either pointer on equal values.'],
    checklist: ['I can state what each pointer boundary means.', 'I can justify every pointer move.', 'I can identify when sorting is an acceptable trade-off.']
  },
  4: {
    introduction: 'A sliding window represents a contiguous range and updates it incrementally. It is useful for substrings, subarrays and streaming metrics where recomputing every range would repeat work.',
    theory: 'A fixed window has a constant width; a variable window expands to include candidates and contracts while a constraint is violated. The window invariant states exactly what is valid between left and right.',
    code: `function longestUniqueRun(text) {\n  const seen = new Set();\n  let left = 0;\n  let best = 0;\n  for (let right = 0; right < text.length; right += 1) {\n    while (seen.has(text[right])) seen.delete(text[left++]);\n    seen.add(text[right]);\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}`,
    walkthrough: 'Right expands once per character. When the new character breaks uniqueness, left removes old characters until the invariant is restored.',
    examples: ['"abcabcbb" reaches a best length of 3.', '"aaaa" repeatedly contracts to one character.', '"" returns 0 because no window is opened.'],
    complexity: 'Although there is a while loop inside the for loop, each character enters and leaves the Set at most once: O(n) time and O(k) space for the distinct window.',
    patterns: 'Contiguous, longest, shortest, at most K and without repeating are strong clues. A window is not appropriate for arbitrary subsequences or constraints that cannot be repaired by moving one boundary.',
    mistakes: ['Forgetting +1 in right - left + 1 makes every length wrong.', 'Contracting only once may leave the constraint violated.', 'Confusing a window with a subsequence allows gaps that the problem forbids.'],
    exercises: ['Trace the window on "abca".', 'Implement maximum sum of a fixed-size window.', 'Easy: Maximum Average Subarray I.', 'Medium: Longest Substring Without Repeating Characters.', 'Medium: Minimum Window Substring.', 'Debug a contraction loop that never increments left.'],
    checklist: ['I can write the window invariant.', 'I can explain why total movement is linear.', 'I can distinguish contiguous ranges from subsequences.']
  },
  5: {
    introduction: 'Stacks and queues model ordered work. A stack serves the most recent item first; a queue serves the oldest item first. They power parsers, undo history, breadth-first search and task pipelines.',
    theory: 'LIFO means last in, first out; FIFO means first in, first out. A monotonic stack keeps values in sorted order so each item can resolve a future greater or smaller neighbor once.',
    code: `function isBalanced(text) {\n  const stack = [];\n  const pairs = new Map([[')', '('], [']', '['], ['}', '{']]);\n  for (const char of text) {\n    if ('([{'.includes(char)) stack.push(char);\n    else if (pairs.has(char) && pairs.get(char) !== stack.pop()) return false;\n  }\n  return stack.length === 0;\n}`,
    walkthrough: 'Opening brackets are saved because their matching close may appear later. A close must match the most recent unmatched opener.',
    examples: ['"([])" pops ] then ) in reverse opening order.', '"([)]" fails because ] does not match the top (, not because a bracket is missing.', '"" is balanced: the empty stack satisfies the final invariant.'],
    complexity: 'Each bracket is pushed and popped at most once: O(n) time and O(n) worst-case stack space. Array push/pop at the end are efficient; shift is O(n), so a queue should use a head index or deque.',
    patterns: 'Nested structure, nearest greater/smaller, undo, parsing and level-order processing suggest these structures. Do not use a stack when the required order is oldest-first.',
    mistakes: ['Popping an empty stack produces undefined and can hide a mismatch.', 'Using shift for every queue dequeue makes a loop quadratic.', 'Checking only stack length misses wrong bracket order.'],
    exercises: ['Trace the stack for "{[()]}".', 'Implement a queue with an array and head pointer.', 'Easy: Valid Parentheses.', 'Easy: Implement Queue using Stacks.', 'Medium: Daily Temperatures.', 'Debug a queue whose array keeps shifting on every dequeue.'],
    checklist: ['I can choose LIFO or FIFO from the prompt.', 'I can explain a monotonic stack invariant.', 'I can implement an efficient queue in JavaScript.']
  },
  6: {
    introduction: 'Binary search eliminates half of a sorted search space after each comparison. It is valuable not only for finding a value, but also for finding the first valid boundary or the minimum feasible answer.',
    theory: 'The key invariant is that the answer remains inside a closed or half-open interval. Choose one convention, compute the midpoint safely, and prove which half can be discarded.',
    code: `function lowerBound(values, target) {\n  let left = 0;\n  let right = values.length;\n  while (left < right) {\n    const middle = left + Math.floor((right - left) / 2);\n    if (values[middle] < target) left = middle + 1;\n    else right = middle;\n  }\n  return left;\n}`,
    walkthrough: 'Here right is exclusive. When values[middle] is too small, middle cannot be the answer; otherwise middle remains a possible first valid position.',
    examples: ['lowerBound([1,3,3,7], 3) returns 1, the first 3.', 'Searching 8 in [1,3,5] returns 3, the insertion point.', 'An empty array starts with left=right=0 and terminates immediately.'],
    complexity: 'The interval halves each iteration, giving O(log n) comparisons and O(1) auxiliary space. A sorted copy costs O(n log n), which can erase the search benefit.',
    patterns: 'Sorted data, monotonic true/false predicates, minimum feasible capacity and “first/last occurrence” are clues. Binary search fails when the predicate is not monotonic.',
    mistakes: ['Mixing inclusive right with exclusive right causes skipped endpoints or infinite loops.', 'Returning immediately on equality misses first/last-boundary questions.', 'Sorting strings or numbers with default Array.sort gives lexicographic order.'],
    exercises: ['Trace lowerBound with duplicates.', 'Implement search in a rotated sorted array.', 'Easy: Binary Search.', 'Easy: Search Insert Position.', 'Medium: Koko Eating Bananas.', 'Debug a loop where left and middle stop changing.'],
    checklist: ['I can state my interval convention.', 'I can prove why a discarded half contains no answer.', 'I can search a monotonic answer space, not only an array.']
  },
  7: {
    introduction: 'A linked list stores nodes connected by references rather than contiguous indexes. Lists are useful when local insertion and removal matter more than random access.',
    theory: 'A node contains a value and a next reference. The head identifies the first node; null marks the end. Reversal changes arrows, so save next before overwriting it.',
    code: `function reverseList(head) {\n  let previous = null;\n  let current = head;\n  while (current) {\n    const next = current.next;\n    current.next = previous;\n    previous = current;\n    current = next;\n  }\n  return previous;\n}`,
    walkthrough: 'The saved next node is the only route to the unprocessed suffix. After the assignment, previous is the reversed prefix and current is the remaining suffix.',
    examples: ['1→2→3 becomes 3→2→1 after three iterations.', 'A one-node list returns the same node.', 'A null head returns null without dereferencing anything.'],
    complexity: 'Reversal visits each node once: O(n) time and O(1) auxiliary space. Index access is O(n), unlike an array’s O(1) access; insertion is O(1) only after the insertion point is known.',
    patterns: 'Pointer rewiring, cycle detection, merging sorted chains and “without extra nodes” suggest linked lists. Prefer arrays when indexing or cache locality dominates.',
    mistakes: ['Overwriting current.next before saving next loses the rest of the list.', 'Comparing node values instead of node identity changes cycle detection.', 'Forgetting the head may be null makes empty lists crash.'],
    exercises: ['Draw references after each reversal iteration.', 'Implement mergeTwoLists with a dummy node.', 'Easy: Reverse Linked List.', 'Easy: Linked List Cycle.', 'Medium: Reorder List.', 'Debug a cycle that is introduced by linking the tail to the wrong node.'],
    checklist: ['I can trace references, not just values.', 'I save next before rewiring.', 'I can distinguish identity from value equality.']
  },
  8: {
    introduction: 'Recursion expresses a problem in terms of smaller versions of itself. Backtracking adds a disciplined choose, explore, undo process for enumerating possibilities.',
    theory: 'Every recursive function needs a base case and progress toward it. The call stack stores suspended frames. Backtracking works when choices can be undone without corrupting sibling branches.',
    code: `function subsets(values) {\n  const result = [];\n  function visit(index, path) {\n    if (index === values.length) { result.push([...path]); return; }\n    visit(index + 1, path);\n    path.push(values[index]);\n    visit(index + 1, path);\n    path.pop();\n  }\n  visit(0, []);\n  return result;\n}`,
    walkthrough: 'Each index creates two branches: skip or choose. The spread copies a completed path; pop restores the path before returning to the sibling branch.',
    examples: ['[1,2] produces [], [2], [1], [1,2] depending on branch order.', 'An empty input reaches the base case and returns one subset: [].', 'A missing pop makes later branches inherit earlier choices.'],
    complexity: 'There are 2^n subsets, so output-sensitive time and space are at least O(2^n); recursion adds O(n) call depth. Backtracking is not automatically efficient just because it avoids repeated arrays.',
    patterns: 'Permutations, combinations, choices, arrangements and “all possible” are clues. Use pruning when a partial choice cannot lead to a valid result.',
    mistakes: ['Sharing path references in result mutates every saved answer.', 'A base case without progress causes infinite recursion.', 'Pruning before checking a valid complete solution can remove answers.'],
    exercises: ['Draw the call tree for subsets([1,2]).', 'Implement permutations with used flags.', 'Easy: Fibonacci Number.', 'Medium: Letter Combinations of a Phone Number.', 'Medium: Combination Sum.', 'Debug a solver that forgets to undo state.'],
    checklist: ['I can name the base case and progress measure.', 'I can explain the call tree.', 'I can prove why a pruning rule is safe.']
  },
  9: {
    introduction: 'Trees model hierarchy: file systems, syntax trees, menus and indexes. Binary trees make traversal order explicit and prepare the ground for search trees and heaps.',
    theory: 'A node has at most two children. DFS follows a path before siblings; BFS visits level by level. Preorder visits node-left-right, inorder left-node-right, and postorder left-right-node.',
    code: `function levelOrder(root) {\n  if (!root) return [];\n  const result = [];\n  const queue = [root];\n  let head = 0;\n  while (head < queue.length) {\n    const node = queue[head++];\n    result.push(node.value);\n    if (node.left) queue.push(node.left);\n    if (node.right) queue.push(node.right);\n  }\n  return result;\n}`,
    walkthrough: 'The head index gives queue semantics without shifting the array. Children are enqueued after their parent, preserving level order.',
    examples: ['A root with left then right visits root, left, right.', 'A skewed tree behaves like a linked list.', 'A null root returns an empty traversal.'],
    complexity: 'Every node is enqueued and processed once: O(n) time. BFS uses O(w) space for maximum width; recursive DFS uses O(h) call stack, where h is height.',
    patterns: 'Hierarchy, levels, ancestor relationships and traversal order are clues. Choose BFS for nearest-level questions and DFS for path or subtree reasoning.',
    mistakes: ['Using shift turns a traversal into O(n²) on wide trees.', 'Forgetting null children creates invalid queue entries.', 'Confusing inorder with sorted order: only BST inorder is sorted.'],
    exercises: ['Write all three DFS orders for a five-node tree.', 'Implement maximum depth recursively and iteratively.', 'Easy: Maximum Depth of Binary Tree.', 'Easy: Invert Binary Tree.', 'Medium: Binary Tree Level Order Traversal.', 'Debug a traversal that processes the same node twice.'],
    checklist: ['I can select BFS or DFS from the question.', 'I can calculate width versus height space.', 'I can state the exact traversal order.']
  },
  10: {
    introduction: 'Binary search trees organize values so comparisons guide search. Heaps organize the next minimum or maximum, making priority queues and top-K tasks efficient.',
    theory: 'A BST requires every left value to be smaller and every right value larger under its ordering rule. A heap only requires parent priority over children; it is not globally sorted.',
    code: `function topK(values, k) {\n  const heap = [];\n  for (const value of values) {\n    heap.push(value);\n    heap.sort((a, b) => a - b);\n    if (heap.length > k) heap.shift();\n  }\n  return heap;\n}`,
    walkthrough: 'This intentionally simple reference keeps the k largest values but uses sorting for clarity. A production min-heap replaces sort and shift to achieve O(n log k).',
    examples: ['A balanced BST finds a value by discarding one subtree per comparison.', 'A sorted insertion order creates a skewed BST and loses logarithmic height.', 'For k=0, no value should be retained.'],
    complexity: 'BST operations are O(log n) on a balanced tree but O(n) when skewed. A heap gives O(log n) insertion/removal and O(1) peek; top-K with a size-k heap is O(n log k).',
    patterns: 'Repeated next-smallest/largest, scheduling, median and top-K prompts suggest heaps. Ordered range queries and predecessor/successor suggest BSTs.',
    mistakes: ['A heap array is not sorted; only the root is guaranteed extreme.', 'JavaScript sort requires a numeric comparator.', 'Assuming BST balance without an invariant or balancing mechanism is unsafe.'],
    exercises: ['Trace heap insertion and bubble-up.', 'Implement a min-heap class.', 'Easy: Kth Largest Element in a Stream.', 'Medium: Kth Largest Element in an Array.', 'Medium: Top K Frequent Elements.', 'Debug a comparator that sorts numbers lexicographically.'],
    checklist: ['I can distinguish BST order from heap order.', 'I can derive top-K complexity.', 'I can identify when skew destroys BST performance.']
  },
  11: {
    introduction: 'Graphs model arbitrary relationships: routes, dependencies, social connections and network reachability. BFS and DFS provide the core vocabulary for exploring them.',
    theory: 'An adjacency list stores each vertex’s neighbors. A visited Set prevents repeated work and infinite cycles. Components are maximal groups connected by paths.',
    code: `function countComponents(n, edges) {\n  const graph = Array.from({ length: n }, () => []);\n  for (const [a, b] of edges) { graph[a].push(b); graph[b].push(a); }\n  const visited = new Set();\n  let count = 0;\n  function visit(node) {\n    if (visited.has(node)) return;\n    visited.add(node);\n    for (const neighbor of graph[node]) visit(neighbor);\n  }\n  for (let node = 0; node < n; node += 1) {\n    if (!visited.has(node)) { count += 1; visit(node); }\n  }\n  return count;\n}`,
    walkthrough: 'Build both directions for an undirected edge. Each unvisited starting node begins one component; traversal marks every node reachable from it.',
    examples: ['Edges [[0,1],[1,2]] form one component.', 'An isolated vertex contributes its own component.', 'A self-loop does not create a second component because the vertex is already visited.'],
    complexity: 'Adjacency construction and traversal are O(V+E) time and O(V+E) storage. Marking visited on entry is essential: otherwise cycles revisit work forever.',
    patterns: 'Reachability, connected groups, grid islands and “can I get from A to B?” suggest graph traversal. Model the relationship before choosing an algorithm.',
    mistakes: ['Forgetting the reverse edge in an undirected graph changes reachability.', 'Using an array includes only numeric vertices; Map is safer for arbitrary labels.', 'Marking visited after recursion can duplicate work in converging paths.'],
    exercises: ['Draw an adjacency list from an edge list.', 'Implement BFS shortest unweighted distance.', 'Easy: Find Center of Star Graph.', 'Medium: Number of Islands.', 'Medium: Clone Graph.', 'Debug a DFS that loops on a triangle.'],
    checklist: ['I can choose an adjacency representation.', 'I mark nodes at the correct time.', 'I can derive O(V+E) from vertices and edges.']
  },
  12: {
    introduction: 'Advanced graph algorithms answer ordering and weighted-route questions. They extend traversal with state, indegrees, distances and priority queues.',
    theory: 'A directed acyclic graph has a topological order. Kahn’s algorithm repeatedly removes indegree-zero nodes. Dijkstra’s algorithm repeatedly finalizes the smallest known nonnegative distance.',
    code: `function dijkstra(graph, start) {\n  const distances = new Map([[start, 0]]);\n  const pending = [[0, start]];\n  while (pending.length) {\n    pending.sort((a, b) => a[0] - b[0]);\n    const [distance, node] = pending.shift();\n    if (distance !== distances.get(node)) continue;\n    for (const [next, weight] of graph.get(node) || []) {\n      const candidate = distance + weight;\n      if (candidate < (distances.get(next) ?? Infinity)) {\n        distances.set(next, candidate);\n        pending.push([candidate, next]);\n      }\n    }\n  }\n  return distances;\n}`,
    walkthrough: 'The stale-entry check matters because a simpler queue can contain an old distance after a better route is discovered. A real min-heap replaces sorting and shifting.',
    examples: ['A DAG task list becomes executable after indegree-zero tasks are removed.', 'A weighted route improves when an intermediate node offers a shorter candidate.', 'A negative edge invalidates Dijkstra’s greedy guarantee.'],
    complexity: 'With a binary heap Dijkstra is O((V+E) log V); the simple sorted-array reference is slower. Topological sorting is O(V+E). Negative weights require another algorithm.',
    patterns: 'Prerequisites imply topological order. Nonnegative weighted shortest paths imply Dijkstra. Cycles in a dependency graph are detected when fewer than V nodes are output.',
    mistakes: ['Treating directed edges as automatically bidirectional.', 'Ignoring stale priority-queue entries.', 'Using Dijkstra with negative weights.'],
    exercises: ['Compute indegrees by hand.', 'Implement cycle detection with Kahn’s algorithm.', 'Medium: Course Schedule.', 'Medium: Network Delay Time.', 'Hard: Reconstruct Itinerary.', 'Debug a shortest-path solver that marks a node visited too early.'],
    checklist: ['I can state algorithm prerequisites.', 'I can detect a directed cycle.', 'I can explain the greedy proof for nonnegative weights.']
  },
  13: {
    introduction: 'Greedy algorithms commit to the best-looking local choice. Interval problems make the proof obligation visible: a choice is valid only when it preserves an optimal completion.',
    theory: 'Sort by the property that exposes the next safe decision. For interval scheduling, earliest finishing time leaves the most room for future intervals. Overlap merging instead sorts by start and extends the current end.',
    code: `function mergeIntervals(intervals) {\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged = [];\n  for (const [start, end] of intervals) {\n    const last = merged[merged.length - 1];\n    if (!last || start > last[1]) merged.push([start, end]);\n    else last[1] = Math.max(last[1], end);\n  }\n  return merged;\n}`,
    walkthrough: 'Sorting makes the next interval’s start monotonic. Overlap extends the current group; a gap closes it and starts a new group.',
    examples: ['[[1,3],[2,6]] merges to [[1,6]].', 'Touching intervals may merge or remain separate depending on whether the problem defines [1,2] and [2,3] as overlap.', 'An empty list returns [].'],
    complexity: 'Sorting dominates at O(n log n); the merge pass is O(n). The output itself may require O(n) space. Mutating the input with sort is a trade-off—copy if callers need original order.',
    patterns: 'Intervals, scheduling, minimum rooms, deadlines and “locally optimal” clues suggest greedy. Always look for an exchange argument or counterexample before trusting it.',
    mistakes: ['Sorting by the wrong endpoint can make scheduling suboptimal.', 'Using default sort compares numbers as strings.', 'Mutating interval arrays can surprise code that reuses the input.'],
    exercises: ['Decide whether a greedy choice is safe for a scheduling prompt.', 'Implement meeting-room counting with endpoints.', 'Easy: Assign Cookies.', 'Medium: Merge Intervals.', 'Medium: Non-overlapping Intervals.', 'Debug a merge that fails on nested intervals.'],
    checklist: ['I can state the greedy choice.', 'I can test it against a counterexample.', 'I can separate sorting cost from the scan.']
  },
  14: {
    introduction: 'Dynamic programming solves problems with overlapping subproblems and optimal substructure. It turns an exponential recursive tree into a table of reusable states.',
    theory: 'A state stores the minimum information needed for the future. A recurrence describes its transition; a base case seeds the table. Memoisation keeps top-down structure, while tabulation computes bottom-up.',
    code: `function minCostClimbingStairs(cost) {\n  const dp = [0, 0];\n  for (let step = 2; step <= cost.length; step += 1) {\n    dp[step] = Math.min(dp[step - 1] + cost[step - 1], dp[step - 2] + cost[step - 2]);\n  }\n  return dp[cost.length];\n}`,
    walkthrough: 'At each step, the final jump came from one or two steps earlier. Only those two values are needed, so the full table can later be compressed.',
    examples: ['[10,15,20] returns 15 by stepping on indices 0 and 2.', '[1] returns 0 because the top can be reached without paying the single stair.', 'An empty cost array also returns 0.'],
    complexity: 'The table fills once per state: O(n) time and O(n) space, or O(1) auxiliary space after rolling-state compression. The recurrence, not the keyword “DP,” determines the cost.',
    patterns: 'Count ways, minimum cost, maximum value, choices over prefixes and repeated recursive states suggest DP. Define the state before writing nested loops.',
    mistakes: ['A state that omits necessary context cannot produce a correct transition.', 'Mixing “ways” addition with “best value” min/max gives wrong answers.', 'Mutating a shared row or using the wrong base index causes silent table errors.'],
    exercises: ['Draw the recursion tree for climbing stairs.', 'Convert memoisation to tabulation.', 'Easy: Climbing Stairs.', 'Easy: House Robber.', 'Medium: Coin Change.', 'Debug a DP table with an off-by-one target index.'],
    checklist: ['I can define state, transition and base cases.', 'I can identify overlap in a recursive tree.', 'I can justify memory compression.']
  },
  15: {
    introduction: 'Two-dimensional DP handles choices across two dimensions such as grids and subsequences. Tries add a character-by-character prefix structure for dictionary and autocomplete tasks.',
    theory: 'A grid state often means the best result reaching cell (row, column). A subsequence state tracks positions while allowing skips. A trie node maps a character to a child and records whether a word ends there.',
    code: `function uniquePaths(rows, columns) {\n  const dp = Array(columns).fill(1);\n  for (let row = 1; row < rows; row += 1) {\n    for (let column = 1; column < columns; column += 1) {\n      dp[column] += dp[column - 1];\n    }\n  }\n  return dp[columns - 1];\n}`,
    walkthrough: 'The one-dimensional row stores the previous value from above. Adding dp[column-1] combines paths from above and from the left.',
    examples: ['A 3×3 grid has 6 monotonic paths.', 'A 1×n grid has exactly one path.', 'A trie distinguishes “app” as a complete word from “apple” as a longer word sharing its prefix.'],
    complexity: 'The grid transition visits O(rows·columns) cells and uses O(columns) compressed space. A trie uses O(total characters) nodes and supports word/prefix operations in O(length).',
    patterns: 'Grids, two strings, subsequences, prefixes and autocomplete suggest these structures. Clarify whether moves, order and reuse are allowed before defining state.',
    mistakes: ['Confusing subsequence with substring allows forbidden gaps.', 'Overwriting a DP cell before reading its old neighbor corrupts the transition.', 'A trie lookup that ignores an end marker treats prefixes as complete words.'],
    exercises: ['Fill a 3×3 table by hand.', 'Implement a Trie class with insert and startsWith.', 'Medium: Unique Paths.', 'Medium: Longest Common Subsequence.', 'Medium: Word Search.', 'Debug a grid DP that accidentally counts diagonal moves.'],
    checklist: ['I can define a 2D state in plain language.', 'I can compress a row when dependencies permit it.', 'I can distinguish a prefix from a complete trie word.']
  },
  16: {
    introduction: 'Interview consolidation turns isolated techniques into flexible problem-solving. The goal is not to memorise a catalogue, but to explain a model, choose a pattern and verify it under time pressure.',
    theory: 'A strong solution moves through clarify, examples, brute force, invariant, optimisation, proof, implementation and tests. The best pattern is the one whose invariant matches the constraints, not the one most recently studied.',
    code: `function solveWithDiscipline(values) {\n  // 1. State the invariant in one sentence.\n  // 2. Keep the smallest useful state.\n  let answer = 0;\n  for (const value of values) {\n    answer = Math.max(answer, value);\n  }\n  return answer;\n}`,
    walkthrough: 'The code is deliberately simple: explain what answer means after each iteration, test empty and extreme inputs, then replace the model only when constraints require it.',
    examples: ['For a known sorted input, compare a linear scan with binary search.', 'For repeated queries, trade preprocessing memory for faster lookup.', 'For an empty input, define the result before coding rather than relying on undefined.'],
    complexity: 'State complexity before implementation. Compare brute-force O(n²) with an O(n) pattern only after proving the invariant and checking memory, input order and output requirements.',
    patterns: 'Constraints, data shape and requested output are the clues. Say why a pattern does not apply, keep a brute-force fallback, and use small counterexamples to challenge assumptions.',
    mistakes: ['Jumping to code before clarifying duplicates, empty input and mutation rules.', 'Quoting Big O without counting the dominant operation.', 'Testing only the happy path and ignoring adversarial boundaries.'],
    exercises: ['Run a 20-minute mock with a verbal trace.', 'Rewrite a brute-force solution using one prior-week pattern.', 'Easy: Valid Anagram.', 'Medium: Longest Substring Without Repeating Characters.', 'Medium: Number of Islands.', 'Review one failed solution and write the smallest counterexample.'],
    checklist: ['I can communicate an invariant before coding.', 'I can compare two approaches with time and space.', 'I can test boundaries and explain trade-offs.']
  }
};

function makeSections(lesson, guide) {
  const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const section = (title, body) => ({ id: slug(title), title, body });
  return [
    section('Introduction and objectives', `${guide.introduction} By the end of this module, you should be able to explain ${lesson.title}, implement its central operations in JavaScript, trace an example and choose the pattern from constraints.`),
    section('Fundamental theory', `${guide.theory} Prerequisite habit: write down what each variable represents before changing it. Common misconception: a faster-looking data structure is not automatically better if it violates ordering, memory or mutation requirements.`),
    section('JavaScript implementation', `${guide.walkthrough} Use strict equality for values, numeric comparators for numbers and explicit copies when an operation should not mutate input.\n\n${guide.code}`),
    section('Worked examples', guide.examples.map((example, index) => `${index + 1}. ${example}`).join('\n\n')),
    section('Complexity analysis', guide.complexity),
    section('Problem-solving patterns', guide.patterns),
    section('Practice exercises', guide.exercises.map((exercise, index) => `${index + 1}. ${exercise}`).join('\n')),
    section('Common mistakes', guide.mistakes.map((mistake) => `• ${mistake}`).join('\n')),
    section('Module summary and mastery', `Key concepts: ${lesson.concepts}.\n\nMastery checklist:\n${guide.checklist.map((item) => `□ ${item}`).join('\n')}\n\nReview by tracing one example, implementing the core operation from memory, then explaining its complexity aloud.`)
  ];
}

export function getLesson(weekId) {
  const week = weekCatalog.find((item) => item.id === weekId);
  const guide = moduleGuides[weekId];
  if (!week || !guide) return null;
  const base = weekId === 1 ? weekOne : {
    ...week,
    status: 'provisional',
    theory: [{ id: `w${week.id}-overview`, title: `${week.title} foundations`, body: guide.theory }],
    workedExample: guide.code,
    checkpoint: guide.checklist,
    problems: [],
    resources: []
  };
  return { ...base, sections: makeSections(week, guide), guide };
}
