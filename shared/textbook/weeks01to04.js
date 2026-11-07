// Chapters follow weekCatalog and moduleGuides in ../curriculum.js.
// Hints and solutions are deliberately separate from visible explanation blocks.
const paragraph = (text) => ({ type: 'paragraph', text });
const code = (code) => ({ type: 'code', code });
const diagram = (text) => ({ type: 'diagram', text });
const exercise = (prompt, hints, solution) => ({ type: 'exercise', prompt, hints, solution });

export const chapters01to04 = {
    1: {
        sections: [
            {
                id: 'w1-complexity-growth',
                title: 'Complexity and Arrays: predict the work',
                blocks: [
                    paragraph(
                        `Imagine searching a row of lockers. Knowing locker number 12 lets you go straight there; knowing only the contents means opening lockers until you find a match. That distinction is indexed access versus searching. An array is an ordered sequence: index 0 identifies the first position, while the value at that position can be anything. Duplicate values do not make duplicate positions. Before coding, say whether the answer should be a value, an index, a boolean, or a new collection. Those contracts change the implementation even when the underlying traversal looks similar.`
                    ),
                    paragraph(
                        `Complexity asks how work grows with input size, rather than how many milliseconds one laptop records. Let n be the number of array elements. Reading a known position is conventionally O(1); inspecting every element is Θ(n). Big O is an asymptotic upper bound, while Big Theta is a tight bound with matching upper and lower growth rates. A linear traversal is also O(n²), but that loose statement hides useful information. Prefer the tightest justified upper bound and use Theta when the work is tightly established. Constants and small terms disappear from growth classes: 3n + 7 is Θ(n), not a new category.`
                    ),
                    paragraph(
                        `Best, average, and worst case describe different inputs of the same size; O and Θ describe bounds on whichever case you selected. Linear search takes constant work when the first position matches, and linear work when the target is missing or last. An average-case claim needs a distribution: if a present target is equally likely at every position, the average number of comparisons is (n + 1) / 2. Without that assumption, do not invent an average. The guide's usual O(n) average search model assumes targets are not systematically concentrated at the beginning.`
                    ),
                    code(`function firstIndexOf(values, target) {
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === target) return index;
  }
  return -1;
}
console.log(firstIndexOf([4, 8, 2], 8)); // 1
console.log(firstIndexOf([], 8)); // -1
console.log(firstIndexOf([9, 2, 6], 6)); // 2`),
                    diagram(`Search [9, 2, 6] for 6
index | value | match? | action
0     | 9     | no     | advance
1     | 2     | no     | advance
2     | 6     | yes    | return 2
Invariant before index i: no position in [0, i) matches.
Termination at n: every position was excluded, so return -1.`),
                    paragraph(
                        `Count the dominant operation to derive cost. This search makes at most n equality checks and keeps only an index: O(n) worst-case time and O(1) auxiliary space. The input array occupies O(n) memory, but it was supplied by the caller; auxiliary space means additional working storage. Returning a newly allocated array introduces output space, which should be reported separately when useful. A function that copies its input uses O(n) additional space even if it has just one variable holding that copy. Variable count alone is never a space proof.`
                    ),
                    paragraph(
                        `Two consecutive full scans cost n + n, hence Θ(n). A nested loop that compares every pair costs n(n - 1)/2, hence Θ(n²). A loop containing exactly three iterations stays constant per outer iteration. A loop that repeatedly halves a positive search range has logarithmic iteration count. Do not diagnose complexity from indentation. Write a sum of actual work, then simplify. This habit will explain later why two moving boundaries can remain linear despite a while loop nested inside a for loop.`
                    )
                ]
            },
            {
                id: 'w1-array-references-methods',
                title: 'References, copies, methods, and deliberate mutation',
                blocks: [
                    paragraph(
                        `JavaScript variables containing arrays hold references to array objects. Assigning one variable to another copies the reference, so both names observe the same mutations. A slice or spread creates a new outer array, but the contained object references remain shared. Think of copying a list of house addresses: you made a new list, not new houses. For nested records, choose which levels must be independent. A shallow copy is sufficient when rearranging primitive values; it is insufficient when editing a shared nested object's fields. Avoid promising deep independence without understanding the data's types.`
                    ),
                    code(`function demonstrateCopies() {
  const original = [{ score: 1 }, { score: 2 }];
  const alias = original;
  const shallow = original.slice();
  alias.push({ score: 3 });
  shallow[0].score = 9;
  const independentRecords = original.map(item => ({ ...item }));
  independentRecords[0].score = 20;
  return [original.length, shallow.length, original[0].score,
    independentRecords[0].score];
}
console.log(demonstrateCopies()); // [3, 2, 9, 20]`),
                    paragraph(
                        `For ordinary dense arrays, push and pop work at the end; push is amortized O(1), because occasional capacity growth is spread over many appends. Shift, unshift, and inserting or deleting near the front with splice can move a linear number of later elements. Slice and spread copy a range in linear time and space. Includes, indexOf, and find may scan the full array. Map and filter normally visit each element and allocate output; reduce visits each element but its callback determines additional costs. A reduce that copies an ever-growing accumulator can become quadratic. These are standard algorithm models, not promises about every engine representation, sparse array, proxy, or user-defined callback.`
                    ),
                    paragraph(
                        `Sort mutates the array, and its default ordering compares string representations: numbers such as 10 and 2 need a numeric comparator. Use a copied array if original order matters. A typical comparison sort costs O(n log n), but JavaScript does not prescribe one universal sorting algorithm or auxiliary-space bound. State the assumption instead of claiming sorting is free or always constant-space. Likewise, a single method call is not automatically O(1): its hidden traversal still counts. A callback that performs another linear search turns map into quadratic work.`
                    ),
                    code(`function sortedNumbersCopy(values) {
  return [...values].sort((a, b) => a - b);
}
function removeNegativesInPlace(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] < 0) values.splice(index, 1);
  }
  return values;
}
console.log(sortedNumbersCopy([10, 2, 1])); // [1, 2, 10]
console.log(removeNegativesInPlace([-1, -2, 3])); // [3]`),
                    paragraph(
                        `Deleting backward prevents skipping: positions before the deletion remain unchanged, so the next smaller index still refers to an unprocessed value. In a forward loop, deleting index 0 from [-1, -2, 3] shifts -2 into index 0, then incrementing skips it. Backward deletion is correct but can still cost Θ(n²) because splice shifts suffixes repeatedly. Correctness and efficiency are separate questions. A later reader/writer algorithm will compact survivors in one pass. Also stop loops at index < length; index <= length reads an extra undefined and can make an absent target appear present if the target itself is undefined.`
                    )
                ]
            },
            {
                id: 'w1-brute-force-prefix-suffix-practice',
                title: 'From repeated scans to reusable work',
                blocks: [
                    paragraph(
                        `Start Contains Duplicate with the obvious specification: compare each position with every later position and return as soon as equal values appear. This gives a trusted small-input baseline. A Set then remembers previously processed values and avoids repeating those comparisons. That exchanges O(n) memory for expected O(n) time, under the usual constant-time membership assumption. Keep the input-order contract explicit: sorting a copy also finds adjacent duplicates, but costs sorting time and copy space. This first week introduces the trade-off; next week explains why membership tables can be fast.`
                    ),
                    code(`function containsDuplicateBrute(values) {
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
console.log(containsDuplicateBrute([4, 1, 4])); // true
console.log(containsDuplicate([1, 2, 3])); // false
console.log(removeDuplicates([2, 1, 2])); // [2, 1]`),
                    exercise(
                        `Foundation: trace firstIndexOf([9, 2, 6], 6), then explain why its input storage is not auxiliary space. What happens for [] and for an absent target?`,
                        [
                            'Record index, current value, and whether the prefix has been ruled out.',
                            'Count comparisons separately from allocated collections.'
                        ],
                        `The checks are (0,9,false), (1,2,false), (2,6,true), returning 2 after three comparisons. Before each check, earlier positions cannot match. Empty input makes zero comparisons and returns -1; an absent target checks all n positions and returns -1. Only an index and fixed-size control state are added, so auxiliary space is O(1), despite the O(n) input. Worst-case time is Θ(n); best-case time on nonempty matching input is Θ(1).`
                    ),
                    exercise(
                        `Intermediate: debug forward deletion of negative values and describe a linear alternative without repeatedly shifting elements.`,
                        [
                            'Use [-1, -2, 3] as the smallest revealing example.',
                            'Let a writer mark the next retained position and truncate after reading everything.'
                        ],
                        `Deleting index 0 shifts -2 into that position; incrementing the reader skips it. Backward splice fixes correctness but may remain quadratic. A writer can copy each nonnegative value into the next output position, then set length to the retained count. Each input is read once and written at most once, so time is Θ(n) and auxiliary space O(1). This anticipates week 3: the prefix before writer always contains exactly the retained values from the processed input, in order.`
                    ),
                    paragraph(
                        `Product of Array Except Self makes reusable work concrete. The brute-force answer for position i multiplies every position except i, repeating almost the same scan n times. Rather than divide a total product, which mishandles zeros, store the product strictly to the left of each position, then multiply by a running product strictly to its right. This works with zero, multiple zeros, and negative numbers without special cases. Assume finite numeric inputs whose arithmetic remains representable; JavaScript Number arithmetic can lose precision or overflow. Output storage is unavoidable because the requested answer has n entries.`
                    ),
                    code(`function productExceptSelfBrute(values) {
  const result = [];
  for (let i = 0; i < values.length; i += 1) {
    let product = 1;
    for (let j = 0; j < values.length; j += 1) {
      if (i !== j) product *= values[j];
    }
    result.push(product);
  }
  return result;
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
console.log(productExceptSelfBrute([1, 2, 3, 4])); // [24, 12, 8, 6]
console.log(productExceptSelf([1, 2, 3, 4])); // [24, 12, 8, 6]
console.log(productExceptSelf([2, 0, 4])); // [0, 8, 0]`),
                    diagram(`Input             [1, 2, 3, 4]
Strict left       [1, 1, 2, 6]
Strict right      [24,12, 4, 1]
Multiply          [24,12, 8, 6]
Before writing i: prefix excludes i.
Before multiplying i: suffix excludes i.`),
                    exercise(
                        `Challenge: explain why the prefix and suffix updates come after writing the current result. Derive both implementations' costs and test two zeros.`,
                        [
                            'Including the current value would violate “except self.”',
                            'For [0, 2, 0], every answer includes at least one zero.'
                        ],
                        `Writing first preserves strict exclusion of the current position. Updating first would multiply by the current value, changing the problem. The baseline performs n(n-1) multiplications: Θ(n²) time, Θ(n) output, O(1) working state beyond output. The optimized implementation performs two full scans: Θ(n) time, Θ(n) output, O(1) additional working state. [0,2,0] yields [0,0,0]. [] yields []; a singleton yields [1] under the empty-product convention. Mastery means being able to explain these contracts, the invariant, and why a copy or method call changes the space or time bill.`
                    )
                ]
            }
        ]
    },
    2: {
        sections: [
            {
                id: 'w2-hashing-map-set-internals',
                title: 'Hash Maps and Sets: remember the processed prefix',
                blocks: [
                    paragraph(
                        `Suppose you check whether every new guest has already arrived. Searching the complete guest list again for every arrival repeats old work. A membership structure records who has arrived, so each new name asks one focused question. Use a Set when the answer is only present or absent. Use a Map when a key needs associated information: an occurrence count, original index, group of records, or cached result. Both are structures for organizing evidence from earlier input. The key design question is what the stored state means after processing a prefix, not simply which API has the shortest syntax.`
                    ),
                    paragraph(
                        `In the standard hash-table model, a hash function converts a key into a hash value that selects a bucket. Different keys can select the same bucket: that is a collision, not equality. An implementation resolves collisions through strategies such as bucket chains or probing, then checks key equality to distinguish entries. As entries grow, resizing may allocate a larger table and redistribute them. This explains why practical access is often expected constant time and insertions may have amortized costs, rather than every operation taking an identical fixed duration. JavaScript specifies observable behavior and average sublinear access requirements, not one mandatory bucket layout.`
                    ),
                    paragraph(
                        `For interview analysis we normally assume expected O(1) Map and Set operations, making a single pass expected O(n). State that assumption. A pathological hash-table collision pattern can make an operation linear and a sequence quadratic in the generic model; exact engine defenses are implementation details. Key construction also matters: hashing or comparing a long string is not magically free in a model counting characters. An algorithm that constructs a length-m signature for each of n words spends at least O(nm) work even if the subsequent table access is treated as constant.`
                    ),
                    paragraph(
                        `Map preserves arbitrary key types: numeric 1 and string "1" are different keys. Ordinary object property keys are strings or symbols, so using arbitrary values as object properties can silently conflate keys. Object keys in Map are compared by identity: two separately created objects with identical fields are different keys. Set and Map use SameValueZero equality, which treats NaN as equal to itself and +0 and -0 as the same key. Iteration follows insertion order, which is useful for stable deduplication, but it does not sort keys. Choose an explicit ordering step when ordered output is required.`
                    ),
                    code(`function inspectKeys() {
  const first = { id: 1 };
  const second = { id: 1 };
  const map = new Map([[1, 'number'], ['1', 'string'],
    [first, undefined], [second, 0]]);
  const set = new Set([NaN, NaN, 0, -0]);
  return [map.size, map.has(first), map.get(first),
    map.has({ id: 1 }), map.get(second), set.size];
}
console.log(inspectKeys()); // [4, true, undefined, false, 0, 2]`),
                    paragraph(
                        `Get and has answer different questions. A present key can deliberately store undefined, so get returning undefined does not prove absence. Likewise, zero, false, and the empty string are valid stored values. A fallback using logical OR replaces all falsy values; nullish coalescing replaces only null or undefined. For a frequency map whose counts are positive, either fallback often happens to work, but that coincidence is not a general rule. If presence matters, ask has. Use set to update a value; assigning a bracket property on the Map object does not insert a Map entry.`
                    )
                ]
            },
            {
                id: 'w2-duplicates-frequencies-complements',
                title: 'Duplicates, frequency tables, and complements',
                blocks: [
                    paragraph(
                        `For firstDuplicate, define “first” carefully: here it means the value whose repeated occurrence is encountered earliest during a left-to-right scan. The Set represents exactly the values in the already processed prefix. Check membership before adding the current value; adding first would make every value look repeated. Returning null follows the guide, but null is ambiguous if null itself can be a duplicate. For unrestricted keys, return a tagged result such as { found, value }, or return the repeated position. A contract can remove ambiguity more reliably than a clever sentinel.`
                    ),
                    code(`function firstDuplicateBrute(values) {
  for (let right = 0; right < values.length; right += 1) {
    for (let left = 0; left < right; left += 1) {
      const a = values[left];
      const b = values[right];
      if (a === b || (Number.isNaN(a) && Number.isNaN(b))) return b;
    }
  }
  return null;
}
function firstDuplicate(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}
function frequencies(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}
console.log(firstDuplicateBrute([4, 1, 4])); // 4
console.log(firstDuplicate([4, 1, 4])); // 4
console.log([...frequencies('banana')]); // [['b',1], ['a',3], ['n',2]]`),
                    diagram(`banana frequency updates
b: b→1
a: b→1, a→1
n: b→1, a→1, n→1
a: b→1, a→2, n→1
n: b→1, a→2, n→2
a: b→1, a→3, n→2
Invariant: each count equals occurrences in the processed prefix.`),
                    paragraph(
                        `The duplicate baseline makes 0 + 1 + ... + (n - 1) comparisons if all values differ, so worst-case time is Θ(n²). The Set version makes n membership queries and at most n insertions, giving expected O(n) time and O(d) auxiliary space for d distinct values, bounded by O(n). A frequency table also uses O(d) space, not O(1) merely because a lookup is expected constant. Sorting offers another route, but sorting changes arrival order unless you retain indexes, and it costs O(n log n) under the usual comparison-sort model.`
                    ),
                    paragraph(
                        `Two Sum asks whether an earlier value can complement the current value to reach a target. The brute force tests every distinct pair; the optimized pass stores value → earlier index. At current value x, look for target - x before inserting x. This order prevents reusing the current position. It also handles [3,3] with target 6: the first 3 is stored, and the second finds index 0. Values need not be sorted, and original indexes remain available. Assume finite numbers with exact enough arithmetic for the target comparisons; floating-point tolerance is a separate contract.`
                    ),
                    code(`function twoSumBrute(values, target) {
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
    const complement = target - values[i];
    if (indexes.has(complement)) return [indexes.get(complement), i];
    indexes.set(values[i], i);
  }
  return null;
}
console.log(twoSumBrute([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 3], 6)); // [0, 1]
console.log(twoSum([3], 6)); // null`),
                    paragraph(
                        `Trace [2,7,11,15], target 9. At index 0, complement 7 is absent, so save 2→0. At index 1, complement 2 is present, so return [0,1]. The invariant is that every stored index is strictly less than the current index. Overwriting a duplicate's saved index is acceptable when any valid pair is allowed; preserving the earliest index would require inserting only absent values. The expected linear solution trades linear memory for avoiding the quadratic pair enumeration. Explain that trade-off before declaring the optimized version universally preferable.`
                    )
                ]
            },
            {
                id: 'w2-anagrams-progressive-practice',
                title: 'Counting equivalence and grouping anagrams',
                blocks: [
                    paragraph(
                        `Anagrams have equal multisets of characters: order may differ, but each character's count must agree. A Set loses multiplicity, so it cannot distinguish aab from abb. Sorting both words is a useful baseline because equal sorted sequences imply equal multisets. A frequency Map avoids sorting by adding counts from one word and consuming them with the other. Here strings are interpreted as Unicode code points using Array.from or for-of, with case and punctuation significant. Human-perceived graphemes and normalized accents require an explicitly different text contract; do not silently mix character models.`
                    ),
                    code(`function validAnagramSorted(first, second) {
  return Array.from(first).sort().join('') ===
    Array.from(second).sort().join('');
}
function validAnagram(first, second) {
  const counts = new Map();
  for (const char of first) counts.set(char, (counts.get(char) ?? 0) + 1);
  for (const char of second) {
    if (!counts.has(char)) return false;
    const remaining = counts.get(char) - 1;
    if (remaining === 0) counts.delete(char);
    else counts.set(char, remaining);
  }
  return counts.size === 0;
}
function groupAnagrams(words) {
  const groups = new Map();
  for (const word of words) {
    const signature = JSON.stringify(Array.from(word).sort());
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(word);
  }
  return [...groups.values()];
}
console.log(validAnagramSorted('aab', 'aba')); // true
console.log(validAnagram('aab', 'abb')); // false
console.log(groupAnagrams(['eat', 'tea', 'tan', 'ate']));
// [['eat', 'tea', 'ate'], ['tan']]`),
                    paragraph(
                        `A brute-force grouping strategy compares each new word with a representative from every existing group. In the worst case there are n groups, giving quadratic representative checks, each with its own anagram cost. A canonical signature turns equivalence into one lookup. Sorting m characters costs O(m log m) under the comparison model; across n words of maximum length m, the displayed grouping takes O(nm log m) character work, plus key construction. Stored signatures and output references use O(nm + n) space in the worst case. For a fixed lowercase English alphabet, a 26-count signature reduces character processing to O(nm), but only after validating that alphabet assumption.`
                    ),
                    exercise(
                        `Foundation: trace the frequency Map for banana. Why is a Set insufficient for Valid Anagram?`,
                        [
                            'Compare aab and abb.',
                            'Write the invariant after each consumed character.'
                        ],
                        `The final counts are b→1, a→3, n→2. A Set stores only {a,b} for both aab and abb, losing the count distinction. In the consumption algorithm, each Map count is the unmatched supply from the first word after processing the second word's prefix. Missing supply proves failure immediately; an empty Map at the end proves exact agreement. Expected time is O(a+b) and auxiliary space O(d), where a and b are code-point lengths and d is the number of distinct characters.`
                    ),
                    exercise(
                        `Intermediate: implement Two Sum from memory and explain why checking before insertion matters. Include a singleton and repeated values.`,
                        [
                            'The Map must contain only earlier positions.',
                            'An index of zero is valid; do not use its truthiness as a presence test.'
                        ],
                        `Use a Map from values to indexes. For each position i, compute target-values[i], check has, return the earlier index with i if found, and otherwise save values[i]→i. The complete implementation above follows this ordering. [3] with target 6 returns null; [3,3] returns [0,1]. Testing get as a boolean would miss index 0. Expected time is O(n), auxiliary space O(n), and no sorting or mutation is required.`
                    ),
                    exercise(
                        `Debugging: a cache stores item→0, missing→undefined, and enabled→false. Explain why get(key) || 99 and get(key) === undefined are unreliable presence tests.`,
                        [
                            'Separate a stored value from whether a key exists.',
                            'Nullish coalescing preserves zero and false but still replaces undefined.'
                        ],
                        `Logical OR replaces 0 and false with 99, changing meaningful values. An undefined result can mean either absent or explicitly stored undefined. Use has(key) to decide presence, then get(key) to retrieve the value. Use ?? only when the contract intentionally treats null and undefined as missing values. This distinction prevents subtle frequency, index-zero, and cache bugs even when a positive-count example appears to work.`
                    ),
                    exercise(
                        `Challenge: explain a 26-count Group Anagrams signature and when it is valid. Compare it with sorting and repeated pairwise comparisons.`,
                        [
                            'The signature needs unambiguous separators.',
                            'A fixed alphabet is a precondition, not an optimization you can assume for arbitrary text.'
                        ],
                        `For each validated lowercase ASCII word, allocate 26 zeros, increment the slot charCodeAt(0)-97 for each character, then join counts with commas. Equal count vectors mean exactly equal multisets. Separators prevent signatures such as [1,11] and [11,1] from colliding through naive concatenation. Processing is O(total characters + 26n), with signatures and groups using O(26n+n) storage apart from original strings. Sorting handles a broader character contract with O(m log m) per word; pairwise representative comparisons can require Θ(n²) checks. Mastery includes recognizing duplicate, frequency, complement, and first-occurrence language while still justifying the stored invariant.`
                    )
                ]
            }
        ]
    },
    3: {
        sections: [
            {
                id: 'w3-opposite-pointers-invariants',
                title: 'Two Pointers: make every discarded candidate safe',
                blocks: [
                    paragraph(
                        `Two pointers are two positions with a relationship, not a magic requirement to declare two variables. Opposite pointers fence in candidates from both ends. Reader/writer pointers separate processed input from compacted output. Slow/fast pointers compare progress at different speeds. The shared skill is giving every position a meaning and explaining why a move cannot lose an answer. If your explanation is only “this is the two-pointer pattern,” you have not yet established correctness. Start with a small brute-force solution, identify repeated work, then find the property that lets a boundary move permanently.`
                    ),
                    paragraph(
                        `For a sorted pair sum, brute force checks every pair of distinct positions. Sorted order lets us discard a whole family of pairs at once. If values[left] + values[right] is too small, then pairing the current left value with any smaller right value cannot reach the target either. Therefore left can advance safely. If the sum is too large, pairing the current right value with any larger left value cannot help, so right retreats. This proof depends on nondecreasing numeric order. Applying the same moves directly to unsorted input has no such guarantee.`
                    ),
                    code(`function hasPairWithSumBrute(values, target) {
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (values[i] + values[j] === target) return true;
    }
  }
  return false;
}
function hasPairWithSum(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    const sum = values[left] + values[right];
    if (sum === target) return true;
    if (sum < target) left += 1;
    else right -= 1;
  }
  return false;
}
console.log(hasPairWithSumBrute([1, 3, 4, 7], 10)); // true
console.log(hasPairWithSum([1, 3, 4, 7], 10)); // true
console.log(hasPairWithSum([2, 2], 4)); // true
console.log(hasPairWithSum([2], 4)); // false`),
                    diagram(`Sorted [1, 2, 4, 8], target 6
left right sum decision
0    3     9   too large: exclude pairs using index 3
0    2     5   too small: exclude pairs using index 0
1    2     6   found 2+4
Invariant: any still-possible pair lies within [left,right].
Progress measure: right-left strictly decreases after a mismatch.`),
                    paragraph(
                        `Each mismatch decreases the distance between pointers by one, so there are at most n-1 mismatches. Time is O(n), auxiliary space O(1), and empty or singleton arrays return false without reading a pair. The baseline requires Θ(n²) time when no pair exists. Use left < right because positions must be distinct: left <= right would allow a singleton 2 to satisfy target 4. Moving both pointers on a mismatch is unsafe because only one side was proved impossible. An equality branch must return or move deliberately; leaving both unchanged creates an infinite loop.`
                    ),
                    paragraph(
                        `If input is unsorted, ask whether sorting is allowed. A sorted copy costs O(n) copy space and typically O(n log n) time, which dominates the subsequent scan. If original indexes are required, sort value/index records or use the complement Map from week 2. If mutation is forbidden, do not sort the caller's array. “Closest pair” language also suggests inward pointers because sorted order lets you improve a candidate systematically, but the exact update and tie rules must match the requested result. Recognition is a clue to investigate, never permission to omit a proof.`
                    )
                ]
            },
            {
                id: 'w3-palindromes-reader-writer',
                title: 'Mirror checks and stable in-place compaction',
                blocks: [
                    paragraph(
                        `A palindrome reads the same from both ends. The baseline creates a reversed copy and compares it with the original; inward pointers instead compare mirrored positions directly. After a successful comparison, those outside positions are certified, so both boundaries can move. A mismatch proves failure immediately. Define the text contract: the following Valid Palindrome implementation ignores non-ASCII-alphanumeric characters and compares letters without case. It scans JavaScript code units, which is appropriate for this explicit ASCII contract. A full multilingual definition needs normalization and a deliberate code-point or grapheme strategy.`
                    ),
                    code(`function isPalindromeBrute(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}
function isPalindrome(text) {
  const isAlphaNumeric = char => /^[a-z0-9]$/i.test(char);
  let left = 0;
  let right = text.length - 1;
  while (left < right) {
    if (!isAlphaNumeric(text[left])) { left += 1; continue; }
    if (!isAlphaNumeric(text[right])) { right -= 1; continue; }
    if (text[left].toLowerCase() !== text[right].toLowerCase()) return false;
    left += 1;
    right -= 1;
  }
  return true;
}
console.log(isPalindromeBrute('A man, a plan, a canal: Panama')); // true
console.log(isPalindrome('A man, a plan, a canal: Panama')); // true
console.log(isPalindrome('race a car')); // false
console.log(isPalindrome('!!!')); // true`),
                    paragraph(
                        `Reader/writer pointers move in the same direction but serve different roles. The reader examines every input value. The writer marks where the next retained value belongs. Before each iteration, positions before writer contain exactly the retained values from the already read prefix, preserving their order. Writing at or behind the reader cannot destroy unread data. Write the current value first, then advance writer. The region after writer is not automatically meaningful output; return the valid length or truncate it, depending on the contract. Confusing physical array length with logical output length causes many otherwise correct solutions to fail.`
                    ),
                    code(`function removeSortedDuplicates(values) {
  let writer = 0;
  for (let reader = 0; reader < values.length; reader += 1) {
    if (writer === 0 || values[reader] !== values[writer - 1]) {
      values[writer] = values[reader];
      writer += 1;
    }
  }
  return writer;
}
function moveZeroes(values) {
  let writer = 0;
  for (let reader = 0; reader < values.length; reader += 1) {
    if (values[reader] !== 0) {
      values[writer] = values[reader];
      writer += 1;
    }
  }
  while (writer < values.length) {
    values[writer] = 0;
    writer += 1;
  }
  return values;
}
const sample = [1, 1, 2, 2, 3];
const retained = removeSortedDuplicates(sample);
console.log(sample.slice(0, retained)); // [1, 2, 3]
console.log(moveZeroes([0, 1, 0, 3, 12])); // [1, 3, 12, 0, 0]`),
                    diagram(`Move zeroes [0,1,0,3,12]
reader value writer-before retained prefix after processing
0      0     0             []
1      1     0             [1]
2      0     1             [1]
3      3     1             [1,3]
4      12    2             [1,3,12]
Fill positions 3 and 4 with zero only after all reads finish.`),
                    paragraph(
                        `The sorted-deduplication prerequisite matters: equal values must be adjacent so comparing with the last retained value is enough. On [1,2,1], this algorithm retains all three. Move Zeroes needs no sorting because the retention test is simply nonzero, and the writer preserves order among all survivors. A baseline that repeatedly splices a zero and appends it risks skipping shifted values and doing quadratic shifts; a filtered copy plus appended zeros is linear but uses linear extra storage. The displayed implementations read each position once and perform at most another n writes, so both use O(n) time and O(1) auxiliary space.`
                    )
                ]
            },
            {
                id: 'w3-slow-fast-three-sum-practice',
                title: 'Different speeds, 3Sum, and deliberate practice',
                blocks: [
                    paragraph(
                        `Slow/fast pointers measure structural progress. In a singly linked chain, advancing slow once and fast twice finds the middle or detects a cycle. This week uses the model to understand speeds; the later linked-list week develops rewiring. Compare node identities, not values: two different nodes may both store 7. If fast reaches null, the chain ends. If both pointers meet after advancing, a cycle exists. Inside a cycle of length c, fast gains one position relative to slow per round, so the relative gap eventually becomes zero within c rounds. Test after moving because both initially point at the head.`
                    ),
                    code(`function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
const a = { value: 1, next: null };
const b = { value: 2, next: null };
const c = { value: 3, next: null };
a.next = b;
b.next = c;
console.log(middleNode(a).value); // 2
console.log(hasCycle(a)); // false
c.next = b;
console.log(hasCycle(a)); // true`),
                    paragraph(
                        `The middle routine assumes an acyclic chain and returns the second middle for even lengths, because slow advances on each available two-step fast move. It returns null for an empty chain. Both routines use constant auxiliary space. Middle finding takes O(n) time; cycle detection takes O(p+c), where p is the prefix before the cycle and c is its length. A visited Set is a simpler baseline for cycle detection, but retains up to O(n) node identities. On an array, ordinary indexed traversal already knows its length; slow/fast is especially valuable when random access or length is unavailable.`
                    ),
                    paragraph(
                        `3Sum extends the sorted pair proof rather than introducing a different trick. Brute force chooses three distinct positions, requiring Θ(n³) checks. Sort a copy, fix one value, and search the suffix for the complementary pair using inward pointers. Skip repeated anchors and repeated pair values so each value triple appears once. Sorting changes positions, so this version returns value triples rather than original indexes. Under a usual comparison-sort model, O(n log n) preprocessing plus O(n) searches for O(n) anchors gives O(n²) time. Output may itself contain O(n²) triples; copying and sorting also consume memory.`
                    ),
                    code(`function threeSum(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length - 2; i += 1) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum < 0) left += 1;
      else if (sum > 0) right -= 1;
      else {
        result.push([sorted[i], sorted[left], sorted[right]]);
        left += 1;
        right -= 1;
        while (left < right && sorted[left] === sorted[left - 1]) left += 1;
        while (left < right && sorted[right] === sorted[right + 1]) right -= 1;
      }
    }
  }
  return result;
}
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [[-1,-1,2],[-1,0,1]]
console.log(threeSum([0, 0, 0, 0])); // [[0,0,0]]`),
                    exercise(
                        `Foundation: trace hasPairWithSum([1,2,4,8], 6) and justify each discarded endpoint. Why is sorted order necessary?`,
                        [
                            'For a sum that is too large, consider every possible partner of the right endpoint.',
                            'Use [3,2,4] with target 6 to challenge unsorted input.'
                        ],
                        `The sums are 9 at (0,3), 5 at (0,2), and 6 at (1,2). The first move removes 8 because even the smallest available partner makes the sum too large. The second removes 1 because even its largest remaining partner makes the sum too small. On unsorted [3,2,4], the same routine discards 4 after 3+4>6 and then discards 3 after 3+2<6, missing 2+4. Sorted order is the evidence supporting elimination.`
                    ),
                    exercise(
                        `Intermediate: explain why Move Zeroes must postpone filling zeros, and trace sorted deduplication on [2,2,2].`,
                        [
                            'A writer can lag behind the reader.',
                            'Only the prefix before the returned length is guaranteed.'
                        ],
                        `Filling the suffix before reading it could overwrite unread nonzero values. First compact all survivors, then fill the remaining positions. For [2,2,2], the first reader writes 2 at writer 0 and advances writer to 1; both later values equal the last retained 2 and are skipped. The function returns 1; the physical array may still contain three 2s, but only its first entry is logical output. Every write preserves the retained-prefix invariant.`
                    ),
                    exercise(
                        `Challenge: explain why 3Sum moves both pointers after equality but pair search moves only one on a mismatch. Include duplicate handling and complexity.`,
                        [
                            'After emitting a value triple, repeated equal pair values cannot produce a new value triple.',
                            'For a mismatch, only one endpoint has been ruled out.'
                        ],
                        `On equality, the current pair is already recorded. Moving inward and skipping equal values avoids emitting the same triple again; with a fixed anchor, the same left value needs the same right value to reach zero. On a mismatch, moving both would discard an endpoint not proved unusable and could skip a solution. Skipping repeated anchors removes duplicate searches. Each anchor's pointers traverse a suffix once, so the sum of suffix lengths is O(n²), with O(n) copied input plus engine sorting workspace and output storage. A complete explanation identifies preconditions, safe moves, a decreasing progress measure, and empty or duplicate-heavy edge cases.`
                    )
                ]
            }
        ]
    },
    4: {
        sections: [
            {
                id: 'w4-fixed-window-reuse',
                title: 'Sliding Window: reuse the overlap',
                blocks: [
                    paragraph(
                        `A sliding window is a contiguous range. Contiguous means no skipped positions: [2,3,4] can be a window inside [1,2,3,4,5], while [1,3,5] is a subsequence. Neighboring windows overlap heavily. Instead of rebuilding their state, remove the outgoing contribution and add the incoming contribution. This is useful for recent activity totals, moving averages, and substrings with local constraints. The main questions are what the range contains, what state summarizes it, and whether moving the left boundary can repair a violated constraint. A window is a range plus an invariant, not merely two indexes.`
                    ),
                    paragraph(
                        `For the maximum sum of exactly k consecutive values, brute force tries each start and sums k entries again. There are n-k+1 legal starts, so the cost is Θ((n-k+1)k), bounded by O(nk). With k near n/2 this is quadratic, but with k=n there is only one window, so it is linear. The optimized version sums the first window once, then subtracts one outgoing number and adds one incoming number per move. It handles negative values because fixed width, not a monotonic sum condition, determines every move.`
                    ),
                    code(`function maxFixedWindowSumBrute(values, k) {
  if (!Number.isInteger(k) || k <= 0 || k > values.length) return null;
  let best = -Infinity;
  for (let start = 0; start <= values.length - k; start += 1) {
    let sum = 0;
    for (let offset = 0; offset < k; offset += 1) sum += values[start + offset];
    best = Math.max(best, sum);
  }
  return best;
}
function maxFixedWindowSum(values, k) {
  if (!Number.isInteger(k) || k <= 0 || k > values.length) return null;
  let sum = 0;
  for (let i = 0; i < k; i += 1) sum += values[i];
  let best = sum;
  for (let right = k; right < values.length; right += 1) {
    sum += values[right] - values[right - k];
    best = Math.max(best, sum);
  }
  return best;
}
function maximumAverageSubarray(values, k) {
  const sum = maxFixedWindowSum(values, k);
  return sum === null ? null : sum / k;
}
console.log(maxFixedWindowSumBrute([2, 1, 5, 1, 3, 2], 3)); // 9
console.log(maxFixedWindowSum([2, 1, 5, 1, 3, 2], 3)); // 9
console.log(maximumAverageSubarray([1, 12, -5, -6, 50, 3], 4)); // 12.75
console.log(maxFixedWindowSum([-8, -3, -5], 2)); // -8`),
                    diagram(`Input [2,1,5,1,3,2], k=3
range   sum update
[0,2]   8   initial 2+1+5
[1,3]   7   8 - 2 + 1
[2,4]   9   7 - 1 + 3
[3,5]   6   9 - 5 + 2
Invariant after update: sum describes exactly [right-k+1,right].`),
                    paragraph(
                        `Initializing best to zero would invent an empty candidate and fail on all-negative input. Initialize from the first legal window instead. Invalid widths return null here, including zero, fractions, and widths larger than the array; state that convention before writing tests. Dividing the maximum sum by k gives the maximum average because k is a fixed positive constant for every candidate. The optimized method does k initial additions and n-k constant updates: Θ(n) time and O(1) auxiliary space. Returning an actual subarray would require tracking its start and allocating a copy only once, not slicing every candidate.`
                    )
                ]
            },
            {
                id: 'w4-variable-unique-frequency',
                title: 'Variable windows: expand, repair, record',
                blocks: [
                    paragraph(
                        `For Longest Substring Without Repeating Characters, the width is not known beforehand. A brute-force baseline starts at each position, grows a fresh Set, and stops at the first duplicate. Its worst case is Θ(n²) when all characters differ. The optimized window keeps the Set across starts. Add a candidate from the right; if it would repeat, remove characters from the left until the conflicting copy is gone. Then insert the candidate and record the valid length. The Set must match the actual window, so deletions and boundary moves are one logical operation.`
                    ),
                    code(`function longestUniqueRunBrute(text) {
  const chars = Array.from(text);
  let best = 0;
  for (let start = 0; start < chars.length; start += 1) {
    const seen = new Set();
    for (let end = start; end < chars.length; end += 1) {
      if (seen.has(chars[end])) break;
      seen.add(chars[end]);
      best = Math.max(best, end - start + 1);
    }
  }
  return best;
}
function longestUniqueRun(text) {
  const chars = Array.from(text);
  const seen = new Set();
  let left = 0;
  let best = 0;
  for (let right = 0; right < chars.length; right += 1) {
    while (seen.has(chars[right])) {
      seen.delete(chars[left]);
      left += 1;
    }
    seen.add(chars[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(longestUniqueRunBrute('abcabcbb')); // 3
console.log(longestUniqueRun('abcabcbb')); // 3
console.log(longestUniqueRun('aaaa')); // 1
console.log(longestUniqueRun('')); // 0`),
                    diagram(`Trace abba (inclusive boundaries)
right incoming repair                 valid window best
0     a        none                   a            1
1     b        none                   ab           2
2     b        remove a, then old b    b            2
3     a        none                   ba           2
One contraction at right=2 leaves b duplicated; use while, not if.`),
                    paragraph(
                        `The nested loops do not imply quadratic time. Right advances n times; left never retreats and advances at most n times. Each character enters and leaves the membership structure at most once, yielding expected O(n) table operations. The Set uses O(d) space for the maximum distinct window. This implementation also allocates Array.from(text), so total auxiliary space is O(n), not only O(d). It returns lengths in Unicode code points; the curriculum's indexed-string version uses UTF-16 code units and avoids that conversion. Be consistent about the unit when tracing emoji or reporting lengths.`
                    ),
                    paragraph(
                        `A Set is enough for uniqueness because the maintained valid window contains at most one of each character. For “at most k distinct,” multiplicity matters: removing one a from aa must not remove a as a distinct key yet. Use a frequency Map, decrement on removal, and delete the key only when its count reaches zero. Its size then equals the number of distinct characters currently present. After expansion, repeatedly shrink while size exceeds k; only then update the longest valid length. Removing characters cannot increase the distinct count, so contraction is guaranteed to repair this constraint.`
                    ),
                    code(`function longestAtMostKDistinct(text, k) {
  if (!Number.isInteger(k) || k < 0) return 0;
  const chars = Array.from(text);
  const counts = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < chars.length; right += 1) {
    const incoming = chars[right];
    counts.set(incoming, (counts.get(incoming) ?? 0) + 1);
    while (counts.size > k) {
      const outgoing = chars[left];
      const remaining = counts.get(outgoing) - 1;
      if (remaining === 0) counts.delete(outgoing);
      else counts.set(outgoing, remaining);
      left += 1;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(longestAtMostKDistinct('eceba', 2)); // 3
console.log(longestAtMostKDistinct('aa', 0)); // 0`),
                    paragraph(
                        `On eceba with k=2, e, ec, and ece remain valid, reaching length three. Adding b creates three distinct characters. Removing the first e leaves another e, so the map still has three keys; removing c deletes its key and restores validity with eb. This is why frequency tracking is more precise than simply deleting every outgoing character from a Set. Expected time is O(n), because both boundaries move only forward; Map state is O(min(n,k+1)) during expansion, while the code-point array still makes total extra storage O(n).`
                    )
                ]
            },
            {
                id: 'w4-minimum-window-practice',
                title: 'Minimum coverage, applicability, and progressive practice',
                blocks: [
                    paragraph(
                        `Minimum Window Substring reverses the recording rule. Given a source and target multiset, find the shortest source substring covering every target occurrence. Brute force enumerates starts and ends and checks coverage; rebuilding counts for every range can take cubic work, while extending counts from each start reduces it to quadratic expected work plus coverage checks. The optimized version expands until coverage holds, then records and shrinks while coverage remains valid. For a maximum valid window we repair invalidity before recording; for minimum coverage we exploit validity by shrinking until it breaks.`
                    ),
                    paragraph(
                        `Track need counts, current counts for needed characters, and missing, the total number of required occurrences not yet supplied. On insertion, decrease missing only if the previous count was below the required count. Extra copies do not satisfy extra requirements. On removal, increase missing only if the new count drops below need. This occurrence-based definition handles a target such as AABC, where a simple count of distinct matched letters would be misleading. The invariant is missing=0 exactly when the current window covers the target multiset. Ignore irrelevant characters in the map, but keep them in boundary positions because returned substrings must remain contiguous.`
                    ),
                    code(`function minimumWindowSubstring(source, target) {
  const chars = Array.from(source);
  const required = Array.from(target);
  if (required.length === 0) return '';
  const need = new Map();
  for (const char of required) need.set(char, (need.get(char) ?? 0) + 1);
  const counts = new Map();
  let missing = required.length;
  let left = 0;
  let bestStart = 0;
  let bestLength = Infinity;
  for (let right = 0; right < chars.length; right += 1) {
    const incoming = chars[right];
    if (need.has(incoming)) {
      const before = counts.get(incoming) ?? 0;
      if (before < need.get(incoming)) missing -= 1;
      counts.set(incoming, before + 1);
    }
    while (missing === 0) {
      const length = right - left + 1;
      if (length < bestLength) {
        bestLength = length;
        bestStart = left;
      }
      const outgoing = chars[left];
      left += 1;
      if (need.has(outgoing)) {
        const after = counts.get(outgoing) - 1;
        counts.set(outgoing, after);
        if (after < need.get(outgoing)) missing += 1;
      }
    }
  }
  return bestLength === Infinity ? '' :
    chars.slice(bestStart, bestStart + bestLength).join('');
}
console.log(minimumWindowSubstring('ADOBECODEBANC', 'ABC')); // 'BANC'
console.log(minimumWindowSubstring('AAAB', 'AAB')); // 'AAB'
console.log(minimumWindowSubstring('a', 'aa')); // ''`),
                    diagram(`Source ADOBECODEBANC, target ABC
right=5:  ADOBEC covers; record length 6, remove A -> missing A
right=10: DOBECODEBA covers; shrink through D,O,B,E
          CODEBA covers length 6; remove C -> missing C
right=12: ODEBANC covers; shrink O,D,E
          BANC covers length 4; remove B -> missing B
Best retained: BANC. Every removal advances left.`),
                    paragraph(
                        `Expected processing time is O(n+m), where n and m are source and target code-point lengths. Each boundary advances at most n times, and building need visits m characters. Construct the answer once at the end; copying every candidate substring would add repeated work. The maps store O(d) keys for distinct required characters, and the displayed code-point arrays plus returned text require O(n+m) total additional storage. The first minimum-length candidate is preserved on ties because the update uses a strict improvement. An empty target or impossible coverage returns the empty string under this contract.`
                    ),
                    paragraph(
                        `Window recognition words include contiguous, substring, subarray, longest, shortest, fixed width, at most k, and without repeating. Still test whether the constraint supports safe boundary movement. Fixed sums work with negatives because width determines the outgoing element. A variable shortest-sum window that shrinks whenever sum reaches a threshold generally needs nonnegative values: with [1,-1,5] and threshold 5, stopping contraction after removing 1 misses the shorter [5]. More advanced prefix-sum structures solve broader cases later. A subsequence problem permits gaps and therefore asks a different question. Always explain why the specific validity condition becomes better or worse under expansion and contraction.`
                    ),
                    exercise(
                        `Foundation: trace the fixed-width sums for [2,1,5,1,3,2], k=3. Explain initialization, all-negative input, and invalid k.`,
                        [
                            'Subtract the element at right-k.',
                            'Every legal candidate must contain exactly k entries.'
                        ],
                        `The sums are 8,7,9,6, so the answer is 9. Initialize best to the first legal sum, not zero; otherwise [-8,-3,-5] with k=2 incorrectly returns zero instead of -8. Reject nonpositive, noninteger, or oversized k with null in this API. Initialization takes k work, updates take n-k work, and only sum, best, and indexes are stored: Θ(n) time and O(1) auxiliary space. Maximum Average Subarray I divides the same maximum sum by the fixed width.`
                    ),
                    exercise(
                        `Intermediate: trace abca and abba for longest unique substring. Explain why one removal is insufficient and why left must advance inside contraction.`,
                        [
                            'For abca remove a; for abba remove both a and the old b.',
                            'State exactly which range the Set represents before inserting the new character.'
                        ],
                        `For abca, the best grows to abc of length 3; the last a removes the first a and creates bca, also length 3. For abba, adding the second b requires removing a and then the old b, leaving b; the final a forms ba. A single removal leaves the duplicate in place. Forgetting left += 1 repeatedly deletes the same outgoing value and may loop forever. Total removals remain linear because left never revisits an index. Empty input returns zero, and aaaa returns one.`
                    ),
                    exercise(
                        `Challenge: explain Minimum Window Substring for target AAB, including surplus copies. Then compare the recording rules for longest uniqueness and minimum coverage.`,
                        [
                            'Missing counts occurrences rather than distinct keys.',
                            'A third A is surplus until removal exposes a shortage.'
                        ],
                        `With source AAAB, the first two As reduce missing from 3 to 1; the third A leaves missing at 1 because two As already satisfy the requirement. B reduces missing to zero. AAAB is recorded; removing one A leaves two As and coverage valid, so AAB is recorded. Removing another A drops its count below two and ends contraction. For longest uniqueness, repair until valid and then record the widest valid window ending at right. For minimum coverage, record while valid and keep shrinking to find the narrowest valid window. Both proofs rely on monotonic boundaries and exact state updates, not the visual presence of nested loops. Before moving on, implement the fixed sum, unique run, and coverage routines from their invariants, then test empty input, repeated characters, impossible coverage, and boundaries of width one.`
                    )
                ]
            }
        ]
    }
};
