# Week 14 - Dynamic Programming I
<!-- lesson-id:w14-section-chapter-introduction -->

This week, we will learn to avoid answering the same smaller question over and over. That reuse is the idea behind dynamic programming, usually shortened to DP. Different decision sequences can reach an identical remaining problem; once we recognize that identity, we can compute its answer once and reuse it.

We will count stair-climbing sequences, then change the question to minimum stair cost, maximum value from nonadjacent houses, and minimum coins for an exact amount. You will define a state—the information identifying one smaller question—and a recurrence, the rule connecting its answer to smaller answers.

By the end, you should be able to derive a recursive model, remove repeated work, trace a table, and explain when keeping only a few recent answers is safe. When a number alone is insufficient, you will also recover one set of choices producing it.

The final Theory, JavaScript, Practice, and Reflection checklist is for evidence in your progress logs. Include state definitions and hand traces; getting a familiar example right does not show that you understand what an index means.

## Learning Objectives
<!-- lesson-id:w14-section-learning-objectives -->

- Distinguish the number of recursive calls from the number of genuinely different smaller questions.
- State what each entry means, how it depends on smaller entries, its starting cases, its evaluation order, and the returned answer.
- Implement memoisation, which caches recursive answers, and tabulation, which fills them in a planned order.
- Compress storage to recent values only when no future step needs what you discard.
- Represent unreachable states separately from valid zero-cost states and count both states and work per state.

## Prerequisite Knowledge
<!-- lesson-id:w14-section-prerequisite-knowledge -->

You will use recursion, arrays, `Map`, and invariant reasoning: explaining a statement that remains true during processing. [Week 13](week-13.md) required a proof before permanently committing to a greedy choice. DP instead compares competing choices and retains their relevant answers when that discard is unsafe.

A table does not create a solution by itself. You first need to say exactly which question each entry answers. [Week 15](week-15.md) extends this habit to states identified by two coordinates rather than one.

## Core Theory
<!-- lesson-id:w14-section-core-theory -->

### Turn a recursion tree into a dependency graph

Suppose you can climb one or two stairs per move. Reaching height five means the final move came from height four or three. But answering height four also asks about height three. Drawing every call produces a recursion tree with repeated copies of the same question.

Memoisation stores the answer associated with each distinct question, so later calls retrieve it. Tabulation computes the questions in an order where dependencies are already ready. Both avoid repeating the underlying state work; they differ in how evaluation is scheduled. MIT's [DP lecture 19 notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/b6d4083131dd16e7d97f56d04b6e858f_MIT6_006F11_lec19.pdf) explain this relationship between recursive dependencies and bottom-up evaluation.

Two formal properties help us reason about this reuse. **Overlapping subproblems** means separate branches ask the same state question. **Optimal substructure** means an optimal answer can be assembled from appropriate optimal smaller answers. Counting problems similarly split answers into disjoint cases and combine their counts.

Neither property allows an incomplete state. If future choices depend on remaining capacity, two situations with different capacity are different questions, even when their indexes agree. The state must retain everything affecting the legal future.

Before coding, complete five sentences: “My state means…”, “The final choice was…”, “The smallest cases are…”, “Dependencies are ready because…”, and “I return…”. These force you to connect a loop to a mathematical model rather than hope the table computes the desired quantity.

### Counting, minimizing, and maximizing are different aggregations

Let `ways(i)` count ordered jump sequences reaching exactly i stairs. A final one-step jump leaves i−1; a final two-step jump leaves i−2. Every valid sequence belongs to exactly one category, so add their counts. The base `ways(0)=1` counts the one empty sequence. Without it, there would be no sequence for the first real move to extend. Negative heights contribute zero.

For minimum stair cost, let `dp[i]` be the least cost already paid when arriving at position i. The top is at `cost.length`. You may start at position 0 or 1 for free, and you pay when leaving a stair. Therefore `dp[0]=dp[1]=0`, and `dp[i]=min(dp[i−1]+cost[i−1], dp[i−2]+cost[i−2])`. Read each candidate as “reach a predecessor, pay to leave it, then jump here.” Changing when payment occurs changes the bases or transition.

For House Robber, define `best[i]` as the maximum value from the first i houses without adjacent selections. Skip the last house and retain `best[i−1]`, or take it and add its value to `best[i−2]`. Take the maximum because those are competing choices. A largest-visible-house greedy rule fails on `[2,3,2]`: choosing three prevents both outer twos, whose total is four.

### Exact amounts and unreachable states

For unlimited Coin Change, `dp[a]` is the minimum number of coins forming exactly amount a. Start with `dp[0]=0` and all positive amounts at `Infinity`. Zero coins form zero amount; infinity says no valid formation has been found.

Try each possible final coin c≤a and consider `dp[a−c]+1`. An unreachable predecessor stays infinity when one is added, so it cannot invent a solution. Positive integer denominations point to strictly smaller amounts, making ascending evaluation valid.

With `[1,3,4]` and target six, largest-first greedy takes four plus two ones: three coins. Two threes are better. DP compares every possible final denomination rather than assuming the largest is safe.

Previous coin order does not belong in this state because only amount matters for minimum count with unlimited reuse. If each coin may be used only once, available items matter too. Reusing the unlimited recurrence unchanged would allow choices the contract forbids.

## JavaScript Implementations
<!-- lesson-id:w14-section-javascript-implementations -->

### Memoisation and tabulation for the same state

We will evaluate the same ordered-sequence recurrence in two ways. Supply a nonnegative integer small enough for exact `Number` counts; 1+2 and 2+1 are different sequences. The memo is created inside each call so answers cannot accidentally leak between problem instances.

### Demonstration 1 — Cache and tabulate ordered stair counts

```javascript
function waysMemo(n) {
  const memo = new Map([[0, 1], [1, 1]]);
  function solve(i) {
    if (memo.has(i)) {
      return memo.get(i);
    }
    const answer = solve(i - 1) + solve(i - 2);
    memo.set(i, answer);
    return answer;
  }
  return solve(n);
}
function waysTable(n) {
  const dp = Array(n + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= n; i++) {
    dp[i] = dp[i - 1] + (i >= 2 ? dp[i - 2] : 0);
  }
  return dp[n];
}
console.log(waysMemo(5), waysTable(5));
console.log(waysMemo(0), waysTable(0));
console.log(waysTable(4));
```
```output
8 8
1 1
5
```

In **Demonstration 1**, height five depends on four and three. When recursion asks about three again, `memo.has` retrieves its cached answer. The table instead fills heights in ascending order. Both produce eight for five and one for zero. For height four, the five sequences are 1111, 112, 121, 211, and 22, giving a concrete check on what is counted.

Use `has` for general memo entries because zero and false can be valid answers. Memoisation avoids duplicate state work but can still overflow the recursive call stack for large n. Iteration avoids that call-depth problem. Exact large counts require consistent `BigInt` values throughout; changing just one base mixes incompatible numeric types.

### Minimum stair cost with rolling state

We only need the previous two arrival costs to compute the next one. This is rolling state: keep a moving window of needed answers instead of the whole table. Assume finite nonnegative costs. Under the free-start convention, empty and singleton arrays return zero; with one stair, position one is already the top.

### Demonstration 2 — Preserve two old arrival costs before shifting

```javascript
function minCostStairs(cost) {
  let twoBack = 0;
  let oneBack = 0;
  for (let i = 2; i <= cost.length; i++) {
    const current = Math.min(oneBack + cost[i - 1], twoBack + cost[i - 2]);
    twoBack = oneBack;
    oneBack = current;
  }
  return oneBack;
}
console.log(minCostStairs([10, 15, 20]));
console.log(minCostStairs([1, 100, 1, 1, 1]));
console.log(minCostStairs([]), minCostStairs([9]));
```
```output
15
3
0 0
```

In **Demonstration 2**, `[10,15,20]` gives cost ten at position two. At top position three, departing stair two would cost thirty overall, while starting at stair one and paying fifteen reaches the top directly. The minimum is fifteen. The second input reaches the top for three, and the boundary tests confirm the free-start convention.

Before iteration i, `twoBack` means dp[i−2] and `oneBack` means dp[i−1]. Compute `current` before changing either. Then shift the old recent value into the older slot and put the new answer into the recent slot. You can rehearse with three cards: two old answers and one newly calculated answer. Sliding cards only after calculating makes their changing meanings visible.

A scalar minimum needs no full table. Recovering a route is a different output requirement: retain decisions or recompute them rather than claiming discarded history remains available.

### House Robber

We will compare skipping each house with taking it after a compatible prefix. Choosing nothing is permitted, including when every value is negative. Values must be finite and sums representable. The houses form a line; in a circle, the first and last also conflict.

### Demonstration 3 — Compare taking and skipping each house

```javascript
function rob(values) {
  let twoBack = 0;
  let oneBack = 0;
  for (const value of values) {
    const current = Math.max(oneBack, twoBack + value);
    twoBack = oneBack;
    oneBack = current;
  }
  return oneBack;
}
console.log(rob([2, 7, 9, 3, 1]));
console.log(rob([2, 3, 2]));
console.log(rob([-4, -2]), rob([]));
```
```output
12
4
0 0
```

In **Demonstration 3**, `[2,7,9,3,1]` produces prefix best values two, seven, eleven, eleven, twelve. At value nine, taking it combines with the older prefix value two, not the adjacent seven. The twos in `[2,3,2]` give four. All-negative and empty inputs give zero because choosing nothing remains legal.

The last house is either included or excluded. Inclusion rules out its neighbor and leaves a smaller independent prefix; exclusion leaves the entire preceding prefix. These cases exhaust legal selections, and induction on prefix length proves the maximum recurrence. For a circle with at least two houses, compare the linear problems excluding the first and excluding the last. Handle a singleton separately so it is not excluded from both candidates.

### Minimum coins with a witness

We now want both a minimum count and choices achieving it. Such supporting choices are often called a witness. The returned `chosen` list is one optimal multiset, meaning repeated denominations are retained but their order has no payment significance. Record the last coin responsible for each strict improvement so reconstruction can work backward.

### Demonstration 4 — Reconstruct an optimal exact coin amount

```javascript
function minCoins(coins, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0 || coins.some(c => !Number.isSafeInteger(c) || c <= 0)) {
    throw new Error('Use positive integer coins and a nonnegative amount');
  }
  const dp = Array(amount + 1).fill(Infinity);
  const last = Array(amount + 1).fill(null);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && dp[a - coin] + 1 < dp[a]) {
        dp[a] = dp[a - coin] + 1;
        last[a] = coin;
      }
    }
  }
  if (dp[amount] === Infinity) {
    return {
      count: -1,
      chosen: []
    };
  }
  const chosen = [];
  for (let a = amount; a > 0; a -= last[a]) {
    chosen.push(last[a]);
  }
  return {
    count: dp[amount],
    chosen
  };
}
console.log(JSON.stringify(minCoins([1, 3, 4], 6)));
console.log(JSON.stringify(minCoins([2], 3)));
console.log(JSON.stringify(minCoins([], 0)));
```
```output
{"count":2,"chosen":[3,3]}
{"count":-1,"chosen":[]}
{"count":0,"chosen":[]}
```

In **Demonstration 4**, amount six with `[1,3,4]` records a final three. Subtracting it reaches amount three, whose recorded three reaches zero. The result is two coins. With only denomination two, amount three remains unreachable and returns count −1 with an empty witness. Empty denominations can still form amount zero using no coins.

The validation establishes positive safe-integer denominations and a nonnegative safe-integer target. It does not guarantee practical allocation: an enormous valid amount can still exceed memory limits. Every reconstructed step subtracts a positive coin, so it terminates. Strict improvement keeps the first encountered tied choice; another equally optimal witness is also correct.

## Worked Examples
<!-- lesson-id:w14-section-worked-examples -->

For **Demonstration 1** in **JavaScript Implementations**, heights zero through five have counts `[1,1,2,3,5,8]`. At four, enumerate 1111, 112, 121, 211, and 22. This list distinguishes ordered jump sequences from unordered collections of jump sizes.

For **Demonstration 2** in **JavaScript Implementations**, cost `[10,15,20]` gives dp[2] as min(15,10)=10. Then dp[3] is min(10+20,0+15)=15. The winning route starts at index one and jumps to the top. Paying at indices zero and two would total thirty, so it cannot explain the returned fifteen.

Trace the skip/take comparison in **Demonstration 3** in **JavaScript Implementations**:

| Prefix length for [2,7,9,3,1] | Skip | Take | Best |
| --- | --- | --- | --- |
| 1 | 0 | 2 | 2 |
| 2 | 2 | 7 | 7 |
| 3 | 7 | 2+9 | 11 |
| 4 | 11 | 7+3 | 11 |
| 5 | 11 | 11+1 | 12 |

For **Demonstration 4** in **JavaScript Implementations**, the amount table for `[1,3,4]` is `[0,1,2,1,1,2,2]`. At six, final coin one proposes three coins, final coin three proposes two, and final coin four proposes three. The recorded three leads back to amount three and then zero. Check both that the witness sums to six and that its length matches the stored count.

## Visual Explanations
<!-- lesson-id:w14-section-visual-explanations -->

The repeated `ways(3)` call shows why caching saves work. The rolling-state picture shows why computing a new answer must precede overwriting old dependencies. Finally, follow the coin reconstruction arrows to see why positive denominations guarantee progress toward zero.

```text
ways(5)
  +-- ways(4)
  |     +-- ways(3) -- ...
  |     +-- ways(2)
  +-- ways(3)       repeated question, reusable answer

Rolling prefix state before step i:
twoBack = best[i-2]     oneBack = best[i-1]
                 \      /
                   current
Only after computing current: shift the two stored values.

Coin reconstruction: amount 6 --coin 3--> amount 3 --coin 3--> 0
```

## Complexity Analysis
<!-- lesson-id:w14-section-complexity-analysis -->

For DP, count distinct states and the candidate transitions examined at each state. A transition is one way to derive a state's answer from another state.

| Algorithm | Distinct states × transition work | Time | Auxiliary space |
| --- | --- | --- | --- |
| Memoised stairs | O(n) × O(1) | O(n) | O(n), memo and stack |
| Tabulated stairs | O(n) × O(1) | O(n) | O(n) |
| Rolling stair cost | O(n) × O(1) | O(n) | O(1) |
| Rolling House Robber | O(n) × O(1) | O(n) | O(1) |
| Minimum coins | O(A) × O(k) | O(k+A(k+1)) including validation/allocation | O(A+1), plus output |

For nonempty denomination lists and positive A, the coin bound is conventionally written O(Ak). A is the numeric target, not its number of written digits. This is pseudo-polynomial time: polynomial in the amount's value, which can be exponentially larger than its digit count.

If reconstruction returns q coins, it adds O(q) time and output space. Positive integer denominations give q≤A. The bounds assume arithmetic has unit cost and values are represented exactly. Large `BigInt` operands require more work as their bit lengths grow.

Naive stair recursion is exponential because many calls repeat the same heights. Merely noticing two recursive calls is not a sufficient complexity argument for an arbitrary algorithm; inspect how their sizes and repeated work evolve.

## Common Mistakes
<!-- lesson-id:w14-section-common-mistakes -->

- Define whether an index names a position, an item, or a prefix length before writing its update. Similar-looking arrays can encode different questions.
- Keep ways[0] equal to one: it represents the empty sequence that real jumps extend.
- Use an unreachable marker for unknown minimum costs. Initializing them to zero invents free solutions.
- Test memo membership explicitly; a cached zero is still an answer.
- Calculate rolling results before shifting old values. Assignment order can silently change which prefix a variable represents.
- Keep reconstruction information if you need choices. A scalar result alone does not preserve the discarded path.

The deliberately broken update overwrites the older dependency with the new result. Trace two adjacent houses to see the constraint it loses.

### Demonstration 1 — Broken rolling state that combines adjacent houses

```javascript-bug
oneBack = Math.max(oneBack, twoBack + value);
twoBack = oneBack; // This saves the new value instead of the old prefix value.
```

In broken **Demonstration 1**, the first value two sets both variables to two. The next value three can then combine with that two and produce five, illegally taking adjacent houses. `twoBack` should represent the prefix before the previous house. Save `current` separately, shift the old `oneBack`, then assign the new answer.

In 0/1 capacity DP, each item can be used at most once. A descending capacity loop reads dependencies from before that item was considered and prevents reuse. An ascending loop can intentionally permit unlimited reuse by reading the updated layer. Loop direction therefore expresses the model; it is not just formatting preference.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w14-section-interview-and-leetcode-pattern-recognition -->

“Count ways,” “minimum cost,” and “maximum value” suggest looking for a smaller-state decomposition, but those words alone do not prove DP is needed. Draw a direct decision tree and ask which questions recur. Decisions over an input prefix often lead to a one-dimensional state.

Ask what the future needs to know: remaining amount, next index, previous selection, or capacity. If two histories with the same proposed key have different legal futures, they cannot safely share one cached answer. Add the missing information or justify why it is irrelevant.

Climbing Stairs counts ordered routes; Min Cost Climbing Stairs minimizes payment; House Robber maximizes a constrained selection; Coin Change minimizes coin count with unlimited reuse. Their bases and combination rules differ because the questions differ. Derive those choices before borrowing a familiar loop.

## Practice Exercises
<!-- lesson-id:w14-section-practice-exercises -->

### Conceptual

1. Explain why ways(0)=1 but minimumCoins(0)=0. Identify what each base counts or measures rather than treating empty input as a universal zero.
2. Explain why optimal substructure does not establish largest-first greedy coin selection. Separate combining smaller optima from choosing which smaller optimum matters.

### Tracing

3. Write stair-cost values for `[1,100,1,1,1]` from position zero to the top. Identify one optimal sequence of departures and add its payments.

### Debugging

4. Trace broken **Demonstration 1** in **Common Mistakes** on houses `[2,3]`. Explain the meaning `twoBack` should preserve and the answer the broken version invents.

### Implementation

5. Build a full House Robber table and reconstruct selected indexes. Permit an empty selection and state one consistent tie rule.
6. Turn memoised stairs into a rolling `BigInt` counter. Explain why a linear number of additions does not imply constant-cost arithmetic.

### LeetCode + HackerRank

- **[Coin Change](https://leetcode.com/problems/coin-change/)** — LeetCode, Medium. Practice exact-amount state, unlimited reuse, and unreachable markers. Derive the final-coin recurrence and show why a largest-first choice can fail.
- **[Recursion: Fibonacci Numbers](https://www.hackerrank.com/challenges/ctci-fibonacci-numbers/problem)** — HackerRank, Easy. Compare repeated recursive dependencies with caching. Follow the problem's Fibonacci bases rather than copying staircase bases that answer a different counting question.

## Hints and Worked Solutions
<!-- lesson-id:w14-section-hints-and-worked-solutions -->

1. There is one empty sequence of jumps, but forming amount zero requires zero coins. The first base counts sequences; the second measures a minimum number of items. Their input size is the same, but their questions are different.
2. Optimal substructure says that after considering a final coin, an optimal smaller exact-amount answer can supply its prefix. It does not establish which final coin belongs to an optimum. With `[1,3,4]` and six, two threes beat four and two ones.
3. The arrival-cost table is `[0,0,1,2,2,3]`. One optimal route departs stairs 0,2,4, paying 1+1+1, then reaches top position five. Ties may give another optimal route; the scalar costs do not demand a unique one.
4. Processing two with the broken assignments makes both variables two. Processing three then returns five. The correct result is three because the houses are adjacent. Before the second house, `twoBack` should still be the empty-prefix value zero.
5. Build `best[i]` from skip and take. Starting at i=n, if `best[i]===best[i-1]`, skip by decreasing i; otherwise record i−1 and move back two. At i=1, use zero for the empty prefix. Reverse recorded indexes. This tie rule prefers skipping. The method takes O(n) time, O(n) table space, and O(n) worst-case output.
6. Start previous counts at `1n`, handle n=0 explicitly, then add before shifting at each new height. Use `.toString()` for plain decimal output. There are O(n) additions, but their bit costs grow with the count size.

For external practice, include zero inputs, unreachable positive amounts, and repeated subproblems. Fibonacci uses F(0)=0 and F(1)=1. Memoised recursion preserves the requested recursive structure while avoiding repeated state work. These local checks explain expected behavior; they do not claim an online judge submission was made.

## Sources and Further Reading
<!-- lesson-id:w14-section-sources-and-further-reading -->

- The [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js) provide the chapter's course scope.
- MIT OCW's [Lecture 19 DP notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/b6d4083131dd16e7d97f56d04b6e858f_MIT6_006F11_lec19.pdf) were consulted during earlier preparation for memoisation, reuse, and evaluation order. Stair, robbery, and coin examples were developed independently here.
- The official [Coin Change](https://leetcode.com/problems/coin-change/) and [Recursion: Fibonacci Numbers](https://www.hackerrank.com/challenges/ctci-fibonacci-numbers/problem) statements were previously opened to check destinations and contracts, without editorial solutions. This rewrite makes no claim of renewed external verification.

## Weekly Summary
<!-- lesson-id:w14-section-weekly-summary -->

Begin DP with a state that retains everything later decisions need. Derive exhaustive choices, give the smallest cases their actual meanings, and compute only after dependencies are ready. Caches and tables avoid repeated questions. Rolling variables save storage only when discarded answers will never be needed again, and reconstruction can require extra history. In [Week 15](week-15.md), we will use the same discipline for grids, pairs of prefixes, and search where the current path affects the future.

## Weekly Progress Checklist

### Theory

- [ ] State the DP meaning, recurrence, bases, order, and returned answer before coding. <!-- checkpoint:w14-define-dp-model -->
- [ ] Explain empty and unreachable states by their meanings rather than guessed constants. <!-- checkpoint:w14-explain-base-cases -->

### JavaScript

- [ ] Implement memoisation and tabulation from the same recurrence. <!-- checkpoint:w14-implement-two-evaluations -->
- [ ] Preserve old rolling dependencies and recover a coin solution from recorded choices. <!-- checkpoint:w14-preserve-dependencies -->

### Practice

- [ ] Trace arrival costs, robbery prefixes, and unreachable coin amounts by hand. <!-- checkpoint:w14-trace-dp-states -->
- [ ] Complete one LeetCode and one HackerRank exercise about recursive dependencies. <!-- checkpoint:w14-complete-external-practice -->

### Reflection

- [ ] Record a state-definition mistake and the smallest input that exposes it. <!-- checkpoint:w14-review-state-design -->
