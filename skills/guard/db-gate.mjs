#!/usr/bin/env node
// Read only database gate.
//
// Runs before every Bash command, but does almost nothing: unless the command
// actually invokes a database client, it exits straight away. Only when a client
// is present does it look at the statement, and then it blocks anything that can
// change data or schema.
//
// Filesystem activity, git, package managers and everything else are none of its
// business and are never blocked here.
//
// This is a command hook on purpose, not a prompt hook. A prompt hook costs a model
// call on every command, and the `if` filter meant to scope it is not reliable, so a
// prompt gate ends up judging commands that have nothing to do with a database.

import { readFileSync } from "node:fs";

const allow = () => process.exit(0);

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  allow();
}

const command = input?.tool_input?.command;
if (typeof command !== "string" || command.length === 0) allow();

// Is a database client actually being invoked? Matched as a command word, so a
// filename or a comment that merely contains the word does not trigger the gate.
const CLIENT = /(^|[\s;&|(`])(psql|mysql|mariadb|mongosh|mongo|sqlite3|redis-cli|pgcli|mycli)(\s|$)/;
if (!CLIENT.test(command)) allow();

// From here on, a database client is being run.

const SQL_WRITE =
  /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|RENAME|GRANT|REVOKE|REPLACE|MERGE|UPSERT|VACUUM|REINDEX|CLUSTER|LOAD\s+DATA|COPY\s+\w+\s+FROM|SET\s+GLOBAL|CALL\s)\b/i;

const MONGO_WRITE =
  /\.(insertOne|insertMany|updateOne|updateMany|deleteOne|deleteMany|remove|drop|dropDatabase|replaceOne|findAndModify|findOneAndUpdate|findOneAndDelete|findOneAndReplace|bulkWrite|createIndex|dropIndex|renameCollection|save)\s*\(/i;

const REDIS_WRITE =
  /\b(FLUSHALL|FLUSHDB|SET|DEL|EXPIRE|RENAME|HSET|LPUSH|RPUSH|SADD|ZADD)\b/i;

// Feeding a file into a client hides the statements from this gate entirely.
const HIDDEN_INPUT =
  /(<\s*\S+\.sql)|(-f\s+\S+\.sql)|(--file[=\s]\S+)|(\bsource\s+\S+\.sql)/i;

const deny = (why) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `${why} This project allows the agent read only database access. ` +
        "Run this command yourself, or ask for a read only version of it.",
    },
  }));
  process.exit(0);
};

if (HIDDEN_INPUT.test(command)) deny("This runs a SQL file, so its statements cannot be checked.");
if (SQL_WRITE.test(command)) deny("This contains a statement that can change data or schema.");
if (MONGO_WRITE.test(command)) deny("This contains a MongoDB write operation.");
if (/redis-cli/i.test(command) && REDIS_WRITE.test(command)) deny("This contains a Redis write command.");

allow();
