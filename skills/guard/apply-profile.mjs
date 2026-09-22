#!/usr/bin/env node
// Writes safety rules into a settings.json, in two layers.
//
//   baseline  commands that are wrong in every project, whatever the stack.
//             Safe to apply before anything about the project is known.
//   stack     migration and schema commands for the stack this project actually uses.
//             Only applied once the stack is known, because rules for a stack the
//             project does not use are not protection, they are decoration, and they
//             leave the real tool uncovered while looking like they covered it.
//
// Usage:
//   node apply-profile.mjs --layer baseline --profile strict [--commits deny] [--scope project]
//   node apply-profile.mjs --layer stack --stacks prisma,django [--profile strict]
//   node apply-profile.mjs --detect                     print what the repo looks like, write nothing
//   node apply-profile.mjs --remove [--scope project]   take every rule back out
//   ... add --dry to any of the above to preview.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const layer = opt("layer", "baseline");
const profile = opt("profile", "strict");
const commits = opt("commits", "deny");
const scope = opt("scope", "project");
const stacks = (opt("stacks", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const dry = has("dry");

const forms = (cmd) => [`Bash(${cmd})`, `Bash(${cmd}:*)`, `Bash(${cmd} *)`];
const expand = (list) => list.flatMap(forms);

// ============================================================ baseline layer

// Wrong in every project. No stack knowledge needed.
const GIT_DESTRUCTIVE = [
  "git push", "git push --force", "git push -f",
  "git reset", "git restore", "git clean",
  "git rebase", "git cherry-pick", "git revert",
  "git commit --amend", "git filter-branch", "git update-ref",
  "git reflog expire", "git gc --prune", "git prune",
  "git branch -D", "git branch -d", "git tag -d",
  "git remote remove", "git remote set-url",
  "git submodule deinit", "git worktree remove",
  // only the destructive stash and checkout forms; `git stash list`,
  // `git checkout -b` and `git switch` stay usable
  "git stash drop", "git stash clear", "git stash pop", "git stash apply",
  "git stash push", "git stash save",
  "git checkout --", "git checkout .", "git checkout -f",
  "git checkout --force", "git checkout HEAD",
  // bypassing the hooks defeats the tooling the project set up
  "git commit --no-verify", "git push --no-verify",
];

const GH_DESTRUCTIVE = [
  "gh pr merge", "gh pr close", "gh repo delete",
  "gh release create", "gh release delete",
  "gh api -X DELETE", "gh api --method DELETE",
  "gh secret set", "gh workflow run",
];

const SYSTEM_DESTRUCTIVE = [
  "sudo", "rm -rf", "rm -fr", "rm -r", "rm -f",
  "chmod -R 777", "chown -R",
  "killall", "pkill",
];

const PUBLISH = [
  "npm publish", "pnpm publish", "yarn publish", "bun publish",
  "cargo publish", "twine upload", "gem push", "mvn deploy",
];

// Deploying something half finished is its own category of bad day.
const DEPLOY = [
  "vercel --prod", "vercel deploy --prod", "netlify deploy --prod",
  "fly deploy", "railway up", "render deploy",
  "wrangler publish", "wrangler deploy", "sst deploy", "serverless deploy",
  "eb deploy", "gcloud app deploy", "gcloud run deploy",
  "terraform apply", "terraform destroy",
  "kubectl apply", "kubectl delete", "helm upgrade", "helm uninstall",
  "aws s3 sync", "aws cloudformation deploy",
];

const INFRA = [
  "docker compose down -v", "docker-compose down -v",
  "docker volume rm", "docker volume prune", "docker system prune",
  "dropdb", "createdb", "pg_restore",
  "mysqladmin drop", "redis-cli FLUSHALL", "redis-cli FLUSHDB",
];

const COMMIT_RULES = ["git commit", "git add"];

// Piping a downloaded script into a shell runs code nobody read.
const REMOTE_EXEC = [
  "curl * | bash", "curl * | sh", "curl * | zsh",
  "wget * | bash", "wget * | sh",
];

// The agent must not be able to widen its own permissions, or stage secrets.
const SELF_AND_SECRETS = [
  "Edit(.claude/settings.json)",
  "Edit(.claude/settings.local.json)",
  "Edit(.claude/stop-guessing.json)",
  ...forms("git add .env"),
  ...forms("git add .env.local"),
  ...forms("git add .env.production"),
];

// ============================================================== stack layer

// Keyed by stack id. Each entry: how to recognise it, and what to block.
// Adding a stack means adding one entry here and nothing else.
const STACKS = {
  prisma: {
    label: "Prisma",
    detect: (f, pkg) => /prisma/.test(pkg) || f.includes("prisma"),
    commands: ["prisma migrate", "prisma db push", "prisma db execute",
               "prisma db seed", "prisma db pull"],
    runners: "js",
  },
  drizzle: {
    label: "Drizzle",
    detect: (f, pkg) => /drizzle/.test(pkg),
    commands: ["drizzle-kit push", "drizzle-kit drop", "drizzle-kit migrate"],
    runners: "js",
  },
  typeorm: {
    label: "TypeORM",
    detect: (f, pkg) => /typeorm/.test(pkg),
    commands: ["typeorm migration:run", "typeorm migration:revert", "typeorm schema:drop",
               "typeorm schema:sync"],
    runners: "js",
  },
  knex: {
    label: "Knex",
    detect: (f, pkg) => /\bknex\b/.test(pkg),
    commands: ["knex migrate:latest", "knex migrate:rollback", "knex migrate:down",
               "knex seed:run"],
    runners: "js",
  },
  sequelize: {
    label: "Sequelize",
    detect: (f, pkg) => /sequelize/.test(pkg),
    commands: ["sequelize db:migrate", "sequelize db:migrate:undo", "sequelize db:seed",
               "sequelize db:drop"],
    runners: "js",
  },
  mikroorm: {
    label: "MikroORM",
    detect: (f, pkg) => /mikro-orm/.test(pkg),
    commands: ["mikro-orm migration:up", "mikro-orm migration:down", "mikro-orm schema:drop"],
    runners: "js",
  },
  django: {
    label: "Django",
    detect: (f) => f.includes("manage.py"),
    commands: ["manage.py migrate", "manage.py flush", "manage.py sqlflush",
               "manage.py loaddata", "manage.py dbshell",
               "python manage.py migrate", "python manage.py flush",
               "python3 manage.py migrate", "python3 manage.py flush",
               "./manage.py migrate", "./manage.py flush"],
    runners: "none",
  },
  alembic: {
    label: "Alembic",
    detect: (f) => f.includes("alembic.ini"),
    commands: ["alembic upgrade", "alembic downgrade", "alembic stamp"],
    runners: "none",
  },
  rails: {
    label: "Rails",
    detect: (f) => f.includes("Gemfile") || f.includes("config.ru"),
    commands: ["rails db:migrate", "rails db:rollback", "rails db:reset", "rails db:drop",
               "rails db:schema:load", "rails db:seed",
               "rake db:migrate", "rake db:rollback", "rake db:reset", "rake db:drop",
               "rake db:schema:load", "rake db:seed",
               "bin/rails db:migrate", "bin/rails db:reset", "bin/rails db:drop"],
    runners: "none",
  },
  laravel: {
    label: "Laravel",
    detect: (f) => f.includes("artisan"),
    commands: ["php artisan migrate", "php artisan migrate:fresh", "php artisan migrate:refresh",
               "php artisan migrate:rollback", "php artisan migrate:reset",
               "php artisan db:wipe", "php artisan db:seed"],
    runners: "none",
  },
  goose: {
    label: "goose / golang-migrate / atlas",
    detect: (f) => f.includes("go.mod"),
    commands: ["goose up", "goose down", "goose reset",
               "migrate -path", "migrate -database",
               "atlas schema apply", "atlas migrate apply"],
    runners: "none",
  },
  flyway: {
    label: "Flyway / Liquibase",
    detect: (f) => f.includes("pom.xml") || f.includes("build.gradle"),
    commands: ["flyway migrate", "flyway clean", "flyway undo",
               "liquibase update", "liquibase rollback", "liquibase dropAll",
               "mvn flyway:migrate", "mvn flyway:clean",
               "./gradlew flywayMigrate", "gradle flywayMigrate"],
    runners: "none",
  },
  efcore: {
    label: "EF Core",
    detect: (f) => f.some?.((x) => x.endsWith(".csproj")) || f.includes("csproj"),
    commands: ["dotnet ef database update", "dotnet ef database drop",
               "dotnet ef migrations remove"],
    runners: "none",
  },
};

const JS_RUNNERS = ["", "npx ", "pnpm ", "pnpm exec ", "yarn ", "bunx ", "npm exec "];

const stackRules = (ids) => {
  const out = [];
  for (const id of ids) {
    const s = STACKS[id];
    if (!s) continue;
    const runners = s.runners === "js" ? JS_RUNNERS : [""];
    for (const r of runners) for (const c of s.commands) out.push(r + c);
  }
  // package scripts usually wrap whichever of the above the project uses
  const PMS = ["npm run", "pnpm run", "yarn", "pnpm", "bun run", "make"];
  const NAMES = ["migrate", "migration", "db:push", "db:migrate", "db:reset",
                 "db:seed", "db:drop", "seed", "schema:sync", "reset-db"];
  for (const pm of PMS) for (const n of NAMES) out.push(`${pm} ${n}`);
  return expand(out);
};

// ================================================================== detection

const MANIFESTS = ["package.json", "requirements.txt", "pyproject.toml", "Gemfile",
                   "composer.json", "go.mod", "pom.xml", "build.gradle", "manage.py",
                   "artisan", "alembic.ini"];

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "vendor", "target",
                           "__pycache__", ".next", ".venv", "coverage", ".turbo", ".cache"]);

// A monorepo keeps its manifests in subdirectories, not at the root. Looking only at the
// root finds nothing and reports "nothing detected", which reads as "nothing to cover" on
// a project that plainly has migrations. So walk down a couple of levels.
const collect = (dir, depth, files, manifests) => {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (depth > 0 && !SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
        collect(join(dir, entry.name), depth - 1, files, manifests);
      }
      continue;
    }
    files.push(entry.name);
    if (MANIFESTS.includes(entry.name) || entry.name.endsWith(".csproj")) {
      try { manifests.push(readFileSync(join(dir, entry.name), "utf8")); } catch { /* skip */ }
    }
  }
};

const detect = () => {
  const files = [];
  const manifestTexts = [];
  collect(process.cwd(), 2, files, manifestTexts);
  const pkg = manifestTexts.join("\n");
  const found = [];
  for (const [id, s] of Object.entries(STACKS)) {
    try { if (s.detect(files, pkg)) found.push(id); } catch { /* skip */ }
  }
  return { files, found };
};

if (has("detect")) {
  const { found } = detect();
  console.log(JSON.stringify({
    detected: found,
    labels: found.map((id) => STACKS[id].label),
    note: "Detection is a hint. Confirm with the engineer. If the project uses a migration tool not in this list, say so: that tool is not covered.",
  }, null, 2));
  process.exit(0);
}

// ============================================================ the DB gate hook

// The gate is deliberately stack independent: it acts only when it actually sees a
// database client in the command, so shipping it before the stack is known cannot
// create false confidence.
//
// `|| true` is load bearing. A hook that cannot run must not block the session: if node
// is missing, the path is wrong, or the script throws, the command still exits 0 with no
// output, which the harness reads as "allow". The gate then protects nothing, which is
// bad, but it is recoverable. A gate that fails closed blocks every command in the
// session and the agent cannot fix it, because it may not edit permission files.
// Fail open, loudly at install time, never silently at run time.
const gateHook = (gatePath) => ({
  matcher: "Bash",
  hooks: [{
    type: "command",
    command: `node ${gatePath} 2>/dev/null || true`,
    timeout: 10,
    statusMessage: "Checking database access",
  }],
});

// Refuse to install a hook that cannot run. Better to say so now than to install
// something that silently allows everything.
const nodeWorks = () => {
  try {
    execFileSync(process.execPath, ["-e", "process.exit(0)"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

// ==================================================================== writing

const settingsPath = scope === "user"
  ? join(homedir(), ".claude", "settings.json")
  : join(process.cwd(), ".claude", "settings.json");

// A preview must not touch the filesystem, not even to create a directory.
if (!dry) mkdirSync(dirname(settingsPath), { recursive: true });
let settings = {};
if (existsSync(settingsPath)) {
  settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  if (!dry) copyFileSync(settingsPath, `${settingsPath}.bak-${Date.now()}`);
}
const perms = (settings.permissions ??= {});

// -------------------------------------------------------------------- remove

if (has("remove")) {
  const everything = new Set([
    ...expand([...GIT_DESTRUCTIVE, ...GH_DESTRUCTIVE, ...SYSTEM_DESTRUCTIVE,
               ...PUBLISH, ...DEPLOY, ...INFRA, ...REMOTE_EXEC, ...COMMIT_RULES]),
    ...SELF_AND_SECRETS,
    ...stackRules(Object.keys(STACKS)),
  ]);
  const before = (perms.deny?.length ?? 0) + (perms.ask?.length ?? 0);
  perms.deny = (perms.deny ?? []).filter((r) => !everything.has(r));
  perms.ask = (perms.ask ?? []).filter((r) => !everything.has(r));
  const pre = settings.hooks?.PreToolUse ?? [];
  settings.hooks && (settings.hooks.PreToolUse = pre.filter(
    (e) => !JSON.stringify(e).includes("db-gate.mjs")));
  const after = perms.deny.length + perms.ask.length;
  if (dry) console.log(JSON.stringify({ settingsPath, wouldRemove: before - after }, null, 2));
  else {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`removed ${before - after} rules and the database gate from ${settingsPath}`);
    console.log("previous settings backed up alongside the file");
  }
  process.exit(0);
}

// --------------------------------------------------------------------- apply

const deny = [];
const ask = [];
let gate = false;

if (layer === "baseline" || layer === "all") {
  if (profile !== "open") {
    deny.push(...expand([...GIT_DESTRUCTIVE, ...GH_DESTRUCTIVE, ...SYSTEM_DESTRUCTIVE,
                         ...PUBLISH, ...DEPLOY, ...INFRA, ...REMOTE_EXEC]));
    deny.push(...SELF_AND_SECRETS);
    if (commits === "deny") deny.push(...expand(COMMIT_RULES));
    gate = true;
  }
}

if (layer === "stack" || layer === "all") {
  if (stacks.length === 0 && layer === "stack") {
    console.error("no --stacks given. Run with --detect first, confirm with the engineer,");
    console.error("then pass the confirmed list, e.g. --stacks prisma,django");
    process.exit(1);
  }
  const rules = stackRules(stacks);
  if (profile === "balanced") ask.push(...rules);
  else if (profile !== "open") deny.push(...rules);
}

const merge = (key, incoming) => {
  const current = (perms[key] ??= []);
  const seen = new Set(current);
  let added = 0;
  for (const rule of incoming) if (!seen.has(rule)) { current.push(rule); seen.add(rule); added++; }
  return added;
};

const addedDeny = merge("deny", deny);
const addedAsk = merge("ask", ask);

let addedGate = 0;
let gateWarning = null;
if (gate) {
  const gatePath = join(here, "db-gate.mjs");
  if (!existsSync(gatePath)) {
    gateWarning = `db-gate.mjs not found at ${gatePath}. The database gate was NOT installed, so database writes are not checked.`;
  } else if (!nodeWorks()) {
    gateWarning = "node could not be run, so the database gate was NOT installed. Database writes are not checked. Install node and re-run /guard.";
  } else {
    const hooks = (settings.hooks ??= {});
    const pre = (hooks.PreToolUse ??= []);
    if (!JSON.stringify(pre).includes("db-gate.mjs")) { pre.push(gateHook(gatePath)); addedGate = 1; }
  }
}

const covered = stacks.map((id) => STACKS[id]?.label ?? id);

if (dry) {
  console.log(JSON.stringify({ settingsPath, layer, profile, addedDeny, addedAsk, addedGate, covered, gateWarning }, null, 2));
} else {
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`layer "${layer}" (profile "${profile}") written to ${settingsPath}`);
  console.log(`  deny rules added: ${addedDeny}`);
  console.log(`  ask rules added:  ${addedAsk}`);
  if (addedGate) console.log("  read only database gate: installed");
  if (gateWarning) console.log(`  WARNING: ${gateWarning}`);
  if (layer === "stack" || layer === "all") {
    console.log(`  migration tools covered: ${covered.length ? covered.join(", ") : "none"}`);
  }
  console.log("  previous settings backed up alongside the file");
}
