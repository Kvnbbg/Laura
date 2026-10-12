/**
 * Un garde qui crie au loup en permanence ne garde plus rien.
 *
 * La règle `public-local-or-private-origin` échouait à CHAQUE exécution sur
 * `http://localhost` — la base de repli que react-router inline dans tout
 * bundle lorsque `location.origin` vaut la chaîne « null ». Le scan était donc
 * rouge en continu, et un scan toujours rouge cesse d'être lu : c'est alors la
 * vraie fuite qui passe.
 *
 * Affiner une règle de sécurité est délicat — on affaiblit vite ce qu'on
 * voulait préciser. Ces cas fixent la frontière dans les deux sens : ce qui
 * doit encore être attrapé, et ce qui ne doit plus l'être.
 */
import { describe, expect, it } from "vitest";

/** Copie de la règle affinée (scripts/security-scan.mjs). */
const ORIGINE_LOCALE =
  /(localhost[:/][\w-]|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d{1,3}\.\d|10\.0\.\d{1,3}\.\d|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d|\/home\/[a-z]|file:\/\/\/)/;

describe("public-local-or-private-origin — ce qui doit être attrapé", () => {
  it.each([
    ["une API de développement", 'const API="http://localhost:5173/api";'],
    ["localhost avec chemin", 'fetch("http://localhost/api/admin")'],
    ["une IP privée 192.168", 'fetch("http://192.168.1.42/admin")'],
    ["une IP privée 10.0", 'const h="http://10.0.0.5:9000"'],
    ["une IP privée 172.16-31", 'const h="http://172.20.10.3/x"'],
    ["la boucle locale", 'const H="http://127.0.0.1:8080";'],
    ["l'adresse d'écoute", 'listen("0.0.0.0")'],
    ["un chemin absolu de développeur", 'const p="/home/kevin/secret.env";'],
    ["un fichier local", 'src="file:///etc/passwd"'],
  ])("%s", (_nom, ligne) => {
    expect(ORIGINE_LOCALE.test(ligne), ligne).toBe(true);
  });
});

describe("public-local-or-private-origin — ce qui ne doit plus l'être", () => {
  it.each([
    ["le repli de react-router", 'let s="http://localhost";e&&(s=e.location.origin'],
    ["une version 10.0.x", 'const v="10.0.1"'],
    ["un texte parlant de localhost", "// remplacez localhost par votre domaine"],
  ])("%s", (_nom, ligne) => {
    expect(ORIGINE_LOCALE.test(ligne), ligne).toBe(false);
  });
});

describe("la règle du dépôt et celle testée ici ne divergent pas", () => {
  it("scripts/security-scan.mjs porte bien ce motif", async () => {
    // Deux copies d'une même règle finissent par diverger ; ce test échoue si
    // l'une bouge sans l'autre.
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("scripts/security-scan.mjs", "utf8");
    expect(source).toContain(ORIGINE_LOCALE.source);
  });
});
