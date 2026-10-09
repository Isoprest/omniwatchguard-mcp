#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server";

// Varianta locala, pe stdio. Cheia API se da prin variabila de mediu
// OWG_API_KEY (owg_live_...). Fara cheie, serverul porneste si isi listeaza
// uneltele, dar apelurile intorc un mesaj de eroare.
const key = (process.env.OWG_API_KEY || "").trim();
const server = createServer(key ? `Bearer ${key}` : null);
await server.connect(new StdioServerTransport());
