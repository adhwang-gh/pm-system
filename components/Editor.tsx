'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Page } from '@/lib/types'

const lowlight = createLowlight(common)

const BLOCK_TYPES = [
  { label: 'Text', icon: '¶', command: (e: TiptapEditor) => e.chain().focus().setParagraph().run() },
  { label: 'Heading 1', icon: 'H1', command: (e: TiptapEditor) => e.chain().focus().setHeading({ level: 1 }).run() },
  { label: 'Heading 2', icon: 'H2', command: (e: TiptapEditor) => e.chain().focus().setHeading({ level: 2 }).run() },
  { label: 'Heading 3', icon: 'H3', command: (e: TiptapEditor) => e.chain().focus().setHeading({ level: 3 }).run() },
  { label: 'Bullet List', icon: '•', command: (e: TiptapEditor) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered List', icon: '1.', command: (e: TiptapEditor) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Blockquote', icon: '"', command: (e: TiptapEditor) => e.chain().focus().toggleBlockquote().run() },
  { label: 'Code Block', icon: '<>', command: (e: TiptapEditor) => e.chain().focus().toggleCodeBlock().run() },
]

interface Props {
  page: Page
  onUpdate: (title: string, content: string) => void
}

export default function Editor({ page, onUpdate }: Props) {
  const [title, setTitle] = useState(page.title)
  const [showSlash, setShowSlash] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const slashStartPos = useRef<number | null>(null)
  const titleRef = useRef(page.title)

  titleRef.current = title

  const scheduleUpdate = useCallback((newTitle: string, newContent: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onUpdate(newTitle, newContent), 800)
  }, [onUpdate])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: "Type '/' for commands…" }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: (() => {
      try { return JSON.parse(page.content) } catch { return { type: 'doc', content: [{ type: 'paragraph' }] } }
    })(),
    onUpdate({ editor }) {
      scheduleUpdate(titleRef.current, JSON.stringify(editor.getJSON()))
    },
    immediatelyRender: false,
  })

  // Handle slash command key events via editor DOM element
  useEffect(() => {
    if (!editor) return
    const el = editor.view.dom

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        slashStartPos.current = editor.state.selection.from
        setShowSlash(true)
        setSlashFilter('')
        setSlashIndex(0)
        return
      }

      if (!showSlash) return

      if (e.key === 'Escape') {
        setShowSlash(false)
        return
      }

      if (e.key === 'Backspace') {
        setSlashFilter(f => {
          if (f.length === 0) { setShowSlash(false); return f }
          return f.slice(0, -1)
        })
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex(i => i + 1)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex(i => Math.max(0, i - 1))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const filtered = BLOCK_TYPES.filter(b => b.label.toLowerCase().includes(slashFilter.toLowerCase()))
        const idx = slashIndex % Math.max(filtered.length, 1)
        if (filtered[idx] && slashStartPos.current !== null) {
          editor.chain().focus().deleteRange({
            from: slashStartPos.current,
            to: editor.state.selection.from,
          }).run()
          filtered[idx].command(editor)
          slashStartPos.current = null
        }
        setShowSlash(false)
        return
      }

      if (e.key.length === 1) {
        setSlashFilter(f => f + e.key)
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [editor, showSlash, slashFilter, slashIndex])

  useEffect(() => {
    if (!editor) return
    setTitle(page.title)
    try {
      const json = JSON.parse(page.content)
      if (json && json.type) editor.commands.setContent(json)
    } catch { /* empty content */ }
  }, [page.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleUpdate(e.target.value, editor ? JSON.stringify(editor.getJSON()) : page.content)
  }

  const filtered = BLOCK_TYPES.filter(b => b.label.toLowerCase().includes(slashFilter.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto bg-[#111118]">
      <div className="max-w-3xl mx-auto px-16 py-16">
        <div className="mb-2 text-4xl">{page.icon}</div>
        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="w-full text-4xl font-bold text-white mb-8 outline-none placeholder-gray-700 bg-transparent"
        />
        <div className="relative">
          <EditorContent
            editor={editor}
            className="prose prose-invert prose-lg max-w-none"
          />
          {showSlash && filtered.length > 0 && (
            <div className="absolute z-50 bg-[#1E1E28] border border-white/10 rounded-xl shadow-2xl py-1.5 w-60 max-h-64 overflow-y-auto">
              {filtered.map((b, i) => (
                <button
                  key={b.label}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${i === slashIndex % filtered.length ? 'bg-[#7B68EE]/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  onMouseDown={e => {
                    e.preventDefault()
                    if (slashStartPos.current !== null) {
                      editor?.chain().focus().deleteRange({
                        from: slashStartPos.current,
                        to: editor.state.selection.from,
                      }).run()
                    }
                    b.command(editor!)
                    slashStartPos.current = null
                    setShowSlash(false)
                  }}
                >
                  <span className="w-6 text-center font-mono text-xs text-gray-500">{b.icon}</span>
                  <span>{b.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
