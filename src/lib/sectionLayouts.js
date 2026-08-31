export const HOME_LAYOUT_CYCLE = ['spotlight', 'heroGrid', 'featuredSplit', 'grid8', 'default']

export function sectionVariant(cat, index = 0) {
  if (!cat) return 'default'
  const slug = String(cat.slug || '')
  const name = String(cat.name || '')
  if (slug === 'motamot' || name.includes('মতামত')) return 'motamot'
  if (slug === 'bishesh') return 'specialReport'
  if (slug === 'motso') return 'fisheries'
  if (slug === 'prani') return 'livestock'
  if (slug === 'gobeshona' || name.includes('কৃষি গবেষণা')) return 'spotlight'
  if (slug === 'proshason' || name.includes('কৃষি প্রশাসন')) return 'proshason'
  if (slug === 'projukti' || name.includes('কৃষি প্রযুক্তি')) return 'projukti'
  if (slug === 'uddokta' || name.includes('উদ্যোক্তা') || name.includes('উদ্যোগ')) return 'heroGridSidebar'
  if (slug === 'krishoker-kotha' || name.includes('কৃষকের কথা')) return 'heroGridSidebar'
  if (slug === 'pani' || name.includes('পানি সম্পদ')) return 'binodon'
  return HOME_LAYOUT_CYCLE[index % HOME_LAYOUT_CYCLE.length]
}

export function sectionSlotMeta(variant) {
  const triple = {
    count: 7,
    columns: [
      { title: 'বাম কলাম', keys: [1, 2, 3], variant: 'row' },
      { title: 'ফিচার্ড', keys: [0], variant: 'lead' },
      { title: 'ডান কলাম', keys: [4, 5, 6], variant: 'row' },
    ],
  }
  switch (variant) {
    case 'proshason':
    case 'projukti':
    case 'binodon':
    case 'motamot':
    case 'spotlight':
      return triple
    case 'adminRows':
      return {
        count: 4,
        columns: [
          { title: 'সারি ১', keys: [0, 1], variant: 'row' },
          { title: 'সারি ২', keys: [2, 3], variant: 'row' },
        ],
      }
    case 'livestock':
      return {
        count: 7,
        columns: [
          { title: 'ফিচার্ড', keys: [0], variant: 'lead' },
          { title: 'ছোট খবর', keys: [1, 2], variant: 'sm' },
          { title: 'নিচের সারি', keys: [3, 4, 5, 6], variant: 'sm' },
        ],
      }
    case 'specialReport':
      return {
        count: 4,
        columns: [{ title: 'কার্ড', keys: [0, 1, 2, 3], variant: 'sm' }],
      }
    case 'heroGrid':
    case 'heroGridSidebar':
    case 'krishokerKotha':
      return {
        count: 7,
        columns: [
          { title: 'ফিচার্ড', keys: [0], variant: 'lead' },
          { title: 'গ্রিড খবর', keys: [1, 2, 3, 4, 5, 6], variant: 'sm' },
        ],
      }
    case 'featuredSplit':
      return {
        count: 7,
        columns: [
          { title: 'ফিচার্ড', keys: [0], variant: 'lead' },
          { title: 'মাঝের কার্ড', keys: [1, 2, 3], variant: 'sm' },
          { title: 'ডান কার্ড', keys: [4, 5, 6], variant: 'sm' },
        ],
      }
    case 'grid8':
      return {
        count: 8,
        columns: [{ title: 'গ্রিড', keys: [0, 1, 2, 3, 4, 5, 6, 7], variant: 'sm' }],
      }
    case 'fisheries':
      return {
        count: 8,
        columns: [{ title: 'সেকশন খবর', keys: [0, 1, 2, 3, 4, 5, 6, 7], variant: 'sm' }],
      }
    default:
      return {
        count: 9,
        columns: [{ title: 'গ্রিড খবর', keys: [0, 1, 2, 3, 4, 5, 6, 7, 8], variant: 'sm' }],
      }
  }
}

export function emptyItems(count) {
  return Array.from({ length: count }, () => '')
}

export function orderArticlesByIds(articles, ids) {
  const list = Array.isArray(articles) ? articles : []
  const wanted = (ids || []).map((id) => String(id || '').trim()).filter(Boolean)
  if (!wanted.length) return list
  const byId = new Map(list.map((a) => [String(a.id || a._id), a]))
  const used = new Set()
  const next = []
  wanted.forEach((id) => {
    const item = byId.get(id)
    if (item && !used.has(id)) {
      next.push(item)
      used.add(id)
    }
  })
  list.forEach((item) => {
    const id = String(item.id || item._id)
    if (!used.has(id)) next.push(item)
  })
  return next
}
