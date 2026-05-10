import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "ebia",
  clientId: "ebia-web",
});

export const initKeycloak = () =>
  keycloak.init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });

export const getRole = (): "listener" | "artist" | "admin" | null => {
  if (!keycloak.tokenParsed) return null;
  const roles: string[] = (keycloak.tokenParsed as any).realm_access?.roles ?? [];
  if (roles.includes("admin")) return "admin";
  if (roles.includes("artist")) return "artist";
  if (roles.includes("listener")) return "listener";
  return null;
};

export const getCurrentUser = () => {
  if (!keycloak.authenticated || !keycloak.tokenParsed) return null;
  const p = keycloak.tokenParsed as any;
  return {
    id: p.sub as string,
    email: p.email as string,
    displayName: (p.name ?? p.preferred_username) as string,
    avatarUrl: p.picture as string | undefined,
    role: getRole(),
  };
};

export default keycloak;
