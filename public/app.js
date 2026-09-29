const $=(selector)=>document.querySelector(selector);

const titleInput=$('#titleInput');
const listingInput=$('#listingInput');
const triageButton=$('#triageButton');
const resetButton=$('#resetButton');
const refreshQueueButton=$('#refreshQueueButton');
const emptyState=$('#emptyState');
const resultState=$('#resultState');
const runtimeBadge=$('#runtimeBadge');
const verdictNode=$('#verdict');
const scoreNode=$('#score');
const voiceAnswer=$('#voiceAnswer');
const facts=$('#facts');
const reasons=$('#reasons');
const trace=$('#trace');
const nextAction=$('#nextAction');
const queue=$('#queue');

const samples={
  go:{
    title:'Build With AI: Basics',
    listing:'Build With AI: Basics. $1,250 cash first prize. Deadline: October 26, 2026. Build a new app and submit a public GitHub repository plus a 1–3 minute demo video. No interview required. Judging is asynchronous after submission.'
  },
  review:{
    title:'External Help Wanted — $250',
    listing:'$250 reward. Post a proposal and wait for assignment. You must be hired through Upwork before creating a pull request. GitHub implementation is required after selection.'
  },
  skip:{
    title:'Developer challenge with live final',
    listing:'$500 developer challenge. Deadline: October 12. Submit a GitHub repository first. Shortlisted developers must complete a live technical interview on Zoom and a live demo call.'
  }
};

async function api(path,options={}) {
  const response=await fetch(path,{
    ...options,
    headers:{'content-type':'application/json',...(options.headers??{})}
  });
  const body=await response.json();
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

function setBusy(busy) {
  triageButton.disabled=busy;
  triageButton.querySelector('span').textContent=busy?'Running MCP workflow…':'Ask BountyPilot';
}

function renderFacts(analysis) {
  facts.innerHTML='';
  const items=[
    ['Reward',analysis.reward?.text ?? 'Unknown'],
    ['Deadline',analysis.deadline ?? 'Unknown'],
    ['Live gate',analysis.signals.liveGate?'Detected':'None detected'],
    ['Pre-hire',analysis.signals.preHireGate?'Required':'None detected']
  ];
  for (const [label,value] of items) {
    const el=document.createElement('div');
    el.innerHTML=`<span>${label}</span><strong></strong>`;
    el.querySelector('strong').textContent=value;
    facts.append(el);
  }
}

function renderTrace(items) {
  trace.innerHTML='';
  for (const [index,item] of items.entries()) {
    const el=document.createElement('div');
    el.className='trace-step';
    el.innerHTML=`<span>${String(index+1).padStart(2,'0')}</span><strong></strong><em></em>`;
    el.querySelector('strong').textContent=item.tool;
    el.querySelector('em').textContent=item.transport;
    trace.append(el);
  }
}

function renderResult(payload) {
  const analysis=payload.analysis.analysis;
  emptyState.classList.add('hidden');
  resultState.classList.remove('hidden');
  verdictNode.textContent=analysis.verdict;
  verdictNode.dataset.kind=analysis.verdict.toLowerCase();
  scoreNode.textContent=analysis.score;
  runtimeBadge.textContent='MCP · connected';
  runtimeBadge.classList.add('connected');

  const speech={
    GO:`This is a strong fit. I saved ${analysis.title} to your queue and kept the blockers visible.`,
    REVIEW:`This may be worth pursuing, but there is a gate or missing fact to resolve before coding.`,
    SKIP:`I would not allocate build time under your current profile because I found a blocking live or unpaid condition.`
  };
  voiceAnswer.textContent=speech[analysis.verdict];
  renderFacts(analysis);

  reasons.innerHTML='';
  for (const reason of [...analysis.reasons,...analysis.unknowns.map((x)=>`Unknown: ${x}`)]) {
    const li=document.createElement('li');
    li.textContent=reason;
    reasons.append(li);
  }

  renderTrace(payload.trace);
  const next=payload.next;
  nextAction.textContent=next.nextAction ?? 'No active next action.';
  renderQueue(payload.queue);
}

function renderQueue(data) {
  const opportunities=data?.opportunities ?? data?.queue?.opportunities ?? [];
  queue.innerHTML='';
  if (!opportunities.length) {
    queue.innerHTML='<p class="queue-empty">Nothing saved yet.</p>';
    return;
  }

  for (const item of opportunities) {
    const card=document.createElement('article');
    card.className='queue-item';
    card.innerHTML=`
      <div class="queue-score"><strong></strong><span>fit</span></div>
      <div class="queue-main">
        <div class="queue-top"><h3></h3><span class="status"></span></div>
        <p></p>
        <div class="queue-actions">
          <button type="button" data-plan>Build plan</button>
          <button type="button" data-submitted>Mark submitted</button>
        </div>
        <div class="plan hidden"></div>
      </div>
    `;
    card.querySelector('.queue-score strong').textContent=item.analysis.score;
    card.querySelector('h3').textContent=item.title;
    card.querySelector('.status').textContent=item.status;
    card.querySelector('p').textContent=`${item.analysis.verdict} · ${item.analysis.reward?.text ?? 'reward unknown'} · ${item.analysis.deadline ?? 'deadline unknown'}`;

    card.querySelector('[data-plan]').addEventListener('click',async()=>{
      const result=await api('/api/plan',{method:'POST',body:JSON.stringify({id:item.id})});
      const box=card.querySelector('.plan');
      const plan=result.plan;
      box.classList.remove('hidden');
      box.innerHTML='';
      const ol=document.createElement('ol');
      for (const step of plan.steps) {
        const li=document.createElement('li');
        li.textContent=step;
        ol.append(li);
      }
      box.append(ol);
    });

    card.querySelector('[data-submitted]').addEventListener('click',async()=>{
      const result=await api('/api/status',{method:'POST',body:JSON.stringify({id:item.id,status:'submitted'})});
      renderQueue(result.queue);
    });

    queue.append(card);
  }
}

async function refreshQueue() {
  const result=await api('/api/queue');
  runtimeBadge.textContent='MCP · connected';
  runtimeBadge.classList.add('connected');
  renderQueue(result.queue);
}

triageButton.addEventListener('click',async()=>{
  if (!titleInput.value.trim() || !listingInput.value.trim()) return;
  setBusy(true);
  try {
    const payload=await api('/api/triage',{
      method:'POST',
      body:JSON.stringify({title:titleInput.value.trim(),listing:listingInput.value.trim()})
    });
    renderResult(payload);
  } catch (error) {
    nextAction.textContent=error.message;
  } finally {
    setBusy(false);
  }
});

for (const button of document.querySelectorAll('[data-sample]')) {
  button.addEventListener('click',()=>{
    const sample=samples[button.dataset.sample];
    titleInput.value=sample.title;
    listingInput.value=sample.listing;
  });
}

resetButton.addEventListener('click',async()=>{
  await api('/api/reset',{method:'POST',body:'{}'});
  resultState.classList.add('hidden');
  emptyState.classList.remove('hidden');
  runtimeBadge.textContent='MCP · waiting';
  runtimeBadge.classList.remove('connected');
  renderQueue({opportunities:[]});
});

refreshQueueButton.addEventListener('click',refreshQueue);

refreshQueue().catch(()=>{});
