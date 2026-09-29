import {McpServer, createMcpHandler} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {analyzeOpportunity, buildSubmissionPlan} from './analyzer.js';

const statuses=['candidate','building','submitted','won','lost','skipped'];

function result(value) {
  return {
    content:[{type:'text',text:JSON.stringify(value,null,2)}],
    structuredContent:value
  };
}

export function buildMcpServer(store) {
  const server=new McpServer(
    {name:'bountypilot',version:'0.1.0',websiteUrl:'https://github.com/'},
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
        sourceUrl:z.string().url().optional()
      })
    },
    async ({title,listing,sourceUrl})=>{
      const analysis=analyzeOpportunity({title,listing});
      return result(await store.saveOpportunity({title,listing,sourceUrl:sourceUrl??null,analysis}));
    }
  );

  server.registerTool(
    'get_opportunity_queue',
    {
      description:'Return the persistent opportunity queue ordered by active status and fit score.',
      inputSchema:z.object({})
    },
    async ()=>result({
      profile:await store.getProfile(),
      opportunities:await store.list()
    })
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
      inputSchema:z.object({id:z.string().uuid()})
    },
    async ({id})=>{
      const item=await store.get(id);
      if (!item) return {content:[{type:'text',text:'Opportunity not found'}],isError:true};
      return result({id:item.id,title:item.title,status:item.status,verdict:item.analysis.verdict,steps:buildSubmissionPlan(item)});
    }
  );

  server.registerTool(
    'set_opportunity_status',
    {
      description:'Update a saved opportunity status as the builder moves from candidate to building, submitted, or a terminal result.',
      inputSchema:z.object({
        id:z.string().uuid(),
        status:z.enum(statuses)
      })
    },
    async ({id,status})=>{
      const item=await store.updateStatus(id,status);
      if (!item) return {content:[{type:'text',text:'Opportunity not found'}],isError:true};
      return result({id:item.id,title:item.title,status:item.status,updatedAt:item.updatedAt});
    }
  );

  server.registerTool(
    'next_best_action',
    {
      description:'Choose the highest-fit active saved opportunity and return the next concrete action, preserving blockers and unknowns.',
      inputSchema:z.object({})
    },
    async ()=>{
      const items=await store.list();
      const active=items.filter((item)=>!['won','lost','skipped'].includes(item.status));
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
