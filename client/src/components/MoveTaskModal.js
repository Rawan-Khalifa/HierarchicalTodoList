"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, AlertCircle, ArrowRight, MoveVertical, ListTree } from "lucide-react"
import api from "../services/api"
import { toast } from "react-toastify"
import "./Modal.css"

const MoveTaskModal = ({ isOpen, onClose, lists, currentListId, taskTitle, task, fetchTasks }) => {
  const [selectedListId, setSelectedListId] = useState("")
  const [selectedParentId, setSelectedParentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [moveType, setMoveType] = useState("list") // "list" or "parent"
  const [filteredLists, setFilteredLists] = useState([])
  const [potentialParents, setPotentialParents] = useState([])
  const [taskDepth, setTaskDepth] = useState(0)
  const modalContentRef = useRef(null)
  const requestInProgress = useRef(false)

  // Calculate the depth of the current task
  const calculateTaskDepth = useCallback(async () => {
    if (!task || !task.id) return

    try {
      // Get all tasks for the current list
      const response = await api.get(`/api/todos/tasks/${currentListId}`)
      const allTasks = response.data

      // Helper function to find a task's depth
      const findTaskDepth = (tasks, taskId, currentDepth = 0) => {
        for (const t of tasks) {
          if (t.id === taskId) {
            return currentDepth
          }

          if (t.subtasks && t.subtasks.length > 0) {
            const foundDepth = findTaskDepth(t.subtasks, taskId, currentDepth + 1)
            if (foundDepth !== -1) {
              return foundDepth
            }
          }
        }

        return -1
      }

      const depth = findTaskDepth(allTasks, task.id)
      setTaskDepth(depth !== -1 ? depth : 0)
    } catch (error) {
      console.error("Failed to calculate task depth:", error)
      setTaskDepth(0)
    }
  }, [currentListId, task])

  useEffect(() => {
    if (isOpen && lists) {
      // Filter out the current list for list movement
      const filtered = lists.filter((list) => list.id !== currentListId)
      setFilteredLists(filtered)

      // Reset selected values when modal opens
      setSelectedListId("")
      setSelectedParentId("")
      setMoveType("list")
      setPotentialParents([])
      setIsLoading(false)
      setIsSubmitting(false)
      requestInProgress.current = false

      // Calculate the current task's depth
      calculateTaskDepth()
    }
  }, [isOpen, lists, currentListId, task, calculateTaskDepth]) // Added calculateTaskDepth to dependency array

  // Fetch potential parent tasks when moveType changes to "parent"
  const fetchPotentialParents = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) return

    requestInProgress.current = true
    setIsLoading(true)

    try {
      // Fetch tasks from the selected list or current list if none selected
      const listId = selectedListId || currentListId
      const response = await api.get(`/api/todos/tasks/${listId}`)

      // Helper function to get the depth of a task in the hierarchy
      const getTaskDepth = (taskObj, allTasks, currentDepth = 0) => {
        // Base case: if we're at the top level, return current depth
        if (!taskObj.parent_id) return currentDepth

        // Find the parent task
        const findParent = (tasks, parentId) => {
          for (const t of tasks) {
            if (t.id === parentId) return t
            if (t.subtasks && t.subtasks.length > 0) {
              const found = findParent(t.subtasks, parentId)
              if (found) return found
            }
          }
          return null
        }

        const parent = findParent(allTasks, taskObj.parent_id)
        if (!parent) return currentDepth // Parent not found

        // Recursively get depth of parent
        return getTaskDepth(parent, allTasks, currentDepth + 1)
      }

      // Filter out the current task and its subtasks (can't move a task to be its own child)
      const filterTaskAndDescendants = (tasks, taskId) => {
        return tasks.filter((t) => {
          if (t.id === taskId) return false

          // Also filter out any descendants
          if (t.subtasks && t.subtasks.length > 0) {
            t.subtasks = filterTaskAndDescendants(t.subtasks, taskId)
          }

          return true
        })
      }

      const filteredTasks = filterTaskAndDescendants(response.data, task.id)

      // Flatten the task hierarchy for the dropdown
      const flattenTasks = (tasks, depth = 0, result = []) => {
        tasks.forEach((t) => {
          // Check if adding this task as a parent would exceed max depth
          const maxDepth = 2 // 0-based, so this is 3 levels
          const currentTaskDepth = getTaskDepth(task, response.data)

          // Only add as potential parent if it wouldn't exceed max depth
          if (depth + currentTaskDepth <= maxDepth) {
            result.push({
              id: t.id,
              title: t.title,
              depth,
            })
          }

          if (t.subtasks && t.subtasks.length > 0) {
            flattenTasks(t.subtasks, depth + 1, result)
          }
        })
        return result
      }

      const flatTasks = flattenTasks(filteredTasks)
      setPotentialParents(flatTasks)
    } catch (error) {
      console.error("Failed to fetch potential parent tasks:", error)
      toast.error("Failed to load tasks. Please try again.")
    } finally {
      setIsLoading(false)
      requestInProgress.current = false
    }
  }, [selectedListId, currentListId, task])

  // Update the useEffect to include fetchPotentialParents in the dependency array
  useEffect(() => {
    if (moveType === "parent" && isOpen && !isSubmitting) {
      fetchPotentialParents()
    }
  }, [moveType, isOpen, selectedListId, fetchPotentialParents, isSubmitting])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (moveType === "list" && !selectedListId) return
    if (moveType === "parent" && !selectedParentId && selectedParentId !== "root") return
    if (isSubmitting || isLoading) return

    setIsSubmitting(true)
    try {
      if (moveType === "list") {
        // Move to another list
        await api.patch(`/api/todos/task/${task.id}/move`, {
          list_id: selectedListId,
          parent_id: null, // Make it a top-level task
        })

        const targetList = filteredLists.find((l) => l.id === selectedListId)
        toast.success(`Task moved to "${targetList?.title || "another list"}"`)
      } else {
        // Move to be a child of another task or to be a top-level task
        const targetListId = selectedListId || currentListId

        // If "root" is selected, send null as parent_id to make it a top-level task
        // Otherwise, send the selected parent ID
        const parentId = selectedParentId === "root" ? null : selectedParentId

        const targetListName = selectedListId
          ? filteredLists.find((l) => l.id === selectedListId)?.title
          : lists.find((l) => l.id === currentListId)?.title

        const parentName =
          selectedParentId === "root" ? "top level" : potentialParents.find((p) => p.id === selectedParentId)?.title

        await api.patch(`/api/todos/task/${task.id}/move`, {
          list_id: targetListId,
          parent_id: parentId,
        })

        toast.success(`Task moved to ${parentName ? `"${parentName}"` : "top level"} in ${targetListName}`)
      }

      // Wait a moment before fetching to ensure the server has processed the change
      setTimeout(() => {
        fetchTasks()
        onClose()
      }, 300)
    } catch (error) {
      console.error("Failed to move task:", error)
      toast.error(error.response?.data?.error || "Failed to move task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal move-task-modal">
        <div className="modal-header">
          <h2>Move Task</h2>
          <button onClick={onClose} className="close-button" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" ref={modalContentRef}>
            <div className="task-info">
              <p>
                Moving task: <strong>{taskTitle}</strong>
              </p>
              <p className="task-depth-info">
                Current level: <strong>{taskDepth + 1}</strong> (of 3 maximum levels)
              </p>
            </div>

            <div className="form-group">
              <label>Move Type</label>
              <div className="radio-group move-type-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="moveType"
                    value="list"
                    checked={moveType === "list"}
                    onChange={() => setMoveType("list")}
                  />
                  <ListTree size={16} />
                  <span>Move to another list</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="moveType"
                    value="parent"
                    checked={moveType === "parent"}
                    onChange={() => setMoveType("parent")}
                  />
                  <MoveVertical size={16} />
                  <span>Change hierarchy level</span>
                </label>
              </div>
            </div>

            {moveType === "list" && (
              <div className="form-group">
                <label htmlFor="listSelect">
                  Select List <span className="required">*</span>
                </label>
                {filteredLists.length === 0 ? (
                  <div className="modal-error">
                    <AlertCircle size={16} />
                    <span>No other lists available. Create a new list first.</span>
                  </div>
                ) : (
                  <select
                    id="listSelect"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="select-input"
                  >
                    <option value="">Select a list</option>
                    {filteredLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {moveType === "parent" && (
              <>
                <div className="form-group">
                  <label htmlFor="listSelectForParent">Select List (Optional)</label>
                  <select
                    id="listSelectForParent"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="select-input"
                  >
                    <option value="">Current List</option>
                    {filteredLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="parentSelect">
                    Select Parent Task <span className="required">*</span>
                  </label>
                  {isLoading ? (
                    <div className="loading-spinner-container">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : potentialParents.length === 0 ? (
                    <div className="form-group">
                      <div className="no-options-message">No available parent tasks. Moving to top level.</div>
                      <select
                        id="parentSelect"
                        value="root"
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="select-input"
                      >
                        <option value="root">Move to top level</option>
                      </select>
                    </div>
                  ) : (
                    <select
                      id="parentSelect"
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="select-input"
                    >
                      <option value="">Select a parent task</option>
                      <option value="root">Move to top level</option>
                      {potentialParents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {Array(parent.depth + 1).join("— ")} {parent.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={
                isSubmitting ||
                isLoading ||
                (moveType === "list" && !selectedListId) ||
                (moveType === "parent" && !selectedParentId && selectedParentId !== "root")
              }
            >
              {isSubmitting ? (
                <>
                  <div className="button-spinner"></div>
                  Moving...
                </>
              ) : (
                <>
                  <span>Move Task</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MoveTaskModal;

