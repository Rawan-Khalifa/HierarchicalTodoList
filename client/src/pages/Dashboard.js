"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { toast } from "react-toastify"
import TodoList from "../components/TodoList"
import CreateListModal from "../components/CreateListModal"
import { Plus, LogOut } from "lucide-react"
import "./Dashboard.css"

const Dashboard = () => {
  const { currentUser, logout } = useAuth()
  const [lists, setLists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeListId, setActiveListId] = useState(null)
  const navigate = useNavigate()

  // Memoize the fetchLists function with useCallback to prevent infinite loops
  const fetchLists = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/api/todos/lists")
      setLists(response.data)

      // Set the first list as active if there are lists and no active list
      if (response.data.length > 0 && !activeListId) {
        setActiveListId(response.data[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch lists:", error)
      toast.error("Failed to fetch todo lists", { autoClose: 5000 })
    } finally {
      setIsLoading(false)
    }
  }, [activeListId])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    fetchLists()
  }, [currentUser, navigate, fetchLists])

  const handleCreateList = async (title) => {
    try {
      const response = await api.post("/api/todos/list", { title })
      toast.success("List created successfully")
      await fetchLists()

      // Set the newly created list as active
      if (response.data && response.data.list_id) {
        setActiveListId(response.data.list_id)
      }

      setIsCreateModalOpen(false)
    } catch (error) {
      toast.error("Failed to create list", { autoClose: 5000 })
      throw error
    }
  }

  const handleDeleteList = async (listId) => {
    try {
      await api.delete(`/api/todos/list/${listId}`)
      toast.success("List deleted successfully")

      // If the deleted list was active, set another list as active
      if (listId === activeListId) {
        const remainingLists = lists.filter((list) => list.id !== listId)
        if (remainingLists.length > 0) {
          setActiveListId(remainingLists[0].id)
        } else {
          setActiveListId(null)
        }
      }

      await fetchLists()
    } catch (error) {
      toast.error("Failed to delete list", { autoClose: 5000 })
    }
  }

  const activeList = lists.find((list) => list.id === activeListId)

  // For debugging
  console.log("Active list:", activeList)
  console.log("All lists:", lists)

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">Todo Lists</h1>
          <button className="create-list-button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} />
          </button>
        </div>

        <div className="lists-container">
          {isLoading ? (
            <div className="loading-message">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="empty-lists">
              <p>No lists yet. Create your first list to get started!</p>
              <button className="button primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} />
                <span>Create List</span>
              </button>
            </div>
          ) : (
            <ul className="lists">
              {lists.map((list) => (
                <li
                  key={list.id}
                  className={`list-item ${list.id === activeListId ? "active" : ""}`}
                  onClick={() => setActiveListId(list.id)}
                >
                  <span className="list-title">{list.title}</span>
                  <button
                    className="delete-list-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteList(list.id)
                    }}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="username">{currentUser?.username || "User"}</span>
          </div>
          <button className="logout-button" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {activeList ? (
          <TodoList list={activeList} lists={lists} />
        ) : (
          <div className="no-list-selected">
            <p>Select a list or create a new one to get started.</p>
            <button className="button primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              <span>Create List</span>
            </button>
          </div>
        )}
      </main>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateList}
        lists={lists}
      />
    </div>
  )
}

export default Dashboard;

