const $=(selector)=>document.querySelector(selector);

const transcript=$('#transcript');
const composer=$('#composer');
const utteranceInput=$('#utterance');
const sendButton=$('#sendButton');
const attachment=$('#attachment');
const attachmentTitle=$('#attachmentTitle');
const listingTitle=$('#listingTitle');
const listingText=$('#listingText');
const queue=$('#queue');
const runtimeBadge=$('#runtimeBadge');
const storageBadge=$('#storageBadge');
const voiceToggle=$('#voiceToggle');

const samples={
  go:{
    title:'Build With AI: Basics',
    listing:'Build With AI: Basics. $1,250 cash first prize. Deadline: October 26, 2026. Build a new app and submit a public GitHub repository plus a 1â€“3 minute demo video. No interview required. Judging is asynchronous after submission.'
  },
  review:{
    title:'External Help Wanted â€” $250',
    listing:'$250 reward. Post a proposal and wait for assignment. You must be hired through Upwork before creating a pull request. GitHub implementation is required after selection.'
  },
  skip:{
    title:'Developer challenge with live final',
    listing:'$500 developer challenge. Deadline: October 12. Submit a GitHub repository first. Shortlisted developers must complete a live technical interview on Zoom and a live demo call.'
  }
};

const storageLabels={
  'redis-durable':['State Â· durable','Saved in Redis; survives restarts and redeploys.',true],
  'local-file':['State Â· local file','Saved to data/state.json on this machine.',true],
  'ephemeral-vercel-tmp':['State Â· temporary','Hosted demo without a database: the queue may reset on a cold start.',false],
  memory:['State Â· memory','In-memory only.',false]
};

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key,value) {
  try { localStorage.setItem(key,value); } catch { /* private mode: fall back to a per-tab id */ }
}

let workspace=storageGet('bountypilot.workspace');
if (!workspace || !/^[A-Za-z0-9_-]{1,64}$/.test(workspace)) {
  workspace=crypto.randomUUID();
  storageSet('bountypilot.workspace',workspace);
}
$('#workspaceId').textContent=workspace.slice(0,8);

const canSpeak='speechSynthesis' in window;
let voiceOn=canSpeak && storageGet('bountypilot.voice')!=='off';
let userHasInteracted=false;

function renderVoiceToggle() {
  voiceToggle.hidden=!canSpeak;
  voiceToggle.textContent=`Voice replies Â· ${voiceOn?'on':'off'}`;
  voiceToggle.setAttribute('aria-pressed',String(voiceOn));
}

function speak(text) {
  // Browsers block speech before the first user gesture, so the page-load greeting stays silent.
  if (!voiceOn || !userHasInteracted) return;
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='en-US';
  utterance.rate=1.02;
  speechSynthesis.speak(utterance);
}

async function api(path,options={}) {
  const response=await fetch(path,{
    ...options,
    headers:{'content-type':'application/json',...(options.headers??{})}
  });
  const body=await response.json();
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

function el(tag,className,text) {
  const node=document.createElement(tag);
  if (className) node.className=className;
  if (text!==undefined) node.textContent=text;
  return node;
}

function scrollToEnd() {
  transcript.scrollTop=transcript.scrollHeight;
}

function addUserTurn(text,listing) {
  const turn=el('div','turn user');
  turn.append(el('p','bubble',text));
  if (listing) turn.append(el('p','attached',`Listing attached: ${listing.title || 'untitled'}`));
  transcript.append(turn);
  scrollToEnd();
}

function renderOpportunityCard(card) {
  const box=el('div','card opportunity');
  const head=el('div','card-head');
  const verdict=el('span','verdict-chip',card.verdict);
  verdict.dataset.kind=card.verdict.toLowerCase();
  head.append(verdict,el('strong','',card.title),el('span','card-score',`${card.score}/100`));
  box.append(head);

  const facts=el('div','facts');
  for (const [label,value] of [
    ['Reward',card.reward ?? 'Unknown'],
    ['Deadline',card.deadline ?? 'Unknown'],
    ['Live gate',card.liveGate?'Detected':'None detected'],
    ['Pre-hire',card.preHire?'Required':'None detected']
  ]) {
    const cell=el('div');
    cell.append(el('span','',label),el('strong','',value));
    facts.append(cell);
  }
  box.append(facts);

  const why=[...card.reasons,...card.unknowns.map((x)=>`Unknown: ${x}`)];
  if (why.length) {
    const list=el('ul','why');
    for (const line of why) list.append(el('li','',line));
    box.append(list);
  }
  return box;
}

function renderPlanCard(card) {
  const box=el('div','card plan-card');
  const head=el('div','card-head');
  head.append(el('strong','',`Plan Â· ${card.title}`),el('span','status',card.status));
  box.append(head);
  const list=el('ol');
  for (const step of card.steps) list.append(el('li','',step));
  box.append(list);
  return box;
}

function renderQueueCarousel(card) {
  const rail=el('div','carousel');
  if (!card.items.length) {
    rail.append(el('p','queue-empty','Nothing saved yet.'));
    return rail;
  }
  for (const item of card.items) {
    const tile=el('div','tile');
    tile.append(el('strong','tile-score',String(item.score)),el('span','tile-title',item.title));
    const meta=el('span','tile-meta',`${item.verdict} Â· ${item.status}`);
    tile.append(meta,el('span','tile-sub',item.reward ?? 'reward unknown'));
    rail.append(tile);
  }
  return rail;
}

function renderBriefingCard(card) {
  const box=el('div','card briefing-card');
  const head=el('div','card-head');
  head.append(el('strong','','Today\'s priority brief'),el('span','status',`${card.activeCount} active`));
  box.append(head);

  const list=el('ol','briefing-list');
  for (const item of card.items) {
    const li=el('li','briefing-item');
    const title=el('strong','',item.title);
    const meta=el('span','briefing-meta',`${item.score}/100 Â· ${item.status} Â· ${item.reward ?? 'reward unknown'} Â· ${item.deadline ?? 'deadline unknown'}`);
    const next=el('span','briefing-next',`Next: ${item.nextAction}`);
    li.append(title,meta,next);
    if (item.blocker) li.append(el('span','briefing-blocker',`Watch: ${item.blocker}`));
    list.append(li);
  }
  box.append(list);
  return box;
}

function renderStatusCard(card) {
  return el('div','card status-card',`${card.title} â†’ ${card.status}`);
}

const renderers={
  opportunity:renderOpportunityCard,
  plan:renderPlanCard,
  queue:renderQueueCarousel,
  briefing:renderBriefingCard,
  status:renderStatusCard
};

function addAssistantTurn(payload) {
  const turn=el('div','turn assistant');
  const bubble=el('div','bubble');
  bubble.append(el('span','orb small'),el('p','',payload.reply));
  turn.append(bubble);
  for (const card of payload.cards ?? []) turn.append(renderers[card.type](card));

  if (payload.trace?.length) {
    const details=el('details','trace');
    details.append(el('summary','',`${payload.trace.length} MCP tool call${payload.trace.length===1?'':'s'}`));
    const list=el('ol');
    for (const step of payload.trace) {
      const li=el('li');
      li.append(el('strong','',step.tool),el('em','',step.transport));
      list.append(li);
    }
    details.append(list);
    turn.append(details);
  }
  transcript.append(turn);
  scrollToEnd();
  speak(payload.reply);
}

function addErrorTurn(message) {
  const turn=el('div','turn assistant');
  turn.append(el('p','bubble error',`Something went wrong: ${message}`));
  transcript.append(turn);
  scrollToEnd();
}

function renderQueue(data) {
  const opportunities=data?.opportunities ?? [];
  queue.innerHTML='';
  if (!opportunities.length) {
    queue.append(el('p','queue-empty','Nothing saved yet.'));
    return;
  }
  for (const item of opportunities) {
    const row=el('article','queue-item');
    const score=el('div','queue-score');
    score.append(el('strong','',String(item.analysis.score)),el('span','','fit'));
    const main=el('div','queue-main');
    const top=el('div','queue-top');
    top.append(el('h3','',item.title),el('span','status',item.status));
    main.append(top,el('p','',`${item.analysis.verdict} Â· ${item.analysis.reward?.text ?? 'reward unknown'} Â· ${item.analysis.deadline ?? 'deadline unknown'}`));
    row.append(score,main);
    queue.append(row);
  }
}

async function refreshQueue() {
  const result=await api(`/api/queue?workspace=${encodeURIComponent(workspace)}`);
  runtimeBadge.textContent='MCP Â· connected';
  runtimeBadge.classList.add('connected');
  renderQueue(result.queue);
}

function currentListing() {
  if (attachment.classList.contains('hidden')) return null;
  const listing=listingText.value.trim();
  if (!listing) return null;
  return {title:listingTitle.value.trim(),listing};
}

function attach(sample) {
  attachment.classList.remove('hidden');
  listingTitle.value=sample?.title ?? '';
  listingText.value=sample?.listing ?? '';
  attachmentTitle.textContent=sample ? 'Sample listing attached' : 'Your listing';
  if (!utteranceInput.value.trim()) utteranceInput.value='Alexa, is this worth building?';
  (sample ? utteranceInput : listingText).focus();
}

function detach() {
  attachment.classList.add('hidden');
  listingTitle.value='';
  listingText.value='';
}

async function send(utterance,{silentUser=false}={}) {
  const listing=currentListing();
  const text=utterance.trim() || (listing ? 'Is this worth building?' : '');
  if (!text) return;
  if (!silentUser) addUserTurn(text,listing);
  sendButton.disabled=true;
  try {
    const payload=await api('/api/converse',{
      method:'POST',
      body:JSON.stringify({utterance:text,workspace,...(listing??{})})
    });
    runtimeBadge.textContent='MCP Â· connected';
    runtimeBadge.classList.add('connected');
    addAssistantTurn(payload);
    if (listing) detach();
    await refreshQueue();
  } catch (error) {
    addErrorTurn(error.message);
  } finally {
    sendButton.disabled=false;
  }
}

composer.addEventListener('submit',(event)=>{
  event.preventDefault();
  userHasInteracted=true;
  const text=utteranceInput.value;
  utteranceInput.value='';
  send(text);
});

for (const button of document.querySelectorAll('[data-say]')) {
  button.addEventListener('click',()=>{
    userHasInteracted=true;
    send(button.dataset.say);
  });
}

for (const button of document.querySelectorAll('[data-sample]')) {
  button.addEventListener('click',()=>attach(samples[button.dataset.sample]));
}
$('#ownListingButton').addEventListener('click',()=>attach(null));
$('#removeAttachment').addEventListener('click',detach);

voiceToggle.addEventListener('click',()=>{
  userHasInteracted=true;
  voiceOn=!voiceOn;
  storageSet('bountypilot.voice',voiceOn?'on':'off');
  if (!voiceOn && canSpeak) speechSynthesis.cancel();
  renderVoiceToggle();
});

$('#newSessionButton').addEventListener('click',()=>{
  userHasInteracted=true;
  transcript.innerHTML='';
  send('Alexa, open BountyPilot');
});

$('#resetButton').addEventListener('click',async()=>{
  userHasInteracted=true;
  await api('/api/reset',{method:'POST',body:JSON.stringify({workspace})});
  transcript.innerHTML='';
  await refreshQueue();
  send('Alexa, open BountyPilot',{silentUser:true});
});

$('#refreshQueueButton').addEventListener('click',()=>refreshQueue().catch(()=>{}));

async function boot() {
  renderVoiceToggle();
  try {
    const health=await api('/health');
    const [label,title,durable]=storageLabels[health.state] ?? [`State Â· ${health.state}`,'',false];
    storageBadge.textContent=label;
    storageBadge.title=title;
    storageBadge.classList.toggle('connected',durable);
    storageBadge.classList.toggle('warn',!durable);
  } catch {
    storageBadge.textContent='State Â· unknown';
  }
  await refreshQueue().catch(()=>{});
  send('Alexa, open BountyPilot',{silentUser:true});
}

boot();