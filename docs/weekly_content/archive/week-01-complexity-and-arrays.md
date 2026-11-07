# Week 1 - Complexity and Arrays

This week, you will be learning how to predict the work a program performs as its input grows. We will connect Big O, Big Theta, and Big Omega to concrete JavaScript operations: reading an array, searching it, changing its contents, and constructing an answer. The aim is to explain your code before reaching for a stopwatch.

We will start with positions, values, and movement in arrays, then build up to references, copying, method costs, and reusable prefix/suffix calculations. A known index gives direct access; a search needs evidence from individual entries; removing an early entry can move everything after it. Predict each example's output on paper before running it in a modern JavaScript runtime.

By the end, you should be able to trace a scan, explain mutation and copying, derive loop costs, and improve repeated work with a reusable prefix or suffix. You will also be able to state the assumptions behind your answer, including dense-array behavior, numeric precision, and whether output storage counts toward a space claim.

There will be a checklist at the end of the module to complete your progress logs. Complete the practice before consulting its solutions, then use the final Weekly Progress Checklist to record your Theory, JavaScript, Practice, and Reflection progress, including any explanation you still need to revisit.

## Learning Objectives

- Distinguish positions from values and specify whether a function returns an index, value, boolean, or collection.
- Derive upper, lower, and tight growth bounds without confusing them with best and worst cases.
- Count sequential, nested, dependent, logarithmic, and amortized work.
- Use every array method named in the syllabus deliberately: `push`, `pop`, `shift`, `unshift`, `splice`, `slice`, `includes`, `indexOf`, `find`, `map`, `filter`, `reduce`, and `sort`.
- Explain aliasing, shallow copying, selective copying, and deep cloning.
- Implement search, duplicate detection, safe removal, and Product of Array Except Self; account for input, working, and output storage separately.

## Prerequisite Knowledge

You need variables, numeric comparisons, `if`, functions, `return`, and `for` loops. A function parameter is a local name for an argument. A return ends the function immediately; a loop does not continue after it. `const` prevents rebinding a name but does not freeze an array or its objects.

An array of length three has indexes 0, 1, and 2. Reading index 3 normally produces `undefined`, rather than throwing an out-of-bounds exception. That convenience can disguise an incorrect loop bound. These chapters assume dense arrays unless stated otherwise: sparse arrays have holes, and different methods treat holes differently. Do not infer general sparse-array behavior from a dense-array trace.

All runnable blocks are self-contained. Arrays and records are usually logged with `JSON.stringify` so the output does not depend on a console's object-formatting preferences. Modern features in the supplementary examples require a current runtime; the core algorithms need no packages.

## Core Theory

### What are we measuring?

Let `n` be the number of input entries. We count an operation that captures the important work: comparisons in a search, assignments in a compaction, or multiplications in a product. We then ask how that count grows. Ten million simple operations can behave very differently from ten million network requests, so asymptotic analysis is a scaling model, not a latency forecast.

In the ordinary dense-array model, reading a known index takes constant time. Searching for an unknown position is different: a missing target forces us to inspect every entry. JavaScript does not require arrays to be literal contiguous machine-memory blocks, so these costs describe the conventional algorithm model, not a promise about proxies, exotic accessors, or every engine representation.

For nonnegative running-time functions, `T(n) ∈ O(g(n))` means that some constant multiple of `g(n)` eventually bounds `T(n)` from above. `T(n) ∈ Ω(g(n))` gives an eventual lower bound. `T(n) ∈ Θ(g(n))` means both bounds hold. Formally, Theta needs positive constants `c1`, `c2`, and a threshold `n0` such that `c1 g(n) ≤ T(n) ≤ c2 g(n)` for every `n ≥ n0`.

Suppose a complete scan costs `3n + 7` elementary operations. For `n ≥ 1`, it lies between `3n` and `10n`, so its cost is Θ(n). It is also O(n²), but that loose upper bound hides what we know. Constants and smaller terms matter in real performance; they simply do not change this growth class.

Best, average, and worst case select which inputs we discuss. Bound notation describes the resulting cost function. For linear search on nonempty input, the best case is Θ(1), when the first entry matches; the worst case is Θ(n), when the target is missing or last. Omega does **not** mean best case, and Big O does **not** inherently mean worst case. A worst-case cost can have an Omega bound too.

An average requires a probability model. If a present target is equally likely at each of `n` positions, comparisons average `(1 + 2 + ... + n) / n = (n + 1) / 2`, hence Θ(n). If almost every request asks for the first entry, that distribution changes the average. Say your assumption instead of treating “average” as an intrinsic property of a function.

### Count work, not indentation

Two consecutive scans perform `n + n` work: Θ(n). An outer scan whose inner loop always runs three times performs `3n` work: also Θ(n). Comparing each entry with each later entry performs `(n−1) + (n−2) + ... + 1 = n(n−1)/2` checks: Θ(n²). The last inner loop is short, but the early ones are long enough to make the total quadratic.

Dependent loops need particular care. If an outer counter doubles through `1, 2, 4, ..., n` and the inner loop runs that many times, total work is a geometric sum, at most about `2n`: Θ(n), not Θ(n log n). If the inner loop instead always scans all `n` entries, the same outer loop gives Θ(n log n). If two nested boundaries both move only forward through one sequence, total advances may be at most `2n`. We will exploit that in [Week 4](week-04.md).

A counter repeatedly divided by two reaches one in about `log₂ n` steps. Multiplying input size by two adds one step rather than doubling the work. Common growth classes, from slower to faster growth, are constant, logarithmic, linear, linearithmic (`n log n`), quadratic, and exponential (`2ⁿ`). These comparisons become useful for large inputs; they do not say which of two tiny implementations wins a stopwatch test.

Amortized analysis asks about a sequence of operations without needing a random input distribution. A dynamic array occasionally needs a larger backing store. If growth is geometric, the copied capacities across many appends form a geometric sum. Total work across `n` appends is O(n), so append is amortized O(1), even though an individual append can cost O(n). Expected analysis, by contrast, involves a probabilistic model. Keep those meanings separate.

### References describe ownership

Assigning an array to another variable copies its reference. Both names point to the same array. A shallow copy creates a different outer array but copies each element value; an element that is an object reference still points to the same object. Rearranging the copy is independent, while changing a shared object's fields is not.

Copy the levels you intend to edit. Spreading an array of records and then spreading each record separates those records, but a nested object inside each record is still shared. `structuredClone` can deeply clone supported data, including cycles; it is not a universal copier of functions, custom behavior, or every host object. A JSON round trip is a serialization operation with its own restrictions: it loses unsupported values, changes some types, and cannot serialize ordinary cycles. Choose a data contract before choosing a copying technique.

### Methods are algorithms too

At the end of an array, `push` appends and returns the **new length**, while `pop` removes and returns the **last value**. At the front, `unshift` inserts and returns the new length, while `shift` removes and returns the first value. Front operations can reindex the remaining entries; repeatedly shifting an entire collection can accumulate quadratic work.

`splice(start, deleteCount, ...items)` mutates the receiver and returns the removed entries. `slice(start, end)` leaves the receiver alone and returns a shallow copy; `end` is exclusive. A request for positions 1 through 3 inclusive therefore uses `slice(1, 4)`. Negative slice bounds count backward from the end. Knowing which result a method returns prevents accidentally replacing an array with a length or a removed segment.

`includes` answers a membership question, `indexOf` returns the first matching index or −1, and `find` returns the first value satisfying a predicate or `undefined`. Choose the return contract you actually need. `includes(NaN)` is true when NaN is present; `indexOf(NaN)` returns −1. A successful `find` can itself return `undefined`, so use `findIndex` when that ambiguity matters.

`map` transforms each entry into an output entry. `filter` retains entries that pass a predicate. `reduce` carries an accumulator from one callback to the next. Give reduce an initial value when empty input is possible. A callback must return its result: braces around an arrow-function body require an explicit `return`. With constant-cost callbacks these methods scan linearly, but calling `includes` inside every `map` callback can make the whole operation quadratic. Copying a growing accumulator on every reduce step has the same danger.

`sort` changes the receiver. Default ordering compares string representations, which is why numeric data needs `(a, b) => a - b`. The comparator must express a consistent ordering. A copied array protects the original order but consumes memory. We use an O(n log n) comparison-sort model when discussing algorithms; JavaScript does not specify one universal sort implementation or workspace bound.

### A running minimum preserves the best earlier choice

Best Time to Buy and Sell Stock asks for one purchase followed by one later sale, with zero profit allowed when no profitable transaction exists. A baseline tries every buy day before every sell day. For a fixed sell day, however, the best eligible purchase is simply the cheapest earlier price. Keep that minimum while scanning chronologically; sorting would destroy the required time order.

Before evaluating a sale, the running minimum describes strictly earlier days, and best describes the best completed transaction so far. Evaluate today's sale first, then allow today's price to become a purchase candidate for future days. This temporal invariant is a useful companion to prefix products: both summarize the past, but one retains a minimum and the other a product.

## JavaScript Implementations

### A scan with a precise contract

This search returns the first matching index, with strict equality, or −1. Before iteration `i`, every position before `i` has been ruled out. That sentence is a **loop invariant**: it is true initially, preserved by a failed comparison, and sufficient to justify the final failure result.

```javascript
function firstIndexOf(values, target) {
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] === target) return i;
  }
  return -1;
}
console.log(firstIndexOf([9, 2, 6], 6));
console.log(firstIndexOf([], 6));
console.log(firstIndexOf([6, 6], 6));
console.log(firstIndexOf([9, 2, 6], 5));
```
```output
2
-1
0
-1
```

### Method laboratory: mutation and copying

Follow the receiver and the return value separately. After each mutation, the next call sees the changed array. The slice is captured before splice, so its primitive entries remain the same afterward.

```javascript
const values = [2, 4];
console.log(values.push(6));
console.log(values.pop());
console.log(values.unshift(0));
console.log(values.shift());
const copied = values.slice(0, 1);
const removed = values.splice(1, 1, 8, 10);
console.log(JSON.stringify(values));
console.log(JSON.stringify(removed));
console.log(JSON.stringify(copied));
console.log(JSON.stringify([...values].sort((a, b) => b - a)));
console.log(JSON.stringify(values));
```
```output
3
6
3
0
[2,8,10]
[4]
[2]
[10,8,2]
[2,8,10]
```

### Method laboratory: searching and transformations

The source array below is unchanged by these operations because the callbacks only inspect numbers. Methods that create new arrays do not prevent a callback from mutating a referenced object; that remains your responsibility.

```javascript
const values = [3, 6, 6, 9];
console.log(values.includes(6));
console.log(values.indexOf(6));
console.log(values.find(value => value > 6));
console.log(values.findIndex(value => value > 10));
console.log(JSON.stringify(values.map(value => value / 3)));
console.log(JSON.stringify(values.filter(value => value % 2 === 0)));
console.log(values.reduce((sum, value) => sum + value, 0));
console.log([].reduce((sum, value) => sum + value, 0));
console.log([NaN].includes(NaN));
console.log([NaN].indexOf(NaN));
console.log(JSON.stringify([10, 2, 1].sort()));
console.log(JSON.stringify([10, 2, 1].sort((a, b) => a - b)));
```
```output
true
1
9
-1
[1,2,2,3]
[6,6]
24
0
true
-1
[1,10,2]
[1,2,10]
```

### Supplementary array vocabulary

The syllabus methods above deserve fluency first. You will also encounter `at` for relative indexing; `some` and `every` for short-circuit predicates; `forEach` for side effects; `concat` for a shallow combined array; `join` for a string; and `reverse` for in-place reversal. `flat` removes nesting up to a chosen depth and `flatMap` maps then flattens one level. `fill` assigns the same supplied value into a range, so filling with one object aliases that object. `copyWithin` copies a range within the same array without changing length.

Modern copying counterparts `toSorted`, `toReversed`, `toSpliced`, and `with` return changed shallow copies. `findLast` and `findLastIndex` search from the end. `keys`, `values`, and `entries` return iterators. `Array.from` constructs from an iterable or array-like value; `Array.of` constructs from its arguments, avoiding the single-number length behavior of `Array(3)`. `Array.isArray` tests the array type. These are useful vocabulary, not replacements for explaining traversal and allocation.

```javascript
const a = [1, 2, 3];
console.log(a.at(-1), a.some(x => x > 2), a.every(x => x > 0));
let total = 0;
a.forEach(x => { total += x; });
console.log(total, a.join(':'));
console.log(JSON.stringify(a.concat([4])));
console.log(JSON.stringify([...a].reverse()));
console.log(JSON.stringify([1, [2, [3]]].flat(2)));
console.log(JSON.stringify([1, 2].flatMap(x => [x, x * 10])));
console.log(JSON.stringify(Array(3).fill(7)));
console.log(JSON.stringify([1, 2, 3, 4].copyWithin(1, 2)));
console.log(JSON.stringify([3, 1, 2].toSorted((x, y) => x - y)));
console.log(JSON.stringify(a.toReversed()));
console.log(JSON.stringify(a.toSpliced(1, 1, 8)));
console.log(JSON.stringify(a.with(0, 9)));
console.log([1, 2, 4].findLast(x => x % 2 === 0));
console.log([1, 2, 4].findLastIndex(x => x % 2 === 0));
console.log(JSON.stringify([...a.keys()]));
console.log(JSON.stringify([...a.values()]));
console.log(JSON.stringify([...a.entries()]));
console.log(JSON.stringify(Array.from({ length: 3 }, (_, i) => i * 2)));
console.log(JSON.stringify(Array.of(3)), Array.isArray(a));
```
```output
3 true true
6 1:2:3
[1,2,3,4]
[3,2,1]
[1,2,3]
[1,10,2,20]
[7,7,7]
[1,3,4,4]
[1,2,3]
[3,2,1]
[1,8,3]
[9,2,3]
4
2
[0,1,2]
[1,2,3]
[[0,1],[1,2],[2,3]]
[0,2,4]
[3] true
```

### Copy at the correct depth

The alias grows with the original; the shallow copy does not. Both still share the first record. Even a copied record retains its nested `detail` object until that level is cloned too.

```javascript
const original = [{ score: 1, detail: { level: 2 } }];
const alias = original;
const shallow = original.slice();
alias.push({ score: 3, detail: { level: 4 } });
shallow[0].score = 9;
const records = original.map(item => ({ ...item }));
records[0].score = 20;
records[0].detail.level = 7;
const deep = structuredClone(original);
deep[0].detail.level = 99;
console.log(original === alias, original === shallow);
console.log(original.length, shallow.length);
console.log(original[0].score, records[0].score);
console.log(original[0].detail.level, deep[0].detail.level);
```
```output
true false
2 1
9 20
7 99
```

### Duplicate detection: baseline and memory trade-off

For finite numbers, the pair baseline and Set version agree. The baseline considers distinct positions exactly once. The optimized version asks whether the current value occurred in the processed prefix. General JavaScript values require an equality decision: Set treats NaN as equal to itself while strict equality does not.

```javascript
function containsDuplicateBrute(values) {
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (values[i] === values[j]) return true;
    }
  }
  return false;
}
function containsDuplicate(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}
function removeDuplicates(values) {
  return [...new Set(values)];
}
console.log(containsDuplicateBrute([8, 3, 8]));
console.log(containsDuplicate([8, 3, 5]));
console.log(containsDuplicate([]));
console.log(JSON.stringify(removeDuplicates([8, 3, 8, 5])));
```
```output
true
false
false
[8,3,5]
```

### Product of Array Except Self

The baseline recomputes almost the same product for every output. The optimized version writes the product strictly before each position, then multiplies by the product strictly after it. Multiplication's identity is 1, so an empty side contributes 1. There is no division, and zeros need no special branch. Assume numeric products remain representable and sufficiently precise.

```javascript
function productExceptSelfBrute(values) {
  return values.map((_, excluded) => {
    let product = 1;
    for (let j = 0; j < values.length; j += 1) {
      if (j !== excluded) product *= values[j];
    }
    return product;
  });
}
function productExceptSelf(values) {
  const result = Array(values.length).fill(1);
  let prefix = 1;
  for (let i = 0; i < values.length; i += 1) {
    result[i] = prefix;
    prefix *= values[i];
  }
  let suffix = 1;
  for (let i = values.length - 1; i >= 0; i -= 1) {
    result[i] *= suffix;
    suffix *= values[i];
  }
  return result;
}
console.log(JSON.stringify(productExceptSelfBrute([2, 3, 4])));
console.log(JSON.stringify(productExceptSelf([2, 3, 4])));
console.log(JSON.stringify(productExceptSelf([2, 0, 4])));
console.log(JSON.stringify(productExceptSelf([0, 2, 0])));
console.log(JSON.stringify(productExceptSelf([7])));
console.log(JSON.stringify(productExceptSelf([])));
```
```output
[12,8,6]
[12,8,6]
[0,8,0]
[0,0,0]
[1]
[]
```

### Best Time to Buy and Sell Stock: summarize earlier days

The local contract returns zero for fewer than two prices. Prices are finite numbers. The baseline makes the chronological condition explicit; the optimized scan retains exactly the earlier information needed by each candidate sale.

```javascript
function maxProfitBrute(prices) {
  let best = 0;
  for (let buy = 0; buy < prices.length; buy += 1) {
    for (let sell = buy + 1; sell < prices.length; sell += 1) {
      best = Math.max(best, prices[sell] - prices[buy]);
    }
  }
  return best;
}
function maxProfit(prices) {
  if (prices.length < 2) return 0;
  let cheapest = prices[0];
  let best = 0;
  for (let sell = 1; sell < prices.length; sell += 1) {
    best = Math.max(best, prices[sell] - cheapest);
    cheapest = Math.min(cheapest, prices[sell]);
  }
  return best;
}
console.log(maxProfitBrute([9, 3, 7, 2, 8]));
console.log(maxProfit([9, 3, 7, 2, 8]));
console.log(maxProfit([8, 5, 2]));
console.log(maxProfit([4]));
console.log(maxProfit([]));
```
```output
6
6
0
0
0
```

## Worked Examples

### Example 1: establish evidence while searching

Search `[9, 2, 6]` for 6. At index 0, the prefix before the index is empty, so the invariant is automatically true. Comparing 9 with 6 fails and establishes that index 0 cannot be the answer. At index 1, compare 2 and fail again. At index 2, compare 6 and return 2. Notice that the answer is an index, not the third comparison count.

For an absent target, the index reaches length 3. Every earlier position has been excluded, so −1 is justified. For empty input, the same reasoning works without a special-case branch: there are no possible matching positions. This is why a good invariant helps both the ordinary case and boundary cases.

### Example 2: a dependent loop that is linear

With `n = 8`, an outer variable doubling from 1 through 8 gives inner lengths 1, 2, 4, and 8. The total is 15, not `8 × 4`. Compare it with the triangular pair count, 28. Both examples have nested loops; their sums tell different stories.

```javascript
function countWork(n) {
  let triangular = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) triangular += 1;
  }
  let geometric = 0;
  for (let width = 1; width <= n; width *= 2) {
    for (let j = 0; j < width; j += 1) geometric += 1;
  }
  return { triangular, geometric };
}
console.log(JSON.stringify(countWork(8)));
console.log(JSON.stringify(countWork(16)));
```
```output
{"triangular":28,"geometric":15}
{"triangular":120,"geometric":31}
```

### Example 3: deleting changes future positions

Start with `[-1, -2, 3]`. Removing index 0 moves −2 into index 0. Advancing to index 1 skips that value. A backward scan avoids this correctness error because deleting position `i` leaves all earlier positions in place. However, repeatedly deleting early entries can still move a long surviving suffix; correctness does not make it linear.

```javascript
function removeNegativesBackward(values) {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    if (values[i] < 0) values.splice(i, 1);
  }
  return values;
}
console.log(JSON.stringify(removeNegativesBackward([-1, -2, 3])));
console.log(JSON.stringify(removeNegativesBackward([4, -1, 5, -2])));
```
```output
[3]
[4,5]
```

### Example 4: reuse products without including self

For `[2, 3, 4]`, the forward pass writes `[1, 2, 6]`. At index 1, prefix is 2 because only index 0 has been multiplied in. In the reverse pass, index 2 is multiplied by 1, index 1 by 4, and index 0 by 12, producing `[12, 8, 6]`. Updating prefix or suffix **before** using it would include the current value and violate “except self.” With a single zero, only the zero's position can receive a nonzero product. With two zeros, every product includes at least one zero.

### Example 5: a cheaper purchase does not erase an earlier profit

For `[9,3,7,2,8]`, begin with cheapest 9 and best 0. Selling at 3 gives a loss, so best stays zero; then cheapest becomes 3. Selling at 7 earns 4. The price 2 does not improve the sale, but becomes the cheapest purchase for later days. Selling at 8 then earns 6, replacing the earlier best. Keep both variables: the cheapest price alone cannot remember an already completed profitable opportunity.

On `[8,5,2]`, no later sale exceeds an earlier purchase, so best remains zero. Taking global maximum minus global minimum would incorrectly claim profit 6 by buying at the end and selling at the beginning. This is a correctness error caused by discarding chronology, not a small implementation detail.

## Visual Explanations

Think of a shallow copy as a second row of arrows, not a second set of nested records:

```text
original ──> array A ── index 0 ──> record R ──> detail D
alias    ──> array A
shallow  ──> array B ── index 0 ──> record R
records  ──> array C ── index 0 ──> record S ──> detail D
deep     ──> array E ── index 0 ──> record T ──> detail F
```

Changing the membership of A does not change B. Editing R is visible through both A and B. Editing D is visible even through S. The deepest shared arrow determines which mutations remain shared.

```text
input:          [2,  3, 4]
strict prefix:  [1,  2, 6]
strict suffix:  [12, 4, 1]
answer:         [12, 8, 6]

For output i, combine the region before i and the region after i.
The current position is excluded from both regions.
```

## Complexity Analysis

Here `n` is input length, `k` is copied range length, and callbacks are assumed constant-cost. Extra memory includes newly allocated result arrays unless explicitly separated.

| Operation | Conventional time | Additional memory | Reason |
| --- | --- | --- | --- |
| Known-index read/write | O(1) | O(1) | No search |
| `push` / `pop` | Amortized O(1) / O(1) | Capacity-dependent for growth | End operation |
| `shift` / `unshift` | O(n) | Engine-dependent | Later positions may move |
| `splice` | O(n + inserted count) worst case | Removed-result size plus engine storage | Mutation and reindexing |
| `slice`, spread | Θ(k) copied entries | Θ(k) | New shallow array |
| `includes`, `indexOf`, `find` | O(n) worst case | O(1) | May inspect all entries |
| `map`, `filter` | Θ(n) with constant callbacks | O(n) output | Visit each dense entry |
| `reduce` | Θ(n) with constant callback | Depends on accumulator | Callback determines hidden work |
| Numeric comparison sort | Usually O(n log n) model | Engine-dependent | Sorting is preprocessing |
| Duplicate pair baseline | Θ(n²) worst case | O(1) | All distinct pairs |
| Duplicate Set approach | Expected O(n) | O(n) | Retained membership evidence |
| Stock pair baseline / running minimum | Θ(n²) / Θ(n) worst case | O(1) | Repeated earlier-price search / retained minimum |
| Product baseline | Θ(n²) | Θ(n) output, O(1) beyond output | Repeated multiplication |
| Prefix/suffix product | Θ(n) | Θ(n) output, O(1) beyond output | Two full passes |

Supplementary methods follow the same accounting. `some`, `every`, and reverse searches can stop early but scan O(n) in the worst case. `forEach`, full `reverse`, and full `fill` are linear. Copying variants allocate linear output. Concatenation is linear in copied entries; joining also depends on total produced characters. Flattening depends on visited nested entries and output size, not only the outer length. Constructing an iterator is different from consuming all of it: spreading `entries()` processes the entire array.

Space analysis counts reachable storage, not names. One variable holding an n-entry copy represents Θ(n) storage. A deep clone's cost depends on the size of the reachable data graph, which may be much larger than the outer array. The input occupies space, but it is not newly allocated auxiliary space. When returning n products, report “Θ(n) output and O(1) working memory beyond output,” rather than simply “constant space.”

## Common Mistakes

An inclusive loop bound reads one extra value. If the target is `undefined`, it can even manufacture a successful search outside the array. A numeric comparator omitted from sort changes the meaning of order. Assigning the result of `push` back to the array name replaces the array with a number. Each failure comes from skipping the operation's contract.

The following intentionally broken example leaves a negative value behind. Its syntax is valid, but its traversal is incorrect; do not copy it into a solution.

```javascript-bug
const values = [-1, -2, 3];
for (let i = 0; i < values.length; i += 1) {
  if (values[i] < 0) values.splice(i, 1);
}
console.log(JSON.stringify(values));
```

The broken code prints `[-2,3]`, confirming that the shifted −2 was skipped.

Do not describe every nested loop as quadratic, every built-in call as constant, or every shallow copy as independent. Also avoid changing an array while a callback traverses it unless you have explicitly reasoned about which positions the method will visit. A straightforward loop with a documented invariant is easier to audit than a short expression hiding multiple traversals.

## Interview and LeetCode Pattern Recognition

Start with five questions: What is the input size? What must be returned? May I mutate the input? What counts as equality? What happens on empty input? Then write the simplest correct baseline and locate repeated work.

“Any duplicate” suggests remembering previous values, explored in [Week 2](week-02.md). “Except this position” suggests independent contributions from the left and right. “Remove in place while preserving order” suggests the reader/writer technique in [Week 3](week-03.md). These are hypotheses to prove, not keyword-to-code substitutions. A Set improves duplicate detection by spending memory; it does not automatically satisfy a constant-space constraint.

For Product of Array Except Self, mention why total-product division is unsuitable: zeros break the shortcut, and the external problem explicitly forbids division. For Contains Duplicate, distinguish boolean existence from returning the earliest repeated value or every duplicate; those are different contracts.

## Practice Exercises

### Conceptual

1. Explain why `3n + 7` is Θ(n), O(n²), and Ω(n), and why Omega does not mean “best case.”
2. Predict which edits are shared among an alias, a shallow array copy, a copy of each outer record, and a deep clone. Include a nested object.
3. Classify all thirteen syllabus methods by mutation, return type, traversal, and output allocation. Then explain why a quadratic callback can invalidate a linear method estimate.

### Tracing

4. Trace search for 5 in `[2, 5, 5]`, and search for 8 in the same input. Record index, comparison, and excluded prefix.
5. Count triangular and doubling-dependent inner work at `n = 4`. Compare with a doubling outer loop whose inner loop always runs four times.
6. Write the strict prefix and suffix arrays for `[3, 0, 2]` before multiplying them.

### Debugging

7. Repair forward deletion above in two ways: a correctness-first backward version and a linear compaction. Explain why they have different worst-case costs.
8. Explain why `values.map(x => { x * 2; })` does not double numbers, why sorting `[2, 10]` without a comparator surprises you, and why `Array(3).fill({ count: 0 })` shares records.

### Implementation

9. Implement first-index search and stable duplicate removal from memory. State equality and empty-input contracts.
10. Implement prefix/suffix products without division. Test empty, singleton, negative, one-zero, and two-zero inputs; compare against a pair-loop baseline on small arrays.
11. Build a method laboratory using different input values. Exercise every syllabus method and at least four supplementary methods, printing both result and receiver when mutation is involved.

### External

The upstream assignment consists of Contains Duplicate, Best Time to Buy and Sell Stock, and Product of Array Except Self. The chapter's additional exercises develop the supporting reasoning.

12. [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** array traversal, pair enumeration, Set membership. **Relevance:** compares a quadratic baseline with an expected-linear solution that spends memory. First explain the pair baseline, then the memory trade-off.
13. [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** arrays, prefix/suffix accumulation, output-space accounting. **Relevance:** demonstrates how reusing partial results removes repeated multiplication. Derive the exclusion invariant before coding; treat a correct baseline as progress.

14. [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** chronological traversal, running minimum, best-so-far state. **Relevance:** replaces repeated searches of earlier days with one scalar summary. Trace `[9,3,7,2,8]`, explain why sorting is invalid, then implement both approaches and compare decreasing-price cases.

## Hints and Worked Solutions

### Hints to try before reading the answers

For 1–3, distinguish a mathematical bound from an input case, and draw references rather than copying object text. For 4–6, write the state **before** updating it. For 7, keep a separate destination index so the unread suffix stays intact. For 8, braces change an arrow expression into a block. For 9–13, test a very small counterexample before adding more code.

### Solutions 1–6

For `n ≥ 1`, `3n ≤ 3n + 7 ≤ 10n`, proving Theta and Omega. Since `n ≤ n²` for those n, O(n²) is also true but less informative. The selected runtime function could describe a best, worst, or average case. The bound notation itself does not choose one.

An alias shares the outer array. A slice shares element references but not outer membership. Spreading each record separates record fields, while nested references still point to the old nested objects. A supported deep clone separates the copied graph. For method classification, use the implementations and complexity table as the answer key: push/pop/shift/unshift/splice/sort mutate; the other seven syllabus methods do not themselves mutate the receiver. Predicate and accumulator behavior still needs inspection.

Search for 5 checks 2 then 5 and returns 1; the duplicate at index 2 is never reached. Search for 8 checks all three positions and returns −1. At `n = 4`, triangular work is `3 + 2 + 1 = 6`; doubling-dependent work is `1 + 2 + 4 = 7`; fixed inner work under the same three outer iterations is `4 + 4 + 4 = 12`. For `[3, 0, 2]`, strict prefixes are `[1, 3, 0]`, strict suffixes `[0, 2, 1]`, and products `[0, 6, 0]`.

### Solutions 7–8: linear removal and callback mistakes

A writer identifies the next output slot. It never moves ahead of the reader, so a write cannot destroy an unread value. Truncate only after all reads finish. This preserves the order of nonnegative entries and avoids repeated shifts.

```javascript
function removeNegatives(values) {
  let writer = 0;
  for (let reader = 0; reader < values.length; reader += 1) {
    if (values[reader] >= 0) {
      values[writer] = values[reader];
      writer += 1;
    }
  }
  values.length = writer;
  return values;
}
console.log(JSON.stringify(removeNegatives([-1, -2, 3])));
console.log(JSON.stringify(removeNegatives([4, -1, 5, -2])));
console.log(JSON.stringify([1, 2].map(x => { return x * 2; })));
const independent = Array.from({ length: 3 }, () => ({ count: 0 }));
independent[0].count = 1;
console.log(JSON.stringify(independent));
```
```output
[3]
[4,5]
[2,4]
[{"count":1},{"count":0},{"count":0}]
```

Compaction reads n entries and writes at most n, so it is Θ(n) time and O(1) auxiliary space. Backward splice is correct but can repeatedly move a surviving suffix. The broken map callback returns nothing, so each mapped value becomes `undefined`. Default sort compares text; the numeric comparator repairs it. `fill` evaluates its object argument once; `Array.from` calls the factory separately for each entry.

### Solutions 9–13: evaluate the explanation as well as the result

The search, Set deduplication, and prefix/suffix implementations above are complete worked solutions. Rebuild them without looking, then explain the state each variable represents. On `[-2, 3, 4]`, products are `[12, -8, -6]`; on `[0, 0]`, both products are zero. An empty array returns an empty output and a singleton returns `[1]` under the empty-product convention. The external site's constraints may exclude those inputs; our local contracts intentionally define them.

For the method laboratory, a successful answer states that splice returns removed entries, push returns a length, and slice returns a new shallow array. It should also show that modifying a nested record through a slice changes the original. For the external tasks, submit only after your baseline and optimized implementations agree on small inputs within the same equality and numeric contract. No external judge submission is implied by this chapter.

### Solution 14: preserve chronology

Hint: for a fixed sale day, only the smallest eligible earlier price matters. The full stock implementations above provide the worked solution. The trace earns 4 at price 7, retains that best while price 2 becomes the new minimum, and finally earns 6 at price 8. There are n(n−1)/2 buy/sell candidates in the baseline, but only n−1 sale evaluations in the optimized scan; both use constant auxiliary state. A correct answer returns zero for decreasing prices and never proposes a sale before its purchase.

## Sources and Further Reading

The canonical scope comes from the repository's [curriculum](../../shared/curriculum.js) and [Weeks 1–4 textbook material](../../shared/textbook/weeks01to04.js). A user draft inspected during initial preparation supplied the introductory emphasis on complexity, traversal, mutation, and a final progress checklist. That historical input was not edited or moved when preparing this chapter. This chapter expands those topics in original prose, examples, traces, and exercises.

- [MDN Array reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array): opened and consulted to verify array-copy semantics and API vocabulary. This reference does not guarantee the engine-specific complexity estimates used in interview models.
- [MDN structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone): consulted for supported deep cloning, circular references, and failure on unsupported data.
- [CS50 Algorithms notes](https://cs50.harvard.edu/x/2024/notes/3/): verified as further reading for algorithm analysis; not a source of these JavaScript implementations.
- The three LeetCode problem pages linked in Practice Exercises were opened to verify task statements and difficulties. Their editorials were not used, and solutions were not submitted to their judge.
- [Upstream Week 1](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/01.md): fetched through the GitHub connector to reconcile the assigned problem list, including Stock. Its prose was not copied into this chapter.

External URLs were verified during preparation on 7 November 2026. The explanations are grounded primarily in the canonical local syllabus and independently derived algorithm reasoning. Runtime measurements, all possible engine representations, and a full treatment of JavaScript serialization are outside this chapter's scope.

## Weekly Summary

You now have a way to connect code to evidence: define the contract, name the state, trace its updates, and count the work. Array methods still perform traversals and allocations even when the call is one line long. References explain why some copies isolate mutations and others share them. Bounds describe growth; cases describe inputs.

The first major optimization is reusing evidence. A Set retains prior membership, and prefix/suffix products retain earlier multiplication. Both improve time by changing what is remembered. Continue to [Week 2 — Hash Maps and Sets](week-02.md) to examine that memory trade-off in detail.

## Weekly Progress Checklist

### Theory

- [ ] I can distinguish O, Ω, and Θ from best, average, and worst cases. <!-- checkpoint:w1-bounds-and-cases -->
- [ ] I can derive sequential, triangular, geometric, and logarithmic loop costs. <!-- checkpoint:w1-dependent-loop-costs -->
- [ ] I can separate amortized analysis from expected analysis. <!-- checkpoint:w1-amortized-growth -->
- [ ] I can account for input, output, and auxiliary storage. <!-- checkpoint:w1-space-accounting -->

### JavaScript

- [ ] I can explain mutation and return values for every syllabus array method. <!-- checkpoint:w1-array-method-contracts -->
- [ ] I can demonstrate aliasing, shallow copies, and nested deep-copy behavior. <!-- checkpoint:w1-reference-copy-depth -->
- [ ] I can implement a bounded scan and stable in-place removal. <!-- checkpoint:w1-scan-and-removal -->
- [ ] I can implement prefix/suffix products without division. <!-- checkpoint:w1-prefix-suffix-products -->

### Practice

- [ ] I completed conceptual, tracing, debugging, and implementation exercises. <!-- checkpoint:w1-local-practice -->
- [ ] I attempted Contains Duplicate and explained the space trade-off. <!-- checkpoint:w1-contains-duplicate-practice -->
- [ ] I attempted Product of Array Except Self and tested zero cases. <!-- checkpoint:w1-product-practice -->
- [ ] I implemented Stock with a running minimum and preserved chronological order. <!-- checkpoint:w1-stock-running-minimum -->

### Reflection

- [ ] I recorded a mistaken prediction and the invariant that corrected it. <!-- checkpoint:w1-reflect-on-error -->
- [ ] I can explain one optimization aloud without reading its code. <!-- checkpoint:w1-explain-optimization -->
