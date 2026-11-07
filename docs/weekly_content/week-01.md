# Week 1 - Introduction to Algorithm Complexity
<!-- lesson-id:w1-section-chapter-introduction -->

Suppose your program gives the right answer for three values. What will happen when someone gives it three million? Correctness alone cannot tell you whether the program will finish in a useful amount of time. This week, we will learn to answer that second question by following small JavaScript examples one step at a time, counting their work, and explaining how those counts grow. You do not need to know logarithms or mathematical proofs yet; we will build those ideas as we use them.

Work through the fifteen lessons in order, with variables, functions, comparisons, conditional branches, and basic loops as your starting tools. When an array appears, you can read it simply as a sequence of input values. Its length tells us how many values we have, and an index is the number identifying one position. We will leave array methods and copying techniques to the separate [Arrays module](week-17.md), so you can concentrate here on explaining work.

Use the independent assessment and final weekly progress checklist to check what you can explain with the answers closed. The goal is to be able to point to the actions a program performs and defend a claim about their growth. Recognizing a notation is useful, but you also need to explain why it describes this particular program.

You can run each fenced JavaScript example on its own in a current Node.js runtime without installing packages. The inputs are deliberately small and bounded, and the next output block gives the exact console output. Predict those lines before running a demonstration: the difference between your prediction and the result often reveals the most useful lesson.

Our counters measure named events, such as comparing a value with a target, rather than milliseconds. Keep that distinction in mind whenever you read a count. Answers to the lesson prompts, exercises, and assessment live in **Hints and Worked Solutions**, which the study interface can collapse. Give yourself an honest attempt before opening that section.

## Introduction to algorithms and algorithm analysis
<!-- lesson-id:w1-section-introduction-to-algorithms-and-algorithm-analysis -->

An **algorithm** is a finite, unambiguous procedure for solving a specified problem. In everyday terms, it is a set of clear steps that eventually finishes and answers the question you actually asked. We describe that question with a **contract**: which inputs are allowed, and what result must be produced for them.

For example, “find a value” leaves several decisions open. Do you need its position, a boolean such as true or false, or every place it occurs? Settle that first. We can only judge correctness against a specified result, and making an incorrect answer arrive faster does not fix the problem.

Imagine looking for a notebook among numbered seats. You could inspect the seats in order until you find it or run out of seats. If you inspect one seat per step, doubling the number of seats can double the inspections you need. We have already started analyzing the procedure by connecting the amount of input to the work.

**Algorithm analysis** models resource use as a function of input size, usually time or memory. A function here is a rule connecting a size to a cost. We state the assumptions behind that rule so we can discuss scaling: how resource use changes as input grows. This does not promise an exact duration on every computer.

Keep three questions separate as you reason: will the procedure finish, will its answer meet the contract, and how much work can it require? To show **termination**, meaning that it finishes, notice that a search advancing one position per loop leaves fewer unchecked positions each time. Eventually there are none.

To show correctness, explain why any reported position really contains the target and why a failure result is possible only after every candidate has been ruled out. To analyze complexity, count how many candidates the search may inspect. These explanations support one another, but answering one does not automatically answer the others.

Let's **trace** a search, meaning follow its actions in order. To find 8 in `[4, 8, 2]`, we first compare 4 with 8, then compare 8 with 8 and stop. That is two value comparisons. Searching for 7 needs all three comparisons before we can report failure. Both inputs have three entries, yet their counts differ. Later, we will give precise names to these different cases.

**Misconception:** fewer lines of source code must mean less work. A single function call can visit an entire input; a longer-looking function might inspect just one position. Execution frequency is what matters.

**Try it:** describe how you would search when the target is missing. State when the procedure stops, what it returns, and one operation you would count. Then explain why counting written lines would not answer the resource question.

## Elementary operations
<!-- lesson-id:w1-section-elementary-operations -->

Before counting, choose what one unit of work means. This choice is a **cost model**: a set of actions we treat as having fixed costs. In this chapter, reading a known input position, assigning a scalar (a single value such as a number), comparing bounded numbers, and adding bounded numbers each take constant time. “Bounded” means their representation does not keep growing with the input we are measuring.

Constant time says that the modeled cost stays independent of input length. It does not say an action takes exactly one nanosecond, or that all constant-time actions take equal time on real hardware.

You will often get a clearer argument by counting one meaningful event instead of every action in the language. For a search, that might be an equality comparison; when listing pairs, it might be a visit to one pair. Always name the event. “Three comparisons” is a narrower claim than “three total operations.” Setup, loop-condition tests, and counter updates still happen even when the selected-event counter leaves them out.

Let's count how often we ask whether an entry is positive by evaluating `values[i] > 0`. That yes-or-no test is also called a **predicate**. The extra counter is **instrumentation**, meaning bookkeeping added to observe the program; the original task would only need the number of positive values.

### Demonstration 1 — Count positive-value checks separately from results

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

In **Demonstration 1**, `[-2, 5, 0]` supplies three entries, so `checks` increases three times. Only 5 satisfies the predicate, so `positives` increases once and we print `3 1`. With `[]`, the loop body never starts and both counters stay zero. Entering the function and testing the loop condition still require work, though. That leftover work helps explain why a running-time formula can include a fixed term even at zero entries.

Our model has limits you should be able to name. Arithmetic on integers allowed to grow arbitrarily long depends on how many bits, or binary digits, represent them. Printing a long message depends on its length and the output device. Here we treat printing one small numeric item as one output event; this is an accounting choice, not a general promise about console performance.

**Try it:** identify two real actions that `checks` does not count. Explain why leaving them out still gives an accurate count of predicate evaluations, while preventing us from calling that counter the total work.

## Understanding input size n
<!-- lesson-id:w1-section-understanding-input-size-n -->

When we write **n**, we mean a chosen measure of input size. Decide what it measures before writing a complexity expression. For a sequence, it usually counts entries. For text, it might count characters or encoded bytes, the storage units representing the text. A graph, which represents things and their connections, often needs two measures: vertices for the things and edges for the connections. One number would hide a useful distinction.

Take `[900, 3, 12]`. There are three entries, so scanning every entry takes three visits. Replacing 900 with 9000 changes the data but adds no visits under our bounded-number model. Appending a fourth entry does add a visit. That is why length, rather than the largest value, captures the size that matters to this scan.

A numeric argument needs a little more care. Counting from 1 through an integer N takes N loop iterations, but writing N in binary needs only about `log₂ N` bits. We will explain logarithms shortly; the key here is that doubling N adds roughly one binary digit while doubling the loop count. A procedure linear in the numeric value can therefore be exponential in the length of its representation.

When our counting laboratories use n as a loop limit, they measure that limit explicitly. They are not claiming a **bit-complexity** result, which would measure work against the number of binary digits used to encode the input.

If you receive two sequences whose lengths can vary independently, call the lengths n and m. Checking every pair with one entry from each sequence takes nm visits. Writing n² instead silently assumes a relationship between their sizes. For example, if the second sequence always has three entries, the count is 3n and grows linearly as the first sequence grows.

**Worked trace:** two candidate names compared with five allowed names require five comparisons for the first candidate and five for the second: ten in total. Adding a third candidate raises that to fifteen if we check every pair. If names can be long, comparing a name may itself require additional work.

**Misconception:** input size always means the biggest number in the data. **Try it:** choose size measures for searching a document, searching a sequence, and comparing every student in one class with every student in another. State whether item lengths are fixed or need their own measure.

## Deriving the running-time function T(n)
<!-- lesson-id:w1-section-deriving-the-running-time-function-t-n -->

We use **T(n)** to name the work required for size n, after choosing a model and a case. It can count one selected event or combine elementary operations with different fixed costs; those different costs are called weights. Start by following the code, identifying what repeats, and adding those contributions. Keep the evidence visible before simplifying the expression.

Consider a loop that starts at zero, tests `i < n`, advances by one, and has no early return. The body runs n times, and the index advances n times. The condition is evaluated n + 1 times because we need one final false result to leave the loop. At n = 3, check the condition for i equal to 0, 1, 2, and 3. Only the first three checks allow the body to run. Writing those four checks out is a reliable way to avoid losing the final one.

Let's first follow ordinary linear search without extra counters. We want to see which statements execute on a successful search, a failed search, and an empty input.

### Demonstration 1 — Follow returns in an ordinary linear search

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

In **Demonstration 1**, searching `[3, 6, 9]` for 6 checks indexes 0 and 1 and returns 1 immediately. The increment after that second comparison never executes. Searching for 12 checks all three values, fails the next loop test, and reaches the final return. Empty input reaches that final return without comparing an element. For an absent target, we can record the executed events as follows:

| Event                              | Executions on an absent target |
| ---------------------------------- | ------------------------------ |
| Initialize i                       | 1                              |
| Test the loop condition            | n + 1                          |
| Compare an element with the target | n                              |
| Increment i                        | n                              |
| Execute the inner return           | 0                              |
| Execute the final return           | 1                              |

Charging one unit for each listed event gives `3n + 3`. This bookkeeping includes the indexed read in the element comparison and the length read in the loop test. You could charge them separately, provided you say so and stay consistent.

Be especially careful with the inner return. Its location inside the loop does **not** mean it executes n times. It runs once on a match and zero times for an absent target. With 100 entries and a missing target, you get 100 element comparisons. The final failed loop test is another comparison, but it compares the index with the length, not an element with the target.

Now suppose we choose a simplified scheme with seven units for setup and completion, then three units per entry. That gives `T(n) = 3n + 7`: seven units at n = 0, ten at n = 1, and nineteen at n = 4. Treat this as an **illustrative cost model**. It is neither the exact count for Demonstration 1 nor a count of the machine instructions a JavaScript engine will execute. Changing the accounting changes the fixed overhead, but both formulas still describe linear growth.

To separate the fixed contribution from the repeated contribution, let's build the illustrative formula directly. The body adds three modeled units per repetition, while the initial seven stays the same for every input size.

### Demonstration 2 — Build fixed overhead and per-entry work into a counter

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

In **Demonstration 2**, `modeledWork(4)` starts at seven and adds three on each of four iterations: ten, thirteen, sixteen, then nineteen. At zero, no iteration changes the initial seven. This makes it clear which term depends on size.

Two reasonable accounting conventions can yield `3n + 7` and `8n + 12` while still agreeing that growth is linear. **Misconception:** deriving T(n) means throwing away constants immediately. First preserve the count you can justify; then simplify when discussing its growth family.

**Try it:** derive a function with four setup events, two events per repetition, and one final event. Evaluate it at n = 0 and n = 3, showing where each contribution enters.

## Growth families
<!-- lesson-id:w1-section-growth-families -->

A **growth family** groups functions that scale in comparable ways once inputs become large. You can start understanding a family by asking what happens when you increase the input. Constant work stays bounded by a fixed amount. Linear work roughly doubles when n doubles, while quadratic work roughly quadruples. Logarithmic work adds only a fixed number of steps when you multiply n by a fixed factor. The table gives representative functions so we can put numbers to these descriptions.

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

Read these values as counts from representative functions, not as benchmark timings. A polynomial uses a fixed power such as n² or n³; its degree is that power. For any fixed polynomial degree k, exponential growth eventually exceeds nᵏ. Factorial growth, which multiplies the positive integers up through n, eventually exceeds any exponential with a fixed base.

The word “eventually” matters. A coefficient multiplying the repeated work, or a startup cost paid before it begins, can change which implementation is cheaper on small inputs. A growth family describes the long-run trend without erasing those engineering costs.

A **logarithm** answers a repeated-multiplication question: how many factors of a chosen base produce this number? Since `2³ = 8`, we write `log₂ 8 = 3`. You can read the same relationship backward by halving 8 to 4, then 2, then 1. Three halvings undo three doublings.

When the input is not an exact power of two, the loop's stopping condition determines how we round its count. Different fixed logarithm bases differ by a constant factor. That is why they belong to the same asymptotic family: the same family of growth as size becomes large.

**Worked comparison:** at n = 100, n² gives 10000 events while 1000n gives 100000, so the quadratic function is cheaper there. At n = 10000, the counts become 100000000 and 10000000. Now the linear function wins because its fixed multiplier no longer outweighs the extra factor of n.

**Misconception:** a better eventual growth family must win immediately. **Try it:** predict how doubling n affects a constant, a linear, a quadratic, and an exponential function. Explain why that ranking still cannot replace measurement for a particular small workload.

## Big O upper bounds
<!-- lesson-id:w1-section-big-o-upper-bounds -->

Suppose we want a ceiling for a cost function after some starting size. **Big O** gives that eventual upper bound, allowing a positive constant multiplier. Formally, `T(n) ∈ O(g(n))` if positive constants c and n₀ exist such that `0 ≤ T(n) ≤ c g(n)` for every n ≥ n₀ in the size domain. Here g is the reference growth function, c scales it, and n₀ is the size from which the claim must hold.

Choose c independently of n. Once chosen, the same ceiling c g(n) must remain above the cost for every later valid size. You cannot adjust the multiplier whenever an inconvenient input size appears.

Let's prove an upper bound for `T(n) = 3n + 7`. Choose c = 10 and n₀ = 1. For n ≥ 1, 7 ≤ 7n, so `3n + 7 ≤ 10n`. We have now proved O(n). At n = 1, both sides are equal; as n increases, the fixed seven fits more easily beneath the allowance of 7n. The inequality, rather than a handful of measured examples, is what covers all later sizes.

The same function also belongs to O(n²), because for n ≥ 1, `3n + 7 ≤ 10n ≤ 10n²`. That ceiling is valid but leaves much more room than necessary. An upper bound need not be **tight**, meaning it need not match the function's growth closely. Prefer the strongest conventional description you can justify, and say which case it describes—for example, “worst-case Θ(n), hence O(n).” We will define Θ precisely shortly.

Keep the choice of case separate from the direction of the bound. Big O itself does not mean worst case. You can place an upper bound on a best-case function, a worst-case function, or an expected-cost function defined using probabilities. First say which function you selected, then bound it. A search taking one comparison on one input is perfectly compatible with a linear worst-case bound.

**Misconception:** you can choose c = n and make any cost look constant. That breaks the definition: c must be a fixed number while n varies.

**Try it:** find a positive c and a threshold n₀ that prove `5n + 2 ∈ O(n)`. Show the inequality for every size from that threshold onward, and explain why two small timing measurements could not establish the same claim.

## Big Omega lower bounds
<!-- lesson-id:w1-section-big-omega-lower-bounds -->

Now imagine placing a floor underneath the selected cost function. **Big Omega** gives an eventual lower bound, again allowing a positive constant multiplier. We write `T(n) ∈ Ω(g(n))` when positive c and n₀ exist such that `0 ≤ c g(n) ≤ T(n)` for every n ≥ n₀. From the chosen threshold onward, the cost must stay at or above that floor. As with Big O, the constants do not change as n changes.

For `3n + 7`, choose c = 3 and n₀ = 1. The inequality `3n ≤ 3n + 7` proves Ω(n): the fixed seven cannot make the work smaller than 3n. The function is also Ω(1), but that weaker floor tells you less about its growth. When a stronger lower bound is justified, use it to communicate more of what you know.

Be precise about the function underneath the notation. A scan that always visits all n entries has an Ω(n) visit count on every length-n input. An early-return search can stop at its first entry, so we cannot say that every execution needs n comparisons.

We can still give that search's **worst-case comparison function** an Ω(n) bound: for each size, a missing target forces all n comparisons. This lower-bounds the maximum cost at that size. It does not turn every individual execution into a linear one.

A lower bound for an entire problem requires another argument, beyond counting one implementation. Suppose a sequence is unsorted and you have no extra information about its entries. To determine whether a target is present, you may need to inspect them all: any unchecked position could hold it. That reasoning depends on how you can access the data and what information is available. Sorted input changes those assumptions and makes a different search strategy possible.

**Worked trace:** when a target is absent from `[2, 4, 6, 8]`, an ordinary scan must rule out four candidates. If it skips the last position, it cannot distinguish this input from an otherwise identical sequence whose final entry is the target.

**Try it:** prove `5n + 2 ∈ Ω(n)` with fixed constants. Then explain the mistake in “Omega means the first element matches.” Identify separately the input case and the kind of bound.

## Big Theta tight bounds
<!-- lesson-id:w1-section-big-theta-tight-bounds -->

Sometimes we can put both a floor and a ceiling around the cost using the same reference function. **Big Theta** expresses this tight growth bound: above and below, the cost stays within positive constant multiples after a threshold. Formally, `T(n) ∈ Θ(g(n))` if positive c₁, c₂, and n₀ exist such that `0 ≤ c₁g(n) ≤ T(n) ≤ c₂g(n)` for all n ≥ n₀. It combines an O upper bound and an Ω lower bound using that same g(n).

Picture two rails surrounding the cost curve. The curve does not have to equal n, and the gap between the rails does not have to stay a constant width. What stays fixed is each rail's multiplier of n. For `3n + 7`, our upper and lower bounds both use n as the reference function, so together they establish Θ(n).

Try the same reasoning on `n² + n`. When n ≥ 1, the extra n is no larger than n². That places the full function between n² and 2n², proving Θ(n²). We have not removed the linear term from the exact count; we have shown why it does not determine the growth family. This argument extends to polynomials of fixed degree with a positive leading coefficient, the positive multiplier on their highest-power term.

Theta does not select an average case. For a full traversal, the best, worst, and average cost functions may all belong to Θ(n). A search that stops as soon as it finds an answer—a **short-circuit** search—has a constant best-case function and a linear worst-case function. You can give each of those functions its own tight bound.

**Misconception:** any upper bound plus any lower bound establishes Theta. Knowing Ω(n) and O(n²) leaves a gap containing many growth rates. The reference function must match on both sides.

**Try it:** bound `2n² + 3n + 1` using positive multiples of n² for n ≥ 1. Supply actual constants and show why they work, then explain the difference between the exact expression and the tight family you proved.

## Constants and thresholds
<!-- lesson-id:w1-section-constants-and-thresholds -->

The multipliers let us scale our reference function vertically. The **threshold n₀** tells us where the inequalities must start holding. You choose these numbers once; none may change with n. A threshold lets a proof leave out a finite set of small sizes, but it still has to cover every size afterward. In the rails picture, we must show that the whole remaining curve stays enclosed, not just the points we happened to plot.

Let's assemble the whole proof for `T(n) = 3n + 7` with `g(n) = n`. Choose **c₁ = 3, c₂ = 10, n₀ = 1**. The lower side works for every integer n ≥ 1 because `3n ≤ 3n + 7`. For the upper side, use n ≥ 1 to get `7 ≤ 7n`, then `3n + 7 ≤ 3n + 7n = 10n`. Putting both sides together gives `0 ≤ 3n ≤ 3n + 7 ≤ 10n` throughout the required domain. That complete chain proves Θ(n); the table helps you inspect a few points in the proof.

| n   | c₁n = 3n | T(n) = 3n + 7 | c₂n = 10n | Both bounds hold?  |
| --- | -------- | ------------- | --------- | ------------------ |
| 0   | 0        | 7             | 0         | No: 7 ≤ 0 is false |
| 1   | 3        | 10            | 10        | Yes                |
| 2   | 6        | 13            | 20        | Yes                |
| 5   | 15       | 22            | 50        | Yes                |
| 10  | 30       | 37            | 100       | Yes                |

Why does the zero row fail? With these constants, **n₀ = 0 fails** because the upper inequality would demand that seven be at most zero. No finite multiplier c₂ can make `7 ≤ c₂ × 0` true. There is no contradiction with Θ(n): the definition asks for some valid threshold, and one is valid. You can still analyze what the program does on empty input even when the long-run proof begins at one.

In engineering, constants still affect your decision. A linear algorithm doing expensive work per entry can lose to a quadratic one on a small, bounded workload. Growth analysis exposes scaling risks; **profiling**, or measuring where an actual execution spends resources, helps you decide under real conditions.

**Misconception:** n₀ tells you when one real implementation starts running faster than another. Here it only tells you when these mathematical inequalities hold. **Try it:** keep c₁ = 3, change c₂ to 4, and find the smallest integer threshold. Explain why your algebra establishes more than a table of sample values could establish alone.

## Best worst and average cases
<!-- lesson-id:w1-section-best-worst-and-average-cases -->

First hold n fixed and compare the valid inputs of that size. The smallest cost is the **best-case cost**; the largest is the **worst-case cost**. To define an **average-case cost**, we also need a probability distribution: a rule saying how likely each input is. Its expectation is the cost averaged with those likelihoods as weights. Choose this case function first, and only then ask whether an O, Ω, or Θ bound describes it.

For nonempty linear search, let's count comparisons with the target. A first-entry match gives a best case of one. A match at the last entry, or no match, gives a worst case of n. For a successful-search average, assume the target occurs exactly once and is **uniformly distributed across all n positions**. Uniform means every position is equally likely, with probability 1/n. The possible costs are one through n, so their weighted average is

`E[C(n)] = (1 + 2 + ... + n)/n = [n(n + 1)/2]/n = (n + 1)/2`.

At n = 4, add the possible counts 1, 2, 3, and 4, then divide by four to get a mean of 2.5. No individual search performs half a comparison; the fraction summarizes many possible executions. The expectation is Θ(n) because multiplying a linear function by one half does not change its growth family.

Now allow the target to be absent with probability p, and otherwise keep its successful position uniform. Absence costs n, so the expectation becomes `pn + (1 − p)(n + 1)/2`. The two terms weight failure and success separately. Change the distribution and the formula can change: if every request targets the first position, the average successful cost is one. Simply saying “average input” does not specify enough to calculate an expectation.

Empty input performs zero target comparisons, which is why the one-comparison best-case claim explicitly assumes n ≥ 1. **Misconception:** the average must lie exactly halfway between the minimum and maximum. That happens in the uniform successful-search model, but unequal probabilities can pull the expectation toward cheaper or more expensive inputs.

**Try it:** for n = 3, give positions 0, 1, and 2 probabilities 1/2, 1/4, and 1/4. Write the weighted sum of comparison costs before calculating its value.

## Time versus space
<!-- lesson-id:w1-section-time-versus-space -->

Counting actions and counting storage answer different questions. **Time complexity** describes work, while **space complexity** describes storage. Say what your storage count includes. Input storage holds data already supplied to the function. **Auxiliary space** is additional working storage used while solving the problem, and **output space** holds the required result. Because some conventions include output in auxiliary space, make the separation explicit whenever it affects your claim.

A scan can do Θ(n) work while using Θ(1) auxiliary space. It visits more entries as n grows but may keep only a fixed number of counters. Conversely, a single variable can refer to an n-entry result occupying Θ(n) output space. Count the information kept in memory, rather than the number of variable names or the number of assignments made over time.

For example, a running sum replaces one scalar's old value with a new value n times. It does not keep all those versions, so its peak auxiliary space stays constant. If you retain every partial sum, you keep n numeric values instead. Both approaches can take linear time, but their storage differs. Keep the history when the contract needs it; otherwise ask whether those saved values serve any purpose.

Measure **peak simultaneous storage**: the largest amount that must be kept at one time. Adding all allocation events across an execution answers a different question. Also remember the call stack, which stores unfinished function calls. Each stored call uses a **stack frame**, holding information needed to resume it. A recursion reaching depth n with constant-size frames uses Θ(n) stack space even without an explicit collection. The iterative searches in **Worked JavaScript examples** keep only a few scalars instead.

Printing n items requires n output events, but you can print each item as you reach it instead of saving every item first. Our auxiliary-space claims exclude console buffers and the runtime's own infrastructure.

**Worked accounting:** suppose you receive n input numbers and keep two counters, a running total, and a scalar result. Under fixed-size numeric assumptions, that is Θ(n) input storage, Θ(1) auxiliary storage, and Θ(1) result storage. **Misconception:** linear time necessarily needs linear extra memory. **Try it:** explain why updating a counter n successive times does not require Θ(n) space.

## Counting loops and sequential operations
<!-- lesson-id:w1-section-counting-loops-and-sequential-operations -->

When one piece of work finishes before another begins, add their counts. Two complete scans make `n + n = 2n` visits, so together they are Θ(n). A scan followed by visiting all ordered pairs gives `n + n²`, hence Θ(n²). For nested repetition, inspect how much the inner loop does on each outer iteration. Multiplication is justified when that amount is the same each time, or when you have proved suitable bounds; otherwise write the sum first.

An outer loop with n iterations and exactly three inner repetitions performs 3n events. It is nested and still linear. Now let pair enumeration start at `j = i + 1`. The inner counts become `n − 1, n − 2, ..., 0`, whose sum is `n(n − 1)/2`. This decreasing sum still grows quadratically. It counts each unordered pair of distinct positions once: swapping the positions does not create another pair. That differs from n² ordered pairs, which include both orders and self-pairs.

Next let a width double through 1, 2, 4, and so on, stopping at the largest power of two no greater than n. When the inner work equals that width, the total is `1 + 2 + ... + 2ᵏ`, with 2ᵏ ≤ n < 2ᵏ⁺¹. This is a **geometric sum**, meaning successive terms grow by a fixed multiplier. Its value `2ᵏ⁺¹ − 1` is at least n and less than 2n for positive integer n, proving Θ(n).

If the inner loop instead processes n items on every outer iteration, each doubling round pays a full n. There are logarithmically many rounds, giving Θ(n log n). Let's compare the shrinking-pair sum and the matching-width sum with actual counters.

### Demonstration 1 — Count triangular pairs and doubling-width work

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

In **Demonstration 1**, `loopCounts(4)` counts pair visits as three, then two, then one, then zero: six altogether. The doubling widths are one, two, and four, contributing seven events. At eight, the pair sum becomes twenty-eight and the width sum becomes fifteen. The number of written loops has stayed the same, but their bounds produce different growth families.

**Amortized analysis** spreads the total cost of a sequence across its operations: first bound the total, then divide by the number of steps. Suppose a process charges one ordinary unit each step and also performs maintenance at steps 1, 2, 4, 8, and so on, costing that step number. Across N steps, ordinary work totals N, and the geometric maintenance sum is less than 2N. The total is therefore less than 3N, giving O(1) amortized cost per step.

An individual maintenance step can still cost Θ(N). The sequence guarantee does not promise that every operation finishes quickly. This argument is deterministic—it holds without assuming any random input or probability distribution.

**Misconception:** all nested loops are quadratic, or amortized cost means a random average. In both cases, writing the actual sum exposes the mistake. **Try it:** compare matching-width work with fixed-n inner work at n = 8. Then explain why a constant amortized cost does not imply constant **latency**, the time you wait for an individual step to finish.

## Worked JavaScript examples
<!-- lesson-id:w1-section-worked-javascript-examples -->

Let's apply the counting habits to five complete programs. We will treat numeric operations and known-index access as fixed-cost actions. Inputs are ordinary dense sequences, with a value at every position; any work preparing a search input is excluded and must be accounted for separately. Follow the branches, loops, and returns yourself. A familiar function name is a clue to investigate, not proof of its complexity.

### One position: firstElement

The contract is to return the first value, with `undefined` representing the absence of an entry on empty input. We always check for emptiness once. For nonempty input we then read one index, regardless of length; for empty input we read none. Time, auxiliary space, and scalar result space are all Θ(1). Let's see why merely receiving many values does not force the function to visit them.

### Demonstration 1 — Read one known position after checking emptiness

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

In **Demonstration 1**, `[7, 4, 9]` has length three, so the empty branch is skipped and position zero supplies 7. Values 4 and 9 are never read. For `[]`, the early return prevents even the position-zero read. **Misconception:** a function receiving n entries must do n work. **Try it:** predict the indexed-read count for a nonempty input with a million entries and explain what stays unchanged.

### Every position: printElements

Here the contract requires printing every numeric value once and returning the number of value-output events. That means n indexed reads, n value-print calls, n counter increments, and n index updates, plus n + 1 loop-condition checks. Time is Θ(n + 1), conventionally written Θ(n) for n ≥ 1. Auxiliary space is Θ(1) when console infrastructure is excluded: the function does not save every printed value.

Watch the caller as well as the loop. Printing the returned count is another output event, separate from printing an input value.

### Demonstration 2 — Separate value prints from the returned count

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

In **Demonstration 2**, `[2, 5, 8]` makes the loop visit indexes 0, 1, and 2. Each visit prints one value and increases `count`. The failed test at index 3 ends the loop, and the caller prints the returned three. Empty input prints no values inside the function but still returns zero for the caller to print. **Try it:** identify which of the five console lines are the function's three value prints and which come from its caller.

### Every ordered pair: printPairs

For this contract, order matters and a value can pair with itself. Each of n choices for the first position is combined with all n choices for the second position. We therefore get n² pair-print calls, 2n² indexed reads, and n² counter increments. The outer condition is checked n + 1 times; the inner condition is checked n(n + 1) times in total.

Time is Θ(n²) for n ≥ 1, while two indexes and a counter take Θ(1) auxiliary space. We **stream** the output, producing each pair as we reach it, so n² printed pairs do not require an n²-entry result in our own memory.

### Demonstration 3 — Print every ordered pair including self-pairs

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

In **Demonstration 3**, input `[2, 5]` first holds the outer index at zero while the inner index visits zero and one. That prints `2 2` and `2 5`. The outer index then advances to one and the inner loop starts over at zero, printing `5 2` and `5 5`. The returned count is four. **Try it:** count pair prints for n = 3 and explain why restarting the inner loop at zero prevents use of the triangular distinct-pair formula.

### Early stopping: linear search

Now we return both an answer and the evidence needed for its cost: the first matching position or −1, together with the number of target comparisons. After a comparison fails, we know that position cannot answer the query. Before iteration i, no earlier position matches. This is a **loop invariant**, a statement that remains true whenever the loop reaches the same stage of another iteration. It explains why the first returned match really is the first one. All cases use Θ(1) auxiliary space.

### Demonstration 4 — Count comparisons until the first match or exhaustion

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

In **Demonstration 4**, searching `[4, 8, 2]` for 8 fails at index zero, succeeds at index one, and returns after two comparisons. Searching for 7 fails at all three positions and returns −1 with three comparisons. Empty input returns −1 with zero comparisons. **Try it:** choose a target giving the best case on the nonempty array. State its tight time bound separately from the search's worst-case time bound.

### Halving candidates: binary search

Binary search needs a **precondition**, a requirement the input must satisfy before the algorithm starts: values must already be sorted in ascending order. Then a comparison with the middle value can rule out an entire half of the candidates. This version may return any matching position, so it does not promise the first occurrence among duplicates.

The remaining interval includes both `low` and `high`. We calculate its midpoint using arithmetic and rounding down, avoiding conversion to a bitwise integer representation. As you trace it, explain why each discarded half cannot contain the target.

### Demonstration 5 — Halve a sorted search interval

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

In **Demonstration 5**, finding 12 starts by probing, or inspecting, 8 at index 3. Since 12 is larger, only indexes 4 through 6 remain eligible; the next midpoint is index 5, containing 12. For target 5, the probed values are 8, then 4, then 6. The updates then leave an empty interval and the search reports failure.

A probe is not exactly one target comparison here. We may test equality and then ordering, so each probe makes at most two such comparisons. Their counts differ by only a constant factor, which preserves the growth family.

After k unsuccessful probes, at most n/2ᵏ candidates remain. Each halving contributes another factor of two in that denominator. For n ≥ 1, worst-case probes are at most `floor(log₂ n) + 1`, where floor means rounding down, so the worst-case function is O(log n) as n grows. Some targets need logarithmically many probes, supplying the matching lower bound and establishing worst-case Θ(log n).

The best case is Θ(1) when the first midpoint matches, and auxiliary space is Θ(1). If your input needs sorting first, include that preparation in the larger task's accounting. **Try it:** explain why an unsorted input can make this program terminate quickly with a wrong answer. Point to the missing justification for discarding candidates.

## Common misconceptions
<!-- lesson-id:w1-section-common-misconceptions -->

Use the table as a way to diagnose an argument. For each claim, try explaining the counterexample in your own words before accepting the correction. That habit will help when you meet code that does not look like a familiar textbook example.

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

Before giving a complexity label, name the event, the meaning of input size, the case, and what storage you include. When two answers disagree, compare those choices first. Someone counting all ordered pairs is solving a different counting problem from someone counting each distinct unordered pair once. Different contracts legitimately produce different formulas; no notation can resolve an unstated contract.

**Worked correction:** suppose someone says, “It visits half the entries, so it is logarithmic,” about a loop advancing by two. At n = 100, it still visits about fifty positions; doubling n roughly doubles that count. About n/2 visits is Θ(n). Logarithmic work comes from repeatedly halving what remains, not from visiting every second entry.

**Try it:** correct this statement in one sentence: “This search was fast on my example, so its worst case is constant.” Make clear what a single execution can and cannot establish.

## Practice exercises and module assessment
<!-- lesson-id:w1-section-practice-exercises-and-module-assessment -->

Write your own solutions somewhere separate from the answers so you can compare the reasoning afterward. For each analysis, tell the reader what size measures, what operation you count, which case you analyze, and the formula or bound you obtain. Include auxiliary space wherever it applies. You need only this chapter for these tasks; they do not depend on an external judge or submission system.

### Lesson practice record

Work through every **Try it** prompt from lessons 1–14 and number your notes by lesson. Use 13a–13e for the five prompts in **Worked JavaScript examples**, whose demonstrations are numbered 1–5 within that lesson. For this fifteenth lesson, use the assessment here as your practice. An answer such as “linear” is only the conclusion; include the reasoning that makes it defensible.

### Beginner assessment

**B1.** You pay six setup events once, then four selected events for each input entry. Build T(n) from those contributions, evaluate it at n = 0 and n = 5, and justify a tight growth bound. Keep the fixed contribution visible in your exact expression.

**B2.** A loop visits indexes 0 through n − 1. Count separately the condition tests that allow another iteration, the tests that fail, and the executions of the body. Explain what each count becomes on empty input instead of assuming the loop starts.

**B3.** Revisit firstElement, printElements, and printPairs from **Worked JavaScript examples**. For each, choose and name a selected event, count it at n = 4, and give the time and auxiliary-space families. Explain your output-storage convention so the printing examples are unambiguous.

**B4.** Search `[3, 6, 9, 12]` linearly for 9. Write the inspected positions in order and count comparisons with the target. Then repeat for target 5. Explain how the return path changes when all candidates fail.

### Intermediate assessment

**I1.** Prove `6n + 4 ∈ Θ(n)` by supplying positive lower and upper multipliers and a threshold. Show the inequalities, then substitute zero to check whether those same constants would permit the proof to start there.

**I2.** One procedure completes two length-n scans in sequence. Another runs n outer iterations, and its inner indexes go from zero through i inclusive. Derive the body-event count of each procedure before naming its growth family. Make the different reasons for addition and summation explicit.

**I3.** Assume a successful target is equally likely to occupy any of five positions. Calculate the expected comparisons for linear search. Then give the first position probability 1/2 and each remaining position probability 1/8, and calculate again. Show how each probability weights its position's cost.

**I4.** Find 13 by binary search in `[1, 3, 5, 7, 9, 11, 13]`. Before every probe, record low, high, and mid. Use that trace to report the returned result and probe count, then explain the auxiliary-space bound from the state kept between probes.

### Advanced assessment

**A1.** Start width at 1 and double it while width ≤ n. In one version, the inner loop performs width events; in another, it performs n events each round. Derive both totals at n = 16, then justify both growth families for general positive integer n. Do not rely only on the power-of-two example.

**A2.** Each step costs one ordinary event. At steps k = 1, 2, 4, 8, ..., maintenance also costs k. Bound all work across the first N steps, then distinguish the worst individual cost from the amortized cost. Explain what information an expected-cost claim would require; do not invent probabilities the task has not supplied.

**A3.** Your contract requires printing every ordered pair of n input values. Under a model charging one event per printed pair, could O(n) time satisfy it? Justify a lower bound using the required output. Separately explain whether doing quadratic work forces you to retain quadratic auxiliary storage.

**A4.** First scan two independent inputs of lengths n and m in sequence, then check every pair taking one entry from each input. Derive the total selected events and a tight bound for n,m ≥ 1. Reanalyze the expression with m fixed at 3. State the extra relationship between lengths that would permit Θ(n²).

### Module completion standard

Use each tier to locate the next skill to practice. At beginner level, aim for correct counts tied to named events. At intermediate level, support them with proofs, traces, and explicit probability assumptions. At advanced level, justify sums and distinguish the cost of one operation, a whole sequence, and a probabilistic expectation. Attempt each tier independently before checking it. Then choose one correction, explain why it was needed in your own words, and retry that task with a different small input.

## Visual Explanations
<!-- lesson-id:w1-section-visual-explanations -->

The study interface connects its interactive complexity lab to this section through the `visual-explanations` anchor. Use the comparisons there to connect a change in input size with counts you have already derived. If you are reading the Markdown without that interface, you can do the same reasoning with the growth table and the traces in this chapter; the lab is not required to follow the argument.

Before moving an input-size control, predict what doubling will do. A representative linear count doubles, a quadratic count quadruples, and a base-two logarithmic count gains one. Compare curves at the same size, and check whether their counts are raw or normalized—rescaled to make comparisons easier. The axes can make a curve appear steeper or flatter. That appearance helps intuition but does not replace an inequality proving an asymptotic bound.

On paper, make columns for n = 2, 4, 8, and 16, calculate n and n², and plot the results. Then draw eight candidate positions for binary search. After each unsuccessful middle probe, cross out the half that sorted order rules out. Explain aloud why that half is impossible. The drawing shows how one probe removes many candidates; the logarithm describes how many repeated reductions are needed.

## Hints and Worked Solutions
<!-- lesson-id:w1-section-hints-and-worked-solutions -->

This section gathers all exercise answers so the study interface can keep them closed while you work. Start with the relevant hint and try again before revealing a complete answer. After reading a solution, cover it and reconstruct the reasoning yourself. Being able to follow an explanation and being able to produce one are different stages of learning.

### Lesson hints

For lessons 1–4, write the state changes in order and identify what eventually stops execution. In lessons 5–9, find the term that controls long-run growth, then use fixed constants to bound the other contributions. For lessons 10–12, keep three questions separate: how probabilities weight costs, how much storage exists at once, and how repetition counts add without randomness. In lesson 13, follow the actual loop bounds and return paths. For lesson 14, ask whether the claim concerns one observed execution or every later size.

### Lesson answers

**1.** Inspect each position in order and return its index as soon as it matches. If no candidates remain, return −1. Count comparisons with the target. Each index advance shortens the unchecked suffix, meaning the still-unexamined end of the sequence, until none remains. This gives a stopping argument. Source-code length cannot give the comparison count because the same written comparison can execute many times.

**2.** The counter omits loop-condition checks and index increments, among other actions. That does not invalidate its predicate count: every evaluation of the positivity test still increases it exactly once. The key is to describe the result as a selected-event count instead of claiming it includes all the program's work.

**3.** For document search, count document characters and, where relevant, query length. For a sequence of bounded numbers, count entries. For comparisons across two classes, keep class sizes n and m separate. If student names have variable length, comparing one pair of names may add another length-dependent cost. State explicitly when you treat each item as fixed size.

**4.** Add the four setup events and the one final event to obtain five fixed events. Then add two for each repetition, giving `2n + 5`. At zero repetitions you still pay five; at three, you add six more and reach eleven. The final event belongs in the fixed contribution because it runs once.

**5.** A constant stays unchanged when n doubles; n doubles; n² quadruples. For 2ⁿ, doubling n multiplies the old value by another factor of 2ⁿ. For example, 2⁴ = 16 becomes 2⁸ = 256. These scaling patterns describe the representative functions. Actual coefficients and fixed overhead can still reverse the ranking on small workloads.

**6.** Choose c = 7 and n₀ = 1. For n ≥ 1, the fixed two is at most 2n, so `5n + 2 ≤ 7n`. This proves the required upper inequality for every later size. Two timings cannot cover all those sizes and may also reflect runtime effects our operation-count model does not include.

**7.** Use c = 5 and n₀ = 1: `5n ≤ 5n + 2` supplies the lower bound. Saying that the first position matches identifies a best-case input for search. Saying Omega identifies a direction of bound on a function. You still need to specify which case function you are lower-bounding.

**8.** For n ≥ 1, use n ≤ n² to absorb the linear term and 1 ≤ n² to absorb the constant. Then `2n² ≤ 2n² + 3n + 1 ≤ 6n²`. Positive choices c₁ = 2, c₂ = 6, n₀ = 1 prove Θ(n²). The exact expression still records every contribution; the tight family summarizes how the whole expression scales.

**9.** With the smaller upper multiplier, you need `3n + 7 ≤ 4n`. Subtracting 3n shows that this is equivalent to n ≥ 7. The lower inequality already holds for nonnegative n, so seven is the smallest integer threshold satisfying both. Algebra establishes the result for every later size, whereas a finite table only checks its listed rows.

**10.** A match at positions zero, one, and two costs one, two, and three comparisons respectively. Weight each by its supplied probability to get `(1/2) × 1 + (1/4) × 2 + (1/4) × 3 = 7/4 = 1.75`. The distribution favors the first position, so the uniform-position formula would answer a different question.

**11.** Each counter update replaces the previous value instead of saving another version. Only one counter value needs to exist at a time. Under the bounded-number model, that gives Θ(1) peak auxiliary space even when the counter is updated n times. Repetition increases work without necessarily increasing retained storage.

**12.** At n = 8, widths one, two, four, and eight give matching-width work `1 + 2 + 4 + 8 = 15`. Paying eight in each of the four rounds gives fixed-n work `8 × 4 = 32`. Their families are Θ(n) and Θ(n log n), respectively. Likewise, maintenance may cost linear work at one particular step while the total across a whole sequence remains linear.

**13a.** **Worked JavaScript examples, Demonstration 1** still makes one indexed read on a million-entry nonempty input: it never traverses the remaining values.

**13b.** **Worked JavaScript examples, Demonstration 2** prints three input values inside the function. Its caller prints the counts returned by both calls, adding two lines and making five overall.

**13c.** **Worked JavaScript examples, Demonstration 3** makes nine pair prints at n = 3. Each inner scan starts at zero, so it includes self-pairs and both orders; the triangular restriction does not apply.

**13d.** In **Worked JavaScript examples, Demonstration 4**, target 4 matches immediately, giving Θ(1) best-case time. A last or missing target still gives Θ(n) worst-case time.

**13e.** **Worked JavaScript examples, Demonstration 5** relies on sorted order to discard a half after a middle comparison. Without that order, the discarded half might contain the target. Finishing the loop proves termination, not correctness.

**14.** One fast execution tells you about that input alone. A constant worst-case claim must cover the most expensive valid input at each growing size. For linear search, a missing target forces a full scan, so those inputs prevent a constant worst-case bound even if your first test was quick.

### Beginner solutions

**B1.** Start with the six fixed setup events, then add four per entry: `T(n) = 4n + 6`. Substitution gives T(0) = 6 and T(5) = 26. For n ≥ 1, `4n ≤ 4n + 6 ≤ 10n`, because the fixed six is at most 6n. These matching linear bounds prove Θ(n).

**B2.** Each of the n body executions needs a successful condition test. After them, one failed test stops the loop. That gives n successful tests, one failed test, and n body executions. On empty input, the initial test is already false: no successful tests and no body executions occur, but the one failed test remains.

**B3.** Choose indexed reads for firstElement, value prints for printElements, and pair prints for printPairs. At n = 4, those counts are 1, 4, and 16. The time families are Θ(1), Θ(n), and Θ(n²), respectively. Under our streaming-output convention, each keeps Θ(1) auxiliary state. If you instead count every indexed read in the pair function, you get 32 because each pair reads two entries. That changes the event count, not the growth family.

**B4.** For target 9, positions 0 and 1 fail, then position 2 matches. The answer is index 2 after three comparisons; positions and counts start differently because indexes start at zero. For target 5, all four positions fail and the search returns −1 after four comparisons. No early return can settle that absent-target query.

### Intermediate solutions

**I1.** Positive choices c₁ = 6, c₂ = 10, n₀ = 1 work. For every n ≥ 1, the fixed four is at most 4n, giving `6n ≤ 6n + 4 ≤ 10n`. At zero, the upper inequality would require 4 ≤ 0. That fails, so these bounds establish the family from one onward rather than from zero.

**I2.** The two sequential scans contribute n each, making 2n body events and Θ(n) growth. For the dependent inner loop, i = 0 contributes one event, i = 1 contributes two, and so on through n. The sum `n(n + 1)/2` is Θ(n²). At n = 4, the totals are eight and ten. Those values illustrate the difference, while the formulas and their bounds justify it for growing input sizes.

**I3.** With equal likelihoods, the expected count is `(1 + 2 + 3 + 4 + 5)/5 = 3`. Under the changed distribution, calculate `(1/2) × 1 + (1/8) × (2 + 3 + 4 + 5) = 9/4 = 2.25`. More probability now belongs to the cheapest position, so the expectation falls even though the search algorithm and possible counts are unchanged.

**I4.** The successive states before probing are `(low, high, mid)` equal to `(0, 6, 3)`, `(4, 6, 5)`, and `(6, 6, 6)`. The inspected values are 7, 11, and 13. Each of the first two is too small, so low moves just past its midpoint. The final probe returns index 6, making three probes in total. Only fixed scalar state is retained, giving Θ(1) auxiliary space.

### Advanced solutions

**A1.** At n = 16, the widths are 1, 2, 4, 8, and 16. Their sum is 31, while doing sixteen events in each of five rounds gives 80. For general n, let k = floor(log₂ n), so k identifies the last doubling exponent. The matching-width total is `2ᵏ⁺¹ − 1`, between n and 2n, which proves Θ(n). The fixed-n total is `n(k + 1)`, giving Θ(n log n) as n grows. Keep the extra one in the exact expression: n = 1 still performs one round.

**A2.** Ordinary work contributes N. Taking k = floor(log₂ N), the maintenance total is `2ᵏ⁺¹ − 1 < 2N`. Combined work lies between N and 3N, establishing Θ(N); dividing by N gives Θ(1) amortized cost. The largest maintenance step exceeds N/2, however, so the most expensive individual step in this prefix costs Θ(N). These are compatible statements about different quantities. An expected-cost calculation would need a probability model, and none is supplied.

**A3.** The contract requires n² output pairs, and each pair costs one output event. That alone forces Ω(n²) time, ruling out O(n) for unbounded n. Nested loops attain Θ(n²) time while printing each pair immediately and retaining Θ(1) auxiliary state. If you changed the contract to retain every pair, the saved result would also require Θ(n²) output storage.

**A4.** Add both scans and all cross-input pairs to get `n + m + nm`. For positive sizes, each of n and m is at most nm, so `nm ≤ n + m + nm ≤ 3nm` proves Θ(nm). Fixing m = 3 changes the expression to `4n + 3`, which is Θ(n). To write Θ(n²), you need m to scale proportionally to n, for example m = n. Independent input lengths alone give no such relationship.

## Sources and Further Reading
<!-- lesson-id:w1-section-sources-and-further-reading -->

The explanations, traces, exercises, and JavaScript examples here are original teaching material. Use these references when you want another established treatment or the language documentation behind an operation. Listing a reference does not mean its page was browsed during this rewrite or that the examples were verified externally. Choose a reading according to the part of the chapter you want to strengthen.

- [MIT OpenCourseWare: Introduction to Algorithms, 6.006](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/) — use these official course materials to continue studying algorithmic thinking, cost models, and asymptotic analysis after you finish the beginner tasks. They extend the mathematical foundation used here.
- [OpenDSA](https://opendsa.org/) — explore its open explanations and visual learning material for another view of algorithm analysis. Look for growth rates, asymptotic bounds, and case analysis; editions may organize their modules differently.
- [MDN: Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration) — consult this when you need to check the JavaScript loop behavior on which our counts depend.
- [MDN: Math.floor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor) — read this to review the rounding operation used to select a binary-search midpoint.
- [MDN: Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) — use this background on numeric representation to understand why our bounded-number cost model has limits.

## Weekly Summary
<!-- lesson-id:w1-section-weekly-summary -->

When you analyze a program, begin by saying what it must do, how you measure its input, and which action you count. Derive an expression or justify a sum before naming the growth family. Add work done in sequence. For repeated work, inspect the bounds of each repetition instead of classifying the code by its appearance. Repeated reduction by a fixed multiplier leads to logarithmic counts; dependent loops can lead to triangular or geometric sums.

Keep two decisions separate: the case selects the cost function, and the notation describes its bounds. O gives an upper bound, Ω a lower bound, and Θ matching bounds. An average case needs probabilities, while an amortized guarantee can follow from a deterministic total across a sequence. Fixed constants and thresholds make the inequalities precise. Time and peak auxiliary space remain different resource questions, even when they describe the same program.

You are ready to carry these ideas forward when you can reconstruct a count from a trace, defend a growth bound using fixed constants, and explain the assumptions behind both. Practice doing that aloud on a small unfamiliar input. Those habits let you analyze later algorithms even when their code shape does not match an example you remember.

## Weekly Progress Checklist

### Theory

- [ ] I can state what a contract promises, choose an input-size measure, and name the event I count. <!-- checkpoint:w1-analysis-foundations -->
- [ ] I can explain why O, Ω, and Θ describe bounds while best, worst, and average select cases. <!-- checkpoint:w1-bounds-and-cases -->
- [ ] I can prove the bounds for 3n + 7 and show exactly why a zero threshold fails. <!-- checkpoint:w1-constants-thresholds -->
- [ ] I can derive counts for sequential work, triangular and geometric sums, and repeated halving. <!-- checkpoint:w1-dependent-loop-costs -->
- [ ] I can explain a deterministic amortized bound separately from an average weighted by probabilities. <!-- checkpoint:w1-amortized-growth -->
- [ ] I can account separately for input storage, returned output, and the peak auxiliary storage kept at once. <!-- checkpoint:w1-space-accounting -->

### JavaScript

- [ ] I can trace firstElement, printElements, and printPairs and identify the event counted in each. <!-- checkpoint:w1-counting-examples -->
- [ ] I can explain what early termination skips and why the linear-search invariant establishes the first match. <!-- checkpoint:w1-linear-search-analysis -->
- [ ] I can trace a binary search and explain why sorted input makes each discarded half safe. <!-- checkpoint:w1-binary-search-analysis -->

### Practice

- [ ] I wrote an attempt at every lesson prompt before opening its answer. <!-- checkpoint:w1-lesson-practice -->
- [ ] I completed the beginner assessment and showed the counts supporting my answers. <!-- checkpoint:w1-beginner-assessment -->
- [ ] I attempted the intermediate proofs, search traces, and probability-weighted expectations. <!-- checkpoint:w1-intermediate-assessment -->
- [ ] I attempted the advanced sums, output lower bounds, and analysis with two independent sizes. <!-- checkpoint:w1-advanced-assessment -->

### Reflection

- [ ] I recorded one prediction that failed and explained the reasoning that corrected it. <!-- checkpoint:w1-reflect-on-error -->
- [ ] I can give a complexity argument aloud, including its assumptions, with the solution closed. <!-- checkpoint:w1-explain-complexity -->
