import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assessments,
  domains,
  institutes,
  knowledgeSources,
  learnerProgress,
  questions,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertLocalUser(user: InsertUser, _passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(users).values(user).onDuplicateKeyUpdate({ set: { name: user.name, lastSignedIn: new Date() } });
  } catch {}
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

const demoInstitutes = [
  { name: "National Institute of Technology, Trichy", shortName: "NIT Trichy", city: "Tiruchirappalli", country: "India", region: "South Asia", type: "university", studentCount: 11600 },
  { name: "Indian Institute of Science Education and Research, Pune", shortName: "IISER Pune", city: "Pune", country: "India", region: "South Asia", type: "institute", studentCount: 3200 },
  { name: "University of Melbourne", shortName: "UniMelb", city: "Melbourne", country: "Australia", region: "Oceania", type: "university", studentCount: 53000 },
  { name: "Technical University of Munich", shortName: "TUM", city: "Munich", country: "Germany", region: "Europe", type: "university", studentCount: 51500 },
  { name: "University of Toronto", shortName: "U of T", city: "Toronto", country: "Canada", region: "North America", type: "university", studentCount: 97000 },
  { name: "Ashesi University", shortName: "Ashesi", city: "Berekuso", country: "Ghana", region: "Africa", type: "university", studentCount: 1500 },
];

const demoAssessments = [
  { id: 1, title: "Computational Thinking", domain: "Computer Science", level: "advanced", description: "Reason about algorithms, complexity, and systems under pressure.", durationMinutes: 25, questionCount: 18, competency: "Algorithms & problem solving", completion: 68, color: "violet" },
  { id: 2, title: "Research Foundations", domain: "Research & Writing", level: "intermediate", description: "Evaluate evidence, design a study, and communicate findings clearly.", durationMinutes: 20, questionCount: 14, competency: "Evidence literacy", completion: 42, color: "sky" },
  { id: 3, title: "Quantitative Reasoning", domain: "Mathematics", level: "advanced", description: "Move from intuition to proof across probability and linear algebra.", durationMinutes: 30, questionCount: 20, competency: "Mathematical modeling", completion: 0, color: "amber" },
  { id: 4, title: "Academic Essentials", domain: "University Readiness", level: "basic", description: "A diagnostic baseline for students entering from any discipline.", durationMinutes: 15, questionCount: 12, competency: "Core fluency", completion: 100, color: "emerald" },
  { id: 5, title: "Systems & Society", domain: "Interdisciplinary", level: "intermediate", description: "Connect technology, institutions, ethics, and human outcomes.", durationMinutes: 22, questionCount: 16, competency: "Systems thinking", completion: 0, color: "rose" },
  { id: 6, title: "AI & Responsible Innovation", domain: "Artificial Intelligence", level: "advanced", description: "Navigate modern AI concepts, risks, and deployment trade-offs.", durationMinutes: 28, questionCount: 16, competency: "Applied AI judgment", completion: 0, color: "indigo" },
];

const demoSources = [
  { id: 1, title: "First-year computational thinking syllabus", instituteName: "UniVerge Academic Council", domain: "Computer Science", sourceType: "syllabus", url: "https://example.edu/syllabus/computational-thinking", excerpt: "Students should be able to decompose problems, compare algorithmic strategies, reason about complexity, and defend trade-offs with evidence." },
  { id: 2, title: "Research integrity and evidence handbook", instituteName: "University of Melbourne", domain: "Research & Writing", sourceType: "handbook", url: "https://example.edu/handbook/research-integrity", excerpt: "Good research distinguishes claims from evidence, documents assumptions, and makes uncertainty visible rather than hiding it." },
  { id: 3, title: "AI literacy outcomes for undergraduate programs", instituteName: "Technical University of Munich", domain: "Artificial Intelligence", sourceType: "policy", url: "https://example.edu/policy/ai-literacy", excerpt: "AI-ready graduates understand model limitations, data provenance, evaluation, human oversight, and the social context of deployment." },
  { id: 4, title: "Interdisciplinary systems primer", instituteName: "Ashesi University", domain: "Interdisciplinary", sourceType: "research", url: "https://example.edu/research/systems-primer", excerpt: "Systems thinking looks for feedback loops, incentives, boundary choices, and second-order effects across connected parts." },
];

export async function listAssessments() {
  const db = await getDb();
  if (!db) return demoAssessments;
  try {
    const rows = await db.select({ assessment: assessments, domain: domains }).from(assessments).leftJoin(domains, eq(assessments.domainId, domains.id)).where(eq(assessments.status, "published")).orderBy(asc(assessments.id));
    if (!rows.length) return demoAssessments;
    return rows.map(({ assessment, domain }) => ({ ...assessment, domain: domain?.name ?? "General", completion: 0, color: domain?.accent ?? "indigo" }));
  } catch {
    return demoAssessments;
  }
}

export async function listInstitutes() {
  const db = await getDb();
  if (!db) return demoInstitutes;
  try {
    const rows = await db.select().from(institutes).where(eq(institutes.status, "active")).orderBy(asc(institutes.id)).limit(8);
    return rows.length ? rows : demoInstitutes;
  } catch {
    return demoInstitutes;
  }
}

export async function getNetworkOverview() {
  const institutesList = await listInstitutes();
  return { total: 527, active: 486, pending: 41, regions: 68, institutes: institutesList };
}

export async function getLearnerProgress(userId?: number) {
  const db = await getDb();
  if (db && userId) {
    try {
      const rows = await db.select({ progress: learnerProgress, assessment: assessments }).from(learnerProgress).leftJoin(assessments, eq(learnerProgress.assessmentId, assessments.id)).where(eq(learnerProgress.userId, userId)).orderBy(asc(learnerProgress.id)).limit(6);
      if (rows.length) return rows;
    } catch {
      // Fall through to the demo profile for a first-run experience.
    }
  }
  return [
    { progress: { id: 1, userId: userId ?? 0, assessmentId: 4, score: 92, status: "completed", completedAt: new Date("2026-08-30"), createdAt: new Date("2026-08-30") }, assessment: demoAssessments[3] },
    { progress: { id: 2, userId: userId ?? 0, assessmentId: 1, score: 68, status: "started", completedAt: null, createdAt: new Date("2026-09-08") }, assessment: demoAssessments[0] },
  ];
}

export async function searchKnowledge(query: string, domain?: string) {
  const db = await getDb();
  if (db) {
    try {
      const q = `%${query.trim()}%`;
      const domainFilter = domain ? like(knowledgeSources.domain, `%${domain}%`) : undefined;
      const textFilter = or(like(knowledgeSources.title, q), like(knowledgeSources.excerpt, q), like(knowledgeSources.instituteName, q));
      const filters = domainFilter ? and(domainFilter, textFilter) : textFilter;
      const rows = await db.select().from(knowledgeSources).where(filters).orderBy(desc(knowledgeSources.updatedAt)).limit(8);
      if (rows.length) return rows;
    } catch {}
  }
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return demoSources.map(source => {
    const haystack = `${source.title} ${source.excerpt} ${source.domain} ${source.instituteName}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0) + (domain && source.domain.toLowerCase().includes(domain.toLowerCase()) ? 2 : 0);
    return { source, score };
  }).filter(item => item.score > 0 || terms.length === 0).sort((a,b) => b.score-a.score).slice(0, 6).map(item => item.source);
}

export async function saveAssessmentProgress(userId: number, assessmentId: number, score: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.insert(learnerProgress).values({ userId, assessmentId, score, status: "completed", completedAt: new Date() });
    return true;
  } catch { return false; }
}

export async function getQuestions(assessmentId: number) {
  const db = await getDb();
  if (db) {
    try {
      const rows = await db.select().from(questions).where(eq(questions.assessmentId, assessmentId)).orderBy(asc(questions.id));
      if (rows.length) return rows.map(row => ({ ...row, options: JSON.parse(row.options) as string[] }));
    } catch {
      // Use a demo item below.
    }
  }
  return [{ id: 1, assessmentId, prompt: "Which approach best reveals whether a solution will scale beyond the original example?", options: ["Add more examples", "Measure time and space behavior as input grows", "Use a faster laptop", "Remove edge cases"], correctIndex: 1, explanation: "Scaling behavior is about how resource use changes as the input grows, not only whether one example works.", difficulty: 3 }];
}
