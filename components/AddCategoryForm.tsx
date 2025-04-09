"use client"

import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'

export default function AddCategoryForm() {
  const [name, setName] = useState("")
  const isAuthenticated = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !name) return

    try {
      await addDoc(collection(db, "categorias"), { name })
      setName("")
      alert("Categoría agregada exitosamente")
    } catch (error) {
      console.error("Error adding category:", error)
      alert("Error al agregar la categoría")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la categoría"
        className="w-full p-2 border border-neutral-200 rounded dark:border-neutral-800"
        required
      />
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
        Agregar Categoría
      </button>
    </form>
  )
}

