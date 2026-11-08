# Week 17 - Arrays and Array Operations
<!-- lesson-id:w17-section-chapter-introduction -->

Welcome to **Module 2 — Arrays**. You have practiced counting work; this week, we will use that reasoning to choose how to read, change, and copy a real data structure. A data structure is a way of organizing values so that certain operations are easy to express. After this chapter, [Module 3 — Hash Maps and Sets](week-02.md) continues the ideas of remembering membership and counting occurrences that we first meet in these array problems.

Think of daily temperatures, prices over time, scores, or records waiting to be processed. In each case, an array lets us keep values in a sequence where position matters. We will learn what each operation promises and what information you need to remember while visiting the entries. We will also follow an important source of bugs: copying an array can leave its objects shared with the original. By combining these ideas into small algorithms, you will be able to explain why a result is correct instead of relying on a method's name.

Bring the elementary cost-analysis ideas from [Module 1 — Complexity](week-01.md). We will apply that vocabulary to arrays. As you work, use pencil and paper to predict two things separately: what a call returns and what the array contains afterward. Those are often different answers.

Every JavaScript fence is an independent program, followed immediately by its exact console output. You need a runtime supporting the modern copying methods and `structuredClone` where they appear. The examples use ordinary JavaScript, with no TypeScript or packages required.

Use the final weekly progress checklist to record what you can explain with the solutions closed. Before checking an item, give yourself a small input and explain what happens. Reading a worked solution can help you learn, but reproducing its reasoning independently gives you stronger evidence of understanding.

## Learning Objectives
<!-- lesson-id:w17-section-learning-objectives -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

By the end, you should be able to separate a position's number, called an index, from the value stored there and from the array's length. You should also understand a reference: a value that points to an object rather than duplicating it. We will use these distinctions to visit dense arrays safely, implement first-match search, and choose insertion or deletion operations according to their contracts—the inputs they accept, changes they make, and results they promise.

You should be able to draw which objects are shared by an alias, a shallow copy, a selective nested copy, or a supported deep clone. These names describe different amounts of copying; the reference lessons will make each one concrete.

Knowing a method means knowing what it changes and what it returns, not just recognizing its spelling. We will distinguish **mutation**, changing an existing object, from producing a separate result. We will choose between transforming entries and asking queries that can stop early, and include the work of functions passed into methods in our cost estimates.

Finally, we will use two positions moving from opposite ends, a reader and writer moving through one array, and products summarizing entries before and after a position. For three assigned LeetCode problems, you will compare a straightforward baseline with a version that reuses information. The independent assessment checks all these outcomes before you open its answers.

## Prerequisite Knowledge
<!-- lesson-id:w17-section-prerequisite-knowledge -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

You need variables, functions, conditions, comparisons, arithmetic, and ordinary `for` loops. Remember that `return` leaves its function immediately, even from inside a loop. Also remember what `const` protects: you cannot bind that variable to a different value, but you can still change the array it references. A **callback** is simply a function you pass to another function, often to say what should happen to one entry.

Unless a lesson introduces holes, assume a **dense array**, meaning every position from zero up to its length has an entry. Arithmetic examples use finite numbers and assume intermediate results remain sufficiently precise in JavaScript's `Number` representation.

From Module 1, bring constant, linear, and quadratic growth; amortized cost spread across a sequence; auxiliary space for working state; and output space for returned results. If those terms need review, revisit Module 1 through the complexity link in the introduction. You do not need to rebuild the entire theory of asymptotic notation to start reasoning about array behavior.

## Representation: A Sequence with Indexed Positions
<!-- lesson-id:w17-section-representation-a-sequence-with-indexed-positions -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Picture an array as an ordered row of slots. Three entries occupy positions 0, 1, and 2, even when their values are 100, 100, and 500. The positions tell you where entries belong; the values are the data stored there. Equal values do not merge into one position. This matters when a task asks where a match occurs rather than what it contains, or asks you to exclude one occurrence rather than every entry equal to it.

In the traditional machine-array model, equal-sized slots occupy **contiguous memory**, meaning they sit next to one another in physical storage. Knowing a starting address and slot size lets you calculate an entry's address from its index. That model explains why direct indexed access is useful.

**JavaScript does not guarantee that an Array has contiguous physical storage.** Its arrays are objects with special behavior for length and indexed properties. An engine may represent dense numeric entries, mixed values, or sparse data differently. Read our slot drawings as logical positions you can reason about, not a promise about the engine's physical memory layout.

An array can hold different types of values, including references to other arrays and objects. You still need a sensible data contract. A function summing prices should require numeric entries instead of silently accepting arbitrary records and hoping arithmetic works. **Typed arrays**, designed for particular kinds of binary data, form a separate family. Here we study ordinary `Array` objects and the behavior their methods promise.

## Indexing, Length, and Boundary Rules
<!-- lesson-id:w17-section-indexing-length-and-boundary-rules -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

For a dense array with length `n`, entry indexes run from 0 through `n - 1`. The length is a count, so it is already past the final valid entry. Reading an absent indexed property normally gives `undefined`; JavaScript does not automatically throw an out-of-bounds exception. A loop using `i <= values.length` therefore reads once too often. That extra read can go unnoticed until `undefined` changes the result of a comparison or calculation.

To get the last entry, use `values[values.length - 1]` or `values.at(-1)`. The method understands a negative position as counting from the end. Bracket access with `-1` instead asks for a property named `"-1"`; it does not mean the last entry.

Assignment to an existing index replaces its value without inserting a position. Assignment beyond the end increases length and can leave **holes**, positions without an indexed property, between the old end and the new entry. Reducing length discards entries beyond the new boundary. Increasing it creates empty positions rather than initializing values. Let's trace replacement and truncation separately.

### Demonstration 1 — Distinguish length, last entry, and missing positions

```javascript
const scores = [12, 18, 21];
console.log(scores.length, scores[0], scores.at(-1));
console.log(scores[3], scores[-1]);
scores[1] = 20;
console.log(JSON.stringify(scores));
scores.length = 2;
console.log(JSON.stringify(scores));
```

```output
3 12 21
undefined undefined
[12,20,21]
[12,20]
```

In **Demonstration 1**, `[12, 18, 21]` has length three and last index two. `at(-1)` reads 21, while both the index-three read and the property named -1 give `undefined`. Replacing index one changes 18 to 20 without changing length. Setting length to two then removes the old index-two entry.

For a dense array, length is one greater than its largest occupied index, or zero when empty. More generally, length lies beyond every present array index, but holes—including holes created by increasing length—mean it need not count present entries or equal the largest present index plus one. Keep the dense-array assumption visible whenever you equate those quantities.

## Traversal: Visiting the Right Entries
<!-- lesson-id:w17-section-traversal-visiting-the-right-entries -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Choose an indexed loop when positions matter, when you need neighbors, or when you want control over direction. Choose `for...of` when you need each value in sequence. Neither choice requires an array copy. To visit positions backward, start at `length - 1` and continue while the index is at least zero. Empty input starts that loop at -1, so its condition fails immediately. Let's use one traversal for values and another for positions.

### Demonstration 1 — Sum values and visit positions backward

```javascript
const readings = [4, 7, 2];
let total = 0;
for (const reading of readings) {
    total += reading;
}
const reversedPositions = [];
for (let i = readings.length - 1; i >= 0; i -= 1) {
    reversedPositions.push(i);
}
console.log(total);
console.log(JSON.stringify(reversedPositions));
console.log(JSON.stringify([...readings.entries()]));
```

```output
13
[2,1,0]
[[0,4],[1,7],[2,2]]
```

In **Demonstration 1**, `for...of` adds 4, then 7, then 2, taking the total through 4, 11, and 13. The backward loop starts at index two and collects positions 2, 1, and 0. `entries()` supplies each position paired with its value; spreading those pairs collects the iterator's results into an array for display.

Avoid `for...in` for routine array traversal. It lists enumerable property keys—property names eligible for enumeration—and can include extra properties rather than just express your intent to visit sequence values. Also avoid changing membership while scanning unless your algorithm accounts for moved positions. Stable boundaries make it much easier to explain what remains unread and why the traversal finishes.

## Linear Search and Evidence from a Processed Prefix
<!-- lesson-id:w17-section-linear-search-and-evidence-from-a-processed-prefix -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Linear search visits entries until it has enough evidence to answer the query. Let's make the contract precise: return the first index whose value is strictly equal to the target, or -1 if nothing matches. Strict equality is JavaScript's `===` comparison. Returning the matching value would lose the position, and returning a boolean would answer only whether a match exists. We want a position, so the return type must express that choice.

### Demonstration 1 — Return the earliest strictly equal entry's index

```javascript
function firstIndexOf(values, target) {
    for (let i = 0; i < values.length; i += 1) {
        if (values[i] === target) {
            return i;
        }
    }
    return -1;
}
console.log(firstIndexOf([9, 2, 6], 6));
console.log(firstIndexOf([6, 6], 6));
console.log(firstIndexOf([], 6));
console.log(firstIndexOf([9, 2, 6], 5));
```

```output
2
0
-1
-1
```

In **Demonstration 1**, searching `[9, 2, 6]` for 6 rules out index zero, then index one, and returns index two. It makes three comparisons, but the returned index is two because indexes begin at zero. On `[6, 6]`, the first comparison returns zero before we visit the second copy.

Before iteration `i`, every earlier position has been ruled out. This is a **loop invariant**, a statement true at the same stage of every iteration. Initially the earlier region is empty, so the statement holds. A failed comparison extends that region by one. A successful comparison must therefore be the earliest match, and reaching the end means the ruled-out region covers the entire array. This connects each return path to the contract.

A first-position match needs constant work; an absent target needs a full scan. The deliberate strict-equality choice also means this search does not match `NaN` to itself. `NaN` is JavaScript's special numeric value for an invalid numeric result, and its equality behavior needs explicit attention. Decide what “equal” means in your contract before interpreting a test result.

## Inserting and Deleting: Position Movement
<!-- lesson-id:w17-section-inserting-and-deleting-position-movement -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Ask whether you are changing the value in an existing position or creating a new position. Replacing index 1 in `[2, 4, 6]` leaves length three. Inserting there creates a position, so the old entries from that point onward move one place right. Those later entries form the **suffix**, the remaining end of the sequence. Deleting an interior entry must close the gap and move later entries left if you want to preserve a dense sequence.

The `delete` operator removes a property; it neither closes the gap nor reduces length. That usually makes it unsuitable for removing an item from a dense list. Use `splice` for a positional edit, or **compaction**, packing retained entries together, when removing many items.

Also settle whether removal must preserve order. If order is irrelevant, replacing a removed entry with the last entry and then popping can avoid shifting a whole suffix. But that changes the sequence, so it only satisfies a contract that permits the change. An optimization is useful only if the required meaning survives it.

When order matters, pay attention to repeated front operations. A **queue** processes entries in arrival order, and implementing it by repeatedly shifting a long array can repeatedly move the surviving suffix. Later modules introduce representations suited to that workload. For a small user-interface list, a clear positional edit may still be the right engineering choice. Use the expected workload to decide whether repeated movement is a practical concern.

## End and Front Methods: push, pop, shift, unshift
<!-- lesson-id:w17-section-end-and-front-methods-push-pop-shift-unshift -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

These four methods change the existing array, also called the **receiver** of the method call. `push(...items)` adds entries at the end and returns the new length. `pop()` removes and returns the last value. At the other end, `unshift(...items)` inserts at the front and returns the new length, while `shift()` removes and returns the first value. Both removals return `undefined` on empty input.

Notice the two kinds of return values: insertion returns a length, while removal returns a value. Let's follow the changed receiver from one call to the next instead of treating each call as though it started from the original array.

### Demonstration 1 — Track front and end mutations alongside their returns

```javascript
const values = [2, 4];
console.log(values.push(6));
console.log(values.pop());
console.log(values.unshift(0));
console.log(values.shift());
console.log(JSON.stringify(values));
console.log([].pop(), [].shift());
```

```output
3
6
3
0
[2,4]
undefined undefined
```

In **Demonstration 1**, `[2, 4]` becomes `[2, 4, 6]` after push, whose return is three. Pop returns 6 and restores `[2, 4]`. Unshift then produces `[0, 2, 4]` and returns three; shift returns 0 and restores the original membership again. The final empty-array calls return `undefined` because there is no entry to remove.

If rebinding is allowed and you assign push's return to your list variable, that variable now holds a number rather than the array reference. Also distinguish one call unshifting multiple values from several calls unshifting individual values: the former preserves argument order at the front, while the latter can reverse the order you intended. Predict the whole sequence as well as its length.

## Interior Editing with splice and Ranges with slice
<!-- lesson-id:w17-section-interior-editing-with-splice-and-ranges-with-slice -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Use `splice(start, deleteCount, ...items)` when you want to edit the receiver by position. It removes deleteCount entries at start, inserts any supplied items, and returns an array containing the removed entries. With zero deletions, you can insert without removing anything. Insertion and deletion counts need not match, so a replacement can change length. A negative start counts backward from the end, subject to the method's bounds rules.

Use `slice(start, end)` when you want a shallow copy of a range while keeping the receiver unchanged. A shallow copy creates a new outer array but copies element values, including object references. The end is **exclusive**, meaning the position named by end is not included: indexes 1 through 3 require `slice(1, 4)`. Omitting end means copy through the array's end, and negative bounds count from the end. Let's compare these similarly named methods by both their results and their effects.

### Demonstration 1 — Copy a range and perform an interior edit

```javascript
const values = [2, 4, 6, 8];
const middle = values.slice(1, 3);
const removed = values.splice(1, 1, 10, 12);
console.log(JSON.stringify(middle));
console.log(JSON.stringify(removed));
console.log(JSON.stringify(values));
console.log(JSON.stringify(values.slice(-2)));
```

```output
[4,6]
[4]
[2,10,12,6,8]
[6,8]
```

In **Demonstration 1**, slicing `[2, 4, 6, 8]` from one to three copies 4 and 6, excluding index three. Splice then begins at index one, removes 4, and inserts 10 and 12. The receiver becomes `[2, 10, 12, 6, 8]`, while the return contains only `[4]`. Slicing its last two positions gives `[6, 8]`.

The removed array is a separate outer container. Had the removed entries been objects, they would still be references to those same objects. A new outer array alone does not establish independence at every nested level.

## Mutable and Immutable Workflows
<!-- lesson-id:w17-section-mutable-and-immutable-workflows -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

A **mutable** function changes the array its caller supplied. An **immutable workflow** produces a changed array while preserving the original array's membership and order. Neither style is universally better. Working **in place**, on the existing array, can avoid allocating an output array. Independent copies can make undo, comparison with prior state, and application state updates easier to reason about. State the promise clearly so callers know whether their array will change.

Let's create an extended copy and a copy with one replacement, then check what the source still contains.

### Demonstration 1 — Produce changed copies while keeping the original order

```javascript
const original = [5, 8];
const extended = [...original, 13];
const edited = original.with(0, 7);
console.log(JSON.stringify(original));
console.log(JSON.stringify(extended));
console.log(JSON.stringify(edited));
console.log(original === extended);
```

```output
[5,8]
[5,8,13]
[7,8]
false
```

In **Demonstration 1**, spreading `[5, 8]` into `extended` copies those entries and adds 13. The call to `with` makes another copy with position zero replaced by 7. The original remains `[5, 8]`, and the final comparison is false because original and extended are different array objects.

“Nonmutating method” describes the method's own effect on its receiver. A callback passed to `map` can still change objects, and result entries can still share objects with the source. Similarly, copying an array and then mutating that copy can preserve the caller's order while allocating linear storage. Explain behavior and allocation separately; creating an independent outer result still costs space.

## References, Values, and Shallow Copying
<!-- lesson-id:w17-section-references-values-and-shallow-copying -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Assignment copies a value, but you need to know what kind of value it copies. For a number, it copies the number. For an array or object, it copies a **reference**, a value that identifies the existing object. Assigning an array to another variable therefore gives you an **alias**, another name referring to the same array.

A shallow copy using spread, `slice()`, or `Array.from` does create a new outer array. It copies each element value into that container. If an element value is an object reference, both containers still lead to the same object. Let's follow those paths through an outer array, a record, and its nested detail object.

### Demonstration 1 — Follow aliases and shared objects through shallow copies

```javascript
const original = [{ score: 1, detail: { level: 2 } }];
const alias = original;
const shallow = original.slice();
alias.push({ score: 3, detail: { level: 4 } });
shallow[0].score = 9;
const records = original.map((item) => ({ ...item }));
records[0].score = 20;
records[0].detail.level = 7;
console.log(original === alias, original === shallow);
console.log(original.length, shallow.length);
console.log(original[0].score, records[0].score);
console.log(original[0].detail.level);
```

```output
true false
2 1
9 20
7
```

In **Demonstration 1**, original and alias point to the same array, so the first identity comparison is true. Shallow points to a different outer array, making the second comparison false. Pushing through alias raises original's length to two while shallow stays at one. That is an independent membership change.

The first record itself is shared, so assigning score 9 through shallow is visible through original. Mapping to new record objects then lets records hold score 20 independently. However, copying a record also copies its `detail` reference, so changing its nested level to 7 still changes what original sees. Draw the path all the way to the edited field. Stopping at the outer brackets would miss the remaining shared object.

For dense arrays, spread and slice are convenient ways to copy every entry. Spread consumes an **iterator**, something that supplies values one after another, whereas slice copies an indexed range. Their behavior differs for sparse arrays, which contain holes; we will trace that in **Holes, undefined, and Shared Initialization**. Both full-copy operations process entries rather than copying just one reference, so the new outer array has linear output size.

## Deep Cloning and Copying Only the Changed Path
<!-- lesson-id:w17-section-deep-cloning-and-copying-only-the-changed-path -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Decide which fields you intend to change, then copy every object along the path to those fields. A selective update might create a new outer array, a new record at one position, and a new detail object while sharing untouched records. That can preserve previous state without duplicating every reachable object. It requires knowing the data's shape and which parts callers expect to remain independent. This collection of objects and reference connections is often called a **data graph**.

`structuredClone` makes a **deep clone** of supported data, following nested references to create an independent graph. It supports cycles, where following references eventually leads back to an earlier object. It also preserves sharing within the clone: two original references to one object become two references to the same cloned object.

This is a data-copying facility, not a universal copier of behavior. Functions cannot be cloned. Custom prototypes (objects providing inherited behavior), accessors (properties whose reads or writes run functions), and some host objects supplied by the runtime do not all retain their original semantics through ordinary cloning. Unsupported inputs can throw.

Turning data into JSON text and parsing it back is **serialization**, representing data in a transferable format, with different restrictions. That round trip cannot handle ordinary cycles, loses unsupported properties, and turns values such as dates into strings. Let's compare a selective nested copy with a supported deep clone on ordinary data.

### Demonstration 1 — Isolate a nested field with selective and deep copies

```javascript
const original = [{ detail: { level: 2 } }];
const selective = original.map((item) => ({
    ...item,
    detail: { ...item.detail, level: 5 }
}));
const deep = structuredClone(original);
deep[0].detail.level = 9;
console.log(original[0].detail.level);
console.log(selective[0].detail.level);
console.log(deep[0].detail.level);
```

```output
2
5
9
```

In **Demonstration 1**, the original level begins at 2. The mapping callback creates a new record and a new detail object with level 5. The deep clone gets its own nested detail object, so setting its level to 9 leaves the other two results at 2 and 5. Each edit reaches a distinct object at the edited depth.

Count clone cost against all reachable data, not just the outer length. A one-entry array can lead to thousands of nested records. Choose the ownership contract first—who is allowed to observe which changes—then choose the copy depth and include the copied structure in memory accounting.

## Membership, Equality, and First-Match Queries
<!-- lesson-id:w17-section-membership-equality-and-first-match-queries -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Start with the shape of the answer you need. `includes` returns a boolean for membership. `indexOf` returns the first matching index or -1. `find` returns the first value passing a **predicate**, a callback asking a yes-or-no question, or `undefined` if none passes. `findIndex` returns that position or -1 instead. `some` asks whether any entry passes, and `every` asks whether all entries pass. These queries can stop as soon as they have enough evidence, so a particular call may inspect fewer than all entries.

Equality matters as much as the return type. `includes` uses **SameValueZero**, an equality rule under which `NaN` matches itself and positive and negative zero match. `indexOf` uses strict equality, so it cannot find `NaN`. Both compare objects by **identity**: whether references identify the very same object, rather than whether its fields look alike. A newly created `{ id: 1 }` is a different object from an existing record with that field. Use a predicate when you want to inspect record contents. Let's make these differences visible.

### Demonstration 1 — Choose membership, a matching value, or a matching index

```javascript
const record = { id: 1 };
const records = [record, { id: 2 }];
console.log(records.includes(record), records.includes({ id: 1 }));
console.log(records.find((item) => item.id === 2).id);
console.log(records.findIndex((item) => item.id === 3));
console.log(records.some((item) => item.id > 1));
console.log([NaN].includes(NaN), [NaN].indexOf(NaN));
console.log(
    [].some(() => true),
    [].every(() => false)
);
```

```output
true false
2
-1
true
true -1
false true
```

In **Demonstration 1**, records includes the original record reference but not a newly constructed lookalike. The predicate looking for id 2 finds that record, while id 3 has index -1. Some stops when id 2 establishes that an id exceeds one. The NaN query then shows the equality difference between includes and indexOf.

On empty input, some returns false because no entry supplies a successful witness. Every returns true because no entry violates the condition; its callback never runs. A successful find can itself return `undefined` when that is the stored value, so the returned value alone cannot always prove presence. Use findIndex or some if that distinction matters.

Never use an indexOf result directly as a condition. Index zero is **falsy**, treated as false in a condition, while the failure value -1 is **truthy**, treated as true. Compare explicitly against -1 to express the actual success rule.

## map, filter, and Callback Contracts
<!-- lesson-id:w17-section-map-filter-and-callback-contracts -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Choose `map` to transform each visited position into an output position. Choose `filter` to retain entries whose callback result is truthy, keeping their relative order. Both create new outer arrays. Filtering object entries still copies their references, so it does not isolate those objects from the source. A map callback must return the transformed value. In particular, an arrow function with a block body needs an explicit `return`; merely calculating a value inside the block does not return it.

Common callbacks used while visiting entries receive `(value, index, array)`. Methods including `map`, `filter`, `find`, `some`, `every`, and `forEach` also accept an optional `thisArg`, a value supplied as `this` when calling an ordinary function. An arrow function instead keeps its surrounding **lexical this**, meaning the `this` determined where the arrow was written; thisArg does not replace it.

A **closure**, a function retaining access to variables from its surrounding scope, is often a clearer way to supply a threshold. Still, understanding thisArg helps you read existing code correctly. Let's compare value transformation, threshold filtering, and a callback that also uses the index.

### Demonstration 1 — Transform entries and filter with an explicit callback context

```javascript
const values = [3, 6, 9];
const doubled = values.map((value) => value * 2);
const selected = values.filter(
    function (value) {
        return value > this.minimum;
    },
    { minimum: 4 }
);
console.log(JSON.stringify(doubled));
console.log(JSON.stringify(selected));
console.log(JSON.stringify(values.map((value, index) => value + index)));
console.log(JSON.stringify(values));
```

```output
[6,12,18]
[6,9]
[3,7,11]
[3,6,9]
```

In **Demonstration 1**, mapping `[3, 6, 9]` doubles each value into `[6, 12, 18]`. The ordinary filter callback reads `this.minimum` as 4, retaining 6 and 9. Adding the index produces 3 plus zero, 6 plus one, and 9 plus two. The source still contains its original values because these callbacks only read numbers and return results.

Before passing an existing function directly as a callback, compare its parameters with the method's callback contract. `parseInt` expects a **radix**, the numeric base, as its second argument; map supplies an index in that position. Write `text => parseInt(text, 10)` to state the intended base. Also count callback work: searching another length-n array inside every mapping call can make an apparently simple transformation quadratic.

## reduce, Accumulators, and Side Effects
<!-- lesson-id:w17-section-reduce-accumulators-and-side-effects -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Use `reduce` when you want to carry a growing answer from entry to entry. That carried state is the **accumulator**. Its callback receives the accumulator, current value, index, and receiver, and its return becomes the next accumulator. Forgetting the return breaks this chain even if changes inside one call seemed to work. Reduce also does not take the same thisArg parameter as map, so do not assume all iterative methods have identical calling conventions.

Supply an initial value whenever empty input is possible. For addition, zero is the **identity**, a value that leaves another value unchanged when combined with it. Without an initial value, reduce uses the first present entry as the accumulator on nonempty input, but throws on empty input. A suitable identity gives you a sensible empty result and a clear starting state. Let's compare a numeric sum, an object accumulator, and a loop-like callback used for side effects.

### Demonstration 1 — Carry numeric and object accumulators through a reduction

```javascript
const values = [3, 6, 9];
console.log(values.reduce((sum, value) => sum + value, 0));
console.log([].reduce((sum, value) => sum + value, 0));
const stats = values.reduce(
    (state, value) => {
        state.count += 1;
        state.total += value;
        return state;
    },
    { count: 0, total: 0 }
);
console.log(JSON.stringify(stats));
let total = 0;
values.forEach((value) => {
    total += value;
});
console.log(total);
```

```output
18
0
{"count":3,"total":18}
18
```

In **Demonstration 1**, the sum over `[3, 6, 9]` starts at zero and becomes 3, then 9, then 18. Reducing an empty array with that initial zero returns zero without calling the callback. The object accumulator begins with count and total both zero; each callback changes those fields and returns the same accumulator, eventually yielding count three and total eighteen. That object was allocated for this call, so these updates do not mutate the input numbers.

Do not rebuild a growing array with spread on every reduction step without counting the repeated copying of prior output. Those copies can accumulate quadratic work. A plain loop may express the task more clearly.

`forEach` is intended for **side effects**, changes or observable actions other than a returned result. It returns `undefined`; a return inside its callback exits only that callback invocation, not the surrounding function. Use a loop or a short-circuit query when early termination is part of the contract.

## Holes, undefined, and Shared Initialization
<!-- lesson-id:w17-section-holes-undefined-and-shared-initialization -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

A **hole** is a position with no indexed property. It differs from a present entry whose value happens to be `undefined`. For example, `Array(3)` has length three but no present indexed entries. That distinction changes which callbacks run.

On ordinary arrays without inherited indexed properties—properties supplied through another object in the inheritance chain—`map`, `filter`, `forEach`, `some`, `every`, and `reduce` skip holes. Map leaves the corresponding output positions missing too; filter packs the selected present entries together. Find and findIndex instead visit every position and observe holes as `undefined`. Array iteration and spread also produce `undefined` for holes. Includes can match that undefined value, while indexOf skips absent entries. Let's use property-presence checks to observe what a value read alone cannot distinguish.

### Demonstration 1 — Compare missing entries and shared initialization values

```javascript
const sparse = Array(2);
const explicit = [undefined, undefined];
console.log(0 in sparse, 0 in explicit);
console.log(sparse.map(() => 7).join('|'));
console.log(JSON.stringify([...sparse].map(() => 7)));
console.log(sparse.includes(undefined), sparse.indexOf(undefined));
const shared = Array(2).fill({ count: 0 });
shared[0].count = 5;
console.log(JSON.stringify(shared));
const separate = Array.from({ length: 2 }, () => ({ count: 0 }));
separate[0].count = 5;
console.log(JSON.stringify(separate));
```

```output
false true
|
[7,7]
true -1
[{"count":5},{"count":5}]
[{"count":5},{"count":0}]
```

In **Demonstration 1**, `Array(2)` has no property at zero, while `[undefined, undefined]` does, giving false and true for the presence checks. Mapping the sparse array never calls the callback, so joining its two missing positions gives only the separator. Spreading first creates two present undefined entries, so map now visits both and produces `[7, 7]`.

Fill writes the same supplied value into each position; it does not call a factory to create fresh objects. Both entries in shared therefore reference one record, and setting one count to 5 is visible at both positions. The Array.from factory runs separately for each entry, so separate's second record keeps count zero.

JSON array serialization displays both holes and explicit undefined entries as `null`, so JSON alone cannot establish property presence. Use `in` when that distinction matters. During callback traversal, methods generally capture the initial length, but later writes and deletions can still affect what they observe. Keep the input unchanged while learning these ordinary contracts so movement and mutation do not obscure the hole behavior.

## Sorting and Reversing Without Losing Meaning
<!-- lesson-id:w17-section-sorting-and-reversing-without-losing-meaning -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

`sort` changes its receiver and returns that same array. By default it compares string representations, which is why numeric-looking values may end up in surprising order. For numeric ordering, supply a **comparator**, a function describing how two entries should be ordered, such as `(a, b) => a - b`.

A comparator returns a negative number for before, zero for equivalent, and a positive number for after. A boolean alone cannot express all three relationships consistently. Keep the comparator consistent and avoid changing the data during comparisons. Let's compare default ordering, numeric ordering, and changed copies.

### Demonstration 1 — Compare numeric sorting with default string ordering

```javascript
const values = [10, 2, 1];
console.log(JSON.stringify([...values].sort()));
console.log(JSON.stringify(values.toSorted((a, b) => a - b)));
console.log(JSON.stringify(values.toReversed()));
console.log(JSON.stringify(values));
const mutable = [3, 1, 2];
console.log(mutable.sort((a, b) => a - b) === mutable);
console.log(JSON.stringify(mutable.reverse()));
```

```output
[1,10,2]
[1,2,10]
[1,2,10]
[10,2,1]
true
[3,2,1]
```

In **Demonstration 1**, default sorting a copy of `[10, 2, 1]` yields `[1, 10, 2]` because the comparison uses strings. The numeric comparator instead gives `[1, 2, 10]`. Reversing a copy of the original happens to give the same numbers here, but it follows the original order backward rather than sorting them. The source remains `[10, 2, 1]`. On mutable, sort returns the very same receiver, so the identity check is true before reverse changes its order again.

Modern toSorted and toReversed return shallow changed copies. Copying first and calling sort or reverse is another way to preserve source order. Current JavaScript requires **stable sorting**, meaning entries that compare equal keep their relative order. It does not prescribe one universal algorithm or universal time and workspace bounds. If you assume O(n log n) comparison sorting in an analysis, name that model rather than presenting it as a guarantee of ECMAScript, the JavaScript language standard.

## Supplementary Array Vocabulary
<!-- lesson-id:w17-section-supplementary-array-vocabulary -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Here are several more contracts you will meet in existing code. `concat` builds a shallow combined array, while `join` makes a string with separators between entries. `flat(depth)` removes layers of nesting up to the chosen depth; `flatMap` transforms entries and flattens one level of the mapped results. Neither operation is a general deep clone. `fill` overwrites a range. `copyWithin` copies a range to another position in the same array, keeps length unchanged, and has defined behavior when source and destination overlap.

`toSpliced` is a copying counterpart to splice, but its return is the changed copy, not an array of removed entries. `with(index, value)` returns a shallow copy with one position replaced; it accepts negative indexes and throws for an out-of-range index. `findLast` and `findLastIndex` search from the end rather than the beginning.

`keys`, `values`, and `entries` return iterators that supply positions, values, or position/value pairs on demand. Creating one is different from consuming it to collect all results. Let's trace these contracts with small inputs so you can connect each name to its result type.

### Demonstration 1 — Read the return contracts of supplementary array methods

```javascript
const a = [1, 2, 3];
console.log(
    a.at(-1),
    a.every((x) => x > 0)
);
console.log(a.join(':'));
console.log(JSON.stringify(a.concat([4])));
console.log(JSON.stringify([1, [2, [3]]].flat(2)));
console.log(JSON.stringify([1, 2].flatMap((x) => [x, x * 10])));
console.log(JSON.stringify(Array(3).fill(7)));
console.log(JSON.stringify([1, 2, 3, 4].copyWithin(1, 2)));
console.log(JSON.stringify(a.toSpliced(1, 1, 8)));
console.log([1, 2, 4].findLast((x) => x % 2 === 0));
console.log([1, 2, 4].findLastIndex((x) => x % 2 === 0));
console.log(JSON.stringify([...a.keys()]));
console.log(JSON.stringify([...a.values()]));
console.log(JSON.stringify([...a.entries()]));
console.log(JSON.stringify(Array.from({ length: 3 }, (_, i) => i * 2)));
console.log(JSON.stringify(Array.of(3)), Array.isArray(a));
```

```output
3 true
1:2:3
[1,2,3,4]
[1,2,3]
[1,10,2,20]
[7,7,7]
[1,3,4,4]
[1,8,3]
4
2
[0,1,2]
[1,2,3]
[[0,1],[1,2],[2,3]]
[0,2,4]
[3] true
```

In **Demonstration 1**, a starts as `[1, 2, 3]`: at reads the final 3, every confirms all values are positive, and join produces a string with colons. Flat removes two nesting levels from `[1, [2, [3]]]`. FlatMap turns each input into a pair and removes that one layer, giving `[1, 10, 2, 20]`. CopyWithin copies the final two entries of `[1, 2, 3, 4]` starting at index one, yielding `[1, 3, 4, 4]` without changing length.

ToSpliced returns `[1, 8, 3]` as a changed copy. Searching from the end finds value 4 at index two. Spreading the keys, values, and entries iterators consumes them into completed arrays for printing.

Array.from accepts **iterable** input, which can supply an iterator, or **array-like** input, which has a length and indexed entries. Its optional callback maps as it constructs; here the index builds `[0, 2, 4]`. `Array.of(3)` creates `[3]`, avoiding the length-only construction of `Array(3)`, and Array.isArray identifies arrays. Learn these contracts as you need them, beginning with the core methods instead of trying to memorize the whole vocabulary at once.

## Two Pointers: Opposite Ends
<!-- lesson-id:w17-section-two-pointers-opposite-ends -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

In array algorithms, a **pointer** can simply mean an index marking a position; it need not be a machine address. Two pointers let the relationship between two positions describe unfinished work. For in-place reversal, put `left` at the first index and `right` at the last. Swap their values, then move both inward. The outer regions are now final, while the middle still needs reversing. Stop when the positions meet or cross. Let's watch the fixed regions grow.

### Demonstration 1 — Reverse an array by fixing positions from both ends

```javascript
function reverseInPlace(values) {
    let left = 0;
    let right = values.length - 1;
    while (left < right) {
        const saved = values[left];
        values[left] = values[right];
        values[right] = saved;
        left += 1;
        right -= 1;
    }
    return values;
}
console.log(JSON.stringify(reverseInPlace([2, 4, 6, 8, 10])));
console.log(JSON.stringify(reverseInPlace([])));
```

```output
[10,8,6,4,2]
[]
```

In **Demonstration 1**, `[2, 4, 6, 8, 10]` first swaps 2 and 10. Then it swaps 4 and 8, leaving 6 untouched in the center. Each swap fixes two final positions. With odd length, the middle entry already belongs there, so a self-swap is unnecessary. Empty input begins with right at -1 and performs no swaps.

Reversal needs no sorted-input assumption: the destination of each entry follows from its position. Other opposite-end techniques, such as eliminating candidates in sorted pair search, need an ordering argument before moving a pointer. Two variables alone do not prove correctness; explain why completed or discarded regions are safe. Continue with [Two Pointers](week-03.md) for broader applications of that reasoning.

## Reader and Writer: Stable In-Place Removal
<!-- lesson-id:w17-section-reader-and-writer-stable-in-place-removal -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Forward splice removal can skip an entry because deletion moves values. Start with `[-1, -2, 3]`. Removing index zero moves -2 into index zero; advancing to index one then misses it. Traversing backward repairs that correctness problem, since removing a later entry does not move unvisited earlier positions. It does not remove every cost problem, though: repeated interior deletions may still shift long surviving suffixes again and again.

A reader/writer scan avoids those repeated shifts. The **reader** marks the original entry we are inspecting; the **writer** marks the next slot for a retained value. Before each read, positions before writer contain exactly the qualifying values from the processed prefix—the already read beginning—in their original order. That is the invariant we want to maintain.

Writer never moves ahead of reader. Consequently, writing a retained value can only overwrite an already processed position or the position just read; it cannot destroy future input. After all original entries are read, **truncate** the array by setting its length to the retained count. Let's use that approach to retain nonnegative numbers.

### Demonstration 1 — Compact qualifying entries without shifting each deletion

```javascript
function keepNonnegative(values) {
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
console.log(JSON.stringify(keepNonnegative([-1, -2, 3])));
console.log(JSON.stringify(keepNonnegative([4, -1, 5, -2])));
console.log(JSON.stringify(keepNonnegative([-3])));
```

```output
[3]
[4,5]
[]
```

In **Demonstration 1**, input `[4, -1, 5, -2]` first retains 4 at writer zero. Rejecting -1 leaves writer at one. Reader two then writes 5 into position one, safely behind unread input. Rejecting -2 leaves writer at two, and setting length to two removes the stale suffix. The result is `[4, 5]`. On `[-3]`, writer never advances and truncation produces `[]`.

This removal is **stable**, meaning retained entries keep their relative order. Because the same array is mutated, every alias sees its new membership. Filter is convenient when a separate output array is allowed. Both approaches scan linearly with constant-cost predicates, but their allocation contracts differ: one reuses the input, and the other allocates retained output.

## Prefix and Suffix Products: Excluding One Position
<!-- lesson-id:w17-section-prefix-and-suffix-products-excluding-one-position -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Suppose every output position needs the product of all input entries except the one at that position. A full scan for each answer is correct but repeatedly multiplies overlapping groups. We can reuse those contributions. A **prefix** summarizes entries before a position; a **suffix** summarizes entries after it. A **strict prefix** excludes the current entry itself. For multiplication, an empty region contributes 1, the **multiplicative identity**, because multiplying another product by 1 leaves it unchanged.

For `[2, 3, 4]`, the strict prefixes are `[1, 2, 6]`: nothing before index zero, just 2 before index one, and 2 times 3 before index two. The strict suffixes are `[12, 4, 1]`. Multiply corresponding contributions to obtain `[12, 8, 6]`.

You do not need to store both complete contribution arrays. A forward pass writes prefixes into the output, then a backward pass multiplies each output by a running suffix. At each position, use the running contribution before multiplying in the current input. Reversing those updates would include the very entry the contract requires you to exclude.

With one zero, only the answer at that zero's position can be nonzero, because every other product includes it. With two zeros, every answer includes at least one zero. Prefix/suffix multiplication handles both situations without division or a special division branch, and negative numbers follow ordinary multiplication rules.

Our local contract returns an empty array for empty input and `[1]` for a singleton, whose answer is an empty product. An external problem may exclude those inputs, but defining them locally makes the boundaries explicit. The full baseline and optimized code appear in **Hints and Worked Solutions, Demonstration 5**, after the independent assessment.

## Worked Examples: Trace State Before Updating
<!-- lesson-id:w17-section-worked-examples-trace-state-before-updating -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Separating membership changes from shared record changes

Start with `source = [{ count: 1 }]` and `copy = [...source]`. Draw two outer arrays pointing to one first record. Appending a second record to copy adds membership to only that outer array. Setting `copy[0].count` instead follows the shared reference and changes the first record both arrays see. To isolate count, create a new record too. If count lives inside a nested detail object, that object must also be copied. The starting outer copy is the same, but the required depth depends on the field you plan to edit.

### Compaction without losing unread entries

Follow `[4, -1, 5, -2]` with a row for each read. Reader zero retains 4 at writer zero, then advances writer to one. Reader one rejects -1, so writer stays put. Reader two copies 5 into position one, a position we have already read, then advances writer to two. Reader three rejects -2. At this point the correct retained prefix is `[4, 5]`, but stale entries remain afterward. Truncating to writer two completes the contract. A correct prefix alone is not yet the promised array.

### A running minimum for chronological prices

For prices `[9, 3, 7, 2, 8]`, begin with 9 as the only eligible earlier purchase price. Selling at 3 would lose money, so the best permitted profit stays zero. Then remember 3 as the cheapest purchase for future days. Selling at 7 earns 4, which we retain as the best completed profit. Later, price 2 improves the purchase candidate without erasing that completed profit. Selling at 8 then improves the answer to 6. The running minimum summarizes eligible purchases; the best profit summarizes completed transactions. We need both kinds of evidence.

On decreasing prices, zero remains the answer because the contract allows taking no transaction. Subtracting the global minimum from the global maximum ignores which day came first; it can describe a sale made before its purchase. Sorting similarly destroys day order. The chronological requirement is part of the problem, so any optimization must preserve it.

## Visual Explanations
<!-- lesson-id:w17-section-visual-explanations -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

If your reader provides the array lab here, use it to step through pointer movement and changes to the array. The static diagrams also work on their own. Before advancing a visualization, predict which value will move, which reference will be followed, or which state variable will change. Then explain the result instead of only watching the animation. In the first diagram, R marks the next reader position and W the next retained-output slot.

```text
index:         0    1    2    3
value:        [4,  -1,   5,  -2]
                         R
                   W
retained:     [4]
next action: copy value at R to W, then advance both
```

```text
original --> array A --> record R --> detail D
alias    --> array A
shallow  --> array B --> record R
records  --> array C --> record S --> detail D
deep     --> array E --> record T --> detail F
```

In the reference diagram, changing array A's membership leaves array B's membership alone. But both A and B lead to record R, so an edit to R is visible through both. Record S is separate from R yet still leads to detail D, so edits to D are visible through S too. Follow the entire path to the changed field: a shared object deeper in that path can carry a mutation across otherwise independent copies.

The final diagram combines strict products for `[2, 3, 4]`. At index one, the prefix contributes 2 and the suffix contributes 4, making 8 while excluding the current 3. At either edge, the empty side contributes 1. Use that picture to justify the update order in the two-pass implementation.

```text
input:          [2,  3, 4]
strict prefix:  [1,  2, 6]
strict suffix:  [12, 4, 1]
answer:         [12, 8, 6]

for position i: combine everything before i with everything after i
```

## Complexity Analysis: Costs Under an Explicit Model
<!-- lesson-id:w17-section-complexity-analysis-costs-under-an-explicit-model -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

For this table, use the conventional **dense dynamic-array model**: an array stores a dense sequence and can grow its capacity as needed. Assume constant-cost entry reads, writes, arithmetic, comparisons, and callbacks unless we specify otherwise. JavaScript defines observable behavior without guaranteeing that every engine realizes these costs.

Special features can change the work behind an apparently simple access. Proxies can intercept operations, accessors can run functions on property access, and huge nested data or expensive callbacks can introduce their own size-dependent work. Analyze those separately. In the table, `n` is array length, `k` is the number of copied entries, and `m` is the number of inserted entries.

| Operation                                      | Time in the stated model                                      | Additional storage                   | Explanation                                         |
| ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------- |
| Known-index read or replacement                | O(1)                                                          | O(1)                                 | No search or positional insertion                   |
| `push`                                         | Amortized O(1) per appended entry                             | Capacity-dependent                   | Occasional backing-store growth can take O(n)       |
| `pop`                                          | O(1)                                                          | O(1)                                 | Remove the end entry                                |
| `shift`, `unshift`                             | O(n), plus inserted entries                                   | Engine-dependent                     | Dense-array positions may need reindexing           |
| `splice`                                       | O(n + m) worst case                                           | Removed output plus engine workspace | Move a suffix and insert entries                    |
| `slice`, spread, `concat`                      | O(k) copied entries                                           | O(k) output                          | Shallow copying still processes entries             |
| `includes`, `indexOf`, `find`, `some`, `every` | O(n) worst case                                               | O(1)                                 | Early exit may improve a particular input           |
| `map`, `filter`, `forEach`                     | Θ(n) for dense arrays                                         | O(n) output for map/filter           | Callback cost must be included                      |
| `reduce`                                       | Θ(n) with constant callback                                   | Accumulator-dependent                | Growing copies can change the total cost            |
| `reverse`, full `fill`, full `copyWithin`      | O(n)                                                          | O(1) algorithmic working state       | Visit the affected range                            |
| `sort`                                         | Engine-dependent; O(n log n) comparison-sort model often used | Engine-dependent                     | No universal ECMAScript time or workspace guarantee |
| Copying changed-order methods                  | Copy cost plus transformation cost                            | O(n) output                          | A new outer array is allocated                      |
| Reader/writer compaction                       | Θ(n)                                                          | O(1) auxiliary                       | At most one retained write per read                 |
| Pair enumeration                               | Θ(n²) worst case                                              | O(1) auxiliary                       | Compare distinct pairs                              |
| Prefix/suffix products                         | Θ(n)                                                          | Θ(n) output, O(1) beyond output      | Two passes reuse partial products                   |
| Stock running minimum                          | Θ(n)                                                          | O(1) auxiliary                       | Retain the best eligible earlier purchase           |

An amortized push bound does not promise that every push costs constant time. Suppose capacity grows by a fixed multiplier when more room is needed; this is **geometric capacity growth**. Some appends pay for copying existing entries, but those copies add to linear work across a long append sequence. No random-input assumption is needed. Repeated shift behaves differently: moving successively shorter suffixes can add to quadratic work. Module 1 develops the sums behind these distinctions.

Choose a size measure matching the data actually processed. Joining depends on all produced characters, not just the number of entries. Flattening depends on visited nested structure and output, and deep cloning depends on the reachable graph.

A Set-based duplicate scan is expected O(n) under the usual efficient **hash-table model**, which organizes keys to make membership queries efficient on average under its assumptions. It keeps O(n) membership information. ECMAScript does not mandate one particular hash-table implementation or unconditional constant-time lookup. Keep that expected-cost assumption separate from the deterministic amortized append argument.

Count the storage allocated and retained, rather than counting variable names. One variable may refer to an n-entry output. For prefix/suffix products, “O(1) beyond the output” states the useful distinction: the returned array is linear, but running state is constant. Calling all additional space O(1) would hide that array. Also distinguish **peak reachable memory**, the most data still accessible at one time, from the cumulative allocation caused by many temporary copies.

## Common Mistakes and Repair Strategies
<!-- lesson-id:w17-section-common-mistakes-and-repair-strategies -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

An **off-by-one** error makes a boundary one position too early or too late. Such bugs often survive small JavaScript tests because an extra read gives undefined instead of throwing. Include empty arrays and searches for undefined under a clearly defined dense-input contract. For a surprising method call, write two columns: the returned value and the receiver afterward. That quickly exposes whether you confused a new length, removed segment, selected value, or changed copy.

If a copy appears to change by itself, draw arrows to objects instead of writing duplicated object text that suggests independence. If removal skips an entry, trace which value moves into the deleted position and which index is visited next. If a short transformation is slow, inspect its callback for another search or repeated copying of growing output. One written expression can hide several traversals and allocations; count what executes.

Do not infer whether find succeeded from the truthiness of its result: zero, false, and undefined can all be valid stored values. Check presence using a contract that distinguishes it unambiguously. Similarly, supply the intended numeric ordering instead of assuming default sort will do it. If you append while using the changing length as your stopping rule, explain whether visiting newly appended values is intentional and how the scan will terminate. A clear loop with a stated invariant is easier to defend than a compact expression with unclear ownership or stopping behavior.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w17-section-interview-and-leetcode-pattern-recognition -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Before reaching for a pattern, ask what must be returned, whether the input may change, what equality means, and what empty input should do. Describe a correct baseline first. On a small example, it gives you a concrete result to compare with the optimized version and exposes which questions you are answering repeatedly. Then look for information you can retain instead of recomputing.

- [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) — LeetCode, Easy. Your result says whether any value appears more than once. Compare checking pairs with remembering values already visited. The solutions introduce a Set; [Module 3 — Hash Maps and Sets](week-02.md) develops its model and memory trade-offs further. Its existing route remains `/app/weeks/2`.
- [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) — LeetCode, Medium. Each answer excludes its own position, keeps the original output order, and uses no division. Reuse prefix and suffix contributions to avoid repeated multiplication. Explain the zero cases and distinguish returned storage from working state.
- [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) — LeetCode, Easy. A purchase must happen before its sale. Compare enumerating every legal pair with scanning in day order while keeping the cheapest earlier price and the best completed profit.

These descriptions and solutions are original teaching material rather than reproduced platform statements or editorials. We explicitly define local behavior for empty and singleton inputs even when an external judge's constraints are narrower. Use local traces as evidence about the stated local contract. They do not establish that a solution was submitted to or accepted by an external judge.

## Practice Exercises
<!-- lesson-id:w17-section-practice-exercises -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Try these exercises before opening **Hints and Worked Solutions**. Alongside your code, write the contract and explain what each piece of remembered state means. When an output is correct, also explain which object changed and why the algorithm could safely make each update. Those explanations are part of the practice, not optional commentary after the implementation.

1. **Positions and contracts:** For `[4, 4, 9]`, explain length, last index, and last value as three different quantities. Decide what first-index search should return for empty input and justify it. Then explain how replacement, insertion, and deletion affect positions and membership differently.
2. **Method laboratory:** Begin with `[5, 10]`. Append 15, remove the front entry, insert 7 at index 1, and copy the final two entries. After every call, print its return and the receiver. Classify push, pop, shift, unshift, splice, slice, includes, indexOf, find, some, map, filter, reduce, and sort by what they mutate and what type they return.
3. **Ownership:** From `[{ detail: { score: 2 } }]`, make an alias, a shallow copy, a version copying each record, and a deep clone. Draw which names would see an outer push, a replaced record, and a change to the nested score. Explain why spreading each record still does not isolate that nested field.
4. **Callbacks and holes:** Predict the difference between `Array(2).map(() => 1)` and `[...Array(2)].map(() => 1)`. Check property presence so JSON output cannot hide the distinction. Explain how an ordinary callback receives thisArg, then why an arrow callback keeps a different this behavior.
5. **Search and transformation:** Implement first-index search, doubling every number, retaining positive numbers, summing with an identity for empty input, and asking whether any number is negative. For each task, choose the intended result shape before choosing a method or writing the loop.
6. **Removal:** Start with a forward-splice loop that skips consecutive negatives and explain the movement causing the bug. Repair it with backward splice, then implement stable reader/writer compaction. Give a correctness argument for each and analyze worst-case movement separately.
7. **Opposite ends:** Reverse an array using your own swaps rather than a library reversal method. Identify the outer regions already in their final positions. Test empty, odd-length, and even-length inputs, and explain why the input does not need to be sorted.
8. **Duplicate practice:** Implement Contains Duplicate first with pairs and then with a Set on finite-number inputs. Explain what evidence is retained, what equality rule you assume, and how much extra storage is needed. As a separate optional contract, return unique values in first-occurrence order.
9. **Product practice:** Implement products except self with repeated scans, then with two passes and no division. Compare results on `[3, 0, 2]`, `[-2, 3, 4]`, an input with two zeros, empty input, and a singleton. Before every update, explain precisely which entries prefix and suffix include.
10. **Stock practice:** Implement both enumeration of every chronological buy/sell pair and the running-minimum scan. Trace `[9, 3, 7, 2, 8]` and a decreasing sequence. Use a counterexample to explain why sorting prices or subtracting global extrema can violate the required day order.

## Independent Assessment
<!-- lesson-id:w17-section-independent-assessment -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

Close the examples and treat this as a fresh task rather than a copying exercise. If you want to run your work, use a separate scratch file; you do not need to edit the chapter. Allow about 35–50 minutes. Write your predictions and at least one complete implementation before revealing the solutions. That gives you something concrete to assess afterward.

**A. Trace and explain, 4 points.** Begin with `source = [{ n: 1 }, { n: 2 }]`. Create `copy = source.slice()`, call `copy.shift()`, and then assign `copy[0].n = 7`. Show both arrays' final membership and the records' field values. Explain which changes are independent and which follow shared references. Include the value returned by shift, not only the receiver afterward.

**B. Implement a new contract, 6 points.** Write `retainAtLeast(values, minimum)` for a dense numeric array. Keep qualifying values in their original order by mutating the same array, and return the retained length rather than the array itself. Use O(1) auxiliary state. Test a mixture of qualifying and rejected values, all qualifying, none qualifying, and empty input. State the invariant maintained during scanning and the rule used for final truncation.

**C. Choose APIs, 4 points.** You have records with numeric scores. Choose operations for four questions: “does any score exceed 10?”, “which first record exceeds 10?”, “what are all doubled scores?”, and “what is the sum?”. For each, state the result type, what happens on empty input, and whether your callback changes anything. Make the chosen method match the question's contract.

**D. Reuse evidence, 6 points.** Derive products except self for `[5, 0, -2]`, showing strict prefixes and suffixes before combining them. Separately explain what each stock-scan variable means before evaluating a sale. For both tasks, distinguish output memory from working state and state the numeric assumptions. Give a price sequence showing why sorting before computing profit changes the problem.

Give credit for reasoning as well as final values. In B, reserve two points for explaining the invariant and termination. In D, reserve two for storage accounting and assumptions. A score of 16–20 suggests you are ready to continue; 12–15 suggests reviewing the specific missed topics; below 12 suggests repeating the method laboratory and drawing references before retrying. These ranges are study guidance, not certification. The answers appear only in the next section so you can keep them collapsed until you finish.

## Hints and Worked Solutions
<!-- lesson-id:w17-section-hints-and-worked-solutions -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

### Hints before complete answers

For practice 1–4, draw the outer containers separately from the objects they reference, and distinguish an absent property from a present entry containing an explicit value. For 5, decide the result type before choosing a method. For 6, trace where the next unread entry goes after deletion. For 7, mark positions already final. For 8–10, describe remembered information in one sentence before updating it with the current entry. That sentence often reveals an update-order bug.

For assessment A, draw two outer arrays pointing to two records, then follow each operation's reference path. For B, separate the inspected position from the next retained-output position. For C, decide whether the answer should be a boolean, record, collection, or scalar. For D, write the product that excludes the current position before you multiply that entry into running state. Apply the same “what was eligible before this update?” question to stock prices.

### Practice 1–5: contracts and callbacks

For `[4, 4, 9]`, count three entries to get length 3. Counting their positions from zero gives last index 2, whose stored value is 9. An empty first-index search returns -1 because there is no matching position to return. Replacement changes a value while keeping the membership count; insertion creates a position; dense deletion closes a gap. Let's execute the method laboratory while printing both results and receiver state.

### Demonstration 1 — Inspect returns and membership after each laboratory call

```javascript
const values = [5, 10];
console.log(values.push(15));
console.log(JSON.stringify(values));
console.log(values.shift());
console.log(JSON.stringify(values));
console.log(JSON.stringify(values.splice(1, 0, 7)));
console.log(JSON.stringify(values));
console.log(JSON.stringify(values.slice(-2)));
```

```output
3
[5,10,15]
5
[10,15]
[]
[10,7,15]
[7,15]
```

In **Demonstration 1**, starting from `[5, 10]`, push returns three and leaves `[5, 10, 15]`. Shift returns 5 and leaves `[10, 15]`. Splice inserts 7 at position one without removing anything, so its return is an empty array and the receiver becomes `[10, 7, 15]`. Slice then returns the final two values, `[7, 15]`, without editing that receiver.

Push and unshift mutate and return a length. Pop and shift mutate and return a removed value. Splice mutates and returns an array of removed entries; sort mutates and returns the receiver itself. Slice, map, and filter return shallow arrays without themselves changing receiver membership. Includes and some return booleans; indexOf returns an index or -1; find returns a value or undefined; reduce returns the final accumulator. Analyze callback side effects separately from each method's own mutation promise.

For the ownership exercise, an alias sees every outer change because it names the same array. A shallow copy has independent membership but still shares records. Copying each record can isolate its own fields while leaving nested detail objects shared. A supported deep clone separates the cloned graph from the source, so edits within it do not flow back through those paths.

For the holes exercise, mapping a sparse constructor skips missing entries and preserves holes. Spreading first creates present undefined entries that map visits. An ordinary callback can read the supplied thisArg, whereas an arrow retains its lexical this. For the search-and-transformation exercise, let's choose an explicit return shape for each task.

### Demonstration 2 — Match search and transformation results to their contracts

```javascript
function firstIndex(values, target) {
    for (let i = 0; i < values.length; i += 1) {
        if (values[i] === target) {
            return i;
        }
    }
    return -1;
}
const values = [-2, 0, 3];
console.log(firstIndex(values, 0));
console.log(JSON.stringify(values.map((x) => x * 2)));
console.log(JSON.stringify(values.filter((x) => x > 0)));
console.log(values.reduce((sum, x) => sum + x, 0));
console.log(values.some((x) => x < 0));
```

```output
1
[-4,0,6]
[3]
1
true
```

In **Demonstration 2**, searching `[-2, 0, 3]` for zero returns index one. Map returns the doubled collection `[-4, 0, 6]`, filter returns only `[3]`, and reduce starts at zero and reaches a sum of one. Some returns true immediately on -2, because that single negative value settles its question. Each result shape matches a different contract even though all calls read the same input.

### Practice 6–7: movement invariants

The complete linear implementations are **Reader and Writer: Stable In-Place Removal, Demonstration 1** and **Two Pointers: Opposite Ends, Demonstration 1**. For a deletion alternative focused first on correctness, traverse backward so removing a later entry cannot move an earlier unread entry. This fixes skipping, but retained suffixes may still move repeatedly. Let's keep that correctness improvement separate from its cost.

### Demonstration 3 — Remove negatives backward without skipping moved entries

```javascript
function removeNegativesBackward(values) {
    for (let i = values.length - 1; i >= 0; i -= 1) {
        if (values[i] < 0) {
            values.splice(i, 1);
        }
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

In **Demonstration 3**, `[-1, -2, 3]` first inspects 3, then removes -2, then removes -1. No unread earlier entry is skipped. With `[4, -1, 5, -2]`, removing the last negative does not disturb earlier positions, and removing -1 later closes the remaining interior gap. The results preserve the surviving order.

Backward splice can still take quadratic time when many removals precede a long retained suffix that moves repeatedly. Reader/writer compaction instead reads n entries and writes at most n before truncating. In reversal, positions outside left and right are final; each swap shrinks the unfinished interval, and an odd-length middle needs no movement. Compaction and reversal both retain constant auxiliary state, with different invariants explaining their correctness.

### Practice 8: Contains Duplicate, baseline and retained membership

The pair baseline compares each pair of distinct positions once. For the Set version, remember the values in the already processed prefix. Before adding the current value, ask whether it is already remembered. If you insert first and check afterward, even the very first entry will appear repeated because you just added it.

These implementations agree for finite numbers. For broader JavaScript data, the baseline's strict equality and Set's SameValueZero differ on NaN, so you must reconcile the equality contracts before comparing results. Let's implement both duplicate-existence contracts and keep unique-value output as a separate function.

### Demonstration 4 — Detect duplicates with pairs or remembered membership

```javascript
function containsDuplicateBrute(values) {
    for (let i = 0; i < values.length; i += 1) {
        for (let j = i + 1; j < values.length; j += 1) {
            if (values[i] === values[j]) {
                return true;
            }
        }
    }
    return false;
}
function containsDuplicate(values) {
    const seen = new Set();
    for (const value of values) {
        if (seen.has(value)) {
            return true;
        }
        seen.add(value);
    }
    return false;
}
function uniqueValues(values) {
    return [...new Set(values)];
}
console.log(containsDuplicateBrute([8, 3, 8]));
console.log(containsDuplicate([8, 3, 5]));
console.log(containsDuplicate([]));
console.log(JSON.stringify(uniqueValues([8, 3, 8, 5])));
```

```output
true
false
false
[8,3,5]
```

In **Demonstration 4**, the pair scan on `[8, 3, 8]` finds equal values at positions zero and two. The Set scan on `[8, 3, 5]` checks each value against earlier values and reaches the end without a duplicate. On empty input there is nothing to repeat, so it returns false. UniqueValues on `[8, 3, 8, 5]` retains the first 8, then 3, then 5, yielding `[8, 3, 5]`.

The pair baseline has quadratic worst-case time and constant auxiliary state. Set retains up to n values and is expected linear under the efficient-membership model. Returning unique values in first-occurrence order is useful, but it is a different contract from returning one boolean. For objects, identical fields do not imply identical values: distinct objects remain distinct by identity unless you define another key representing equality.

### Practice 9: Product of Array Except Self

For each output position, the baseline multiplies all n-1 other entries. The optimized version saves those repeated contributions. During the forward pass, write the strict prefix to the output before extending prefix with the current value. During the backward pass, multiply the output by the strict suffix before extending suffix with that value.

The output array doubles as storage for partial answers, so we need only two running products beyond it. Starting both at one handles the empty first prefix and empty last suffix. Let's compare both implementations on ordinary inputs and then use zeros, negatives, and boundary inputs to test the contract.

### Demonstration 5 — Reuse strict prefix and suffix products without division

```javascript
function productExceptSelfBrute(values) {
    return values.map((_, excluded) => {
        let product = 1;
        for (let j = 0; j < values.length; j += 1) {
            if (j !== excluded) {
                product *= values[j];
            }
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
console.log(JSON.stringify(productExceptSelf([3, 0, 2])));
console.log(JSON.stringify(productExceptSelf([-2, 3, 4])));
console.log(JSON.stringify(productExceptSelf([0, 2, 0])));
console.log(JSON.stringify(productExceptSelf([7])));
console.log(JSON.stringify(productExceptSelf([])));
```

```output
[12,8,6]
[12,8,6]
[0,6,0]
[12,-8,-6]
[0,0,0]
[1]
[]
```

In **Demonstration 5**, `[3, 0, 2]` produces strict prefixes `[1, 3, 0]`. The backward pass supplies strict suffixes `[0, 2, 1]`, giving `[0, 6, 0]`. At the zero's own position, multiplying 3 by 2 excludes zero and yields six. Every other answer includes zero. Nothing divides by an input value, and no special zero branch is needed. With two zeros, every product includes one, as the printed all-zero result confirms. A singleton returns the empty-product one, and empty input returns an empty array.

The baseline takes quadratic time; two passes take linear time. Output storage is linear, with constant working memory beyond it. These claims assume intermediate products stay representable and sufficiently precise. Arithmetic on numbers whose representations grow arbitrarily long would need a different elementary-cost model.

### Practice 10: Best Time to Buy and Sell Stock

Before evaluating each sale, cheapest must mean the lowest price on strictly earlier days. Best must mean the greatest profit among completed legal transactions already considered, with zero representing no transaction. Evaluate today's sale using that earlier minimum, then make today's price eligible as a purchase for future days. Keeping that order makes the chronological contract explicit.

The baseline respects the same rule by starting each sell position after its buy position. Let's compare its legal pairs with a scan that retains only the information future sales need.

### Demonstration 6 — Preserve day order while retaining the cheapest earlier purchase

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
    if (prices.length < 2) {
        return 0;
    }
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

In **Demonstration 6**, `[9, 3, 7, 2, 8]` first establishes 3 as a better purchase candidate, then retains profit 4 at the sale price 7. Seeing 2 improves cheapest without erasing best. The final sale at 8 improves profit to 6. Both implementations return six because they preserve the same legal purchase-before-sale pairs.

For `[8, 5, 2]`, subtracting the global minimum from the maximum gives six, but that would sell at 8 before buying at 2. The legal answer is zero. The baseline considers n(n-1)/2 pairs, whereas the scan evaluates n-1 sales. Both use constant auxiliary state and leave the input unchanged. Empty and singleton inputs return zero because no legal two-day transaction exists.

### Independent assessment answers and rubric

**A:** Source still contains two records, with field values 1 and 7. Copy contains only the second record, whose field is now 7. Shift returned the first record, `{ n: 1 }`. The shallow outer copy gave the arrays independent membership, so removing from copy did not remove from source. The surviving record remained shared, so changing its field through copy also changed what source observes. Award one point for each final membership, one for the shared-field explanation, and one for identifying the returned record.

**B:** We need a different return contract from keepNonnegative: mutate the original array but return the retained length. Before each read, the prefix before writer contains exactly the qualifying values from processed input, in their original order. Writer never exceeds reader, so a retained write cannot destroy unread values. Reader advances toward the original length, establishing termination; only afterward does truncation remove the stale suffix. Award four points for implementation and boundary tests and two for the invariant and termination reasoning. Let's run all four required input categories.

### Demonstration 7 — Retain values in place and return the retained length

```javascript
function retainAtLeast(values, minimum) {
    let writer = 0;
    for (let reader = 0; reader < values.length; reader += 1) {
        if (values[reader] >= minimum) {
            values[writer] = values[reader];
            writer += 1;
        }
    }
    values.length = writer;
    return writer;
}
for (const values of [[1, 5, 2, 7], [5, 6], [1, 2], []]) {
    console.log(retainAtLeast(values, 5), JSON.stringify(values));
}
```

```output
2 [5,7]
2 [5,6]
0 []
0 []
```

In **Demonstration 7**, input `[1, 5, 2, 7]` with minimum five copies 5 to position zero and 7 to position one. Writer ends at two, so the array is truncated to `[5, 7]` and the returned number is two. `[5, 6]` keeps everything; `[1, 2]` keeps nothing; `[]` performs no reads. In each case, the printed number equals the final retained length, and all aliases would observe the same changed array.

**C:** Choose some for a boolean, find for a record or undefined, map for an array of doubled numeric scores, and reduce with initial zero for a numeric sum. On empty input, these return false, undefined, an empty array, and zero respectively. **Pure callbacks** read score fields and return answers without changing records or other external state. Award one point for each matching contract, including its empty-input behavior.

**D:** For `[5, 0, -2]`, write strict prefixes `[1, 5, 0]` and strict suffixes `[0, -2, 1]`. Combining them gives `[0, -10, 0]`, treating signed zero as ordinary zero for the mathematical answer. Only the zero position excludes zero, so its answer is 5 times -2.

Before a stock sale evaluation, cheapest summarizes strictly earlier purchase prices, while best summarizes completed legal transactions. On `[8, 2]`, no profitable chronological trade exists; sorting to ascending order invents one. That counterexample shows why ordering cannot be discarded.

The products algorithm allocates linear returned output and constant working state beyond it. The stock scan retains constant working state and returns one number. Both assume finite-number input and sufficiently precise intermediate arithmetic. Award two points for deriving products, two for chronological state and the counterexample, and two for storage accounting and assumptions.

## Sources and Further Reading
<!-- lesson-id:w17-section-sources-and-further-reading -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

The array explanations, examples, and algorithms build on repository-owned material in the [archived combined chapter](archive/week-01-complexity-and-arrays.md). General complexity derivations remain in [Module 1](week-01.md), while this chapter provides a standalone array lesson alongside the archive.

Use the references here for precise API behavior and further study. External pages were **not freshly browsed or verified during this authoring pass**. Their inclusion does not claim new access checks, editorial review, or acceptance by an external judge. Choose the relevant method documentation when a boundary rule or supported data type matters to your own program.

- [MDN Array reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — use the official reference for API vocabulary, mutation, iterative methods, callback arguments, copying methods, and sparse-array behavior. Individual method pages give precise bounds and exceptions. Behavior documentation does not establish a universal engine complexity table.
- [MDN structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) — consult this for supported deep cloning and its limitations. Before using cloning to separate ownership, check both runtime support and whether your data can be cloned.
- [MDN Array sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) — review comparator contracts, default ordering, and stability here, together with the implementation-dependent nature of time and space complexity.
- [OpenDSA](https://opendsa.org/) — explore array-based lists, list operations, and algorithm visualizations for another view of movement and trade-offs. Its abstract models explain data structures without promising a particular physical JavaScript array representation.
- The official LeetCode links in **Interview and LeetCode Pattern Recognition** identify the assigned practice tasks. The chapter's explanations and solutions are independently presented teaching material; their presence makes no claim about consulting platform editorials or making submissions.

## Weekly Summary
<!-- lesson-id:w17-section-weekly-summary -->

**Let’s make this practical.** In this part, picture the problem first, then connect that picture to the formal rule and the code that follows.

When working with arrays, reason about positions and references together. Positions organize the sequence; references determine which objects different names share. Choose a method by its contract: do you need an index or value, a boolean or collection, a changed receiver or independent output? Explain a traversal by naming the processed region and what retained state says about it. Explain a copy by following references to the depth you intend to isolate.

The algorithms in this chapter reuse information in different ways. Opposite-end pointers fix outer positions, reader/writer pointers pack a retained prefix, prefix/suffix products reuse neighboring contributions, and a running minimum summarizes eligible earlier prices. In each case, maintained evidence replaces a question we would otherwise answer repeatedly. Continue to [Module 3 — Hash Maps and Sets](week-02.md) to study remembered membership in greater depth. Its stable ID and existing `/app/weeks/2` route remain unchanged.

## Weekly Progress Checklist

### Theory

- [ ] I can explain logical array positions without assuming JavaScript guarantees a physical storage layout. <!-- checkpoint:w17-array-representation -->
- [ ] I can distinguish indexes and length, predict boundary reads, and explain holes versus present undefined entries. <!-- checkpoint:w17-indexing-and-holes -->
- [ ] I can state the dense-array cost model and account separately for output and auxiliary memory. <!-- checkpoint:w17-array-cost-model -->

### JavaScript

- [ ] I can predict core array methods' mutations, callback behavior, and return values, including those of some. <!-- checkpoint:w17-array-method-contracts -->
- [ ] I can draw and demonstrate aliases, shallow copies, selective nested copies, and supported deep clones. <!-- checkpoint:w17-reference-copy-depth -->
- [ ] I can implement a scan with safe bounds and explain stable reader/writer removal. <!-- checkpoint:w17-scan-and-removal -->
- [ ] I can reverse an array with opposite-end pointers and justify which outer positions are final. <!-- checkpoint:w17-opposite-end-pointers -->
- [ ] I can implement products without division and explain strict prefix/suffix state before every update. <!-- checkpoint:w17-prefix-suffix-products -->

### Practice

- [ ] I completed the local questions, traces, debugging tasks, and implementation exercises with explanations. <!-- checkpoint:w17-local-practice -->
- [ ] I attempted Contains Duplicate and explained its equality assumptions and extra-memory trade-off. <!-- checkpoint:w17-contains-duplicate-practice -->
- [ ] I attempted Product of Array Except Self and checked both one-zero and two-zero behavior. <!-- checkpoint:w17-product-practice -->
- [ ] I implemented the running-minimum Stock scan and explained why every purchase precedes its sale. <!-- checkpoint:w17-stock-running-minimum -->
- [ ] I completed the independent assessment before opening its answers, then used the rubric to score my attempt. <!-- checkpoint:w17-independent-assessment -->

### Reflection

- [ ] I recorded a prediction that failed and used a reference drawing or invariant to explain the correction. <!-- checkpoint:w17-reflect-on-error -->
- [ ] I can explain an array optimization aloud, including its maintained evidence, without reading the code. <!-- checkpoint:w17-explain-optimization -->
**On the video:** pause here and say the goal out loud: reflection. Then predict the next step before you read the explanation.
