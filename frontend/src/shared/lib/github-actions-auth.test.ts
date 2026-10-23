import { beforeAll, describe, expect, it } from "vitest";
import { generateKeyPair, SignJWT } from "jose";
import { createGitHubActionsVerifier, LOTTEON_INGEST_AUDIENCE } from "./github-actions-auth";

let pair: Awaited<ReturnType<typeof generateKeyPair>>;
beforeAll(async () => { pair = await generateKeyPair("RS256"); });
async function token(overrides: Record<string, unknown> = {}, audience = LOTTEON_INGEST_AUDIENCE) {
  return new SignJWT({ repository_id: "1249660635", repository: "bit-O-study/whisky_app",
    ref: "refs/heads/main", workflow_ref: "bit-O-study/whisky_app/.github/workflows/lotteon-daily.yml@refs/heads/main",
    event_name: "schedule", run_id: "123", ...overrides })
    .setProtectedHeader({ alg: "RS256" }).setIssuer("https://token.actions.githubusercontent.com")
    .setAudience(audience).setIssuedAt().setNotBefore("0s").setExpirationTime("5m").sign(pair.privateKey);
}
describe("daily workflow identity", () => {
  it.each(["schedule", "workflow_dispatch"])("accepts main %s", async event_name => {
    await expect(createGitHubActionsVerifier(async () => pair.publicKey)(`Bearer ${await token({ event_name })}`)).resolves.toBeTruthy();
  });
  it.each([{ repository_id: "other" }, { repository: "other/repo" }, { ref: "refs/pull/1/merge" },
    { event_name: "pull_request" }, { workflow_ref: "other.yml@refs/heads/main" }])("rejects another identity %j", async claims => {
    await expect(createGitHubActionsVerifier(async () => pair.publicKey)(`Bearer ${await token(claims)}`)).rejects.toThrow();
  });
  it("rejects missing auth, wrong audience and signature", async () => {
    const verify = createGitHubActionsVerifier(async () => pair.publicKey);
    await expect(verify(null)).rejects.toThrow();
    await expect(verify(`Bearer ${await token({}, "other")}`)).rejects.toThrow();
    const other = await generateKeyPair("RS256");
    await expect(createGitHubActionsVerifier(async () => other.publicKey)(`Bearer ${await token()}`)).rejects.toThrow();
  });
  it("rejects expired tokens and missing required claims", async () => {
    const expired = await new SignJWT({}).setProtectedHeader({ alg: "RS256" })
      .setIssuer("https://token.actions.githubusercontent.com").setAudience(LOTTEON_INGEST_AUDIENCE)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 600).setExpirationTime(Math.floor(Date.now() / 1000) - 1).sign(pair.privateKey);
    const verify = createGitHubActionsVerifier(async () => pair.publicKey);
    await expect(verify(`Bearer ${expired}`)).rejects.toThrow();
    await expect(verify(`Bearer ${await token({ run_id: undefined })}`)).rejects.toThrow();
  });
});
