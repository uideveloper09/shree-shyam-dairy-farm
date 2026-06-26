# AI Platform Admin Guide

Unified artificial intelligence hub for Shree Shyam Dairy Farm ERP.

## Modules

| Module                   | Description                                   | API                                             |
| ------------------------ | --------------------------------------------- | ----------------------------------------------- |
| **CEO Dashboard AI**     | Cross-module health score & executive summary | `POST /api/v1/ai/analyze` `{ "module": "CEO" }` |
| **Finance AI**           | Revenue, POS, profit forecasts                | `module: "FINANCE"`                             |
| **Farm AI**              | Milk, IoT, cows, processing batches           | `module: "FARM"`                                |
| **Inventory AI**         | Stock levels, expiry, demand forecast         | `module: "INVENTORY"`                           |
| **Marketing AI**         | Leads, campaigns, referrals                   | `module: "MARKETING"`                           |
| **Sales AI**             | CRM pipeline, quotations, POS                 | `module: "SALES"`                               |
| **Customer AI**          | Tickets, loyalty, subscriptions               | `module: "CUSTOMER"`                            |
| **Voice Assistant**      | Hindi/English voice commands                  | `POST /api/v1/ai/voice`                         |
| **WhatsApp AI**          | Conversational commerce via WhatsApp          | `POST /api/v1/ai/whatsapp`                      |
| **Autonomous AI Agents** | Tool-using agents with confirmation           | `POST /api/v1/ai/agents`                        |

## Run Analysis

```json
POST /api/v1/ai/analyze
{
  "module": "CEO",
  "question": "What should I focus on today?"
}
```

Optional `question` triggers OpenAI summarization when `OPENAI_API_KEY` is set.

## Voice Assistant

```json
POST /api/v1/ai/voice
{ "transcript": "Aaj kitne orders aaye?", "locale": "HI_IN" }
```

Built-in commands: milk production, orders today, weather.

## WhatsApp AI

```json
POST /api/v1/ai/whatsapp
{ "phone": "+919876543210", "message": "Paneer price kya hai?" }
```

Integrates with existing `getAiReply` product knowledge base.

## Autonomous Agents

```json
POST /api/v1/ai/agents
{ "prompt": "Show today's orders and low stock items" }
```

Pre-seeded agents: Farm Monitor, Sales Assistant, Customer Care, Inventory Optimizer, CEO Briefing.

Confirmation-required actions use `POST /api/v1/agent/runs/{id}/confirm`.

## Permissions

- `ai:read` / `ai:write` — run analysis, voice, WhatsApp, agents
- `admin:ai:read` / `admin:ai:write` — full AI admin dashboard

## Admin UI

Navigate to **`/admin/ai`**.

## Seed

```bash
npm run db:seed-ai
```

## Integration Points

- **Predictions** — `/api/v1/predictions` cron for milk/demand/inventory
- **OpenAI** — `OPENAI_API_KEY` for enhanced summaries and chat
- **Notifications** — wire `AIAlert` to notification rules
- **WhatsApp Business** — connect via integrations `WHATSAPP` provider webhook
