import { prisma } from "@/repositories/prisma";
import { ensureDefaultPipeline, getPipelineBoard } from "@/modules/crm/pipeline";
import type { QuotationLineInput } from "@/modules/crm/types";
import type {
  CrmCampaignStatus,
  CrmFollowUpType,
  CrmLeadStatus,
  CrmOpportunityStage,
  CrmQuotationStatus,
  CrmTicketPriority,
  CrmTicketStatus,
} from "@prisma/client";
import { randomBytes } from "crypto";

function quoteNumber() {
  return `QT-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function ticketNumber() {
  return `TKT-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function calcQuotationTotals(lines: QuotationLineInput[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  return { subtotal, tax, total: subtotal + tax };
}

export async function getCrmDashboard(tenantId?: string | null) {
  const where = { tenantId: tenantId ?? undefined };
  const [
    leadCount,
    customerCount,
    openOpportunities,
    pipelineValue,
    pendingFollowUps,
    openTickets,
    activeCampaigns,
    pendingReferrals,
    recentLeads,
    recentTickets,
  ] = await Promise.all([
    prisma.crmLead.count({ where: { ...where, status: { not: "LOST" } } }),
    prisma.crmCustomer.count({ where }),
    prisma.crmOpportunity.count({
      where: { ...where, stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
    }),
    prisma.crmOpportunity.aggregate({
      where: { ...where, stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
      _sum: { amount: true },
    }),
    prisma.crmFollowUp.count({
      where: { isCompleted: false, scheduledAt: { lte: new Date(Date.now() + 7 * 86400_000) } },
    }),
    prisma.crmSupportTicket.count({
      where: { ...where, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] } },
    }),
    prisma.crmCampaign.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.crmReferral.count({ where: { status: "pending" } }),
    prisma.crmLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.crmSupportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  return {
    stats: {
      leads: leadCount,
      customers: customerCount,
      openOpportunities,
      pipelineValue: Number(pipelineValue._sum.amount ?? 0),
      pendingFollowUps,
      openTickets,
      activeCampaigns,
      pendingReferrals,
    },
    recentLeads,
    recentTickets,
  };
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function listLeads(tenantId?: string | null, status?: CrmLeadStatus) {
  return prisma.crmLead.findMany({
    where: {
      tenantId: tenantId ?? undefined,
      ...(status ? { status } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLead(
  tenantId: string | null | undefined,
  createdById: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    notes?: string;
    assigneeId?: string;
    score?: number;
  }
) {
  return prisma.crmLead.create({
    data: {
      tenantId,
      createdById,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      source: data.source,
      notes: data.notes,
      assigneeId: data.assigneeId,
      score: data.score ?? 0,
    },
  });
}

export async function updateLead(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    company: string;
    source: string;
    status: CrmLeadStatus;
    score: number;
    notes: string;
    assigneeId: string | null;
  }>
) {
  return prisma.crmLead.update({ where: { id }, data });
}

export async function convertLeadToCustomer(leadId: string, ownerId?: string) {
  const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "CONVERTED") throw new Error("Lead already converted");

  const customer = await prisma.crmCustomer.create({
    data: {
      tenantId: lead.tenantId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      ownerId,
    },
  });

  await prisma.crmLead.update({
    where: { id: leadId },
    data: { status: "CONVERTED", convertedAt: new Date(), customerId: customer.id },
  });

  return customer;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function listCustomers(tenantId?: string | null) {
  return prisma.crmCustomer.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { opportunities: true, tickets: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createCustomer(
  tenantId: string | null | undefined,
  data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    userId?: string;
    ownerId?: string;
    tags?: string[];
  }
) {
  return prisma.crmCustomer.create({
    data: {
      tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      address: data.address,
      userId: data.userId,
      ownerId: data.ownerId,
      tags: data.tags,
    },
  });
}

// ─── Opportunities (Sales) ─────────────────────────────────────────────────

export async function listOpportunities(tenantId?: string | null) {
  return prisma.crmOpportunity.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      pipelineStage: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createOpportunity(
  tenantId: string | null | undefined,
  ownerId: string,
  data: {
    title: string;
    customerId?: string;
    leadId?: string;
    amount?: number;
    stage?: CrmOpportunityStage;
    expectedClose?: string;
    notes?: string;
  }
) {
  const pipeline = await ensureDefaultPipeline(tenantId);
  const firstStage = pipeline.stages[0];

  return prisma.crmOpportunity.create({
    data: {
      tenantId,
      ownerId,
      title: data.title,
      customerId: data.customerId,
      leadId: data.leadId,
      amount: data.amount ?? 0,
      stage: data.stage ?? "PROSPECTING",
      stageId: firstStage?.id,
      probability: firstStage?.probability ?? 10,
      expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
      notes: data.notes,
    },
  });
}

export async function updateOpportunity(
  id: string,
  data: Partial<{
    title: string;
    stage: CrmOpportunityStage;
    stageId: string;
    amount: number;
    probability: number;
    expectedClose: string | null;
    notes: string;
    ownerId: string;
    customerId: string;
  }>
) {
  const update: Record<string, unknown> = { ...data };
  if (data.expectedClose !== undefined) {
    update.expectedClose = data.expectedClose ? new Date(data.expectedClose) : null;
  }
  if (data.stage === "CLOSED_WON" || data.stage === "CLOSED_LOST") {
    update.closedAt = new Date();
  }
  return prisma.crmOpportunity.update({ where: { id }, data: update });
}

export { getPipelineBoard, ensureDefaultPipeline };

// ─── Follow Ups ──────────────────────────────────────────────────────────────

export async function listFollowUps(assigneeId?: string, upcomingOnly = false) {
  return prisma.crmFollowUp.findMany({
    where: {
      ...(assigneeId ? { assigneeId } : {}),
      ...(upcomingOnly ? { isCompleted: false } : {}),
    },
    include: {
      lead: { select: { id: true, name: true } },
      opportunity: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function createFollowUp(data: {
  type?: CrmFollowUpType;
  subject: string;
  notes?: string;
  scheduledAt: string;
  leadId?: string;
  opportunityId?: string;
  assigneeId?: string;
}) {
  return prisma.crmFollowUp.create({
    data: {
      type: data.type ?? "CALL",
      subject: data.subject,
      notes: data.notes,
      scheduledAt: new Date(data.scheduledAt),
      leadId: data.leadId,
      opportunityId: data.opportunityId,
      assigneeId: data.assigneeId,
    },
  });
}

export async function completeFollowUp(id: string) {
  return prisma.crmFollowUp.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date() },
  });
}

// ─── Quotations ──────────────────────────────────────────────────────────────

export async function listQuotations(tenantId?: string | null) {
  return prisma.crmQuotation.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: {
      customer: { select: { id: true, name: true } },
      lines: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createQuotation(
  tenantId: string | null | undefined,
  createdById: string,
  data: {
    customerId?: string;
    opportunityId?: string;
    validUntil?: string;
    notes?: string;
    lines: QuotationLineInput[];
  }
) {
  const totals = calcQuotationTotals(data.lines);
  return prisma.crmQuotation.create({
    data: {
      tenantId,
      quoteNumber: quoteNumber(),
      customerId: data.customerId,
      opportunityId: data.opportunityId,
      createdById,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      lines: {
        create: data.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.quantity * l.unitPrice,
        })),
      },
    },
    include: { lines: true },
  });
}

export async function updateQuotationStatus(id: string, status: CrmQuotationStatus) {
  const extra: Record<string, Date> = {};
  if (status === "SENT") extra.sentAt = new Date();
  if (status === "ACCEPTED") extra.acceptedAt = new Date();
  return prisma.crmQuotation.update({
    where: { id },
    data: { status, ...extra },
  });
}

// ─── Marketing / Campaigns ───────────────────────────────────────────────────

export async function listCampaigns(tenantId?: string | null) {
  return prisma.crmCampaign.findMany({
    where: { tenantId: tenantId ?? undefined },
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCampaign(
  tenantId: string | null | undefined,
  ownerId: string,
  data: {
    name: string;
    channel?: string;
    status?: CrmCampaignStatus;
    budget?: number;
    startDate?: string;
    endDate?: string;
    description?: string;
  }
) {
  return prisma.crmCampaign.create({
    data: {
      tenantId,
      ownerId,
      name: data.name,
      channel: data.channel,
      status: data.status ?? "DRAFT",
      budget: data.budget,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      description: data.description,
    },
  });
}

export async function addCampaignMembers(
  campaignId: string,
  members: { email?: string; phone?: string; leadId?: string }[]
) {
  return prisma.crmCampaignMember.createMany({
    data: members.map((m) => ({ campaignId, ...m })),
  });
}

// ─── Referrals ───────────────────────────────────────────────────────────────

export async function listReferrals() {
  return prisma.crmReferral.findMany({
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function recordReferral(data: {
  referrerUserId?: string;
  referrerCode?: string;
  referredEmail?: string;
  referredPhone?: string;
  rewardAmount?: number;
}) {
  return prisma.crmReferral.create({
    data: {
      referrerUserId: data.referrerUserId,
      referrerCode: data.referrerCode,
      referredEmail: data.referredEmail,
      referredPhone: data.referredPhone,
      rewardAmount: data.rewardAmount ?? 0,
    },
  });
}

export async function convertReferral(id: string, customerId: string, rewardAmount?: number) {
  return prisma.crmReferral.update({
    where: { id },
    data: {
      status: "converted",
      customerId,
      convertedAt: new Date(),
      ...(rewardAmount !== undefined ? { rewardAmount } : {}),
    },
  });
}

export async function syncUserReferrals() {
  const users = await prisma.user.findMany({
    where: { referredById: { not: null } },
    select: {
      id: true,
      email: true,
      phone: true,
      referredBy: { select: { id: true, referralCode: true } },
    },
    take: 500,
  });

  let synced = 0;
  for (const u of users) {
    if (!u.referredBy) continue;
    const existing = await prisma.crmReferral.findFirst({
      where: { referrerUserId: u.referredBy.id, referredEmail: u.email ?? undefined },
    });
    if (!existing) {
      await recordReferral({
        referrerUserId: u.referredBy.id,
        referrerCode: u.referredBy.referralCode,
        referredEmail: u.email ?? undefined,
        referredPhone: u.phone ?? undefined,
      });
      synced++;
    }
  }
  return { synced };
}

// ─── Customer Support / Ticketing ────────────────────────────────────────────

export async function listTickets(tenantId?: string | null, customerUserId?: string) {
  const customerFilter = customerUserId ? { customer: { userId: customerUserId } } : {};

  return prisma.crmSupportTicket.findMany({
    where: { tenantId: tenantId ?? undefined, ...customerFilter },
    include: {
      customer: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTicket(id: string) {
  return prisma.crmSupportTicket.findUnique({
    where: { id },
    include: {
      customer: true,
      assignee: { select: { id: true, name: true, email: true } },
      messages: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createTicket(
  tenantId: string | null | undefined,
  createdById: string,
  data: {
    subject: string;
    description?: string;
    priority?: CrmTicketPriority;
    category?: string;
    customerId?: string;
    orderId?: string;
    assigneeId?: string;
  }
) {
  return prisma.crmSupportTicket.create({
    data: {
      tenantId,
      ticketNumber: ticketNumber(),
      subject: data.subject,
      description: data.description,
      priority: data.priority ?? "NORMAL",
      category: data.category,
      customerId: data.customerId,
      orderId: data.orderId,
      assigneeId: data.assigneeId,
      createdById,
    },
  });
}

export async function updateTicket(
  id: string,
  data: Partial<{
    status: CrmTicketStatus;
    priority: CrmTicketPriority;
    assigneeId: string | null;
    category: string;
  }>
) {
  const extra: Record<string, Date> = {};
  if (data.status === "RESOLVED" || data.status === "CLOSED") {
    extra.resolvedAt = new Date();
  }
  return prisma.crmSupportTicket.update({
    where: { id },
    data: { ...data, ...extra },
  });
}

export async function addTicketMessage(
  ticketId: string,
  authorId: string,
  body: string,
  isInternal = false
) {
  return prisma.crmTicketMessage.create({
    data: { ticketId, authorId, body, isInternal },
  });
}
