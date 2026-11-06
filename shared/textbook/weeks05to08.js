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
          paragraph(`Imagine reading an expression from left to right. An opening parenthesis creates unfinished business: you cannot decide whether it is balanced until a later closing parenthesis arrives. If another opener appears first, that newer obligation must be resolved before the older one. This is exactly last in, first out, or LIFO. A stack is not defined by its storage layout but by its interface: push adds at the top, pop removes the top, and peek observes the top. In JavaScript an array with push, pop, and stack[stack.length - 1] is a natural implementation. End insertion is amortized constant time in the usual dynamic-array model; occasional backing-storage growth does not make a sequence of n pushes quadratic.`),
          paragraph(`The useful invariant for bracket matching is: the stack contains precisely the unmatched opening brackets in the prefix already read, in their opening order. A closer must match the top, because allowing it to match an earlier opener would cross the nesting structure. Counting openers and closers is insufficient: ([)] has the correct totals but the wrong order. Before processing a closer, check that an opener exists; pop on an empty JavaScript array returns undefined rather than throwing. After the scan, an empty stack means every obligation was discharged. This version ignores non-bracket characters, which makes it useful for expressions, but a problem restricted to bracket characters may instead reject other input.`),
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
          paragraph(`Notice the difference between time and peak storage. Each character is inspected once and each opener is pushed and popped at most once, so the scan takes O(n) time. A string consisting entirely of openers reaches stack height n, giving O(n) worst-case auxiliary space. Early rejection may take constant time, but that does not change the worst-case bound. The same reasoning applies to undo histories and expression parsing: save enough information to reverse or finish the most recent action. For undo, storing only the final value may be insufficient; an operation record may need the deleted text or previous position. For a minimum stack, keep a parallel stack of prefix minima so removing the current minimum exposes the earlier minimum without a rescan.`),
          exercise('Trace ([)] and explain exactly why the first closing bracket fails. Then give a different invalid string that passes every closer check but fails the final check.', ['Write the stack immediately before reading ).', 'Consider a string with only opening brackets.'], 'Before ), the stack is [(, [] in bottom-to-top notation: its top is [. The closer requires (, so it fails immediately. The string (( passes all closer checks because there are no closers, but leaves two unresolved openers and fails the final empty-stack check.'),
        ],
      },
      {
        id: 'w5-efficient-fifo-queues',
        title: 'Queues: process work in arrival order',
        blocks: [
          paragraph(`A queue answers a different question: which item has waited longest? First in, first out, or FIFO, is appropriate for a stream of jobs or level-order processing. Enqueue appends at the rear; dequeue removes from the front. Repeated array.shift() looks convenient, but under the standard array cost model each shift moves or reindexes the remaining elements. Draining n items can therefore cost n + (n - 1) + ... + 1, or O(n²). A head index avoids that repeated movement. The logical queue is the array suffix beginning at head, not the entire physical array. Clearing consumed slots also releases references so already-processed objects are not kept alive unnecessarily.`),
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
          paragraph(`Compaction occasionally copies the live suffix. Why is that acceptable? At compaction, at least half the array has been consumed, so the copied live entries are no more numerous than the dequeues since the preceding reset. Charge that copy to those dequeues and the amortized cost remains O(1) per operation. A single dequeue can still cost O(n); amortized does not mean every individual call is constant. This implementation bounds retained slots by the current queue size plus a small threshold. Without compaction, a head-index queue is still fast but its backing array can grow with total historical enqueues. Also, undefined is both a permitted value and the empty return value here: use size to distinguish those cases, or choose an interface that throws on empty.`),
          paragraph(`The syllabus also asks for a queue using stacks. Keep incoming items in one stack and outgoing items in another. Transfer incoming to outgoing only when outgoing is empty. Reversing arrival order once puts the oldest item on top. Transferring on every dequeue is unnecessary and can break order if outgoing still holds older items. Each item enters incoming once, moves to outgoing once, and leaves once; this gives O(1) amortized operations even though one transfer can take linear time. This is a good interview example of proving an aggregate bound rather than counting a nested loop mechanically.`),
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
          exercise('After enqueue A, enqueue B, dequeue, enqueue C, describe both stacks and the next two returned values.', ['The transfer happens only when outgoing is empty.', 'Incoming and outgoing can both be nonempty.'], 'After the dequeue returns A, outgoing contains B. Enqueuing C leaves incoming [C] and outgoing [B]. The next dequeue returns B without transferring. Only then does C transfer and return. The output order is A, B, C.'),
        ],
      },
      {
        id: 'w5-monotonic-stacks',
        title: 'Monotonic stacks: settle unresolved neighbors once',
        blocks: [
          paragraph(`Daily Temperatures asks how many days each temperature must wait for a strictly warmer day. A scan forward from every day repeats work and takes O(n²) in the worst case. Instead, keep indexes of days still waiting. When today's temperature exceeds the temperature of the top waiting day, today is that day's first warmer day: everything between them has already been seen without resolving it. Pop that index and record the distance. Continue popping because the same day can resolve several obligations. Store indexes rather than only temperatures because the answer requires distances and repeated values must remain distinct.`),
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
          paragraph(`The pending temperatures are nonincreasing from bottom to top. Equal temperatures stay pending because equal is not warmer; changing > to >= silently changes the problem. Every index is pushed exactly once and popped at most once, so the total while-loop work is O(n), not O(n²). The output and stack each require O(n) space; even excluding output, the stack may contain the whole input on a decreasing sequence. Recognize this pattern when a prompt asks for the nearest greater or smaller item to one side. First decide strictness, direction, and what a stack entry represents. A monotonic stack discards resolved candidates; an ordinary nesting stack merely tracks unfinished structure. Neither should be selected just because a prompt contains the word next.`),
          exercise('Predict the pending stack and answer for [80, 70, 70, 60]. Why is binary search unnecessary here?', ['No later value is strictly warmer.', 'Count pushes and pops across the entire run.'], 'All indexes remain pending, with temperatures [80,70,70,60], and the answer is [0,0,0,0]. We need first future greater values in original order, not a search in a sorted array. The stack resolves candidates in total linear time without sorting or binary search.'),
        ],
      },
    ],
  },
  6: {
    sections: [
      {
        id: 'w6-sorted-search-and-boundaries',
        title: 'Binary search: prove what can be discarded',
        blocks: [
          paragraph(`Binary search is a proof-driven shortcut. In an ascending array, a midpoint smaller than the target proves that every earlier value is also too small. That single comparison lets us discard an entire region. Without sorted order, the same comparison tells us nothing about the other positions. Before writing a loop, name the candidate interval and its endpoints. For an exact search below, [left, right] is closed: both endpoints are possible indexes. The loop runs while left <= right because a one-element interval still needs checking. Once a midpoint is ruled out, move beyond it; assigning left = middle can leave a one-element interval unchanged forever.`),
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
          paragraph(`Each iteration shrinks the number of candidates by roughly half. After k iterations there are at most about n / 2^k candidates, so only O(log n) comparisons are necessary. The iterative implementation stores a fixed number of indexes and uses O(1) auxiliary space. JavaScript bitwise midpoint shortcuts coerce numbers to signed 32-bit integers; Math.floor avoids that unnecessary limitation. Index arithmetic should remain within safe integer bounds. Also, binary search does not make an unsorted one-off lookup logarithmic: making a sorted copy already costs O(n log n), and returning an original index requires preserving index information. Sorting becomes worthwhile when many searches reuse the same ordered data.`),
          paragraph(`Finding any equal value is a different contract from finding the first equal value. Duplicates make an early equality return ambiguous. A lower bound returns the first index with value >= target, or n if none exists. Think of this as locating the transition from false to true in the predicate values[i] >= target. We use [left, right) as the unresolved element interval, initialized to [0, n). All indexes below left are known too small; all indexes at or above right are known large enough, with n acting as a sentinel insertion position. On a large-enough midpoint, retain it by setting right = middle. On a too-small midpoint, exclude it by setting left = middle + 1.`),
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
          paragraph(`The upper bound changes only the strictness: it finds the first value > target. The half-open range [lowerBound, upperBound) contains all equal values, so its length counts duplicates. To check membership from a lower bound, verify index < values.length before reading values[index] and testing equality. An insertion index of n is a valid answer, not an invalid search failure. Test empty arrays, a target below the minimum, a target above the maximum, all-equal input, and a one-element array. These are especially good at exposing a mixture of inclusive and exclusive endpoint conventions.`),
          exercise('For [2,2,2,4], calculate the lower and upper bounds of 2 and 3. Explain which bound Search Insert Position needs.', ['Upper bound excludes equality.', 'An absent value has equal lower and upper bounds.'], 'For 2, the bounds are 0 and 3, so there are three copies. For 3, both bounds are 3. Search Insert Position conventionally needs lowerBound: insert before any existing equal values and preserve ascending order.'),
        ],
      },
      {
        id: 'w6-rotated-sorted-arrays',
        title: 'Rotated search: identify the ordered half',
        blocks: [
          paragraph(`A rotated ascending array looks unsorted globally, yet retains useful local order. For distinct values, at least one half around the midpoint is sorted. In [4,5,6,7,0,1,2], the midpoint is 7 and the left half is sorted. If the target lies between the left endpoint and midpoint, keep that half; otherwise discard it. When the left half is not sorted, the right half is sorted, so use its endpoint range instead. The invariant remains that any target occurrence is inside the closed candidate interval. What changes is the evidence used to discard a half. Always check the midpoint for equality before excluding it from either range.`),
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
          paragraph(`Trace target 0: interval [0,6] has midpoint 3, value 7. The sorted left half spans values 4 through 7, which cannot contain 0, so left becomes 4. Now [4,6] has midpoint 5, value 1; its left half spans 0 through 1 and contains the target, so right becomes 4. The final comparison finds index 4. Each successful elimination halves the interval, yielding O(log n) time and O(1) space. Distinct values are a real precondition here. With duplicates, equal endpoint and midpoint values can hide the pivot; a duplicate-aware algorithm may have to shrink endpoints one at a time and degrade to O(n). Do not silently promise logarithmic performance for that different contract.`),
          exercise('Why does sorting a rotated array first fail to solve the original-index version directly?', ['What does sorting change besides order?', 'Compare the location of 0 before and after sorting.'], 'Sorting changes indexes: 0 is at original index 4 in [4,5,6,7,0,1,2] but at sorted index 0. It also spends O(n log n) work on a problem solvable in O(log n) under the distinct-value contract. Keeping original index pairs fixes identity but not that extra cost.'),
        ],
      },
      {
        id: 'w6-answer-space-search',
        title: 'Search answers with a monotonic feasibility test',
        blocks: [
          paragraph(`Koko Eating Bananas is not initially an array-search question. We seek the minimum integer eating speed that finishes all piles within a time limit. At speed k, a pile of p bananas requires ceil(p / k) hours because a partial final hour still counts and unused time cannot be transferred between piles. The feasibility predicate is monotonic: increasing speed never increases required hours. Speeds therefore form a false prefix followed by a true suffix. Binary search can find that boundary even though no array of speeds is ever constructed. This is the recognition step: replace minimum feasible answer with first true, then prove why feasibility stays true as the candidate grows.`),
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
          paragraph(`For [3,6,7,11] and eight hours, speed 6 needs 1+1+2+2 = 6 hours, so the answer is no larger than 6. Speed 3 needs 1+2+3+4 = 10, so the answer is larger than 3. Speed 5 needs eight hours and speed 4 also needs eight; the boundary is 4. The maximum pile is a feasible upper bound only when the number of available hours is at least the number of piles. Checking that precondition prevents a loop from returning an impossible answer. With n piles and maximum size M, there are O(log M) candidate checks, each O(n), giving O(n log M) time and O(1) auxiliary space. Avoid using Math.max(...piles) for arbitrarily large inputs because argument-count limits can fail before the algorithm begins.`),
          exercise('Explain why binary search cannot generally find the first speed whose required hours equal exactly eight.', ['Is an equality predicate monotonic?', 'The hours function can jump over a value.'], 'Equality can be false at slow speeds, true in a middle interval, and false again at fast speeds; it can also be absent entirely. Search requiredHours <= 8, which stays true at larger speeds, then inspect the boundary if exact equality matters.'),
        ],
      },
    ],
  },
