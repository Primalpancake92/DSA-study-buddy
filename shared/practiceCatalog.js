// Manually curated against weekCatalog in curriculum.js; see ../docs/practice-link-audit.md.
// Ordered by syllabus introduction, with harder stretch problems after core practice.
// Prerequisites name concepts, not catalog IDs. Reused problems share one record.
export const practiceCatalog = [
    {
        id: 'contains-duplicate',
        title: 'Contains Duplicate',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/contains-duplicate/',
        difficulty: 'Easy',
        weekIds: [1, 2],
        topics: ['Arrays', 'Sets'],
        prerequisites: ['Array traversal'],
        objective: 'Compare a nested scan with set membership and explain the memory trade-off.'
    },
    {
        id: 'lc-running-sum-of-1d-array',
        title: 'Running Sum of 1d Array',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/running-sum-of-1d-array/',
        difficulty: 'Easy',
        weekIds: [1],
        topics: ['Arrays', 'Prefix sums'],
        prerequisites: ['Loops'],
        objective: 'Trace a linear accumulation and distinguish output space from auxiliary space.'
    },
    {
        id: 'hr-arrays-ds',
        title: 'Arrays - DS',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/arrays-ds/problem',
        difficulty: 'Easy',
        weekIds: [1],
        topics: ['Arrays', 'Traversal'],
        prerequisites: ['Loops'],
        objective: 'Practice indexed traversal and explain the cost of reversing an array.'
    },
    {
        id: 'lc-two-sum',
        title: 'Two Sum',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy',
        weekIds: [2],
        topics: ['Hash maps'],
        prerequisites: ['Array traversal'],
        objective: 'Use complement lookup to replace repeated searching with one pass.'
    },
    {
        id: 'lc-group-anagrams',
        title: 'Group Anagrams',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/group-anagrams/',
        difficulty: 'Medium',
        weekIds: [2],
        topics: ['Hash maps', 'Frequency counting'],
        prerequisites: ['Maps', 'Strings'],
        objective: 'Design a stable grouping key and account for the cost of constructing it.'
    },
    {
        id: 'hr-ctci-ransom-note',
        title: 'Hash Tables: Ransom Note',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/ctci-ransom-note/problem',
        difficulty: 'Easy',
        weekIds: [2],
        topics: ['Hash maps', 'Frequency counting'],
        prerequisites: ['Maps'],
        objective: 'Track multiplicities rather than membership alone.'
    },
    {
        id: 'lc-move-zeroes',
        title: 'Move Zeroes',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/move-zeroes/',
        difficulty: 'Easy',
        weekIds: [3],
        topics: ['Two pointers', 'In-place mutation'],
        prerequisites: ['Arrays'],
        objective: 'Maintain a reader-writer boundary while preserving nonzero order.'
    },
    {
        id: 'lc-3sum',
        title: '3Sum',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/3sum/',
        difficulty: 'Medium',
        weekIds: [3],
        topics: ['Two pointers', 'Sorting'],
        prerequisites: ['Numeric sorting'],
        objective: 'Justify inward pointer moves and eliminate duplicate triples.'
    },
    {
        id: 'hr-pairs',
        title: 'Pairs',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/pairs/problem',
        difficulty: 'Medium',
        weekIds: [3],
        topics: ['Two pointers', 'Sorting', 'Sets'],
        prerequisites: ['Numeric sorting'],
        objective:
            'Use sorted pointers to count target differences and compare with a set solution.'
    },
    {
        id: 'lc-maximum-average-subarray-i',
        title: 'Maximum Average Subarray I',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/maximum-average-subarray-i/',
        difficulty: 'Easy',
        weekIds: [4],
        topics: ['Sliding window'],
        prerequisites: ['Array traversal'],
        objective: 'Update a fixed-width sum without rescanning each range.'
    },
    {
        id: 'lc-longest-substring-without-repeating-characters',
        title: 'Longest Substring Without Repeating Characters',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        difficulty: 'Medium',
        weekIds: [4, 16],
        topics: ['Sliding window', 'Sets'],
        prerequisites: ['Sets', 'Two pointers'],
        objective: 'Restore a uniqueness invariant and explain amortized linear pointer movement.'
    },
    {
        id: 'lc-minimum-window-substring',
        title: 'Minimum Window Substring',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/minimum-window-substring/',
        difficulty: 'Hard',
        weekIds: [4],
        topics: ['Sliding window', 'Frequency counting'],
        prerequisites: ['Frequency maps', 'Variable windows'],
        objective:
            'Stretch practice: track required multiplicities while minimizing a valid window.'
    },
    {
        id: 'hr-the-birthday-bar',
        title: 'Subarray Division',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/the-birthday-bar/problem',
        difficulty: 'Easy',
        weekIds: [4],
        topics: ['Sliding window'],
        prerequisites: ['Arrays', 'Running sums'],
        objective: 'Count fixed-size contiguous segments using an incrementally updated sum.'
    },
    {
        id: 'lc-valid-parentheses',
        title: 'Valid Parentheses',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/valid-parentheses/',
        difficulty: 'Easy',
        weekIds: [5],
        topics: ['Stacks'],
        prerequisites: ['Strings'],
        objective: 'Model nested matching with the most recent unmatched opener.'
    },
    {
        id: 'lc-implement-queue-using-stacks',
        title: 'Implement Queue using Stacks',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/implement-queue-using-stacks/',
        difficulty: 'Easy',
        weekIds: [5],
        topics: ['Stacks', 'Queues'],
        prerequisites: ['Stack operations'],
        objective: 'Explain FIFO behavior and amortized cost with two LIFO stacks.'
    },
    {
        id: 'lc-daily-temperatures',
        title: 'Daily Temperatures',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/daily-temperatures/',
        difficulty: 'Medium',
        weekIds: [5],
        topics: ['Monotonic stacks'],
        prerequisites: ['Stacks', 'Arrays'],
        objective: 'Resolve pending warmer-day queries while pushing and popping each index once.'
    },
    {
        id: 'hr-queue-using-two-stacks',
        title: 'Queue using Two Stacks',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/queue-using-two-stacks/problem',
        difficulty: 'Medium',
        weekIds: [5],
        topics: ['Stacks', 'Queues'],
        prerequisites: ['Stacks'],
        objective: 'Apply lazy transfer to a sequence of queue operations.'
    },
    {
        id: 'lc-binary-search',
        title: 'Binary Search',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/binary-search/',
        difficulty: 'Easy',
        weekIds: [6],
        topics: ['Binary search'],
        prerequisites: ['Sorted arrays'],
        objective: 'State an interval convention and prove each update shrinks the search space.'
    },
    {
        id: 'lc-koko-eating-bananas',
        title: 'Koko Eating Bananas',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/koko-eating-bananas/',
        difficulty: 'Medium',
        weekIds: [6],
        topics: ['Binary search', 'Answer-space search'],
        prerequisites: ['Binary search', 'Ceiling division'],
        objective: 'Search a monotonic feasibility predicate rather than an array index.'
    },
    {
        id: 'hr-icecream-parlor',
        title: 'Ice Cream Parlor',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/icecream-parlor/problem',
        difficulty: 'Easy',
        weekIds: [6],
        topics: ['Binary search', 'Sorting'],
        prerequisites: ['Sorting', 'Original indexes'],
        objective: 'Practice sorted complement searches while retaining original purchase indexes.'
    },
    {
        id: 'lc-reverse-linked-list',
        title: 'Reverse Linked List',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/reverse-linked-list/',
        difficulty: 'Easy',
        weekIds: [7],
        topics: ['Linked lists'],
        prerequisites: ['Node references'],
        objective: 'Save the remaining suffix before reversing each next reference.'
    },
    {
        id: 'lc-linked-list-cycle',
        title: 'Linked List Cycle',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/linked-list-cycle/',
        difficulty: 'Easy',
        weekIds: [7],
        topics: ['Linked lists', 'Fast and slow pointers'],
        prerequisites: ['Reference identity'],
        objective: 'Detect a cycle through pointer speeds without storing every node.'
    },
    {
        id: 'lc-reorder-list',
        title: 'Reorder List',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/reorder-list/',
        difficulty: 'Medium',
        weekIds: [7],
        topics: ['Linked lists', 'Two pointers'],
        prerequisites: ['List reversal', 'List splitting'],
        objective: 'Combine midpoint discovery, reversal and alternating merges safely.'
    },
    {
        id: 'hr-reverse-a-linked-list',
        title: 'Reverse a linked list',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/reverse-a-linked-list/problem',
        difficulty: 'Easy',
        weekIds: [7],
        topics: ['Linked lists'],
        prerequisites: ['Node references'],
        objective: 'Reinforce pointer rewiring and handle empty and single-node chains.'
    },
    {
        id: 'lc-subsets',
        title: 'Subsets',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/subsets/',
        difficulty: 'Medium',
        weekIds: [8],
        topics: ['Backtracking', 'Recursion'],
        prerequisites: ['Recursion base cases', 'Arrays'],
        objective: 'Trace choose-and-skip branches and copy completed paths before undoing choices.'
    },
    {
        id: 'lc-permutations',
        title: 'Permutations',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/permutations/',
        difficulty: 'Medium',
        weekIds: [8],
        topics: ['Backtracking', 'Recursion'],
        prerequisites: ['Choose explore undo'],
        objective: 'Track used choices so sibling branches produce independent permutations.'
    },
    {
        id: 'hr-recursive-digit-sum',
        title: 'Recursive Digit Sum',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/recursive-digit-sum/problem',
        difficulty: 'Medium',
        weekIds: [8],
        topics: ['Recursion', 'Base cases'],
        prerequisites: ['Strings', 'Arithmetic'],
        objective:
            'Identify a decreasing recursive state and separate repeated input from its digit sum.'
    },
    {
        id: 'lc-maximum-depth-of-binary-tree',
        title: 'Maximum Depth of Binary Tree',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
        difficulty: 'Easy',
        weekIds: [9],
        topics: ['Binary trees', 'DFS'],
        prerequisites: ['Recursion'],
        objective: 'Derive depth from child subproblems and count recursion-stack space.'
    },
    {
        id: 'lc-binary-tree-level-order-traversal',
        title: 'Binary Tree Level Order Traversal',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
        difficulty: 'Medium',
        weekIds: [9],
        topics: ['Binary trees', 'BFS', 'Queues'],
        prerequisites: ['Queues', 'Tree nodes'],
        objective: 'Preserve level boundaries while processing nodes in FIFO order.'
    },
    {
        id: 'hr-tree-preorder-traversal',
        title: 'Tree: Preorder Traversal',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/tree-preorder-traversal/problem',
        difficulty: 'Easy',
        weekIds: [9],
        topics: ['Binary trees', 'DFS', 'Preorder'],
        prerequisites: ['Recursion'],
        objective: 'Make node-left-right ordering explicit in a recursive traversal.'
    },
    {
        id: 'lc-validate-binary-search-tree',
        title: 'Validate Binary Search Tree',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/validate-binary-search-tree/',
        difficulty: 'Medium',
        weekIds: [10],
        topics: ['BST', 'DFS'],
        prerequisites: ['Binary trees', 'Bounds'],
        objective: 'Carry ancestor bounds to check the global ordering property.'
    },
    {
        id: 'lc-kth-largest-element-in-a-stream',
        title: 'Kth Largest Element in a Stream',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/',
        difficulty: 'Easy',
        weekIds: [10],
        topics: ['Heaps', 'Top K'],
        prerequisites: ['Heap operations'],
        objective: 'Retain a size-k min-heap and explain why its root answers each update.'
    },
    {
        id: 'lc-top-k-frequent-elements',
        title: 'Top K Frequent Elements',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/top-k-frequent-elements/',
        difficulty: 'Medium',
        weekIds: [10],
        topics: ['Heaps', 'Hash maps', 'Top K'],
        prerequisites: ['Frequency maps', 'Heaps'],
        objective:
            'Combine counting with bounded priority storage and compare alternative approaches.'
    },
    {
        id: 'hr-qheap1',
        title: 'QHEAP1',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/qheap1/problem',
        difficulty: 'Easy',
        weekIds: [10],
        topics: ['Heaps', 'Priority queues'],
        prerequisites: ['Heap operations'],
        objective: 'Maintain heap order across insertions, deletions and minimum queries.'
    },
    {
        id: 'lc-find-if-path-exists-in-graph',
        title: 'Find if Path Exists in Graph',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/find-if-path-exists-in-graph/',
        difficulty: 'Easy',
        weekIds: [11],
        topics: ['Graphs', 'BFS', 'DFS'],
        prerequisites: ['Adjacency lists', 'Sets'],
        objective: 'Build an undirected adjacency list and avoid revisiting vertices.'
    },
    {
        id: 'lc-number-of-islands',
        title: 'Number of Islands',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/number-of-islands/',
        difficulty: 'Medium',
        weekIds: [11, 16],
        topics: ['Graphs', 'DFS', 'Connected components'],
        prerequisites: ['Visited sets', 'Grid traversal'],
        objective: 'Model a grid as a graph and count one traversal per component.'
    },
    {
        id: 'hr-ctci-bfs-shortest-reach',
        title: 'BFS: Shortest Reach in a Graph',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/ctci-bfs-shortest-reach/problem',
        difficulty: 'Hard',
        weekIds: [11],
        topics: ['Graphs', 'BFS', 'Shortest paths'],
        prerequisites: ['Queues', 'Adjacency lists'],
        objective:
            'Stretch practice: compute unweighted distances and represent unreachable vertices.'
    },
    {
        id: 'lc-course-schedule',
        title: 'Course Schedule',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/course-schedule/',
        difficulty: 'Medium',
        weekIds: [12],
        topics: ['Graphs', 'Topological sorting', 'Directed cycles'],
        prerequisites: ['Graph traversal', 'Indegrees'],
        objective:
            'Detect impossible prerequisites by comparing processed vertices with the graph size.'
    },
    {
        id: 'lc-network-delay-time',
        title: 'Network Delay Time',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/network-delay-time/',
        difficulty: 'Medium',
        weekIds: [12],
        topics: ['Graphs', 'Dijkstra', 'Shortest paths'],
        prerequisites: ['Min-heaps', 'Edge relaxation'],
        objective: 'Finalize nonnegative shortest paths and reject stale queue entries.'
    },
    {
        id: 'hr-dijkstrashortreach',
        title: 'Dijkstra: Shortest Reach 2',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/dijkstrashortreach/problem',
        difficulty: 'Hard',
        weekIds: [12],
        topics: ['Graphs', 'Dijkstra', 'Shortest paths'],
        prerequisites: ['Weighted adjacency lists', 'Min-heaps'],
        objective: 'Stretch practice: handle weighted routes, parallel edges and unreachable nodes.'
    },
    {
        id: 'lc-assign-cookies',
        title: 'Assign Cookies',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/assign-cookies/',
        difficulty: 'Easy',
        weekIds: [13],
        topics: ['Greedy', 'Sorting'],
        prerequisites: ['Numeric sorting'],
        objective: 'Explain why assigning the smallest sufficient cookie preserves future options.'
    },
    {
        id: 'lc-merge-intervals',
        title: 'Merge Intervals',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/merge-intervals/',
        difficulty: 'Medium',
        weekIds: [13],
        topics: ['Intervals', 'Sorting'],
        prerequisites: ['Sorting by start'],
        objective: 'Maintain a merged prefix and extend its endpoint when ranges overlap.'
    },
    {
        id: 'lc-non-overlapping-intervals',
        title: 'Non-overlapping Intervals',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/non-overlapping-intervals/',
        difficulty: 'Medium',
        weekIds: [13],
        topics: ['Intervals', 'Greedy'],
        prerequisites: ['Sorting by finish'],
        objective: 'Use an exchange argument to justify keeping the earliest finishing interval.'
    },
    {
        id: 'hr-greedy-florist',
        title: 'Greedy Florist',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/greedy-florist/problem',
        difficulty: 'Medium',
        weekIds: [13],
        topics: ['Greedy', 'Sorting'],
        prerequisites: ['Numeric sorting'],
        objective:
            'Pair expensive flowers with smaller multipliers and justify the ordering by exchange.'
    },
    {
        id: 'lc-climbing-stairs',
        title: 'Climbing Stairs',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/climbing-stairs/',
        difficulty: 'Easy',
        weekIds: [14],
        topics: ['Dynamic programming', 'Memoisation', 'Tabulation'],
        prerequisites: ['Recursion'],
        objective: 'Define a prefix-count state and convert repeated recursion into rolling values.'
    },
    {
        id: 'lc-house-robber',
        title: 'House Robber',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/house-robber/',
        difficulty: 'Medium',
        weekIds: [14],
        topics: ['Dynamic programming'],
        prerequisites: ['State transitions'],
        objective: 'Express take-or-skip choices without allowing adjacent selections.'
    },
    {
        id: 'lc-coin-change',
        title: 'Coin Change',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/coin-change/',
        difficulty: 'Medium',
        weekIds: [14],
        topics: ['Dynamic programming', 'Tabulation'],
        prerequisites: ['Recurrences', 'Base cases'],
        objective:
            'Define minimum-cost amount states and distinguish impossible from zero-cost states.'
    },
    {
        id: 'hr-max-array-sum',
        title: 'Max Array Sum',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/max-array-sum/problem',
        difficulty: 'Medium',
        weekIds: [14],
        topics: ['Dynamic programming'],
        prerequisites: ['Arrays', 'Take-or-skip recurrence'],
        objective: 'Apply nonadjacent-choice DP and test negative values against the stated rules.'
    },
    {
        id: 'lc-unique-paths',
        title: 'Unique Paths',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/unique-paths/',
        difficulty: 'Medium',
        weekIds: [15],
        topics: ['2D dynamic programming', 'Grids'],
        prerequisites: ['Tabulation'],
        objective: 'Combine paths from above and left and justify row compression.'
    },
    {
        id: 'lc-longest-common-subsequence',
        title: 'Longest Common Subsequence',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/longest-common-subsequence/',
        difficulty: 'Medium',
        weekIds: [15],
        topics: ['2D dynamic programming', 'Subsequences'],
        prerequisites: ['String indexes', 'Tabulation'],
        objective: 'Model two prefix lengths and separate matching from skipping transitions.'
    },
    {
        id: 'lc-implement-trie-prefix-tree',
        title: 'Implement Trie (Prefix Tree)',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
        difficulty: 'Medium',
        weekIds: [15],
        topics: ['Tries', 'Prefix trees'],
        prerequisites: ['Maps', 'Tree nodes'],
        objective: 'Distinguish complete words from shared prefixes using terminal markers.'
    },
    {
        id: 'hr-contacts',
        title: 'Contacts',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/contacts/problem',
        difficulty: 'Medium',
        weekIds: [15],
        topics: ['Tries', 'Prefix counting'],
        prerequisites: ['Trie insertion', 'Maps'],
        objective: 'Augment trie nodes with counts to answer repeated prefix queries.'
    },
    {
        id: 'lc-word-search-ii',
        title: 'Word Search II',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/word-search-ii/',
        difficulty: 'Hard',
        weekIds: [15],
        topics: ['Tries', 'Backtracking', 'Grids'],
        prerequisites: ['Tries', 'Choose explore undo'],
        objective:
            'Stretch practice: prune a board search with dictionary prefixes and restore visited cells.'
    },
    {
        id: 'lc-valid-anagram',
        title: 'Valid Anagram',
        platform: 'LeetCode',
        url: 'https://leetcode.com/problems/valid-anagram/',
        difficulty: 'Easy',
        weekIds: [16],
        topics: ['Hash maps', 'Frequency counting'],
        prerequisites: ['Strings', 'Frequency maps'],
        objective: 'Use a timed warm-up to explain character multiplicity and complexity aloud.'
    },
    {
        id: 'hr-balanced-brackets',
        title: 'Balanced Brackets',
        platform: 'HackerRank',
        url: 'https://www.hackerrank.com/challenges/balanced-brackets/problem',
        difficulty: 'Medium',
        weekIds: [16],
        topics: ['Stacks', 'Interview practice'],
        prerequisites: ['Stacks', 'Invariants'],
        objective: 'Use a timed mock to defend matching order and test malformed nesting.'
    }
].map((problem) => ({
    ...problem,
    weekIds: problem.weekIds.map((id) => (id === 1 ? 17 : id))
}));

/** Return curated practice for a numeric syllabus week; unknown weeks return []. */
export function getPracticeForWeek(weekId) {
    return practiceCatalog.filter((problem) => problem.weekIds.includes(weekId));
}
