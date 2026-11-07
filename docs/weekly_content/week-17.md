# Week 17 - Arrays and Array Operations

Welcome to **Module 2 — Arrays**. You have learned to count work; now you will use that reasoning to make deliberate choices about a real data structure. After this chapter, [Module 3 — Hash Maps and Sets](week-02.md) develops the membership and frequency-counting ideas introduced in the array problems.

An array lets us describe a sequence: daily temperatures, prices over time, scores, or records waiting to be processed. This chapter teaches how to read and change that sequence deliberately. You will learn what each operation promises, what information a traversal remembers, and why copying an array does not necessarily copy the objects inside it. We then combine these ideas into small algorithms whose correctness you can explain without relying on a library call's name.

Elementary cost analysis is assumed from [Module 1 — Complexity](week-01.md). Here we apply that vocabulary rather than repeat the complexity chapter. Work through the examples with pencil and paper, predicting both the return value and the array after each operation. All JavaScript fences are independent programs with their exact console output immediately afterward. Modern copying methods and `structuredClone` require a runtime that supports those APIs; no TypeScript or packages are used.

Use the final weekly progress checklist to record what you can explain independently. Checking an item records your own evidence; merely opening a worked solution does not establish mastery.

## Learning Objectives

By the end, you should be able to distinguish an index, a value, a reference, and an array's length; traverse a dense array safely; implement first-match search; and choose insertion or deletion operations by their contracts. You should also be able to explain aliases, shallow copies, selective nested copies, and supported deep clones with a drawing of shared references.

Method fluency means more than recognizing names. You will classify mutation and return values, choose between transformation and short-circuit queries, and include callback work in your cost estimate. Finally, you will introduce opposite-end and reader/writer pointers, derive prefix/suffix products, and compare simple baselines with improved solutions to three assigned LeetCode problems. The independent assessment near the end checks these outcomes before you consult its answers.

## Prerequisite Knowledge

You need variables, functions, conditions, comparisons, arithmetic, and ordinary `for` loops. A `return` exits its function immediately. `const` prevents rebinding a variable; it does not freeze a referenced array. A callback is simply a function passed to another function, often to describe what should happen to each entry.

We use ordinary dense arrays unless a lesson explicitly introduces holes. Arithmetic examples use finite numbers and assume their intermediate results remain sufficiently precise in JavaScript's `Number` representation. The cost vocabulary from Module 1 includes constant, linear, quadratic, amortized, auxiliary space, and output space. If those terms need review, follow the complexity link above; understanding arrays should not depend on relearning all asymptotic notation here.

## Representation: A Sequence with Indexed Positions

Conceptually, an array is an ordered sequence of slots. A three-entry sequence has positions 0, 1, and 2, even if its values are 100, 100, and 500. Position is structural; value is data. Repeated values occupy separate positions. This distinction matters when a problem asks for an index rather than the matching value, or asks us to exclude one occurrence rather than every equal value.

In a traditional machine-array model, equal-sized slots occupy contiguous memory and an address can be calculated from an index. That model helps explain direct access. **JavaScript does not guarantee that an Array has contiguous physical storage.** JavaScript arrays are objects with special length and indexed-property behavior; engines may use different representations for dense numbers, mixed values, sparse data, or other situations. Our pictures describe logical positions, not a promise about engine memory layout.

An array can contain different value types, including references to other arrays and objects. That flexibility does not make every mixture a good data contract. A function summing prices should state that entries are numbers rather than silently accept arbitrary records. Typed arrays are a separate family for typed binary data; this chapter concerns ordinary `Array` objects.

## Indexing, Length, and Boundary Rules

For a dense array of length `n`, valid entry indexes run from 0 through `n - 1`. Reading an absent indexed property normally returns `undefined`; JavaScript does not automatically throw an out-of-bounds exception. A loop using `i <= values.length` therefore performs an extra read that may look harmless until `undefined` affects a comparison or calculation.

The last entry is `values[values.length - 1]`, or `values.at(-1)`. Bracket access with `-1` means a property named `"-1"`, not the last entry. Assigning to an existing index replaces a value without inserting a position. Assigning beyond the end increases length and can create holes between the old end and the new entry. Reducing length discards entries beyond the new boundary; increasing it creates empty positions rather than initialized values.

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

Notice that length is not the highest index. It is one greater than the largest present array index, or zero for an empty array. With holes, length need not equal the count of present entries. Keep the dense-array assumption visible whenever you equate those quantities.

## Traversal: Visiting the Right Entries

Use an indexed loop when you need positions, neighboring entries, or explicit control over direction. Use `for...of` when you need values in sequence. Neither form requires copying the array. A backward indexed loop starts at `length - 1` and continues while the index is at least zero; for an empty array it begins at -1 and runs zero times.

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

Avoid `for...in` for routine array traversal: it enumerates enumerable property keys and can include extra properties, rather than expressing the sequence-of-values intent. Also avoid changing membership during a scan unless your algorithm accounts for moved positions. A traversal is easiest to explain when its input region and stopping rule remain stable throughout the operation.

## Linear Search and Evidence from a Processed Prefix

Linear search inspects entries until it has enough evidence to answer. Define the contract first: return the first index whose value is strictly equal to the target, or -1 if there is no match. Returning a value instead would lose position information; returning a boolean would answer only membership.

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

Before iteration `i`, every earlier position has been ruled out. This is a loop invariant: initially the earlier region is empty; after a failed comparison it grows by one; at the end it covers the entire array. A successful comparison returns the earliest match because no earlier position could match. For `[9, 2, 6]`, searching for 6 excludes index 0, excludes index 1, then returns index 2. Three comparisons do not mean the answer is index 3.

A first-position match takes constant work; a missing target requires a full scan. The implementation deliberately uses strict equality, so it does not match `NaN` to itself. Equality is part of the function's contract, not an implementation detail to discover after testing.

## Inserting and Deleting: Position Movement

Replacing an entry and inserting an entry are different operations. Replacing index 1 in `[2, 4, 6]` keeps length three. Inserting at index 1 creates a new position and moves the old suffix one place right. Deleting an interior entry closes a gap and moves later entries left if the result must remain a dense sequence.

The `delete` operator removes a property but does not close the gap or reduce length. It is therefore usually the wrong operation for removing an item from a dense list. Use `splice` for positional editing or a compaction algorithm when removing many entries. State whether removal should preserve order: if order is irrelevant, replacing a removed entry with the last entry and popping can avoid moving the whole suffix, but it changes the sequence's meaning.

When preserving order, movement explains why front operations deserve attention. A queue implemented by repeatedly shifting a long array can repeatedly move the remaining suffix. Later modules introduce representations better suited to that workload. For a small user interface list, clarity may still matter more than the asymptotic difference; choose with the expected workload in mind.

## End and Front Methods: push, pop, shift, unshift

`push(...items)` appends and returns the new length. `pop()` removes and returns the last value. `unshift(...items)` inserts at the front and returns the new length. `shift()` removes and returns the first value. Both removal methods return `undefined` on an empty array. The return value does not necessarily have the same type as the receiver.

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

Follow each mutation in order: later calls see the already changed array. Assigning the result of `push` to your list variable replaces that variable's reference with a number if rebinding is allowed. Multiple values passed to one `unshift` retain their argument order at the front; repeatedly unshifting individual values can produce a different order. Predict the resulting sequence, not merely its length.

## Interior Editing with splice and Ranges with slice

`splice(start, deleteCount, ...items)` mutates the receiver and returns an array of removed entries. A zero delete count inserts without deleting. Supplying replacement items can change length because insertion and deletion counts need not match. Negative starts count backward from the end, subject to the method's bounds rules.

`slice(start, end)` returns a shallow copy of a range and leaves the receiver unchanged. The end is exclusive: copying indexes 1 through 3 requires `slice(1, 4)`. An omitted end means the array's end. Negative bounds count from the end. These names differ by one letter but have different ownership and mutation contracts.

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

Read the call as a positional edit: begin at index 1, remove one entry, insert two. The removed array is separate from the receiver, but removed object entries would still be references to the same objects. A new outer array does not imply deep isolation.

## Mutable and Immutable Workflows

A mutable function changes an array supplied by its caller. An immutable workflow returns a changed array and leaves the original array's membership and order intact. Neither style is universally better. In-place algorithms can save output allocation; independent copies can simplify undo, comparison, and state updates. The important requirement is that callers know which behavior to expect.

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

“Nonmutating method” describes what the method itself does to the receiver. A callback passed to `map` can still mutate objects, and objects in the result can still be shared with the source. Likewise, a function that copies its array and then mutates the copy can preserve the caller's order while allocating linear storage. Describe both behavior and allocation rather than treating immutability as free.

## References, Values, and Shallow Copying

Assignment copies a value. For a number, that value is the number; for an array or object, that value is a reference to the object. Consequently, assigning an array to a second variable creates an alias, not another array. A shallow copy made with spread, `slice()`, or `Array.from` creates a new outer array and copies its element values. Object-valued entries remain references to shared objects.

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

The shallow copy has independent membership, so pushing through the alias does not increase its length. Its first record remains shared, so changing that record changes what the original sees. Copying each record isolates the record's own fields, but its nested `detail` reference still points to the old detail object. Draw the reference path all the way to the field being changed; stopping at the outer brackets misses the important relationship.

For dense arrays, spread and slice are convenient full-copy choices. Spread consumes an iterator; slice copies an indexed range. Their sparse-array behavior differs, as a later lesson shows. These operations copy entries, not just a single reference, so a full copy has linear output size.

## Deep Cloning and Copying Only the Changed Path

Copy the levels your function intends to edit. A selective update can create a new outer array, a new record at one position, and a new nested detail object while sharing untouched records. That is often enough to preserve previous state without cloning an entire data graph. It requires knowing the shape of the data and which references callers expect to remain independent.

`structuredClone` deeply clones supported data, including cycles, and preserves sharing relationships within the cloned graph. It is not a universal copier of arbitrary behavior: functions cannot be cloned, and custom prototypes, accessors, and some host objects do not have the semantics of ordinary data cloning. Unsupported inputs can throw. A JSON stringify/parse round trip is serialization with different restrictions: it cannot handle ordinary cycles, loses unsupported properties, and changes types such as dates into strings.

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

Clone cost depends on the reachable data graph, not only outer array length. One array entry can lead to thousands of nested records. Decide your ownership contract before selecting a copying technique, and count the copied structure when describing memory use.

## Membership, Equality, and First-Match Queries

Choose the return contract you need. `includes` returns a boolean. `indexOf` returns the first matching index or -1. `find` returns the first value satisfying a predicate or `undefined`; `findIndex` returns its index or -1. `some` answers whether any entry satisfies a predicate. `every` answers whether all entries satisfy one. These queries can stop as soon as the answer is determined.

`includes` uses SameValueZero equality: `NaN` matches itself and positive and negative zero match. `indexOf` uses strict equality, so it cannot find `NaN`. Objects compare by identity, not by field contents. A freshly created `{ id: 1 }` is a different object from an existing record with that field. Use a predicate when the question concerns record contents.

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

A successful `find` can itself return `undefined` if that is a stored value, making it indistinguishable from failure by value alone. Use `findIndex` or `some` when presence must be unambiguous. Also never test `indexOf` directly for truthiness: index zero is falsy, whereas failure value -1 is truthy. Compare explicitly against -1.

## map, filter, and Callback Contracts

`map` produces one transformed output position for each visited position. `filter` keeps entries whose callback result is truthy and preserves their relative order. Both create new outer arrays, but filtering objects preserves the selected references. A mapping callback must return its transformed value; an arrow-function block needs an explicit `return`.

Common iterative callbacks receive `(value, index, array)`. Methods including `map`, `filter`, `find`, `some`, `every`, and `forEach` also accept an optional `thisArg`. An ordinary function can read that supplied `this`; an arrow function uses its surrounding lexical `this` and ignores the attempt to replace it. A closure is often clearer, but understanding this contract prevents surprises in existing code.

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

Passing a function directly is safe only when its parameter contract matches the callback contract. For example, `parseInt` accepts a radix as its second argument, while `map` supplies an index there. Write `text => parseInt(text, 10)` to state your intention. Similarly, a callback that searches another length-n array can turn an apparently simple full transformation into quadratic work.

## reduce, Accumulators, and Side Effects

`reduce` carries an accumulator through the array. Its callback receives accumulator, current value, index, and receiver. It does not accept the same `thisArg` parameter as map. The callback's return becomes the next accumulator; forgetting that return breaks the chain even if local mutations appeared to work.

Supply an initial value when empty input is possible. For numeric sum, zero is the identity. Without an initial value, a nonempty array begins with its first present entry as the accumulator, but an empty array throws. Choosing a suitable identity makes both the algorithm and boundary behavior easier to explain.

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

The stats accumulator is newly allocated for this call, so changing it does not mutate the input numbers. Rebuilding a growing array with spread on every reduction step repeatedly copies prior output and can accumulate quadratic work. An ordinary loop may communicate the same task more clearly. `forEach` is intended for side effects and returns `undefined`; returning from its callback does not exit the surrounding function. Use a loop or short-circuit query when early termination is required.

## Holes, undefined, and Shared Initialization

A hole is an absent indexed property, not an entry explicitly assigned `undefined`. `Array(3)` has length three but no present indexed entries. On ordinary arrays without inherited indexed properties, `map`, `filter`, `forEach`, `some`, `every`, and `reduce` skip holes. `map` preserves those missing output positions; filter packs selected present entries. `find` and `findIndex` visit each position and see holes as `undefined`. Array iteration and spread likewise produce `undefined` for holes. `includes` can match that `undefined`, while `indexOf` skips absent entries.

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

JSON array serialization displays both holes and explicit undefined entries as `null`, so JSON output alone cannot establish property presence. Use `in` when that distinction matters. `fill` assigns the same supplied value repeatedly; it does not call an object factory. `Array.from` with a factory creates separate records. During callback traversal, methods generally capture initial length, but later deletions and writes can affect what is observed. Avoid mutation during these callbacks while learning their ordinary contracts.

## Sorting and Reversing Without Losing Meaning

`sort` mutates its receiver and returns that same array. Default sorting compares string representations, so numeric order requires a comparator such as `(a, b) => a - b`. A comparator reports a negative value, zero, or a positive value for before, equivalent, or after. Returning only a boolean does not express a consistent ordering. Comparators should be consistent and avoid changing the data being sorted.

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

Modern `toSorted` and `toReversed` return shallow changed copies; copying before `sort` or `reverse` is another way to preserve source order. Current JavaScript specifies stable sorting, meaning entries that compare equal retain their relative order. It does not specify a universal sorting algorithm, time bound, or workspace bound. When an algorithm discussion assumes comparison sorting with O(n log n) time, state that model rather than presenting it as an ECMAScript guarantee.

## Supplementary Array Vocabulary

`concat` builds a shallow combined array; `join` creates a string with separators. `flat(depth)` removes nesting up to a chosen depth, while `flatMap` maps and flattens one level. Neither is a general deep clone. `fill` overwrites a range. `copyWithin` copies a range inside the same array without changing length and handles overlap according to its defined copy behavior.

`toSpliced` supplies a copying counterpart to splice, but returns the changed copy rather than removed entries. `with(index, value)` returns a shallow copy with one position replaced and supports negative indexes; an out-of-range index throws. `findLast` and `findLastIndex` search from the end. `keys`, `values`, and `entries` return iterators, not completed result arrays. Creating an iterator and consuming it are different amounts of work.

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

`Array.from` accepts iterable or array-like input and optionally maps while constructing. `Array.of(3)` creates `[3]`, avoiding the length-constructor behavior of `Array(3)`. `Array.isArray` tests whether a value is an array. Learn these as precise contracts rather than a list to memorize all at once; begin with the core methods and add vocabulary as a problem calls for it.

## Two Pointers: Opposite Ends

Two pointers are two positions whose relationship describes the remaining work. For in-place reversal, place `left` at the first index and `right` at the last. Swap their values, then move both inward. The already processed outer regions are in their final positions, while the middle remains to be reversed. Stop when the positions meet or cross.

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

Each swap fixes two positions. An odd-length middle entry already belongs at the middle, so swapping it with itself is unnecessary. Reversal does not require sorted input. Other opposite-end algorithms, such as discarding candidates in sorted pair search, need an ordering argument before moving a pointer. Two variables alone do not establish correctness; the reason a discarded region is safe is the important part. Continue with [Two Pointers](week-03.md) for broader applications.

## Reader and Writer: Stable In-Place Removal

Removing several entries by forward splice can skip values. Start with `[-1, -2, 3]`: deleting index 0 moves -2 into index 0, then advancing to index 1 skips it. A backward splice traversal repairs that correctness issue because earlier positions do not move when a later entry is removed. However, repeated interior deletions can still move long surviving suffixes.

A reader/writer scan avoids repeated shifting. The reader examines each original entry; the writer names the next retained-output slot. Before a read, positions before writer contain exactly the retained values from the processed prefix in their original order. Writer never gets ahead of reader, so a write cannot destroy an unread value. Truncate only after every original entry has been read.

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

This is stable removal: surviving entries keep their relative order. The function mutates the same array, so all aliases observe the new membership. `filter` is a convenient alternative when a separate output array is allowed. Both scan linearly under constant-cost predicates, but their allocation contracts differ.

## Prefix and Suffix Products: Excluding One Position

Some problems ask for the contribution of every entry except the current position. Repeating a full scan for every answer recomputes overlapping work. A prefix summarizes entries before a position; a suffix summarizes entries after it. For products, the empty region contributes 1, the multiplicative identity. “Strict prefix” means the current entry is excluded.

For `[2, 3, 4]`, strict prefixes are `[1, 2, 6]` and strict suffixes are `[12, 4, 1]`. Multiplying corresponding entries gives `[12, 8, 6]`. A forward pass can write prefixes directly into the output; a backward pass multiplies in a running suffix. Use the running value before updating it with the current input, or the result will accidentally include itself.

One zero leaves a potentially nonzero result only at the zero's position; two zeros make every result zero. No division branch is required. Negative numbers work with the same multiplication rules. Our local contract returns an empty output for empty input and `[1]` for a singleton. External problem constraints may exclude those cases; defining them locally makes boundary reasoning explicit. The complete baseline and optimized implementation appear in Hints and Worked Solutions after the independent assessment.

## Worked Examples: Trace State Before Updating

### Separating membership changes from shared record changes

Imagine `source = [{ count: 1 }]` and `copy = [...source]`. Appending a second record to copy changes only its membership. Changing `copy[0].count` changes the shared first record. To isolate that field, copy the record as well. If count were inside a nested detail object, copy that level too. These are different ownership decisions even though all versions begin with an outer array copy.

### Compaction without losing unread entries

For `[4, -1, 5, -2]`, reader 0 retains 4 at writer 0, then writer becomes 1. Reader 1 rejects -1 and leaves writer unchanged. Reader 2 copies 5 into position 1, which belongs to the already read region. Reader 3 rejects -2. Truncating to writer 2 yields `[4, 5]`. Leaving the old suffix in place would not complete the contract, even though the retained prefix was correct.

### A running minimum for chronological prices

For prices `[9, 3, 7, 2, 8]`, a sale at 3 cannot make a positive profit, then 3 becomes the cheapest earlier purchase. A sale at 7 earns 4. The later price 2 updates the purchase candidate without erasing that completed profit. Selling at 8 earns 6. A running minimum and best completed profit serve different purposes; neither variable replaces the other.

For decreasing prices, zero remains the answer when taking no transaction is allowed. Global maximum minus global minimum can describe selling before buying, so it is not a valid replacement for chronological traversal. Sorting destroys day order and therefore changes the problem.

## Visual Explanations

Use the array lab at this section, when available in the reader, to step through index movement and mutations. These static diagrams also stand alone. Predict the next state before advancing a visualization; animation is useful only when you can explain what changed.

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

Editing A's membership does not edit B. Editing R is visible through A and B. Editing D is visible through S as well. The deepest shared reference on the edited path determines which names observe a mutation.

```text
input:          [2,  3, 4]
strict prefix:  [1,  2, 6]
strict suffix:  [12, 4, 1]
answer:         [12, 8, 6]

for position i: combine everything before i with everything after i
```

## Complexity Analysis: Costs Under an Explicit Model

Use the conventional dense dynamic-array model with constant-cost entry reads, writes, arithmetic, comparisons, and callbacks unless specified otherwise. JavaScript's language specification defines observable behavior rather than guaranteeing these engine costs. Proxies, accessors, huge nested data, and costly callbacks require separate analysis. Let `n` be array length, `k` copied entries, and `m` inserted entries.

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

Amortized push does not mean every push is constant-time, nor does it require random input. Under geometric capacity growth, copying work across a long append sequence is linear overall. Repeated shift has a different story: moving successively shorter suffixes can accumulate quadratic work. Review Module 1 for the derivations if needed.

Joining depends on total produced characters, not just entry count. Flattening depends on visited nested structure and output. Deep cloning depends on the reachable graph. A Set-based duplicate scan is expected O(n) under the usual efficient hash-table model and uses O(n) retained membership storage; ECMAScript does not promise a particular hash-table implementation or unconditional constant-time lookup. Distinguish this expected-cost assumption from amortized append.

Count storage by what is allocated, not by the number of variable names. One variable can refer to an n-entry output. “O(1) beyond the output” is a useful claim for products; “O(1) total additional space” would hide the returned array. Also distinguish peak reachable memory from total allocation across a sequence of temporary copies.

## Common Mistakes and Repair Strategies

Off-by-one bounds often survive small tests because an extra read produces undefined instead of an exception. Test empty arrays and targets equal to undefined under a clearly defined dense-input contract. When a method call surprises you, write two columns: returned value and receiver afterward. This exposes confusion between a length, removed segment, selected value, and changed copy.

When a copy appears to change unexpectedly, draw object references rather than duplicating object text in your notes. When deletion skips an entry, trace the next index after movement. When a short transformation becomes slow, inspect the callback for nested searches or growing copies. A one-line expression can hide several traversals and allocations.

Do not assume `find` proves presence just because its result is falsy or truthy: zero, false, and undefined can all be legitimate values. Do not assume default sort is numeric. Do not use an array's changing length as a stopping rule while appending unless growing traversal is intentional. Prefer a clear loop with a named invariant over a compact expression whose ownership or termination is uncertain.

## Interview and LeetCode Pattern Recognition

Start by asking what the function returns, whether input mutation is allowed, what equality means, and what happens on empty input. Then describe a correct baseline before optimizing it. The baseline supplies something concrete to compare against on small inputs and makes repeated work visible.

- [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) — LeetCode, Easy. Return whether any value occurs more than once. Compare pair enumeration with remembered membership. A Set preview is included in the solutions; [Module 3 — Hash Maps and Sets](week-02.md) develops its model and trade-offs. Its existing route remains `/app/weeks/2`.
- [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) — LeetCode, Medium. Exclude one position, preserve output order, and avoid division. Prefix/suffix contributions remove repeated multiplication. Explain zero cases and output-space accounting.
- [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) — LeetCode, Easy. One purchase must precede one sale. Compare all legal pairs with a chronological scan holding the cheapest earlier price and best completed profit.

These are original summaries and teaching solutions, not reproduced platform statements or editorials. Local empty and singleton contracts are stated explicitly even when an external judge uses narrower constraints. A successful local trace does not imply an external judge submission or acceptance.

## Practice Exercises

Attempt these before opening Hints and Worked Solutions. Record contracts and reasoning alongside code; a correct output without an explanation of mutation or state is incomplete practice.

1. **Positions and contracts:** Explain the difference between length, last index, and last value for `[4, 4, 9]`. Describe what an empty first-index search should return and why. Contrast replacement, insertion, and deletion.
2. **Method laboratory:** Starting from `[5, 10]`, append 15, remove the front, insert 7 at index 1, then copy the last two entries. Print each return value and receiver. Classify push, pop, shift, unshift, splice, slice, includes, indexOf, find, some, map, filter, reduce, and sort by mutation and return type.
3. **Ownership:** Create an alias, a shallow copy, a copy of each record, and a deep clone of `[{ detail: { score: 2 } }]`. Predict which names observe an outer push, a replaced record, and a nested score change. Explain why spreading each record alone is insufficient for the nested field.
4. **Callbacks and holes:** Predict `Array(2).map(() => 1)` versus `[...Array(2)].map(() => 1)`. Use property-presence checks rather than JSON alone. Explain an ordinary callback's thisArg behavior and why an arrow callback differs.
5. **Search and transformation:** Implement first-index search, double each number, retain positive numbers, sum with an empty-input identity, and test whether any number is negative. Choose the return shape deliberately.
6. **Removal:** Repair a forward-splice loop that skips consecutive negatives. Implement both backward splice and stable reader/writer compaction. Explain correctness separately from worst-case movement cost.
7. **Opposite ends:** Reverse an array without a library reversal method. State the fixed outer regions and test empty, odd-length, and even-length input. Explain why no sorted-input precondition is needed.
8. **Duplicate practice:** Implement Contains Duplicate with pairs and then a Set for finite-number inputs. Explain the retained evidence, equality assumption, and extra storage. Optionally return unique values in first-occurrence order as a separate function.
9. **Product practice:** Implement pair-scan products and two-pass products without division. Compare them on `[3, 0, 2]`, `[-2, 3, 4]`, two zeros, empty input, and a singleton. State the meaning of prefix and suffix before each update.
10. **Stock practice:** Implement all chronological buy/sell pairs and a running-minimum scan. Trace `[9, 3, 7, 2, 8]` and decreasing prices. Explain why sorting and global extrema subtraction can change the answer.

## Independent Assessment

Close the examples and solve this as a fresh task. Use a separate scratch file if you want to execute your work; no chapter editing is required. Suggested time is 35–50 minutes. Do not reveal the following solutions until you have written your predictions and at least one complete implementation.

**A. Trace and explain, 4 points.** Starting with `source = [{ n: 1 }, { n: 2 }]`, create `copy = source.slice()`, call `copy.shift()`, then set `copy[0].n = 7`. Write the final membership and field values of both arrays. Explain each shared or independent change. State what shift returned.

**B. Implement a new contract, 6 points.** Write `retainAtLeast(values, minimum)` for a dense numeric array. Mutate the same array to retain qualifying values in their original order and return the retained length, rather than the array. Use O(1) auxiliary state. Test mixed input, all retained, none retained, and empty input. State an invariant and the final truncation rule.

**C. Choose APIs, 4 points.** Given records with numeric scores, choose operations to answer “does any score exceed 10?”, “which first record exceeds 10?”, “what are all doubled scores?”, and “what is the sum?”. State each result type, empty-input behavior, and whether your callbacks mutate anything.

**D. Reuse evidence, 6 points.** Derive products except self for `[5, 0, -2]` using strict prefixes and suffixes. Separately describe the state before each sale evaluation in a stock scan. Explain which memory is output, which is working state, and what numeric assumptions you need. Supply a counterexample to sorting prices before computing profit.

Award points for reasoning, not only final values: in B, reserve two points for the invariant and termination, and in D reserve two for storage and assumptions. A score of 16–20 suggests readiness to continue; 12–15 suggests targeted review; below 12 suggests another method laboratory and reference drawing before retrying. These are study guidelines rather than a certification. Assessment answers appear only in the next section so the reader can keep them collapsed.

## Hints and Worked Solutions

### Hints before complete answers

For practice 1–4, distinguish the outer container from referenced objects, and distinguish an absent property from an explicit value. For 5, select a result type before selecting a method. For 6, ask where the next unread entry moves after deletion. For 7, identify which positions are already final. For 8–10, write a sentence describing remembered information before adding an entry to it.

For assessment A, draw two outer arrays and two records. For B, separate the position you inspect from the next position you retain. For C, decide whether you need a boolean, record, collection, or scalar. For D, write products that exclude the current position before multiplying anything into running state.

### Practice 1–5: contracts and callbacks

For `[4, 4, 9]`, length is 3, last index is 2, and last value is 9. Empty first-index search returns -1 because no position exists. Replacement keeps membership count; insertion introduces a position; dense deletion closes a gap. The method laboratory can be implemented as follows.

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

Push/unshift mutate and return length; pop/shift mutate and return a removed value; splice mutates and returns removed entries; sort mutates and returns the receiver. Slice, map, and filter return shallow arrays without themselves changing receiver membership. Includes/some return booleans, indexOf returns an index or -1, find returns a value or undefined, and reduce returns its final accumulator. Callback side effects are a separate question.

An alias observes every outer change. A shallow copy shares records but has independent membership. Copying records still shares their detail objects. A supported deep clone separates the cloned graph from the source. A mapped sparse constructor keeps holes, whereas spreading first creates explicit undefined entries that map visits. An ordinary callback can receive thisArg; an arrow callback retains lexical this.

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

### Practice 6–7: movement invariants

The earlier keepNonnegative and reverseInPlace examples supply complete linear implementations. For the correctness-first deletion alternative, traverse backward so a removed entry cannot move an unvisited earlier entry. This fixes skipping but does not remove repeated suffix movement.

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

Backward splice can still be quadratic when many removed entries precede a long retained suffix. Reader/writer compaction reads n entries and writes at most n before truncating. For reversal, entries outside left and right are final; each swap shrinks the unfinished interval, and the middle entry of an odd array needs no movement. Both algorithms use constant auxiliary state.

### Practice 8: Contains Duplicate, baseline and retained membership

The pair baseline compares each distinct-position pair once. The Set version asks whether the current value appeared in the processed prefix before adding it. Checking after insertion would make every entry appear repeated. Both versions below agree for finite numbers. For general JavaScript data, Set uses SameValueZero while the baseline uses strict equality, so NaN requires reconciling the contracts.

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

The baseline has quadratic worst-case time and constant auxiliary state. The Set approach retains up to n values and is expected linear under the efficient-membership model. Unique-values output preserves first-occurrence order, but that is a separate contract from boolean duplicate existence. Objects with identical fields remain different values by identity unless you define another key.

### Practice 9: Product of Array Except Self

The baseline repeats n-1 multiplications for each output position. The optimized algorithm writes the strict prefix before extending it with the current value, then multiplies the strict suffix before extending that suffix. Output entries act as storage for partial answers. The empty-product identity supplies the first prefix and last suffix.

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

For `[3, 0, 2]`, strict prefixes are `[1, 3, 0]`, strict suffixes are `[0, 2, 1]`, and the result is `[0, 6, 0]`. Zero requires no division or special-case branch. The baseline takes quadratic time; two passes take linear time with linear output and constant working memory beyond it. Assume products remain representable and sufficiently precise; arbitrary-precision arithmetic would require a different elementary-cost model.

### Practice 10: Best Time to Buy and Sell Stock

Before evaluating a sale, cheapest is the minimum price on strictly earlier days, and best is the best completed legal transaction considered so far. Evaluate the sale before making today's price eligible as a purchase for future days. The baseline enumerates only sell positions after buy positions, preserving the same chronological contract.

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

The trace retains profit 4 after selling at 7 and later improves it to 6 at 8. On `[8, 5, 2]`, global maximum minus minimum incorrectly gives 6 while the legal answer is zero. The baseline considers n(n-1)/2 pairs; the optimized scan evaluates n-1 sales. Both use constant auxiliary state and leave the price array unchanged.

### Independent assessment answers and rubric

**A:** Source remains two records, now with fields 1 and 7. Copy contains only the second record, whose field is 7. Shift returned the first record `{ n: 1 }`. The outer arrays have independent membership; the surviving record is shared. Award one point each for the two memberships, shared-field explanation, and returned record.

**B:** The next implementation returns a length while mutating the original array. Before each read, the prefix before writer contains exactly the qualifying values from the already processed input, in order. Writer never exceeds reader, so unread values survive. At termination, truncation removes the stale suffix. Award four points for implementation and boundary tests, and two for this reasoning.

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

**C:** Use some for a boolean, find for a record or undefined, map for an array of doubled numeric scores, and reduce with initial zero for a numeric sum. On empty input those results are false, undefined, an empty array, and zero. Pure callbacks read score fields and do not mutate records. Award one point for each correct contract including its boundary behavior.

**D:** For `[5, 0, -2]`, strict prefixes are `[1, 5, 0]`; strict suffixes are `[0, -2, 1]`; products are `[0, -10, 0]`, treating signed zero as ordinary zero in the mathematical result. Before a stock sale evaluation, cheapest summarizes strictly earlier purchase prices and best summarizes completed legal transactions. Prices `[8, 2]` demonstrate that sorting invents a profitable ordering absent from the input. Products allocate linear returned output and constant working state beyond it; the stock scan uses constant working state and returns one number. Finite-number inputs and sufficiently precise intermediate arithmetic are assumed. Award two points for products, two for chronological state and counterexample, and two for storage and assumptions.

## Sources and Further Reading

This chapter adapts and expands repository-owned array prose, examples, and algorithms from the [archived combined chapter](archive/week-01-complexity-and-arrays.md), while keeping general complexity derivations in [Module 1](week-01.md). It is a standalone array lesson, not a replacement for the archive. The references below provide API documentation and further study; external pages were **not freshly browsed or verified during this authoring pass**. Their inclusion does not claim current access checks, editorial review, or judge acceptance.

- [MDN Array reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — official API vocabulary, mutation, iterative methods, callback arguments, copying methods, and sparse-array behavior. Follow individual method pages for precise bounds and exceptions. API behavior should not be confused with a guaranteed engine complexity table.
- [MDN structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) — supported deep cloning and cloning limitations. Check runtime support and supported data before choosing it for an ownership boundary.
- [MDN Array sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) — comparator contracts, default ordering, stability, and implementation-dependent time and space complexity.
- [OpenDSA](https://opendsa.org/) — array-based lists, list operations, and algorithm visualizations. Its abstract data-structure models help explain movement and trade-offs; they are not promises about JavaScript's physical array representation.
- The official LeetCode problem links in Interview and LeetCode Pattern Recognition identify the assigned practice tasks. The explanations and solutions here are independently presented teaching material; no platform editorials or submissions are claimed.

## Weekly Summary

Arrays organize values by position, while references determine which changes are shared. A correct method choice begins with a contract: index or value, boolean or collection, changed receiver or independent output. Traversals become explainable when you name the processed region and what its retained state means. Copies must reach the level you intend to isolate.

Opposite-end pointers fix outer positions; reader/writer pointers compact a retained prefix; prefix/suffix products reuse neighboring contributions; a running minimum summarizes eligible earlier prices. Each technique replaces a repeated question with maintained evidence. Continue to [Module 3 — Hash Maps and Sets](week-02.md), whose stable ID and existing `/app/weeks/2` route remain unchanged, to study remembered membership in depth.

## Weekly Progress Checklist

### Theory

- [ ] I can distinguish logical array positions from JavaScript engine storage guarantees. <!-- checkpoint:w17-array-representation -->
- [ ] I can explain indexes, length, boundary reads, holes, and explicit undefined entries. <!-- checkpoint:w17-indexing-and-holes -->
- [ ] I can state dense-array cost assumptions and separate output from auxiliary memory. <!-- checkpoint:w17-array-cost-model -->

### JavaScript

- [ ] I can explain mutation, callback behavior, and return values for the core array methods, including some. <!-- checkpoint:w17-array-method-contracts -->
- [ ] I can demonstrate aliases, shallow copies, selective nested copies, and supported deep cloning. <!-- checkpoint:w17-reference-copy-depth -->
- [ ] I can implement a bounded scan and stable reader/writer removal. <!-- checkpoint:w17-scan-and-removal -->
- [ ] I can reverse an array with opposite-end pointers and explain the fixed outer regions. <!-- checkpoint:w17-opposite-end-pointers -->
- [ ] I can implement prefix/suffix products without division and state each update invariant. <!-- checkpoint:w17-prefix-suffix-products -->

### Practice

- [ ] I completed the local conceptual, tracing, debugging, and implementation practice. <!-- checkpoint:w17-local-practice -->
- [ ] I attempted Contains Duplicate and explained equality and the memory trade-off. <!-- checkpoint:w17-contains-duplicate-practice -->
- [ ] I attempted Product of Array Except Self and tested one-zero and two-zero cases. <!-- checkpoint:w17-product-practice -->
- [ ] I implemented Stock with a running minimum and preserved chronological order. <!-- checkpoint:w17-stock-running-minimum -->
- [ ] I completed and scored the independent assessment before reading its answers. <!-- checkpoint:w17-independent-assessment -->

### Reflection

- [ ] I recorded a mistaken prediction and the reference drawing or invariant that corrected it. <!-- checkpoint:w17-reflect-on-error -->
- [ ] I can explain one array optimization aloud without reading its code. <!-- checkpoint:w17-explain-optimization -->
