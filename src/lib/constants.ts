export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const ROOMS = [
  { id: 'dev', name: 'DEV ROOM', color: '#6366f1', bg: '#1a1a2e', icon: 'Monitor' },
  { id: 'data', name: 'DATA ROOM', color: '#06b6d4', bg: '#0c1a2e', icon: 'BarChart3' },
  { id: 'quality', name: 'QUALITY ROOM', color: '#f43f5e', bg: '#1e0a14', icon: 'Shield' },
  { id: 'ops', name: 'OPS ROOM', color: '#f59e0b', bg: '#1c1200', icon: 'Settings' },
  { id: 'social', name: 'SOCIAL MEDIA', color: '#ec4899', bg: '#1e0a18', icon: 'Smartphone' },
  { id: 'research', name: 'RESEARCH', color: '#8b5cf6', bg: '#150a2e', icon: 'Microscope' },
  { id: 'design', name: 'DESIGN STUDIO', color: '#f97316', bg: '#1a0e00', icon: 'Palette' },
]

export const STATIC_AGENTS = [
  { id: 'miron', name: 'Miron', role: 'Senior Architect', model: 'opus', room: 'dev', icon: 'Building2' },
  { id: 'backend', name: 'Backend', role: 'Backend Dev', model: 'sonnet', room: 'dev', icon: 'Settings' },
  { id: 'frontend', name: 'Frontend', role: 'Frontend Dev', model: 'sonnet', room: 'dev', icon: 'Palette' },
  { id: 'designer', name: 'Дизайнер', role: 'UI/UX Designer', model: 'sonnet', room: 'dev', icon: 'Pencil' },
  { id: 'data', name: 'Data Eng', role: 'Data Engineer', model: 'sonnet', room: 'data', icon: 'BarChart3' },
  { id: 'analyst', name: 'Аналітик', role: 'Business Analyst', model: 'sonnet', room: 'data', icon: 'TrendingUp' },
  { id: 'scraper', name: 'Скрапер', role: 'Web Scraper', model: 'sonnet', room: 'data', icon: 'Crosshair' },
  { id: 'qa', name: 'QA', role: 'QA Engineer', model: 'sonnet', room: 'quality', icon: 'Search' },
  { id: 'security', name: 'Безпека', role: 'Security Eng', model: 'sonnet', room: 'quality', icon: 'Shield' },
  { id: 'devops', name: 'DevOps', role: 'DevOps Engineer', model: 'sonnet', room: 'ops', icon: 'Rocket' },
  { id: 'growth', name: 'Growth', role: 'Growth & SEO', model: 'sonnet', room: 'ops', icon: 'Megaphone' },
  { id: 'content', name: 'Контент', role: 'Content Creator', model: 'sonnet', room: 'social', icon: 'Pen' },
  { id: 'ig-oracle', name: 'IG Oracle', role: 'Instagram Expert', model: 'sonnet', room: 'social', icon: 'Smartphone' },
  { id: 'artem', name: 'Артем', role: 'Research Agent', model: 'opus', room: 'research', icon: 'Microscope' },
  { id: 'pm', name: 'PM', role: 'Project Manager', model: 'sonnet', room: 'research', icon: 'ClipboardList' },
  // DESIGN STUDIO
  { id: 'viktor', name: 'Віктор', role: 'Creative Director', model: 'opus', room: 'design', icon: 'Eye', status: 'idle' },
  { id: 'pixel', name: 'Піксель', role: 'UI/UX Designer', model: 'sonnet', room: 'design', icon: 'Monitor', status: 'idle' },
  { id: 'marka', name: 'Марка', role: 'Visual Identity Designer', model: 'sonnet', room: 'design', icon: 'Gem', status: 'idle' },
  { id: 'sait', name: 'Сайт', role: 'Web Designer', model: 'sonnet', room: 'design', icon: 'Globe', status: 'idle' },
  { id: 'ruh', name: 'Рух', role: 'Motion Designer', model: 'sonnet', room: 'design', icon: 'Sparkles', status: 'idle' },
  { id: 'prostir', name: 'Простір', role: '3D Designer', model: 'sonnet', room: 'design', icon: 'Box', status: 'idle' },
  { id: 'systema', name: 'Система', role: 'Design Systems Lead', model: 'sonnet', room: 'design', icon: 'Dna', status: 'idle' },
  { id: 'koddesign', name: 'Код', role: 'Design Engineer', model: 'sonnet', room: 'design', icon: 'Zap', status: 'idle' },
  { id: 'kontenta', name: 'Контента', role: 'Content Designer', model: 'sonnet', room: 'design', icon: 'Ruler', status: 'idle' },
  { id: 'doslidnyk', name: 'Дослідник', role: 'UX Researcher', model: 'sonnet', room: 'design', icon: 'Search', status: 'idle' },
]
