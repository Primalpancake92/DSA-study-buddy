# Week 1 - Introduction to Algorithm Complexity

An algorithm can be correct on three values and still become impractical on three million. This chapter teaches you to predict that change before running a large experiment. You will turn small JavaScript traces into operation counts, then turn those counts into precise statements about growth. No previous knowledge of logarithms or mathematical proofs is assumed.

Work through the fifteen lessons in order. You need variables, functions, comparisons, conditionals, and basic loops. Arrays appear only as generic sequences of input values: their length tells us how much input exists, and an index identifies a position. Array methods and copying techniques belong in the separate [Arrays module](week-17.md).

Use the independent assessment and final weekly progress checklist to record what you can explain without the answers. You will learn to justify a growth claim from actual code, rather than treating a familiar notation as a substitute for reasoning.

Every fenced JavaScript example is independent, uses small bounded inputs, and requires no packages in a current Node.js runtime. Its immediately following output block shows the exact console output. Predict that output before running the example. Counting examples count named events rather than measuring milliseconds. Answers to lesson prompts, exercises, and assessment appear in **Hints and Worked Solutions**, which the study interface can collapse. Attempt each question before opening it.

## Introduction to algorithms and algorithm analysis

An **algorithm** is a finite, unambiguous procedure for solving a specified problem. Its contract describes valid inputs and the required result. “Find a value” is incomplete: do we return its position, return a boolean, or report every occurrence? A clear contract lets us establish correctness before discussing speed. A fast procedure that returns the wrong answer is not an improvement.

Imagine checking numbered seats for a lost notebook. Looking at every seat in order is an algorithm. If you inspect one seat each step, twice as many seats can require twice as many inspections. That relationship is the beginning of analysis. **Algorithm analysis** models resource use as a function of input size, usually time or memory. It describes scaling under explicit assumptions, rather than predicting an exact elapsed duration on every computer.

Separate three questions: Does the procedure terminate? Does it produce the specified answer? How much work can it require? For a search that advances one position each iteration, the remaining unchecked positions decrease, establishing termination. Correctness requires that a reported position really matches and that failure is reported only after all candidates are excluded. Complexity counts how many candidates may be examined.

As a first worked trace, searching for 8 in `[4, 8, 2]` examines 4 and then 8. It performs two value comparisons and stops. Searching for 7 examines all three. The same algorithm has different counts on different inputs of equal size. We will formalize that distinction later.

**Misconception:** a shorter program necessarily uses less work. One function call can hide a complete traversal. **Try it:** describe a procedure for finding a missing target, including its termination condition, required result, and one operation worth counting. Explain why source-code length does not answer the resource question.

## Elementary operations

Choose a **cost model**: a set of actions treated as fixed-cost units. Here, reading a known input position, assigning a scalar, comparing bounded numbers, and adding bounded numbers each take constant time. Constant time does not mean exactly one nanosecond; the modeled cost does not grow with input length.

Counting selected events is often clearer than counting every language action. In a search, count equality comparisons. In pair enumeration, count pair visits. An exact count must name its event: “three comparisons” and “three total operations” make different claims. Loop tests, counter updates, and setup still exist when our selected-event counter omits them.

Here the counted event is evaluating `values[i] > 0`. The counter is instrumentation: it observes the event but is not part of the original task's required result.

```javascript
function countPositiveChecks(values) {
    let checks = 0;
    let positives = 0;
    for (let i = 0; i < values.length; i += 1) {
        checks += 1;
        if (values[i] > 0) {
            positives += 1;
        }
    }
    console.log(checks, positives);
}
countPositiveChecks([-2, 5, 0]);
countPositiveChecks([]);
```

```output
3 1
0 0
```

The first trace tests −2, 5, and 0; exactly one passes. Empty input performs no predicate evaluations, although entering the function and checking its loop condition still costs something. This distinction explains constant terms in running-time functions.

The model has limits. Arithmetic on arbitrarily long integers depends on their bit lengths. Printing long text depends on its length and the output device. For these small numeric examples, treat a printed item as one output event; that is not a universal guarantee about console performance. **Try it:** identify two actions omitted from the `checks` counter, and explain why their omission does not make the predicate count incorrect.

## Understanding input size n

The symbol **n** names a measure of input size. It is not automatically the numerical value of an argument. For a sequence, n commonly means entry count. For text, it might mean characters or encoded bytes. For a graph, two parameters—vertices and edges—often communicate more than one. State the measure before writing a complexity expression.

Consider `[900, 3, 12]`: its length is three, even though its largest value is 900. A full scan has three visits. Replacing 900 with 9000 adds no visits under our bounded-number model; adding a fourth entry does. Length is therefore useful for this analysis.

A numeric input needs special care. A loop from 1 through an integer N performs N iterations, but encoding N in binary needs only about `log₂ N` bits. A procedure linear in the numeric value can be exponential in its encoding length. Our counting laboratories sometimes use n as a loop limit; they explicitly measure that limit rather than claiming a bit-complexity result.

Two independent sequences of lengths n and m need separate parameters. Inspecting every cross-sequence pair takes nm visits, not necessarily n². Calling both sizes n assumes they grow together. If one length is fixed at three, the work is 3n and grows linearly in the other length.

**Worked trace:** matching each of two candidate names against each of five allowed names creates ten comparisons when all pairs are checked. Three candidates create fifteen. **Misconception:** input size means the biggest number seen. **Try it:** choose size measures for a document search, a sequence search, and comparing every student in one class with every student in another. State assumptions about item lengths.

## Deriving the running-time function T(n)

**T(n)** denotes work for inputs of size n under a stated model and case. It may count selected events or weighted elementary operations. Start with code, identify repetition, and add the parts. Simplify only after obtaining a defensible count.

For a loop starting at zero, testing `i < n`, advancing by one, and never returning early, there are n body executions, n counter updates, and n + 1 condition evaluations. The extra check is the failed test that exits. At n = 3, the condition is checked with i equal to 0, 1, 2, and 3; the body runs only for the first three values.

Start with ordinary linear search before adding any instrumentation:

```javascript
function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
    }

    return -1;
}

console.log(linearSearch([3, 6, 9], 6));
console.log(linearSearch([3, 6, 9], 12));
console.log(linearSearch([], 12));
```

```output
1
-1
-1
```

For the missing target, list what actually executes rather than counting source lines:

| Event                              | Executions on an absent target |
| ---------------------------------- | ------------------------------ |
| Initialize i                       | 1                              |
| Test the loop condition            | n + 1                          |
| Compare an element with the target | n                              |
| Increment i                        | n                              |
| Execute the inner return           | 0                              |
| Execute the final return           | 1                              |

If each listed event costs one unit, this particular bookkeeping gives `3n + 3`. We bundled the indexed read into the comparison and the length read into the loop test; another model could charge those separately. The inner return is **not** executed n times merely because it appears inside the loop. It executes once when a match is found, or not at all when the target is absent. For 100 entries and an absent target, there are 100 element comparisons. The final failed loop test is a different kind of comparison and is not counted as an element comparison.

Suppose a simplified scheme instead charges seven units for setup and completion, plus three per entry. Then `T(n) = 3n + 7`. At n = 0 the cost is seven; at n = 1 it is ten; at n = 4 it is nineteen. This is an **illustrative cost model**, not the exact count for the supplied linear-search code and not a claim about a JavaScript engine's machine-instruction count. The fixed overhead changes between schemes, but both functions have linear growth.

The following laboratory evaluates that formula with an explicit three-event body. It illustrates fixed and repeated contributions.

```javascript
function modeledWork(n) {
    let units = 7;
    for (let i = 0; i < n; i += 1) {
        units += 1;
        units += 1;
        units += 1;
    }
    return units;
}
console.log(modeledWork(0));
console.log(modeledWork(1));
console.log(modeledWork(4));
```

```output
7
10
19
```

Two reasonable accounting conventions can yield `3n + 7` and `8n + 12` while agreeing on linear growth. **Misconception:** deriving T(n) means immediately discarding constants. Preserve the evidence first; simplify when discussing growth classes. **Try it:** derive a function for four setup events, two events per repetition, and one final event. Evaluate it at n = 0 and n = 3.

## Growth families

A **growth family** groups functions with comparable long-run behavior. Ask how much extra work appears when input grows. Constant work stays bounded. Linear work roughly doubles when n doubles. Quadratic work roughly quadruples. Logarithmic work gains only a fixed number of steps when n is multiplied by a fixed factor.

| Family       | Representative | Counting situation                 | At n = 8 and n = 16   |
| ------------ | -------------- | ---------------------------------- | --------------------- |
| Constant     | 1              | Inspect one known position         | 1, 1                  |
| Logarithmic  | log₂ n         | Repeatedly halve a region          | 3, 4                  |
| Linear       | n              | Inspect every entry                | 8, 16                 |
| Linearithmic | n log₂ n       | About log₂ n rounds of n work      | 24, 64                |
| Quadratic    | n²             | Visit every ordered pair           | 64, 256               |
| Cubic        | n³             | Visit every ordered triple         | 512, 4096             |
| Exponential  | 2ⁿ             | Explore all binary choice patterns | 256, 65536            |
| Factorial    | n!             | Enumerate every ordering           | 40320, 20922789888000 |

These are representative values, not benchmarks. For fixed polynomial degree k, exponential growth eventually exceeds nᵏ. Factorial growth eventually exceeds any fixed-base exponential. “Eventually” matters: startup costs and coefficients can reverse comparisons at small sizes.

A **logarithm** asks how many factors of a base produce a number. Since `2³ = 8`, `log₂ 8 = 3`. Halving 8 gives 4, then 2, then 1: three halvings. For non-powers of two, rounding depends on the stopping condition. Different fixed logarithm bases differ by a constant factor, so they share an asymptotic family.

**Worked comparison:** n² events means 10000 at n = 100, whereas 1000n means 100000. The quadratic count is smaller there. At n = 10000, they become 100000000 and 10000000. **Misconception:** the better eventual family always wins immediately. **Try it:** predict the effect of doubling n for constant, linear, quadratic, and exponential functions. Explain why asymptotic ranking does not replace measurement for a specific small workload.

## Big O upper bounds

**Big O** states an eventual upper bound up to a positive constant multiplier. Formally, `T(n) ∈ O(g(n))` if positive constants c and n₀ exist such that `0 ≤ T(n) ≤ c g(n)` for every n ≥ n₀ in the size domain. Constants must be independent of n. Think of c g(n) as a ceiling remaining above the cost after a starting point.

For `T(n) = 3n + 7`, take c = 10 and n₀ = 1. Since 7 ≤ 7n for n ≥ 1, `3n + 7 ≤ 10n`. This proves O(n). Checking n = 1 gives equality; increasing n makes the seven easier to absorb. The proof covers all later sizes, not merely a few observations.

The same function is O(n²): for n ≥ 1, `3n + 7 ≤ 10n ≤ 10n²`. This is true but less informative. Upper bounds need not be tight. Give the strongest justified conventional description and name the case, such as “worst-case Θ(n), hence O(n).”

Big O does not inherently mean worst case. You can upper-bound a best-case function, worst-case function, or defined expected-cost function. Specify which function you are bounding. One comparison on a particular search input does not invalidate a linear worst-case bound.

**Misconception:** choosing c = n makes any function constant. That multiplier is disallowed because c must remain fixed as n varies. **Try it:** find c and n₀ proving `5n + 2 ∈ O(n)`. Explain why two small timings cannot prove the definition.

## Big Omega lower bounds

**Big Omega** gives an eventual lower bound up to a positive constant multiplier. Write `T(n) ∈ Ω(g(n))` when positive c and n₀ exist such that `0 ≤ c g(n) ≤ T(n)` for every n ≥ n₀. Picture a floor beneath the selected cost function.

For `3n + 7`, c = 3 and n₀ = 1 work because `3n ≤ 3n + 7`. Thus it is Ω(n). It is also Ω(1), but the linear lower bound says more about growth.

Be precise about what receives the bound. A full scan that always visits n entries has an Ω(n) visit count on every length-n input. Early-return search does not require n comparisons on every input. Its **worst-case comparison function**, however, has an Ω(n) bound because a missing target forces n comparisons. That is a lower bound on a chosen function, not a statement that every execution is linear.

A lower bound on a whole problem needs further reasoning. For an unsorted sequence with no extra information, membership may require inspecting every entry: an uninspected entry could contain the target. This depends on the access model and assumptions. Sorted input supplies information permitting a different algorithm.

**Worked trace:** a missing target in `[2, 4, 6, 8]` forces a scan to rule out four candidates. Skipping the last position cannot distinguish this sequence from one whose final value matches. **Try it:** prove `5n + 2 ∈ Ω(n)` and explain why “Omega means the first element matches” confuses bounds with cases.

## Big Theta tight bounds

**Big Theta** bounds a function above and below by positive multiples of the same reference function after a threshold. Formally, `T(n) ∈ Θ(g(n))` if positive c₁, c₂, and n₀ exist such that `0 ≤ c₁g(n) ≤ T(n) ≤ c₂g(n)` for all n ≥ n₀. It combines O and Ω bounds.

Think of two rails enclosing a cost curve. The curve need not coincide with n, and the distance between the rails can grow. Fixed multiples of n must contain it. For `3n + 7`, the preceding bounds use the same reference n and establish Θ(n).

For `n² + n`, n² is a lower bound and 2n² is an upper bound when n ≥ 1, since n ≤ n² there. Thus the function is Θ(n²). The linear term remains in the exact count but no longer determines the growth family. Similar reasoning applies to polynomials of fixed degree with positive leading coefficients.

Theta does not mean average case. A full traversal may have best, worst, and average costs all in Θ(n). A short-circuit search has a constant best-case function and linear worst-case function. Both admit tight bounds of their own.

**Misconception:** any known upper and lower bounds prove Theta. Knowing Ω(n) and O(n²) leaves a gap; many functions fit between them. **Try it:** bound `2n² + 3n + 1` using multiples of n² for n ≥ 1. Supply actual constants, then distinguish its exact expression from its tight family.

## Constants and thresholds

Constants allow vertical scaling; **n₀** marks where the inequalities must begin holding. Neither may change with n. A threshold excludes a finite initial region, but every later size still needs coverage. Think of choosing two rails once, then showing that the entire remaining cost curve stays between them.

For `T(n) = 3n + 7` and `g(n) = n`, choose **c₁ = 3, c₂ = 10, n₀ = 1**. For every integer n ≥ 1, `3n ≤ 3n + 7`. Also n ≥ 1 implies `7 ≤ 7n`, so `3n + 7 ≤ 3n + 7n = 10n`. Consequently `0 ≤ 3n ≤ 3n + 7 ≤ 10n` throughout the required domain, proving Θ(n).

| n   | c₁n = 3n | T(n) = 3n + 7 | c₂n = 10n | Both bounds hold?  |
| --- | -------- | ------------- | --------- | ------------------ |
| 0   | 0        | 7             | 0         | No: 7 ≤ 0 is false |
| 1   | 3        | 10            | 10        | Yes                |
| 2   | 6        | 13            | 20        | Yes                |
| 5   | 15       | 22            | 50        | Yes                |
| 10  | 30       | 37            | 100       | Yes                |

With those constants, **n₀ = 0 fails**: the upper bound at zero requires seven to be at most zero. No finite c₂ makes `7 ≤ c₂ × 0` true. This does not contradict Θ(n); the definition requires some valid threshold, and one works. Empty input can be meaningful operationally even when a growth proof starts at one.

Constants still matter in engineering. A linear algorithm with expensive per-item work can lose to a quadratic algorithm on a small bounded workload. Analysis identifies scaling risks; profiling helps choose implementations for actual conditions. **Misconception:** the threshold is a guarantee about when one real implementation becomes faster than another. It only establishes the stated mathematical inequalities. **Try it:** retain c₁ = 3, replace c₂ with 4, and find the smallest integer threshold. Explain why the inequalities prove more than the table alone.

## Best worst and average cases

For fixed n, **best-case cost** is the minimum over valid inputs of that size; **worst-case cost** is the maximum. **Average-case cost** is an expectation under a stated probability distribution. Choose a case first, then bound its function.

For nonempty linear search, count target comparisons. Best case is one when the first entry matches. Worst case is n when the target is last or absent. A successful-search average requires an explicit model: assume the target is present exactly once and its position is **uniformly distributed across all n positions**. Each has probability 1/n, so

`E[C(n)] = (1 + 2 + ... + n)/n = [n(n + 1)/2]/n = (n + 1)/2`.

For n = 4, possible counts are 1, 2, 3, and 4, with mean 2.5. An average need not be an integer although individual counts are integers. The expectation is Θ(n): halving a linear function preserves its family.

If absence has probability p and otherwise the successful position is uniform, expectation becomes `pn + (1 − p)(n + 1)/2`. Other distributions change the formula. If the first position is always requested, average successful cost is one. “Average input” is not a complete mathematical assumption.

Empty input requires zero target comparisons, so our best-case statement explicitly restricts n ≥ 1. **Misconception:** average always means halfway between minimum and maximum. That happens here because of the uniform model. **Try it:** compute expected comparisons for n = 3 when positions 0, 1, and 2 have probabilities 1/2, 1/4, and 1/4. Write the weighted sum first.

## Time versus space

**Time complexity** describes work; **space complexity** describes storage. State what you include. Input storage exists before the function starts. Auxiliary space is additional working storage; output space holds the required result. Some conventions include output in auxiliary space, so separate them explicitly when needed.

A scan can take Θ(n) time with Θ(1) auxiliary space because it retains only a few counters regardless of length. An n-entry result occupies Θ(n) output space even if one variable names it. Space counts retained information, not variable names or assignments executed.

For example, a running sum updates one scalar n times. Peak auxiliary space stays constant. Retaining all n partial sums stores n numeric values. Both procedures can take linear time, but their storage differs. Keeping history may be justified when it is required output; otherwise it stores information the contract does not require.

Count **peak simultaneous storage**, not total allocation events across the execution. Recursive calls also consume stack frames. A depth-n recursion with constant-size frames uses Θ(n) stack space, even without an explicit collection. Our iterative search below retains only a few scalars.

Printing n items needs n output events without retaining all items in the algorithm's own memory. We exclude console buffers and runtime infrastructure from auxiliary-space claims. **Worked accounting:** n input numbers, two counters, a running total, and a scalar result mean Θ(n) input storage, Θ(1) auxiliary storage, and Θ(1) result storage under fixed-size numeric assumptions. **Misconception:** linear time forces linear extra memory. **Try it:** explain why n successive counter updates do not imply Θ(n) space.

## Counting loops and sequential operations

Add sequential work; sum dependent repetition counts. Two complete scans perform `n + n = 2n` visits, giving Θ(n). A scan followed by all ordered pairs performs `n + n²`, giving Θ(n²). Multiply only when each outer execution repeats the same number of inner events, or a proven bound justifies it.

An n-iteration outer loop with three inner repetitions performs 3n events: nested but linear. For pairs with `j = i + 1`, inner counts are `n − 1, n − 2, ..., 0`. Their sum is `n(n − 1)/2`, quadratic despite shrinking inner work. This counts unordered pairs of distinct positions, unlike n² ordered pairs including self-pairs.

Now let an outer width grow through 1, 2, 4, and so on through n. If inner work equals width, the sum is `1 + 2 + ... + 2ᵏ`, with 2ᵏ ≤ n < 2ᵏ⁺¹. The sum `2ᵏ⁺¹ − 1` is at least n and less than 2n for positive integer n, giving Θ(n). If every outer iteration instead processes n items, total work is Θ(n log n).

```javascript
function loopCounts(n) {
    let triangular = 0;
    let geometric = 0;
    for (let i = 0; i < n; i += 1) {
        for (let j = i + 1; j < n; j += 1) {
            triangular += 1;
        }
    }
    for (let width = 1; width <= n; width *= 2) {
        for (let j = 0; j < width; j += 1) {
            geometric += 1;
        }
    }
    console.log(triangular, geometric);
}
loopCounts(4);
loopCounts(8);
```

```output
6 7
28 15
```

**Amortized analysis** bounds the total cost of a sequence, then divides by its length. Suppose an abstract process charges one unit per step, with maintenance at steps 1, 2, 4, 8, ... costing that step number. Across N steps, ordinary work is N and maintenance is less than 2N. Total work is less than 3N, so amortized cost is O(1), although an individual maintenance step can cost Θ(N). This deterministic argument requires no probability distribution.

**Misconception:** every nested loop is quadratic, or amortized means random average. Both ignore the actual sum. **Try it:** compare matching-width work with fixed-n inner work at n = 8. Explain why a constant amortized guarantee does not promise constant latency for every step.

## Worked JavaScript examples

These examples use the fixed-cost numeric and indexed-access model. A function's name does not establish its complexity: trace control flow and count events. Inputs are ordinary dense sequences; searching excludes preprocessing.

### One position: firstElement

The contract returns the first value, or `undefined` for empty input. Nonempty input requires exactly one indexed read regardless of length; empty input requires zero. There is always one emptiness check. Time, auxiliary space, and scalar result space are all Θ(1).

```javascript
function firstElement(values) {
    if (values.length === 0) {
        return undefined;
    }
    return values[0];
}
console.log(firstElement([7, 4, 9]));
console.log(firstElement([]));
```

```output
7
undefined
```

The trace checks length three, reads position zero, and returns 7; it never reads 4 or 9. **Misconception:** receiving n entries forces n work. **Try it:** predict indexed reads for a million-entry nonempty input.

### Every position: printElements

This contract prints every numeric value once, then returns the number of value-output events. There are n indexed reads, n value-print calls, n count increments, and n index updates. The condition is checked n + 1 times. Time is Θ(n + 1), conventionally Θ(n) for n ≥ 1. Auxiliary space is Θ(1), excluding console infrastructure. The caller's printing of the returned count is a separate output event.

```javascript
function printElements(values) {
    let count = 0;
    for (let i = 0; i < values.length; i += 1) {
        console.log(values[i]);
        count += 1;
    }
    return count;
}
console.log(printElements([2, 5, 8]));
console.log(printElements([]));
```

```output
2
5
8
3
0
```

Iterations use indexes 0, 1, and 2; a failed test at 3 ends the loop. **Try it:** distinguish the function's three value prints from the five console lines in the complete example.

### Every ordered pair: printPairs

This contract includes self-pairs and both orders. It executes n² pair-print calls, 2n² indexed reads, and n² count increments. Outer conditions are evaluated n + 1 times; inner conditions n(n + 1) times in total. Time is Θ(n²) for n ≥ 1. Two indexes and a counter use Θ(1) auxiliary space; streamed output contains n² pairs without storing an n²-entry result.

```javascript
function printPairs(values) {
    let count = 0;
    for (let i = 0; i < values.length; i += 1) {
        for (let j = 0; j < values.length; j += 1) {
            console.log(values[i], values[j]);
            count += 1;
        }
    }
    return count;
}
console.log(printPairs([2, 5]));
console.log(printPairs([]));
```

```output
2 2
2 5
5 2
5 5
4
0
```

The outer index stays zero as the inner visits zero and one, then becomes one and restarts the inner scan. **Try it:** count pair prints at n = 3 and explain why the triangular formula does not apply.

### Early stopping: linear search

Return the first matching position or −1, together with target comparisons. Each failed comparison excludes a position. Before iteration i, no earlier position matches; this **loop invariant** supports correctness. All cases use Θ(1) auxiliary space.

```javascript
function linearSearch(values, target) {
    let comparisons = 0;
    for (let i = 0; i < values.length; i += 1) {
        comparisons += 1;
        if (values[i] === target) {
            return { index: i, comparisons };
        }
    }
    return { index: -1, comparisons };
}
console.log(JSON.stringify(linearSearch([4, 8, 2], 8)));
console.log(JSON.stringify(linearSearch([4, 8, 2], 7)));
console.log(JSON.stringify(linearSearch([], 7)));
```

```output
{"index":1,"comparisons":2}
{"index":-1,"comparisons":3}
{"index":-1,"comparisons":0}
```

The first call stops before the last value; the second exhausts candidates. **Try it:** choose a best-case target and state its tight time bound separately from the worst-case bound.

### Halving candidates: binary search

Binary search requires input already sorted ascending. It checks the middle candidate and discards the half that cannot contain the target. This version returns any matching position, not necessarily the first duplicate. Its interval includes both low and high. Arithmetic midpoint calculation avoids bitwise conversion.

```javascript
function binarySearch(values, target) {
    let low = 0;
    let high = values.length - 1;
    let probes = 0;
    while (low <= high) {
        const mid = low + Math.floor((high - low) / 2);
        probes += 1;
        if (values[mid] === target) {
            return { index: mid, probes };
        }
        if (values[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return { index: -1, probes };
}
console.log(JSON.stringify(binarySearch([2, 4, 6, 8, 10, 12, 14], 12)));
console.log(JSON.stringify(binarySearch([2, 4, 6, 8, 10, 12, 14], 5)));
console.log(JSON.stringify(binarySearch([], 5)));
```

```output
{"index":5,"probes":2}
{"index":-1,"probes":3}
{"index":-1,"probes":0}
```

For 12, probe 8 at index 3, then search indexes 4 through 6 and probe 12 at index 5. For 5, probe 8, 4, and 6 before the interval becomes empty. Each probe makes at most two target comparisons; probe and comparison counts differ by only a constant factor.

After k unsuccessful probes, remaining candidates are at most n/2ᵏ. Worst-case probes for n ≥ 1 are at most `floor(log₂ n) + 1`, giving O(log n) as n grows. Some targets require logarithmically many probes, establishing worst-case Θ(log n). Best case is Θ(1), and auxiliary space is Θ(1). Preparing sorted input requires separate accounting. **Try it:** explain why unsorted input breaks correctness despite quick termination.

## Common misconceptions

Use these corrections to diagnose reasoning, rather than memorizing labels.

| Claim                             | Correction and counterexample                                        |
| --------------------------------- | -------------------------------------------------------------------- |
| Every nested loop is quadratic    | n outer iterations with three inner repetitions give 3n events.      |
| Two scans multiply                | Sequential scans add: n + n = 2n.                                    |
| Big O gives exact seconds         | Growth bounds depend on a model; hardware affects duration.          |
| Omega is best; Theta is average   | Cases select functions; bounds describe those functions.             |
| Constants never matter            | They affect actual workloads without changing tight growth families. |
| Few variables mean little storage | One reference may retain n result items.                             |
| An observed average is universal  | Expectations depend on the input probabilities.                      |
| Any loop is linear                | Repeated halving reaches one in logarithmically many steps.          |
| Amortized means random average    | A deterministic sequence bound can allow expensive individual steps. |
| O(n²) proves quadratic growth     | A linear function also satisfies that loose upper bound.             |

Name the event, input size, case, and storage convention before giving a label. If two answers disagree, compare those choices first. One person might count all ordered pairs while another counts only distinct unordered pairs; different contracts produce different formulas.

**Worked correction:** “It visits half the entries, so it is logarithmic” is wrong for a loop advancing by two. Its count is about n/2, still Θ(n). Repeatedly halving the remaining region produces logarithmic work; visiting every second position does not. **Try it:** correct “This search was fast on my example, so its worst case is constant” in one sentence.

## Practice exercises and module assessment

Keep solutions separate from the answer section. For every analysis, state size, counted operation, case, formula or bound, and auxiliary space where applicable. These tasks are independent of an external judge and require only this chapter.

### Lesson practice record

Complete each **Try it** prompt in lessons 1–14. Number them by lesson in your notes; label the five worked-example prompts 13a–13e. This fifteenth lesson's practice is the assessment below. Explanations matter more than bare labels.

### Beginner assessment

**B1.** Six setup events precede four selected events per input. Derive T(n), evaluate it at n = 0 and n = 5, and give a tight growth bound.

**B2.** A loop visits indexes 0 through n − 1. Count successful condition tests, failed tests, and body executions. Include empty input.

**B3.** For firstElement, printElements, and printPairs, give selected-event counts at n = 4, time families, and auxiliary-space families. Name the events.

**B4.** Trace linear search for 9 in `[3, 6, 9, 12]`. Record inspected positions and comparisons. What changes for target 5?

### Intermediate assessment

**I1.** Prove `6n + 4 ∈ Θ(n)` with positive constants and a threshold. Do those constants work at zero?

**I2.** One procedure scans n entries twice sequentially. Another has n outer iterations with inner indexes zero through i inclusive. Derive both body-event counts and families.

**I3.** A successful target is uniform across five positions. Compute expected linear-search comparisons. Recompute when the first position has probability 1/2 and the others each have probability 1/8.

**I4.** Trace binary search for 13 in `[1, 3, 5, 7, 9, 11, 13]`. Record low, high, and mid before each probe; give result, probe count, and auxiliary space.

### Advanced assessment

**A1.** Width doubles from 1 while width ≤ n. One inner loop performs width events; another version performs n events. Derive totals at n = 16 and justify families for general positive integer n.

**A2.** A process has one ordinary event per step and maintenance costing k at steps k = 1, 2, 4, 8, .... Bound total work over N steps. Distinguish worst individual, amortized, and expected cost without inventing probabilities.

**A3.** A task must print every ordered pair of n input values. Can O(n) time meet the contract under a one-event-per-pair output model? Give a lower bound and explain whether quadratic time forces quadratic auxiliary storage.

**A4.** Scan independent inputs of lengths n and m sequentially, then check every cross-input pair. Derive total selected events and a tight bound for n,m ≥ 1. Analyze m = 3 separately. What assumption permits Θ(n²)?

### Module completion standard

Beginner readiness means correct counts with named events. Intermediate readiness adds proofs, traces, and probability assumptions. Advanced readiness adds justified sums and distinctions between individual, sequence, and expected costs. Attempt each tier independently. After checking solutions, explain one correction in your own words and solve the same task with a different small input.

## Visual Explanations

The study interface's interactive complexity lab attaches here through the `visual-explanations` anchor. Use its growth comparisons to connect changing input size with the counts derived above. This chapter remains usable without the interactive interface: the growth table and traces supply the numerical reasoning.

Before changing input size, predict doubling behavior. Linear counts double, quadratic counts quadruple, and base-two logarithmic counts gain one. Compare at the same size and check whether displayed curves use raw or normalized counts. Visual steepness depends on axis scaling and does not prove an asymptotic bound.

For a paper version, draw columns for n = 2, 4, 8, and 16 and plot n and n². Next draw eight candidate positions for binary search. After each unsuccessful middle probe, cross out the impossible half. The picture explains how one probe excludes many candidates; the logarithm expresses repeated reduction mathematically.

## Hints and Worked Solutions

All exercise answers are collected here so the study interface can keep them collapsed. Read the relevant hint first, then cover the answer while retrying the question.

### Lesson hints

For lessons 1–4, write exactly what changes at each step and what stops execution. For lessons 5–9, identify the dominant term and find fixed constants bounding the remaining terms. For lessons 10–12, distinguish weighted expectations, peak storage, and deterministic repetition sums. For lesson 13, inspect actual bounds and return statements. For lesson 14, distinguish one observation from a claim about every growing size.

### Lesson answers

**1.** Inspect positions in order, return the first match's index, and return −1 after exhaustion. Count target comparisons. Advancing the index eventually empties the unchecked suffix. Source length does not determine execution frequency.

**2.** Condition checks and index increments are omitted. Every predicate evaluation is still counted once; the claim concerns a selected event rather than all work.

**3.** Use document characters and possibly query length for text search; entry count for bounded-number sequence search; separate class sizes n and m for cross-class comparisons. Variable-length names can add a further item-length cost. State when items have fixed size.

**4.** Four setup events, two per repetition, and one final event give `2n + 5`: five at zero and eleven at three.

**5.** Doubling n preserves a constant, doubles n, quadruples n², and multiplies 2ⁿ by 2ⁿ. For example, 2⁴ = 16 becomes 2⁸ = 256. Coefficients and overhead can reverse small-input rankings.

**6.** For n ≥ 1, `5n + 2 ≤ 7n`; c = 7 and n₀ = 1 work. Two timings do not establish an inequality for all later sizes and can reflect runtime effects outside the model.

**7.** Choose c = 5 and n₀ = 1 because `5n ≤ 5n + 2`. A first-position match selects a best-case input; Omega describes a lower bound on a selected function.

**8.** For n ≥ 1, `2n² ≤ 2n² + 3n + 1 ≤ 6n²`, since n ≤ n² and 1 ≤ n². Thus c₁ = 2, c₂ = 6, n₀ = 1 prove Θ(n²). The exact expression retains its smaller contributions.

**9.** The upper inequality becomes `3n + 7 ≤ 4n`, equivalent to n ≥ 7. The lower inequality always holds for nonnegative n. The smallest integer threshold is seven. Algebra covers every later size; a finite table cannot do that alone.

**10.** Expectation is `(1/2) × 1 + (1/4) × 2 + (1/4) × 3 = 7/4 = 1.75`. The distribution is not uniform, so the uniform formula is inapplicable.

**11.** Each update overwrites a counter's earlier value. Only one is retained, giving Θ(1) peak auxiliary space in the bounded-number model.

**12.** At eight, matching-width work is `1 + 2 + 4 + 8 = 15`; fixed-n work is `8 × 4 = 32`. Families are Θ(n) and Θ(n log n). Maintenance may be linear on a particular step despite linear total work across the sequence.

**13a.** A million-entry nonempty input still requires one indexed read. **13b.** Three value prints plus the caller's two count prints yield five lines. **13c.** At three, there are nine pair prints; starting every inner loop at zero prevents the triangular restriction. **13d.** Target 4 gives Θ(1) best-case time, while worst-case time is Θ(n). **13e.** Without sorted order, a middle comparison cannot justify excluding a half; the target could be discarded. Termination does not guarantee correctness.

**14.** A fast execution describes only that input; a constant worst-case claim must cover the most expensive valid input at every growing size, which missing targets defeat for linear search.

### Beginner solutions

**B1.** `T(n) = 4n + 6`, so T(0) = 6 and T(5) = 26. For n ≥ 1, `4n ≤ 4n + 6 ≤ 10n`, proving Θ(n).

**B2.** There are n successful tests, one failed test, and n body executions. At zero, the initial condition fails, leaving zero successful tests and executions.

**B3.** Count firstElement's indexed reads, printElements' value prints, and printPairs' pair prints. At four, counts are 1, 4, and 16. Time is Θ(1), Θ(n), and Θ(n²), respectively; each uses Θ(1) auxiliary space under the streaming-output convention. Counting all pair-function indexed reads instead gives 32 without changing the family.

**B4.** Target 9 inspects positions 0, 1, and 2, then returns index 2 after three comparisons. Target 5 inspects all four positions and returns −1 after four comparisons.

### Intermediate solutions

**I1.** Choose c₁ = 6, c₂ = 10, n₀ = 1. Then `6n ≤ 6n + 4 ≤ 10n`. At zero the upper inequality requires 4 ≤ 0, so the same proof cannot begin there.

**I2.** Two scans have 2n body events and Θ(n) growth. Inner counts 1 through n total `n(n + 1)/2`, giving Θ(n²). At four, counts are eight and ten; the formulas and inequalities justify the families beyond those examples.

**I3.** Uniform expectation is `(1 + 2 + 3 + 4 + 5)/5 = 3`. Altered expectation is `(1/2) × 1 + (1/8) × (2 + 3 + 4 + 5) = 9/4 = 2.25`.

**I4.** Before probes, `(low, high, mid)` is `(0, 6, 3)`, `(4, 6, 5)`, and `(6, 6, 6)`. Values are 7, 11, and 13. Return index 6 after three probes. Fixed scalar state gives Θ(1) auxiliary space.

### Advanced solutions

**A1.** At sixteen, widths 1, 2, 4, 8, and 16 give matching-width total 31 and fixed-n total 80. For general n, let k = floor(log₂ n). The first total is `2ᵏ⁺¹ − 1`, between n and 2n, giving Θ(n). The second is `n(k + 1)`, giving Θ(n log n) as n grows; the extra one accounts for n = 1.

**A2.** Ordinary work is N. Maintenance is `2ᵏ⁺¹ − 1 < 2N`, with k = floor(log₂ N). Total is between N and 3N, hence Θ(N), with Θ(1) amortized cost. The largest maintenance step exceeds N/2, so worst individual cost in the prefix is Θ(N). An expected-cost calculation needs a probability model that the question does not supply.

**A3.** Required output has n² pairs, forcing Ω(n²) time under the model. O(n) cannot suffice for unbounded n. Nested loops attain Θ(n²) while streaming with Θ(1) auxiliary state. Retaining every pair would instead add Θ(n²) output storage.

**A4.** Total selected events are `n + m + nm`. For positive sizes, `nm ≤ n + m + nm ≤ 3nm`, establishing Θ(nm). With m = 3 the expression is `4n + 3`, hence Θ(n). Writing Θ(n²) requires m to scale proportionally to n, such as m = n; the independent-input contract does not establish that.

## Sources and Further Reading

The explanations, traces, exercises, and JavaScript examples are original teaching material. These references offer established treatments and language documentation for further study. Their inclusion does not claim that pages were browsed or examples externally verified.

- [MIT OpenCourseWare: Introduction to Algorithms, 6.006](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/) — official course materials on algorithmic thinking, cost models, and asymptotic analysis. Extend the mathematical foundation after completing the beginner tasks.
- [OpenDSA](https://opendsa.org/) — open instructional resources with algorithm-analysis explanations and visual learning material. Look for growth rates, asymptotic bounds, and case analysis; module organization differs between editions.
- [MDN: Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration) — JavaScript loop behavior used in the counting examples.
- [MDN: Math.floor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor) — rounding used in binary-search midpoints.
- [MDN: Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) — numeric representation and background for the limits of a bounded-number cost model.

## Weekly Summary

Analysis begins with a contract, input-size measure, and counted operation. Derive an expression or justified sum before choosing a growth family. Sequential work adds; repeated work requires inspecting each repetition's bounds. Repeated multiplicative reduction yields logarithmic counts, while dependent loops may produce triangular or geometric sums.

O gives an upper bound, Ω a lower bound, and Θ matching bounds. Cases select the cost function; average cases require probabilities. Amortized guarantees can follow from deterministic sequence totals. Constants and thresholds make proofs precise, while time and peak auxiliary space answer different questions.

You are ready to apply this material when you can explain a count from a trace, defend a bound with fixed constants, and state the assumptions behind both. Carry those habits into later algorithms instead of memorizing a label for every code shape.

## Weekly Progress Checklist

### Theory

- [ ] I can define a contract, input size, and counted event. <!-- checkpoint:w1-analysis-foundations -->
- [ ] I can distinguish O, Ω, and Θ from best, worst, and average cases. <!-- checkpoint:w1-bounds-and-cases -->
- [ ] I can prove the 3n + 7 bounds and explain the failed zero threshold. <!-- checkpoint:w1-constants-thresholds -->
- [ ] I can derive sequential, triangular, geometric, and logarithmic counts. <!-- checkpoint:w1-dependent-loop-costs -->
- [ ] I can distinguish amortized cost from probabilistic average cost. <!-- checkpoint:w1-amortized-growth -->
- [ ] I can separate input, output, and peak auxiliary storage. <!-- checkpoint:w1-space-accounting -->

### JavaScript

- [ ] I can trace firstElement, printElements, and printPairs with named events. <!-- checkpoint:w1-counting-examples -->
- [ ] I can explain early termination and the linear-search invariant. <!-- checkpoint:w1-linear-search-analysis -->
- [ ] I can trace binary search and justify its sorted-input requirement. <!-- checkpoint:w1-binary-search-analysis -->

### Practice

- [ ] I attempted each lesson prompt before reading answers. <!-- checkpoint:w1-lesson-practice -->
- [ ] I completed the beginner assessment with explicit counts. <!-- checkpoint:w1-beginner-assessment -->
- [ ] I attempted intermediate proofs, traces, and expectation questions. <!-- checkpoint:w1-intermediate-assessment -->
- [ ] I attempted advanced sums, lower bounds, and two-size analysis. <!-- checkpoint:w1-advanced-assessment -->

### Reflection

- [ ] I recorded a mistaken prediction and the reasoning that corrected it. <!-- checkpoint:w1-reflect-on-error -->
- [ ] I can explain a complexity argument aloud without reading a solution. <!-- checkpoint:w1-explain-complexity -->
