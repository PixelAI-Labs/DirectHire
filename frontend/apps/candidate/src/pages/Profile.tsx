import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Skeleton } from '@directhire/shared'
import { candidateService } from '@directhire/shared'

interface CandidateProfile {
  id: string
  user_id: string
  resume_url?: string
  skills: string[]
  experience: Record<string, unknown>[]
  education: Record<string, unknown>[]
  preferences: Record<string, unknown>
  created_at: string
}

interface ResumeData {
  id: string
  parsed_text?: string
  file_path: string
}

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSkills, setEditingSkills] = useState(false)
  const [skillsInput, setSkillsInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeText, setResumeText] = useState<string | null>(null)
  const [savingSkills, setSavingSkills] = useState(false)

  const loadProfile = () => {
    setLoading(true)
    candidateService
      .getProfile()
      .then((res) => {
        const data: CandidateProfile = res.data
        setProfile(data)
        setSkills(data.skills ?? [])
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingResume(true)
    try {
      const res = await candidateService.uploadResume(file)
      const resumeData: ResumeData = res.data
      setResumeText(resumeData.parsed_text ?? null)
      loadProfile()
    } catch {
      window.alert('Failed to upload resume.')
    } finally {
      setUploadingResume(false)
    }
  }

  const handleUpdateSkills = async () => {
    if (!editingSkills) {
      setEditingSkills(true)
      setSkillsInput(skills.join(', '))
      return
    }
    const parsed = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setSavingSkills(true)
    try {
      await candidateService.updateProfile({ skills: parsed })
      setSkills(parsed)
      setEditingSkills(false)
    } catch {
      window.alert('Failed to update skills.')
    } finally {
      setSavingSkills(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
          Your Profile
        </h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card><Skeleton className="h-32 w-full" /></Card>
          <Card><Skeleton className="h-32 w-full" /></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#adc6ff]" style={{ fontFamily: "'Sora', sans-serif" }}>
        Your Profile
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Resume Card */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[#dce1fb]">Resume</h2>
          {profile?.resume_url && (
            <p className="mb-3 text-xs text-[#8b92b4]">Current: {profile.resume_url}</p>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleUploadResume}
            />
            <Button variant="outline" className="pointer-events-none">
              {uploadingResume ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </label>
          {resumeText && (
            <div className="mt-4 rounded-lg bg-[#131a2a] p-3">
              <p className="text-xs text-[#8b92b4]">Parsed text preview:</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-[#dce1fb]/70">
                {resumeText.slice(0, 500)}
                {resumeText.length > 500 && '...'}
              </p>
            </div>
          )}
        </Card>

        {/* Skills Card */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[#dce1fb]">Skills</h2>
          {!editingSkills ? (
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 && (
                <p className="text-sm text-[#8b92b4]">No skills added yet.</p>
              )}
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <textarea
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Enter skills separated by commas"
              className="w-full rounded-lg border border-[#2a3150] bg-[#131a2a] px-3 py-2 text-sm text-[#dce1fb] placeholder-[#8b92b4] focus:border-[#4f6df5] focus:outline-none"
              rows={3}
            />
          )}
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleUpdateSkills}
            disabled={savingSkills}
          >
            {savingSkills
              ? 'Saving...'
              : editingSkills
              ? 'Save Skills'
              : 'Update Skills'}
          </Button>
          {editingSkills && (
            <Button
              variant="ghost"
              className="mt-2 ml-2"
              onClick={() => setEditingSkills(false)}
            >
              Cancel
            </Button>
          )}
        </Card>
      </div>

      {/* Experience Card */}
      {profile?.experience && profile.experience.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[#dce1fb]">Experience</h2>
          <div className="space-y-3">
            {profile.experience.map((exp: Record<string, unknown>, i: number) => (
              <div key={i} className="rounded-lg bg-[#131a2a] p-3">
                <p className="font-medium text-[#dce1fb]">{String(exp.title ?? '')}</p>
                <p className="text-sm text-[#8b92b4]">{String(exp.company ?? '')}</p>
                <p className="text-xs text-[#8b92b4]">
                  {String(exp.start_date ?? '')} – {String(exp.end_date ?? 'Present')}
                </p>
                {!!exp.description && (
                  <p className="mt-1 text-xs text-[#dce1fb]/70">{String(exp.description ?? '')}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Education Card */}
      {profile?.education && profile.education.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[#dce1fb]">Education</h2>
          <div className="space-y-3">
            {profile.education.map((edu: Record<string, unknown>, i: number) => (
              <div key={i} className="rounded-lg bg-[#131a2a] p-3">
                <p className="font-medium text-[#dce1fb]">{String(edu.degree ?? '')}</p>
                <p className="text-sm text-[#8b92b4]">{String(edu.institution ?? '')}</p>
                {!!edu.field && (
                  <p className="text-xs text-[#8b92b4]">{String(edu.field)}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}