import { icons } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Grupo = { id: number; nome: string }
type Selecao = { id: number; nome: string; grupo_id: number }

const style = document.createElement('style')
style.innerHTML = `
.topbar{display:none!important}
.content{padding-top:10px!important}
.filter-row{display:none!important}
.filter-select-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;position:sticky;top:0;z-index:5;background:rgba(255,255,255,.96);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:0 8px 24px rgba(16,32,24,.04);backdrop-filter:blur(10px)}
.filter-select-bar span{display:block;color:var(--green);font-size:12px;text-transform:uppercase;font-weight:900;letter-spacing:.08em}
.filter-select-bar strong{text-transform:capitalize}
.filter-select-bar select{border:1px solid var(--line);border-radius:16px;background:#fff;color:var(--text);padding:12px 14px;min-width:150px;font-weight:800}
.group-teams{display:grid;gap:4px;margin-top:14px;min-height:58px}
.group-teams small{color:var(--text);font-weight:700;line-height:1.25}
.bottom-item>span{font-size:0!important;line-height:0!important}
.bottom-item svg{width:22px;height:22px;stroke-width:2.4}
@media(max-width:620px){.content{padding-top:10px!important}.filter-select-bar{padding:14px}.filter-select-bar select{min-width:128px}.group-card span{font-size:22px}}
`
document.head.appendChild(style)

function renderIcon(name: keyof typeof icons) {
  const Icon = icons[name]
  const wrapper = document.createElement('span')
  wrapper.innerHTML = Icon({ size: 22, strokeWidth: 2.4 }).props.children ? '' : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${name === 'Home' ? '<path d="m3 9 9-7 9 7"/><path d="M9 22V12h6v10"/><path d="M21 9v13H3V9"/>' : name === 'BookOpen' ? '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 0 1 1h6a2 2 0 0 1 2 2V7a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1z"/><path d="M21 18a1 1 0 0 1-1 1h-6a2 2 0 0 0-2 2V7a2 2 0 0 1 2-2h6a1 1 0 0 1 1 1z"/>' : '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'}</svg>`
}

function applyIcons() {
  const items = Array.from(document.querySelectorAll<HTMLButtonElement>('.bottom-item'))
  const iconNames: (keyof typeof icons)[] = ['Home', 'BookOpen', 'Repeat2']
  items.forEach((item, index) => {
    const slot = item.querySelector('span')
    if (slot) slot.innerHTML = renderIcon(iconNames[index] || 'Home')
  })
}

function applyFilterSelect() {
  const filterRow = document.querySelector<HTMLElement>('.filter-row')
  if (!filterRow || document.querySelector('.filter-select-bar')) return
  const options = Array.from(filterRow.querySelectorAll<HTMLButtonElement>('button'))
  if (!options.length) return
  const active = options.find((button) => button.classList.contains('active')) || options[0]
  const bar = document.createElement('div')
  bar.className = 'filter-select-bar'
  bar.innerHTML = `<div><span>Filtro</span><strong>${active.textContent || 'Todas'}</strong></div><select aria-label="Selecionar filtro de figurinhas">${options.map((button) => `<option value="${button.textContent || ''}" ${button === active ? 'selected' : ''}>${button.textContent || ''}</option>`).join('')}</select>`
  const select = bar.querySelector('select')
  select?.addEventListener('change', () => {
    const label = select.value
    const target = options.find((button) => button.textContent === label)
    target?.click()
    const strong = bar.querySelector('strong')
    if (strong) strong.textContent = label === 'todas' ? 'Todas as figurinhas' : label
  })
  filterRow.insertAdjacentElement('beforebegin', bar)
}

async function applyGroupTeams() {
  const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('.group-card'))
  if (!cards.length || cards.some((card) => card.querySelector('.group-teams'))) return
  const [grupos, selecoes] = await Promise.all([
    fetch(`${API_URL}/grupos`).then((response) => response.json() as Promise<Grupo[]>),
    fetch(`${API_URL}/selecoes`).then((response) => response.json() as Promise<Selecao[]>),
  ]).catch(() => [[], []] as [Grupo[], Selecao[]])
  cards.forEach((card) => {
    const grupo = grupos.find((item) => item.nome === card.querySelector('span')?.textContent)
    const lista = selecoes.filter((selecao) => selecao.grupo_id === grupo?.id)
    const wrapper = document.createElement('div')
    wrapper.className = 'group-teams'
    wrapper.innerHTML = lista.length ? lista.map((selecao) => `<small>${selecao.nome}</small>`).join('') : '<small>Seleções não cadastradas</small>'
    card.querySelector('strong')?.insertAdjacentElement('beforebegin', wrapper)
  })
}

function applyAdjustments() {
  applyIcons()
  applyFilterSelect()
  applyGroupTeams()
}

new MutationObserver(applyAdjustments).observe(document.body, { childList: true, subtree: true })
applyAdjustments()
