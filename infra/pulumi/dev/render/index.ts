const apiKey = process.env.RENDER_API_KEY;
const serviceName = "superprompt-dev";

async function main() {
  console.log("Checking for existing Render service...");

  const response = await fetch("https://api.render.com/v1/services", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Render API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string; name: string; serviceDetails?: { url?: string } }[];
  let service = data.find((s) => s.name === serviceName);

  if (!service) {
    console.log("No existing Render service found, creating new...");

    const ownersResponse = await fetch("https://api.render.com/v1/owners", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    if (!ownersResponse.ok) {
      throw new Error(`Render owners API error: ${ownersResponse.status}`);
    }

    const ownersData = (await ownersResponse.json()) as { owner: { id: string; type: string } }[];
    const ownerId = ownersData[0]?.owner?.id;

    if (!ownerId) {
      throw new Error("Could not determine Render owner ID");
    }

    console.log(`Creating Render service with owner: ${ownerId}`);

    const createResponse = await fetch("https://api.render.com/v1/services", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "web_service",
        name: serviceName,
        ownerId: ownerId,
        region: "oregon",
        plan: "free",
        repo: "https://github.com/desirockstar/superprompt",
        branch: "main",
        autoDeploy: "yes",
        serviceDetails: {
          runtime: "node",
          envSpecificDetails: {
            buildCommand: "npm install && pnpm build:backend",
            startCommand: "node dist/main.js",
          },
        },
      }),
    });

    if (createResponse.status === 402) {
      console.log("\nWARNING: Render requires billing info on file to create web services via API.");
      console.log("To create the service manually:");
      console.log("  1. Go to https://dashboard.render.com");
      console.log("  2. Click 'New +' -> 'Web Service'");
      console.log("  3. Connect GitHub repo: desirockstar/superprompt");
      console.log("  4. Branch: main");
      console.log("  5. Region: Oregon");
      console.log("  6. Instance Type: Free");
      console.log("  7. Build Command: npm install && pnpm build:backend");
      console.log("  8. Start Command: node dist/main.js");
      console.log("  9. Click 'Create Web Service'");
      console.log("\nOnce created, re-run bootstrap to sync the serviceId to GitHub secrets.");
      console.log(`OUTPUT: ${JSON.stringify({ serviceId: "", serviceUrl: "" })}`);
      process.exit(0);
    }

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Render create failed (${createResponse.status}): ${errorText}`);
    }

    const createData = (await createResponse.json()) as { id: string; name: string; serviceDetails?: { url?: string } };
    service = { id: createData.id, name: createData.name, serviceDetails: createData.serviceDetails };
    console.log(`Render service created: ${createData.id}`);
  } else {
    console.log(`Found existing Render service: ${service.id}`);
  }

  const serviceId = service?.id ?? "";
  const serviceUrl = service?.serviceDetails?.url ?? "";

  console.log("Render provision complete:");
  console.log(`  serviceId: ${serviceId}`);
  console.log(`  serviceUrl: ${serviceUrl}`);
  console.log(`OUTPUT: ${JSON.stringify({ serviceId, serviceUrl })}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`Render provision failed: ${err}`);
    process.exit(1);
  });