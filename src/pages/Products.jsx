import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Package, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import { fmtMoney, toNum } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PRODUCT_FORM_DEFAULT } from '@/models/schemas';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';

export default function ProductsPage() {
  const [searchQuery,     setSearchQuery]     = useState('');
  const [modalOpen,       setModalOpen]       = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData,        setFormData]        = useState(PRODUCT_FORM_DEFAULT);

  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const resetForm  = () => { setSelectedProduct(null); setFormData(PRODUCT_FORM_DEFAULT); };
  const closeModal = () => { setModalOpen(false); resetForm(); };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name:           product.name           || '',
      category:       product.category       || '',
      price:          product.price          || 0,
      cost:           product.cost           || 0,
      stock_quantity: product.stock_quantity || 0,
      min_stock:      product.min_stock      || 1,
      unit:           product.unit           || 'un',
      active:         product.active         ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const mutation = selectedProduct
      ? updateProduct.mutateAsync({ id: selectedProduct.id, data: formData })
      : createProduct.mutateAsync(formData);
    mutation.then(closeModal).catch(() => {});
  };

  const set = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const grouped = filtered.reduce((acc, p) => {
    const cat = p.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const totalItems = products.reduce((s, p) => s + (p.stock_quantity || 0), 0);
  const totalValue = products.reduce((s, p) => s + toNum(p.stock_quantity) * toNum(p.price), 0);
  const lowStockCount = products.filter((p) => p.stock_quantity <= p.min_stock).length;

  return (
    <div className="min-h-screen page-bg">
      {/* Summary banner */}
      <div className="bg-black text-white px-4 py-4 flex items-center justify-between gap-4">
        <div className="text-center flex-1">
          <p className="text-2xl font-bold">{totalItems}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Itens em estoque</p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center flex-1">
          <p className="text-2xl font-bold gold-text">R$ {fmtMoney(totalValue)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Valor patrimônio</p>
        </div>
        {lowStockCount > 0 && (
          <>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-red-400">{lowStockCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Estoque baixo</p>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="bg-white px-4 py-3 border-b border-black/[0.07]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto..."
            className="pl-9 h-11 rounded-xl bg-gray-50 border-gray-200 text-sm"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="pb-28">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-36 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {searchQuery ? 'Nenhum resultado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-sm text-gray-400 text-center">
              {searchQuery ? 'Tente outro termo' : 'Toque em + para adicionar'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              {/* Category header */}
              <div className="cat-divider">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ background: '#C9A861' }} />
                  <span className="cat-divider-label">{category}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{items.length}</span>
              </div>

              {/* Product rows */}
              {items.map((product, idx) => {
                const lowStock = product.stock_quantity <= product.min_stock;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => openEdit(product)}
                    className="list-row"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                        {lowStock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">R$ {fmtMoney(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={lowStock ? 'badge-red' : 'badge-green'}>
                        {product.stock_quantity} {product.unit || 'un'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => { resetForm(); setModalOpen(true); }}
        className="fixed right-5 gold-gradient shadow-xl flex items-center justify-center z-30 rounded-full w-14 h-14"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="w-6 h-6 text-black" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button onClick={closeModal} className="text-amber-600 font-semibold text-sm">Fechar</button>
                <h2 className="font-bold text-gray-900">
                  {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <div className="w-14" />
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome *</Label>
                  <Input value={formData.name} onChange={(e) => set('name')(e.target.value)} placeholder="Nome do produto" className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</Label>
                  <Input value={formData.category} onChange={(e) => set('category')(e.target.value)} placeholder="Ex: Cola, Cílios, Acessórios..." className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço de Venda</Label>
                    <Input type="number" step="0.01" value={formData.price} onChange={(e) => set('price')(parseFloat(e.target.value) || 0)} className="mt-1.5 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custo</Label>
                    <Input type="number" step="0.01" value={formData.cost} onChange={(e) => set('cost')(parseFloat(e.target.value) || 0)} className="mt-1.5 h-11 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Em Estoque</Label>
                    <Input type="number" value={formData.stock_quantity} onChange={(e) => set('stock_quantity')(parseInt(e.target.value) || 0)} className="mt-1.5 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estoque Mínimo</Label>
                    <Input type="number" value={formData.min_stock} onChange={(e) => set('min_stock')(parseInt(e.target.value) || 1)} className="mt-1.5 h-11 rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidade</Label>
                  <Input value={formData.unit} onChange={(e) => set('unit')(e.target.value)} placeholder="un, ml, g..." className="mt-1.5 h-11 rounded-xl" />
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-2">
                <Button onClick={handleSave} className="w-full gold-gradient text-black font-bold h-12 rounded-xl">
                  Salvar
                </Button>
                {selectedProduct && (
                  <Button
                    variant="outline"
                    onClick={() => deleteProduct.mutate(selectedProduct.id, { onSuccess: closeModal })}
                    className="w-full text-red-500 border-red-200 h-11 rounded-xl text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir produto
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
