import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # tools/question-banks
from bankgen import build

MDN, JSI, NODE, WEBDEV, OWASP = "MDN Web Docs", "javascript.info", "Node.js", "web.dev", "OWASP"
ADD = "added"
D = "https://developer.mozilla.org/en-US/docs/"


def mdn(path, title, desc, unverified=False):
    return ("article", title, D + path, MDN, desc, unverified)


def jsi(slug, title, desc):
    return ("article", f"javascript.info: {title}", f"https://javascript.info/{slug}", JSI, desc, False)


M = {
 # books and courses
 "ydkjs": ("book", "You Don't Know JS Yet (book series)", "https://github.com/getify/You-Dont-Know-JS", "Kyle Simpson", "Free series: Get Started, Scope & Closures, Objects & Classes, Types & Grammar.", False),
 "eloquent": ("book", "Eloquent JavaScript", "https://eloquentjavascript.net/", "Marijn Haverbeke", "Free online book; see the data structures and higher-order functions chapters.", False),
 "exploring-js": ("book", "Exploring JS", "https://exploringjs.com/", "Axel Rauschmayer", "Free, in-depth books on modern JavaScript features.", False),
 "effective-ts": ("book", "Effective TypeScript", "https://effectivetypescript.com/", "Dan Vanderkam", "Specific ways to improve your TypeScript.", ADD),
 "fm-deep-js": ("video", "Deep JavaScript Foundations, v3", "https://frontendmasters.com/courses/deep-javascript-v3/", "Kyle Simpson", "Paid course; the coercion section covers == in depth.", False),
 "namaste-js": ("video", "Namaste JavaScript", "https://www.youtube.com/@akshaymarch7", "Akshay Saini", "YouTube series; the closures episodes cover the loop puzzle.", ADD),
 # A. core and types
 "mdn-types": mdn("Web/JavaScript/Data_structures", "JavaScript data types and data structures", "The seven primitives and objects."),
 "jsi-types": jsi("types", "Data types", "Primitives, typeof and its quirks."),
 "mdn-equality": mdn("Web/JavaScript/Equality_comparisons_and_sameness", "Equality comparisons and sameness", "==, ===, Object.is and SameValueZero."),
 "jsi-comparison": jsi("comparison", "Comparisons", "How comparisons convert their operands."),
 "mdn-let": mdn("Web/JavaScript/Reference/Statements/let", "let", "Block scope and the temporal dead zone."),
 "mdn-const": mdn("Web/JavaScript/Reference/Statements/const", "const", "Constant bindings, not immutable values."),
 "jsi-variables": jsi("variables", "Variables", "Declaring variables with let and const."),
 "mdn-hoisting": mdn("Glossary/Hoisting", "Hoisting", "What gets hoisted, and how."),
 "jsi-closure": jsi("closure", "Variable scope, closure", "Lexical environments, closures and hoisting."),
 "mdn-truthy": mdn("Glossary/Truthy", "Truthy", "Values that count as true in a boolean context."),
 "mdn-falsy": mdn("Glossary/Falsy", "Falsy", "The short list of values that count as false."),
 "jsi-logical": jsi("logical-operators", "Logical operators", "||, && and ! and what they return."),
 "mdn-null": mdn("Web/JavaScript/Reference/Operators/null", "null", "The intentional absence of a value."),
 "mdn-undefined": mdn("Web/JavaScript/Reference/Global_Objects/undefined", "undefined", "The value of anything not yet assigned."),
 "jsi-nullish": jsi("nullish-coalescing-operator", "Nullish coalescing operator ??", "Defaults only for null and undefined."),
 "jsi-object-copy": jsi("object-copy", "Object references and copying", "Copying by reference, shallow and deep copies."),
 "mdn-primitive": mdn("Glossary/Primitive", "Primitive", "Immutable values without methods of their own."),
 "mdn-structuredclone": mdn("Web/API/Window/structuredClone", "structuredClone()", "Built-in deep copy using the structured clone algorithm."),
 "webdev-structured-clone": ("article", "Deep-copying in JavaScript using structuredClone", "https://web.dev/articles/structured-clone", WEBDEV, "What structuredClone handles and what it doesn't.", True),
 "mdn-number": mdn("Web/JavaScript/Reference/Global_Objects/Number", "Number", "IEEE 754 doubles, EPSILON and MAX_SAFE_INTEGER."),
 "mdn-bigint": mdn("Web/JavaScript/Reference/Global_Objects/BigInt", "BigInt", "Arbitrary-precision integers."),
 "point-three": ("link", "0.30000000000000004.com", "https://0.30000000000000004.com/", "Erik Wiffin", "Floating-point math across many languages.", False),
 "jsi-number": jsi("number", "Numbers", "Imprecise calculations and how to work around them."),
 "jsi-type-conversions": jsi("type-conversions", "Type conversions", "String, numeric and boolean conversion rules."),
 "mdn-coercion": mdn("Glossary/Type_coercion", "Type coercion", "Automatic conversion between types."),
 # B. functions, scope, this, prototypes
 "mdn-closures": mdn("Web/JavaScript/Closures", "Closures", "Lexical scoping, closures and their uses."),
 "mdn-closures-loops": mdn("Web/JavaScript/Closures#creating_closures_in_loops_a_common_mistake", "Creating closures in loops: a common mistake", "Why var in a loop shares one binding."),
 "mdn-this": mdn("Web/JavaScript/Reference/Operators/this", "this", "How this is determined for each kind of call."),
 "jsi-object-methods": jsi("object-methods", 'Object methods, "this"', "Methods, this and losing it."),
 "mdn-bind": mdn("Web/JavaScript/Reference/Global_Objects/Function/bind", "Function.prototype.bind()", "Fixing this and leading arguments."),
 "jsi-bind": jsi("bind", "Function binding", "Losing this, and bind as the fix."),
 "mdn-arrow": mdn("Web/JavaScript/Reference/Functions/Arrow_functions", "Arrow function expressions", "What arrows don't have: this, arguments, prototype."),
 "jsi-arrow": jsi("arrow-functions", "Arrow functions revisited", "Arrows and the outer this."),
 "mdn-proto-chain": mdn("Web/JavaScript/Inheritance_and_the_prototype_chain", "Inheritance and the prototype chain", "How property lookup walks [[Prototype]]."),
 "jsi-proto": jsi("prototype-inheritance", "Prototypal inheritance", "[[Prototype]], __proto__ and Object.create."),
 "mdn-classes": mdn("Web/JavaScript/Reference/Classes", "Classes", "Class syntax, private fields and static members."),
 "jsi-class": jsi("class", "Class basic syntax", "What a class really is under the hood."),
 "mdn-new": mdn("Web/JavaScript/Reference/Operators/new", "new operator", "The four steps new performs."),
 "jsi-constructor-new": jsi("constructor-new", 'Constructor, operator "new"', "Constructor functions and new."),
 "jsi-currying": jsi("currying-partials", "Currying", "Currying and partial application."),
 "mdn-first-class": mdn("Glossary/First-class_Function", "First-class function", "Functions as values."),
 "jsi-decorators": jsi("call-apply-decorators", "Decorators and forwarding, call/apply", "Caching decorators; tasks include debounce and throttle."),
 "mdn-map": mdn("Web/JavaScript/Reference/Global_Objects/Map", "Map", "Keyed collection with any key type."),
 # C. async and the event loop
 "roberts-event-loop": ("video", "What the heck is the event loop anyway?", "https://www.youtube.com/watch?v=8aGhZQkoFbQ", "Philip Roberts", "The classic visual explanation (JSConf EU 2014).", False),
 "archibald-in-the-loop": ("video", "In The Loop (JSConf.Asia 2018)", "https://www.youtube.com/watch?v=cCOL7MC4Pl0", "Jake Archibald", "Tasks, microtasks and rendering in the browser.", ADD),
 "hallie-event-loop": ("article", "JavaScript Visualized: Event Loop", "https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif", "Lydia Hallie", "Animated walkthrough of the call stack and queues.", False),
 "mdn-event-loop": mdn("Web/JavaScript/Event_loop", "The event loop", "Stack, heap and queue."),
 "archibald-tasks": ("article", "Tasks, microtasks, queues and schedules", "https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/", "Jake Archibald", "Step-by-step ordering of tasks and microtasks.", True),
 "mdn-microtask": mdn("Web/API/HTML_DOM_API/Microtask_guide", "Using microtasks in JavaScript with queueMicrotask()", "When and how microtasks run."),
 "jsi-microtask": jsi("microtask-queue", "Microtasks", "Why promise handlers run before timers."),
 "jsi-callbacks": jsi("callbacks", "Introduction: callbacks", "Callbacks and the pyramid of doom."),
 "node-promisify": ("article", "util.promisify(original)", "https://nodejs.org/api/util.html#utilpromisifyoriginal", NODE, "Turning error-first callbacks into promises.", False),
 "callbackhell": ("link", "Callback Hell", "https://callbackhell.com/", "Max Ogden", "A guide to writing asynchronous JavaScript programs.", True),
 "mdn-using-promises": mdn("Web/JavaScript/Guide/Using_promises", "Using promises", "Chaining, error handling and composition."),
 "jsi-promise-basics": jsi("promise-basics", "Promise", "States, resolve and reject."),
 "jsi-promise-chaining": jsi("promise-chaining", "Promises chaining", "How then returns a new promise."),
 "hallie-promises": ("article", "JavaScript Visualized: Promises & Async/Await", "https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke", "Lydia Hallie", "Animated walkthrough of promises and await.", False),
 "mdn-promise-concurrency": mdn("Web/JavaScript/Reference/Global_Objects/Promise#promise_concurrency", "Promise concurrency methods", "all, allSettled, any and race compared."),
 "jsi-promise-api": jsi("promise-api", "Promise API", "Promise.all, allSettled, race and any."),
 "mdn-async-function": mdn("Web/JavaScript/Reference/Statements/async_function", "async function", "Async functions always return a promise."),
 "jsi-async-await": jsi("async-await", "Async/await", "await, error handling and parallelism."),
 "mdn-error-cause": mdn("Web/JavaScript/Reference/Global_Objects/Error/cause", "Error: cause", "Wrapping errors without losing the original."),
 "webdev-async-iterators": ("article", "Async iterators and generators", "https://web.dev/articles/async-iterators", "Jake Archibald", "Streaming async data with for await.", True),
 "mdn-for-await": mdn("Web/JavaScript/Reference/Statements/for-await...of", "for await...of", "Iterating async iterables."),
 "node-unhandled": ("article", "process: 'unhandledRejection' event", "https://nodejs.org/api/process.html#event-unhandledrejection", NODE, "How Node reports and handles unhandled rejections.", False),
 "mdn-unhandledrejection": mdn("Web/API/Window/unhandledrejection_event", "Window: unhandledrejection event", "The browser's unhandled rejection event."),
 "jsi-promise-error": jsi("promise-error-handling", "Error handling with promises", "Implicit try/catch and unhandled rejections."),
 "mdn-settimeout": mdn("Web/API/Window/setTimeout#reasons_for_delays_longer_than_specified", "setTimeout(): reasons for delays longer than specified", "Clamping, throttling and a busy main thread."),
 "jsi-settimeout": jsi("settimeout-setinterval", "Scheduling: setTimeout and setInterval", "Zero-delay timers and nested setTimeout."),
 "mdn-abortcontroller": mdn("Web/API/AbortController", "AbortController", "Cancelling fetch and other async work."),
 "jsi-fetch-abort": jsi("fetch-abort", "Fetch: Abort", "Aborting requests with AbortController."),
 # D. modern JavaScript
 "mdn-destructuring": mdn("Web/JavaScript/Reference/Operators/Destructuring_assignment", "Destructuring assignment", "Unpacking arrays and objects, defaults and renaming."),
 "jsi-destructuring": jsi("destructuring-assignment", "Destructuring assignment", "Patterns, defaults and the rest pattern."),
 "jsi-rest-spread": jsi("rest-parameters-spread", "Rest parameters and spread syntax", "Collecting and expanding values."),
 "mdn-modules": mdn("Web/JavaScript/Guide/Modules", "JavaScript modules", "import, export and dynamic import()."),
 "node-esm": ("article", "Modules: ECMAScript modules", "https://nodejs.org/api/esm.html", NODE, "ESM in Node: .mjs, type: module and interop.", False),
 "jsi-modules": jsi("modules-intro", "Modules, introduction", "What makes a module different from a script."),
 "mdn-keyed": mdn("Web/JavaScript/Guide/Keyed_collections", "Keyed collections", "Map, Set, WeakMap and WeakSet."),
 "jsi-map-set": jsi("map-set", "Map and Set", "When to use them over objects and arrays."),
 "jsi-weakmap": jsi("weakmap-weakset", "WeakMap and WeakSet", "Weakly held keys for caches and metadata."),
 "mdn-iterators": mdn("Web/JavaScript/Guide/Iterators_and_generators", "Iterators and generators", "The iteration protocols and function*."),
 "jsi-generators": jsi("generators", "Generators", "yield, iteration and composition."),
 "jsi-async-iter": jsi("async-iterators-generators", "Async iteration and generators", "for await and async generators."),
 "mdn-optional-chaining": mdn("Web/JavaScript/Reference/Operators/Optional_chaining", "Optional chaining (?.)", "Safe property access, calls and indexing."),
 "mdn-nullish": mdn("Web/JavaScript/Reference/Operators/Nullish_coalescing", "Nullish coalescing operator (??)", "Fallbacks for null and undefined only."),
 "jsi-optional-chaining": jsi("optional-chaining", "Optional chaining '?.'", "Short-circuiting property access."),
 "mdn-template": mdn("Web/JavaScript/Reference/Template_literals", "Template literals (Template strings)", "Interpolation, multiline strings and tagged templates."),
 "jsi-string": jsi("string", "Strings", "Quotes, backticks and string methods."),
 "mdn-array": mdn("Web/JavaScript/Reference/Global_Objects/Array", "Array", "Every array method, including map, filter and reduce."),
 "jsi-array-methods": jsi("array-methods", "Array methods", "Transforming, searching and reducing arrays."),
 "mdn-proxy": mdn("Web/JavaScript/Reference/Global_Objects/Proxy", "Proxy", "Intercepting operations on objects."),
 "jsi-proxy": jsi("proxy", "Proxy and Reflect", "Traps, Reflect and invariants."),
 "mdn-freeze": mdn("Web/JavaScript/Reference/Global_Objects/Object/freeze", "Object.freeze()", "Shallow immutability for objects."),
 "jsi-descriptors": jsi("property-descriptors", "Property flags and descriptors", "writable, enumerable and configurable."),
 "mdn-for-in": mdn("Web/JavaScript/Reference/Statements/for...in", "for...in", "Enumerable string keys, inherited ones included."),
 "mdn-for-of": mdn("Web/JavaScript/Reference/Statements/for...of", "for...of", "Iterating values of any iterable."),
 "jsi-keys": jsi("keys-values-entries", "Object.keys, values, entries", "Own properties as arrays."),
 # E. runtime, browser, security
 "node-event-loop": ("article", "The Node.js event loop, timers and process.nextTick()", "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick", NODE, "Event loop phases in Node.", False),
 "node-workers": ("article", "Worker threads", "https://nodejs.org/api/worker_threads.html", NODE, "Running CPU-bound JavaScript in parallel.", False),
 "belder-event-loop": ("video", "Everything You Need to Know About Node.js Event Loop", "https://www.youtube.com/watch?v=PNa9OMajw9w", "Bert Belder", "How libuv and the Node event loop really work.", True),
 "mdn-memory": mdn("Web/JavaScript/Memory_management", "Memory management", "Garbage collection and reachability."),
 "chrome-memory": ("article", "Fix memory problems", "https://developer.chrome.com/docs/devtools/memory-problems", "Chrome for Developers", "Heap snapshots and allocation timelines in DevTools.", True),
 "node-memory": ("article", "Node.js diagnostics: memory", "https://nodejs.org/en/learn/diagnostics/memory", NODE, "Finding leaks with heap snapshots in Node.", False),
 "css-tricks-debounce": ("article", "Debouncing and Throttling Explained Through Examples", "https://css-tricks.com/debouncing-throttling-explained-examples/", "CSS-Tricks", "Interactive examples of both techniques.", True),
 "jsi-bubbling": jsi("bubbling-and-capturing", "Bubbling and capturing", "The three phases of event propagation."),
 "jsi-delegation": jsi("event-delegation", "Event delegation", "One listener for many children."),
 "mdn-bubbling": mdn("Learn/JavaScript/Building_blocks/Event_bubbling", "Event bubbling", "Bubbling, capture and delegation explained."),
 "mdn-cors": mdn("Web/HTTP/CORS", "Cross-Origin Resource Sharing (CORS)", "Simple requests, preflights and credentials."),
 "jsi-fetch-cors": jsi("fetch-crossorigin", "Fetch: Cross-Origin Requests", "CORS from the client's side."),
 "owasp-xss": ("article", "Cross Site Scripting Prevention Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", OWASP, "Output encoding, sanitising and safe sinks.", False),
 "owasp-csrf": ("article", "Cross-Site Request Forgery Prevention Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", OWASP, "Tokens, SameSite cookies and origin checks.", False),
 "mdn-csp": mdn("Web/HTTP/CSP", "Content Security Policy (CSP)", "Restricting which scripts a page may run."),
 "mdn-webstorage": mdn("Web/API/Web_Storage_API", "Web Storage API", "localStorage and sessionStorage."),
 "mdn-indexeddb": mdn("Web/API/IndexedDB_API", "IndexedDB API", "Asynchronous structured storage in the browser."),
 "jsi-localstorage": jsi("localstorage", "LocalStorage, sessionStorage", "Persistence, scope and limits."),
 "jsi-cookie": jsi("cookie", "Cookies, document.cookie", "Cookie attributes, including HttpOnly and SameSite."),
 "mdn-workers": mdn("Web/API/Web_Workers_API/Using_web_workers", "Using Web Workers", "Moving work off the main thread."),
 "webdev-long-tasks": ("article", "Optimize long tasks", "https://web.dev/articles/optimize-long-tasks", WEBDEV, "Breaking up work so the page stays responsive.", False),
 "webdev-layout-thrashing": ("article", "Avoid large, complex layouts and layout thrashing", "https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing", WEBDEV, "Batching DOM reads and writes.", False),
 "mdn-strict": mdn("Web/JavaScript/Reference/Strict_mode", "Strict mode", "What 'use strict' changes."),
 "ts-handbook": ("article", "The TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html", "TypeScript", "The official guide to TypeScript.", False),
 "mdn-promise-all": mdn("Web/JavaScript/Reference/Global_Objects/Promise/all", "Promise.all()", "Ordering, rejection and empty input."),
 "greatfrontend": ("link", "GreatFrontEnd", "https://www.greatfrontend.com/", "GreatFrontEnd", "Front-end interview practice, including implementing Promise.all.", True),
 "exercism-js": ("link", "Exercism: JavaScript track", "https://exercism.org/tracks/javascript", "Exercism", "Free practice exercises with mentoring.", True),
}

A, B, C, Dm, E = (
    "JS Core & Types",
    "JS Functions, Scope & Prototypes",
    "JS Async & Event Loop",
    "Modern JavaScript",
    "JS Runtime, Browser & Security",
)


def ex(text, code):
    """Explanation text followed by the snippet as a highlighted JavaScript block."""
    return f"{text}\n\n```js\n{code.strip(chr(10))}\n```"


Q = [
 # ---------------- A. core and types ----------------
 ("What are JavaScript's data types, and what are the two classic quirks of `typeof`?", [A], "easy",
  "Seven primitives plus objects; `typeof null` is `\"object\"` (an old bug) and functions report `\"function\"`.",
  ["Seven primitives plus objects; `typeof NaN` is `\"NaN\"` and arrays report `\"array\"` instead of `\"object\"`.",
   "Six primitives plus objects; `typeof null` is `\"null\"` and `typeof undefined` is `\"object\"` (an old bug).",
   "Seven primitives plus objects; functions report `\"object\"` and BigInts report `\"number\"` like other numbers."],
  ex("Seven primitives: `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null`. Everything else is an object (arrays, functions, dates, maps). `typeof` returns the type name as a string, with two quirks: `typeof null` is `\"object\"` (a historical bug) and `typeof function(){}` is `\"function\"`. Use `Array.isArray` for arrays.\n\nWhy the others are wrong: `typeof NaN` is `\"number\"` (NaN is a number value) and `typeof []` is `\"object\"`; there are seven primitives, `typeof null` is `\"object\"` and `typeof undefined` is `\"undefined\"`; functions report `\"function\"` and BigInts report `\"bigint\"`.", r'''
typeof 42;          // "number"
typeof null;        // "object"  (bug that stayed)
typeof [];          // "object"
Array.isArray([]);  // true
'''), ["mdn-types", "jsi-types", "ydkjs"]),
 ("What is the difference between `==` and `===`, and when is `==` acceptable?", [A], "easy",
  "`===` compares without type conversion; `==` coerces first. The one common accepted use is `x == null`.",
  ["`==` skips the type check, so it is faster and preferred for numbers; `===` is mainly useful for comparing strings.",
   "`===` compares by reference and `==` by value, so `==` is the right choice for comparing two arrays' contents.",
   "They differ just for `null` versus `undefined`; for other values both give the same result, so `==` is fine in general."],
  ex("`===` compares without conversion (type and value). `==` applies the coercion rules first, which gives surprising results (`0 == \"\"`, `null == undefined`). Default to `===`. The one common accepted use of `==` is `x == null` to check for both `null` and `undefined` at once.\n\nWhy the others are wrong: there is no meaningful speed advantage for `==`, and the coercion makes it riskier, not preferred; both operators compare objects (arrays included) by identity, so `[1] == [1]` is `false`; and they differ for many values, e.g. `0 == \"\"` is `true` but `0 === \"\"` is `false`.", r'''
0 == "";            // true
null == undefined;  // true
null === undefined; // false
NaN === NaN;        // false
'''), ["mdn-equality", "jsi-comparison", "fm-deep-js"]),
 ("How do `var`, `let` and `const` differ?", [A], "easy",
  "`var` is function-scoped and hoisted as `undefined`; `let`/`const` are block-scoped with a TDZ, and `const` only forbids reassignment.",
  ["`var` is function-scoped; `let`/`const` are block-scoped but hoisted as `undefined`, and `const` also deep-freezes the object it is assigned.",
   "`var` and `let` are both block-scoped and differ in redeclaration; `const` is block-scoped and makes its object read-only.",
   "`var` is global-scoped, `let` is function-scoped and `const` is block-scoped; reading a `let` early returns `undefined`."],
  ex("`var` is function-scoped, hoisted and initialised to `undefined`, and can be redeclared. `let` and `const` are block-scoped and live in the temporal dead zone (TDZ) until their declaration runs; touching them earlier throws a `ReferenceError`. `const` forbids reassigning the binding, not mutating the object it points to.\n\nWhy the others are wrong: `let`/`const` are hoisted but not initialised, so early access throws instead of giving `undefined`, and `const` does not freeze the object; `var` is function-scoped, not block-scoped; `var` inside a function is not global and `let` is block-scoped, not function-scoped.", r'''
console.log(a); // undefined
var a = 1;
// console.log(b); // ReferenceError (TDZ)
let b = 2;
const o = { n: 1 };
o.n = 2;        // fine
// o = {};      // TypeError
'''), ["mdn-let", "mdn-const", "jsi-variables"]),
 ("What is hoisting, and why can you call a function declaration before it appears but not a `var` function expression?", [A], "medium",
  "Declarations are registered before code runs: function declarations with their body, `var` only as `undefined`.",
  ["Function declarations are hoisted with their body; `var` isn't hoisted, so calling the expression early throws a `ReferenceError`.",
   "Function declarations are moved to the top at parse time, while `var` expressions stay in a TDZ until they are assigned.",
   "Both are hoisted with their bodies, but function expressions are compiled later, so an early call returns `undefined`."],
  ex("Declarations are registered when the scope is created, before code runs. Function declarations are hoisted with their body, so you can call them early. `var` is hoisted as `undefined`, so calling a `var` function expression early is calling `undefined`. `let`, `const` and `class` are hoisted but not initialised (TDZ).\n\nWhy the others are wrong: `var` is hoisted (as `undefined`), so the early call throws a `TypeError` (`bye is not a function`), not a `ReferenceError`; the TDZ applies to `let`, `const` and `class`, not `var`; and a `var` function expression is not hoisted with its body, the call fails rather than returning `undefined`.", r'''
hello();                 // works
function hello() { console.log("hi"); }

// bye();                // TypeError: bye is not a function
var bye = function () {};
'''), ["mdn-hoisting", "jsi-closure"]),
 ("Which values are falsy, and why does `count || 10` go wrong when `count` is `0`?", [A], "easy",
  "`false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined`, `NaN`; `||` treats `0` as missing, so use `??`.",
  ["`false`, `0`, `\"\"`, `null`, `undefined` and `[]`; `||` treats `0` as missing, so compare against `null` explicitly.",
   "`false`, `null`, `undefined` and `NaN`; `0` is truthy, but `||` converts it to a string first, which fails the check.",
   "`false`, `0`, `\"\"`, `\"0\"`, `null` and `undefined`; `||` treats `0` as missing, so wrap the value in `Number()`."],
  ex("Falsy values are `false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined` and `NaN`. Everything else is truthy, including `\"0\"`, `\"false\"`, `[]` and `{}`. This matters in conditions and with `||`, which treats `0` and `\"\"` as missing; prefer `??` when those are valid values.\n\nWhy the others are wrong: `[]` is truthy (every object is) and the list misses `NaN`, `-0` and `0n`; `0` is falsy and `||` does not stringify anything; `\"0\"` is a non-empty string and therefore truthy, and `Number(0)` is still `0`, so `||` would still fall through.", r'''
const count = 0;
count || 10;   // 10  (surprise)
count ?? 10;   // 0
Boolean([]);   // true
'''), ["mdn-truthy", "mdn-falsy", "jsi-logical"]),
 ("What is the difference between `null` and `undefined`?", [A], "easy",
  "`undefined` means nothing was assigned; `null` is an intentional empty value. `JSON.stringify` drops `undefined` properties.",
  ["`null` means a variable was not declared yet and `undefined` means it was declared; `JSON.stringify` drops `null` properties.",
   "`null` is what the engine uses for missing properties; `undefined` is set by developers. `JSON.stringify` writes both as `null`.",
   "`undefined` means nothing was assigned and `null` is intentional; they are strictly equal, so `null === undefined` is `true`."],
  ex("`undefined` means \"no value assigned\": an uninitialised variable, a missing property or argument, a function with no `return`. `null` is an intentional \"no value\" set by the programmer. They are loosely equal (`==`) but not strictly equal, and `typeof` differs. APIs and JSON usually use `null` for empty; `JSON.stringify` drops properties whose value is `undefined`.\n\nWhy the others are wrong: an undeclared variable throws a `ReferenceError`, it is neither value, and `JSON.stringify` keeps `null` properties; the engine uses `undefined` (not `null`) for missing properties and arguments, and drops `undefined` properties (it writes `null` only for `undefined` array items); `null == undefined` is `true` but `null === undefined` is `false`.", r'''
let a;               // undefined
const b = null;      // explicit empty
JSON.stringify({ a: undefined, b: null }); // '{"b":null}'
'''), ["mdn-null", "mdn-undefined", "jsi-nullish"]),
 ("How are primitives and objects copied and compared?", [A], "easy",
  "Primitives are copied and compared by value; objects by reference, so `===` checks identity, not content.",
  ["Primitives are copied by value but compared by reference, so two equal strings built separately aren't `===`.",
   "Both are copied by value; assigning an object makes a shallow clone, so `===` compares the top-level properties.",
   "Objects are copied by reference but compared by content, so two literals with the same keys are `===`."],
  ex("Primitives are immutable and copied by value; comparing compares values. Objects (arrays and functions included) are copied by reference: the variable holds a pointer, so two variables can share and mutate the same object, and `===` compares identity, not content.\n\nWhy the others are wrong: strings are compared by value, so `\"ab\" === \"a\" + \"b\"` is `true`; assigning an object copies the reference, not a clone, so both variables see mutations; and `===` on objects checks identity, so `({ x: 1 }) === ({ x: 1 })` is `false`.", r'''
const a = { x: 1 };
const b = a;
b.x = 2;
a.x;                       // 2
({ x: 1 }) === ({ x: 1 }); // false
'''), ["jsi-object-copy", "mdn-primitive", "eloquent"]),
 ("How do you deep-copy an object, and what is wrong with `JSON.parse(JSON.stringify(x))`?", [A], "medium",
  "Use `structuredClone`; the JSON round-trip drops `undefined`, turns dates into strings, loses `Map`/`Set` and throws on cycles.",
  ["Use `structuredClone`, which also copies functions and class methods; the JSON round-trip's one problem is losing `Date` objects.",
   "Use `Object.assign({}, x)`, which copies nested objects; the JSON round-trip loses precision for numbers above 2^53.",
   "Use the spread operator `{ ...x }`, which recurses into nested objects; the JSON round-trip is correct but slow."],
  ex("Spread (`{...o}`) and `Object.assign` copy one level; nested objects are still shared. For a deep copy use `structuredClone`: built in, and it handles dates, maps, sets and cycles (but not functions or class prototypes). `JSON.parse(JSON.stringify(x))` loses `undefined`, turns dates into strings, drops `Map` and `Set`, and throws on cycles.\n\nWhy the others are wrong: `structuredClone` throws a `DataCloneError` on functions and returns plain objects for class instances (methods are lost); `Object.assign` and spread copy one level only; a JSON round-trip of a JS number is exact (the number is already a double), and the round-trip has real correctness problems, not just speed.", r'''
const o = { a: 1, inner: { b: 2 }, when: new Date() };
const shallow = { ...o };
const deep = structuredClone(o);
shallow.inner === o.inner; // true
deep.inner === o.inner;    // false
'''), ["mdn-structuredclone", "jsi-object-copy", "webdev-structured-clone"]),
 ("Why is `0.1 + 0.2 !== 0.3`, and when do you need `BigInt`?", [A], "medium",
  "Numbers are IEEE 754 doubles that can't store some decimals exactly; `BigInt` is for integers beyond 2^53 - 1.",
  ["Addition rounds results to 15 significant digits; `BigInt` is for decimals that need more precision, like money.",
   "Numbers are 32-bit floats by default; `BigInt` switches to 64-bit doubles, which store decimals like 0.1 exactly.",
   "The `+` operator accumulates rounding error that `Math.round` fixes; `BigInt` handles exact fractions like `0.1n`."],
  ex("Numbers are IEEE 754 64-bit floats, and some decimals can't be represented exactly in binary. Compare with a tolerance (`Math.abs(a - b) < Number.EPSILON`) or work in integers (cents) for money. Integers are exact only up to `Number.MAX_SAFE_INTEGER` (2^53 - 1); beyond that use `BigInt` (suffix `n`), which can't be mixed with `Number` without converting.\n\nWhy the others are wrong: the error comes from binary representation of 0.1 and 0.2, not from rounding to a digit count, and `BigInt` holds integers only; numbers are already 64-bit doubles, and no binary float stores 0.1 exactly; `0.1n` is a `SyntaxError` because BigInts can't have fractions.", r'''
0.1 + 0.2;                                   // 0.30000000000000004
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;  // true
9007199254740993n + 1n;                      // 9007199254740994n
'''), ["mdn-number", "mdn-bigint", "point-three", "jsi-number"]),
 ("What do `\"5\" + 1` and `\"5\" - 1` evaluate to, and why?", [A], "easy",
  "`\"51\"` and `4`: `+` concatenates when either side is a string, while `-` always converts to numbers.",
  ["`6` and `4`: both operators convert numeric strings to numbers first, since `\"5\"` looks like a number.",
   "`\"51\"` and `NaN`: `+` concatenates, and `-` can't subtract from a string, so it produces `NaN`.",
   "`6` and `\"4\"`: arithmetic happens first, and the result keeps the type of the left-hand operand."],
  ex("Operators convert their operands: `+` concatenates if either side is a string, the other arithmetic operators convert to numbers, conditions convert to booleans, and `==` uses the abstract equality algorithm. Be explicit instead: `Number(x)`, `String(x)`, `Boolean(x)`. `parseInt` parses a prefix and needs a radix.\n\nWhy the others are wrong: `+` concatenates as soon as either operand is a string, numeric-looking or not; `-` converts `\"5\"` to `5`, so the result is `4`, not `NaN` (`NaN` appears only for non-numeric strings like `\"a\" - 1`); results don't take the left operand's type.", r'''
"5" + 1;              // "51"
"5" - 1;              // 4
[] + {};              // "[object Object]"
+"";                  // 0
parseInt("08px", 10); // 8
'''), ["jsi-type-conversions", "mdn-coercion", "ydkjs"]),

 # ---------------- B. functions, scope, this, prototypes ----------------
 ("What is a closure, what is it good for, and what does it cost?", [B], "easy",
  "A function that keeps access to its creating scope's variables; good for private state and factories, but captured values stay in memory.",
  ["A function that copies outer variables' values when it's created; good for snapshots, and it lets the outer scope be freed right afterwards.",
   "A function invoked immediately to wrap code; good for avoiding globals, and it costs one extra stack frame per call.",
   "An inner function that reads outer variables while the outer call is still on the stack; cheap, as nothing is retained."],
  ex("A closure is a function that keeps access to the variables of the scope where it was created, even after that scope has returned. Uses: private state, factories, callbacks that remember context, memoisation, partial application. The cost: captured variables aren't garbage-collected while the closure lives.\n\nWhy the others are wrong: a closure keeps live access to the variables (later changes are visible), not a copy, and it keeps them alive; an IIFE is one use of a function, not the definition of a closure; and closures work after the outer function has returned, which is exactly why the captured scope is retained.", r'''
function counter() {
  let n = 0;
  return () => ++n;
}
const next = counter();
next(); next(); // 1, 2
'''), ["mdn-closures", "jsi-closure", "ydkjs"]),
 ("What does this print, and how do you fix it?\n\n```js\nfor (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);\n```", [B], "medium",
  "`3 3 3`, because every callback shares one function-scoped `i`; use `let` to get a new binding per iteration.",
  ["`2 2 2`, because the last iteration leaves `i` at 2; use `let` so each callback gets its own copy of `i`.",
   "`0 1 2`, because each arrow captures `i`'s value when `setTimeout` is called, so no fix is needed here.",
   "`3 3 3`, because the timers run after the loop; fix it with `setTimeout(..., 1)` so each fires inside its iteration."],
  ex("`var` is function-scoped, so all callbacks share one `i`, which is `3` by the time the timers run. Fix it with `let` (a new binding per iteration) or an IIFE.\n\nWhy the others are wrong: the loop increments `i` once more before the condition fails, so it ends at `3`, not `2`; arrows capture the variable, not its value; and changing the delay doesn't help because the loop finishes synchronously before any timer can run.", r'''
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0); // 0 1 2
'''), ["mdn-closures-loops", "jsi-closure", "namaste-js"]),
 ("How is the value of `this` determined?", [B], "hard",
  "By how the function is called: `new`, then `call`/`apply`/`bind`, then `obj.fn()`, then a plain call; arrows use the outer `this`.",
  ["By where the function is defined: methods get their object, plain functions get the module, and arrows get the caller.",
   "By the object the function was last assigned to, so a method stored in a variable keeps its original `this`.",
   "By how it's called: `obj.fn()` beats `bind`, which beats `new`; arrows take `this` from whoever calls them."],
  ex("By how the function is called, not where it is defined (except arrows). Precedence: `new` (the new object), explicit `call`/`apply`/`bind`, a method call (`obj.fn()` gives `obj`), a plain call (`undefined` in strict mode, the global object otherwise). Arrow functions take `this` from the enclosing scope. Extracting a method loses its `this`.\n\nWhy the others are wrong: only arrows are lexical, and they take `this` from the enclosing scope, not the caller; extracting a method (`const f = obj.fn`) loses `this`; and the precedence is reversed: `new` beats `bind`, and `bind` beats a method call.", r'''
const user = { name: "Ana", hi() { return this?.name; } };
user.hi();          // "Ana"
const f = user.hi;
f();                // undefined (this lost)
'''), ["mdn-this", "jsi-object-methods", "ydkjs"]),
 ("What do `call`, `apply` and `bind` do?", [B], "easy",
  "All set `this`: `call` invokes now with listed arguments, `apply` with an array, `bind` returns a new bound function.",
  ["All set `this`: `apply` invokes now with listed arguments, `call` with an array, and `bind` invokes it on the next tick.",
   "All set `this`: `call` and `apply` return bound copies to invoke later, while `bind` invokes now and returns the result.",
   "All set `this`: `call` invokes now, `apply` with an array, and `bind` permanently changes the original function's `this`."],
  ex("All three set `this` explicitly. `call(thisArg, a, b)` invokes now with listed arguments; `apply(thisArg, [a, b])` invokes now with an array; `bind(thisArg, ...preset)` returns a new function with `this` (and optionally leading arguments) fixed.\n\nWhy the others are wrong: `call` takes listed arguments and `apply` an array (not the other way round), and `bind` never schedules anything; `call` and `apply` invoke immediately while `bind` returns a function; and `bind` leaves the original function untouched, returning a new bound one.", r'''
function greet(g, p) { return `${g}, ${this.name}${p}`; }
const u = { name: "Ana" };
greet.call(u, "Hi", "!");
greet.apply(u, ["Hi", "!"]);
const hi = greet.bind(u, "Hi");
hi("?");
'''), ["mdn-bind", "jsi-bind"]),
 ("How do arrow functions differ from regular functions?", [B], "easy",
  "No own `this`, `arguments` or `prototype`, and no `new`: good for callbacks, wrong for methods and constructors.",
  ["Hoisted with their body like declarations, and they bind `this` to the object they're stored on: ideal for methods.",
   "They have their own `this` but no `arguments`; they work with `new`, which makes them a good fit for constructors.",
   "Same semantics with shorter syntax; the one real difference is the implicit `return` for single-expression bodies."],
  ex("Arrows have no own `this`, `arguments`, `super` or `new.target`; they can't be used with `new` and have no `prototype`. Great for callbacks that need the outer `this`; wrong for object methods that rely on their own `this`, and for constructors.\n\nWhy the others are wrong: arrows are expressions assigned to variables, so they follow `const`/`let` rules, and they don't get `this` from the object; they have no own `this`, and `new` on an arrow throws a `TypeError`; and the missing `this`, `arguments` and `prototype` are real semantic differences beyond syntax.", r'''
const o = {
  n: 1,
  later() { setTimeout(() => console.log(this.n), 0); }, // 1
  bad: () => this,                                       // not o
};
'''), ["mdn-arrow", "jsi-arrow"]),
 ("How does the prototype chain work?", [B], "medium",
  "Each object links to a prototype; reads walk the chain until found or `null`, while writes set the property on the object itself.",
  ["Each object copies its prototype's properties when created, so later changes to the prototype don't reach objects that already exist.",
   "Each object links to a prototype; reads walk the chain, and writes update the prototype where the property was found.",
   "Each object links to a prototype; reads check the prototype first and fall back to own properties if it's missing there."],
  ex("Every object has an internal `[[Prototype]]` link. Property lookup walks the chain until it finds the property or reaches `null`. Writing sets the property on the object itself (shadowing). `Object.getPrototypeOf(x)` reads the link; `Object.create(p)` makes an object with prototype `p`. Methods shared via the prototype are stored once, not per instance.\n\nWhy the others are wrong: the prototype is a live link, so adding a method to it later is visible on existing objects; a plain assignment creates an own property that shadows the inherited one; and lookup starts with own properties, then walks up the chain.", r'''
const animal = { eats: true };
const dog = Object.create(animal);
dog.barks = true;
dog.eats;                              // true (from prototype)
Object.getPrototypeOf(dog) === animal; // true
'''), ["mdn-proto-chain", "jsi-proto", "ydkjs"]),
 ("Are ES6 classes real classes, or something else underneath?", [B], "medium",
  "Syntax over prototypes: methods live on `Class.prototype`, but classes are always strict, need `new` and support `#private`.",
  ["Real classes as in Java: each instance gets its own copy of every method, and the prototype is no longer used.",
   "Syntax over prototypes with identical behaviour to constructor functions, so a class can also be called as a plain function without `new`.",
   "A separate object model: methods live on each instance, and `typeof SomeClass` returns `\"class\"`."],
  ex("They are syntax over prototypes. A class body defines the constructor function; methods go on `Class.prototype`; `extends` links prototypes and `super` calls the parent. Differences from old constructor functions: a TDZ before the declaration, always strict, must be called with `new`, and support for `#private` fields and `static` members.\n\nWhy the others are wrong: methods are stored once on `Class.prototype` and shared through the chain; calling a class without `new` throws a `TypeError`, one of several differences from constructor functions; and `typeof SomeClass` is `\"function\"`.", r'''
class Animal {
  #sound;
  constructor(s) { this.#sound = s; }
  speak() { return this.#sound; }
}
class Dog extends Animal { constructor() { super("woof"); } }
new Dog().speak(); // "woof"
typeof Animal;     // "function"
'''), ["mdn-classes", "jsi-class"]),
 ("What does the `new` keyword do?", [B], "medium",
  "Creates an object linked to `Constructor.prototype`, runs the constructor with `this` set to it, and returns it.",
  ["Copies the constructor's prototype into a new object, runs the constructor, and returns whatever the constructor returns.",
   "Creates an object with no prototype, copies the constructor's methods onto it, and returns it with `this` bound.",
   "Runs the constructor with `this` set to the global object, then returns that object's newly added properties."],
  ex("It creates an empty object linked to `Constructor.prototype`, calls the constructor with `this` set to that object, and returns the object (unless the constructor returns another object). Forgetting `new` on a plain function sets properties on the global object (sloppy mode) or throws (strict mode, classes).\n\nWhy the others are wrong: the new object is linked to `Constructor.prototype`, not given a copy, and a returned primitive is ignored (only a returned object replaces the instance); the object does have a prototype and methods are inherited, not copied; and `this` is the new object, not the global object.", r'''
function Person(name) { this.name = name; }
const p = new Person("Ana");
p instanceof Person;   // true
'''), ["mdn-new", "jsi-constructor-new"]),
 ("What is a higher-order function, and what is currying?", [B], "medium",
  "A function that takes or returns functions; currying turns `f(a, b, c)` into `f(a)(b)(c)` for partial application.",
  ["A function that calls itself; currying caches its results by argument so that repeated calls return faster.",
   "A function that takes or returns functions; currying chains `f(g(h(x)))` so each output feeds straight into the next function.",
   "A function defined on a class's prototype; currying binds it to an instance with `bind` so its `this` is fixed."],
  ex("A higher-order function takes or returns functions (`map`, `filter`, `setTimeout`, decorators). Currying turns `f(a, b, c)` into `f(a)(b)(c)`, enabling partial application and reuse.\n\nWhy the others are wrong: a function that calls itself is recursive, and caching results is memoisation; chaining outputs into inputs is function composition, not currying; and binding `this` is `bind`, unrelated to higher-order functions.", r'''
const curry = (fn) =>
  function curried(...args) {
    return args.length >= fn.length
      ? fn(...args)
      : (...more) => curried(...args, ...more);
  };
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6
'''), ["jsi-currying", "mdn-first-class", "eloquent"]),
 ("What is memoisation, and what are its limits?", [B], "medium",
  "Caching a pure function's results by its arguments; it needs a stable key and an upper bound on the cache.",
  ["An engine optimisation that caches recursive calls automatically; it needs no code but suits pure functions.",
   "Caching a function's compiled code so it isn't parsed again; it needs a stable key and grows with function count.",
   "Caching any function's results by its arguments, including API calls; it needs a stable key but no cache bound."],
  ex("Memoisation caches a pure function's results by its arguments, trading memory for speed. It needs a stable cache key (serialise the arguments) and only suits pure functions. Watch for unbounded cache growth; consider an LRU, or a `WeakMap` for object keys.\n\nWhy the others are wrong: engines don't memoise your functions for you; caching compiled code is what the JIT does, not memoisation; and impure functions (API calls, time, randomness) give stale results when cached, while an unbounded cache is a memory leak.", r'''
const memo = (fn) => {
  const cache = new Map();
  return (...args) => {
    const k = JSON.stringify(args);
    if (!cache.has(k)) cache.set(k, fn(...args));
    return cache.get(k);
  };
};
const fib = memo((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)));
fib(50); // 12586269025
'''), ["jsi-decorators", "mdn-map"]),

 # ---------------- C. async and the event loop ----------------
 ("In what order does this log, and why?\n\n```js\nconsole.log(\"A\");\nsetTimeout(() => console.log(\"timeout\"), 0);\nPromise.resolve().then(() => console.log(\"promise\"));\nconsole.log(\"B\");\n```", [C], "medium",
  "A, B, promise, timeout: synchronous code first, then all microtasks, then the next task (the timer).",
  ["A, promise, B, timeout: an already-resolved promise runs its `.then` callback synchronously.",
   "A, B, timeout, promise: a zero-delay timer is due at once, so it runs before the promise callback.",
   "A, timeout, promise, B: callbacks run as soon as they're registered, in the order they were scheduled."],
  ex("JavaScript runs on one thread with one call stack. Async work (timers, I/O, network) is handled by the host (browser or Node), which queues callbacks. When the stack is empty the loop takes the next task. After each task it drains the whole microtask queue (promise reactions, `queueMicrotask`) before the next task or render. A long synchronous task blocks everything, including rendering.\n\nWhy the others are wrong: `.then` callbacks are queued as microtasks even for a resolved promise, so they never run in the middle of synchronous code; the microtask queue is drained before the next task, so the promise beats the timer; and no callback runs until the current synchronous code has finished.", r'''
console.log("A");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("B");
// A, B, promise, timeout
'''), ["roberts-event-loop", "archibald-in-the-loop", "hallie-event-loop", "mdn-event-loop"]),
 ("What is the difference between microtasks and macrotasks (tasks)?", [C], "hard",
  "Promise reactions and `queueMicrotask` are microtasks, drained fully after each task; timers, I/O and UI events are tasks.",
  ["Timers and I/O are microtasks, drained after each task; promise reactions and UI events are tasks queued by the browser itself.",
   "Promise reactions are microtasks, but just one runs after each task; timers, I/O and UI events are tasks.",
   "Promise reactions are microtasks run on a separate thread, so they don't block rendering; timers are tasks."],
  ex("Macrotasks (tasks): `setTimeout`, `setInterval`, I/O, UI events, `MessageChannel`. Microtasks: promise `.then/.catch/.finally`, `await` continuations, `queueMicrotask`, `MutationObserver`. The microtask queue is fully drained after the current task, so a promise chain always runs before the next timer, and an endless microtask loop starves rendering.\n\nWhy the others are wrong: the roles are swapped, timers and I/O are tasks and promise reactions are microtasks; the whole microtask queue is drained (including microtasks queued meanwhile), not one per task; and microtasks run on the same main thread, so an endless microtask loop starves rendering.", r'''
setTimeout(() => console.log("macro"), 0);
queueMicrotask(() => console.log("micro 1"));
Promise.resolve().then(() => console.log("micro 2"));
// micro 1, micro 2, macro
'''), ["archibald-tasks", "mdn-microtask", "jsi-microtask"]),
 ("What is callback hell, and how do you avoid it?", [C], "easy",
  "Deeply nested callbacks that are hard to read and handle errors in; flatten with promises and `async/await`.",
  ["A callback invoked twice by mistake; avoid it with a flag that ignores any repeat calls.",
   "Synchronous callbacks blocking the event loop; avoid it by moving the work into `setImmediate`.",
   "Callbacks that leak memory through closures; avoid it by using named functions instead of arrows."],
  ex("Deeply nested callbacks that are hard to read, handle errors in, and compose. Avoid them with promises (flat chains and a central `.catch`), `async/await`, named functions and small composable helpers. Node's `util.promisify` converts error-first callbacks into promise-returning functions.\n\nWhy the others are wrong: a double-invoked callback is a real bug but not what \"callback hell\" means; blocking work is a performance issue, and deferring it with `setImmediate` still blocks the loop when it runs; and naming functions helps readability but has nothing to do with leaks.", r'''
import { readFile } from "node:fs/promises";
const data = await readFile("a.json", "utf8"); // instead of nested callbacks
'''), ["jsi-callbacks", "node-promisify", "callbackhell"]),
 ("What are a promise's states, and how does chaining with `.then` work?", [C], "medium",
  "Pending, then fulfilled or rejected; each `.then` returns a new promise with the callback's result, and throws become rejections.",
  ["Pending, then fulfilled or rejected; `.then` returns the same promise, so each handler in the chain sees the very first resolved value.",
   "Pending, then fulfilled or rejected; `.then` callbacks run synchronously, and a throw inside one crashes the program.",
   "Pending and settled; a settled promise can go back to pending if resolved again, and `.then` reruns its callbacks."],
  ex("`pending`, then `fulfilled` or `rejected` (settled, final). `.then(onOk, onErr)` returns a new promise; its value is the callback's return value (or the unwrapped promise it returns); a thrown error becomes a rejection. `.catch` handles rejections anywhere above it in the chain; `.finally` runs either way and doesn't change the value.\n\nWhy the others are wrong: `.then` returns a new promise, so each step sees the previous callback's return value; callbacks run asynchronously as microtasks, and a throw becomes a rejection handled by a later `.catch`; and settling is final, further `resolve`/`reject` calls are ignored.", r'''
Promise.resolve(1)
  .then((x) => x + 1)
  .then((x) => { throw new Error("boom " + x); })
  .catch((e) => e.message)  // "boom 2"
  .finally(() => console.log("done"));
'''), ["mdn-using-promises", "jsi-promise-basics", "jsi-promise-chaining", "hallie-promises"]),
 ("When do you use `Promise.all`, `allSettled`, `race` and `any`?", [C], "medium",
  "`all` fails fast, `allSettled` reports every outcome, `race` takes the first settled (timeouts), `any` the first success.",
  ["`all` ignores rejections, `allSettled` fails fast, `race` takes the first success, `any` the first settled.",
   "`all` fails fast, `allSettled` reports outcomes, `race` takes the first success, `any` rejects if one fails.",
   "`all` runs the promises in sequence, `allSettled` runs them in parallel, `race` takes the fastest success, `any` the first settled."],
  ex("`all`: waits for all, rejects on the first rejection (fail fast). `allSettled`: waits for all and reports each outcome; never rejects. `race`: settles with the first settled promise (good for timeouts). `any`: resolves with the first fulfilled one; rejects with an `AggregateError` only if all fail (good for redundant sources).\n\nWhy the others are wrong: `all` rejects on the first rejection and `allSettled` never rejects; `race` settles with the first settled promise, rejection included, while `any` waits for the first fulfilment and rejects only if all reject; and none of them run anything: the promises are already running when passed in.", r'''
const results = await Promise.allSettled([a(), b(), c()]);
const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
'''), ["mdn-promise-concurrency", "jsi-promise-api"]),
 ("How do you handle errors with `async/await`, and what does `fetch` not reject on?", [C], "medium",
  "`try/catch` around awaits where you can act, rethrowing with a `cause`; `fetch` doesn't reject on HTTP errors, so check `res.ok`.",
  ["One top-level `try/catch` around the whole app; `fetch` rejects on any non-2xx status, so no extra check is needed.",
   "Attach `.catch` to the returned promise instead of `try/catch`; `fetch` rejects on 4xx/5xx, so read `err.status`.",
   "`try/catch` around awaits; `fetch` rejects on 404s and 500s but resolves with `res.ok === false` on network failure."],
  ex("Use `try/catch` around awaited calls; an `async` function always returns a promise, and a thrown error rejects it. Catch where you can act (retry, fallback, translate) and let the rest bubble; don't swallow errors. `fetch` only rejects on network failure, not on a 404 or 500, so check `res.ok`. A rejected promise that is never awaited or caught becomes an unhandled rejection.\n\nWhy the others are wrong: a single top-level catch can't retry or add context, and `fetch` resolves normally for 4xx/5xx responses; `.catch` works but `fetch` still doesn't reject on HTTP status, so there is no `err.status`; and it's the reverse: network failures reject, HTTP error statuses resolve with `res.ok === false`.", r'''
async function load(id) {
  try {
    const res = await fetch(`/api/items/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch does not reject on 404
    return await res.json();
  } catch (err) {
    throw new Error(`load(${id}) failed`, { cause: err });
  }
}
'''), ["mdn-async-function", "jsi-async-await", "mdn-error-cause"]),
 ("What is the performance trap with sequential `await`, and why is `forEach` with an async callback wrong?", [C], "medium",
  "Independent awaits run one after another; start them together with `Promise.all`. `forEach` doesn't wait for async callbacks at all.",
  ["`await` blocks the whole thread, so other requests wait; `forEach` awaits each callback in turn but is slower than `for`.",
   "Sequential awaits are parallelised by the engine, so there's no trap; `forEach` returns a promise you can await.",
   "Independent awaits run one after another; fix it with `Promise.all`. `forEach` awaits each callback but silently swallows their errors."],
  ex("Awaiting in sequence makes independent calls run one after another. Start them together and await them together. In loops, `await` inside `for...of` is sequential on purpose, while `forEach` with an async callback doesn't wait at all. Bound concurrency for big lists (batches or a pool) to avoid overloading a server.\n\nWhy the others are wrong: `await` suspends only the current async function, not the thread, and `forEach` does not await its callbacks; the engine never parallelises awaits for you, and `forEach` returns `undefined`; and `forEach` doesn't await at all, so it can't even observe the errors (they become unhandled rejections).", r'''
// slow: total = a + b
const x = await getA();
const y = await getB();

// fast: total = max(a, b)
const [x2, y2] = await Promise.all([getA(), getB()]);

// wrong: forEach does not await
items.forEach(async (i) => { await save(i); });
// right
await Promise.all(items.map(save));
'''), ["jsi-async-await", "webdev-async-iterators", "mdn-for-await"]),
 ("What is an unhandled promise rejection, and what does modern Node do with one?", [C], "hard",
  "A rejection with no handler once microtasks drain; since Node 15 it terminates the process by default.",
  ["A rejection with no handler once microtasks drain; Node prints a warning and keeps the process running.",
   "A promise that stays pending forever; Node keeps it in memory and prints a warning after about 30 seconds.",
   "A rejection inside an `async` function without its own `try/catch`, even when the caller awaits and catches it."],
  ex("A rejection with no handler attached by the time the microtask queue drains. Browsers emit `unhandledrejection`; modern Node terminates the process by default (since v15). Always return, await or catch promises; add a global handler only to log and shut down cleanly, not to carry on as if nothing happened.\n\nWhy the others are wrong: warning and continuing was the behaviour before Node 15, now the default mode is `throw`; a never-settling promise is not a rejection and Node doesn't time it out; and a rejection is handled as soon as any caller awaits or catches it, it needn't be caught where it was thrown.", r'''
process.on("unhandledRejection", (reason) => {
  console.error("unhandled", reason);
  process.exit(1);
});
'''), ["node-unhandled", "mdn-unhandledrejection", "jsi-promise-error"]),
 ("Does `setTimeout(fn, 0)` run immediately?", [C], "easy",
  "No: it queues a task after at least the delay, and it runs only once the stack is empty and microtasks are drained.",
  ["Yes: a zero delay runs the function synchronously, right after the current statement finishes.",
   "No: it runs after exactly 4 ms, the fixed minimum for timers in browsers and Node.",
   "No: it runs as a microtask right after the current function returns, before pending promise callbacks."],
  ex("No. It schedules a task after at least the delay (browsers clamp nested timers to about 4 ms and throttle background tabs). It runs only when the stack is empty and microtasks are drained, so a busy main thread delays it arbitrarily. Use `requestAnimationFrame` for visual updates and `queueMicrotask` for \"right after this\".\n\nWhy the others are wrong: timers never run synchronously; the 4 ms clamp applies to nested browser timers (Node uses 1 ms) and the real delay depends on how busy the thread is; and `setTimeout` queues a task, which runs after the microtask queue (promise callbacks) is drained.", r'''
const t = Date.now();
setTimeout(() => console.log("fired after", Date.now() - t, "ms"), 0);
while (Date.now() - t < 100) {} // blocks: timer fires after about 100 ms
'''), ["mdn-settimeout", "jsi-settimeout", "roberts-event-loop"]),
 ("How do you cancel an async operation like a `fetch`?", [C], "medium",
  "Pass an `AbortController`'s `signal` and call `abort()`; `AbortSignal.timeout(ms)` gives a timeout.",
  ["Call `promise.cancel()` on the promise `fetch` returns; `Promise.race` with a timer then gives a timeout.",
   "Set the promise variable to `null` so it's garbage-collected, which aborts the request in flight.",
   "Throw inside a `.then` handler; the rejection propagates back up and cancels the network request."],
  ex("Promises can't be cancelled themselves; use `AbortController`. Pass its `signal` to `fetch` (and many Node APIs), call `abort()` to cancel, and handle the `AbortError`. Also use it for timeouts (`AbortSignal.timeout(ms)`) and to ignore stale responses in UI code.\n\nWhy the others are wrong: native promises have no `cancel()`, and `Promise.race` only stops waiting, the request keeps running; dropping the reference doesn't abort anything (the pending request keeps it alive); and a throw in `.then` rejects the derived promise, it doesn't travel back to the request.", r'''
const ctrl = new AbortController();
const p = fetch("/api/slow", { signal: ctrl.signal });
setTimeout(() => ctrl.abort(), 500);
try { await p; } catch (e) { if (e.name !== "AbortError") throw e; }

await fetch("/api/x", { signal: AbortSignal.timeout(3000) });
'''), ["mdn-abortcontroller", "jsi-fetch-abort"]),

 # ---------------- D. modern JavaScript ----------------
 ("What are destructuring, spread and rest, and what are their traps?", [Dm], "easy",
  "Unpacking, expanding and collecting values; spread copies are shallow, and defaults apply only to `undefined`, not `null`.",
  ["Unpacking, expanding and collecting values; spread copies are deep, and defaults apply to any falsy value.",
   "Unpacking, expanding and collecting values; spread copies are shallow, and defaults also apply to `null`.",
   "Unpacking, expanding and collecting values; rest must come first in a destructuring pattern, and spread skips `undefined` values."],
  ex("Destructuring unpacks arrays and objects into variables, with defaults and renaming. Spread (`...x`) expands an iterable or object in place; rest (`...x`) collects the remaining items. Traps: spread copies are shallow, and defaults apply only for `undefined`, not `null`.\n\nWhy the others are wrong: spread copies one level (nested objects are shared), and defaults kick in for `undefined`, not for `0` or `\"\"`; `const { d = 5 } = { d: null }` gives `d === null`; and a rest element must be last, while spread copies `undefined` values like any other.", r'''
const { id, name: title = "n/a", ...others } = { id: 1, extra: true };
const [first, , third = 0, ...tail] = [1, 2, undefined, 4, 5];
const merged = { ...{ a: 1 }, ...{ a: 2, b: 3 } }; // { a: 2, b: 3 }
const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
'''), ["mdn-destructuring", "jsi-destructuring", "jsi-rest-spread", "exploring-js"]),
 ("How do ES modules differ from CommonJS?", [Dm], "hard",
  "ESM is static, async and strict, with live bindings and top-level `await`; CommonJS `require` is synchronous and dynamic.",
  ["ESM is static and async with live bindings; CommonJS supports top-level `await` and is strict by default too.",
   "ESM is loaded synchronously like `require` and exports value copies; CommonJS exports live bindings and is therefore tree-shakable.",
   "ESM is static but evaluated lazily on first use of an export; CommonJS `require` is asynchronous and cached."],
  ex("CommonJS (`require`, `module.exports`) is synchronous, dynamic and Node's legacy format. ES modules (`import`/`export`) are static (enabling tree shaking), asynchronous, always strict, export live bindings and support top-level `await`. In Node, enable ESM with `.mjs` or `\"type\": \"module\"`. Use dynamic `import()` for lazy loading and to import ESM from CommonJS.\n\nWhy the others are wrong: top-level `await` is ESM-only and CommonJS is sloppy unless you add `\"use strict\"`; the bindings are reversed, ESM exports live bindings while `require` returns a snapshot object, and static imports are what makes tree shaking possible; and ESM modules are evaluated eagerly in dependency order, while `require` is synchronous.", r'''
// math.mjs
export const add = (a, b) => a + b;
export default function mul(a, b) { return a * b; }
// app.mjs
import mul, { add } from "./math.mjs";
const lazy = await import("./big.mjs");
'''), ["mdn-modules", "node-esm", "jsi-modules"]),
 ("When do you use `Map`, `Set`, `WeakMap` and `WeakSet` instead of objects and arrays?", [Dm], "medium",
  "`Map` for any-type keys and frequent changes, `Set` for unique values, and the weak versions for per-object data that mustn't leak.",
  ["`Map` for string keys in insertion order, `Set` for sorted unique values, and the weak versions for primitive keys that expire over time.",
   "`Map` for any-type keys, `Set` for unique values, and the weak versions when you need to iterate entries without copying.",
   "`Map` and `Set` for data you'll serialise to JSON, and the weak versions for caches keyed by strings to save memory."],
  ex("`Map` allows any key type, keeps insertion order, has `size`, and beats an object for frequent adds and removals. `Set` stores unique values (fast `has`, easy dedupe). `WeakMap`/`WeakSet` hold keys weakly (objects only, not iterable), so entries disappear when the key is collected: ideal for caches or metadata per object without leaks.\n\nWhy the others are wrong: `Map` accepts any key type and `Set` keeps insertion order, not sorted order, while weak collections reject primitive keys; `WeakMap` and `WeakSet` are not iterable; and `JSON.stringify(new Map(...))` gives `\"{}\"`, while `new WeakMap().set(\"s\", 1)` throws a `TypeError`.", r'''
const unique = [...new Set([1, 1, 2])];   // [1, 2]
const m = new Map([[{ id: 1 }, "x"]]);
const meta = new WeakMap();
meta.set(domNode, { clicks: 0 });         // freed with domNode
'''), ["mdn-keyed", "jsi-map-set", "jsi-weakmap"]),
 ("What are iterators and generators?", [Dm], "medium",
  "An iterable's `[Symbol.iterator]()` returns an object whose `next()` gives `{ value, done }`; a generator (`function*`) pauses at each `yield`.",
  ["An iterable has a `length` and numeric indexes that `for...of` reads; a generator (`function*`) computes its values up front.",
   "An iterable's `[Symbol.iterator]()` returns an array copy that `for...of` walks; a generator runs on a worker thread.",
   "An iterable's `next()` returns the next value or `undefined` at the end; a generator (`function*`) returns a promise per value."],
  ex("An iterable has `[Symbol.iterator]()` returning an iterator whose `next()` yields `{ value, done }`; `for...of`, spread and destructuring use it. A generator (`function*`) is a pausable function that `yield`s values lazily, handy for infinite sequences, custom iteration and cooperative flows. Async generators with `for await` stream async data.\n\nWhy the others are wrong: `for...of` uses `[Symbol.iterator]`, not `length` (array-likes without it throw), and generators are lazy; the iterator protocol returns an iterator object, not an array, and generators run on the calling thread; and `next()` returns `{ value, done }` objects, while promise-per-value is what async generators (`async function*`) do.", r'''
function* ids() { let i = 1; while (true) yield i++; }
const it = ids();
it.next().value; // 1
it.next().value; // 2

async function* pages() { for (let p = 1; p <= 3; p++) yield await fetchPage(p); }
for await (const page of pages()) { /* ... */ }
'''), ["mdn-iterators", "jsi-generators", "jsi-async-iter"]),
 ("What do optional chaining (`?.`) and nullish coalescing (`??`) do, and how is `??` different from `||`?", [Dm], "easy",
  "`?.` gives `undefined` instead of throwing on `null`/`undefined`; `??` falls back just for those two, `||` for any falsy value.",
  ["`?.` catches errors thrown anywhere in the chain; `??` falls back for any falsy value, like `||` with lower precedence.",
   "`?.` returns `null` when the left side is missing; `??` and `||` differ in precedence but fall back for the same values.",
   "`?.` returns `undefined` on `null`/`undefined`; `??` falls back for those two and for `NaN`, while `||` also covers `0` and `\"\"`."],
  ex("`a?.b` returns `undefined` instead of throwing when `a` is `null` or `undefined` (also `a?.[k]` and `a?.()`). `a ?? b` falls back only for `null`/`undefined`, unlike `||`, which falls back for any falsy value. Combine them for safe reads with correct defaults.\n\nWhy the others are wrong: `?.` doesn't catch exceptions (a throwing getter still throws) and `??` treats `0` and `\"\"` as real values; `?.` short-circuits to `undefined`, not `null`; and `NaN ?? 5` is `NaN`, since `??` ignores every value except `null` and `undefined`.", r'''
const port = config?.server?.port ?? 3000;
user.onLogin?.();
0 ?? 5;   // 0
0 || 5;   // 5
'''), ["mdn-optional-chaining", "mdn-nullish", "jsi-optional-chaining"]),
 ("What are template literals and tagged templates?", [Dm], "easy",
  "Backtick strings with `${}` interpolation and multiple lines; a tag function receives the string parts and values separately.",
  ["Backtick strings with `${}` interpolation; a tag function receives the final concatenated string and can rewrite it before it's returned.",
   "Backtick strings that escape HTML in `${}` values automatically; a tag function picks which escaping rules apply.",
   "Single- or double-quoted strings with `${}` placeholders; a tag function formats the values before interpolation."],
  ex("Backtick strings with `${expression}` interpolation and multiline support. A tag function receives the string parts and the values separately, enabling safe SQL/HTML building, i18n or styling (the idea behind styled-components and `sql` helper libraries).\n\nWhy the others are wrong: the tag gets the raw pieces (a strings array plus the values) before any joining, which is what makes safe escaping possible; template literals escape nothing by themselves; and `${}` only interpolates inside backticks, in quotes it is literal text.", r'''
const tag = (strings, ...vals) =>
  strings.reduce((out, s, i) => out + s + (vals[i] !== undefined ? `[${vals[i]}]` : ""), "");
tag`id=${7} name=${"ana"}`; // "id=[7] name=[ana]"
'''), ["mdn-template", "jsi-string"]),
 ("When shouldn't you use `forEach` or `reduce`?", [Dm], "medium",
  "`forEach` can't be awaited or stopped early, so use `for...of`; `reduce` that builds complex objects reads better as `Object.groupBy`.",
  ["Use `forEach` for async work, since it awaits each callback; avoid `reduce`, as it mutates the array as it folds.",
   "`forEach` is slower than `map`, so use `map` for side effects; `reduce` fails on empty arrays even with an initial value.",
   "Avoid both on arrays over 100 items, since they copy the array on each iteration; a `for` loop avoids the copies."],
  ex("`map` transforms each item into a new array, `filter` keeps matching items, `reduce` folds to a single value. `forEach` returns nothing and can't be awaited or broken out of; prefer `for...of` for side effects, early exit and `await`. `reduce` becomes unreadable when it builds complex objects; `Object.groupBy` or `Object.fromEntries` often say it better.\n\nWhy the others are wrong: `forEach` ignores the promises its callback returns, and `reduce` doesn't mutate the array; `map` for side effects builds a throwaway array, and `[].reduce(fn, 0)` returns `0` (it throws only without an initial value); and neither method copies the array.", r'''
const orders = [{ t: "a", n: 2 }, { t: "b", n: 3 }, { t: "a", n: 1 }];
const total = orders.reduce((s, o) => s + o.n, 0);           // 6
const byType = Object.groupBy(orders, (o) => o.t);            // { a: [...], b: [...] }
const names = orders.filter((o) => o.n > 1).map((o) => o.t);  // ["a", "b"]
'''), ["mdn-array", "jsi-array-methods", "eloquent"]),
 ("What are `Proxy` and `Reflect` used for?", [Dm], "hard",
  "A `Proxy` intercepts operations through traps (validation, reactivity); `Reflect` provides each default behaviour so traps can delegate.",
  ["A `Proxy` deep-copies an object and tracks changes to the copy; `Reflect` compares two proxies for structural equality.",
   "A `Proxy` is a faster replacement for plain objects in hot paths; `Reflect` converts a proxy back into its target object.",
   "A `Proxy` intercepts property reads but not writes or calls; `Reflect` exposes metadata such as an object's class name."],
  ex("A `Proxy` wraps an object and intercepts operations (get, set, has, deleteProperty, apply) through handler traps. `Reflect` offers the default behaviour for each operation, so traps can delegate. Uses: validation, observable state (Vue 3 reactivity), logging, default values. Costs: slower than plain access, and subtle invariants.\n\nWhy the others are wrong: a proxy wraps the original target without copying it, and `Reflect` has no equality check; proxies are slower than plain objects and there is no API to unwrap one; and handlers can trap `set`, `apply`, `construct`, `deleteProperty` and more, while `Reflect` mirrors those operations rather than reporting metadata.", r'''
const guarded = new Proxy({}, {
  set(target, key, value, receiver) {
    if (key === "age" && !Number.isInteger(value)) throw new TypeError("age must be int");
    return Reflect.set(target, key, value, receiver);
  },
});
guarded.age = 30;
'''), ["mdn-proxy", "jsi-proxy"]),
 ("How do you make an object immutable, and how is `Object.freeze` different from `const`?", [Dm], "medium",
  "`const` protects only the binding; `Object.freeze` makes own properties read-only, but only one level deep.",
  ["Both do the same thing for objects; `Object.freeze` is the older spelling of `const` from before ES2015.",
   "`Object.freeze` freezes nested objects recursively, while `const` makes the top-level properties read-only.",
   "`const` makes the object read-only one level deep, so `Object.freeze` is needed for arrays and nested objects."],
  ex("`const` protects the binding only. `Object.freeze` makes own properties read-only (shallow; it fails silently in sloppy mode and throws a `TypeError` in strict mode). Nested objects need recursive freezing or immutable update patterns (spread, `structuredClone`, Immer). `Object.defineProperty` gives per-property control (`writable`, `enumerable`, `configurable`).\n\nWhy the others are wrong: `const` affects the variable and `Object.freeze` affects the object, they're unrelated features; `Object.freeze` is shallow (nested objects stay mutable) and `const` doesn't touch properties at all; and a `const` object's properties can still be changed.", r'''
"use strict";
const cfg = Object.freeze({ a: 1, nested: { b: 2 } });
// cfg.a = 2;        // TypeError
cfg.nested.b = 3;    // allowed (shallow freeze)
'''), ["mdn-freeze", "jsi-descriptors"]),
 ("What is the difference between `for...in` and `for...of`?", [Dm], "easy",
  "`for...in` loops over enumerable string keys, inherited ones included; `for...of` loops over the values of any iterable.",
  ["`for...in` loops over own keys, skipping inherited ones; `for...of` loops over a plain object's values in order.",
   "`for...in` loops over array indexes as numbers; `for...of` loops over values but skips holes and `undefined`.",
   "`for...in` loops over the values of any iterable, including Maps; `for...of` loops over a plain object's enumerable keys."],
  ex("`for...in` iterates enumerable string keys, including inherited ones (avoid it on arrays). `for...of` iterates the values of any iterable (arrays, strings, Maps, Sets, generators). For an object's own properties use `Object.keys`/`values`/`entries`, often with `for...of` and destructuring.\n\nWhy the others are wrong: `for...in` includes inherited enumerable keys, and `for...of` on a plain object throws a `TypeError` (it isn't iterable); `for...in` yields keys as strings, and `for...of` visits holes as `undefined`; and the roles are swapped.", r'''
for (const [k, v] of Object.entries({ a: 1, b: 2 })) console.log(k, v);
for (const ch of "hi") console.log(ch);
for (const i in ["x", "y"]) console.log(typeof i); // "string"
'''), ["mdn-for-in", "mdn-for-of", "jsi-keys"]),

 # ---------------- E. runtime, browser, security ----------------
 ("How does Node.js handle concurrency if JavaScript is single-threaded?", [E], "hard",
  "JS runs on one thread, but I/O goes to the OS and libuv's thread pool and returns as callbacks; CPU-bound work needs worker threads.",
  ["JS runs on libuv's thread pool, one thread per pending callback, so CPU-heavy handlers run in parallel by default.",
   "Each incoming request's JavaScript runs on its own OS thread, so CPU-heavy code in one handler doesn't block others.",
   "JS runs on one thread, and `async` functions move CPU-bound work to the thread pool, so `await` keeps the loop free."],
  ex("The JS code runs on one thread, but I/O is delegated to the OS (epoll/kqueue/IOCP) and to a libuv thread pool (file system, DNS, crypto, zlib), and results come back as callbacks into the event loop. CPU-bound work blocks the loop, so offload it to `worker_threads`, child processes or a separate service; scale across cores with the `cluster` module or multiple processes.\n\nWhy the others are wrong: the thread pool runs native work (file system, DNS lookup, crypto, zlib), never your JS callbacks; Node doesn't use a thread per request, so a CPU-heavy handler stalls every request; and marking a function `async` doesn't move it anywhere, its synchronous parts still block the event loop.", r'''
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
if (isMainThread) {
  new Worker(new URL(import.meta.url), { workerData: 40 })
    .on("message", (r) => console.log("fib", r));
} else {
  const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
  parentPort.postMessage(fib(workerData));
}
'''), ["node-event-loop", "node-workers", "belder-event-loop"]),
 ("What typically causes memory leaks in JavaScript, and how do you find them?", [E], "hard",
  "Forgotten references: listeners, timers, closures, unbounded caches, detached DOM nodes. Compare heap snapshots before and after an action.",
  ["Circular references between objects, which the GC doesn't collect; find them by searching for objects that point back.",
   "Large allocations the GC hasn't reached yet; find them in the CPU profile and call `global.gc()` more often.",
   "Objects created with `new` that weren't `delete`d afterwards; find them by counting allocations in a CPU profile."],
  ex("The GC frees what is unreachable, so leaks are references you forgot: accidental globals, listeners never removed, timers never cleared, closures holding big objects, unbounded caches and Maps, detached DOM nodes. Find them with heap snapshots and allocation timelines (Chrome DevTools Memory tab, `node --inspect`), comparing snapshots before and after an action. Fix by removing listeners, using `WeakMap`/`WeakRef`, bounding caches and clearing timers.\n\nWhy the others are wrong: the mark-and-sweep GC collects unreachable cycles fine; garbage that hasn't been collected yet isn't a leak, and a CPU profile shows time, not retained memory; and `delete` removes properties, it doesn't free objects (unreachable ones are collected automatically).", r'''
const cache = new Map();              // leak: grows forever
function get(k) { if (!cache.has(k)) cache.set(k, big(k)); return cache.get(k); }
// fix: LRU / size limit, or WeakMap when keys are objects
'''), ["mdn-memory", "chrome-memory", "node-memory"]),
 ("What is the difference between debounce and throttle in JavaScript, and when do you use each?", [E], "medium",
  "Debounce runs once after calls stop for `ms` (search-as-you-type); throttle runs at most once per `ms` while calls continue (scroll).",
  ["Both delay a function by a fixed time; debounce uses `setTimeout` and throttle uses `setInterval`, otherwise they match.",
   "Debounce runs on the first call and ignores the rest for good; throttle queues each call and replays them `ms` apart.",
   "Debounce runs at most once per `ms` while calls keep coming (scroll); throttle runs a single time after the calls stop (search-as-you-type)."],
  ex("Debounce waits until calls stop for `ms`, then runs once (search-as-you-type, end of resize). Throttle runs at most once per `ms` while calls continue (scroll, mouse move). Both use closures and timers.\n\nWhy the others are wrong: they behave differently (debounce resets on every call, throttle rate-limits), regardless of which timer API implements them; debounce runs after a quiet period, not on the first call only, and throttle drops extra calls rather than queueing them; and the definitions are swapped.", r'''
const debounce = (fn, ms) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};
const throttle = (fn, ms) => {
  let last = 0;
  return (...a) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...a); }
  };
};
'''), ["jsi-decorators", "css-tricks-debounce"]),
 ("What are event bubbling, capturing and delegation?", [E], "medium",
  "Events travel down (capture), hit the target, then bubble up; delegation uses one parent listener and `event.target` for many children.",
  ["Events bubble down from the root to the target, then capture back up; delegation means calling `stopPropagation` early.",
   "Events fire on the target, then bubble up; capturing is a separate opt-in event type, and delegation copies the listener onto each child element.",
   "Events travel down (capture), then bubble up; handlers run in the capture phase by default, and delegation needs `once: true`."],
  ex("An event travels down from the root to the target (capture), fires on the target, then bubbles back up. Handlers run on bubble by default. Delegation attaches one listener on a parent and uses `event.target` (or `closest`) to handle many children, including ones added later. `stopPropagation` halts the travel; `preventDefault` cancels the browser default; they're different things.\n\nWhy the others are wrong: capture goes down and bubbling goes up, and `stopPropagation` stops the travel rather than delegating; capturing is a phase of the same event (opt in with `{ capture: true }`), and delegation uses one listener on the parent; and listeners run in the bubble phase by default, while `once` only removes a listener after one call.", r'''
list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (li && list.contains(li)) console.log("clicked", li.dataset.id);
});
'''), ["jsi-bubbling", "jsi-delegation", "mdn-bubbling"]),
 ("What is CORS, and when does the browser send a preflight request?", [E], "hard",
  "Server headers that opt in to cross-origin reads; non-simple requests (custom headers, JSON, `PUT`/`DELETE`) get an `OPTIONS` preflight.",
  ["A server-side firewall that blocks cross-origin requests; the browser sends a preflight before each cross-origin request.",
   "Server headers that allow cross-origin reads; the browser preflights GET and POST requests but skips `PUT` and `DELETE`.",
   "An authentication scheme between origins; the preflight sends the user's credentials so the server can verify them first."],
  ex("The same-origin policy blocks a page from reading responses from another origin. CORS lets the server opt in with headers (`Access-Control-Allow-Origin`, `-Methods`, `-Headers`, `-Credentials`). \"Non-simple\" requests (custom headers, a JSON content type, `PUT`/`DELETE`) trigger a preflight `OPTIONS` request first. CORS is enforced by the browser only, protects users, and isn't an authentication mechanism. A wildcard `*` origin is rejected by browsers for credentialed requests, and reflecting any request's `Origin` back with `Allow-Credentials: true` is just as unsafe.\n\nWhy the others are wrong: CORS is enforced by the browser, not a server firewall, and simple requests (plain GET, form-style POST) have no preflight; it's the reverse, `PUT` and `DELETE` are non-simple and preflighted; and the preflight never carries cookies or credentials, CORS is not authentication.", r'''
// Express-style
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "https://app.example.com");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
'''), ["mdn-cors", "jsi-fetch-cors"]),
 ("What are XSS and CSRF, and how do you defend a JavaScript app against each?", [E], "hard",
  "XSS runs attacker script in your page (escape output, avoid `innerHTML`, CSP); CSRF abuses cookies (SameSite, tokens, origin checks).",
  ["Both are cross-origin attacks, so a strict `Access-Control-Allow-Origin` header plus HTTPS defends against each of them.",
   "XSS abuses ambient cookies (fix with `SameSite`); CSRF injects script into your page (escape output, use a CSP).",
   "XSS steals cookies over plain HTTP (fix with HTTPS); CSRF is SQL injection through forms (fix with prepared statements)."],
  ex("XSS: attacker script runs in your page. Defend by escaping output, avoiding `innerHTML` with untrusted data (use `textContent`), sanitising HTML (DOMPurify) and a strict Content-Security-Policy. CSRF: a malicious site makes the browser send an authenticated request using cookies. Defend with `SameSite` cookies, CSRF tokens and checking `Origin`. Store session cookies as `HttpOnly; Secure`.\n\nWhy the others are wrong: CORS controls reading responses, it doesn't stop injected script or a forged cookie-carrying request from being sent; the definitions are swapped; and XSS is script injection (HTTPS doesn't prevent it) while CSRF forges authenticated requests, SQL injection is a different attack.", r'''
el.textContent = userInput;         // safe
// el.innerHTML = userInput;        // XSS risk
// Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax
'''), ["owasp-xss", "owasp-csrf", "mdn-csp"]),
 ("When do you use `localStorage`, `sessionStorage`, cookies and IndexedDB?", [E], "medium",
  "Web Storage for small strings (per origin or per tab), `HttpOnly` cookies for session ids, IndexedDB for large or offline data.",
  ["`localStorage` for session tokens since page scripts don't see it, cookies for UI preferences, IndexedDB for caching small images.",
   "`sessionStorage` for data shared across tabs, cookies for offline data, and IndexedDB for small synchronous lookups.",
   "`localStorage` for data the server should receive, since it's sent with requests; cookies and IndexedDB for large blobs."],
  ex("`localStorage`: synchronous string key/values, persistent, per origin, about 5 MB, readable by any script (don't keep tokens there if XSS is a concern). `sessionStorage`: the same, but per tab session. Cookies: sent with every request, size-limited, can be `HttpOnly` (invisible to JS), so best for session ids. IndexedDB: asynchronous, structured, for large data and offline apps.\n\nWhy the others are wrong: any script on the origin (including injected XSS) can read `localStorage`, while `HttpOnly` cookies are hidden from JS; `sessionStorage` is per tab, cookies are tiny and sent with every request, and IndexedDB is asynchronous; and Web Storage is never sent to the server, cookies are limited to about 4 KB.", r'''
localStorage.setItem("theme", "dark");
JSON.parse(localStorage.getItem("prefs") ?? "{}");
'''), ["mdn-webstorage", "mdn-indexeddb", "jsi-localstorage", "jsi-cookie"]),
 ("How do you keep the browser UI responsive during heavy work?", [E], "hard",
  "Move computation to Web Workers, split long tasks, animate in `requestAnimationFrame`, and batch DOM reads before writes.",
  ["Run the heavy loop with `setInterval(fn, 0)`, which schedules it on a separate thread from rendering.",
   "Wrap the heavy loops in `async` functions, which the engine runs on a background thread away from rendering.",
   "Interleave DOM reads and writes so layout work is spread out over time, and animate with `setTimeout` at fixed 16 ms intervals."],
  ex("The main thread runs JS, style, layout and paint, so long tasks (over 50 ms) cause jank. Move heavy computation to Web Workers, split work into chunks (`requestIdleCallback`, `scheduler.yield`), do visual updates in `requestAnimationFrame`, batch DOM reads before writes to avoid layout thrashing, and prefer CSS transforms for animation.\n\nWhy the others are wrong: timers run their callbacks on the main thread, so the loop still blocks rendering; `async` doesn't move code off the main thread; and interleaving reads and writes forces repeated synchronous layout (layout thrashing), while `setTimeout` isn't synced to the display like `requestAnimationFrame`.", r'''
const w = new Worker("worker.js");
w.postMessage(bigArray);
w.onmessage = (e) => render(e.data);

function tick() { el.style.transform = `translateX(${x++}px)`; requestAnimationFrame(tick); }
requestAnimationFrame(tick);
'''), ["mdn-workers", "webdev-long-tasks", "webdev-layout-thrashing"]),
 ("What does `\"use strict\"` change, and what does TypeScript add on top?", [E], "medium",
  "Strict mode turns silent errors into exceptions and makes plain-call `this` `undefined`; TypeScript adds build-time types but erases to JS.",
  ["Strict mode enables runtime type checks on function arguments; TypeScript adds compile-time types and keeps them at runtime.",
   "Strict mode makes objects immutable by default; TypeScript validates API responses against its types at runtime.",
   "Strict mode turns silent errors into exceptions; TypeScript's compiled output keeps checks that throw on bad input."],
  ex("Strict mode turns silent errors into exceptions (undeclared variables, duplicate parameters, assignments to read-only properties), sets `this` to `undefined` in plain calls, and is automatic in modules and classes. TypeScript adds static types, catching shape and null errors at build time and improving refactoring and editor support; it erases to plain JavaScript, so runtime rules still apply and external data still needs validation (for example with Zod).\n\nWhy the others are wrong: strict mode has no type checks and TypeScript types are erased at build time; strict mode doesn't freeze objects, and TypeScript can't check data at runtime (use a validator such as Zod); and the compiled JavaScript contains no type checks at all.", r'''
"use strict";
// undeclaredVar = 1;   // ReferenceError
'''), ["mdn-strict", "ts-handbook", "effective-ts"]),
 ("Implementing `Promise.all` by hand is a common exercise. What must a correct version handle?", [E], "hard",
  "Results in input order, non-promise values, empty input resolving to `[]`, rejecting on the first failure, and counting completions.",
  ["Results in input order and rejecting on the first failure; non-promise values and empty input should throw a `TypeError`.",
   "Results in completion order, waiting for each promise even after a rejection, and resolving with `[]` for empty input.",
   "Awaiting each promise in a `for` loop, which keeps input order and rejects as soon as any input rejects."],
  ex("It tests promises, ordering and edge cases: preserve input order (not completion order), accept non-promise values (wrap them with `Promise.resolve`), resolve `[]` for empty input, reject on the first rejection, and count completions rather than relying on array length.\n\nWhy the others are wrong: `Promise.all` accepts plain values (wrapping them with `Promise.resolve`) and resolves `[]` for empty input; results follow input order and the first rejection settles it, the behaviour described is closer to `allSettled`; and a sequential `await` loop only notices a rejection when it reaches that item, so a fast failure behind a slow promise is reported late (and briefly unhandled).", r'''
function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const list = [...items];
    const out = new Array(list.length);
    let left = list.length;
    if (left === 0) return resolve(out);
    list.forEach((item, i) => {
      Promise.resolve(item).then((v) => {
        out[i] = v;
        if (--left === 0) resolve(out);
      }, reject);
    });
  });
}
await promiseAll([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 10))]); // [1,2,3]
'''), ["mdn-promise-all", "jsi-promise-api", "greatfrontend", "exercism-js"]),
]

assert len(Q) == 50, len(Q)

build("JavaScript interview questions", M, Q, sys.argv[1], strip_backticks=False)
