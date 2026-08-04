#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import {
  CliError,
  createDevbox,
  parseArguments,
  promptForMissingOptions,
  usage,
} from "./scaffold.js";

interface PackageJson {
  version: string;
}

const packageJsonPath = fileURLToPath(new URL("../../package.json", import.meta.url));

async function getVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;
  return packageJson.version;
}

async function completeOptions(options: ReturnType<typeof parseArguments>) {
  if (options.target && options.workspace !== undefined) {
    return options;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new CliError(
      "Provide a folder name and either --workspace <path> or --no-workspace-mount when running non-interactively.",
    );
  }

  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await promptForMissingOptions(options, (question) => readline.question(question));
  } finally {
    readline.close();
  }
}

async function main(): Promise<void> {
  const parsedOptions = parseArguments(process.argv.slice(2));

  if (parsedOptions.help) {
    process.stdout.write(usage);
    return;
  }

  if (parsedOptions.version) {
    process.stdout.write(`${await getVersion()}\n`);
    return;
  }

  const options = await completeOptions(parsedOptions);
  const result = await createDevbox(options);

  process.stdout.write(`\nCreated Node Devbox: ${result.projectName}\n`);
  process.stdout.write(`Location: ${result.targetDirectory}\n`);
  process.stdout.write(`Timezone: ${result.timezone}\n`);
  process.stdout.write(
    result.workspaceType === "bind"
      ? `Workspace: ${result.workspaceSource} -> /workspace\n`
      : "Workspace: persistent Docker volume -> /workspace\n",
  );
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

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    process.stderr.write(`Error: ${error.message}\n\n${usage}`);
    process.exitCode = 1;
    return;
  }

  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});