#!/usr/bin/env node
// Checks stack detection against realistic repository shapes.
// Run: node detect.test.mjs

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const generator = join(dirname(fileURLToPath(import.meta.url)), "apply-profile.mjs");

const detectIn = (root) => {
  const out = execFileSync("node", [generator, "--detect"], { cwd: root, encoding: "utf8" });
  return JSON.parse(out).detected.sort();
};

const fixture = (files) => {
  const root = mkdtempSync(join(tmpdir(), "detect-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
};

const CASES = [
  {
    name: "single package at the root",
    files: { "package.json": JSON.stringify({ dependencies: { "@prisma/client": "^5" } }) },
    expect: ["prisma"],
  },
  {
    // The regression: a real monorepo keeps its manifests one level down. Reading only the
    // root found nothing and reported "nothing detected", which reads as "nothing to cover"
    // on a project that plainly has migrations.
    name: "monorepo with manifests one level down",
    files: {
      "package.json": JSON.stringify({ private: true, workspaces: ["backend", "frontend"] }),
      "backend/package.json": JSON.stringify({ dependencies: { "@prisma/client": "^5", "@nestjs/core": "^10" } }),
      "frontend/package.json": JSON.stringify({ dependencies: { next: "^14" } }),
    },
    expect: ["prisma"],
  },
  {
    name: "two stacks in one repo",
    files: {
      "api/package.json": JSON.stringify({ dependencies: { "drizzle-orm": "^0.30" } }),
      "worker/requirements.txt": "alembic==1.13\n",
      "worker/alembic.ini": "[alembic]\n",
    },
    expect: ["alembic", "drizzle"],
  },
  {
    name: "django by manage.py",
    files: { "manage.py": "#!/usr/bin/env python\n", "requirements.txt": "Django==5.0\n" },
    expect: ["django"],
  },
  {
    name: "rails by Gemfile",
    files: { "Gemfile": "gem 'rails'\n" },
    expect: ["rails"],
  },
  {
    // No false positives: a repo of markdown must not claim a stack, because a wrong
    // "detected" is worse than an empty one. It produces rules for a tool nobody uses
    // while leaving the real one uncovered.
    name: "documentation repo detects nothing",
    files: { "README.md": "# docs\n", "docs/guide.md": "prisma migrate is mentioned here\n" },
    expect: [],
  },
  {
    name: "ignores node_modules",
    files: {
      "package.json": JSON.stringify({ dependencies: {} }),
      "node_modules/some-pkg/package.json": JSON.stringify({ dependencies: { "@prisma/client": "^5" } }),
    },
    expect: [],
  },
];

let failed = 0;
for (const c of CASES) {
  const root = fixture(c.files);
  try {
    const got = detectIn(root);
    const want = [...c.expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      failed++;
      console.log(`FAIL ${c.name}\n  want ${JSON.stringify(want)}\n  got  ${JSON.stringify(got)}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(failed === 0
  ? `all ${CASES.length} detection cases pass`
  : `${failed} of ${CASES.length} detection cases failed`);
process.exit(failed === 0 ? 0 : 1);
