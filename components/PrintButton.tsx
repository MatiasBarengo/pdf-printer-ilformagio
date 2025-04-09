"use client"

interface PrintButtonProps {
  onBeforePrint: () => Promise<void>;
}

export default function PrintButton({ onBeforePrint }: PrintButtonProps) {
  const handlePrint = async () => {
    // Remover cualquier estilo previo de impresión
    const oldStyle = document.getElementById('print-style');
    if (oldStyle) {
      oldStyle.remove();
    }

    // Agregar estilos específicos para impresión
    const style = document.createElement('style');
    style.id = 'print-style';
    style.textContent = `
      @page {
        margin: 0;
        padding: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .container {
          margin: 0 !important;
          padding: 0 !important;
        }
        .category-section:first-child {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    await onBeforePrint();
    window.print();
  }

  return (
    <button onClick={handlePrint} className="p-2 bg-gray-500 text-white rounded">
      Imprimir Catálogo
    </button>
  )
}

