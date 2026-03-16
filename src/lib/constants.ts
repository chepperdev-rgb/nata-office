export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const ROOMS = [
  { id: 'dev', name: 'DEV ROOM', color: '#6366f1', bg: '#1a1a2e', emoji: '💻' },
  { id: 'data', name: 'DATA ROOM', color: '#06b6d4', bg: '#0c1a2e', emoji: '📊' },
  { id: 'quality', name: 'QUALITY ROOM', color: '#f43f5e', bg: '#1e0a14', emoji: '🛡️' },
  { id: 'ops', name: 'OPS ROOM', color: '#f59e0b', bg: '#1c1200', emoji: '⚙️' },
  { id: 'social', name: 'SOCIAL MEDIA', color: '#ec4899', bg: '#1e0a18', emoji: '📱' },
  { id: 'research', name: 'RESEARCH', color: '#8b5cf6', bg: '#150a2e', emoji: '🔬' },
]

export const STATIC_AGENTS = [
  { id: 'miron', name: 'Мирон', role: 'Senior Architect', model: 'opus', room: 'dev', emoji: '🏗️' },
  { id: 'backend', name: 'Backend', role: 'Backend Dev', model: 'sonnet', room: 'dev', emoji: '⚙️' },
  { id: 'frontend', name: 'Frontend', role: 'Frontend Dev', model: 'sonnet', room: 'dev', emoji: '🎨' },
  { id: 'designer', name: 'Дизайнер', role: 'UI/UX Designer', model: 'sonnet', room: 'dev', emoji: '✏️' },
  { id: 'data', name: 'Data Eng', role: 'Data Engineer', model: 'sonnet', room: 'data', emoji: '📊' },
  { id: 'analyst', name: 'Аналітик', role: 'Business Analyst', model: 'sonnet', room: 'data', emoji: '📈' },
  { id: 'scraper', name: 'Скрапер', role: 'Web Scraper', model: 'sonnet', room: 'data', emoji: '🕷️' },
  { id: 'qa', name: 'QA', role: 'QA Engineer', model: 'sonnet', room: 'quality', emoji: '🔍' },
  { id: 'security', name: 'Безпека', role: 'Security Eng', model: 'sonnet', room: 'quality', emoji: '🛡️' },
  { id: 'devops', name: 'DevOps', role: 'DevOps Engineer', model: 'sonnet', room: 'ops', emoji: '🚀' },
  { id: 'growth', name: 'Growth', role: 'Growth & SEO', model: 'sonnet', room: 'ops', emoji: '📣' },
  { id: 'content', name: 'Контент', role: 'Content Creator', model: 'sonnet', room: 'social', emoji: '✍️' },
  { id: 'ig-oracle', name: 'IG Oracle', role: 'Instagram Expert', model: 'sonnet', room: 'social', emoji: '📱' },
  { id: 'artem', name: 'Артем', role: 'Research Agent', model: 'opus', room: 'research', emoji: '🔬' },
  { id: 'pm', name: 'PM', role: 'Project Manager', model: 'sonnet', room: 'research', emoji: '📋' },
]
