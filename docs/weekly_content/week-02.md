# Week 2 - Hash Maps and Sets

This week, you will be learning how hash maps and sets replace repeated searching with remembered information. We will study hashing, collisions, frequency counting, and JavaScript's Map and Set, then use them to solve duplicate, complement, and anagram problems.

We will start by deciding what information a problem needs us to remember: presence, a count, an index, or a group. From there we will examine key equality and API behavior, build small working implementations, and trace how each stored entry relates to the input already processed.

By the end, you should be able to choose Map versus Set, justify an expected-time complexity claim, and design a useful key without losing information. You should also be able to explain why checking presence is different from testing a retrieved value's truthiness.

There will be a checklist at the end of the module to complete your progress logs. Use its Theory, JavaScript, Practice, and Reflection categories after attempting the exercises, and record the smallest counterexample that helped you correct a mistaken assumption.

## Learning Objectives

- Explain a hash function, bucket, collision, load factor, and resizing in a generic hash-table model.
- Separate expected and amortized costs from unconditional worst-case guarantees.
- Choose membership, frequency, index, or grouping state to match a problem's contract.
- Use Map and Set without confusing object identity, key presence, stored values, or insertion order.
- Implement first-duplicate detection, frequency counting, Two Sum, Valid Anagram, and Group Anagrams.
- Compare brute-force, sorting, and table-based approaches, including signature construction and output space.

## Prerequisite Knowledge

Review [Week 1](week-01.md) if array references, loop invariants, or auxiliary space still feel uncertain. We will rely on the idea that a variable can hold an object reference and that two different objects can contain identical fields. We also use destructuring in `for (const [key, value] of map)`; each iteration supplies one key/value pair.

The examples use finite numbers for arithmetic problems. Text examples treat strings as sequences of Unicode code points unless a lowercase ASCII restriction is explicitly stated. Code points are not always human-perceived characters: a visible symbol may consist of several code points. Case, spaces, punctuation, and accent normalization remain significant unless a contract says otherwise.

Remember that an optimized algorithm must preserve the baseline's meaning. “Return whether any duplicate exists,” “return the earliest repeated occurrence,” and “return all repeated values” are three different tasks. A collection type cannot decide that meaning for you.

## Core Theory

### Store the answer to the repeated question

Imagine receiving event identifiers and rejecting repeats. Searching all earlier events for every arrival costs `0 + 1 + ... + (n−1)` comparisons when identifiers are distinct. What repeats is the question “have I already seen this identifier?” A Set stores exactly the evidence required to answer it. If the question changes to “how many times have I seen it?”, you need a count associated with each key, so use a Map.

The most useful design step is a sentence defining stored state. For duplicates, `seen` contains all values in the processed prefix. For Two Sum, `indexes` maps a previously encountered value to one of its earlier indexes. For anagrams, a count describes unmatched supply. A good state definition tells you both what to store and when to update it.

### What hashing contributes

In a generic hash table, a hash function converts a key into a number used to select a bucket. Equal keys must follow a consistent lookup path. Different keys can land in the same bucket; this is a collision, not proof that they are equal. An implementation must still distinguish the keys, for example by storing a chain of entries or probing alternative positions.

Suppose a deliberately simple teaching function sums letter codes and takes the remainder modulo five. It sends both `ab` and `ba` to bucket zero because their sums agree. A table can still store both strings separately by comparing the actual keys inside the bucket. A grouping algorithm that uses the sum itself as its canonical key, however, would mistakenly merge many non-anagrams too. A hash collision handled by a table and an ambiguous application signature are different problems.

The load factor is roughly entries divided by buckets. More crowded buckets generally mean more collision work. Resizing creates more capacity and redistributes entries, so one insertion can be expensive even when a long sequence of insertions is cheap on average per operation. Geometric growth supports an amortized analysis. Expected collision behavior depends on assumptions about hashing and key distribution; it is a separate argument.

For interview algorithms we normally assume expected O(1) Map and Set operations. JavaScript's observable contract requires average sublinear access rather than a particular hash-table layout or unconditional constant time. In a generic pathological hash table, a lookup can scan Θ(n) colliding entries and n operations can become quadratic. Do not turn the convenient expected-time model into a language guarantee.

### Equality and presence are part of correctness

Map can distinguish number `1` from string `'1'`. An ordinary object's property keys are strings or symbols, so using numeric and string keys as properties can conflate them. Ordinary objects can also inherit properties; `Object.create(null)` removes that prototype concern but does not give object properties arbitrary-key identity semantics.

Object keys in a Map are compared by identity. Two separate `{ id: 1 }` objects are different keys. Map and Set use SameValueZero equality: NaN equals NaN for membership, and positive and negative zero are treated alike. Iteration follows insertion order, not numerical or alphabetical order. Updating an existing key changes its value without moving it to a new insertion position; deleting and adding it again creates a new insertion position.

`has` asks whether a key exists. `get` retrieves its value, which might legitimately be `undefined`, zero, false, or an empty string. Therefore `if (map.get(key))` is not a general presence test. Logical OR substitutes a fallback for every falsy value, while nullish coalescing substitutes only for null or undefined. Neither is a substitute for `has` when explicit undefined is valid data.

Use `set` and `get` for Map entries. Assigning `map.name = value` attaches an ordinary property to the Map object rather than inserting an entry. The property can be visible to normal property access while `map.size` and `map.has('name')` ignore it. This is a particularly confusing error because the object appears to remember something, just through the wrong interface.

### Counts, complements, and canonical keys

A frequency table records multiplicity. The inputs `aab` and `abb` have the same set of distinct letters but different counts, so a Set cannot decide whether they are anagrams. A Map can add supply from one string and consume it with the other. If a requested character has no remaining supply, failure is proved immediately. If supply remains afterward, the strings also fail to match.

Two Sum changes the question from “which earlier value should I try?” to “does the one needed value exist?” At current value `x`, its complement is `target − x`. A value-to-index Map answers that question while preserving original positions. Query before inserting the current position; otherwise a singleton could pair with itself.

Grouping requires a canonical key: two items should have the same key exactly when they belong together. Sorting a word's characters produces one canonical sequence for its multiset. A count vector is another option when the alphabet is fixed. Both require construction work, which belongs in the complexity analysis. A table lookup cannot undo an expensive key-building step.

### Top K Frequent Elements: invert the frequency table

After counting occurrences, Top K Frequent Elements asks which k distinct values have the largest counts. A clear baseline sorts the d frequency entries by descending count, taking expected O(n) counting plus O(d log(d+1)) comparison work. Sorting input values instead does not rank their frequencies; the comparison must use counts.

We can avoid comparison sorting because a frequency is an integer between 1 and n. Create buckets indexed by frequency, put each distinct value in its count's bucket, then visit buckets from n down to 1 until k values have been collected. Before entering bucket f, every uncollected value has frequency at most f. That invariant makes each next choice safe. Buckets here are application-level groups by exact count, not the internal collision buckets of a hash table.

## JavaScript Implementations

### Map and Set operations in context

This example separates key type, identity, presence, and stored value. Serializing entries makes insertion order visible. The final clear operations deliberately empty both structures.

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

### First repeated occurrence and frequency counting

Here “first duplicate” means the value whose repeated occurrence arrives earliest. For `[5, 8, 8, 5]`, the answer is 8, even though 5 appeared first originally. A tagged result avoids confusing “no duplicate” with a duplicate value of null. The brute-force equality helper matches Set's membership semantics for these examples.

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

The canonical guide uses null as a no-match sentinel. The tagged result here deliberately broadens that contract to unrestricted values. The algorithmic idea is unchanged, but a caller must inspect `found`. When adapting a lesson to an external problem, match its required return shape rather than copying this local API blindly.

### Two Sum: lookup before insertion

The baseline scans all unordered pairs. The optimized version stores only earlier indexes. It returns any valid pair or null; it does not promise the lexicographically smallest pair when several answers exist. Overwriting an earlier index for the same value is therefore acceptable.

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

The different first two outputs are intentional: both pairs sum to 11. A test that demands identical index pairs would incorrectly reject a valid implementation. Compare the contract—distinct indexes and correct sum—rather than an incidental discovery order.

### Valid Anagram: sorting versus consuming supply

Sorting is a useful baseline because equivalent multisets sort identically. The count version avoids sorting and deletes exhausted keys so an empty Map signals exact consumption. Empty strings are valid anagrams under this local contract.

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

### Group Anagrams: build the right key

The key below serializes a sorted code-point array. Serialization preserves element boundaries, and identical multisets produce identical keys. The output retains input order within each group and first-encounter order among groups. Those are useful deterministic local conventions even when an external problem accepts any group order.

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

For a validated lowercase English alphabet, a 26-count signature replaces sorting with a scan. Separators prevent ambiguous concatenation of counts. The validation is part of the implementation rather than a silent assumption about incoming data.

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

### Top K Frequent Elements with frequency buckets

This version accepts integer k from zero through the number of distinct values, returning an empty array for zero and throwing for an invalid k. It breaks equal-frequency ties by first encounter order, a deterministic local convention; the external problem guarantees a unique top-k set and permits any answer order. Each bucket must be a separate array, so use a factory rather than filling every slot with one shared array.

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

## Worked Examples

### Example 1: the duplicate's second occurrence determines the answer

For `[5, 8, 8, 5]`, begin with an empty Set. The first 5 is absent and gets inserted. The first 8 is also absent. The next 8 is already present, so return it immediately. The last 5 is irrelevant because the earliest repeated arrival has already been found. An outer loop that picks the earliest original position first could return 5 instead; that would solve a different “first” contract.

The Set invariant holds before every query: it contains exactly the values before the current position. Adding before querying breaks that invariant by including the position being tested. Returning a tagged result also lets `[null, null]` represent a real duplicate without colliding with the no-answer case.

### Example 2: count banana one character at a time

After `b`, the table is `b→1`. After `ba`, it is `b→1, a→1`; after `ban`, add `n→1`. The next a updates its existing count to 2, the next n updates its count to 2, and the final a reaches 3. Insertion order remains b, a, n even though a was updated most recently.

Every update reads one old count and writes one new count. Six characters produce six updates, but only three distinct keys remain. That distinction gives O(n) expected time and O(d) state, with `d` the number of distinct keys. Constant-time access does not imply constant total memory.

### Example 3: preserve the right temporal boundary in Two Sum

For `[4, 9, 2, 7]` and target 11, index 0 wants 7 and saves `4→0`. Index 1 wants 2 and saves `9→1`. Index 2 wants 9 and finds index 1, so the answer is `[1,2]`. Because every saved index is smaller than the current index, the two positions are automatically distinct.

On `[3]` with target 6, 3 is not in the initially empty Map, so the function saves it and finishes with null. On `[3,3]`, the second occurrence can use the first. This pair of tests isolates update-order errors better than a long random array.

### Example 4: anagram failure exposes missing supply

For `aab` versus `abb`, the initial supply is `a→2, b→1`. Consuming a leaves `a→1, b→1`; consuming b deletes b; the final b finds no supply and proves failure. Comparing Sets would have reported the same distinct characters and missed the problem.

For `abc` versus `ab`, no requested character fails, but c remains at the end. This is why the final `counts.size === 0` check matters. Early failure detects excess demand; the final check detects unused supply. Both directions are required for equality.

### Example 5: group membership is a key-design problem

For `arc`, sorting creates the sequence `[a,c,r]`. `car` produces the same sequence and joins the existing group. `rat` produces `[a,r,t]`, creating another group; `tar` and `art` join it. Sorting every word is extra work, but it avoids comparing each new word against every previous group representative.

A naive grouping baseline might have Θ(w²) representative comparisons for w unrelated words. If each comparison itself sorts strings of length m, that repeated work is expensive. A canonical key computes the expensive representation once per word. The count-vector variant removes sorting only because it can assign each allowed letter a known slot.

### Example 6: rank counts without sorting values

For `[4,2,4,3,2,4]`, counting gives 4→3, 2→2, and 3→1. Buckets 6, 5, and 4 are empty; bucket 3 contains 4, bucket 2 contains 2, and bucket 1 contains 3. To return two values, scan down until collecting 4 and 2, then stop. The output is values, not their counts and not their original indexes.

For `[8,9]` and k=1, both values occupy bucket 1. Our first-encounter tie convention chooses 8. A different tie convention could choose 9 and still satisfy an unrestricted top-k task; tests must respect the contract. Do not concatenate whole buckets after already collecting k entries, because a tied bucket may contain more values than the answer needs.

## Visual Explanations

```text
Generic table, illustrative bucket selection only:
hash("ab") ──> bucket 0 ──> ("ab", value1), ("ba", value2)
hash("ba") ──> bucket 0
                             compare real keys here

Same bucket does not imply same key.
Same application signature must imply the equivalence you intend.
```

The distinction prevents a common misunderstanding: collisions do not inherently make a correctly implemented Map lose entries. An incorrect signature can merge entries before the Map ever has a chance to distinguish them.

| Current index | Current value | Needed for 11 | Map before query | Action |
| --- | --- | --- | --- | --- |
| 0 | 4 | 7 | empty | Store 4→0 |
| 1 | 9 | 2 | 4→0 | Store 9→1 |
| 2 | 2 | 9 | 4→0, 9→1 | Return indexes 1 and 2 |

The map represents the strict past. The current value belongs to the future of that map until its query finishes. This temporal interpretation is often more useful than remembering a particular line order.

## Complexity Analysis

Let n be the number of values, d the number of distinct keys, a and b two string lengths in code points, w the number of words, and m the maximum word length. Table operations use the expected O(1) model unless stated otherwise.

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

The `+1` in logarithms avoids awkward notation for empty words. A precise grouping expression sums each word's own sorting and serialization costs rather than pretending every word has maximum length. Sorting workspace depends on the engine. Output arrays contain references to existing immutable strings; the implementation does not clone the characters of every original word merely by pushing a word reference.

String signatures still cost space and time. The 26-count estimate treats each count as a machine-sized word; serialized decimal counts take more characters as counts grow. If analyzing bit complexity rather than the usual interview model, count digit lengths and key hashing explicitly. A fixed alphabet can make a single frequency table constant-sized, but the number of groups and output references can still grow with w.

## Common Mistakes

Using a retrieved index as a boolean discards index zero. This intentionally broken function fails on the most ordinary Two Sum answer:

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

It incorrectly prints `null`; the valid earlier index zero was treated as false.

The repair is `has`, not an arbitrary alternate sentinel. Another frequent error is using `get(key) || 99` in a cache whose value zero is meaningful. Nullish coalescing preserves zero and false, but still replaces explicit undefined. Use a presence check when that distinction matters.

Do not use a Set when multiplicity matters, or object identity when the task means equality by a field such as an identifier. Conversely, serializing arbitrary objects to make keys can introduce ordering and type issues; choose a deliberate domain-specific key. Finally, a sorted output is not implied by Map iteration. If the caller needs ordering, budget for an explicit ordering step.

## Interview and LeetCode Pattern Recognition

Look for repeated membership questions, occurrence counts, complements, grouping, or “first seen” language. Then decide what each key needs to remember. Membership alone suggests Set; a count, index, or group suggests Map. If input is already sorted and memory is restricted, [Week 3's two-pointer technique](week-03.md) may solve a pair problem without storing every value.

For an unfamiliar task, say the invariant before naming the container. “This Map stores unmatched required occurrences” is an explanation. “I'll use hashing” is only a proposed tool. Also discuss whether preprocessing is allowed: sorting a copy may be acceptable for boolean existence but complicates original-index answers and changes arrival order.

Use the external problems to practice constraints as well as patterns. Valid Anagram and Group Anagrams specify lowercase English letters on the verified pages, so a count-vector solution is justified there. The broader code-point solutions in this chapter deliberately handle a wider local input contract.

## Practice Exercises

### Conceptual

1. Explain why a collision does not imply equality, and why expected O(1) lookup is not a guaranteed worst-case language property.
2. Choose Set, Map, or a fixed count array for visited IDs, ID-to-latest-timestamp, lowercase letter frequencies, and arbitrary object keys. Explain each choice.
3. Explain what `has` tells you that `get` cannot when a Map stores undefined, zero, or false.

### Tracing

4. Trace the Set for `[7, 2, 4, 2, 7]`, stopping at the earliest repeated occurrence.
5. Trace every count in `banana`, then consume `anaban` and decide whether it is an anagram.
6. Trace Two Sum on `[0, 4, 0]` with target 0. State exactly when index 0 becomes available.

### Debugging

7. Repair the index-zero bug above. Then explain why inserting before querying introduces a different bug.
8. A cache stores `attempts→0`, `enabled→false`, and `loaded→undefined`. Predict `get(key) || 99`, `get(key) ?? 99`, and `has(key)` for each and for an absent key.
9. Explain why adding letter codes is not a valid anagram signature. Find two different multisets with equal sums, and explain why count separators also matter.

### Implementation

10. Implement firstDuplicate with the tagged contract and test null, repeated object references, and two distinct equal-looking objects.
11. Implement frequency counting and Valid Anagram without sorting. Explain early failure and the final leftover check.
12. Implement both Group Anagrams variants. Test empty words, duplicate words, distinct groups, and rejection of uppercase input by the lowercase variant.

### External

The upstream assignment is Two Sum, Valid Anagram, Group Anagrams, and Top K Frequent Elements. Contains Duplicate below is a review exercise from Week 1.

13. [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** membership, Set, expected complexity. **Relevance:** reinforces the processed-prefix invariant; compare with the Week 1 baseline.
14. [Valid Anagram](https://leetcode.com/problems/valid-anagram/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** multiplicity, frequency tables, alphabet restrictions. **Relevance:** tests whether your state retains enough information to distinguish equal Sets with unequal counts.
15. [Group Anagrams](https://leetcode.com/problems/group-anagrams/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** canonical keys, grouping Maps, signature cost. **Relevance:** extends pairwise equivalence checking into efficient classification of many words.

16. [Two Sum](https://leetcode.com/problems/two-sum/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** complements, value-to-index Map, distinct positions. **Relevance:** practices query-before-insertion and handling index zero. Adapt the local implementation to the site's guaranteed-answer contract.
17. [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** frequency counting, frequency buckets, ranking. **Relevance:** uses a bounded count range to avoid sorting all frequency entries. Trace the buckets, implement a sorted-count baseline, and explain why `Array(n).fill([])` would break the bucket implementation.

## Hints and Worked Solutions

### Hints

For 1–3, separate the structure's internal bucket choice from the key's meaning in your application. For 4–6, write the table before each query, not only afterward. For 7–9, choose the smallest possible inputs: a valid index of zero, a singleton complement, and two two-letter words. For 10–15, make empty input and multiplicity part of the contract before implementation.

### Solutions 1–6

A collision means the hash function selected the same bucket; an equality check still separates different keys. Under a generic collision chain, a bad distribution can require scanning many entries. The expected-time model is useful but conditional. Use Set for visited IDs, Map for timestamps and arbitrary object keys, and a 26-slot array for validated lowercase counts. A Map's presence remains true even when its stored value is undefined.

The repeated-arrival trace stores 7, then 2, then 4; the next 2 is found, so return 2 before reaching the final 7. Banana ends with b:1, a:3, n:2. Consuming `anaban` uses those counts exactly, so it is an anagram. In `[0,4,0]`, the first zero fails its query and is saved at index 0. The 4 does not help. The last zero finds the earlier zero and returns `[0,2]`.

### Solutions 7–9: distinguish state from truthiness

Query `indexes.has(wanted)` and only then retrieve the index. Querying after inserting would let `[3]` satisfy target 6 using index 0 twice. The complete Two Sum implementation above fixes both errors.

For the cache, OR returns 99 for zero, false, undefined, and absence. Nullish coalescing preserves zero and false, but returns 99 for undefined and absence. `has` returns true for all three stored keys and false for the absent one. Here is an executable check of that distinction:

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

`ad` and `bc` have equal code sums and different multisets. Concatenating counts without separators similarly loses boundaries. Both errors occur in the application key, so even a perfectly correct Map cannot recover the lost information.

### Solutions 10–15: implementation and evaluation

The firstDuplicate, frequencies, validAnagram, and grouping implementations above are worked solutions. Repeated references to the same object are duplicates; distinct objects with matching fields are not. If the desired equality is by ID, store the ID instead and state that altered contract. Empty input returns no duplicate, an empty frequency table, or no groups. Two empty strings are anagrams, and two empty words form one group together.

The lowercase grouping variant should throw for `Arc` rather than silently index outside its count array. For performance comparison, count key construction: sorting each m-character word costs O(m log m) under the usual model, while a fixed alphabet permits O(m+26) work. For external grouping, compare groups as collections rather than insisting on an order the problem does not require. No external judge execution is claimed by these local worked examples.

### Solutions 16–17: complements and frequency ranking

For Two Sum, use the complete lookup-before-insertion implementation above; the external contract guarantees one pair, whereas our local function also defines the no-answer case. For Top K, first count values, then either sort the entries by descending count or invert the table into frequency buckets. The trace returns `[4,2]` because their frequencies are three and two. Allocating and scanning n+1 bucket slots is O(n), distributing d distinct values is O(d), and no value is emitted more than once. Expected time is O(n+d) and auxiliary space O(n+d), with O(k) output. Filling with one empty array would alias every bucket, mixing different frequencies and invalidating the ordering proof.

## Sources and Further Reading

The [canonical curriculum](../../shared/curriculum.js) and [Weeks 1–4 textbook](../../shared/textbook/weeks01to04.js) define the scope, including collision reasoning, first duplicates, frequency counts, Two Sum, and both anagram strategies. The explanations, traces, and exercises here expand that material.

- [MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map): consulted to verify key identity, insertion order, and the average-sublinear requirement. It does not promise unconditional O(1) lookup.
- [MDN Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set): consulted to verify membership equality, including NaN and signed zero.
- The five LeetCode pages in Practice Exercises were opened to verify statements, input restrictions, and difficulty. Editorials and community solutions were not used.
- [Upstream Week 2](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/02.md): fetched through the GitHub connector to verify the four assigned problems. The original teaching here extends the assignment with a frequency-bucket derivation.

Links were verified on 7 November 2026. No engine-specific hashing implementation was audited, no adversarial timing experiment is claimed, and the displayed solutions were not submitted to an external judge. The complexity discussion states its conventional table-operation and string-cost assumptions.

## Weekly Summary

Hash-based solutions become understandable when the stored information has a precise meaning. Set remembers membership; Map associates a key with the count, index, or group needed by the next question. Query order can enforce distinct positions, and key design can turn equivalence into direct grouping.

Carry two habits into [Week 3 — Two Pointers](week-03.md): define the state before writing the loop, and justify every update. The next chapter often replaces stored evidence with evidence supplied by ordering, reducing memory when its preconditions hold.

## Weekly Progress Checklist

### Theory

- [ ] I can explain hashing, collisions, load factor, and resizing. <!-- checkpoint:w2-hash-table-model -->
- [ ] I can distinguish expected access from amortized insertion and worst-case guarantees. <!-- checkpoint:w2-complexity-assumptions -->
- [ ] I can choose membership, frequency, index, or grouping state. <!-- checkpoint:w2-state-selection -->

### JavaScript

- [ ] I can use Map and Set methods without confusing properties and entries. <!-- checkpoint:w2-map-set-api -->
- [ ] I can explain identity, SameValueZero, and insertion order. <!-- checkpoint:w2-key-equality -->
- [ ] I can preserve zero, false, and undefined with explicit presence checks. <!-- checkpoint:w2-presence-checks -->
- [ ] I can implement lookup-before-insertion Two Sum. <!-- checkpoint:w2-two-sum-order -->

### Practice

- [ ] I traced duplicates, frequencies, and anagram consumption. <!-- checkpoint:w2-state-traces -->
- [ ] I completed the debugging and implementation exercises. <!-- checkpoint:w2-local-exercises -->
- [ ] I attempted the anagram assignments and duplicate review, explaining key construction costs. <!-- checkpoint:w2-external-practice -->
- [ ] I completed the assigned Two Sum and Top K tasks and explained bucket allocation. <!-- checkpoint:w2-top-k-and-two-sum -->

### Reflection

- [ ] I recorded a counterexample to an incorrect key or presence test. <!-- checkpoint:w2-counterexample-reflection -->
- [ ] I can explain when sorting or a fixed array is preferable to a Map. <!-- checkpoint:w2-tradeoff-reflection -->
