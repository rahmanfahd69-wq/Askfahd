"use client";

import React from "react";

/* -----------------------------------------------------------------------
   Lightweight markdown renderer — no external dependencies.
   Handles: **bold**, *italic*, `code`, # headings, - lists, 1. lists,
   tables (| col | col |), and paragraph breaks.
----------------------------------------------------------------------- */

function renderInline(text: string, key?: string | number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, `code`
  const regex = /(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    const idx = `${key}-${match.index}`;
    if (raw.startsWith("**")) {
      parts.push(<strong key={idx} className="font-bold text-white">{match[2]}</strong>);
    } else if (raw.startsWith("*")) {
      parts.push(<em key={idx} className="italic text-[rgba(255,255,255,0.85)]">{match[3]}</em>);
    } else {
      parts.push(
        <code key={idx} className="bg-[rgba(255,255,255,0.08)] text-[#FF8A65] rounded px-1.5 py-0.5 text-[12px] font-mono">
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

function parseTable(lines: string[]): React.ReactNode {
  // First line: headers, second line: separator (---)
  const rows = lines.filter((l) => l.trim().startsWith("|"));
  if (rows.length < 2) return null;

  const parseRow = (line: string) =>
    line.split("|").slice(1, -1).map((cell) => cell.trim());

  const headers = parseRow(rows[0]);
  const bodyRows = rows.slice(2); // skip separator row

  return (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-3 py-2 bg-[rgba(255,87,34,0.08)] border border-[rgba(255,255,255,0.08)] font-['Syne'] font-bold text-[rgba(255,138,101,0.9)] whitespace-nowrap"
              >
                {renderInline(h, `th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri} className="border-b border-[rgba(255,255,255,0.05)]">
              {parseRow(row).map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.75)]">
                  {renderInline(cell, `td-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(block: string, blockIndex: number): React.ReactNode {
  const lines = block.split("\n").filter((l) => l !== undefined);
  if (lines.length === 0) return null;

  // --- Table ---
  if (lines.some((l) => l.trim().startsWith("|"))) {
    return <div key={blockIndex}>{parseTable(lines)}</div>;
  }

  // --- Heading ---
  const headingMatch = lines[0].match(/^(#{1,4})\s+(.+)/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    const cls = level <= 2
      ? "font-['Syne'] font-black text-[16px] text-white mt-3 mb-1"
      : "font-['Syne'] font-bold text-[14px] text-[rgba(255,138,101,0.9)] mt-2 mb-0.5";
    return <p key={blockIndex} className={cls}>{renderInline(text, blockIndex)}</p>;
  }

  // --- Unordered list ---
  if (lines.every((l) => /^[-*•]\s/.test(l.trimStart()) || l.trim() === "")) {
    const items = lines.filter((l) => /^[-*•]\s/.test(l.trimStart()));
    return (
      <ul key={blockIndex} className="space-y-1 my-1 pl-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-[rgba(255,255,255,0.82)]">
            <span className="text-[#FF5722] shrink-0 mt-0.5">•</span>
            <span>{renderInline(item.replace(/^[-*•]\s+/, ""), `${blockIndex}-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // --- Ordered list ---
  if (lines.every((l) => /^\d+\.\s/.test(l.trimStart()) || l.trim() === "")) {
    const items = lines.filter((l) => /^\d+\.\s/.test(l.trimStart()));
    return (
      <ol key={blockIndex} className="space-y-1 my-1 pl-1 list-none">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-[rgba(255,255,255,0.82)]">
            <span className="text-[#FF8A65] font-['Syne'] font-bold shrink-0 min-w-[18px]">{i + 1}.</span>
            <span>{renderInline(item.replace(/^\d+\.\s+/, ""), `${blockIndex}-${i}`)}</span>
          </li>
        ))}
      </ol>
    );
  }

  // --- Mixed block (some bullet, some regular) ---
  return (
    <p key={blockIndex} className="text-[14px] leading-relaxed text-[rgba(255,255,255,0.82)]">
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(line, `${blockIndex}-${i}`)}
        </React.Fragment>
      ))}
    </p>
  );
}

interface Props {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: Props) {
  // Split into blocks on double newlines, but preserve table blocks
  const blocks: string[] = [];
  let current: string[] = [];
  let inTable = false;

  const rawLines = content.split("\n");
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const isTableLine = line.trim().startsWith("|");

    if (isTableLine && !inTable) {
      // Flush non-table lines
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      inTable = true;
      current.push(line);
    } else if (isTableLine && inTable) {
      current.push(line);
    } else if (!isTableLine && inTable) {
      blocks.push(current.join("\n"));
      current = [];
      inTable = false;
      if (line.trim() !== "") current.push(line);
    } else {
      // Normal line: split blocks on blank lines
      if (line.trim() === "") {
        if (current.length > 0) {
          blocks.push(current.join("\n"));
          current = [];
        }
      } else {
        current.push(line);
      }
    }
  }
  if (current.length > 0) blocks.push(current.join("\n"));

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
