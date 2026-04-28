import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { prompts, promptVersions, promptVersionFiles } from './src/index';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/superprompt';
const client = postgres(connectionString);
const db = drizzle(client);

const seedData = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Professional Email Responder',
    category: 'Business Communication',
    status: 'approved' as const,
    basePath: 'prompts/1',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Blog Post Writer',
    category: 'Content Marketing',
    status: 'approved' as const,
    basePath: 'prompts/2',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Code Commenter',
    category: 'Developer Tools',
    status: 'approved' as const,
    basePath: 'prompts/3',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Meeting Notes',
    category: 'Productivity',
    status: 'approved' as const,
    basePath: 'prompts/4',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Social Media Manager',
    category: 'Marketing',
    status: 'approved' as const,
    basePath: 'prompts/5',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    title: 'Product Description',
    category: 'Product Marketing',
    status: 'approved' as const,
    basePath: 'prompts/6',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    title: 'Customer Support Response',
    category: 'Customer Success',
    status: 'approved' as const,
    basePath: 'prompts/7',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    title: 'FAQ Writer',
    category: 'Content Creation',
    status: 'approved' as const,
    basePath: 'prompts/8',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    title: 'Press Release',
    category: 'Corporate Communications',
    status: 'approved' as const,
    basePath: 'prompts/9',
    currentVersion: 1,
    isMultiVersion: true,
  },
{
    id: '0a0a0a0a-0a0a-0a0a-0a0a-0a0a0a0a0a0a',
    title: 'Video Script',
    category: 'Video Production',
    status: 'approved' as const,
    basePath: 'prompts/10',
    currentVersion: 1,
    isMultiVersion: true,
  },
  {
    id: 'abababab-abab-abab-abab-abababababab',
    title: 'Test Prompt',
    category: 'Testing',
    status: 'pending' as const,
    basePath: 'prompts/11',
    currentVersion: 1,
    isMultiVersion: true,
  },
];

const versionData = [
  { id: '21111111-1111-1111-1111-111111111111', promptId: '11111111-1111-1111-1111-111111111111', versionNumber: 1, needsGrading: true },
  { id: '22222222-2222-2222-2222-222222222222', promptId: '22222222-2222-2222-2222-222222222222', versionNumber: 1, needsGrading: true },
  { id: '23333333-3333-3333-3333-333333333333', promptId: '33333333-3333-3333-3333-333333333333', versionNumber: 1, needsGrading: true },
  { id: '24444444-4444-4444-4444-444444444444', promptId: '44444444-4444-4444-4444-444444444444', versionNumber: 1, needsGrading: true },
  { id: '25555555-5555-5555-5555-555555555555', promptId: '55555555-5555-5555-5555-555555555555', versionNumber: 1, needsGrading: true },
  { id: '26666666-6666-6666-6666-666666666666', promptId: '66666666-6666-6666-6666-666666666666', versionNumber: 1, needsGrading: true },
  { id: '27777777-7777-7777-7777-777777777777', promptId: '77777777-7777-7777-7777-777777777777', versionNumber: 1, needsGrading: true },
  { id: '28888888-8888-8888-8888-888888888888', promptId: '88888888-8888-8888-8888-888888888888', versionNumber: 1, needsGrading: true },
  { id: '29999999-9999-9999-9999-999999999999', promptId: '99999999-9999-9999-9999-999999999999', versionNumber: 1, needsGrading: true },
  { id: '2b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b', promptId: '0a0a0a0a-0a0a-0a0a-0a0a-0a0a0a0a0a0a', versionNumber: 1, needsGrading: true },
  { id: '2bababab-abab-abab-abab-abababababab', promptId: 'abababab-abab-abab-abab-abababababab', versionNumber: 1, needsGrading: true },
];

const fileData = [
  { id: '31111111-1111-1111-1111-111111111111', promptVersionId: '21111111-1111-1111-1111-111111111111', level: 'starter' as const, fileName: 'starter.md' },
  { id: '31111112-1111-1111-1111-111111111112', promptVersionId: '21111111-1111-1111-1111-111111111111', level: 'builder' as const, fileName: 'builder.md' },
  { id: '31111113-1111-1111-1111-111111111113', promptVersionId: '21111111-1111-1111-1111-111111111111', level: 'pro' as const, fileName: 'pro.md' },
  { id: '31111114-1111-1111-1111-111111111114', promptVersionId: '21111111-1111-1111-1111-111111111111', level: 'super' as const, fileName: 'super.md' },
  { id: '32222221-2222-2222-2222-222222222221', promptVersionId: '22222222-2222-2222-2222-222222222222', level: 'starter' as const, fileName: 'starter.md' },
  { id: '32222222-2222-2222-2222-222222222222', promptVersionId: '22222222-2222-2222-2222-222222222222', level: 'builder' as const, fileName: 'builder.md' },
  { id: '32222223-2222-2222-2222-222222222223', promptVersionId: '22222222-2222-2222-2222-222222222222', level: 'pro' as const, fileName: 'pro.md' },
  { id: '32222224-2222-2222-2222-222222222224', promptVersionId: '22222222-2222-2222-2222-222222222222', level: 'super' as const, fileName: 'super.md' },
  { id: '33333331-3333-3333-3333-333333333331', promptVersionId: '23333333-3333-3333-3333-333333333333', level: 'starter' as const, fileName: 'starter.md' },
  { id: '33333332-3333-3333-3333-333333333332', promptVersionId: '23333333-3333-3333-3333-333333333333', level: 'builder' as const, fileName: 'builder.md' },
  { id: '33333333-3333-3333-3333-333333333333', promptVersionId: '23333333-3333-3333-3333-333333333333', level: 'pro' as const, fileName: 'pro.md' },
  { id: '33333334-3333-3333-3333-333333333334', promptVersionId: '23333333-3333-3333-3333-333333333333', level: 'super' as const, fileName: 'super.md' },
  { id: '34444441-4444-4444-4444-444444444441', promptVersionId: '24444444-4444-4444-4444-444444444444', level: 'starter' as const, fileName: 'starter.md' },
  { id: '34444442-4444-4444-4444-444444444442', promptVersionId: '24444444-4444-4444-4444-444444444444', level: 'builder' as const, fileName: 'builder.md' },
  { id: '34444443-4444-4444-4444-444444444443', promptVersionId: '24444444-4444-4444-4444-444444444444', level: 'pro' as const, fileName: 'pro.md' },
  { id: '34444444-4444-4444-4444-444444444444', promptVersionId: '24444444-4444-4444-4444-444444444444', level: 'super' as const, fileName: 'super.md' },
  { id: '35555551-5555-5555-5555-555555555551', promptVersionId: '25555555-5555-5555-5555-555555555555', level: 'starter' as const, fileName: 'starter.md' },
  { id: '35555552-5555-5555-5555-555555555552', promptVersionId: '25555555-5555-5555-5555-555555555555', level: 'builder' as const, fileName: 'builder.md' },
  { id: '35555553-5555-5555-5555-555555555553', promptVersionId: '25555555-5555-5555-5555-555555555555', level: 'pro' as const, fileName: 'pro.md' },
  { id: '35555554-5555-5555-5555-555555555554', promptVersionId: '25555555-5555-5555-5555-555555555555', level: 'super' as const, fileName: 'super.md' },
  { id: '36666661-6666-6666-6666-666666666661', promptVersionId: '26666666-6666-6666-6666-666666666666', level: 'starter' as const, fileName: 'starter.md' },
  { id: '36666662-6666-6666-6666-666666666662', promptVersionId: '26666666-6666-6666-6666-666666666666', level: 'builder' as const, fileName: 'builder.md' },
  { id: '36666663-6666-6666-6666-666666666663', promptVersionId: '26666666-6666-6666-6666-666666666666', level: 'pro' as const, fileName: 'pro.md' },
  { id: '36666664-6666-6666-6666-666666666664', promptVersionId: '26666666-6666-6666-6666-666666666666', level: 'super' as const, fileName: 'super.md' },
  { id: '37777771-7777-7777-7777-777777777771', promptVersionId: '27777777-7777-7777-7777-777777777777', level: 'starter' as const, fileName: 'starter.md' },
  { id: '37777772-7777-7777-7777-777777777772', promptVersionId: '27777777-7777-7777-7777-777777777777', level: 'builder' as const, fileName: 'builder.md' },
  { id: '37777773-7777-7777-7777-777777777773', promptVersionId: '27777777-7777-7777-7777-777777777777', level: 'pro' as const, fileName: 'pro.md' },
  { id: '37777774-7777-7777-7777-777777777774', promptVersionId: '27777777-7777-7777-7777-777777777777', level: 'super' as const, fileName: 'super.md' },
  { id: '38888881-8888-8888-8888-888888888881', promptVersionId: '28888888-8888-8888-8888-888888888888', level: 'starter' as const, fileName: 'starter.md' },
  { id: '38888882-8888-8888-8888-888888888882', promptVersionId: '28888888-8888-8888-8888-888888888888', level: 'builder' as const, fileName: 'builder.md' },
  { id: '38888883-8888-8888-8888-888888888883', promptVersionId: '28888888-8888-8888-8888-888888888888', level: 'pro' as const, fileName: 'pro.md' },
  { id: '38888884-8888-8888-8888-888888888884', promptVersionId: '28888888-8888-8888-8888-888888888888', level: 'super' as const, fileName: 'super.md' },
  { id: '39999991-9999-9999-9999-999999999991', promptVersionId: '29999999-9999-9999-9999-999999999999', level: 'starter' as const, fileName: 'starter.md' },
  { id: '39999992-9999-9999-9999-999999999992', promptVersionId: '29999999-9999-9999-9999-999999999999', level: 'builder' as const, fileName: 'builder.md' },
  { id: '39999993-9999-9999-9999-999999999993', promptVersionId: '29999999-9999-9999-9999-999999999999', level: 'pro' as const, fileName: 'pro.md' },
  { id: '39999994-9999-9999-9999-999999999994', promptVersionId: '29999999-9999-9999-9999-999999999999', level: 'super' as const, fileName: 'super.md' },
  { id: '3b0b0b01-0b0b-0b0b-0b0b-0b0b0b0b0b0b', promptVersionId: '2b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b', level: 'starter' as const, fileName: 'starter.md' },
  { id: '3b0b0b02-0b0b-0b0b-0b0b-0b0b0b0b0b0b', promptVersionId: '2b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b', level: 'builder' as const, fileName: 'builder.md' },
  { id: '3b0b0b03-0b0b-0b0b-0b0b-0b0b0b0b0b0b', promptVersionId: '2b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b', level: 'pro' as const, fileName: 'pro.md' },
  { id: '3b0b0b04-0b0b-0b0b-0b0b-0b0b0b0b0b0b', promptVersionId: '2b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b', level: 'super' as const, fileName: 'super.md' },
  { id: '3babab01-abab-abab-abab-abababababa1', promptVersionId: '2bababab-abab-abab-abab-abababababab', level: 'starter' as const, fileName: 'starter.md' },
  { id: '3babab02-abab-abab-abab-abababababa2', promptVersionId: '2bababab-abab-abab-abab-abababababab', level: 'builder' as const, fileName: 'builder.md' },
  { id: '3babab03-abab-abab-abab-abababababa3', promptVersionId: '2bababab-abab-abab-abab-abababababab', level: 'pro' as const, fileName: 'pro.md' },
  { id: '3babab04-abab-abab-abab-abababababa4', promptVersionId: '2bababab-abab-abab-abab-abababababab', level: 'super' as const, fileName: 'super.md' },
];

async function seed() {
  console.log('Seeding prompts...');
  await db.insert(prompts).values(seedData).onConflictDoNothing();
  console.log(`Inserted ${seedData.length} prompts`);

  console.log('Seeding prompt versions...');
  await db.insert(promptVersions).values(versionData).onConflictDoNothing();
  console.log(`Inserted ${versionData.length} prompt versions`);

  console.log('Seeding prompt version files...');
  await db.insert(promptVersionFiles).values(fileData).onConflictDoNothing();
  console.log(`Inserted ${fileData.length} prompt version files`);

  console.log('Seed complete!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});