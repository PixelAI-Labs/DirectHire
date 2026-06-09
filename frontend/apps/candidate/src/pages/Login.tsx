import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Input, useToast } from '@directhire/shared'
import { authService, setAuthToken } from '@directhire/shared/services'
import { slideInRight } from '@directhire/shared/motion'

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShake(false)

    const newErrors: Record<string, string> = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const res = await authService.login({ email: formData.email, password: formData.password })
      setAuthToken(res.access_token)
      toast.addToast('Welcome back!', 'success')
      navigate('/')
    } catch (error: any) {
      setShake(true)
      const msg = error.response?.data?.detail || 'Login failed. Please try again.'
      toast.addToast(msg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-[#151b2d]/50 backdrop-blur-xl border border-white/5 shadow-2xl">
        {/* Left Panel - Animated Orbs */}
        <div className="hidden md:flex md:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-[#0c1324]">
            {/* Animated Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
            
            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center">
              <h1 
                className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#adc6ff] via-[#d0bcff] to-[#adc6ff]"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                DirectHire
              </h1>
              <p className="mt-4 text-lg text-[#8b92b4]">
                The autonomous hiring platform
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Card */}
        <motion.div
          className="w-full md:w-[45%] p-8 md:p-12"
          initial="hidden"
          animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : 'visible'}
          variants={slideInRight}
        >
          <div className="mx-auto max-w-md">
            <h2 
              className="text-2xl font-bold text-[#dce1fb]"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-[#8b92b4]">
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
              />
              
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                showPasswordToggle
                autoComplete="current-password"
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#8b92b4]">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-[#adc6ff] hover:text-[#d0bcff] underline-offset-2 hover:underline transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* CSS for animated orbs */}
      <style>{`
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: drift 20s ease-in-out infinite;
        }
        .orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #adc6ff 0%, transparent 70%);
          top: -100px;
          left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, #d0bcff 0%, transparent 70%);
          bottom: -80px;
          right: -80px;
          animation-delay: -7s;
        }
        .orb-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, #ffb95f 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -14s;
          opacity: 0.3;
        }
        @keyframes drift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(30px, -30px) scale(1.05);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.95);
          }
          75% {
            transform: translate(20px, 30px) scale(1.02);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .orb {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}