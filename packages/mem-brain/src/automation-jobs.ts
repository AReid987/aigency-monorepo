// AutomationJobs — Port of original Python scripts to TypeScript job handlers
// compile, lint, flush, compact as JobQueue handlers.
// Ports: Aigency Core Mem_Brain v1 automation to the monorepo stack.

import type { AgentCallsign } from "@aigency/agent-core";
import type { JobQueue } from "./job-queue.js";
import type { MemBrain } from "./mem-brain.js";
import type { WikiEngine } from "./wiki-engine.js";

// ─── Compile Job — raw/ → wiki/ ───────────────────────────────────────────────

export interface CompileJobPayload {
  sourceType: string; // e.g. "session-log", "research", "meeting-notes"
  sourceRef: string; // file path or URL
  rawContent: string;
  agent: AgentCallsign;
  options?: {
    extractEntities?: boolean;
    autoLink?: boolean;
    chunkSize?: number;
  };
}

export function registerCompileJob(queue: JobQueue, wiki: WikiEngine): void {
  queue.register("compile", async (payload: Record<string, unknown>) => {
    const data = payload as unknown as CompileJobPayload;

    // Parse raw content into structured pages
    const pages = parseRawContent(data.rawContent, data.sourceType);

    // Ingest into wiki
    const result = await wiki.ingest(data.sourceType, data.sourceRef, pages);

    // Auto-link if enabled
    if (data.options?.autoLink !== false) {
      for (const slug of result.created) {
        await wiki.autoLinkPage(slug);
      }
    }

    return {
      pagesCreated: result.created.length,
      pagesUpdated: result.updated.length,
      linksCreated: result.links.length,
    };
  });
}

function parseRawContent(
  content: string,
  sourceType: string
): Array<{
  slug: string;
  type: Parameters<WikiEngine["ingest"]>[2][0]["type"];
  title: string;
  compiled_truth: string;
  confidence: number;
  sources: string[];
}> {
  // Simple markdown-based parsing
  const pages: ReturnType<typeof parseRawContent> = [];
  const sections = content.split(/^#{2,3}\s+/m);

  for (const section of sections) {
    if (!section.trim()) {
      continue;
    }
    const lines = section.split("\n");
    const title = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();

    if (!title || !body) {
      continue;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const type = inferPageType(title, body, sourceType);

    pages.push({
      slug,
      type,
      title,
      compiled_truth: body,
      confidence: sourceType === "research" ? 0.7 : 0.5,
      sources: [sourceType],
    });
  }

  return pages;
}

function inferPageType(
  title: string,
  _body: string,
  sourceType: string
): Parameters<WikiEngine["ingest"]>[2][0]["type"] {
  const lower = title.toLowerCase();

  if (sourceType === "meeting-notes") {
    return "meeting";
  }
  if (sourceType === "research") {
    return "concept";
  }

  if (lower.includes("agent") || lower.includes("bot")) {
    return "agent";
  }
  if (lower.includes("service") || lower.includes("api")) {
    return "service";
  }
  if (lower.includes("project") || lower.includes("initiative")) {
    return "project";
  }
  if (lower.includes("person") || lower.includes("user") || lower.includes("team")) {
    return "person";
  }
  if (lower.includes("system") || lower.includes("architecture")) {
    return "system";
  }
  if (lower.includes("decision") || lower.includes("adr")) {
    return "document";
  }

  return "concept";
}

// ─── Lint Job — vault integrity checker ───────────────────────────────────────

export interface LintJobPayload {
  fix?: boolean; // Auto-fix where possible
  notifyAgents?: AgentCallsign[];
}

export function registerLintJob(queue: JobQueue, wiki: WikiEngine, memBrain: MemBrain): void {
  queue.register("lint", async (payload: Record<string, unknown>) => {
    const data = payload as LintJobPayload;
    const report = await wiki.lint();

    // Calculate health score
    const totalPages = (await wiki.listPages()).length;
    const issueCount =
      report.contradictions.length +
      report.stalePages.length +
      report.orphans.length +
      report.brokenLinks.length +
      report.lowConfidence.length;

    const healthScore = totalPages > 0 ? Math.max(0, 100 - (issueCount / totalPages) * 100) : 100;

    // Auto-fix orphans by linking from index
    if (data.fix && report.orphans.length > 0) {
      for (const orphan of report.orphans) {
        // Create a generic reference from a system page if one exists
        const systemPages = await wiki.listPages();
        const indexPage = systemPages.find((p) => p.slug === "index" || p.slug === "home");
        if (indexPage && indexPage.slug !== orphan.slug) {
          await wiki.createLink(indexPage.slug, orphan.slug, "references", "Auto-linked by lint");
        }
      }
    }

    // Log to timeline
    await memBrain.logEvent(
      "lint_run",
      "ORACLE",
      `Lint complete: ${issueCount} issues, health score ${healthScore.toFixed(1)}`,
      {
        healthScore,
        issueCount,
        contradictions: report.contradictions.length,
        stalePages: report.stalePages.length,
        orphans: report.orphans.length,
        brokenLinks: report.brokenLinks.length,
        lowConfidence: report.lowConfidence.length,
      }
    );

    return { ...report, healthScore };
  });
}

// ─── Flush Job — session log → wiki extraction ────────────────────────────────

export interface FlushJobPayload {
  sessionId: string;
  agent: AgentCallsign;
  sessionLog: string;
  extractDecisions?: boolean;
  extractLessons?: boolean;
  extractPeople?: boolean;
}

export function registerFlushJob(queue: JobQueue, wiki: WikiEngine, memBrain: MemBrain): void {
  queue.register("flush", async (payload: Record<string, unknown>) => {
    const data = payload as unknown as FlushJobPayload;
    const extracted = extractFromSessionLog(data.sessionLog);

    // Create wiki pages for extracted knowledge
    const pages: Array<{
      slug: string;
      type: Parameters<WikiEngine["ingest"]>[2][0]["type"];
      title: string;
      compiled_truth: string;
      confidence: number;
      sources: string[];
    }> = [];

    for (const decision of extracted.decisions) {
      pages.push({
        slug: `decision-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: "document",
        title: `Decision: ${decision.slice(0, 80)}`,
        compiled_truth: decision,
        confidence: 0.7,
        sources: [data.sessionId],
      });
    }

    for (const lesson of extracted.lessons) {
      pages.push({
        slug: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: "concept",
        title: `Lesson: ${lesson.slice(0, 80)}`,
        compiled_truth: lesson,
        confidence: 0.6,
        sources: [data.sessionId],
      });
    }

    for (const person of extracted.people) {
      pages.push({
        slug: person.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: "person",
        title: person,
        compiled_truth: `Mentioned in session ${data.sessionId} by ${data.agent}.`,
        confidence: 0.5,
        sources: [data.sessionId],
      });
    }

    const result = await wiki.ingest("session-flush", data.sessionId, pages);

    // Log to timeline
    await memBrain.logEvent(
      "compile_run",
      data.agent,
      `Flushed session ${data.sessionId}: ${result.created.length} pages created`,
      { sessionId: data.sessionId, pagesCreated: result.created.length }
    );

    return {
      decisionsExtracted: extracted.decisions.length,
      lessonsExtracted: extracted.lessons.length,
      peopleExtracted: extracted.people.length,
      pagesCreated: result.created.length,
    };
  });
}

function extractFromSessionLog(log: string): {
  decisions: string[];
  lessons: string[];
  people: string[];
} {
  const decisions: string[] = [];
  const lessons: string[] = [];
  const people: string[] = [];

  // Extract decisions (patterns like "Decided:", "Decision:", "We agreed:")
  const decisionPatterns = /(?:decided|decision|we agreed|concluded|resolved):\s*([^\n]+)/gi;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = decisionPatterns.exec(log)) !== null) {
    decisions.push(match[1].trim());
  }

  // Extract lessons (patterns like "Lesson:", "Learned:", "Takeaway:")
  const lessonPatterns = /(?:lesson|learned|takeaway|insight|realization):\s*([^\n]+)/gi;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = lessonPatterns.exec(log)) !== null) {
    lessons.push(match[1].trim());
  }

  // Extract people mentions (capitalized names, 2-3 words)
  const peoplePattern = /\b([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g;
  const seen = new Set<string>();
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = peoplePattern.exec(log)) !== null) {
    const name = match[1].trim();
    if (!seen.has(name) && name.length > 3) {
      seen.add(name);
      people.push(name);
    }
  }

  return { decisions, lessons, people };
}

// ─── Compact Job — end-of-session memory compression ──────────────────────────

export interface CompactJobPayload {
  sessionId: string;
  agent: AgentCallsign;
  decisions: string[];
  blockers: string[];
  lessons: string[];
  nextSteps: string[];
}

export function registerCompactJob(queue: JobQueue, memBrain: MemBrain): void {
  queue.register("compact", async (payload: Record<string, unknown>) => {
    const data = payload as unknown as CompactJobPayload;

    // Use OracleSubstrate if available, otherwise manual compact
    const result = await memBrain.wiki.crystallize(data.sessionId, {
      question: `Session ${data.sessionId} compact`,
      findings: data.decisions.join("\n\n"),
      filesInvolved: [],
      lessons: data.lessons,
    });

    // Create patterns from blockers
    for (const _blocker of data.blockers) {
      const embedding = new Array(1536).fill(0); // Placeholder
      await memBrain.searchPatterns(embedding, 1); // Just to access db
      // In production, create actual pattern records
    }

    // Log completion
    await memBrain.logEvent("session_end", data.agent, `Session ${data.sessionId} compacted`, {
      sessionId: data.sessionId,
      decisions: data.decisions.length,
      blockers: data.blockers.length,
      lessons: data.lessons.length,
      nextSteps: data.nextSteps.length,
    });

    return {
      crystallized: !!result,
      decisionsArchived: data.decisions.length,
      blockersFlagged: data.blockers.length,
    };
  });
}

// ─── Orchestrator — register all automation jobs ──────────────────────────────

export function registerAllAutomationJobs(
  queue: JobQueue,
  wiki: WikiEngine,
  memBrain: MemBrain
): void {
  registerCompileJob(queue, wiki);
  registerLintJob(queue, wiki, memBrain);
  registerFlushJob(queue, wiki, memBrain);
  registerCompactJob(queue, memBrain);
}
