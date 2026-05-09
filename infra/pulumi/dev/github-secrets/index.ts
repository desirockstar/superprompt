import { join } from "path";
import { spawn } from "child_process";
import { stdout as outputOpen, stdin as inputOpen } from "process";

const githubToken = process.env.GITHUB_TOKEN;
const githubRepo = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || "desirockstar/superprompt";

function exec(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, GITHUB_TOKEN: githubToken },
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout?.on("data", (data) => process.stdout.write(data));
    child.stderr?.on("data", (data) => process.stderr.write(data));

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  console.log("Syncing secrets to GitHub Actions via gh CLI...");

  const outputsPath = join(process.cwd(), "infra", "outputs", "infra-outputs-latest.json");

  let infraOutputs: {
    neon?: { projectId?: string; connectionString?: string };
    vercel?: { projectId?: string; projectUrl?: string };
    render?: { serviceId?: string; serviceUrl?: string };
  } = {};

  try {
    const fs = await import("fs");
    if (fs.existsSync(outputsPath)) {
      infraOutputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));
    }
  } catch {
    console.log("No existing infra outputs found, skipping secrets sync");
  }

  const secretsToSync: { name: string; value: string }[] = [];

  if (infraOutputs.neon?.connectionString) {
    secretsToSync.push({ name: "NEON_CONNECTION_STRING", value: infraOutputs.neon.connectionString });
  }
  if (infraOutputs.render?.serviceId) {
    secretsToSync.push({ name: "RENDER_SERVICE_ID_DEV", value: infraOutputs.render.serviceId });
  }
  if (infraOutputs.vercel?.projectId) {
    secretsToSync.push({ name: "VERCEL_PROJECT_ID", value: infraOutputs.vercel.projectId });
  }

  let syncedCount = 0;

  for (const secret of secretsToSync) {
    try {
      const child = spawn("gh", ["secret", "set", secret.name, "--body", secret.value, "--repo", githubRepo], {
        env: { ...process.env, GITHUB_TOKEN: githubToken },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => { stdout += data.toString(); process.stdout.write(data); });
      child.stderr?.on("data", (data) => { stderr += data.toString(); process.stderr.write(data); });

      await new Promise<void>((resolve, reject) => {
        child.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`gh secret set failed: ${stderr}`));
        });
      });

      console.log(`Synced secret: ${secret.name}`);
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync ${secret.name}:`, err);
    }
  }

  console.log(`GitHub secrets sync complete: ${syncedCount} secrets synced`);
  console.log(`OUTPUT: ${JSON.stringify({ syncedCount })}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`GitHub secrets sync failed: ${err}`);
    process.exit(1);
  });