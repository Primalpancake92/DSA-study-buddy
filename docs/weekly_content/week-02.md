# Week 2 - Hash Maps and Sets
<!-- lesson-id:w2-section-chapter-introduction -->

A useful way to approach hash maps and sets is to start with a frustrating search problem: how often do we keep asking whether we have already seen something? We will build the intuition first, then connect it to hashing, collisions, and the trade-off of spending memory to save time. As you read, pause whenever a Map or Set changes and say what information it represents.

Suppose you receive another event identifier and need to know whether you have handled it already. You could search your entire history again. This week, we will learn how to remember just enough information to avoid that repeated search. JavaScript's Set remembers which values have appeared; Map connects each key with information such as a count or an index. We will explain how hashing supports these collections, what happens when keys share a storage location, and how those ideas help with duplicates and rearranged words.

Our starting question will be “what must we remember?” Sometimes we only need presence: whether a value exists. Other tasks need its occurrence count, its earlier position, or the group it belongs to. We will connect those choices to key equality, the collection methods you call, and small implementations you can trace by hand. At every step, we will say what a stored entry tells us about the input we have already read.

By the end, you should be able to choose between Map and Set and explain the assumptions behind an expected-time cost: a cost averaged under a stated model of hashing, rather than guaranteed for every possible operation. You will also design keys that preserve the distinctions your task needs. In particular, you will see why asking whether a key exists differs from asking whether its stored value behaves like true in a condition.

After you attempt the exercises, use the final checklist to update your progress logs under Theory, JavaScript, Practice, and Reflection. Record a small input that exposed a mistaken assumption, too. A two-element example that explains a bug is often more useful to revisit than a large test that only tells you something failed.

## Learning Objectives
<!-- lesson-id:w2-section-learning-objectives -->

- Explain how a generic hash table chooses a storage bucket, handles different keys that land together, measures crowding, and grows its capacity.
- Tell apart expected costs, costs spread across a sequence of operations, and guarantees for the most expensive possible case.
- Choose what to remember—membership, counts, indexes, or groups—from the problem's contract, meaning its input requirements and promised result.
- Use Map and Set while distinguishing the same object from equal-looking objects, an existing key from its value, and insertion order from sorted order.
- Build first-duplicate detection, frequency counting, Two Sum, Valid Anagram, and Group Anagrams, explaining what each stored entry means.
- Compare trying all candidates, sorting, and using a table; include the work of constructing grouping keys and storing the returned answer.

## Prerequisite Knowledge
<!-- lesson-id:w2-section-prerequisite-knowledge -->

If you need a refresher, [Algorithm Complexity](week-01.md) explains auxiliary space—the extra working storage an algorithm allocates—and [Arrays](week-17.md) covers references and visiting entries. A reference identifies a particular object; two objects can have identical fields without being that same object. We will also unpack pairs with `for (const [key, value] of map)`. This syntax is called destructuring: each iteration gives us a pair, and the two names receive its key and value separately.

For arithmetic problems, assume finite numbers. For text, we usually work with Unicode code points, the numbered units used to represent text, unless an example explicitly restricts input to lowercase ASCII letters. A code point is not necessarily a whole visible character: one displayed symbol can combine several code points. We do not silently ignore case, spaces, punctuation, or different accent representations. Those differences remain meaningful unless the stated contract explicitly removes them.

Before improving a simple solution, write down exactly what its answer means. “Return whether any duplicate exists,” “return the earliest repeated occurrence,” and “return all repeated values” demand different results. We will call the simple reference solution a baseline. An optimization must preserve that baseline's contract; choosing a convenient collection does not give us permission to change the question.

## Core Theory
<!-- lesson-id:w2-section-core-theory -->

### Store the answer to the repeated question

Imagine checking event identifiers as they arrive. With no remembered membership information, you search every earlier event again, making `0 + 1 + ... + (n−1)` comparisons when all identifiers differ. The repeated question is simply “have I already seen this identifier?” A Set keeps the evidence needed to answer that question directly. If you instead need to know how many times it appeared, presence alone loses information. A Map can associate each identifier with its count.

Write one sentence defining your state, meaning the information carried from one iteration to the next. For duplicates, `seen` contains the values in the processed prefix: the part before our current position. For Two Sum, `indexes` connects a previously encountered value with one of its earlier indexes. For anagrams, counts record occurrences still available to match. These sentences also tell us when to update. If a collection is meant to describe earlier positions, inserting today's position before querying changes its meaning.

### What hashing contributes

A hash table is a collection that uses a computed number to narrow down where it searches. The computation is a hash function, and the selected storage region is a bucket. Equal keys must follow a consistent lookup path so we can find what we inserted. Different keys can select the same bucket; we call that a collision. Sharing a bucket does not make the keys equal. The table still compares keys, perhaps within a chain of entries or by trying alternative storage positions, a process called probing.

For a deliberately simple example, add letter codes and take the remainder after division by five, also called modulo five. Both `ab` and `ba` reach bucket zero because the sums agree. A correct table can keep both original strings in that bucket and compare them during lookup.

Now suppose our application throws the strings away and uses only that sum as its grouping key. It will merge some words that are not rearrangements of each other. The table cannot repair information we discarded before insertion. Keep this distinction clear: internal collision handling compares original keys, whereas an ambiguous application signature has already replaced different meanings with the same key.

We describe crowding with the load factor, roughly entries divided by buckets. More entries per bucket generally mean more collision work. Resizing means allocating more capacity and redistributing existing entries. The insertion that triggers this can be expensive even if many insertions together are cheap per operation.

When capacity grows by a repeated multiplicative factor, geometric growth lets us spread that copying cost across the sequence. That is amortized analysis. Expected collision cost asks a different question about hashing assumptions and how keys are distributed. One argument concerns accumulated resizing work; the other concerns collision behavior. Neither should stand in for the other.

In interview analysis, we normally model Map and Set operations as expected O(1). Here O gives a growth upper bound, and “expected” identifies the cost model being bounded; it does not promise that each lookup takes a fixed amount of work. JavaScript requires average sublinear access—access that grows more slowly than scanning the whole collection—without prescribing a particular hash-table layout or unconditional constant time. A generic table with badly colliding keys can scan Θ(n) entries for one lookup, making n operations quadratic. State the useful conventional assumption without presenting it as a language guarantee.

### Equality and presence are part of correctness

Map keeps number `1` separate from string `'1'`. Ordinary object properties work differently: their keys are strings or symbols, so numeric and string property access can reach the same property. Objects may also inherit properties through their prototype, the object they look to for inherited behavior. `Object.create(null)` removes that inheritance concern. It still does not turn object properties into a Map with arbitrary keys compared by identity.

For object keys, identity means “this particular object,” rather than “an object with these fields.” Two separately created `{ id: 1 }` objects therefore occupy different Map entries. The equality rule used by Map and Set is called SameValueZero. Its notable numeric cases are that NaN matches NaN for membership and positive and negative zero are treated alike.

When you iterate, you get insertion order, the order in which entries were added, rather than numeric or alphabetical order. Updating an existing key keeps its position. Deleting that key and adding it again gives it a new insertion position. This matters when a result depends on first encounter order.

Use `has` to ask whether a key exists and `get` to retrieve its stored value. A legitimate value may be `undefined`, zero, false, or an empty string. These behave like false in a condition and are called falsy values, so `if (map.get(key))` can reject a key that is present.

Logical OR supplies a fallback for any falsy value. Nullish coalescing supplies one only for null or undefined, so it preserves zero and false. But if explicit undefined is meaningful stored data, neither fallback operator answers the presence question. You need `has` to distinguish that entry from an absent key.

Map entries must go through `set` and `get`. Writing `map.name = value` adds an ordinary object property; it does not insert a Map entry. You may read that property successfully and think insertion worked, yet `map.size` and `map.has('name')` ignore it. When debugging this, check which interface performed the write, rather than assuming that anything attached to the Map object belongs to its entries.

### Counts, complements, and canonical keys

A frequency table stores how many times each value occurs; that number of occurrences is its multiplicity. Anagrams are strings made from exactly the same characters with exactly the same counts, possibly in a different order. `aab` and `abb` have the same distinct letters, but their counts differ, so a Set cannot decide this question. We can count one string as supply, then consume an occurrence for each character in the other. A missing supply proves failure immediately. Leftover supply at the end also proves failure: matching requires equality in both directions.

For Two Sum, we want two distinct positions whose values add to the target. Instead of trying every earlier partner, calculate the one value we need. At current value `x`, that needed partner, called its complement, is `target − x`. A Map from values to earlier indexes can find it while preserving original positions. Query first and insert the current position afterward. Otherwise a one-element array could appear to pair its only position with itself.

To group words, choose a standard representation, called a canonical key, that is equal exactly when the words belong together. A multiset remembers values and their counts while ignoring order. Sorting a word's characters gives a standard sequence for that multiset. With a fixed alphabet, we can instead use a count vector: an ordered list with one count per allowed letter. Both representations take work to construct. Include that work in your complexity analysis; a quick lookup does not make key construction free.

### Top K Frequent Elements: invert the frequency table

Once we have occurrence counts, Top K Frequent Elements asks for the k distinct values with the highest counts. A straightforward baseline sorts the d frequency entries from largest count to smallest. Counting takes expected O(n), and sorting adds O(d log(d+1)) comparison work. Be careful about what you sort: ordering the original values numerically does not order their frequencies. Your comparison must inspect counts.

We can use the fact that every frequency is an integer between 1 and n. Make an array of groups indexed by frequency, place each distinct value in the group for its count, and scan from n down to 1 until we have k values. Before entering bucket f, every uncollected value has frequency at most f. This statement stays true as we move downward; it is an invariant, a fact preserved throughout the loop, and it explains why each next choice is safe. These buckets group values by exact occurrence count in our application. They serve a different purpose from the hash table's internal collision buckets.

## JavaScript Implementations
<!-- lesson-id:w2-section-javascript-implementations -->

### Map and Set operations in context

Let's check these rules in a small collection you can inspect completely. We will distinguish key types and object identity, then ask separately about presence and value. Converting entries to JSON text makes their iteration order visible. At the end we deliberately clear both collections, so their final sizes should be zero.

### Demonstration 1 — Observe Map keys and Set membership

```javascript
const record = { id: 1 };
const map = new Map([[1, 'number'], ['1', 'text']]);
map.set(record, undefined);
console.log(map.size, map.has(record), map.get(record));
console.log(map.has({ id: 1 }));
map.set(1, 'updated');
console.log(JSON.stringify([...map.entries()].slice(0, 2)));
console.log(map.delete('1'), map.delete('missing'));
const set = new Set([NaN, NaN, 0, -0, 2]);
console.log(set.size, set.has(NaN));
set.add(2).add(3);
console.log(set.delete(2), set.size);
map.clear();
set.clear();
console.log(map.size, set.size);
```
```output
3 true undefined
false
[[1,"updated"],["1","text"]]
true false
3 true
true 3
0 0
```

In **Demonstration 1**, `record` is one particular object. After `map.set(record, undefined)`, `has(record)` is true even though `get(record)` returns undefined. The newly created `{ id: 1 }` in the next query is a different object, so that query fails. Updating numeric key 1 preserves its original entry position. For the Set input `[NaN, NaN, 0, -0, 2]`, the duplicate NaN and signed-zero pair each collapse to one member, leaving size three before later changes.

### First repeated occurrence and frequency counting

We mean “first duplicate” in arrival order: which value has the earliest repeated occurrence? For `[5, 8, 8, 5]`, that is 8, even though 5 made its original appearance first. We return an object with a `found` field, called a tagged result, so a duplicate null stays distinguishable from no duplicate. The pair-scanning baseline uses an equality helper that matches Set membership, including NaN. We will also count every occurrence to show what changes when presence is no longer enough.

### Demonstration 2 — Find the first repeated arrival and count occurrences

```javascript
function sameValueZero(a, b) {
  return a === b || (Number.isNaN(a) && Number.isNaN(b));
}
function firstDuplicateBrute(values) {
  for (let right = 0; right < values.length; right += 1) {
    for (let left = 0; left < right; left += 1) {
      if (sameValueZero(values[left], values[right])) {
        return { found: true, value: values[right] };
      }
    }
  }
  return { found: false };
}
function firstDuplicate(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return { found: true, value };
    seen.add(value);
  }
  return { found: false };
}
function frequencies(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}
console.log(JSON.stringify(firstDuplicateBrute([5, 8, 8, 5])));
console.log(JSON.stringify(firstDuplicate([5, 8, 8, 5])));
console.log(JSON.stringify(firstDuplicate([null, null])));
console.log(JSON.stringify(firstDuplicate([])));
console.log(JSON.stringify([...frequencies('banana')]));
```
```output
{"found":true,"value":8}
{"found":true,"value":8}
{"found":true,"value":null}
{"found":false}
[["b",1],["a",3],["n",2]]
```

In **Demonstration 2**, follow `[5, 8, 8, 5]`: the first two queries fail and insert their values; the third query finds 8 and returns before the last 5. The nested-loop baseline reaches the same arrival because `right` chooses repeated positions in order. For `banana`, `(counts.get(value) ?? 0) + 1` starts an absent character at one and increments an existing count, giving a:3 by the end.

The canonical guide uses null as a no-match sentinel, a special value indicating failure. Our tagged result broadens the contract to unrestricted values, including null itself, so callers must inspect `found`. The remembered-state idea stays the same. When you adapt it to an external problem, return the shape that problem requests rather than assuming our local interface is universal.

### Two Sum: lookup before insertion

Let's compare trying every unordered pair—each pair of distinct positions once—with remembering earlier indexes. Both functions may return any valid pair, or null when none exists. They do not promise the lexicographically smallest pair, meaning the pair that comes first when you compare first indexes and then second indexes. Because that ordering is not required, overwriting an earlier index for the same value is acceptable here.

### Demonstration 3 — Find Two Sum partners before storing the current index

```javascript
function twoSumBrute(values, target) {
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (values[i] + values[j] === target) return [i, j];
    }
  }
  return null;
}
function twoSum(values, target) {
  const indexes = new Map();
  for (let i = 0; i < values.length; i += 1) {
    const wanted = target - values[i];
    if (indexes.has(wanted)) return [indexes.get(wanted), i];
    indexes.set(values[i], i);
  }
  return null;
}
console.log(JSON.stringify(twoSumBrute([4, 9, 2, 7], 11)));
console.log(JSON.stringify(twoSum([4, 9, 2, 7], 11)));
console.log(JSON.stringify(twoSum([3, 3], 6)));
console.log(JSON.stringify(twoSum([3], 6)));
```
```output
[0,3]
[1,2]
[0,1]
null
```

In **Demonstration 3**, target 11 with `[4, 9, 2, 7]` makes the Map version store 4 at index 0 and 9 at index 1. At index 2, `wanted` is 9, so `has` succeeds and the result is `[1,2]`. The baseline finds `[0,3]` first. Both pairs sum to 11, so a test demanding identical pairs would reject a correct answer. Test distinct indexes and the required sum. Also trace `[3]`: querying its empty Map before insertion prevents the only index from being used twice.

### Valid Anagram: sorting versus consuming supply

We can check anagrams by sorting both character collections, because equal multisets produce equal sorted sequences. The counting alternative avoids that sorting: each occurrence in the second string consumes one from the first. We delete a character when its supply reaches zero, making an empty Map a useful final test for exact consumption. Under our local contract, two empty strings are valid anagrams.

### Demonstration 4 — Compare sorted anagrams with counted supply

```javascript
function validAnagramSorted(first, second) {
  return JSON.stringify(Array.from(first).sort()) ===
    JSON.stringify(Array.from(second).sort());
}
function validAnagram(first, second) {
  const counts = new Map();
  for (const char of first) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  for (const char of second) {
    if (!counts.has(char)) return false;
    const remaining = counts.get(char) - 1;
    if (remaining === 0) counts.delete(char);
    else counts.set(char, remaining);
  }
  return counts.size === 0;
}
console.log(validAnagramSorted('aab', 'aba'));
console.log(validAnagram('aab', 'abb'));
console.log(validAnagram('🙂a', 'a🙂'));
console.log(validAnagram('abc', 'ab'));
console.log(validAnagram('', ''));
```
```output
true
false
true
false
true
```

In **Demonstration 4**, `'aab'` creates supply a:2,b:1. Against `'abb'`, the first a leaves one a, the first b exhausts b, and the second b fails `has`. Against a shorter string such as `'ab'` for supply `'abc'`, no request fails, but the final Map still contains c. This is why we need both the early presence test and the final emptiness check. `Array.from` and string iteration keep the emoji example on the same code-point model.

### Group Anagrams: build the right key

We will turn each sorted code-point array into JSON text to use as its grouping key. This conversion, called serialization, preserves the boundaries between array elements, so equal multisets get the same key without losing those boundaries. Within a group we preserve input order; groups themselves appear in first-encounter order. These conventions make our local output predictable even if an external problem accepts groups in any order.

### Demonstration 5 — Group words by their sorted character key

```javascript
function groupAnagrams(words) {
  const groups = new Map();
  for (const word of words) {
    const key = JSON.stringify(Array.from(word).sort());
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}
console.log(JSON.stringify(groupAnagrams(['arc', 'car', 'rat', 'tar', 'art'])));
console.log(JSON.stringify(groupAnagrams(['', '', 'a'])));
console.log(JSON.stringify(groupAnagrams([])));
```
```output
[["arc","car"],["rat","tar","art"]]
[["",""],["a"]]
[]
```

In **Demonstration 5**, `'arc'` first creates a group with the sorted key for a,c,r. `'car'` produces that same key, so `groups.get(key).push(word)` appends to the existing array. `'rat'` creates a different key and a second group. The `has` check creates each group only once, while spreading `groups.values()` returns the group arrays in encounter order. Two empty words share one empty-character key and stay together.

If we validate that every character is a lowercase English ASCII letter, we can replace sorting with 26 counts. Each letter gets a known position. Separators between counts prevent different count sequences from becoming the same text. Notice that validation belongs to the implementation: we do not quietly assume incoming text respects this narrower alphabet.

### Demonstration 6 — Group validated lowercase words with 26 counts

```javascript
function lowercaseSignature(word) {
  const counts = Array(26).fill(0);
  for (const char of word) {
    const index = char.charCodeAt(0) - 97;
    if (index < 0 || index >= 26 || char.length !== 1) {
      throw new RangeError('Expected lowercase ASCII letters');
    }
    counts[index] += 1;
  }
  return counts.join(',');
}
function groupLowercaseAnagrams(words) {
  const groups = new Map();
  for (const word of words) {
    const key = lowercaseSignature(word);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}
console.log(lowercaseSignature('aab') === lowercaseSignature('aba'));
console.log(lowercaseSignature('aab') === lowercaseSignature('abb'));
console.log(JSON.stringify(groupLowercaseAnagrams(['arc', 'car', 'rat'])));
```
```output
true
false
[["arc","car"],["rat"]]
```

In **Demonstration 6**, `'aab'` increments slot zero twice and slot one once. `'aba'` reaches the same counts, whereas `'abb'` does not. Subtracting 97 converts a lowercase ASCII character code to its slot. The range and length checks reject characters that cannot occupy those slots; for example, `'Arc'` throws rather than becoming an invalid signature. `join(',')` preserves count boundaries when we turn the array into a Map key.

### Top K Frequent Elements with frequency buckets

Our local function accepts an integer k between zero and the number of distinct values. Zero requests no results; an invalid k throws an error. Equal-frequency values are selected in first-encounter order here. The external task instead guarantees a unique top-k set and accepts any answer order. We also need a genuinely separate array for every frequency bucket. A factory, a function called to create each array independently, avoids sharing one array among all slots.

### Demonstration 7 — Select frequent values by descending count buckets

```javascript
function topKFrequent(values, k) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  if (!Number.isInteger(k) || k < 0 || k > counts.size) {
    throw new RangeError('k must fit the distinct-value count');
  }
  if (k === 0) return [];
  const buckets = Array.from({ length: values.length + 1 }, () => []);
  for (const [value, count] of counts) buckets[count].push(value);
  const result = [];
  for (let count = values.length; count >= 1; count -= 1) {
    for (const value of buckets[count]) {
      result.push(value);
      if (result.length === k) return result;
    }
  }
  return result;
}
console.log(JSON.stringify(topKFrequent([4, 2, 4, 3, 2, 4], 2)));
console.log(JSON.stringify(topKFrequent([8, 9], 1)));
console.log(JSON.stringify(topKFrequent([], 0)));
```
```output
[4,2]
[8]
[]
```

In **Demonstration 7**, `[4, 2, 4, 3, 2, 4]` yields counts 4:3, 2:2, and 3:1. Iterating those entries places 4 in bucket 3 and 2 in bucket 2. The descending loop skips empty buckets, emits 4, then emits 2 and returns immediately because k is two. That early return matters when a tied bucket contains more entries than we need. `Array.from(..., () => [])` creates separate bucket arrays, so adding to one frequency cannot affect another.

## Worked Examples
<!-- lesson-id:w2-section-worked-examples -->

### Example 1: the duplicate's second occurrence determines the answer

Take `[5, 8, 8, 5]` and say the Set contents before each arrival. Before 5 it is empty; we insert 5. Before the first 8 it contains only 5; we insert 8. Before the next 8 it already contains 8, so we return immediately. We never need the last 5. If an outer loop started with the earliest original position and searched for its later match, it could return 5 instead. That traversal answers a different meaning of “first.”

The fact we preserve before every query is exact: the Set contains the values before the current position. Inserting first would include the very position we are testing and make every arrival look repeated. Keep the result contract equally precise. On `[null, null]`, the tagged object reports a genuine duplicate through `found`, so null does not collide with the representation of no answer.

### Example 2: count banana one character at a time

Read banana one character at a time. After `b`, store `b→1`. After `ba`, store `b→1, a→1`; after `ban`, add `n→1`. The next a changes an existing count to 2 rather than adding another key. The next n also reaches 2, and the final a reaches 3. Updating a most recently does not move it: key iteration still follows the original insertion order b, a, n.

Each arrival reads one old count and writes one new count. Six characters therefore cause six updates, while the final table has only three keys. For n arrivals and `d` distinct keys, that gives O(n) expected time and O(d) stored state. Keep those measurements separate: an expected constant-time operation may be repeated many times, and the collection it accesses may still grow with the input.

### Example 3: preserve the right temporal boundary in Two Sum

On `[4, 9, 2, 7]` with target 11, index 0 needs 7. It is absent, so save `4→0`. Index 1 needs 2; that is absent too, so save `9→1`. At index 2, value 2 needs 9 and finds it at index 1, returning `[1,2]`. Every saved position comes from an earlier iteration. That temporal relationship, rather than an extra inequality check on the result, guarantees distinct indexes.

Contrast `[3]` and `[3,3]` for target 6. In the singleton, the initial Map is empty, so the query fails; inserting 3 afterward does not create a later query, and the function returns null. With two entries, the second 3 may use the first. These two tiny tests isolate whether query and insertion respect “earlier,” making an update-order error easier to understand than a failure buried in a long random input.

### Example 4: anagram failure exposes missing supply

Compare `aab` with `abb`. The first string provides `a→2, b→1`. Consuming a leaves `a→1, b→1`. Consuming b exhausts that key, so we delete it. The final b has no remaining supply and proves failure. Both strings still have the same distinct letters, so comparing Sets would miss the different occurrence counts. The count table preserves exactly the information that membership loses.

Now compare `abc` with `ab`. Every request in the second string can be supplied, so no early test fails. But c remains unused at the end. The final `counts.size === 0` check catches this opposite mismatch. Early failure detects demand that exceeds supply; the final check detects supply that exceeds demand. Equality requires both directions, even when one input is merely a shorter prefix of the other.

### Example 5: group membership is a key-design problem

Sorting `arc` gives `[a,c,r]`, which creates the first group. Sorting `car` gives the same sequence, so it joins that group. `rat` instead gives `[a,r,t]` and creates a second group; `tar` and `art` later produce that same second key. We pay to sort each word, but afterward a lookup replaces comparing the word with representatives from every existing group.

With w unrelated words, a naive grouping baseline may perform Θ(w²) comparisons against group representatives. If every comparison also sorts m-character strings, it repeats expensive preparation. A canonical key moves that preparation to one computation per word. The fixed-count variant avoids sorting only because each allowed letter has a known slot. Without a validated alphabet, we cannot simply assume that 26-slot representation applies.

### Example 6: rank counts without sorting values

Count `[4,2,4,3,2,4]` to obtain 4→3, 2→2, and 3→1. The descending scan first sees empty buckets 6, 5, and 4. Bucket 3 supplies value 4, then bucket 2 supplies value 2. If k is two, stop there without visiting bucket 1 for another result. We return the values 4 and 2 themselves. Counts explain their rank; original indexes are irrelevant to this task's answer.

For `[8,9]` with k=1, both values belong to bucket 1. Our local first-encounter convention chooses 8. A task permitting arbitrary tie choices could also accept 9, so tests must respect the stated tie contract. Emit entries individually and stop exactly at k. Concatenating an entire tied bucket can return too many values even if every value in that bucket has the same frequency.

## Visual Explanations
<!-- lesson-id:w2-section-visual-explanations -->

```text
Generic table, illustrative bucket selection only:
hash("ab") ──> bucket 0 ──> ("ab", value1), ("ba", value2)
hash("ba") ──> bucket 0
                             compare real keys here

Same bucket does not imply same key.
Same application signature must imply the equivalence you intend.
```

Follow the arrows to the real-key comparisons in the diagram. That comparison is why a collision does not make a correct Map lose an entry. If we instead replace two different meanings with the same application signature, the Map receives identical keys from us. It has no remaining information with which to separate them.

| Current index | Current value | Needed for 11 | Map before query | Action |
| --- | --- | --- | --- | --- |
| 0 | 4 | 7 | empty | Store 4→0 |
| 1 | 9 | 2 | 4→0 | Store 9→1 |
| 2 | 2 | 9 | 4→0, 9→1 | Return indexes 1 and 2 |

Read each table row before performing its action. At index 2, the Map contains indexes 0 and 1, so finding 9 proves that a distinct earlier partner exists. The current position joins that history only after a failed query. Thinking of the Map as “the strict past” explains the line order instead of leaving you to memorize it.

## Complexity Analysis
<!-- lesson-id:w2-section-complexity-analysis -->

We need several size measures because these tasks process different inputs. Let n count values, d count distinct keys, a and b measure the two strings in code points, w count words, and m be the maximum word length. Unless a row says otherwise, assume expected O(1) table operations. These bounds describe costs under that model; the symbols themselves do not choose best or worst input cases.

| Algorithm | Time | Additional storage |
| --- | --- | --- |
| Duplicate pair scan | Θ(n²) worst case | O(1) |
| First duplicate with Set | Expected O(n) | O(d), at most O(n) |
| Frequency Map | Expected Θ(n) | O(d) |
| Top K by count sorting | Expected O(n + d log(d+1)) | O(d), plus sorting workspace and output |
| Top K by frequency buckets | Expected O(n+d) | O(n+d) buckets and counts, plus O(k) output |
| Two Sum pair scan | Θ(n²) worst case | O(1), excluding constant-size answer |
| Two Sum Map | Expected O(n) | O(n) |
| Anagram by sorting | O(a log(a+1) + b log(b+1)) | O(a+b), plus sorting workspace |
| Anagram by counting | Expected O(a+b) | O(d) |
| Grouping by sorted signature | O(wm log(m+1) + w) under the usual model | O(wm+w), plus sorting workspace |
| Grouping by fixed 26 counts | O(total characters + 26w) under word-operation model | O(26w+w) key/count units |

The logarithms include `+1` so empty words do not create awkward notation. For a sharper grouping estimate, add the sorting and serialization cost of each word using its own length. Using m for all words is a convenient upper bound, not a claim that every word is that long. The engine determines sorting workspace. Also distinguish group references from copied text: pushing an existing immutable string into an output array does not clone all its characters.

A signature is still data that must be built, stored, and hashed. The 26-count estimate assumes each count fits in a machine-sized word, a fixed-size numeric storage unit in the usual model. Decimal serialization uses more characters for larger counts. If you analyze individual bits rather than ordinary interview operations, include those digit lengths and the work of hashing keys. A fixed alphabet bounds one frequency table's size, but it does not bound the number of groups or output references as w grows.

## Common Mistakes
<!-- lesson-id:w2-section-common-mistakes -->

An index of zero is a valid answer, but it behaves like false in a condition. Let's make that mistake deliberately so you can see which evidence it throws away. This is a broken Two Sum implementation, provided for debugging rather than reuse.

### Demonstration 1 — Broken Two Sum rejects an earlier index of zero

```javascript-bug
function brokenTwoSum(values, target) {
  const indexes = new Map();
  for (let i = 0; i < values.length; i += 1) {
    const previous = indexes.get(target - values[i]);
    if (previous) return [previous, i];
    indexes.set(values[i], i);
  }
  return null;
}
console.log(JSON.stringify(brokenTwoSum([2, 7], 9)));
```

In **Demonstration 1**, `[2, 7]` with target 9 first stores 2 at index zero. When 7 arrives, `get` correctly retrieves zero, but `if (previous)` rejects it. The function incorrectly prints `null`. Lookup succeeded; the boolean interpretation of its result caused the failure.

Repair the presence question with `has`. Choosing another arbitrary failure value only shifts the ambiguity. The same mistake appears in a cache when `get(key) || 99` replaces a meaningful zero. Nullish coalescing preserves zero and false, but it still replaces explicitly stored undefined. Whenever that distinction affects the contract, ask about presence separately from value.

Check what equality and counting mean before selecting your collection. A Set loses multiplicity, and object identity will not merge separate records that share an identifier. If identifiers define equality, store those identifiers. Serializing arbitrary objects is not an automatic fix: property order and types can make the resulting key unsuitable. Choose a key designed for your data. Likewise, Map iteration preserves insertion order, so a caller requiring sorted output needs an explicit ordering step and its cost.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w2-section-interview-and-leetcode-pattern-recognition -->

When a problem repeatedly asks whether something appeared, how often it appeared, which partner is needed, or where it belongs, investigate remembered state. Decide what goes with each key before choosing a collection. Presence alone points toward Set; counts, indexes, and groups point toward Map. Also inspect the constraints. With already sorted input and limited memory, [Week 3's two-pointer technique](week-03.md) may find a pair without retaining every value.

In an interview, explain what your stored entries mean before announcing the container. “This Map stores unmatched required occurrences” gives the interviewer a correctness argument to examine. “I'll use hashing” names a tool without explaining why it helps. Ask whether preprocessing—work performed before the main scan—is allowed, too. Sorting a copy can preserve a boolean existence question while complicating original-index answers and replacing arrival order.

Use the external assignments to practice reading constraints. The preparation notes for the previously verified Valid Anagram and Group Anagrams pages specify lowercase English letters, which justify 26-count keys for those tasks. Our general code-point implementations deliberately support a broader local contract. Choose the representation for the contract you are actually solving; these source notes do not claim a fresh verification of those pages.

### The hash-map question to ask aloud

Hashing is useful because it turns a repeated search into a remembered answer. Before writing code, name the question your map answers: “Have I seen this value?”, “How many copies have I seen?”, or “Which index completes the target?” The key is the question’s identity, and the value is the smallest piece of evidence needed later. For Two Sum, scan left to right, compute `target - current`, look up that complement first, and only then store the current index. Looking up first preserves the rule that an element cannot pair with itself and naturally returns the earlier index.

For frequency problems, trace one item at a time. Start an absent key at zero, increment it, and keep the map as a visible ledger. When grouping anagrams, the canonical key must make equivalent words identical: sorting characters is easy to explain, while a fixed 26-count signature is faster under a lowercase-input contract. A Set is the right tool when only presence matters; a Map is needed when counts, indices, or other evidence must survive.

### Beginner traps and interview explanations

Do not confuse a missing key with a stored value of zero, `false`, or an empty string. Use `has` or an explicit `undefined` check when truthiness could hide valid state. Do not promise constant time as a guarantee: hashing is expected O(1), with collisions and implementation details handled by the runtime. In an interview, state the invariant—“the map contains exactly the earlier portion of the scan”—then explain what each update preserves. That makes the solution auditable rather than magical.

### Recall card

- **Presence:** Set or `map.has(key)`.
- **Multiplicity:** increment a Map count.
- **Partner lookup:** query the complement before insertion.
- **Canonical grouping:** equal keys mean equal groups.
- **Ranking:** count first, then select using buckets or another ordered structure.

### Map and Set operations as data-structure choices

In JavaScript, `Map` represents key-to-value associations without coercing keys to strings. The core operations are `set(key, value)`, `get(key)`, `has(key)`, and `delete(key)`; `size` reports the number of distinct keys, and `for...of` preserves insertion order for iteration. A `Set` represents unique membership and uses `add(value)`, `has(value)`, and `delete(value)`. Both provide expected O(1) insertion, lookup, and deletion under ordinary hashing assumptions, but a full iteration is O(m) for m stored entries. A plain object can be convenient for known string keys, yet it has prototype and key-coercion concerns; choose it deliberately rather than by habit.

The right value prevents repeated work. Store an index when a later answer needs location, a count when it needs multiplicity, and a Boolean or Set entry when it only needs presence. `counts.set(value, (counts.get(value) ?? 0) + 1)` performs a read-modify-write update; the `?? 0` default distinguishes an absent key from a legitimate zero. For lookup-only code, `has` is clearer than `get(...) !== undefined` when `undefined` could itself be a valid stored value.

### Cost, space, and trade-off walkthrough

For n input items and m distinct keys, frequency counting is expected O(n) time and O(m) auxiliary space. Two Sum is expected O(n) time and O(n) space in the worst case because the map may retain almost every earlier index. Sorting first can reduce auxiliary map state in some variants, but it changes the bound to O(n log n), may mutate the input, and can lose original indices unless pairs are decorated. Grouping by sorted character keys adds the cost of sorting each word; a fixed alphabet signature trades generality for O(L) processing per word and constant-size alphabet state, where L is word length.

An interview answer should name those trade-offs: “I spend expected constant-time lookups and linear extra space to preserve one pass and original order.” Then state the assumption and the invariant: after processing the prefix, the structure summarizes exactly that prefix. This framing makes collision behaviour, duplicate handling, empty input, and output ordering visible rather than accidental.

## Practice Exercises
<!-- lesson-id:w2-section-practice-exercises -->

### Conceptual

1. Explain how a table can keep two colliding keys distinct. Then explain the assumptions behind expected O(1) lookup and why it is not a worst-case JavaScript guarantee.
2. For visited IDs, ID-to-latest-timestamp, lowercase letter frequencies, and arbitrary object keys, choose Set, Map, or a fixed count array. State the information each choice preserves.
3. Suppose a Map stores undefined, zero, or false. Explain which presence question `has` answers and why retrieving the value with `get` does not answer it by itself.

### Tracing

4. Write the Set before each arrival in `[7, 2, 4, 2, 7]`. Stop when you find the earliest repeated occurrence and explain why later entries cannot change that answer.
5. Record every count update while reading `banana`. Consume `anaban` from that supply one character at a time and decide whether the strings are anagrams.
6. Work through Two Sum on `[0, 4, 0]` with target 0. Show each needed complement and identify the exact moment index 0 becomes available to later queries.

### Debugging

7. Repair **Demonstration 1** in **Common Mistakes** so index zero remains usable. Separately explain the error you would introduce by inserting the current position before querying.
8. For a cache containing `attempts→0`, `enabled→false`, and `loaded→undefined`, predict `get(key) || 99`, `get(key) ?? 99`, and `has(key)`. Include an absent key and explain each fallback decision.
9. Find two different character multisets with equal letter-code sums to disprove that anagram signature. Then explain how omitting separators can make distinct count sequences ambiguous too.

### Implementation

10. Write firstDuplicate using the tagged result contract. Test a repeated null, repeated references to one object, and two separate objects with equal-looking fields; explain the expected identity behavior.
11. Write frequency counting and Valid Anagram without sorting. In your explanation, justify both an early missing-supply failure and the final test for unused supply.
12. Build both Group Anagrams variants. Include empty words, repeated words, several distinct groups, and uppercase input that the lowercase-only implementation must reject.

### External

The upstream assignment includes Two Sum, Valid Anagram, Group Anagrams, and Top K Frequent Elements. We also retain Contains Duplicate as Week 1 review. For each task, explain why your stored state answers the requested question before comparing runtimes.

13. [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** Set membership and expected complexity. **Relevance:** practice explaining that the Set contains the processed prefix. Compare the work with the Week 1 pair-scanning baseline and account for the extra remembered values.
14. [Valid Anagram](https://leetcode.com/problems/valid-anagram/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** occurrence counts, frequency tables, and restricted alphabets. **Relevance:** explain why two equal Sets may still describe strings with unequal multiplicities, and choose state that preserves those counts.
15. [Group Anagrams](https://leetcode.com/problems/group-anagrams/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** canonical keys, Maps of groups, and signature construction costs. **Relevance:** turn checking two equivalent words into classifying many words, explaining why equal keys mean precisely the same group.

16. [Two Sum](https://leetcode.com/problems/two-sum/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** needed complements, value-to-index Maps, and distinct positions. **Relevance:** query before insertion and preserve index zero as a valid answer. Adapt our local no-answer behavior to the site's guaranteed-answer contract.
17. [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** counting occurrences, frequency buckets, and ranking. **Relevance:** exploit the bounded range of possible counts to avoid sorting all count entries. Trace bucket placement, implement a sorted-count baseline, and explain how shared arrays from `Array(n).fill([])` would invalidate the bucket implementation.

## Hints and Worked Solutions
<!-- lesson-id:w2-section-hints-and-worked-solutions -->

### Hints

For 1–3, draw two stages: choosing an internal bucket and deciding whether application keys mean the same thing. For 4–6, show the collection before the query so you can see whether it describes the strict past. For 7–9, shrink the counterexample: an answer using index zero, a singleton needing itself, or two two-letter words often suffices. For 10–15, decide empty-input behavior and multiplicity requirements before implementing anything.

### Solutions 1–6

For questions 1–3, remember that bucket selection only narrows the search. Equality checking still separates different keys inside a shared bucket. A bad distribution in a generic chained table may force a long scan, so expected-time analysis needs its assumptions. Visited IDs need only Set membership; timestamps and arbitrary object keys need Map entries; validated lowercase counts fit 26 array slots. An entry storing undefined is still present, which is why `has` remains true for it.

For question 4, insert 7, then 2, then 4. The next 2 is already present, so return 2 without reaching the final 7. For question 5, banana provides b:1, a:3, n:2. Reading `anaban` consumes a, n, a, b, a, n, exhausting those exact counts and proving an anagram. For question 6, the first zero in `[0,4,0]` fails its query, then becomes available at index 0. The 4 supplies no zero partner. The final zero retrieves index 0 and returns `[0,2]`.

### Solutions 7–9: distinguish state from truthiness

Ask `indexes.has(wanted)` before retrieving the stored index, so zero is accepted as a valid position. Keep insertion after that query. Otherwise `[3]` with target 6 could use index 0 twice. **Demonstration 3** in **JavaScript Implementations** supplies the complete Two Sum repair and shows how the two decisions work together.

For the cache question, OR substitutes 99 for zero, false, undefined, and an absent entry. Nullish coalescing keeps zero and false, but substitutes 99 for undefined and absence. Only `has` separates the three stored keys from the absent key. Let's run those cases alongside the two key-construction mistakes so the lost distinctions are visible in the output.

### Demonstration 1 — Check cache presence and expose ambiguous signatures

```javascript
const cache = new Map([['attempts', 0], ['enabled', false], ['loaded', undefined]]);
for (const key of ['attempts', 'enabled', 'loaded', 'absent']) {
  console.log(key, cache.get(key) || 99, cache.get(key) ?? 99, cache.has(key));
}
console.log('ad'.charCodeAt(0) + 'ad'.charCodeAt(1));
console.log('bc'.charCodeAt(0) + 'bc'.charCodeAt(1));
console.log([1, 11].join(''), [11, 1].join(''));
console.log([1, 11].join(','), [11, 1].join(','));
```
```output
attempts 99 0 true
enabled 99 false true
loaded 99 99 true
absent 99 99 false
197
197
111 111
1,11 11,1
```

In **Demonstration 1**, the `attempts` row shows OR changing zero to 99 while nullish coalescing preserves it. The `loaded` and `absent` rows retrieve the same value, yet `has` distinguishes them. Next, `ad` and `bc` both sum to 197 despite having different multisets. Finally, joining `[1, 11]` and `[11, 1]` without separators produces the same text, while commas preserve the boundaries. These errors discard information in the application key; no correct Map implementation can reconstruct what we removed.

### Solutions 10–15: implementation and evaluation

Use **Demonstrations 2, 4, 5, and 6** in **JavaScript Implementations** as the worked answers for firstDuplicate, frequencies, validAnagram, and the grouping variants. Test identity deliberately: two references to one object repeat, whereas separate objects with matching fields do not. If the task defines equality by ID, store IDs and explain that changed contract. Empty collections produce no duplicate, an empty count table, or no groups as appropriate. Two empty strings are anagrams, and two empty words belong to one shared group.

The lowercase-only function must throw for `Arc`; silently writing outside the intended count slots would hide invalid input. In your cost explanation, include building the key. Sorting an m-character word costs O(m log m) in the usual model, while fixed-alphabet counting permits O(m+26) work. For external grouping, compare group membership without requiring an order the task leaves unspecified. These local worked examples support your reasoning; they do not claim an external judge run.

### Solutions 16–17: complements and frequency ranking

For Two Sum, **Demonstration 3** in **JavaScript Implementations** gives the complete lookup-before-insertion solution. The external task guarantees a pair, while our function additionally defines the no-answer result. For Top K, **Demonstration 7** in **JavaScript Implementations** first counts values and then groups them by frequency; sorting count entries is the baseline alternative. The example returns `[4,2]` because their counts are three and two.

Allocating and scanning n+1 bucket slots costs O(n), and distributing d distinct entries costs O(d). Each value is emitted at most once. We therefore get expected O(n+d) time and O(n+d) auxiliary space, plus O(k) output. Filling every slot with the same empty array would create aliases, multiple references to one array. Every insertion would then affect every bucket, mixing frequencies and destroying the descending-order argument.

## Sources and Further Reading
<!-- lesson-id:w2-section-sources-and-further-reading -->

Use the [canonical curriculum](../../shared/curriculum.js) and [Weeks 1–4 textbook](../../shared/textbook/weeks01to04.js) to locate the syllabus behind this chapter: collisions, first duplicates, frequencies, Two Sum, and both anagram strategies. Our explanations and exercises develop that scope into reasoning you can practice. The source history recorded during preparation is retained here; restyling this chapter did not involve checking those external pages again.

- [MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map): the preparation record cites this for key identity, insertion order, and average-sublinear access. Read that requirement carefully: it does not promise unconditional O(1) lookup.
- [MDN Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set): the preparation record cites its membership equality rules, including NaN and signed zero.
- The five LeetCode pages linked in Practice Exercises were checked during original preparation for statements, restrictions, and difficulty. That work did not use editorials or community solutions.
- [Upstream Week 2](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/02.md): the preparation record reports a GitHub connector fetch to confirm the four assigned problems. The frequency-bucket derivation expands that assignment with original teaching.

The existing preparation record dates link verification to 7 November 2026; this rewrite does not claim a new verification. It also records no audit of engine-specific hashing, no timing experiment with deliberately difficult keys, and no external judge submissions. Read the complexity claims with their stated conventional table-operation and string-cost assumptions.

## Weekly Summary
<!-- lesson-id:w2-section-weekly-summary -->

When you can explain exactly what each stored entry means, a hash-based solution stops looking like a trick. Set remembers membership. Map connects a key with the count, earlier index, or group needed by the next question. Querying before insertion enforces distinct positions, while a carefully chosen canonical key lets equivalent inputs find the same group directly. Both choices are correctness decisions before they are performance decisions.

Take two habits into [Week 3 — Two Pointers](week-03.md): say what your state means before writing the loop, and explain why every update preserves that meaning. Ordered input can sometimes supply evidence that we otherwise needed to store, reducing memory when the required preconditions hold. You will use the same reasoning habits even though the data structure changes.

## Weekly Progress Checklist

### Theory

- [ ] I can explain bucket selection by hashing, collision handling, load factor, and why resizing redistributes entries. <!-- checkpoint:w2-hash-table-model -->
- [ ] I can separate expected lookup assumptions, insertion costs spread across a sequence, and worst-case guarantees. <!-- checkpoint:w2-complexity-assumptions -->
- [ ] I can justify remembering presence, occurrence counts, earlier indexes, or groups for a specific contract. <!-- checkpoint:w2-state-selection -->

### JavaScript

- [ ] I can use the Map and Set interfaces and explain why ordinary object properties are not collection entries. <!-- checkpoint:w2-map-set-api -->
- [ ] I can trace object identity, SameValueZero membership, and the iteration order produced by insertion. <!-- checkpoint:w2-key-equality -->
- [ ] I can distinguish an absent key from one storing zero, false, or undefined by checking presence explicitly. <!-- checkpoint:w2-presence-checks -->
- [ ] I can write Two Sum and explain why its query must precede insertion of the current index. <!-- checkpoint:w2-two-sum-order -->

### Practice

- [ ] I traced repeated arrivals, count updates, and consumption of anagram supply one step at a time. <!-- checkpoint:w2-state-traces -->
- [ ] I attempted and checked every local debugging and implementation exercise. <!-- checkpoint:w2-local-exercises -->
- [ ] I attempted the anagram assignments and duplicate review and included key-building work in my analysis. <!-- checkpoint:w2-external-practice -->
- [ ] I completed Two Sum and Top K, including an explanation of independent bucket allocation. <!-- checkpoint:w2-top-k-and-two-sum -->

### Reflection

- [ ] I recorded a small input showing why an incorrect signature or presence test loses required information. <!-- checkpoint:w2-counterexample-reflection -->
- [ ] I can explain a contract for which sorting or fixed-alphabet counts are a better choice than a Map. <!-- checkpoint:w2-tradeoff-reflection -->
