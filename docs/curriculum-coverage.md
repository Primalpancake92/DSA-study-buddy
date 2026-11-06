# Curriculum audit and coverage

## Canonical sequence and source decision

Inspected on 7 November 2026: the application checkout's `shared/curriculum.js`, `shared/textbook/`, lesson renderer and authenticated curriculum routes; the GitHub contents of both repositories' README files; the application's remote `shared/curriculum.js`; and all sixteen `DSA-grind/weeks/NN.md` files. GitHub reads used the connected repository tool, not an inferred copy of a website.

The [application catalogue](../shared/curriculum.js) is authoritative for week numbers, titles and routing. The [upstream syllabus](https://github.com/Primalpancake92/DSA-grind/blob/main/README.md) agrees on all sixteen titles and their order. No week is moved or replaced. Markdown in [weekly_content](weekly_content/README.md) becomes the teaching source; the upstream files remain the historical assignment/reference syllabus, not a runtime network dependency.

## Coverage checklist

The table records required coverage, not a word-count-based quality verdict. Chapter validation checks structure and executable examples; human review must still assess explanation, proof and exercise quality.

| Chapter | Canonical topics to cover | Original upstream practice assignments |
| --- | --- | --- |
| [Week 1](weekly_content/week-01.md) | Big O, Big Theta, time vs space, array traversal and mutation | Contains Duplicate; Best Time to Buy and Sell Stock; Product of Array Except Self |
| [Week 2](weekly_content/week-02.md) | Hashing, frequency counting, Map and Set in JavaScript | Two Sum; Valid Anagram; Group Anagrams; Top K Frequent Elements |
| [Week 3](weekly_content/week-03.md) | Opposite-direction pointers, slow/fast pointers, pointer invariants | Valid Palindrome; Remove Duplicates from Sorted Array; Two Sum II; 3Sum |
| [Week 4](weekly_content/week-04.md) | Fixed and variable windows, frequency maps, shrinking and expanding | Maximum Average Subarray I; Longest Substring Without Repeating Characters; Permutation in String |
| [Week 5](weekly_content/week-05.md) | LIFO/FIFO, monotonic stacks, queue implementation | Valid Parentheses; Min Stack; Daily Temperatures; Evaluate Reverse Polish Notation |
| [Week 6](weekly_content/week-06.md) | Sorted search spaces, invariant, boundaries and answer-space search | Binary Search; Search Insert Position; Search in Rotated Sorted Array; Koko Eating Bananas |
| [Week 7](weekly_content/week-07.md) | Node pointers, dummy nodes, fast/slow cycle detection | Reverse Linked List; Merge Two Sorted Lists; Linked List Cycle; Remove Nth Node From End of List |
| [Week 8](weekly_content/week-08.md) | Call stack, base cases, recursion trees, choose/explore/undo | Subsets; Permutations; Combination Sum; Generate Parentheses |
| [Week 9](weekly_content/week-09.md) | DFS preorder/inorder/postorder and BFS level order | Maximum Depth of Binary Tree; Invert Binary Tree; Same Tree; Binary Tree Level Order Traversal |
| [Week 10](weekly_content/week-10.md) | BST invariants, heaps and priority queues, top K | Validate Binary Search Tree; Kth Smallest Element in a BST; Kth Largest Element in an Array; Last Stone Weight |
| [Week 11](weekly_content/week-11.md) | Adjacency lists, visited sets, BFS/DFS and components | Find if Path Exists in Graph; Number of Islands; Max Area of Island; Clone Graph |
| [Week 12](weekly_content/week-12.md) | Directed cycles, topological sort, BFS and Dijkstra | Course Schedule; Course Schedule II; Rotting Oranges; Network Delay Time |
| [Week 13](weekly_content/week-13.md) | Local choices, greedy correctness, interval sorting | Maximum Subarray; Jump Game; Merge Intervals; Non-overlapping Intervals |
| [Week 14](weekly_content/week-14.md) | Memoization, tabulation, state and recurrence | Climbing Stairs; Min Cost Climbing Stairs; House Robber; Coin Change |
| [Week 15](weekly_content/week-15.md) | 2D DP, subsequences, grids and prefix trees | Unique Paths; Longest Common Subsequence; Word Break; Implement Trie (Prefix Tree) |
| [Week 16](weekly_content/week-16.md) | Unseen problems, timed mocks, independent explanations | Longest Substring Without Repeating Characters; Number of Islands; Search in Rotated Sorted Array; House Robber |

## Differences and decisions

- The remote app README describes an early vertical slice and says the curriculum import is unavailable. The checked-in app actually has sixteen detailed protected modules. Runtime imports and routes take precedence over that outdated status prose.
- The upstream curriculum has concise weekly outlines and fixed assignment names; the app has additional concept explanations and a deduplicated practice catalogue. The new chapters expand the same concepts, with selected verified platform problems and original exercises. They do not claim every upstream assignment is reproduced or solved.
- App guide prose labels Minimum Window Substring as Medium and House Robber as Easy. Platform difficulty must be verified against the official problem page rather than inherited from those labels.
- The old compact recursion guide understates materialised subset output cost; the upstream Week 8 correctly distinguishes Θ(n·2^n) output/time from O(n) working depth. New material must retain that distinction.
- The old head-index BFS guide describes O(width) live queue space, although an uncompacted array retains O(n) references. Explanations must analyse the actual implementation, not an ideal queue.
- Legacy source examples use simplified repeated sorting for top-K and Dijkstra. New chapters teach actual heap mechanics where heap complexity is claimed.
- At audit start, `docs/weekly_content/week1.md` was a short untracked user draft. It informed the introduction format but was absent on a later filesystem check; the implementation did not restore it or make it a runtime dependency.
- Sorting appears as a prerequisite/operation in binary search, heaps and interval algorithms. There is no separate sorting week in either syllabus; none is inserted.

## Reproducible upstream file identities

These are Git blob SHAs returned by the GitHub file API, not commit IDs. Links below refer to the inspected main-branch paths, which may later change.

| Week | Upstream file | Inspected blob SHA |
| --- | --- | --- |
| 1 | [weeks/01.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/01.md) | `937276c8f40b9ab3bd882bbf28418048d7ae6ad5` |
| 2 | [weeks/02.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/02.md) | `17354425af0b8863ef482bea0926f0a4a683249d` |
| 3 | [weeks/03.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/03.md) | `777807bca4688d3a62538cbe7ad8f53845fd7e02` |
| 4 | [weeks/04.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/04.md) | `40ce0091ffa23b061e775dffb32b54e836d72582` |
| 5 | [weeks/05.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/05.md) | `358cdaf51b0990cb41164ffc976ce409af38ddfc` |
| 6 | [weeks/06.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/06.md) | `7954db319ce2ee9ffbe78dba2027872d7b51a630` |
| 7 | [weeks/07.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/07.md) | `6f2f706215c09379e94fe614b3b1915fcfd6ac0c` |
| 8 | [weeks/08.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/08.md) | `ca5aa5a9ba5fa6ab45aac2fa3be1f4e84e9e8759` |
| 9 | [weeks/09.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/09.md) | `b2ab9009f8f7214f5addafb5d92482b2dbb982e3` |
| 10 | [weeks/10.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/10.md) | `f571270fd4fca9809d2f73a6ade6bf9a5657c925` |
| 11 | [weeks/11.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/11.md) | `824b12fcf91e312c50def2eca5b54e88704c70b0` |
| 12 | [weeks/12.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/12.md) | `346d6a662363bd97ad0a192b582f7e90fc825aa1` |
| 13 | [weeks/13.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/13.md) | `db8c28dd4fdac3f02f1e5325fe3515542bb4e4e8` |
| 14 | [weeks/14.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/14.md) | `03459baea15c7d10bb4e728b80965303aedd738f` |
| 15 | [weeks/15.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/15.md) | `f960d26c7b97691e3d27f41eab2fa15b470ba274` |
| 16 | [weeks/16.md](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/16.md) | `dc18e66da82ae261d813a581884b3c9d5a12e028` |

## Research and authorship

Each chapter's **Sources and Further Reading** section identifies the references actually used for that chapter. Explanations, diagrams, worked inputs and solutions are original instructional material, not copied textbook passages or platform editorials. External problem statements are not reproduced. Link verification is a dated observation, not a permanent availability guarantee; authentication walls and rate limits must be distinguished from nonexistent pages.

## Integration acceptance checks

- [x] Sixteen canonical chapter files and topic-specific introductions.
- [x] Required sections, worked traces, exercises, solutions and stable checklist identifiers.
- [x] Runnable JavaScript syntax and documented output checks.
- [x] Internal chapter links and safe Markdown rendering.
- [x] Authenticated content delivery; no public Markdown file endpoint.
- [x] Reversible user-scoped checklist integration, with frontend save/error tests.
- [x] Existing lesson routes, mastery IDs and roadmap navigation preserved.
- [x] Production build, backend syntax checks and relevant tests.
- [ ] Live authenticated cross-device PostgreSQL save/refresh verification (not performed).

Validation results and known limits are recorded in [the content README](weekly_content/README.md).

