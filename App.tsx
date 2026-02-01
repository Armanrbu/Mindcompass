import React, { useState, useEffect, useRef } from 'react';
import { 
  UserRole, 
  AgeRange, 
  UserProfile, 
  ScreenName, 
  UserStats,
  PriorityLevel,
  AIRoutingResponse,
  SupportType
} from './types';
import { CHECKIN_QUESTIONS, RESOURCES, MARKETING_COPY, PRIVACY_CONTENT, SUPPORT_LABELS, COGNITIVE_DISTORTIONS, SCORING_THRESHOLDS } from './constants';
import { analyzePriority } from './services/geminiService';
import { 
  getOrCreateUser, 
  updateUserProfile, 
  logCheckIn, 
  saveAssessment 
} from './services/supabaseService';
import { 
  ArrowRight, 
  ShieldCheck, 
  Leaf,
  Phone,
  BookOpen,
  MapPin,
  Sun,
  Activity,
  Lock,
  Brain,
  Sprout,
  TreeDeciduous,
  Flower2,
  Shield,
  Zap,
  CheckCircle,
  Quote,
  ChevronRight,
  Menu,
  AlertTriangle,
  Sparkles,
  Database,
  UserX,
  FileCheck,
  Wind,
  Eye,
  Hand,
  Ear,
  Coffee,
  ArrowLeft,
  Play,
  HeartHandshake,
  RefreshCw,
  Clock,
  ExternalLink,
  ClipboardCheck,
  Feather,
  MessageCircle,
  Users,
  Send,
  ChevronDown
} from 'lucide-react';

// --- UI Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'safety' | 'ghost' | 'disabled' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyle = "px-6 py-4 rounded-xl font-medium tracking-wide transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base";
  
  // Updated to new Serenity Palette
  const variants = {
    primary: "bg-serenity-700 hover:bg-serenity-800 text-white shadow-lg shadow-serenity-200/50 hover:shadow-serenity-200/80",
    secondary: "bg-white hover:bg-comfort-50 text-comfort-900 border border-comfort-200 shadow-sm",
    outline: "border-2 border-serenity-700 text-serenity-700 hover:bg-serenity-50",
    safety: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200", // Alert color kept for safety
    ghost: "text-serenity-700 hover:bg-serenity-50",
    disabled: "bg-comfort-200 text-comfort-400 cursor-not-allowed shadow-none active:scale-100",
  };
  
  return (
    <button disabled={variant === 'disabled'} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Dynamic Plant Visual System
const PlantVisual: React.FC<{ stage: number, size?: 'sm' | 'md' | 'lg', priority?: PriorityLevel | null }> = ({ stage, size = 'md', priority = null }) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-24 h-24",
    lg: "w-40 h-40"
  };

  const containerClasses = {
    sm: "w-16 h-16",
    md: "w-36 h-36",
    lg: "w-64 h-64"
  };

  const isHighPriority = priority === PriorityLevel.HIGH;
  const isMediumPriority = priority === PriorityLevel.MEDIUM;

  const getPlantIcon = () => {
    if (stage === 0) return <Leaf className={`${sizeClasses[size]} text-serenity-300`} />;
    if (stage < 3) return <Sprout className={`${sizeClasses[size]} text-healing-500`} />;
    if (stage < 7) return <Leaf className={`${sizeClasses[size]} text-healing-600`} fill="currentColor" />;
    if (stage < 14) return <TreeDeciduous className={`${sizeClasses[size]} text-serenity-600`} />;
    return (
      <div className="relative">
        <TreeDeciduous className={`${sizeClasses[size]} text-serenity-700`} />
        <Flower2 className="absolute -top-2 -right-2 w-8 h-8 text-pink-400 animate-bounce" fill="currentColor" />
        <Flower2 className="absolute top-4 -left-2 w-5 h-5 text-pink-300 animate-bounce" style={{ animationDelay: '0.5s' }} fill="currentColor" />
      </div>
    );
  };

  let animationClass = stage > 0 ? 'animate-float' : '';
  if (isMediumPriority) animationClass = 'animate-grow';
  if (isHighPriority) animationClass = '';

  return (
    <div className={`relative flex items-center justify-center rounded-full transition-all duration-700 ${containerClasses[size]} ${isHighPriority ? 'bg-amber-50 border-4 border-amber-200' : 'bg-white border-4 border-comfort-100 shadow-xl shadow-comfort-200/50'}`}>
      
      {isHighPriority && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 opacity-50 animate-pulse"></div>
          <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-amber-100 z-10">
            <Shield className="w-6 h-6 text-amber-500" fill="currentColor" />
          </div>
        </>
      )}

      {isMediumPriority && (
         <div className="absolute inset-0 rounded-full border-2 border-serenity-200 animate-ping opacity-30"></div>
      )}

      <div className={`transition-all duration-700 ${animationClass}`}>
        {getPlantIcon()}
      </div>
      
      {stage > 0 && !isHighPriority && (
         <div className="absolute bottom-4 right-0 bg-white text-xs font-bold px-3 py-1 rounded-full shadow-md border border-comfort-200 text-serenity-700">
            Lvl {Math.floor(stage / 3) + 1}
         </div>
      )}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl p-8 animate-slide-up border border-comfort-200 shadow-lg shadow-comfort-200/40 ${className}`}>
    {children}
  </div>
);

// --- Main App ---

// Helper to compare priorities
const getPriorityWeight = (p: PriorityLevel) => {
  switch (p) {
    case PriorityLevel.HIGH: return 3;
    case PriorityLevel.MEDIUM: return 2;
    case PriorityLevel.LOW: return 1;
    default: return 0;
  }
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  
  const [usernameInput, setUsernameInput] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: '',
    role: UserRole.STUDENT,
    age: AgeRange.YOUNG_ADULT,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    totalCheckIns: 0,
    lastCheckInDate: null,
    consistencyStreak: 0
  });

  // Flow State
  const [assessmentMode, setAssessmentMode] = useState<'scientific' | 'journal'>('scientific');

  const [checkInResponses, setCheckInResponses] = useState<Record<number, number>>({});
  const [calculatedPriority, setCalculatedPriority] = useState<PriorityLevel>(PriorityLevel.LOW);
  const [reflectionText, setReflectionText] = useState('');
  const [aiResult, setAiResult] = useState<AIRoutingResponse | null>(null);
  
  // Consent State
  const [consents, setConsents] = useState({
    clinical: false,
    privacy: false
  });

  // Safety Plan State
  const [safetyPlan, setSafetyPlan] = useState({
    contactName: '',
    contactPhone: '',
    copingStrategy: ''
  });

  // Grounding Exercise State
  const [groundingStep, setGroundingStep] = useState(0);

  // Breathing Exercise State
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathingCount, setBreathingCount] = useState(4);

  // Reframing Tool State
  const [reframingStep, setReframingStep] = useState(0);
  const [reframingData, setReframingData] = useState({
    situation: '',
    thought: '',
    distortion: '',
    challenge: ''
  });

  // --- Effects ---
  
  // Breathing Timer
  useEffect(() => {
    if (currentScreen !== 'breathing') return;
    
    let phaseTime = 0;
    const interval = setInterval(() => {
      phaseTime = (phaseTime + 1) % 16; // 4+4+4+4 = 16s cycle for Box Breathing
      
      if (phaseTime < 4) {
        setBreathingPhase('Inhale');
        setBreathingCount(4 - phaseTime);
      } else if (phaseTime < 8) {
        setBreathingPhase('Hold');
        setBreathingCount(8 - phaseTime);
      } else if (phaseTime < 12) {
        setBreathingPhase('Exhale');
        setBreathingCount(12 - phaseTime);
      } else {
        setBreathingPhase('Hold');
        setBreathingCount(16 - phaseTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // Scroll Helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    const { profile, stats } = await getOrCreateUser(usernameInput.toLowerCase());
    setUserStats(stats);
    
    if (profile) {
      setUserProfile(profile);
      setCurrentScreen('welcome_back');
    } else {
      setUserProfile(prev => ({ ...prev, username: usernameInput.toLowerCase() }));
      setCurrentScreen('profile');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(userProfile);
    setCurrentScreen('disclaimer'); // Route through disclaimer
  };

  const handleDisclaimerAccept = () => {
    setCurrentScreen('mode_selection');
  }

  const handleModeSelect = (mode: 'scientific' | 'journal') => {
    setAssessmentMode(mode);
    if (mode === 'scientific') {
      setCurrentScreen('checkin');
    } else {
      setCurrentScreen('reflection');
    }
  };

  const handleCheckInAnswer = (questionId: number, rawValue: number) => {
    setCheckInResponses(prev => ({ ...prev, [questionId]: rawValue }));
  };

  const handleCheckInSubmit = () => {
    if (Object.keys(checkInResponses).length === CHECKIN_QUESTIONS.length) {
      // Deterministic Scoring
      const totalScore = Object.values(checkInResponses).reduce((a: number, b: number) => a + b, 0);
      let priority = PriorityLevel.LOW;
      if (totalScore >= SCORING_THRESHOLDS.HIGH) priority = PriorityLevel.HIGH;
      else if (totalScore >= SCORING_THRESHOLDS.MEDIUM) priority = PriorityLevel.MEDIUM;
      
      setCalculatedPriority(priority);
      setCurrentScreen('reflection'); // Go to optional reflection
    } else {
      alert("Please complete the questionnaire.");
    }
  };

  const handleReflectionSubmit = async () => {
    setCurrentScreen('processing');
    const totalScore = Object.values(checkInResponses).reduce((a: number, b: number) => a + b, 0);
    const result = await analyzePriority(totalScore, reflectionText);
    
    // --- CONSERVATIVE TRIAGE LOGIC (Safety Critical) ---
    // If the user selected 'Scientific Mode', we have two signals:
    // 1. calculatedPriority (Deterministic Score)
    // 2. result.priority (AI Text Analysis + Keyword Override)
    // We strictly use the HIGHER of the two severities to avoid false negatives.
    
    if (assessmentMode === 'scientific') {
        const scientificWeight = getPriorityWeight(calculatedPriority);
        const aiWeight = getPriorityWeight(result.priority);
        
        if (scientificWeight > aiWeight) {
             result.priority = calculatedPriority;
             console.log(`Safety Override: Using Scientific Priority (${calculatedPriority}) over AI (${result.priority})`);
        } else if (aiWeight > scientificWeight) {
             console.log(`Safety Override: Using AI/Keyword Priority (${result.priority}) over Scientific (${calculatedPriority})`);
             // result.priority is already set to the AI one
        }
    }
    
    setAiResult(result);
    const newStats = await logCheckIn(userProfile.username);
    setUserStats(newStats);
    await saveAssessment(userProfile.username, checkInResponses, reflectionText, result);

    if (result.priority === PriorityLevel.HIGH) {
      setTimeout(() => setCurrentScreen('safety'), 2000); 
    } else {
      setTimeout(() => setCurrentScreen('results'), 2000);
    }
  };

  const handleResourceClick = (link: string) => {
    if (link.startsWith('internal:')) {
        const screen = link.split(':')[1] as ScreenName;
        setCurrentScreen(screen);
        // Reset tool states if needed
        if (screen === 'grounding') setGroundingStep(0);
        if (screen === 'reframing') {
            setReframingStep(0);
            setReframingData({ situation: '', thought: '', distortion: '', challenge: '' });
        }
    } else {
        window.open(link, '_blank');
    }
  };

  const handleSafetyPlanSubmit = () => {
    // Generate SMS Link
    const message = encodeURIComponent("I'm feeling really overwhelmed right now and need to talk to someone I trust. Are you free?");
    window.location.href = `sms:${safetyPlan.contactPhone}?body=${message}`;
  };

  // --- Renderers ---

  const renderHeader = () => {
    if (currentScreen === 'home' || currentScreen === 'login') return (
        <header className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-center z-50 glass border-b border-comfort-200">
            <div className="flex items-center gap-2 font-bold text-xl text-serenity-800 cursor-pointer" onClick={() => setCurrentScreen('home')}>
                <Brain className="text-serenity-600 opacity-20" fill="currentColor" /> 
                <span className="font-display tracking-tight">MindCompass</span>
            </div>
            <div className="hidden md:flex gap-8">
                <a href="#how-it-works" className="text-sm font-medium text-comfort-800 hover:text-serenity-700 transition-colors">How it Works</a>
                <a href="#science" className="text-sm font-medium text-comfort-800 hover:text-serenity-700 transition-colors">Science</a>
            </div>
            <Button variant="secondary" className="hidden md:flex py-2 px-4 text-xs h-10" onClick={() => setCurrentScreen('login')}>
                Member Login
            </Button>
            <button className="md:hidden text-comfort-800"><Menu/></button>
        </header>
    );

    return (
      <header className="sticky top-0 z-50 glass border-b border-comfort-200 transition-all duration-300">
        <div className="max-w-xl mx-auto px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentScreen('home')}>
               <PlantVisual stage={userStats.consistencyStreak} size="sm" />
               <div className="flex flex-col">
                  <span className="font-display font-bold text-comfort-900 text-sm tracking-tight">MindCompass</span>
                  {userProfile.username && (
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-healing-500 animate-pulse"></span>
                        <span className="text-xs text-serenity-700 font-medium">
                        Day {userStats.consistencyStreak}
                        </span>
                    </div>
                  )}
               </div>
            </div>
            <button onClick={() => setCurrentScreen('home')} className="text-xs font-medium text-comfort-400 hover:text-serenity-600 transition-colors">
                Exit to Home
            </button>
        </div>
      </header>
    );
  };

  const renderFooter = () => (
    <footer className="bg-white border-t border-comfort-200 py-12 mt-auto">
      <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <div className="flex items-center gap-2 font-bold text-xl text-serenity-800 mb-4">
              <Brain className="text-serenity-600" /> MindCompass
          </div>
          <p className="text-sm text-comfort-800 leading-relaxed">
            Ethical, anonymous mental health routing for the modern era.
          </p>
        </div>
        <div>
           <h4 className="font-bold text-comfort-900 mb-4">Product</h4>
           <ul className="space-y-2 text-sm text-comfort-800">
             <li><a href="#" className="hover:text-serenity-600">Methodology</a></li>
             <li><a href="#" className="hover:text-serenity-600">For Universities</a></li>
             <li><a href="#" className="hover:text-serenity-600">For Enterprise</a></li>
           </ul>
        </div>
        <div>
           <h4 className="font-bold text-comfort-900 mb-4">Support</h4>
           <ul className="space-y-2 text-sm text-comfort-800">
             <li><a href="#" className="hover:text-serenity-600">Crisis Resources</a></li>
             <li><a href="#" className="hover:text-serenity-600">FAQ</a></li>
             <li><a href="#" className="hover:text-serenity-600">Contact</a></li>
           </ul>
        </div>
        <div>
           <h4 className="font-bold text-comfort-900 mb-4">Legal</h4>
           <ul className="space-y-2 text-sm text-comfort-800">
             <li><a href="#" className="hover:text-serenity-600">Privacy Policy</a></li>
             <li><a href="#" className="hover:text-serenity-600">Terms of Service</a></li>
           </ul>
        </div>
      </div>
      <div className="text-center text-xs text-comfort-300 mt-12">
        © 2024 MindCompass AI. All rights reserved. Not a medical diagnostic tool.
      </div>
    </footer>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
                {/* Background Blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-serenity-100/50 rounded-full blur-3xl animate-pulse-soft mix-blend-multiply"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-healing-100/50 rounded-full blur-3xl animate-pulse-soft mix-blend-multiply" style={{ animationDelay: '2s' }}></div>
                
                <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-left space-y-8 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-serenity-200 rounded-full text-serenity-700 text-sm font-bold uppercase tracking-wider shadow-sm">
                            <Sparkles size={16} /> Responsible AI for Mental Health
                        </div>
                        
                        <h1 className="text-5xl lg:text-7xl font-display font-bold text-comfort-900 leading-[1.1]">
                            Navigate Your <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-serenity-600 to-healing-600">Inner World.</span>
                        </h1>
                        
                        <p className="text-xl text-comfort-600 max-w-lg leading-relaxed">
                            No sign-up required for immediate support. A scientifically grounded compass to track resilience, identify risks, and find calm.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                             <Button onClick={() => setCurrentScreen('login')} className="h-14 px-8 text-lg shadow-xl shadow-serenity-200/50 hover:scale-105">
                                Start Check-in <ArrowRight size={20} />
                             </Button>
                             <Button variant="secondary" onClick={() => scrollToSection('tools')} className="h-14 px-8 text-lg border-2 hover:bg-comfort-50">
                                Explore Tools
                             </Button>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-medium text-comfort-500 pt-4">
                            <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-serenity-600"/> 100% Anonymous</span>
                            <span className="flex items-center gap-2"><Activity size={18} className="text-serenity-600"/> Clinically Adapted</span>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="relative hidden lg:flex justify-center items-center animate-float">
                        <div className="relative w-[500px] h-[500px]">
                            {/* Abstract Compass/Plant visual */}
                             <div className="absolute inset-0 border border-serenity-200 rounded-full opacity-20 scale-150"></div>
                             <div className="absolute inset-0 border border-serenity-200 rounded-full opacity-40 scale-125"></div>
                             <div className="absolute inset-0 bg-white/50 backdrop-blur-xl rounded-full shadow-2xl shadow-serenity-100 flex items-center justify-center">
                                 <PlantVisual stage={14} size="lg" />
                             </div>
                             
                             {/* Floating Cards */}
                             <div className="absolute top-0 right-10 bg-white p-4 rounded-2xl shadow-lg border border-comfort-100 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Activity size={20}/></div>
                                    <div>
                                        <div className="text-xs text-comfort-400 font-bold uppercase">Distress Level</div>
                                        <div className="font-bold text-comfort-900">High Priority</div>
                                    </div>
                                </div>
                             </div>

                             <div className="absolute bottom-10 left-0 bg-white p-4 rounded-2xl shadow-lg border border-comfort-100 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-healing-100 text-healing-600 rounded-lg"><Wind size={20}/></div>
                                    <div>
                                        <div className="text-xs text-comfort-400 font-bold uppercase">Recommendation</div>
                                        <div className="font-bold text-comfort-900">Box Breathing</div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer text-comfort-400 hover:text-serenity-600 transition-colors" onClick={() => scrollToSection('tools')}>
                    <ChevronDown size={32} />
                </div>
            </div>

            {/* Quick Tools Section */}
            <div id="tools" className="py-24 bg-white relative z-20">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                         <h2 className="text-3xl md:text-4xl font-display font-bold text-comfort-900 mb-4">Immediate Support, Right Now.</h2>
                         <p className="text-lg text-comfort-600">You don't need to create an account to start feeling better. Choose a path based on your current state.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                         {/* Card 1 */}
                         <div onClick={() => setCurrentScreen('grounding')} className="group bg-comfort-50 hover:bg-white p-8 rounded-[2rem] border border-comfort-100 hover:border-serenity-200 transition-all duration-500 hover:shadow-xl hover:shadow-serenity-100/50 cursor-pointer relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-healing-100 rounded-bl-[4rem] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
                             <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-healing-600 mb-8 relative z-10 group-hover:bg-healing-500 group-hover:text-white transition-colors">
                                <Wind size={28} />
                             </div>
                             <h3 className="text-2xl font-bold text-comfort-900 mb-3">Panic & Anxiety</h3>
                             <p className="text-comfort-600 mb-8 leading-relaxed"> overwhelmed? Use the 5-4-3-2-1 Grounding method to anchor yourself in the present moment immediately.</p>
                             <span className="inline-flex items-center gap-2 font-bold text-healing-600 group-hover:translate-x-2 transition-transform">
                                Start Grounding <ArrowRight size={18} />
                             </span>
                         </div>

                         {/* Card 2 - Main */}
                         <div onClick={() => setCurrentScreen('login')} className="group bg-serenity-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-serenity-900/30 cursor-pointer relative overflow-hidden transform md:-translate-y-4">
                             <div className="absolute inset-0 bg-gradient-to-br from-serenity-800 to-serenity-950"></div>
                             <div className="absolute bottom-0 right-0 p-20 bg-white/5 rounded-tl-[100px] blur-3xl"></div>
                             
                             <div className="relative z-10">
                                 <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-serenity-300 mb-8 group-hover:bg-white group-hover:text-serenity-900 transition-colors">
                                    <Sparkles size={28} />
                                 </div>
                                 <h3 className="text-2xl font-bold text-white mb-3">Check-In & Reflect</h3>
                                 <p className="text-serenity-100 mb-8 leading-relaxed">
                                     The core MindCompass experience. Track your mood, get AI-mirrored insights, and find your safety baseline.
                                 </p>
                                 <span className="inline-flex items-center gap-2 font-bold text-white group-hover:gap-4 transition-all">
                                    Begin Journey <ArrowRight size={18} />
                                 </span>
                             </div>
                         </div>

                         {/* Card 3 */}
                         <div onClick={() => setCurrentScreen('library')} className="group bg-comfort-50 hover:bg-white p-8 rounded-[2rem] border border-comfort-100 hover:border-support-200 transition-all duration-500 hover:shadow-xl hover:shadow-support-100/50 cursor-pointer relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-support-100 rounded-bl-[4rem] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
                             <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-support-600 mb-8 relative z-10 group-hover:bg-support-500 group-hover:text-white transition-colors">
                                <BookOpen size={28} />
                             </div>
                             <h3 className="text-2xl font-bold text-comfort-900 mb-3">Resource Library</h3>
                             <p className="text-comfort-600 mb-8 leading-relaxed">Access verified helplines, self-care guides, and educational material curated for mental wellness.</p>
                             <span className="inline-flex items-center gap-2 font-bold text-support-600 group-hover:translate-x-2 transition-transform">
                                Browse Library <ArrowRight size={18} />
                             </span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Principles Section */}
            <div className="py-24 bg-comfort-100 border-y border-comfort-200">
                <div className="container mx-auto px-6">
                     <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl font-display font-bold text-comfort-900">Not Just Another Chatbot.</h2>
                            <p className="text-lg text-comfort-600 leading-relaxed">
                                MindCompass is built on a "Human-in-the-Loop" philosophy. We don't pretend to be doctors. We are a triage layer designed to help you understand your own needs.
                            </p>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-serenity-600 shadow-sm shrink-0">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-comfort-900">Clinical Validated Tools</h4>
                                        <p className="text-comfort-600">We use GHQ-12 and DASS-21 frameworks to assess distress, not just random prompts.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm shrink-0">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-comfort-900">Safety First</h4>
                                        <p className="text-comfort-600">Our "Black Box" detection system prioritizes human safety over AI conversation. We bridge you to real help.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                        <Lock size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-comfort-900">Zero-Knowledge Privacy</h4>
                                        <p className="text-comfort-600">No email. No phone number. Your data is encrypted and tied only to your anonymous alias.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive "Why" Visual */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-comfort-200 relative">
                             <div className="absolute top-4 left-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                             </div>
                             
                             <div className="mt-8 space-y-4">
                                 {/* Chat simulation */}
                                 <div className="bg-comfort-50 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-comfort-700">
                                    "I'm feeling really anxious about my finals..."
                                 </div>
                                 
                                 <div className="flex justify-end">
                                     <div className="bg-serenity-100 p-4 rounded-2xl rounded-tr-none max-w-[90%] text-sm text-serenity-900">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles size={12} className="text-serenity-600"/> 
                                            <span className="font-bold text-xs uppercase tracking-wider text-serenity-600">MindCompass Analysis</span>
                                        </div>
                                        "It sounds like the pressure is really weighing on you. <br/>
                                        <span className="font-bold block mt-2 pt-2 border-t border-serenity-200">
                                            Stress Level: Moderate <br/>
                                            Action: Try 'Cognitive Reframing' tool.
                                        </span>"
                                     </div>
                                 </div>

                                 <div className="flex justify-center mt-6">
                                     <button className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-200 animate-pulse">
                                        View Clinical Resources
                                     </button>
                                 </div>
                             </div>
                        </div>
                     </div>
                </div>
            </div>

            {renderFooter()}
        </div>
        );

      // ... [Grounding, Breathing, Reframing cases remain the same] ...
      case 'grounding':
        const steps = [
          { icon: <Eye size={40} />, count: 5, text: "Things you can see", sub: "Look around. Notice small details." },
          { icon: <Hand size={40} />, count: 4, text: "Things you can touch", sub: "The fabric of your chair, your phone." },
          { icon: <Ear size={40} />, count: 3, text: "Things you can hear", sub: "Distant traffic, the hum of AC." },
          { icon: <Coffee size={40} />, count: 2, text: "Things you can smell", sub: "Or your favorite scents you recall." },
          { icon: <Leaf size={40} />, count: 1, text: "Thing you can taste", sub: "Or a grateful emotion you feel." },
        ];

        return (
          <div className="min-h-screen pt-20 pb-12 bg-healing-50/30">
            <div className="container mx-auto px-4 max-w-xl">
               <button onClick={() => setCurrentScreen('home')} className="flex items-center gap-2 text-comfort-500 hover:text-comfort-800 mb-8 font-medium transition-colors">
                  <ArrowLeft size={18} /> Back to Home
               </button>

               <Card className="text-center py-16 px-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-comfort-100">
                     <div className="h-full bg-healing-500 transition-all duration-500" style={{ width: `${((groundingStep + 1) / steps.length) * 100}%` }}></div>
                  </div>

                  <div className="mb-12">
                     <h2 className="text-3xl font-display font-bold text-comfort-900 mb-2">5-4-3-2-1 Grounding</h2>
                     <p className="text-comfort-500">Take a deep breath. Let's arrive in the present.</p>
                  </div>

                  <div key={groundingStep} className="animate-fade-in">
                      <div className="w-24 h-24 bg-healing-100 rounded-full flex items-center justify-center text-healing-600 mx-auto mb-8 shadow-inner">
                         {steps[groundingStep].icon}
                      </div>
                      <div className="text-6xl font-bold text-healing-600 mb-4 font-display">{steps[groundingStep].count}</div>
                      <h3 className="text-2xl font-bold text-comfort-900 mb-2">{steps[groundingStep].text}</h3>
                      <p className="text-comfort-600 mb-12 text-lg">{steps[groundingStep].sub}</p>
                  </div>

                  <div className="flex justify-center gap-4">
                      {groundingStep > 0 && (
                        <Button variant="secondary" onClick={() => setGroundingStep(s => s - 1)}>Previous</Button>
                      )}
                      {groundingStep < steps.length - 1 ? (
                        <Button onClick={() => setGroundingStep(s => s + 1)}>Next Step <ArrowRight size={18}/></Button>
                      ) : (
                         <Button onClick={() => { setCurrentScreen('home'); setGroundingStep(0); }} className="bg-healing-600 hover:bg-healing-700">Finish Exercise</Button>
                      )}
                  </div>
               </Card>
            </div>
          </div>
        );

      case 'breathing':
        return (
          <div className="min-h-screen pt-20 pb-12 bg-serenity-50">
             <div className="container mx-auto px-4 max-w-xl">
                <button onClick={() => setCurrentScreen('home')} className="flex items-center gap-2 text-comfort-500 hover:text-comfort-800 mb-8 font-medium transition-colors">
                  <ArrowLeft size={18} /> Back to Home
                </button>
                
                <Card className="text-center py-16 px-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
                    <h2 className="text-3xl font-display font-bold text-comfort-900 mb-4">Box Breathing</h2>
                    <p className="text-comfort-500 mb-12">Sync your breath with the circle.</p>

                    <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                        {/* Static rings */}
                        <div className="absolute inset-0 rounded-full border border-serenity-200 opacity-30 scale-125"></div>
                        <div className="absolute inset-0 rounded-full border border-serenity-200 opacity-50 scale-150"></div>
                        
                        {/* Animated Breathing Circle */}
                        <div className={`
                            w-32 h-32 bg-serenity-400 rounded-full shadow-2xl shadow-serenity-300/50 flex items-center justify-center z-10 transition-all duration-[4000ms] ease-linear
                            ${breathingPhase === 'Inhale' ? 'scale-[2.0] bg-serenity-500' : ''}
                            ${breathingPhase === 'Exhale' ? 'scale-[1.0] bg-serenity-300' : ''}
                            ${breathingPhase === 'Hold' ? 'bg-serenity-400' : ''}
                        `}>
                            <span className="text-4xl font-bold text-white font-display tabular-nums">
                                {breathingCount}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-serenity-800 transition-all duration-300">
                        {breathingPhase}
                    </h3>
                </Card>
             </div>
          </div>
        );

      case 'reframing':
         return (
             <div className="min-h-screen pt-20 pb-12 bg-indigo-50/30">
                 <div className="container mx-auto px-4 max-w-xl">
                    <button onClick={() => setCurrentScreen('home')} className="flex items-center gap-2 text-comfort-500 hover:text-comfort-800 mb-8 font-medium transition-colors">
                        <ArrowLeft size={18} /> Back to Home
                    </button>

                    <Card className="min-h-[500px] flex flex-col">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-display font-bold text-comfort-900">Cognitive Reframing</h2>
                            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">Step {reframingStep + 1} of 4</span>
                        </div>

                        <div className="flex-grow flex flex-col justify-center animate-fade-in" key={reframingStep}>
                             {reframingStep === 0 && (
                                 <>
                                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                                        <MapPin size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-comfort-900 mb-3">What is the situation?</h3>
                                    <p className="text-comfort-500 mb-6">Describe the event that triggered your negative feeling.</p>
                                    <textarea 
                                        className="w-full p-4 rounded-xl border border-comfort-200 bg-comfort-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none resize-none h-32"
                                        placeholder="e.g., My boss didn't reply to my email instantly."
                                        value={reframingData.situation}
                                        onChange={(e) => setReframingData({...reframingData, situation: e.target.value})}
                                    />
                                 </>
                             )}

                             {reframingStep === 1 && (
                                 <>
                                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                                        <AlertTriangle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-comfort-900 mb-3">What is the negative thought?</h3>
                                    <p className="text-comfort-500 mb-6">What story are you telling yourself about this situation?</p>
                                    <textarea 
                                        className="w-full p-4 rounded-xl border border-comfort-200 bg-comfort-50 focus:bg-white focus:ring-2 focus:ring-red-100 outline-none resize-none h-32"
                                        placeholder="e.g., They must hate my work. I'm going to get fired."
                                        value={reframingData.thought}
                                        onChange={(e) => setReframingData({...reframingData, thought: e.target.value})}
                                    />
                                 </>
                             )}

                             {reframingStep === 2 && (
                                 <>
                                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                                        <RefreshCw size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-comfort-900 mb-3">Identify the "Trap"</h3>
                                    <p className="text-comfort-500 mb-6">Which cognitive distortion might be at play here?</p>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {COGNITIVE_DISTORTIONS.map((d, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setReframingData({...reframingData, distortion: d.title})}
                                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                    reframingData.distortion === d.title 
                                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
                                                    : 'bg-white border-comfort-200 hover:border-indigo-300'
                                                }`}
                                            >
                                                <div className="font-bold text-sm text-comfort-900">{d.title}</div>
                                                <div className="text-xs text-comfort-500 mt-1">{d.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                 </>
                             )}

                             {reframingStep === 3 && (
                                 <>
                                    <div className="w-16 h-16 bg-healing-100 rounded-2xl flex items-center justify-center text-healing-600 mb-6">
                                        <Sun size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-comfort-900 mb-3">Reframe the Thought</h3>
                                    <p className="text-comfort-500 mb-6">Look at the evidence. What is a more balanced way to see this?</p>
                                    
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4 text-xs text-red-800">
                                        <strong>Old Thought:</strong> "{reframingData.thought}"
                                    </div>

                                    <textarea 
                                        className="w-full p-4 rounded-xl border border-comfort-200 bg-comfort-50 focus:bg-white focus:ring-2 focus:ring-healing-100 outline-none resize-none h-32"
                                        placeholder="e.g., They are likely just busy. It doesn't define my worth."
                                        value={reframingData.challenge}
                                        onChange={(e) => setReframingData({...reframingData, challenge: e.target.value})}
                                    />
                                 </>
                             )}
                             
                             {reframingStep === 4 && (
                                 <div className="text-center">
                                     <div className="w-20 h-20 bg-healing-100 rounded-full flex items-center justify-center text-healing-600 mx-auto mb-6">
                                         <CheckCircle size={40} />
                                     </div>
                                     <h3 className="text-2xl font-bold text-comfort-900 mb-2">Well Done.</h3>
                                     <p className="text-comfort-500 mb-8">You've successfully reframed a negative thought pattern.</p>
                                     
                                     <div className="bg-white border border-comfort-200 p-6 rounded-2xl text-left shadow-sm mb-8">
                                         <div className="text-xs font-bold text-comfort-400 uppercase tracking-widest mb-1">Your Reframe</div>
                                         <div className="text-lg font-medium text-comfort-900">"{reframingData.challenge}"</div>
                                     </div>
                                 </div>
                             )}
                        </div>

                        <div className="mt-8 flex justify-between">
                            {reframingStep < 4 && (
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setReframingStep(s => Math.max(0, s - 1))}
                                    disabled={reframingStep === 0}
                                    className={reframingStep === 0 ? 'opacity-0' : ''}
                                >
                                    Back
                                </Button>
                            )}
                            {reframingStep < 4 ? (
                                <Button 
                                    onClick={() => setReframingStep(s => s + 1)}
                                    disabled={
                                        (reframingStep === 0 && !reframingData.situation) ||
                                        (reframingStep === 1 && !reframingData.thought) ||
                                        (reframingStep === 2 && !reframingData.distortion) ||
                                        (reframingStep === 3 && !reframingData.challenge)
                                    }
                                    className="ml-auto"
                                >
                                    Next Step
                                </Button>
                            ) : (
                                <Button onClick={() => setCurrentScreen('home')} className="w-full">Back to Tools</Button>
                            )}
                        </div>
                    </Card>
                 </div>
             </div>
         );

      case 'login':
        return (
          <>
          <div className="min-h-screen flex flex-col items-center justify-center container mx-auto px-6 py-20">
             <div className="max-w-md w-full animate-slide-up">
                <button onClick={() => setCurrentScreen('home')} className="flex items-center gap-2 text-comfort-400 hover:text-comfort-800 mb-8 font-medium transition-colors mx-auto">
                  <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="text-center mb-10">
                    <PlantVisual stage={7} size="md" />
                    <h2 className="text-3xl font-display font-bold text-comfort-900 mt-6 mb-2">Begin Reflection</h2>
                    <p className="text-comfort-500">Create an anonymous alias to track your journey.</p>
                </div>
                
                <Card>
                    <div className="flex flex-col gap-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-comfort-400">Choose Alias</label>
                        <input 
                            type="text" 
                            placeholder="e.g. WanderingCloud"
                            className="w-full p-4 rounded-xl text-comfort-900 bg-comfort-50 outline-none focus:ring-2 focus:ring-serenity-200 transition-all placeholder-comfort-300 font-medium"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                        />
                        <div className="flex flex-col gap-2 mt-2">
                           <p className="text-xs text-comfort-400 flex items-center gap-1">
                               <Lock size={12} /> No email required. 100% Anonymous.
                           </p>
                        </div>
                        <Button onClick={handleLogin} className="w-full mt-4">
                            Start Journey <ArrowRight size={16} />
                        </Button>
                    </div>
                </Card>
             </div>
          </div>
          {renderFooter()}
          </>
        );

      case 'profile':
        return (
          <div className="min-h-screen pt-20 pb-12">
          <Card className="max-w-lg mx-auto">
            <h2 className="text-3xl font-display font-bold text-comfort-900 mb-2">Welcome, {userProfile.username}</h2>
            <p className="text-comfort-500 mb-8">Let's calibrate the compass to your specific environment.</p>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[UserRole.STUDENT, UserRole.PROFESSIONAL].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUserProfile({ ...userProfile, role })}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      userProfile.role === role
                        ? 'border-serenity-600 bg-serenity-50 text-serenity-800'
                        : 'border-comfort-100 bg-comfort-50 text-comfort-400 hover:border-serenity-200'
                    }`}
                  >
                    <span className="font-bold block mb-1 text-lg">{role}</span>
                    <span className="text-xs opacity-70">Role</span>
                  </button>
                ))}
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-comfort-400 mb-3">Age Group</label>
                <div className="relative">
                    <select 
                    className="w-full p-4 rounded-xl border border-comfort-200 bg-white focus:ring-2 focus:ring-serenity-200 outline-none appearance-none font-medium text-comfort-800"
                    value={userProfile.age}
                    onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value as AgeRange })}
                    >
                    {Object.values(AgeRange).map(age => (
                        <option key={age} value={age}>{age}</option>
                    ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-comfort-400">▼</div>
                </div>
              </div>

              <Button type="submit" className="w-full">Initialize Compass</Button>
            </form>
          </Card>
          </div>
        );

      case 'welcome_back':
        return (
           <div className="min-h-screen pt-24 text-center">
             <div className="max-w-md mx-auto animate-fade-in">
                <h2 className="text-4xl font-display font-bold text-comfort-900 mb-4">Welcome back, {userProfile.username}.</h2>
                <p className="text-lg text-comfort-600 mb-8">
                  Your consistency is building resilience. <br/>
                </p>
                
                <div className="bg-white p-10 rounded-full inline-block shadow-2xl shadow-serenity-100 mb-12 border border-comfort-100">
                   <PlantVisual stage={userStats.consistencyStreak} size="lg" />
                </div>
                
                <div className="max-w-xs mx-auto">
                    <Button onClick={() => setCurrentScreen('disclaimer')} className="w-full">
                        Begin Assessment <ArrowRight size={18} />
                    </Button>
                </div>
             </div>
           </div>
        );

      case 'disclaimer':
        return (
          <div className="min-h-screen pt-20 px-4 pb-20">
            <Card className="max-w-2xl mx-auto border-t-8 border-serenity-600 relative overflow-hidden">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-serenity-50 text-serenity-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <FileCheck size={14} /> Informed Consent
                    </div>
                    <h2 className="text-3xl font-display font-bold text-comfort-900">{PRIVACY_CONTENT.title}</h2>
                    <p className="text-comfort-600 mt-2">{PRIVACY_CONTENT.intro}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {PRIVACY_CONTENT.points.map((point) => (
                        <div key={point.id} className="bg-comfort-50 p-6 rounded-2xl border border-comfort-100">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-serenity-600 shadow-sm mb-4">
                                {point.icon === 'AlertTriangle' && <AlertTriangle size={20} className="text-amber-500" />}
                                {point.icon === 'Lock' && <Lock size={20} />}
                            </div>
                            <h3 className="font-bold text-comfort-900 mb-2">{point.title}</h3>
                            <p className="text-sm text-comfort-600 leading-relaxed">{point.text}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 border-t border-comfort-100 pt-8">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${consents.clinical ? 'bg-serenity-600 border-serenity-600' : 'border-comfort-300 bg-white'}`}>
                            {consents.clinical && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden"
                            checked={consents.clinical}
                            onChange={() => setConsents(prev => ({ ...prev, clinical: !prev.clinical }))}
                        />
                        <span className="text-sm text-comfort-700 group-hover:text-comfort-900 transition-colors select-none">
                            I understand that MindCompass is <strong>not a medical device</strong> and cannot diagnose mental health conditions.
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${consents.privacy ? 'bg-serenity-600 border-serenity-600' : 'border-comfort-300 bg-white'}`}>
                             {consents.privacy && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden"
                            checked={consents.privacy}
                            onChange={() => setConsents(prev => ({ ...prev, privacy: !prev.privacy }))}
                        />
                        <span className="text-sm text-comfort-700 group-hover:text-comfort-900 transition-colors select-none">
                            I consent to the encrypted processing of my journal entries by Google Gemini AI for the purpose of generating personal reflections.
                        </span>
                    </label>
                </div>

                <div className="mt-8">
                    <Button 
                        onClick={handleDisclaimerAccept}
                        className="w-full"
                        variant={consents.clinical && consents.privacy ? 'primary' : 'disabled'}
                    >
                        Accept & Begin Journey
                    </Button>
                    <p className="text-center text-xs text-comfort-400 mt-4">
                        By continuing, you acknowledge that you are over 18 years of age.
                    </p>
                </div>
            </Card>
          </div>
        );

      case 'mode_selection':
        return (
          <div className="min-h-screen pt-24 px-4 pb-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 animate-slide-up">
                <h2 className="text-3xl font-display font-bold text-comfort-900 mb-4">Choose Your Path</h2>
                <p className="text-comfort-600 max-w-lg mx-auto">
                  How would you like to reflect today?
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Scientific Option */}
                <div 
                  onClick={() => handleModeSelect('scientific')}
                  className="bg-white p-8 rounded-3xl border-2 border-comfort-100 hover:border-serenity-400 hover:shadow-xl hover:shadow-serenity-100/30 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 bg-serenity-50 rounded-bl-2xl text-xs font-bold text-serenity-700 uppercase tracking-widest">
                    Recommended
                  </div>
                  <div className="w-16 h-16 bg-serenity-100 rounded-2xl flex items-center justify-center text-serenity-600 mb-6 group-hover:scale-110 transition-transform">
                    <ClipboardCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-comfort-900 mb-2">Scientific Check-in</h3>
                  <p className="text-comfort-500 mb-8 leading-relaxed">
                    Use clinically adapted questions (GHQ-12 & DASS-21) to measure your distress levels accurately.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-serenity-700 group-hover:gap-3 transition-all">
                    Start Assessment <ArrowRight size={16} />
                  </div>
                </div>

                {/* Journal Option */}
                <div 
                  onClick={() => handleModeSelect('journal')}
                  className="bg-white p-8 rounded-3xl border-2 border-comfort-100 hover:border-healing-400 hover:shadow-xl hover:shadow-healing-100/30 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-healing-100 rounded-2xl flex items-center justify-center text-healing-600 mb-6 group-hover:scale-110 transition-transform">
                    <Feather size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-comfort-900 mb-2">Open Journaling</h3>
                  <p className="text-comfort-500 mb-8 leading-relaxed">
                    Just write what's on your mind. Our compassionate AI will listen and suggest resources.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-healing-600 group-hover:gap-3 transition-all">
                    Start Writing <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'checkin':
        return (
          <div className="max-w-2xl mx-auto space-y-6 mt-10 pb-32 px-4 animate-slide-up">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-serenity-50 text-serenity-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                 <Activity size={14} /> Clinical Screening
              </div>
              <h2 className="text-3xl font-display font-bold text-comfort-900 mb-2">Weekly Pulse Check</h2>
              <p className="text-comfort-500">Answer based on how you have felt <strong>over the last week</strong>.</p>
            </div>
            
            <div className="space-y-8">
            {CHECKIN_QUESTIONS.map((q) => (
              <div key={q.id} className="bg-white rounded-3xl p-6 md:p-8 border border-comfort-100 shadow-sm transition-all hover:shadow-md group">
                <div className="flex justify-between items-start mb-6">
                    <p className="font-medium text-lg text-comfort-900 leading-snug">{q.text}</p>
                    <span className="text-[10px] uppercase font-bold text-comfort-300 bg-comfort-50 px-2 py-1 rounded-md">{q.source}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* 
                     SCORING LOGIC: 
                     If q.reverse is true (Positive Question):
                     - "Not at all" = 3 (Distress)
                     - "Much more than usual" = 0 (Healthy)
                     
                     If q.reverse is false (Negative Question):
                     - "Not at all" = 0 (Healthy)
                     - "Much more than usual" = 3 (Distress)
                  */}
                  {['Not at all', 'No more than usual', 'Rather more than usual', 'Much more than usual'].map((label, idx) => {
                    const rawValue = idx; // 0, 1, 2, 3
                    
                    const distressScore = q.reverse ? (3 - rawValue) : rawValue;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleCheckInAnswer(q.id, distressScore)}
                        className={`py-3 px-3 rounded-xl text-xs font-bold transition-all duration-200 border ${
                          checkInResponses[q.id] === distressScore
                            ? 'bg-serenity-600 border-serenity-600 text-white shadow-lg shadow-serenity-200'
                            : 'bg-white border-comfort-100 text-comfort-400 hover:border-serenity-300 hover:text-serenity-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-comfort-200 p-6 flex justify-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <Button onClick={handleCheckInSubmit} className="w-full max-w-md shadow-xl text-lg py-5">
                 Synthesize Responses <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 'reflection':
        return (
          <div className="min-h-screen pt-20">
          <Card className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-serenity-50 flex items-center justify-center text-serenity-600">
                    <BookOpen size={20} />
                </div>
                <h2 className="text-2xl font-display font-bold text-comfort-900">
                    {assessmentMode === 'scientific' ? 'Add Context (Optional)' : 'Journaling'}
                </h2>
            </div>
            <p className="text-comfort-500 mb-6 leading-relaxed">
                {assessmentMode === 'scientific' 
                    ? "Your score has been calculated. Would you like to add any notes for the AI to reflect on?"
                    : "What's been on your mind? Our system will read this to 'mirror' back your thoughts."}
            </p>
            <textarea
              className="w-full h-48 p-6 rounded-2xl border border-comfort-200 bg-comfort-50 focus:bg-white focus:ring-2 focus:ring-serenity-200 outline-none resize-none mb-8 text-comfort-800 text-lg placeholder-comfort-400 transition-all"
              placeholder={assessmentMode === 'scientific' ? "e.g., I'm specifically stressed about exams..." : "e.g., I've been feeling overwhelmed by..."}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
            />
            <Button onClick={handleReflectionSubmit} className="w-full">
               {assessmentMode === 'scientific' ? 'Complete & View Results' : 'Complete & Reflect'}
            </Button>
            
            {assessmentMode === 'scientific' && (
                <button 
                    onClick={handleReflectionSubmit} 
                    className="w-full text-center mt-4 text-comfort-400 hover:text-serenity-600 text-sm font-medium transition-colors"
                >
                    Skip and view results
                </button>
            )}
          </Card>
          </div>
        );

      case 'processing':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
             <div className="relative w-24 h-24 mb-8">
                 <div className="absolute inset-0 bg-serenity-100 rounded-full animate-ping"></div>
                 <div className="relative z-10 bg-white p-6 rounded-full border-2 border-serenity-100 shadow-xl">
                    <Sparkles className="w-10 h-10 text-serenity-600 animate-pulse" />
                 </div>
             </div>
            <h3 className="text-2xl font-display font-bold text-comfort-900">Synthesizing...</h3>
            <p className="text-comfort-500 mt-2">Reflecting on your inputs and finding resources.</p>
          </div>
        );

      case 'safety_plan':
        return (
          <div className="min-h-screen pt-12 px-4 pb-20 bg-serenity-50">
             <Card className="max-w-xl mx-auto border-t-8 border-serenity-600">
                 <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-comfort-900">My Safety Plan</h2>
                    <p className="text-comfort-500 mt-2">
                        A personalized guide to help you navigate through a crisis. Fill this out so you have a concrete plan when things get tough.
                    </p>
                 </div>

                 <div className="space-y-6">
                     <div>
                         <label className="block text-xs font-bold uppercase tracking-wider text-comfort-400 mb-2">Step 1: One Coping Strategy</label>
                         <p className="text-xs text-comfort-400 mb-2">What is one thing that you can do by yourself to take your mind off problems?</p>
                         <input 
                            type="text"
                            className="w-full p-4 rounded-xl border border-comfort-200 bg-white outline-none focus:ring-2 focus:ring-serenity-200"
                            placeholder="e.g. Listen to music, Go for a walk"
                            value={safetyPlan.copingStrategy}
                            onChange={(e) => setSafetyPlan({...safetyPlan, copingStrategy: e.target.value})}
                         />
                     </div>

                     <div>
                         <label className="block text-xs font-bold uppercase tracking-wider text-comfort-400 mb-2">Step 2: Trusted Contact</label>
                         <p className="text-xs text-comfort-400 mb-2">Who is one person you can call?</p>
                         <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="text"
                                className="w-full p-4 rounded-xl border border-comfort-200 bg-white outline-none focus:ring-2 focus:ring-serenity-200"
                                placeholder="Name (e.g. Mom)"
                                value={safetyPlan.contactName}
                                onChange={(e) => setSafetyPlan({...safetyPlan, contactName: e.target.value})}
                            />
                            <input 
                                type="tel"
                                className="w-full p-4 rounded-xl border border-comfort-200 bg-white outline-none focus:ring-2 focus:ring-serenity-200"
                                placeholder="Phone Number"
                                value={safetyPlan.contactPhone}
                                onChange={(e) => setSafetyPlan({...safetyPlan, contactPhone: e.target.value})}
                            />
                         </div>
                     </div>

                     <div className="bg-serenity-50 p-4 rounded-xl border border-serenity-100 text-sm text-serenity-800">
                         <strong>Step 3: Professional Help</strong>
                         <p className="mt-1">If the above doesn't work, I will call the Vandrevala Foundation (1860-266-2345).</p>
                     </div>

                     <Button 
                        onClick={handleSafetyPlanSubmit}
                        disabled={!safetyPlan.contactPhone}
                        className="w-full bg-serenity-700 hover:bg-serenity-800 text-white"
                     >
                        <Send size={18} /> Save & Send Alert
                     </Button>
                     <p className="text-xs text-center text-comfort-400 mt-2">
                        This will open your SMS app with a pre-written message to your trusted contact.
                     </p>
                 </div>
             </Card>
             <div className="text-center mt-6">
                 <button onClick={() => setCurrentScreen('safety')} className="text-comfort-500 underline text-sm">Return to Safety Screen</button>
             </div>
          </div>
        );

      case 'safety':
        // Priority: HIGH - Safety Escalation
        return (
          <div className="min-h-screen pt-12 px-4 bg-red-50/50">
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white rounded-3xl overflow-hidden border-t-8 border-red-500 shadow-2xl">
              <div className="p-10 text-center">
                
                {/* Visual Logic for High Priority */}
                <div className="mb-8 flex flex-col items-center justify-center gap-4">
                    <PlantVisual stage={userStats.consistencyStreak} size="lg" priority={PriorityLevel.HIGH} />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold uppercase tracking-wider">
                         {SUPPORT_LABELS[PriorityLevel.HIGH]}
                    </span>
                </div>

                <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">We hear you, and we care.</h2>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-900 mb-8">
                    <p className="leading-relaxed font-medium text-lg">
                    "{aiResult?.reflection}"
                    </p>
                </div>
                
                <p className="text-gray-600 mb-8">You don't have to carry this alone. Please connect with someone now.</p>

                <div className="space-y-4">
                  <Button variant="safety" className="w-full py-5 text-lg shadow-red-200" onClick={() => window.location.href = 'tel:18602662345'}>
                    <Phone className="w-6 h-6" /> Call Vandrevala Foundation
                  </Button>
                  
                  {/* Human In The Loop Bridge */}
                  <Button 
                    variant="outline" 
                    className="w-full py-5 border-red-200 text-red-700 hover:bg-red-50" 
                    onClick={() => setCurrentScreen('safety_plan')}
                  >
                    <Users className="w-6 h-6" /> Create a Safety Plan
                  </Button>
                </div>
              </div>
            </div>
            <button onClick={() => setCurrentScreen('results')} className="block w-full text-center text-comfort-400 mt-8 text-sm hover:text-comfort-600 underline">
                Continue to resource library (Not Recommended)
            </button>
          </div>
          </div>
        );

      case 'results':
        return (
          <div className="max-w-4xl mx-auto space-y-8 mt-10 pb-32 px-4 animate-slide-up">
            {/* Success Banner */}
            <div className="bg-gradient-to-br from-serenity-50 to-white rounded-[2rem] p-10 text-center border border-serenity-100 shadow-xl shadow-serenity-100/50 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5 text-serenity-500"><Leaf size={300} /></div>
               
               <div className="inline-block p-4 bg-white rounded-full mb-6 shadow-md relative z-10">
                 <Sparkles className="w-8 h-8 text-amber-400" fill="currentColor" />
               </div>
               <h2 className="text-4xl font-display font-bold text-serenity-900 mb-3 relative z-10">Your Reflection</h2>
               <p className="text-lg text-comfort-600 mb-8 relative z-10 max-w-lg mx-auto leading-relaxed">"{aiResult?.reflection}"</p>
               
               <div className="flex justify-center items-center gap-6 relative z-10">
                 <div className="flex flex-col items-center gap-4">
                    <PlantVisual stage={userStats.consistencyStreak} priority={aiResult?.priority} />
                    
                    {/* Compassionate Insight Badge */}
                    <div className={`flex flex-col items-center gap-1 ${aiResult?.priority === PriorityLevel.LOW ? 'text-serenity-800' : 'text-blue-800'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Recommended Support Level</span>
                        <div className={`px-5 py-2 rounded-full font-bold text-sm shadow-sm border ${
                            aiResult?.priority === PriorityLevel.LOW 
                                ? 'bg-serenity-100 border-serenity-200 text-serenity-800'
                                : 'bg-blue-100 border-blue-200 text-blue-800'
                        }`}>
                           {SUPPORT_LABELS[aiResult?.priority || PriorityLevel.LOW]}
                        </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Resources Section - Categorized */}
            <div className="flex items-center gap-3 px-2">
                 <BookOpen size={24} className="text-serenity-600"/> 
                 <h3 className="text-2xl font-display font-bold text-comfort-900">Your Action Plan</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Human Connection Priority Block - Shows FIRST for Medium Priority */}
              {aiResult?.priority === PriorityLevel.MEDIUM && (
                <div className="md:col-span-2 bg-blue-50 p-8 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-start gap-6 relative overflow-hidden shadow-lg shadow-blue-100">
                    <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm z-10 shrink-0">
                        <HeartHandshake size={32} />
                    </div>
                    <div className="z-10">
                        <h4 className="font-bold text-xl text-blue-900 mb-2">Connect with a Listener</h4>
                        <p className="text-blue-800 text-sm mb-4 leading-relaxed max-w-xl">
                            The AI has flagged that you might be carrying a heavy load. While self-help is great, connecting with a human listener can provide the support you actually need right now.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a href="https://yourdost.com" target="_blank" className="inline-flex items-center gap-2 text-white bg-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                Chat with Counselor <MessageCircle size={16}/>
                            </a>
                            <button onClick={() => setCurrentScreen('safety_plan')} className="inline-flex items-center gap-2 text-blue-700 bg-white border border-blue-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                                Create Safety Plan <Shield size={16}/>
                            </button>
                        </div>
                    </div>
                </div>
              )}

              {RESOURCES.filter(r => r.type === SupportType.SELF_HELP).map((r, i) => (
                <div key={i} onClick={() => handleResourceClick(r.link)} className="cursor-pointer block p-8 bg-white rounded-3xl border border-comfort-100 hover:border-serenity-300 hover:shadow-xl hover:shadow-serenity-100/50 transition-all group relative">
                   <div className="flex items-center justify-between mb-4">
                      <div className="bg-comfort-50 p-3 rounded-2xl group-hover:bg-serenity-50 transition-colors">
                        <BookOpen size={24} className="text-comfort-400 group-hover:text-serenity-600" />
                      </div>
                      <span className="text-[10px] font-bold text-comfort-400 uppercase tracking-widest bg-comfort-50 px-2 py-1 rounded-md group-hover:bg-serenity-50 group-hover:text-serenity-600">Reading</span>
                   </div>
                   <h4 className="font-bold text-lg text-comfort-900 mb-2 group-hover:text-serenity-700">{r.title}</h4>
                   <p className="text-sm text-comfort-500 leading-relaxed mb-4">{r.description}</p>
                   <div className="text-serenity-600 text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                       {r.link.startsWith('internal') ? 'Start Tool' : 'Read Now'} <ChevronRight size={14} />
                   </div>
                </div>
              ))}
            </div>
            {renderFooter()}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-comfort-100 font-sans text-comfort-900 selection:bg-serenity-200 selection:text-serenity-900">
      {renderHeader()}
      <main className="w-full">
        {renderScreen()}
      </main>
    </div>
  );
}