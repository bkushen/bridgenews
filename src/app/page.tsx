import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const REGION_ROUTES = {
  "sri-lanka": "/sri-lanka",
  australia: "/australia",
  international: "/international",
} as const;

export default async function HomePage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get("bridgenews_region")?.value as keyof typeof REGION_ROUTES | undefined;
  redirect(saved && REGION_ROUTES[saved] ? REGION_ROUTES[saved] : "/sri-lanka");
}
