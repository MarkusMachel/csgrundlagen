import type { Question } from '@/features/questions/types';
import type { Locale } from '@/shared/types';

/**
 * Seed content is authored in English on the Question itself; per-locale
 * overrides live in `translations` and are merged by `localizeQuestion`.
 * EN is complete; pt-BR/de are stubbed for a few questions to demonstrate
 * the `content[locale]` lookup pattern (§5) — extending is adding entries here.
 */
export interface QuestionTranslation {
  prompt?: string;
  explanation?: string;
  optionLabels?: Record<string, string>;
}

export interface SeedQuestion {
  question: Question;
  translations?: Partial<Record<Locale, QuestionTranslation>>;
}

function mc(
  id: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  tags: string[],
  explanation: string,
  difficulty?: 'easy' | 'medium' | 'hard',
): Question {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return {
    id,
    type: 'multiple-choice',
    prompt,
    tags,
    difficulty,
    explanation,
    options: options.map((label, i) => ({ id: letters[i], label })),
    correctOptionId: letters[correctIndex],
  };
}

function tf(
  id: string,
  prompt: string,
  correctAnswer: boolean,
  tags: string[],
  explanation: string,
  difficulty?: 'easy' | 'medium' | 'hard',
): Question {
  return { id, type: 'true-false', prompt, tags, difficulty, explanation, correctAnswer };
}

export const seedQuestions: SeedQuestion[] = [
  {
    question: mc(
      'q1',
      'Which OSI layer is responsible for end-to-end reliable delivery of data?',
      ['Network layer', 'Transport layer', 'Session layer', 'Data link layer'],
      1,
      ['Networking', 'OSI Model'],
      'The transport layer (layer 4) provides end-to-end delivery. TCP adds reliability with acknowledgements and retransmission; the network layer only routes packets hop by hop.',
      'easy',
    ),
    translations: {
      de: {
        prompt:
          'Welche OSI-Schicht ist für die zuverlässige Ende-zu-Ende-Übertragung von Daten verantwortlich?',
        explanation:
          'Die Transportschicht (Schicht 4) stellt die Ende-zu-Ende-Übertragung sicher. TCP ergänzt Zuverlässigkeit durch Bestätigungen und Neuübertragung; die Vermittlungsschicht routet Pakete nur Hop für Hop.',
        optionLabels: {
          A: 'Vermittlungsschicht',
          B: 'Transportschicht',
          C: 'Sitzungsschicht',
          D: 'Sicherungsschicht',
        },
      },
      'pt-BR': {
        prompt: 'Qual camada OSI é responsável pela entrega confiável de dados de ponta a ponta?',
        explanation:
          'A camada de transporte (camada 4) fornece entrega de ponta a ponta. O TCP adiciona confiabilidade com confirmações e retransmissão; a camada de rede apenas roteia pacotes salto a salto.',
        optionLabels: {
          A: 'Camada de rede',
          B: 'Camada de transporte',
          C: 'Camada de sessão',
          D: 'Camada de enlace',
        },
      },
    },
  },
  {
    question: tf(
      'q2',
      'UDP guarantees that datagrams arrive in the order they were sent.',
      false,
      ['Networking'],
      'UDP is connectionless and provides no ordering, delivery, or duplicate-protection guarantees. Ordering is a TCP feature.',
      'easy',
    ),
    translations: {
      de: {
        prompt: 'UDP garantiert, dass Datagramme in der gesendeten Reihenfolge ankommen.',
        explanation:
          'UDP ist verbindungslos und bietet keine Garantien für Reihenfolge, Zustellung oder Duplikatschutz. Reihenfolgetreue ist ein Merkmal von TCP.',
      },
      'pt-BR': {
        prompt: 'O UDP garante que os datagramas cheguem na ordem em que foram enviados.',
        explanation:
          'O UDP é sem conexão e não oferece garantias de ordem, entrega ou proteção contra duplicatas. Ordenação é um recurso do TCP.',
      },
    },
  },
  {
    question: mc(
      'q3',
      'What does DNS primarily translate?',
      [
        'MAC addresses to IP addresses',
        'Domain names to IP addresses',
        'IP addresses to ports',
        'URLs to HTML',
      ],
      1,
      ['Networking'],
      'DNS resolves human-readable domain names (like example.com) to IP addresses. MAC↔IP translation is ARP; ports are chosen by applications.',
      'easy',
    ),
    translations: {
      de: {
        prompt: 'Was übersetzt DNS in erster Linie?',
        explanation:
          'DNS löst menschenlesbare Domainnamen (wie example.com) in IP-Adressen auf. MAC↔IP-Übersetzung ist ARP; Ports werden von Anwendungen gewählt.',
        optionLabels: {
          A: 'MAC-Adressen in IP-Adressen',
          B: 'Domainnamen in IP-Adressen',
          C: 'IP-Adressen in Ports',
          D: 'URLs in HTML',
        },
      },
      'pt-BR': {
        prompt: 'O que o DNS traduz principalmente?',
        explanation:
          'O DNS resolve nomes de domínio legíveis (como example.com) em endereços IP. A tradução MAC↔IP é feita pelo ARP; as portas são escolhidas pelas aplicações.',
        optionLabels: {
          A: 'Endereços MAC em endereços IP',
          B: 'Nomes de domínio em endereços IP',
          C: 'Endereços IP em portas',
          D: 'URLs em HTML',
        },
      },
    },
  },
  {
    question: mc(
      'q4',
      'Which protocol does the web use for secure (encrypted) page transfer?',
      ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
      2,
      ['Networking', 'Security'],
      'HTTPS is HTTP over TLS: the connection is encrypted and the server is authenticated with a certificate.',
      'easy',
    ),
  },
  {
    question: mc(
      'q5',
      'How many layers does the OSI reference model define?',
      ['4', '5', '6', '7'],
      3,
      ['OSI Model'],
      'The OSI model has 7 layers: physical, data link, network, transport, session, presentation, application.',
      'easy',
    ),
  },
  {
    question: tf(
      'q6',
      'A switch forwards frames based on MAC addresses, while a router forwards packets based on IP addresses.',
      true,
      ['Networking', 'Hardware'],
      'Switches operate at layer 2 and use MAC address tables; routers operate at layer 3 and use IP routing tables.',
      'medium',
    ),
  },
  {
    question: mc(
      'q7',
      'What is the default port for HTTPS?',
      ['80', '21', '443', '25'],
      2,
      ['Networking'],
      'HTTPS uses TCP port 443 by default; 80 is plain HTTP, 21 is FTP control, 25 is SMTP.',
      'easy',
    ),
  },
  {
    question: mc(
      'q8',
      'Which OSI layer do IP addresses belong to?',
      ['Layer 2 — Data link', 'Layer 3 — Network', 'Layer 4 — Transport', 'Layer 7 — Application'],
      1,
      ['OSI Model', 'Networking'],
      'IP is the canonical network-layer (layer 3) protocol; logical addressing and routing happen there.',
      'medium',
    ),
  },
  {
    question: tf(
      'q9',
      'ARP is used to discover the MAC address that corresponds to a known IP address on a local network.',
      true,
      ['Networking'],
      'ARP broadcasts "who has this IP?" on the local segment and the owner replies with its MAC address.',
      'medium',
    ),
  },
  {
    question: mc(
      'q10',
      'In the TCP three-way handshake, what is the correct sequence of segments?',
      ['SYN → ACK → SYN-ACK', 'SYN → SYN-ACK → ACK', 'ACK → SYN → FIN', 'SYN → FIN → ACK'],
      1,
      ['Networking'],
      'The client sends SYN, the server answers SYN-ACK, and the client completes the handshake with ACK.',
      'medium',
    ),
  },
  {
    question: mc(
      'q11',
      'What is the primary role of an operating system scheduler?',
      [
        'Allocating disk space to files',
        'Deciding which process runs on the CPU and when',
        'Translating virtual to physical addresses',
        'Managing user permissions',
      ],
      1,
      ['Operating Systems'],
      'The scheduler multiplexes the CPU among runnable processes/threads according to a scheduling policy.',
      'easy',
    ),
  },
  {
    question: tf(
      'q12',
      'A deadlock can only occur if processes hold resources while waiting for others (hold-and-wait).',
      true,
      ['Operating Systems'],
      'Hold-and-wait is one of the four Coffman conditions; all four (with mutual exclusion, no preemption, circular wait) must hold for deadlock.',
      'hard',
    ),
  },
  {
    question: mc(
      'q13',
      'What does virtual memory primarily provide?',
      [
        'Faster RAM access',
        'An abstraction giving each process its own address space, possibly larger than physical RAM',
        'Protection against viruses',
        'Automatic file backups',
      ],
      1,
      ['Operating Systems'],
      'Virtual memory decouples the addresses a process sees from physical memory, enabling isolation, swapping, and memory overcommit.',
      'medium',
    ),
  },
  {
    question: mc(
      'q14',
      'Which of these is NOT a typical process state?',
      ['Running', 'Ready', 'Blocked', 'Compiled'],
      3,
      ['Operating Systems'],
      'Processes cycle through states like new, ready, running, blocked/waiting, and terminated. "Compiled" is a build-time concept.',
      'easy',
    ),
  },
  {
    question: tf(
      'q15',
      'Threads of the same process share the same address space.',
      true,
      ['Operating Systems'],
      'Threads share code, heap, and open files of their process; each thread has its own stack and registers.',
      'medium',
    ),
  },
  {
    question: mc(
      'q16',
      'What is a context switch?',
      [
        'Changing the active window in a GUI',
        'Saving the state of one process/thread and restoring another to run on the CPU',
        'Switching between kernel modules',
        'Moving a page from RAM to disk',
      ],
      1,
      ['Operating Systems'],
      'On a context switch the kernel saves registers/program counter of the current task and loads those of the next runnable task.',
      'medium',
    ),
  },
  {
    question: mc(
      'q17',
      'Which component of a CPU performs arithmetic and logic operations?',
      ['Control unit', 'ALU', 'Register file', 'Cache'],
      1,
      ['Hardware'],
      'The arithmetic logic unit (ALU) executes operations like addition and comparison; the control unit sequences instructions.',
      'easy',
    ),
  },
  {
    question: tf(
      'q18',
      'SRAM is typically faster but more expensive per bit than DRAM.',
      true,
      ['Hardware'],
      'SRAM needs ~6 transistors per bit and is used for caches; DRAM is denser and cheaper, used for main memory.',
      'medium',
    ),
  },
  {
    question: mc(
      'q19',
      'What is the purpose of a CPU cache?',
      [
        'Store files permanently',
        'Bridge the speed gap between CPU and main memory by keeping frequently used data close',
        'Increase disk capacity',
        'Cool the processor',
      ],
      1,
      ['Hardware'],
      'Caches exploit temporal and spatial locality to serve most memory accesses at far lower latency than DRAM.',
      'easy',
    ),
  },
  {
    question: mc(
      'q20',
      'How many bits are in a byte?',
      ['4', '8', '16', '32'],
      1,
      ['Hardware'],
      'A byte is 8 bits by universal modern convention.',
      'easy',
    ),
  },
  {
    question: tf(
      'q21',
      'An SSD has moving mechanical parts like a spinning platter.',
      false,
      ['Hardware'],
      'Solid-state drives store data in flash memory with no moving parts; spinning platters are a hard disk (HDD) trait.',
      'easy',
    ),
  },
  {
    question: mc(
      'q22',
      'Which data structure operates on a Last-In-First-Out (LIFO) principle?',
      ['Queue', 'Stack', 'Linked list', 'Binary tree'],
      1,
      ['Data Structures'],
      'A stack pushes and pops at the same end, so the last element pushed is the first popped. A queue is FIFO.',
      'easy',
    ),
  },
  {
    question: mc(
      'q23',
      'What is the average-case time complexity of a hash table lookup?',
      ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      0,
      ['Data Structures', 'Algorithms'],
      'With a good hash function and load factor, lookups touch a constant number of slots on average; worst case degrades to O(n).',
      'medium',
    ),
  },
  {
    question: tf(
      'q24',
      'In a balanced binary search tree, search takes O(log n) time.',
      true,
      ['Data Structures', 'Algorithms'],
      'Balance bounds the height to O(log n), and search follows one root-to-leaf path.',
      'medium',
    ),
  },
  {
    question: mc(
      'q25',
      'Which traversal of a binary search tree visits keys in sorted order?',
      ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
      1,
      ['Data Structures'],
      'In-order traversal (left, node, right) of a BST yields keys in ascending order by the BST invariant.',
      'medium',
    ),
  },
  {
    question: mc(
      'q26',
      'What is the worst-case time complexity of quicksort?',
      ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
      2,
      ['Algorithms'],
      'With consistently bad pivots (e.g. already-sorted input and naive pivot choice) partitions are maximally unbalanced, giving O(n²). Average case is O(n log n).',
      'medium',
    ),
  },
  {
    question: tf(
      'q27',
      'Binary search requires the input collection to be sorted.',
      true,
      ['Algorithms'],
      'Binary search halves the range by comparing against the middle element, which is only meaningful on sorted data.',
      'easy',
    ),
  },
  {
    question: mc(
      'q28',
      'Which algorithm design technique does merge sort use?',
      ['Dynamic programming', 'Greedy', 'Divide and conquer', 'Backtracking'],
      2,
      ['Algorithms'],
      'Merge sort splits the array in half, recursively sorts both halves, and merges them — the classic divide-and-conquer pattern.',
      'easy',
    ),
  },
  {
    question: mc(
      'q29',
      'What does Big-O notation describe?',
      [
        'Exact running time in seconds',
        'An upper bound on how an algorithm’s cost grows with input size',
        'The memory address of a function',
        'Compiler optimization level',
      ],
      1,
      ['Algorithms'],
      'Big-O gives an asymptotic upper bound on growth rate, ignoring constant factors and lower-order terms.',
      'easy',
    ),
  },
  {
    question: mc(
      'q30',
      'In SQL, which statement retrieves rows from a table?',
      ['INSERT', 'SELECT', 'UPDATE', 'DELETE'],
      1,
      ['Databases'],
      'SELECT queries data; INSERT adds rows, UPDATE modifies them, DELETE removes them.',
      'easy',
    ),
  },
  {
    question: tf(
      'q31',
      'A primary key may contain NULL values.',
      false,
      ['Databases'],
      'A primary key must be unique and non-null so every row is unambiguously identifiable.',
      'easy',
    ),
  },
  {
    question: mc(
      'q32',
      'What does the "A" in ACID stand for?',
      ['Availability', 'Atomicity', 'Authorization', 'Aggregation'],
      1,
      ['Databases'],
      'ACID = Atomicity, Consistency, Isolation, Durability. Atomicity means a transaction happens entirely or not at all.',
      'medium',
    ),
  },
  {
    question: mc(
      'q33',
      'Which of the following is an asymmetric encryption algorithm?',
      ['AES', 'RSA', 'SHA-256', 'ChaCha20'],
      1,
      ['Security'],
      'RSA uses a public/private key pair. AES and ChaCha20 are symmetric ciphers; SHA-256 is a hash function, not encryption.',
      'medium',
    ),
  },
  {
    question: tf(
      'q34',
      'Hashing a password and encrypting it are the same operation.',
      false,
      ['Security'],
      'Hashing is one-way and used for verification; encryption is reversible with the key. Passwords should be hashed (with salt), not encrypted.',
      'medium',
    ),
  },
  {
    question: mc(
      'q35',
      'What kind of attack floods a service with traffic to make it unavailable?',
      ['Phishing', 'SQL injection', 'Denial of Service', 'Man-in-the-middle'],
      2,
      ['Security', 'Networking'],
      'A (D)DoS attack exhausts bandwidth or server resources so legitimate users cannot be served.',
      'easy',
    ),
  },
  {
    question: mc(
      'q36',
      'Which pair correctly matches an OSI layer to a protocol?',
      ['Layer 7 — Ethernet', 'Layer 4 — TCP', 'Layer 3 — HTTP', 'Layer 2 — IP', 'Layer 1 — DNS'],
      1,
      ['OSI Model', 'Networking'],
      'TCP is a transport (layer 4) protocol. Ethernet is layer 2, IP layer 3, HTTP and DNS layer 7.',
      'hard',
    ),
  },
  // One of each newer question type, so dev (mock) mode shows them all.
  {
    question: {
      id: 'q-ms1',
      type: 'multi-select',
      prompt: 'Which of these JavaScript values are falsy?',
      tags: ['JavaScript'],
      difficulty: 'easy',
      explanation:
        'The falsy values are `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` and `NaN`. `[]` and `"0"` are truthy.',
      options: [
        { id: 'A', label: '`0`' },
        { id: 'B', label: '`[]`' },
        { id: 'C', label: '`""`' },
        { id: 'D', label: '`"0"`' },
        { id: 'E', label: '`NaN`' },
      ],
      correctOptionIds: ['A', 'C', 'E'],
    },
  },
  {
    question: {
      id: 'q-ord1',
      type: 'ordering',
      prompt: 'Put the TCP connection setup in order.',
      tags: ['Networking'],
      difficulty: 'medium',
      explanation:
        'The three-way handshake: the client sends SYN, the server answers SYN-ACK, the client confirms with ACK, and only then does data flow.',
      options: [
        { id: 'A', label: 'Client sends SYN' },
        { id: 'B', label: 'Server replies SYN-ACK' },
        { id: 'C', label: 'Client sends ACK' },
        { id: 'D', label: 'Data is exchanged' },
      ],
      correctOrder: ['A', 'B', 'C', 'D'],
    },
  },
  {
    question: {
      id: 'q-out1',
      type: 'output',
      prompt: 'What does this print?',
      tags: ['JavaScript'],
      difficulty: 'medium',
      explanation:
        'Synchronous code runs first (A, B). Then the microtask queue drains (promise), and only then the next task, the timer (timeout).',
      code: 'console.log("A");\nsetTimeout(() => console.log("timeout"), 0);\nPromise.resolve().then(() => console.log("promise"));\nconsole.log("B");',
      codeLanguage: 'js',
      expectedOutput: 'A\nB\npromise\ntimeout\n',
    },
  },
];

export function localizeQuestion(seed: SeedQuestion, locale: Locale): Question {
  const t = seed.translations?.[locale];
  const base = seed.question;
  if (!t) return base;
  if (base.type === 'multiple-choice' || base.type === 'multi-select' || base.type === 'ordering') {
    return {
      ...base,
      prompt: t.prompt ?? base.prompt,
      explanation: t.explanation ?? base.explanation,
      options: base.options.map((o) => ({ ...o, label: t.optionLabels?.[o.id] ?? o.label })),
    };
  }
  return {
    ...base,
    prompt: t.prompt ?? base.prompt,
    explanation: t.explanation ?? base.explanation,
  };
}

export const allTags = [...new Set(seedQuestions.flatMap((s) => s.question.tags))].sort();
