import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const docsDirectory = path.join(process.cwd(), 'content/docs')

export interface DocFrontmatter {
  title: string
  description: string
  lastUpdated: string
  order?: number
}

export interface Doc {
  slug: string
  frontmatter: DocFrontmatter
  content: string
}

export function getAllDocSlugs(): string[] {
  if (!fs.existsSync(docsDirectory)) {
    return []
  }

  const files = fs.readdirSync(docsDirectory)
  return files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
}

export function getDocBySlug(slug: string): Doc | null {
  const fullPath = path.join(docsDirectory, `${slug}.mdx`)

  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    slug,
    frontmatter: data as DocFrontmatter,
    content,
  }
}

export function getAllDocs(): Doc[] {
  const slugs = getAllDocSlugs()
  const docs = slugs
    .map((slug) => getDocBySlug(slug))
    .filter((doc): doc is Doc => doc !== null)
    .sort((a, b) => (a.frontmatter.order || 999) - (b.frontmatter.order || 999))

  return docs
}
