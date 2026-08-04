import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
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
  promptForMissingOptions,
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

test("accepts explicit workspace modes and rejects conflicting choices", () => {
  assert.equal(parseArguments(["box", "--workspace", "../app"]).workspace, "../app");
  assert.equal(parseArguments(["box", "--no-workspace-mount"]).workspace, false);
  assert.throws(
    () => parseArguments(["box", "--workspace", "../app", "--no-workspace-mount"]),
    /Choose only one workspace mount option/,
  );
});

test("prompts for a missing setup folder and workspace choice", async () => {
  const answers = ["client-box", "yes", ""];
  const questions: string[] = [];
  const options = await promptForMissingOptions(parseArguments([]), async (question) => {
    questions.push(question);
    return answers.shift() ?? "";
  });

  assert.equal(options.target, "client-box");
  assert.equal(options.workspace, join(process.cwd(), "client-box", "workspace"));
  assert.equal(questions.length, 3);

  const volumeOptions = await promptForMissingOptions(parseArguments(["volume-box"]), async () =>
    Promise.resolve(""),
  );
  assert.equal(volumeOptions.workspace, false);
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

    assert.match(alphaEnvironment, /^COMPOSE_PROJECT_NAME=alpha-project$/m);
    assert.ok(alphaEnvironment.split("\n").includes(`TZ=${detectSystemTimezone()}`));
    assert.match(alphaEnvironment, /^DEVBOX_WORKSPACE_SOURCE="devbox_workspace"$/m);
    assert.match(betaEnvironment, /^COMPOSE_PROJECT_NAME=beta-project$/m);
    assert.match(compose, /source: devbox_home/);
    assert.match(compose, /\$\{DEVBOX_WORKSPACE_SOURCE:-devbox_workspace\}:\/workspace/);
    assert.equal(devcontainer.name, "Node Devbox: alpha-project");
    assert.equal(devcontainer.workspaceFolder, "/workspace");
    assert.equal(devcontainer.customizations.vscode.settings["files.exclude"], undefined);
    assert.equal(alpha.workspaceType, "volume");
    assert.equal(alpha.workspaceSource, "devbox_workspace");
  });
});

test("creates a separate host workspace when a bind mount is requested", async () => {
  await withTemporaryDirectory(async (cwd) => {
    const workspace = join(cwd, "source code");
    const result = await createDevbox({ cwd, target: "devbox-config", workspace });
    const environment = await readFile(join(result.targetDirectory, ".env"), "utf8");

    assert.equal(result.workspaceType, "bind");
    assert.equal(result.workspaceSource, workspace);
    assert.equal((await stat(workspace)).isDirectory(), true);
    assert.ok(environment.split("\n").includes(`DEVBOX_WORKSPACE_SOURCE=${JSON.stringify(workspace)}`));
  });
});

test("rejects a workspace that contains the setup folder", async () => {
  await withTemporaryDirectory(async (cwd) => {
    await assert.rejects(
      createDevbox({ cwd, target: "devbox-config", workspace: cwd }),
      /workspace folder cannot contain the Devbox setup folder/,
    );
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