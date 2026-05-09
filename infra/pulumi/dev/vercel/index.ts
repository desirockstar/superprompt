const apiKey = process.env.VERCEL_TOKEN;

async function main() {
  const orgId = process.env.VERCEL_ORG_ID;

  // First, try to find existing project
  const projectsResponse = await fetch("https://api.vercel.com/v6/projects", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!projectsResponse.ok) {
    const errorText = await projectsResponse.text();
    throw new Error(`Vercel API error: ${projectsResponse.status} - ${errorText}`);
  }

  const projectsData = (await projectsResponse.json()) as { projects?: { id: string; name: string; orgId: string; url: string }[] };
  let superpromptProject = projectsData.projects?.find((p) => p.name === "superprompt");

  // Create project if not found
  if (!superpromptProject) {
    if (!process.env.VERCEL_PROJECT_ID) {
      console.log("No existing Vercel project found, creating new...");

      const createResponse = await fetch("https://api.vercel.com/v13/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "superprompt",
          framework: "nextjs",
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Vercel create failed: ${createResponse.status} - ${errorText}`);
      }

      const createData = (await createResponse.json()) as { id: string; name: string; url: string };
      superpromptProject = { id: createData.id, name: createData.name, orgId: orgId || "", url: createData.url || "" };
      console.log(`Vercel project created: ${createData.id}`);
    } else {
      console.log(`Using configured Vercel project ID: ${process.env.VERCEL_PROJECT_ID}`);
      superpromptProject = { id: process.env.VERCEL_PROJECT_ID, name: "superprompt", orgId: orgId || "", url: "" };
    }
  } else {
    console.log(`Found existing Vercel project: ${superpromptProject.id}`);
  }

  const projectId = superpromptProject?.id ?? "";
  const projectUrl = superpromptProject?.url ?? "";

  console.log("Vercel provision complete:");
  console.log(`  projectId: ${projectId}`);
  console.log(`  projectUrl: ${projectUrl}`);
  console.log(`OUTPUT: ${JSON.stringify({ projectId, projectUrl })}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`Vercel provision failed: ${err}`);
    process.exit(1);
  });