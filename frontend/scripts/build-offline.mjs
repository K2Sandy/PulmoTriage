// Membangun tampilan PulmoTriage untuk mode offline, lalu menyalinnya ke backend/web.
// Jalankan dari folder frontend:  npm run build:offline
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = join(dirname(fileURLToPath(import.meta.url)), "..");
const keluaran = join(frontend, "out");
const tujuan = join(frontend, "..", "backend", "web");

const hasil = spawnSync("npx", ["next", "build"], {
  cwd: frontend,
  stdio: "inherit",
  shell: process.platform === "win32",
  // Alamat API relatif: tampilan dan backend berada di alamat yang sama (localhost:8000).
  env: { ...process.env, NEXT_PUBLIC_OFFLINE: "1" },
});
if (hasil.status !== 0) process.exit(hasil.status ?? 1);

if (!existsSync(keluaran)) {
  console.error("Folder out/ tidak ditemukan. Build gagal?");
  process.exit(1);
}
rmSync(tujuan, { recursive: true, force: true });
cpSync(keluaran, tujuan, { recursive: true });
console.log(`\nTampilan offline disalin ke ${tujuan}`);
console.log("Jalankan backend lalu buka http://localhost:8000");
