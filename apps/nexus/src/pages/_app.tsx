import type { AppProps } from "next/app";
import { Shell } from "../components/Shell";
import "../index.css";

export default function NexusApp({ Component, pageProps }: AppProps) {
  return (
    <Shell>
      <Component {...pageProps} />
    </Shell>
  );
}
