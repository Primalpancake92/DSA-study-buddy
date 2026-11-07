# Week 3 - Two Pointers
<!-- lesson-id:w3-section-chapter-introduction -->

This week, we will use two positions to avoid repeatedly searching or rebuilding the same information. Sometimes they start at opposite ends; sometimes one reads while the other writes; sometimes they travel through linked objects at different speeds. We call these positions pointers. The useful part is the relationship between them: we will explain what each position means and why moving it cannot lose a required answer.

We will begin with a sorted array and prove when an endpoint can be discarded from pair search. Then we will compare characters from opposite ends of a string, pack retained array entries together without overwriting unread values, and follow linked nodes at different speeds. Finally, we will reuse the pair-search proof inside 3Sum, where we need three values rather than two.

By the end, you should be able to choose a pointer relationship and state its preconditions, the facts that must hold before it can work correctly. You will trace boundary changes, justify the answers they rule out, and explain why the loop eventually stops. We will also decide when sorting beforehand is allowed and when it would break a requirement about original indexes or changing the caller's input.

Use the final checklist to update your progress logs after attempting the exercises. Its Theory, JavaScript, Practice, and Reflection categories cover both implementations and explanations. Aim to describe why a pointer moves without reading the code: that explanation is what lets you adapt the method when the next problem changes its return value or boundary rules.

## Learning Objectives
<!-- lesson-id:w3-section-learning-objectives -->

- Explain what inward, reader/writer, and slow/fast positions each represent before an iteration.
- Use sorted order to prove that discarding one endpoint cannot remove a valid pair.
- Compare characters at mirror positions while stating which characters we ignore and how we handle case.
- Pack retained entries into the front of an array without changing their relative order or destroying unread input.
- Explain why a returned count can describe the useful output even when the array's physical length stays unchanged.
- Find the middle of a linked chain and detect a loop by comparing particular node objects rather than just their values.
- Build 3Sum by fixing one value and searching for a pair, while preventing repeated value triples.
- Include preparation, scanning, returned results, and the engine's sorting workspace in your cost explanation.

## Prerequisite Knowledge
<!-- lesson-id:w3-section-prerequisite-knowledge -->

Revisit [Arrays](week-17.md) if references, changing an array in place, or numeric sorting need a refresher. [Hash Maps](week-02.md) gives another pair-search approach: remember earlier values and look up the needed complement. We will compare it with pointer search. Keep the cost of copying in mind: a copy protects the caller's array order, but storing that copy still takes memory.

In an array, a pointer here is just an integer index such as zero or three. In a linked chain, it is a reference identifying a node object. We are not calculating memory addresses manually. Each node holds a value and a `next` reference to the next node; null marks the end. Two nodes holding 7 are still different objects, just as two separate records can contain equal fields. That distinction will be essential for cycle detection.

Assume numeric values are finite and their sums are sufficiently exact for our comparisons. For palindromes, we explicitly restrict meaningful characters to ASCII letters and digits, called alphanumeric characters. The implementation is correct for that contract. Choosing input and text rules belongs to the solution itself because changing those rules can change both the answer and the appropriate implementation.

## Core Theory
<!-- lesson-id:w3-section-core-theory -->

### Two positions need a relationship

Two variables become a useful technique only when their movement has a reason. With inward pointers, the boundaries surround candidate positions that we have not ruled out. With reader/writer pointers, one position tracks input being examined while another marks where the useful output ends. With slow/fast pointers, different travel speeds reveal information about a linked structure whose length or loop shape we do not know beforehand. Each relationship needs its own explanation.

Before coding, ask what each position means at the start of an iteration. Then ask why the proposed move preserves the possible answers or required output. Finally, identify a quantity that keeps moving toward a stopping point. A fact preserved across iterations is an invariant; a quantity approaching the end establishes progress. Together they explain correctness and termination. Passing one example cannot replace either argument, because that example may simply avoid the branch containing a mistake.

### Opposite pointers use order as evidence

Suppose values are in nondecreasing numeric order: each value is at least as large as the one before it. We need two distinct positions adding to a target. Start with the smallest and largest values still under consideration. If their sum is too small, the left value cannot work with any available partner. We already tried its largest possible partner; choosing a smaller one cannot raise the sum. We can therefore discard the left endpoint safely.

If the sum is too large, reason from the other end. Even the smallest available partner makes the right value too large, so a larger partner cannot help. Discard the right endpoint. In either mismatch branch we have proved that one endpoint is unusable. We have not proved that both are unusable. Moving both after every mismatch can throw away a valid partner without evidence.

Our invariant is that every pair not yet excluded lies between the boundaries. It starts true because the boundaries include the whole array. Each justified move removes only impossible pairs, so it stays true. When the boundaries meet, there is only one position left, which cannot form a distinct-position pair. When a sum matches, we can return immediately for an existence task. A task asking for multiple answers would need an explicit rule for continuing and reporting them.

Try removing the sorted-order precondition. On `[3,2,4]` with target 6, inward search sees 7 and discards 4, then sees 5 and discards 3. It misses 2+4 because 3 was not the smallest available partner. The instructions executed correctly, but their justification did not apply. If sorting is permitted, a sorted copy restores the precondition at O(n log n) modeled time and O(n) copy space. If you need original indexes, keep value/index records together while sorting or use a complement Map.

### Mirror comparisons certify the outside

A palindrome reads the same from either end under the chosen character rules. Compare the outer meaningful characters: a mismatch disproves the palindrome, while a match lets us move inward. Before each comparison, all meaningful characters already passed have matched their mirror partners. An odd-length sequence leaves one center character that needs no separate partner. If there are no meaningful characters, there is no mismatching pair, so the empty meaningful sequence is a palindrome too.

Before comparing text, decide how to standardize it, a process called normalization. Our Valid Palindrome routine ignores everything except ASCII letters and digits, then compares letters without case. It skips unwanted code units—the units accessed by JavaScript string indexes—without constructing a cleaned copy. This is a deliberately limited text contract. A broader multilingual definition would need decisions about Unicode normalization, combining marks that attach to other characters, and grapheme clusters, the groups of code points people perceive as one character.

### Reader and writer protect the unread suffix

Filtering means retaining entries that satisfy a rule. Stable filtering additionally preserves their original relative order. Let the reader examine each original entry, and let the writer point to the next slot available for a retained value. Before reading position r, the prefix before writer contains exactly the retained entries from positions before r, in their original order. Writer never exceeds reader. We can therefore write a survivor at writer without destroying any input we have not examined yet.

To remove duplicates from sorted input, retain a value only when it differs from the last retained value. Equal values are adjacent, so that one comparison is enough. On unsorted `[1,2,1]`, the last retained entry before the final 1 is 2; the rule would retain the duplicate 1. Move Zeroes uses a different rule: retain every nonzero value. It needs no sorted order. Both use compaction, meaning we pack the retained values together using the same safe reader/writer relationship.

Now decide what the remaining suffix—the part after the retained prefix—means. Sorted deduplication commonly returns a count and promises only that many useful front entries. The later slots are unspecified. Move Zeroes must keep the physical length and fill those later slots with zeros after all reads finish. A truncating filter instead shortens the array to the retained count. These are different output contracts; callers cannot assume one merely because the loops look alike.

### Slow and fast measure structural progress

A singly linked chain lets us follow only the next link from each node. If it is acyclic, meaning it never loops back, move slow one link and fast two links per round. When fast reaches the end, slow has traveled about half the distance. Our loop convention selects the second of the two middle nodes for even lengths. Say that choice explicitly: “the middle” alone does not distinguish those two valid conventions.

A cycle is a sequence of links that returns to a node already visited. A baseline stores visited node references in a Set; reaching the same object again proves a cycle. Slow/fast pointers avoid storing that history. Once both are inside a cycle of length c, fast gains one position on slow per round. Measured around the loop, or modulo c, their relative gap must reach zero within c rounds. Compare after moving. Both pointers begin at the head even in a normal chain, so their initial equality proves nothing.

If p nodes precede a cycle of length c, slow/fast detection uses O(p+c) steps and O(1) auxiliary space. Getting into the cycle and meeting within it account for those two lengths. Compare node identities, because repeated values do not prove repeated reachability of the same object. Also keep the routines' preconditions separate: middle-finding assumes an acyclic chain and may keep running on a cycle.

### 3Sum reuses the pair proof

A brute-force 3Sum solution tries combinations of three distinct positions, giving Θ(n³) combinations in the worst case. After sorting, choose one position as a fixed anchor and search only the later suffix for the remaining pair. If the anchor's value is a, those two values must sum to −a. The suffix remains sorted, so our endpoint-elimination proof still applies. We are reusing an established argument inside another loop.

The requested answers are unique **value triples**, not every triple of indexes. Two different index combinations may produce the same three values and should be reported only once. Skip repeated anchor values because they restart the same value search. After a match, move both pointers inward and skip copies of the pair values just used. For a fixed anchor and left value, only one right value can complete the sum, so repeating those values cannot add a new value triple.

## JavaScript Implementations
<!-- lesson-id:w3-section-javascript-implementations -->

### Sorted pair search and a baseline

Let's compare a baseline that tries pairs with an inward search. Both answer only whether a pair exists, so they return true or false and must use distinct positions. The baseline accepts unsorted input; the inward search requires sorted values. With fewer than two entries, neither loop can form a pair, so empty and singleton inputs return false naturally.

### Demonstration 1 — Compare all-pairs search with sorted endpoint elimination

```javascript
function hasPairBrute(values, target) {
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
console.log(hasPairBrute([1, 2, 4, 8], 6));
console.log(hasPairWithSum([1, 2, 4, 8], 6));
console.log(hasPairWithSum([2, 2], 4));
console.log(hasPairWithSum([2], 4));
console.log(hasPairWithSum([], 4));
console.log(hasPairWithSum([1, 3, 9], 8));
```
```output
true
true
true
false
false
false
```

In **Demonstration 1**, `[1, 2, 4, 8]` with target 6 starts with sum 9, so `right` moves past 8. Sum 5 then moves `left` past 1, and 2+4 succeeds. `left < right` allows two equal values in `[2, 2]` but prevents using the only position in `[2]` twice. Notice that a mismatch moves exactly one endpoint, the one the sorted-order argument excludes.

### Two Sum II: preserve the proof, adapt the answer

Two Sum II gives us sorted input but asks for positions counted from one and requires constant extra space. We can reuse the movement proof from boolean pair search and change only the successful return. Keep JavaScript's zero-based indexes while accessing the array, then add one when building the answer. We need neither another sort nor a Map; the latter would spend memory that this contract asks us to avoid.

### Demonstration 2 — Return one-based positions for Two Sum II

```javascript
function twoSumSorted(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    const sum = values[left] + values[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left += 1;
    else right -= 1;
  }
  return null;
}
console.log(JSON.stringify(twoSumSorted([1, 2, 4, 8], 6)));
console.log(JSON.stringify(twoSumSorted([2, 2], 4)));
console.log(JSON.stringify(twoSumSorted([2], 4)));
```
```output
[2,3]
[1,2]
null
```

In **Demonstration 2**, `[1,2,4,8]` again produces sums 9, 5, and 6. The successful internal indexes are 1 and 2, so `[left + 1, right + 1]` returns `[2,3]`. Returning `[1,2]` would give the wrong one-based answer despite a correct search. Our local function returns null when no solution exists; the external task guarantees one. Each mismatch shortens the interval, giving O(n) worst-case time. Working indexes and a two-element answer require O(1) space.

### Valid Palindrome without building the reverse

We will compare a baseline that creates cleaned and reversed strings with a scan that checks one code unit at a time. In the scan, ignoring punctuation must also move its boundary. Otherwise the next iteration would inspect exactly the same punctuation forever. Our return contract treats empty meaningful input as a palindrome.

### Demonstration 3 — Check ASCII palindromes while skipping punctuation

```javascript
function palindromeBrute(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}
function isPalindrome(text) {
  const allowed = char => /^[a-z0-9]$/i.test(char);
  let left = 0;
  let right = text.length - 1;
  while (left < right) {
    if (!allowed(text[left])) { left += 1; continue; }
    if (!allowed(text[right])) { right -= 1; continue; }
    if (text[left].toLowerCase() !== text[right].toLowerCase()) return false;
    left += 1;
    right -= 1;
  }
  return true;
}
console.log(palindromeBrute('Never odd or even'));
console.log(isPalindrome('Never odd or even'));
console.log(isPalindrome('race a car'));
console.log(isPalindrome('!!!'));
console.log(isPalindrome(''));
console.log(isPalindrome('0P'));
```
```output
true
true
false
true
true
false
```

In **Demonstration 3**, `'Never odd or even'` matches from its meaningful outer letters inward. When a boundary reaches a space, the corresponding skip advances it and `continue` begins the next check. For `'0P'`, both code units are allowed but their lowercase forms differ, so we return false immediately. For `'!!!'`, skips consume the range without finding a mismatching meaningful pair, which correctly returns true under the stated contract.

### Stable compaction and logical output length

Watch the write before the writer increment: writer marks the next available slot, not the last occupied one. Sorted deduplication returns a useful prefix length. Move Zeroes returns its mutated input array so we can display it conveniently. Neither function allocates another array internally. The `slice` call in the logging creates a display copy outside the algorithm, so it does not belong to the function's working-space claim.

### Demonstration 4 — Compact survivors and distinguish length contracts

```javascript
function removeSortedDuplicates(values) {
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
const sorted = [1, 1, 2, 2, 3];
const length = removeSortedDuplicates(sorted);
console.log(length, JSON.stringify(sorted.slice(0, length)));
console.log(sorted.length);
console.log(JSON.stringify(moveZeroes([0, 1, 0, 3, 12])));
console.log(JSON.stringify(moveZeroes([0, 0])));
console.log(removeSortedDuplicates([]));
```
```output
3 [1,2,3]
5
[1,3,12,0,0]
[0,0]
0
```

In **Demonstration 4**, `[1, 1, 2, 2, 3]` retains 1, skips its copy, writes 2 into slot 1, skips its copy, and writes 3 into slot 2. The returned length is three even though `sorted.length` stays five. For `[0, 1, 0, 3, 12]`, the nonzero entries are written as 1,3,12 before the final loop fills the last two slots with zeros. Delaying those fills protects values the reader has not reached.

### Node identity, the middle, and cycles

We will construct the whole linked chain here, so you can run this example independently. Two nodes deliberately contain 7 to expose the difference between value equality and identity. We find the middle while the chain still ends at null, then add a cycle and test detection. Calling middle-finding after that change would break its acyclic-input precondition.

### Demonstration 5 — Find the middle and detect repeated node identities

```javascript
function hasCycleWithSet(head) {
  const seen = new Set();
  for (let node = head; node !== null; node = node.next) {
    if (seen.has(node)) return true;
    seen.add(node);
  }
  return false;
}
function hasCycle(head) {
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
const a = { value: 7, next: null };
const b = { value: 7, next: null };
const c = { value: 9, next: null };
const d = { value: 10, next: null };
a.next = b; b.next = c; c.next = d;
console.log(middleNode(a) === c);
console.log(hasCycle(a), hasCycleWithSet(a));
d.next = b;
console.log(hasCycle(a), hasCycleWithSet(a));
console.log(hasCycle(null), middleNode(null));
const self = { value: 1, next: null };
self.next = self;
console.log(hasCycle(self));
```
```output
true
false false
true true
false null
true
```

In **Demonstration 5**, a→b→c→d→null has four nodes. Two rounds move slow to c and fast to null, so c is the second middle. Although a and b both store 7, neither cycle checker confuses their identities. Assigning `d.next = b` changes the chain into a loop, and both detectors return true. The `fast !== null && fast.next !== null` guard makes taking two links safe. The null and self-loop calls then check the smallest boundary cases.

### 3Sum with unique value triples

We will sort a copy to protect the caller's order. The anchor comes before left, and left stays before right, ensuring three distinct positions. After a match, extra loops skip equal pair values. Those loops still move boundaries only inward—movement in one direction is called monotone movement—so they do not create another full independent factor of n.

### Demonstration 6 — Reuse sorted pair search to emit unique 3Sum triples

```javascript
function threeSum(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const result = [];
  for (let anchor = 0; anchor < sorted.length - 2; anchor += 1) {
    if (anchor > 0 && sorted[anchor] === sorted[anchor - 1]) continue;
    let left = anchor + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[anchor] + sorted[left] + sorted[right];
      if (sum < 0) left += 1;
      else if (sum > 0) right -= 1;
      else {
        result.push([sorted[anchor], sorted[left], sorted[right]]);
        left += 1;
        right -= 1;
        while (left < right && sorted[left] === sorted[left - 1]) left += 1;
        while (left < right && sorted[right] === sorted[right + 1]) right -= 1;
      }
    }
  }
  return result;
}
const input = [-1, 0, 1, 2, -1, -4];
console.log(JSON.stringify(threeSum(input)));
console.log(JSON.stringify(input));
console.log(JSON.stringify(threeSum([0, 0, 0, 0])));
console.log(JSON.stringify(threeSum([1, 2])));
```
```output
[[-1,-1,2],[-1,0,1]]
[-1,0,1,2,-1,-4]
[[0,0,0]]
[]
```

In **Demonstration 6**, the input sorts to `[-4,-1,-1,0,1,2]`. At anchor −1, the first matching pair is −1 and 2; after moving inward, 0 and 1 give the second match. The next anchor equals the previous −1 and is skipped. On `[0, 0, 0, 0]`, several index triples exist, but the duplicate checks emit `[0,0,0]` only once. Logging `input` afterward confirms that copying before sorting preserved its order.

## Worked Examples
<!-- lesson-id:w3-section-worked-examples -->

### Example 1: prove each discarded endpoint

Write the remaining candidates for `[1,2,4,8]`, target 6. Initially 1+8 gives 9. Since 1 is the smallest possible partner for 8 and already makes the sum too large, every pair involving 8 fails. Remove 8. Next, 1+4 gives 5. Since 4 is now the largest partner available to 1, every remaining pair involving 1 is too small. Remove 1. The surviving endpoints are 2 and 4, which give 6.

Notice what the explanation establishes beyond a movement recipe. Each move excludes a whole family of pairs, and sorted order is the evidence covering every member of that family. Equal values do not imply equal positions: `[2,2]` can meet target 4 using its two indexes, whereas `[2]` cannot. Keep the distinct-position requirement separate from the value comparison.

### Example 2: skip punctuation while preserving mirror alignment

Take `A,b:a`. The outer A and a match after converting case, so move both boundaries inward. Now the boundaries reach punctuation: the comma on the left and colon on the right must each be skipped. After both skips, the boundaries meet at b. That center character needs no partner, so we return true. The important trace records skips as movements too, not just successful letter comparisons.

Skipping does not match punctuation with some letter. It removes a character that our contract says to ignore. For `0P`, both characters are meaningful, and 0 differs from p, so the answer is false. Punctuation-only input has no meaningful pair to fail. Saying its comparisons are vacuously satisfied simply means there were no required comparisons that contradicted the condition.

### Example 3: a retained prefix is not the entire array

Trace the reader and writer separately on `[1,1,2,2,3]`. The first 1 goes to position 0; writer advances to 1. The next 1 matches the last retained value and causes no write. The first 2 goes to position 1; writer advances to 2. Its repeated copy is skipped. Finally 3 goes to position 2, leaving writer at 3. The reader visited five input positions, while writer advanced only for the three survivors.

The logical answer—the part the function promises callers may use—is `[1,2,3]`. Physical storage can still contain `[1,2,3,2,3]`. The last two slots are unspecified under this contract, so reading all five as the answer is a caller error even when compaction worked correctly. Shortening the array is a separate operation. Only do it if the problem permits or requests that different behavior.

### Example 4: delay filling zeros until input is consumed

On `[0,1,0,3,12]`, reader starts at a zero, so writer stays at 0. Reader 1 finds a survivor and copies 1 to slot 0. Reader 2 skips another zero. Reader 3 copies 3 to slot 1, and reader 4 copies 12 to slot 2. At this point every original value has been examined. We can now fill slots 3 and 4 with zeros without destroying future input.

If we filled the suffix earlier, it could contain a nonzero entry the reader still needed. Delaying the fill is therefore a correctness requirement. The survivor order remains 1,3,12 because the reader encounters those values in that order and writer advances once per survivor. This directly proves stability; we do not need to reason about sorting or a sequence of swaps.

### Example 5: relative speed in a cycle

Draw distinct nodes A→B→C→D→B and start both references at A. Round one puts slow at B and fast at C. Round two puts slow at C and fast at B. Round three puts both at D. They meet because links let them revisit node identities, regardless of stored values. Now change the final link to null. In A→B→C→D→null, two rounds put fast at null and slow at C, giving the second middle instead of a cycle.

The cycle has three nodes. Once both pointers are inside it, fast gains one relative position each round, so every possible gap is eventually closed. Changing the entry point or starting gap changes when they meet, not whether they meet. The memory saving comes from retaining only the two current references. The Set baseline reaches the same conclusion by retaining every identity encountered.

### Example 6: lift pair search into 3Sum

Start by sorting `[-1,0,1,2,-1,-4]` into `[-4,-1,-1,0,1,2]`. With −4 fixed, no suffix pair reaches the needed sum 4. Move to anchor −1 at index 1. Its endpoints −1 and 2 complete zero, so record `[-1,-1,2]`. Moving inward exposes 0 and 1, producing `[-1,0,1]`. The next anchor is also −1, so skip it rather than repeat an equivalent value search.

Without anchor skipping, another occurrence of −1 could rediscover the second value triple. The all-zero case makes this especially clear. On `[0,0,0,0]`, the first anchor emits one zero triple, repeated pair values are skipped, and the next equal anchor is skipped as well. Several choices of three indexes exist, but they all represent the single required value triple `[0,0,0]`.

## Visual Explanations
<!-- lesson-id:w3-section-visual-explanations -->

```text
Opposite pointers:
excluded | left ... possible pairs ... right | excluded
          move left OR right after a mismatch

Reader/writer:
retained prefix | processed leftovers | unread suffix
0 ........ w-1   w ............. r-1   r ........ n-1
writer <= reader keeps writes out of unread input

Slow/fast:
A -> B -> C -> D -> null
round 0: slow=A, fast=A
round 1: slow=B, fast=C
round 2: slow=C, fast=null
```

Read each diagram with its own meaning for position. The inward pair surrounds a candidate region. Reader/writer positions separate meaningful output, processed leftovers, and unread input. Slow/fast positions describe travel through links. They all use two pointers, but that shared name does not make their movement rules interchangeable. Before borrowing a loop structure, check that its invariant matches what your positions represent.

| Reader | Input value | Writer before | Retained prefix afterward |
| --- | --- | --- | --- |
| 0 | 0 | 0 | empty |
| 1 | 1 | 0 | 1 |
| 2 | 0 | 1 | 1 |
| 3 | 3 | 1 | 1, 3 |
| 4 | 12 | 2 | 1, 3, 12 |

## Complexity Analysis
<!-- lesson-id:w3-section-complexity-analysis -->

Count movement rather than all pairs the search could theoretically form. Each mismatch decreases `right − left`, allowing at most n−1 reductions. Thus inward pair search has Θ(n) worst-case traversal and O(1) auxiliary state, compared with Θ(n²) worst-case pair checks in the baseline. These are bounds on worst-case functions; Big O and Theta do not themselves select the case. If input needs sorting first, the full algorithm costs O(n log n) under the usual sort model even though its final scan is linear.

For palindrome checking, charge work to the characters the boundaries pass. Together the boundaries make at most n inward advances, and ASCII classification has constant cost, giving Θ(n) worst-case time and O(1) auxiliary space. The cleaned-and-reversed baseline is linear too, but allocates O(n) representations. Our space saving relies on inspecting the original string directly. Converting it to a code-point array first would introduce linear storage and change that claim.

Compaction reads n positions and writes no more than n survivors. Move Zeroes then fills at most n suffix slots. Adding those passes still gives Θ(n), because the second pass does not restart for every input entry. Both functions use O(1) working memory. A filter that creates a new array also takes linear time but needs O(n) output storage. Repeated `splice` deletions can instead move a long suffix over and over and become quadratic.

| Task | Time under stated model | Additional space |
| --- | --- | --- |
| Sorted pair search | O(n) | O(1) |
| ASCII palindrome scan | O(n) | O(1) |
| Sorted deduplication / Move Zeroes | Θ(n) | O(1) |
| Acyclic middle | O(n) | O(1) |
| Cycle detection with Set | Expected O(p+c), or O(n) acyclic | O(p+c), or O(n) |
| Slow/fast cycle detection | O(p+c), or O(n) acyclic | O(1) |
| Brute-force triple enumeration | Θ(n³) candidate checks | Depends on collected output |
| 3Sum with sorting and pointers | O(n²) after O(n log n) modeled sorting | O(n) copy + sort workspace + output |

For 3Sum, each anchor causes one inward traversal of its suffix. Adding those decreasing suffix lengths gives O(n²) work. The answer itself may contain O(n²) unique triples, so collecting all of them cannot be described as constant-space. JavaScript also leaves sorting workspace to the engine. Report the O(n) copied input, sort workspace, and returned triples separately. The constant number of pointer variables describes only part of this implementation's storage.

## Common Mistakes
<!-- lesson-id:w3-section-common-mistakes -->

Check both correctness and progress in every branch. If equality neither returns nor moves a pointer, the loop can run forever. If the condition is `left <= right`, a pair search may reuse one position. If both pointers move after every mismatch, one endpoint is discarded without proof. The deliberately broken routine here shows that last error: one input happens to work, while another loses the valid 2+4 pair.

### Demonstration 1 — Broken pair search moves both endpoints without justification

```javascript-bug
function brokenPair(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    if (values[left] + values[right] === target) return true;
    left += 1;
    right -= 1;
  }
  return false;
}
console.log(brokenPair([1, 2, 4, 8], 6));
console.log(brokenPair([1, 2, 4, 8, 16], 6));
```

In **Demonstration 1**, the first input prints `true` because moving both endpoints happens to land on 2 and 4. The second prints `false`. Starting with `[1, 2, 4, 8, 16]`, the oversized sums justify discarding 16 and later 8, but the simultaneous left moves discard 1 and then 2. The required pair is gone before it can be tested.

This pair of results is a useful testing lesson. A successful trace shows that a routine works on that trace; it does not establish the movement rule for all sorted inputs. Repair the branch by moving only the endpoint excluded by the sum comparison, then explain why the other endpoint still deserves consideration. That explanation rules out the bug more reliably than collecting more lucky examples.

Other variants have different traps. Advancing writer before writing skips its intended first slot. Comparing node values can falsely report a cycle when distinct nodes repeat data, while checking the pointers' initial equality labels every nonempty chain cyclic. In 3Sum, omitting the numeric comparator gives text order, and forgetting duplicate suppression repeats value triples. Restate the relevant invariant before adding a conditional: the repair should restore the meaning of the state, not merely conceal one failing output.

## Interview and LeetCode Pattern Recognition
<!-- lesson-id:w3-section-interview-and-leetcode-pattern-recognition -->

Phrases such as “sorted pair,” “closest sum,” and “compare both ends” make inward pointers worth investigating. Check the input order and requested answer before committing. A closest-sum task needs a remembered best answer and a tie rule beyond our existence routine. “In place” with “preserve relative order” suggests reader/writer compaction. For a linked chain, “middle” or “cycle” suggests comparing different travel speeds. These clues start an argument; they do not complete one.

For original pair indexes in unsorted data, consider the Map solution from [Week 2](week-02.md). Sorting can cost more than the eventual scan and changes positional meaning unless original indexes travel alongside values. Explain that trade-off before choosing your method. For 3Sum, we return value triples instead, so sorting a copy naturally supports the proof while preserving the caller's input order.

A reader/writer prefix may gather survivors that were separated in the original input. A sliding window must describe consecutive original positions, called a contiguous interval. Both approaches move boundaries, but they preserve different things. In [Week 4](week-04.md), we will track that contiguous range and its summary state rather than a newly packed output prefix.

## Practice Exercises
<!-- lesson-id:w3-section-practice-exercises -->

### Conceptual

1. Explain why a too-small pair sum rules out left and a too-large one rules out right. Prove each claim, then give an unsorted input where the reasoning fails.
2. Explain which comparison in sorted deduplication relies on ordering and why Move Zeroes does not need it. Define stability in terms of the survivors' original order.
3. Justify identity comparison in cycle detection, explain why checking occurs after movement, and show why fast gains one position relative to slow per cycle round.

### Tracing

4. Work through pair search on `[1,2,4,8]` with target 6 and `[2,2]` with target 4. For every move, name the family of pairs you excluded.
5. Record both boundaries on `A,b:a`. Include punctuation skips as well as meaningful comparisons so every change has an explanation.
6. Trace deduplication on `[2,2,2]` and Move Zeroes on `[0,4,0,5]`. State the returned logical answer separately from the array's physical contents and length.
7. Write each slow/fast round for A→B→C→D→B. Then trace `[0,0,0,0]` through 3Sum and show why multiple index choices produce only one output triple.

### Debugging

8. Repair **Demonstration 1** in **Common Mistakes** by restoring justified endpoint movement. Find a singleton input that exposes a separate implementation using `left <= right`.
9. Suppose Move Zeroes fills every position after writer with zero during each reader iteration. Construct a small input and explain exactly which unread value is erased.
10. A cycle checker compares `slow.value === fast.value`. Build an acyclic chain that makes it report a cycle, then repair the comparison and explain the required identity rule.

### Implementation

11. Write sorted pair search and ASCII Valid Palindrome from their invariant statements. Cover empty input, singletons, duplicate values, punctuation-only strings, and searches without answers.
12. Build an in-place negative-removal filter that preserves survivor order. Return a logical prefix length and leave the physical array length unchanged.
13. Write middleNode and hasCycle along with the nodes needed to run them independently. Test odd and even lengths, null, a self-loop, and a tail pointing back into the middle.
14. Implement 3Sum while protecting the input from mutation. Explain every duplicate-skipping rule and compare with triple enumeration on small arrays of finite integers.

### External

The upstream assignment includes Valid Palindrome, Remove Duplicates from Sorted Array, Two Sum II, and 3Sum. Move Zeroes remains supporting practice from the local textbook. As you work, adapt the return contract as carefully as the pointer movement; several tasks share a loop shape while expecting different answers.

15. [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** inward pointers, text normalization, and boundary skips. **Relevance:** state the character-comparison contract and show why ignoring a character still makes progress toward termination.
16. [Move Zeroes](https://leetcode.com/problems/move-zeroes/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** stable compaction, changing the original array, and reader/writer invariants. **Relevance:** explain why each write is safe and how survivor order is preserved without allocating a replacement array.
17. [3Sum](https://leetcode.com/problems/3sum/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** numeric sorting, fixing an anchor for pair search, and skipping repeated values. **Relevance:** combine the pair-search proof with an outer choice and explain why your output contains each value triple only once.

18. [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) — **Platform:** LeetCode. **Difficulty:** Easy. **Concepts:** reader/writer compaction, adjacent equal values, and a logical output prefix. **Relevance:** apply the contract of `removeSortedDuplicates`: trace `[1,1,2]`, return the survivor count, and explain why slots beyond that count are outside the promised answer.
19. [Two Sum II — Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) — **Platform:** LeetCode. **Difficulty:** Medium. **Concepts:** opposite endpoints, elimination justified by order, and one-based positions. **Relevance:** adapt the pair proof to an index-returning interface using constant space. Explain why adding one happens only when returning and why one singleton position cannot serve as both members of the pair.

## Hints and Worked Solutions
<!-- lesson-id:w3-section-hints-and-worked-solutions -->

### Hints

For 1–3, describe which candidates a move eliminates and why; merely naming “two pointers” does not establish safety. For 4–7, record the initial state and every subsequent movement. For 8–10, reduce the failing input until the broken assumption is obvious. For 11–17, begin with the contracts in JavaScript Implementations, close the finished solutions, and derive the loops from the invariant statements. Then compare your explanation as well as your output.

### Solutions 1–7

For question 1, a too-small sum excludes left because no other available partner exceeds right. A too-large sum excludes right because no other partner is smaller than left. `[3,2,4]` with target 6 breaks those claims because it is unsorted. For question 2, adjacent equal values make sorted deduplication's last-retained comparison sufficient. Move Zeroes checks each value independently and needs no ordering. Stable output means survivors keep the order they had relative to one another in the input.

For question 3, matching references identify the same revisited node, whereas matching values show only repeated data. Both pointers initially identify the head whether or not a cycle exists, so only compare after moving. Inside the cycle, fast travels two edges for slow's one. Their relative position therefore changes by one modulo cycle length—the distance measured with wraparound—which ensures a meeting.

For questions 4–7, pair sums are 9, then 5, then 6; `[2,2]` succeeds immediately. On `A,b:a`, compare A/a, skip the punctuation at both boundaries, and finish at b. The implementation checks the left comma before the right colon; either conceptual skip order reaches the same center. Deduplicating `[2,2,2]` returns 1 with only the first slot meaningful. Move Zeroes changes `[0,4,0,5]` into `[4,5,0,0]`. Cycle rounds give `(B,C)`, `(C,B)`, then `(D,D)`. With four zeros, duplicate skipping leaves one value triple `[0,0,0]`.

### Solutions 8–10: repair the violated proof

**Demonstration 1** in **JavaScript Implementations** repairs pair search by moving only the endpoint proved impossible. A separate `left <= right` bug lets `[2]` incorrectly satisfy target 4 using one position twice. For early zero filling, use `[0,4]`: filling from writer 0 after reading the initial zero erases 4 before the reader sees it. The suffix fill must wait until all reads finish.

For the identity bug, construct three separate nodes holding 7 and end the chain at null. After one round, slow reaches the second node and fast reaches the third. Their values match, but their identities do not. Comparing values falsely reports a cycle. Reference comparison lets the loop continue until its guard reaches the end and correctly reports no cycle.

### Solution 12: a logical-prefix filter

Let's implement the negative-removal variation with an explicit logical-prefix contract. The returned count identifies how many front entries are valid. Physical length stays unchanged, and we promise nothing about the remaining suffix. The second log checks the array's length, helping you separate storage size from the useful answer.

### Demonstration 1 — Retain nonnegative values without truncating storage

```javascript
function retainNonnegative(values) {
  let writer = 0;
  for (let reader = 0; reader < values.length; reader += 1) {
    if (values[reader] >= 0) {
      values[writer] = values[reader];
      writer += 1;
    }
  }
  return writer;
}
const values = [-2, 4, -1, 0, 5];
const length = retainNonnegative(values);
console.log(length, JSON.stringify(values.slice(0, length)));
console.log(values.length);
console.log(retainNonnegative([-1, -2]));
```
```output
3 [4,0,5]
5
0
```

In **Demonstration 1**, `[-2, 4, -1, 0, 5]` skips −2, writes 4 at slot 0, skips −1, then writes 0 and 5 at slots 1 and 2. Writer finishes at three while physical length stays five. Each input is examined once and each survivor written once, giving Θ(n) time and O(1) working space. The logging slice allocates a display array outside the function; a caller can instead read only the returned prefix directly.

### Solutions 11, 13–17: what a complete answer must establish

Refer to **Demonstrations 1, 3, 5, and 6** in **JavaScript Implementations** for the complete pair, palindrome, linked-chain, and 3Sum solutions. Explain why the pair needs sortedness and distinct positions, and specify which characters palindrome checking ignores. Middle-finding assumes no cycle and chooses the second middle for even lengths. Cycle detection must handle null and a self-loop while guarding access through null. A complete answer establishes these contracts rather than only reproducing the displayed outputs.

To check 3Sum independently, enumerate `i < j < k`, put each matching value triple into a standard order, and compare unique triple collections rather than discovery order. The optimized result uses distinct positions and sums to zero. Repeated anchors and repeated pair values cannot add a new value triple, which justifies skipping them. Report the copied array and potentially quadratic output alongside O(n²) traversal. Learners may make their own external submissions; local examples do not establish judge acceptance.

### Solutions 18–19: match the caller's contract

For sorted deduplication, **Demonstration 4** in **JavaScript Implementations** returns 2 on `[1,1,2]` and guarantees prefix `[1,2]`. Later positions are unspecified. Returning that count and letting the caller read only the promised prefix is part of correctness, not display formatting. Each original position is read once, and writer never overtakes reader, giving Θ(n) time and O(1) auxiliary space.

For Two Sum II, **Demonstration 2** in **JavaScript Implementations** supplies the solution. `[1,2,4,8]` with target 6 matches internal zero-based positions `(1,2)`, returned as `[2,3]`. The strict boundary condition prevents using one position twice. Sorted order justifies every discard, and each mismatch shortens the interval, establishing O(n) time and O(1) space. A Map is useful for the related unsorted task, but exceeds this task's constant-space requirement.

## Sources and Further Reading
<!-- lesson-id:w3-section-sources-and-further-reading -->

The [curriculum](../../shared/curriculum.js) and [Weeks 1–4 textbook](../../shared/textbook/weeks01to04.js) define the chapter's scope and preconditions. The teaching develops those into pointer proofs, traces, runnable node fixtures, and exercises. The references retain the original preparation history; this prose rewrite did not revisit the external pages.

- [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/): the original preparation check confirmed the normalization task and Easy difficulty. Use the contract to decide which characters your comparisons ignore.
- [Move Zeroes](https://leetcode.com/problems/move-zeroes/): preparation confirmed in-place mutation, preserved nonzero order, and Easy difficulty. Those requirements explain both the compaction and the final zero fill.
- [3Sum](https://leetcode.com/problems/3sum/): preparation confirmed distinct positions, unique value triples, and Medium difficulty. Keep the index and value requirements separate when checking results.
- [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) and [Two Sum II](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/): original checks confirmed logical-prefix and one-based-index contracts and their respective Easy/Medium difficulties.
- [Upstream Week 3](https://github.com/Primalpancake92/DSA-grind/blob/main/weeks/03.md): the preparation record reports a GitHub connector fetch to reconcile the four assignments. The proofs and examples were developed as original teaching rather than copied upstream prose.

The original source notes date verification to 7 November 2026 and say the pages supplied contracts rather than editorial implementations. That historical record is retained without claiming a fresh check. The proofs use the local syllabus and invariant reasoning. No external judge submission or engine-specific sorting benchmark is claimed. Full linked-list rewiring and multilingual text normalization remain beyond this week's scope.

## Weekly Summary
<!-- lesson-id:w3-section-weekly-summary -->

You can now ask what evidence a position carries. In sorted search, it lets us exclude whole families of pairs. In palindrome checking, matched outer characters certify the part already passed. In compaction, writer marks useful output while reader protects unread input. In a cycle, relative speed guarantees a meeting. Each relationship has its own invariant and reason to stop; sharing the name “two pointers” does not replace those explanations.

Carry forward the ability to count total movement, include sorting before a scan, and distinguish a logical output prefix from physical storage. In [Week 4 — Sliding Window](week-04.md), two forward-moving boundaries will maintain a consecutive range of original input and a summary of that range. The positions will have a new relationship, but we will use the same questions about state, safe movement, and progress.

## Weekly Progress Checklist

### Theory

- [ ] I can prove which endpoint a too-small or too-large sorted pair sum safely excludes. <!-- checkpoint:w3-safe-endpoint-elimination -->
- [ ] I can state separate invariants for inward, reader/writer, and slow/fast positions. <!-- checkpoint:w3-pointer-relationships -->
- [ ] I can distinguish physical storage from logical length and explain stable writes that protect unread input. <!-- checkpoint:w3-compaction-contract -->
- [ ] I can explain how the relative gap changes each round inside a cycle and why a meeting follows. <!-- checkpoint:w3-cycle-proof -->

### JavaScript

- [ ] I can write pair search that requires numeric sorted order and never reuses one position. <!-- checkpoint:w3-pair-implementation -->
- [ ] I can write ASCII palindrome scanning whose punctuation skips always advance a boundary. <!-- checkpoint:w3-palindrome-implementation -->
- [ ] I can implement sorted deduplication and Move Zeroes while respecting their different in-place output contracts. <!-- checkpoint:w3-reader-writer-implementation -->
- [ ] I can construct complete linked-node examples and distinguish node identity from repeated values. <!-- checkpoint:w3-node-identity -->
- [ ] I can produce unique 3Sum value triples without changing the caller's input order. <!-- checkpoint:w3-three-sum-implementation -->

### Practice

- [ ] I worked through every boundary trace and explained the counterexamples used to debug pointer movement. <!-- checkpoint:w3-tracing-debugging -->
- [ ] I attempted Valid Palindrome, Move Zeroes, and 3Sum and checked their task-specific requirements. <!-- checkpoint:w3-external-practice -->
- [ ] I completed sorted deduplication and Two Sum II using the requested logical-prefix and index return contracts. <!-- checkpoint:w3-assigned-return-contracts -->
- [ ] I counted preparation and returned output as well as pointer traversal in my complexity explanations. <!-- checkpoint:w3-complexity-practice -->

### Reflection

- [ ] I can justify a pointer movement by its invariant instead of merely naming the pattern. <!-- checkpoint:w3-movement-reflection -->
- [ ] I recorded a contract where using a Map is preferable to preparing input for sorted pointers. <!-- checkpoint:w3-alternative-reflection -->
