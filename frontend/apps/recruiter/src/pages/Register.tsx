import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Input, useToast } from '@directhire/shared'
import { authService, setAuthToken } from '@directhire/shared/services'
import { slideInRight } from '@directhire/shared/motion'
import { User, Building2 } from 'lucide-react'

const PASSWORD_CRITERIA = {
  length: (p: string) => p.length >= 8,
  uppercase: (p: string) => /[A-Z]/.test(p),
  number: (p: string) => /[0-9]/.test(p),
  special: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#ff6b6b', '#ffb95f', '#adc6ff', '#6bffa6']

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'CANDIDATE' | 'RECRUITER' | '',
  })
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

  const handleRoleSelect = (role: 'CANDIDATE' | 'RECRUITER') => {
    setFormData((prev) => ({ ...prev, role }))
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: '' }))
    }
  }

  const passwordStrength = () => {
    const p = formData.password
    if (!p) return 0
    return [
      PASSWORD_CRITERIA.length(p),
      PASSWORD_CRITERIA.uppercase(p),
      PASSWORD_CRITERIA.number(p),
      PASSWORD_CRITERIA.special(p),
    ].filter(Boolean).length
  }

  const strength = passwordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShake(false)

    const newErrors: Record<string, string> = {}
    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required'
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters'
    }
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
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.role) {
      newErrors.role = 'Please select a role'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const res = await authService.register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'CANDIDATE' | 'RECRUITER',
      })
      setAuthToken(res.access_token)
      toast.addToast('Account created successfully!', 'success')
      navigate('/')
    } catch (error: any) {
      setShake(true)
      const msg = error.response?.data?.detail || 'Registration failed. Please try again.'
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
              Create Account
            </h2>
            <p className="mt-2 text-sm text-[#8b92b4]">
              Join DirectHire and start your journey
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label="Full Name"
                type="text"
                name="full_name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleChange}
                error={errors.full_name}
                autoComplete="name"
              />

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

              <div>
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  showPasswordToggle
                  autoComplete="new-password"
                />
                {/* Password Strength Bar */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor: level <= strength
                              ? STRENGTH_COLORS[strength]
                              : '#2a3150',
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: strength > 0 ? STRENGTH_COLORS[strength] : '#8b92b4' }}
                    >
                      Password strength: {STRENGTH_LABELS[strength]}
                    </p>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                showPasswordToggle
                autoComplete="new-password"
              />

              {/* Role Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#dce1fb]">
                  I am a...
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('CANDIDATE')}
                    className={`flex flex-1 items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                      formData.role === 'CANDIDATE'
                        ? 'border-[#adc6ff]/50 bg-[#adc6ff]/10'
                        : 'border-[#2a3150] bg-transparent hover:border-[#2a3150]/80'
                    }`}
                  >
                    <User
                      size={20}
                      className={formData.role === 'CANDIDATE' ? 'text-[#adc6ff]' : 'text-[#8b92b4]'}
                    />
                    <span
                      className={`text-sm font-medium ${
                        formData.role === 'CANDIDATE' ? 'text-[#adc6ff]' : 'text-[#8b92b4]'
                      }`}
                    >
                      Candidate
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('RECRUITER')}
                    className={`flex flex-1 items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                      formData.role === 'RECRUITER'
                        ? 'border-[#adc6ff]/50 bg-[#adc6ff]/10'
                        : 'border-[#2a3150] bg-transparent hover:border-[#2a3150]/80'
                    }`}
                  >
                    <Building2
                      size={20}
                      className={formData.role === 'RECRUITER' ? 'text-[#adc6ff]' : 'text-[#8b92b4]'}
                    />
                    <span
                      className={`text-sm font-medium ${
                        formData.role === 'RECRUITER' ? 'text-[#adc6ff]' : 'text-[#8b92b4]'
                      }`}
                    >
                      Recruiter
                    </span>
                  </button>
                </div>
                {errors.role && (
                  <p className="mt-2 text-xs text-[#ff6b6b]">{errors.role}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#8b92b4]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#adc6ff] hover:text-[#d0bcff] underline-offset-2 hover:underline transition-colors"
              >
                Sign in
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