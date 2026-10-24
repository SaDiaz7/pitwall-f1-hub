import type { ReactNode } from "react";

// Texto simple: líneas que empiezan con "- " son una lista; el resto, párrafos.
export function NewsBody({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let items: string[] = [];

  const flushList = () => {
    if (items.length === 0) return;
    const list = items;
    items = [];
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {list.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>,
    );
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();

    if (line.startsWith("- ")) {
      items.push(line.slice(2));
      continue;
    }

    flushList();
    if (line) blocks.push(<p key={`p-${blocks.length}`}>{line}</p>);
  }
  flushList();

  return <div className="space-y-3 text-sm leading-relaxed">{blocks}</div>;
}