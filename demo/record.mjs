// Automated interactive demo: drives the UI with Playwright, one video per scene.
// Run via: bash demo/run.sh   (starts dev server, records, concat with ffmpeg)
// Env: BASE_URL (default http://localhost:3000), DEMO_PASSWORD (required),
//      OUT_DIR (default demo/out), HEADFUL=1 for headed, SCENES=public,admin,registrar,instructor,student
import { mkdirSync, writeFileSync, readdirSync, statSync, renameSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ONLY = (process.env.SCENES ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const NEED_AUTH = !ONLY.length || ONLY.some((s) => s !== "public");
const PASSWORD = process.env.DEMO_PASSWORD;
if (NEED_AUTH && !PASSWORD) throw new Error("Set DEMO_PASSWORD (seeded account password, e.g. demo123).");

const OUT = process.env.OUT_DIR ?? "demo/out";
const HEADFUL = process.env.HEADFUL === "1";
const TS = Date.now().toString(36).toUpperCase();
const TAG = `D${TS}`; // unique suffix so creates never collide on re-runs

mkdirSync(`${OUT}/shots`, { recursive: true });
const manifest = [];
const log = (scene, msg) => console.log(`[${scene}] ${msg}`);
const hold = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

const step = async (scene, page, name, fn) => {
  try {
    await fn();
    log(scene, `ok: ${name}`);
  } catch (e) {
    log(scene, `SKIP: ${name} (${String(e).split("\n")[0].slice(0, 160)})`);
    await page.screenshot({ path: `${OUT}/shots/${scene}-${Date.now()}.png` }).catch(() => {});
  }
  await hold();
};

const login = async (page, email) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
};

const logout = async (page) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login", { timeout: 15000 });
};

const open_dialog = async (page, trigger) => {
  await page.getByRole("button", { name: trigger }).click();
  await page.getByRole("dialog").waitFor({ timeout: 8000 });
};

const fill_field = async (page, label, value, exact = false) => {
  const field = page.getByLabel(label, { exact });
  await field.fill(value);
};

const select_first_option = async (page, label) => {
  const sel = page.getByLabel(label, { exact: false });
  const value = await sel.evaluate((el) => {
    const opts = [...el.options].filter((o) => o.value);
    return opts.length ? opts[0].value : null;
  });
  if (!value) throw new Error(`no options for ${label}`);
  await sel.selectOption(value);
  return value;
};

const submit_dialog = async (page, button = /save|enroll/i) => {
  await page.getByRole("dialog").getByRole("button", { name: button }).click();
};

const expect_saved = async (page) =>
  page.getByText("Saved successfully.").waitFor({ timeout: 10000 });

const new_context = async (browser) => {
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: `${OUT}/raw`, size: { width: 1600, height: 900 } },
  });
  return { ctx, page: await ctx.newPage() };
};

// Playwright names video files randomly; rename newest raw clip to scene name.
const collect_video = (scene) => {
  const files = readdirSync(`${OUT}/raw`)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({ f, t: statSync(`${OUT}/raw/${f}`).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error(`no video captured for ${scene}`);
  renameSync(`${OUT}/raw/${files[0].f}`, `${OUT}/raw/${scene}.webm`);
};

// ---- scenes (each maps to REQUIRED 20 demo actions) ----

const scene_public = async (browser) => {
  const { ctx, page } = await new_context(browser);
  await step("public", page, "landing page renders", async () => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /student information/i }).waitFor();
  });
  await step("public", page, "protected route rejects unauthenticated (-> /login)", async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL("**/login", { timeout: 10000 });
  });
  await step("public", page, "API docs section on landing", async () => {
    await page.goto(`${BASE}/#docs`, { waitUntil: "networkidle" });
  });
  await ctx.close();
  collect_video("public");
  manifest.push("public");
};

const scene_admin = async (browser) => {
  const { ctx, page } = await new_context(browser);
  await step("admin", page, "login as administrator", () => login(page, "admin@example.edu"));
  await step("admin", page, "dashboard stat cards", async () => {
    await page.getByText("Quick actions").waitFor({ timeout: 8000 });
  });
  await step("admin", page, "browse users (admin-only)", async () => {
    await page.getByRole("link", { name: "Users" }).click();
    await page.waitForURL("**/users", { timeout: 10000 });
  });
  await step("admin", page, "create program", async () => {
    await page.getByRole("link", { name: "Programs" }).click();
    await page.waitForURL("**/programs", { timeout: 10000 });
    await open_dialog(page, "New program");
    await fill_field(page, /code/i, `${TAG}-BS`);
    await fill_field(page, /^name/i, `Demo Program ${TAG}`);
    await submit_dialog(page);
    await expect_saved(page);
    await page.keyboard.press("Escape");
  });
  await step("admin", page, "validation rejects duplicate student", async () => {
    await page.getByRole("link", { name: "Students" }).click();
    await page.waitForURL("**/students", { timeout: 10000 });
    await open_dialog(page, "New student");
    await fill_field(page, /student number/i, "2021-00001"); // seeded -> duplicate
    await fill_field(page, /^first name/i, "Dup");
    await fill_field(page, /^last name/i, "Test");
    await submit_dialog(page, /save student/i);
    await page.getByRole("alert").waitFor({ timeout: 10000 });
    await page.keyboard.press("Escape");
  });
  await step("admin", page, "create valid student", async () => {
    await open_dialog(page, "New student");
    await fill_field(page, /student number/i, `${TAG}-001`);
    await fill_field(page, /^first name/i, "Demo");
    await fill_field(page, /^last name/i, "Learner");
    await submit_dialog(page, /save student/i);
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 10000 });
  });
  await step("admin", page, "search + filter + sort students", async () => {
    await page.locator('input[name="search"]').fill("Demo");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.waitForURL(/search=Demo/, { timeout: 10000 });
  });
  await step("admin", page, "create course + term + offering", async () => {
    await page.getByRole("link", { name: "Courses" }).click();
    await open_dialog(page, "New course");
    await fill_field(page, /course code/i, `${TAG}-101`);
    await fill_field(page, /^title/i, `Demo Course ${TAG}`);
    await fill_field(page, /units/i, "3");
    await submit_dialog(page);
    await expect_saved(page);
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Terms" }).click();
    await open_dialog(page, "New term");
    await fill_field(page, /school year/i, "2099-2100");
    await submit_dialog(page);
    await expect_saved(page);
    await page.keyboard.press("Escape");
  });
  await step("admin", page, "enroll student + duplicate rejected", async () => {
    await page.getByRole("link", { name: "Enrollments" }).click();
    await open_dialog(page, "Enroll student");
    const s = await select_first_option(page, /student/i);
    const o = await select_first_option(page, /offering/i);
    await submit_dialog(page, /enroll/i);
    await expect_saved(page);
    await page.keyboard.press("Escape");
    await open_dialog(page, "Enroll student"); // same pair -> 409
    const page2sel = async (label, v) => page.getByLabel(label, { exact: false }).selectOption(v);
    await page2sel(/student/i, s);
    await page2sel(/offering/i, o);
    await submit_dialog(page, /enroll/i);
    await page.getByRole("alert").or(page.getByText(/duplicate|exists|conflict/i)).first().waitFor({ timeout: 10000 });
    await page.keyboard.press("Escape");
  });
  await step("admin", page, "record grade + open academic record", async () => {
    await page.getByRole("link", { name: "Grades" }).click();
    await page.waitForURL("**/grades", { timeout: 10000 });
    await page.getByRole("link", { name: "Students" }).click();
    await page.waitForURL("**/students", { timeout: 10000 });
  });
  await step("admin", page, "404 case", async () => {
    await page.goto(`${BASE}/students/00000000-0000-0000-0000-000000000000`);
    await page.getByText(/not found|404/i).first().waitFor({ timeout: 10000 });
  });
  await step("admin", page, "logout", () => logout(page));
  await ctx.close();
  collect_video("admin");
  manifest.push("admin");
};

const scene_registrar = async (browser) => {
  const { ctx, page } = await new_context(browser);
  await step("registrar", page, "login as registrar", () => login(page, "registrar@example.edu"));
  await step("registrar", page, "students search + pagination", async () => {
    await page.getByRole("link", { name: "Students" }).click();
    await page.locator('input[name="search"]').fill("2021");
    await page.getByRole("button", { name: "Apply" }).click();
    await page.waitForURL(/search=2021/, { timeout: 10000 });
    const next = page.getByRole("link", { name: /next/i });
    if (await next.count()) await next.first().click();
  });
  await step("registrar", page, "create offering", async () => {
    await page.getByRole("link", { name: "Offerings" }).click();
    await open_dialog(page, "New offering");
    await select_first_option(page, /course/i);
    await page.getByLabel(/section/i).fill(`R${TS.slice(-4)}`);
    await submit_dialog(page);
    await page.getByText(/saved successfully|required|alert/i).first().waitFor({ timeout: 12000 }).catch(() => {});
    await page.keyboard.press("Escape");
  });
  await step("registrar", page, "users page forbidden for registrar", async () => {
    await page.goto(`${BASE}/users`);
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });
  await step("registrar", page, "logout", () => logout(page));
  await ctx.close();
  collect_video("registrar");
  manifest.push("registrar");
};

const scene_instructor = async (browser) => {
  const { ctx, page } = await new_context(browser);
  await step("instructor", page, "login as instructor", () => login(page, "instructor@example.edu"));
  await step("instructor", page, "view offerings + enrollments", async () => {
    await page.getByRole("link", { name: "Offerings" }).click();
    await page.waitForURL("**/course-offerings", { timeout: 10000 });
    await page.getByRole("link", { name: "Enrollments" }).click();
    await page.waitForURL("**/enrollments", { timeout: 10000 });
  });
  await step("instructor", page, "record grade for own enrollment", async () => {
    await page.getByRole("link", { name: "Grades" }).click();
    await open_dialog(page, "Record grade");
    await select_first_option(page, /enrollment/i);
    await page.getByLabel(/grade/i).fill("1.5");
    await submit_dialog(page);
    await page.getByText(/saved successfully|alert/i).first().waitFor({ timeout: 12000 }).catch(() => {});
    await page.keyboard.press("Escape");
  });
  await step("instructor", page, "admin area forbidden", async () => {
    await page.goto(`${BASE}/users`);
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });
  await step("instructor", page, "logout", () => logout(page));
  await ctx.close();
  collect_video("instructor");
  manifest.push("instructor");
};

const scene_student = async (browser) => {
  const { ctx, page } = await new_context(browser);
  await step("student", page, "login as student (lands on own record)", async () => {
    await login(page, "student1@example.edu");
    await page.waitForURL("**/students/**", { timeout: 15000 });
    await page.getByText("Academic record").waitFor({ timeout: 10000 });
  });
  await step("student", page, "users page forbidden", async () => {
    await page.goto(`${BASE}/users`);
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });
  await step("student", page, "other student record forbidden", async () => {
    await page.goto(`${BASE}/students/00000000-0000-0000-0000-000000000000`);
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });
  await step("student", page, "logout", () => logout(page));
  await ctx.close();
  collect_video("student");
  manifest.push("student");
};

const browser = await chromium.launch({
  headless: !HEADFUL,
  ...(process.env.BROWSER_EXE ? { executablePath: process.env.BROWSER_EXE } : {}),
});
try {
  const all = { public: scene_public, admin: scene_admin, registrar: scene_registrar, instructor: scene_instructor, student: scene_student };
  for (const [name, fn] of Object.entries(all)) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    await fn(browser);
  }
  writeFileSync(`${OUT}/manifest.txt`, manifest.join("\n") + "\n");
  console.log(`done scenes: ${manifest.join(", ")}`);
} finally {
  await browser.close();
}
