# Week 15 - Dynamic Programming II and Tries
<!-- lesson-id:w15-section-chapter-introduction -->

This week, we will learn to name smaller questions with two pieces of information and to share the beginnings of stored words. Two-dimensional dynamic programming uses states such as a grid coordinate or a pair of string-prefix lengths. A prefix is the beginning of a sequence, including possibly the whole sequence or nothing. A trie, also called a prefix tree, stores words along paths that share those beginnings.

We will first count right/down grid routes, including obstacles. Then we will derive longest common subsequence and recover one best answer. A subsequence keeps symbols in order while allowing gaps. After that, we will implement exact-word and prefix lookup in a trie, and use Word Search to examine when a grid question depends on the particular path taken.

By the end, you should be able to explain both axes of a table, preserve old dependencies when compressing rows, and distinguish a complete stored word from an existing prefix path. You should also be able to recognize when a small DP state omits necessary history.

Use the final Theory, JavaScript, Practice, and Reflection checklist to record evidence in your progress logs. Hand traces of compressed values and shared word paths are especially useful here.

## Learning Objectives
<!-- lesson-id:w15-section-learning-objectives -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

- Derive grid updates from the cells that can legally precede an arrival, including the effect of obstacles.
- Define longest common subsequence (LCS) state using two prefix lengths and recover one optimal sequence.
- Explain which compressed values mean old-above, new-left, and old-diagonal before overwriting anything.
- Insert trie words and distinguish exact lookup from prefix lookup.
- Identify path-dependent restrictions, retain the cells used by a candidate path, and undo their marks before trying alternatives.

## Prerequisite Knowledge
<!-- lesson-id:w15-section-prerequisite-knowledge -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Review state meanings, base cases, and dependency order in [Week 14](week-14.md), together with coordinate-generated graph neighbors in [Week 11](week-11.md). You will use nested arrays, `Map`, and recursive choose/explore/undo reasoning. That last pattern is backtracking: try a choice, explore what it permits, then restore the prior state for another choice.

The string examples use Unicode code points through iteration or `Array.from`. A code point is a Unicode symbol value, not necessarily one visual character. A combined emoji can contain several code points. Grouping them into human-perceived characters is grapheme segmentation, which these examples do not perform.

## Core Theory
<!-- lesson-id:w15-section-core-theory -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Grid paths form a directed dependency graph

Let paths(r,c) count routes from the top-left cell to `(r,c)` using only right and down moves. To arrive, the final move must come from above or left. Those cases do not overlap because one route has only one final move, so add their counts.

Seed the start with one route, the empty route requiring no moves. A predecessor outside the board contributes zero. A blocked cell contributes zero regardless of nearby counts, since no legal route can end there. Row-major evaluation—finish one row from left to right, then move to the next—works because above and left have already been computed.

A full R×C table makes this dependency pattern visible. Compressing it to one row changes storage, not the recurrence. Before column c is updated, dp[c] still holds the previous row's value from above. Meanwhile dp[c−1] has already become the current row's value from the left. We must therefore update left to right. At an obstacle, reset dp[c] to zero so an old route from above cannot leak through the blocked cell.

### Two prefixes define a subsequence question

A subsequence preserves order but permits gaps; a substring must be contiguous, with no gaps. For example, “ace” is a subsequence of “abcde”, but not a substring. Define dp(i,j) as the LCS length for the first i symbols of A and the first j symbols of B. If either prefix is empty, the length is zero.

When the final symbols match, an optimum can include that shared final symbol. Retain an optimum for the two shorter prefixes and extend it: dp(i−1,j−1)+1. When the symbols differ, they cannot both form the final matched pair. Skip one endpoint and compare max(dp(i−1,j),dp(i,j−1)). These alternatives cover every possible optimal answer. Induction over prefix lengths proves that the table stores the claimed lengths.

MIT's [string-DP notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/3484e876d81aba07911a1109f5b5e81e_MIT6_006F11_lec21.pdf) discuss string subproblems and dependency tables more generally. The LCS derivation here is specific to this chapter.

To recover an actual subsequence, follow retained choices backward. A match records a symbol and moves diagonally. A mismatch moves to a neighbor carrying the same optimum. If neighbors tie, either direction can produce a valid optimum. Test both optimal length and membership as a subsequence of each input; comparing only against one preferred output string would wrongly reject other correct answers.

### A trie shares paths, not just complete keys

A trie stores a word one symbol per edge. Each node keeps a mapping from outgoing symbols to children and a flag saying whether a complete word ends there. Inserting “cart” creates c→a→r→t. Its path contains “car”, but that does not mean “car” was inserted as a word.

Exact search requires both an existing path and a marked endpoint. Prefix search requires only the path. The root represents the empty prefix, so prefix lookup for an empty string succeeds even in a new trie. Exact empty-word lookup succeeds only after explicitly marking the root by inserting the empty word.

A trie is useful for repeated prefix queries or dictionary-guided exploration. If you only need exact membership, a `Set` is usually simpler. CMU's [string-algorithm lecture](https://www.cs.cmu.edu/~avrim/451f13/lectures/lect1121.pdf) discusses shared string paths. Our sparse `Map` representation stores only existing outgoing symbols instead of allocating a whole alphabet-sized child array at every node.

### Not every grid search is grid DP

Word Search asks whether a word can be traced without reusing a board cell within that candidate path. The same `(row,column,index)` can be reached after using different earlier cells. One history may leave a needed neighbor free while another has already used it. They therefore have different legal futures.

Memoising only that triple incorrectly treats those futures as equivalent. Backtracking keeps a set specific to the current path, marks before exploring continuations, and removes the mark before returning. A trie can reject dictionary prefixes early when searching for many words, but does not remove the no-reuse restriction. History still matters even when prefix lookup becomes faster.

## JavaScript Implementations
<!-- lesson-id:w15-section-javascript-implementations -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Grid paths, with and without obstacles

We will first expose every grid answer in a full table. Dimensions are nonnegative integers. Obstacle grids are rectangular arrays, with numeric zero for open and one for blocked. Counts must remain safe integers for exact `Number` answers; use consistent `BigInt` values for larger exact counts.

Imagine computing `(1,2)` in a three-column grid. Arrivals come from `(0,2)` or `(1,1)`. A route cannot have both final directions, so add the counts rather than taking their maximum. The source is different: it has no predecessor, but one empty route reaches it.

### Demonstration 1 — Make every right/down grid subproblem visible

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

In **Demonstration 1**, the three-by-three table starts with one at `(0,0)`. The first row and column stay one because there is only one legal approach along a boundary. Interior `(1,1)` becomes two, `(1,2)` becomes three, and the bottom-right becomes six. A one-row grid has one route to each cell; a zero dimension returns no table.

Read the loops as an evaluation schedule. At each cell, the row above is complete and the current row's left cells are complete. Neither dependency points forward. Allowing upward or leftward moves would remove this simple order and could introduce cycles; the same single-pass recurrence would no longer be justified. For nonempty dimensions, the function takes O(RC) time and returns O(RC) cells, with O(1) additional loop state.

Next we will retain only the values the next row can need. The unobstructed version can initialize every first-row value to one. The obstacle version must seed only the source and clear blocked columns, because an obstacle can invalidate boundary routes.

### Demonstration 2 — Compress grid rows and clear blocked arrivals

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

In **Demonstration 2**, `uniquePaths(3,3)` begins with `[1,1,1]`, becomes `[1,2,3]`, then `[1,3,6]`. Each update adds the old above value to the new left value. With a blocked center, the rows instead become `[1,1,1]`, `[1,0,1]`, and `[1,1,2]`, yielding two. A blocked start clears the seed itself, and empty input returns zero.

Do not prefill every obstacle-grid boundary with one. On the first row, a blocked cell cuts off all later cells because there is no incoming route from above. Only later rows can gain new routes from their own left or above. The obstacle reset makes that distinction emerge from the same update rules.

### Full LCS table and reconstruction

We will retain a full table so we can recover one sequence as well as its length. Allocate each row independently to avoid sharing one mutable array. Prefix lengths include zero, so the final symbols of prefixes i and j are at character indexes i−1 and j−1.

On a match, the diagonal contains both shorter prefixes; extending it consumes one symbol from each input. On a mismatch, moving up discards the first prefix's final symbol and moving left discards the second's. Take the maximum because these are competing answers, not disjoint route counts. Adding lengths can double-count overlapping matches and claim a subsequence longer than either prefix supports.

The extra zero row and column explicitly represent empty prefixes. Even a first-character match can then use the ordinary diagonal rule. Reconstruction preserves an achievable optimum while discarding unused endpoints or recording a genuine matched pair.

### Demonstration 3 — Build an LCS table and recover its matched symbols

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

In **Demonstration 3**, `abcde` and `ace` retain a, c, and e in order, producing length three. Reconstruction starts at the final prefixes, records matches backward, then reverses them. For `ab` and `ac`, the final b/c mismatch moves toward a neighbor of length one rather than erasing the earlier a. Empty input uses the zero border and returns an empty sequence.

### Compress LCS only when length is enough

LCS needs three dependencies: old above, new left, and old diagonal. Unlike grid addition, the diagonal would be lost if we overwrite without saving. Store above before writing; after the update, that saved value is the old diagonal needed by the next column.

### Demonstration 4 — Save LCS diagonal history during a row update

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

In **Demonstration 4**, `abcde` versus `ace` still returns three, but only lengths remain. The test `a` versus `aa` is especially useful: after the first match, new-left is one, yet the next old-diagonal is still zero. Using new-left as diagonal would falsely match the single a twice and return two. For simple sequence reconstruction, keep the full table from **Demonstration 3** instead of assuming compression preserved its decisions.

### Trie insertion, search, and prefix lookup

We will separate reaching a path endpoint from deciding whether that endpoint is a stored word. `findNode` performs shared traversal. `search` additionally checks the `end` flag; `startsWith` needs only a successful traversal. A node's position already identifies its prefix, so it does not need a copy of the whole prefix string.

Insertion creates a child only when that symbol edge is absent and then advances to it. Mark only after consuming the entire word. Marking along the way would silently insert “c”, “ca”, and “car” when we intended only “cart”. Conversely, an end-marked node may have children: both “car” and “cart” can be stored.

### Demonstration 5 — Distinguish a stored word from its shared prefix

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

In **Demonstration 5**, inserting `cart` creates the `car` path but leaves its endpoint unmarked. Exact `car` search is false while prefix search is true. Inserting `car` then marks the existing node without duplicating the path. Repeating the insertion changes no membership result. The empty prefix exists at the root before an empty word is inserted; inserting that word marks the root. Missing `cat` fails when its edge is absent.

Repeated insertion is idempotent for membership: doing it again has the same effect as doing it once. Counting contacts needs an extra counter and an explicit policy for duplicate names. Deleting “car” must clear its marker while retaining the branch to “cart”. Only a node with no children and no ending can safely be pruned, meaning removed as unnecessary.

### Word Search with path-local marking

We will explore candidate paths while preserving the board. Each cell contains a single code-point symbol. The empty word returns true, but a nonempty word on an empty board returns false. The path set is restored before a successful marked branch returns, just as it is after unsuccessful exploration.

### Demonstration 6 — Undo used-cell marks between candidate word paths

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

In **Demonstration 6**, A→B→D spells `ABD` using legal right/down connections on the sample board. A→B→A fails because A is already in the current path, and A→D fails because diagonal moves are excluded. The empty word succeeds even on an empty board. `used.delete(key)` restores a marked cell before returning, so another branch can use it. The final matching cell returns before being marked because it has no continuation to explore.

## Worked Examples
<!-- lesson-id:w15-section-worked-examples -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

For **Demonstration 2** in **JavaScript Implementations**, start the three-by-three obstacle grid with `[1,0,0]`. Row zero yields `[1,1,1]`; row one yields `[1,0,1]`; row two yields `[1,1,2]`. Clearing the center removes an old above-route, while later rows may receive fresh routes from their left.

For A=`ab` and B=`ac`, inspect the prefix table used by **Demonstration 3** in **JavaScript Implementations**:

| Prefix | empty | a | ac |
| --- | --- | --- | --- |
| empty | 0 | 0 | 0 |
| a | 0 | 1 | 1 |
| ab | 0 | 1 | 1 |

At `(2,2)`, b differs from c, so retain the maximum neighboring length. Reconstruction can move up to `(1,2)`, left to `(1,1)`, then record a and move diagonally. A mismatch does not erase a previously established match.

In **Demonstration 5** in **JavaScript Implementations**, “cart” creates four edges and marks only t. Searching “car” reaches r, but initially finds no ending. Inserting “car” only changes that flag; it does not allocate a second c→a→r chain.

For **Demonstration 6** in **JavaScript Implementations**, compare A→B→D, A→B→A, and A→D. They distinguish a valid path, forbidden reuse, and forbidden diagonal adjacency. A failed path tells you which rule prevented continuation, not simply that the letters were absent.

## Visual Explanations
<!-- lesson-id:w15-section-visual-explanations -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Read the path grids by adding above and left, treating X as zero. In the compressed LCS sketch, notice that three different moments of state meet at one update. In the trie, stars mark complete words independently of whether more edges continue.

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
<!-- lesson-id:w15-section-complexity-analysis -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

For nonempty dimensions, grid algorithms perform O(RC) arithmetic operations; row compression uses O(C) stored values. Rectangle validation adds O(R) work, which matters even when each row has zero columns.

For input lengths m,n, full LCS initialization and evaluation take O((m+1)(n+1)) time and space. Reconstruction adds O(m+n) backward traversal and O(L) output for L matched symbols. For positive lengths the conventional table bound is O(mn). The compressed version uses O(n) DP values, but `Array.from` also allocates O(m+n) symbol arrays. Include those copies before claiming a total auxiliary-space bound.

With expected constant-time `Map` access, trie insertion and lookup take expected O(L) time for L query code points. Lookup keeps O(1) traversal state; insertion can allocate O(L) nodes. Across S inserted symbols, at most O(S+1) nodes are needed. Enumerating completions also requires traversing and producing matches, so its cost is not merely prefix length. Objects and per-node maps can have significant practical overhead.

For word length L, a loose Word Search branching bound is O(RC·4^L), plus O(L+R) conversion and validation. The path set and recursive stack use O(min(L,RC)); the explicit letters array adds O(L). Very deep paths can overflow JavaScript's call stack. Grid path counts assume safe-integer arithmetic; exact large counts require accounting for the growing costs of larger numeric operands.

## Common Mistakes
<!-- lesson-id:w15-section-common-mistakes -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

- A subsequence permits gaps, so a mismatch does not reset LCS to zero. That would discard matches belonging to shorter prefixes.
- Allocate independent table rows. Repeating one array reference creates apparent rows that change together.
- Update a compressed grid row left to right when its recurrence needs the new left value and old above value.
- Save LCS's old diagonal before overwriting it. A new left value answers a different prefix question.
- Exact trie lookup must inspect the endpoint marker, not merely report that a path exists.
- Undo Word Search marks between sibling branches and starting cells. A cell used by one candidate is not permanently unavailable to all others.

The deliberately broken table allocation creates only one row object and repeats its reference. We want independent subproblem storage instead.

### Demonstration 1 — Broken allocation that aliases every DP row

```javascript-bug
const dp = Array(3).fill(Array(3).fill(0));
dp[1][1] = 7; // All apparent rows now have 7 in column 1.
```

In broken **Demonstration 1**, assigning seven to the cell at row one, column one also changes the apparent column-one value in rows zero and two. All three slots refer to the same inner array. Use a factory to allocate each row independently, then verify that writing one row leaves the others unchanged. The recurrence cannot repair shared storage that misrepresents its states.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w15-section-interview-and-leetcode-pattern-recognition -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Two strings often suggest a pair of prefix lengths. Right/down grid moves suggest dependencies without cycles and therefore a natural table order. Repeated dictionary-prefix queries suggest a trie. But a board plus “do not reuse cells in the current path” suggests backtracking rather than automatically implying DP.

Ask what makes two future subproblems equivalent. Unique Paths counts arrivals without needing route history. LCS maximizes matched length over two prefixes. Word Search asks whether a path exists under history-dependent restrictions. Contacts asks how many names share a prefix, requiring counts beyond Boolean membership. Input shape is less informative than the information needed for the answer.

## Practice Exercises
<!-- lesson-id:w15-section-practice-exercises -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Conceptual

1. Explain why `(row,column,index)` is generally an insufficient memo key for no-reuse Word Search. Describe what two histories with that key may disagree about.
2. Explain how exact lookup of “car” can be false while prefix lookup is true, including which node flag settles the difference.

### Tracing

3. Trace obstacle-row updates for `[[0,1,0],[0,0,0]]`. Then block the source and recompute, explaining how the seed disappears.
4. Fill the LCS table for `abc` and `ac`, including empty-prefix borders, and reconstruct one sequence.

### Debugging

5. Repair broken **Demonstration 1** in **Common Mistakes**. Separately, use `a` and `aa` to explain why new-left cannot replace old-diagonal in compressed LCS.

### Implementation

6. Add prefix counts to a trie. Specify whether duplicate insertion increases them, and keep exact membership consistent with your policy.
7. Delete a single stored word while preserving longer words sharing its prefix. Explain when a node can be removed and when only its flag should change.

### LeetCode + HackerRank

- **[Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/)** — LeetCode, Medium. Practice two-prefix state, skip/match transitions, and preserved order with gaps. Derive the table rather than treating all two-string questions as the same recurrence.
- **[Contacts](https://www.hackerrank.com/challenges/contacts/problem)** — HackerRank, Medium. Extend trie prefix existence into prefix counts, updating an aggregate along insertion paths. State the duplicate policy before designing counter updates.

## Hints and Worked Solutions
<!-- lesson-id:w15-section-hints-and-worked-solutions -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

1. Two paths can reach the same cell and letter index after using different cells. A needed future neighbor may be free on one path and forbidden on the other. A sound memo key must include that used-set information, or you can retain backtracking. Omitting history requires a separate equivalence proof.
2. Inserting “cart” creates the path ending at r but marks only t. Exact “car” lookup must inspect r's flag and initially fails. The empty prefix similarly exists at the root before the empty word is explicitly inserted.
3. Row zero becomes `[1,0,0]` because the obstacle interrupts its only incoming route. Row one becomes `[1,1,1]`, giving one route to the destination. Blocking the start clears the only seed, so every state remains zero.
4. With the empty border, the rows are `[0,0,0]`, `[0,1,1]`, `[0,1,1]`, `[0,1,2]`. Walking backward records c, then a. Reversing those recorded symbols produces `ac`.
5. Allocate rows through a factory. In compressed LCS, save `above=dp[j]` before writing and then set `diagonal=above`. For `a` against `aa`, using new-left instead would extend a length-one match into length two despite having only one source symbol.
6. Store a count on each node and increment it along every accepted insertion path. If duplicate names represent separate contacts, increment on every insertion. If names form a set, avoid repeated complete-word insertions first. Prefix lookup walks to its node and returns the count. Decide the same policy before adding deletion.
7. Record parent/edge pairs while locating the word. If exact membership is absent, do nothing. Otherwise clear the ending and walk backward, removing only nodes with neither children nor an ending. Deleting “car” must keep the t branch for “cart”. Expected time is O(L), with O(L) space for the saved path.

For small strings, compare LCS results with a tiny exhaustive subsequence generator; enumeration is a testing tool, not the scalable solution. For Contacts, trace `add car`, `add cart`, `find car`, `find cat`: distinct names give counts two and zero. These are practice expectations, not claims of online judge submission.

## Sources and Further Reading
<!-- lesson-id:w15-section-sources-and-further-reading -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

- The [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js) supply the chapter's course scope.
- MIT OCW's [Lecture 21 string-DP notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/3484e876d81aba07911a1109f5b5e81e_MIT6_006F11_lec21.pdf) were opened during earlier preparation for string-subproblem and DP context, rather than as a source for this LCS code.
- CMU's [15-451/651 Lecture 26](https://www.cs.cmu.edu/~avrim/451f13/lectures/lect1121.pdf) was previously consulted for shared-prefix trie context. The sparse-map implementation and exercises are independently written.
- The official [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/) and [Contacts](https://www.hackerrank.com/challenges/contacts/problem) statements and displayed difficulties were verified during earlier preparation, without editorials. This rewrite does not claim a new external-link check.

## Weekly Summary
<!-- lesson-id:w15-section-weekly-summary -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Two dimensions identify two pieces of state, such as coordinates or prefix lengths. Make each dependency meaningful before choosing its storage or update order. Tries share paths for common prefixes, while end markers retain exact membership. Word Search shows why reuse has limits: different path histories can leave different legal continuations. In [Week 16](week-16.md), you will combine these distinctions while solving unfamiliar problems independently.

## Weekly Progress Checklist

### Theory

- [ ] Define grid and two-prefix state meanings in full sentences. <!-- checkpoint:w15-define-two-dimensional-state -->
- [ ] Explain which path history naive Word Search memoisation would lose. <!-- checkpoint:w15-distinguish-path-history -->

### JavaScript

- [ ] Build obstacle-path counting and recover an LCS from a full table. <!-- checkpoint:w15-implement-grid-and-lcs -->
- [ ] Insert trie words and distinguish exact search from prefix search. <!-- checkpoint:w15-implement-trie -->

### Practice

- [ ] Trace old-above, new-left, and old-diagonal values before each compressed write. <!-- checkpoint:w15-trace-compressed-dependencies -->
- [ ] Complete the LCS and prefix-count practice tasks. <!-- checkpoint:w15-complete-external-practice -->

### Reflection

- [ ] Record a case where compression or memoisation discards information the future still needs. <!-- checkpoint:w15-review-state-loss -->
**On the video:** pause here and say the goal out loud: reflection. Then predict the next step before you read the explanation.
