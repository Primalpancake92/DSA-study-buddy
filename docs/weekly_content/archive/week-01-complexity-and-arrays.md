# Week 1 - Complexity and Arrays

This week, we will learn to explain how a program's work grows when its input gets larger. We will connect the mathematical bounds called Big O, Big Theta, and Big Omega to operations you can trace: reading an array entry, looking for a value, changing positions, and building an answer. Timing a program tells us about one run; counting its work helps us understand how that run will scale.

We will begin by separating an entry's position from its value. From there, we will study object references, copying, array-method costs, and calculations we can reuse from either side of an array. Reading a known position avoids searching. Finding an unknown position needs comparisons. Removing an early entry can move later ones. Predict each example on paper before running it in a modern JavaScript runtime so you can compare your mental model with the result.

By the end, you should be able to follow a scan step by step, explain which changes copies share, and derive costs from the work loops actually perform. We will also reuse calculations for a prefix, the region before a position, and a suffix, the region after it. You will state assumptions about array storage, numeric precision, and whether memory for a returned answer is included in a space claim. Those assumptions are part of an explanation, not details to hide.

Attempt the practice before consulting the worked answers. Then use the final Weekly Progress Checklist to update your progress logs under Theory, JavaScript, Practice, and Reflection. Record explanations that still need another pass as well as tasks you completed. A correct output is useful, but being able to explain the state and count the work is what will let you solve the next variation.

## Learning Objectives

- Separate an entry's position from its value, and state whether a function promises an index, a value, true or false, or a collection.
- Derive upper, lower, and tight bounds on growth while keeping those bounds separate from the choice of best or worst input cases.
- Count work in consecutive loops, nested and dependent loops, repeated halving, and sequences with occasional expensive operations.
- Use all syllabus array methods with a clear purpose: `push`, `pop`, `shift`, `unshift`, `splice`, `slice`, `includes`, `indexOf`, `find`, `map`, `filter`, `reduce`, and `sort`.
- Explain when names share one array, when only the outer container is copied, which nested levels a selective copy separates, and what deep cloning supports.
- Build search, duplicate detection, safe removal, and Product of Array Except Self, reporting input storage, temporary working memory, and returned output separately.

## Prerequisite Knowledge

You should be comfortable with variables, numeric comparisons, `if`, functions, `return`, and `for` loops. A parameter is the function's local name for an argument supplied by its caller. Executing return ends the function immediately, even from inside a loop. Also distinguish a fixed binding from fixed contents: `const` prevents assigning a different value to that name, but it does not freeze the array or objects the name refers to.

For an array of length three, the valid indexes are 0, 1, and 2. Reading index 3 normally returns `undefined` instead of throwing an out-of-bounds error, so an incorrect loop may appear to run successfully. We assume dense arrays, where the expected entries occupy the indexes, unless stated otherwise. Sparse arrays have missing slots, called holes, and methods handle them differently. A trace using a dense array is not evidence for every sparse-array behavior.

You can run each runnable block on its own because it supplies its own data and definitions. We usually log arrays and records through `JSON.stringify`, which turns supported data into JSON text and makes displayed formatting predictable. Supplementary methods using newer JavaScript features need a current runtime. The core algorithms require no installed packages, so you can focus on their behavior rather than project setup.

## Core Theory

### What are we measuring?

Let `n` count the input entries. Choose an operation that reflects the task's main work: comparisons for search, assignments when packing survivors together, or multiplications for a product. Then ask how its count changes as n grows. This growth study is asymptotic analysis. It models scaling rather than predicting elapsed time: ten million tiny arithmetic operations and ten million network requests have very different real costs even if their counts match.

In our ordinary dense-array model, a known-index read takes constant time: its modeled work does not grow with the array's length. Searching is different because we do not know which index to read. If the target is missing, we must inspect every entry. JavaScript does not require arrays to occupy one literal consecutive block of machine memory. These are conventional algorithm-model costs, not guarantees for proxies, custom access behavior, or every representation an engine might choose.

Think of a growth bound as a comparison between cost curves once inputs are large enough. For nonnegative running-time functions, `T(n) ∈ O(g(n))` says some constant multiple of `g(n)` eventually stays above `T(n)`. `T(n) ∈ Ω(g(n))` says a constant multiple eventually stays below it. `T(n) ∈ Θ(g(n))` gives both, a tight growth description.

Formally, Theta requires positive constants `c1`, `c2`, and a threshold `n0` such that `c1 g(n) ≤ T(n) ≤ c2 g(n)` for every `n ≥ n0`. The threshold allows small-input exceptions; the constants let us compare growth without insisting the curves have the same height. Keep those quantifiers: the inequalities must hold for every size beyond that threshold.

Suppose counting a full scan gives `3n + 7` elementary operations. For `n ≥ 1`, the count is at least `3n` and at most `10n`, proving Θ(n). O(n²) is also true, because a quadratic upper bound eventually covers linear growth, but it hides the tighter information we have. The seven setup operations and the factor three can affect real performance; they simply do not change the growth class.

Choose the input case separately from choosing a bound. Best, average, and worst case tell us which cost function to study. Big O, Omega, and Theta describe that function's growth. Linear search on nonempty input has a Θ(1) best case when the first entry matches and a Θ(n) worst case when the target is absent or last. Omega does **not** mean best case, and Big O does **not** inherently mean worst case. The worst-case function also has an Omega bound; in fact, its tight linear bound includes one.

An average needs a probability model, a statement of how likely different inputs are. If a present target is equally likely at every one of `n` positions, average comparisons are `(1 + 2 + ... + n) / n = (n + 1) / 2`, giving Θ(n). If requests overwhelmingly target the first entry, the average changes. State the distribution you assume rather than treating “average time” as a property independent of the workload.

### Count work, not indentation

Count executions instead of looking at indentation. Two consecutive scans do `n + n` work, giving Θ(n). A scan with an inner loop of exactly three iterations does `3n`, also Θ(n). Comparing each entry with each later one gives `(n−1) + (n−2) + ... + 1 = n(n−1)/2` checks, which is Θ(n²). Although later inner loops are short, the earlier long loops contribute enough work to keep the total quadratic.

An inner loop may depend on the outer loop's current value, so count its actual lengths. If the outer counter doubles through `1, 2, 4, ..., n` and the inner loop runs that many times, the lengths form a geometric sum totaling at most about `2n`. The result is Θ(n), not Θ(n log n). If every inner run instead visits all `n` entries, the same outer loop produces Θ(n log n). Another possibility is two nested boundaries that only move forward through one sequence: their combined advances may be at most `2n`. [Week 4](../week-04.md) develops that reuse.

If you keep dividing a counter by two, it reaches one after about `log₂ n` steps. This is logarithmic growth: doubling input adds roughly one step. Common growth classes from slower to faster are constant, logarithmic, linear, linearithmic (`n log n`), quadratic, and exponential (`2ⁿ`). Linearithmic means a linear factor multiplied by a logarithmic one. These classes help compare large-input scaling. They do not determine which tiny implementation wins a timing experiment with different constant costs.

Sometimes one operation is expensive but many operations together have a useful bound. Amortized analysis spreads total cost over a sequence without assuming random inputs. A dynamic array occasionally allocates a larger backing store and copies entries. With geometric growth, those copied capacities form a geometric sum. Across `n` appends, total work is O(n), giving amortized O(1) per append even though one append may cost O(n). Expected analysis instead uses probabilities. “Amortized” and “expected” explain different reasons a per-operation model can be cheap.

### References describe ownership

An array variable holds a reference identifying the array object. Assigning it to another variable copies that reference, so both names reach one array; the second name is an alias. A shallow copy creates a new outer array and copies its element values. If an element value is itself an object reference, both arrays still reach that same object. Rearranging one outer array is independent, but editing the shared object's fields is visible through both.

Copy the levels you plan to change. Spreading an array and then each record creates separate records, but a nested object inside a record remains shared until you copy that level too. Deep cloning follows supported nested data so those levels are separated as well. `structuredClone` supports this for suitable data, including cycles, where references lead back to earlier objects. It is not a universal copier for functions, custom behavior, or every environment-provided object.

A JSON round trip converts data to text and parses it back. That serialization has different restrictions: unsupported values may disappear, some types change, and ordinary cycles cannot be serialized. Decide which data types and behavior must survive before choosing a copying technique. “Make a copy” is incomplete until we know how deep and of what data.

### Methods are algorithms too

Array methods have return contracts as well as effects. `push` adds at the end and returns the **new length**. `pop` removes from the end and returns the **last value**. At the front, `unshift` adds entries and returns the new length, while `shift` removes and returns the first value. Front changes can reindex the remaining entries. Repeating shift until a collection is empty may move a long suffix repeatedly, accumulating quadratic work.

The receiver is the array on which you call a method. `splice(start, deleteCount, ...items)` mutates that receiver, meaning it changes the existing array, and returns the entries removed. `slice(start, end)` leaves it alone and returns a shallow copy. Slice's end is exclusive, so positions 1 through 3 inclusive require `slice(1, 4)`. Negative bounds count back from the end. Track the receiver and result separately so you do not accidentally replace your array variable with a length or removed segment.

A membership question asks whether a value exists; `includes` returns that boolean answer. `indexOf` returns the first matching index or −1. `find` returns the first value satisfying a predicate, a function that tests whether an entry qualifies, or `undefined` if none does. Pick the return contract you need. Equality rules matter too: `includes(NaN)` recognizes a present NaN, but `indexOf(NaN)` returns −1. If a successful find could itself return undefined, use `findIndex` when you need an unambiguous position result.

`map` transforms each entry into one output entry, while `filter` keeps entries passing a test. `reduce` passes an accumulator, the result built so far, from one callback invocation to the next. A callback is the function the method calls on your behalf. Supply reduce's initial value if input may be empty. If an arrow-function body uses braces, explicitly return the intended result.

The callback's work belongs in the analysis. Constant-cost callbacks make these traversals linear, but an `includes` search inside every map callback can make the full operation quadratic. Repeatedly copying a growing accumulator during reduce has the same danger. A one-line method call can hide many traversals and allocations; count the operations it actually requests.

`sort` changes its receiver's order. By default it compares text representations, so numeric ascending order needs a comparator such as `(a, b) => a - b`. A comparator is a function telling sort which of two entries comes first; its answers must describe a consistent ordering. Sorting a copied array protects the original but consumes memory for the copy. We use an O(n log n) comparison-sort model in algorithm discussions. JavaScript does not prescribe one universal sorting implementation or temporary-workspace bound.

### A running minimum preserves the best earlier choice

Best Time to Buy and Sell Stock permits one purchase followed by one later sale. If no profitable transaction exists, zero profit is allowed. The baseline tries every buy day with every later sell day. But for a fixed sale day, only the cheapest eligible earlier purchase matters. Keep that minimum as you scan in time order. Sorting prices would discard the chronology that makes a purchase eligible, so it cannot replace this scan.

Before each sale evaluation, define cheapest as the minimum among strictly earlier days and best as the best completed transaction so far. Evaluate today's sale using that earlier minimum, then let today's price become a possible purchase for future days. This preserves the time-order invariant. Like a prefix product, it summarizes the past, but it retains a minimum instead of multiplication. Choosing the right summary avoids searching that past again.

## JavaScript Implementations

### A scan with a precise contract

Let's give search a precise contract: return the first index whose value matches by strict equality, or −1 if none matches. Before iteration `i`, we know that no earlier position matches. This is a **loop invariant**, a fact that remains true at the start of every iteration. It begins true for an empty earlier region, survives each failed comparison, and eventually justifies returning failure after every entry is excluded.

### Demonstration 1 — Return the first strict-equality matching index

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

In **Demonstration 1**, searching `[9, 2, 6]` for 6 rejects indexes 0 and 1, then returns index 2. The return exits immediately, which also makes `[6, 6]` return zero instead of continuing to its second match. Empty input never enters the loop and returns −1. The condition `i < values.length` keeps comparisons within valid positions rather than inspecting the undefined value just beyond the end.

### Method laboratory: mutation and copying

Track two things for every call: the array receiving the method and the value the method returns. Each mutation changes what the next call sees. We capture a slice before splice changes the source, so the slice's copied numeric entries retain their earlier values. The final sort uses a copy, letting us compare the sorted result with the original receiver.

### Demonstration 2 — Separate method return values from receiver mutations

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

In **Demonstration 2**, starting `[2, 4]` becomes `[2, 4, 6]` after push, but its return is length 3. Pop returns 6 and restores `[2, 4]`. Later, splice replaces 4 with 8 and 10, returning removed array `[4]` while the receiver becomes `[2,8,10]`. The earlier slice remains `[2]`. Spreading before descending sort changes only the new array, so logging `values` afterward still gives `[2,8,10]`.

### Method laboratory: searching and transformations

We will now inspect membership, positions, transformations, and ordering. These callbacks only read numbers, so the source array remains unchanged by the search and transformation methods. A method returning a new array does not prevent its callback from changing a referenced object. You still need to inspect callback behavior before claiming the original data is protected.

### Demonstration 3 — Observe search contracts and transformation results

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

In **Demonstration 3**, `[3, 6, 6, 9]` includes 6, but `indexOf` returns its first position, 1, and `find` returns qualifying value 9. Map divides each entry by three; filter retains both even sixes; reduce accumulates 24 from initial zero. The empty reduction returns that initial zero. The last four logs expose two independent rules: includes and indexOf disagree about NaN, and default text sorting differs from numeric comparison on `[10, 2, 1]`.

### Supplementary array vocabulary

Learn the syllabus methods first, then use this vocabulary to read unfamiliar JavaScript. `at` supports indexing relative to the end. `some` and `every` can short-circuit, meaning they stop as soon as the answer is determined. `forEach` runs work for its effects rather than building transformed output. `concat` combines entries into a shallow new array, `join` builds a string, and `reverse` reverses the existing array.

`flat` removes nesting up to a selected depth; `flatMap` transforms entries and flattens one level. `fill` writes the same supplied value repeatedly, so using one object creates aliases rather than separate records. `copyWithin` copies entries between ranges of the same array without changing length. For each method, ask whether it visits, writes, or allocates, rather than treating its short name as a cost explanation.

Newer copying counterparts `toSorted`, `toReversed`, `toSpliced`, and `with` return modified shallow copies. `findLast` and `findLastIndex` search backward. `keys`, `values`, and `entries` return iterators, objects that supply successive indexes, values, or pairs when consumed. `Array.from` builds an array from something iterable or array-like, meaning it supplies iteration or indexed values and a length. `Array.of` uses its arguments as elements, avoiding `Array(3)`'s special single-number length behavior. `Array.isArray` checks the array type. We will exercise these methods while keeping traversal and allocation visible.

### Demonstration 4 — Explore supplementary array methods and copying variants

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

In **Demonstration 4**, `a.at(-1)` reads the final 3, and forEach adds 1,2,3 into total 6. `[...a].reverse()` protects a by reversing a copy. The nested `flat(2)` example removes two levels, while flatMap turns each number into a two-entry group and flattens once. `copyWithin(1, 2)` copies the final pair into positions 1 and 2, yielding `[1,3,4,4]` without shortening the array. Spreading the iterators consumes all their results. Finally, `Array.of(3)` produces `[3]`, not an array of three holes.

### Copy at the correct depth

Let's follow references through more than one level. Adding an entry through an alias changes the original array because both names reach it. A shallow copy has separate membership but still shares the first record. Copying that record separates its own fields while leaving its nested `detail` reference shared. We will clone deeply only after observing those differences.

### Demonstration 5 — Trace shared records and independently cloned nested data

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

In **Demonstration 5**, `alias.push` makes the original length two while shallow stays length one. Writing `shallow[0].score = 9` changes the shared record, so original sees 9. Spreading each record lets records hold score 20 independently, but `records[0].detail.level = 7` still changes original's nested detail. `structuredClone` separates that supported nested data; setting deep's level to 99 no longer changes original's 7. The output tells us exactly which reference level each copy separated.

### Duplicate detection: baseline and memory trade-off

We will compare checking every distinct-position pair once with storing previously seen values. For finite numeric inputs, the two duplicate-existence functions agree. The Set version asks whether the current value belongs to the processed prefix, the entries already read. For general JavaScript values, specify equality carefully: Set treats NaN as equal to itself for membership, while the baseline's strict equality does not. We will also return a stable collection of distinct values using Set's insertion order.

### Demonstration 6 — Trade remembered membership for fewer duplicate checks

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

In **Demonstration 6**, `[8, 3, 8]` gives the pair baseline a repeated 8. On `[8, 3, 5]`, the Set version queries before each insertion, finds no previous match, and returns false. Empty input also returns false. Constructing a Set from `[8, 3, 8, 5]` keeps only the first occurrence of each value; spreading it produces `[8,3,5]`. Unlike the boolean functions, that final helper promises a collection, so include its returned array in storage accounting.

### Product of Array Except Self

For every output position, we need the product of all input entries except that position. The baseline recomputes almost the same multiplication repeatedly. We can instead write the product strictly before each position, then multiply by the product strictly after it. An empty side contributes 1, multiplication's identity: multiplying by it leaves a value unchanged. This avoids division and handles zeros without separate branches. Assume the numeric products remain representable and sufficiently precise for these calculations.

### Demonstration 7 — Combine strict prefix and suffix products without division

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

In **Demonstration 7**, `[2, 3, 4]` first receives prefixes `[1,2,6]`. The reverse loop multiplies by suffixes 1,4,12, giving `[12,8,6]`. Both loops use the accumulated product before including the current input value, which enforces “except self.” For `[2,0,4]`, only the zero's position excludes that zero, so the result is `[0,8,0]`. With two zeros every output includes one. A singleton has two empty sides and returns `[1]`; empty input returns `[]`.

### Best Time to Buy and Sell Stock: summarize earlier days

Let's implement the chronological stock problem with finite prices and a local zero-profit result for fewer than two days. The baseline explicitly chooses a buy day before a sell day. The optimized scan keeps only the earlier minimum and best completed profit, so each new candidate sale can be evaluated without searching all earlier days again.

### Demonstration 8 — Compare stock pairs with a running earlier minimum

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

In **Demonstration 8**, `[9, 3, 7, 2, 8]` starts cheapest at 9. The sale at 3 does not improve zero profit, then 3 becomes the minimum. Selling at 7 yields 4. Price 2 becomes the new minimum without erasing that profit, and selling at 8 yields 6. The update order evaluates a sale before admitting today's price as a future purchase. Decreasing prices and inputs with fewer than two entries correctly leave best at zero.

## Worked Examples

### Example 1: establish evidence while searching

Search for 6 in `[9, 2, 6]` and track the excluded prefix. At index 0, no earlier positions exist, so the invariant begins true. Comparing 9 with 6 fails, excluding index 0. Comparing 2 at index 1 fails too, excluding both earlier entries before the next iteration. Index 2 matches and returns 2. We performed three comparisons, but the requested answer is the zero-based position, not the comparison count.

If the target is absent, the index reaches length 3 after every valid position has been excluded. Returning −1 now follows from the invariant rather than guesswork. On empty input, there are no candidate positions to begin with, so the same return is justified without a special branch. A useful invariant explains these boundary cases through the same reasoning as the ordinary scan.

### Example 2: a dependent loop that is linear

With `n = 8`, doubling an outer width gives inner-loop lengths 1, 2, 4, and 8. Add those actual lengths to get 15; multiplying `8 × 4` would pretend every run had the maximum width. Pair enumeration instead has triangular work totaling 28. We will count both directly so you can compare two nested-loop structures whose accumulated work grows differently.

### Demonstration 1 — Count triangular pair checks and geometric inner work

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

In **Demonstration 1**, `countWork(8)` increments triangular for 7+6+5+4+3+2+1 checks, totaling 28. Geometric increments for widths 1,2,4,8 total 15. At 16, the outputs become 120 and 31. The geometric total roughly doubles when n doubles, while the pair total grows toward four times as much. Those counts explain the linear and quadratic classifications more reliably than the shared nested indentation.

### Example 3: deleting changes future positions

Start at index 0 of `[-1, -2, 3]` and delete −1. Now −2 has moved into the same index. If the loop advances, that unexamined negative is skipped. Scanning backward avoids the problem because deleting position `i` does not move any earlier position still waiting to be checked. We will use that correction first, while remembering that repeated deletions may still shift a long surviving suffix. A correct traversal is not automatically a linear one.

### Demonstration 2 — Remove negatives safely by visiting indexes backward

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

In **Demonstration 2**, `[-1, -2, 3]` first inspects 3, then removes −2, then removes −1, leaving `[3]`. The still-unread earlier indexes never move. On `[4, -1, 5, -2]`, deleting from the back retains 4 and 5 in order. Each splice can still move later survivors, so this fixes the skipped-entry bug without proving a linear worst-case time bound.

### Example 4: reuse products without including self

For `[2, 3, 4]`, the forward pass stores `[1, 2, 6]`. At index 1, prefix equals 2 because only index 0 has contributed. The reverse pass multiplies index 2 by 1, index 1 by 4, and index 0 by 12, producing `[12, 8, 6]`. The strict before-and-after regions exclude the current entry.

Update either running product **before** using it and the current value gets included, violating “except self.” Zero behavior follows from the same regions: with one zero, only that zero's own position can have a nonzero result. With two zeros, every result includes at least one of them. We do not need separate zero-handling code because the invariant already handles those cases.

### Example 5: a cheaper purchase does not erase an earlier profit

On `[9,3,7,2,8]`, initialize cheapest to 9 and best to 0. A sale at 3 loses money, so retain zero and then lower cheapest to 3. Selling at 7 earns 4. Price 2 gives no better sale, but it becomes an eligible cheaper purchase for later days. Selling at 8 earns 6, which improves best. We need both state values: the cheapest purchase says what future sales can use, while best remembers profitable transactions already completed.

Now try decreasing `[8,5,2]`. No later sale beats an earlier purchase, so the valid answer remains zero. Subtracting the global minimum from the global maximum would claim profit 6, but would require buying at the end and selling at the beginning. That is not an eligible transaction. Preserving chronology is therefore a correctness condition, not merely a choice of how to organize the scan.

## Visual Explanations

Draw references as arrows identifying objects. A shallow copy creates another outer array with its own row of element references; it does not automatically create another set of records. Follow each arrow in this diagram before deciding which edits are independent.

```text
original ──> array A ── index 0 ──> record R ──> detail D
alias    ──> array A
shallow  ──> array B ── index 0 ──> record R
records  ──> array C ── index 0 ──> record S ──> detail D
deep     ──> array E ── index 0 ──> record T ──> detail F
```

Adding or removing entries in array A does not change B's membership because those arrays are separate. Editing record R is visible through both arrays because they reach the same record. Even record S still reaches detail D, so editing D remains shared through S. Independence depends on where arrows stop sharing objects, not on how many different variable names or outer copies we created.

```text
input:          [2,  3, 4]
strict prefix:  [1,  2, 6]
strict suffix:  [12, 4, 1]
answer:         [12, 8, 6]

For output i, combine the region before i and the region after i.
The current position is excluded from both regions.
```

## Complexity Analysis

Read the table using `n` for input length and `k` for the length of a copied range. Callback costs are assumed constant unless discussed separately. Additional memory includes newly allocated result arrays except where we explicitly separate output from working storage. These assumptions let us connect each bound to the operation responsible for its work.

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

Apply the same accounting to supplementary methods. `some`, `every`, and backward searches may stop early, but their worst-case scan is O(n). A full forEach, reverse, or fill is linear. Copying variants need linear output storage. Concatenation counts copied entries; joining also counts the characters produced. Flattening must count visited nested entries and output, not just outer-array length. Creating an iterator does not mean all its work has happened: spreading `entries()` consumes it and processes the entire array.

For space, count stored data rather than variable names. One name referring to an n-entry copy still represents Θ(n) storage. A deep clone follows a data graph—the objects and references reachable from the starting value—whose total size may greatly exceed the outer length. Input storage exists already, so it is not newly allocated auxiliary space. For n returned products, say “Θ(n) output and O(1) working memory beyond output.” Calling the whole result constant-space would hide the array you return.

## Common Mistakes

Check operation contracts before debugging syntax. An inclusive scan bound reads beyond the last entry; when searching for `undefined`, that extra read can even manufacture a false success. Sorting numbers without a comparator gives text order. Assigning push's return back to an array variable replaces its reference with a numeric length. Each program may run, but it answers a different question because it misunderstood an operation's inputs, effects, or return value.

Let's deliberately delete while scanning forward to expose the shifted-entry mistake. This broken snippet has valid JavaScript syntax but an invalid traversal: after removing an entry, it advances past the value shifted into that position. Use it to diagnose the error rather than as a removal solution.

### Demonstration 1 — Broken forward deletion skips a shifted negative

```javascript-bug
const values = [-1, -2, 3];
for (let i = 0; i < values.length; i += 1) {
  if (values[i] < 0) values.splice(i, 1);
}
console.log(JSON.stringify(values));
```

In **Demonstration 1**, removing −1 from `[-1, -2, 3]` shifts −2 into index zero. The loop then advances to index one, reads 3, and finishes. Its output `[-2,3]` confirms the unread negative was skipped. The bug is the relationship between mutation and the next index, not the comparison that recognizes a negative.

Avoid three shortcuts in explanations: nested loops are not always quadratic, built-in calls are not automatically constant-cost, and shallow copies do not isolate all nested edits. Changing an array during a method's callback also requires reasoning about exactly which positions that method will visit. Prefer a clear loop with a stated invariant when a compact expression would hide multiple traversals or uncertain mutation behavior. Shorter source does not establish simpler work.

## Interview and LeetCode Pattern Recognition

Before choosing an algorithm, answer five questions: how is input size measured, what result is required, may the input change, what equality rule applies, and what happens when input is empty? Then build a simple correct baseline. Once its behavior is clear, identify work it repeats. An optimization should remove that repetition while preserving the answers to those five contract questions.

“Any duplicate” suggests remembered membership, which [Week 2](../week-02.md) develops. “Except this position” suggests combining contributions from the two sides. Removing in place while keeping order suggests the reader/writer approach in [Week 3](../week-03.md). Treat these as hypotheses requiring proof, not phrases that automatically select code. For example, a Set can reduce duplicate-search work, but its growing membership storage may violate a constant-space requirement.

In Product of Array Except Self, explain why dividing a total product is unsuitable: zeros break that shortcut, and the external task explicitly disallows division. In Contains Duplicate, distinguish the requested boolean existence answer from returning the earliest repeated value or collecting every repeated value. Similar titles can conceal different contracts. Name the exact answer before discussing how much faster your implementation is.

## Practice Exercises

### Conceptual

1. Use constants and a threshold to explain why `3n + 7` belongs to Θ(n), O(n²), and Ω(n). Explain separately why Omega does not identify the best input case.
2. Draw an array containing a record with a nested object. Predict which edits are shared through an alias, a shallow array copy, copied outer records, and a supported deep clone.
3. Classify all thirteen syllabus methods by whether they mutate, what they return, what they visit, and what output they allocate. Explain how a quadratic callback invalidates an assumed linear total estimate.

### Tracing

4. Search `[2, 5, 5]` first for 5 and then for 8. Record each index, comparison, and excluded prefix, explaining why a successful return stops before a later duplicate.
5. For `n = 4`, count the triangular inner work and the work whose inner length doubles. Compare both with a doubling outer loop that always performs four inner iterations.
6. Write the strict prefix products and strict suffix products for `[3, 0, 2]`. Keep the current value out of both regions before multiplying them together.

### Debugging

7. Repair **Demonstration 1** in **Common Mistakes** using both backward deletion and linear compaction. Explain why both are correct but their worst-case movement costs differ.
8. Explain the missing return in `values.map(x => { x * 2; })`, the default order when sorting `[2, 10]`, and the shared object references created by `Array(3).fill({ count: 0 })`.

### Implementation

9. Rebuild first-index search and stable duplicate removal without looking at the solutions. State the equality rule and empty-input result before coding either function.
10. Write prefix/suffix products without division. Test empty and singleton arrays, negative values, one zero, and two zeros; compare with a pair-loop baseline on small inputs.
11. Create your own method laboratory with different values. Exercise every syllabus method and at least four supplementary methods. Whenever a method mutates, print both its result and the receiver afterward.

### External

The upstream assignment includes Contains Duplicate, Best Time to Buy and Sell Stock, and Product of Array Except Self. The other exercises build the reasoning these tasks need: contracts, traversal, reference behavior, and cost accounting. For each external task, explain the baseline before presenting the reused-state optimization.

12. [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** visiting array entries, enumerating pairs, and Set membership. **Relevance:** compare the quadratic pair baseline with an expected-linear solution that remembers earlier values. Explain the baseline's work first, then justify the extra memory used by the improvement.
13. [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** arrays, accumulated prefix/suffix products, and output-space accounting. **Relevance:** reuse partial multiplication results instead of rebuilding each answer. Derive why each running product excludes the current position before coding; a correct baseline is a useful first result.

14. [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** visiting days chronologically, retaining an earlier minimum, and remembering completed profit. **Relevance:** replace repeated earlier-day searches with one numeric summary. Trace `[9,3,7,2,8]`, explain why sorting destroys eligibility, implement baseline and optimized scans, and compare their behavior on decreasing prices.

## Hints and Worked Solutions

### Hints to try before reading the answers

For 1–3, keep mathematical bounds separate from input cases, and draw arrows for references instead of duplicating object text. For 4–6, write state **before** its update so you can check which positions it describes. For 7, a separate destination index can protect unread input. For 8, remember that braces make an arrow body a block requiring return. For 9–13, begin with a tiny revealing counterexample rather than immediately adding more conditions.

### Solutions 1–6

For question 1, choose threshold one. For `n ≥ 1`, the inequalities `3n ≤ 3n + 7 ≤ 10n` establish both linear bounds and therefore Theta, including Omega. Since `n ≤ n²` at those sizes, a quadratic upper bound also holds, although it tells us less. Nothing in these inequalities selects an input case. We could be bounding a best-, worst-, or average-case cost function after choosing which one to study.

For question 2, an alias reaches the same outer array. A slice creates independent outer membership but shares referenced elements. Spreading each record separates its own fields while copying references to its nested objects. A supported deep clone separates that copied graph too. For question 3, push/pop/shift/unshift/splice/sort mutate; the other seven syllabus methods do not themselves change the receiver. Use **Demonstrations 2–4** in **JavaScript Implementations** and the complexity table to check returns and costs. Still inspect predicates and accumulator callbacks, which may introduce their own mutations or extra work.

For question 4, search checks 2 and then 5, returning index 1 before reaching the second 5. Searching for 8 checks all three entries and returns −1. For question 5 at `n = 4`, triangular work is `3 + 2 + 1 = 6`, doubling-dependent work is `1 + 2 + 4 = 7`, and a fixed four-iteration inner loop across those same outer values gives `4 + 4 + 4 = 12`. For question 6, `[3, 0, 2]` has strict prefixes `[1, 3, 0]` and suffixes `[0, 2, 1]`, giving `[0, 6, 0]` after multiplication.

### Solutions 7–8: linear removal and callback mistakes

To remove negatives in linear time, let writer identify the next retained-output slot while reader examines the original entries. Writer never overtakes reader, so writing a survivor cannot erase unread input. Only truncate once all reads finish. This preserves the relative order of nonnegative values and avoids repeatedly shifting suffixes. We will also repair the callback and shared-fill mistakes in the same small laboratory.

### Demonstration 1 — Compact negatives safely and create independent records

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

In **Demonstration 1**, `[-1, -2, 3]` skips both negatives, copies 3 into slot zero, then truncates to length one. Each entry is read once and at most n survivors are written, giving Θ(n) time and O(1) auxiliary space. Backward splice is correct too, but may repeatedly shift survivors.

The repaired map callback explicitly returns `x * 2`; without return, each mapped result would be `undefined`. Default sort compares text, so use a numeric comparator for numeric order. Finally, fill evaluates its object argument once, whereas `Array.from` invokes the factory for every entry. Here editing independent's first record leaves the other two counts at zero because they are distinct objects.

### Solutions 9–13: evaluate the explanation as well as the result

Use **Demonstrations 1, 6, and 7** in **JavaScript Implementations** as the complete search, Set deduplication, and prefix/suffix solutions. Rebuild them from their contracts, then explain every state variable. Products for `[-2, 3, 4]` are `[12, -8, -6]`; for `[0, 0]`, both are zero. Empty input returns an empty output, and a singleton returns `[1]` because each excluded side has empty product one. External constraints may exclude those inputs, but our local functions deliberately define their behavior.

Your method laboratory should make result contracts visible: splice returns removed entries, push returns a length, and slice returns a new shallow array. Also demonstrate a nested record edit through a slice that remains visible in the original. Before external submission, compare baseline and optimized results on small inputs under the same equality and numeric assumptions. Those local comparisons establish useful evidence; this chapter does not claim any external judge submission.

### Solution 14: preserve chronology

For a fixed sale day, ask which eligible earlier purchase can maximize profit. Only the cheapest matters. **Demonstration 8** in **JavaScript Implementations** gives both complete stock solutions. Its trace earns 4 at price 7, remembers that profit while 2 becomes the new minimum, and then earns 6 at price 8. The baseline considers n(n−1)/2 buy/sell candidates; the optimized scan evaluates n−1 sales. Both use constant auxiliary state. Correctness also requires zero for decreasing prices and no transaction whose sale precedes its purchase.

## Sources and Further Reading

The repository's [curriculum](../../../shared/curriculum.js) and [Weeks 1–4 textbook material](../../../shared/textbook/weeks01to04.js) define this archived chapter's original scope. The preparation record also credits a user draft for emphasizing complexity, traversal, mutation, and the final checklist; that historical input was not edited or moved. The teaching develops the syllabus through explanations, traces, examples, and exercises. These source notes retain original preparation history rather than reporting new external research during restyling.

- [MDN Array reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array): original preparation used this reference for copy semantics and method vocabulary. It does not guarantee the engine-specific cost estimates assumed in interview models.
- [MDN structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone): the preparation notes cite this for supported deep cloning, circular references, and failures on unsupported data. Check support for your data rather than assuming every value can be cloned.
- [CS50 Algorithms notes](https://cs50.harvard.edu/x/2024/notes/3/): original preparation identified these as further algorithm-analysis reading. They were not the source of this chapter's JavaScript implementations.
- The three LeetCode pages linked in Practice Exercises were checked during preparation for their statements and difficulties. That work used no editorials and included no judge submissions.
- [Upstream Week 1](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/01.md): the original notes report a GitHub connector fetch to reconcile assignments, including Stock. The upstream prose was not copied into the chapter.

The original preparation record dates external URL verification to 7 November 2026. This rewrite preserves that history without claiming to have verified those links again. The explanations primarily use the canonical local syllabus and independently derived reasoning. Runtime measurements, every possible engine representation, and a full account of JavaScript serialization remain outside this archived chapter's scope.

## Weekly Summary

You now have a repeatable way to explain code: define its promised behavior, say what the state means, trace updates, and count the work those updates request. An array method may fit on one source line while still visiting many entries and allocating results. References explain which copies share nested edits. Keep the mathematical distinction clear too: bounds describe growth, while cases select the inputs whose cost function we analyze.

The common improvement in our first optimizations is remembered evidence. A Set keeps earlier membership instead of searching for it again. Prefix/suffix products preserve multiplication instead of rebuilding it for every output. Both improve time by choosing a useful summary of prior work. Continue to [Week 2 — Hash Maps and Sets](../week-02.md) to study that memory trade-off and the equality rules behind the collections.

## Weekly Progress Checklist

### Theory

- [ ] I can explain O, Ω, and Θ as growth bounds and separately select best, average, or worst input cases. <!-- checkpoint:w1-bounds-and-cases -->
- [ ] I can count consecutive scans, triangular pairs, geometric inner lengths, and logarithmic counter changes. <!-- checkpoint:w1-dependent-loop-costs -->
- [ ] I can distinguish costs spread over an operation sequence from costs averaged using probabilities. <!-- checkpoint:w1-amortized-growth -->
- [ ] I can report already-existing input, newly returned output, and extra working storage separately. <!-- checkpoint:w1-space-accounting -->

### JavaScript

- [ ] I can explain both receiver changes and return contracts for every syllabus array method. <!-- checkpoint:w1-array-method-contracts -->
- [ ] I can trace shared references through aliases, shallow copies, copied records, and supported deep clones. <!-- checkpoint:w1-reference-copy-depth -->
- [ ] I can write a scan within valid bounds and remove entries in place while preserving survivor order. <!-- checkpoint:w1-scan-and-removal -->
- [ ] I can combine strict prefix and suffix products while excluding the current entry and avoiding division. <!-- checkpoint:w1-prefix-suffix-products -->

### Practice

- [ ] I attempted and checked the conceptual, tracing, debugging, and implementation exercises. <!-- checkpoint:w1-local-practice -->
- [ ] I attempted Contains Duplicate and explained how remembered membership trades extra storage for fewer checks. <!-- checkpoint:w1-contains-duplicate-practice -->
- [ ] I attempted Product of Array Except Self and checked inputs with one zero and two zeros. <!-- checkpoint:w1-product-practice -->
- [ ] I implemented Stock using an earlier running minimum and explained why buy/sell chronology is preserved. <!-- checkpoint:w1-stock-running-minimum -->

### Reflection

- [ ] I recorded an incorrect prediction and explained how a precise state invariant corrected my reasoning. <!-- checkpoint:w1-reflect-on-error -->
- [ ] I can explain one reused-state optimization aloud, including its contract and costs, without reading the implementation. <!-- checkpoint:w1-explain-optimization -->
