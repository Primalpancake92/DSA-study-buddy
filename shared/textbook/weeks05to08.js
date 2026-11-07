// Syllabus authority: weekCatalog and moduleGuides in ../curriculum.js.
// Exercise solutions are separate fields so a reader can reveal them on demand.
const paragraph = (text) => ({ type: 'paragraph', text });
const code = (code) => ({ type: 'code', code });
const diagram = (text) => ({ type: 'diagram', text });
const exercise = (prompt, hints, solution) => ({ type: 'exercise', prompt, hints, solution });

export const chapters05to08 = {
    5: {
        sections: [
            {
                id: 'w5-stacks-nesting-and-undo',
                title: 'Stacks: remember what must be resolved next',
                blocks: [
                    paragraph(
                        `Imagine reading an expression from left to right. An opening parenthesis creates unfinished business: you cannot decide whether it is balanced until a later closing parenthesis arrives. If another opener appears first, that newer obligation must be resolved before the older one. This is exactly last in, first out, or LIFO. A stack is not defined by its storage layout but by its interface: push adds at the top, pop removes the top, and peek observes the top. In JavaScript an array with push, pop, and stack[stack.length - 1] is a natural implementation. End insertion is amortized constant time in the usual dynamic-array model; occasional backing-storage growth does not make a sequence of n pushes quadratic.`
                    ),
                    paragraph(
                        `The useful invariant for bracket matching is: the stack contains precisely the unmatched opening brackets in the prefix already read, in their opening order. A closer must match the top, because allowing it to match an earlier opener would cross the nesting structure. Counting openers and closers is insufficient: ([)] has the correct totals but the wrong order. Before processing a closer, check that an opener exists; pop on an empty JavaScript array returns undefined rather than throwing. After the scan, an empty stack means every obligation was discharged. This version ignores non-bracket characters, which makes it useful for expressions, but a problem restricted to bracket characters may instead reject other input.`
                    ),
                    code(`function isBalanced(text) {
  const stack = [];
  const opening = new Set(['(', '[', '{']);
  const matching = new Map([[')', '('], [']', '['], ['}', '{']]);
  for (const character of text) {
    if (opening.has(character)) stack.push(character);
    else if (matching.has(character)) {
      if (stack.length === 0 || stack.pop() !== matching.get(character)) return false;
    }
  }
  return stack.length === 0;
}
console.log(isBalanced('{[()]}')); //=> true
console.log(isBalanced('([)]')); //=> false
console.log(isBalanced('')); //=> true
console.log(isBalanced('a + (b * c)')); //=> true`),
                    diagram(`Read     Stack bottom → top     Reason
{        {                      remember outer obligation
[        { [                    newer obligation goes above it
(        { [ (                  innermost obligation is next
)        { [                    discharge (
]        {                      discharge [
}        empty                  discharge {; accept`),
                    paragraph(
                        `Notice the difference between time and peak storage. Each character is inspected once and each opener is pushed and popped at most once, so the scan takes O(n) time. A string consisting entirely of openers reaches stack height n, giving O(n) worst-case auxiliary space. Early rejection may take constant time, but that does not change the worst-case bound. The same reasoning applies to undo histories and expression parsing: save enough information to reverse or finish the most recent action. For undo, storing only the final value may be insufficient; an operation record may need the deleted text or previous position. For a minimum stack, keep a parallel stack of prefix minima so removing the current minimum exposes the earlier minimum without a rescan.`
                    ),
                    exercise(
                        'Trace ([)] and explain exactly why the first closing bracket fails. Then give a different invalid string that passes every closer check but fails the final check.',
                        [
                            'Write the stack immediately before reading ).',
                            'Consider a string with only opening brackets.'
                        ],
                        'Before ), the stack is [(, [] in bottom-to-top notation: its top is [. The closer requires (, so it fails immediately. The string (( passes all closer checks because there are no closers, but leaves two unresolved openers and fails the final empty-stack check.'
                    )
                ]
            },
            {
                id: 'w5-efficient-fifo-queues',
                title: 'Queues: process work in arrival order',
                blocks: [
                    paragraph(
                        `A queue answers a different question: which item has waited longest? First in, first out, or FIFO, is appropriate for a stream of jobs or level-order processing. Enqueue appends at the rear; dequeue removes from the front. Repeated array.shift() looks convenient, but under the standard array cost model each shift moves or reindexes the remaining elements. Draining n items can therefore cost n + (n - 1) + ... + 1, or O(n²). A head index avoids that repeated movement. The logical queue is the array suffix beginning at head, not the entire physical array. Clearing consumed slots also releases references so already-processed objects are not kept alive unnecessarily.`
                    ),
                    code(`class HeadQueue {
  constructor() { this.items = []; this.head = 0; }
  get size() { return this.items.length - this.head; }
  enqueue(value) { this.items.push(value); }
  peek() { return this.size === 0 ? undefined : this.items[this.head]; }
  dequeue() {
    if (this.size === 0) return undefined;
    const value = this.items[this.head];
    this.items[this.head++] = undefined;
    if (this.head >= 64 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return value;
  }
}
const queue = new HeadQueue();
queue.enqueue('oldest'); queue.enqueue('newest');
console.log(queue.dequeue()); //=> oldest
console.log(queue.peek(), queue.size); //=> newest 1
console.log(queue.dequeue(), queue.dequeue()); //=> newest undefined`),
                    paragraph(
                        `Compaction occasionally copies the live suffix. Why is that acceptable? At compaction, at least half the array has been consumed, so the copied live entries are no more numerous than the dequeues since the preceding reset. Charge that copy to those dequeues and the amortized cost remains O(1) per operation. A single dequeue can still cost O(n); amortized does not mean every individual call is constant. This implementation bounds retained slots by the current queue size plus a small threshold. Without compaction, a head-index queue is still fast but its backing array can grow with total historical enqueues. Also, undefined is both a permitted value and the empty return value here: use size to distinguish those cases, or choose an interface that throws on empty.`
                    ),
                    paragraph(
                        `The syllabus also asks for a queue using stacks. Keep incoming items in one stack and outgoing items in another. Transfer incoming to outgoing only when outgoing is empty. Reversing arrival order once puts the oldest item on top. Transferring on every dequeue is unnecessary and can break order if outgoing still holds older items. Each item enters incoming once, moves to outgoing once, and leaves once; this gives O(1) amortized operations even though one transfer can take linear time. This is a good interview example of proving an aggregate bound rather than counting a nested loop mechanically.`
                    ),
                    code(`class TwoStackQueue {
  constructor() { this.incoming = []; this.outgoing = []; }
  get size() { return this.incoming.length + this.outgoing.length; }
  prepare() {
    if (this.outgoing.length === 0) {
      while (this.incoming.length) this.outgoing.push(this.incoming.pop());
    }
  }
  enqueue(value) { this.incoming.push(value); }
  dequeue() { this.prepare(); return this.outgoing.pop(); }
  peek() { this.prepare(); return this.outgoing[this.outgoing.length - 1]; }
}
const jobs = new TwoStackQueue();
jobs.enqueue(1); jobs.enqueue(2);
console.log(jobs.dequeue()); //=> 1
jobs.enqueue(3);
console.log(jobs.dequeue(), jobs.dequeue(), jobs.size); //=> 2 3 0`),
                    exercise(
                        'After enqueue A, enqueue B, dequeue, enqueue C, describe both stacks and the next two returned values.',
                        [
                            'The transfer happens only when outgoing is empty.',
                            'Incoming and outgoing can both be nonempty.'
                        ],
                        'After the dequeue returns A, outgoing contains B. Enqueuing C leaves incoming [C] and outgoing [B]. The next dequeue returns B without transferring. Only then does C transfer and return. The output order is A, B, C.'
                    )
                ]
            },
            {
                id: 'w5-monotonic-stacks',
                title: 'Monotonic stacks: settle unresolved neighbors once',
                blocks: [
                    paragraph(
                        `Daily Temperatures asks how many days each temperature must wait for a strictly warmer day. A scan forward from every day repeats work and takes O(n²) in the worst case. Instead, keep indexes of days still waiting. When today's temperature exceeds the temperature of the top waiting day, today is that day's first warmer day: everything between them has already been seen without resolving it. Pop that index and record the distance. Continue popping because the same day can resolve several obligations. Store indexes rather than only temperatures because the answer requires distances and repeated values must remain distinct.`
                    ),
                    code(`function dailyTemperatures(temperatures) {
  const waits = Array(temperatures.length).fill(0);
  const pending = [];
  for (let day = 0; day < temperatures.length; day++) {
    while (pending.length && temperatures[day] > temperatures[pending[pending.length - 1]]) {
      const earlier = pending.pop();
      waits[earlier] = day - earlier;
    }
    pending.push(day);
  }
  return waits;
}
console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]));
//=> [1, 1, 4, 2, 1, 1, 0, 0]
console.log(dailyTemperatures([70, 70, 71])); //=> [2, 1, 0]`),
                    diagram(`Temperatures: [75, 71, 69, 72]
day 0: pending [0]         unresolved temperatures [75]
day 1: pending [0,1]       unresolved temperatures [75,71]
day 2: pending [0,1,2]     unresolved temperatures [75,71,69]
day 3: pop 2 → wait 1; pop 1 → wait 2; keep 0; push 3
Final waits: [0,2,1,0]`),
                    paragraph(
                        `The pending temperatures are nonincreasing from bottom to top. Equal temperatures stay pending because equal is not warmer; changing > to >= silently changes the problem. Every index is pushed exactly once and popped at most once, so the total while-loop work is O(n), not O(n²). The output and stack each require O(n) space; even excluding output, the stack may contain the whole input on a decreasing sequence. Recognize this pattern when a prompt asks for the nearest greater or smaller item to one side. First decide strictness, direction, and what a stack entry represents. A monotonic stack discards resolved candidates; an ordinary nesting stack merely tracks unfinished structure. Neither should be selected just because a prompt contains the word next.`
                    ),
                    exercise(
                        'Predict the pending stack and answer for [80, 70, 70, 60]. Why is binary search unnecessary here?',
                        [
                            'No later value is strictly warmer.',
                            'Count pushes and pops across the entire run.'
                        ],
                        'All indexes remain pending, with temperatures [80,70,70,60], and the answer is [0,0,0,0]. We need first future greater values in original order, not a search in a sorted array. The stack resolves candidates in total linear time without sorting or binary search.'
                    )
                ]
            }
        ]
    },
    6: {
        sections: [
            {
                id: 'w6-sorted-search-and-boundaries',
                title: 'Binary search: prove what can be discarded',
                blocks: [
                    paragraph(
                        `Binary search is a proof-driven shortcut. In an ascending array, a midpoint smaller than the target proves that every earlier value is also too small. That single comparison lets us discard an entire region. Without sorted order, the same comparison tells us nothing about the other positions. Before writing a loop, name the candidate interval and its endpoints. For an exact search below, [left, right] is closed: both endpoints are possible indexes. The loop runs while left <= right because a one-element interval still needs checking. Once a midpoint is ruled out, move beyond it; assigning left = middle can leave a one-element interval unchanged forever.`
                    ),
                    code(`function binarySearch(values, target) {
  let left = 0;
  let right = values.length - 1;
  while (left <= right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] === target) return middle;
    if (values[middle] < target) left = middle + 1;
    else right = middle - 1;
  }
  return -1;
}
console.log(binarySearch([1, 3, 5, 7, 9], 7)); //=> 3
console.log(binarySearch([1, 3, 5], 4)); //=> -1
console.log(binarySearch([], 4)); //=> -1`),
                    paragraph(
                        `Each iteration shrinks the number of candidates by roughly half. After k iterations there are at most about n / 2^k candidates, so only O(log n) comparisons are necessary. The iterative implementation stores a fixed number of indexes and uses O(1) auxiliary space. JavaScript bitwise midpoint shortcuts coerce numbers to signed 32-bit integers; Math.floor avoids that unnecessary limitation. Index arithmetic should remain within safe integer bounds. Also, binary search does not make an unsorted one-off lookup logarithmic: making a sorted copy already costs O(n log n), and returning an original index requires preserving index information. Sorting becomes worthwhile when many searches reuse the same ordered data.`
                    ),
                    paragraph(
                        `Finding any equal value is a different contract from finding the first equal value. Duplicates make an early equality return ambiguous. A lower bound returns the first index with value >= target, or n if none exists. Think of this as locating the transition from false to true in the predicate values[i] >= target. We use [left, right) as the unresolved element interval, initialized to [0, n). All indexes below left are known too small; all indexes at or above right are known large enough, with n acting as a sentinel insertion position. On a large-enough midpoint, retain it by setting right = middle. On a too-small midpoint, exclude it by setting left = middle + 1.`
                    ),
                    code(`function lowerBound(values, target) {
  let left = 0, right = values.length;
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] < target) left = middle + 1;
    else right = middle;
  }
  return left;
}
function upperBound(values, target) {
  let left = 0, right = values.length;
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] <= target) left = middle + 1;
    else right = middle;
  }
  return left;
}
function equalRange(values, target) {
  return [lowerBound(values, target), upperBound(values, target)];
}
console.log(equalRange([1, 3, 3, 3, 7], 3)); //=> [1, 4]
console.log(lowerBound([1, 3, 7], 8)); //=> 3
console.log(lowerBound([], 2)); //=> 0`),
                    diagram(`lowerBound([1,3,3,7], 3)
left right middle value decision
0    4     2      3     right = 2; middle might be first
0    2     1      3     right = 1; keep this candidate
0    1     0      1     left = 1; discard too-small value
1    1                  stop; insertion boundary is 1`),
                    paragraph(
                        `The upper bound changes only the strictness: it finds the first value > target. The half-open range [lowerBound, upperBound) contains all equal values, so its length counts duplicates. To check membership from a lower bound, verify index < values.length before reading values[index] and testing equality. An insertion index of n is a valid answer, not an invalid search failure. Test empty arrays, a target below the minimum, a target above the maximum, all-equal input, and a one-element array. These are especially good at exposing a mixture of inclusive and exclusive endpoint conventions.`
                    ),
                    exercise(
                        'For [2,2,2,4], calculate the lower and upper bounds of 2 and 3. Explain which bound Search Insert Position needs.',
                        [
                            'Upper bound excludes equality.',
                            'An absent value has equal lower and upper bounds.'
                        ],
                        'For 2, the bounds are 0 and 3, so there are three copies. For 3, both bounds are 3. Search Insert Position conventionally needs lowerBound: insert before any existing equal values and preserve ascending order.'
                    )
                ]
            },
            {
                id: 'w6-rotated-sorted-arrays',
                title: 'Rotated search: identify the ordered half',
                blocks: [
                    paragraph(
                        `A rotated ascending array looks unsorted globally, yet retains useful local order. For distinct values, at least one half around the midpoint is sorted. In [4,5,6,7,0,1,2], the midpoint is 7 and the left half is sorted. If the target lies between the left endpoint and midpoint, keep that half; otherwise discard it. When the left half is not sorted, the right half is sorted, so use its endpoint range instead. The invariant remains that any target occurrence is inside the closed candidate interval. What changes is the evidence used to discard a half. Always check the midpoint for equality before excluding it from either range.`
                    ),
                    code(`function searchRotated(values, target) {
  let left = 0, right = values.length - 1;
  while (left <= right) {
    const middle = left + Math.floor((right - left) / 2);
    if (values[middle] === target) return middle;
    if (values[left] <= values[middle]) {
      if (values[left] <= target && target < values[middle]) right = middle - 1;
      else left = middle + 1;
    } else {
      if (values[middle] < target && target <= values[right]) left = middle + 1;
      else right = middle - 1;
    }
  }
  return -1;
}
console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 0)); //=> 4
console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 3)); //=> -1
console.log(searchRotated([1], 1)); //=> 0`),
                    paragraph(
                        `Trace target 0: interval [0,6] has midpoint 3, value 7. The sorted left half spans values 4 through 7, which cannot contain 0, so left becomes 4. Now [4,6] has midpoint 5, value 1; its left half spans 0 through 1 and contains the target, so right becomes 4. The final comparison finds index 4. Each successful elimination halves the interval, yielding O(log n) time and O(1) space. Distinct values are a real precondition here. With duplicates, equal endpoint and midpoint values can hide the pivot; a duplicate-aware algorithm may have to shrink endpoints one at a time and degrade to O(n). Do not silently promise logarithmic performance for that different contract.`
                    ),
                    exercise(
                        'Why does sorting a rotated array first fail to solve the original-index version directly?',
                        [
                            'What does sorting change besides order?',
                            'Compare the location of 0 before and after sorting.'
                        ],
                        'Sorting changes indexes: 0 is at original index 4 in [4,5,6,7,0,1,2] but at sorted index 0. It also spends O(n log n) work on a problem solvable in O(log n) under the distinct-value contract. Keeping original index pairs fixes identity but not that extra cost.'
                    )
                ]
            },
            {
                id: 'w6-answer-space-search',
                title: 'Search answers with a monotonic feasibility test',
                blocks: [
                    paragraph(
                        `Koko Eating Bananas is not initially an array-search question. We seek the minimum integer eating speed that finishes all piles within a time limit. At speed k, a pile of p bananas requires ceil(p / k) hours because a partial final hour still counts and unused time cannot be transferred between piles. The feasibility predicate is monotonic: increasing speed never increases required hours. Speeds therefore form a false prefix followed by a true suffix. Binary search can find that boundary even though no array of speeds is ever constructed. This is the recognition step: replace minimum feasible answer with first true, then prove why feasibility stays true as the candidate grows.`
                    ),
                    code(`function minimumEatingSpeed(piles, hours) {
  if (!Number.isSafeInteger(hours) || hours < 0 ||
      piles.some(p => !Number.isSafeInteger(p) || p <= 0)) {
    throw new RangeError('Use positive safe-integer piles and nonnegative integer hours');
  }
  if (piles.length === 0) return 0;
  if (hours < piles.length) return -1;
  let left = 1, right = 1;
  for (const pile of piles) right = Math.max(right, pile);
  function canFinish(speed) {
    let spent = 0;
    for (const pile of piles) {
      const needed = Math.ceil(pile / speed);
      if (needed > hours - spent) return false;
      spent += needed;
    }
    return true;
  }
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2);
    if (canFinish(middle)) right = middle;
    else left = middle + 1;
  }
  return left;
}
console.log(minimumEatingSpeed([3, 6, 7, 11], 8)); //=> 4
console.log(minimumEatingSpeed([3, 6], 1)); //=> -1
console.log(minimumEatingSpeed([], 0)); //=> 0`),
                    paragraph(
                        `For [3,6,7,11] and eight hours, speed 6 needs 1+1+2+2 = 6 hours, so the answer is no larger than 6. Speed 3 needs 1+2+3+4 = 10, so the answer is larger than 3. Speed 5 needs eight hours and speed 4 also needs eight; the boundary is 4. The maximum pile is a feasible upper bound only when the number of available hours is at least the number of piles. Checking that precondition prevents a loop from returning an impossible answer. With n piles and maximum size M, there are O(log M) candidate checks, each O(n), giving O(n log M) time and O(1) auxiliary space. Avoid using Math.max(...piles) for arbitrarily large inputs because argument-count limits can fail before the algorithm begins.`
                    ),
                    paragraph(
                        `For a final review, test your boundary algorithm against a linear oracle on tiny inputs: scan from left to right until the predicate becomes true, then compare indexes. Include a predicate that is always false and one that is always true. Before each iteration, record left, right, midpoint, and which candidates were excluded. A correct return value on one example is weaker evidence than a preserved invariant on every step. For numeric data, remember that JavaScript's default sort compares string representations: [2, 10] sorts incorrectly for numeric binary search unless you provide (a, b) => a - b.`
                    ),
                    exercise(
                        'Explain why binary search cannot generally find the first speed whose required hours equal exactly eight.',
                        [
                            'Is an equality predicate monotonic?',
                            'The hours function can jump over a value.'
                        ],
                        'Equality can be false at slow speeds, true in a middle interval, and false again at fast speeds; it can also be absent entirely. Search requiredHours <= 8, which stays true at larger speeds, then inspect the boundary if exact equality matters.'
                    )
                ]
            }
        ]
    },
    7: {
        sections: [
            {
                id: 'w7-node-identity-and-reversal',
                title: 'Linked nodes: follow references, then change arrows',
                blocks: [
                    paragraph(
                        `A singly linked list is a chain of objects. Each node stores a value and a next reference; head is a reference to the first node, and null marks the end. Unlike an array, the structure does not provide constant-time access to position i: reaching it requires following i links. Two nodes containing 7 are still different objects. Conversely, two variables can reference the very same node. This distinction between value equality and object identity explains most linked-list bugs. Drawing boxes with names such as A and B, rather than writing only their values, makes aliasing visible. Assigning current = current.next changes a local reference; assigning current.next = anotherNode changes the shared structure.`
                    ),
                    paragraph(
                        `Insertion after an already-known node is O(1): connect the new node to the old successor, then connect the predecessor to the new node. Finding that predecessor may take O(n). Deletion also requires the predecessor in a singly linked list, unless the operation is a special case such as deleting the head. The claim that linked-list insertion and deletion are always constant time forgets this search cost. Arrays often remain preferable for indexed reads, compact storage, and locality. JavaScript nodes are ordinary heap objects, so a linked list also pays object and reference overhead. Choose the representation because the operations fit, not because arrow diagrams look simpler than indexes.`
                    ),
                    code(`class ListNode {
  constructor(value, next = null) { this.value = value; this.next = next; }
}
function fromArray(values) {
  const dummy = new ListNode(null);
  let tail = dummy;
  for (const value of values) { tail.next = new ListNode(value); tail = tail.next; }
  return dummy.next;
}
function toArray(head) {
  const values = [];
  for (let node = head; node !== null; node = node.next) values.push(node.value);
  return values;
}
function reverseList(head) {
  let previous = null, current = head;
  while (current !== null) {
    const next = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }
  return previous;
}
const original = fromArray([1, 2, 3]);
const reversed = reverseList(original);
console.log(toArray(reversed)); //=> [3, 2, 1]
console.log(original.value, original.next); //=> 1 null
console.log(toArray(reverseList(null))); //=> []`),
                    diagram(`Original: head → A(1) → B(2) → C(3) → null
Start:    previous = null; current = A
Step 1:   previous → A → null; current → B → C → null
Step 2:   previous → B → A → null; current → C → null
Step 3:   previous → C → B → A → null; current = null
Return previous. The old head still references A, now the tail.`),
                    paragraph(
                        `The reversal invariant partitions the original nodes into a reversed prefix headed by previous and an untouched suffix headed by current. Save next before replacing current.next, because the old arrow is the only route to the suffix. After rewiring, advancing previous and current reestablishes the partition. At termination the suffix is empty, so previous heads the entire reversed list. There is one iteration per node, O(n) time, and a fixed number of references, O(1) auxiliary space. This mutates existing nodes: anyone holding the old head observes its new next value. The traversal helper assumes an acyclic list; applying it to a cycle would never terminate. Preconditions belong to a function's contract even when its code looks harmless.`
                    ),
                    exercise(
                        'What happens if current.next = previous runs before next = current.next? Use a three-node drawing, then explain why returning head is wrong after a correct reversal.',
                        [
                            'Which reference still reaches B after overwriting A.next?',
                            'The original head object does not change identity.'
                        ],
                        'At A, overwriting A.next with null destroys the path from A to B. Saving next afterward saves null and loses the suffix from the traversal. A correct reversal returns previous, which references C; the original head still references A, now the final node, so returning head returns only the tail chain.'
                    )
                ]
            },
            {
                id: 'w7-dummy-nodes-and-merging',
                title: 'Dummy nodes: make the first link ordinary',
                blocks: [
                    paragraph(
                        `Many list algorithms become awkward because the head has no predecessor. A dummy node supplies an artificial predecessor so the first insertion, removal, or splice can use the same logic as later operations. The dummy's value is irrelevant and never appears in the returned chain. When merging two ascending lists, keep a tail reference to the last node in the merged prefix. Compare the two current heads, link the smaller node after tail, and advance only the list that supplied that node. Then advance tail itself. The invariant says the output prefix is sorted and contains exactly the nodes removed from the two input prefixes; all unselected nodes remain in their original sorted suffixes.`
                    ),
                    code(`class ListNode {
  constructor(value, next = null) { this.value = value; this.next = next; }
}
function fromArray(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = new ListNode(values[i], head);
  return head;
}
function toArray(head) {
  const result = [];
  while (head !== null) { result.push(head.value); head = head.next; }
  return result;
}
function mergeTwoLists(first, second) {
  const dummy = new ListNode(null);
  let tail = dummy;
  while (first !== null && second !== null) {
    if (first.value <= second.value) { tail.next = first; first = first.next; }
    else { tail.next = second; second = second.next; }
    tail = tail.next;
  }
  tail.next = first !== null ? first : second;
  return dummy.next;
}
console.log(toArray(mergeTwoLists(fromArray([1, 3, 5]), fromArray([1, 2, 6]))));
//=> [1, 1, 2, 3, 5, 6]
console.log(toArray(mergeTwoLists(null, fromArray([2])))); //=> [2]`),
                    paragraph(
                        `For first = [1,3,5] and second = [1,2,6], choose the first list's 1 on equality, then second's 1, second's 2, first's 3, and first's 5. The remaining [6] suffix can be attached without scanning it. With lengths m and n, the worst-case comparison work is O(m+n), and auxiliary space is O(1), excluding the existing nodes. This version reuses and rewires nodes rather than allocating a fresh output list. It requires sorted, acyclic, disjoint inputs: shared tails can create self-links when reused carelessly. Choosing <= also gives a deterministic tie policy favoring the first chain. A fresh-copy merge is appropriate if callers require the original topology to remain intact, but then output allocation is O(m+n).`
                    ),
                    exercise(
                        'A merge implementation sets tail.next correctly but never executes tail = tail.next. Predict its failure. Why must the returned value be dummy.next?',
                        [
                            'Which link gets overwritten on each iteration?',
                            'The dummy is a sentinel rather than an input node.'
                        ],
                        'Tail remains the dummy, so each chosen node overwrites dummy.next and earlier choices disappear from the reachable output. Advancing tail preserves the growing prefix. Return dummy.next because returning dummy would add a fake first value and violate the result contract.'
                    )
                ]
            },
            {
                id: 'w7-slow-fast-cycles-and-reordering',
                title: 'Slow and fast references: cycles, midpoints, and reorder',
                blocks: [
                    paragraph(
                        `A cycle means following next eventually revisits the same node object. Repeated values do not prove a cycle: [4,4] can be a perfectly ordinary two-node chain. A Set of visited node references detects repetition in O(n) time and O(n) space. Floyd's slow/fast method removes that extra set. Move slow by one edge and fast by two; if fast reaches null there is no cycle. If both enter a cycle of length c, their relative position advances by one modulo c on each iteration, so they must meet within c iterations. Check fast and fast.next before taking two steps. Compare references after moving, because initializing both at head makes them equal before any evidence has been gathered.`
                    ),
                    code(`class ListNode {
  constructor(value, next = null) { this.value = value; this.next = next; }
}
function cycleEntry(head) {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let seeker = head;
      while (seeker !== slow) { seeker = seeker.next; slow = slow.next; }
      return seeker;
    }
  }
  return null;
}
const a = new ListNode(4), b = new ListNode(4), c = new ListNode(9);
a.next = b; b.next = c; c.next = b;
console.log(cycleEntry(a) === b); //=> true
console.log(cycleEntry(new ListNode(4, new ListNode(4)))); //=> null
console.log(cycleEntry(null)); //=> null`),
                    diagram(`Cycle: A → B → C → D
           ↑       ↓
           └───────┘
After 1 move: slow B, fast C
After 2 moves: slow C, fast B
After 3 moves: slow D, fast D (meeting)
Reset seeker to A; advance seeker and meeting pointer by one:
seeker B, slow B → cycle entry B`),
                    paragraph(
                        `Why does the reset locate the entry? Let the noncyclic prefix length be μ, and let slow travel t edges before meeting. Fast traveled 2t, so their difference t is a multiple of c. If the meeting lies x edges past the entry, then t = μ + x modulo c, hence μ + x is a multiple of c. Starting from the meeting and walking μ edges therefore reaches the entry, exactly when a reference starting at head reaches it. Detection plus entry finding takes O(n) time over distinct reachable nodes and O(1) auxiliary space. The argument assumes stable next references during the walk; concurrent rewiring would invalidate it.`
                    ),
                    paragraph(
                        `Slow/fast also finds a midpoint in an acyclic chain. With slow and fast at head and a loop requiring fast.next and fast.next.next, slow stops at the last node of the first half. That convention is useful for Reorder List: transform L0→L1→...→Ln into L0→Ln→L1→Ln-1→.... Split after slow, reverse the second half, then weave the two halves. Severing the split first is essential; otherwise old links may remain reachable and produce a cycle. For [1,2,3,4,5], the halves are [1,2,3] and [4,5], reversed second becomes [5,4], and weaving gives [1,5,2,4,3]. The odd-length middle stays at the end naturally.`
                    ),
                    code(`class ListNode {
  constructor(value, next = null) { this.value = value; this.next = next; }
}
function fromArray(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = new ListNode(values[i], head);
  return head;
}
function toArray(head) {
  const output = [];
  while (head !== null) { output.push(head.value); head = head.next; }
  return output;
}
function reorderList(head) {
  if (head === null || head.next === null) return head;
  let slow = head, fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next; fast = fast.next.next;
  }
  let current = slow.next;
  slow.next = null;
  let previous = null;
  while (current !== null) {
    const next = current.next;
    current.next = previous; previous = current; current = next;
  }
  let first = head, second = previous;
  while (second !== null) {
    const nextFirst = first.next, nextSecond = second.next;
    first.next = second; second.next = nextFirst;
    first = nextFirst; second = nextSecond;
  }
  return head;
}
console.log(toArray(reorderList(fromArray([1, 2, 3, 4, 5])))); //=> [1, 5, 2, 4, 3]
console.log(toArray(reorderList(fromArray([1, 2, 3, 4])))); //=> [1, 4, 2, 3]
console.log(toArray(reorderList(null))); //=> []`),
                    paragraph(
                        `Three linear passes still add to O(n), rather than multiplying to O(n³), because they run sequentially. Reordering uses O(1) auxiliary references and no replacement nodes. Diagnose incorrect output by checking each phase separately: the two halves should be disjoint, the reversed suffix should end in null, and each weave iteration should preserve the unprocessed remainder of both halves. Saving only one successor before rewiring is insufficient because two different chains are changing. This is the same save-before-overwrite habit as reversal, now applied twice per iteration.`
                    ),
                    exercise(
                        'Trace Floyd on a single node whose next points to itself, and on two distinct nodes with equal values and a null tail. State the results and complexity.',
                        ['Reference equality is the test.', 'A self-loop has cycle length one.'],
                        'The self-loop meets after the first movement, and the entry is the head itself. The acyclic two-node list reaches a null fast reference and returns null even though the values match. Both use constant auxiliary space; general runtime is linear in the number of distinct reachable nodes.'
                    )
                ]
            }
        ]
    },
    8: {
        sections: [
            {
                id: 'w8-recursive-contracts-and-call-trees',
                title: 'Recursion: a contract for smaller inputs',
                blocks: [
                    paragraph(
                        `A recursive call does not magically restart the whole program. It creates a new execution frame with its own parameters and local variables, while the caller waits for a return value. To design recursion, state what one call promises, identify a base case that can answer directly, and name a progress measure that decreases on every recursive edge. For summing a prefix, the promise is sumFirst(values, count) returns the sum of the first count elements; count decreases until zero. The caller trusts the smaller call to satisfy that contract and adds its own final element. This is also an induction proof: the base establishes correctness at zero, and the recursive step extends correctness from count - 1 to count.`
                    ),
                    code(`function sumFirst(values, count = values.length) {
  if (!Number.isInteger(count) || count < 0 || count > values.length) {
    throw new RangeError('count must be a valid prefix length');
  }
  if (count === 0) return 0;
  return sumFirst(values, count - 1) + values[count - 1];
}
function fibonacci(n) {
  if (!Number.isInteger(n) || n < 0 || n > 78) {
    throw new RangeError('Use n from 0 through 78 for safe integer results');
  }
  if (n < 2) return n;
  let previous = 0, current = 1;
  for (let i = 2; i <= n; i++) {
    const next = previous + current;
    previous = current; current = next;
  }
  return current;
}
console.log(sumFirst([2, 4, 6])); //=> 12
console.log(sumFirst([])); //=> 0
console.log(fibonacci(10)); //=> 55`),
                    diagram(`sumFirst([2,4,6], 3)
  waits for sumFirst(..., 2), then adds 6
    waits for sumFirst(..., 1), then adds 4
      waits for sumFirst(..., 0), then adds 2
        returns 0
      returns 2
    returns 6
  returns 12
The deepest instant has four suspended/active frames, not twelve.`),
                    paragraph(
                        `For this sum, T(n) = T(n-1) + O(1), so time is O(n); call depth and auxiliary stack space are O(n). Returning a recursive call's result does not guarantee constant space in typical JavaScript runtimes. Deep recursion can exhaust the stack, so a loop is preferable for very long linear chains. Passing values.slice(0, -1) at every level changes the analysis: the copies cost n + (n-1) + ... operations and may occupy quadratic total live storage. Index parameters preserve the original input and keep each level's local work constant. Also distinguish a missing return from a missing base case: one may produce undefined after finite work, while the other may prevent termination entirely.`
                    ),
                    paragraph(
                        `Fibonacci illustrates a different recursion tree. The direct recurrence fib(n) = fib(n-1) + fib(n-2) recomputes fib(n-2) in both the left subtree and the right subtree. Its runtime is Θ(φ^n), commonly bounded by O(2^n), while its maximum call depth is only O(n). The number of frames created over the whole execution is not the number alive simultaneously. The iterative implementation above avoids repeated states in O(n) arithmetic steps and O(1) auxiliary space; it is a comparison tool for understanding the recursion, not a claim that recursion is always inefficient. With JavaScript Number, exact integer Fibonacci values cease to be reliably representable beyond the stated range; BigInt is appropriate if exact larger results are required.`
                    ),
                    exercise(
                        'A recursive function makes two calls on n/2 and performs a linear scan before returning. Compare its time and stack depth with a function making two calls on n-1.',
                        [
                            'Count total work at each level.',
                            'Depth measures the longest active path, not all calls.'
                        ],
                        'For two half-size calls and linear local work, every level costs O(n), there are O(log n) levels, and time is O(n log n); depth is O(log n) assuming constant-size frame data. Two calls on n-1 with constant local work produce exponential time O(2^n) and linear depth O(n). Allocated per-frame arrays must be counted separately.'
                    )
                ]
            },
            {
                id: 'w8-subsets-and-permutations',
                title: 'Backtracking: choose, explore, and restore',
                blocks: [
                    paragraph(
                        `Backtracking explores a tree of partial decisions. The mutable path describes the current root-to-node choice sequence; recursion explores continuations; undo restores the exact state the caller owned. For subsets of distinct values, every index has two choices: exclude it or include it. The invariant at visit(index) is that path records only decisions for positions before index. At index === values.length, every decision is complete, including the decision to choose nothing. Save a copy of path. Saving path itself puts the same array object into the output repeatedly, so later pop operations change all supposedly completed answers. A shallow copy is sufficient for scalar values; it does not clone nested input objects.`
                    ),
                    code(`function subsets(values) {
  const result = [], path = [];
  function visit(index) {
    if (index === values.length) { result.push([...path]); return; }
    visit(index + 1);
    path.push(values[index]);
    visit(index + 1);
    path.pop();
  }
  visit(0);
  return result;
}
console.log(subsets([1, 2])); //=> [[], [2], [1], [1, 2]]
console.log(subsets([])); //=> [[]]`),
                    diagram(`visit(0), path []
├─ skip 1 → visit(1), []
│  ├─ skip 2 → save []
│  └─ take 2 → save [2], then pop 2
└─ take 1 → visit(1), [1]
   ├─ skip 2 → save [1]
   └─ take 2 → save [1,2], then pop 2
After the take-1 branch returns, pop 1: path is [] again.`),
                    paragraph(
                        `There are 2^n leaves and 2^(n+1)-1 total calls. However, emitting each subset requires copying its elements. Across all subsets each input element appears in half the outputs, giving n·2^(n-1) copied elements when n >= 1. Time is therefore Θ(n·2^n), and stored output space is also Θ(n·2^n); auxiliary working space excluding output is O(n) for path and call depth. This distinction makes output-sensitive analysis concrete. If the task merely asks for the number of subsets, generating them is wasteful: compute 2^n using an appropriate numeric representation. If input values repeat, this index-based algorithm treats equal values at different positions as different choices and may produce duplicate value arrays; a unique-subsets contract needs additional handling.`
                    ),
                    paragraph(
                        `Permutations ask a different question: in what orders can all items appear? Depth is the output position, and each level chooses among unused input positions. A used flag belongs to an index, not a value, so equal-valued objects remain distinguishable when that is the intended contract. The implementation below assumes distinct values for unique value permutations. Set the flag and push before exploring; pop and clear afterward. Undo both pieces of state. Forgetting the flag reset suppresses valid sibling branches, while forgetting pop makes path length and used membership disagree. The invariant is that exactly the indexes represented in path have true flags.`
                    ),
                    code(`function permutations(values) {
  const result = [], path = [], used = Array(values.length).fill(false);
  function visit() {
    if (path.length === values.length) { result.push([...path]); return; }
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
console.log(permutations([1, 2, 3]));
//=> [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
console.log(permutations([])); //=> [[]]`),
                    paragraph(
                        `For [1,2,3], choosing 1 leaves choices 2 and 3; choosing 2 next forces 3, producing [1,2,3]. Returning restores [1], then choosing 3 produces [1,3,2]. Only after the entire 1-prefix subtree is done do we restore [] and begin with 2. There are n! completed permutations and copying each costs O(n). The used-array implementation scans n candidate flags at internal nodes; its total bound remains O(n·n!) for n >= 1, with O(n) working space and O(n·n!) output space. This is factorial growth, much faster than the subset tree. For n = 10 there are already 3,628,800 outputs, so feasibility must consider result size before clever pruning. Returning only the first solution changes both the contract and the achievable work.`
                    ),
                    exercise(
                        'Predict subsets([]) and permutations([]). Then explain how you would test for path aliasing rather than only checking output length.',
                        [
                            'There is one way to make no choices.',
                            'Mutate one returned array and inspect a sibling.'
                        ],
                        'Both return [[]]: one empty selection and one empty arrangement. To test aliasing, generate multiple results, check that different output arrays are different references, then mutate one and verify others are unchanged. Merely checking the count can pass even when every entry points to the same emptied path.'
                    )
                ]
            },
            {
                id: 'w8-pruning-combinations-and-phone-letters',
                title: 'Prune impossible branches without losing solutions',
                blocks: [
                    paragraph(
                        `Combination Sum allows repeated use of candidates while avoiding duplicate orderings such as [2,3,2] and [2,2,3]. Sort distinct positive integer candidates numerically and carry a start index. A recursive choice may reuse its own index, but never move backward to an earlier candidate; every emitted combination is therefore nondecreasing. The remaining sum is a second progress measure. Because candidates are positive, subtracting a chosen candidate strictly decreases remaining, ensuring termination even when an index is reused. Zero would break that argument; negative values would break the pruning rule. Preconditions are part of correctness, not optional input decoration.`
                    ),
                    code(`function combinationSum(candidates, target) {
  if (!Number.isSafeInteger(target) || target < 0 ||
      candidates.some(x => !Number.isSafeInteger(x) || x <= 0)) {
    throw new RangeError('Use positive integer candidates and a nonnegative integer target');
  }
  const choices = [...new Set(candidates)].sort((a, b) => a - b);
  const result = [], path = [];
  function visit(start, remaining) {
    if (remaining === 0) { result.push([...path]); return; }
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
console.log(combinationSum([2, 3, 6, 7], 7)); //=> [[2, 2, 3], [7]]
console.log(combinationSum([2], 1)); //=> []
console.log(combinationSum([2], 0)); //=> [[]]`),
                    paragraph(
                        `Trace target 7: choose 2, leaving 5; choose 2 again, leaving 3; another 2 leaves 1 and no candidate fits, so return and undo. Back at remaining 3, choose 3 and save [2,2,3]. After restoring earlier levels, branches starting with 3 cannot later choose 2, which is why [3,2,2] never appears. Finally 7 completes [7]. Breaking when a candidate exceeds remaining is safe because all subsequent sorted candidates are at least as large. On unsorted input, break could discard a later smaller candidate. Checking remaining === 0 before pruning ensures a valid completion is saved. Pruning reduces actual exploration but does not generally convert enumeration into polynomial time.`
                    ),
                    paragraph(
                        `Let m be the number of distinct candidates and D = floor(target / minimumCandidate). Depth is at most D. A loose search bound is O(m^(D+1)) for m >= 2, plus the cost of copying completed answers; actual nondecreasing-index exploration is often much smaller. Working space includes O(D) path and stack plus O(m) sorted candidates, while output storage depends on the number and lengths of answers. For m = 1, the recursion is just a chain of at most D calls. Stating parameters matters: calling this O(2^n) without defining n hides the effect of candidate magnitudes and target. Extremely large D can also overflow JavaScript's call stack even if branching is small.`
                    ),
                    paragraph(
                        `Phone letter combinations use the same search skeleton with a different choice rule. Each depth corresponds to one digit, and the outgoing branches are that digit's letters. There is no used array because choosing a letter for one digit does not consume it for another. The prefix invariant says path has exactly index letters, each from its matching digit. Empty input conventionally returns [] for this problem, unlike the mathematical empty subset result; this is an API decision stated explicitly. Digits 0 and 1 have no mapping here and are rejected rather than producing a misleading partial answer.`
                    ),
                    code(`function letterCombinations(digits) {
  const letters = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };
  if (typeof digits !== 'string' || /[^2-9]/.test(digits)) {
    throw new RangeError('Use a string containing digits 2 through 9');
  }
  if (digits.length === 0) return [];
  const result = [], path = [];
  function visit(index) {
    if (index === digits.length) { result.push(path.join('')); return; }
    for (const letter of letters[digits[index]]) {
      path.push(letter);
      visit(index + 1);
      path.pop();
    }
  }
  visit(0);
  return result;
}
console.log(letterCombinations('23')); //=> ['ad','ae','af','bd','be','bf','cd','ce','cf']
console.log(letterCombinations('')); //=> []
console.log(letterCombinations('7')); //=> ['p','q','r','s']`),
                    paragraph(
                        `For d digits, the number P of outputs is the product of each digit's branching factor, at most 4^d. Joining each completed path takes O(d), so time and stored output are O(d·P); auxiliary working space is O(d). In '23', the a-prefix produces ad, ae, af before the b-prefix begins. Compare the four patterns from this week: subsets choose include/exclude by index, permutations choose an unused index, combination sum chooses a nondecreasing candidate with decreasing remainder, and phone combinations choose a mapped letter by depth. Before coding, name state, allowed choices, completion, progress, and undo. Those five answers expose most bugs before a test does.`
                    ),
                    exercise(
                        'A Combination Sum solver recursively calls visit(i + 1, remaining - choices[i]). What contract does that implement instead? Why is pruning remaining < 0 unsafe when negative candidates are allowed?',
                        [
                            'Reusing an index is what permits repeated candidate use.',
                            'A future negative choice could change an overshoot.'
                        ],
                        'Advancing to i + 1 permits each candidate index at most once, so it loses valid repeated-use answers such as [2,2,3]. With negative candidates, an overshoot might later be repaired, and remaining need not decrease toward zero; both the positive-only pruning proof and termination argument fail.'
                    )
                ]
            }
        ]
    }
};
