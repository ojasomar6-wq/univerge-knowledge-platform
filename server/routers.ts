import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getLearnerProgress, getNetworkOverview, getQuestions, listAssessments, searchKnowledge, saveAssessmentProgress } from "./db";
import { loginLocalUser, registerLocalUser, destroySession } from "./localAuth";

const answerSchema = z.record(z.string(), z.number().int().min(0));

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(6).max(100) })).mutation(async ({ input, ctx }) => {
      try {
        const user = await registerLocalUser(input.name, input.email, input.password);
        const login = await loginLocalUser(input.email, input.password);
        ctx.res.cookie("univerge_session", login.token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "lax" });
        return user;
      } catch (error) { throw new Error(error instanceof Error ? error.message : "Registration failed"); }
    }),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(6) })).mutation(async ({ input, ctx }) => {
      const login = await loginLocalUser(input.email, input.password);
      ctx.res.cookie("univerge_session", login.token, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "lax" });
      return login.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const token = (ctx.req as any).cookies?.univerge_session;
      destroySession(token);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("univerge_session", { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    overview: publicProcedure.query(async ({ ctx }) => {
      const [assessments, progress] = await Promise.all([listAssessments(), getLearnerProgress(ctx.user?.id)]);
      const completed = progress.filter(item => item.progress.status === "completed");
      const avgScore = completed.length ? Math.round(completed.reduce((sum, item) => sum + item.progress.score, 0) / completed.length) : 78;
      const assessed = new Set(completed.map(item => item.progress.assessmentId)).size;
      const coverage = Math.min(100, Math.round((assessed / Math.max(1, assessments.length)) * 100));
      return { assessments, progress, stats: { readiness: avgScore, assessed, streak: completed.length ? Math.min(21, 3 + completed.length * 2) : 0, coverage } };
    }),
    network: publicProcedure.query(() => getNetworkOverview()),
  }),
  assessments: router({
    questions: publicProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ input }) => getQuestions(input.assessmentId)),
    submit: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), answers: answerSchema })).mutation(async ({ input, ctx }) => {
      const questions = await getQuestions(input.assessmentId);
      let correct = 0;
      for (const q of questions as any[]) if (input.answers[String(q.id)] === q.correctIndex) correct++;
      const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
      await saveAssessmentProgress(ctx.user.id, input.assessmentId, score);
      return { score, correct, total: questions.length, level: score >= 80 ? "advanced" : score >= 60 ? "intermediate" : "basic", userId: ctx.user.id };
    }),
    nextRecommendation: protectedProcedure.input(z.object({ currentLevel: z.enum(["basic","intermediate","advanced"]), score: z.number().min(0).max(100) })).query(({ input }) => {
      if (input.score < 60) return { recommendation: "basic", reason: "Strengthen the fundamentals before increasing difficulty." };
      if (input.score < 80) return { recommendation: input.currentLevel === "basic" ? "intermediate" : input.currentLevel, reason: "You have a solid base; reinforce weak areas and retest." };
      return { recommendation: input.currentLevel === "advanced" ? "advanced" : input.currentLevel === "basic" ? "intermediate" : "advanced", reason: "Strong performance unlocks the next challenge." };
    }),
  }),
  knowledge: router({
    search: publicProcedure.input(z.object({ query: z.string().min(2), domain: z.string().optional() })).query(({ input }) => searchKnowledge(input.query, input.domain)),
    ask: protectedProcedure.input(z.object({ query: z.string().min(3), domain: z.string().optional() })).mutation(async ({ input }) => {
      const sources = await searchKnowledge(input.query, input.domain);
      const context = sources.map((source, index) => `[${index + 1}] ${source.title} — ${source.instituteName}\n${source.excerpt}`).join("\n\n");
      try {
        const response = await invokeLLM({ messages: [
          { role: "system", content: "You are UniVerge's grounded academic guide. Use only supplied evidence. Cite source numbers like [1]. If evidence is insufficient, explicitly say so. Never invent institutional policy." },
          { role: "user", content: `Question: ${input.query}\n\nEvidence:\n${context || "No evidence retrieved."}` },
        ]});
        const content = response.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) return { answer: content, sources };
      } catch {}
      return { answer: sources.length ? `Based on the retrieved evidence: ${sources[0].excerpt}\n\nThis retrieval-only answer is grounded in the sources shown below.` : "I could not find enough evidence for that question. Try adding a course, topic, or institute name.", sources };
    }),
  }),
});
export type AppRouter = typeof appRouter;
