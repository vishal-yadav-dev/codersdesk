
export interface TestCase {
  name: string;
  /** expression evaluated alongside the user's code; awaited before comparing */
  call: string;
  expect: unknown;
}

export const TESTS: Record<string, TestCase[]> = {
  "two-sum": [
    { name: "pair at the start", call: "twoSum([2,7,11,15], 9)", expect: [0, 1] },
    { name: "pair further in", call: "twoSum([3,2,4], 6)", expect: [1, 2] },
    { name: "same value twice", call: "twoSum([3,3], 6)", expect: [0, 1] },
    { name: "negative numbers", call: "twoSum([-1,-2,-3,-4,-5], -8)", expect: [2, 4] },
  ],

  "max-subarray": [
    { name: "mixed signs", call: "maxSubArray([-2,1,-3,4,-1,2,1,-5,4])", expect: 6 },
    { name: "single element", call: "maxSubArray([1])", expect: 1 },
    { name: "all negative picks the least bad", call: "maxSubArray([-3,-1,-2])", expect: -1 },
    { name: "whole array wins", call: "maxSubArray([5,4,-1,7,8])", expect: 23 },
  ],

  "valid-parens": [
    { name: "simple pair", call: 'isValid("()")', expect: true },
    { name: "all three kinds", call: 'isValid("()[]{}")', expect: true },
    { name: "mismatched closer", call: 'isValid("(]")', expect: false },
    { name: "interleaved, not nested", call: 'isValid("([)]")', expect: false },
    { name: "properly nested", call: 'isValid("{[]}")', expect: true },
    { name: "never closed", call: 'isValid("(")', expect: false },
  ],

  lru: [
    {
      name: "evicts the least recently used",
      call:
        "(() => { const c = new LRUCache(2); c.put(1,1); c.put(2,2); " +
        "const a = c.get(1); c.put(3,3); return [a, c.get(2), c.get(3)]; })()",
      expect: [1, -1, 3],
    },
    { name: "missing key returns -1", call: "(() => new LRUCache(2).get(42))()", expect: -1 },
    {
      name: "re-putting a key refreshes it",
      call:
        "(() => { const c = new LRUCache(2); c.put(1,1); c.put(2,2); c.put(1,10); " +
        "c.put(3,3); return [c.get(1), c.get(2), c.get(3)]; })()",
      expect: [10, -1, 3],
    },
  ],

  "rate-limiter": [
    {
      name: "burst is capped at the rate",
      call: "(() => { const r = new RateLimiter(2, 1000); return [r.allow(), r.allow(), r.allow()]; })()",
      expect: [true, true, false],
    },
    {
      name: "tokens refill as time passes",
      call:
        "(async () => { const r = new RateLimiter(2, 200); r.allow(); r.allow(); " +
        "await new Promise(s => setTimeout(s, 260)); return r.allow(); })()",
      expect: true,
    },
  ],

  debounce: [
    {
      name: "a burst collapses to one call",
      call:
        "(async () => { let n = 0; const f = debounce(() => n++, 50); f(); f(); f(); " +
        "await new Promise(s => setTimeout(s, 160)); return n; })()",
      expect: 1,
    },
    {
      name: "the last arguments win",
      call:
        '(async () => { let got; const f = debounce(v => { got = v; }, 40); f("a"); f("b"); ' +
        "await new Promise(s => setTimeout(s, 140)); return got; })()",
      expect: "b",
    },
    {
      name: "nothing fires before the wait elapses",
      call:
        "(async () => { let n = 0; const f = debounce(() => n++, 150); f(); " +
        "await new Promise(s => setTimeout(s, 40)); return n; })()",
      expect: 0,
    },
  ],

  "binary-search": [
    { name: "finds a middle value", call: "search([-1,0,3,5,9,12], 9)", expect: 4 },
    { name: "absent value returns -1", call: "search([-1,0,3,5,9,12], 2)", expect: -1 },
    { name: "single element hit", call: "search([5], 5)", expect: 0 },
    { name: "empty array", call: "search([], 1)", expect: -1 },
  ],

  "promise-pool": [
    {
      name: "results keep input order",
      call: "pool([() => 1, () => Promise.resolve(2), () => 3], 2)",
      expect: [1, 2, 3],
    },
    {
      name: "never exceeds the concurrency limit",
      call:
        "(async () => { let cur = 0, max = 0; " +
        "const t = () => new Promise(r => { cur++; max = Math.max(max, cur); " +
        "setTimeout(() => { cur--; r(1); }, 20); }); " +
        "await pool([t,t,t,t,t], 2); return max; })()",
      expect: 2,
    },
  ],

  "group-anagrams": [
    {
      name: "groups three anagram families",
      call:
        '(() => groupAnagrams(["eat","tea","tan","ate","nat","bat"])' +
        '.map(g => g.slice().sort().join(",")).sort())()',
      expect: ["ate,eat,tea", "bat", "nat,tan"],
    },
    {
      name: "single empty string",
      call: '(() => groupAnagrams([""]).map(g => g.slice().sort().join(",")).sort())()',
      expect: [""],
    },
    {
      name: "no anagrams at all",
      call: '(() => groupAnagrams(["a","b"]).map(g => g.slice().sort().join(",")).sort())()',
      expect: ["a", "b"],
    },
  ],

  flatten: [
    { name: "deeply nested", call: "flatten([1,[2,[3,[4]]]])", expect: [1, 2, 3, 4] },
    { name: "already flat", call: "flatten([1,2,3])", expect: [1, 2, 3] },
    { name: "empty nests vanish", call: "flatten([1,[],[[]],2])", expect: [1, 2] },
    { name: "empty array", call: "flatten([])", expect: [] },
  ],

  "longest-unique-substring": [
    { name: "abcabcbb", call: 'lengthOfLongestSubstring("abcabcbb")', expect: 3 },
    { name: "all one character", call: 'lengthOfLongestSubstring("bbbbb")', expect: 1 },
    { name: "window must slide", call: 'lengthOfLongestSubstring("pwwkew")', expect: 3 },
    { name: "empty string", call: 'lengthOfLongestSubstring("")', expect: 0 },
  ],

  "merge-intervals": [
    {
      name: "merges one overlap",
      call: "merge([[1,3],[2,6],[8,10],[15,18]])",
      expect: [[1, 6], [8, 10], [15, 18]],
    },
    { name: "touching ranges join", call: "merge([[1,4],[4,5]])", expect: [[1, 5]] },
    { name: "fully contained range", call: "merge([[1,4],[2,3]])", expect: [[1, 4]] },
    { name: "unsorted input", call: "merge([[8,10],[1,3],[2,6]])", expect: [[1, 6], [8, 10]] },
  ],

  "reverse-list": [
    {
      name: "reverses three nodes",
      call:
        "(() => { const n = (v, next = null) => ({ val: v, next }); " +
        "let r = reverseList(n(1, n(2, n(3)))); const out = []; " +
        "while (r) { out.push(r.val); r = r.next; } return out; })()",
      expect: [3, 2, 1],
    },
    {
      name: "single node is unchanged",
      call:
        "(() => { const r = reverseList({ val: 1, next: null }); " +
        "return [r.val, r.next]; })()",
      expect: [1, null],
    },
    { name: "empty list", call: "reverseList(null)", expect: null },
  ],

  "search-rotated": [
    { name: "target after the pivot", call: "searchRotated([4,5,6,7,0,1,2], 0)", expect: 4 },
    { name: "target before the pivot", call: "searchRotated([4,5,6,7,0,1,2], 6)", expect: 2 },
    { name: "absent target", call: "searchRotated([4,5,6,7,0,1,2], 3)", expect: -1 },
    { name: "single element miss", call: "searchRotated([1], 0)", expect: -1 },
  ],

  "num-islands-dfs": [
    {
      name: "one solid island",
      call: 'numIslands([["1","1","0"],["1","1","0"],["0","0","0"]])',
      expect: 1,
    },
    {
      name: "three separate islands",
      call:
        'numIslands([["1","1","0","0","0"],["1","1","0","0","0"],' +
        '["0","0","1","0","0"],["0","0","0","1","1"]])',
      expect: 3,
    },
    { name: "all water", call: 'numIslands([["0","0"],["0","0"]])', expect: 0 },
    {
      name: "diagonals do not connect",
      call: 'numIslands([["1","0"],["0","1"]])',
      expect: 2,
    },
  ],

  "top-k-frequent-bucket": [
    {
      name: "two most frequent",
      call: "(() => topKFrequent([1,1,1,2,2,3], 2).slice().sort((a,b) => a-b))()",
      expect: [1, 2],
    },
    { name: "single element", call: "topKFrequent([1], 1)", expect: [1] },
    { name: "clear winner", call: "topKFrequent([4,4,4,5,5,6], 1)", expect: [4] },
  ],

  "climb-stairs-dp": [
    { name: "one step", call: "climbStairs(1)", expect: 1 },
    { name: "two steps", call: "climbStairs(2)", expect: 2 },
    { name: "three steps", call: "climbStairs(3)", expect: 3 },
    { name: "five steps", call: "climbStairs(5)", expect: 8 },
    { name: "tenth fibonacci", call: "climbStairs(10)", expect: 89 },
  ],

  "url-shortener": [
    {
      name: "a short url expands back",
      call:
        '(() => { const s = new UrlShortener(); ' +
        'const short = s.shorten("https://example.com"); return s.expand(short); })()',
      expect: "https://example.com",
    },
    {
      name: "different urls get different slugs",
      call:
        '(() => { const s = new UrlShortener(); ' +
        'return s.shorten("https://a.com") !== s.shorten("https://b.com"); })()',
      expect: true,
    },
    {
      name: "several urls all round-trip",
      call:
        '(() => { const s = new UrlShortener(); const urls = ["https://a.com","https://b.com","https://c.com"]; ' +
        "const shorts = urls.map(u => s.shorten(u)); return shorts.map(x => s.expand(x)); })()",
      expect: ["https://a.com", "https://b.com", "https://c.com"],
    },
  ],

  "sliding-window-limiter": [
    {
      name: "blocks past the limit",
      call:
        '(() => { const l = new SlidingWindowLimiter(2, 1000); ' +
        'return [l.allow("a"), l.allow("a"), l.allow("a")]; })()',
      expect: [true, true, false],
    },
    {
      name: "keys are counted separately",
      call:
        '(() => { const l = new SlidingWindowLimiter(1, 1000); ' +
        'return [l.allow("a"), l.allow("b")]; })()',
      expect: [true, true],
    },
    {
      name: "the window slides open again",
      call:
        '(async () => { const l = new SlidingWindowLimiter(1, 100); l.allow("a"); ' +
        'await new Promise(s => setTimeout(s, 160)); return l.allow("a"); })()',
      expect: true,
    },
  ],

  throttle: [
    {
      name: "the first call fires immediately",
      call: "(() => { let n = 0; const f = throttle(() => n++, 100); f(); return n; })()",
      expect: 1,
    },
    {
      name: "a burst gives leading + trailing only",
      call:
        "(async () => { let n = 0; const f = throttle(() => n++, 80); f(); f(); f(); " +
        "await new Promise(s => setTimeout(s, 220)); return n; })()",
      expect: 2,
    },
  ],
};

/** Test cases for a problem, or an empty list if none are written yet. */
export function testsFor(problemId: string): TestCase[] {
  return TESTS[problemId] ?? [];
}
