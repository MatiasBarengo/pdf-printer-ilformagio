"use client"

import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase';
import Spinner from './Spinner';

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dmx4dhysi/image/upload";
const UPLOAD_PRESET = "pdf-printer";

export default function AddProductForm() {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const isAuthenticated = useAuth()

  useEffect(() => {
    const fetchCategories = async () => {
      if (!isAuthenticated) return
      const snapshot = await getDocs(collection(db, "categorias"))
      const categoryList = snapshot.docs.map(doc => doc.data().name)
      setCategories(categoryList)
    }
    fetchCategories()
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !name || !price || !category || !image) return

    setLoading(true)

    try {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("quality", "auto");
      formData.append("fetch_format", "auto");

      console.log('Subiendo imagen a Cloudinary...');
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al subir la imagen: ${errorData.error?.message || 'Error desconocido'}`);
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      console.log('Imagen subida:', imageUrl);

      // Guardar producto en Firestore
      await addDoc(collection(db, "productos"), {
        name: name.trim(),
        price: Number(price),
        category: category.trim(),
        imageUrl,
        createdAt: new Date()
      });

      // Limpiar formulario
      setName("");
      setPrice("");
      setCategory("");
      setImage(null);
      alert("Producto agregado exitosamente");
    } catch (error) {
      console.error('Error completo:', error);
      alert(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del producto"
        className="w-full p-2 border border-neutral-200 rounded dark:border-neutral-800"
        required
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Precio"
        className="w-full p-2 border border-neutral-200 rounded dark:border-neutral-800"
        required
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border border-neutral-200 rounded dark:border-neutral-800"
        required
      >
        <option value="">Seleccionar categoría</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="file"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        accept="image/*"
        className="w-full p-2 border border-neutral-200 rounded dark:border-neutral-800"
        required
      />
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded" disabled={loading}>
        {loading ? <Spinner /> : 'Agregar Producto'}
      </button>
    </form>
  )
}

