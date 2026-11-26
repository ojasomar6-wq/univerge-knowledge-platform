import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const institutes = mysqlTable("institutes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  shortName: varchar("shortName", { length: 32 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  country: varchar("country", { length: 80 }).notNull(),
  region: varchar("region", { length: 80 }).notNull(),
  type: mysqlEnum("type", ["university", "college", "institute"]).default("university").notNull(),
  studentCount: int("studentCount").default(0).notNull(),
  status: mysqlEnum("status", ["active", "pending", "invited"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Institute = typeof institutes.$inferSelect;

export const domains = mysqlTable("domains", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  accent: varchar("accent", { length: 24 }).default("indigo"),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type Domain = typeof domains.$inferSelect;

export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  domainId: int("domainId").notNull(),
  level: mysqlEnum("level", ["basic", "intermediate", "advanced"]).notNull(),
  description: text("description").notNull(),
  durationMinutes: int("durationMinutes").default(20).notNull(),
  questionCount: int("questionCount").default(12).notNull(),
  competency: varchar("competency", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  prompt: text("prompt").notNull(),
  options: text("options").notNull(),
  correctIndex: int("correctIndex").notNull(),
  explanation: text("explanation").notNull(),
  sourceId: int("sourceId"),
  difficulty: int("difficulty").default(3).notNull(),
});

export type Question = typeof questions.$inferSelect;

export const learnerProgress = mysqlTable("learnerProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId").notNull(),
  score: int("score").default(0).notNull(),
  status: mysqlEnum("status", ["started", "completed"]).default("started").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearnerProgress = typeof learnerProgress.$inferSelect;

export const assessmentAttempts = mysqlTable("assessmentAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: int("assessmentId").notNull(),
  answers: text("answers").notNull(),
  score: int("score").default(0).notNull(),
  total: int("total").default(0).notNull(),
  status: mysqlEnum("status", ["started", "completed"]).default("started").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;

export const knowledgeSources = mysqlTable("knowledgeSources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  instituteName: varchar("instituteName", { length: 180 }).notNull(),
  domain: varchar("domain", { length: 100 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["syllabus", "handbook", "research", "policy"]).default("handbook").notNull(),
  url: varchar("url", { length: 500 }),
  excerpt: text("excerpt").notNull(),
  embeddingRef: varchar("embeddingRef", { length: 180 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
