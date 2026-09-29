import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {OpportunityStore} from '../src/store.js';

test('queue persists and orders higher score first',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'bountypilot-'));
  const file=join(dir,'state.json');
  const store=new OpportunityStore(file);
  try {
    const low=await store.saveOpportunity({
      title:'Low',
      listing:'low',
      analysis:{score:55,verdict:'REVIEW'}
    });
    const high=await store.saveOpportunity({
      title:'High',
      listing:'high',
      analysis:{score:91,verdict:'GO'}
    });

    const list=await store.list();
    assert.equal(list[0].id,high.id);
    assert.equal(list[1].id,low.id);

    await store.updateStatus(high.id,'submitted');
    const reopened=new OpportunityStore(file);
    assert.equal((await reopened.get(high.id)).status,'submitted');
  } finally {
    await rm(dir,{recursive:true,force:true});
  }
});
