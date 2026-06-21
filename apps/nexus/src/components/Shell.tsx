import { useRouter } from "next/router";
import { useEffect } from "react";
import {
  loadAllRepoWikiPages,
  loadProjectsManifest,
  loadRepoMeta,
  loadRepoTree,
} from "../data/gitnexus";
import { checkBackend } from "../services/backend-client";
import { useNexusStore } from "../store";
import { Canvas } from "./Canvas";
import { ChatPanel } from "./ChatPanel";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setMeta = useNexusStore((s) => s.setMeta);
  const setTree = useNexusStore((s) => s.setTree);
  const setPages = useNexusStore((s) => s.setPages);
  const setLoading = useNexusStore((s) => s.setLoading);
  const setError = useNexusStore((s) => s.setError);
  const setBackend = useNexusStore((s) => s.setBackend);
  const setProjects = useNexusStore((s) => s.setProjects);
  const setCurrentRepo = useNexusStore((s) => s.setCurrentRepo);
  const setDataSource = useNexusStore((s) => s.setDataSource);
  const currentRepo = useNexusStore((s) => s.currentRepo);
  const chatOpen = useNexusStore((s) => s.chatOpen);

  // Initial boot: load manifest, check backend, pick initial repo.
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    let mounted = true;
    setLoading(true);

    Promise.all([loadProjectsManifest(), checkBackend()])
      .then(([manifest, backendStatus]) => {
        if (!mounted) {
          return;
        }

        const available = manifest.projects.filter((p) => p.hasData);
        setProjects(available);

        setBackend({
          online: backendStatus.online,
          version: backendStatus.version,
          lastChecked: Date.now(),
        });
        setDataSource(process.env.NEXT_PUBLIC_REPOATLAS_API_URL ? "backend" : "static");

        const repoFromUrl = typeof router.query.repo === "string" ? router.query.repo : null;
        const repo =
          (repoFromUrl && available.some((p) => p.id === repoFromUrl) ? repoFromUrl : null) ??
          currentRepo ??
          available[0]?.id ??
          null;

        if (repo) {
          setCurrentRepo(repo);
        } else {
          setLoading(false);
          router.push("/projects");
        }
      })
      .catch((err: unknown) => {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [
    router.isReady,
    router.push,
    router.query.repo,
    currentRepo,
    setProjects,
    setBackend,
    setDataSource,
    setCurrentRepo,
    setLoading,
    setError,
  ]);

  // Load project data whenever the active repo or data source changes.
  useEffect(() => {
    if (!currentRepo) {
      setMeta(null);
      setTree(null);
      setPages([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setMeta(null);
    setTree(null);
    setPages([]);
    setError(null);

    Promise.all([
      loadRepoMeta(currentRepo),
      loadRepoTree(currentRepo),
      loadAllRepoWikiPages(currentRepo),
    ])
      .then(([meta, tree, pages]) => {
        if (!mounted) {
          return;
        }
        setMeta(meta);
        setTree(tree);
        setPages(pages);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentRepo, setMeta, setTree, setPages, setLoading, setError]);

  return (
    <div className="aig-app">
      <Canvas />
      <Sidebar />
      <div className="aig-app__main">
        <TopBar />
        <main className="aig-app__content">{children}</main>
        <StatusBar />
      </div>
      {chatOpen && <ChatPanel />}

      <style>{`
        .aig-app {
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .aig-app__main {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 5;
        }
        .aig-app__content {
          position: relative;
          flex: 1;
          overflow: auto;
          padding: 24px 32px;
          z-index: 5;
        }
      `}</style>
    </div>
  );
}
