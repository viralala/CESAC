/**
 * The social routes in.
 *
 * Constants only, and deliberately free of `server-only`: the sign-in panel is
 * a client component and needs the labels. Which of these is actually switched
 * on is a server question, answered by authMethods in ./methods.
 */
export const PROVIDERS = ["google", "github", "facebook"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABEL: Record<Provider, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
};
