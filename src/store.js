import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';

const defaultProfile={
  name:'Solo Builder',
  constraints:[
    'Prefer async code-submit workflows',
    'Avoid mandatory interviews and live assessments',
    'Prioritize near-term cashflow'
  ]
};

async function ensureState(filePath) {
  await mkdir(dirname(filePath),{recursive:true});
  try {
    return JSON.parse(await readFile(filePath,'utf8'));
  } catch (error) {
    if (error?.code!=='ENOENT') throw error;
    const state={profile:defaultProfile,opportunities:[]};
    await writeFile(filePath,JSON.stringify(state,null,2));
    return state;
  }
}

async function saveState(filePath,state) {
  await writeFile(filePath,JSON.stringify(state,null,2));
}

export class OpportunityStore {
  constructor(filePath) {
    this.filePath=filePath;
  }

  async getProfile() {
    return (await ensureState(this.filePath)).profile;
  }

  async saveOpportunity({title,listing,sourceUrl=null,analysis}) {
    const state=await ensureState(this.filePath);
    const item={
      id:randomUUID(),
      title,
      listing,
      sourceUrl,
      analysis,
      status:'candidate',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    state.opportunities.push(item);
    await saveState(this.filePath,state);
    return item;
  }

  async list() {
    const state=await ensureState(this.filePath);
    return [...state.opportunities].sort((a,b)=>{
      const active=(x)=>['won','lost','skipped'].includes(x.status)?1:0;
      return active(a)-active(b) || (b.analysis?.score??0)-(a.analysis?.score??0);
    });
  }

  async get(id) {
    return (await ensureState(this.filePath)).opportunities.find((item)=>item.id===id) ?? null;
  }

  async updateStatus(id,status) {
    const state=await ensureState(this.filePath);
    const item=state.opportunities.find((entry)=>entry.id===id);
    if (!item) return null;
    item.status=status;
    item.updatedAt=new Date().toISOString();
    await saveState(this.filePath,state);
    return item;
  }

  async reset() {
    const state={profile:defaultProfile,opportunities:[]};
    await saveState(this.filePath,state);
    return state;
  }
}
