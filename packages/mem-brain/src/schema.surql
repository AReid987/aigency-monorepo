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
