import { env } from "cloudflare:workers";
import { getChatGPTUser, requireChatGPTUser } from "@/app/chatgpt-auth";

export async function isAdmin() {
  const user = await getChatGPTUser();
  const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(
    user && adminEmail && user.email.trim().toLowerCase() === adminEmail,
  );
}

export async function requireAdmin(returnTo = "/admin") {
  const user = await requireChatGPTUser(returnTo);
  const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  return {
    user,
    allowed: Boolean(
      adminEmail && user.email.trim().toLowerCase() === adminEmail,
    ),
  };
}
