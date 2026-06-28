import "server-only";

import { revalidatePath } from "next/cache";

const publicOfferPaths = [
  "/",
  "/platforms/chatgpt",
  "/platforms/claude",
  "/platforms/gemini",
  "/platforms/api",
  "/channels",
  "/about",
  "/sitemap.xml",
] as const;

export function revalidatePublicOfferPaths(): void {
  for (const path of publicOfferPaths) {
    revalidatePath(path);
  }
  revalidatePath("/products/[id]", "page");
}
