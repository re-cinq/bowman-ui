// Runs the Vitest suite (or a slice of it) with the Jest-compatible JSON
// reporter written to a temp file and hands the parsed report back. Shared by
// the two Lore test-command scripts. Builds first: tests/public-api.test.ts
// reads dist/ at collection time, so in a clean checkout its tests would
// silently vanish from a listing without this. A failing test still produces
// a full report, so a non-zero vitest exit is reported as `failed`, not
// thrown - a missing report file is the real failure. The caller picks what
// vitest's stdout does (`ignore` keeps the caller's own stdout pure, and a
// file descriptor such as 2 sends vitest's chatter to stderr instead).
//
// The build is guarded, because lore-code-trace runs the manifest's `run`
// command over four files at a time (runConcurrency = 4): `npm run build`
// opens with a load-bearing `rm -rf dist`, so four unguarded builds delete
// dist from under each other's *-dist tests and every one of them fails. One
// invocation builds while the others wait on the lock, then they skip the
// build because dist is already newer than every source it is built from.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

// A cold build of this package measures 0.28s, so a wait this long means the
// holder died rather than that it is slow. It also has to stay well under
// lore-code-trace's own per-command timeout (LORE_TRACE_TIMEOUT_MS, 120s by
// default): a waiter that outlives that is SIGKILLed and recorded as a file
// that failed with no coverage, which is worse than building unguarded.
const lockDeadlineMs = 60_000;
const lockPollMs = 100;

// Per-project, so the test fixture's throwaway build cannot block the repo's.
const lockPath = () =>
  join(
    tmpdir(),
    `bowman-ui-build-${createHash("sha256").update(process.cwd()).digest("hex").slice(0, 16)}.lock`
  );

// Every caller of this module is a synchronous script, so the wait is too.
const sleepSync = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const mtimeOf = (path) => {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
};

// The newest mtime among the inputs a build reads. Missing inputs count as 0:
// the fixture project has no src/, and a clean checkout has no dist/ either,
// so both fall through to building.
const newestInputMtime = () => {
  let newest = Math.max(mtimeOf("package.json"), mtimeOf("tsconfig.json"));

  try {
    for (const entry of readdirSync("src", { recursive: true, withFileTypes: true })) {
      if (entry.isFile()) {
        newest = Math.max(newest, mtimeOf(join(entry.parentPath ?? entry.path, entry.name)));
      }
    }
  } catch {
    return newest;
  }

  return newest;
};

// The build is `rm -rf dist && tsc && cp src/styles.css dist/styles.css`, so the
// stylesheet is its LAST artifact: present and newer than every input, it proves
// the whole build ran. Both are checked because tsconfig sets no noEmitOnError -
// a failing tsc still writes dist/index.js, and index.js alone must never read as
// a finished build, or a half-built dist turns sticky and every later invocation
// skips the repair instead of making it.
const distArtifacts = ["index.js", "styles.css"];

const distIsCurrent = () => {
  const newest = newestInputMtime();

  return distArtifacts.every((name) => {
    const built = mtimeOf(join("dist", name));

    return built > 0 && built >= newest;
  });
};

// Atomic mkdir as the mutex: it either creates the directory or throws EEXIST,
// with no read-then-write window for a sibling to slip through. Only EEXIST is
// a held lock - EACCES or ENOSPC must surface rather than be retried until the
// deadline. A held lock is never stolen: a steal can take a live holder's lock,
// and that holder's own release then deletes the thief's.
const acquireLock = (lock) => {
  const deadline = Date.now() + lockDeadlineMs;

  for (;;) {
    try {
      mkdirSync(lock);

      return true;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }

      // Waiting out an orphaned lock costs one build; the caller builds anyway.
      if (Date.now() > deadline) {
        return false;
      }
      sleepSync(lockPollMs);
    }
  }
};

const enforceLock = (held, lock) => {
  if (held) {
    return;
  }

  throw new Error(
    `could not take the build lock within ${lockDeadlineMs}ms and dist is still ` +
      `incomplete - run \`npm run build\` first, or remove a stale ${lock}`
  );
};

const buildOnce = () => {
  if (distIsCurrent()) {
    return;
  }

  const lock = lockPath();
  const held = acquireLock(lock);

  try {
    // The holder may have built it while this process waited.
    if (distIsCurrent()) {
      return;
    }

    // Failing to take the lock must not end in the dangerous branch: an
    // unguarded `rm -rf dist` here would land under whatever the holder is
    // doing. Say so instead and let the caller build once, up front.
    enforceLock(held, lock);

    execFileSync("npm", ["run", "build"], {
      cwd: process.cwd(),
      stdio: ["ignore", "ignore", "inherit"],
    });
  } finally {
    if (held) {
      rmSync(lock, { recursive: true, force: true });
    }
  }
};

export const collectVitestReport = (vitestArgs, stdout) => {
  const reportFile = join(tmpdir(), `bowman-ui-vitest-${process.pid}.json`);

  buildOnce();

  let failed = false;

  try {
    execFileSync(
      "npx",
      ["vitest", "run", ...vitestArgs, "--reporter=json", `--outputFile=${reportFile}`],
      { cwd: process.cwd(), stdio: ["ignore", stdout, "inherit"] }
    );
  } catch {
    failed = true;
  }

  const report = JSON.parse(readFileSync(reportFile, "utf8"));

  rmSync(reportFile, { force: true });

  return { report, failed };
};

// One syscall, and no window between the check and the read. Only a missing
// file means "nothing to report": EACCES or EISDIR must surface rather than be
// mistaken for a run that produced no coverage.
export const readIfPresent = (path) => {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
};
