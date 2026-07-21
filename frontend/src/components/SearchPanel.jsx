import React, { useState, useEffect } from 'react';

export default function SearchPanel({ placeholder = "Search by tracking ID, name, phone, vendor...", onSearch, delay = 500 }) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (typeof onSearch === 'function') {
        onSearch(searchTerm);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onSearch, delay]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '0 12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#9ca3af" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ marginRight: 8 }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            border: 'none', 
            outline: 'none', 
            width: '100%', 
            padding: '10px 0', 
            fontSize: '14px' 
          }}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '4px',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
