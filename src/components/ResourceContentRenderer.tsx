"use client";

import React from "react";

interface ResourceContentRendererProps {
  content: string;
}

export default function ResourceContentRenderer({ content }: ResourceContentRendererProps) {
  if (!content || !content.trim()) {
    return (
      <div style={{ color: "#94a3b8", fontStyle: "italic", padding: "3rem 1rem", textAlign: "center" }}>
        No content written yet. Click &ldquo;Write&rdquo; to add scholarly guide content.
      </div>
    );
  }

  // Parse inline markdown: **bold**, *italic*, `code`
  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/;

    while (remaining.length > 0) {
      const match = remaining.match(tokenRegex);
      if (!match || match.index === undefined) {
        parts.push(remaining);
        break;
      }

      if (match.index > 0) {
        parts.push(remaining.substring(0, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith("`") && matchText.endsWith("`")) {
        parts.push(
          <code
            key={keyIdx++}
            style={{
              background: "#f1f5f9",
              color: "#0f172a",
              padding: "2px 6px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "0.88em",
              border: "1px solid #e2e8f0"
            }}
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push(
          <strong key={keyIdx++} style={{ fontWeight: 700, color: "#0f172a" }}>
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        parts.push(
          <em key={keyIdx++} style={{ fontStyle: "italic" }}>
            {matchText.slice(1, -1)}
          </em>
        );
      }

      remaining = remaining.substring(match.index + matchText.length);
    }

    return <>{parts}</>;
  };

  // Helper to render nested block content inside a container (callout, penalty, warning, card)
  const renderContainerBody = (inner: string) => {
    const lines = inner.split("\n");
    const elements: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
      if (!listType || listItems.length === 0) return;
      if (listType === "ul") {
        elements.push(
          <ul key={`ul-${elements.length}`} style={{ paddingLeft: "1.35rem", margin: "0.4rem 0 0.6rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {[...listItems]}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} style={{ paddingLeft: "1.35rem", margin: "0.4rem 0 0.6rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {[...listItems]}
          </ol>
        );
      }
      listType = null;
      listItems = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const tr = lines[i].trim();
      if (!tr) continue;

      if (tr.startsWith("- ") || tr.startsWith("* ")) {
        if (listType && listType !== "ul") flushList();
        listType = "ul";
        listItems.push(
          <li key={listItems.length} style={{ lineHeight: 1.7, color: "#334155", fontSize: "0.95rem", fontWeight: 400 }}>
            {renderInline(tr.replace(/^[-*]\s+/, ""))}
          </li>
        );
        continue;
      }

      if (/^\d+\.\s/.test(tr)) {
        if (listType && listType !== "ol") flushList();
        listType = "ol";
        listItems.push(
          <li key={listItems.length} style={{ lineHeight: 1.7, color: "#334155", fontSize: "0.95rem", fontWeight: 400 }}>
            {renderInline(tr.replace(/^\d+\.\s+/, ""))}
          </li>
        );
        continue;
      }

      flushList();
      elements.push(
        <p key={`p-${elements.length}`} style={{ margin: "0 0 0.5rem", lineHeight: 1.7, color: "#334155", fontSize: "0.95rem", fontWeight: 400 }}>
          {renderInline(tr)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  // Standard line parser for pure markdown sections
  const renderMarkdownBlocks = (rawText: string) => {
    const rawBlocks = rawText.split(/\n\s*\n/);
    const elements: React.ReactNode[] = [];
    let elemKey = 0;

    for (let b = 0; b < rawBlocks.length; b++) {
      const block = rawBlocks[b].trim();
      if (!block) continue;

      const lines = block.split("\n");

      // Check for Markdown Table
      if (block.includes("|") && lines.some(l => l.trim().startsWith("|") && l.includes("---"))) {
        const tableLines = lines.filter(l => l.trim().startsWith("|"));
        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].split("|").map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1 || c !== "");
          const dataRows = tableLines.slice(2);
          elements.push(
            <div key={elemKey++} style={{ overflowX: "auto", margin: "1.25rem 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem", border: "1px solid #e2e8f0", background: "#ffffff", borderRadius: "8px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 700, color: "#0f172a" }}>
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rIdx) => {
                    const cells = row.split("|").map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1 || c !== "");
                    return (
                      <tr key={rIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: "0.75rem 1rem", color: "#334155", verticalAlign: "top" }}>
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      let currentListType: "ul" | "ol" | null = null;
      let currentListItems: React.ReactNode[] = [];

      const flushList = () => {
        if (!currentListType || currentListItems.length === 0) return;
        if (currentListType === "ul") {
          elements.push(
            <ul
              key={elemKey++}
              style={{
                paddingLeft: "1.35rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                margin: "0.4rem 0 0.9rem",
                color: "#334155"
              }}
            >
              {[...currentListItems]}
            </ul>
          );
        } else {
          elements.push(
            <ol
              key={elemKey++}
              style={{
                paddingLeft: "1.35rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                margin: "0.4rem 0 0.9rem",
                color: "#334155"
              }}
            >
              {[...currentListItems]}
            </ol>
          );
        }
        currentListType = null;
        currentListItems = [];
      };

      for (let l = 0; l < lines.length; l++) {
        const line = lines[l].trim();
        if (!line) continue;

        // 1. Heading H3: ###
        if (line.startsWith("### ")) {
          flushList();
          elements.push(
            <h3
              key={elemKey++}
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1e293b",
                margin: "1.35rem 0 0.4rem",
                lineHeight: 1.35
              }}
            >
              {renderInline(line.replace(/^###\s+/, ""))}
            </h3>
          );
          continue;
        }

        // 2. Heading H2: ##
        if (line.startsWith("## ")) {
          flushList();
          elements.push(
            <h2
              key={elemKey++}
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "1.75rem 0 0.6rem",
                paddingBottom: "0.35rem",
                borderBottom: "1px solid #e2e8f0",
                lineHeight: 1.35
              }}
            >
              {renderInline(line.replace(/^##\s+/, ""))}
            </h2>
          );
          continue;
        }

        // 3. Heading H1: #
        if (line.startsWith("# ")) {
          flushList();
          elements.push(
            <h2
              key={elemKey++}
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "1.85rem 0 0.75rem",
                lineHeight: 1.3
              }}
            >
              {renderInline(line.replace(/^#\s+/, ""))}
            </h2>
          );
          continue;
        }

        // 4. Bullet List item: - or *
        if (line.startsWith("- ") || line.startsWith("* ")) {
          if (currentListType && currentListType !== "ul") flushList();
          currentListType = "ul";
          currentListItems.push(
            <li key={currentListItems.length} style={{ lineHeight: 1.7, fontSize: "0.95rem", fontWeight: 400, color: "#334155" }}>
              {renderInline(line.replace(/^[-*]\s+/, ""))}
            </li>
          );
          continue;
        }

        // 5. Numbered List item: 1. , 2.
        if (/^\d+\.\s/.test(line)) {
          if (currentListType && currentListType !== "ol") flushList();
          currentListType = "ol";
          currentListItems.push(
            <li key={currentListItems.length} style={{ lineHeight: 1.7, fontSize: "0.95rem", fontWeight: 400, color: "#334155" }}>
              {renderInline(line.replace(/^\d+\.\s+/, ""))}
            </li>
          );
          continue;
        }

        // 6. Blockquote: >
        if (line.startsWith("> ")) {
          flushList();
          elements.push(
            <blockquote
              key={elemKey++}
              style={{
                margin: "1rem 0",
                padding: "0.6rem 1rem",
                borderLeft: "3px solid #cbd5e1",
                background: "#f8fafc",
                color: "#475569",
                fontStyle: "italic",
                borderRadius: "0 6px 6px 0",
                lineHeight: 1.65,
                fontSize: "0.95rem",
                fontWeight: 400
              }}
            >
              {renderInline(line.replace(/^>\s*/, ""))}
            </blockquote>
          );
          continue;
        }

        // 7. Regular paragraph line (STRICTLY NORMAL 0.95rem, font-weight 400)
        flushList();
        elements.push(
          <p
            key={elemKey++}
            style={{
              margin: "0 0 0.85rem",
              lineHeight: 1.75,
              color: "#334155",
              fontSize: "0.95rem",
              fontWeight: 400
            }}
          >
            {renderInline(line)}
          </p>
        );
      }

      flushList();
    }

    return elements;
  };

  // Robust container extractor: splits full text by :::(variant) ... ::: blocks
  const parseDocument = (fullText: string) => {
    const containerRegex = /:::(card|callout|penalty|warning|formula)([\s\S]*?):::/g;
    const finalElements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let sectionIdx = 0;

    while ((match = containerRegex.exec(fullText)) !== null) {
      const preText = fullText.substring(lastIndex, match.index);
      if (preText.trim()) {
        finalElements.push(
          <React.Fragment key={`md-${sectionIdx++}`}>
            {renderMarkdownBlocks(preText)}
          </React.Fragment>
        );
      }

      const variant = match[1];
      const innerContent = match[2].trim();

      if (variant === "formula") {
        finalElements.push(
          <div
            key={`box-${sectionIdx++}`}
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "1.1rem 1.4rem",
              margin: "1.25rem 0",
              fontFamily: "monospace"
            }}
          >
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", marginBottom: "0.4rem", fontWeight: 700 }}>
              Calculation Formula
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
              {innerContent}
            </div>
          </div>
        );
      } else if (variant === "penalty") {
        finalElements.push(
          <div
            key={`box-${sectionIdx++}`}
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "1.2rem 1.4rem",
              margin: "1.25rem 0"
            }}
          >
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#b91c1c", marginBottom: "0.5rem", fontWeight: 800 }}>
              Malpractice Sanctions &amp; Disciplinary Protocol
            </div>
            {renderContainerBody(innerContent)}
          </div>
        );
      } else if (variant === "warning") {
        finalElements.push(
          <div
            key={`box-${sectionIdx++}`}
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "1.2rem 1.4rem",
              margin: "1.25rem 0"
            }}
          >
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#b45309", marginBottom: "0.5rem", fontWeight: 800 }}>
              Critical Warning &amp; Red Flags
            </div>
            {renderContainerBody(innerContent)}
          </div>
        );
      } else {
        // "card" or "callout" -> Clean Academic Notice Card
        finalElements.push(
          <div
            key={`box-${sectionIdx++}`}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "1.2rem 1.4rem",
              margin: "1.25rem 0"
            }}
          >
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#475569", marginBottom: "0.45rem", fontWeight: 700 }}>
              Key Reference Protocol
            </div>
            {renderContainerBody(innerContent)}
          </div>
        );
      }

      lastIndex = containerRegex.lastIndex;
    }

    const postText = fullText.substring(lastIndex);
    if (postText.trim()) {
      finalElements.push(
        <React.Fragment key={`md-${sectionIdx++}`}>
          {renderMarkdownBlocks(postText)}
        </React.Fragment>
      );
    }

    return finalElements;
  };

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        color: "#1e293b",
        fontSize: "0.95rem",
        fontWeight: 400
      }}
    >
      {parseDocument(content)}
    </article>
  );
}
