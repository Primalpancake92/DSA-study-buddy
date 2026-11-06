# Week 15 - Dynamic Programming II and Tries

This week, you will be learning two-dimensional dynamic programming and prefix trees. Grid coordinates and pairs of string prefixes require richer states than a single index, while tries organize dictionary words by shared prefixes. These tools matter for route counting, sequence comparison, and incremental text lookup.

We will start with grid paths and obstacles, derive longest common subsequence with reconstruction, then build a trie with exact-word and prefix operations. Finally, Word Search will show why some grid problems require path-dependent backtracking instead of a small DP table.

By the end, you should be able to explain every table axis, preserve dependencies during row compression, distinguish subsequences from substrings, and implement trie operations without mistaking a prefix for a complete word.

There will be a checklist at the end of this lesson covering Theory, JavaScript, Practice, and Reflection. Use it to record evidence in your progress logs.

## Learning Objectives

- Derive grid recurrences from legal predecessor cells and obstacle rules.
- Define LCS state over two prefix lengths and reconstruct one optimum.
- Explain the old-above, new-left, and old-diagonal values in compressed DP.
- Implement trie insertion, exact search, and prefix search.
- Identify when a visited path is necessary state and must be undone.

## Prerequisite Knowledge

Review state definitions, bases, and evaluation order in [Week 14](week-14.md), and implicit grid graphs in [Week 11](week-11.md). You need nested arrays, `Map`, and recursive choose/explore/undo reasoning. The code treats strings as Unicode code points using iteration or `Array.from`; this is not grapheme segmentation, so a combined visual emoji can contain several symbols.

## Core Theory

### Grid paths form a directed dependency graph

Let paths(r,c) count routes from the top-left cell to `(r,c)` using only right and down moves. An arrival comes from above or left. These cases are disjoint, so add their counts. The start has one route, the empty route; an out-of-bounds predecessor contributes zero. A blocked cell has zero routes regardless of the values around it. Row-major evaluation works because both legal predecessors have already been computed.

A full R×C table makes dependencies easy to see. A compressed row is a representation change, not a new recurrence: before updating column c, dp[c] is the previous row's value from above, while dp[c−1] has already become this row's value from the left. Therefore left-to-right updates are essential. A blocked cell must reset dp[c] to zero or an old above-route will leak through it.

### Two prefixes define a subsequence question

A subsequence preserves order but permits gaps; a substring is contiguous. “ace” is a subsequence of “abcde”, but not its substring. Define dp(i,j) as the LCS length for the first i symbols of A and first j symbols of B. If either prefix is empty, the answer is zero.

When the final symbols match, an optimum can include that shared final symbol: use dp(i−1,j−1)+1. When they differ, an optimum cannot use both final symbols as its final matched pair, so skip one endpoint and take max(dp(i−1,j),dp(i,j−1)). This exhausts the alternatives. Induction over prefix lengths proves the table. More generally, MIT's [string-DP notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/3484e876d81aba07911a1109f5b5e81e_MIT6_006F11_lec21.pdf) illustrate the use of string subproblems and dependency tables; the LCS derivation here is specific to this chapter.

Reconstruction follows the choices backward. On a match, record the symbol and move diagonally. On a mismatch, move to a neighbor carrying the retained optimum. Ties can yield different valid subsequences, so test optimal length and membership in both inputs rather than one arbitrarily preferred string.

### A trie shares paths, not just complete keys

Each trie edge consumes one symbol; each node stores outgoing symbol-to-child mappings and an end-of-word flag. Inserting “cart” creates a path c→a→r→t. That path also contains the prefix “car”, but “car” is not a stored word until its node is marked. Exact search requires both an existing path and an end marker. Prefix search requires only the path. The root represents the empty prefix; it becomes an empty stored word only after explicit insertion.

Tries are useful for repeated prefix queries or dictionary-guided traversal. A `Set` is usually simpler for exact membership alone. CMU's [string-algorithm lecture](https://www.cs.cmu.edu/~avrim/451f13/lectures/lect1121.pdf) discusses tries as shared string paths; the sparse JavaScript `Map` representation below avoids allocating an entire alphabet array at every node.

### Not every grid search is grid DP

Word Search forbids reusing a board cell within one candidate word. Two visits to the same `(row,column,index)` can have different legal futures because earlier cells used on their paths differ. Memoising only that triple merges incompatible histories. Backtracking keeps a path-specific set, marks before exploration, and unmarks before returning. A trie can prune dictionary prefixes when searching many words, but it does not eliminate the no-reuse constraint.

## JavaScript Implementations

### Grid paths, with and without obstacles

Dimensions are nonnegative integers. Obstacle grids are rectangular arrays with zero for open and one for blocked. Counts must remain safe integers for exact `Number` answers; use consistent `BigInt` values for larger exact counts.

Start with a full table before compressing it. Imagine filling cell `(1,2)` in a three-column grid. Its routes come from `(0,2)` above and `(1,1)` to the left. A route cannot belong to both groups because its final move has only one direction. That is why we add rather than take a maximum. The top-left cell is seeded separately because it has no predecessor: reaching it requires no moves, and there is exactly one such empty route.

```javascript
function gridPathTable(rows, columns) {
  if (rows === 0 || columns === 0) {
    return [];
  }
  const table = Array.from({
    length: rows
  }, () => Array(columns).fill(0));
  table[0][0] = 1;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (row === 0 && column === 0) {
        continue;
      }
      const fromAbove = row > 0 ? table[row - 1][column] : 0;
      const fromLeft = column > 0 ? table[row][column - 1] : 0;
      table[row][column] = fromAbove + fromLeft;
    }
  }
  return table;
}
console.log(JSON.stringify(gridPathTable(3, 3)));
console.log(JSON.stringify(gridPathTable(1, 4)));
console.log(JSON.stringify(gridPathTable(0, 3)));
```
```output
[[1,1,1],[1,2,3],[1,3,6]]
[[1,1,1,1]]
[]
```

Read the loops as a schedule for answering subproblems. At the beginning of a row, the row above is complete. Within the row, every cell to the left is complete. Neither dependency points forward, so a computed value never needs revision. Allowing moves upward or leftward would destroy this simple ordering and could create cycles; you could not keep the same recurrence and assume a single pass remained valid. This full-table version returns O(RC) cells, uses O(1) extra loop state, and takes O(RC) time for nonempty dimensions.

The next implementation retains only the previous/current row because older rows are never read again. On the first row, every open cell has one route. Later updates combine the still-old value at the current column with the already-new value at the preceding column. The obstacle variant starts more cautiously with only the source seeded and clears a column whenever it encounters a blocked cell.

```javascript
function uniquePaths(rows, cols) {
  if (rows === 0 || cols === 0) {
    return 0;
  }
  const dp = Array(cols).fill(1);
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      dp[c] += dp[c - 1];
    }
  }
  return dp[cols - 1];
}
function pathsWithObstacles(grid) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (grid.some(row => row.length !== cols)) {
    throw new Error('Ragged grid');
  }
  if (rows === 0 || cols === 0) {
    return 0;
  }
  const dp = Array(cols).fill(0);
  dp[0] = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        dp[c] = 0;
      } else if (c > 0) {
        dp[c] += dp[c - 1];
      }
    }
  }
  return dp[cols - 1];
}
console.log(uniquePaths(3, 3), uniquePaths(1, 5), uniquePaths(0, 3));
console.log(pathsWithObstacles([[0, 0, 0], [0, 1, 0], [0, 0, 0]]));
console.log(pathsWithObstacles([[1]]), pathsWithObstacles([]));
```
```output
6 1 0
2
0 0
```

The unobstructed first row and column each have one route. The obstacle version cannot prefill every boundary with one: an obstacle on the first row blocks later cells until another route can enter from below, which right/down motion does not allow on that row.

### Full LCS table and reconstruction

Independent row allocation prevents accidental aliasing. Prefix lengths range from zero through the input length, so character indexes use i−1 and j−1.

For a match, the diagonal represents both prefixes before their final symbols. Extending that answer consumes one symbol from each string exactly once. For a mismatch, moving up ignores the final symbol of the first prefix; moving left ignores the final symbol of the second. We take a maximum because these are competing candidate subsequences, not disjoint sets of routes to count. Adding the two neighboring lengths would combine possibly overlapping matches and can claim an impossible answer.

The extra zero row and column represent an empty prefix explicitly. This lets a match at the first characters use the same diagonal formula as any later match. During reconstruction, a diagonal move records a real match, whereas an up or left move merely discards an unused endpoint. At every step the retained table value remains achievable by the remaining prefixes.

```javascript
function longestCommonSubsequence(first, second) {
  const a = Array.from(first);
  const b = Array.from(second);
  const dp = Array.from({
    length: a.length + 1
  }, () => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        const shorterPrefixes = dp[i - 1][j - 1];
        dp[i][j] = shorterPrefixes + 1;
      } else {
        const skipFromFirst = dp[i - 1][j];
        const skipFromSecond = dp[i][j - 1];
        dp[i][j] = Math.max(skipFromFirst, skipFromSecond);
      }
    }
  }
  let i = a.length;
  let j = b.length;
  const reversed = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      reversed.push(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return {
    length: dp[a.length][b.length],
    sequence: reversed.reverse().join('')
  };
}
console.log(JSON.stringify(longestCommonSubsequence('abcde', 'ace')));
console.log(JSON.stringify(longestCommonSubsequence('ab', 'ac')));
console.log(JSON.stringify(longestCommonSubsequence('', 'abc')));
```
```output
{"length":3,"sequence":"ace"}
{"length":1,"sequence":"a"}
{"length":0,"sequence":""}
```

### Compress LCS only when length is enough

Unlike grid counting, LCS needs the old diagonal as well as above and left. Save above before overwriting; after the update, that saved value becomes the next column's old diagonal.

```javascript
function lcsLength(first, second) {
  const a = Array.from(first);
  const b = Array.from(second);
  const dp = Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = 0;
    for (let j = 1; j <= b.length; j++) {
      const above = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = diagonal + 1;
      } else {
        const left = dp[j - 1];
        dp[j] = Math.max(above, left);
      }
      diagonal = above;
    }
  }
  return dp[b.length];
}
console.log(lcsLength('abcde', 'ace'));
console.log(lcsLength('a', 'aa'));
console.log(lcsLength('', 'abc'));
```
```output
3
1
0
```

The second test catches using the newly updated left value as the diagonal: one “a” must not match twice. Compression removes the full decision history; use the full table for the simple reconstruction above.

### Trie insertion, search, and prefix lookup

There are two separate questions at the end of a query: did every character edge exist, and was this exact endpoint marked as a word? Keep those questions separate in the implementation. `findNode` handles the shared traversal. `search` additionally checks the endpoint's `end` flag. `startsWith` needs only a successful traversal. The node itself does not need to store the entire prefix: its position in the tree already identifies that prefix.

Insertion creates a child only when an edge is missing, then advances to that child. After every character has been consumed, it marks the final node. Marking every node on the way would wrongly insert every prefix as a word. Inserting “cart” should not silently insert “c”, “ca”, or “car”. Conversely, a marked node is allowed to have children: “car” and “cart” can both be words.

```javascript
class TrieNode {
  constructor() {
    this.children = new Map();
    this.end = false;
  }
}
class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  insert(word) {
    let node = this.root;
    for (const symbol of word) {
      if (!node.children.has(symbol)) {
        node.children.set(symbol, new TrieNode());
      }
      node = node.children.get(symbol);
    }
    node.end = true;
  }
  findNode(text) {
    let node = this.root;
    for (const symbol of text) {
      node = node.children.get(symbol);
      if (!node) {
        return null;
      }
    }
    return node;
  }
  search(word) {
    const node = this.findNode(word);
    if (node === null) {
      return false;
    }
    return node.end;
  }
  startsWith(prefix) {
    const node = this.findNode(prefix);
    return node !== null;
  }
}
const dictionary = new Trie();
dictionary.insert('cart');
console.log(dictionary.search('car'), dictionary.startsWith('car'));
dictionary.insert('car');
dictionary.insert('car');
console.log(dictionary.search('car'), dictionary.search('cart'));
console.log(dictionary.search(''), dictionary.startsWith(''));
dictionary.insert('');
console.log(dictionary.search(''), dictionary.startsWith('cat'));
```
```output
false true
true true
false true
true false
```

Duplicate insertion is idempotent for membership. A contact-counting application needs an additional count and an explicit policy for duplicate names. Deleting “car” should clear its end marker without removing the branch to “cart”; prune a node only if it is not an ending and has no children.

### Word Search with path-local marking

Board cells contain single code-point symbols. Empty word returns true; empty board with a nonempty word returns false. The board is preserved. The path set is undone even on a successful branch before returning.

```javascript
function wordExists(board, word) {
  const letters = Array.from(word);
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  if (board.some(row => row.length !== cols)) {
    throw new Error('Ragged board');
  }
  if (letters.length === 0) {
    return true;
  }
  if (letters.length > rows * cols) {
    return false;
  }
  const used = new Set();
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function search(r, c, index) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) {
      return false;
    }
    const key = r * cols + c;
    if (used.has(key) || board[r][c] !== letters[index]) {
      return false;
    }
    if (index === letters.length - 1) {
      return true;
    }
    used.add(key);
    let found = false;
    for (const [dr, dc] of directions) {
      if (search(r + dr, c + dc, index + 1)) {
        found = true;
        break;
      }
    }
    used.delete(key);
    return found;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (search(r, c, 0)) {
        return true;
      }
    }
  }
  return false;
}
const board = [['A', 'B'], ['C', 'D']];
console.log(wordExists(board, 'ABD'));
console.log(wordExists(board, 'ABA'), wordExists(board, 'AD'));
console.log(wordExists([], ''));
```
```output
true
false false
true
```

## Worked Examples

For the 3×3 obstacle grid with the middle blocked, the compressed state starts `[1,0,0]`. After row zero it is `[1,1,1]`; after row one, `[1,0,1]`; after row two, `[1,1,2]`. Resetting the middle column erases the route from above but allows later rows to receive new routes from their left.

For A=`ab`, B=`ac`, the LCS table is:

| Prefix | empty | a | ac |
| --- | --- | --- | --- |
| empty | 0 | 0 | 0 |
| a | 0 | 1 | 1 |
| ab | 0 | 1 | 1 |

At `(2,2)`, b differs from c, so retain the maximum of the neighbors. Reconstruction can move upward to `(1,2)`, left to `(1,1)`, then record a and move diagonally. The mismatch does not erase the earlier match.

For trie insertion, “cart” creates four edges and marks only t. Searching “car” reaches r, but r is not initially an end. Inserting “car” changes only its flag. No second c→a→r chain is allocated. In Word Search, A→B→D succeeds, A→B→A fails because A is still on the path, and A→D fails because diagonal edges were never legal.

## Visual Explanations

```text
Unobstructed paths:      Obstacle paths:
1  1  1                 1  1  1
1  2  3                 1  X  1
1  3  6                 1  1  2

Compressed LCS update:
old diagonal   old above
       \          |
        \         v
new left ---> current

Trie after inserting car and cart:
root --c--> node --a--> node --r--> node* --t--> node*
* means a complete stored word ends here.
```

## Complexity Analysis

Grid algorithms take O(RC) arithmetic operations and O(C) row storage for nonempty dimensions. Rectangle validation adds O(R) work, including zero-column grids. LCS on lengths m,n uses O((m+1)(n+1)) full-table time and space, including initialization; reconstruction adds O(m+n) traversal and O(L) output for L matched symbols. For positive lengths this is conventionally O(mn). The compressed version uses O(n) DP storage, but its `Array.from` symbol arrays add O(m+n) total auxiliary storage. Do not claim total O(n) space while ignoring those copies.

Trie insertion and lookup use expected O(L) time for L query code points under expected constant-time `Map` access. Lookup keeps O(1) traversal state; insertion may allocate O(L) nodes. Across S inserted symbols, node count is O(S+1). Enumerating all completions is not O(prefix length): it must also traverse/output matches. Per-node object and map overhead can be substantial in practice.

For a word of length L, Word Search has a loose O(RC·4^L) branching bound plus O(L+R) conversion/validation work. Its path set and recursion stack are O(min(L,RC)); the explicit letters array adds O(L). Recursion may overflow on very long paths. Numeric path counts assume safe-integer arithmetic; exact large counts need a different arithmetic-cost analysis.

## Common Mistakes

- Confusing a subsequence with a substring and setting LCS mismatches to zero.
- Reusing one row object throughout a 2D table.
- Updating a compressed grid row right-to-left while still claiming above-plus-current-left dependencies.
- Forgetting to save LCS's old diagonal.
- Returning true for any trie path without checking an end marker.
- Keeping Word Search's visited marks across sibling branches or starting cells.

```javascript-bug
const dp = Array(3).fill(Array(3).fill(0));
dp[1][1] = 7; // All apparent rows now have 7 in column 1.
```

## Interview and LeetCode Pattern Recognition

Two strings often suggest two prefix indexes; monotonic grid moves suggest an acyclic dependency order. Dictionary prefixes suggest a trie. A grid plus “no reuse in the current path” suggests backtracking, not automatically DP. Ask what information makes two future subproblems truly equivalent.

Unique Paths counts routes; Longest Common Subsequence maximizes matched length; Word Search asks whether one history-dependent route exists. Contacts asks how many stored names share a prefix, which needs counts beyond the Boolean trie shown above. These distinctions are more useful than recognizing the input's rectangular shape.

## Practice Exercises

### Conceptual

1. Explain why `(row,column,index)` is insufficient as a general memo key for no-reuse Word Search.
2. Explain why exact lookup of “car” can be false while prefix lookup is true.

### Tracing

3. Trace obstacle rows for `[[0,1,0],[0,0,0]]`. Then block the starting cell and recompute.
4. Fill the LCS table for `abc` and `ac`, and reconstruct one answer.

### Debugging

5. Repair shared row allocation. Separately, show why a newly updated LCS left value cannot replace the old diagonal, using `a` and `aa`.

### Implementation

6. Add prefix counts to a trie. Specify whether duplicate insertion increases the count; keep exact membership behavior consistent with that policy.
7. Add a single-word deletion operation that preserves longer words sharing the prefix.

### LeetCode + HackerRank

- **[Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/)** — Platform: LeetCode. Difficulty: Medium. Concepts: two-prefix DP, skip/match transitions, subsequence order. Why: tests whether you can derive a 2D state and distinguish gaps from contiguity.
- **[Contacts](https://www.hackerrank.com/challenges/contacts/problem)** — Platform: HackerRank. Difficulty: Medium. Concepts: tries, prefix counts, incremental insertion. Why: extends Boolean prefix existence into an aggregate that can be updated along each insertion path.

## Hints and Worked Solutions

1. Two histories reaching the same cell and letter index may have used different earlier cells. A future move can be legal in one and forbidden in the other. Include the used-set state or retain backtracking; a smaller key needs a separate proof of equivalence.
2. Inserting “cart” creates the “car” path but marks only the node after t. Search must inspect the flag at r. The empty prefix similarly exists even before the empty word is inserted.
3. Row zero becomes `[1,0,0]`: the obstacle blocks the only route along that row. Row one becomes `[1,1,1]`, so the answer is one. With a blocked start, all states remain zero.
4. With an empty border, rows are `[0,0,0]`, `[0,1,1]`, `[0,1,1]`, `[0,1,2]`. Record c, then a while walking backward; reverse to get `ac`.
5. Allocate rows with a factory. For compressed LCS, save `above=dp[j]` before the write and then set `diagonal=above`. Using new left on `a` versus `aa` would incorrectly build length two from one source symbol.
6. Store a count on each node and increment along each accepted insertion path. If duplicates count as separate contacts, increment every insertion; if they are a set, first avoid repeated complete words. A prefix query walks its symbols then returns that node's count. State the policy before designing deletion.
7. Record the traversed parent/edge pairs. If the word does not exist, do nothing. Otherwise clear its ending and walk backward, removing only child nodes that have no children and no end flag. Deleting “car” must leave the t branch for “cart”. This takes O(L) expected time and O(L) stored path space.

For external work, compare your LCS result against a tiny exhaustive subsequence generator only on small strings. For Contacts, trace `add car`, `add cart`, `find car`, `find cat`: under distinct names the counts are two and zero. These are practice expectations, not claims of online judge submission.

## Sources and Further Reading

- Canonical scope: [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js).
- MIT OCW, [Lecture 21 string-DP notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/3484e876d81aba07911a1109f5b5e81e_MIT6_006F11_lec21.pdf): opened for string-subproblem and DP context, not as a source of this chapter's LCS code.
- CMU, [15-451/651 Lecture 26](https://www.cs.cmu.edu/~avrim/451f13/lectures/lect1121.pdf): opened and consulted for trie/shared-prefix context. The sparse-map implementation and exercises are independently written.
- LeetCode, [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/), and HackerRank, [Contacts](https://www.hackerrank.com/challenges/contacts/problem): official statements and displayed difficulty verified; no editorials consulted.

## Weekly Summary

Two dimensions name two independent pieces of state. Grid and string recurrences become reliable when each dependency has a clear meaning and update order. Tries reuse prefix paths while end markers preserve complete-word membership. Word Search demonstrates the limit of small-state reuse: path history can matter. [Week 16](week-16.md) combines these distinctions into independent problem-solving practice.

## Weekly Progress Checklist

### Theory

- [ ] Define grid and two-prefix states in complete sentences. <!-- checkpoint:w15-define-two-dimensional-state -->
- [ ] Explain why path history prevents naive Word Search memoisation. <!-- checkpoint:w15-distinguish-path-history -->

### JavaScript

- [ ] Implement obstacle paths and LCS with reconstruction. <!-- checkpoint:w15-implement-grid-and-lcs -->
- [ ] Implement trie insertion, exact search, and prefix lookup. <!-- checkpoint:w15-implement-trie -->

### Practice

- [ ] Trace old-above, new-left, and old-diagonal values. <!-- checkpoint:w15-trace-compressed-dependencies -->
- [ ] Complete LCS and prefix-count exercises. <!-- checkpoint:w15-complete-external-practice -->

### Reflection

- [ ] Record when compression or memoisation loses necessary information. <!-- checkpoint:w15-review-state-loss -->
