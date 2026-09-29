import express from 'express';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {InMemoryTransport} from '@modelcontextprotocol/server';
import {toNodeHandler} from '@modelcontextprotocol/node';
import {OpportunityStore} from './src/store.js';
import {buildMcpServer, createBountyPilotHandler} from './src/mcp.js';

const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT || 4310);
const isVercel=Boolean(process.env.VERCEL);
const stateFile=process.env.BOUNTYPILOT_STATE
  || (isVercel ? join(tmpdir(),'bountypilot-state.json') : join(root,'data','state.json'));

const store=new OpportunityStore(stateFile);
const mcpHandler=createBountyPilotHandler(store);
const mcpNodeHandler=toNodeHandler(mcpHandler);

function structured(call) {
  return call.response?.structuredContent ?? call.response?.content?.[0]?.text ?? null;
}

async function callMcpTool(name,args={}) {
  const [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();
  const server=buildMcpServer(store);
  const client=new Client(
    {name:'bountypilot-alexa-simulator',version:'0.1.0'},
    {versionNegotiation:{mode:'auto'}}
  );

  try {
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport)
    ]);
    const response=await client.callTool({name,arguments:args});
    return {transport:'in-memory-mcp',response};
  } finally {
    await Promise.allSettled([client.close(),server.close()]);
  }
}

const app=express();

// Keep the public Streamable HTTP MCP route ahead of body-parsing middleware.
app.all('/mcp',async (req,res)=>{
  try {
    await mcpNodeHandler(req,res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({error:error instanceof Error?error.message:String(error)});
    }
  }
});

app.use(express.json({limit:'256kb'}));

app.post('/api/triage',async (req,res,next)=>{
  try {
    const body=req.body ?? {};
    const trace=[];

    const analyzed=await callMcpTool('analyze_opportunity',{
      title:body.title,
      listing:body.listing,
      ...(body.sourceUrl?{sourceUrl:body.sourceUrl}:{})
    });
    trace.push({tool:'analyze_opportunity',transport:analyzed.transport});

    const saved=await callMcpTool('save_opportunity',{
      title:body.title,
      listing:body.listing,
      ...(body.sourceUrl?{sourceUrl:body.sourceUrl}:{})
    });
    trace.push({tool:'save_opportunity',transport:saved.transport});

    const queue=await callMcpTool('get_opportunity_queue',{});
    trace.push({tool:'get_opportunity_queue',transport:queue.transport});

    const next=await callMcpTool('next_best_action',{});
    trace.push({tool:'next_best_action',transport:next.transport});

    res.json({
      analysis:structured(analyzed),
      saved:structured(saved),
      queue:structured(queue),
      next:structured(next),
      trace
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/queue',async (_req,res,next)=>{
  try {
    const queue=await callMcpTool('get_opportunity_queue',{});
    res.json({queue:structured(queue),transport:queue.transport});
  } catch (error) {
    next(error);
  }
});

app.post('/api/plan',async (req,res,next)=>{
  try {
    const plan=await callMcpTool('build_submission_plan',{id:req.body?.id});
    res.json({plan:structured(plan),transport:plan.transport});
  } catch (error) {
    next(error);
  }
});

app.post('/api/status',async (req,res,next)=>{
  try {
    const changed=await callMcpTool('set_opportunity_status',{
      id:req.body?.id,
      status:req.body?.status
    });
    const queue=await callMcpTool('get_opportunity_queue',{});
    res.json({changed:structured(changed),queue:structured(queue),transport:changed.transport});
  } catch (error) {
    next(error);
  }
});

app.post('/api/reset',async (_req,res,next)=>{
  try {
    await store.reset();
    res.json({ok:true});
  } catch (error) {
    next(error);
  }
});

app.get('/health',(_req,res)=>{
  res.json({
    status:'ok',
    service:'bountypilot',
    transport:'streamable-http',
    state:isVercel?'ephemeral-vercel-tmp':'local-file'
  });
});

app.use(express.static(join(root,'public'),{
  etag:true,
  maxAge:0,
  setHeaders(res){res.setHeader('cache-control','no-store');}
}));

app.use((error,_req,res,_next)=>{
  res.status(500).json({error:error instanceof Error?error.message:String(error)});
});

if (!isVercel) {
  app.listen(port,'127.0.0.1',()=>{
    console.log(`BountyPilot MCP + Alexa+ simulator: http://127.0.0.1:${port}`);
    console.log(`MCP endpoint: http://127.0.0.1:${port}/mcp`);
  });
}

export default app;
