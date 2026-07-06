import React, { useState, useEffect, useCallback } from 'react';
import { Search, Star, Clock, Users, ChevronDown, ChevronUp, Filter, X, ChefHat } from 'lucide-react';
import './App.css';

const NoDataFallback = () => (
  <div className="fallback-container nice-to-have">
    <div className="fallback-icon">
      <ChefHat size={64} />
    </div>
    <h3 className="fallback-title">No Recipes Available</h3>
    <p className="fallback-message">
      <br />
      <span className="nice-to-have-tag">Nice to Have:</span> Maybe add a feature to submit your own recipe!
    </p>
  </div>
);

const NoResultsFallback = ({ onClearFilters }) => (
  <div className="fallback-container nice-to-have">
    <div className="fallback-icon">
      <Search size={64} />
    </div>
    <h3 className="fallback-title">No Matching Recipes Found</h3>
    <p className="fallback-message">
       <br />
      <span className="nice-to-have-tag">Nice to Have:</span> Maybe suggest similar recipes or save your search.
    </p>
    <button onClick={onClearFilters} className="fallback-button">
      Clear All Filters
    </button>
  </div>
);
function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [recipesPerPage, setRecipesPerPage] = useState(15);
  const [timeExpanded, setTimeExpanded] = useState(false);
  
  const [filters, setFilters] = useState({
    title: '',
    cuisine: '',
    rating: '',
    total_time: '',
    serves: ''
  });

  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    setTotalPages(Math.ceil(recipes.length / recipesPerPage));
  }, [recipes, recipesPerPage]);
  
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const queryParams = new URLSearchParams({
        ...(filters.title && { title: filters.title }),
        ...(filters.cuisine && { cuisine: filters.cuisine }),
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.total_time && { total_time: filters.total_time }),
        ...(filters.serves && { serves: filters.serves })
      });

      const url = `http://localhost:3000/api/recipes/search?${queryParams}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch recipes`);
      
      const data = await response.json();
      setRecipes(data.data || []);
      setTotalRecipes(data.count || 0);
      
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError(`Failed to load recipes: ${error.message}`);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCuisines = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/recipes');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched cuisines',data.cuisines || []);
      }
    } catch (error) {
      console.error('Error fetching cuisines:', error);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
    fetchCuisines();
  }, [fetchRecipes, fetchCuisines]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchRecipes();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [filters, fetchRecipes]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setIsFiltering(true);
  };

  const clearFilters = () => {
    setFilters({
      title: '',
      cuisine: '',
      rating: '',
      total_time: '',
      serves: ''
    });
    setCurrentPage(1);
    setIsFiltering(false);
  };

  const openRecipeDrawer = (recipe) => {
    setSelectedRecipe(recipe);
    setShowDrawer(true);
    setTimeExpanded(false);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setSelectedRecipe(null);
  };

  const renderStarRating = (rating) => {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="star-rating-table">

        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={14} className="star-filled" />
        ))}
        
        {hasHalfStar && (
          <div className="star-half-container">
            <Star size={14} className="star-empty" />
            <div className="star-half-overlay">
              <Star size={14} className="star-filled" />
            </div>
          </div>
        )}
        
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={14} className="star-empty" />
        ))}
        
        <span className="rating-value">
          {numRating.toFixed(1)}
        </span>
      </div>
    );
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const num = parseInt(minutes);
    if (num < 60) return `${num}m`;
    const hours = Math.floor(num / 60);
    const mins = num % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <ChefHat size={28} className="icon-white" />
            </div>
            <div className="header-text">
              <h1 className="app-title">Recipe Finder</h1>
              <p className="app-subtitle">Discover your next favorite meal</p>
            </div>
          </div>
          <div className="recipe-counter">
            <span className="counter-text">{totalRecipes} recipes</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <div className="error-text">{error}</div>
          </div>
        )}

        <div className="filters-container">
          <div className="filters-header">
            <div className="filters-title">
              <Filter size={20} className="mr-2" />
              Search & Filter
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-btn">
                <X size={14} className="mr-1" />
                Clear All
              </button>
            )}
          </div>
          
          <div className="filters-content">
            <div className="filters-grid">
              <div className="filter-group search-filter">
                <label className="filter-label">Recipe Name</label>
                <div className="search-input-container">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={filters.title}
                    onChange={(e) => handleFilterChange('title', e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="filter-group search-filter">
              <label className="filter-label">Cuisine</label>
              <div className="search-input-container">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search cuisines..."
                  value={filters.cuisine}
                  onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

              <div className="filter-group">
                <label className="filter-label">Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Choose Rating</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                  <option value="3">⭐⭐⭐ 3 Stars</option>
                  <option value="2">⭐⭐ 2 Stars</option>
                  <option value="1">⭐ 1 Stars</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Cooking Time</label>
                <select
                  value={filters.total_time}
                  onChange={(e) => handleFilterChange('total_time', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Choose Time</option>
                  <option value="30">Quick (≤ 30 min)</option>
                  <option value="60">Medium (≤ 1 hour)</option>
                  <option value="120">Long (≤ 2 hours)</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Servings</label>
                <select
                  value={filters.serves}
                  onChange={(e) => handleFilterChange('serves', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Choose Servings</option>
                  <option value="2 servings">2 Servings</option>
                  <option value="4 servings">4 Servings</option>
                  <option value="6 servings">6 Servings</option>
                  <option value="8 servings">8 Servings</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="results-controls">
          <div className="results-per-page">
            <span className="results-label">Show:</span>
            <select
              value={recipesPerPage}
              onChange={(e) => {
                setRecipesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="results-select"
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </select>
            <span className="results-text">per page</span>
          </div>
          
          {isFiltering && (
            <div className="filtering-indicator">
              <span className="filtering-text">
                Showing {recipes.length} filtered results
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Finding delicious recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          hasActiveFilters ? (
            <NoResultsFallback onClearFilters={clearFilters} />
          ) : (
            <NoDataFallback />
          )
        ) : (
          <div className="recipes-section">
            <div className="recipe-table-container">
              <div className="recipe-table-wrapper">
                <table className="recipe-table">
                  <thead className="recipe-table-header">
                    <tr>
                      <th className="table-header-cell title-column">Title</th>
                      <th className="table-header-cell cuisine-column">Cuisine</th>
                      <th className="table-header-cell rating-column">Rating</th>
                      <th className="table-header-cell time-column">
                        <div className="header-with-icon">
                          <Clock size={16} />
                          Total Time
                        </div>
                      </th>
                      <th className="table-header-cell serves-column">
                        <div className="header-with-icon">
                          <Users size={16} />
                          Serves
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="recipe-table-body">
                    {recipes
                      .slice((currentPage - 1) * recipesPerPage, currentPage * recipesPerPage)
                      .map((recipe, index) => (
                        <tr
                          key={recipe.id || index}
                          onClick={() => openRecipeDrawer(recipe)}
                          className="recipe-table-row"
                        >
                          <td className="table-cell title-cell">
                            <div className="title-content" title={recipe.name || recipe.title}>
                              <span className="recipe-title-text">
                                {recipe.name || recipe.title || 'Untitled Recipe'}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell cuisine-cell">
                            <span className="cuisine-badge">
                              {recipe.cuisine || recipe.recipeCategory || 'General'}
                            </span>
                          </td>
                          <td className="table-cell rating-cell">
                            {renderStarRating(recipe.rating || recipe.aggregateRating?.ratingValue || 0)}
                          </td>
                          <td className="table-cell time-cell">
                            <div className="time-content">
                              <Clock size={14} className="time-icon" />
                              {formatTime(recipe.total_time || (recipe.cook_time + recipe.prep_time))}
                            </div>
                          </td>
                          <td className="table-cell serves-cell">
                            <div className="serves-content">
                              <Users size={14} className="serves-icon" />
                              {recipe.serves || recipe.recipeYield || 'N/A'} 
                              {recipe.serves && recipe.serves !== 'N/A' && 
                                (parseInt(recipe.serves) === 1)
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-content">
                  <div className="pagination-info">
                    Showing <span className="pagination-bold">{(currentPage - 1) * recipesPerPage + 1}</span> to{' '}
                    <span className="pagination-bold">{Math.min(currentPage * recipesPerPage, recipes.length)}</span> of{' '}
                    <span className="pagination-bold">{recipes.length}</span> recipes
                  </div>
                  
                  <div className="pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>
                    
                    <div className="pagination-numbers">
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showDrawer && selectedRecipe && (
        <div className="drawer-overlay">
          <div className="drawer-backdrop" onClick={closeDrawer}></div>
          <section className="drawer-container">
            <div className="drawer-content">
              <div className="drawer">
                <div className="drawer-header">
                  <div className="drawer-title-section">
                    <h2 className="drawer-title">{selectedRecipe.title}</h2>
                    <p className="drawer-subtitle">{selectedRecipe.cuisine} Cuisine</p>
                  </div>
                  <button onClick={closeDrawer} className="drawer-close-btn">
                    <X size={24} />
                  </button>
                </div>

                <div className="drawer-body drawer-scrollable">
                  <div className="stats-grid">
                    <div className="stat-card time-stat">
                      <Clock size={24} className="stat-icon" />
                      <div className="stat-label">Total Time</div>
                      <div className="stat-value">{formatTime(selectedRecipe.total_time)}</div>
                    </div>
                    <div className="stat-card serves-stat">
                      <Users size={24} className="stat-icon" />
                      <div className="stat-label">Serves</div>
                      <div className="stat-value">{selectedRecipe.serves || selectedRecipe.recipeYield || 'N/A'}</div>
                    </div>
                    <div className="stat-card rating-stat">
                      <Star size={24} className="stat-icon" />
                      <div className="stat-label">Rating</div>
                      <div className="stat-value">
                        {parseFloat(selectedRecipe.rating || selectedRecipe.aggregateRating?.ratingValue || 0).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {selectedRecipe.description && (
                    <div className="description-section">
                      <h3 className="section-title">Description</h3>
                      <p className="description-text">{selectedRecipe.description}</p>
                    </div>
                  )}

                  <div className="time-breakdown-section">
                    <button
                      onClick={() => setTimeExpanded(!timeExpanded)}
                      className="time-breakdown-toggle"
                    >
                      <h3 className="section-title">Time Breakdown</h3>
                      {timeExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {timeExpanded && (
                      <div className="time-breakdown-content">
                        <div className="time-item">
                          <span className="time-label">Prep Time:</span>
                          <span className="time-value">{formatTime(selectedRecipe.prep_time)}</span>
                        </div>
                        <div className="time-item">
                          <span className="time-label">Cook Time:</span>
                          <span className="time-value">{formatTime(selectedRecipe.cook_time)}</span>
                        </div>
                        <div className="time-item total">
                          <span className="time-label">Total Time:</span>
                          <span className="time-value">{formatTime(selectedRecipe.total_time)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedRecipe.nutrients && (
                    <div className="nutrition-section">
                      <h3 className="section-title">Nutrition Facts</h3>
                      <div className="nutrition-grid">
                        {[
                          { key: 'calories', label: 'Calories'},
                          { key: 'carbohydrateContent', label: 'Carbohydrates' },
                          { key: 'cholestrolContent', label: 'Cholesterol' },
                          { key: 'fiberContent', label: 'Fiber' },
                          { key: 'proteinContent', label: 'Protein' },
                          { key: 'saturatedFatContent', label: 'Saturated Fat' },
                          { key: 'sodiumContent', label: 'Sodium' },
                          { key: 'sugarContent', label: 'Sugar' },
                          { key: 'fatContent', label: 'Fat' }
                          
                        ].map(({ key, label, unit }) => {
                          const value = selectedRecipe.nutrients?.[key];
                          if (!value) return null;
                          
                          return (
                            <div key={key} className="nutrition-item">
                              <div className="nutrition-label">{label}</div>
                              <div className="nutrition-value">{value}{unit}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;