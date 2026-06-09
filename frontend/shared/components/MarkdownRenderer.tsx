import React, { useMemo } from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Safe markdown rendering using DOM API instead of dangerouslySetInnerHTML
  const renderedContent = useMemo(() => {
    const lines = content.split('\n')

    return lines.map((line, index) => {
      // Heading 1
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-[#adc6ff] mt-8 mb-4">{line.slice(2)}</h1>
      }
      // Heading 2
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold text-[#adc6ff] mt-6 mb-3">{line.slice(3)}</h2>
      }
      // Heading 3
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold text-[#adc6ff] mt-4 mb-2">{line.slice(4)}</h3>
      }
      // Empty line
      if (line.trim() === '') {
        return <br key={index} />
      }
      // Bold text
      const parts = line.split(/(\*\*.*?\*\*)/g)
      return (
        <p key={index} className="text-[#dce1fb] leading-relaxed mb-2">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="text-[#dce1fb]">{part.slice(2, -2)}</strong>
            }
            return <span key={i}>{part}</span>
          })}
        </p>
      )
    })
  }, [content])

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      {renderedContent}
    </div>
  )
}
