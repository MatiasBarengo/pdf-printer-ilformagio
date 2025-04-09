"use client"

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

interface CustomListProduct {
  customPrice: number;
  originalPrice: number;
}

interface CustomList {
  id: string;
  name: string;
  products: {
    [productId: string]: CustomListProduct;
  };
  userId: string;
  createdAt: Timestamp;
}

export default function CustomLists({ onSelectList }: { onSelectList: (listId: string | null) => void }) {
  const [lists, setLists] = useState<CustomList[]>([])
  const [newListName, setNewListName] = useState('')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const isAuthenticated = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    const q = query(
      collection(db, 'customLists'),
      where('userId', '==', isAuthenticated.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomList[]
      setLists(listsData)
    })

    return () => unsubscribe()
  }, [isAuthenticated])

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim() || !isAuthenticated) return

    try {
      await addDoc(collection(db, 'customLists'), {
        name: newListName.trim(),
        products: {},
        userId: isAuthenticated.uid,
        createdAt: serverTimestamp()
      })
      setNewListName('')
    } catch (error) {
      console.error('Error al crear la lista:', error)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta lista?')) return

    try {
      await deleteDoc(doc(db, 'customLists', listId))
      if (selectedListId === listId) {
        setSelectedListId(null)
        onSelectList(null)
      }
    } catch (error) {
      console.error('Error al eliminar la lista:', error)
    }
  }

  const handleListSelect = (listId: string | null) => {
    setSelectedListId(listId)
    onSelectList(listId)
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleCreateList} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="Nombre de la nueva lista"
          className="flex-1 p-2 border rounded"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Crear Lista
        </button>
      </form>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleListSelect(null)}
          className={`px-4 py-2 rounded ${
            selectedListId === null 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200'
          }`}
        >
          Lista Principal
        </button>
        {lists.map(list => (
          <div key={list.id} className="flex items-center gap-2">
            <button
              onClick={() => handleListSelect(list.id)}
              className={`px-4 py-2 rounded ${
                selectedListId === list.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200'
              }`}
            >
              {list.name}
            </button>
            <button
              onClick={() => handleDeleteList(list.id)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}