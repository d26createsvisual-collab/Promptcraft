import React, { useState, useRef, useEffect } from 'react';
import { Clock, ArrowRight, Image as ImageIcon, Lightbulb, UploadSimple, X, Copy, Check, ArrowCounterClockwise } from '@phosphor-icons/react';

// --- Types ---
type InputMode = 'NONE' | 'IDEA' | 'SCREENSHOT';
type AppState = 'INPUT' | 'QUESTIONS' | 'OUTPUT';

interface ProjectData {
  mode: 'IDEA' | 'SCREENSHOT';
  idea?: string;
  image?: string; // base64
  imageContext?: string;
  projectType?: string;
  answers?: { question: string; answer: string | string[] }[];
  techStack?: string;
}

interface ToolRecommendation {
  name: string;
  reason: string;
  url: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  mode: 'IDEA' | 'SCREENSHOT';
  description: string;
  prompt: string;
  tools: ToolRecommendation[];
}

// --- Constants ---
const PROJECT_TYPES = [
  'Website', 'Web App', 'Mobile App', 'Landing Page',
  'Dashboard', 'AI Tool', 'Game', 'Portfolio', 'Other'
];

interface Question {
  id: string;
  title: string;
  options: string[];
  multi?: boolean;
  max?: number;
}

const QUESTION_SETS: Record<string, Question[]> = {
  'Landing Page': [
    { id: 'goal', title: "What's the main goal?", options: ['Drive sales', 'Collect emails', 'Book appointments', 'Build credibility', 'Launch a product'] },
    { id: 'tone', title: "What's the tone and vibe?", options: ['Minimal & clean', 'Bold & loud', 'Warm & personal', 'Corporate & professional', 'Playful & fun'] },
    { id: 'sections', title: "Which sections do you need?", options: ['Hero', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'Contact form', 'Team'], multi: true },
    { id: 'techStack', title: "Any tech requirements?", options: ['Plain HTML', 'Next.js', 'No preference'] }
  ],
  'Mobile App': [
    { id: 'action', title: "What's the one core action users do?", options: ['Track something', 'Create content', 'Communicate', 'Learn something', 'Shop', 'Other'] },
    { id: 'accounts', title: "Does it need user accounts?", options: ['Yes — email/password', 'Yes — social login', 'No — works without login'] },
    { id: 'screens', title: "What are the 3 most important screens?", options: ['Home/feed', 'Profile', 'Settings', 'Dashboard', 'Onboarding', 'Detail view'], multi: true, max: 3 },
    { id: 'techStack', title: "Tech preference?", options: ['React Native', 'Flutter', 'No preference'] }
  ],
  'Web App': [
    { id: 'audience', title: "Who uses this app?", options: ['Just me', 'Small team', 'Businesses', 'General public', 'Students'] },
    { id: 'features', title: "What are the 3 key features?", options: ['User login', 'Dashboard', 'AI features', 'Payments', 'Notifications', 'Data export'], multi: true, max: 3 },
    { id: 'designStyle', title: "What design style?", options: ['Minimal & clean', 'Bold & colorful', 'Dark & premium', 'Warm & editorial'] },
    { id: 'techStack', title: "Tech preference?", options: ['React', 'Next.js', 'No preference'] }
  ],
  'AI Tool': [
    { id: 'aiAction', title: "What does the AI do?", options: ['Generate text', 'Analyze input', 'Convert formats', 'Answer questions', 'Create images', 'Summarize content'] },
    { id: 'userInput', title: "What does the user input?", options: ['Text', 'Voice', 'Image/file', 'Structured form', 'URL'] },
    { id: 'audience', title: "Who is it for?", options: ['Just me', 'Developers', 'Non-technical users', 'Students', 'Professionals'] },
    { id: 'techStack', title: "Tech preference?", options: ['React', 'Next.js', 'No preference'] }
  ],
  'Dashboard': [
    { id: 'data', title: "What kind of data is shown?", options: ['Analytics', 'Finance', 'Project progress', 'User activity', 'Sales', 'Custom metrics'] },
    { id: 'audience', title: "Who reads this dashboard?", options: ['Just me', 'A small team', 'Clients', 'Executives', 'General users'] },
    { id: 'requirements', title: "Any special requirements?", options: ['Real-time updates', 'Charts/graphs', 'Export to PDF', 'Dark mode', 'Mobile friendly'] },
    { id: 'techStack', title: "Tech preference?", options: ['React', 'Next.js', 'No preference'] }
  ],
  'Website': [
    { id: 'type', title: "What type of website?", options: ['Portfolio', 'Blog', 'Business', 'Community', 'Documentation'] },
    { id: 'goal', title: "What's the main goal?", options: ['Showcase work', 'Share knowledge', 'Get clients', 'Build audience', 'Sell something'] },
    { id: 'designStyle', title: "Design style?", options: ['Minimal', 'Bold', 'Editorial', 'Corporate', 'Creative/experimental'] },
    { id: 'techStack', title: "Tech preference?", options: ['Plain HTML', 'Next.js', 'No preference'] }
  ],
  'Game': [
    { id: 'type', title: "What type of game?", options: ['Puzzle', 'Arcade', 'Card game', 'Word game', 'Strategy', 'Other'] },
    { id: 'playStyle', title: "How do people play?", options: ['Solo', '2 players local', 'Multiplayer online', 'Either'] },
    { id: 'platform', title: "What platform?", options: ['Browser only', 'Mobile', 'Desktop', 'All'] },
    { id: 'artStyle', title: "Art style?", options: ['Minimal/geometric', 'Pixel art', 'Illustrated', 'Abstract'] }
  ],
  'Portfolio': [
    { id: 'field', title: "What field are you in?", options: ['Design', 'Development', 'Photography', 'Writing', 'Music', 'Other creative'] },
    { id: 'goal', title: "What's the main goal?", options: ['Get hired', 'Get clients', 'Show projects', 'Build personal brand'] },
    { id: 'designStyle', title: "Design personality?", options: ['Clean & minimal', 'Bold & expressive', 'Dark & moody', 'Warm & personal'] },
    { id: 'techStack', title: "Tech preference?", options: ['Plain HTML', 'Next.js', 'No preference'] }
  ],
  'DEFAULT': [
    { id: 'audience', title: 'Who is this for?', options: ['Just me', 'Students', 'Professionals', 'Small businesses', 'Anyone'] },
    { id: 'features', title: 'What are the 3 most important features?', options: ['User login', 'Dashboard', 'AI features', 'Payments', 'Notifications', 'Data export', 'Other'], multi: true, max: 3 },
    { id: 'designStyle', title: 'What design style do you prefer?', options: ['Minimal & clean', 'Bold & colorful', 'Dark & premium', 'Warm & editorial', 'No preference'] },
    { id: 'techStack', title: 'Any tech requirements?', options: ['React', 'Next.js', 'Mobile (React Native)', 'Plain HTML', 'No preference'] }
  ]
};

const EXAMPLE_SETS: Record<string, { tag: string, text: string }[]> = {
  'Landing Page': [
    { tag: 'Landing Page', text: 'A specialty coffee shop in Chennai with online reservations' },
    { tag: 'Landing Page', text: 'A freelance photographer portfolio with booking form' },
    { tag: 'Landing Page', text: 'A SaaS product launch page with waitlist signup' }
  ],
  'Mobile App': [
    { tag: 'Mobile App', text: 'A habit tracker for students with streak tracking' },
    { tag: 'Mobile App', text: 'A split expense app for roommates' },
    { tag: 'Mobile App', text: 'A mood journal with weekly insights' }
  ],
  'Web App': [
    { tag: 'Web App', text: 'A client portal for freelancers to share deliverables' },
    { tag: 'Web App', text: 'A bookmark manager that summarizes saved articles' },
    { tag: 'Web App', text: 'A mini CRM for solo consultants' }
  ],
  'AI Tool': [
    { tag: 'AI Tool', text: 'Convert messy voice notes into structured tasks' },
    { tag: 'AI Tool', text: 'Generate cold emails from a LinkedIn profile URL' },
    { tag: 'AI Tool', text: 'Turn a rough brief into a full product PRD' }
  ],
  'Dashboard': [
    { tag: 'Dashboard', text: 'A personal finance tracker with category breakdowns' },
    { tag: 'Dashboard', text: 'A content calendar for solo creators' },
    { tag: 'Dashboard', text: 'A freelance project tracker with invoice status' }
  ],
  'Website': [
    { tag: 'Website', text: 'A personal blog with newsletter integration' },
    { tag: 'Website', text: 'A documentation site for an open source project' },
    { tag: 'Website', text: 'A community hub for indie makers' }
  ],
  'Game': [
    { tag: 'Game', text: 'A browser-based typing speed game' },
    { tag: 'Game', text: 'A daily word puzzle like Wordle' },
    { tag: 'Game', text: 'A minimalist chess variant for two players' }
  ],
  'Portfolio': [
    { tag: 'Portfolio', text: 'A product designer portfolio with case studies' },
    { tag: 'Portfolio', text: 'A developer portfolio with live project demos' },
    { tag: 'Portfolio', text: 'A motion designer portfolio with showreel' }
  ],
  'Other': [
    { tag: 'Other', text: 'A wedding planning checklist tool' },
    { tag: 'Other', text: 'A recipe converter with serving size calculator' },
    { tag: 'Other', text: 'A study flashcard app with spaced repetition' }
  ],
  'DEFAULT': [
    { tag: 'Mobile App', text: 'A habit tracker for students with streak tracking' },
    { tag: 'Landing Page', text: 'A coffee shop in Chennai with online reservations' },
    { tag: 'AI Tool', text: 'Convert messy voice notes into structured tasks' }
  ]
};

// --- Helpers ---
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const maxSize = 800;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

const getToolRecommendations = (data: ProjectData): ToolRecommendation[] => {
  const isWeb = data.techStack?.toLowerCase().includes('react') || data.techStack?.toLowerCase().includes('next');
  const isMobile = data.techStack?.toLowerCase().includes('mobile');
  
  if (isWeb) {
    return [
      { name: 'v0', reason: 'Best for generating React/Next.js UI components quickly', url: 'https://v0.dev' },
      { name: 'Bolt', reason: 'Great for full-stack web apps in the browser', url: 'https://bolt.new' }
    ];
  } else if (isMobile) {
    return [
      { name: 'Cursor', reason: 'Excellent for React Native development', url: 'https://cursor.com' },
      { name: 'Replit', reason: 'Good for mobile prototyping in the cloud', url: 'https://replit.com' }
    ];
  }
  
  return [
    { name: 'AI Studio', reason: 'Perfect for quick prototyping and experimentation', url: 'https://aistudio.google.com' },
    { name: 'Cursor', reason: 'The best AI code editor for complex projects', url: 'https://cursor.com' }
  ];
};

const generatePrompt = async (data: ProjectData): Promise<string> => {
  const endpoint = data.mode === 'IDEA' ? '/api/generate' : '/api/analyze';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to generate prompt');
  }

  const result = await response.json();
  return result.prompt;
};

const LOADING_MESSAGES = [
  "Structuring your idea...",
  "Picking the right approach...",
  "Writing your prompt...",
  "Almost ready..."
];

// --- Main Component ---
export default function App() {
  const [appState, setAppState] = useState<AppState>('INPUT');
  const [inputMode, setInputMode] = useState<InputMode>('NONE');
  
  // Idea State
  const [idea, setIdea] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Screenshot State
  const [image, setImage] = useState<string | null>(null);
  const [imageContext, setImageContext] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Questions State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // Output State
  const [generatedPromptText, setGeneratedPromptText] = useState('');
  const [recommendedTools, setRecommendedTools] = useState<ToolRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading State
  const [progress, setProgress] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const wasGenerating = useRef(false);

  useEffect(() => {
    if (isGenerating) {
      wasGenerating.current = true;
      setProgress(0);
      const timer = setTimeout(() => setProgress(85), 50);
      return () => clearTimeout(timer);
    } else if (wasGenerating.current) {
      wasGenerating.current = false;
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 400);
      return () => clearTimeout(timer);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (isGenerating) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('promptcraft_v2_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveToHistory = () => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      mode: inputMode === 'IDEA' ? 'IDEA' : 'SCREENSHOT',
      description: inputMode === 'IDEA' ? idea : (imageContext || 'Screenshot analysis'),
      prompt: generatedPromptText,
      tools: recommendedTools
    };
    const newHistory = [newItem, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('promptcraft_v2_history', JSON.stringify(newHistory));
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIdea(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateIdea = () => {
    if (!idea.trim()) return;
    setAppState('QUESTIONS');
  };

  const handleGenerateScreenshot = async () => {
    if (!image) return;
    setAppState('OUTPUT');
    setIsGenerating(true);
    setError(null);
    try {
      const compressedImage = await compressImage(image);
      const data: ProjectData = { mode: 'SCREENSHOT', image: compressedImage, imageContext };
      const prompt = await generatePrompt(data);
      setGeneratedPromptText(prompt);
      setRecommendedTools(getToolRecommendations(data));
      saveToHistory();
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextQuestion = async () => {
    const currentQuestions = QUESTION_SETS[selectedTypes[0]] || QUESTION_SETS['DEFAULT'];
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState('OUTPUT');
      setIsGenerating(true);
      setError(null);
      try {
        const formattedAnswers = currentQuestions.map(q => ({
          question: q.title,
          answer: answers[q.id] || (q.multi ? [] : '')
        }));

        const data: ProjectData = {
          mode: 'IDEA',
          idea,
          projectType: selectedTypes[0] || 'General',
          answers: formattedAnswers,
          techStack: (answers.techStack as string) || 'No preference'
        };
        const prompt = await generatePrompt(data);
        setGeneratedPromptText(prompt);
        setRecommendedTools(getToolRecommendations(data));
        saveToHistory();
      } catch (err) {
        setError('Something went wrong. Try again.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    if (inputMode === 'SCREENSHOT') {
      handleGenerateScreenshot();
    } else if (inputMode === 'IDEA') {
      handleNextQuestion();
    }
  };

  const resetApp = () => {
    setAppState('INPUT');
    setInputMode('NONE');
    setIdea('');
    setImage(null);
    setImageContext('');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setError(null);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-x-hidden">
      {/* Progress Bar */}
      {(isGenerating || progress > 0) && (
        <div 
          className="fixed top-0 left-0 h-[1.5px] bg-[rgba(255,255,255,0.9)] z-50"
          style={{ 
            width: `${progress}%`, 
            transition: isGenerating 
              ? 'width 8s cubic-bezier(0.1, 0.8, 0.3, 1)' 
              : 'width 0.4s ease-out, opacity 0.3s ease-out 0.4s',
            opacity: (!isGenerating && progress === 100) ? 0 : 1,
          }}
        />
      )}

      {/* Hero Background Texture */}
      <div className="hero-bg"></div>

      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border-default)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-sans font-medium text-[18px] text-[var(--color-text-primary)] tracking-tight">PromptCraft</h1>
        </div>
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 font-sans text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Clock size={16} />
          History
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        
        {/* STATE 1: INPUT */}
        {appState === 'INPUT' && (
          <div className="w-full max-w-2xl animate-fade-up">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface)] mb-6">
                <span className="font-sans text-[12px] text-[var(--color-text-secondary)]">Free. No signup.</span>
              </div>
              <h2 className="font-sans font-medium text-[40px] md:text-[56px] text-[var(--color-text-primary)] leading-[1.1] tracking-tight mb-4">
                Generate the perfect prompt.
              </h2>
              <p className="font-sans text-[16px] text-[var(--color-text-secondary)]">
                Stop writing vague instructions. Get structured, engineered prompts for any AI coding tool.
              </p>
            </div>

            {inputMode === 'NONE' && (
              <div className="animate-fade-in w-full">
                {/* Main Input Card */}
                <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 md:p-6 mb-4">
                  <textarea
                    ref={textareaRef}
                    value={idea}
                    onChange={handleTextareaInput}
                    autoFocus
                    placeholder="What do you want to build? e.g. A focus timer for students..."
                    className="w-full bg-transparent border-none outline-none resize-none font-sans text-[16px] text-[#F5F5F5] placeholder-[#3F3F46] min-h-[80px]"
                  />
                  <div className="h-[1px] w-full bg-[rgba(255,255,255,0.06)] my-4"></div>
                  <div className="mb-4">
                    <div className="font-mono text-[11px] text-[#3F3F46] uppercase tracking-widest mb-2">TYPE</div>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [type])}
                          className={`rounded-full px-3 py-1.5 font-sans text-[12px] transition-colors border ${
                            selectedTypes.includes(type)
                              ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)] border-[var(--color-text-primary)]'
                              : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateIdea}
                    disabled={!idea.trim()}
                    className="w-full h-[44px] bg-[#F5F5F5] text-[#0A0A0A] font-sans text-[14px] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Generate prompt <ArrowRight size={16} />
                  </button>
                </div>

                {/* Secondary Screenshot Card */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 md:px-6 flex items-center gap-4 cursor-pointer hover:border-[rgba(255,255,255,0.12)] transition-colors mb-8"
                >
                  <ImageIcon size={20} className="text-[#3F3F46] shrink-0" />
                  <div className="flex-1">
                    <div className="font-sans text-[14px] text-[#F5F5F5]">Or start from a screenshot</div>
                    <div className="font-sans text-[13px] text-[#71717A] mt-[2px]">Upload any design reference to recreate it.</div>
                  </div>
                  <button className="shrink-0 border border-[rgba(255,255,255,0.1)] rounded-lg px-[14px] py-[6px] font-sans text-[13px] text-[#71717A] hover:text-[#F5F5F5] hover:border-[rgba(255,255,255,0.2)] transition-colors">
                    Upload &rarr;
                  </button>
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFile(e.target.files[0]);
                      setInputMode('SCREENSHOT');
                    }
                  }} accept="image/*" className="hidden" />
                </div>

                {/* Examples Section */}
                <div>
                  <div className="font-mono text-[11px] text-[#3F3F46] uppercase tracking-[0.1em] mb-3">EXAMPLES</div>
                  <div key={selectedTypes[0] || 'DEFAULT'} className="flex flex-col gap-2 animate-fade-in-fast">
                    {(EXAMPLE_SETS[selectedTypes[0]] || EXAMPLE_SETS['DEFAULT']).map((ex, i) => (
                      <button 
                        key={i} 
                        onClick={() => {
                          setIdea(ex.text);
                          if (!selectedTypes.includes(ex.tag)) {
                            setSelectedTypes([ex.tag]);
                          }
                        }} 
                        className="flex items-center gap-3 text-left font-sans text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-1 group"
                      >
                        <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] group-hover:border-[var(--color-border-hover)] group-hover:text-[var(--color-text-secondary)] transition-colors whitespace-nowrap">
                          {ex.tag}
                        </span>
                        <span className="truncate">"{ex.text}"</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {inputMode === 'SCREENSHOT' && (
              <div className="animate-fade-up-small">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`bg-[var(--color-surface)] border-2 border-dashed rounded-2xl p-8 mb-4 text-center transition-colors ${
                    isDragging ? 'border-[var(--color-text-primary)] bg-[var(--color-surface-hover)]' : 'border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  {image ? (
                    <div className="relative inline-block">
                      <img src={image} alt="Preview" className="max-h-[300px] rounded-lg border border-[var(--color-border-default)]" />
                      <button onClick={() => setImage(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] rounded-full flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] flex items-center justify-center mb-4">
                        <UploadSimple size={24} className="text-[var(--color-text-secondary)]" />
                      </div>
                      <p className="font-sans text-[14px] text-[var(--color-text-primary)] mb-1">Drag and drop your screenshot here</p>
                      <p className="font-sans text-[13px] text-[var(--color-text-muted)] mb-4">or click to browse files</p>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-sans text-[13px] hover:bg-[var(--color-surface-raised)] transition-colors">
                        Select File
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-4 mb-6">
                  <input 
                    type="text" 
                    value={imageContext}
                    onChange={(e) => setImageContext(e.target.value)}
                    placeholder="Add context (optional) e.g. 'Make it a dark mode dashboard'" 
                    className="w-full bg-transparent border-none outline-none font-sans text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setInputMode('NONE')} className="px-6 py-3 rounded-xl border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-sans text-[14px] transition-colors">
                    Back
                  </button>
                  <button
                    onClick={handleGenerateScreenshot}
                    disabled={!image}
                    className="flex-1 bg-[var(--color-text-primary)] text-[var(--color-bg)] font-sans text-[14px] font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Analyze & generate <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE 2: QUESTIONS (Idea Mode Only) */}
        {appState === 'QUESTIONS' && (
          <div className="w-full max-w-2xl animate-fade-up">
            <div className="mb-8">
              <div className="flex gap-2 mb-4">
                {(QUESTION_SETS[selectedTypes[0]] || QUESTION_SETS['DEFAULT']).map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= currentQuestionIndex ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-border-default)]'}`} />
                ))}
              </div>
              <div className="font-sans text-[12px] text-[var(--color-text-muted)] uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {(QUESTION_SETS[selectedTypes[0]] || QUESTION_SETS['DEFAULT']).length}
              </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-8 mb-6">
              <h2 className="font-sans font-medium text-[24px] text-[var(--color-text-primary)] mb-6">
                {(QUESTION_SETS[selectedTypes[0]] || QUESTION_SETS['DEFAULT'])[currentQuestionIndex].title}
              </h2>
              <div className="flex flex-wrap gap-3">
                {(QUESTION_SETS[selectedTypes[0]] || QUESTION_SETS['DEFAULT'])[currentQuestionIndex].options.map(opt => {
                  const q = (QUESTION_SETS[selectedTypes[0]] || QUESTION_SETS['DEFAULT'])[currentQuestionIndex];
                  const isSelected = q.multi 
                    ? ((answers[q.id] as string[]) || []).includes(opt)
                    : answers[q.id] === opt;
                  
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (q.multi) {
                          const curr = (answers[q.id] as string[]) || [];
                          if (curr.includes(opt)) setAnswers({ ...answers, [q.id]: curr.filter(o => o !== opt) });
                          else if (curr.length < (q.max || 99)) setAnswers({ ...answers, [q.id]: [...curr, opt] });
                        } else {
                          setAnswers({ ...answers, [q.id]: opt });
                        }
                      }}
                      className={`rounded-full px-4 py-2 font-sans text-[14px] transition-colors border ${
                        isSelected
                          ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)] border-[var(--color-text-primary)]'
                          : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={() => currentQuestionIndex > 0 ? setCurrentQuestionIndex(prev => prev - 1) : setAppState('INPUT')}
                className="font-sans text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] font-sans text-[14px] font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                {currentQuestionIndex === (QUESTION_SETS[selectedTypes[0]] || QUESTION_SETS['DEFAULT']).length - 1 ? 'Generate' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: OUTPUT */}
        {appState === 'OUTPUT' && (
          <div className="w-full animate-fade-up">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-32">
                <h2 className="font-sans text-[18px] font-normal text-[#F5F5F5] mb-2">PromptCraft</h2>
                <div className="relative h-6 flex justify-center items-center w-full">
                  {LOADING_MESSAGES.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`absolute font-sans text-[14px] text-[#71717A] text-center transition-opacity duration-500 ${
                        idx === loadingMessageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] flex items-center justify-center mb-4">
                  <X size={24} className="text-[var(--color-text-primary)]" />
                </div>
                <p className="font-sans text-[16px] text-[var(--color-text-primary)] mb-6">{error}</p>
                <div className="flex flex-col gap-3">
                  <button onClick={handleRetry} className="px-6 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] font-sans text-[14px] font-medium rounded-xl hover:opacity-90 transition-opacity">
                    Try again
                  </button>
                  <button onClick={resetApp} className="px-6 py-3 bg-transparent text-[var(--color-text-secondary)] font-sans text-[14px] font-medium rounded-xl hover:text-[var(--color-text-primary)] transition-colors">
                    &larr; Start over
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Prompt */}
                <div className="w-full lg:w-[60%]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-sans font-medium text-[24px] text-[var(--color-text-primary)]">Generated Prompt</h2>
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors font-sans text-[13px] text-[var(--color-text-primary)]"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-6 md:p-8">
                    <div className="font-mono text-[13px] text-[var(--color-text-primary)] leading-[1.8] whitespace-pre-wrap">
                      {generatedPromptText.split('\n\n').map((section, i) => {
                        const lines = section.split('\n');
                        const heading = lines[0];
                        const content = lines.slice(1).join('\n');
                        
                        // Check if the first line is an uppercase heading
                        if (heading === heading.toUpperCase() && heading.length < 30 && heading.trim().length > 0) {
                          return (
                            <div key={i} className="mb-8 last:mb-0">
                              <div className="font-sans text-[11px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2">{heading}</div>
                              <div className="text-[var(--color-text-secondary)]">{content}</div>
                            </div>
                          );
                        }
                        return <div key={i} className="mb-4 text-[var(--color-text-secondary)]">{section}</div>;
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Tools & Next Steps */}
                <div className="w-full lg:w-[40%] flex flex-col gap-6">
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-6">
                    <h3 className="font-sans font-medium text-[16px] text-[var(--color-text-primary)] mb-1">Recommended Tools</h3>
                    <p className="font-sans text-[13px] text-[var(--color-text-secondary)] mb-6">Best platforms to paste this prompt into.</p>
                    <div className="flex flex-col gap-3">
                      {recommendedTools.map((tool, i) => (
                        <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-hover)] transition-colors group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-sans font-medium text-[14px] text-[var(--color-text-primary)]">{tool.name}</span>
                            <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
                          </div>
                          <p className="font-sans text-[13px] text-[var(--color-text-secondary)]">{tool.reason}</p>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-6">
                    <h3 className="font-sans font-medium text-[16px] text-[var(--color-text-primary)] mb-4">Next Steps</h3>
                    <ol className="flex flex-col gap-4">
                      <li className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] flex items-center justify-center font-mono text-[11px] text-[var(--color-text-secondary)] shrink-0">1</div>
                        <p className="font-sans text-[13px] text-[var(--color-text-secondary)]">Copy the generated prompt using the button above.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] flex items-center justify-center font-mono text-[11px] text-[var(--color-text-secondary)] shrink-0">2</div>
                        <p className="font-sans text-[13px] text-[var(--color-text-secondary)]">Open one of the recommended AI coding tools.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] flex items-center justify-center font-mono text-[11px] text-[var(--color-text-secondary)] shrink-0">3</div>
                        <p className="font-sans text-[13px] text-[var(--color-text-secondary)]">Paste the prompt and watch your app build.</p>
                      </li>
                    </ol>
                  </div>

                  <button onClick={resetApp} className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors font-sans text-[14px]">
                    <ArrowCounterClockwise size={16} /> Start over
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-[var(--color-border-default)] bg-[var(--color-bg)]">
        <p className="font-sans text-[12px] text-[var(--color-text-muted)]">PromptCraft · Free forever · No signup required</p>
      </footer>

      {/* History Panel */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border-default)] h-full overflow-y-auto flex flex-col animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="sticky top-0 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border-default)] p-6 flex items-center justify-between z-10">
              <h2 className="font-sans font-medium text-[18px] text-[var(--color-text-primary)]">History</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-raised)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex-1">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Clock size={32} className="text-[var(--color-text-muted)] mb-4" />
                  <p className="font-sans text-[14px] text-[var(--color-text-secondary)]">No history yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {history.map(item => (
                    <div key={item.id} className="p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] font-mono text-[10px] text-[var(--color-text-secondary)]">
                          {item.mode}
                        </span>
                        <span className="font-sans text-[11px] text-[var(--color-text-muted)]">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-sans text-[13px] text-[var(--color-text-primary)] line-clamp-2 mb-4">{item.description}</p>
                      <button 
                        onClick={() => {
                          setGeneratedPromptText(item.prompt);
                          setRecommendedTools(item.tools);
                          setAppState('OUTPUT');
                          setIsHistoryOpen(false);
                        }}
                        className="font-sans text-[12px] text-[var(--color-text-primary)] hover:underline"
                      >
                        Load prompt &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}