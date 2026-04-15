#!/usr/bin/env node
"use strict";

/**
 * dev-all.js
 * Lanza backend + frontend para cada worktree del repo en puertos distintos.
 *
 * Los worktrees secundarios comparten node_modules y .env del worktree
 * principal (el primero en la lista, que es el repo raíz).
 *
 * Asignación de puertos:
 *   worktree 0 (principal): BACKEND=base,   FRONTEND=base+1
 *   worktree 1:             BACKEND=base+2, FRONTEND=base+3
 *   ...
 *
 * Uso:
 *   npm run dev-all
 *   npm run dev-all:only -- commander-techs
 */

const { spawnSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_BACKEND_PORT = 7050;
const BASE_FRONTEND_PORT = 5173;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWorktrees() {
  const result = spawnSync("git", ["worktree", "list", "--porcelain"], {
    encoding: "utf8",
    cwd: __dirname,
  });
  if (result.status !== 0) {
    console.error("Error al obtener worktrees:", result.stderr);
    process.exit(1);
  }

  const worktrees = [];
  let current = {};
  for (const line of result.stdout.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current.path) worktrees.push(current);
      current = { path: line.slice(9).trim() };
    } else if (line.startsWith("branch ")) {
      current.branch = line.replace("refs/heads/", "").slice(7).trim();
    } else if (line.startsWith("HEAD ")) {
      current.head = line.slice(5).trim();
    } else if (line.trim() === "bare") {
      current.bare = true;
    }
  }
  if (current.path) worktrees.push(current);

  return worktrees.filter((w) => !w.bare);
}

function readEnvFile(dir) {
  const envPath = path.join(dir, ".env");
  if (!fs.existsSync(envPath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function label(branch, type) {
  const b = (branch ?? "detached").padEnd(22).slice(0, 22);
  const t = type === "BE" ? "\x1b[35mBE\x1b[0m" : "\x1b[36mFE\x1b[0m";
  return `[${b} ${t}]`;
}

function prefixLines(proc, prefix) {
  const print = (chunk) => {
    const lines = chunk.toString().split("\n");
    for (const l of lines) {
      if (l.trim()) process.stdout.write(`${prefix} ${l}\n`);
    }
  };
  proc.stdout?.on("data", print);
  proc.stderr?.on("data", print);
}

function propagateFiles(fromDir, toDir) {
  const files = [
    { src: ".gitignore", dst: ".gitignore" },
    { src: path.join("frontend", ".env"), dst: path.join("frontend", ".env") },
    { src: ".env", dst: ".env" },
  ];
  for (const { src, dst } of files) {
    const srcPath = path.join(fromDir, src);
    const dstPath = path.join(toDir, dst);
    if (!fs.existsSync(srcPath)) continue;
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.copyFileSync(srcPath, dstPath);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const filterArg = (() => {
  const idx = process.argv.indexOf("--only");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const allWorktrees = getWorktrees();
if (allWorktrees.length === 0) {
  console.error("No se encontraron worktrees.");
  process.exit(1);
}

// El primer worktree de la lista es siempre el repo raíz
const rootWorktree = allWorktrees[0];
const rootNodeModules = path.join(rootWorktree.path, "node_modules");
const rootEnv = readEnvFile(rootWorktree.path);

const worktrees = allWorktrees.filter((w) => {
  if (!filterArg) return true;
  return w.path.includes(filterArg) || (w.branch ?? "").includes(filterArg);
});

if (worktrees.length === 0) {
  console.error(`No se encontraron worktrees que coincidan con "${filterArg}"`);
  process.exit(1);
}

// Propagar .gitignore y .env a todos los worktrees secundarios
for (const wt of allWorktrees.slice(1)) {
  propagateFiles(rootWorktree.path, wt.path);
}

console.log(`\n\x1b[1mLanzando ${worktrees.length} worktree(s):\x1b[0m\n`);
console.log(
  `  \x1b[2mnode_modules compartidos desde: ${rootNodeModules}\x1b[0m\n`,
);

const procs = [];

worktrees.forEach((wt, i) => {
  // Asignar puertos: cada worktree ocupa dos puertos consecutivos
  const wtIndex = allWorktrees.indexOf(wt);
  const bePort = BASE_BACKEND_PORT + wtIndex;
  const fePort = BASE_FRONTEND_PORT + wtIndex;
  const branch = wt.branch ?? `worktree-${wtIndex}`;

  // Env: base del .env raíz → sobrescribir con vars del worktree si tiene → puertos
  const wtEnv = readEnvFile(wt.path);
  const env = {
    ...process.env,
    ...rootEnv, // vars del .env principal como fallback
    ...wtEnv, // vars propias del worktree (si las tiene)
    NODE_ENV: "development",
    BACKEND_PORT: String(bePort),
    FRONTEND_PORT: String(fePort),
    VITE_BACKEND_URL: `http://localhost:${bePort}`,
    // Que Node encuentre los binarios en el node_modules raíz
    PATH: `${rootNodeModules}/.bin${path.delimiter}${process.env.PATH}`,
  };

  console.log(
    `  \x1b[1m${branch}\x1b[0m\n` +
      `    Ruta:     ${wt.path}\n` +
      `    Backend:  http://localhost:${bePort}\n` +
      `    Frontend: http://localhost:${fePort}\n`,
  );

  // ── Backend ───────────────────────────────────────────────────────────────
  // No usamos --env-file porque el .env puede no existir en worktrees secundarios;
  // las vars ya están en env gracias a rootEnv.
  const be = spawn("node", ["backend/server.js"], {
    cwd: wt.path,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  prefixLines(be, label(branch, "BE"));
  be.on("exit", (code) => {
    if (code !== null && code !== 0)
      process.stdout.write(
        `${label(branch, "BE")} proceso terminado (código ${code})\n`,
      );
  });
  procs.push(be);

  // ── Frontend (vite) ───────────────────────────────────────────────────────
  // Usamos el vite del node_modules raíz con ruta absoluta
  const viteBin = path.join(rootNodeModules, ".bin", "vite");
  const fe = spawn("node", [viteBin, "--port", String(fePort)], {
    cwd: wt.path,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  prefixLines(fe, label(branch, "FE"));
  fe.on("exit", (code) => {
    if (code !== null && code !== 0)
      process.stdout.write(
        `${label(branch, "FE")} proceso terminado (código ${code})\n`,
      );
  });
  procs.push(fe);
});

// Ctrl+C limpia todo
process.on("SIGINT", () => {
  console.log("\n\x1b[33mDeteniendo todos los procesos...\x1b[0m");
  for (const p of procs) {
    try {
      p.kill("SIGTERM");
    } catch (_) {}
  }
  process.exit(0);
});
