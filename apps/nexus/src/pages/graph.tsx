import dynamic from "next/dynamic";

const GraphView = dynamic(() => import("../views/GraphView").then((m) => m.GraphView), {
  ssr: false,
  loading: () => <div className="aig-loading">Loading graph…</div>,
});

export default function Page() {
  return <GraphView />;
}
