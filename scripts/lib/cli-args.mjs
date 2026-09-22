import process from "node:process";

// Bare split for a script with its own flag rule (check-at-pass.mjs wants exactly one flag).
export const splitArgs = (argv) => ({
  flags: argv.filter((arg) => arg.startsWith("--")),
  positional: argv.filter((arg) => !arg.startsWith("--")),
});

// A flag outside `allowed` prints the usage to stderr and exits 2 before any work starts.
export const parseFlags = (argv, allowed, usage) => {
  const parsed = splitArgs(argv);

  if (parsed.flags.some((flag) => !allowed.includes(flag))) {
    process.stderr.write(`${usage}\n`);
    process.exit(2);
  }

  return parsed;
};

// process.exitCode, not process.exit: exiting truncates a large stdout write to a pipe.
// `lines` is a thunk so --json never builds the text report.
export const emitReport = ({ asJson, findings, lines, exitCode }) => {
  process.exitCode = exitCode;
  process.stdout.write(
    asJson ? `${JSON.stringify(findings, null, 2)}\n` : `${lines().join("\n")}\n`
  );
};
