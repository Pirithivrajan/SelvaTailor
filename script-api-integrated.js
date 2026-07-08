/**
 * SelvaTailor Frontend Logic - API Integrated
 * Replaces localStorage with Backend API calls
 * Import this after apiClient.js
 */

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  routePageLogic();
});

async function initApp() {
  console.log('🚀 Initializing SelvaTailor App');
  // App initialization can happen here if needed
  // Backend has persistent data, so no need for seed data
}

// ============ PAGE ROUTING ============
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

// ============ PUBLIC: DESIGNS PAGE ============
async function renderDesignsPage() {
  const grid = document.getElementById('designs-grid');
  if (!grid) return;

  try {
    grid.innerHTML = '<div class="loading">Loading designs...</div>';
    
    const response = await API.designs.getAll();
    const designs = response.designs || [];

    if (designs.length === 0) {
      grid.innerHTML = '<p class="no-data">No designs available yet. Please check back later.</p>';
      return;
    }

    grid.innerHTML = designs
      .map(d => `
        <div class="design-card">
          <img src="${d.imageUrl || 'images/suit1.jpg'}" alt="${d.title}" class="design-image">
          <div class="design-details">
            <div class="design-price">$${d.price}</div>
            <h3>${d.title}</h3>
            <p class="design-meta">
              Wait time: ${d.daysToComplete} days • ${d.category}
            </p>
            <p>${d.description}</p>
            <a href="booking.html?design=${d._id}" class="btn btn-primary btn-block" style="margin-top:1rem">
              Book Fitting
            </a>
          </div>
        </div>
      `)
      .join('');
  } catch (error) {
    console.error('Error loading designs:', error);
    grid.innerHTML = `<p class="error">Failed to load designs. ${error.message}</p>`;
  }
}

// ============ PUBLIC: BOOKING PAGE ============
async function initBookingPage() {
  const form = document.getElementById('bookingForm');
  const designSelect = document.getElementById('design_select');
  const dateInput = document.getElementById('booking_date');
  const timeSelect = document.getElementById('booking_time');

  if (!form) return;

  try {
    // Load designs from API
    const response = await API.designs.getAll();
    const designs = response.designs || [];

    // Populate design dropdown
    designSelect.innerHTML = '<option value="">Select a Design</option>';
    designs.forEach(d => {
      const option = document.createElement('option');
      option.value = d._id;
      option.textContent = `${d.title} ($${d.price})`;
      designSelect.appendChild(option);
    });

    // Pre-select design if passed in URL
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedId = urlParams.get('design');
    if (preSelectedId) {
      designSelect.value = preSelectedId;
      updateEstimate(preSelectedId, designs);
    }

    // Update estimate when design changes
    designSelect.addEventListener('change', (e) => updateEstimate(e.target.value, designs));

    // Load time slots when date changes
    dateInput.addEventListener('change', async () => {
      const date = dateInput.value;
      if (!date) return;
      await loadTimeSlots(date, timeSelect);
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitBooking(form, designs, dateInput, timeSelect);
    });

    // New booking button
    document.getElementById('new-booking-btn').addEventListener('click', () => {
      window.location.reload();
    });
  } catch (error) {
    console.error('Error initializing booking page:', error);
    form.innerHTML = `<div class="error">Failed to load booking form. ${error.message}</div>`;
  }
}

function updateEstimate(designId, designs) {
  const design = designs.find(d => d._id === designId);
  const hint = document.getElementById('completion-estimate');
  if (design) {
    hint.textContent = `Estimated completion: ${design.daysToComplete} days from fitting.`;
  } else {
    hint.textContent = '';
  }
}

async function loadTimeSlots(date, timeSelect) {
  try {
    // Get all bookings for this date
    const response = await API.bookings.getAll();
    const bookings = response.bookings || [];
    
    const takenSlots = bookings
      .filter(b => new Date(b.bookingDate).toISOString().split('T')[0] === date)
      .map(b => b.bookingTime);

    // Define business hours
    const slots = [
      '10:00 AM', '11:00 AM', '12:00 PM',
      '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    timeSelect.innerHTML = '<option value="">Select Time</option>';
    timeSelect.disabled = false;

    slots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot;
      option.textContent = slot;
      if (takenSlots.includes(slot)) {
        option.disabled = true;
        option.textContent += ' (Booked)';
      }
      timeSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading time slots:', error);
    timeSelect.innerHTML = `<option>Error loading slots</option>`;
  }
}

async function submitBooking(form, designs, dateInput, timeSelect) {
  try {
    const formData = new FormData(form);
    const bookingData = {
      customerName: formData.get('customer_name'),
      customerPhone: formData.get('customer_mobile'),
      customerEmail: formData.get('customer_email'),
      customerAddress: formData.get('customer_address'),
      designId: formData.get('design_id'),
      bookingDate: dateInput.value,
      bookingTime: formData.get('booking_time')
    };

    // Submit booking to API
    const response = await API.bookings.create(bookingData);

    if (response.success) {
      // Show success message
      form.classList.add('hidden');
      const success = document.getElementById('booking-success');
      success.classList.remove('hidden');

      document.getElementById('summary-date').textContent = bookingData.bookingDate;
      document.getElementById('summary-time').textContent = bookingData.bookingTime;

      // Calculate delivery date
      const design = designs.find(d => d._id === bookingData.designId);
      const days = design ? design.daysToComplete : 14;
      const deliveryDate = new Date(bookingData.bookingDate);
      deliveryDate.setDate(deliveryDate.getDate() + parseInt(days));
      document.getElementById('summary-delivery').textContent = deliveryDate.toLocaleDateString();
    } else {
      alert('Booking failed: ' + (response.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error submitting booking:', error);
    alert('Failed to create booking: ' + error.message);
  }
}

// ============ ADMIN: LOGIN PAGE ============
function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('login-error');

    try {
      error.classList.add('hidden');
      const response = await API.auth.login(loginId, password);

      if (response.token) {
        // Store token and redirect
        API.tokenManager.setToken(response.token);
        window.location.href = 'tailor-dashboard.html';
      } else {
        error.textContent = response.message || 'Login failed';
        error.classList.remove('hidden');
      }
    } catch (err) {
      error.textContent = err.message || 'Invalid credentials';
      error.classList.remove('hidden');
    }
  });
}

// ============ ADMIN: DASHBOARD PAGE ============
async function initDashboardPage() {
  // Auth check
  if (!API.tokenManager.isAuthenticated()) {
    window.location.href = 'tailor-login.html';
    return;
  }

  try {
    // Load initial data
    await refreshDashboard();

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
      API.tokenManager.clearToken();
      window.location.href = 'index.html';
    });

    // Tab switching
    const links = document.querySelectorAll('.tab-link');
    const tabs = document.querySelectorAll('.tab-content');

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-tab');

        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        tabs.forEach(t => t.classList.remove('active'));
        document.getElementById(`${targetId}-tab`).classList.add('active');

        if (targetId === 'bookings') renderBookingsTable();
        if (targetId === 'designs') renderAdminDesigns();
      });
    });

    // Add design form
    initAddDesignForm();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    document.body.innerHTML = `<div class="error">Failed to load dashboard: ${error.message}</div>`;
  }
}

async function refreshDashboard() {
  await renderBookingsTable();
  await renderAdminDesigns();
  await loadDashboardStats();
}

async function renderBookingsTable() {
  const tbody = document.querySelector('#bookings-table tbody');
  if (!tbody) return;

  try {
    const response = await API.bookings.getAll();
    const bookings = response.bookings || [];

    // Update stats
    const statsResponse = await API.tailors.getDashboardStats();
    if (statsResponse.stats) {
      document.getElementById('total-bookings').textContent = statsResponse.stats.totalBookings || bookings.length;
      document.getElementById('upcoming-bookings').textContent = statsResponse.stats.upcomingBookings || bookings.length;
    }

    if (bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No bookings found.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings
      .map(b => `
        <tr>
          <td>
            ${new Date(b.bookingDate).toLocaleDateString()} 
            <br> 
            <small>${b.bookingTime}</small>
          </td>
          <td>${b.customerName}</td>
          <td>${b.customerPhone}</td>
          <td>${b.design?.title || 'N/A'}</td>
          <td><span style="color:green; font-weight:bold">${b.status}</span></td>
        </tr>
      `)
      .join('');
  } catch (error) {
    console.error('Error rendering bookings:', error);
    tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error loading bookings: ${error.message}</td></tr>`;
  }
}

async function renderAdminDesigns() {
  const list = document.getElementById('admin-designs-list');
  if (!list) return;

  try {
    const response = await API.designs.getAll();
    const designs = response.designs || [];

    list.innerHTML = designs
      .map(d => `
        <div class="design-card">
          <div style="height: 150px; overflow: hidden;">
            <img src="${d.imageUrl || 'images/suit1.jpg'}" style="width:100%; height:100%; object-fit:cover">
          </div>
          <div style="padding:1rem">
            <h4>${d.title}</h4>
            <p>$${d.price} • ${d.category}</p>
            <button onclick="deleteDesignClick('${d._id}')" class="btn btn-outline" 
              style="width:100%; margin-top:0.5rem; color:red; border-color:red">
              Delete
            </button>
          </div>
        </div>
      `)
      .join('');

    // Expose delete function to window for onclick
    window.deleteDesignClick = async function(id) {
      if (confirm('Delete this design?')) {
        try {
          await API.designs.delete(id);
          await renderAdminDesigns();
          alert('Design deleted successfully!');
        } catch (error) {
          alert('Failed to delete design: ' + error.message);
        }
      }
    };
  } catch (error) {
    console.error('Error rendering designs:', error);
    list.innerHTML = `<div class="error">Failed to load designs: ${error.message}</div>`;
  }
}

async function initAddDesignForm() {
  const btn = document.getElementById('add-design-btn');
  const panel = document.getElementById('add-design-panel');
  const cancel = document.getElementById('cancel-design');
  const form = document.getElementById('addDesignForm');

  if (!form) return;

  btn.addEventListener('click', () => panel.classList.remove('hidden'));
  cancel.addEventListener('click', () => panel.classList.add('hidden'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const designData = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      category: formData.get('category'),
      daysToComplete: parseInt(formData.get('days_to_complete')),
      imageUrl: formData.get('image_url') || 'images/suit1.jpg'
    };

    try {
      const response = await API.designs.create(designData);
      if (response.success) {
        form.reset();
        panel.classList.add('hidden');
        await renderAdminDesigns();
        alert('Design added successfully!');
      } else {
        alert('Failed to add design: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error adding design: ' + error.message);
    }
  });
}

async function loadDashboardStats() {
  try {
    const response = await API.tailors.getDashboardStats();
    if (response.stats) {
      const stats = response.stats;
      // Update stat cards if they exist
      if (document.getElementById('total-revenue')) {
        document.getElementById('total-revenue').textContent = '$' + (stats.totalRevenue || 0);
      }
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}
