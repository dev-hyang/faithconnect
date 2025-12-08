"use client"

import { useState } from "react"

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const REQUEST_TYPES = [
  { value: "APPLY_NEW", label: "Apply for New Membership", hint: "I am new and want to become a member" },
  { value: "TRANSFER_IN", label: "Transfer-in Membership", hint: "Transfer from another church" },
  { value: "TRANSFER_OUT", label: "Transfer-out Membership", hint: "Transfer to another church" },
]

const REASON_OPTIONS = [
  { value: "baptized", label: "Got baptized" },
  { value: "transfer", label: "Transferred in from other church" },
  { value: "recommitment", label: "Recommitment to faith" },
  { value: "other", label: "Other" },
]

export default function MembershipRequestModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    requestType: "",
    reason: "",
    customReason: "",
    testimony: "",
    previousChurch: "",
    targetChurch: "",
  })

  const handleSubmit = async () => {
    setError("")

    // Validate
    if (!formData.requestType) {
      setError("Please select a request type")
      return
    }
    if (!formData.reason && !formData.customReason) {
      setError("Please provide a reason for your application")
      return
    }
    if (!formData.testimony || formData.testimony.length < 50) {
      setError("Please provide a detailed testimony (at least 50 characters)")
      return
    }
    if (formData.requestType === "TRANSFER_IN" && !formData.previousChurch) {
      setError("Please provide your previous church name")
      return
    }
    if (formData.requestType === "TRANSFER_OUT" && !formData.targetChurch) {
      setError("Please provide the target church name")
      return
    }

    setSubmitting(true)

    try {
      // First create the request
      const createRes = await fetch("/api/user/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "MEMBERSHIP",
          requestType: formData.requestType,
          reason: formData.reason === "other" ? formData.customReason : REASON_OPTIONS.find((o) => o.value === formData.reason)?.label,
          testimony: formData.testimony,
          previousChurch: formData.previousChurch,
          targetChurch: formData.targetChurch,
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        setError(createData.error)
        return
      }

      // Then submit it
      const submitRes = await fetch("/api/user/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createData.request.id,
          status: "SUBMITTED",
          reason: formData.reason === "other" ? formData.customReason : REASON_OPTIONS.find((o) => o.value === formData.reason)?.label,
          testimony: formData.testimony,
        }),
      })

      if (!submitRes.ok) {
        const submitData = await submitRes.json()
        setError(submitData.error)
        return
      }

      onSuccess()
    } catch {
      setError("Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apply for Membership</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded ${step >= s ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Request Type *</label>
                <div className="space-y-3">
                  {REQUEST_TYPES.map((type) => (
                    <label key={type.value} className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${formData.requestType === type.value ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      <input type="radio" name="requestType" value={type.value} checked={formData.requestType === type.value} onChange={(e) => setFormData({ ...formData, requestType: e.target.value })} className="mt-1" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                        <p className="text-sm text-gray-500">{type.hint}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData.requestType === "TRANSFER_IN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Previous Church Name *</label>
                  <input type="text" value={formData.previousChurch} onChange={(e) => setFormData({ ...formData, previousChurch: e.target.value })} className={inputClass} placeholder="Enter your previous church name" />
                </div>
              )}

              {formData.requestType === "TRANSFER_OUT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Church Name *</label>
                  <input type="text" value={formData.targetChurch} onChange={(e) => setFormData({ ...formData, targetChurch: e.target.value })} className={inputClass} placeholder="Enter the church you are transferring to" />
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Why are you applying for membership? *</label>
                <p className="text-sm text-gray-500 mb-3">Select the primary reason for your application</p>
                <div className="space-y-2">
                  {REASON_OPTIONS.map((option) => (
                    <label key={option.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${formData.reason === option.value ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50"}`}>
                      <input type="radio" name="reason" value={option.value} checked={formData.reason === option.value} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
                      <span className="text-gray-900 dark:text-white">{option.label}</span>
                    </label>
                  ))}
                </div>
                {formData.reason === "other" && (
                  <input type="text" value={formData.customReason} onChange={(e) => setFormData({ ...formData, customReason: e.target.value })} className={`${inputClass} mt-3`} placeholder="Please specify your reason" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detailed Testimony *</label>
                <p className="text-sm text-gray-500 mb-3">Please share your faith journey. This helps us understand your spiritual background. (minimum 50 characters)</p>
                <textarea value={formData.testimony} onChange={(e) => setFormData({ ...formData, testimony: e.target.value })} className={inputClass} rows={6} placeholder="Share your faith journey, how you came to know Christ, and why you want to join our church family..." />
                <p className="text-xs text-gray-400 mt-1">{formData.testimony.length} / 50 characters minimum</p>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {step > 1 ? <button onClick={() => setStep(step - 1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button> : <div />}
          {step < 2 ? (
            <button onClick={() => formData.requestType && setStep(2)} disabled={!formData.requestType} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">Next</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{submitting ? "Submitting..." : "Submit Request"}</button>
          )}
        </div>
      </div>
    </div>
  )
}

