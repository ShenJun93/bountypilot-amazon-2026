const moneyPattern = /(?:\$|USD\s*|USDC\s*)(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?)/gi;
const deadlinePattern = /(?:deadline|due|submit(?: by)?|closes?|ends?)\s*[:\-]?\s*([^\n.]{3,90})/i;

const liveGatePatterns = [
  /\binterview\b/i,
  /\bzoom\b/i,
  /\blive\s+(?:coding|assessment|review|demo|call)\b/i,
  /\btechnical\s+assessment\b/i,
  /\bsales\s+call\b/i,
  /\bphone\s+screen\b/i,
  /\bmeeting\s+required\b/i
];

const explicitAsyncPatterns = [
  /\bno\s+interviews?\b/i,
  /\bwithout\s+an?\s+interview\b/i,
  /\bno\s+calls?\s+required\b/i,
  /\basynchronous(?:ly)?\b/i,
  /\basync\b/i
];

const submissionPatterns = [
  /\bgithub\b/i,
  /\brepositor(?:y|ies)\b/i,
  /\bpull\s+request\b/i,
  /\bdemo\s+video\b/i,
  /\bdevpost\b/i,
  /\bsubmit(?:ted|ting|s)?\b/i,
  /\bcode\s+submission\b/i
];

const preHirePatterns = [
  /\bmust\s+be\s+hired\b/i,
  /\bwait\s+for\s+(?:assignment|approval)\b/i,
  /\bassigned\s+before\b/i,
  /\bupwork\s+(?:hire|hiring|contract)\b/i,
  /\bproposal\s+review\b/i
];

const unpaidPatterns = [
  /\bunpaid\b/i,
  /\bvolunteer\b/i,
  /\bno\s+(?:cash\s+)?prize\b/i,
  /\bno\s+payment\b/i
];

function evidence(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const index = match.index ?? 0;
    return text
      .slice(Math.max(0, index - 45), Math.min(text.length, index + match[0].length + 70))
      .replace(/\s+/g, ' ')
      .trim();
  }
  return null;
}

function extractReward(text) {
  const matches=[...text.matchAll(moneyPattern)]
    .map((match)=>({
      text: match[0].trim(),
      amount: Number(match[1].replace(/,/g,'')) || 0
    }))
    .sort((a,b)=>b.amount-a.amount);
  return matches[0] ?? null;
}

function extractDeadline(text) {
  return text.match(deadlinePattern)?.[1]?.trim() ?? null;
}

function isNegatedLiveGate(text) {
  return explicitAsyncPatterns.some((pattern)=>pattern.test(text));
}

function hasLiveGate(text) {
  let scrubbed=text;
  scrubbed=scrubbed
    .replace(/no\s+interviews?/gi,'')
    .replace(/without\s+an?\s+interview/gi,'')
    .replace(/no\s+calls?\s+required/gi,'');
  return liveGatePatterns.some((pattern)=>pattern.test(scrubbed));
}

export function analyzeOpportunity({title='', listing=''}) {
  const text=`${title}\n${listing}`.trim();
  if (!text) throw new Error('listing is required');

  const reward=extractReward(text);
  const deadline=extractDeadline(text);
  const signals={
    liveGate: hasLiveGate(text),
    explicitAsync: isNegatedLiveGate(text),
    codeSubmission: submissionPatterns.some((pattern)=>pattern.test(text)),
    preHireGate: preHirePatterns.some((pattern)=>pattern.test(text)),
    unpaid: unpaidPatterns.some((pattern)=>pattern.test(text)
    )
  };

  let score=50;
  const adjustments=[{delta:50,label:'Base fit'}];
  const reasons=[];
  const unknowns=[];
  const add=(delta,label)=>{
    score+=delta;
    adjustments.push({delta,label});
  };

  if (signals.unpaid) {
    add(-60,'Explicit unpaid/no-prize wording');
    reasons.push('The opportunity explicitly says it is unpaid or has no prize.');
  }
  if (signals.liveGate) {
    add(-45,'Mandatory live/interview gate');
    reasons.push('A mandatory interview or live gate conflicts with the async profile.');
  } else if (signals.explicitAsync) {
    add(18,'Explicit async/no-interview wording');
    reasons.push('The listing explicitly supports asynchronous work.');
  } else {
    unknowns.push('Interview/live-call requirement is not explicit.');
  }

  if (signals.codeSubmission) {
    add(18,'Code/repo/demo submission path');
    reasons.push('The listing exposes a code, repository, PR, demo, or Devpost submission path.');
  } else {
    add(-6,'Submission path unclear');
    unknowns.push('A concrete code/repo/demo submission path was not detected.');
  }

  if (signals.preHireGate) {
    add(-16,'Pre-hire or assignment gate');
    reasons.push('Selection or hiring is required before implementation.');
  }

  if (reward) {
    const delta=reward.amount>=5000?16:reward.amount>=1000?12:reward.amount>=250?8:3;
    add(delta,`Reward signal ${reward.text}`);
    reasons.push(`Reward detected: ${reward.text}.`);
  } else {
    add(-8,'Reward unknown');
    unknowns.push('Exact reward amount was not detected.');
  }

  if (deadline) {
    add(4,'Deadline stated');
    reasons.push('A deadline is visible, so the work can be scheduled.');
  } else {
    unknowns.push('Deadline was not detected.');
  }

  score=Math.max(0,Math.min(100,Math.round(score)));
  let verdict='REVIEW';
  if (signals.unpaid || signals.liveGate) verdict='SKIP';
  else if (!signals.preHireGate && signals.codeSubmission && score>=72) verdict='GO';

  const extractedEvidence=[];
  if (reward) extractedEvidence.push({label:'Reward',value:reward.text});
  if (deadline) extractedEvidence.push({label:'Deadline',value:deadline});
  const liveEvidence=evidence(text,liveGatePatterns);
  const asyncEvidence=evidence(text,explicitAsyncPatterns);
  const submitEvidence=evidence(text,submissionPatterns);
  const hireEvidence=evidence(text,preHirePatterns);
  if (signals.liveGate && liveEvidence) extractedEvidence.push({label:'Live gate',value:liveEvidence});
  if (signals.explicitAsync && asyncEvidence) extractedEvidence.push({label:'Async',value:asyncEvidence});
  if (signals.codeSubmission && submitEvidence) extractedEvidence.push({label:'Submission',value:submitEvidence});
  if (signals.preHireGate && hireEvidence) extractedEvidence.push({label:'Pre-hire',value:hireEvidence});

  return {title:title.trim() || 'Untitled opportunity', verdict, score, reward, deadline, signals, reasons, unknowns, adjustments, evidence:extractedEvidence};
}

export function buildSubmissionPlan(opportunity) {
  const a=opportunity.analysis;
  if (opportunity.status==='submitted') return ['Watch for the results announcement, then record the outcome as won or lost.'];
  const steps=[];
  if (a.signals.preHireGate) steps.push('Wait for formal assignment/hiring before opening an implementation PR.');
  if (!a.deadline) steps.push('Verify the official deadline before allocating build time.');
  if (!a.reward) steps.push('Verify the exact prize/reward and payout terms.');
  if (a.verdict==='SKIP') {
    steps.push('Do not allocate implementation time unless the blocking live/unpaid condition changes.');
    return steps;
  }
  steps.push('Read the official rules and freeze a minimum acceptance checklist.');
  steps.push('Build the smallest end-to-end demo that satisfies every required artifact.');
  steps.push('Run mechanical tests and capture evidence for the demo.');
  steps.push('Prepare repository, demo video, and submission form assets.');
  steps.push('Submit before the deadline and record the submission receipt.');
  return steps;
}
