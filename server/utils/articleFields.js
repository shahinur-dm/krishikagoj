/** Fields needed for cards/lists — never send full body on list APIs */
export const ARTICLE_LIST_SELECT =
  'title titleEn slug excerpt excerptEn image author authorUser views featured headline latest popular publishedAt createdAt category subcategory isPublished'

/** Full fields for public article page + admin edit form */
export const ARTICLE_DETAIL_SELECT =
  'title titleEn slug excerpt excerptEn body bodyEn image images tags author authorUser views featured headline latest popular bigthumbnail firstSection firstSectionThumbnail categoryHomepage isPublished publishedAt createdAt category subcategory printViewLink'
