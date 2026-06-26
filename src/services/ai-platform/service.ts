import { prisma } from "@/repositories/prisma";
import {
  analyzeCeo,
  analyzeCustomer,
  analyzeFarm,
  analyzeFinance,
  analyzeInventory,
  analyzeMarketing,
  analyzeSales,
} from "@/modules/ai-platform/domains";
import { summarizeWithAi } from "@/modules/ai-platform/openai";
import type { ModuleInsight } from "@/modules/ai-platform/types";
import { processWhatsAppMessage, listWhatsAppSessions } from "@/modules/ai-platform/whatsapp";
import type { AiModule } from "@prisma/client";
import { runAgent, listAgentRuns } from "@/services/farm/agent.service";
import { processVoiceInput } from "@/services/farm/voice.service";
import { listInsights, listAiAlerts, listRecommendations } from "@/services/farm/ai.service";

const ANALYZERS: Record<string, () => Promise<ModuleInsight>> = {
  CEO: analyzeCeo,
  FINANCE: analyzeFinance,
  FARM: analyzeFarm,
  INVENTORY: analyzeInventory,
  MARKETING: analyzeMarketing,
  SALES: analyzeSales,
  CUSTOMER: analyzeCustomer,
};

export async function getAiPlatformDashboard() {
  const [insights, alerts, recommendations, moduleRuns, agents, whatsappSessions, agentRuns] =
    await Promise.all([
      listInsights(),
      listAiAlerts(true),
      listRecommendations(),
      prisma.aiModuleRun.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.aiAgentDefinition.findMany({ where: { isActive: true } }),
      listWhatsAppSessions(5),
      prisma.agentRun.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  return {
    stats: {
      insights: insights.length,
      unackAlerts: alerts.length,
      recommendations: recommendations.length,
      activeAgents: agents.length,
      whatsappSessions: whatsappSessions.length,
      recentRuns: moduleRuns.length,
    },
    insights: insights.slice(0, 5),
    alerts: alerts.slice(0, 5),
    agents,
    whatsappSessions,
    recentModuleRuns: moduleRuns,
    recentAgentRuns: agentRuns,
  };
}

export async function runModuleAnalysis(module: AiModule, userId?: string, question?: string) {
  const run = await prisma.aiModuleRun.create({
    data: { module, userId, input: question, status: "RUNNING" },
  });

  try {
    let insight: ModuleInsight | null = null;

    if (module === "WHATSAPP") {
      insight = {
        title: "WhatsApp AI",
        summary: `${await prisma.aiWhatsAppSession.count()} active sessions. Use POST /api/v1/ai/whatsapp to chat.`,
        score: 90,
      };
    } else if (module === "VOICE") {
      insight = {
        title: "Voice Assistant",
        summary:
          "Voice commands supported for milk, orders, weather. POST /api/v1/ai/voice with transcript.",
        score: 88,
      };
    } else if (module === "AGENT") {
      const defs = await prisma.aiAgentDefinition.findMany({ where: { isActive: true } });
      insight = {
        title: "Autonomous Agents",
        summary: `${defs.length} agent definitions registered. POST /api/v1/ai/agents/run to execute.`,
        recommendations: defs.map((d) => d.name),
      };
    } else if (ANALYZERS[module]) {
      insight = await ANALYZERS[module]();
    }

    if (!insight) throw new Error("Unknown module");

    let aiSummary: string | null = null;
    if (question) {
      aiSummary = await summarizeWithAi(JSON.stringify(insight), question);
    }

    const output = aiSummary ?? insight.summary;

    await prisma.aIInsight.create({
      data: {
        type: module,
        title: insight.title,
        narrative: output,
        score: insight.score,
        payload: { ...insight, aiSummary } as object,
      },
    });

    if (insight.recommendations?.length) {
      for (const rec of insight.recommendations.slice(0, 3)) {
        await prisma.aIRecommendation.create({
          data: {
            type: module,
            title: rec.slice(0, 80),
            summary: rec,
            payload: { module },
            confidence: (insight.score ?? 70) / 100,
          },
        });
      }
    }

    await prisma.aiModuleRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        output,
        insights: insight as object,
        completedAt: new Date(),
      },
    });

    return { runId: run.id, module, insight, aiSummary, output };
  } catch (e) {
    await prisma.aiModuleRun.update({
      where: { id: run.id },
      data: { status: "FAILED", output: (e as Error).message, completedAt: new Date() },
    });
    throw e;
  }
}

export async function listAgentDefinitions() {
  return prisma.aiAgentDefinition.findMany({ orderBy: { name: "asc" } });
}

export { processWhatsAppMessage, listWhatsAppSessions, runAgent, listAgentRuns, processVoiceInput };
