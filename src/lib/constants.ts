export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const ROOMS = [
  { id: 'dev', name: 'DEV ROOM', color: '#1e40af', bg: '#1e3a5f', emoji: '💻' },
  { id: 'data', name: 'DATA ROOM', color: '#166534', bg: '#14532d', emoji: '📊' },
  { id: 'quality', name: 'QUALITY ROOM', color: '#991b1b', bg: '#7f1d1d', emoji: '🔍' },
  { id: 'growth', name: 'GROWTH ROOM', color: '#92400e', bg: '#78350f', emoji: '🚀' },
  { id: 'research', name: 'RESEARCH ROOM', color: '#5b21b6', bg: '#4c1d95', emoji: '🔬' },
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
  { id: 'devops', name: 'DevOps', role: 'DevOps Engineer', model: 'sonnet', room: 'quality', emoji: '🚀' },
  { id: 'growth', name: 'Growth', role: 'Growth & SEO', model: 'sonnet', room: 'growth', emoji: '📣' },
  { id: 'content', name: 'Контент', role: 'Content Creator', model: 'sonnet', room: 'growth', emoji: '✍️' },
  { id: 'ig-oracle', name: 'IG Oracle', role: 'Instagram Expert', model: 'sonnet', room: 'growth', emoji: '📱' },
  { id: 'artem', name: 'Артем', role: 'Research Agent', model: 'opus', room: 'research', emoji: '🔬' },
  { id: 'pm', name: 'PM', role: 'Project Manager', model: 'sonnet', room: 'research', emoji: '📋' },
]
