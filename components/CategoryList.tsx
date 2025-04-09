"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"


interface Category {
  id: string
  name: string
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categorias"), (snapshot) => {
      const categoryList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]
      setCategories(categoryList)
    })

    return () => unsubscribe()
  }, [])

  const handleDelete = async (category: Category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCategory) return

    try {
      await deleteDoc(doc(db, "categorias", selectedCategory.id))
      setIsModalOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error("Error al eliminar la categoría:", error)
      // Aquí podrías agregar un manejo de errores más elaborado
    }
  }

  return (
    <>
      <div className="grid gap-3">
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <span className="font-medium text-gray-700">{category.name}</span>
            <button
              onClick={() => handleDelete(category)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirmar eliminación</h2>
            <p className="mb-6 text-gray-600">
              ¿Estás seguro que deseas eliminar la categoría <span className="font-medium text-gray-800">&quot;{selectedCategory?.name}&quot;</span>?
              Esta acción es irreversible y se perderán todos los productos asociados
              a esta categoría.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

