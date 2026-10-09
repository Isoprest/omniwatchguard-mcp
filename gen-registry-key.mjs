// Genereaza o pereche noua de chei Ed25519 pentru MCP Registry
// (autentificare prin DNS pe domeniul omniwatchguard.com).
//
// - Cheia privata se salveaza in dosarul utilizatorului, IN AFARA proiectului:
//   %USERPROFILE%\mcp-registry-key.txt  (nu se urca niciodata pe GitHub)
// - Pe ecran se afiseaza doar valoarea publica, de pus in inregistrarea TXT din DNS.
import { generateKeyPairSync } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const out = join(homedir(), "mcp-registry-key.txt");
if (existsSync(out) && !process.argv.includes("--force")) {
  console.log(`Exista deja ${out}. Daca vrei totusi o cheie noua: node gen-registry-key.mjs --force`);
  process.exit(1);
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
const privateHex = Buffer.from(priv.d, "base64url").toString("hex");
const publicB64 = Buffer.from(pub.x, "base64url").toString("base64");

writeFileSync(out, privateHex + "\n", { mode: 0o600 });
console.log("");
console.log("Cheia privata a fost salvata in: " + out);
console.log("");
console.log("Pune in Cloudflare DNS, la inregistrarea TXT a domeniului omniwatchguard.com, valoarea:");
console.log("");
console.log(`v=MCPv1; k=ed25519; p=${publicB64}`);
console.log("");
