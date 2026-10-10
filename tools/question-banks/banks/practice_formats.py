"""Practice-formats bank: output, multi-select and ordering questions.

Expected outputs are captured by really running each snippet (node / go run),
so they can't drift from what the code prints.
"""
import json, subprocess, sys, os

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snippets')

def run(name):
    path = os.path.join(HERE, name)
    cmd = ['node', path] if name.endswith('.js') else ['go', 'run', path]
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout

def src(name):
    code = open(os.path.join(HERE, name)).read().rstrip('\n')
    return code

JS, GO, ASYNC, SQL, ALGO = 'JavaScript', 'Go', 'Async & Concurrency', 'SQL & Databases', 'Algorithms & Data Structures'
DIST, API, PERF = 'Distributed Systems & Messaging', 'APIs & HTTP', 'Performance & Memory'

materials = [
 {"key": "mdn-event-loop", "type": "article", "title": "The event loop", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop", "author": "MDN Web Docs", "description": "Stack, heap and queue."},
 {"key": "mdn-microtask", "type": "article", "title": "Using microtasks in JavaScript with queueMicrotask()", "url": "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide", "author": "MDN Web Docs", "description": "When and how microtasks run."},
 {"key": "mdn-closures-loops", "type": "article", "title": "Creating closures in loops: a common mistake", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#creating_closures_in_loops_a_common_mistake", "author": "MDN Web Docs", "description": "Why var in a loop shares one binding."},
 {"key": "jsi-type-conversions", "type": "article", "title": "javascript.info: Type conversions", "url": "https://javascript.info/type-conversions", "author": "javascript.info", "description": "String, numeric and boolean conversion rules."},
 {"key": "jsi-types", "type": "article", "title": "javascript.info: Data types", "url": "https://javascript.info/types", "author": "javascript.info", "description": "Primitives, typeof and its quirks."},
 {"key": "jsi-object-copy", "type": "article", "title": "javascript.info: Object references and copying", "url": "https://javascript.info/object-copy", "author": "javascript.info", "description": "Copying by reference, shallow and deep copies."},
 {"key": "jsi-async-await", "type": "article", "title": "javascript.info: Async/await", "url": "https://javascript.info/async-await", "author": "javascript.info", "description": "await, error handling and parallelism."},
 {"key": "mdn-new", "type": "article", "title": "new operator", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new", "author": "MDN Web Docs", "description": "The four steps new performs."},
 {"key": "eff-defer", "type": "article", "title": "Effective Go: Defer", "url": "https://go.dev/doc/effective_go#defer", "author": "The Go Authors", "description": "How defer schedules cleanup."},
 {"key": "slices-intro", "type": "article", "title": "Go Slices: usage and internals", "url": "https://go.dev/blog/slices-intro", "author": "The Go Authors", "description": "Length, capacity, nil and empty slices."},
 {"key": "faq-nil-error", "type": "article", "title": "Go FAQ: Why is my nil error value not equal to nil?", "url": "https://go.dev/doc/faq#nil_error", "author": "The Go Authors", "description": "A related nil-comparison subtlety."},
 {"key": "go113-errors", "type": "article", "title": "Working with Errors in Go 1.13", "url": "https://go.dev/blog/go1.13-errors", "author": "The Go Authors", "description": "Wrapping with %w, errors.Is and errors.As."},
 {"key": "go-strings", "type": "article", "title": "Strings, bytes, runes and characters in Go", "url": "https://go.dev/blog/strings", "author": "The Go Authors", "description": "Why len counts bytes, not characters. Added as a standard reference; not from your notes."},
 {"key": "pg-indexes", "type": "article", "title": "Indexes", "url": "https://www.postgresql.org/docs/current/indexes.html", "author": "PostgreSQL documentation", "description": "Multicolumn, partial and expression indexes."},
 {"key": "pg-select", "type": "article", "title": "SELECT", "url": "https://www.postgresql.org/docs/current/sql-select.html", "author": "PostgreSQL documentation", "description": "How a SELECT is processed, clause by clause. Added as a standard reference; not from your notes."},
 {"key": "mdn-http-overview", "type": "article", "title": "An overview of HTTP", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", "author": "MDN Web Docs", "description": "Requests, responses and the connection underneath. Added as a standard reference; not from your notes."},
]

def out(prompt, tags, diff, file, expl, mats):
    return {"type": "output", "prompt": prompt, "tags": tags, "difficulty": diff,
            "code": src(file), "codeLanguage": "js" if file.endswith('.js') else "go",
            "expectedOutput": run(file), "explanation": expl, "materials": mats}

questions = [
 out("Predict the output: synchronous code, promises, queueMicrotask and a zero-delay timer.", [JS, ASYNC], "medium", "js1.js",
     "Synchronous code runs first (`A`, `B`). Then the whole microtask queue drains in the order things were queued: the promise reaction, then the `queueMicrotask` callback. Only after that does the event loop take the next task, the timer.", ["mdn-event-loop", "mdn-microtask"]),
 out("Predict the output: `var` versus `let` in loops with timers.", [JS], "medium", "js2.js",
     "`var` is function-scoped, so the three callbacks share one `i`, which is `3` once the loop ends. `let` creates a fresh binding per iteration, so each callback keeps its own `j`. The `var` timers were scheduled first, so they print first.", ["mdn-closures-loops"]),
 out("Predict the output: `typeof` quirks and `NaN`.", [JS], "easy", "js3.js",
     "`typeof null` is `\"object\"` (a historical bug), arrays are objects, and functions report `\"function\"`. `NaN` is the only value not equal to itself, which is why `Number.isNaN` exists.", ["jsi-types"]),
 out("Predict the output: coercion with `+`, `-`, `||` and `??`.", [JS], "medium", "js4.js",
     "`+` concatenates when either side is a string; `-` always converts to numbers. Arrays are turned into strings (`\"1,2\" + \"3\"`). `||` falls back for any falsy value, so `0` is replaced; `??` only for `null`/`undefined`, so `0` stays.", ["jsi-type-conversions"]),
 out("Predict the output: spreading an object with a nested object.", [JS], "medium", "js5.js",
     "Spread copies one level. `b.n = 2` changes only the copy, but `b.inner` is the same object as `a.inner`, so changing it shows up through `a` too. Use `structuredClone` for a deep copy.", ["jsi-object-copy"]),
 out("Predict the output: what runs before and after an `await`?", [JS, ASYNC], "hard", "js6.js",
     "An async function runs synchronously until its first `await`. The rest of it is scheduled as a microtask, so the caller continues first (`after`), and the function resumes once the current task finishes.", ["jsi-async-await", "mdn-microtask"]),
 out("Predict the output: several `defer` calls in a loop.", [GO], "easy", "go1.go",
     "Deferred calls run when the function returns, last-in-first-out. The arguments are evaluated when `defer` runs, so each call keeps its own `i`: they print 2, 1, 0 after `done`.", ["eff-defer"]),
 out("Predict the output: appending to a sub-slice.", [GO, PERF], "hard", "go2.go",
     "`t := s[:2]` shares `s`'s backing array and has capacity 3, so `append` writes `99` into the shared array instead of allocating. Both slices now see it. Use a full slice expression (`s[:2:2]`) to force a copy on append.", ["slices-intro"]),
 out("Predict the output: nil maps and string length.", [GO], "medium", "go3.go",
     "Reading from a nil map returns the zero value and `len` is 0 (writing would panic). `len` of a string counts bytes: `é` is two bytes in UTF-8, so 6 bytes but 5 runes.", ["go-strings", "slices-intro"]),
 out("Predict the output: a nil pointer returned as an `error`, and `%w` wrapping.", [GO], "hard", "go4.go",
     "An interface is nil only if both its type and value are nil. Returning a nil `*MyErr` as `error` gives an interface with a type and a nil value, so `err == nil` is false: return a literal `nil` instead. `%w` keeps the wrapped error for `errors.Is`/`errors.As` and prints its message.", ["faq-nil-error", "go113-errors"]),

 {"type": "multi-select", "prompt": "Which of these schedule their callback as a microtask?", "tags": [JS, ASYNC], "difficulty": "medium",
  "options": ["`promise.then(cb)`", "`setTimeout(cb, 0)`", "`queueMicrotask(cb)`", "The code after `await` in an async function", "`setInterval(cb, 10)`"],
  "correctIndices": [0, 2, 3],
  "explanation": "Promise reactions, `queueMicrotask` and `await` continuations are microtasks: they run as soon as the current task ends, before any timer. `setTimeout` and `setInterval` schedule tasks (macrotasks).", "materials": ["mdn-microtask", "mdn-event-loop"]},
 {"type": "multi-select", "prompt": "Which Go values share their underlying data when you assign them to another variable?", "tags": [GO, PERF], "difficulty": "medium",
  "options": ["A slice", "A map", "An array", "A channel", "A struct holding only ints"],
  "correctIndices": [0, 1, 3],
  "explanation": "Slices, maps and channels are small headers that point at shared data, so a copy still refers to the same elements. Arrays and plain structs are values: assigning copies every field.", "materials": ["slices-intro"]},
 {"type": "multi-select", "prompt": "Which queries can a plain B-tree index on `orders(created_at)` speed up?", "tags": [SQL, PERF], "difficulty": "medium",
  "options": ["`WHERE created_at = '2026-10-01'`", "`WHERE created_at > now() - interval '7 days'`", "`ORDER BY created_at DESC LIMIT 20`", "`WHERE to_char(created_at, 'YYYY') = '2026'`"],
  "correctIndices": [0, 1, 2],
  "explanation": "A B-tree handles equality, ranges and ordered scans on the indexed column. Wrapping the column in a function (`to_char(created_at, …)`) hides it from the index; that needs an expression index or a rewrite as a range.", "materials": ["pg-indexes"]},

 {"type": "ordering", "prompt": "Put the logical evaluation order of a SQL `SELECT` in order.", "tags": [SQL], "difficulty": "medium",
  "options": ["`FROM` / `JOIN`", "`WHERE`", "`GROUP BY`", "`HAVING`", "`SELECT` (computing the output columns)"],
  "explanation": "Rows are gathered (`FROM`), filtered (`WHERE`), grouped (`GROUP BY`), groups are filtered (`HAVING`), and only then are output columns computed. That's why `WHERE` can't use a `SELECT` alias or an aggregate, but `HAVING` can use aggregates. (`ORDER BY` and `LIMIT` come last.)", "materials": ["pg-select"]},
 {"type": "ordering", "prompt": "Put the steps of `new Person(\"Ana\")` in order.", "tags": [JS], "difficulty": "medium",
  "options": ["Create a new empty object", "Link its prototype to `Person.prototype`", "Run `Person` with `this` set to the new object", "Return the object (unless the constructor returned another object)"],
  "explanation": "`new` creates an object, links it to the constructor's prototype, calls the constructor with `this` bound to it, and returns it. That linking is why methods on `Person.prototype` are available on every instance.", "materials": ["mdn-new"]},
 {"type": "ordering", "prompt": "Put the steps of a browser's first HTTPS request to a new site in order.", "tags": [API], "difficulty": "easy",
  "options": ["DNS lookup of the host name", "TCP handshake", "TLS handshake", "Send the HTTP request", "Receive the response"],
  "explanation": "The browser resolves the name to an IP, opens a TCP connection (SYN, SYN-ACK, ACK), negotiates encryption with TLS, and only then sends the request. Keep-alive and HTTP/2 let later requests reuse the connection and skip the first three steps.", "materials": ["mdn-http-overview"]},
]

for q in questions:
    q.setdefault("correct", 0)
bank = {"name": "Practice formats: predict the output, pick all, ordering", "materials": materials, "questions": questions}
prompts = [q["prompt"] for q in questions]
assert len(prompts) == len(set(prompts))
used = {k for q in questions for k in q["materials"]}
assert used == {m["key"] for m in materials}, used ^ {m["key"] for m in materials}
with open(sys.argv[1], "w") as f:
    json.dump(bank, f, indent=2, ensure_ascii=False)
from collections import Counter
print(len(questions), "questions:", dict(Counter(q["type"] for q in questions)))
