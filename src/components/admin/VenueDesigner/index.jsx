import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import DesignerCanvas from './DesignerCanvas';
import DesignerToolbar from './DesignerToolbar';
import DesignerProperties from './DesignerProperties';
import CategoryPanel from './CategoryPanel';

const VenueDesigner = ({ venue, onSave, onCancel, saving = false }) => {
  const [elements, setElements] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSettings] = useState({ width: 800, height: 600 });
  const [error, setError] = useState('');
  const [venueName, setVenueName] = useState('');

  // Load venue data
  useEffect(() => {
    if (venue) {
      try {
        setVenueName(venue.name || '');
        
        let canvasData;
        if (venue.canvas_data) {
          canvasData = typeof venue.canvas_data === 'string' 
            ? JSON.parse(venue.canvas_data) 
            : venue.canvas_data;
        } else if (venue.layout_data) {
          canvasData = typeof venue.layout_data === 'string' 
            ? JSON.parse(venue.layout_data) 
            : venue.layout_data;
        }
        
        if (canvasData) {
          // Load categories (new structure)
          if (canvasData.categories) {
            setCategories(canvasData.categories);
          }
          
          // Load elements and migrate old data if needed
          if (canvasData.elements) {
            const migratedElements = canvasData.elements.map(element => {
              // Remove old price/status fields
              const { price, status, ...cleanElement } = element;
              
              // Ensure categoryId exists (migrate old data)
              if (!cleanElement.categoryId && element.type !== 'stage') {
                // Try to assign a default category based on element type
                if (element.type === 'seat') {
                  cleanElement.categoryId = 'GENERAL';
                } else if (element.type === 'section') {
                  cleanElement.categoryId = 'SECTION';
                }
              }
              
              return cleanElement;
            });
            
            setElements(migratedElements);
          }
          
          // Load showGrid setting if available
          if (canvasData.showGrid !== undefined) {
            setShowGrid(canvasData.showGrid);
          }
        } else {
          setElements([]);
          setCategories({});
        }
      } catch (error) {
        console.error('Error parsing venue data:', error);
        setElements([]);
        setCategories({});
      }
    } else {
      // New venue - start with default categories
      setElements([]);
      setCategories({
        'GENERAL': { name: 'General Admission', color: '#3B82F6' },
        'VIP': { name: 'VIP', color: '#8B5CF6' },
        'PREMIUM': { name: 'Premium', color: '#F59E0B' }
      });
      setVenueName('New Venue');
      
      // Add default stage
      const defaultStage = {
        id: 'default-stage',
        type: 'stage',
        x: 300,
        y: 50,
        width: 200,
        height: 40,
        color: '#6B7280',
        label: 'STAGE'
      };
      
      setElements([defaultStage]);
    }
  }, [venue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'v':
          setSelectedTool('select');
          break;
        case 'h':
          setSelectedTool('pan');
          break;
        case 'p':
          if (selectedCategory) {
            setSelectedTool('paint-category');
          }
          break;
        case 's':
          setSelectedTool('seat');
          break;
        case 'r':
          setSelectedTool('section');
          break;
        case 'g':
          setSelectedTool('polygon');
          break;
        case 't':
          setSelectedTool('stage');
          break;
        case 'delete':
        case 'backspace':
          if (selectedElement) {
            handleDeleteElement();
          }
          break;
        case 'd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (selectedElement) {
              handleDuplicateElement();
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, selectedCategory]);

  // Category management
  const handleCategoryCreate = useCallback((categoryId, categoryData) => {
    setCategories(prev => ({ ...prev, [categoryId]: categoryData }));
    setSelectedCategory(categoryId);
  }, []);

  const handleCategoryUpdate = useCallback((oldCategoryId, categoryData, newCategoryId = null) => {
    setCategories(prev => {
      const updated = { ...prev };
      
      if (newCategoryId && newCategoryId !== oldCategoryId) {
        // ID changed - update all elements with this categoryId
        setElements(currentElements => currentElements.map(element => ({
          ...element,
          categoryId: element.categoryId === oldCategoryId ? newCategoryId : element.categoryId
        })));
        
        delete updated[oldCategoryId];
        updated[newCategoryId] = categoryData;
        
        if (selectedCategory === oldCategoryId) {
          setSelectedCategory(newCategoryId);
        }
      } else {
        updated[oldCategoryId] = categoryData;
      }
      
      return updated;
    });
  }, [selectedCategory]);

  const handleCategoryDelete = useCallback((categoryId) => {
    setCategories(prev => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
    
    // Remove categoryId from all elements that use it
    setElements(prev => prev.map(element => ({
      ...element,
      categoryId: element.categoryId === categoryId ? null : element.categoryId
    })));
    
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    }
  }, [selectedCategory]);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    if (selectedTool !== 'paint-category') {
      setSelectedTool('paint-category');
    }
  }, [selectedTool]);

  // Element management
  const handleElementsChange = useCallback((newElements) => {
    setElements(newElements);
  }, []);

  const handleElementSelect = useCallback((element) => {
    setSelectedElement(element);
    setSelectedTool('select');
  }, []);

  const handleElementUpdate = useCallback((updatedElement) => {
    setElements(prev => prev.map(el => (
      el.id === updatedElement.id ? updatedElement : el
    )));
    setSelectedElement(updatedElement);
  }, []);

  const handleDeleteElement = useCallback(() => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement.id));
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const handleDuplicateElement = useCallback(() => {
    if (selectedElement) {
      const duplicated = {
        ...selectedElement,
        id: Date.now().toString(),
        x: selectedElement.x + 30,
        y: selectedElement.y + 30
      };
      
      if (selectedElement.type === 'polygon' && selectedElement.points) {
        duplicated.points = selectedElement.points.map(point => ({
          x: point.x + 30,
          y: point.y + 30
        }));
      }
      
      setElements(prev => [...prev, duplicated]);
      setSelectedElement(duplicated);
    }
  }, [selectedElement]);

  const handleClearCanvas = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This action cannot be undone.')) {
      setElements([]);
      setSelectedElement(null);
    }
  }, []);

  const handleToggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const handleSave = useCallback(() => {
    try {
      setError('');
      
      // Check for elements
      if (elements.length === 0) {
        setError('Canvas is empty. Please add at least one element before saving.');
        return;
      }
      
      // Check for venue name
      if (!venueName.trim()) {
        setError('Please enter a venue name before saving.');
        return;
      }
      
      // Prepare new venue structure - NO prices, NO statuses
      const venueData = {
        venueId: venue?.id || Date.now().toString(),
        categories,
        elements: elements.map(element => {
          // Ensure we strip any legacy price/status fields
          const { price, status, ...cleanElement } = element;
          return cleanElement;
        }),
        // Include showGrid setting
        showGrid
      };
      
      // Send data to parent component
      onSave({
        name: venueName.trim(),
        description: venue?.description || 'Created with venue designer',
        canvas_data: venueData
      });
    } catch (err) {
      console.error('Error saving venue:', err);
      setError('Failed to save venue. Please try again.');
    }
  }, [elements, categories, venueName, venue, onSave, showGrid]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
        <div>
          <input
            type="text"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            className="text-xl font-semibold bg-transparent border-b border-transparent focus:border-primary-400 focus:outline-none text-white px-0 py-1"
            placeholder="Enter venue name"
          />
          <p className="text-sm text-gray-400">
            {elements.length} elements • {Object.keys(categories).length} categories
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-600 hover:border-zinc-500 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              saving
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-primary-400 hover:bg-primary-500 text-black'
            }`}
          >
            {saving ? 'Saving...' : 'Save Venue'}
          </button>
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 m-4 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Toolbar */}
        <div className="w-64 border-r border-zinc-700 p-4 overflow-y-auto">
          <DesignerToolbar
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            selectedElement={selectedElement}
            onClearCanvas={handleClearCanvas}
            onToggleGrid={handleToggleGrid}
            showGrid={showGrid}
            selectedCategory={selectedCategory}
            categories={categories}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <DesignerCanvas
              elements={elements}
              onElementsChange={handleElementsChange}
              selectedTool={selectedTool}
              selectedElement={selectedElement}
              onElementSelect={handleElementSelect}
              canvasSettings={canvasSettings}
              showGrid={showGrid}
              categories={categories}
              selectedCategory={selectedCategory}
            />
          </motion.div>
        </div>

        {/* Right Sidebar - Properties and Categories */}
        <div className="w-80 border-l border-zinc-700 p-4 overflow-y-auto space-y-6">
          {/* Category Panel */}
          <CategoryPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onCategoryCreate={handleCategoryCreate}
            onCategoryUpdate={handleCategoryUpdate}
            onCategoryDelete={handleCategoryDelete}
          />

          {/* Properties Panel */}
          <DesignerProperties
            selectedElement={selectedElement}
            onElementUpdate={handleElementUpdate}
            onElementDelete={handleDeleteElement}
            categories={categories}
          />
        </div>
      </div>
    </div>
  );
};

export default VenueDesigner;