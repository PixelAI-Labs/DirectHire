import { useState, useCallback } from 'react'

type FormValues = Record<string, string | number | boolean | FileList | undefined>

interface UseFormProps<T extends FormValues> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit: (values: T) => void | Promise<void>
}

export function useForm<T extends FormValues>({ initialValues, validate, onSubmit }: UseFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((name: keyof T, value: string | number | boolean | FileList) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear error when field is modified
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (validate) {
      const validationErrors = validate(values)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  return { values, errors, isSubmitting, handleChange, handleSubmit, reset, setValues, setErrors }
}
