import { constants } from "node:fs";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const composeSourcePath = resolve(packageRoot, "docker-compose.yml");
const managedFiles = [
  ".devcontainer/devcontainer.json",
  ".env",
  ".vscode/settings.json",
  "docker-compose.yml",
];

export class CliError extends Error {}

export const usage = `Usage: node-devbox <folder-name> [options]

Create an isolated Node.js development environment in a new or existing folder.

Options:
  --name <name>       Set the Docker Compose project name
  --port-3000 <port>  Set the host port mapped to container port 3000
  --port-5173 <port>  Set the host port mapped to container port 5173
  --port-8080 <port>  Set the host port mapped to container port 8080
  --timezone <zone>   Set the container timezone (default: UTC)
  --start             Start the devbox after creating it
  --force             Replace files previously managed by Node Devbox
  -h, --help          Show help
  -v, --version       Show the installed version

Examples:
  npx node-devbox my-project
  npx node-devbox client-work --name client-work
  npx node-devbox . --port-3000 3000
`;

function takeValue(argumentsList, index, option) {
  const value = argumentsList[index + 1];
  if (!value || value.startsWith("-")) {
    throw new CliError(`${option} requires a value.`);
  }
  return value;
}

export function parseArguments(argumentsList) {
  const options = {
    cwd: process.cwd(),
    force: false,
    help: false,
    ports: {},
    start: false,
    timezone: "UTC",
    version: false,
  };
  const positional = [];

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    if (argument === "-h" || argument === "--help") {
      options.help = true;
    } else if (argument === "-v" || argument === "--version") {
      options.version = true;
    } else if (argument === "--force") {
      options.force = true;
    } else if (argument === "--start") {
      options.start = true;
    } else if (argument === "--name") {
      options.name = takeValue(argumentsList, index, argument);
      index += 1;
    } else if (argument === "--timezone" || argument === "--tz") {
      options.timezone = takeValue(argumentsList, index, argument);
      index += 1;
    } else if (/^--port-(3000|5173|8080)$/.test(argument)) {
      const containerPort = Number(argument.slice("--port-".length));
      options.ports[containerPort] = takeValue(argumentsList, index, argument);
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new CliError(`Unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }

  if (!options.help && !options.version) {
    if (positional.length === 0) {
      throw new CliError("Provide a folder name.");
    }
    if (positional.length > 1) {
      throw new CliError("Provide only one folder name.");
    }
    options.target = positional[0];
  }

  return options;
}

export function normalizeProjectName(value) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[-_]+$/, "")
    .slice(0, 48);

  if (!normalized) {
    throw new CliError("The project name must contain at least one letter or number.");
  }

  return normalized;
}

function projectNameFromTarget(targetDirectory) {
  const segments = targetDirectory.split(sep).filter(Boolean);
  return segments.at(-1) ?? "node-devbox";
}

function hashProjectName(projectName) {
  let hash = 2166136261;
  for (const character of projectName) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function derivePorts(projectName) {
  const slot = hashProjectName(projectName) % 8000;
  return {
    3000: 20000 + slot,
    5173: 30000 + slot,
    8080: 40000 + slot,
  };
}

function validatePort(value, option) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new CliError(`${option} must be an integer from 1 to 65535.`);
  }
  return port;
}

function validateTimezone(value) {
  if (!/^[A-Za-z0-9_+/-]+$/.test(value)) {
    throw new CliError("The timezone contains unsupported characters.");
  }
  return value;
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function prepareTarget(targetDirectory, force) {
  if (await exists(targetDirectory)) {
    if (!(await stat(targetDirectory)).isDirectory()) {
      throw new CliError(`Target is not a directory: ${targetDirectory}`);
    }
  } else {
    await mkdir(targetDirectory, { recursive: true });
  }

  if (!force) {
    const conflicts = [];
    for (const managedFile of managedFiles) {
      if (await exists(resolve(targetDirectory, managedFile))) {
        conflicts.push(managedFile);
      }
    }
    if (conflicts.length > 0) {
      throw new CliError(
        `Refusing to replace existing files: ${conflicts.join(", ")}. Use --force to replace them.`,
      );
    }
  }
}

function createEnvironment(projectName, timezone, ports) {
  return [
    `COMPOSE_PROJECT_NAME=${projectName}`,
    `DEVBOX_HOSTNAME=${projectName}-devbox`,
    `TZ=${timezone}`,
    `DEVBOX_PORT_3000=${ports[3000]}`,
    `DEVBOX_PORT_5173=${ports[5173]}`,
    `DEVBOX_PORT_8080=${ports[8080]}`,
    "",
  ].join("\n");
}

function createDevcontainer(projectName) {
  return `${JSON.stringify(
    {
      name: `Node Devbox: ${projectName}`,
      dockerComposeFile: "../docker-compose.yml",
      service: "devbox",
      workspaceFolder: "/workspace",
      remoteUser: "developer",
      shutdownAction: "none",
      overrideCommand: false,
      customizations: {
        vscode: {
          settings: {
            "terminal.integrated.defaultProfile.linux": "bash",
            "git.terminalAuthentication": false,
            "github.gitAuthentication": false,
          },
          extensions: [
            "GitHub.vscode-pull-request-github",
            "dbaeumer.vscode-eslint",
            "esbenp.prettier-vscode",
            "eamodio.gitlens",
          ],
        },
      },
      postAttachCommand: "gh auth status || echo 'Run dev-account to sign in'",
    },
    null,
    2,
  )}\n`;
}

function createVscodeSettings() {
  return `${JSON.stringify(
    {
      "dev.containers.copyGitConfig": false,
      "dev.containers.gitCredentialHelperConfigLocation": "none",
    },
    null,
    2,
  )}\n`;
}

async function writeManagedFile(targetDirectory, relativePath, contents, force) {
  const destination = resolve(targetDirectory, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents, { encoding: "utf8", flag: force ? "w" : "wx" });
}

async function startDevbox(targetDirectory) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn("docker", ["compose", "up", "-d"], {
      cwd: targetDirectory,
      stdio: "inherit",
    });
    child.on("error", () => reject(new CliError("Docker is not installed or is not on PATH.")));
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new CliError(`docker compose exited with status ${code}.`));
      }
    });
  });
}

export async function createDevbox(options) {
  const cwd = resolve(options.cwd ?? process.cwd());
  const targetDirectory = resolve(cwd, options.target);
  const projectName = normalizeProjectName(options.name ?? projectNameFromTarget(targetDirectory));
  const defaultPorts = derivePorts(projectName);
  const ports = {
    3000: validatePort(options.ports?.[3000] ?? defaultPorts[3000], "--port-3000"),
    5173: validatePort(options.ports?.[5173] ?? defaultPorts[5173], "--port-5173"),
    8080: validatePort(options.ports?.[8080] ?? defaultPorts[8080], "--port-8080"),
  };

  if (new Set(Object.values(ports)).size !== Object.values(ports).length) {
    throw new CliError("Host ports must be different from each other.");
  }

  const timezone = validateTimezone(options.timezone ?? "UTC");
  await prepareTarget(targetDirectory, options.force ?? false);

  const composeContents = await readFile(composeSourcePath, "utf8");
  await writeManagedFile(targetDirectory, "docker-compose.yml", composeContents, options.force);
  await writeManagedFile(
    targetDirectory,
    ".env",
    createEnvironment(projectName, timezone, ports),
    options.force,
  );
  await writeManagedFile(
    targetDirectory,
    ".devcontainer/devcontainer.json",
    createDevcontainer(projectName),
    options.force,
  );
  await writeManagedFile(
    targetDirectory,
    ".vscode/settings.json",
    createVscodeSettings(),
    options.force,
  );

  if (options.start) {
    await startDevbox(targetDirectory);
  }

  const relativeTarget = relative(cwd, targetDirectory) || ".";
  return {
    ports,
    projectName,
    relativeTarget: isAbsolute(options.target) ? targetDirectory : relativeTarget,
    targetDirectory,
  };
}