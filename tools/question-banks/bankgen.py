"""Shared builder for question-bank seed files (apps/api/seeds/*.json).

Each question is written as (prompt, tags, difficulty, correct, [wrong x3],
explanation, material keys). The correct answer is shuffled into a position
with a fixed seed, and the build fails unless the correct letters are spread
evenly and the correct option is not routinely the longest one.
"""
import json
import random

from tag_map import CANONICAL, mapped

UNVERIFIED = " Link not verified by the study guide; if it doesn't open, search for its title."
ADDED = " Added as a standard reference; not from your notes."


def build(name, materials, questions, out_path, min_longest_share=0.18, max_longest_share=0.32,
          strip_backticks=True, canonical_tags=False):
    """canonical_tags=True for banks written with the current tag names: they are
    checked against tag_map.CANONICAL instead of being mapped from old names
    (some old names, like "Async & Concurrency", also exist as canonical ones)."""
    fix_tags = (lambda tags: tags) if canonical_tags else mapped
    mats = []
    for key, (typ, title, url, author, desc, unverified) in materials.items():
        assert typ in ("book", "video", "article", "link"), key
        mats.append({"key": key, "type": typ, "title": title, "url": url, "author": author,
                     "description": desc + (ADDED if unverified == "added" else UNVERIFIED if unverified else "")})
    urls = [m["url"] for m in mats]
    assert len(urls) == len(set(urls)), "duplicate material URL"

    used = set()
    for i, q in enumerate(questions, 1):
        prompt, tags, diff, correct, wrong, expl, keys = q
        assert len(wrong) == 3 and diff in ("easy", "medium", "hard") and tags, i
        assert correct not in wrong and len(set(wrong)) == 3, i
        assert keys, f"question {i} has no materials"
        if canonical_tags:
            unknown = [t for t in tags if t not in CANONICAL]
            assert not unknown, f"question {i}: unknown tags {unknown}; use one of {CANONICAL}"
        for k in keys:
            assert k in materials, (i, k)
            used.add(k)
    assert not set(materials) - used, f"unused materials: {set(materials) - used}"
    prompts = [q[0] for q in questions]
    assert len(prompts) == len(set(prompts)), "duplicate prompt"

    # Find a seed whose shuffle spreads the correct letter evenly (A-D).
    n = len(questions)
    for seed in range(1, 10_000):
        rng = random.Random(seed)
        orders = [rng.sample(range(4), 4) for _ in questions]
        spread = [sum(1 for o in orders if o.index(0) == k) for k in range(4)]
        if max(spread) - min(spread) <= 2:
            break

    out = []
    longest = 0
    for q, order in zip(questions, orders):
        prompt, tags, diff, correct, wrong, expl, keys = q
        pool = [correct] + list(wrong)
        options = [pool[j] for j in order]
        idx = order.index(0)
        if len(options[idx]) == max(len(o) for o in options):
            longest += 1
        out.append({"prompt": prompt, "tags": fix_tags(tags), "difficulty": diff, "options": options,
                    "correct": idx, "explanation": expl.replace("`", "") if strip_backticks else expl,
                    "materials": keys})

    share = longest / n
    flagged = [i for i, q in enumerate(questions, 1) if len(q[3]) >= max(len(w) for w in q[4])]
    print(f"{name}: {n} questions, {len(mats)} materials, correct letters A-D {spread}, "
          f"correct is longest in {longest}/{n} ({share:.0%})")
    # Near 25% (chance with four options) means length tells you nothing.
    if share > max_longest_share:
        raise SystemExit(f"too many questions where the correct option is longest: {flagged}")
    if share < min_longest_share:
        raise SystemExit(f"correct option is almost never longest ({share:.0%}); shorten some long distractors")
    with open(out_path, "w") as f:
        json.dump({"name": name, "materials": mats, "questions": out}, f, indent=2, ensure_ascii=False)
