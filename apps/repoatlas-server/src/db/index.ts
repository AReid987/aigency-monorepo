import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createSqlClient(url: string) {
  return postgres(url, {
    max: 10,
  });
}

export async function migrate(sql: postgres.Sql) {
  const bundled = join(__dirname, "..", "migrations");
  const cwd = join(process.cwd(), "migrations");
  const migrationsDir = existsSync(bundled) ? bundled : cwd;
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), "utf-8");
    await sql.unsafe(content);
  }
}

export interface DbProject {
  id: string;
  name: string;
  remote_url: string | null;
  last_commit: string | null;
  indexed_at: Date | null;
  meta: Record<string, unknown>;
  stats: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface DbWikiPage {
  slug: string;
  title: string;
  markdown: string;
  generated_at: Date | null;
}

export async function listProjects(sql: postgres.Sql): Promise<DbProject[]> {
  return await sql<DbProject[]>`select * from projects order by updated_at desc`;
}

export async function getProject(sql: postgres.Sql, id: string): Promise<DbProject | null> {
  const rows = await sql<DbProject[]>`select * from projects where id = ${id}`;
  return rows[0] ?? null;
}

export async function upsertProject(
  sql: postgres.Sql,
  project: Omit<DbProject, "created_at" | "updated_at">
): Promise<void> {
  await sql`
    insert into projects (id, name, remote_url, last_commit, indexed_at, meta, stats)
    values (${project.id}, ${project.name}, ${project.remote_url}, ${project.last_commit}, ${project.indexed_at}, ${sql.json(project.meta as postgres.JSONValue)}, ${sql.json(project.stats as postgres.JSONValue)})
    on conflict (id) do update set
      name = excluded.name,
      remote_url = excluded.remote_url,
      last_commit = excluded.last_commit,
      indexed_at = excluded.indexed_at,
      meta = excluded.meta,
      stats = excluded.stats,
      updated_at = now()
  `;
}

export async function getWikiPages(sql: postgres.Sql, projectId: string): Promise<DbWikiPage[]> {
  return await sql<DbWikiPage[]>`
    select slug, title, markdown, generated_at
    from wiki_pages
    where project_id = ${projectId}
    order by title
  `;
}

export async function getWikiPage(sql: postgres.Sql, projectId: string, slug: string): Promise<DbWikiPage | null> {
  const rows = await sql<DbWikiPage[]>`
    select slug, title, markdown, generated_at
    from wiki_pages
    where project_id = ${projectId} and slug = ${slug}
  `;
  return rows[0] ?? null;
}

export async function upsertWikiPage(
  sql: postgres.Sql,
  projectId: string,
  page: DbWikiPage
): Promise<void> {
  await sql`
    insert into wiki_pages (project_id, slug, title, markdown, generated_at)
    values (${projectId}, ${page.slug}, ${page.title}, ${page.markdown}, ${page.generated_at})
    on conflict (project_id, slug) do update set
      title = excluded.title,
      markdown = excluded.markdown,
      generated_at = excluded.generated_at
  `;
}

export async function deleteWikiPagesNotIn(sql: postgres.Sql, projectId: string, slugs: string[]): Promise<void> {
  if (slugs.length === 0) {
    await sql`delete from wiki_pages where project_id = ${projectId}`;
    return;
  }
  await sql`
    delete from wiki_pages
    where project_id = ${projectId} and slug <> all(${sql.array(slugs)})
  `;
}

export async function createSyncJob(
  sql: postgres.Sql,
  projectId: string,
  status: string,
  payload: Record<string, unknown>
): Promise<number> {
  const rows = await sql<{ id: number }[]>`
    insert into sync_jobs (project_id, status, payload)
    values (${projectId}, ${status}, ${sql.json(payload as postgres.JSONValue)})
    returning id
  `;
  return rows[0].id;
}

export async function finishSyncJob(
  sql: postgres.Sql,
  jobId: number,
  status: string,
  result: Record<string, unknown>,
  errorMessage?: string
): Promise<void> {
  await sql`
    update sync_jobs
    set status = ${status},
        result = ${sql.json(result as postgres.JSONValue)},
        error_message = ${errorMessage ?? null},
        finished_at = now()
    where id = ${jobId}
  `;
}
