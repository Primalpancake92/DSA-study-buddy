# Week 14 - Dynamic Programming I

This week, you will be learning how dynamic programming reuses answers to overlapping subproblems. You will define state, derive recurrences, choose base cases, and compare memoisation with tabulation. These ideas matter when many decision sequences lead back to the same smaller question.

We will start with counting stair-climbing sequences, then change the objective to minimum stair cost, maximum nonadjacent value, and minimum coins. Each problem will make you explain what a table entry means before writing its update.

By the end, you should be able to build a correct recursive model, remove repeated work, trace a table, justify memory compression, and recover one chosen solution when the output requires it.

There will be a checklist at the end of this lesson covering Theory, JavaScript, Practice, and Reflection. Use it to record evidence in your progress logs.

## Learning Objectives

- Distinguish repeated recursive calls from distinct subproblems.
- Define state, recurrence, base cases, evaluation order, and final answer.
- Implement memoisation, tabulation, and rolling-state optimization.
- Represent unreachable states without confusing them with zero-cost states.
- Explain why DP cost depends on both state count and transition work.

## Prerequisite Knowledge

You need recursion, arrays, `Map`, and the idea of proving an invariant. [Week 13](week-13.md) showed that a greedy choice needs a safety argument. DP retains competing choices when such an argument is unavailable. A table is not itself a solution: the meaning of its entries is the solution's foundation. [Week 15](week-15.md) extends the same reasoning to two dimensions.

## Core Theory

### Turn a recursion tree into a dependency graph

Suppose you can climb one or two stairs per move. To reach height five, the final move came from height four or three. The computation for four also asks about three. A naive recursion repeats that subproblem and many others. Memoisation associates each distinct question with its answer; tabulation computes those questions in a dependency-respecting order. MIT's [DP lecture 19 notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/b6d4083131dd16e7d97f56d04b6e858f_MIT6_006F11_lec19.pdf) discuss this relationship between recursion, reuse, and bottom-up evaluation.

Two properties are useful. **Overlapping subproblems** means different branches request the same state. **Optimal substructure** means an optimal solution can be assembled from appropriate optimal smaller solutions. Counting problems use a similar decomposition into disjoint cases. Neither property gives permission to omit information: if the future depends on remaining capacity, that capacity belongs in the state.

Write five sentences before coding: “My state means…”, “The final choice was…”, “The smallest cases are…”, “Dependencies are ready because…”, and “I return…”. They prevent an impressive-looking loop from computing the wrong quantity.

### Counting, minimizing, and maximizing are different aggregations

Let `ways(i)` count ordered jump sequences reaching exactly i stairs. A final one-step jump leaves i−1; a final two-step jump leaves i−2. The two categories are disjoint and exhaustive, so add them. `ways(0)=1` counts one empty sequence. Without that identity, the first real move could never create a sequence. Negative heights contribute zero.

For minimum stair cost, define `dp[i]` as the least cost already paid when arriving at position i, with the top at `cost.length`. You may start at position 0 or 1 for free and pay when leaving a stair. Therefore `dp[0]=dp[1]=0`, and `dp[i]=min(dp[i−1]+cost[i−1], dp[i−2]+cost[i−2])`. The recurrence describes where payment happens; changing that convention changes the bases or transition.

For House Robber, let `best[i]` be the maximum value from the first i houses, with no adjacent selections. If the last house is skipped, use `best[i−1]`; if taken, combine its value with `best[i−2]`. Taking the maximum covers both cases. Greedily taking the largest visible house fails on `[2,3,2]`, where the outer two sum to four.

### Exact amounts and unreachable states

For unlimited Coin Change, `dp[a]` is the minimum number of coins forming exactly amount a. Initialize `dp[0]=0` and positive amounts to `Infinity`. For every possible final coin c≤a, consider `dp[a−c]+1`. An unreachable predecessor remains infinity after adding one. Positive integer denominations ensure dependencies go to smaller amounts, making ascending tabulation valid.

With `[1,3,4]` and target six, largest-first greedy gives three coins, while 3+3 needs two. DP compares all final denominations. The state does not include the order of previous coins because only the remaining amount matters for minimum count with unlimited reuse. If each coin can be used once, available items become part of the model; reusing this recurrence unchanged would violate the contract.

## JavaScript Implementations

### Memoisation and tabulation for the same state

The input is a nonnegative integer small enough for exact `Number` counts. Both versions count ordered jump sequences, so 1+2 and 2+1 are different. The memo belongs to one call and cannot accidentally reuse results from another problem instance.

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

Use `has`, not truthiness, for general memo entries: zero and false can be valid cached answers. Memoisation evaluates each height once, but its recursive stack can still overflow for large n. Iteration removes that limitation. For exact large counts use `BigInt` consistently; changing only one base value mixes incompatible numeric types.

### Minimum stair cost with rolling state

Assume finite nonnegative costs. Empty and singleton arrays return zero under the free-start convention; the singleton's position one is already the top.

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

Before the loop body at i, `twoBack` holds dp[i−2] and `oneBack` holds dp[i−1]. Compute the new value before shifting either one. The full table is unnecessary for a scalar answer, but reconstructing a route requires retaining decisions or recomputing them.

To practice the update without code, put the two old values on separate cards. Calculate the new answer on a third card. Only then slide the old recent card into the older position and put the new card in the recent position. Each assignment has a different job: calculating an answer and advancing the meaning of the stored positions. Keeping those jobs separate makes it much harder to combine a value with itself accidentally.

### House Robber

This version allows choosing nothing, including when all values are negative. Values must be finite, and sums must remain representable. The linear arrangement matters: circular houses introduce an additional conflict between the first and last houses.

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

An optimal selection either contains the last house or does not. In the first case its neighbor is excluded, leaving an independent smaller prefix. In the second case the whole preceding prefix remains available. Induction on prefix length proves the recurrence. For a circle with at least two houses, compare the linear problems excluding the first and excluding the last; handle a singleton separately.

### Minimum coins with a witness

The returned `chosen` list is one optimal multiset written in reconstruction order. Its order has no payment meaning. Recording the last chosen coin makes the answer inspectable rather than merely returning a number.

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

The input validation establishes mathematical validity, not practical allocation feasibility: an enormous amount can still exceed memory limits. Every recorded predecessor subtracts a positive coin, so reconstruction terminates. Strict improvement retains the first tied choice encountered; another equally optimal coin list is also valid.

## Worked Examples

For stairs, heights 0 through 5 have counts `[1,1,2,3,5,8]`. The five sequences reaching four are 1111, 112, 121, 211, and 22. That list makes the ordered-sequence contract concrete.

For cost `[10,15,20]`, dp[2] is min(15,10)=10. At the top, dp[3] is min(10+20,0+15)=15. The winning route starts at index one and jumps to the top. Paying indices zero and two would cost thirty, not fifteen.

| Prefix length for [2,7,9,3,1] | Skip | Take | Best |
| --- | --- | --- | --- |
| 1 | 0 | 2 | 2 |
| 2 | 2 | 7 | 7 |
| 3 | 7 | 2+9 | 11 |
| 4 | 11 | 7+3 | 11 |
| 5 | 11 | 11+1 | 12 |

For coins `[1,3,4]`, the amount table is `[0,1,2,1,1,2,2]`. At six, final coin one proposes three coins, final coin three proposes two, and final coin four proposes three. Recording three takes reconstruction to amount three, whose recorded coin three takes it to zero.

## Visual Explanations

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

| Algorithm | Distinct states × transition work | Time | Auxiliary space |
| --- | --- | --- | --- |
| Memoised stairs | O(n) × O(1) | O(n) | O(n), memo and stack |
| Tabulated stairs | O(n) × O(1) | O(n) | O(n) |
| Rolling stair cost | O(n) × O(1) | O(n) | O(1) |
| Rolling House Robber | O(n) × O(1) | O(n) | O(1) |
| Minimum coins | O(A) × O(k) | O(k+A(k+1)) including validation/allocation | O(A+1), plus output |

For nonempty denomination lists and positive A, the familiar coin bound is O(Ak). A is the numeric target, not its number of written digits: this is pseudo-polynomial time. Reconstruction adds O(q) time and output for q chosen coins, with q≤A for positive integer denominations. The arithmetic bounds assume unit-cost, exactly representable values. Large `BigInt` arithmetic has costs that grow with operand size. Naive stair recursion is exponential because many calls solve the same heights; two recursive calls alone do not establish exponential time in every algorithm.

## Common Mistakes

- Writing a recurrence before defining whether an index means a position, an item, or a prefix length.
- Setting ways[0] to zero and erasing the empty sequence needed to seed counts.
- Initializing unreachable minimum-cost states to zero, which invents free solutions.
- Using memo truthiness when zero is a correct answer.
- Updating rolling variables in an order that destroys an old dependency.
- Compressing away decisions and then claiming the path can be reconstructed directly.

```javascript-bug
oneBack = Math.max(oneBack, twoBack + value);
twoBack = oneBack; // This saves the new value instead of the old prefix value.
```

In 0/1 capacity DP, a descending capacity loop prevents reuse of the current item. An ascending loop can intentionally permit unlimited reuse. Loop direction is a statement about which layer a dependency belongs to, not a style preference.

## Interview and LeetCode Pattern Recognition

“Count ways,” “minimum cost,” and “maximum value” invite a state decomposition, but are not proof that DP is needed. First write a brute-force decision tree and look for repeated questions. Prefix decisions often lead to a one-dimensional state. Ask what the future needs to know: remaining amount, next index, previous selection, or capacity. If two histories with the same proposed key have different legal futures, the key is incomplete.

Climbing Stairs counts ordered paths; Min Cost Climbing Stairs minimizes payment; House Robber maximizes a constrained subset; Coin Change minimizes a count with unlimited reuse. Their similar-looking tables use different bases and aggregation operators. Explain those differences before translating a known template.

## Practice Exercises

### Conceptual

1. Explain why ways(0)=1 but minimumCoins(0)=0. What object does each base count or measure?
2. Why does optimal substructure not justify largest-first greedy coin selection?

### Tracing

3. Write all stair-cost values for `[1,100,1,1,1]`, from position zero through the top. Identify an optimal departure sequence.

### Debugging

4. Trace the broken rolling update on houses `[2,3]`. State the violated meaning of `twoBack`.

### Implementation

5. Implement a full House Robber table and reconstruct selected indexes. Permit an empty selection and choose a consistent tie rule.
6. Convert memoised stairs to a rolling `BigInt` counter. Explain the arithmetic-cost limitation.

### LeetCode + HackerRank

- **[Coin Change](https://leetcode.com/problems/coin-change/)** — Platform: LeetCode. Difficulty: Medium. Concepts: exact-amount state, unbounded reuse, unreachable states. Why: tests whether you can reject an unsafe greedy choice and derive the final-coin recurrence.
- **[Recursion: Fibonacci Numbers](https://www.hackerrank.com/challenges/ctci-fibonacci-numbers/problem)** — Platform: HackerRank. Difficulty: Easy. Concepts: recursive dependencies, repeated states, memoisation. Why: provides a small recurrence on which to compare repeated recursion with caching. Follow its Fibonacci bases rather than the staircase bases.

## Hints and Worked Solutions

1. There is one empty sequence of jumps, but it contains zero coins. Bases answer different questions. A shared zero-size input does not imply a shared base value.
2. An optimum can be built from optimal smaller exact amounts after considering every final coin. That does not prove the largest coin belongs to an optimum. At six with `[1,3,4]`, two threes beat four plus two ones.
3. The table is `[0,0,1,2,2,3]`. One optimal route departs stairs 0,2,4, paying 1+1+1, then reaches top position five. Another optimal route may tie; the scalar table does not mandate one.
4. After processing two, the broken code sets both variables to two. It then combines the adjacent value three with that two and returns five. The correct answer is three; `twoBack` should still represent the prefix before the previous house.
5. Build `best[i]` with the skip/take recurrence. Starting at i=n, if `best[i]===best[i-1]`, skip by decrementing i; otherwise record i−1 and move back two. Handle i=1 with a zero empty-prefix value. Reverse the indexes. This takes O(n) time, O(n) table space, and O(n) output in the worst case.
6. Start the two previous counts at `1n`, handle n=0 explicitly, then repeatedly add before shifting. Print with `.toString()` for a plain decimal display. There are O(n) additions, but their bit cost increases as counts grow.

For the external exercises, test zero, unreachable positive targets, and repeated subproblems. Fibonacci uses F(0)=0 and F(1)=1. Memoised recursive evaluation preserves the requested recursive form while avoiding repeated state work. Judge acceptance is separate from the local examples here; these notes do not claim submissions were made.

## Sources and Further Reading

- Canonical scope: [curriculum](../../shared/curriculum.js) and [weeks 13–16 textbook](../../shared/textbook/weeks13to16.js).
- MIT OCW, [Lecture 19 DP notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/b6d4083131dd16e7d97f56d04b6e858f_MIT6_006F11_lec19.pdf): opened and consulted for memoisation, state reuse, and evaluation order. The stair, robbery, and coin examples are independently developed here.
- LeetCode, [Coin Change](https://leetcode.com/problems/coin-change/), and HackerRank, [Recursion: Fibonacci Numbers](https://www.hackerrank.com/challenges/ctci-fibonacci-numbers/problem): official statements opened to verify practice destinations and contracts; no editorial solutions consulted.

## Weekly Summary

DP begins with a state that preserves exactly the information needed by later choices. Derive exhaustive transitions, choose meaningful bases, and respect dependency order. Caching and tables remove repeated work; rolling variables remove storage only when old values are no longer needed. In [Week 15](week-15.md), the same discipline handles grids, pairs of prefixes, and the boundary between reusable states and path-dependent search.

## Weekly Progress Checklist

### Theory

- [ ] Define state, recurrence, bases, order, and answer before coding. <!-- checkpoint:w14-define-dp-model -->
- [ ] Explain empty and unreachable states without guessing constants. <!-- checkpoint:w14-explain-base-cases -->

### JavaScript

- [ ] Implement both memoisation and tabulation from one recurrence. <!-- checkpoint:w14-implement-two-evaluations -->
- [ ] Preserve old rolling values and reconstruct a coin solution. <!-- checkpoint:w14-preserve-dependencies -->

### Practice

- [ ] Trace stair cost, robbery, and unreachable coin amounts. <!-- checkpoint:w14-trace-dp-states -->
- [ ] Complete a LeetCode and a HackerRank recurrence exercise. <!-- checkpoint:w14-complete-external-practice -->

### Reflection

- [ ] Record a state-definition error and its smallest counterexample. <!-- checkpoint:w14-review-state-design -->
