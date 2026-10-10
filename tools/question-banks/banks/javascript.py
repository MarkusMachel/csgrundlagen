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
 "callbackhell": ("link", "Callback Hell", "http://callbackhell.com/", "Max Ogden", "A guide to writing asynchronous JavaScript programs.", True),
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
  ["Five primitives plus arrays; `typeof []` is `\"array\"` and `typeof null` is `\"null\"`.",
   "Everything is an object, so `typeof` returns `\"object\"` for every value except `undefined`.",
   "Seven primitives plus objects; `typeof NaN` is `\"undefined\"` and `typeof function(){}` is `\"object\"`."],
  ex("Seven primitives: `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null`. Everything else is an object (arrays, functions, dates, maps). `typeof` returns the type name as a string, with two quirks: `typeof null` is `\"object\"` (a historical bug) and `typeof function(){}` is `\"function\"`. Use `Array.isArray` for arrays.", r'''
typeof 42;          // "number"
typeof null;        // "object"  (bug that stayed)
typeof [];          // "object"
Array.isArray([]);  // true
'''), ["mdn-types", "jsi-types", "ydkjs"]),
 ("What is the difference between `==` and `===`, and when is `==` acceptable?", [A], "easy",
  "`===` compares without type conversion; `==` coerces first. The one common accepted use is `x == null`.",
  ["`===` compares by reference while `==` compares by value, so use `==` for primitives and `===` for objects.",
   "They are identical in strict mode, so the choice only matters in old sloppy-mode scripts.",
   "`==` is faster because it skips the type check, so it's preferred in hot loops and comparisons of numbers."],
  ex("`===` compares without conversion (type and value). `==` applies the coercion rules first, which gives surprising results (`0 == \"\"`, `null == undefined`). Default to `===`. The one common accepted use of `==` is `x == null` to check for both `null` and `undefined` at once.", r'''
0 == "";            // true
null == undefined;  // true
null === undefined; // false
NaN === NaN;        // false
'''), ["mdn-equality", "jsi-comparison", "fm-deep-js"]),
 ("How do `var`, `let` and `const` differ?", [A], "easy",
  "`var` is function-scoped and hoisted as `undefined`; `let`/`const` are block-scoped with a TDZ, and `const` only forbids reassignment.",
  ["`var` and `let` behave the same; only `const` is block-scoped, and it makes the object it points to immutable.",
   "All three are block-scoped; `var` just allows redeclaration, and `const` deep-freezes the value it is assigned.",
   "`let` and `const` are hoisted as `undefined` like `var`, so reading them before the declaration returns `undefined`."],
  ex("`var` is function-scoped, hoisted and initialised to `undefined`, and can be redeclared. `let` and `const` are block-scoped and live in the temporal dead zone (TDZ) until their declaration runs; touching them earlier throws a `ReferenceError`. `const` forbids reassigning the binding, not mutating the object it points to.", r'''
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
  ["The engine physically moves every line of code to the top of its file before running it.",
   "Function expressions are hoisted with their body too; calling one early fails only in strict mode.",
   "Hoisting only applies to `let` and `const`, which is why they can be read before their declaration."],
  ex("Declarations are registered when the scope is created, before code runs. Function declarations are hoisted with their body, so you can call them early. `var` is hoisted as `undefined`, so calling a `var` function expression early is calling `undefined`. `let`, `const` and `class` are hoisted but not initialised (TDZ).", r'''
hello();                 // works
function hello() { console.log("hi"); }

// bye();                // TypeError: bye is not a function
var bye = function () {};
'''), ["mdn-hoisting", "jsi-closure"]),
 ("Which values are falsy, and why does `count || 10` go wrong when `count` is `0`?", [A], "easy",
  "`false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined`, `NaN`; `||` treats `0` as missing, so use `??`.",
  ["`false`, `null` and `undefined` only; `0 || 10` returns `0`, so `||` is safe for counts.",
   "Every empty value, including `[]` and `{}`; `||` checks for emptiness, so `0` and `[]` both fall through.",
   "`false`, `0` and `\"false\"`; the string `\"0\"` is falsy too, which is why `||` misbehaves with form input."],
  ex("Falsy values are `false`, `0`, `-0`, `0n`, `\"\"`, `null`, `undefined` and `NaN`. Everything else is truthy, including `\"0\"`, `\"false\"`, `[]` and `{}`. This matters in conditions and with `||`, which treats `0` and `\"\"` as missing; prefer `??` when those are valid values.", r'''
const count = 0;
count || 10;   // 10  (surprise)
count ?? 10;   // 0
Boolean([]);   // true
'''), ["mdn-truthy", "mdn-falsy", "jsi-logical"]),
 ("What is the difference between `null` and `undefined`?", [A], "easy",
  "`undefined` means nothing was assigned; `null` is an intentional empty value. `JSON.stringify` drops `undefined` properties.",
  ["They are the same value with two names, so `null === undefined` is `true`.",
   "`null` means a variable was never declared, while `undefined` means it was declared but deleted.",
   "`undefined` is an intentional empty value set by developers, and engines use `null` for missing properties."],
  ex("`undefined` means \"no value assigned\": an uninitialised variable, a missing property or argument, a function with no `return`. `null` is an intentional \"no value\" set by the programmer. They are loosely equal (`==`) but not strictly equal, and `typeof` differs. APIs and JSON usually use `null` for empty; `JSON.stringify` drops properties whose value is `undefined`.", r'''
let a;               // undefined
const b = null;      // explicit empty
JSON.stringify({ a: undefined, b: null }); // '{"b":null}'
'''), ["mdn-null", "mdn-undefined", "jsi-nullish"]),
 ("How are primitives and objects copied and compared?", [A], "easy",
  "Primitives are copied and compared by value; objects by reference, so `===` checks identity, not content.",
  ["Both are copied by value; objects are cloned on assignment, so changing a copy never affects the original.",
   "Objects are compared by content with `===`, so two object literals with the same keys are equal.",
   "Primitives are passed by reference to functions, so a function can change a caller's number variable."],
  ex("Primitives are immutable and copied by value; comparing compares values. Objects (arrays and functions included) are copied by reference: the variable holds a pointer, so two variables can share and mutate the same object, and `===` compares identity, not content.", r'''
const a = { x: 1 };
const b = a;
b.x = 2;
a.x;                       // 2
({ x: 1 }) === ({ x: 1 }); // false
'''), ["jsi-object-copy", "mdn-primitive", "eloquent"]),
 ("How do you deep-copy an object, and what is wrong with `JSON.parse(JSON.stringify(x))`?", [A], "medium",
  "Use `structuredClone`; the JSON round-trip drops `undefined`, turns dates into strings, loses `Map`/`Set` and throws on cycles.",
  ["Use the spread operator, which copies nested objects too; the JSON round-trip is fine apart from being slow.",
   "Use `Object.assign({}, x)`, which deep-copies; the JSON round-trip only fails for numbers above 2^53.",
   "Use `structuredClone`, which also copies functions and class prototypes; the JSON round-trip handles everything else."],
  ex("Spread (`{...o}`) and `Object.assign` copy one level; nested objects are still shared. For a deep copy use `structuredClone`: built in, and it handles dates, maps, sets and cycles (but not functions or class prototypes). `JSON.parse(JSON.stringify(x))` loses `undefined`, turns dates into strings, drops `Map` and `Set`, and throws on cycles.", r'''
const o = { a: 1, inner: { b: 2 }, when: new Date() };
const shallow = { ...o };
const deep = structuredClone(o);
shallow.inner === o.inner; // true
deep.inner === o.inner;    // false
'''), ["mdn-structuredclone", "jsi-object-copy", "webdev-structured-clone"]),
 ("Why is `0.1 + 0.2 !== 0.3`, and when do you need `BigInt`?", [A], "medium",
  "Numbers are IEEE 754 doubles that can't store some decimals exactly; `BigInt` is for integers beyond 2^53 - 1.",
  ["It's a known engine bug fixed in ES2015; `BigInt` is the fix and should be used for all decimal math.",
   "Addition rounds to 16 significant digits; `BigInt` is for decimals that need more precision, like currency.",
   "JavaScript stores numbers as 32-bit floats; `BigInt` doubles that to 64 bits so decimals become exact."],
  ex("Numbers are IEEE 754 64-bit floats, and some decimals can't be represented exactly in binary. Compare with a tolerance (`Math.abs(a - b) < Number.EPSILON`) or work in integers (cents) for money. Integers are exact only up to `Number.MAX_SAFE_INTEGER` (2^53 - 1); beyond that use `BigInt` (suffix `n`), which can't be mixed with `Number` without converting.", r'''
0.1 + 0.2;                                   // 0.30000000000000004
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON;  // true
9007199254740993n + 1n;                      // 9007199254740994n
'''), ["mdn-number", "mdn-bigint", "point-three", "jsi-number"]),
 ("What do `\"5\" + 1` and `\"5\" - 1` evaluate to, and why?", [A], "easy",
  "`\"51\"` and `4`: `+` concatenates when either side is a string, while `-` always converts to numbers.",
  ["`6` and `4`: both operators convert numeric strings to numbers before doing arithmetic.",
   "`\"51\"` and `\"5-1\"`: once a string is involved, every operator works on strings.",
   "`6` and `\"4\"`: arithmetic happens first and the result takes the type of the left operand."],
  ex("Operators convert their operands: `+` concatenates if either side is a string, the other arithmetic operators convert to numbers, conditions convert to booleans, and `==` uses the abstract equality algorithm. Be explicit instead: `Number(x)`, `String(x)`, `Boolean(x)`. `parseInt` parses a prefix and needs a radix.", r'''
"5" + 1;              // "51"
"5" - 1;              // 4
[] + {};              // "[object Object]"
+"";                  // 0
parseInt("08px", 10); // 8
'''), ["jsi-type-conversions", "mdn-coercion", "ydkjs"]),

 # ---------------- B. functions, scope, this, prototypes ----------------
 ("What is a closure, what is it good for, and what does it cost?", [B], "easy",
  "A function that keeps access to its creating scope's variables; good for private state and factories, but captured values stay in memory.",
  ["A function that copies the outer variables' values when it's created; it saves memory because nothing outer is kept alive.",
   "A function stored inside an object; it's mainly a way to group methods and has no effect on memory.",
   "A function that runs immediately and closes over nothing; it isolates code from the global scope."],
  ex("A closure is a function that keeps access to the variables of the scope where it was created, even after that scope has returned. Uses: private state, factories, callbacks that remember context, memoisation, partial application. The cost: captured variables aren't garbage-collected while the closure lives.", r'''
function counter() {
  let n = 0;
  return () => ++n;
}
const next = counter();
next(); next(); // 1, 2
'''), ["mdn-closures", "jsi-closure", "ydkjs"]),
 ("What does this print, and how do you fix it?\n\n```js\nfor (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);\n```", [B], "medium",
  "`3 3 3`, because every callback shares one function-scoped `i`; use `let` to get a new binding per iteration.",
  ["`0 1 2`, because each callback captures the value of `i` when `setTimeout` is called.",
   "`undefined` three times, because `i` no longer exists once the loop has finished running.",
   "`2 2 2`, because the last loop iteration sets `i` to 2 before any timer fires."],
  ex("`var` is function-scoped, so all callbacks share one `i`, which is `3` by the time the timers run. Fix it with `let` (a new binding per iteration) or an IIFE.", r'''
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0); // 0 1 2
'''), ["mdn-closures-loops", "jsi-closure", "namaste-js"]),
 ("How is the value of `this` determined?", [B], "medium",
  "By how the function is called: `new`, then `call`/`apply`/`bind`, then `obj.fn()`, then a plain call; arrows use the outer `this`.",
  ["By where the function is defined: it always refers to the object literal or class the code appears in.",
   "It always refers to the global object unless the function is declared with the `method` keyword.",
   "By the last object the function was assigned to, so storing a method in a variable keeps its `this`."],
  ex("By how the function is called, not where it is defined (except arrows). Precedence: `new` (the new object), explicit `call`/`apply`/`bind`, a method call (`obj.fn()` gives `obj`), a plain call (`undefined` in strict mode, the global object otherwise). Arrow functions take `this` from the enclosing scope. Extracting a method loses its `this`.", r'''
const user = { name: "Ana", hi() { return this?.name; } };
user.hi();          // "Ana"
const f = user.hi;
f();                // undefined (this lost)
'''), ["mdn-this", "jsi-object-methods", "ydkjs"]),
 ("What do `call`, `apply` and `bind` do?", [B], "easy",
  "All set `this`: `call` invokes now with listed arguments, `apply` with an array, `bind` returns a new bound function.",
  ["`call` and `apply` create copies of a function, and `bind` attaches a function to an object permanently.",
   "`bind` invokes immediately with an array of arguments, and `call`/`apply` return new functions.",
   "They only work on arrow functions, and they set the function's `arguments` object, not `this`."],
  ex("All three set `this` explicitly. `call(thisArg, a, b)` invokes now with listed arguments; `apply(thisArg, [a, b])` invokes now with an array; `bind(thisArg, ...preset)` returns a new function with `this` (and optionally leading arguments) fixed.", r'''
function greet(g, p) { return `${g}, ${this.name}${p}`; }
const u = { name: "Ana" };
greet.call(u, "Hi", "!");
greet.apply(u, ["Hi", "!"]);
const hi = greet.bind(u, "Hi");
hi("?");
'''), ["mdn-bind", "jsi-bind"]),
 ("How do arrow functions differ from regular functions?", [B], "easy",
  "No own `this`, `arguments` or `prototype`, and no `new`: good for callbacks, wrong for methods and constructors.",
  ["They are just shorter syntax with identical behaviour, so they can replace every regular function.",
   "They always bind `this` to the object they are stored on, which makes them ideal for object methods.",
   "They are hoisted with their body like function declarations, so they can be called before they appear."],
  ex("Arrows have no own `this`, `arguments`, `super` or `new.target`; they can't be used with `new` and have no `prototype`. Great for callbacks that need the outer `this`; wrong for object methods that rely on their own `this`, and for constructors.", r'''
const o = {
  n: 1,
  later() { setTimeout(() => console.log(this.n), 0); }, // 1
  bad: () => this,                                       // not o
};
'''), ["mdn-arrow", "jsi-arrow"]),
 ("How does the prototype chain work?", [B], "medium",
  "Each object links to a prototype; reads walk the chain until found or `null`, while writes set the property on the object itself.",
  ["Each object copies all of its prototype's properties when created, so later changes to the prototype aren't seen.",
   "Property reads and writes both go to the prototype, so writing a property changes it for every instance.",
   "Only classes have prototypes; objects created with literals or `Object.create` have no prototype link."],
  ex("Every object has an internal `[[Prototype]]` link. Property lookup walks the chain until it finds the property or reaches `null`. Writing sets the property on the object itself (shadowing). `Object.getPrototypeOf(x)` reads the link; `Object.create(p)` makes an object with prototype `p`. Methods shared via the prototype are stored once, not per instance.", r'''
const animal = { eats: true };
const dog = Object.create(animal);
dog.barks = true;
dog.eats;                              // true (from prototype)
Object.getPrototypeOf(dog) === animal; // true
'''), ["mdn-proto-chain", "jsi-proto", "ydkjs"]),
 ("Are ES6 classes real classes, or something else underneath?", [B], "medium",
  "Syntax over prototypes: methods live on `Class.prototype`, but classes are always strict, need `new` and support `#private`.",
  ["Real classes like in Java: instances get their own copy of every method and there is no prototype involved.",
   "Exactly the same as constructor functions, with no behavioural differences besides the keyword.",
   "A compile-time feature only: they're removed during parsing, so `typeof SomeClass` is `\"undefined\"`."],
  ex("They are syntax over prototypes. A class body defines the constructor function; methods go on `Class.prototype`; `extends` links prototypes and `super` calls the parent. Differences from old constructor functions: a TDZ before the declaration, always strict, must be called with `new`, and support for `#private` fields and `static` members.", r'''
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
  ["Allocates a copy of the constructor function itself and returns that copy as the new instance.",
   "Calls the constructor normally; `new` is only a naming convention that signals intent to readers.",
   "Creates an object with no prototype, then copies every property of the constructor onto it."],
  ex("It creates an empty object linked to `Constructor.prototype`, calls the constructor with `this` set to that object, and returns the object (unless the constructor returns another object). Forgetting `new` on a plain function sets properties on the global object (sloppy mode) or throws (strict mode, classes).", r'''
function Person(name) { this.name = name; }
const p = new Person("Ana");
p instanceof Person;   // true
'''), ["mdn-new", "jsi-constructor-new"]),
 ("What is a higher-order function, and what is currying?", [B], "medium",
  "A function that takes or returns functions; currying turns `f(a, b, c)` into `f(a)(b)(c)` for partial application.",
  ["A function that runs at a higher priority in the event loop; currying is chaining several of them together.",
   "A function defined inside a class; currying is binding it to the class with `bind`.",
   "A function with more than three parameters; currying merges its parameters into a single options object."],
  ex("A higher-order function takes or returns functions (`map`, `filter`, `setTimeout`, decorators). Currying turns `f(a, b, c)` into `f(a)(b)(c)`, enabling partial application and reuse.", r'''
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
  ["Storing a function's source code so it doesn't have to be parsed again on every call.",
   "Caching any function's results, including impure ones like API calls, so they never need to run twice.",
   "A garbage-collector optimisation that the engine applies automatically to recursive functions."],
  ex("Memoisation caches a pure function's results by its arguments, trading memory for speed. It needs a stable cache key (serialise the arguments) and only suits pure functions. Watch for unbounded cache growth; consider an LRU, or a `WeakMap` for object keys.", r'''
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
  ["A, timeout, promise, B: callbacks run as soon as they are scheduled, in order of registration.",
   "A, B, timeout, promise: a zero-delay timer is due immediately, so it beats the promise.",
   "A, promise, B, timeout: resolved promises run synchronously inside the current statement."],
  ex("JavaScript runs on one thread with one call stack. Async work (timers, I/O, network) is handled by the host (browser or Node), which queues callbacks. When the stack is empty the loop takes the next task. After each task it drains the whole microtask queue (promise reactions, `queueMicrotask`) before the next task or render. A long synchronous task blocks everything, including rendering.", r'''
console.log("A");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("B");
// A, B, promise, timeout
'''), ["roberts-event-loop", "archibald-in-the-loop", "hallie-event-loop", "mdn-event-loop"]),
 ("What is the difference between microtasks and macrotasks (tasks)?", [C], "medium",
  "Promise reactions and `queueMicrotask` are microtasks, drained fully after each task; timers, I/O and UI events are tasks.",
  ["Microtasks are small timers under 4 ms; macrotasks are timers above that and are throttled by the browser.",
   "Microtasks run on a separate worker thread, so they can't block rendering the way tasks do.",
   "Tasks always run before microtasks, which is why a `setTimeout(fn, 0)` beats a resolved promise."],
  ex("Macrotasks (tasks): `setTimeout`, `setInterval`, I/O, UI events, `MessageChannel`. Microtasks: promise `.then/.catch/.finally`, `await` continuations, `queueMicrotask`, `MutationObserver`. The microtask queue is fully drained after the current task, so a promise chain always runs before the next timer, and an endless microtask loop starves rendering.", r'''
setTimeout(() => console.log("macro"), 0);
queueMicrotask(() => console.log("micro 1"));
Promise.resolve().then(() => console.log("micro 2"));
// micro 1, micro 2, macro
'''), ["archibald-tasks", "mdn-microtask", "jsi-microtask"]),
 ("What is callback hell, and how do you avoid it?", [C], "easy",
  "Deeply nested callbacks that are hard to read and handle errors in; flatten with promises and `async/await`.",
  ["An infinite loop of callbacks that crashes the engine; avoid it by limiting callbacks to three per file.",
   "Calling a callback more than once; avoid it by wrapping every callback in `setTimeout`.",
   "Using callbacks in the browser instead of Node; avoid it by moving async code to the server."],
  ex("Deeply nested callbacks that are hard to read, handle errors in, and compose. Avoid them with promises (flat chains and a central `.catch`), `async/await`, named functions and small composable helpers. Node's `util.promisify` converts error-first callbacks into promise-returning functions.", r'''
import { readFile } from "node:fs/promises";
const data = await readFile("a.json", "utf8"); // instead of nested callbacks
'''), ["jsi-callbacks", "node-promisify", "callbackhell"]),
 ("What are a promise's states, and how does chaining with `.then` work?", [C], "medium",
  "Pending, then fulfilled or rejected; each `.then` returns a new promise resolved with the callback's return value, and throws become rejections.",
  ["Pending, running and done; `.then` mutates the original promise, so every handler sees the first value.",
   "Fulfilled or rejected only; `.then` callbacks run synchronously, and a thrown error stops the program.",
   "Pending and settled, which can switch back to pending if the promise is resolved again."],
  ex("`pending`, then `fulfilled` or `rejected` (settled, final). `.then(onOk, onErr)` returns a new promise; its value is the callback's return value (or the unwrapped promise it returns); a thrown error becomes a rejection. `.catch` handles rejections anywhere above it in the chain; `.finally` runs either way and doesn't change the value.", r'''
Promise.resolve(1)
  .then((x) => x + 1)
  .then((x) => { throw new Error("boom " + x); })
  .catch((e) => e.message)  // "boom 2"
  .finally(() => console.log("done"));
'''), ["mdn-using-promises", "jsi-promise-basics", "jsi-promise-chaining", "hallie-promises"]),
 ("When do you use `Promise.all`, `allSettled`, `race` and `any`?", [C], "medium",
  "`all` fails fast, `allSettled` reports every outcome, `race` takes the first settled (timeouts), `any` the first success.",
  ["`all` runs promises sequentially, `allSettled` in parallel, `race` retries failures, and `any` picks one at random.",
   "`all` ignores rejections, `allSettled` fails fast, `race` waits for all, and `any` returns the slowest result.",
   "They're aliases kept for compatibility; all four wait for every promise and differ only in the return shape."],
  ex("`all`: waits for all, rejects on the first rejection (fail fast). `allSettled`: waits for all and reports each outcome; never rejects. `race`: settles with the first settled promise (good for timeouts). `any`: resolves with the first fulfilled one; rejects with an `AggregateError` only if all fail (good for redundant sources).", r'''
const results = await Promise.allSettled([a(), b(), c()]);
const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
'''), ["mdn-promise-concurrency", "jsi-promise-api"]),
 ("How do you handle errors with `async/await`, and what does `fetch` not reject on?", [C], "medium",
  "`try/catch` around awaits where you can act, rethrowing with a `cause`; `fetch` doesn't reject on HTTP errors, so check `res.ok`.",
  ["Wrap the whole program in one `try/catch`; `fetch` rejects on any non-200 status, so no extra check is needed.",
   "`async` functions can't throw, so check the return value for `null`; `fetch` rejects only on 500 errors.",
   "Attach `.catch` to every awaited line; `fetch` rejects on 404s but not on network failures."],
  ex("Use `try/catch` around awaited calls; an `async` function always returns a promise, and a thrown error rejects it. Catch where you can act (retry, fallback, translate) and let the rest bubble; don't swallow errors. `fetch` only rejects on network failure, not on a 404 or 500, so check `res.ok`. A rejected promise that is never awaited or caught becomes an unhandled rejection.", r'''
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
  ["`await` blocks the whole thread, so use callbacks instead; `forEach` awaits each callback but is slower than `for`.",
   "Sequential awaits run in parallel automatically, so there's no trap; `forEach` is fine because it returns a promise.",
   "Awaiting more than ten promises overflows the microtask queue; `forEach` is wrong only in older browsers."],
  ex("Awaiting in sequence makes independent calls run one after another. Start them together and await them together. In loops, `await` inside `for...of` is sequential on purpose, while `forEach` with an async callback doesn't wait at all. Bound concurrency for big lists (batches or a pool) to avoid overloading a server.", r'''
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
 ("What is an unhandled promise rejection, and what does modern Node do with one?", [C], "medium",
  "A rejection with no handler once microtasks drain; since Node 15 it terminates the process by default.",
  ["A promise that never settles; Node keeps it in memory forever but otherwise ignores it.",
   "A rejection inside `try/catch`; Node logs a warning and continues as if the promise had resolved.",
   "Any promise created without `new`; Node rejects it at parse time and refuses to start the script."],
  ex("A rejection with no handler attached by the time the microtask queue drains. Browsers emit `unhandledrejection`; modern Node terminates the process by default (since v15). Always return, await or catch promises; add a global handler only to log and shut down cleanly, not to carry on as if nothing happened.", r'''
process.on("unhandledRejection", (reason) => {
  console.error("unhandled", reason);
  process.exit(1);
});
'''), ["node-unhandled", "mdn-unhandledrejection", "jsi-promise-error"]),
 ("Does `setTimeout(fn, 0)` run immediately?", [C], "easy",
  "No: it queues a task after at least the delay, and it runs only once the stack is empty and microtasks are drained.",
  ["Yes: a zero delay calls the function synchronously before the next statement runs.",
   "Yes, unless a promise is pending, in which case it waits for that specific promise.",
   "No: it always waits exactly 4 ms, which is the fixed minimum resolution of every JavaScript timer."],
  ex("No. It schedules a task after at least the delay (browsers clamp nested timers to about 4 ms and throttle background tabs). It runs only when the stack is empty and microtasks are drained, so a busy main thread delays it arbitrarily. Use `requestAnimationFrame` for visual updates and `queueMicrotask` for \"right after this\".", r'''
const t = Date.now();
setTimeout(() => console.log("fired after", Date.now() - t, "ms"), 0);
while (Date.now() - t < 100) {} // blocks: timer fires after about 100 ms
'''), ["mdn-settimeout", "jsi-settimeout", "roberts-event-loop"]),
 ("How do you cancel an async operation like a `fetch`?", [C], "medium",
  "Pass an `AbortController`'s `signal` and call `abort()`; `AbortSignal.timeout(ms)` gives a timeout.",
  ["Call `promise.cancel()`, which every native promise supports since ES2017.",
   "Set the promise variable to `null`, which stops the request and frees its memory.",
   "Throw inside a `.then` handler, which reaches back and cancels the network request."],
  ex("Promises can't be cancelled themselves; use `AbortController`. Pass its `signal` to `fetch` (and many Node APIs), call `abort()` to cancel, and handle the `AbortError`. Also use it for timeouts (`AbortSignal.timeout(ms)`) and to ignore stale responses in UI code.", r'''
const ctrl = new AbortController();
const p = fetch("/api/slow", { signal: ctrl.signal });
setTimeout(() => ctrl.abort(), 500);
try { await p; } catch (e) { if (e.name !== "AbortError") throw e; }

await fetch("/api/x", { signal: AbortSignal.timeout(3000) });
'''), ["mdn-abortcontroller", "jsi-fetch-abort"]),

 # ---------------- D. modern JavaScript ----------------
 ("What are destructuring, spread and rest, and what are their traps?", [Dm], "easy",
  "Unpacking, expanding and collecting values; spread copies are shallow, and defaults apply only to `undefined`, not `null`.",
  ["Ways to deep-clone objects; the trap is that they're slow, so avoid them in loops.",
   "Ways to declare typed variables; the trap is that defaults also replace `0` and `\"\"`.",
   "Syntax for importing modules; the trap is that they only work with default exports."],
  ex("Destructuring unpacks arrays and objects into variables, with defaults and renaming. Spread (`...x`) expands an iterable or object in place; rest (`...x`) collects the remaining items. Traps: spread copies are shallow, and defaults apply only for `undefined`, not `null`.", r'''
const { id, name: title = "n/a", ...others } = { id: 1, extra: true };
const [first, , third = 0, ...tail] = [1, 2, undefined, 4, 5];
const merged = { ...{ a: 1 }, ...{ a: 2, b: 3 } }; // { a: 2, b: 3 }
const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
'''), ["mdn-destructuring", "jsi-destructuring", "jsi-rest-spread", "exploring-js"]),
 ("How do ES modules differ from CommonJS?", [Dm], "medium",
  "ESM is static and async, always strict, with live bindings, tree shaking and top-level `await`; CommonJS `require` is synchronous and dynamic.",
  ["They're identical; `import` is just a newer spelling of `require` that bundlers translate one-to-one.",
   "CommonJS supports tree shaking and top-level `await`, while ESM loads synchronously like `require`.",
   "ESM only works in browsers and CommonJS only in Node, so a package can never use both."],
  ex("CommonJS (`require`, `module.exports`) is synchronous, dynamic and Node's legacy format. ES modules (`import`/`export`) are static (enabling tree shaking), asynchronous, always strict, export live bindings and support top-level `await`. In Node, enable ESM with `.mjs` or `\"type\": \"module\"`. Use dynamic `import()` for lazy loading and to import ESM from CommonJS.", r'''
// math.mjs
export const add = (a, b) => a + b;
export default function mul(a, b) { return a * b; }
// app.mjs
import mul, { add } from "./math.mjs";
const lazy = await import("./big.mjs");
'''), ["mdn-modules", "node-esm", "jsi-modules"]),
 ("When do you use `Map`, `Set`, `WeakMap` and `WeakSet` instead of objects and arrays?", [Dm], "medium",
  "`Map` for any-type keys and frequent changes, `Set` for unique values, and the weak versions for per-object data that mustn't leak.",
  ["`Map` and `Set` are slower aliases of objects and arrays, kept only for older code; weak versions are deprecated.",
   "`WeakMap` is a `Map` limited to string keys, used when the number of keys is small and fixed.",
   "`Set` keeps duplicates in insertion order, and `WeakSet` is a `Set` that can be iterated faster."],
  ex("`Map` allows any key type, keeps insertion order, has `size`, and beats an object for frequent adds and removals. `Set` stores unique values (fast `has`, easy dedupe). `WeakMap`/`WeakSet` hold keys weakly (objects only, not iterable), so entries disappear when the key is collected: ideal for caches or metadata per object without leaks.", r'''
const unique = [...new Set([1, 1, 2])];   // [1, 2]
const m = new Map([[{ id: 1 }, "x"]]);
const meta = new WeakMap();
meta.set(domNode, { clicks: 0 });         // freed with domNode
'''), ["mdn-keyed", "jsi-map-set", "jsi-weakmap"]),
 ("What are iterators and generators?", [Dm], "medium",
  "An iterable has `[Symbol.iterator]()` yielding `{ value, done }`; a generator (`function*`) is a pausable function that `yield`s values lazily.",
  ["Iterators are arrays with an index property; generators are functions that create new arrays on every call.",
   "Generators run eagerly and return all values at once, while iterators are only for asynchronous code.",
   "Both are Node-only APIs for reading files line by line, unavailable in the browser."],
  ex("An iterable has `[Symbol.iterator]()` returning an iterator whose `next()` yields `{ value, done }`; `for...of`, spread and destructuring use it. A generator (`function*`) is a pausable function that `yield`s values lazily, handy for infinite sequences, custom iteration and cooperative flows. Async generators with `for await` stream async data.", r'''
function* ids() { let i = 1; while (true) yield i++; }
const it = ids();
it.next().value; // 1
it.next().value; // 2

async function* pages() { for (let p = 1; p <= 3; p++) yield await fetchPage(p); }
for await (const page of pages()) { /* ... */ }
'''), ["mdn-iterators", "jsi-generators", "jsi-async-iter"]),
 ("What do optional chaining (`?.`) and nullish coalescing (`??`) do, and how is `??` different from `||`?", [Dm], "easy",
  "`?.` returns `undefined` instead of throwing on `null`/`undefined`; `??` falls back only for those two, while `||` falls back for any falsy value.",
  ["`?.` converts `null` to an empty object; `??` and `||` are identical except for operator precedence.",
   "`?.` catches any exception thrown by a getter; `??` falls back for every falsy value, like `||`.",
   "`?.` makes a property optional in the type system; `??` throws if the left side is `null`."],
  ex("`a?.b` returns `undefined` instead of throwing when `a` is `null` or `undefined` (also `a?.[k]` and `a?.()`). `a ?? b` falls back only for `null`/`undefined`, unlike `||`, which falls back for any falsy value. Combine them for safe reads with correct defaults.", r'''
const port = config?.server?.port ?? 3000;
user.onLogin?.();
0 ?? 5;   // 0
0 || 5;   // 5
'''), ["mdn-optional-chaining", "mdn-nullish", "jsi-optional-chaining"]),
 ("What are template literals and tagged templates?", [Dm], "easy",
  "Backtick strings with `${}` interpolation and multiple lines; a tag function receives the string parts and values separately.",
  ["Strings that are compiled once and cached; a tag marks which ones should be translated.",
   "HTML snippets the browser parses automatically; tags choose which HTML element to render.",
   "A JSON shorthand; tagged templates are validated against a schema at parse time."],
  ex("Backtick strings with `${expression}` interpolation and multiline support. A tag function receives the string parts and the values separately, enabling safe SQL/HTML building, i18n or styling (the idea behind styled-components and `sql` helper libraries).", r'''
const tag = (strings, ...vals) =>
  strings.reduce((out, s, i) => out + s + (vals[i] !== undefined ? `[${vals[i]}]` : ""), "");
tag`id=${7} name=${"ana"}`; // "id=[7] name=[ana]"
'''), ["mdn-template", "jsi-string"]),
 ("When shouldn't you use `forEach` or `reduce`?", [Dm], "medium",
  "`forEach` can't be awaited or stopped early, so use `for...of`; `reduce` that builds complex objects reads better as `Object.groupBy`.",
  ["Never: `forEach` and `reduce` are always the fastest and clearest way to loop over arrays.",
   "Use `forEach` for async work since it awaits each callback; avoid `reduce` because it mutates the array.",
   "Avoid both on arrays over 100 items, since they copy the array on every iteration."],
  ex("`map` transforms each item into a new array, `filter` keeps matching items, `reduce` folds to a single value. `forEach` returns nothing and can't be awaited or broken out of; prefer `for...of` for side effects, early exit and `await`. `reduce` becomes unreadable when it builds complex objects; `Object.groupBy` or `Object.fromEntries` often say it better.", r'''
const orders = [{ t: "a", n: 2 }, { t: "b", n: 3 }, { t: "a", n: 1 }];
const total = orders.reduce((s, o) => s + o.n, 0);           // 6
const byType = Object.groupBy(orders, (o) => o.t);            // { a: [...], b: [...] }
const names = orders.filter((o) => o.n > 1).map((o) => o.t);  // ["a", "b"]
'''), ["mdn-array", "jsi-array-methods", "eloquent"]),
 ("What are `Proxy` and `Reflect` used for?", [Dm], "hard",
  "A `Proxy` intercepts operations through traps (validation, reactivity); `Reflect` provides each default behaviour so traps can delegate.",
  ["`Proxy` forwards network requests through a server; `Reflect` logs the responses for debugging.",
   "`Proxy` makes a deep copy of an object; `Reflect` compares two proxies for structural equality.",
   "`Proxy` is a faster replacement for plain objects; `Reflect` converts a proxy back to an object."],
  ex("A `Proxy` wraps an object and intercepts operations (get, set, has, deleteProperty, apply) through handler traps. `Reflect` offers the default behaviour for each operation, so traps can delegate. Uses: validation, observable state (Vue 3 reactivity), logging, default values. Costs: slower than plain access, and subtle invariants.", r'''
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
  ["`const` makes the object deeply immutable, so `Object.freeze` is only needed for arrays.",
   "`Object.freeze` deep-freezes every nested object, while `const` freezes only the top level.",
   "Both are identical; `Object.freeze` is the older spelling of `const` for objects."],
  ex("`const` protects the binding only. `Object.freeze` makes own properties read-only (shallow; it fails silently in sloppy mode and throws a `TypeError` in strict mode). Nested objects need recursive freezing or immutable update patterns (spread, `structuredClone`, Immer). `Object.defineProperty` gives per-property control (`writable`, `enumerable`, `configurable`).", r'''
"use strict";
const cfg = Object.freeze({ a: 1, nested: { b: 2 } });
// cfg.a = 2;        // TypeError
cfg.nested.b = 3;    // allowed (shallow freeze)
'''), ["mdn-freeze", "jsi-descriptors"]),
 ("What is the difference between `for...in` and `for...of`?", [Dm], "easy",
  "`for...in` loops over enumerable string keys, inherited ones included; `for...of` loops over the values of any iterable.",
  ["`for...in` loops over array values and `for...of` over object keys, so they're interchangeable on arrays.",
   "`for...of` only works on arrays, while `for...in` also works on strings, Maps and Sets.",
   "Both iterate values; `for...in` is just the older, slower syntax for the same loop."],
  ex("`for...in` iterates enumerable string keys, including inherited ones (avoid it on arrays). `for...of` iterates the values of any iterable (arrays, strings, Maps, Sets, generators). For an object's own properties use `Object.keys`/`values`/`entries`, often with `for...of` and destructuring.", r'''
for (const [k, v] of Object.entries({ a: 1, b: 2 })) console.log(k, v);
for (const ch of "hi") console.log(ch);
for (const i in ["x", "y"]) console.log(typeof i); // "string"
'''), ["mdn-for-in", "mdn-for-of", "jsi-keys"]),

 # ---------------- E. runtime, browser, security ----------------
 ("How does Node.js handle concurrency if JavaScript is single-threaded?", [E], "medium",
  "JS runs on one thread, but I/O goes to the OS and libuv's thread pool and returns as callbacks; CPU-bound work needs worker threads.",
  ["Node runs each request's JavaScript on its own OS thread, so CPU-heavy code never blocks other requests.",
   "Node isn't concurrent: it handles one request at a time, which is why it uses many processes by default.",
   "JavaScript in Node is multi-threaded by default; only browsers restrict it to a single thread."],
  ex("The JS code runs on one thread, but I/O is delegated to the OS (epoll/kqueue/IOCP) and to a libuv thread pool (file system, DNS, crypto, zlib), and results come back as callbacks into the event loop. CPU-bound work blocks the loop, so offload it to `worker_threads`, child processes or a separate service; scale across cores with the `cluster` module or multiple processes.", r'''
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
if (isMainThread) {
  new Worker(new URL(import.meta.url), { workerData: 40 })
    .on("message", (r) => console.log("fib", r));
} else {
  const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
  parentPort.postMessage(fib(workerData));
}
'''), ["node-event-loop", "node-workers", "belder-event-loop"]),
 ("What typically causes memory leaks in JavaScript, and how do you find them?", [E], "medium",
  "Forgotten references: listeners, timers, closures, unbounded caches, detached DOM nodes. Compare heap snapshots before and after an action.",
  ["Leaks are impossible because of garbage collection; slow pages come from CPU usage, which the Performance tab shows.",
   "Only `var` variables leak; switching everything to `let` and `const` removes every leak.",
   "Large arrays leak automatically after 100 MB; you find them by counting `new` calls in the source."],
  ex("The GC frees what is unreachable, so leaks are references you forgot: accidental globals, listeners never removed, timers never cleared, closures holding big objects, unbounded caches and Maps, detached DOM nodes. Find them with heap snapshots and allocation timelines (Chrome DevTools Memory tab, `node --inspect`), comparing snapshots before and after an action. Fix by removing listeners, using `WeakMap`/`WeakRef`, bounding caches and clearing timers.", r'''
const cache = new Map();              // leak: grows forever
function get(k) { if (!cache.has(k)) cache.set(k, big(k)); return cache.get(k); }
// fix: LRU / size limit, or WeakMap when keys are objects
'''), ["mdn-memory", "chrome-memory", "node-memory"]),
 ("What is the difference between debounce and throttle in JavaScript, and when do you use each?", [E], "medium",
  "Debounce runs once after calls stop for `ms` (search-as-you-type); throttle runs at most once per `ms` while calls continue (scroll).",
  ["Debounce runs at most once per interval while events continue; throttle waits for silence, then runs once.",
   "Both delay a function by a fixed time; debounce uses `setTimeout` and throttle uses `setInterval`.",
   "Debounce cancels the function entirely after the first call; throttle makes it run twice as often."],
  ex("Debounce waits until calls stop for `ms`, then runs once (search-as-you-type, end of resize). Throttle runs at most once per `ms` while calls continue (scroll, mouse move). Both use closures and timers.", r'''
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
  ["Bubbling sends an event to every element on the page at once; delegation copies a listener onto each child.",
   "Capturing stores events for later replay; delegation hands the event to a Web Worker for processing.",
   "Events fire only on the target; bubbling is an opt-in flag, and delegation means using `stopPropagation`."],
  ex("An event travels down from the root to the target (capture), fires on the target, then bubbles back up. Handlers run on bubble by default. Delegation attaches one listener on a parent and uses `event.target` (or `closest`) to handle many children, including ones added later. `stopPropagation` halts the travel; `preventDefault` cancels the browser default; they're different things.", r'''
list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (li && list.contains(li)) console.log("clicked", li.dataset.id);
});
'''), ["jsi-bubbling", "jsi-delegation", "mdn-bubbling"]),
 ("What is CORS, and when does the browser send a preflight request?", [E], "medium",
  "Server headers that opt in to cross-origin reads; non-simple requests (custom headers, JSON, `PUT`/`DELETE`) get an `OPTIONS` preflight.",
  ["A server-side firewall that blocks requests from other origins; every request gets a preflight.",
   "An authentication scheme: the preflight sends the user's credentials so the server can log them in.",
   "A browser cache policy; the preflight checks whether a cached response is still fresh."],
  ex("The same-origin policy blocks a page from reading responses from another origin. CORS lets the server opt in with headers (`Access-Control-Allow-Origin`, `-Methods`, `-Headers`, `-Credentials`). \"Non-simple\" requests (custom headers, a JSON content type, `PUT`/`DELETE`) trigger a preflight `OPTIONS` request first. CORS is enforced by the browser only, protects users, and isn't an authentication mechanism. Never reflect `*` together with credentials.", r'''
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
  ["XSS is stealing cookies over HTTP (fix with HTTPS); CSRF is SQL injection from forms (fix with prepared statements).",
   "Both are prevented by CORS, so a strict `Access-Control-Allow-Origin` header is enough for either.",
   "XSS abuses cookies (fix with `SameSite`); CSRF injects scripts into the page (fix with `textContent`)."],
  ex("XSS: attacker script runs in your page. Defend by escaping output, avoiding `innerHTML` with untrusted data (use `textContent`), sanitising HTML (DOMPurify) and a strict Content-Security-Policy. CSRF: a malicious site makes the browser send an authenticated request using cookies. Defend with `SameSite` cookies, CSRF tokens and checking `Origin`. Store session cookies as `HttpOnly; Secure`.", r'''
el.textContent = userInput;         // safe
// el.innerHTML = userInput;        // XSS risk
// Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax
'''), ["owasp-xss", "owasp-csrf", "mdn-csp"]),
 ("When do you use `localStorage`, `sessionStorage`, cookies and IndexedDB?", [E], "medium",
  "Web Storage for small strings (per origin or per tab), `HttpOnly` cookies for session ids, IndexedDB for large or offline data.",
  ["`localStorage` for auth tokens since scripts can't read it, cookies for large files, IndexedDB for UI preferences.",
   "They're interchangeable: all four are synchronous, unlimited in size and sent to the server automatically.",
   "Cookies for offline apps, `sessionStorage` for data shared across tabs, and IndexedDB only inside workers."],
  ex("`localStorage`: synchronous string key/values, persistent, per origin, about 5 MB, readable by any script (don't keep tokens there if XSS is a concern). `sessionStorage`: the same, but per tab session. Cookies: sent with every request, size-limited, can be `HttpOnly` (invisible to JS), so best for session ids. IndexedDB: asynchronous, structured, for large data and offline apps.", r'''
localStorage.setItem("theme", "dark");
JSON.parse(localStorage.getItem("prefs") ?? "{}");
'''), ["mdn-webstorage", "mdn-indexeddb", "jsi-localstorage", "jsi-cookie"]),
 ("How do you keep the browser UI responsive during heavy work?", [E], "hard",
  "Move computation to Web Workers, split long tasks, animate in `requestAnimationFrame`, and batch DOM reads before writes.",
  ["Wrap heavy loops in `async` functions, which run them on a background thread automatically.",
   "Use `setInterval` with a 0 ms delay, which gives the loop its own thread separate from rendering.",
   "Call `document.write` instead of DOM APIs, which skips layout and paint entirely."],
  ex("The main thread runs JS, style, layout and paint, so long tasks (over 50 ms) cause jank. Move heavy computation to Web Workers, split work into chunks (`requestIdleCallback`, `scheduler.yield`), do visual updates in `requestAnimationFrame`, batch DOM reads before writes to avoid layout thrashing, and prefer CSS transforms for animation.", r'''
const w = new Worker("worker.js");
w.postMessage(bigArray);
w.onmessage = (e) => render(e.data);

function tick() { el.style.transform = `translateX(${x++}px)`; requestAnimationFrame(tick); }
requestAnimationFrame(tick);
'''), ["mdn-workers", "webdev-long-tasks", "webdev-layout-thrashing"]),
 ("What does `\"use strict\"` change, and what does TypeScript add on top?", [E], "medium",
  "Strict mode turns silent errors into exceptions and makes plain-call `this` `undefined`; TypeScript adds build-time types but erases to JS.",
  ["Strict mode enables static types at runtime; TypeScript then removes them again for faster execution.",
   "Strict mode makes all objects immutable; TypeScript validates API responses at runtime automatically.",
   "Strict mode is required for `async` code; TypeScript replaces the JS engine with a typed one."],
  ex("Strict mode turns silent errors into exceptions (undeclared variables, duplicate parameters, assignments to read-only properties), sets `this` to `undefined` in plain calls, and is automatic in modules and classes. TypeScript adds static types, catching shape and null errors at build time and improving refactoring and editor support; it erases to plain JavaScript, so runtime rules still apply and external data still needs validation (for example with Zod).", r'''
"use strict";
// undeclaredVar = 1;   // ReferenceError
'''), ["mdn-strict", "ts-handbook", "effective-ts"]),
 ("Implementing `Promise.all` by hand is a common exercise. What must a correct version handle?", [E], "hard",
  "Results in input order, non-promise values, empty input resolving to `[]`, rejecting on the first failure, and counting completions.",
  ["Results in completion order, ignoring rejections, and resolving only when the array length stops changing.",
   "Awaiting each promise in a `for` loop, which keeps order and is just as fast as running them together.",
   "Only arrays of promises; non-promise values and empty input should throw a `TypeError`."],
  ex("It tests promises, ordering and edge cases: preserve input order (not completion order), accept non-promise values (wrap them with `Promise.resolve`), resolve `[]` for empty input, reject on the first rejection, and count completions rather than relying on array length.", r'''
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

# Longer distractors (still wrong) so the correct answer isn't simply the longest
# option. Keyed by 1-based question number -> (distractor index, new text).
LONGER = {
 3: (0, "`var` and `let` behave the same way in every scope; only `const` is block-scoped, and it also makes the object it points to fully immutable."),
 6: (2, "`undefined` is the intentional empty value developers set, while the engine itself uses `null` for missing properties and arguments, so `JSON.stringify` keeps both."),
 11: (0, "A function that copies the outer variables' values at the moment it's created; it saves memory, because nothing from the outer scope is kept alive afterwards."),
 12: (0, "`0 1 2`, because each arrow callback captures the current value of `i` at the moment `setTimeout` is called, not the variable."),
 13: (0, "By where the function is defined: `this` always refers to the object literal or class body the code appears in, no matter how it is called later."),
 14: (0, "`call` and `apply` create copies of a function with a new scope, and `bind` attaches a function to an object permanently by adding it as a method."),
 16: (0, "Each object copies all of its prototype's properties when it's created, so later changes to the prototype are never seen by existing objects."),
 17: (0, "Real classes like in Java or C#: every instance gets its own copy of each method, and there is no prototype involved anywhere in the lookup."),
 18: (2, "Creates an object with no prototype at all, then copies every property and method of the constructor function onto it."),
 22: (2, "Tasks always run before microtasks, which is why a `setTimeout(fn, 0)` callback beats the `.then` of an already-resolved promise every time."),
 24: (0, "Pending, running and done; `.then` mutates the original promise in place, so every handler in the chain sees the very first resolved value, unchanged."),
 26: (0, "Wrap the whole program in one top-level `try/catch`; `fetch` already rejects on any non-200 status, so no extra check of the response is needed."),
 27: (0, "`await` blocks the whole thread, so use callbacks instead; `forEach` does await each async callback in turn but is slower than a plain `for` loop."),
 29: (2, "No: it always waits exactly 4 ms, which is the fixed minimum resolution of every JavaScript timer in browsers and Node."),
 30: (2, "Throw inside a `.then` handler, which propagates back up the chain and cancels the underlying network request."),
 31: (0, "Ways to deep-clone objects and arrays safely; the main trap is that they're slow, so you should avoid them inside loops."),
 32: (1, "CommonJS supports tree shaking and top-level `await`, while ES modules are loaded synchronously like `require`, which is why bundlers prefer CommonJS."),
 33: (0, "`Map` and `Set` are slower aliases of objects and arrays kept only for older code, and the weak versions are deprecated in favour of `WeakRef`."),
 34: (0, "Iterators are arrays with an internal index property, and generators are functions that build and return a brand-new array of all values on every call."),
 35: (1, "`?.` catches any exception thrown by a getter along the chain, and `??` falls back for every falsy value exactly like `||` does, just with lower precedence."),
 36: (0, "Strings that are compiled once and cached by the engine for speed; a tag function marks which of those cached strings should be translated."),
 37: (1, "Use `forEach` for async work, since it awaits each callback before moving on; avoid `reduce`, because it mutates the original array as it folds."),
 38: (0, "`Proxy` forwards network requests through an intermediate server, and `Reflect` records the responses that come back so you can debug them later."),
 39: (1, "`Object.freeze` deep-freezes every nested object recursively, while `const` only freezes the top-level properties."),
 40: (0, "`for...in` loops over array values and `for...of` over object keys, so on arrays the two loops are fully interchangeable in practice."),
 41: (0, "Node runs each incoming request's JavaScript on its own OS thread, so CPU-heavy code in one handler never blocks the other requests being served."),
 42: (0, "Leaks are impossible thanks to garbage collection; a slow or bloated page comes from CPU usage, which the Performance tab shows you directly instead."),
 43: (0, "Debounce runs at most once per interval while events keep coming, and throttle waits for a quiet period with no calls, then runs exactly once."),
 44: (0, "Bubbling delivers an event to every element on the page at the same time, and delegation copies a single listener onto each child element."),
 45: (0, "A server-side firewall that blocks requests coming from other origins, which is why every single cross-origin request gets a preflight first."),
 46: (0, "XSS is stealing cookies over plain HTTP (fix it with HTTPS), and CSRF is SQL injection through forms (fix it with prepared statements)."),
 47: (0, "`localStorage` for auth tokens, since page scripts can't read it; cookies for large files; and IndexedDB for small UI preferences."),
 48: (0, "Wrap the heavy loops in `async` functions, which the engine then runs on a background thread automatically, away from rendering."),
 49: (0, "Strict mode enables static type checks at runtime, and TypeScript then strips them out again in the build so the code executes noticeably faster."),
 50: (0, "Results in completion order, ignoring any rejections, and resolving only once the input array's length stops changing between checks."),
}
for n, (wi, text) in LONGER.items():
    q = list(Q[n - 1])
    wrong = list(q[4])
    wrong[wi] = text
    q[4] = wrong
    Q[n - 1] = tuple(q)
build("JavaScript interview questions", M, Q, sys.argv[1], strip_backticks=False)
