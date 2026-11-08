# Week 8 - Recursion and Backtracking
<!-- lesson-id:w8-section-chapter-introduction -->

Sometimes a problem becomes easier when we ask the same question about a smaller input. That is recursion: a function delegates a smaller version of its job to another call of itself. When we need to try choices and then undo them to try alternatives, we use backtracking. This week you will use both ideas for hierarchical data and combinations, especially when taking one locally attractive choice—a greedy step—cannot settle the whole problem.

We will begin with one chain of calls so you can see where each result returns. Then we will draw branching calls and generate subsets, different orders of values, sums that reuse candidates, and letters for phone digits. Throughout, we will track the shared working array and restore it between alternatives. We will also count the cost of storing answers, because generating many answers is real work.

By the end, you should be able to say what each call promises, identify when no smaller call is needed, and prove that every branch reaches that stopping point. You will write choose/explore/undo steps and explain why the number of simultaneously waiting calls, the total running time, and the stored answers can have very different sizes.

Use the final checklist after explaining a complete small call tree and rebuilding an example without copying. In your progress logs, record bugs where a choice leaked into another branch. Include what the parent state should have been and which undo step was missing; that makes the lesson reusable.

## Learning Objectives
<!-- lesson-id:w8-section-learning-objectives -->

- Explain what a waiting function call remembers and how execution resumes when its child returns.
- Give each recursive path a stopping rule and a quantity that decreases toward that rule.
- Describe the working state, permitted choices, completed answers, and undo steps for all four generation patterns.
- Save independent copies of completed paths so later edits cannot change earlier answers.
- Justify skipping a branch by proving that no valid answer can exist inside it.
- Name your input and output parameters, then count both exploration and answer construction.

## Prerequisite Knowledge
<!-- lesson-id:w8-section-prerequisite-knowledge -->

**Before we recurse:** Imagine pausing a video at every function call. Each pause keeps a promise and a return point. We will use that intuition, then name frames, base cases, and shared state before exploring branches and counting both search work and saved answers.

Bring functions, arrays, object identity from [Week 7](week-07.md), and newest-first stacks from [Week 5](week-05.md). Every call has its own local variable bindings, but those bindings can refer to the same array object. Backtracking depends on understanding both facts at once. We use small teaching inputs: JavaScript limits how many calls can wait at once, and even a shallow search can run out of memory if it retains enough answers.

## Core Theory
<!-- lesson-id:w8-section-core-theory -->

**Here is our whiteboard route:** start with one smaller promise, expand it into a call tree, and then watch backtracking choose, explore, and undo. For every pattern, we will ask what the state means, why the next call progresses, and what must be restored before a sibling branch begins.

### A recursive call makes a smaller promise

Give each call a precise promise, called its contract. For `sumFrom(values,index)`, promise to return the sum from index through the end. At the end, there are no values to add, so return zero without another call. This stopping situation is the **base case**. Otherwise, add the current value to the answer for index+1. The remaining length, `values.length-index`, decreases each time, proving that the calls eventually reach the base case.

A call does not disappear when it calls the helper. It waits with its local index and unfinished addition. The information retained for that waiting call is a **call frame**. When the child returns, the parent finishes its addition and returns to its own parent. These waiting frames form a stack, discussed in [MDN's recursion discussion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions). Without a reachable base case, or with unchanged recursive state, the stack keeps growing until the runtime cannot hold another frame.

### A call tree counts work; a path counts stack depth

Draw one node for each call and connect it to the calls it makes: this is a **call tree**. One call on n−1 creates a chain of n calls. Two calls on n−1 create about 2^n call-tree nodes, although only O(n) frames are active along one path at a time. Two calls on separate halves behave differently: with linear combining work, each level costs O(n), and O(log n) levels give O(n log n). Ask how large the subproblems are, whether they overlap, and what work surrounds them. Counting call expressions alone does not answer those questions.

Watch for copying hidden in arguments. Passing a new array slice makes the call do more than a constant-time index update. Our recursive sum shares the input unchanged and passes only an index, so the work done by each frame is visible and easy to count.

### Backtracking temporarily borrows mutable state

Backtracking treats choices as branches of a decision tree. Make one choice, explore all answers beneath it, then undo that choice before exploring an alternative. Alternatives from the same parent are sibling branches, and each must begin with exactly the same parent state. Stanford's [backtracking lecture](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1242/lectures/11-backtracking1/) describes this as choose/explore/unchoose. We will use a shared path array as a scratchpad and save snapshots when a path becomes an answer.

`result.push(path)` saves a reference to the scratchpad itself. Later pops therefore change what all those saved references see. Use `result.push([...path])` to create a separate array containing the current choices. This is a **shallow copy**: the outer array is new, but any objects inside it are still shared. Our values are primitives, such as numbers and strings, so those nested-object changes are not an issue here.

Before coding a pattern, describe five things in words: what the current state represents, which choices are allowed, when an answer is complete, why another call makes progress, and what must be restored on return. If you cannot answer the last question, trace one sibling transition. That is where shared-state bugs usually become visible.

### Four choice rules, four contracts

**Subsets:** A subset chooses which input elements to keep, without rearranging them. At position i, either exclude the element or include it. An answer is complete once every position has a decision. Both branches advance the index; the include branch must pop its addition on return. Distinct values give unique value subsets. If equal values occupy different indexes, different decisions can produce equal arrays, so uniqueness would require a separate duplicate policy.

**Permutations:** A permutation is an ordering that uses every input position once. To fill output position depth, choose any index not yet used. Complete the answer when path length reaches n. Keep a true/false flag for each input position: it is true exactly while that position belongs to the path. Restore both the path and its flag after exploring. For distinct values, there are n! unique orders, where factorial means multiplying the available choices n, n−1, and so on down to one.

**Combination Sum:** Choose a candidate at or after a remembered start index, and allow that same index again. This makes chosen indexes nondecreasing, so `[2,3,2]` is represented only in canonical order as `[2,2,3]`. Because candidates are positive, the remaining target decreases even on reuse. Sorting lets us stop when a candidate is larger than the remainder: every later candidate is too large too. Skipping impossible branches this way is **pruning**. Zero would destroy the progress guarantee; negative values would destroy this pruning proof.

**Phone letters:** Each digit offers its own alphabet of possible letters. Depth selects the digit being filled, while the path contains one letter for each earlier digit. No used flag is needed: a letter chosen for one position remains available at another. Our function deliberately returns no results for an empty digit string. That API decision differs from subsets and permutations, whose mathematical contracts include one empty answer.

## JavaScript Implementations
<!-- lesson-id:w8-section-javascript-implementations -->

**Let’s run the calls slowly.** First predict the entry and return order; then watch the path array and flags change. After each example, check the contract, the stopping rule, the copied output, and the tradeoff between active stack depth and the number of answers retained.

We will log entering and returning so you can see the parent additions wait for smaller suffix sums.

### Demonstration 1 — Watch a recursive sum descend and return

```javascript
function sum(values) {
  function sumFrom(index) {
    console.log('enter', index);
    if (index === values.length) {
      console.log('return', index, 0);
      return 0;
    }
    const answer = values[index] + sumFrom(index + 1);
    console.log('return', index, answer);
    return answer;
  }
  return sumFrom(0);
}
console.log('total', sum([4, 7]));
```
```output
enter 0
enter 1
enter 2
return 2 0
return 1 7
return 0 11
total 11
```

In **Demonstration 1**, `[4,7]` enters indexes 0, 1, then 2. Index 2 returns zero; index 1 resumes its waiting addition and returns 7; index 0 resumes and returns 11. This reverse return process is called unwinding. A `return` exits only its own call, not every surrounding call at once. Ignoring teaching logs, time and active-frame space are both Θ(n). An iterative flat-array sum needs O(1) working space, so this example teaches call behavior rather than claiming recursion is always the best implementation.

We will generate all choices for A and B, saving a separate array at each completed path.

### Demonstration 2 — Generate subsets with exclude and include branches

```javascript
function subsets(values) {
  const result = [], path = [];
  function visit(index) {
    if (index === values.length) {
      result.push([...path]);
      return;
    }
    visit(index + 1);
    path.push(values[index]);
    visit(index + 1);
    path.pop();
  }
  visit(0);
  return result;
}
const answers = subsets(['A', 'B']);
console.log(JSON.stringify(answers));
console.log(JSON.stringify(subsets([])));
answers[0].push('changed');
console.log(JSON.stringify(answers[1]));
```
```output
[[],["B"],["A"],["A","B"]]
[[]]
["B"]
```

In **Demonstration 2**, excluding A and then B saves `[]`; including B saves `["B"]`, then its pop restores the empty path. The A branch similarly saves `["A"]` and `["A","B"]`. Before each call, path contains exactly the included values among earlier positions. The final mutation changes only the first returned array, leaving `["B"]` intact. That checks snapshot independence rather than merely counting four results.

We will fill one output slot at a time, allowing each input position only once within the current path.

### Demonstration 3 — Generate permutations with used-position flags

```javascript
function permutations(values) {
  const result = [], path = [], used = Array(values.length).fill(false);
  function visit() {
    if (path.length === values.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < values.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(values[i]);
      visit();
      path.pop();
      used[i] = false;
    }
  }
  visit();
  return result;
}
console.log(JSON.stringify(permutations([1,2,3])));
console.log(JSON.stringify(permutations([])));
```
```output
[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
[[]]
```

In **Demonstration 3**, choosing 1, 2, 3 saves the first result. Popping 3 clears its flag; popping 2 clears that flag too, so the same parent path `[1]` can next choose 3 then 2. The input never changes. Flags refer to positions, so repeated values would still produce repeated value permutations; uniqueness assumes distinct inputs. Returning as soon as the path is complete avoids scanning candidates at a finished leaf of the call tree.

We will keep candidates ordered, allow reuse, and stop a branch only when positivity and sorting prove it cannot finish.

### Demonstration 4 — Find candidate sums with reuse and pruning

```javascript
function combinationSum(candidates, target) {
  if (!Number.isSafeInteger(target) || target < 0 ||
      candidates.some(x => !Number.isSafeInteger(x) || x <= 0)) {
    throw new RangeError('Use positive integer candidates and a nonnegative target');
  }
  const choices = [...new Set(candidates)].sort((a, b) => a - b);
  const result = [], path = [];
  function visit(start, remaining) {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < choices.length; i++) {
      if (choices[i] > remaining) break;
      path.push(choices[i]);
      visit(i, remaining - choices[i]);
      path.pop();
    }
  }
  visit(0, target);
  return result;
}
console.log(JSON.stringify(combinationSum([2,3,5], 8)));
console.log(JSON.stringify(combinationSum([4,6], 3)));
console.log(JSON.stringify(combinationSum([], 0)));
console.log(JSON.stringify(combinationSum([2,2], 4)));
```
```output
[[2,2,2,2],[2,3,3],[3,5]]
[]
[[]]
[[2,2]]
```

In **Demonstration 4**, `[2,3,5]` with target 8 first reuses 2 four times, then finds `[2,3,3]` and `[3,5]`. Calling `visit(i, ...)` permits reuse; restricting future choices to that start index prevents `[5,3]` from repeating `[3,5]`. A Set removes repeated candidate values and sorting a copied array preserves the caller's input. The zero-remainder check runs before the loop, so even empty candidates produce `[[]]` for target zero. Invalid nonpositive candidates are rejected because they would break the proof.

We will select one letter per digit and count the results for both three-choice and four-choice alphabets.

### Demonstration 5 — Build phone-letter strings by position

```javascript
function phoneLetters(digits) {
  if (digits === '') return [];
  const letters = {
    2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl',
    6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz'
  };
  if (!/^[2-9]+$/.test(digits)) throw new RangeError('Digits must be 2 through 9');
  const result = [], path = [];
  function visit(index) {
    if (index === digits.length) {
      result.push(path.join(''));
      return;
    }
    for (const letter of letters[digits[index]]) {
      path.push(letter);
      visit(index + 1);
      path.pop();
    }
  }
  visit(0);
  return result;
}
console.log(JSON.stringify(phoneLetters('23')));
console.log(phoneLetters('79').length);
console.log(JSON.stringify(phoneLetters('')));
```
```output
["ad","ae","af","bd","be","bf","cd","ce","cf"]
16
[]
```

In **Demonstration 5**, digit string `23` first chooses a and then explores d, e, f, producing ad, ae, af before undoing a and trying b. `path.join('')` creates a completed string at each leaf and takes work proportional to the digit count. Include that cost in runtime. For `79`, four choices at each position give sixteen results. Empty input returns `[]`, and unmapped digits 0 and 1 are rejected rather than silently dropped.

## Worked Examples
<!-- lesson-id:w8-section-worked-examples -->

**Worked-walkthrough pause:** Draw one complete small branch before looking at the result. Mark the moment an answer is copied and the moment state is undone. This makes aliasing and missed-undo bugs visible instead of mysterious.

Trace subsets `[A,B]` by writing each decision before moving to the next position. Exclude A, then exclude B to save `[]`. Return to B's decision, include it to save `[B]`, then undo it. Back at the root, include A. Excluding B saves `[A]`; including B saves `[A,B]`. Undo B and then A to restore the original empty path. Every include/exclude sequence reaches one answer, and for distinct input no two sequences choose the same subset. That proves both completeness and uniqueness.

For permutations `[1,2,3]`, choose 1, then 2, then 3 and save the complete order. Undo 3 and 2, leaving `[1]` with only flag 0 true. You can now choose 3, then 2, to save `[1,3,2]`. Remove 1 only after all orders beginning with 1 have finished. Notice what undo means: restore the immediate parent's state. Clearing the whole path would lose the parent's choices just as surely as failing to pop would leak a child's choice.

For target 8, path `[2,2,2]` leaves 2, so one more 2 completes `[2,2,2,2]`. Backtrack to `[2]`, choose 3, and the remaining 3 permits `[2,3,3]`. A branch starting with 3 can later choose 5 and complete `[3,5]`. A branch starting with 5 cannot return to the earlier candidate 3. This index restriction removes duplicate orderings without needing to compare completed result arrays.

For digits `23`, keep a on the path while exploring d, e, and f in turn. Only after all three answers return do you replace a with b. Three first-position choices, each with three second-position choices, give nine results. For `79`, the same multiplication gives four times four, or sixteen. The alphabets do not shrink when a letter has been used elsewhere.

## Visual Explanations
<!-- lesson-id:w8-section-visual-explanations -->

**See the search tree as a map of choices.** A vertical path is the memory currently on the stack; the whole branching picture is the work. That visual distinction is the intuition behind the complexity numbers we will use.

```text
Subsets [A,B]:
                         [] at index 0
                    / exclude A       \ include A
             [] at index 1             [A] at index 1
              /       \                 /       \
             []       [B]              [A]      [A,B]

One active path is at most n choices long.
The whole call tree contains all branches, not just that path.

Mutable state discipline:
parent path -> PUSH -> child explores -> POP -> same parent path
saved answer = a separate snapshot, not the path object itself
```

Redraw the tree for three-element permutations: there are 3 choices at the root, then 2 unused positions, then 1. Contrast this with phone letters, where each digit keeps its whole alphabet regardless of earlier choices. The tree's branch counts come from the contract, so changing the reuse rule changes both the answers and the complexity.

## Complexity Analysis
<!-- lesson-id:w8-section-complexity-analysis -->

**Complexity checkpoint:** Do not stop at “there are 2^n calls.” Count the active path, the exploration tree, and the elements copied into returned answers. Output is part of the work, and pruning is valid only when its proof matches the input assumptions.

### Output is part of the work

For n distinct elements, every position has two decisions, yielding 2^n subsets. Visiting the binary call tree costs Θ(2^n), but a saved answer must copy every chosen element. Each element occurs in exactly half the subsets, so the total copied element count is n·2^(n−1) for n≥1. Thus time and stored output are Θ(n·2^n), while only O(n) working path and stack space are active at once. To include empty input uniformly, use Θ((n+1)2^n). These tight bounds describe growth; they are not names for best or worst input cases. Merely counting subsets is a different task and avoids constructing the arrays.

For permutations, n! answers each contain n values, so copying alone costs Θ(n·n!) for n≥1. We also scan n flags at each non-leaf call. There are `sum(n!/(n-d)!, d=0..n-1)` such internal nodes, which is O(n!), putting those scans within O(n·n!) as well. The output-copying work provides the matching lower bound, making the time tight. The working path, flags, and active frames need O(n) space; retaining all answers needs Θ(n·n!). Empty input has one empty permutation and constant cost, handled separately from the positive-n formula.

For d nonempty phone digits, let b₁…b_d count the choices at each position and define P=∏bᵢ, their product. There are P completed strings. Because every factor is at least three, the whole call tree has O(P) nodes; shorter prefixes do not add a larger growth term. Joining P strings of length d gives Θ(dP) time and output storage, with O(d) working space. The simpler upper bound P≤4^d is valid, but the actual product distinguishes inputs such as `23` and `79` more clearly.

### Combination sum needs different parameters

Combination sum needs parameters that describe both failed exploration and successful output. Let c be input candidate count, m distinct count, T target, and D=floor(T/minimumCandidate) when m>0. D bounds how many positive choices fit. Let V count calls actually visited, A candidate-loop tests, S saved answers, and L all saved answer lengths added together. Search costs Θ(V+A+S+L). This is **output-sensitive** accounting: it names output size, but still pays for branches with no answer. It does not justify O(L) alone.

A call tests at most m candidates, so A≤mV. With depth at most D and at most m children per call, a loose bound is V≤1+m+…+m^D. For m≥2 this gives O(m^(D+1)+S+L) search time. The nondecreasing-index rule usually removes many branches counted by that loose tree. Handle smaller m explicitly: m=1 makes a chain of at most D+1 calls and costs O(D+1+S+L); m=0 makes only the root call. Applying the exponential expression blindly would hide those different shapes.

Before the search, removing duplicates adds expected O(c) Set work under the usual hashing model, and sorting adds O(m log(m+1)) work under a comparison-sort model. JavaScript's exact sorting internals depend on the engine. Candidates, path, and frames need O(m+D+1) working space, plus sorting workspace. Stored output needs O(S+L), counting even empty answer arrays. A large D can overflow the call stack even with only one branch at each call. The depth bound relies on every candidate being positive.

## Common Mistakes
<!-- lesson-id:w8-section-common-mistakes -->

**Debug with a rewind:** Stop at the first incorrect sibling branch and ask which state the parent should have restored. Check the base case, copied snapshots, flags, and start index one by one. The list below turns common surprises into deliberate tests.

- A base case is useful only if every recursive branch moves toward it. Name a decreasing quantity.
- Return after saving a completed answer so you do not keep exploring from a finished state.
- Copy the path when saving; a reference to the scratchpad changes during later undo steps.
- Restore used flags as well as the path, or later siblings will inherit unavailable positions.
- Pass i when reuse is allowed; i+1 silently changes the combination contract.
- Sort before breaking on an oversized candidate, since an unsorted later value could still fit.
- Analyze the actual call tree rather than calling every recursion O(2^n), and count retained output separately from an O(n) path.

This broken leaf case saves the shared scratchpad itself. Use a two-element subset input to watch later pops change earlier results.

### Demonstration 1 — Broken result saving aliases the working path

```javascript-bug
if (index === values.length) {
  result.push(path);
  return;
}
```

In broken **Demonstration 1**, subsets of `[A,B]` can save four references, yet all four refer to the same path object. Such alternate references to one object are aliases. When all branches finish and pops restore path to empty, every saved entry appears empty too. Checking result length alone misses the bug; inspect contents and object identities or mutate one answer and watch the others.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w8-section-interview-and-leetcode-pattern-recognition -->

**Interview lens:** Say “state, choices, base case, undo, output” before coding. That five-part explanation quickly identifies whether a problem is a subset, permutation, combination-sum, or position-by-position generation pattern.

Translate prompt wording into choices. “All subsets” suggests include/exclude decisions, while “all orders” suggests choosing unused positions. Reusing a candidate means the index may stay unchanged, so something else must prove progress. An alphabet for each position gives a product of choice counts. Also distinguish finding any solution from returning every solution: the former can stop early, while the latter must construct every requested answer.

Before pruning, explain why no continuation of that branch can succeed. In combination sum, positivity means added values cannot reduce an overshoot, and sorting means later candidates cannot be smaller. With negative candidates, a later value could repair an overshoot, making the same break incorrect. In an interview, explicitly notice when a familiar optimization has lost the assumptions that justified it.

## Practice Exercises
<!-- lesson-id:w8-section-practice-exercises -->

**Your turn:** Trace a tiny call tree by hand, including returns and undo steps. Then test two independent saved answers for aliasing. A correct count is not enough; the arrays must remain independent after the scratchpad changes.

### Conceptual Questions

1. Compare a function making two calls of size n/2 with one making two calls of size n−1. State what else you must know before deriving total time.
2. Explain the meaning of `[[]]` for empty subsets and permutations, then explain why this phone-letter API instead chooses `[]`.

### Code Tracing

3. Draw every subset branch for `[X,Y]`. Then trace only the permutation branches beginning with 2 for `[1,2,3]`, showing flags restored between siblings.
4. Trace candidates `[2,5]` with target 7. Mark each impossible branch where pruning stops exploration and show the path saved as an answer.

### Debugging Exercises

5. Repair **Demonstration 1** in “Common Mistakes.” Design a test that detects shared answer arrays even if the returned array count is correct.
6. Explain what later siblings see if a permutation solver never clears `used[i]`. Then change reuse to i+1 in combination sum and describe the different selection problem that results.

### Implementation Exercises

7. Return every length-k combination of distinct values without reuse. Prune a branch when it has too few remaining positions to fill the missing slots, and justify that rule. Define results for k=0 and k>n explicitly.
8. Rebuild the phone-letter function, including rejection of unmapped digits. Compute the number of answers for `279` by multiplying choices rather than generating strings.

### LeetCode and HackerRank Practice

9. **[Subsets](https://leetcode.com/problems/subsets/)** — LeetCode lists this as Medium. Practice decision trees, include/exclude branches, and independent answer snapshots. Explain why O(n) active call depth can coexist with exponentially many stored results. The prior record says the official page was verified and no HackerRank exercise consulted; this rewrite performs no new verification. After reproducing the local examples, continue the syllabus topics Permutations, Combination Sum, and Letter Combinations of a Phone Number.

## Hints and Worked Solutions
<!-- lesson-id:w8-section-hints-and-worked-solutions -->

**Hint-to-solution walkthrough:** Attempt one branch with a pencil, state your invariant, and only then peek at the solution. Compare not just the answers but also when the algorithm copies state, prunes, and returns.

1. Include the nonrecursive work and whether the subproblems overlap. Two half-size calls with Θ(n) local work give Θ(n log n) time and O(log n) frame depth, excluding local allocations. Two size-(n−1) calls with constant local work give Θ(2^n) time and O(n) depth. The active path and full call tree answer different cost questions.
2. There is exactly one way to choose nothing and one way to order nothing, represented by one empty answer. The phone API treats no requested digits as no requested combinations instead. The correct base case follows the function's promised meaning, not a universal rule that empty inputs always produce the same shape.
3. The subset sequence is `[],[Y],[X],[X,Y]`. Permutations beginning with 2 are `[2,1,3]` then `[2,3,1]`. Undo choices 1 and 3 and their flags before returning from that subtree, leaving only the parent's state.
4. Path `[2,2,2]` leaves remainder 1, too small for another candidate, so it fails. Restoring to `[2]` permits choosing 5 and saving `[2,5]`. A branch beginning with 5 cannot return to candidate 2, avoiding the duplicate order `[5,2]`.
5. Save `[...path]` rather than path itself. Change one returned answer and assert that the others remain unchanged; also compare their array identities. Counting outputs alone does not establish independence.
6. A flag left true makes an input position look used in unrelated sibling branches, so valid later orders disappear. Passing i+1 in combination sum forbids reusing that candidate position and solves a different, no-reuse selection contract.
7. Compare how many positions remain with how many output slots are missing. If there are too few, no continuation can complete the path. The implementation also limits the loop so each selected first position leaves enough later positions.

### Demonstration 1 — Generate fixed-size combinations without reuse

```javascript
function chooseK(values, k) {
  if (!Number.isInteger(k) || k < 0) throw new RangeError('k must be nonnegative');
  const result = [], path = [];
  function visit(start) {
    if (path.length === k) { result.push([...path]); return; }
    const missing = k - path.length;
    if (values.length - start < missing) return;
    for (let i = start; i <= values.length - missing; i++) {
      path.push(values[i]);
      visit(i + 1);
      path.pop();
    }
  }
  visit(0);
  return result;
}
console.log(JSON.stringify(chooseK(['A','B','C'], 2)));
console.log(JSON.stringify(chooseK(['A'], 0)));
console.log(JSON.stringify(chooseK(['A'], 2)));
```
```output
[["A","B"],["A","C"],["B","C"]]
[[]]
[]
```

In **Demonstration 1**, choosing two from A, B, C explores AB and AC before returning to choose BC. Once only C remains at the root, there are too few positions to start another pair. For k=0, the initial empty path is already complete; for k>n, the root prunes immediately.

For 1≤k≤n, the number of length-k answers is C(n,k), read “n choose k.” Every explored prefix can complete and has at most k ancestors, so time is O(k·C(n,k)), matching the copying lower bound. Working space is O(k), and output costs Θ(k·C(n,k)). Handle k=0 and k>n as constant-size cases rather than substituting zero into the positive-k formula.
8. Digit 2 has three choices and digits 7 and 9 have four each. Multiplying gives 3·4·4=48 strings, each containing three letters. No enumeration is needed to establish that count.
9. Rebuild **Demonstration 2** in “JavaScript Implementations.” On small distinct inputs, check that there are 2^n results, each contains only input values, and normalized subsets are unique. Normalizing means representing equivalent subsets consistently before comparing them; together these checks help establish completeness.

## Sources and Further Reading
<!-- lesson-id:w8-section-sources-and-further-reading -->

The existing chapter records consultation on 2026-11-07. We retain that source history without claiming fresh external verification. The implementations, traces, and output-cost derivations are original teaching material aligned with the repository syllabus.

- [MDN: Functions, recursion discussion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) — the prior reading informed the explanation of recursive calls and the stack of waiting functions.
- [Stanford CS106B: Recursive Backtracking and Enumeration](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1242/lectures/11-backtracking1/) — the prior consultation used the choose/explore/unchoose framework and discussion of generating subsets.
- [LeetCode: Subsets](https://leetcode.com/problems/subsets/) — the prior reading established the official requirements for distinct input values and unique output subsets. The record reports no editorial consultation.

## Weekly Summary
<!-- lesson-id:w8-section-weekly-summary -->

**Recap:** Recursion gives each call a smaller promise; backtracking lets one mutable path serve many alternatives safely. You can now explain termination, undo state deliberately, and charge the real cost of exploring and storing answers.

You can now describe recursion as a smaller promised job followed by a return to waiting work. Backtracking adds disciplined restoration so alternatives begin from the same parent state. Before skipping a branch, prove it cannot contain an answer; before quoting a generation cost, include construction of the answers themselves. These habits transfer directly to the smaller-subtree structure of [Week 9's binary trees](week-09.md).

## Weekly Progress Checklist

### Theory

- [ ] Explain each pattern's promise, stopping case, and quantity that decreases toward termination. <!-- checkpoint:w8-recursive-contracts -->
- [ ] Derive subset and permutation costs while paying for every copied output element. <!-- checkpoint:w8-output-sensitive-analysis -->

### JavaScript

- [ ] Build choose/explore/undo code and demonstrate that saved answers are independent arrays. <!-- checkpoint:w8-snapshot-and-undo -->
- [ ] Implement pruning for positive candidates and prove why positivity and sorting make it safe. <!-- checkpoint:w8-safe-pruning -->

### Practice

- [ ] Trace entry, branch choices, undo, and return throughout a complete small call tree. <!-- checkpoint:w8-call-tree-trace -->
- [ ] Complete Subsets and build length-k combinations with justified pruning. <!-- checkpoint:w8-enumeration-practice -->

### Reflection

- [ ] Contrast the length of one active call path with the work across the entire call tree. <!-- checkpoint:w8-depth-reflection -->
- [ ] Record a shared-result bug and a test that detects aliases rather than only output count. <!-- checkpoint:w8-aliasing-reflection -->
