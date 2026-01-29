import React, { useState, useRef, useEffect } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

import { Button } from '@/components/ui/button'

import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Table as TableIcon,
    MoreHorizontal,
    Heading1,
    Heading2,
    Heading3,
    Code,
    Quote,
    Undo,
    Redo,
    Trash2,
    Columns,
    Rows,
} from 'lucide-react'

const RichTextEditor = ({
    content = '',
    onChange,
    placeholder = 'Start writing...',
    minHeight = '150px',
    className = ''
}) => {
    const [showMore, setShowMore] = useState(false)
    const menuRef = useRef(false)
    
    useEffect(() => { 
        const handleClickMenu = (e) => {
            if(menuRef.current && !menuRef.current.contains(e.target)){
                setShowMore(false)
            }
        }
        if(showMore){
            document.addEventListener('mousedown', handleClickMenu)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickMenu)
        }
    },[showMore])
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML())
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none',
            },
        },
    })

    const editorState = useEditorState({
        editor,
        selector: (ctx) => ({
            canUndo: ctx.editor?.can().undo() ?? false,
            canRedo: ctx.editor?.can().redo() ?? false,
        }),
    })

    if (!editor) return null

    return (
        <div className={`rich-text-editor ${className}`}>
            <style>{`
                /* Basic Editor Styles */
                .ProseMirror {
                    min-height: ${minHeight};
                    outline: none;
                }

                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }

                /* Heading Styles */
                .ProseMirror h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-top: 0.5em;
                    margin-bottom: 0.5em;
                }

                .ProseMirror h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-top: 0.5em;
                    margin-bottom: 0.5em;
                }

                .ProseMirror h3 {
                    font-size: 1.25em;
                    font-weight: bold;
                    margin-top: 0.5em;
                    margin-bottom: 0.5em;
                }

                /* List Styles */
                .ProseMirror ul,
                .ProseMirror ol {
                    padding-left: 1.5em;
                    margin: 0.5em 0;
                }

                .ProseMirror li {
                    margin: 0.25em 0;
                }

                /* Code Block Styles */
                .ProseMirror pre {
                    background: #1e293b;
                    color: #e2e8f0;
                    font-family: 'Courier New', monospace;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    margin: 0.5em 0;
                    overflow-x: auto;
                }

                .ProseMirror code {
                    background: #f1f5f9;
                    color: #e11d48;
                    padding: 0.2em 0.4em;
                    border-radius: 0.25rem;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }

                .ProseMirror pre code {
                    background: none;
                    color: inherit;
                    padding: 0;
                }

                /* Blockquote Styles */
                .ProseMirror blockquote {
                    border-left: 4px solid #e5e7eb;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    color: #6b7280;
                    font-style: italic;
                }

                /* Table Styles */
                .ProseMirror table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    margin: 1rem 0;
                    overflow: hidden;
                }

                .ProseMirror table td,
                .ProseMirror table th {
                    min-width: 1em;
                    border: 2px solid #e5e7eb;
                    padding: 0.5rem;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                }

                .ProseMirror table th {
                    font-weight: bold;
                    text-align: left;
                    background-color: #f9fafb;
                }

                .ProseMirror table .selectedCell {
                    background-color: #dbeafe;
                }

                .ProseMirror table .column-resize-handle {
                    position: absolute;
                    right: -2px;
                    top: 0;
                    bottom: -2px;
                    width: 4px;
                    background-color: #3b82f6;
                    pointer-events: none;
                }

                .ProseMirror.resize-cursor {
                    cursor: col-resize;
                }

                /* Paragraph spacing */
                .ProseMirror p {
                    margin: 0.5em 0;
                }

                .ProseMirror p:first-child {
                    margin-top: 0;
                }

                .ProseMirror p:last-child {
                    margin-bottom: 0;
                }

                /* Bold and Italic */
                .ProseMirror strong {
                    font-weight: bold;
                }

                .ProseMirror em {
                    font-style: italic;
                }
            `}</style>

            {/* Toolbar */}
            <div className="border border-neutral-200 p-2 rounded-md">
                <div className="flex items-center gap-1 mb-3 relative">
                    <Button
                        type="button"
                        size="xs"
                        variant={editor.isActive('bold') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Bold"
                    >
                        <Bold size={16} />
                    </Button>

                    <Button
                        size="xs"
                        type="button"
                        variant={editor.isActive('italic') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Italic"
                    >
                        <Italic size={16} />
                    </Button>

                    <Button
                        size="xs"
                        type="button"
                        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </Button>

                    <Button
                        size="xs"
                        type="button"
                        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="Numbered List"
                    >
                        <ListOrdered size={16} />
                    </Button>

                    <Button
                        size="xs"
                        type="button"
                        variant="outline"
                        onClick={() =>
                            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                        }
                        title="Insert Table"
                    >
                        <TableIcon size={16} />
                    </Button>

                    <Button
                        size="xs"
                        type="button"
                        variant={showMore ? 'default' : 'outline'}
                        onClick={() => setShowMore((v) => !v)}
                        title="More Options"
                    >
                        <MoreHorizontal size={16} />
                    </Button>

                    {showMore && (
                        <div ref={menuRef} className="absolute top-10 right-0 bg-white border rounded shadow-lg p-2 z-50 w-56">
                            <div className="grid grid-cols-2 gap-1">
                                <Button
                                    size="xs"
                                    type="button"
                                    variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
                                    onClick={() => {
                                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                                        setShowMore(false)
                                    }}
                                    title="Heading 1"
                                >
                                    <Heading1 size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
                                    onClick={() => {
                                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                                        setShowMore(false)
                                    }}
                                    title="Heading 2"
                                >
                                    <Heading2 size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
                                    onClick={() => {
                                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                                        setShowMore(false)
                                    }}
                                    title="Heading 3"
                                >
                                    <Heading3 size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
                                    onClick={() => {
                                        editor.chain().focus().toggleCodeBlock().run()
                                        setShowMore(false)
                                    }}
                                    title="Code Block"
                                >
                                    <Code size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant={editor.isActive('blockquote') ? 'default' : 'outline'}
                                    onClick={() => {
                                        editor.chain().focus().toggleBlockquote().run()
                                        setShowMore(false)
                                    }}
                                    title="Quote"
                                >
                                    <Quote size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        editor.chain().focus().addColumnAfter().run()
                                        setShowMore(false)
                                    }}
                                    title="Add Column"
                                >
                                    <Columns size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        editor.chain().focus().addRowAfter().run()
                                        setShowMore(false)
                                    }}
                                    title="Add Row"
                                >
                                    <Rows size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        editor.chain().focus().deleteTable().run()
                                        setShowMore(false)
                                    }}
                                    title="Delete Table"
                                >
                                    <Trash2 size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant="outline"
                                    disabled={!editorState.canUndo}
                                    onClick={() => {
                                        editor.chain().focus().undo().run()
                                        setShowMore(false)
                                    }}
                                    title="Undo"
                                >
                                    <Undo size={14} />
                                </Button>

                                <Button
                                    size="xs"
                                    type="button"
                                    variant="outline"
                                    disabled={!editorState.canRedo}
                                    onClick={() => {
                                        editor.chain().focus().redo().run()
                                        setShowMore(false)
                                    }}
                                    title="Redo"
                                >
                                    <Redo size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Editor */}
                <div
                    className="border rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
                    style={{ minHeight }}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>

        </div>
    )
}

export default RichTextEditor