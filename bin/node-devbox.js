#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { CliError, createDevbox, parseArguments, usage } from "../lib/scaffold.js";

const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));

async function getVersion() {
  return JSON.parse(await readFile(packageJsonPath, "utf8")).version;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));

  if (options.help) {
    process.stdout.write(usage);
    return;
  }

  if (options.version) {
    process.stdout.write(`${await getVersion()}\n`);
    return;
  }

  const result = await createDevbox(options);

  process.stdout.write(`\nCreated Node Devbox: ${result.projectName}\n`);
  process.stdout.write(`Location: ${result.targetDirectory}\n`);
  process.stdout.write("Host ports:\n");
  process.stdout.write(`  ${result.ports[3000]} -> 3000\n`);
  process.stdout.write(`  ${result.ports[5173]} -> 5173\n`);
  process.stdout.write(`  ${result.ports[8080]} -> 8080\n\n`);
  process.stdout.write("Next steps:\n");
  process.stdout.write(`  cd ${JSON.stringify(result.relativeTarget)}\n`);
  process.stdout.write("  docker compose up -d\n");
  process.stdout.write("  docker compose exec devbox dev-account\n");
  process.stdout.write("  docker compose exec devbox bash\n");
}

main().catch((error) => {
  if (error instanceof CliError) {
    process.stderr.write(`Error: ${error.message}\n\n${usage}`);
    process.exitCode = 1;
    return;
  }

  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});