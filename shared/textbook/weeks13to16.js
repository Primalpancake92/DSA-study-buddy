// Syllabus authority: weekCatalog and moduleGuides in ../curriculum.js.
// Exercises below are original teaching practice, not additional source assignments.
// Hints and solutions are separate fields so the renderer can reveal them on demand.
export const chapters13to16 = {
  13: {
    sections: [
      {
        id: 'w13-greedy-proof',
        title: 'Greedy is a commitment that needs a proof',
        blocks: [
          { type: 'paragraph', text: 'Imagine choosing meetings for one room. You can inspect the whole schedule, but once you accept a meeting you will never reconsider it. That is the defining move of a greedy algorithm: make a local choice, discard alternatives, and continue on a smaller problem. The attractive part is the small amount of state. The dangerous part is the word discard. A solution is correct only if at least one optimal answer survives every discard. “This looks efficient” describes an implementation; it does not justify the choice. Start by naming the objective, such as maximum number of meetings, rather than assuming every scheduling problem asks the same question.' },
          { type: 'paragraph', text: 'For maximum meeting count, choose the compatible meeting that finishes earliest. Why does that work? Take an optimal schedule and call its first meeting O. Let G be an earliest-finishing meeting. Since G ends no later than O, replacing O with G leaves every subsequent meeting compatible. The replacement preserves the count. We have exhibited an optimal schedule beginning with our choice; apply the same argument to meetings starting after G finishes. This exchange argument proves the greedy step, and induction proves the complete algorithm. It assumes one room, equal value per meeting, and compatibility defined by endpoints. Weighted meetings need a different model because replacing an expensive meeting can lose value.' },
          { type: 'diagram', text: 'Half-open meetings [start,end): touching is compatible.\nA: [1----------------10)\nB:   [2--3)\nC:         [4--5)\nD:               [6--7)\nEarliest start chooses A: count 1.\nEarliest finish chooses B, C, D: count 3.\nExchange: replace the first optimal meeting with G; its earlier finish preserves the suffix.' },
          { type: 'code', code: `function selectMeetings(intervals) {
  const ordered = intervals.map(([start, end]) => [start, end])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const selected = [];
  let lastEnd = -Infinity;
  for (const meeting of ordered) {
    if (meeting[0] >= lastEnd) {
      selected.push(meeting);
      lastEnd = meeting[1];
    }
  }
  return selected;
}
console.log(JSON.stringify(selectMeetings([[1,10],[2,3],[4,5],[6,7]]))); //=> [[2,3],[4,5],[6,7]]
console.log(JSON.stringify(selectMeetings([[1,2],[2,3]]))); //=> [[1,2],[2,3]]
console.log(selectMeetings([]).length); //=> 0` },
          { type: 'paragraph', text: 'Trace the code as two pieces of state: selected contains a feasible schedule, and lastEnd is the endpoint of its final meeting. Sorting the example by finish gives [2,3], [4,5], [6,7], [1,10]. The first three pass the compatibility check and move lastEnd through 3, 5, 7; the long meeting fails because 1 < 7. Never update lastEnd after rejecting a meeting. That would let a discarded candidate constrain later choices. Numeric sorting is essential in JavaScript: default sort uses string comparisons. This version copies each pair before sorting so neither input order nor pair contents change. Sorting costs O(n log n), the scan O(n), and copied storage plus the returned schedule O(n); JavaScript engine sort workspace is additional implementation-dependent memory within the same overall linear storage allowance.' },
          { type: 'exercise', prompt: 'Warm-up: show that choosing the shortest duration is not a valid replacement for choosing the earliest finish. Construct three meetings where a uniquely shortest meeting blocks two compatible meetings.', hints: ['Make the short meeting cross the boundary between two longer meetings.', 'Try two meetings [0,3) and [3,6), then place a length-two meeting across time 3.'], solution: 'Use [0,3), [3,6), and [2,4). The length-two meeting [2,4) overlaps both others, so shortest-duration-first accepts only one. Earliest finish accepts [0,3) and [3,6), reaching two. Duration alone does not preserve an optimal suffix.' }
        ]
      },
      {
        id: 'w13-merge-intervals',
        title: 'Merging intervals maintains a frontier',
        blocks: [
          { type: 'paragraph', text: 'Merging asks for the union of covered regions, not the largest compatible subset. That changes both the sort key and the meaning of the answer. Sort by start so each new interval begins no earlier than the previous one. The final output interval is the active frontier: all earlier output intervals are finished forever. For closed intervals, [1,2] and [2,3] share point 2, so they merge. If a task models half-open reservations, touching reservations do not overlap, though a union representation may still coalesce adjacent coverage. State the requested representation explicitly. The following implementation uses closed intervals and merges touching endpoints.' },
          { type: 'code', code: `function mergeIntervals(intervals) {
  const ordered = intervals.map(([start, end]) => [start, end])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [];
  for (const [start, end] of ordered) {
    const last = merged[merged.length - 1];
    if (!last || start > last[1]) merged.push([start, end]);
    else last[1] = Math.max(last[1], end);
  }
  return merged;
}
console.log(JSON.stringify(mergeIntervals([[1,10],[2,3],[10,12],[15,18]]))); //=> [[1,12],[15,18]]
console.log(JSON.stringify(mergeIntervals([]))); //=> []` },
          { type: 'paragraph', text: 'On [1,10], [2,3], [10,12], [15,18], first create [1,10]. The nested interval [2,3] changes nothing: max(10,3) remains 10. The touching interval extends the frontier to 12. Start 15 is beyond 12, so append a separate interval. This trace exposes a classic bug: assigning last[1] = end would shrink [1,10] to [1,3], inventing a gap that never existed. The invariant is stronger than “the output looks sorted”: after each iteration, merged is a sorted, disjoint representation of precisely the union of the processed prefix. When there is a gap, no later interval can bridge backwards because later starts are at least the current start. When there is overlap, replacing the frontier endpoint with its maximum preserves exactly the union. That is the correctness argument.' },
          { type: 'paragraph', text: 'Assume every pair contains finite numeric endpoints with start <= end; validate or normalize malformed external data before applying the algorithm. Empty input naturally returns an empty union. Duplicate intervals collapse. Negative coordinates work because the comparison does not assume time begins at zero. The copied input and output use O(n) storage, while sorting dominates O(n log n) time. Resist the claim that the algorithm is constant-space just because the scan has two local names: the returned intervals and sorted copy both grow. If mutation is permitted, sorting the original can remove one copy, but it still does not erase output storage.' },
          { type: 'exercise', prompt: 'Debug and extend: explain why replacing the merge update with last[1] = end fails, give the smallest useful counterexample, and describe the comparison change if touching endpoints must remain separate.', hints: ['Use one interval completely inside another.', 'The branch that starts a new group controls whether equality is a gap.'], solution: 'With [[1,10],[2,3]], direct assignment produces [[1,3]], losing covered points such as 8. Use Math.max(last[1], end). To keep touching intervals separate, start a new output group when start >= last[1], subject to the task’s stated endpoint convention.' }
        ]
      },
      {
        id: 'w13-rooms-and-cookies',
        title: 'Count simultaneous demand; match scarce resources',
        blocks: [
          { type: 'paragraph', text: 'Minimum rooms is another interval problem with a different objective. You must serve every meeting, so rejecting overlaps is forbidden. The required room count equals peak simultaneous occupancy. Convert each positive-duration half-open meeting into a start event +1 and an end event -1. At a shared timestamp, process ends before starts because the departing meeting releases its room in time for the arriving one. A sweep then needs only current occupancy and its maximum. For closed occupancy, shared endpoints count together and the tie order reverses. Endpoint conventions are part of the algorithm, not a cosmetic detail to settle after coding.' },
          { type: 'code', code: `function minimumRooms(intervals) {
  const events = [];
  for (const [start, end] of intervals) {
    if (!(Number.isFinite(start) && Number.isFinite(end) && start < end)) {
      throw new RangeError('Meetings need finite start < end');
    }
    events.push([start, 1], [end, -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let active = 0;
  let peak = 0;
  for (const [, change] of events) {
    active += change;
    peak = Math.max(peak, active);
  }
  return peak;
}
function assignCookies(greed, cookies) {
  const children = [...greed].sort((a, b) => a - b);
  const sizes = [...cookies].sort((a, b) => a - b);
  let satisfied = 0;
  for (const size of sizes) {
    if (satisfied < children.length && size >= children[satisfied]) satisfied++;
  }
  return satisfied;
}
console.log(minimumRooms([[0,30],[5,10],[15,20]])); //=> 2
console.log(minimumRooms([[0,5],[5,10]])); //=> 1
console.log(assignCookies([1,2,3], [1,1])); //=> 1` },
          { type: 'paragraph', text: 'For the room example, occupancy after times 0, 5, 10, 15, 20, 30 is 1, 2, 1, 2, 1, 0. Any solution needs at least two rooms at time 5. Conversely, allocate a free room whenever a meeting begins; a third room could be needed only if three meetings were simultaneously active, contradicting the measured peak. This connects the lower bound to a feasible allocation, although the code returns a count rather than room identities. There are 2n events, so time is O(n log n) and storage O(n). For non-overlapping interval removal, retain the maximum compatible subset from the first section and subtract its size from n; duplicates are separate meetings and can contribute removals.' },
          { type: 'paragraph', text: 'Assign Cookies illustrates the same proof habit outside intervals. Sort children by minimum acceptable cookie size and cookies by size. Give the smallest adequate cookie to the least demanding remaining child. A too-small cookie cannot satisfy that child or any more demanding child, so discarding it is safe. Giving an adequate small cookie now preserves larger cookies for harder demands; an exchange with any successful assignment cannot reduce the number satisfied. With c children and k cookies, sorting costs O(c log c + k log k), the sweep O(k), and copied arrays O(c + k). Pattern recognition should end with this reason, not simply the observation that the input contains sorting. During review, ask which alternatives each decision removes, whether an optimal completion survives, and what tiny counterexample would defeat your proposed order.' },
          { type: 'exercise', prompt: 'Progression: trace rooms for [[1,4],[2,5],[4,6]], then explain whether the same code solves maximum compatible meetings or weighted meeting profit.', hints: ['At time 4, process the end event before the start event.', 'A room counter serves all meetings; a compatible-subset algorithm chooses some of them.'], solution: 'Occupancy goes 1,2,1,2,1,0, so two rooms suffice under half-open semantics. This does not return a maximum compatible subset and does not optimize profit. Those objectives require different state: earliest-finish selection for equal-value count, and typically weighted interval DP for profit.' }
        ]
      }
    ]
  },
  14: {
    sections: [
      {
        id: 'w14-state-and-memoisation',
        title: 'Dynamic programming starts with a sentence about state',
        blocks: [
          { type: 'paragraph', text: 'Recursion expresses a problem in terms of smaller questions. Dynamic programming becomes useful when different branches ask the same question repeatedly and its answer can be reused. Picture climbing a staircase with jumps of one or two stairs. To reach height n, the final jump came from n-1 or n-2. Asking those questions recursively duplicates work: both branches eventually ask about n-3. Memoisation stores the answer under a state key; tabulation evaluates states in an order that makes dependencies available. Neither technique repairs an incorrect state definition. Your first task is a sentence: ways(i) is the number of ordered jump sequences that climb exactly i stairs.' },
          { type: 'paragraph', text: 'Now derive the recurrence from disjoint final choices. Sequences ending with a one-step jump correspond exactly to sequences reaching i-1; sequences ending with a two-step jump correspond exactly to sequences reaching i-2. These categories cover every valid sequence and do not overlap, so ways(i) = ways(i-1) + ways(i-2). The base ways(0) = 1 counts the single empty sequence, which lets a final jump create a real sequence. A negative remaining height has zero ways. Choosing zero for ways(0) feels natural if you think “no stairs means no activity,” but it destroys the combinatorial identity. Bases describe mathematical objects, not how busy the person looks.' },
          { type: 'diagram', text: 'ways(5)\n├─ ways(4)\n│  ├─ ways(3)\n│  └─ ways(2)\n└─ ways(3)  ← same state as above\n   ├─ ways(2) ← repeated again\n   └─ ways(1)\nDependencies point toward smaller heights.\nTable height: 0  1  2  3  4  5\nTable ways:   1  1  2  3  5  8' },
          { type: 'code', code: `function climbingWaysMemo(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a nonnegative integer');
  const memo = new Map([[0, 1], [1, 1]]);
  function ways(height) {
    if (memo.has(height)) return memo.get(height);
    const result = ways(height - 1) + ways(height - 2);
    memo.set(height, result);
    return result;
  }
  return ways(n);
}
function climbingWaysTable(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a nonnegative integer');
  const dp = Array(n + 1).fill(0);
  dp[0] = 1;
  for (let height = 1; height <= n; height++) {
    dp[height] = dp[height - 1] + (height >= 2 ? dp[height - 2] : 0);
  }
  return dp[n];
}
console.log(climbingWaysMemo(5), climbingWaysTable(5)); //=> 8 8
console.log(climbingWaysTable(0)); //=> 1` },
          { type: 'paragraph', text: 'The memoised function evaluates each height once, with constant work after recursive dependencies return: O(n) time. Its Map and recursion stack each require O(n) space, and a sufficiently large n can overflow JavaScript’s call stack. Tabulation also costs O(n) time and table space but removes recursive calls. Since only the previous two heights are read, you can later retain two scalars. Do that after deriving the full table so you can explain what the old and new values mean. Number counts eventually exceed Number.MAX_SAFE_INTEGER; use BigInt for exact large counts, changing base values and arithmetic consistently. The examples deliberately use small counts so their numeric outputs are exact.' },
          { type: 'exercise', prompt: 'Warm-up: compute ways(4), list its jump sequences, and explain why counting unordered combinations would require a different recurrence or loop structure.', hints: ['The sequences [1,1,2] and [2,1,1] have different jump orders.', 'Group sequences by their final jump to check that none are missed.'], solution: 'The five sequences are [1,1,1,1], [1,1,2], [1,2,1], [2,1,1], and [2,2]. The recurrence counts ordered sequences because it chooses a final jump. Unordered combinations must avoid separately counting permutations of the same collection of jumps.' }
        ]
      },
      {
        id: 'w14-stair-cost',
        title: 'Minimum stair cost: define where payment happens',
        blocks: [
          { type: 'paragraph', text: 'Switch the question from “how many ways?” to “what is the cheapest way?” The dependency graph can remain similar while the aggregation changes from addition to minimum. For stair costs, define dp[i] as the minimum cost already paid to arrive at position i, where i = cost.length is the top beyond the final stair. You may begin at position 0 or 1 for free, and pay cost[j] when leaving stair j. Therefore dp[0] = dp[1] = 0. Every route arriving at i >= 2 last left either i-1 or i-2, giving dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]). This state avoids ambiguity about whether a stored cost includes the current stair.' },
          { type: 'code', code: `function minCostClimbingStairs(cost) {
  let twoBack = 0; // dp[0]
  let oneBack = 0; // dp[1]
  for (let position = 2; position <= cost.length; position++) {
    const current = Math.min(oneBack + cost[position - 1],
      twoBack + cost[position - 2]);
    twoBack = oneBack;
    oneBack = current;
  }
  return oneBack;
}
console.log(minCostClimbingStairs([10,15,20])); //=> 15
console.log(minCostClimbingStairs([1])); //=> 0
console.log(minCostClimbingStairs([])); //=> 0` },
          { type: 'paragraph', text: 'Trace [10,15,20] using positions, not only costs. At position 2, min(0+15, 0+10) is 10, corresponding to leaving stair 0 and jumping two positions. At the top, position 3, min(10+20, 0+15) is 15, corresponding to starting at stair 1 and jumping directly to the top. Stepping on both indices 0 and 2 would pay 30, so it cannot explain the answer 15. Empty and singleton arrays return zero under the stated start-at-0-or-1 convention. If a different prompt forces a start on stair 0, the base changes; copying a recurrence without copying its contract is a common source of plausible wrong answers.' },
          { type: 'paragraph', text: 'Correctness follows by induction over position. The two bases are free legal starts. Assuming both earlier costs are optimal, every final route belongs to one of the two predecessor cases, and adding the departure cost constructs a legal route in that case. Taking the minimum therefore considers all possibilities and chooses an optimal route. Before an iteration, twoBack and oneBack mean dp[i-2] and dp[i-1]. Compute current before overwriting either; then shift the pair. Assigning twoBack first and computing afterward would read dp[i-1] twice. The loop does O(n) arithmetic operations and retains O(1) auxiliary storage. Compression loses the predecessor history, so return to a table or record decisions if the question asks for the actual path.' },
          { type: 'exercise', prompt: 'Practice: trace [1,100,1,1,1], recording dp[0] through dp[5]. Then explain how you would reconstruct one optimal route rather than only its cost.', hints: ['The table begins 0,0. Each cell compares paying to leave one of its two predecessors.', 'Store which predecessor wins at each position, then walk backwards from the top.'], solution: 'The costs are [0,0,1,2,2,3], so the answer is 3. Record a predecessor for every computed position, choosing a consistent rule on ties. Follow predecessor links from 5 to a free starting position and reverse that sequence. The full table and predecessors use O(n) space.' }
        ]
      },
      {
        id: 'w14-house-robber',
        title: 'House Robber: choosing a prefix without forgetting a constraint',
        blocks: [
          { type: 'paragraph', text: 'House Robber asks for maximum value from nonadjacent houses. Greedily taking the largest visible amount can block two amounts whose sum is larger. DP works because you can summarize an entire prefix by its best achievable value, provided the transition handles adjacency. Let best[i] mean the best value obtainable from the first i houses. This is a prefix length, so the next house has index i-1. Either skip that house and retain best[i-1], or take it and add its value to best[i-2]. These alternatives give best[i] = max(best[i-1], best[i-2] + values[i-1]). With nonnegative amounts and permission to take nothing, best[0] = 0. The code below also permits negative values by allowing the empty selection.' },
          { type: 'code', code: `function robHouses(values) {
  let twoBack = 0;
  let oneBack = 0;
  for (const value of values) {
    const current = Math.max(oneBack, twoBack + value);
    twoBack = oneBack;
    oneBack = current;
  }
  return oneBack;
}
console.log(robHouses([2,7,9,3,1])); //=> 12
console.log(robHouses([4,5,4])); //=> 8
console.log(robHouses([-3,-1])); //=> 0` },
          { type: 'paragraph', text: 'For [2,7,9,3,1], best after each prefix is 0, 2, 7, 11, 11, 12. At the third house, taking 9 combines with the first house’s best 2, yielding 11. At the fourth, taking 3 combines with the first two houses’ best 7, yielding 10, so skipping wins. At the fifth, 1 combines with 11 from the first three houses and reaches 12. The proof partitions optimal selections by whether they contain the final house; taking it excludes exactly its neighbor, leaving an independent smaller prefix. There are n states with constant transition work, so O(n) time and O(1) auxiliary space. Circular houses break the original independence across the two ends; solve two linear ranges excluding one endpoint at a time. That extension illustrates why a state is correct only relative to its constraints.' },
          { type: 'exercise', prompt: 'Debugging: a learner updates oneBack = max(oneBack, twoBack + value), then twoBack = oneBack. Find a failing input and explain the lost invariant.', hints: ['Both variables now store the new prefix value after each iteration.', 'Try two adjacent positive houses, where taking both is illegal.'], solution: 'On [2,3], the first iteration makes both variables 2, so the second computes max(2,2+3)=5 instead of 3. twoBack must receive the OLD oneBack. Compute a temporary current, shift twoBack = oneBack, then assign oneBack = current.' }
        ]
      },
      {
        id: 'w14-coin-change',
        title: 'Coin Change: unreachable states and transition direction',
        blocks: [
          { type: 'paragraph', text: 'For minimum coins with unlimited reuse, dp[a] means the fewest coins forming exactly amount a. The empty amount needs zero coins; a positive amount starts unreachable, represented by Infinity. If the last coin is c, the remaining amount is a-c, so dp[a] = min over eligible c of dp[a-c] + 1. Only positive integer denominations are accepted: zero would introduce a self-dependency and negative denominations would destroy the order. Unlike a greedy coin picker, this recurrence checks every possible final denomination. With coins [1,3,4] and amount 6, greedy takes 4+1+1, whereas DP discovers 3+3. Optimal substructure does not imply that a locally largest coin is safe.' },
          { type: 'code', code: `function minimumCoins(coins, amount) {
  if (!Number.isInteger(amount) || amount < 0 ||
      coins.some(c => !Number.isInteger(c) || c <= 0)) {
    throw new RangeError('Use a nonnegative integer amount and positive integer coins');
  }
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a) dp[a] = Math.min(dp[a], dp[a - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
console.log(minimumCoins([1,3,4], 6)); //=> 2
console.log(minimumCoins([2], 3)); //=> -1
console.log(minimumCoins([], 0)); //=> 0` },
          { type: 'paragraph', text: 'The table for amounts 0 through 6 is [0,1,2,1,1,2,2]. At 6, final coin 1 gives dp[5]+1=3, coin 3 gives dp[3]+1=2, and coin 4 gives dp[2]+1=3. Increasing amounts ensure all smaller dependencies are ready. Correctness again partitions solutions by their final choice; an unreachable predecessor remains Infinity after adding one and cannot falsely improve a state. With A as the target and k coin entries, time is O(Ak) and space O(A). This is pseudo-polynomial: A is a numeric value, which may be enormous even when its written representation is short. Memoisation might visit fewer reachable amounts, but does not guarantee small work for large targets.' },
          { type: 'paragraph', text: 'Build a DP debugging checklist from meaning rather than syntax. Ask whether each state represents an exact amount or a maximum budget; whether a transition counts possibilities or chooses a best one; whether using the same item again is permitted; and whether zero represents a legitimate answer or an uncomputed value. Use Map.has for memo entries whose answers may be zero. In a 0/1 selection table compressed by capacity, descending capacity prevents reusing the current item; an ascending pass deliberately permits reuse. That is a dependency decision, not a memorized loop trick. Before optimizing memory, draw arrows between states and verify that every needed old value survives until it is read.' },
          { type: 'exercise', prompt: 'Challenge: for coins [2,5] and target 7, give the relevant dp values and explain why initializing every state to zero produces incorrect results. How would you return the chosen coins?', hints: ['Amounts 1 and 3 cannot be formed at all.', 'Alongside dp[a], store a coin only when that coin strictly improves the answer.'], solution: 'dp[0]=0, dp[1]=Infinity, dp[2]=1, dp[3]=Infinity, dp[4]=2, dp[5]=1, dp[6]=3, dp[7]=2. Zero initialization invents free ways to form impossible positive amounts. Store a winning final coin per reachable amount; subtract it repeatedly from 7 to reconstruct [2,5] or [5,2].' }
        ]
      }
    ]
  },
  15: {
    sections: [
      {
        id: 'w15-grid-dependencies',
        title: 'Grid DP: a table is a dependency graph',
        blocks: [
          { type: 'paragraph', text: 'A two-dimensional table is useful when two coordinates are necessary to identify a subproblem. For monotonic grid paths, define paths[r][c] as the number of ways to reach cell (r,c) from (0,0), moving only right or down. Every arrival except the starting cell comes from above or left. Those final moves are mutually exclusive, so paths[r][c] = paths[r-1][c] + paths[r][c-1], with missing neighbors contributing zero. An unobstructed start has one way to be reached: the empty path. Along the first row or column there is only one route because only one predecessor exists. This explains the boundary values instead of treating them as special numbers to memorize.' },
          { type: 'diagram', text: '3 × 3 monotonic path counts\n        c=0 c=1 c=2\nr=0      1   1   1\nr=1      1   2   3\nr=2      1   3   6\nEach cell receives: above ↓ plus left →\nBefore updating compressed dp[c]: dp[c] is ABOVE.\nAfter updating dp[c-1]: dp[c-1] is LEFT on the current row.\nNo diagonal arrow exists in this movement contract.' },
          { type: 'code', code: `function uniquePaths(rows, columns) {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 0 || columns < 0) {
    throw new RangeError('Dimensions must be nonnegative integers');
  }
  if (rows === 0 || columns === 0) return 0;
  const dp = Array(columns).fill(1);
  for (let row = 1; row < rows; row++) {
    for (let column = 1; column < columns; column++) {
      dp[column] += dp[column - 1];
    }
  }
  return dp[columns - 1];
}
function pathsWithObstacles(grid) {
  if (grid.length === 0 || grid[0].length === 0) return 0;
  const columns = grid[0].length;
  if (grid.some(row => row.length !== columns)) throw new RangeError('Rectangular grid required');
  const dp = Array(columns).fill(0);
  dp[0] = 1;
  for (let row = 0; row < grid.length; row++) {
    for (let column = 0; column < columns; column++) {
      if (grid[row][column] === 1) dp[column] = 0;
      else if (column > 0) dp[column] += dp[column - 1];
    }
  }
  return dp[columns - 1];
}
console.log(uniquePaths(3, 3)); //=> 6
console.log(uniquePaths(1, 5), uniquePaths(0, 5)); //=> 1 0
console.log(pathsWithObstacles([[0,0,0],[0,1,0],[0,0,0]])); //=> 2
console.log(pathsWithObstacles([[1]])); //=> 0` },
          { type: 'paragraph', text: 'For the obstacle grid, the compressed row begins [1,0,0], becomes [1,1,1] after row zero, [1,0,1] after the blocked middle cell resets its value, and [1,1,2] after the final row. Resetting is necessary: leaving the old value would let paths travel through the blocked cell. The invariant before an update is that dp[c] still counts paths from above, while dp[c-1] already counts paths from the left on the current row. Thus left-to-right traversal implements the original recurrence exactly. A right-to-left pass would read a left neighbor from the previous row and count a different graph. Correctness follows by induction in row-major order, since every legal predecessor has already been accounted for.' },
          { type: 'paragraph', text: 'Both algorithms perform O(RC) work and use O(C) auxiliary space. The input grid is not copied or modified. Counts use Number and are exact only while they remain safe integers; BigInt is appropriate for much larger grids. Compression is an optional representation change after the two-dimensional model is established. If you need an actual path or need to inspect every intermediate answer for debugging, retaining the full table may be the clearer trade-off. Create independent rows with Array.from, not Array(rows).fill(sharedRow): the latter makes every row reference the same array, so writing one cell silently changes multiple apparent rows.' },
          { type: 'exercise', prompt: 'Warm-up: trace pathsWithObstacles on [[0,1,0],[0,0,0]]. Why does the first row become [1,0,0], and what changes if the starting cell is blocked?', hints: ['A cell to the right of a first-row obstacle has no path arriving from above.', 'The blocked-cell branch runs at the start as well as elsewhere.'], solution: 'The first row is [1,0,0] because the obstacle removes the only route along that row. The second row becomes [1,1,1], so there is one path. If the start is blocked, dp[0] resets to zero before any propagation, and every later count remains zero.' }
        ]
      },
      {
        id: 'w15-subsequence-dp',
        title: 'Longest Common Subsequence: two prefixes, two choices',
        blocks: [
          { type: 'paragraph', text: 'A subsequence preserves order while permitting gaps. A substring must be contiguous. For “abcde” and “ace”, the longest common subsequence is “ace” with length three; it is not a substring of the first string. A grid state now represents two prefix lengths rather than physical coordinates: dp[i][j] is the LCS length of the first i symbols of A and the first j symbols of B. Empty prefixes have length zero. If their final symbols match, an optimal subsequence can use that match, giving dp[i-1][j-1]+1. If they differ, a common subsequence cannot use both final symbols, so discard one endpoint: max(dp[i-1][j], dp[i][j-1]). The max is over alternatives, not a sum of counts.' },
          { type: 'code', code: `function longestCommonSubsequence(first, second) {
  const a = Array.from(first);
  const b = Array.from(second);
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.push(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return { length: dp[a.length][b.length], sequence: result.reverse().join('') };
}
console.log(JSON.stringify(longestCommonSubsequence('abcde', 'ace'))); //=> {"length":3,"sequence":"ace"}
console.log(JSON.stringify(longestCommonSubsequence('', 'abc'))); //=> {"length":0,"sequence":""}` },
          { type: 'paragraph', text: 'Trace A = “ab”, B = “ac”. With an empty-prefix border, row zero is [0,0,0]. Row “a” is [0,1,1]: matching the first a extends the diagonal zero, then comparing a with c retains the best neighbor. Row “ab” is also [0,1,1], because neither new comparison yields another match. Reconstruction starts at the bottom-right; on mismatch follow a neighbor holding the retained optimum, and on a match record the symbol and move diagonally. Reverse the recorded symbols because traversal proceeds backwards. Ties can lead to different equally long sequences. Tests should require the correct length and valid subsequence membership, rather than assuming a unique answer when none was promised.' },
          { type: 'paragraph', text: 'For matching endpoints, there is an optimum using those endpoints: an LCS of the shorter prefixes can be extended by the shared symbol, and removing the shared final match from an optimum leaves a solution bounded by the shorter-prefix optimum. For unequal endpoints, at least one must be unused, giving the two skip cases. Induction over prefix lengths proves the table. With m and n symbols, time and table space are O(mn), plus symbol arrays and reconstruction storage. If only length is needed, a row can be compressed, but the old diagonal must be saved before overwriting it. Array.from uses Unicode code points; it does not treat a combined emoji or accented grapheme as one human-perceived character. Define the text model when that distinction matters.' },
          { type: 'exercise', prompt: 'Practice: for “abc” and “ac”, explain why setting a mismatch cell to zero solves the wrong problem. Then state the three old values needed by a one-row LCS implementation.', hints: ['A subsequence can keep the earlier a while skipping b.', 'The dependencies are above, left, and diagonal, with two belonging to the previous row.'], solution: 'Resetting on mismatch discards a valid subsequence across a gap; such a reset belongs to longest common substring DP. LCS retains max(above,left). Compression needs old dp[j] from above, updated dp[j-1] from the left, and a saved old dp[j-1] from the previous-row diagonal.' }
        ]
      },
      {
        id: 'w15-trie-internals',
        title: 'Tries share prefixes but distinguish complete words',
        blocks: [
          { type: 'paragraph', text: 'A trie stores a dictionary by sharing the work of reading common prefixes. Each edge consumes one symbol and each node holds a map from the next symbol to a child. Inserting “app” and “apple” shares three edges; an end marker at the node after the second p records that “app” is independently a word. A path existing is enough for startsWith, but search must also check that marker. A Set is often simpler for exact membership; a trie earns its structure when prefix queries or incremental traversal matter. Unlike a balanced search tree, its search path follows the query’s symbols rather than comparing complete dictionary words.' },
          { type: 'code', code: `class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
  }
}
class Trie {
  constructor() { this.root = new TrieNode(); }
  insert(word) {
    let node = this.root;
    for (const character of word) {
      if (!node.children.has(character)) node.children.set(character, new TrieNode());
      node = node.children.get(character);
    }
    node.isWord = true;
  }
  findNode(text) {
    let node = this.root;
    for (const character of text) {
      if (!node.children.has(character)) return null;
      node = node.children.get(character);
    }
    return node;
  }
  search(word) {
    const node = this.findNode(word);
    return node !== null && node.isWord;
  }
  startsWith(prefix) { return this.findNode(prefix) !== null; }
}
const dictionary = new Trie();
dictionary.insert('apple');
console.log(dictionary.search('app'), dictionary.startsWith('app')); //=> false true
dictionary.insert('app');
console.log(dictionary.search('app'), dictionary.search('apple')); //=> true true
dictionary.insert('');
console.log(dictionary.search(''), dictionary.startsWith('')); //=> true true
console.log(dictionary.search('apply')); //=> false` },
          { type: 'paragraph', text: 'Follow insert(“apple”) from the root: missing a creates a node, then p, another p, l, and e create further nodes; only the e node becomes a complete word. Searching “app” reaches a node but returns false until insert(“app”) marks it. Duplicate insertion reuses the existing path and leaves the same Boolean marker, so membership is idempotent. The empty prefix always exists at the root. The empty word exists only after insertion explicitly marks the root. Search and insertion take expected O(L) time under the usual Map access assumption, where L is the number of query code points. A lookup uses O(1) traversal state; insertion may allocate O(L) nodes. Total nodes are O(S+1) for S inserted characters, with per-node object and Map overhead that can matter in JavaScript.' },
          { type: 'exercise', prompt: 'Debugging: after inserting “car” and “cart”, a search implementation returns Boolean(findNode(query)). Which incorrect answer does it produce? Explain how to delete “car” without damaging “cart”, without requiring deletion code.', hints: ['Find a path that exists but was never marked as a word.', 'Removing a terminal marker and removing a subtree are different operations.'], solution: 'It wrongly accepts “ca” as a word because that path exists. Search must require isWord. Deleting “car” first clears its terminal marker; keep its node because the t child leads to “cart”. Prune upwards only while nodes are neither terminal nor parents of surviving children.' }
        ]
      },
      {
        id: 'w15-word-search-state',
        title: 'Word Search: when coordinates alone are insufficient',
        blocks: [
          { type: 'paragraph', text: 'Word Search provides a useful boundary for this week’s ideas. On a board with orthogonal moves and no cell reuse within one word, the future depends on the current cell, the next word position, and which cells the current path already used. Memoising only (row,column,index) can merge histories with different available cells and give a wrong answer. This is backtracking unless you explicitly include the visited set in the state. A trie can prune impossible prefixes when searching many dictionary words, but it does not remove the no-reuse rule. The single-word version below keeps path membership in a Set and undoes each choice before exploring a sibling.' },
          { type: 'code', code: `function wordExists(board, word) {
  const letters = Array.from(word);
  if (letters.length === 0) return true;
  if (board.length === 0 || board[0].length === 0) return false;
  const rows = board.length;
  const columns = board[0].length;
  if (board.some(row => row.length !== columns)) throw new RangeError('Rectangular board required');
  const used = new Set();
  function visit(row, column, index) {
    if (row < 0 || row >= rows || column < 0 || column >= columns) return false;
    const key = row * columns + column;
    if (used.has(key) || board[row][column] !== letters[index]) return false;
    if (index === letters.length - 1) return true;
    used.add(key);
    const found = visit(row + 1, column, index + 1) || visit(row - 1, column, index + 1) ||
      visit(row, column + 1, index + 1) || visit(row, column - 1, index + 1);
    used.delete(key);
    return found;
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (visit(row, column, 0)) return true;
    }
  }
  return false;
}
const board = [['A','B'],['C','D']];
console.log(wordExists(board, 'ABD')); //=> true
console.log(wordExists(board, 'ABA')); //=> false
console.log(wordExists(board, 'AD')); //=> false` },
          { type: 'paragraph', text: 'For “ABD”, start at A, mark it, move right to B, then down to D. For “ABA”, the return to A is rejected because its key is still in used. For “AD”, diagonal movement is never generated. The function assumes each board cell contains one symbol under the chosen code-point model. A loose upper bound is O(RC·4^L) time for word length L; excluding immediate return edges gives a tighter branching bound after the first step. Auxiliary Set and recursion space are O(min(L,RC)). No global visited set should survive across starting cells: a cell forbidden on one candidate path is legal on another. This distinction between history-dependent search and reusable DP state is more valuable than forcing every grid problem into a table.' },
          { type: 'exercise', prompt: 'Challenge: explain why removing used.delete(key) can reject valid searches, and describe how a trie would change the search for many words without changing path membership.', hints: ['A failed branch must release its cells before a sibling branch tries them.', 'Carry a trie node along the board path and stop when the next character has no child.'], solution: 'Without undo, cells from failed branches remain unavailable even though the current path no longer contains them. A multiword search advances a trie node at each board character, emits words at terminal nodes, and prunes missing children. It still maintains and undoes a path-local used set to forbid cell reuse.' }
        ]
      }
    ]
  },
  16: {
    sections: [
      {
        id: 'w16-problem-solving-contract',
        title: 'A practical routine for an unfamiliar problem',
        blocks: [
          { type: 'paragraph', text: 'Consolidation means making decisions when the problem title does not announce a pattern. Start with the observable contract: what comes in, what must come out, and which choices are legal? Clarify empty input, duplicates, whether ordering matters, whether you may mutate data, and the size limits. Then work a tiny example and a boundary case by hand. Give a correct brute-force approach even if it is too slow; it establishes what an answer means and gives a reference for later tests. Improve the repeated operation, not the appearance of the code. An optimization is useful only when its invariant still matches the contract.' },
          { type: 'paragraph', text: 'Suppose the prompt asks for the longest contiguous substring without repeated characters. “Contiguous” rules out an arbitrary subsequence. Trying every start and extending until a duplicate is a correct quadratic baseline. Repetition occurs because neighboring starts rescan many of the same characters. A sliding window summarizes a currently valid contiguous range, and a last-seen map tells us how far its left boundary must move when a duplicate arrives. Before coding, say the invariant aloud: the active range has no repeated symbols, and left never moves backwards. These sentences tell you both what to store and what kind of update would be wrong.' },
          { type: 'diagram', text: 'Clarify contract → hand examples → correct baseline\n                                     ↓\n                       identify repeated expensive work\n                                     ↓\n                     choose state + state the invariant\n                                     ↓\n                      prove updates → code → challenge\n                                     ↓\n                       time / space / trade-offs / review\nWhen a counterexample breaks the invariant, return to the model.' },
          { type: 'code', code: `function longestUniqueSubstring(text) {
  const symbols = Array.from(text);
  const lastSeen = new Map();
  let left = 0;
  let bestStart = 0;
  let bestLength = 0;
  for (let right = 0; right < symbols.length; right++) {
    const symbol = symbols[right];
    if (lastSeen.has(symbol)) left = Math.max(left, lastSeen.get(symbol) + 1);
    lastSeen.set(symbol, right);
    if (right - left + 1 > bestLength) {
      bestLength = right - left + 1;
      bestStart = left;
    }
  }
  return { length: bestLength, substring: symbols.slice(bestStart, bestStart + bestLength).join('') };
}
console.log(JSON.stringify(longestUniqueSubstring('abba'))); //=> {"length":2,"substring":"ab"}
console.log(JSON.stringify(longestUniqueSubstring('pwwkew'))); //=> {"length":3,"substring":"wke"}
console.log(JSON.stringify(longestUniqueSubstring(''))); //=> {"length":0,"substring":""}` },
          { type: 'paragraph', text: 'Trace “abba” as (right,symbol,left,length): (0,a,0,1), (1,b,0,2), (2,b,2,1), (3,a,2,2). On the last a, its earlier occurrence is at index zero, outside the active window. The maximum prevents left from moving backwards to one, which would incorrectly include both b characters. When a duplicate is inside the window, removing everything through its previous position is necessary, and the remaining suffix is valid because the old window was already unique. For each right endpoint, this retains the earliest valid left boundary, hence the longest valid substring ending there. Taking the largest such length finds the global optimum. This is the proof, not merely a trace of one successful input.' },
          { type: 'paragraph', text: 'Under expected constant-time Map operations, the scan is O(n). The symbol array and map use O(n) space, and materializing the returned substring also costs up to O(n). If the contract guarantees ASCII, indexing the original string avoids the symbol copy; if it requires human-perceived characters, code points may be insufficient and segmentation must change. Record this trade-off precisely. Do not call the solution constant-space just because an interview platform uses a fixed alphabet unless you state that alphabet assumption. When returning an example rather than only a length, clarify tie handling: strict improvement here retains the earliest maximum window.' },
          { type: 'exercise', prompt: 'Warm-up mock: explain the “abba” failure when left = lastSeen.get(symbol) + 1 is used without Math.max. Give a concise invariant and corrected update before looking at the implementation.', hints: ['At the final a, the stored index refers to a symbol outside the current window.', 'A valid left boundary can move forward or stay still, but never move backward.'], solution: 'After the second b, left is 2. The final a has lastSeen index 0, so unconditional assignment moves left to 1 and invents window “bba” of length 3. Keep left = Math.max(left, previous + 1). The active window remains unique, and every discarded earlier start is invalid for the current endpoint.' }
        ]
      },
      {
        id: 'w16-anagram-and-query-tradeoffs',
        title: 'Choose a representation that answers the question',
        blocks: [
          { type: 'paragraph', text: 'Valid Anagram is a useful short explanation exercise because several correct approaches have different trade-offs. Sorting both strings compares canonical order at O(n log n) time. A frequency map records the multiplicity of each symbol in expected O(n) time. A Set loses multiplicity: “aab” and “abb” have the same distinct symbols but are not anagrams. This is a representation decision before it is a loop decision. Ask whether case, spaces, and Unicode normalization matter. The implementation below compares exact code-point multiplicities, preserving case and punctuation. It does not silently transform the input into a different problem.' },
          { type: 'code', code: `function isAnagram(first, second) {
  const counts = new Map();
  for (const symbol of first) counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
  for (const symbol of second) {
    const remaining = counts.get(symbol);
    if (remaining === undefined) return false;
    if (remaining === 1) counts.delete(symbol);
    else counts.set(symbol, remaining - 1);
  }
  return counts.size === 0;
}
function buildRangeSum(values) {
  const prefix = [0];
  for (const value of values) prefix.push(prefix[prefix.length - 1] + value);
  return function sum(left, rightExclusive) {
    if (!Number.isInteger(left) || !Number.isInteger(rightExclusive) ||
        left < 0 || rightExclusive > values.length || left > rightExclusive) {
      throw new RangeError('Use 0 <= left <= rightExclusive <= length');
    }
    return prefix[rightExclusive] - prefix[left];
  };
}
console.log(isAnagram('aab', 'aba'), isAnagram('aab', 'abb')); //=> true false
console.log(isAnagram('', '')); //=> true
const sum = buildRangeSum([3,-2,5,1]);
console.log(sum(1, 3), sum(0, 4), sum(2, 2)); //=> 3 7 0` },
          { type: 'paragraph', text: 'The anagram invariant says counts holds the unmatched surplus from the first string after processing a prefix of the second. Deleting zero counts makes an empty map exactly mean no surplus remains. A missing symbol proves the second string asks for more than the first contains, so early rejection is safe. For lengths n and m, time is O(n+m) expected and storage O(k) distinct symbols. Different raw UTF-16 lengths need not be separately checked because matching counts already detects extra symbols. This avoids mixing code-unit length checks with code-point iteration. Canonically equivalent accented strings still require explicit normalization if the product contract treats them as equal.' },
          { type: 'paragraph', text: 'Repeated range-sum queries illustrate another consolidation question: are you solving one query or many? A scan takes O(length of range) per query and needs constant extra state. For a fixed array with many queries, prefix[i] stores the sum of its first i entries; the half-open range [left,right) is prefix[right] - prefix[left]. The example query [1,3) computes (-2)+5=3. Preprocessing costs O(n) time and space, then each query O(1), so q queries total O(n+q). This representation is a snapshot: later array changes are not incorporated. Updates would demand rebuilding or a different structure. Constraints and workload determine whether preprocessing is worthwhile; faster query time alone is not a complete comparison.' },
          { type: 'exercise', prompt: 'Practice: a fixed array has 100,000 entries and 100,000 sum queries. Compare repeated scans with prefix sums. Then give a workload change that invalidates the prefix snapshot.', hints: ['Count total work over all queries rather than describing only one query.', 'The returned closure reads the precomputed sums; it does not recompute after updates.'], solution: 'Worst-case repeated scans take O(nq), potentially about 10 billion additions. Prefix sums take O(n+q) time and O(n) space. If entries change between queries, the snapshot becomes stale; rebuild after changes or select a data structure supporting updates and range queries.' }
        ]
      },
      {
        id: 'w16-islands-model-and-implementation',
        title: 'Number of Islands: turn a picture into a graph',
        blocks: [
          { type: 'paragraph', text: 'For Number of Islands, do not begin with the phrase “use DFS.” First define the graph: each land cell is a vertex, and orthogonally adjacent land cells share an edge. An island is a connected component. Scanning the grid finds a component’s first unvisited land cell; traversing all reachable land marks that component so it is never counted again. Diagonal contact is irrelevant under this contract. If mutation is forbidden, keep a visited set. If mutation is allowed, replacing visited land with water can save that set but changes the caller’s data. The implementation below preserves input and uses an explicit stack to avoid recursion-depth failures on a long narrow island.' },
          { type: 'code', code: `function numberOfIslands(grid) {
  if (grid.length === 0) return 0;
  const rows = grid.length;
  const columns = grid[0].length;
  if (grid.some(row => row.length !== columns)) throw new RangeError('Rectangular grid required');
  const visited = new Set();
  const directions = [[1,0],[-1,0],[0,1],[0,-1]];
  let islands = 0;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const key = row * columns + column;
      if (grid[row][column] !== '1' || visited.has(key)) continue;
      islands++;
      const stack = [[row, column]];
      visited.add(key);
      while (stack.length > 0) {
        const [r, c] = stack.pop();
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= columns) continue;
          const nextKey = nr * columns + nc;
          if (grid[nr][nc] !== '1' || visited.has(nextKey)) continue;
          visited.add(nextKey);
          stack.push([nr, nc]);
        }
      }
    }
  }
  return islands;
}
console.log(numberOfIslands([['1','1','0'],['0','1','0'],['1','0','1']])); //=> 3
console.log(numberOfIslands([['1','0'],['0','1']])); //=> 2
console.log(numberOfIslands([])); //=> 0` },
          { type: 'paragraph', text: 'Trace the first board: starting at (0,0) increments the count to one and reaches (0,1) and (1,1). Later scanning those cells does nothing because they are visited. Cell (2,0) starts component two; (2,2) starts component three. Marking at push time prevents two neighbors from scheduling the same cell twice. Correctness has two parts: traversal never leaves the starting component because every move follows a land edge, and it eventually reaches every cell in that component because all available neighbors are explored. The outer scan therefore counts each component exactly once. At most RC vertices and four edges per vertex are examined, giving O(RC) time and O(RC) auxiliary storage in the worst case.' },
          { type: 'exercise', prompt: 'Challenge mock: change the contract to eight-direction adjacency. State the minimal algorithm change, predict the result for the diagonal two-land-cell example, and explain why a row-only running count is insufficient.', hints: ['The graph definition determines the neighbor list.', 'A component can wind through multiple rows and reconnect apparently separate runs.'], solution: 'Add the four diagonal offsets to directions. The board [[“1”,“0”],[“0”,“1”]] then has one island. A row-only count can count separate runs that later connect through another row, so it does not preserve component identity. DFS still works because its reachability invariant follows the updated graph edges.' }
        ]
      },
      {
        id: 'w16-mocks-debugging-and-review',
        title: 'Practice the whole explanation, including recovery',
        blocks: [
          { type: 'paragraph', text: 'Make the clock useful with a concrete recovery script. At minute three of a unique-substring mock, say: “For each start, I can grow a Set until I find a duplicate; that is correct because any longer substring from that start still contains the duplicate.” At minute seven, identify the repeated work: the next start rescans a suffix you already examined. Propose a window and explain which boundary advances. If the optimized code fails on “abba” at minute fifteen, stop changing branches at random. Write the boundary trace, notice that left moved backwards, and repair that specific violation. If you cannot justify the repair, present the correct baseline and explain its remaining bottleneck. That is a more informative recovery than claiming an unverified linear solution.' },
          { type: 'paragraph', text: 'A small baseline also makes an executable oracle for practice. The next example compares a quadratic enumeration with a linear window on every string of length at most five over the alphabet a,b,c. This is differential testing: independent approaches should agree on their observable answer. It catches errors such as a backwards-moving left boundary without hard-coding the answer for every case. Exhaustive agreement on small inputs is evidence, not a proof for all lengths; the window invariant still supplies the general argument. Keep enumeration outside the optimized function so your validation work does not become part of its stated runtime.' },
          { type: 'code', code: `function uniqueLengthBaseline(text) {
  let best = 0;
  for (let start = 0; start < text.length; start++) {
    const seen = new Set();
    for (let end = start; end < text.length; end++) {
      if (seen.has(text[end])) break;
      seen.add(text[end]);
      best = Math.max(best, end - start + 1);
    }
  }
  return best;
}
function uniqueLengthWindow(text) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < text.length; right++) {
    if (lastSeen.has(text[right])) left = Math.max(left, lastSeen.get(text[right]) + 1);
    lastSeen.set(text[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
function checkSmallStrings(maxLength) {
  let checked = 0;
  function visit(text) {
    if (uniqueLengthBaseline(text) !== uniqueLengthWindow(text)) {
      throw new Error('Counterexample: ' + text);
    }
    checked++;
    if (text.length < maxLength) {
      for (const symbol of ['a', 'b', 'c']) visit(text + symbol);
    }
  }
  visit('');
  return checked;
}
console.log(uniqueLengthBaseline('abba'), uniqueLengthWindow('abba')); //=> 2 2
console.log(checkSmallStrings(5)); //=> 364` },
          { type: 'paragraph', text: 'Both oracle functions deliberately use UTF-16 indexing and agree on the ASCII test alphabet. Do not compare them against a code-point implementation on emoji without first aligning their contracts. The general baseline has O(n²) time and O(n) Set storage; the window has expected O(n) time and O(n) map storage. Enumeration itself checks 1+3+9+27+81+243 = 364 strings, and grows exponentially with the maximum generated length. Five is a deliberate small test boundary, not a production input limit. In a mock, first run a few chosen adversarial cases; use exhaustive generation afterward to investigate your assumptions and preserve the smallest failure in your review notes.' },
          { type: 'exercise', prompt: 'Timed recovery drill: remove Math.max from uniqueLengthWindow, run the small-string checker, and explain how to turn the reported failure into a useful regression case. What can passing all 364 cases establish?', hints: ['The generator reports the first failure in traversal order; it does not promise the shortest failure.', 'A passing finite test set cannot establish correctness on every possible string.'], solution: 'The broken update may move left backwards after an earlier duplicate has left the active window. Reduce a reported failure by deleting symbols while preserving the mismatch; “abba” is a compact example. Keep it as a regression case and repair the monotonic-boundary invariant. Passing 364 cases establishes agreement only on those generated inputs, not a general proof or correctness for a different text model.' },
          { type: 'paragraph', text: 'Use the syllabus’s twenty-minute mock as a rehearsal of decisions. Spend roughly three minutes clarifying and tracing, four deriving a baseline and invariant, eight implementing, and five testing and explaining costs; adjust when the problem demands it. This is a practice allocation, not a new assignment requirement. If stuck, reduce the input until you can enumerate answers by hand, then identify what changes between neighboring cases. A correct baseline plus a clear bottleneck is a useful recovery point. Silence while searching memory for a familiar template gives neither you nor an interviewer evidence that the model is sound.' },
          { type: 'paragraph', text: 'Choose tests to attack claims. A sliding window needs a duplicate outside the current window; interval merging needs a nested interval; binary search needs absent values at both boundaries; graph traversal needs disconnected and cyclic regions; DP needs zero-sized and unreachable states. For sorted lookup, explain whether you need any matching index or the first one, and compare O(n) scanning with O(log n) binary search only when sortedness is guaranteed. Sorting an unsorted input costs O(n log n) and may change original indexes, so it is not free preprocessing for a single query. Complexity should count the dominant operations, output size, hidden copying, and the number of queries.' },
          { type: 'paragraph', text: 'After a failure, write a short diagnosis with the smallest counterexample, the incorrect assumption, and the corrected invariant. For “abba”, the problem is not “forgot Math.max”; it is “allowed a discarded prefix back into the window.” That explanation transfers to future boundary problems. Reattempt the solution later from a blank editor and explain why each branch is safe. Grade yourself separately on modeling, implementation, and communication: a typo, an invalid recurrence, and a correct algorithm explained poorly need different repairs. Consolidation succeeds when you can select among patterns, defend one with evidence, and revise it when a counterexample changes the model.' },
          { type: 'exercise', prompt: 'Final review: rehearse a twenty-minute mock using an anagram, unique-substring, or islands problem. Before coding, state a baseline, the repeated work, the invariant, and three adversarial tests. Afterward, record one specific improvement.', hints: ['Use the worked implementations only after you have committed to your own contract and model.', 'An improvement should describe behavior you can practice, such as marking graph nodes before pushing them.'], solution: 'For islands, a defensible answer defines orthogonal land adjacency, uses component traversal to avoid repeated counting, and states that visited contains discovered land. Test empty input, all water, and diagonal-only land. Report O(RC) time and O(RC) space for the explicit stack and Set. A concrete review action is to trace discovery-time marking on a four-cell cycle before the next attempt.' }
        ]
      }
    ]
  }
};
