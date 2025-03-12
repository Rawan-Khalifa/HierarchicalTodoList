"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import "./Modal.css"

const CreateListModal = ({ isOpen, onClose, onCreate, lists }) => {
  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [existingListNames, setExistingListNames] = useState([])

  useEffect(() => {
    // Reset form when modal opens and prepare list of existing list names
    if (isOpen) {
      setTitle("")
      setError("")

      if (lists && lists.length > 0) {
        setExistingListNames(lists.map((list) => list.title.toLowerCase()))
      } else {
        setExistingListNames([])
      }
    }
  }, [isOpen, lists])

  if (!isOpen) return null

  const validateTitle = (title) => {
    if (!title.trim()) {
      setError("List title cannot be empty")
      return false
    }

    if (existingListNames.includes(title.trim().toLowerCase())) {
      setError("A list with this name already exists")
      return false
    }

    setError("")
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateTitle(title)) {
      return
    }

    setIsSubmitting(true)

    try {
      await onCreate(title)
      setTitle("")
    } catch (error) {
      setError("Failed to create list. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Create New List</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="title">List Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  // Clear error when user types
                  if (error) validateTitle(e.target.value)
                }}
                placeholder="Enter list title"
                autoFocus
                className={error ? "input-error" : ""}
              />
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Creating..." : "Create List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateListModal;

