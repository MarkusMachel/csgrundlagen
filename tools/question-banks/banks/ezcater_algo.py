import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # tools/question-banks
from bankgen import build

LC, GO, PG = "LeetCode", "The Go Authors", "PostgreSQL documentation"
ADD = "added"


def lc(slug, title):
    return ("link", f"LeetCode: {title}", f"https://leetcode.com/problems/{slug}/", LC, "Practice the problem with an online judge.", ADD)


M = {
 "lc-longest": lc("longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters"),
 "lc-anagrams": lc("group-anagrams", "Group Anagrams"),
 "lc-two-sum": lc("two-sum", "Two Sum"),
 "lc-merge-intervals": lc("merge-intervals", "Merge Intervals"),
 "lc-lru": lc("lru-cache", "LRU Cache"),
 "x-rate": ("article", "golang.org/x/time/rate", "https://pkg.go.dev/golang.org/x/time/rate", GO, "The standard token-bucket limiter for Go.", ADD),
 "idempotent-consumer": ("article", "Pattern: Idempotent consumer", "https://microservices.io/patterns/communication-style/idempotent-consumer.html", "microservices.io", "Handling duplicate messages safely.", False),
 "lc-reverse": lc("reverse-linked-list", "Reverse Linked List"),
 "lc-course-schedule": lc("course-schedule-ii", "Course Schedule II"),
 "gobyexample-workers": ("article", "Go by Example: Worker Pools", "https://gobyexample.com/worker-pools", "Go by Example", "A worker pool with channels and goroutines.", ADD),
 "lc-rotated": lc("search-in-rotated-sorted-array", "Search in Rotated Sorted Array"),
 "json-schema": ("link", "JSON Schema", "https://json-schema.org/", "JSON Schema", "The specification that real payload validation builds on.", ADD),
 "lc-parentheses": lc("valid-parentheses", "Valid Parentheses"),
 "lc-duplicates": lc("find-all-duplicates-in-an-array", "Find All Duplicates in an Array"),
 "lc-islands": lc("number-of-islands", "Number of Islands"),
 "lc-kth": lc("kth-largest-element-in-an-array", "Kth Largest Element in an Array"),
 "container-heap": ("article", "container/heap package", "https://pkg.go.dev/container/heap", GO, "Heap operations over any heap.Interface.", ADD),
 "lc-trie": lc("implement-trie-prefix-tree", "Implement Trie (Prefix Tree)"),
 "lc-merge-k": lc("merge-k-sorted-lists", "Merge k Sorted Lists"),
 "lc-second-highest": lc("second-highest-salary", "Second Highest Salary"),
 "pg-window": ("article", "Window functions (tutorial)", "https://www.postgresql.org/docs/current/tutorial-window.html", PG, "OVER, PARTITION BY and running totals.", ADD),
 "pg-join": ("article", "Joins between tables (tutorial)", "https://www.postgresql.org/docs/current/tutorial-join.html", PG, "Inner and outer joins, with examples.", ADD),
 "pg-agg": ("article", "Aggregate functions (tutorial)", "https://www.postgresql.org/docs/current/tutorial-agg.html", PG, "GROUP BY, HAVING and WHERE versus HAVING.", ADD),
 "pg-explain": ("article", "Using EXPLAIN", "https://www.postgresql.org/docs/current/using-explain.html", PG, "Reading query plans and actual row counts.", False),
 "pg-multicol": ("article", "Multicolumn indexes", "https://www.postgresql.org/docs/current/indexes-multicolumn.html", PG, "Why column order matters in a composite index.", ADD),
 "wiki-3nf": ("article", "Third normal form", "https://en.wikipedia.org/wiki/Third_normal_form", "Wikipedia", "Transitive dependencies and how to remove them.", ADD),
 "pg-constraints": ("article", "Constraints", "https://www.postgresql.org/docs/current/ddl-constraints.html", PG, "Unique, primary key and foreign key constraints.", ADD),
 "wiki-junction": ("article", "Associative entity", "https://en.wikipedia.org/wiki/Associative_entity", "Wikipedia", "Junction tables for many-to-many relationships.", ADD),
 "http-shutdown": ("article", "net/http: Server.Shutdown", "https://pkg.go.dev/net/http#Server.Shutdown", GO, "Graceful shutdown that drains in-flight requests.", ADD),
 "http-handler": ("article", "net/http: Handler", "https://pkg.go.dev/net/http#Handler", GO, "The interface every middleware wraps.", ADD),
 "golang-jwt": ("article", "golang-jwt/jwt v5", "https://pkg.go.dev/github.com/golang-jwt/jwt/v5", "golang-jwt", "The common JWT library for Go.", ADD),
 "sync-rwmutex": ("article", "sync.RWMutex", "https://pkg.go.dev/sync#RWMutex", GO, "Many readers or one writer.", ADD),
 "slog": ("article", "log/slog package", "https://pkg.go.dev/log/slog", GO, "Structured logging in the standard library.", ADD),
 "twelve-factor-config": ("article", "The Twelve-Factor App: Config", "https://12factor.net/config", "Adam Wiggins", "Store config in the environment.", ADD),
 "pipelines": ("article", "Go Concurrency Patterns: Pipelines and cancellation", "https://go.dev/blog/pipelines", GO, "Fan-out, fan-in and bounded parallelism.", False),
 "aws-backoff": ("article", "Timeouts, retries and backoff with jitter", "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/", "Amazon Builders' Library", "How Amazon sets timeouts and avoids retry amplification.", False),
 "circuit-breaker": ("article", "Circuit Breaker pattern", "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker", "Microsoft Learn", "Failing fast when a dependency is unhealthy.", False),
 "database-sql": ("article", "database/sql package", "https://pkg.go.dev/database/sql", GO, "Go's generic SQL interface.", ADD),
 "sync-once": ("article", "sync.Once", "https://pkg.go.dev/sync#Once", GO, "Run initialization exactly once.", ADD),
 "time-afterfunc": ("article", "time.AfterFunc", "https://pkg.go.dev/time#AfterFunc", GO, "Run a function after a delay on its own goroutine.", ADD),
 "context-pkg": ("article", "context package", "https://pkg.go.dev/context", GO, "Cancellation, deadlines and request-scoped values.", ADD),
}

EZ, ALG, SQL, IMPL = "ezCater prep", "Algorithms (Go)", "SQL", "Go Implementations"


def ex(text, code, lang="Go"):
    # Fenced block, rendered with syntax highlighting by the web app.
    return f"{text}\n\n```{lang.lower()}\n{code.strip(chr(10))}\n```"


Q = [
 ("What is the most efficient approach to Longest Substring Without Repeating Characters?", [ALG, EZ, "Sliding window"], "medium",
  "A sliding window with a map of each character's last index, jumping the left edge past a repeat: O(n) time.",
  ["Generate every substring, check each for duplicates with a set and keep the longest; each substring is checked once, so it's O(n).",
   "Sort the string first, then count the longest run of distinct characters.",
   "Reset the window to empty whenever a character repeats, which runs in O(log n)."],
  ex("Maintain a window [left, right] that never contains a duplicate. Expand right one character at a time; if the new character was already seen inside the current window, move left past its previous occurrence instead of resetting, which keeps it O(n). A map from character to last-seen index lets left jump directly.\n\nComplexity: O(n) time, O(min(n, charset)) space.\nFollow-up: for Unicode, byte indexing breaks on multi-byte runes; range over the string or convert to []rune.", r'''
func lengthOfLongestSubstring(s string) int {
	lastSeen := make(map[byte]int)
	longest, left := 0, 0
	for right := 0; right < len(s); right++ {
		c := s[right]
		if idx, ok := lastSeen[c]; ok && idx >= left {
			left = idx + 1 // jump past the previous occurrence
		}
		lastSeen[c] = right
		if w := right - left + 1; w > longest {
			longest = w
		}
	}
	return longest
}
'''), ["lc-longest"]),
 ("How do you group anagrams efficiently, and how can you avoid sorting each word?", [ALG, EZ, "Hashing"], "medium",
  "Key a map by each word's sorted letters (O(n·k log k)); to skip the sort, key by a 26-slot character count for O(n·k).",
  ["Compare every word against every other word letter by letter and merge matching pairs, which is already optimal at O(n·k) without any hashing at all.",
   "Group words by length only, since anagrams always have the same length.",
   "Sum the character codes of each word and use the sum as the map key."],
  ex("Two strings are anagrams exactly when their sorted characters are identical, so the sorted string is a perfect map key: sort each word's letters, use that as the key, append the original word to its bucket.\n\nComplexity: O(n · k log k) for average length k.\nFollow-up: avoid the sort with a 26-length character-count array as the key, giving O(n · k). (Summing character codes fails: different words can share a sum.)", r'''
func groupAnagrams(strs []string) [][]string {
	groups := make(map[string][]string)
	for _, s := range strs {
		key := sortString(s)
		groups[key] = append(groups[key], s)
	}
	result := make([][]string, 0, len(groups))
	for _, group := range groups {
		result = append(result, group)
	}
	return result
}

func sortString(s string) string {
	b := []byte(s)
	sort.Slice(b, func(i, j int) bool { return b[i] < b[j] })
	return string(b)
}
'''), ["lc-anagrams"]),
 ("What is the O(n) approach to Two Sum?", [ALG, EZ, "Hashing"], "easy",
  "Scan once with a map of seen values; for each number, check whether target minus it was already seen.",
  ["Sort the array and use two pointers from both ends, which keeps the original indices intact and runs in O(n) because the sort is free on integer arrays.",
   "Check every pair with two nested loops, which is O(n).",
   "Binary search for each number's complement in the unsorted array."],
  ex("Brute force checks every pair in O(n²). The trick: while scanning once, check for each number whether target - number was already seen; if so you've found the pair, with no second loop.\n\nComplexity: O(n) time, O(n) space.", r'''
func twoSum(nums []int, target int) []int {
	seen := make(map[int]int) // value -> index
	for i, n := range nums {
		if j, ok := seen[target-n]; ok {
			return []int{j, i}
		}
		seen[n] = i
	}
	return nil // no solution
}
'''), ["lc-two-sum"]),
 ("How do you merge overlapping intervals?", [ALG, EZ, "Sorting"], "medium",
  "Sort by start time, then make one pass that extends the current interval while the next one starts before it ends.",
  ["Compare every interval with every other interval repeatedly until no more merges happen, which is O(n) since each interval is merged at most once.",
   "Sort by end time and merge only intervals with identical end points.",
   "Use a hash map keyed by start time to find overlaps in O(1)."],
  ex("Sort intervals by start. Once sorted, overlaps can only occur between adjacent intervals, so a single linear pass works: keep a current merged interval and extend its end whenever the next interval's start is <= the current end; otherwise close it and start a new one.\n\nComplexity: O(n log n); the sort dominates.\nTie-in: this is the logic behind \"did this replay window overlap an already-processed window?\"", r'''
type Interval struct{ Start, End int }

func mergeIntervals(intervals []Interval) []Interval {
	if len(intervals) == 0 {
		return intervals
	}
	sort.Slice(intervals, func(i, j int) bool { return intervals[i].Start < intervals[j].Start })
	merged := []Interval{intervals[0]}
	for _, curr := range intervals[1:] {
		last := &merged[len(merged)-1]
		if curr.Start <= last.End {
			if curr.End > last.End {
				last.End = curr.End
			}
		} else {
			merged = append(merged, curr)
		}
	}
	return merged
}
'''), ["lc-merge-intervals"]),
 ("How do you design an LRU cache with O(1) Get and Put?", [ALG, EZ, "Design"], "hard",
  "Combine a hash map of key to list node with a doubly linked list ordered by recency, evicting from the tail.",
  ["Use a sorted array of keys ordered by access time and binary search it on every call, which gives O(1) operations because the array never needs to shift.",
   "Use a single map and scan it for the oldest timestamp on every eviction.",
   "Use a queue and move accessed keys to the back by removing them in O(1)."],
  ex("Combine a hash map (O(1) lookup) with a doubly linked list (O(1) reordering and eviction). The map stores key -> node; every Get or Put moves the node to the front, and capacity overflow evicts from the tail.\n\nComplexity: O(1) for both operations.\nFollow-up: thread safety via sync.Mutex; an RWMutex doesn't help much because Get also mutates the list.", r'''
type lruNode struct {
	key, value int
	prev, next *lruNode
}

type LRUCache struct {
	capacity   int
	cache      map[int]*lruNode
	head, tail *lruNode // sentinels: head.next = most recent, tail.prev = least recent
}

func NewLRUCache(capacity int) *LRUCache {
	head, tail := &lruNode{}, &lruNode{}
	head.next, tail.prev = tail, head
	return &LRUCache{capacity: capacity, cache: make(map[int]*lruNode), head: head, tail: tail}
}

func (c *LRUCache) remove(n *lruNode)      { n.prev.next, n.next.prev = n.next, n.prev }
func (c *LRUCache) insertFront(n *lruNode) {
	n.next, n.prev = c.head.next, c.head
	c.head.next.prev, c.head.next = n, n
}

func (c *LRUCache) Get(key int) (int, bool) {
	n, ok := c.cache[key]
	if !ok {
		return 0, false
	}
	c.remove(n)
	c.insertFront(n)
	return n.value, true
}

func (c *LRUCache) Put(key, value int) {
	if n, ok := c.cache[key]; ok {
		n.value = value
		c.remove(n)
		c.insertFront(n)
		return
	}
	if len(c.cache) >= c.capacity {
		lru := c.tail.prev
		c.remove(lru)
		delete(c.cache, lru.key)
	}
	n := &lruNode{key: key, value: value}
	c.cache[key] = n
	c.insertFront(n)
}
'''), ["lc-lru"]),
 ("How do you implement a token-bucket rate limiter without a background goroutine?", [ALG, EZ, "Rate limiting"], "medium",
  "Refill lazily on each call from the time elapsed since the last check, capped at capacity, then spend one token if available.",
  ["Run a ticker goroutine per bucket that adds one token every millisecond, since computing refills lazily at request time can't be made accurate.",
   "Count requests per calendar minute and reset the counter at the top of the minute.",
   "Sleep inside Allow until a token becomes available, so no request is ever rejected."],
  ex("A bucket holds up to capacity tokens and refills at a steady rate; each request consumes one token or is rejected. Instead of a goroutine ticking constantly, compute tokens lazily at request time from the elapsed time since the last check: simpler, and no always-running timer.\n\nComplexity: O(1) per call.\nFollow-up: per partner, keep a map[partnerID]*TokenBucket behind its own mutex (or sync.Map), creating buckets lazily.", r'''
type TokenBucket struct {
	mu         sync.Mutex
	capacity   float64
	tokens     float64
	refillRate float64 // tokens per second
	lastCheck  time.Time
}

func NewTokenBucket(capacity, refillRate float64) *TokenBucket {
	return &TokenBucket{capacity: capacity, tokens: capacity, refillRate: refillRate, lastCheck: time.Now()}
}

func (b *TokenBucket) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	now := time.Now()
	b.tokens = math.Min(b.capacity, b.tokens+now.Sub(b.lastCheck).Seconds()*b.refillRate)
	b.lastCheck = now
	if b.tokens >= 1 {
		b.tokens--
		return true
	}
	return false
}
'''), ["x-rate"]),
 ("How do you detect duplicate events within a time window, and what's the production caveat?", [ALG, EZ, "Idempotency"], "medium",
  "Track each event id's last-seen time in a map, evicting expired entries; in production use a durable, shared Postgres unique constraint instead.",
  ["Keep every event id ever seen in an in-memory map forever, which is the production-grade approach because it survives restarts and works across instances.",
   "Compare each event only with the immediately previous event.",
   "Use a bloom filter that never forgets, so stale entries never need eviction."],
  ex("Keep a map of eventID -> last seen timestamp; an event seen within the window is a duplicate. Evict entries older than the window (lazily, on each call) so the map doesn't grow unbounded, which is the follow-up an interviewer will raise if you don't.\n\nComplexity: O(1) amortized per check.\nSay out loud: this in-memory approach doesn't survive a restart or scale across instances, which is why the real Integration Hub uses a Postgres unique constraint (durable, shared).", r'''
type Deduper struct {
	mu     sync.Mutex
	window time.Duration
	seen   map[string]time.Time
}

func NewDeduper(window time.Duration) *Deduper {
	return &Deduper{window: window, seen: make(map[string]time.Time)}
}

func (d *Deduper) IsDuplicate(eventID string, ts time.Time) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	if last, ok := d.seen[eventID]; ok && ts.Sub(last) < d.window {
		return true
	}
	d.seen[eventID] = ts
	for id, t := range d.seen { // evict expired entries
		if ts.Sub(t) > d.window {
			delete(d.seen, id)
		}
	}
	return false
}
'''), ["idempotent-consumer"]),
 ("How do you reverse a singly linked list in place?", [ALG, EZ, "Linked lists"], "easy",
  "Walk the list once, saving next before pointing each node's next back at the previous node; return the new head.",
  ["Copy all values into a slice, reverse the slice and build a brand-new list, which counts as in place because the original nodes are freed afterwards.",
   "Swap the head and tail values only.",
   "Recurse to the end without saving next pointers, then relink on the way back up."],
  ex("Walk the list once and flip each node's next pointer to point backwards. Save the next node before overwriting the pointer, or you lose the rest of the list.\n\nComplexity: O(n) time, O(1) space.", r'''
type ListNode struct {
	Val  int
	Next *ListNode
}

func reverseList(head *ListNode) *ListNode {
	var prev *ListNode
	curr := head
	for curr != nil {
		next := curr.Next // save before overwriting
		curr.Next = prev
		prev = curr
		curr = next
	}
	return prev
}
'''), ["lc-reverse"]),
 ("How do you order items with dependencies and detect a cycle?", [ALG, EZ, "Graphs"], "medium",
  "Kahn's algorithm: queue zero-in-degree nodes, remove them while decrementing successors; fewer processed nodes than total means a cycle.",
  ["Sort the items alphabetically and process them in that order, since dependencies in real systems almost always follow naming order.",
   "Run a depth-first search from the first node only; unreached nodes indicate a cycle.",
   "Repeatedly scan the whole list until nothing changes, which detects cycles in O(log n)."],
  ex("Compute each node's in-degree (how many things must happen before it), start with all zero-in-degree nodes in a queue, and repeatedly remove a node, decrementing the in-degree of everything it points to; any node reaching zero joins the queue. If fewer nodes are processed than exist, there's a cycle.\n\nComplexity: O(V + E).\nTie-in: sequencing a strangler-fig monolith migration: which event types can move first given their dependencies.", r'''
func topologicalSort(numNodes int, edges [][2]int) ([]int, bool) {
	adj := make(map[int][]int)
	inDegree := make([]int, numNodes)
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		inDegree[e[1]]++
	}
	queue := []int{}
	for i := 0; i < numNodes; i++ {
		if inDegree[i] == 0 {
			queue = append(queue, i)
		}
	}
	var order []int
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		order = append(order, node)
		for _, next := range adj[node] {
			inDegree[next]--
			if inDegree[next] == 0 {
				queue = append(queue, next)
			}
		}
	}
	return order, len(order) == numNodes // false means a cycle exists
}
'''), ["lc-course-schedule"]),
 ("How do you process jobs with a fixed number of concurrent Go workers and collect all results?", [ALG, EZ, "Concurrency"], "medium",
  "Feed a jobs channel to n workers that write to a results channel, and close results from a goroutine after wg.Wait() so the range ends.",
  ["Start one goroutine per job and range over the results channel without ever closing it, because Go closes channels automatically once every sender exits.",
   "Process all jobs sequentially, then copy the results into a channel.",
   "Have each worker close the results channel when it finishes its own jobs."],
  ex("Create a jobs channel and a results channel. Launch exactly numWorkers goroutines, each reading jobs until the channel is closed and writing to results. A separate goroutine closes results once all workers finish (sync.WaitGroup), so the final range over results terminates instead of blocking forever.\n\nFollow-up: a defer recover() inside each worker stops one bad job from crashing the pool.", r'''
func processJobs(jobs []int, numWorkers int, process func(int) int) []int {
	jobCh := make(chan int, len(jobs))
	resultCh := make(chan int, len(jobs))
	var wg sync.WaitGroup
	for _, j := range jobs {
		jobCh <- j
	}
	close(jobCh)
	for w := 0; w < numWorkers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobCh {
				resultCh <- process(j)
			}
		}()
	}
	go func() {
		wg.Wait()
		close(resultCh)
	}()
	var results []int
	for r := range resultCh {
		results = append(results, r)
	}
	return results
}
'''), ["gobyexample-workers"]),
 ("How do you search a rotated sorted array in O(log n)?", [ALG, EZ, "Binary search"], "medium",
  "Binary search where each step finds which half is sorted, then checks whether the target lies in that half's range.",
  ["Find the pivot with a linear scan first and then binary search the correct half, which is still O(log n) overall because the scan stops early.",
   "Sort the array again before every search, then run a normal binary search.",
   "Binary search on the middle value only; rotation never affects the result."],
  ex("At each step at least one half (left..mid or mid..right) is still sorted. Determine which by comparing endpoints, check whether the target falls within that half's range, and continue there or in the other half.\n\nComplexity: O(log n); the rotation doesn't break the guarantee because one half is always sorted.", r'''
func search(nums []int, target int) int {
	left, right := 0, len(nums)-1
	for left <= right {
		mid := left + (right-left)/2
		if nums[mid] == target {
			return mid
		}
		if nums[left] <= nums[mid] { // left half is sorted
			if nums[left] <= target && target < nums[mid] {
				right = mid - 1
			} else {
				left = mid + 1
			}
		} else { // right half is sorted
			if nums[mid] < target && target <= nums[right] {
				left = mid + 1
			} else {
				right = mid - 1
			}
		}
	}
	return -1
}
'''), ["lc-rotated"]),
 ("How do you validate that nested required fields (like order.id) exist in a webhook payload?", [ALG, EZ, "Validation"], "easy",
  "Split each path on dots and walk the nested map level by level, failing if a level is missing or not a map; real JSON Schema also checks types.",
  ["Marshal the payload back to a JSON string and search it for each field name with strings.Contains, which is exactly what JSON Schema validators do internally.",
   "Check only the top-level keys, since nested fields can't be missing.",
   "Use reflection to compare the payload with an empty struct."],
  ex("Split each required path on \".\", walk the nested map one level at a time, and fail fast if an intermediate level is missing or isn't itself a map. This is a simplified version of what a JSON Schema validator does.\n\nComplexity: O(total path depth).\nFollow-up: real JSON Schema also validates types, formats and array constraints, not just presence.", r'''
func validateRequiredFields(payload map[string]interface{}, required []string) []string {
	var missing []string
	for _, path := range required {
		if !hasField(payload, strings.Split(path, ".")) {
			missing = append(missing, path)
		}
	}
	return missing
}

func hasField(data map[string]interface{}, parts []string) bool {
	if len(parts) == 0 {
		return false
	}
	value, ok := data[parts[0]]
	if !ok {
		return false
	}
	if len(parts) == 1 {
		return value != nil && value != ""
	}
	nested, ok := value.(map[string]interface{})
	if !ok {
		return false
	}
	return hasField(nested, parts[1:])
}
'''), ["json-schema"]),
 ("How do you check that a string of brackets is validly matched and nested?", [ALG, EZ, "Stacks"], "easy",
  "Push opening brackets on a stack; each closer must match the top; the stack must be empty at the end.",
  ["Count opening and closing brackets of each kind and compare the totals, which also catches wrongly nested strings like ([)].",
   "Check that the first and last characters form a matching pair.",
   "Remove adjacent matching pairs once and check whether anything is left."],
  ex("Push every opening bracket onto a stack. A closing bracket must match the top of the stack (the most recently opened, unclosed one); a mismatch or an empty stack means invalid. At the end the stack must be empty.\n\nComplexity: O(n) time and space.", r'''
func isValid(s string) bool {
	pairs := map[byte]byte{')': '(', ']': '[', '}': '{'}
	var stack []byte
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c == '(' || c == '[' || c == '{' {
			stack = append(stack, c)
			continue
		}
		if len(stack) == 0 || stack[len(stack)-1] != pairs[c] {
			return false
		}
		stack = stack[:len(stack)-1] // pop
	}
	return len(stack) == 0
}
'''), ["lc-parentheses"]),
 ("How do you find all values that appear twice in an array?", [ALG, EZ, "Hashing"], "easy",
  "One pass with a seen set, recording values met a second time; an in-place index-marking trick gives O(1) extra space.",
  ["Sort the array and compare every element with every other element afterwards, which needs no extra memory and is O(n) because the array is sorted.",
   "Sum all values and subtract the expected sum to recover every duplicate.",
   "Use binary search on the unsorted array to find each repeated value."],
  ex("A single pass with a seen set: any value encountered a second time goes into the result. The in-place variant uses the array's own indices as a hash, negating values to mark \"seen\", for O(1) extra space; worth mentioning as a follow-up.\n\nComplexity: O(n) time, O(n) space.", r'''
func findDuplicates(nums []int) []int {
	seen := make(map[int]bool)
	var duplicates []int
	for _, n := range nums {
		if seen[n] {
			duplicates = append(duplicates, n)
		}
		seen[n] = true
	}
	return duplicates
}
'''), ["lc-duplicates"]),
 ("How do you count islands in a grid of land and water?", [ALG, EZ, "Graphs"], "medium",
  "For each unvisited land cell, increment the count and flood-fill its island with BFS or DFS, marking cells visited in place.",
  ["Count every land cell and divide by four, because islands on a grid are always made of four connected cells.",
   "Count rows that contain land, since each row holds one island.",
   "Scan diagonally and count transitions from water to land."],
  ex("For every unvisited land cell, launch a BFS or DFS that marks the whole connected island as visited, incrementing the count once per launch. Marking visited in place (flipping '1' to '0') avoids a separate visited structure.\n\nComplexity: O(rows × cols).\nFollow-up: on a huge grid, recursion can overflow the stack; use an explicit queue-based BFS.", r'''
func numIslands(grid [][]byte) int {
	if len(grid) == 0 {
		return 0
	}
	rows, cols, count := len(grid), len(grid[0]), 0
	var fill func(r, c int)
	fill = func(r, c int) {
		if r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1' {
			return
		}
		grid[r][c] = '0' // mark visited
		fill(r+1, c)
		fill(r-1, c)
		fill(r, c+1)
		fill(r, c-1)
	}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] == '1' {
				count++
				fill(r, c)
			}
		}
	}
	return count
}
'''), ["lc-islands"]),
 ("How do you find the k-th largest element of an unsorted array efficiently?", [ALG, EZ, "Heaps"], "medium",
  "Keep a min-heap of size k, popping the smallest whenever it grows past k; the root is the answer in O(n log k).",
  ["Keep a max-heap of every element and pop k times, which is O(log k) overall because each pop only touches the top of the heap.",
   "Sort the array in ascending order and take the k-th element from the front.",
   "Scan the array k times, removing the minimum each time."],
  ex("Maintain a min-heap of size k: push each element and pop the smallest whenever the heap exceeds k. Only the k largest survive, so the root is the k-th largest.\n\nComplexity: O(n log k), better than sorting (O(n log n)) when k is small.", r'''
type MinHeap []int

func (h MinHeap) Len() int            { return len(h) }
func (h MinHeap) Less(i, j int) bool  { return h[i] < h[j] }
func (h MinHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *MinHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
func (h *MinHeap) Pop() interface{} {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

func findKthLargest(nums []int, k int) int {
	h := &MinHeap{}
	heap.Init(h)
	for _, n := range nums {
		heap.Push(h, n)
		if h.Len() > k {
			heap.Pop(h)
		}
	}
	return (*h)[0]
}
'''), ["lc-kth", "container-heap"]),
 ("How does a trie support Insert, Search and StartsWith, and where could the Integration Hub use one?", [ALG, EZ, "Tries"], "medium",
  "Each node maps the next character to a child and marks word ends; all three run in O(length), and it suits matching patterns like order.*.",
  ["A trie stores each whole word in a hash set, so StartsWith must scan every stored word, which makes prefix lookups O(n·k) but exact search O(1).",
   "A trie is a balanced binary search tree ordered by word length.",
   "Tries can only store numbers, so words must be hashed first."],
  ex("Each node holds a map from character to child plus an end-of-word flag. Insert walks or creates nodes along the word; Search and StartsWith walk the same path, with Search also requiring the end flag.\n\nComplexity: O(word length) for all three.\nTie-in: event-type subscription matching, such as a subscriber registering for \"order.*\".", r'''
type TrieNode struct {
	children map[byte]*TrieNode
	isEnd    bool
}

type Trie struct{ root *TrieNode }

func NewTrie() *Trie { return &Trie{root: &TrieNode{children: make(map[byte]*TrieNode)}} }

func (t *Trie) Insert(word string) {
	node := t.root
	for i := 0; i < len(word); i++ {
		c := word[i]
		if node.children[c] == nil {
			node.children[c] = &TrieNode{children: make(map[byte]*TrieNode)}
		}
		node = node.children[c]
	}
	node.isEnd = true
}

func (t *Trie) find(word string) *TrieNode {
	node := t.root
	for i := 0; i < len(word); i++ {
		if node = node.children[word[i]]; node == nil {
			return nil
		}
	}
	return node
}

func (t *Trie) Search(word string) bool     { n := t.find(word); return n != nil && n.isEnd }
func (t *Trie) StartsWith(prefix string) bool { return t.find(prefix) != nil }
'''), ["lc-trie"]),
 ("How do you merge k sorted linked lists efficiently?", [ALG, EZ, "Heaps"], "hard",
  "Keep each list's current head in a min-heap; pop the smallest, append it, and push its successor, for O(N log k) overall.",
  ["Merge the lists one after another into a growing result list, which is the optimal approach because every merge step is linear in the list sizes.",
   "Concatenate all lists and run bubble sort on the result.",
   "Pick the smallest head by scanning all k lists every time, which is O(N log k)."],
  ex("A min-heap holding the current head of each list yields the smallest available element in O(log k): pop it, append it to the result, and push that list's next node. This beats pairwise merging (O(N·k) in the worst case).\n\nComplexity: O(N log k) for N total nodes.\nTie-in: merging sorted event streams from several Kafka partitions into one order.", r'''
type ListHeap []*ListNode

func (h ListHeap) Len() int            { return len(h) }
func (h ListHeap) Less(i, j int) bool  { return h[i].Val < h[j].Val }
func (h ListHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *ListHeap) Push(x interface{}) { *h = append(*h, x.(*ListNode)) }
func (h *ListHeap) Pop() interface{} {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

func mergeKLists(lists []*ListNode) *ListNode {
	h := &ListHeap{}
	heap.Init(h)
	for _, l := range lists {
		if l != nil {
			heap.Push(h, l)
		}
	}
	dummy := &ListNode{}
	curr := dummy
	for h.Len() > 0 {
		node := heap.Pop(h).(*ListNode)
		curr.Next = node
		curr = node
		if node.Next != nil {
			heap.Push(h, node.Next)
		}
	}
	return dummy.Next
}
'''), ["lc-merge-k", "container-heap"]),

 ("How do you find the second-highest amount in a table, handling ties correctly?", [SQL, EZ, "Window functions"], "medium",
  "Take MAX below the overall MAX, or use DENSE_RANK() OVER (ORDER BY amount DESC) and pick rank 2, so ties don't skip a value.",
  ["ORDER BY amount DESC LIMIT 1 OFFSET 1, which always returns the second-highest distinct value even when the top amount appears on several rows.",
   "Use ROW_NUMBER() and pick row 2, which handles ties the same way as DENSE_RANK.",
   "SELECT MIN(amount) after removing the minimum value."],
  ex("The inner query finds the true maximum; the outer finds the maximum of everything strictly below it. The general N-th version uses a window function. DENSE_RANK (not ROW_NUMBER) handles ties: two orders sharing the top amount both rank 1, so the true second-highest distinct value ranks 2. (LIMIT 1 OFFSET 1 returns the top value again when it's tied.)", r'''
SELECT MAX(amount_cents) AS second_highest
FROM orders
WHERE amount_cents < (SELECT MAX(amount_cents) FROM orders);

-- General N-th highest:
SELECT amount_cents FROM (
  SELECT amount_cents, DENSE_RANK() OVER (ORDER BY amount_cents DESC) AS rnk
  FROM orders
) ranked
WHERE rnk = 2;
''', "SQL"), ["lc-second-highest", "pg-window"]),
 ("How do you list partners with zero successful deliveries, including partners with no deliveries at all?", [SQL, EZ, "Joins"], "medium",
  "LEFT JOIN deliveries ON the id AND status = 'success', then keep rows WHERE d.id IS NULL; the status filter belongs in the ON clause.",
  ["LEFT JOIN deliveries and filter WHERE d.status = 'success' AND d.id IS NULL, since filtering in WHERE is equivalent to filtering in the ON clause for outer joins.",
   "INNER JOIN deliveries and keep rows where status is not 'success'.",
   "SELECT partners whose COUNT(*) of deliveries is zero using an INNER JOIN."],
  ex("A LEFT JOIN keeps every subscription even without a matching delivery. Filtering the join to status = 'success' means a partner with only failed deliveries still has NULL on the right side and appears in the result. Putting the status filter in WHERE instead is the classic mistake: it silently turns the LEFT JOIN into an INNER JOIN for partners with failed rows.", r'''
SELECT s.partner_name
FROM subscriptions s
LEFT JOIN deliveries d
  ON d.subscription_id = s.id AND d.status = 'success'
WHERE d.id IS NULL;
''', "SQL"), ["pg-join"]),
 ("How do you find partners with more than 10 failed deliveries in the last 24 hours?", [SQL, EZ, "Aggregation"], "easy",
  "Filter rows with WHERE (status and time window), GROUP BY partner, then filter groups with HAVING COUNT(*) > 10.",
  ["Put COUNT(*) > 10 in the WHERE clause next to the status filter, because WHERE runs after GROUP BY and can already see the aggregates.",
   "Use HAVING for the time window and WHERE for the count threshold.",
   "Use DISTINCT instead of GROUP BY and compare the row count in WHERE."],
  ex("WHERE filters rows before grouping (time window, status); HAVING filters groups after aggregation (the count threshold). Putting COUNT(*) > 10 in WHERE fails because the aggregate doesn't exist yet at that stage.", r'''
SELECT partner_name, COUNT(*) AS failure_count
FROM deliveries d
JOIN subscriptions s ON s.id = d.subscription_id
WHERE d.status = 'failed'
  AND d.created_at > NOW() - INTERVAL '24 hours'
GROUP BY partner_name
HAVING COUNT(*) > 10
ORDER BY failure_count DESC;
''', "SQL"), ["pg-agg"]),
 ("A query filtering deliveries by subscription_id and created_at shows a Seq Scan. What do you do?", [SQL, EZ, "Indexing"], "medium",
  "Add a composite index on (subscription_id, created_at), re-run EXPLAIN ANALYZE, and expect an index scan; column order matters.",
  ["Add an index on created_at alone, since a single-column index on the range column serves equality filters on subscription_id just as well as a composite one.",
   "Run VACUUM FULL, which converts sequential scans into index scans.",
   "Increase work_mem, because Seq Scans happen when memory is too low."],
  ex("A Seq Scan on a large table means Postgres reads every row instead of using an index. Fix with a composite index matching the filters, then re-run EXPLAIN ANALYZE and expect an Index Scan or Bitmap Index Scan with lower cost and runtime.\n\nTalking point: column order matters. (subscription_id, created_at) serves this query but wouldn't help a filter on created_at alone, because the second column can't be used without an equality filter on the first.", r'''
EXPLAIN ANALYZE
SELECT * FROM deliveries
WHERE subscription_id = 42 AND created_at > '2026-09-01';

CREATE INDEX idx_deliveries_subscription_created
ON deliveries (subscription_id, created_at);
''', "SQL"), ["pg-explain", "pg-multicol"]),
 ("How do you normalize a deliveries table that repeats partner_name and webhook_url on every row?", [SQL, EZ, "Normalization"], "medium",
  "Move partner attributes into a partners table and reference it by foreign key from deliveries: third normal form.",
  ["Keep the columns and add a trigger that updates every historical row when a URL changes, which is what third normal form recommends for such data.",
   "Split deliveries into one table per partner, each with its own copy of the columns.",
   "Store partner details as a JSON string in each delivery row."],
  ex("Repeating partner_name and partner_webhook_url on every delivery means a URL change requires updating thousands of rows and wastes storage. Move partner attributes into their own table referenced by a foreign key: the textbook fix for a transitive dependency (delivery -> partner_id -> partner_name), the core idea of 3NF.\n\nFollow-up: deliberate denormalization is fine for read-heavy reporting tables rebuilt periodically, as long as there's a clear source of truth.", r'''
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    webhook_url TEXT NOT NULL
);

CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    partner_id INT NOT NULL REFERENCES partners(id),
    status TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL
);
''', "SQL"), ["wiki-3nf"]),
 ("How do you audit processed_events for duplicate idempotency keys, and what does a result mean?", [SQL, EZ, "Data integrity"], "easy",
  "GROUP BY idempotency_key HAVING COUNT(*) > 1; any rows returned mean the unique constraint is missing, disabled or added after duplicates.",
  ["Use SELECT DISTINCT idempotency_key, which lists only the duplicated keys, and an empty result proves that the unique constraint was always in place.",
   "Count all rows and compare with yesterday's count.",
   "Duplicates are impossible in SQL tables, so no audit query is needed."],
  ex("With a unique constraint on idempotency_key in place, this query should always return zero rows. Getting results means the constraint is missing, disabled, or was added after duplicate data existed: a real diagnostic when investigating a suspected double-processing incident.", r'''
SELECT idempotency_key, COUNT(*) AS occurrences
FROM processed_events
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
''', "SQL"), ["pg-constraints"]),
 ("How do you show each day's delivery count together with a running total?", [SQL, EZ, "Window functions"], "medium",
  "GROUP BY day for the daily COUNT, and wrap it in SUM(COUNT(*)) OVER (ORDER BY day) for the cumulative total.",
  ["Use a correlated subquery that counts every earlier row for each day, which is faster than a window function because it avoids sorting the result.",
   "Use GROUP BY with ROLLUP, which produces a running total per day.",
   "Window functions run before GROUP BY, so they can't use aggregate results."],
  ex("COUNT(*) aggregates per day via GROUP BY; SUM(...) OVER (ORDER BY ...) is a window function that adds up the daily counts up to the current row without collapsing per-day rows. Window functions run after grouping and aggregation, which is what makes the combination possible in one query.", r'''
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS daily_count,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) AS running_total
FROM deliveries
GROUP BY DATE(created_at)
ORDER BY day;
''', "SQL"), ["pg-window"]),
 ("How do you model subscribers that can subscribe to many event types, and event types with many subscribers?", [SQL, EZ, "Modeling"], "easy",
  "A junction table of (subscriber_id, event_type_id) foreign keys with a composite primary key, joined across both sides.",
  ["Add an event_type_ids array column on subscribers and a subscriber_ids array on event_types, keeping both arrays in sync from application code.",
   "Add a single event_type_id column to subscribers.",
   "Duplicate each subscriber row once per event type."],
  ex("Neither table references the other directly; the junction table holds the many-to-many relationship as pairs of foreign keys, and its composite primary key prevents registering the same subscription twice. This is exactly the shape of the Integration Hub's subscription model.", r'''
CREATE TABLE subscribers (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE event_types (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE subscriber_event_types (
    subscriber_id INT REFERENCES subscribers(id),
    event_type_id INT REFERENCES event_types(id),
    PRIMARY KEY (subscriber_id, event_type_id)
);

SELECT s.name AS subscriber, et.name AS event_type
FROM subscribers s
JOIN subscriber_event_types set2 ON set2.subscriber_id = s.id
JOIN event_types et ON et.id = set2.event_type_id
ORDER BY s.name, et.name;
''', "SQL"), ["wiki-junction"]),

 ("How do you shut down a Go HTTP server gracefully?", [IMPL, EZ, "HTTP"], "medium",
  "Run ListenAndServe in a goroutine, wait for SIGINT or SIGTERM, then call srv.Shutdown with a timeout so in-flight requests finish.",
  ["Call os.Exit as soon as a signal arrives, because Kubernetes always waits for in-flight requests to complete before it sends SIGTERM to the pod.",
   "Call srv.Close(), which waits for every active request to finish.",
   "Let the process be killed; HTTP clients retry dropped requests automatically."],
  ex("Run the server in a goroutine so main can wait for an OS signal. On SIGINT or SIGTERM, call Shutdown with a timeout context: it stops accepting new connections but lets in-flight requests finish, instead of killing the process mid-request.\n\nTie-in: this is what makes Kubernetes rolling deployments safe.", r'''
func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", healthHandler)
	srv := &http.Server{Addr: ":8080", Handler: mux}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit // block until a signal arrives

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("forced shutdown: %v", err)
	}
}
'''), ["http-shutdown"]),
 ("How do you chain logging, panic-recovery and correlation-id middleware in Go, and in what order?", [IMPL, EZ, "HTTP"], "medium",
  "Each middleware wraps an http.Handler; recovery goes outermost to catch any panic, and correlation id runs before logging so lines include it.",
  ["Middleware order never matters in Go, because the net/http server sorts registered middleware automatically before it handles each incoming request.",
   "Put recovery innermost so it only catches panics from the handler's own code.",
   "Run logging first so the correlation id is generated by the logger."],
  ex("A middleware is a function taking an http.Handler and returning a wrapped one, so independent concerns compose without knowing about each other. Order matters: withRecovery should wrap everything (outermost) so a panic anywhere is caught, and withCorrelationID should run before withLogging so each log line has an id.", r'''
type Middleware func(http.Handler) http.Handler

func withCorrelationID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Correlation-ID")
		if id == "" {
			id = uuid.NewString()
		}
		ctx := context.WithValue(r.Context(), correlationIDKey, id)
		w.Header().Set("X-Correlation-ID", id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func withRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("panic recovered", "error", err)
				http.Error(w, "internal server error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func chain(h http.Handler, mws ...Middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}
'''), ["http-handler"]),
 ("Why must JWT middleware check the token's signing method inside the key function?", [IMPL, EZ, "Security"], "hard",
  "To block alg:none and algorithm-confusion attacks, where a forged token names a weaker or absent algorithm to skip signature verification.",
  ["Because checking the algorithm makes parsing faster, since the library otherwise tries every supported algorithm in turn before it can validate the token.",
   "Because the signing method determines the token's expiry time.",
   "It isn't necessary; the library always enforces HMAC by default."],
  ex("Explicitly checking t.Method is *jwt.SigningMethodHMAC inside the key function prevents a real vulnerability: the \"alg: none\" or algorithm-confusion attack, where a forged token claims a different, weaker or absent algorithm and tricks naive verification code into skipping the signature check.", r'''
func withJWTAuth(secret []byte) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenStr == authHeader {
				http.Error(w, "missing bearer token", http.StatusUnauthorized)
				return
			}
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return secret, nil
			})
			if err != nil || !token.Valid {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}
			claims := token.Claims.(jwt.MapClaims)
			ctx := context.WithValue(r.Context(), userIDKey, claims["sub"])
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
'''), ["golang-jwt"]),
 ("In a TTL cache, why check expiry in Get even though a background janitor deletes expired entries?", [IMPL, EZ, "Caching"], "medium",
  "Get's lazy check guarantees a stale entry is never returned between sweeps, while the janitor only reclaims memory from never-read entries.",
  ["The check in Get is redundant, because the janitor goroutine deletes every expired entry at the exact instant it expires, so stale reads can't happen.",
   "Get must check expiry because the janitor can only run when the cache is empty.",
   "Expired entries are returned on purpose, so callers can refresh them."],
  ex("Distinct from LRU (#5): entries expire by time, not capacity, which suits short-lived data like partner auth tokens. Get checks expiry lazily, so a stale but not-yet-swept entry is never returned; the background janitor exists purely to reclaim memory from entries that are never looked up again. Both mechanisms are needed.", r'''
type ttlEntry struct {
	value     interface{}
	expiresAt time.Time
}

type TTLCache struct {
	mu         sync.RWMutex
	data       map[string]ttlEntry
	defaultTTL time.Duration
}

func (c *TTLCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.data[key]
	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.value, true
}

func (c *TTLCache) janitor() {
	ticker := time.NewTicker(time.Minute)
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, v := range c.data {
			if now.After(v.expiresAt) {
				delete(c.data, k)
			}
		}
		c.mu.Unlock()
	}
}
'''), ["sync-rwmutex"]),
 ("How do you attach a correlation id to every log line within a request using log/slog?", [IMPL, EZ, "Logging"], "easy",
  "Derive a logger with slog.Default().With(\"correlation_id\", id) from the request context, so every call through it includes the field.",
  ["Pass the correlation id as an explicit argument to every single log call by hand, since slog has no way to attach fields to a logger ahead of time.",
   "Store the id in a global variable read by the default logger.",
   "Write the id once at the start of the request; later lines inherit it automatically."],
  ex("slog.Logger.With(...) returns a new logger that automatically includes the given fields on every subsequent call, so every log line in a request gets correlation_id without each call site passing it.", r'''
func loggerFromContext(ctx context.Context) *slog.Logger {
	base := slog.Default()
	if id, ok := ctx.Value(correlationIDKey).(string); ok {
		return base.With("correlation_id", id)
	}
	return base
}

func handleEvent(ctx context.Context, event Event) error {
	logger := loggerFromContext(ctx)
	logger.Info("processing event", "event_id", event.ID, "type", event.Type)
	if err := validate(event); err != nil {
		logger.Error("validation failed", "error", err)
		return err
	}
	logger.Info("event processed successfully")
	return nil
}
'''), ["slog"]),
 ("What principle should an environment-based config loader follow?", [IMPL, EZ, "Configuration"], "easy",
  "Fail fast at startup: validate required values and parse types before the server listens, instead of failing mid-request later.",
  ["Load config lazily the first time each value is used, so the service starts quickly and missing values only matter if that code path is ever reached.",
   "Hard-code production values in the binary as fallbacks for missing variables.",
   "Ignore parse errors and use zero values for anything invalid."],
  ex("Every real service needs this. Fail fast at startup: return an error before the server listens rather than discovering a missing or malformed value the first time it's used mid-request. A startup failure is far easier to diagnose than a runtime one hours into production traffic.", r'''
type Config struct {
	Port         int
	DatabaseURL  string
	KafkaBrokers []string
	MaxRetries   int
}

func LoadConfig() (*Config, error) {
	port, err := strconv.Atoi(getEnvOrDefault("PORT", "8080"))
	if err != nil {
		return nil, fmt.Errorf("invalid PORT: %w", err)
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	brokers := strings.Split(getEnvOrDefault("KAFKA_BROKERS", "localhost:9092"), ",")
	maxRetries, err := strconv.Atoi(getEnvOrDefault("MAX_RETRIES", "3"))
	if err != nil {
		return nil, fmt.Errorf("invalid MAX_RETRIES: %w", err)
	}
	return &Config{Port: port, DatabaseURL: dbURL, KafkaBrokers: brokers, MaxRetries: maxRetries}, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
'''), ["twelve-factor-config"]),
 ("In an in-process channel pub/sub, what trade-off does a select with a default branch on publish make?", [IMPL, EZ, "Concurrency"], "medium",
  "It never blocks the publisher but drops messages for slow subscribers: fine for a best-effort bus, wrong where delivery must be guaranteed.",
  ["It guarantees every subscriber receives every message, because the default branch retries the send until the subscriber's buffer has room again.",
   "It makes Publish block until all subscribers have read the message.",
   "It sends each message only to the fastest subscriber."],
  ex("A smaller-scale version of the platform's fan-out problem. The select/default pattern prioritizes never blocking the publisher over guaranteed delivery: when a subscriber's buffer is full, the message is dropped (count it in a metric rather than failing silently). Legitimate for a best-effort in-process bus, but not what the Integration Hub wants, which is why production uses Kafka plus the outbox.", r'''
type PubSub struct {
	mu   sync.RWMutex
	subs map[string][]chan Event
}

func (p *PubSub) Subscribe(topic string) <-chan Event {
	p.mu.Lock()
	defer p.mu.Unlock()
	ch := make(chan Event, 10) // buffered so a slow subscriber doesn't block Publish
	p.subs[topic] = append(p.subs[topic], ch)
	return ch
}

func (p *PubSub) Publish(topic string, event Event) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	for _, ch := range p.subs[topic] {
		select {
		case ch <- event:
		default:
			// buffer full: drop rather than block; increment a metric here
		}
	}
}
'''), ["pipelines"]),
 ("How do a circuit breaker and retries interact in a resilient HTTP client?", [IMPL, EZ, "Resilience"], "hard",
  "Check the breaker before calling at all (fail fast on a known-down dependency); retries with backoff then handle transient failures within one call.",
  ["Retry inside the breaker's open state, because an open circuit means the dependency just recovered and is now ready to accept a burst of retried calls.",
   "The breaker replaces retries entirely, so a client should never retry.",
   "Retries must run before the breaker check, so every call is attempted at least three times."],
  ex("The breaker check happens before even attempting the call, failing fast when the dependency is known to be down. Retries happen within a single call's attempt budget, handling transient failures on an otherwise healthy dependency. They operate at different time scales and layer cleanly.", r'''
func (c *ResilientClient) Post(ctx context.Context, url string, body []byte) error {
	if !c.breaker.Allow() {
		return errors.New("circuit open: refusing to call known-down endpoint")
	}
	const maxAttempts = 3
	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
		if err != nil {
			return err // not retryable
		}
		resp, err := c.client.Do(req)
		if err == nil && resp.StatusCode < 500 {
			c.breaker.RecordSuccess()
			resp.Body.Close()
			return nil
		}
		if resp != nil {
			resp.Body.Close()
		}
		lastErr = err
		c.breaker.RecordFailure()
		if attempt < maxAttempts {
			time.Sleep(time.Duration(attempt) * 500 * time.Millisecond) // simple linear backoff
		}
	}
	return fmt.Errorf("failed after %d attempts: %w", maxAttempts, lastErr)
}
'''), ["aws-backoff", "circuit-breaker"]),
 ("Why should business logic depend on a repository interface rather than SQL calls scattered through the code?", [IMPL, EZ, "Data access"], "medium",
  "So tests can swap in an in-memory fake without a database; and when scanning rows, always check rows.Err() after the loop.",
  ["Because Go's database/sql only works through interfaces, so code that calls db.QueryContext directly won't compile without a repository wrapper.",
   "Because repositories make queries run faster by caching every result.",
   "Because it lets each handler open its own database connection."],
  ex("Business logic depends on SubscriptionRepository (the interface), not postgresSubscriptionRepo, so tests can use an in-memory fake without a real database: the same dependency inversion as injecting an HTTP client, applied to data access. Also check rows.Err() after iterating; a scan failure mid-stream is easy to miss otherwise.", r'''
type SubscriptionRepository interface {
	Create(ctx context.Context, sub Subscription) error
	GetByPartner(ctx context.Context, partnerID string) ([]Subscription, error)
	Delete(ctx context.Context, id string) error
}

type postgresSubscriptionRepo struct{ db *sql.DB }

func (r *postgresSubscriptionRepo) GetByPartner(ctx context.Context, partnerID string) ([]Subscription, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, partner_id, event_type FROM subscriptions WHERE partner_id = $1`, partnerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var subs []Subscription
	for rows.Next() {
		var s Subscription
		if err := rows.Scan(&s.ID, &s.PartnerID, &s.EventType); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	return subs, rows.Err() // always check Err() after the loop
}
'''), ["database-sql"]),
 ("Why use sync.Once for lazy singleton initialization in Go?", [IMPL, EZ, "Concurrency"], "easy",
  "Once.Do runs its function exactly once even under concurrent calls, avoiding the race in a naive nil check.",
  ["A naive if instance == nil check is already safe in Go, because the runtime serializes goroutines that touch the same package-level variable.",
   "sync.Once runs the function on every call but caches the result.",
   "sync.Once is only needed when the program runs on a single CPU core."],
  ex("sync.Once.Do guarantees its function runs exactly once even if called concurrently from many goroutines at startup. A naive if dbInstance == nil check races: two goroutines can both see nil and both initialize, defeating the singleton.", r'''
var (
	dbInstance *Database
	dbOnce     sync.Once
)

func GetDatabase(dsn string) *Database {
	dbOnce.Do(func() {
		conn, err := sql.Open("postgres", dsn)
		if err != nil {
			log.Fatalf("failed to open database: %v", err)
		}
		dbInstance = &Database{conn: conn}
	})
	return dbInstance
}
'''), ["sync-once"]),
 ("What distinguishes debouncing from throttling, and how do you debounce in Go?", [IMPL, EZ, "Timers"], "medium",
  "Debounce resets a timer on every call so fn runs once after activity settles; throttling runs at a steady maximum rate regardless.",
  ["Debouncing runs the function at a fixed maximum rate no matter how often it's called, which is exactly the same behaviour as throttling.",
   "Debouncing runs fn immediately on every call and then sleeps.",
   "Debouncing queues every call and runs each of them later in order."],
  ex("Each call stops the pending timer and starts a new one, so fn only runs once activity has quieted for the full delay. Throttling, by contrast, guarantees execution at a steady maximum rate regardless of continued activity. Useful for things like flushing buffered log lines after activity settles.", r'''
func debounce(delay time.Duration, fn func()) func() {
	var mu sync.Mutex
	var timer *time.Timer
	return func() {
		mu.Lock()
		defer mu.Unlock()
		if timer != nil {
			timer.Stop()
		}
		timer = time.AfterFunc(delay, fn)
	}
}
'''), ["time-afterfunc"]),
 ("How does a worker pool shut down cleanly with context cancellation, and what doesn't it cancel?", [IMPL, EZ, "Concurrency"], "medium",
  "Workers select on the jobs channel and ctx.Done(), so they stop taking new jobs on cancel; a job already running stops only if it honours ctx.",
  ["Cancelling the context immediately kills every running goroutine mid-job, because Go preempts goroutines whose context has been cancelled.",
   "Workers must drain every remaining job before they can observe cancellation.",
   "Closing the context channel restarts all workers with fresh state."],
  ex("The select between reading jobs and ctx.Done() means a worker responds to shutdown immediately instead of only after draining the channel. Call it out explicitly: this stops picking up new jobs on cancellation but doesn't interrupt a job already inside process(); true mid-task cancellation requires process to accept and respect the context.", r'''
func runWorkerPool(ctx context.Context, jobs <-chan Job, numWorkers int, process func(Job)) {
	var wg sync.WaitGroup
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case job, ok := <-jobs:
					if !ok {
						return // no more work coming
					}
					process(job)
				case <-ctx.Done():
					return // shutdown requested
				}
			}
		}()
	}
	wg.Wait()
}
'''), ["context-pkg"]),
]

assert len(Q) == 38, len(Q)

# Shorter lead distractors so the correct option isn't predictably the shortest.
SHORTER = {
 0: "Generate every substring and keep the longest one without duplicates.",
 2: "Sort the array and walk two pointers inward from both ends.",
 4: "Use a sorted array of keys ordered by access time, binary searched.",
 8: "Sort the items alphabetically and process them in that order.",
 12: "Count opening and closing brackets of each kind and compare the totals.",
 21: "Add a single-column index on created_at alone.",
 26: "Middleware order never matters; net/http sorts it automatically.",
 34: "A naive nil check is already safe in Go.",
}
for i, text in SHORTER.items():
    q = list(Q[i])
    q[4] = [text] + q[4][1:]
    Q[i] = tuple(q)
build("ezCater algorithm, SQL and Go implementation practice", M, Q, sys.argv[1], strip_backticks=False)
