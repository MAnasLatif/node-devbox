import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  CliError,
  createDevbox,
  detectSystemTimezone,
  derivePorts,
  normalizeProjectName,
  parseArguments,
} from "../src/scaffold.js";

async function withTemporaryDirectory(callback: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "node-devbox-test-"));
  try {
    await callback(directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

test("parses the documented command with the detected system timezone", () => {
  assert.deepEqual(
    parseArguments(["my-app", "--name", "client", "--port-3000", "3000"], "Asia/Karachi"),
    {
      cwd: process.cwd(),
      force: false,
      help: false,
      name: "client",
      ports: { 3000: "3000" },
      start: false,
      target: "my-app",
      timezone: "Asia/Karachi",
      version: false,
    },
  );
});

test("detects the system timezone and safely falls back to UTC", () => {
  assert.equal(detectSystemTimezone(() => "Europe/London"), "Europe/London");
  assert.equal(detectSystemTimezone(() => ""), "UTC");
  assert.equal(detectSystemTimezone(() => "Invalid Timezone"), "UTC");
  assert.equal(
    detectSystemTimezone(() => {
      throw new Error("Intl unavailable");
    }),
    "UTC",
  );
});

test("normalizes names accepted by Docker Compose", () => {
  assert.equal(normalizeProjectName("My Client Project!"), "my-client-project");
  assert.throws(() => normalizeProjectName("---"), CliError);
});

test("creates complete, isolated setups for multiple projects", async () => {
  await withTemporaryDirectory(async (cwd) => {
    const alpha = await createDevbox({ cwd, ports: {}, target: "Alpha Project" });
    const beta = await createDevbox({ cwd, ports: {}, target: "Beta Project" });

    assert.equal(alpha.projectName, "alpha-project");
    assert.equal(beta.projectName, "beta-project");
    assert.equal(alpha.timezone, detectSystemTimezone());
    assert.notDeepEqual(alpha.ports, beta.ports);

    const alphaEnvironment = await readFile(join(alpha.targetDirectory, ".env"), "utf8");
    const betaEnvironment = await readFile(join(beta.targetDirectory, ".env"), "utf8");
    const compose = await readFile(join(alpha.targetDirectory, "docker-compose.yml"), "utf8");
    const devcontainer = JSON.parse(
      await readFile(join(alpha.targetDirectory, ".devcontainer/devcontainer.json"), "utf8"),
    ) as {
      customizations: { vscode: { settings: Record<string, unknown> } };
      name: string;
      workspaceFolder: string;
    };
    const vscodeSettings = JSON.parse(
      await readFile(join(alpha.targetDirectory, ".vscode/settings.json"), "utf8"),
    ) as Record<string, unknown>;

    assert.match(alphaEnvironment, /^COMPOSE_PROJECT_NAME=alpha-project$/m);
  assert.ok(alphaEnvironment.split("\n").includes(`TZ=${detectSystemTimezone()}`));
    assert.match(betaEnvironment, /^COMPOSE_PROJECT_NAME=beta-project$/m);
    assert.match(compose, /source: devbox_home/);
    assert.equal(devcontainer.name, "Node Devbox: alpha-project");
    assert.equal(devcontainer.workspaceFolder, "/workspace");
    assert.deepEqual(devcontainer.customizations.vscode.settings["files.exclude"], {
      ".devcontainer": true,
      ".vscode": true,
      ".env": true,
      "docker-compose.yml": true,
    });
    assert.equal(vscodeSettings["files.exclude"], undefined);
  });
});

test("uses stable per-project ports and accepts explicit overrides", async () => {
  assert.deepEqual(derivePorts("alpha"), derivePorts("alpha"));

  await withTemporaryDirectory(async (cwd) => {
    const result = await createDevbox({
      cwd,
      ports: { 3000: "3000", 5173: "5173", 8080: "8080" },
      target: "custom-ports",
      timezone: "Asia/Karachi",
    });
    const environment = await readFile(join(result.targetDirectory, ".env"), "utf8");

    assert.match(environment, /^TZ=Asia\/Karachi$/m);
    assert.match(environment, /^DEVBOX_PORT_3000=3000$/m);
    assert.equal(result.timezone, "Asia/Karachi");
  });
});

test("does not overwrite managed files unless force is set", async () => {
  await withTemporaryDirectory(async (cwd) => {
    const targetDirectory = join(cwd, "existing");
    await createDevbox({ cwd, ports: {}, target: "existing" });
    await writeFile(join(targetDirectory, ".env"), "KEEP_ME=true\n");

    await assert.rejects(
      createDevbox({ cwd, ports: {}, target: "existing" }),
      /Refusing to replace existing files/,
    );
    assert.equal(await readFile(join(targetDirectory, ".env"), "utf8"), "KEEP_ME=true\n");

    await createDevbox({ cwd, force: true, ports: {}, target: "existing" });
    assert.match(await readFile(join(targetDirectory, ".env"), "utf8"), /COMPOSE_PROJECT_NAME/);
  });
});