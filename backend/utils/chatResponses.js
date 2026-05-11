function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const lastPickedIndexByKey = new Map();

function pickOneNoRepeat(key, list) {
  if (!Array.isArray(list) || list.length === 0) return { reply: "I’m here with you. What’s on your mind?", suggestion: "" };
  if (list.length === 1) return list[0];
  const last = lastPickedIndexByKey.get(key);
  let idx = Math.floor(Math.random() * list.length);
  if (idx === last) idx = (idx + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
  lastPickedIndexByKey.set(key, idx);
  return list[idx];
}

function pickDifferentReply({ key, list, avoidReplies = [] }) {
  if (!Array.isArray(list) || list.length === 0) {
    return { reply: "I’m here with you. What’s on your mind?", suggestion: "" };
  }
  const avoid = new Set(avoidReplies.filter(Boolean));
  if (avoid.size === 0) return pickOneNoRepeat(key, list);

  // Try a few times to find a reply that isn't a repeat.
  for (let i = 0; i < Math.min(6, list.length * 2); i++) {
    const candidate = pickOneNoRepeat(`${key}:${i}`, list);
    if (!avoid.has(candidate.reply)) return candidate;
  }

  // If we couldn't avoid repeats, return the normal pick (still no-repeat by key).
  return pickOneNoRepeat(key, list);
}

function extractTopic(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const cleaned = t.replace(/\s+/g, " ").slice(0, 160);
  const parts = cleaned.split(/[.?!]/).map((p) => p.trim()).filter(Boolean);
  const first = parts[0] || cleaned;
  return first.length > 64 ? `${first.slice(0, 64).trim()}…` : first;
}

const RESPONSES = {
  anxiety: [
    {
      reply:
        "I’m really sorry you’re feeling anxious. Let’s slow things down together. Try the 4‑7‑8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8. Repeat 4 times and notice any small shift in your body.",
      suggestion: "4-7-8 breathing",
    },
    {
      reply:
        "Feeling anxious can be exhausting. A quick reset is to ground yourself: name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, and 1 you can taste. You don’t have to fix everything right now—just take the next small step.",
      suggestion: "5-4-3-2-1 grounding",
    },
    {
      reply:
        "Anxiety can make your brain feel like it’s scanning for danger. Let’s help your body catch up: place a hand on your chest, breathe in for 4, out for 6, and gently relax your shoulders on each exhale. What part of your body feels the tension most right now?",
      suggestion: "4-6 breathing",
    },
    {
      reply:
        "If your thoughts are looping, try a “name it to tame it” moment: label what’s happening (e.g., “I’m having an anxious thought”), then ask, “What would I tell a friend in this situation?” We can take it one piece at a time.",
      suggestion: "Name-it-to-tame-it",
    },
    {
      reply:
        "When anxiety spikes, it helps to reduce choices. Pick one tiny action: sip water, stand up and stretch, or step away from screens for 2 minutes. Which of those feels doable right now?",
      suggestion: "2-minute reset",
    },
  ],
  sleep: [
    {
      reply:
        "Trouble sleeping is really tough. If you can, try a gentle wind‑down: dim lights, put screens away 30–60 minutes before bed, and keep your room cool. If your mind is racing, jot thoughts down to “park” them for tomorrow.",
      suggestion: "Wind-down routine",
    },
    {
      reply:
        "If insomnia is hitting, you’re not alone. A simple approach is a consistent bedtime, no caffeine late in the day, and a short relaxation practice. You could try slow belly breaths or progressive muscle relaxation to signal your body it’s safe to rest.",
      suggestion: "Progressive muscle relaxation",
    },
    {
      reply:
        "If you’re awake and frustrated, it can help to stop “trying” to sleep. Try a low-light reset: sit up, read something boring, or do a body scan for 5–10 minutes, then return to bed when you feel drowsy again.",
      suggestion: "Body scan",
    },
    {
      reply:
        "Racing thoughts at night are so common. A helpful trick is a quick “brain dump”: write the worries + one next step for tomorrow, then close the note. Would you like a simple 3-line template to do that?",
      suggestion: "3-line brain dump",
    },
  ],
  stress: [
    {
      reply:
        "It sounds like you’re overwhelmed. When stress piles up, it can help to shrink the problem: pick one task, break it into the smallest next step, and set a 10–15 minute timer. Then take a short reset break—small wins add up.",
      suggestion: "15-minute focus sprint",
    },
    {
      reply:
        "That level of stress can feel like carrying everything at once. If you can, pause for a moment: unclench your jaw, drop your shoulders, and take three slow breaths. Then choose one priority for today and let “good enough” be enough for the rest.",
      suggestion: "3-breath reset",
    },
    {
      reply:
        "When you’re overwhelmed, your brain starts treating everything as urgent. Let’s sort it: what’s the one thing that truly must happen today, and what can wait 24 hours?",
      suggestion: "Priority filter",
    },
    {
      reply:
        "A practical way to reduce stress is to externalize it. Grab a note and list: (1) what’s on your plate, (2) what’s in your control, (3) one next action. If you tell me what’s stressing you, I’ll help you break it down.",
      suggestion: "Control vs. not control",
    },
  ],
  sad: [
    {
      reply:
        "I’m here with you. It’s okay to feel sad—your feelings make sense. If it helps, try writing down what’s been weighing on you for 5 minutes, without judging it. You deserve support, and you don’t have to carry this alone.",
      suggestion: "5-minute journaling",
    },
    {
      reply:
        "I’m sorry you’re going through this. Even if it feels heavy right now, you’re not failing—you’re human. A gentle step could be reaching out to someone you trust, or doing one small comforting thing (water, a shower, a short walk).",
      suggestion: "Reach out to someone",
    },
    {
      reply:
        "If today feels heavy, let’s aim for kindness over productivity. What’s one small thing that usually helps even 1%—music, fresh air, a warm drink, or texting someone?",
      suggestion: "1% relief",
    },
    {
      reply:
        "Sometimes sadness is a signal that something needs care. If you’re up for it, what happened recently that might have triggered this feeling?",
      suggestion: "",
    },
  ],
  motivation: [
    {
      reply:
        "Low motivation happens, especially when you’re tired or stressed. Let’s make this easier: pick a task, make it tiny (2 minutes), and start before you feel ready. Momentum often shows up after the first step, not before.",
      suggestion: "2-minute start",
    },
    {
      reply:
        "If you’re feeling stuck, try lowering the bar on purpose: “What’s the smallest version of this I can do today?” Then set a short timer and stop when it ends. Progress counts, even when it’s small.",
      suggestion: "Smallest-next-step",
    },
    {
      reply:
        "Motivation often follows clarity. What are you trying to do—and what’s the first 2-minute step we can define together?",
      suggestion: "Define the 2-minute step",
    },
    {
      reply:
        "If you’re drained, it might not be laziness—it could be overload. On a scale of 1–10, how much energy do you have right now? I’ll suggest a plan that matches your level.",
      suggestion: "Energy-matched plan",
    },
  ],
  crisis: [
    {
      reply:
        "I’m really sorry you’re feeling this way. You deserve immediate support. If you’re in danger or thinking about harming yourself, please contact your local emergency number right now. If you’re in the US, you can call or text 988 (Suicide & Crisis Lifeline). If you’re elsewhere, I can help you find a local crisis line—tell me your country.",
      suggestion: "Contact a trusted person now",
    },
  ],
  default: [
    {
      reply:
        "I’m here to support you. Thanks for sharing that with me. Can you tell me a bit more about what’s been going on and how it’s affecting your day?",
      suggestion: "",
    },
    {
      reply:
        "That sounds like a lot to hold. If you’re comfortable, what’s the hardest part of this right now—your thoughts, your emotions, or what’s happening around you?",
      suggestion: "",
    },
    {
      reply:
        "I hear you. Before we problem-solve, do you want validation, practical steps, or just a space to vent?",
      suggestion: "",
    },
    {
      reply:
        "Thanks for telling me. If you share one specific example of when this shows up, I can help you find a small next step that fits your situation.",
      suggestion: "",
    },
  ],
};

const CRISIS_PATTERN =
  /\b(kill myself|end my life|suicide|self[\s-]?harm|hurt myself|want to die)\b/i;

export function getChatbotResponse(message, options = {}) {
  const lower = String(message || "").toLowerCase();
  const topic = extractTopic(message);
  const chatKey = options.chatId ? String(options.chatId) : "global";
  const avoidReplies = Array.isArray(options.avoidReplies) ? options.avoidReplies : [];

  if (CRISIS_PATTERN.test(lower)) {
    return pickDifferentReply({ key: `${chatKey}:crisis`, list: RESPONSES.crisis, avoidReplies });
  }

  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("panic") || lower.includes("panicky")) {
    return pickDifferentReply({ key: `${chatKey}:anxiety`, list: RESPONSES.anxiety, avoidReplies });
  }
  if (lower.includes("sleep") || lower.includes("insomnia")) {
    return pickDifferentReply({ key: `${chatKey}:sleep`, list: RESPONSES.sleep, avoidReplies });
  }
  if (lower.includes("stress") || lower.includes("overwhelmed") || lower.includes("burnout") || lower.includes("pressure")) {
    return pickDifferentReply({ key: `${chatKey}:stress`, list: RESPONSES.stress, avoidReplies });
  }
  if (lower.includes("sad") || lower.includes("depressed")) {
    return pickDifferentReply({ key: `${chatKey}:sad`, list: RESPONSES.sad, avoidReplies });
  }
  if (lower.includes("motivation") || lower.includes("lazy") || lower.includes("procrast")) {
    return pickDifferentReply({ key: `${chatKey}:motivation`, list: RESPONSES.motivation, avoidReplies });
  }

  const base = pickDifferentReply({ key: `${chatKey}:default`, list: RESPONSES.default, avoidReplies });
  if (!topic) return base;
  return {
    ...base,
    reply: `You said: “${topic}”.\n\n${base.reply}`,
  };
}

