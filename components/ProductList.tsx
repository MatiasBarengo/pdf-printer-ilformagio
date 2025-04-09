"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, getDocs, deleteDoc, doc, updateDoc, query, where, arrayUnion, arrayRemove, Timestamp, deleteField } from "firebase/firestore"
import { useAuth } from '@/hooks/useAuth'
import { db } from "@/lib/firebase"
import Image from "next/image"


interface Product {
  id: string
  name: string
  price: number
  category: string
  imageUrl: string
}

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

interface ProductListProps {
  searchTerm: string;
  listId: string | null;
}

export default function ProductList({ searchTerm, listId }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [currentList, setCurrentList] = useState<CustomList | null>(null)
  const [userLists, setUserLists] = useState<CustomList[]>([])
  const user = useAuth()

  useEffect(() => {
    // Suscripción a productos
    const unsubscribe = onSnapshot(collection(db, "productos"), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      setProducts(productList)
    })

    // Suscripción a la lista actual si hay un listId
    let unsubscribeList = () => {}
    if (listId && user) {
      const listQuery = doc(db, "customLists", listId)
      unsubscribeList = onSnapshot(listQuery, (doc) => {
        if (doc.exists()) {
          setCurrentList({ id: doc.id, ...doc.data() } as CustomList)
        }
      })
    } else {
      setCurrentList(null)
    }

    // Fetch categories
    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, "categorias"))
      const categoryList = snapshot.docs.map(doc => doc.data().name)
      setCategories(categoryList.sort())
    }
    fetchCategories()

    // Suscripción a las listas del usuario
    let unsubscribeUserLists = () => {}
    if (user) {
      const userListsQuery = query(
        collection(db, "customLists"), 
        where("userId", "==", user.uid)
      )
      unsubscribeUserLists = onSnapshot(userListsQuery, (snapshot) => {
        const lists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CustomList[]
        setUserLists(lists)
      })
    }

    return () => {
      unsubscribe()
      unsubscribeList()
      unsubscribeUserLists()
    }
  }, [listId, user])

  // Filtrar productos basado en el término de búsqueda y la lista actual
  const filteredProducts = products
    .filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      if (!currentList) return nameMatch // lista principal
      return nameMatch && currentList.products && product.id in currentList.products
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // Agrupar productos filtrados por categoría
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  // Función para agregar producto a una lista
  const handleAddToList = async (productId: string, targetListId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const listRef = doc(db, "customLists", targetListId);
      await updateDoc(listRef, {
        [`products.${productId}`]: {
          customPrice: product.price,
          originalPrice: product.price
        }
      });
    } catch (error) {
      console.error("Error al agregar producto a la lista:", error);
    }
  };

  // Función para remover producto de una lista
  const handleRemoveFromList = async (productId: string) => {
    if (!listId) return;
    try {
      const listRef = doc(db, "customLists", listId);
      await updateDoc(listRef, {
        [`products.${productId}`]: deleteField()
      });
    } catch (error) {
      console.error("Error al remover producto de la lista:", error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, "productos", productId))
      } catch (error) {
        console.error("Error al eliminar el producto:", error)
      }
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingProduct) return

    try {
      const productRef = doc(db, "productos", editingProduct.id)
      await updateDoc(productRef, {
        name: editingProduct.name,
        price: editingProduct.price,
        category: editingProduct.category,
        imageUrl: editingProduct.imageUrl
      })
      setEditingProduct(null)
    } catch (error) {
      console.error("Error al actualizar el producto:", error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingProduct) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'pdf-printer') // Reemplaza con tu upload preset de Cloudinary

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dmx4dhysi/image/upload`, // Reemplaza con tu cloud name
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()
      setEditingProduct({...editingProduct, imageUrl: data.secure_url})
    } catch (error) {
      console.error("Error uploading image:", error)
    }
  }

  const handleUpdateCustomPrice = async (productId: string, newPrice: number) => {
    if (!listId || !currentList) return;
    
    try {
      const listRef = doc(db, "customLists", listId);
      await updateDoc(listRef, {
        [`products.${productId}.customPrice`]: newPrice
      });
    } catch (error) {
      console.error("Error al actualizar precio:", error);
    }
  };

  return (
    <div className="product-grid">
      {categories
        .filter(category => productsByCategory[category]?.length > 0)
        .map(category => (
          <div key={category} className="category-section">
            <h2 className="category-header text-center text-2xl font-bold text-blue-600 my-4">
              {category}
            </h2>
            <div className="category-products">
              {productsByCategory[category]?.map((product) => (
                <div key={product.id} className="product-card border rounded p-4">
                  <Image 
                    src={product.imageUrl} 
                    alt={product.name}
                    width="200"
                    height="140"
                    className="product-image w-full h-48 object-cover mb-2" 
                  />
                  <h3 className="product-name font-bold">{product.name}</h3>
                  
                  {/* Mostrar precio según si es lista personalizada o principal */}
                  <p className="product-price">
                    ${currentList?.products?.[product.id]?.customPrice ?? product.price}
                  </p>

                  {/* Agregar input para editar precio si estamos en una lista */}
                  {listId && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Precio personalizado
                      </label>
                      <input
                        type="number"
                        value={currentList?.products?.[product.id]?.customPrice ?? product.price}
                        onChange={(e) => handleUpdateCustomPrice(product.id, Number(e.target.value))}
                        className="mt-1 block w-full border rounded-md shadow-sm p-2"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {user && (
                      <>
                        <button
                          onClick={() => handleEdit(product)}
                          className="bg-blue-500 text-white px-2 py-1 rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>

                  {/* Botones de lista */}
                  {user && (
                    <div className="mt-2">
                      {!listId ? (
                        <select
                          onChange={(e) => handleAddToList(product.id, e.target.value)}
                          className="w-full p-2 border rounded"
                          defaultValue=""
                        >
                          <option value="" disabled>Agregar a lista...</option>
                          {userLists.map(list => (
                            <option key={list.id} value={list.id}>
                              {list.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => handleRemoveFromList(product.id)}
                          className="w-full bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Quitar de la lista
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Modal de edición */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <form onSubmit={handleUpdate} className="bg-white p-4 rounded-lg">
            <h2 className="text-xl mb-4">Editar Producto</h2>
            <input
              type="text"
              value={editingProduct.name}
              onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
              className="block w-full mb-2 p-2 border rounded"
              placeholder="Nombre"
            />
            <input
              type="number"
              value={editingProduct.price}
              onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
              className="block w-full mb-2 p-2 border rounded"
              placeholder="Precio"
            />
            <select
              value={editingProduct.category}
              onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
              className="block w-full mb-2 p-2 border rounded"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full p-2 border rounded"
              />
              {editingProduct.imageUrl && (
                <Image
                  src={editingProduct.imageUrl} 
                  alt="Preview" 
                  height={32}
                  width={32}
                  className="mt-2 object-cover"
                />
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

