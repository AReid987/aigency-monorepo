-- LLM-Wiki v2 Schema for SurrealDB 3.0
-- Mirrors the types in @aigency/surreal and the gbrain Postgres schema
-- Apply with: surreal import --conn http://localhost:8000 --user root --pass root --ns aigency --db mem_brain schema.surql

DEFINE NAMESPACE aigency;
USE NS aigency;
DEFINE DATABASE mem_brain;
USE DB mem_brain;

-- Full-text analyzer for wiki search
DEFINE ANALYZER wiki_standard TOKENIZERS blank,class FILTERS lowercase,snowball(english);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: wiki_page — canonical knowledge pages (compiled truth + timeline)
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE wiki_page SCHEMAFULL;

DEFINE FIELD slug        ON wiki_page TYPE string   ASSERT $value != NONE;
DEFINE FIELD source      ON wiki_page TYPE string   DEFAULT "aigency-wiki";
DEFINE FIELD type        ON wiki_page TYPE string   ASSERT $value IN ["person", "agent", "service", "package", "system", "concept", "document", "meeting", "project", "idea"];
DEFINE FIELD title       ON wiki_page TYPE string   ASSERT $value != NONE;
DEFINE FIELD compiled_truth ON wiki_page TYPE string DEFAULT "";
DEFINE FIELD timeline    ON wiki_page TYPE string   DEFAULT "";
DEFINE FIELD frontmatter ON wiki_page TYPE object   DEFAULT {};
DEFINE FIELD confidence  ON wiki_page TYPE float    DEFAULT 0.5 ASSERT $value >= 0.0 AND $value <= 1.0;
DEFINE FIELD last_confirmed ON wiki_page TYPE string;
DEFINE FIELD sources     ON wiki_page TYPE array    DEFAULT [];
DEFINE FIELD supersedes  ON wiki_page TYPE option<string>;
DEFINE FIELD status      ON wiki_page TYPE string   DEFAULT "active" ASSERT $value IN ["active", "dormant", "archived"];
DEFINE FIELD search_vector ON wiki_page TYPE option<string>;
DEFINE FIELD created_at  ON wiki_page TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at  ON wiki_page TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX wiki_page_slug    ON wiki_page FIELDS slug, source UNIQUE;
DEFINE INDEX wiki_page_type    ON wiki_page FIELDS type;
DEFINE INDEX wiki_page_status  ON wiki_page FIELDS status;
DEFINE INDEX wiki_page_confidence ON wiki_page FIELDS confidence;
DEFINE INDEX wiki_page_ft      ON wiki_page FIELDS title, compiled_truth SEARCH ANALYZER wiki_standard BM25;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: wiki_chunk — semantic chunks for vector search
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE wiki_chunk SCHEMAFULL;

DEFINE FIELD page_id     ON wiki_chunk TYPE record<wiki_page> ASSERT $value != NONE;
DEFINE FIELD chunk_index ON wiki_chunk TYPE int      ASSERT $value >= 0;
DEFINE FIELD chunk_text  ON wiki_chunk TYPE string   ASSERT $value != NONE;
DEFINE FIELD chunk_source ON wiki_chunk TYPE string  ASSERT $value IN ["compiled_truth", "timeline"];
DEFINE FIELD embedding   ON wiki_chunk TYPE array;    -- float[] for vector similarity
DEFINE FIELD token_count ON wiki_chunk TYPE int      DEFAULT 0;
DEFINE FIELD embedded_at ON wiki_chunk TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX wiki_chunk_page   ON wiki_chunk FIELDS page_id;
DEFINE INDEX wiki_chunk_vector ON wiki_chunk FIELDS embedding MTREE DIMENSION 1536 DISTANCE COSINE;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: wiki_link — typed graph edges between pages
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE wiki_link SCHEMAFULL;

DEFINE FIELD from_page_id ON wiki_link TYPE record<wiki_page> ASSERT $value != NONE;
DEFINE FIELD to_page_id   ON wiki_link TYPE record<wiki_page> ASSERT $value != NONE;
DEFINE FIELD link_type    ON wiki_link TYPE string   ASSERT $value IN ["uses", "depends_on", "owns", "reports_to", "supersedes", "contradicts", "emits", "subscribes_to", "references", "informed_by", "involves"];
DEFINE FIELD context      ON wiki_link TYPE option<string>;
DEFINE FIELD created_at   ON wiki_link TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX wiki_link_from   ON wiki_link FIELDS from_page_id;
DEFINE INDEX wiki_link_to     ON wiki_link FIELDS to_page_id;
DEFINE INDEX wiki_link_type   ON wiki_link FIELDS link_type;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: wiki_timeline_entry — structured timeline events per page
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE wiki_timeline_entry SCHEMAFULL;

DEFINE FIELD page_id    ON wiki_timeline_entry TYPE record<wiki_page> ASSERT $value != NONE;
DEFINE FIELD date       ON wiki_timeline_entry TYPE string   ASSERT $value != NONE;
DEFINE FIELD source     ON wiki_timeline_entry TYPE string   ASSERT $value != NONE;
DEFINE FIELD summary    ON wiki_timeline_entry TYPE string   ASSERT $value != NONE;
DEFINE FIELD detail     ON wiki_timeline_entry TYPE option<string>;

-- Indexes
DEFINE INDEX wiki_timeline_page ON wiki_timeline_entry FIELDS page_id;
DEFINE INDEX wiki_timeline_date ON wiki_timeline_entry FIELDS date;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: wiki_ingest_log — audit trail of all ingest operations
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE wiki_ingest_log SCHEMAFULL;

DEFINE FIELD source_type   ON wiki_ingest_log TYPE string   ASSERT $value != NONE;
DEFINE FIELD source_ref    ON wiki_ingest_log TYPE string   ASSERT $value != NONE;
DEFINE FIELD pages_updated ON wiki_ingest_log TYPE array    DEFAULT [];
DEFINE FIELD summary       ON wiki_ingest_log TYPE string   ASSERT $value != NONE;
DEFINE FIELD created_at    ON wiki_ingest_log TYPE datetime DEFAULT time::now();

-- ───────────────────────────────────────────────────────────────────────────────
-- Functions: Hybrid Search with RRF Fusion
-- ───────────────────────────────────────────────────────────────────────────────

DEFINE FUNCTION fn::wiki_search_hybrid($query_vec: array, $query_text: string, $limit: int, $source: string) {
  -- Vector search results
  LET $vector_results = (
    SELECT id, page_id, chunk_text, vector::similarity::cosine(embedding, $query_vec) AS score
    FROM wiki_chunk
    WHERE vector::similarity::cosine(embedding, $query_vec) > 0.7
    ORDER BY score DESC
    LIMIT $limit * 2
  );

  -- Keyword search results via BM25 on wiki_page
  LET $keyword_results = (
    SELECT id, slug, title, compiled_truth, search::score(+id) AS score
    FROM wiki_page
    WHERE source = $source AND (title @@ $query_text OR compiled_truth @@ $query_text)
    ORDER BY score DESC
    LIMIT $limit * 2
  );

  -- Return both for client-side RRF fusion
  RETURN {
    vector: $vector_results,
    keyword: $keyword_results
  };
};

-- ───────────────────────────────────────────────────────────────────────────────
-- Functions: Confidence Decay
-- ───────────────────────────────────────────────────────────────────────────────

DEFINE FUNCTION fn::wiki_decay_confidence($page_id: record) {
  LET $page = (SELECT confidence, last_confirmed, updated_at FROM wiki_page WHERE id = $page_id)[0];
  LET $months_old = math::floor((time::now() - time::parse($page.last_confirmed ?? $page.updated_at, "RFC3339")) / 30d);
  LET $new_confidence = math::max(0.1, $page.confidence - ($months_old * 0.1));

  UPDATE wiki_page SET confidence = $new_confidence WHERE id = $page_id;
  RETURN $new_confidence;
};

-- ───────────────────────────────────────────────────────────────────────────────
-- Functions: Graph Traversal
-- ───────────────────────────────────────────────────────────────────────────────

DEFINE FUNCTION fn::wiki_graph_neighborhood($page_id: record, $depth: int) {
  RETURN (
    SELECT id, slug, title, type, confidence,
      ->wiki_link->wiki_page.* AS outgoing,
      <-wiki_link<-wiki_page.* AS incoming
    FROM wiki_page
    WHERE id = $page_id
    LIMIT 1
  );
};

-- ═══════════════════════════════════════════════════════════════════════════════
-- ORIGINAL ORACLE RUNTIME SCHEMA (Aigency Core Mem_Brain v1)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: agent — persona memory block
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE agent SCHEMAFULL;

DEFINE FIELD callsign      ON agent TYPE string   ASSERT $value != NONE;
DEFINE FIELD name          ON agent TYPE string   ASSERT $value != NONE;
DEFINE FIELD role          ON agent TYPE string   ASSERT $value != NONE;
DEFINE FIELD color         ON agent TYPE string   ASSERT $value != NONE;
DEFINE FIELD substrate     ON agent TYPE string   ASSERT $value != NONE;
DEFINE FIELD status        ON agent TYPE string   DEFAULT "standby" ASSERT $value IN ["active", "standby", "offline", "dreaming"];
DEFINE FIELD current_focus ON agent TYPE option<string>;
DEFINE FIELD soul_hash     ON agent TYPE string   ASSERT $value != NONE;
DEFINE FIELD created_at    ON agent TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at    ON agent TYPE datetime DEFAULT time::now();

DEFINE INDEX agent_callsign ON agent FIELDS callsign UNIQUE;
DEFINE INDEX agent_status   ON agent FIELDS status;
DEFINE INDEX agent_ft       ON agent FIELDS callsign, name, role SEARCH ANALYZER wiki_standard BM25;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: peer — user/stakeholder profiles (synced from Honcho)
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE peer SCHEMAFULL;

DEFINE FIELD handle             ON peer TYPE string   ASSERT $value != NONE;
DEFINE FIELD name               ON peer TYPE string   ASSERT $value != NONE;
DEFINE FIELD relationship       ON peer TYPE string   DEFAULT "colleague" ASSERT $value IN ["colleague", "client", "advisor", "stakeholder", "contractor"];
DEFINE FIELD interaction_count  ON peer TYPE int      DEFAULT 0;
DEFINE FIELD tags               ON peer TYPE array    DEFAULT [];
DEFINE FIELD last_interaction   ON peer TYPE option<datetime>;
DEFINE FIELD metadata           ON peer TYPE object   DEFAULT {};
DEFINE FIELD created_at         ON peer TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at         ON peer TYPE datetime DEFAULT time::now();

DEFINE INDEX peer_handle ON peer FIELDS handle UNIQUE;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: directive — active memory directives
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE directive SCHEMAFULL;

DEFINE FIELD title        ON directive TYPE string   ASSERT $value != NONE;
DEFINE FIELD body         ON directive TYPE string   ASSERT $value != NONE;
DEFINE FIELD status       ON directive TYPE string   DEFAULT "active" ASSERT $value IN ["active", "pending", "completed", "superseded"];
DEFINE FIELD priority     ON directive TYPE string   DEFAULT "medium" ASSERT $value IN ["critical", "high", "medium", "low"];
DEFINE FIELD owner        ON directive TYPE string   ASSERT $value != NONE;
DEFINE FIELD tags         ON directive TYPE array    DEFAULT [];
DEFINE FIELD due_at       ON directive TYPE option<datetime>;
DEFINE FIELD completed_at ON directive TYPE option<datetime>;
DEFINE FIELD created_at   ON directive TYPE datetime DEFAULT time::now();

DEFINE INDEX directive_status   ON directive FIELDS status;
DEFINE INDEX directive_priority ON directive FIELDS priority;
DEFINE INDEX directive_owner    ON directive FIELDS owner;
DEFINE INDEX directive_ft       ON directive FIELDS title, body SEARCH ANALYZER wiki_standard BM25;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: pattern — learned behaviors with vector embeddings
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE pattern SCHEMAFULL;

DEFINE FIELD title            ON pattern TYPE string   ASSERT $value != NONE;
DEFINE FIELD body             ON pattern TYPE string   ASSERT $value != NONE;
DEFINE FIELD category         ON pattern TYPE string   ASSERT $value IN ["decision", "behavior", "anti-pattern", "process"];
DEFINE FIELD confidence       ON pattern TYPE float    DEFAULT 0.5 ASSERT $value >= 0.0 AND $value <= 1.0;
DEFINE FIELD source_agent     ON pattern TYPE string   ASSERT $value != NONE;
DEFINE FIELD embedding        ON pattern TYPE array;
DEFINE FIELD occurrence_count ON pattern TYPE int      DEFAULT 1;
DEFINE FIELD first_seen       ON pattern TYPE datetime DEFAULT time::now();
DEFINE FIELD last_seen        ON pattern TYPE datetime DEFAULT time::now();

DEFINE INDEX pattern_category   ON pattern FIELDS category;
DEFINE INDEX pattern_confidence ON pattern FIELDS confidence;
DEFINE INDEX pattern_vector     ON pattern FIELDS embedding MTREE DIMENSION 1536 DISTANCE COSINE;
DEFINE INDEX pattern_ft         ON pattern FIELDS title, body SEARCH ANALYZER wiki_standard BM25;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: timeline — temporal event log
-- ───────────────────────────────────────────────────────────────────────────────
DEFINE TABLE timeline SCHEMAFULL;

DEFINE FIELD event_type  ON timeline TYPE string   ASSERT $value IN ["session_start", "session_end", "directive_created", "directive_completed", "pattern_detected", "lint_run", "compile_run", "graft_harvested", "agent_status_change", "memory_created", "memory_recall"];
DEFINE FIELD agent       ON timeline TYPE string   ASSERT $value != NONE;
DEFINE FIELD summary     ON timeline TYPE string   ASSERT $value != NONE;
DEFINE FIELD metadata    ON timeline TYPE object   DEFAULT {};
DEFINE FIELD created_at  ON timeline TYPE datetime DEFAULT time::now();

DEFINE INDEX timeline_event_type ON timeline FIELDS event_type;
DEFINE INDEX timeline_agent      ON timeline FIELDS agent;
DEFINE INDEX timeline_created    ON timeline FIELDS created_at;

-- ───────────────────────────────────────────────────────────────────────────────
-- Graph Edges
-- ───────────────────────────────────────────────────────────────────────────────

DEFINE TABLE decided_by SCHEMAFULL TYPE RELATION IN directive OUT agent;
DEFINE FIELD context    ON decided_by TYPE option<string>;
DEFINE FIELD decided_at ON decided_by TYPE datetime DEFAULT time::now();

DEFINE TABLE informed_by SCHEMAFULL TYPE RELATION IN directive OUT pattern;
DEFINE FIELD confidence  ON informed_by TYPE float DEFAULT 0.5;

DEFINE TABLE involves SCHEMAFULL TYPE RELATION IN directive OUT peer;
DEFINE FIELD role       ON involves TYPE option<string>;

DEFINE TABLE references SCHEMAFULL TYPE RELATION IN wiki_page OUT wiki_page;
DEFINE FIELD context    ON references TYPE option<string>;
DEFINE FIELD weight     ON references TYPE float DEFAULT 1.0;

DEFINE TABLE supersedes SCHEMAFULL TYPE RELATION IN directive OUT directive;
DEFINE FIELD reason     ON supersedes TYPE option<string>;
DEFINE FIELD superseded_at ON supersedes TYPE datetime DEFAULT time::now();

DEFINE TABLE generated SCHEMAFULL TYPE RELATION IN timeline OUT agent;
DEFINE FIELD tool       ON generated TYPE option<string>;

-- ───────────────────────────────────────────────────────────────────────────────
-- Agent Memory Sidecar (OB1-style governance)
-- ───────────────────────────────────────────────────────────────────────────────

DEFINE TABLE agent_memory SCHEMAFULL;

DEFINE FIELD agent                       ON agent_memory TYPE string   ASSERT $value != NONE;
DEFINE FIELD content                     ON agent_memory TYPE string   ASSERT $value != NONE;
DEFINE FIELD provenance                  ON agent_memory TYPE string   DEFAULT "generated" ASSERT $value IN ["observed", "inferred", "user_confirmed", "imported", "generated"];
DEFINE FIELD lifecycle                   ON agent_memory TYPE string   DEFAULT "active" ASSERT $value IN ["active", "stale", "superseded", "disputed", "rejected"];
DEFINE FIELD review_status               ON agent_memory TYPE string   DEFAULT "pending" ASSERT $value IN ["pending", "confirmed", "evidence_only", "restricted", "rejected"];
DEFINE FIELD confidence                  ON agent_memory TYPE float    DEFAULT 0.5 ASSERT $value >= 0.0 AND $value <= 1.0;
DEFINE FIELD can_use_as_instruction      ON agent_memory TYPE bool     DEFAULT false;
DEFINE FIELD can_use_as_evidence         ON agent_memory TYPE bool     DEFAULT true;
DEFINE FIELD requires_user_confirmation  ON agent_memory TYPE bool     DEFAULT true;
DEFINE FIELD embedding                   ON agent_memory TYPE array;
DEFINE FIELD source_refs                 ON agent_memory TYPE array    DEFAULT [];
DEFINE FIELD metadata                    ON agent_memory TYPE object   DEFAULT {};
DEFINE FIELD created_at                  ON agent_memory TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at                  ON agent_memory TYPE datetime DEFAULT time::now();

DEFINE INDEX agent_memory_agent       ON agent_memory FIELDS agent;
DEFINE INDEX agent_memory_lifecycle   ON agent_memory FIELDS lifecycle;
DEFINE INDEX agent_memory_provenance  ON agent_memory FIELDS provenance;
DEFINE INDEX agent_memory_vector      ON agent_memory FIELDS embedding MTREE DIMENSION 1536 DISTANCE COSINE;

DEFINE TABLE agent_memory_relation SCHEMAFULL TYPE RELATION IN agent_memory OUT agent_memory;
DEFINE FIELD relation_type ON agent_memory_relation TYPE string ASSERT $value IN ["supersedes", "conflicts", "merges", "supports", "contradicts"];
DEFINE FIELD context       ON agent_memory_relation TYPE option<string>;

DEFINE TABLE agent_memory_recall_trace SCHEMAFULL;
DEFINE FIELD query_embedding    ON agent_memory_recall_trace TYPE array;
DEFINE FIELD query_text         ON agent_memory_recall_trace TYPE string;
DEFINE FIELD agent              ON agent_memory_recall_trace TYPE string;
DEFINE FIELD results_returned   ON agent_memory_recall_trace TYPE array DEFAULT [];
DEFINE FIELD results_used       ON agent_memory_recall_trace TYPE array DEFAULT [];
DEFINE FIELD results_ignored    ON agent_memory_recall_trace TYPE array DEFAULT [];
DEFINE FIELD latency_ms         ON agent_memory_recall_trace TYPE int DEFAULT 0;
DEFINE FIELD created_at         ON agent_memory_recall_trace TYPE datetime DEFAULT time::now();

-- ───────────────────────────────────────────────────────────────────────────────
-- LIVE Query Triggers (proactive memory alerts)
-- ───────────────────────────────────────────────────────────────────────────────

DEFINE FUNCTION fn::notify_pattern_recurrence($pattern_id: record) {
  LET $pattern = (SELECT * FROM pattern WHERE id = $pattern_id)[0];
  CREATE timeline SET
    event_type = "pattern_detected",
    agent = $pattern.source_agent,
    summary = string::concat("Pattern recurrence detected: ", $pattern.title),
    metadata = { pattern_id: $pattern_id, occurrence_count: $pattern.occurrence_count },
    created_at = time::now();
  RETURN $pattern;
};

DEFINE FUNCTION fn::notify_stale_directive($directive_id: record) {
  LET $directive = (SELECT * FROM directive WHERE id = $directive_id)[0];
  CREATE timeline SET
    event_type = "lint_run",
    agent = $directive.owner,
    summary = string::concat("Directive stale: ", $directive.title),
    metadata = { directive_id: $directive_id, status: $directive.status },
    created_at = time::now();
  RETURN $directive;
};

DEFINE FUNCTION fn::notify_agent_status_change($agent_id: record, $old_status: string, $new_status: string) {
  LET $agent = (SELECT * FROM agent WHERE id = $agent_id)[0];
  CREATE timeline SET
    event_type = "agent_status_change",
    agent = $agent.callsign,
    summary = string::concat("Agent ", $agent.callsign, " changed from ", $old_status, " to ", $new_status),
    metadata = { agent_id: $agent_id, old_status: $old_status, new_status: $new_status },
    created_at = time::now();
  RETURN $agent;
};

DEFINE FUNCTION fn::check_graft_readiness() {
  LET $lint_score = (SELECT count() FROM wiki_page WHERE status = "active" AND confidence > 0.85) / (SELECT count() FROM wiki_page);
  LET $wiki_density = (SELECT count() FROM wiki_page) / ((SELECT count() FROM wiki_page) + (SELECT count() FROM wiki_chunk));
  LET $vault_age = math::floor((time::now() - (SELECT min(created_at) FROM wiki_page)[0].min) / 1d);

  RETURN {
    lint_health_score: $lint_score,
    wiki_density: $wiki_density,
    vault_age_days: $vault_age,
    ready_for_harvest: $lint_score >= 0.85 AND $wiki_density >= 0.70 AND $vault_age >= 90
  };
};

-- ═══════════════════════════════════════════════════════════════════════════════
-- Job Queue Schema (Minions-style Postgres-native queue)
-- ═══════════════════════════════════════════════════════════════════════════════

DEFINE TABLE job SCHEMAFULL;

DEFINE FIELD job_type       ON job TYPE string   ASSERT $value != NONE;
DEFINE FIELD payload        ON job TYPE object   DEFAULT {};
DEFINE FIELD status         ON job TYPE string   DEFAULT "pending" ASSERT $value IN ["pending", "running", "complete", "failed", "cancelled"];
DEFINE FIELD priority       ON job TYPE int      DEFAULT 0;
DEFINE FIELD parent_id      ON job TYPE option<record<job>>;
DEFINE FIELD child_ids      ON job TYPE array    DEFAULT [];
DEFINE FIELD attempt_count  ON job TYPE int      DEFAULT 0;
DEFINE FIELD max_attempts   ON job TYPE int      DEFAULT 3;
DEFINE FIELD error_message  ON job TYPE option<string>;
DEFINE FIELD started_at     ON job TYPE option<datetime>;
DEFINE FIELD completed_at   ON job TYPE option<datetime>;
DEFINE FIELD created_at     ON job TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at     ON job TYPE datetime DEFAULT time::now();

DEFINE INDEX job_status     ON job FIELDS status;
DEFINE INDEX job_priority   ON job FIELDS priority;
DEFINE INDEX job_parent     ON job FIELDS parent_id;
DEFINE INDEX job_type       ON job FIELDS job_type;
