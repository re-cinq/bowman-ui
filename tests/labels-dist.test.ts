import { spawnSync } from "node:child_process";

it("tsc accepts labels-type-assertions.tsx against dist via the '.' exports entry", () => {
  const result = spawnSync(
    "node",
    [
      "node_modules/typescript7/bin/tsc",
      "--ignoreConfig",
      "--noEmit",
      "--strict",
      "--target",
      "es2022",
      "--module",
      "nodenext",
      "--moduleResolution",
      "nodenext",
      "--skipLibCheck",
      "--jsx",
      "react-jsx",
      "tests/types/labels-type-assertions.tsx",
    ],
    { cwd: process.cwd(), encoding: "utf8" }
  );

  expect(result).toMatchObject({ status: 0, stderr: "" });
});
