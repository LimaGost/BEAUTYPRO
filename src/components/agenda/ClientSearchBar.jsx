import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClientSearchBar({ clients, onClientSelect, onClear }) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredClients = clients.filter(c => {
    const fullName = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const query = search.toLowerCase();
    
    return fullName.includes(query) || phone.includes(query) || email.includes(query);
  });

  const handleSelect = (client) => {
    onClientSelect(client);
    setSearch('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => search && setShowResults(true)}
          placeholder="Nome, telefone ou e-mail..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              setShowResults(false);
              onClear();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {showResults && search && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-20"
        >
          {filteredClients.length > 0 ? (
            filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => handleSelect(client)}
                className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {client.first_name} {client.last_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {client.phone && <span>{client.phone}</span>}
                  {client.email && <span className="ml-2">{client.email}</span>}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Nenhum contato encontrado
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}