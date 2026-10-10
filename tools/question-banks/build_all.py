"""Regenerate every question bank in apps/api/seeds from its script in banks/.

    python3 tools/question-banks/build_all.py            # write the JSON files
    python3 tools/question-banks/build_all.py --check    # regenerate to a temp dir and
                                                          # fail if anything differs
    python3 tools/question-banks/build_all.py javascript # only banks whose name matches

Each banks/<name>.py takes the output path as its only argument.
"""
import filecmp
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SEEDS = os.path.normpath(os.path.join(HERE, "..", "..", "apps", "api", "seeds"))

# script in banks/ -> seed file in apps/api/seeds/
BANKS = {
    "dotnet_interview": "dotnet-interview.json",
    "dotnet_more": "dotnet-more.json",
    "design_architecture": "design-architecture.json",
    "ezcater_interview": "ezcater-interview.json",
    "ezcater_algo": "ezcater-algo.json",
    "javascript": "javascript.json",
    "practice_formats": "practice-formats.json",
    "dotnet_by_level": "dotnet-by-level.json",
    "javascript_by_level": "javascript-by-level.json",
}


def main(args):
    check = "--check" in args
    only = [a for a in args if not a.startswith("--")]
    out_dir = tempfile.mkdtemp() if check else SEEDS
    failed = []
    for script, seed in BANKS.items():
        if only and not any(o in script for o in only):
            continue
        out = os.path.join(out_dir, seed)
        res = subprocess.run([sys.executable, os.path.join(HERE, "banks", f"{script}.py"), out],
                             capture_output=True, text=True)
        if res.returncode != 0:
            print(f"✗ {script}: {res.stderr.strip() or res.stdout.strip()}")
            failed.append(script)
            continue
        if check:
            same = os.path.exists(os.path.join(SEEDS, seed)) and filecmp.cmp(
                out, os.path.join(SEEDS, seed), shallow=False)
            print(f"{'✓' if same else '✗'} {seed}: {'matches' if same else 'DIFFERS from'} the committed file")
            if not same:
                failed.append(script)
        else:
            print(f"✓ {seed}: {res.stdout.strip().splitlines()[-1] if res.stdout.strip() else 'written'}")
    if failed:
        sys.exit(f"{len(failed)} bank(s) failed: {', '.join(failed)}")


if __name__ == "__main__":
    main(sys.argv[1:])
