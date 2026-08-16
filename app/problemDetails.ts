
export interface Example {
  in: string;
  out: string;
  note?: string;
}

export interface ProblemDetail {
  description: string;
  examples: Example[];
  constraints?: string[];
}

export const DETAILS: Record<string, ProblemDetail> = {
  "two-sum": {
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. Each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    examples: [
      { in: "nums = [2,7,11,15], target = 9", out: "[0,1]", note: "nums[0] + nums[1] === 9" },
      { in: "nums = [3,2,4], target = 6", out: "[1,2]", note: "nums[1] + nums[2] === 6" },
      { in: "nums = [3,3], target = 6", out: "[0,1]", note: "the same value at two different indices is fine" },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "exactly one valid answer exists",
      "aim for better than O(n²)",
    ],
  },

  "max-subarray": {
    description:
      "Given an integer array nums, find the contiguous subarray with the largest sum and return that sum. The subarray must contain at least one number, so an all-negative array still has an answer — the least negative element.",
    examples: [
      { in: "nums = [-2,1,-3,4,-1,2,1,-5,4]", out: "6", note: "the subarray [4,-1,2,1] sums to 6" },
      { in: "nums = [1]", out: "1" },
      { in: "nums = [5,4,-1,7,8]", out: "23", note: "the whole array is best here" },
      { in: "nums = [-3,-1,-2]", out: "-1", note: "all negative — take the largest single element" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "an O(n) solution exists (Kadane's)"],
  },

  "valid-parens": {
    description:
      "Given a string s containing only the characters '(', ')', '{', '}', '[' and ']', decide whether the input is valid. Brackets must close in the correct order, every closing bracket must match the most recent unclosed opening bracket of the same type, and nothing may be left open at the end.",
    examples: [
      { in: 's = "()"', out: "true" },
      { in: 's = "()[]{}"', out: "true" },
      { in: 's = "(]"', out: "false", note: "wrong closing type" },
      { in: 's = "([)]"', out: "false", note: "interleaved, not properly nested" },
      { in: 's = "("', out: "false", note: "never closed" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists only of bracket characters"],
  },

  lru: {
    description:
      "Design a Least Recently Used cache with a fixed capacity. get(key) returns the value or -1 if it is absent, and counts as a use. put(key, value) inserts or overwrites, also counting as a use. When adding a new key would exceed capacity, evict the least recently used key first. Both operations should run in O(1) average time.",
    examples: [
      {
        in: "new LRUCache(2); put(1,1); put(2,2); get(1); put(3,3); get(2)",
        out: "get(1) → 1, get(2) → -1",
        note: "get(1) made key 1 recent, so put(3,3) evicted key 2 instead",
      },
      {
        in: "new LRUCache(2); put(1,1); put(2,2); put(1,10); put(3,3)",
        out: "get(1) → 10, get(2) → -1",
        note: "overwriting key 1 also refreshes it",
      },
      { in: "new LRUCache(2); get(42)", out: "-1", note: "missing keys return -1" },
    ],
    constraints: ["1 <= capacity <= 3000", "get and put should both be O(1)"],
  },

  "rate-limiter": {
    description:
      "Implement a token bucket rate limiter. The bucket holds up to `rate` tokens and refills continuously over the window `per` (in milliseconds). allow() spends one token and returns true when one is available, or returns false without spending anything. The bucket starts full, so a burst up to `rate` succeeds immediately, and tokens accrue proportionally to elapsed time rather than resetting in steps.",
    examples: [
      {
        in: "new RateLimiter(2, 1000); allow(); allow(); allow()",
        out: "true, true, false",
        note: "the bucket starts with 2 tokens and is empty by the third call",
      },
      {
        in: "new RateLimiter(2, 200); allow(); allow(); wait 260ms; allow()",
        out: "true",
        note: "enough time passed to refill",
      },
    ],
    constraints: [
      "tokens never exceed `rate`, no matter how long the bucket idles",
      "refill is proportional to elapsed time, not a fixed tick",
    ],
  },

  debounce: {
    description:
      "Implement debounce(fn, wait). It returns a wrapped function that postpones calling fn until `wait` milliseconds have passed with no new invocation. Every fresh call cancels the pending one and restarts the timer, so a rapid burst results in exactly one call — made with the arguments from the last invocation, and with `this` preserved.",
    examples: [
      {
        in: "f = debounce(fn, 50); f(); f(); f(); wait 160ms",
        out: "fn called once",
        note: "the burst collapses to a single trailing call",
      },
      { in: 'f("a"); f("b"); wait 140ms', out: 'fn called with "b"', note: "the last arguments win" },
      { in: "f(); wait only 40ms", out: "fn not called yet", note: "the wait has not elapsed" },
    ],
    constraints: ["preserve `this` and all arguments", "only one timer should ever be pending"],
  },

  "binary-search": {
    description:
      "Given a sorted array of distinct integers nums and a target, return the index of target, or -1 if it is not present. The algorithm must run in O(log n) time, so scanning the array is not acceptable.",
    examples: [
      { in: "nums = [-1,0,3,5,9,12], target = 9", out: "4" },
      { in: "nums = [-1,0,3,5,9,12], target = 2", out: "-1", note: "not present" },
      { in: "nums = [5], target = 5", out: "0" },
      { in: "nums = [], target = 1", out: "-1", note: "empty input" },
    ],
    constraints: ["nums is sorted ascending with distinct values", "must be O(log n)"],
  },

  "promise-pool": {
    description:
      "Implement pool(tasks, limit). Each entry in tasks is a function returning a value or a promise. Run them with at most `limit` in flight at any moment, and resolve with an array of results in the original task order — not completion order. As soon as one task settles the next should start, so the pool stays saturated.",
    examples: [
      {
        in: "pool([() => 1, () => Promise.resolve(2), () => 3], 2)",
        out: "[1,2,3]",
        note: "results keep input order regardless of finish order",
      },
      {
        in: "5 tasks each taking 20ms, limit 2",
        out: "peak concurrency is 2",
        note: "never more than `limit` running at once",
      },
    ],
    constraints: ["1 <= limit <= tasks.length", "results must be ordered by input index"],
  },

  "group-anagrams": {
    description:
      "Given an array of strings, group the anagrams together and return the groups. Two words are anagrams when one is a rearrangement of the other's letters. The groups, and the words within them, may be returned in any order.",
    examples: [
      {
        in: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        out: '[["eat","tea","ate"],["tan","nat"],["bat"]]',
        note: "any ordering of the groups is accepted",
      },
      { in: 'strs = [""]', out: '[[""]]' },
      { in: 'strs = ["a","b"]', out: '[["a"],["b"]]', note: "no anagrams at all" },
    ],
    constraints: ["1 <= strs.length <= 10^4", "strs[i] is lowercase English letters, possibly empty"],
  },

  flatten: {
    description:
      "Given an array that may contain nested arrays to any depth, return a new array with every nested value pulled up to a single level, preserving order. Empty arrays contribute nothing.",
    examples: [
      { in: "arr = [1,[2,[3,[4]]]]", out: "[1,2,3,4]" },
      { in: "arr = [1,2,3]", out: "[1,2,3]", note: "already flat" },
      { in: "arr = [1,[],[[]],2]", out: "[1,2]", note: "empty nests disappear" },
      { in: "arr = []", out: "[]" },
    ],
    constraints: ["nesting depth is arbitrary", "order must be preserved"],
  },

  "longest-unique-substring": {
    description:
      "Given a string s, return the length of the longest substring that contains no repeated characters. A substring is contiguous — unlike a subsequence.",
    examples: [
      { in: 's = "abcabcbb"', out: "3", note: '"abc"' },
      { in: 's = "bbbbb"', out: "1", note: '"b"' },
      { in: 's = "pwwkew"', out: "3", note: '"wke" — "pwke" is a subsequence, not a substring' },
      { in: 's = ""', out: "0" },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "a sliding window gives O(n)"],
  },

  "merge-intervals": {
    description:
      "Given an array of intervals where intervals[i] = [start, end], merge every set of overlapping intervals and return the non-overlapping intervals that cover all the input. Intervals that merely touch at an endpoint count as overlapping.",
    examples: [
      { in: "intervals = [[1,3],[2,6],[8,10],[15,18]]", out: "[[1,6],[8,10],[15,18]]", note: "[1,3] and [2,6] overlap" },
      { in: "intervals = [[1,4],[4,5]]", out: "[[1,5]]", note: "touching endpoints merge" },
      { in: "intervals = [[1,4],[2,3]]", out: "[[1,4]]", note: "one interval fully contains the other" },
      { in: "intervals = [[8,10],[1,3],[2,6]]", out: "[[1,6],[8,10]]", note: "input is not sorted" },
    ],
    constraints: ["1 <= intervals.length <= 10^4", "start <= end for every interval"],
  },

  "reverse-list": {
    description:
      "Given the head of a singly linked list, reverse it and return the new head. Each node is { val, next }, with next null at the tail. Reverse the links in place rather than rebuilding the list, for O(1) extra space.",
    examples: [
      { in: "1 → 2 → 3", out: "3 → 2 → 1" },
      { in: "1", out: "1", note: "a single node is unchanged" },
      { in: "null", out: "null", note: "an empty list reverses to itself" },
    ],
    constraints: ["0 <= list length <= 5000", "aim for O(n) time and O(1) space"],
  },

  "search-rotated": {
    description:
      "A sorted array of distinct integers was rotated at some unknown pivot, so [0,1,2,4,5,6,7] might become [4,5,6,7,0,1,2]. Given the rotated array and a target, return its index or -1. Must run in O(log n), so at each step decide which half is still sorted and whether the target lies inside it.",
    examples: [
      { in: "nums = [4,5,6,7,0,1,2], target = 0", out: "4", note: "target sits after the pivot" },
      { in: "nums = [4,5,6,7,0,1,2], target = 6", out: "2", note: "target sits before the pivot" },
      { in: "nums = [4,5,6,7,0,1,2], target = 3", out: "-1" },
      { in: "nums = [1], target = 0", out: "-1" },
    ],
    constraints: ["all values are distinct", "must be O(log n)"],
  },

  "num-islands-dfs": {
    description:
      'Given a 2D grid of "1" (land) and "0" (water), count the islands. An island is land connected horizontally or vertically — diagonals do not connect — and the whole grid is surrounded by water. The usual approach is a flood fill that sinks each island as it is counted, so no cell is visited twice.',
    examples: [
      {
        in: '[["1","1","0"],\n ["1","1","0"],\n ["0","0","0"]]',
        out: "1",
        note: "one solid block of land",
      },
      {
        in: '[["1","1","0","0","0"],\n ["1","1","0","0","0"],\n ["0","0","1","0","0"],\n ["0","0","0","1","1"]]',
        out: "3",
      },
      { in: '[["1","0"],\n ["0","1"]]', out: "2", note: "diagonal cells are separate islands" },
      { in: '[["0","0"],\n ["0","0"]]', out: "0" },
    ],
    constraints: ["cells are the strings \"0\" and \"1\", not numbers", "1 <= rows, cols <= 300"],
  },

  "top-k-frequent-bucket": {
    description:
      "Given an integer array nums and an integer k, return the k most frequent elements. The answer may be in any order. Sorting by count is O(n log n); bucketing by frequency reaches O(n), since no value can appear more than nums.length times.",
    examples: [
      { in: "nums = [1,1,1,2,2,3], k = 2", out: "[1,2]", note: "1 appears 3×, 2 appears 2×" },
      { in: "nums = [1], k = 1", out: "[1]" },
      { in: "nums = [4,4,4,5,5,6], k = 1", out: "[4]" },
    ],
    constraints: ["1 <= k <= number of distinct values", "the answer is guaranteed unique"],
  },

  "climb-stairs-dp": {
    description:
      "You are climbing a staircase of n steps and can take either 1 or 2 steps at a time. How many distinct ways can you reach the top? The count follows the Fibonacci sequence, because reaching step n means arriving from step n-1 or n-2.",
    examples: [
      { in: "n = 1", out: "1", note: "1" },
      { in: "n = 2", out: "2", note: "1+1, or 2" },
      { in: "n = 3", out: "3", note: "1+1+1, 1+2, 2+1" },
      { in: "n = 5", out: "8" },
    ],
    constraints: ["1 <= n <= 45", "O(n) time and O(1) space are achievable"],
  },

  "url-shortener": {
    description:
      "Design a URL shortener with shorten(url) returning a short link, and expand(short) returning the original URL. Slugs must be unique, and expanding a slug must return exactly the URL it was created from. Using an incrementing counter encoded in base62 guarantees uniqueness without the collision handling a hash would need.",
    examples: [
      {
        in: 's.shorten("https://example.com") then s.expand(that)',
        out: '"https://example.com"',
        note: "a slug must round-trip",
      },
      {
        in: 's.shorten("https://a.com") vs s.shorten("https://b.com")',
        out: "different slugs",
        note: "distinct URLs never collide",
      },
    ],
    constraints: [
      "the exact slug format is up to you — only round-tripping and uniqueness are tested",
      "shorten and expand should both be O(1)",
    ],
  },

  "sliding-window-limiter": {
    description:
      "Implement a sliding window rate limiter. allow(key) returns true when that key has made fewer than `limit` calls within the last `windowMs` milliseconds, otherwise false. Unlike a fixed window this has no reset boundary — old hits age out continuously — and each key is counted independently.",
    examples: [
      {
        in: 'new SlidingWindowLimiter(2, 1000); allow("a") ×3',
        out: "true, true, false",
        note: "the third call exceeds the limit",
      },
      {
        in: 'new SlidingWindowLimiter(1, 1000); allow("a"); allow("b")',
        out: "true, true",
        note: "separate keys have separate budgets",
      },
      {
        in: 'new SlidingWindowLimiter(1, 100); allow("a"); wait 160ms; allow("a")',
        out: "true",
        note: "the first hit aged out of the window",
      },
    ],
    constraints: [
      "exact, but memory grows with the number of hits in the window",
      "a token bucket trades exactness for constant memory",
    ],
  },

  throttle: {
    description:
      "Implement throttle(fn, wait). The returned function calls fn immediately on the first invocation, then guarantees fn runs at most once per `wait` milliseconds. Calls made during a closed window are collapsed into a single trailing call fired when the window reopens — so a burst yields one leading call and one trailing call.",
    examples: [
      { in: "f = throttle(fn, 100); f()", out: "fn called immediately", note: "leading edge fires at once" },
      {
        in: "f = throttle(fn, 80); f(); f(); f(); wait 220ms",
        out: "fn called twice",
        note: "one leading call plus one trailing call for the burst",
      },
    ],
    constraints: ["preserve `this` and arguments", "contrast with debounce, which drops the leading call"],
  },
};

/** Full statement for a problem, or null when one has not been written yet. */
export function detailFor(problemId: string): ProblemDetail | null {
  return DETAILS[problemId] ?? null;
}
