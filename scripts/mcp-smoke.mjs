import {Client, StreamableHTTPClientTransport} from '@modelcontextprotocol/client';

const base=process.env.BOUNTYPILOT_URL || 'http://127.0.0.1:4310';
const client=new Client(
  {name:'bountypilot-smoke',version:'0.1.0'},
  {versionNegotiation:{mode:'auto'}}
);
const transport=new StreamableHTTPClientTransport(new URL(`${base}/mcp`));

try {
  await client.connect(transport);
  const tools=await client.listTools();
  const analyzed=await client.callTool({
    name:'analyze_opportunity',
    arguments:{
      title:'Smoke Test Bounty',
      listing:'$500 cash bounty. Deadline: October 20. No interview required. Submit a public GitHub repository and demo video.'
    }
  });
  console.log(JSON.stringify({
    protocolEra:client.getProtocolEra?.() ?? 'unknown',
    toolCount:tools.tools.length,
    tools:tools.tools.map((tool)=>tool.name),
    verdict:analyzed.structuredContent?.analysis?.verdict,
    score:analyzed.structuredContent?.analysis?.score
  },null,2));
} finally {
  await client.close();
}
