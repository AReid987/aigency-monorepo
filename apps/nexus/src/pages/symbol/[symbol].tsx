import { SymbolContextView } from "../../views/SymbolContextView";

export default function Page() {
  return <SymbolContextView />;
}

export function getStaticPaths() {
  // Symbols are backend-only and not known at build time.
  return {
    paths: [],
    fallback: false,
  };
}

export function getStaticProps() {
  return { props: {} };
}
