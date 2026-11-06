# Practice link audit

Verified: 2026-11-06. Scope: [practiceCatalog](../shared/practiceCatalog.js), mapped to all 16 entries of [weekCatalog](../shared/curriculum.js). Curriculum metadata was read only. No dependencies were installed.

## Method and limitations

Used the available web tool to open each official public problem URL, inspect its title and problem description, and confirm platform difficulty. HackerRank difficulty fields were checked separately with page text search. All 55 URLs returned matching official problem pages except Validate Binary Search Tree: direct opens timed out twice, then an official LeetCode problem-page search result confirmed the exact URL, title, Medium rating and BST constraints. Its evidence is search-index content, not a successful direct fetch. Other tool results may also use cached/indexed public content; this is not a guarantee of future availability or authenticated submission access. No private APIs, GraphQL endpoints, user accounts or submission data were accessed.

Titles and difficulties below reflect the official pages at verification. Objectives, topic labels, prerequisite concepts and syllabus assignments are original editorial recommendations. The source curriculum labels some exercises differently (for example House Robber and Minimum Window Substring); the catalog uses the platform ratings, Medium and Hard respectively.

## Integration and manual maintenance

HackerRank's official [API Overview](https://support.hackerrank.com/articles/2067417637-api-overview) describes authenticated hiring workflows such as tests, users, interviews and candidate results. Its official [Partner Guide](https://support.hackerrank.com/articles/8660206242-partner-guide-to-building-an-integration-with-hackerrank) concerns HackerRank for Work and ATS integrations. These documents do not establish a supported API for syncing this community practice catalog.

Official-domain searches for LeetCode public API documentation and integration documentation did not identify supported community catalog integration documentation. No supported community catalog API was found for either platform in this review; this is a scoped finding, not an absolute claim that no such API exists. Unofficial wrappers and undocumented website endpoints are not integration contracts and were not used.

Keep this catalog manually synchronized: open the official problem page, check title, difficulty and topic fit, preserve stable IDs, merge week assignments into existing records, and update this evidence table and date. Recheck integration documentation before considering automation. Store links and original learning objectives, rather than copying problem statements or solutions.

## Syllabus coverage

Core practice starts with Easy problems where suitable and advances to Medium applications. Hard entries are explicitly described as stretch practice; BFS: Shortest Reach is rated Hard by HackerRank even though its central technique is foundational BFS. Week 15 includes grids, subsequences and tries. Week 16 mixes prior patterns for timed explanations; repeated problems are review, so choose an unattempted entry for an unseen mock. Prerequisites are concept names, not record references.

| Week | Actual syllabus | LeetCode | HackerRank |
| --- | --- | ---: | ---: |
| 1 | Complexity and Arrays | 2 | 1 |
| 2 | Hash Maps and Sets | 3 | 1 |
| 3 | Two Pointers | 2 | 1 |
| 4 | Sliding Window | 3 | 1 |
| 5 | Stacks and Queues | 3 | 1 |
| 6 | Binary Search | 2 | 1 |
| 7 | Linked Lists | 3 | 1 |
| 8 | Recursion and Backtracking | 2 | 1 |
| 9 | Binary Trees | 2 | 1 |
| 10 | BSTs and Heaps | 3 | 1 |
| 11 | Graph Foundations | 2 | 1 |
| 12 | Advanced Graphs | 2 | 1 |
| 13 | Greedy and Intervals | 3 | 1 |
| 14 | Dynamic Programming I | 3 | 1 |
| 15 | Dynamic Programming II and Tries | 4 | 1 |
| 16 | Interview Consolidation | 3 | 1 |

## Per-link evidence

“Page” means the official public problem page returned a matching title/description and difficulty (HackerRank's difficulty field was checked with find). “Official search” records the direct-fetch limitation above. Each linked title is the exact audited URL. Cross-week records occur only once. The existing Contains Duplicate ID remains exactly `contains-duplicate`.

| Stable ID | Official source | Difficulty | Weeks | Evidence |
| --- | --- | --- | --- | --- |
| contains-duplicate | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | Easy | 1, 2 | Page |
| lc-running-sum-of-1d-array | [Running Sum of 1d Array](https://leetcode.com/problems/running-sum-of-1d-array/) | Easy | 1 | Page |
| hr-arrays-ds | [Arrays - DS](https://www.hackerrank.com/challenges/arrays-ds/problem) | Easy | 1 | Page |
| lc-two-sum | [Two Sum](https://leetcode.com/problems/two-sum/) | Easy | 2 | Page |
| lc-group-anagrams | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | Medium | 2 | Page |
| hr-ctci-ransom-note | [Hash Tables: Ransom Note](https://www.hackerrank.com/challenges/ctci-ransom-note/problem) | Easy | 2 | Page |
| lc-move-zeroes | [Move Zeroes](https://leetcode.com/problems/move-zeroes/) | Easy | 3 | Page |
| lc-3sum | [3Sum](https://leetcode.com/problems/3sum/) | Medium | 3 | Page |
| hr-pairs | [Pairs](https://www.hackerrank.com/challenges/pairs/problem) | Medium | 3 | Page |
| lc-maximum-average-subarray-i | [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) | Easy | 4 | Page |
| lc-longest-substring-without-repeating-characters | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Medium | 4, 16 | Page |
| lc-minimum-window-substring | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Hard | 4 | Page |
| hr-the-birthday-bar | [Subarray Division](https://www.hackerrank.com/challenges/the-birthday-bar/problem) | Easy | 4 | Page |
| lc-valid-parentheses | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | Easy | 5 | Page |
| lc-implement-queue-using-stacks | [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/) | Easy | 5 | Page |
| lc-daily-temperatures | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Medium | 5 | Page |
| hr-queue-using-two-stacks | [Queue using Two Stacks](https://www.hackerrank.com/challenges/queue-using-two-stacks/problem) | Medium | 5 | Page |
| lc-binary-search | [Binary Search](https://leetcode.com/problems/binary-search/) | Easy | 6 | Page |
| lc-koko-eating-bananas | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | Medium | 6 | Page |
| hr-icecream-parlor | [Ice Cream Parlor](https://www.hackerrank.com/challenges/icecream-parlor/problem) | Easy | 6 | Page |
| lc-reverse-linked-list | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | Easy | 7 | Page |
| lc-linked-list-cycle | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/) | Easy | 7 | Page |
| lc-reorder-list | [Reorder List](https://leetcode.com/problems/reorder-list/) | Medium | 7 | Page |
| hr-reverse-a-linked-list | [Reverse a linked list](https://www.hackerrank.com/challenges/reverse-a-linked-list/problem) | Easy | 7 | Page |
| lc-subsets | [Subsets](https://leetcode.com/problems/subsets/) | Medium | 8 | Page |
| lc-permutations | [Permutations](https://leetcode.com/problems/permutations/) | Medium | 8 | Page |
| hr-recursive-digit-sum | [Recursive Digit Sum](https://www.hackerrank.com/challenges/recursive-digit-sum/problem) | Medium | 8 | Page |
| lc-maximum-depth-of-binary-tree | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Easy | 9 | Page |
| lc-binary-tree-level-order-traversal | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/) | Medium | 9 | Page |
| hr-tree-preorder-traversal | [Tree: Preorder Traversal](https://www.hackerrank.com/challenges/tree-preorder-traversal/problem) | Easy | 9 | Page |
| lc-validate-binary-search-tree | [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/) | Medium | 10 | Official search; direct fetch timed out |
| lc-kth-largest-element-in-a-stream | [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) | Easy | 10 | Page |
| lc-top-k-frequent-elements | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | Medium | 10 | Page |
| hr-qheap1 | [QHEAP1](https://www.hackerrank.com/challenges/qheap1/problem) | Easy | 10 | Page |
| lc-find-if-path-exists-in-graph | [Find if Path Exists in Graph](https://leetcode.com/problems/find-if-path-exists-in-graph/) | Easy | 11 | Page |
| lc-number-of-islands | [Number of Islands](https://leetcode.com/problems/number-of-islands/) | Medium | 11, 16 | Page |
| hr-ctci-bfs-shortest-reach | [BFS: Shortest Reach in a Graph](https://www.hackerrank.com/challenges/ctci-bfs-shortest-reach/problem) | Hard | 11 | Page |
| lc-course-schedule | [Course Schedule](https://leetcode.com/problems/course-schedule/) | Medium | 12 | Page |
| lc-network-delay-time | [Network Delay Time](https://leetcode.com/problems/network-delay-time/) | Medium | 12 | Page |
| hr-dijkstrashortreach | [Dijkstra: Shortest Reach 2](https://www.hackerrank.com/challenges/dijkstrashortreach/problem) | Hard | 12 | Page |
| lc-assign-cookies | [Assign Cookies](https://leetcode.com/problems/assign-cookies/) | Easy | 13 | Page |
| lc-merge-intervals | [Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Medium | 13 | Page |
| lc-non-overlapping-intervals | [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/) | Medium | 13 | Page |
| hr-greedy-florist | [Greedy Florist](https://www.hackerrank.com/challenges/greedy-florist/problem) | Medium | 13 | Page |
| lc-climbing-stairs | [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) | Easy | 14 | Page |
| lc-house-robber | [House Robber](https://leetcode.com/problems/house-robber/) | Medium | 14 | Page |
| lc-coin-change | [Coin Change](https://leetcode.com/problems/coin-change/) | Medium | 14 | Page |
| hr-max-array-sum | [Max Array Sum](https://www.hackerrank.com/challenges/max-array-sum/problem) | Medium | 14 | Page |
| lc-unique-paths | [Unique Paths](https://leetcode.com/problems/unique-paths/) | Medium | 15 | Page |
| lc-longest-common-subsequence | [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/) | Medium | 15 | Page |
| lc-implement-trie-prefix-tree | [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/) | Medium | 15 | Page |
| hr-contacts | [Contacts](https://www.hackerrank.com/challenges/contacts/problem) | Medium | 15 | Page |
| lc-word-search-ii | [Word Search II](https://leetcode.com/problems/word-search-ii/) | Hard | 15 | Page |
| lc-valid-anagram | [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | Easy | 16 | Page |
| hr-balanced-brackets | [Balanced Brackets](https://www.hackerrank.com/challenges/balanced-brackets/problem) | Medium | 16 | Page |

