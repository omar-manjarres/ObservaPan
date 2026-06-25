/**
 * ObservaPan seed script.
 *
 * Creates demo users (Firebase Auth + Firestore profiles), bakeries, an active
 * diagnostic form with its sections and questions, historic records with
 * computed scores, indicator snapshots and alerts.
 *
 * USAGE:
 *   1. Download a service account key from the Firebase console
 *      (Project settings > Service accounts) and save it as serviceAccountKey.json
 *      in the project root (this file is git-ignored).
 *   2. Run:  npm run seed
 *
 * No real passwords or sensitive data are used. Demo password: ObservaPan2026*
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

const KEY_PATH = resolve(process.cwd(), "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf8"));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();
const DEMO_PASSWORD = "ObservaPan2026*";

// ---------- scoring (self-contained) ----------
const FREQ: Record<string, number> = { Nunca: 1, "Casi nunca": 2, "A veces": 3, "Casi siempre": 4, Siempre: 5 };
type Dir = "positive" | "negative" | "neutral";
function qScore(value: string, direction: Dir, affects: boolean): number | null {
  if (!affects || direction === "neutral") return null;
  const base = FREQ[value];
  if (base === undefined) return null;
  return direction === "negative" ? 6 - base : base;
}
function avg(nums: number[]): number | null {
  const v = nums.filter((n) => typeof n === "number");
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null;
}

// ---------- users ----------
async function ensureUser(email: string, displayName: string, role: string, extra: Record<string, unknown> = {}) {
  let uid: string;
  try {
    const u = await auth.getUserByEmail(email);
    uid = u.uid;
  } catch {
    const u = await auth.createUser({ email, password: DEMO_PASSWORD, displayName });
    uid = u.uid;
  }
  await db.doc(`users/${uid}`).set(
    {
      displayName, email, role, status: "active",
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      ...extra,
    },
    { merge: true },
  );
  return uid;
}

// ---------- form ----------
const PRODUCTIVE = [
  ["¿La panadería realiza planeación de la producción antes de iniciar la jornada?", "frequency_scale", "positive", true],
  ["¿La panadería define cantidades específicas de producción por producto?", "frequency_scale", "positive", true],
  ["¿La panadería presenta faltantes de materias primas durante la producción?", "frequency_scale", "negative", true],
  ["¿La panadería presenta deterioro de materias primas?", "frequency_scale", "negative", true],
  ["¿La panadería lleva registro de inventarios de materias primas?", "frequency_scale", "positive", true],
  ["¿La panadería controla desperdicios o mermas de producción?", "frequency_scale", "positive", true],
  ["¿La panadería ajusta su producción según la demanda real?", "frequency_scale", "positive", true],
  ["Observaciones sobre la gestión productiva.", "long_text", "neutral", false],
] as const;
const ADMIN = [
  ["¿La panadería registra sus ingresos y gastos?", "frequency_scale", "positive", true],
  ["¿La panadería calcula el costo de producción de sus productos?", "frequency_scale", "positive", true],
  ["¿La panadería utiliza herramientas digitales para administrar información?", "frequency_scale", "positive", true],
  ["¿La panadería toma decisiones con base en registros o datos?", "frequency_scale", "positive", true],
  ["¿La panadería tiene dificultades para organizar documentos, cuentas o registros internos?", "frequency_scale", "negative", true],
  ["¿La panadería planifica sus compras de materias primas?", "frequency_scale", "positive", true],
  ["Observaciones sobre la gestión administrativa.", "long_text", "neutral", false],
] as const;
const COMMERCIAL = [
  ["¿La panadería identifica cuáles son sus productos más vendidos?", "frequency_scale", "positive", true],
  ["¿La panadería usa redes sociales o medios digitales para promocionarse?", "frequency_scale", "positive", true],
  ["¿La panadería realiza estrategias para fidelizar clientes?", "frequency_scale", "positive", true],
  ["¿La panadería analiza cambios en la demanda de sus productos?", "frequency_scale", "positive", true],
  ["¿La panadería presenta dificultades para atraer nuevos clientes?", "frequency_scale", "negative", true],
  ["¿La panadería conoce las preferencias de sus clientes?", "frequency_scale", "positive", true],
  ["Observaciones sobre la gestión comercial.", "long_text", "neutral", false],
] as const;

async function seedForm(adminUid: string) {
  const formRef = db.collection("forms").doc();
  await formRef.set({
    name: "Diagnóstico empresarial panadero",
    description: "Formulario base de diagnóstico productivo, administrativo y comercial.",
    version: 1, status: "active",
    variables: ["productive", "administrative", "commercial"],
    createdBy: adminUid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });

  const sections = [
    { variable: "productive", title: "Gestión productiva", items: PRODUCTIVE },
    { variable: "administrative", title: "Gestión administrativa", items: ADMIN },
    { variable: "commercial", title: "Gestión comercial", items: COMMERCIAL },
  ] as const;

  const questions: { id: string; variable: string; text: string; direction: Dir; affects: boolean; type: string }[] = [];
  let sOrder = 1;
  for (const s of sections) {
    const secRef = formRef.collection("sections").doc();
    await secRef.set({ title: s.title, variable: s.variable, order: sOrder++ });
    let qOrder = 1;
    for (const [text, type, direction, affects] of s.items) {
      const qRef = formRef.collection("questions").doc();
      await qRef.set({
        sectionId: secRef.id, text, helpText: "", variable: s.variable, type,
        required: type === "frequency_scale", order: qOrder++, affectsScore: affects,
        direction, weight: 1, status: "active",
      });
      questions.push({ id: qRef.id, variable: s.variable, text, direction: direction as Dir, affects, type });
    }
  }
  return { formId: formRef.id, questions };
}

// ---------- bakeries ----------
const BAKERIES = [
  { businessName: "Panadería La Espiga Dorada", ownerName: "María González", neighborhood: "Centro", commune: "Comuna 1", companySize: "small", productionType: "artisanal", employeeCount: 6, startYear: 2012 },
  { businessName: "Pan y Sabor del Valle", ownerName: "José Martínez", neighborhood: "Garupal", commune: "Comuna 3", companySize: "micro", productionType: "artisanal", employeeCount: 3, startYear: 2018 },
  { businessName: "Delicias del Trigo", ownerName: "Carmen Ríos", neighborhood: "Novalito", commune: "Comuna 5", companySize: "medium", productionType: "semi_industrial", employeeCount: 14, startYear: 2008 },
  { businessName: "Horno Caribe", ownerName: "Luis Daza", neighborhood: "Los Fundadores", commune: "Comuna 2", companySize: "small", productionType: "artisanal", employeeCount: 5, startYear: 2015 },
  { businessName: "La Vallenata Bakery", ownerName: "Ana Mendoza", neighborhood: "La Nevada", commune: "Comuna 6", companySize: "micro", productionType: "artisanal", employeeCount: 2, startYear: 2020 },
] as const;

const PERIODS = ["2026-04", "2026-05", "2026-06"];
const FREQ_VALUES = ["Nunca", "Casi nunca", "A veces", "Casi siempre", "Siempre"];

function pick(seedNum: number): string {
  return FREQ_VALUES[seedNum % FREQ_VALUES.length];
}

async function main() {
  console.log("Sembrando ObservaPan...");

  const adminUid = await ensureUser("admin@observapan.co", "Administrador General", "admin");
  const surveyorUid = await ensureUser("encuestador@observapan.co", "Encuestador Demo", "surveyor");
  await ensureUser("consultor@observapan.co", "Consultor Demo", "consultant");

  const { formId, questions } = await seedForm(adminUid);
  console.log("Formulario creado:", formId);

  const bakeryIds: string[] = [];
  for (const b of BAKERIES) {
    const ref = db.collection("bakeries").doc();
    await ref.set({
      ...b, nit: "", phone: "", email: "", address: "", city: "Valledupar", department: "Cesar",
      status: "active", notes: "", createdBy: adminUid,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    bakeryIds.push(ref.id);
  }
  console.log(`${bakeryIds.length} panaderías creadas`);

  // Link first bakery to a bakery user, assign all to surveyor
  await ensureUser("panaderia@observapan.co", "Panadería La Espiga", "bakery", { bakeryId: bakeryIds[0] });
  await db.doc(`users/${surveyorUid}`).set({ assignedBakeryIds: bakeryIds }, { merge: true });

  const scoredQ = questions.filter((q) => q.affects);

  // Records + snapshots
  let prevGlobalByBakery: Record<string, number | null> = {};
  for (const period of PERIODS) {
    const periodScores: { bakeryId: string; scores: any; recordId: string; responses: any[] }[] = [];
    for (let bi = 0; bi < bakeryIds.length; bi++) {
      const bakeryId = bakeryIds[bi];
      const responses = questions.map((q, qi) => {
        const value = q.type === "long_text"
          ? "Sin observaciones relevantes."
          : pick(bi + qi + PERIODS.indexOf(period));
        const score = q.type === "long_text" ? null : qScore(value, q.direction, q.affects);
        return {
          questionId: q.id, questionText: q.text, variable: q.variable, value,
          ...(score !== null ? { score, weightedScore: score } : {}),
        };
      });
      const byVar = (v: string) => avg(responses.filter((r) => r.variable === v && typeof r.score === "number").map((r) => r.score as number));
      const scores = { productive: byVar("productive"), administrative: byVar("administrative"), commercial: byVar("commercial"), global: null as number | null };
      scores.global = avg([scores.productive, scores.administrative, scores.commercial].filter((n): n is number => n !== null));

      const recRef = db.collection("records").doc();
      await recRef.set({
        bakeryId, formId, formVersion: 1, period, periodType: "monthly", status: "completed",
        responses, scores, observations: "", createdBy: surveyorUid,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
      });
      periodScores.push({ bakeryId, scores, recordId: recRef.id, responses });
    }

    const sectorGlobal = avg(periodScores.map((p) => p.scores.global).filter((n): n is number => n !== null));
    for (const ps of periodScores) {
      const prev = prevGlobalByBakery[ps.bakeryId] ?? null;
      const g = ps.scores.global;
      let trend = "no_previous_data";
      if (prev !== null && g !== null) trend = g - prev > 0.2 ? "improvement" : g - prev < -0.2 ? "decline" : "stable";
      const risk = g === null ? "medium" : g < 2.5 ? "high" : g < 3.5 ? "medium" : "low";
      await db.collection("indicatorSnapshots").add({
        bakeryId: ps.bakeryId, recordId: ps.recordId, period,
        productiveScore: ps.scores.productive, administrativeScore: ps.scores.administrative,
        commercialScore: ps.scores.commercial, globalScore: g, trend, riskLevel: risk,
        sectorComparison: { globalDifference: g !== null && sectorGlobal !== null ? +(g - sectorGlobal).toFixed(2) : null,
          productiveDifference: null, administrativeDifference: null, commercialDifference: null },
        createdAt: FieldValue.serverTimestamp(),
      });
      prevGlobalByBakery[ps.bakeryId] = g;

      // Critical alert for last period
      if (period === PERIODS[PERIODS.length - 1] && g !== null && g < 3.0) {
        await db.collection("alerts").add({
          bakeryId: ps.bakeryId, recordId: ps.recordId, variable: "global",
          type: "critical_score", severity: g < 2.5 ? "high" : "medium",
          title: `Puntaje global a vigilar (${g.toFixed(2)})`,
          description: "El puntaje global se encuentra por debajo del nivel adecuado.",
          recommendation: "Se recomienda revisar las tres dimensiones del diagnóstico.",
          status: "active",
          createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    console.log(`Periodo ${period}: ${periodScores.length} registros`);
  }

  // app config
  await db.doc("appConfig/main").set({
    appName: "ObservaPan", city: "Valledupar", activePeriod: PERIODS[PERIODS.length - 1],
    alertThresholds: { highRiskBelow: 2.5, mediumRiskBelow: 3.5 },
    reportSettings: { anonymizeSectorReports: false },
    institutionName: "Observatorio Empresarial del Sector Panadero de Valledupar",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log("\n✅ Seed completado.");
  console.log("Usuarios demo (password: " + DEMO_PASSWORD + "):");
  console.log("  admin@observapan.co        (Administrador)");
  console.log("  encuestador@observapan.co  (Encuestador)");
  console.log("  panaderia@observapan.co    (Panadería)");
  console.log("  consultor@observapan.co    (Consultor)");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
