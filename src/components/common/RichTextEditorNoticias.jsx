import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function RichTextEditorNoticias({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
      }),
    ],
    content: value || "",
    onUpdate({ editor: ed }) {
      const html = ed.getHTML();
      onChange(html);
    },
  });

  // Sincronizar contenido cuando viene de una noticia ya existente (modo edición)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current) {
      editor.commands.setContent(next, false);
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap gap-3 items-center text-[11px]">
        <span className="text-slate-400">Formato:</span>

        {/* Grupo: Párrafo / Título */}
        <label className="flex items-center gap-1 text-slate-600">
          <span>Bloque</span>
          <select
            className="border border-slate-300 rounded-md bg-white px-2 py-1 text-[11px]"
            value={
              editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                ? "h3"
                : "p"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              if (v === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
              if (v === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
          >
            <option value="p">Párrafo</option>
            <option value="h2">Título sección (H2)</option>
            <option value="h3">Subtítulo (H3)</option>
          </select>
        </label>

        {/* Grupo: Estilo de texto */}
        <label className="flex items-center gap-1 text-slate-600">
          <span>Texto</span>
          <select
            className="border border-slate-300 rounded-md bg-white px-2 py-1 text-[11px]"
            value={
              editor.isActive("bold")
                ? "bold"
                : editor.isActive("italic")
                ? "italic"
                : "normal"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "bold") editor.chain().focus().toggleBold().run();
              if (v === "italic") editor.chain().focus().toggleItalic().run();
              if (v === "normal") {
                editor.chain().focus().unsetMark("bold").unsetMark("italic").run();
              }
            }}
          >
            <option value="normal">Normal</option>
            <option value="bold">Negrita</option>
            <option value="italic">Cursiva</option>
          </select>
        </label>

        {/* Grupo: Listas */}
        <label className="flex items-center gap-1 text-slate-600">
          <span>Listas</span>
          <select
            className="border border-slate-300 rounded-md bg-white px-2 py-1 text-[11px]"
            value={
              editor.isActive("bulletList")
                ? "bullet"
                : editor.isActive("orderedList")
                ? "ordered"
                : "none"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "bullet") {
                editor
                  .chain()
                  .focus()
                  .toggleBulletList()
                  .run();
              } else if (v === "ordered") {
                editor
                  .chain()
                  .focus()
                  .toggleOrderedList()
                  .run();
              } else {
                editor
                  .chain()
                  .focus()
                  .liftListItem("listItem")
                  .run();
              }
            }}
          >
            <option value="none">Sin lista</option>
            <option value="bullet">Viñetas</option>
            <option value="ordered">Numerada</option>
          </select>
        </label>
      </div>
      <div className="bg-white min-h-[180px] max-h-[480px] overflow-y-auto px-3 py-2 text-sm">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none leading-6 focus:outline-none
                     [&_ul]:list-disc [&_ul]:pl-5 
                     [&_ol]:list-decimal [&_ol]:pl-5 
                     [&_li]:ml-2"
        />
      </div>
    </div>
  );
}

