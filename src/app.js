// App Logic for Netflix Data Analysis Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let rawDataset = [];
    let filteredDataset = [];
    let currentPage = 1;
    let pageSize = 25;
    
    // UI Elements - Tabs & Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // UI Elements - KPI Cards
    const kpiTotalTitles = document.querySelector('#kpi-total-titles .kpi-value');
    const kpiMoviesRatio = document.querySelector('#kpi-movies-ratio .kpi-value');
    const moviesCountSpan = document.querySelector('#movies-count');
    const kpiTvRatio = document.querySelector('#kpi-tv-ratio .kpi-value');
    const tvCountSpan = document.querySelector('#tv-count');
    const kpiTopCountryName = document.querySelector('#top-country-name');
    const kpiTopCountryCount = document.querySelector('#top-country-count');
    
    // UI Elements - Chart Gallery
    const galleryTabButtons = document.querySelectorAll('.gallery-tab-btn');
    const chartDisplayCards = document.querySelectorAll('.chart-display-card');

    // UI Elements - Filters
    const searchInput = document.querySelector('#search-input');
    const filterType = document.querySelector('#filter-type');
    const filterRating = document.querySelector('#filter-rating');
    const filterCountry = document.querySelector('#filter-country');
    const filterGenre = document.querySelector('#filter-genre');
    const btnResetFilters = document.querySelector('#btn-reset-filters');
    
    // UI Elements - Table & Pagination
    const tableBody = document.querySelector('#table-body');
    const filteredCountText = document.querySelector('#filtered-count');
    const totalCountText = document.querySelector('#total-count');
    const pageSizeSelect = document.querySelector('#page-size');
    const prevPageBtn = document.querySelector('#prev-page');
    const nextPageBtn = document.querySelector('#next-page');
    const pageNumbersContainer = document.querySelector('#page-numbers');

    // UI Elements - Modal
    const detailsModal = document.querySelector('#details-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalType = document.querySelector('#modal-type');
    const modalTitle = document.querySelector('#modal-title');
    const modalDesc = document.querySelector('#modal-desc');
    const modalDirector = document.querySelector('#modal-director');
    const modalCast = document.querySelector('#modal-cast');
    const modalRating = document.querySelector('#modal-rating');
    const modalRelease = document.querySelector('#modal-release');
    const modalDuration = document.querySelector('#modal-duration');
    const modalDate = document.querySelector('#modal-date');
    const modalGenres = document.querySelector('#modal-genres');
    const modalCountry = document.querySelector('#modal-country');

    // UI Elements - Accordion
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // ==========================================
    // 1. NAVIGATION & TAB SWITCHING
    // ==========================================
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Toggle buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Toggle content
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // ==========================================
    // 2. CHART GALLERY TAB SWITCHING
    // ==========================================
    galleryTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetChart = btn.getAttribute('data-chart');
            
            // Toggle sidebar buttons
            galleryTabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Toggle charts
            chartDisplayCards.forEach(card => {
                if (card.id === `chart-${targetChart}`) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        });
    });

    // ==========================================
    // 3. INSIGHTS ACCORDION TOGGLE
    // ==========================================
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const body = item.querySelector('.accordion-body');
            const isActive = item.classList.contains('active');
            
            // Close all items
            document.querySelectorAll('.accordion-item').forEach(accItem => {
                accItem.classList.remove('active');
                accItem.querySelector('.accordion-body').style.display = 'none';
            });
            
            // Toggle clicked item
            if (!isActive) {
                item.classList.add('active');
                body.style.display = 'block';
            }
        });
    });
    // Open the first accordion item by default
    if (accordionHeaders.length > 0) {
        accordionHeaders[0].click();
    }

    // ==========================================
    // 4. DATA PARSING & INITIALIZATION
    // ==========================================
    
    // Robust CSV Parser to handle comma-separated values in quotes correctly
    function parseCSV(text) {
        let lines = [];
        let row = [""];
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            let next = text[i+1];
            
            if (c === '"') {
                if (inQuotes && next === '"') {
                    row[row.length - 1] += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c === ',' && !inQuotes) {
                row.push("");
            } else if ((c === '\r' || c === '\n') && !inQuotes) {
                if (c === '\r' && next === '\n') {
                    i++;
                }
                lines.push(row);
                row = [""];
            } else {
                row[row.length - 1] += c;
            }
        }
        if (row.length > 1 || row[0] !== "") {
            lines.push(row);
        }
        
        // Map headers to object keys
        let headers = lines[0].map(h => h.trim());
        let data = [];
        
        for (let i = 1; i < lines.length; i++) {
            let values = lines[i];
            if (values.length < headers.length) continue; // Skip empty/malformed rows
            let obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j] ? values[j].trim() : "";
            }
            data.push(obj);
        }
        return data;
    }

    // Load Metrics and CSV Datasets
    async function initializeDashboard() {
        try {
            // Load pre-calculated summary metrics
            const responseMetrics = await fetch('../data/processed/summary_metrics.json');
            if (responseMetrics.ok) {
                const metrics = await responseMetrics.json();
                updateKPIs(metrics);
            }
            
            // Load cleaned dataset CSV
            const responseData = await fetch('../data/processed/netflix_titles_cleaned.csv');
            if (responseData.ok) {
                const csvText = await responseData.text();
                rawDataset = parseCSV(csvText);
                filteredDataset = [...rawDataset];
                
                // Initialize Explorer
                totalCountText.textContent = rawDataset.length.toLocaleString();
                populateDropdownFilters(rawDataset);
                setupFilterListeners();
                applyFiltersAndRender();
            } else {
                tableBody.innerHTML = `<tr><td colspan="8" class="loading-state" style="color: var(--netflix-red)">Error loading database file. Make sure run.py has completed.</td></tr>`;
            }
        } catch (error) {
            console.error('Initialization error:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="loading-state" style="color: var(--netflix-red)">Error loading dashboard data: ${error.message}</td></tr>`;
        }
    }

    // Update KPI Card UI values
    function updateKPIs(metrics) {
        kpiTotalTitles.textContent = metrics.total_titles.toLocaleString();
        kpiMoviesRatio.textContent = `${metrics.movie_percentage}%`;
        moviesCountSpan.textContent = metrics.total_movies.toLocaleString();
        kpiTvRatio.textContent = `${metrics.tv_percentage}%`;
        tvCountSpan.textContent = metrics.total_tv_shows.toLocaleString();
        kpiTopCountryName.textContent = metrics.top_country;
        kpiTopCountryCount.textContent = `${metrics.top_country_count.toLocaleString()} titles co-produced`;
    }

    // Populate drop-down select options based on unique values in data
    function populateDropdownFilters(data) {
        const ratings = new Set();
        const countries = new Set();
        const genres = new Set();
        
        data.forEach(item => {
            if (item.rating) ratings.add(item.rating);
            
            if (item.country && item.country !== 'Unknown') {
                item.country.split(', ').forEach(c => countries.add(c));
            }
            
            if (item.listed_in) {
                item.listed_in.split(', ').forEach(g => genres.add(g));
            }
        });

        // Clear existing, keep "All"
        filterRating.innerHTML = '<option value="all">All Ratings</option>';
        filterCountry.innerHTML = '<option value="all">All Countries</option>';
        filterGenre.innerHTML = '<option value="all">All Genres</option>';

        // Sort and populate
        Array.from(ratings).sort().forEach(r => {
            filterRating.innerHTML += `<option value="${r}">${r}</option>`;
        });
        
        Array.from(countries).sort().forEach(c => {
            filterCountry.innerHTML += `<option value="${c}">${c}</option>`;
        });
        
        Array.from(genres).sort().forEach(g => {
            filterGenre.innerHTML += `<option value="${g}">${g}</option>`;
        });
    }

    // ==========================================
    // 5. FILTERING & SEARCHING
    // ==========================================
    function setupFilterListeners() {
        searchInput.addEventListener('input', debounce(applyFiltersAndRender, 300));
        filterType.addEventListener('change', applyFiltersAndRender);
        filterRating.addEventListener('change', applyFiltersAndRender);
        filterCountry.addEventListener('change', applyFiltersAndRender);
        filterGenre.addEventListener('change', applyFiltersAndRender);
        
        btnResetFilters.addEventListener('click', () => {
            searchInput.value = '';
            filterType.value = 'all';
            filterRating.value = 'all';
            filterCountry.value = 'all';
            filterGenre.value = 'all';
            applyFiltersAndRender();
        });

        pageSizeSelect.addEventListener('change', () => {
            pageSize = parseInt(pageSizeSelect.value);
            currentPage = 1;
            renderTable();
        });
    }

    // Debounce function to prevent lag on search input keypress
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function applyFiltersAndRender() {
        const query = searchInput.value.toLowerCase().trim();
        const type = filterType.value;
        const rating = filterRating.value;
        const country = filterCountry.value;
        const genre = filterGenre.value;

        filteredDataset = rawDataset.filter(item => {
            // Text Search
            const matchesSearch = !query || 
                item.title.toLowerCase().includes(query) ||
                item.director.toLowerCase().includes(query) ||
                item.cast.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query);

            // Type Filter
            const matchesType = type === 'all' || item.type === type;
            
            // Rating Filter
            const matchesRating = rating === 'all' || item.rating === rating;
            
            // Country Filter
            const matchesCountry = country === 'all' || 
                (item.country && item.country.split(', ').includes(country));
                
            // Genre Filter
            const matchesGenre = genre === 'all' || 
                (item.listed_in && item.listed_in.split(', ').includes(genre));

            return matchesSearch && matchesType && matchesRating && matchesCountry && matchesGenre;
        });

        currentPage = 1;
        filteredCountText.textContent = filteredDataset.length.toLocaleString();
        renderTable();
    }

    // ==========================================
    // 6. PAGINATION & TABLE RENDER
    // ==========================================
    function renderTable() {
        tableBody.innerHTML = '';
        
        if (filteredDataset.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="loading-state">No matching titles found in Netflix catalog. Try resetting the filters.</td></tr>`;
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            pageNumbersContainer.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredDataset.length);
        const pageData = filteredDataset.slice(startIndex, endIndex);

        pageData.forEach(item => {
            const tr = document.createElement('tr');
            
            // Set data properties for modal retrieval
            tr.dataset.id = item.show_id;
            
            const badgeClass = item.type === 'Movie' ? 'badge-movie' : 'badge-tv';
            
            tr.innerHTML = `
                <td><span class="badge ${badgeClass}">${item.type}</span></td>
                <td style="font-weight: 600; color: var(--text-primary);" title="${item.title}">${item.title}</td>
                <td title="${item.director}">${item.director}</td>
                <td title="${item.country}">${item.country}</td>
                <td>${item.release_year}</td>
                <td><span class="badge badge-rating">${item.rating}</span></td>
                <td>${item.duration}</td>
                <td title="${item.listed_in}">${item.listed_in}</td>
            `;
            
            // Attach event listener for opening modal
            tr.addEventListener('click', () => {
                showDetailModal(item);
            });
            
            tableBody.appendChild(tr);
        });

        // Update pagination buttons
        const totalPages = Math.ceil(filteredDataset.length / pageSize);
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        renderPageNumbers(totalPages);
    }

    function renderPageNumbers(totalPages) {
        pageNumbersContainer.innerHTML = '';
        
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // First Page Button
        if (startPage > 1) {
            addPageNumButton(1);
            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.className = 'page-num dots';
                dots.textContent = '...';
                pageNumbersContainer.appendChild(dots);
            }
        }

        // Visible Page Numbers
        for (let i = startPage; i <= endPage; i++) {
            addPageNumButton(i);
        }

        // Last Page Button
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.className = 'page-num dots';
                dots.textContent = '...';
                pageNumbersContainer.appendChild(dots);
            }
            addPageNumButton(totalPages);
        }
    }

    function addPageNumButton(num) {
        const btn = document.createElement('button');
        btn.className = `page-num ${num === currentPage ? 'active' : ''}`;
        btn.textContent = num;
        btn.addEventListener('click', () => {
            currentPage = num;
            renderTable();
        });
        pageNumbersContainer.appendChild(btn);
    }

    // Pagination Listeners
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredDataset.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // ==========================================
    // 7. DETAILS MODAL
    // ==========================================
    function showDetailModal(item) {
        modalType.textContent = item.type;
        modalType.className = `modal-type ${item.type === 'Movie' ? 'badge-movie' : 'badge-tv'}`;
        modalTitle.textContent = item.title;
        modalDesc.textContent = item.description || 'No description available.';
        modalDirector.textContent = item.director;
        modalCast.textContent = item.cast;
        modalRating.textContent = item.rating;
        modalRelease.textContent = item.release_year;
        modalDuration.textContent = item.duration;
        modalDate.textContent = item.date_added || 'Unknown';
        modalCountry.textContent = item.country;

        // Render genre pills
        modalGenres.innerHTML = '';
        if (item.listed_in) {
            item.listed_in.split(', ').forEach(genre => {
                const span = document.createElement('span');
                span.className = 'genre-tag';
                span.textContent = genre;
                modalGenres.appendChild(span);
            });
        }

        detailsModal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Disable background scrolling
    }

    function closeModal() {
        detailsModal.classList.remove('open');
        document.body.style.overflow = ''; // Re-enable background scrolling
    }

    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside content area
    window.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            closeModal();
        }
    });

    // Close modal on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailsModal.classList.contains('open')) {
            closeModal();
        }
    });

    // ==========================================
    // 8. RUN INITIALIZATION
    // ==========================================
    initializeDashboard();
});
