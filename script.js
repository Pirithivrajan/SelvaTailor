/**
 * The Master Tailor - Core Logic
 * Handles Data persistence via LocalStorage + Simple Mode DB Insert
 * Implements functionality for User Booking, Design Viewing, and Tailor Admin
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    routePageLogic();
});

// --- Core Data Logic ---

// Initialize data if empty (First run)
function initApp() {
    if (!localStorage.getItem('tailor_designs')) {
        // Seed initial designs
        const initialDesigns = [
            {
                id: 1,
                title: "Classic Navy Bespoke Suit",
                price: 1200,
                days_to_complete: 14,
                category: "Suit",
                description: "Italian wool, hand-stitched lapels, and a perfect custom fit.",
                image_url: "images/suit1.jpg",
                image_type: "suit"
            },
            {
                id: 2,
                title: "Evening Silk Gown",
                price: 850,
                days_to_complete: 21,
                category: "Dress",
                description: "Elegant floor-length silk gown with delicate embroidery.",
                image_url: "images/dress1.jpg",
                image_type: "dress"
            },
            {
                id: 3,
                title: "Summer Linen Ensemble",
                price: 450,
                days_to_complete: 10,
                category: "Casual",
                description: "Breathable linen fabric perfect for summer events.",
                image_url: "images/fabric1.jpg",
                image_type: "fabric"
            }
        ];
        localStorage.setItem('tailor_designs', JSON.stringify(initialDesigns));
    }

    if (!localStorage.getItem('tailor_bookings')) {
        localStorage.setItem('tailor_bookings', JSON.stringify([]));
    }
}

// Helpers to get/set data
function getDesigns() {
    return JSON.parse(localStorage.getItem('tailor_designs') || '[]');
}

function getBookings() {
    return JSON.parse(localStorage.getItem('tailor_bookings') || '[]');
}

function saveDesign(design) {
    const designs = getDesigns();
    design.id = Date.now(); // Simple ID generation
    // Map type to image path for demo purposes if not real upload
    if (!design.image_url) {
        design.image_url = `images/${design.image_type || 'suit'}1.jpg`;
    }
    designs.push(design);
    localStorage.setItem('tailor_designs', JSON.stringify(designs));
    
    // Also try to save to platform DB for requirements
    try {
        if (window.LeadGenRuntime && window.LeadGenRuntime.insertData) {
            window.LeadGenRuntime.insertData('designs', design);
        }
    } catch(e) { console.log("Platform DB not available, using localStorage"); }
}

function deleteDesign(id) {
    let designs = getDesigns();
    designs = designs.filter(d => d.id != id);
    localStorage.setItem('tailor_designs', JSON.stringify(designs));
}

function saveBooking(booking) {
    const bookings = getBookings();
    booking.id = Date.now();
    booking.created_at = new Date().toISOString();
    booking.status = 'confirmed';
    bookings.push(booking);
    localStorage.setItem('tailor_bookings', JSON.stringify(bookings));

    // Also try to save to platform DB for requirements
    try {
        if (window.LeadGenRuntime && window.LeadGenRuntime.insertData) {
            window.LeadGenRuntime.insertData('bookings', booking);
        }
    } catch(e) { console.log("Platform DB not available"); }
}

// --- Page Routing Logic ---

function routePageLogic() {
    const path = window.location.pathname;
    
    if (path.includes('designs.html')) {
        renderDesignsPage();
    } else if (path.includes('booking.html')) {
        initBookingPage();
    } else if (path.includes('tailor-login.html')) {
        initLoginPage();
    } else if (path.includes('tailor-dashboard.html')) {
        initDashboardPage();
    }
}

// --- Public: Designs Page ---

function renderDesignsPage() {
    const grid = document.getElementById('designs-grid');
    if (!grid) return;

    const designs = getDesigns();
    
    if (designs.length === 0) {
        grid.innerHTML = '<p class="no-data">No designs available yet. Please check back later.</p>';
        return;
    }

    grid.innerHTML = designs.map(d => `
        <div class="design-card">
            <img src="${d.image_url}" alt="${d.title}" class="design-image">
            <div class="design-details">
                <div class="design-price">$${d.price}</div>
                <h3>${d.title}</h3>
                <p class="design-meta">Wait time: ${d.days_to_complete} days • ${d.category}</p>
                <p>${d.description}</p>
                <a href="booking.html?design=${d.id}" class="btn btn-primary btn-block" style="margin-top:1rem">Book Fitting</a>
            </div>
        </div>
    `).join('');
}

// --- Public: Booking Page ---

function initBookingPage() {
    const form = document.getElementById('bookingForm');
    const designSelect = document.getElementById('design_select');
    const dateInput = document.getElementById('booking_date');
    const timeSelect = document.getElementById('booking_time');

    if (!form) return;

    // Populate Designs Dropdown
    const designs = getDesigns();
    designs.forEach(d => {
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = `${d.title} ($${d.price})`;
        designSelect.appendChild(option);
    });

    // Pre-select if passed in URL
    const urlParams = new URLSearchParams(window.location.search);
    const preSelected = urlParams.get('design');
    if (preSelected) {
        designSelect.value = preSelected;
        updateEstimate(preSelected);
    }

    designSelect.addEventListener('change', (e) => updateEstimate(e.target.value));

    function updateEstimate(id) {
        const d = designs.find(x => x.id == id);
        const hint = document.getElementById('completion-estimate');
        if (d) {
            hint.textContent = `Estimated completion: ${d.days_to_complete} days from fitting.`;
        } else {
            hint.textContent = '';
        }
    }

    // Time Slot Logic
    dateInput.addEventListener('change', () => {
        const date = dateInput.value;
        if (!date) return;

        timeSelect.innerHTML = '<option value="">Select Time</option>';
        timeSelect.disabled = false;

        // Define business hours 10am - 6pm
        const slots = [
            "10:00 AM", "11:00 AM", "12:00 PM", 
            "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
        ];

        // Get taken slots for this date
        const bookings = getBookings();
        const takenSlots = bookings
            .filter(b => b.booking_date === date)
            .map(b => b.booking_time);

        slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            if (takenSlots.includes(slot)) {
                option.disabled = true;
                option.textContent += " (Booked)";
            }
            timeSelect.appendChild(option);
        });
    });

    // Handle Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Final Check for Slot Availability
        const bookings = getBookings();
        const isTaken = bookings.some(b => 
            b.booking_date === data.booking_date && 
            b.booking_time === data.booking_time
        );

        if (isTaken) {
            alert("Sorry, that slot was just booked! Please choose another.");
            // Refresh slots
            dateInput.dispatchEvent(new Event('change'));
            return;
        }

        saveBooking(data);

        // Show success
        form.classList.add('hidden');
        const success = document.getElementById('booking-success');
        success.classList.remove('hidden');
        
        document.getElementById('summary-date').textContent = data.booking_date;
        document.getElementById('summary-time').textContent = data.booking_time;
        
        // Calc delivery date roughly
        const design = designs.find(d => d.id == data.design_id);
        const days = design ? design.days_to_complete : 14;
        const deliveryDate = new Date(data.booking_date);
        deliveryDate.setDate(deliveryDate.getDate() + parseInt(days));
        document.getElementById('summary-delivery').textContent = deliveryDate.toLocaleDateString();
    });

    document.getElementById('new-booking-btn').addEventListener('click', () => {
        window.location.reload();
    });
}

// --- Admin: Login ---

function initLoginPage() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const error = document.getElementById('login-error');

        // Hardcoded secure check as per prompt
        if (user === 'TAILOR2006' && pass === 'Tailor@2006') {
            sessionStorage.setItem('isTailorLoggedIn', 'true');
            window.location.href = 'tailor-dashboard.html';
        } else {
            error.classList.remove('hidden');
        }
    });
}

// --- Admin: Dashboard ---

function initDashboardPage() {
    // Auth Check
    if (sessionStorage.getItem('isTailorLoggedIn') !== 'true') {
        window.location.href = 'tailor-login.html';
        return;
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('isTailorLoggedIn');
        window.location.href = 'index.html';
    });

    // Tab Switching
    const links = document.querySelectorAll('.tab-link');
    const tabs = document.querySelectorAll('.tab-content');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-tab');
            
            // UI Toggle
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(`${targetId}-tab`).classList.add('active');

            // Refresh Data
            if (targetId === 'bookings') renderBookingsTable();
            if (targetId === 'designs') renderAdminDesigns();
        });
    });

    // Initial Render
    renderBookingsTable();
    renderAdminDesigns();
    initAddDesignForm();
}

function renderBookingsTable() {
    const tbody = document.querySelector('#bookings-table tbody');
    const bookings = getBookings();
    
    // Update Stats
    document.getElementById('total-bookings').textContent = bookings.length;
    document.getElementById('upcoming-bookings').textContent = bookings.length; // Simplified

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No bookings found.</td></tr>';
        return;
    }

    const designs = getDesigns();

    tbody.innerHTML = bookings.map(b => {
        const design = designs.find(d => d.id == b.design_id);
        const designName = design ? design.title : 'Consultation Only';
        
        return `
        <tr>
            <td>${b.booking_date} <br> <small>${b.booking_time}</small></td>
            <td>${b.customer_name}</td>
            <td>${b.customer_mobile}</td>
            <td>${designName}</td>
            <td><span style="color:green; font-weight:bold">${b.status}</span></td>
        </tr>
    `}).join('');
}

function renderAdminDesigns() {
    const list = document.getElementById('admin-designs-list');
    const designs = getDesigns();

    list.innerHTML = designs.map(d => `
        <div class="design-card">
            <div style="height: 150px; overflow: hidden;">
                <img src="${d.image_url}" style="width:100%; height:100%; object-fit:cover">
            </div>
            <div style="padding:1rem">
                <h4>${d.title}</h4>
                <p>$${d.price} • ${d.category}</p>
                <button onclick="deleteDesignClick(${d.id})" class="btn btn-outline" style="width:100%; margin-top:0.5rem; color:red; border-color:red">Delete</button>
            </div>
        </div>
    `).join('');
    
    // Expose delete function to window for onclick
    window.deleteDesignClick = function(id) {
        if (confirm('Delete this design?')) {
            deleteDesign(id);
            renderAdminDesigns();
        }
    };
}

function initAddDesignForm() {
    const btn = document.getElementById('add-design-btn');
    const panel = document.getElementById('add-design-panel');
    const cancel = document.getElementById('cancel-design');
    const form = document.getElementById('addDesignForm');

    btn.addEventListener('click', () => panel.classList.remove('hidden'));
    cancel.addEventListener('click', () => panel.classList.add('hidden'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convert numeric strings
        data.price = parseFloat(data.price);
        data.days_to_complete = parseInt(data.days_to_complete);

        saveDesign(data);
        
        form.reset();
        panel.classList.add('hidden');
        renderAdminDesigns();
        alert('Design Added Successfully!');
    });
}