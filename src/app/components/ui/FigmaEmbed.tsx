export function FigmaEmbed({ content }: { content: string }) {
  // Extract figma url
  // Match https://www.figma.com/file/... or https://www.figma.com/design/...
  const figmaRegex = /https:\/\/([\w\.-]+\.)?figma\.com\/(file|design)\/[^\s]+/i;
  const match = content.match(figmaRegex);
  
  if (!match) return null;
  const url = match[0];

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/[0.08] shadow-lg bg-[#0A0910]">
      <iframe
        style={{ border: "1px solid rgba(0, 0, 0, 0.1)" }}
        width="100%"
        height="450"
        src={`https://www.figma.com/embed?embed_host=patchwork&url=${encodeURIComponent(url)}`}
        allowFullScreen
        title="Figma Embed"
      />
    </div>
  );
}
