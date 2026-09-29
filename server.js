import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client, StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {toNodeHandler} from '@modelcontextprotocol/node';
import {OpportunityStore} from './src/store.js';
import {createBountyPilotHandler} from './src/mcp.js';

const root=fileURLToPath(new URL('.',import.meta.url));
const publicRoot=join(root,'public');
const port=Number(process.env.PORT || 4310);
const host=process.env.HOST || '127.0.0.1';
const stateFile=process.env.BOUNTYPILOT_STATE || join(root,'data','state.json');

const store=new OpportunityStore(stateFile);
const mcpHandler=createBountyPilotHandler(store);
const mcpNodeHandler=toNodeHandler(mcpHandler);

const contentTypes={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.svg':'image/svg+xml',
  '.json':'application/json; charset=utf-8'
};

function sendJson(res,status,value) {
  const body=JSON.stringify(value);
  res.writeHead(status,{
    'content-type':'application/json; charset=utf-8',
    'content-length':Buffer.byteLength(body),
    'cache-control':'no-store'
  });
  res.end(body);
}

async function readJson(req) {
  let raw='';
  for await (const chunk of req) raw+=chunk;
  if (!raw) return {};
  return JSON.parse(raw);
}

async function callMcpTool(name,args={}) {
  const client=new Client(
    {name:'bountypilot-alexa-simulator',version:'0.1.0'},
    {versionNegotiation:{mode:'auto'}}
  );
  const transport=new StreamableHTTPClientTransport(new URL(`http://${host}:${port}/mcp`));
  try {
    await client.connect(transport);
    const era=client.getProtocolEra?.() ?? 'unknown';
    const response=await client.callTool({name,arguments:args});
    return {era,response};
  } finally {
    await client.close();
  }
}

function structured(call) {
  return call.response?.structuredContent ?? call.response?.content?.[0]?.text ?? null;
}

async function serveStatic(pathname,res) {
  const requested=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const safe=normalize(requested).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath=join(publicRoot,safe);
  if (!filePath.startsWith(publicRoot)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const body=await readFile(filePath);
    res.writeHead(200,{
      'content-type':contentTypes[extname(filePath)] ?? 'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});
    res.end('Not found');
  }
}

const server=http.createServer(async (req,res)=>{
  try {
    const url=new URL(req.url ?? '/',`http://${req.headers.host ?? `${host}:${port}`}`);

    if (url.pathname==='/mcp') {
      await mcpNodeHandler(req,res);
      return;
    }

    if (req.method==='POST' && url.pathname==='/api/triage') {
      const body=await readJson(req);
      const trace=[];

      const analyzed=await callMcpTool('analyze_opportunity',{
        title:body.title,
        listing:body.listing,
        ...(body.sourceUrl?{sourceUrl:body.sourceUrl}:{})
      });
      trace.push({tool:'analyze_opportunity',era:analyzed.era});

      const saved=await callMcpTool('save_opportunity',{
        title:body.title,
        listing:body.listing,
        ...(body.sourceUrl?{sourceUrl:body.sourceUrl}:{})
      });
      trace.push({tool:'save_opportunity',era:saved.era});

      const queue=await callMcpTool('get_opportunity_queue',{});
      trace.push({tool:'get_opportunity_queue',era:queue.era});

      const next=await callMcpTool('next_best_action',{});
      trace.push({tool:'next_best_action',era:next.era});

      sendJson(res,200,{
        analysis:structured(analyzed),
        saved:structured(saved),
        queue:structured(queue),
        next:structured(next),
        trace
      });
      return;
    }

    if (req.method==='GET' && url.pathname==='/api/queue') {
      const queue=await callMcpTool('get_opportunity_queue',{});
      sendJson(res,200,{queue:structured(queue),era:queue.era});
      return;
    }

    if (req.method==='POST' && url.pathname==='/api/plan') {
      const body=await readJson(req);
      const plan=await callMcpTool('build_submission_plan',{id:body.id});
      sendJson(res,200,{plan:structured(plan),era:plan.era});
      return;
    }

    if (req.method==='POST' && url.pathname==='/api/status') {
      const body=await readJson(req);
      const changed=await callMcpTool('set_opportunity_status',{id:body.id,status:body.status});
      const queue=await callMcpTool('get_opportunity_queue',{});
      sendJson(res,200,{changed:structured(changed),queue:structured(queue),era:changed.era});
      return;
    }

    if (req.method==='POST' && url.pathname==='/api/reset') {
      await store.reset();
      sendJson(res,200,{ok:true});
      return;
    }

    if (req.method==='GET' || req.method==='HEAD') {
      await serveStatic(url.pathname,res);
      return;
    }

    res.writeHead(405,{'content-type':'text/plain; charset=utf-8'});
    res.end('Method not allowed');
  } catch (error) {
    sendJson(res,500,{error:error instanceof Error?error.message:String(error)});
  }
});

server.listen(port,host,()=>{
  console.log(`BountyPilot MCP + Alexa+ simulator: http://${host}:${port}`);
  console.log(`MCP endpoint: http://${host}:${port}/mcp`);
});

async function shutdown() {
  await mcpHandler.close?.();
  server.close(()=>process.exit(0));
}

process.on('SIGINT',shutdown);
process.on('SIGTERM',shutdown);
