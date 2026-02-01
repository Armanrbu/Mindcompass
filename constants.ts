import { SupportType, Resource, PriorityLevel } from './types';

// Scientifically adapted questions based on GHQ-12 (General Health Questionnaire) 
// and DASS-21 (Depression Anxiety Stress Scales).
// 'reverse: true' indicates a positive question where "More than usual" is GOOD (Score 0), not BAD (Score 3).
export const CHECKIN_QUESTIONS = [
  {
    id: 1,
    text: "I have been able to concentrate on whatever I'm doing.",
    source: "GHQ-12",
    reverse: true
  },
  {
    id: 2,
    text: "I have lost sleep over worry.",
    source: "GHQ-12"
  },
  {
    id: 3,
    text: "I felt that I was playing a useful part in things.",
    source: "GHQ-12",
    reverse: true
  },
  {
    id: 4,
    text: "I felt capable of making decisions about things.",
    source: "GHQ-12",
    reverse: true
  },
  {
    id: 5,
    text: "I found it hard to wind down.",
    source: "DASS-21 (Stress)"
  },
  {
    id: 6,
    text: "I felt down-hearted and blue.",
    source: "DASS-21 (Depression)"
  },
  {
    id: 7,
    text: "I felt constantly under strain.",
    source: "GHQ-12"
  },
  {
    id: 8,
    text: "I have been losing confidence in myself.",
    source: "GHQ-12"
  },
  {
    id: 9,
    text: "I found it difficult to work up the initiative to do things.",
    source: "DASS-21 (Depression)"
  },
  {
    id: 10,
    text: "I tended to over-react to situations.",
    source: "DASS-21 (Stress)"
  },
  {
    id: 11,
    text: "I felt that I was close to panic.",
    source: "DASS-21 (Anxiety)"
  },
  {
    id: 12,
    text: "I felt that I had nothing to look forward to.",
    source: "DASS-21 (Depression)"
  },
  {
    id: 13,
    text: "I felt scared without any good reason.",
    source: "DASS-21 (Anxiety)"
  },
  {
    id: 14,
    text: "I have felt that I couldn't overcome my difficulties.",
    source: "GHQ-12"
  },
  {
    id: 15,
    text: "I felt I was rather touchy.",
    source: "DASS-21 (Stress)"
  },
  {
    id: 16,
    text: "I have been thinking of myself as a worthless person.",
    source: "GHQ-12"
  },
  {
    id: 17,
    text: "I was unable to become enthusiastic about anything.",
    source: "DASS-21 (Depression)"
  },
  {
    id: 18,
    text: "I experienced breathing difficulty (e.g., rapid breathing) without physical exertion.",
    source: "DASS-21 (Anxiety)"
  },
  {
    id: 19,
    text: "I found myself getting agitated.",
    source: "DASS-21 (Stress)"
  },
  {
    id: 20,
    text: "I have been able to enjoy my normal day-to-day activities.",
    source: "GHQ-12",
    reverse: true
  },
  {
    id: 21,
    text: "I felt that I was using a lot of nervous energy.",
    source: "DASS-21 (Stress)"
  }
];

export const SCORING_THRESHOLDS = {
  MEDIUM: 15, // Score > 15 indicates moderate distress
  HIGH: 30    // Score > 30 indicates severe distress (Max score is 63)
};

export const SUPPORT_LABELS = {
  [PriorityLevel.LOW]: "Good for Self-Care",
  [PriorityLevel.MEDIUM]: "Might Benefit from Additional Support",
  [PriorityLevel.HIGH]: "Connecting You with Immediate Help",
};

export const MARKETING_COPY = {
  heroTitle: "Find Clarity in the Chaos.",
  heroSubtitle: "A scientifically grounded compass for your mental landscape. Track resilience, identify stressors, and navigate to the right support—privately.",
  methodology: [
    {
      title: "Clinical Standards",
      desc: "Adapted from GHQ-12 & DASS-21, the gold standards in rapid psychological screening.",
      icon: "Activity"
    },
    {
      title: "Encrypted Privacy",
      desc: "Zero-knowledge architecture. Your emotional data is yours alone.",
      icon: "Lock"
    },
    {
      title: "AI Triage",
      desc: "Context-aware analysis routes you to self-help or professional care instantly.",
      icon: "Brain"
    }
  ],
  testimonials: [
    {
      quote: "It helped me realize my 'tiredness' was actually anxiety before I burned out.",
      role: "Graduate Student",
      initials: "JD"
    },
    {
      quote: "I love that it doesn't try to diagnose me, just points me in the right direction.",
      role: "Junior Developer",
      initials: "AM"
    }
  ]
};

export const MOTIVATIONAL_QUOTES = [
  "Small steps, when taken consistently, cover great distances.",
  "Mental strength is not the ability to stay out of the darkness; it is the ability to sit present in the darkness knowing the light will return.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Growth is a spiral process, doubling back on itself, reassessing and regrouping.",
];

export const PRIVACY_CONTENT = {
  title: "Your Trust is Our Foundation",
  intro: "Before we begin, we need you to understand exactly how your data is handled. We believe in radical transparency.",
  points: [
    {
      id: 'clinical',
      icon: 'AlertTriangle',
      title: "Not a Diagnostic Tool",
      text: "MindCompass uses standard screening questions to help you reflect. It is NOT a doctor. AI reflections are for insight only and do not constitute a medical diagnosis."
    },
    {
      id: 'privacy',
      icon: 'Lock',
      title: "Encrypted & Anonymous",
      text: "We do not ask for your email or phone number. Your 'username' is your only key. Your journal entries are encrypted and processed by Google Gemini solely to generate reflections—never to train public models."
    }
  ]
};

export const COGNITIVE_DISTORTIONS = [
  {
    title: "All-or-Nothing Thinking",
    description: "Viewing situations in only two categories (e.g., 'perfect' or 'failure')."
  },
  {
    title: "Catastrophizing",
    description: "Expecting the worst-case scenario to happen, no matter how unlikely."
  },
  {
    title: "Emotional Reasoning",
    description: "Believing that because you feel a certain way (e.g. anxious), it must be true."
  },
  {
    title: "Mind Reading",
    description: "Assuming you know what others are thinking without evidence."
  },
  {
    title: "Should Statements",
    description: "Criticizing yourself or others with 'should', 'must', or 'ought to'."
  }
];

// Curated resources database (India Specific)
export const RESOURCES: Resource[] = [
  {
    title: "Grounding: The 5-4-3-2-1 Technique",
    description: "A clinically proven mindfulness exercise to reduce acute anxiety by anchoring you in the present.",
    link: "internal:grounding",
    type: SupportType.SELF_HELP,
    minPriority: PriorityLevel.LOW
  },
  {
    title: "Cognitive Reframing Tool",
    description: "Interactive guide to identify and challenge negative thought patterns.",
    link: "internal:reframing",
    type: SupportType.SELF_HELP,
    minPriority: PriorityLevel.LOW
  },
  {
    title: "Box Breathing Exercise",
    description: "Simple rhythmic breathing (4-4-4-4) to calm your nervous system immediately.",
    link: "internal:breathing",
    type: SupportType.SELF_HELP,
    minPriority: PriorityLevel.LOW
  },
  {
    title: "University/College Wellness Centers",
    description: "Visit your campus counselor. Most Indian universities (IITs, IIMs, DU, etc.) provide free student support.",
    link: "#",
    type: SupportType.COUNSELOR,
    minPriority: PriorityLevel.MEDIUM
  },
  {
    title: "YourDOST / Amaha (InnerHour)",
    description: "Connect with verified Indian therapists via chat or video. Tailored for students and young professionals.",
    link: "https://yourdost.com",
    type: SupportType.COUNSELOR,
    minPriority: PriorityLevel.MEDIUM
  },
  {
    title: "Vandrevala Foundation",
    description: "24/7 Multilingual Support. Free confidential counseling via call or WhatsApp for mental health distress.",
    link: "tel:18602662345",
    type: SupportType.HELPLINE,
    isEmergency: true,
    minPriority: PriorityLevel.HIGH
  },
  {
    title: "KIRAN Helpline (Govt. of India)",
    description: "National Mental Health Rehabilitation Helpline. Available 24/7 in 13 regional languages.",
    link: "tel:18005990019",
    type: SupportType.HELPLINE,
    isEmergency: true,
    minPriority: PriorityLevel.HIGH
  },
  {
    title: "Jeevan Aastha Helpline",
    description: "24/7 Suicide Prevention Helpline. 'There is always a way.' Professional counseling support.",
    link: "tel:18002333330",
    type: SupportType.HELPLINE,
    isEmergency: true,
    minPriority: PriorityLevel.HIGH
  },
];