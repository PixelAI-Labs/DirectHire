import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Skeleton } from '@directhire/shared'
import { agentService } from '@directhire/shared'

interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  { label: 'Optimize Resume', action: 'analyze' },
  { label: 'Job Matching', action: 'match' },
  { label: 'Interview Prep', action: 'interview' },
]

export const Agent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'agent',
      text: "Hello! I'm your Career Agent. I can help you optimize your resume, find matching jobs, and prepare for interviews. What would you like to do?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setActiveAction] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string, action?: string) => {
    if (!text.trim() && !action) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || `Run ${action}`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setActiveAction(action ?? null)

    try {
      if (action === 'analyze') {
        const res = await agentService.analyze('self')
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          text: typeof res.data === 'string'
            ? res.data
            : JSON.stringify(res.data, null, 2),
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, agentMsg])
      } else if (action === 'match') {
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          text: "I've analyzed your profile and found several jobs that match your skills. Visit the Jobs page to see your personalized recommendations.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, agentMsg])
      } else if (action === 'interview') {
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          text: "I can help you prepare for interviews. Tell me which job or company you're preparing for, and I'll give you tailored interview questions and tips.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, agentMsg])
      } else {
        // Generic agent message — echo back as coming soon
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          text: "Thanks for your message! I'm still learning how to handle complex conversations. For now, try using the Quick Actions on the right.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, agentMsg])
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setActiveAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        Career Agent
      </h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="flex h-[60vh] flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#4f6df5] text-white'
                        : 'bg-[#1e2640] text-[#dce1fb]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-[#1e2640] px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 border-t border-[#2a3150] p-4">
              <input
                type="text"
                placeholder="Ask your Career Agent..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
                className="flex-1 rounded-lg border border-[#2a3150] bg-[#131a2a] px-4 py-2 text-sm text-[#dce1fb] placeholder-[#8b92b4] focus:border-[#4f6df5] focus:outline-none"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={loading}
              >
                Send
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 font-semibold text-[#adc6ff]">Quick Actions</h3>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.action}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => sendMessage('', action.action)}
                  disabled={loading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 font-semibold text-[#adc6ff]">Agent Capabilities</h3>
            <ul className="space-y-1 text-xs text-[#8b92b4]">
              <li>• Resume analysis & optimization</li>
              <li>• Personalized job matching</li>
              <li>• Interview preparation</li>
              <li>• Offer negotiation coaching</li>
              <li>• Salary insights & benchmarking</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}