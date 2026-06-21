import { useRouter } from "next/router";
import { WikiView } from "../../views/WikiView";

export default function Page() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : undefined;
  return <WikiView slug={slug} />;
}
