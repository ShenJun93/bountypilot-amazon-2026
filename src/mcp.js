import {McpServer, createMcpHandler} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {analyzeOpportunity, buildSubmissionPlan} from './analyzer.js';
import {WORKSPACE_PATTERN} from './backends.js';

const statuses=['candidate','building','submitted','won','lost','skipped'];

const workspace=z.string().regex(WORKSPACE_PATTERN).optional()
  .describe('Queue to read or write. Each user or device keeps its own workspace; defaults to "default".');

function result(value) {
  return {
    content:[{type:'text',text:JSON.stringify(value,null,2)}],
    structuredContent:value
  };
}

function notFound() {
  return {content:[{type:'text',text:'Opportunity not found'}],isError:true};
}

function briefingItem(item) {
  const plan=buildSubmissionPlan(item);
  let blocker=null;
  if (item.analysis.signals.liveGate) blocker='Mandatory live/interview gate';
  else if (item.analysis.signals.preHireGate) blocker='Pre-hire or assignment gate';
  else if (item.analysis.unknowns?.length) blocker=item.analysis.unknowns[0];

  return {
    id:item.id,
    title:item.title,
    status:item.status,
    verdict:item.analysis.verdict,
    score:item.analysis.score,
    reward:item.analysis.reward?.text ?? null,
    deadline:item.analysis.deadline ?? null,
    blocker,
    nextAction:plan[0] ?? 'Review the opportunity manually.'
  };
}

export function buildMcpServer(store) {
  const scoped=(id)=>store.forWorkspace(id ?? 'default');
  const server=new McpServer(
    {name:'bountypilot',version:'0.2.0',websiteUrl:'https://github.com/ShenJun93/bountypilot-amazon-2026'},
    {capabilities:{tools:{}}}
  );

  server.registerTool(
    'analyze_opportunity',
    {
      description:'Analyze a bounty or hackathon listing against an async code-first profile and return an explainable GO, REVIEW, or SKIP decision.',
      inputSchema:z.object({
        title:z.string().min(1),
        listing:z.string().min(20),
        sourceUrl:z.string().url().optional()
      })
    },
    async ({title,listing,sourceUrl})=>result({
      sourceUrl:sourceUrl??null,
      analysis:analyzeOpportunity({title,listing})
    })
  );

  server.registerTool(
    'save_opportunity',
    {
      description:'Analyze and save an opportunity into the persistent bounty queue so it can be revisited across sessions.',
      inputSchema:z.object({
        title:z.string().min(1),
        listing:z.string().min(20),
        sourceUrl:z.string().url().optional(),
        workspace
      })
    },
    async ({title,listing,sourceUrl,workspace:ws})=>{
      const analysis=analyzeOpportunity({title,listing});
      return result(await scoped(ws).saveOpportunity({title,listing,sourceUrl:sourceUrl??null,analysis}));
    }
  );

  server.registerTool(
    'get_opportunity_queue',
    {
      description:'Return the persistent opportunity queue ordered by active status and fit score.',
      inputSchema:z.object({workspace})
    },
    async ({workspace:ws})=>{
      const s=scoped(ws);
      return result({profile:await s.getProfile(),opportunities:await s.list()});
    }
  );

  server.registerTool(
    'compare_opportunities',
    {
      description:'Compare several unsaved opportunity listings and return them ordered by fit score without hiding blockers or unknowns.',
      inputSchema:z.object({
        opportunities:z.array(z.object({
          title:z.string().min(1),
          listing:z.string().min(20)
        })).min(2).max(8)
      })
    },
    async ({opportunities})=>{
      const ranked=opportunities
        .map((item)=>analyzeOpportunity(item))
        .sort((a,b)=>b.score-a.score);
      return result({opportunities:ranked});
    }
  );

  server.registerTool(
    'build_submission_plan',
    {
      description:'Build a concrete next-action submission plan for one saved opportunity.',
      inputSchema:z.object({id:z.string().uuid(),workspace})
    },
    async ({id,workspace:ws})=>{
      const item=await scoped(ws).get(id);
      if (!item) return notFound();
      return result({id:item.id,title:item.title,status:item.status,verdict:item.analysis.verdict,steps:buildSubmissionPlan(item)});
    }
  );

  server.registerTool(
    'set_opportunity_status',
    {
      description:'Update a saved opportunity status as the builder moves from candidate to building, submitted, or a terminal result.',
      inputSchema:z.object({
        id:z.string().uuid(),
        status:z.enum(statuses),
        workspace
      })
    },
    async ({id,status,workspace:ws})=>{
      const item=await scoped(ws).updateStatus(id,status);
      if (!item) return notFound();
      return result({id:item.id,title:item.title,status:item.status,updatedAt:item.updatedAt});
    }
  );

  server.registerTool(
    'daily_briefing',
    {
      description:'Return the top active opportunities for today with reward, deadline, blocker, status, fit score, and one concrete next action for each.',
      inputSchema:z.object({
        workspace,
        limit:z.number().int().min(1).max(5).default(3)
      })
    },
    async ({workspace:ws,limit})=>{
      const items=await scoped(ws).list();
      const open=items.filter((item)=>!['won','lost','skipped'].includes(item.status));
      const actionable=[
        ...open.filter((item)=>item.status!=='submitted'),
        ...open.filter((item)=>item.status==='submitted')
      ];
      return result({
        activeCount:open.length,
        priorities:actionable.slice(0,limit).map(briefingItem)
      });
    }
  );

  server.registerTool(
    'next_best_action',
    {
      description:'Choose the highest-fit active saved opportunity and return the next concrete action, preserving blockers and unknowns.',
      inputSchema:z.object({workspace})
    },
    async ({workspace:ws})=>{
      const items=await scoped(ws).list();
      const open=items.filter((item)=>!['won','lost','skipped'].includes(item.status));
      // Work that can still move comes before work that is only waiting on judges.
      const active=[...open.filter((i)=>i.status!=='submitted'),...open.filter((i)=>i.status==='submitted')];
      if (!active.length) return result({message:'No active opportunities in the queue.',opportunity:null,nextAction:null});
      const item=active[0];
      const plan=buildSubmissionPlan(item);
      return result({
        opportunity:{id:item.id,title:item.title,status:item.status,score:item.analysis.score,verdict:item.analysis.verdict},
        nextAction:plan[0]??'Review the opportunity manually.'
      });
    }
  );

  return server;
}

export function createBountyPilotHandler(store) {
  return createMcpHandler(()=>buildMcpServer(store));
}
