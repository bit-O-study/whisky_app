import "server-only";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export const LOTTEON_INGEST_AUDIENCE = "https://whisky-app-vert.vercel.app/api/internal/lotteon-ingest";
const issuer = "https://token.actions.githubusercontent.com";
const workflow = "bit-O-study/whisky_app/.github/workflows/lotteon-daily.yml@refs/heads/main";

export function createGitHubActionsVerifier(key: JWTVerifyGetKey) {
  return async (authorization: string | null) => {
    if (!authorization?.startsWith("Bearer ")) throw new Error("Missing workflow identity");
    const { payload } = await jwtVerify(authorization.slice(7), key, {
      issuer, audience: LOTTEON_INGEST_AUDIENCE, algorithms: ["RS256"], maxTokenAge: "5m",
      requiredClaims: ["exp", "iat", "nbf", "repository_id", "repository", "ref", "workflow_ref", "event_name", "run_id"],
    });
    if (payload.repository_id !== "1249660635" || payload.repository !== "bit-O-study/whisky_app" ||
        payload.ref !== "refs/heads/main" || payload.workflow_ref !== workflow ||
        !["schedule", "workflow_dispatch"].includes(String(payload.event_name))) {
      throw new Error("Workflow identity is not allowed");
    }
    return payload;
  };
}

export const verifyLotteonWorkflow = createGitHubActionsVerifier(
  createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`)),
);
