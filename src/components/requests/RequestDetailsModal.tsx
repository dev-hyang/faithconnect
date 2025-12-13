"use client"

import { useState } from "react"

interface UserRequest {
  id: string
  category: string
  requestType: string
  title: string
  status: string
  reason: string | null
  testimony: string | null
  previousChurch: string | null
  targetChurch: string | null
  groupName: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  request: UserRequest
  onClose: () => void
  onUpdate: () => void
}

export default function RequestDetailsModal({ request, onClose, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    reason: request.reason || "",
    testimony: request.testimony || "",
    previousChurch: request.previousChurch || "",
    targetChurch: request.targetChurch || "",
  })

  const canEdit = request.status === "INITIAL"
  const canSubmit = request.status === "INITIAL"

  const handleSave = async () => {
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/user/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, ...formData }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error)
        return
      }

      setEditing(false)
      onUpdate()
    } catch {
      setError("Failed to update request")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!formData.reason || !formData.testimony) {
      setError("Reason and testimony are required to submit")
      return
    }
    if (formData.testimony.length < 50) {
      setError("Testimony must be at least 50 characters")
      return
    }

    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/user/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, ...formData, status: "SUBMITTED" }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error)
        return
      }

      onUpdate()
    } catch {
      setError("Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      INITIAL: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      DECLINED: "bg-red-100 text-red-700",
    }
    return styles[status] || "bg-gray-100 text-gray-700"
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h2>
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${getStatusBadge(request.status)}`}>{request.status}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Category:</span> <span className="font-medium">{request.category}</span></div>
            <div><span className="text-gray-500">Type:</span> <span className="font-medium">{request.requestType}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="font-medium">{new Date(request.createdAt).toLocaleString()}</span></div>
            <div><span className="text-gray-500">Updated:</span> <span className="font-medium">{new Date(request.updatedAt).toLocaleString()}</span></div>
          </div>

          {(request.previousChurch || editing) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Previous Church</label>
              {editing ? <input type="text" value={formData.previousChurch} onChange={(e) => setFormData({ ...formData, previousChurch: e.target.value })} className={inputClass} /> : <p className="text-gray-900 dark:text-white">{request.previousChurch || "-"}</p>}
            </div>
          )}

          {(request.targetChurch || editing) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Church</label>
              {editing ? <input type="text" value={formData.targetChurch} onChange={(e) => setFormData({ ...formData, targetChurch: e.target.value })} className={inputClass} /> : <p className="text-gray-900 dark:text-white">{request.targetChurch || "-"}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
            {editing ? <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className={inputClass} placeholder="Why are you applying?" /> : <p className="text-gray-900 dark:text-white">{request.reason || "-"}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Testimony</label>
            {editing ? <textarea value={formData.testimony} onChange={(e) => setFormData({ ...formData, testimony: e.target.value })} className={inputClass} rows={5} placeholder="Your faith journey..." /> : <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{request.testimony || "-"}</p>}
          </div>

          {request.reviewNote && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Review Note</label>
              <p className="text-gray-900 dark:text-white">{request.reviewNote}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {canEdit && !editing && <button onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>}
          {editing && <button onClick={handleSave} disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{submitting ? "Saving..." : "Save"}</button>}
          {canSubmit && !editing && <button onClick={handleSubmitRequest} disabled={submitting} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">{submitting ? "Submitting..." : "Submit Request"}</button>}
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Close</button>
        </div>
      </div>
    </div>
  )
}

