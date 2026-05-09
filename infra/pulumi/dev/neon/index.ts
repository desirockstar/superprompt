const apiKey = process.env.NEON_API_KEY;
const orgId = process.env.NEON_ORG_ID;
const projectName = "superprompt-dev";
const regionId = "aws-ap-southeast-1";

async function main() {
  console.log("Checking for existing Neon project...");

  // List projects
  const listResponse = await fetch(
    `https://console.neon.tech/api/v2/projects?org_id=${orgId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Neon API error: ${listResponse.status} - ${errorText}`);
  }

  const listData = (await listResponse.json()) as { projects?: { id: string; name: string }[] };
  const existingProject = listData.projects?.find((p) => p.name === projectName);

  let projectId: string;
  let connectionString: string;

  if (existingProject) {
    console.log(`Found existing Neon project: ${existingProject.id}`);
    projectId = existingProject.id;

    // Get the branch info
    const branchResponse = await fetch(
      `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
      { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } }
    );

    const branchData = (await branchResponse.json()) as { branches?: { id: string; name: string }[] };
    const mainBranch = branchData.branches?.find((b) => b.name === "main");

    if (!mainBranch) {
      throw new Error("No main branch found");
    }

    // Get endpoints to build connection string
    const endpointResponse = await fetch(
      `https://console.neon.tech/api/v2/projects/${projectId}/endpoints`,
      { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } }
    );

    const endpointData = (await endpointResponse.json()) as { endpoints?: { host: string }[] };
    const endpoint = endpointData.endpoints?.find((e) => true);

    if (!endpoint) {
      throw new Error("No endpoint found for Neon project");
    }

    // Neon uses passwordless auth - construct connection string
    // Format: postgresql://<user>@<host>/<db>
    const host = endpoint.host;
    // Default database name matches project name
    const databaseName = projectName;
    // Default user is the login (from /users/me response)
    const user = "dhruv.vd";

    connectionString = `postgresql://${user}@${host}/${databaseName}`;
    console.log("Using existing Neon project connection");
    console.log(`  host: ${host}`);
  } else {
    console.log("No existing Neon project found, creating new...");

    const createResponse = await fetch("https://console.neon.tech/api/v2/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: { name: projectName, region_id: regionId, org_id: orgId },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Neon create failed: ${createResponse.status} - ${errorText}`);
    }

    const createData = (await createResponse.json()) as {
      project?: { id: string };
      connection_uris?: { connection_uri: string }[];
      branch?: { connection_uri: string };
    };

    projectId = createData.project?.id ?? "";
    connectionString =
      createData.connection_uris?.[0]?.connection_uri ??
      createData.branch?.connection_uri ??
      "";
    console.log(`Neon project created: ${projectId}`);
  }

  console.log("Neon provision complete:");
  console.log(`  projectId: ${projectId}`);
  console.log(`  connectionString: [secret]`);
  console.log(`OUTPUT: ${JSON.stringify({ projectId, connectionString })}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`Neon provision failed: ${err}`);
    process.exit(1);
  });