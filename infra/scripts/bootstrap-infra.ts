/**
 * SuperPrompt Infrastructure Bootstrap Orchestrator
 *
 * Runs Pulumi stacks to provision dev infrastructure.
 * All provider API logic lives in the stacks (infra/pulumi/dev/).
 * This file is the orchestrator only.
 *
 * Run inside the infra container:
 *   docker compose -f infra/tools/docker-compose.yml run --rm infra \
 *     pnpm tsx infra/scripts/bootstrap-infra.ts --env dev
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import { stdin as inputIsOpen, stdout as outputIsOpen } from "process";

const SCRIPT_DIR = join(process.cwd(), "infra", "scripts");
const OUTPUT_DIR = join(process.cwd(), "infra", "outputs");
const LATEST_PATH = join(OUTPUT_DIR, "infra-outputs-latest.json");

const STACKS = [
  { name: "neon", path: join(SCRIPT_DIR, "..", "pulumi", "dev", "neon") },
  { name: "vercel", path: join(SCRIPT_DIR, "..", "pulumi", "dev", "vercel") },
  { name: "render", path: join(SCRIPT_DIR, "..", "pulumi", "dev", "render") },
  { name: "github-secrets", path: join(SCRIPT_DIR, "..", "pulumi", "dev", "github-secrets") },
] as const;

function log(message: string, level: "info" | "warn" | "error" = "info"): void {
  const prefix = { info: "\x1b[32m[INFO]\x1b[0m", warn: "\x1b[33m[WARN]\x1b[0m", error: "\x1b[31m[ERROR]\x1b[0m" };
  console.log(`${prefix[level]} ${message}`);
}

function execStack(name: string, stackPath: string, env: Record<string, string>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    log(`Running Pulumi stack: ${name}`);

    const child = spawn("pnpm", ["tsx", join(stackPath, "index.ts")], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      const msg = data.toString();
      stdout += msg;
      process.stdout.write(msg);
    });

    child.stderr?.on("data", (data) => {
      const msg = data.toString();
      stderr += msg;
      process.stderr.write(msg);
    });

    child.on("close", (code) => {
      if (code === 0) {
        log(`Stack ${name} complete`);
        try {
          const outputs = stdout.includes("OUTPUT:")
            ? JSON.parse(stdout.split("OUTPUT:")[1].trim())
            : {};
          resolve(outputs);
        } catch {
          resolve({});
        }
      } else {
        log(`Stack ${name} failed with code ${code}`, "error");
        reject(new Error(`Stack ${name} exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

function loadEnvConfig(): Record<string, string | undefined> {
  const config: Record<string, string | undefined> = {};
  const keys = [
    "NEON_API_KEY", "NEON_ORG_ID", "VERCEL_TOKEN", "VERCEL_ORG_ID",
    "RENDER_API_KEY", "GITHUB_TOKEN", "GITHUB_REPO",
  ];
  for (const key of keys) {
    config[key] = process.env[key];
  }
  return config;
}

function validateInputs(config: Record<string, string | undefined>): boolean {
  const errors: string[] = [];
  if (!config["NEON_API_KEY"]) errors.push("NEON_API_KEY is required");
  if (!config["NEON_ORG_ID"]) errors.push("NEON_ORG_ID is required");
  if (!config["VERCEL_TOKEN"]) errors.push("VERCEL_TOKEN is required");
  if (!config["RENDER_API_KEY"]) errors.push("RENDER_API_KEY is required");
  if (!config["GITHUB_TOKEN"]) errors.push("GITHUB_TOKEN is required");

  if (errors.length > 0) {
    log("=== VALIDATION FAILED ===");
    for (const err of errors) log(`ERROR: ${err}`);
    log("==========================");
    return false;
  }
  log("=== All input validations passed ===");
  return true;
}

async function writeOutputs(outputs: Record<string, unknown>): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const datedPath = join(OUTPUT_DIR, `infra-outputs-${timestamp}.json`);
  writeFileSync(datedPath, JSON.stringify(outputs, null, 2));
  log(`Outputs written to ${datedPath}`);
  writeFileSync(LATEST_PATH, JSON.stringify(outputs, null, 2));
  log(`Latest outputs written to ${LATEST_PATH}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const destroy = args.includes("--destroy");

  log(`Starting infrastructure bootstrap (${destroy ? "destroy" : "dev"})`);

  const config = loadEnvConfig();

  if (!destroy && !validateInputs(config)) {
    log("VALIDATION FAILED - Halting bootstrap");
    return;
  }

  if (destroy) {
    log("Destroy mode not implemented (stacks are external API calls, no Pulumi state to destroy)");
    return;
  }

  log("Running Pulumi stacks sequentially...");

  const stackOutputs: Record<string, Record<string, unknown>> = {};

  for (const stack of STACKS) {
    try {
      const result = await execStack(stack.name, stack.path, config as Record<string, string>);
      stackOutputs[stack.name] = result;
    } catch (err) {
      log(`Stack ${stack.name} failed: ${err}`, "error");
    }
  }

  await writeOutputs(stackOutputs);

  log("Bootstrap complete!");
  log(`Outputs: ${LATEST_PATH}`);

  if (inputIsOpen && outputIsOpen) {
    console.log("\nPress Enter to exit...");
    await new Promise<void>((resolve) => process.stdin.once("data", resolve));
  }
}

main().catch((error) => {
  log(`Bootstrap failed: ${error}`, "error");
  process.exit(1);
});