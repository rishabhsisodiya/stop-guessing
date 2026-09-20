#!/usr/bin/env node
// Checks the read only database gate lets normal work through and stops writes.
// Run: node db-gate.test.mjs

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const gate = join(dirname(fileURLToPath(import.meta.url)), "db-gate.mjs");

const run = (command) => {
  const out = execFileSync("node", [gate], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }),
    encoding: "utf8",
  });
  return out.trim() === "" ? "allow" : "deny";
};

// The first group is the regression that started this: ordinary work must pass.
const MUST_ALLOW = [
  "cat > file.mjs <<'EOF'\nhello\nEOF",
  "chmod +x ./script.mjs",
  "npm run build",
  "git status --short",
  "rm -f /tmp/scratch.txt",
  "echo '{\"a\":1}' | node script.mjs",
  "grep -rn 'mysql' src/",
  "cat src/db/mongo-client.ts",
  "psql -c 'SELECT id, email FROM users LIMIT 10'",
  "psql -c '\\dt'",
  "mysql -e 'SHOW TABLES;'",
  "mysql -e 'DESCRIBE users;'",
  "mongosh --eval 'db.users.find({}).limit(5)'",
  "mongosh --eval 'db.orders.countDocuments({})'",
  "psql -c 'EXPLAIN ANALYZE SELECT 1'",
];

const MUST_DENY = [
  "psql -c 'DELETE FROM users WHERE id = 1'",
  "psql -c \"UPDATE orders SET status='paid'\"",
  "psql -c 'DROP TABLE users'",
  "psql -c 'TRUNCATE sessions'",
  "psql -c 'ALTER TABLE users ADD COLUMN x int'",
  "mysql -e \"INSERT INTO users (email) VALUES ('a@b.c')\"",
  "mysql mydb < dump.sql",
  "psql -f migration.sql",
  "mongosh --eval 'db.users.deleteMany({})'",
  "mongosh --eval 'db.users.updateOne({}, {$set:{a:1}})'",
  "mongosh --eval 'db.users.drop()'",
  "redis-cli FLUSHALL",
  "sqlite3 app.db 'DROP TABLE cache'",
];

let failed = 0;
const check = (command, want) => {
  const got = run(command);
  if (got !== want) {
    failed++;
    console.log(`FAIL want ${want}, got ${got}  ::  ${command.split("\n")[0]}`);
  }
};

for (const c of MUST_ALLOW) check(c, "allow");
for (const c of MUST_DENY) check(c, "deny");

const total = MUST_ALLOW.length + MUST_DENY.length;
console.log(
  failed === 0
    ? `all ${total} cases pass (${MUST_ALLOW.length} allowed, ${MUST_DENY.length} blocked)`
    : `${failed} of ${total} cases failed`
);
process.exit(failed === 0 ? 0 : 1);
