/**
 * VisualCMS Standalone Scripts - Refactored
 */


// Mobile Navigation Toggle
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.querySelector('.hamburger-icon');
  const close = document.querySelector('.close-icon');

  if (menu) {
    if (menu.style.display === 'none' || menu.style.display === '') {
      menu.style.display = 'flex';
      menu.classList.add('active');
      if (hamburger) hamburger.style.display = 'none';
      if (close) close.style.display = 'block';
    } else {
      menu.style.display = 'none';
      menu.classList.remove('active');
      if (hamburger) hamburger.style.display = 'block';
      if (close) close.style.display = 'none';
    }
  }
}

// Ensure mobile menu resets on window resize
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) {
    const menu = document.getElementById('mobile-menu');
    const hamburger = document.querySelector('.hamburger-icon');
    const close = document.querySelector('.close-icon');

    if (menu) {
      menu.style.display = 'none';
      menu.classList.remove('active');
    }
    if (hamburger) hamburger.style.display = 'block';
    if (close) close.style.display = 'none';
  }
});

// =======================================


// Accordion Block - Event Delegation
document.addEventListener('click', function(e) {
  const header = e.target.closest('.accordion-header');
  if (!header) return;

  const content = header.nextElementSibling;
  const icon = header.querySelector('.accordion-icon');

  // If content is not found (markup issue), ignore
  if (!content) return;

  if (content.style.maxHeight) {
    content.style.maxHeight = null;
    if (icon) icon.style.transform = 'rotate(0deg)';
  } else {
    content.style.maxHeight = content.scrollHeight + 'px';
    if (icon) icon.style.transform = 'rotate(180deg)';
  }
});

// =======================================


/**
 * Language Switcher - Inline Flags (No JavaScript required)
 * The language switcher now uses simple inline flags that don't require JavaScript.
 * This provides better accessibility and reliability.
 */
(function() {
  'use strict';

  // No complex functionality needed - just ensure basic accessibility
  // Use event delegation for dynamic content
  document.addEventListener('keydown', function(e) {
    // Check if target is a language flag
    if (e.target && e.target.matches && e.target.matches('.lang-flag')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.target.click();
      }
    }
  });
})();


// =======================================


// Form Handling
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form[data-vcms-form]');
  
  forms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerText : 'Submit';
      const successMsg = form.querySelector('.form-success');
      const errorMsg = form.querySelector('.form-error');
      
      // Reset messages
      if (successMsg) successMsg.style.display = 'none';
      if (errorMsg) errorMsg.style.display = 'none';
      
      // Loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';
      }
      
      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const websiteId = form.dataset.websiteId;
        const apiUrl = form.dataset.apiUrl || '/api/public/submit-form';
        
        // If we are on an exported site, we might need to point to the main CMS
        // The block renderer will set the correct absolute URL if needed
        
        console.log('Form Debug:', {
          apiUrl,
          websiteId,
          formData: data,
          timestamp: new Date().toISOString()
        });

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteId,
            formData: data
          })
        });

        console.log('Form Response:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await response.json();

        console.log('Form Result:', result);

        if (response.ok && result.success) {
          if (successMsg) {
            successMsg.style.display = 'block';
            form.reset();
          } else {
            alert('Message sent successfully!');
            form.reset();
          }
          
          // Redirect if configured
          const redirectUrl = form.dataset.redirectUrl;
          if (redirectUrl) {
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 2000);
          }
        } else {
          throw new Error(result.error || 'Failed to send message');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.innerText = 'Error: ' + error.message;
        } else {
          alert('Failed to send message. Please try again.');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  });
});


// =======================================


/**
 * VisualCMS Booking Handler
 */
(function() {
  const bookingContainers = document.querySelectorAll('[data-vcms-booking]');

  if (bookingContainers.length === 0) return;

  bookingContainers.forEach(container => {
    const config = container.dataset;
    const blockId = config.blockId;
    const websiteId = config.websiteId;
    const apiUrl = config.apiUrl;
    const totalCapacity = parseInt(config.capacity, 10);
    
    // State
    let currentMonth = new Date();
    let selectedDate = null;
    let availability = {};

    // Elements
    const content = container.querySelector('.booking-content');
    
    // Render initial structure
    content.innerHTML = `
      <div style="flex: 1; min-width: 300px;">
        <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <button class="month-nav prev" style="padding: 0.25rem 0.5rem; border: 1px solid #e5e7eb; background: white; border-radius: 0.25rem; cursor: pointer;">&larr;</button>
          <h3 class="current-month" style="font-size: 1.125rem; font-weight: 600;"></h3>
          <button class="month-nav next" style="padding: 0.25rem 0.5rem; border: 1px solid #e5e7eb; background: white; border-radius: 0.25rem; cursor: pointer;">&rarr;</button>
        </div>
        <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem;"></div>
      </div>
      <div class="booking-form-container" style="flex: 1; min-width: 300px; background: #f9fafb; padding: 1.5rem; border-radius: 0.5rem;">
        <div class="placeholder-text" style="height: 100%; display: flex; align-items: center; justify-content: center; color: #6b7280;">Select a date to book.</div>
        <form class="booking-form" style="display: none;">
          <h3 class="form-title" style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;"></h3>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Name</label>
            <input type="text" name="name" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Email</label>
            <input type="email" name="email" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Seats</label>
            <input type="number" name="seats" required min="1" value="1" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
          </div>
          <button type="submit" style="width: 100%; padding: 0.5rem 1rem; background: #4f46e5; color: white; border: none; border-radius: 0.375rem; font-weight: 500; cursor: pointer;">
            ${config.buttonText}
          </button>
          <div class="form-message" style="margin-top: 1rem; padding: 0.75rem; border-radius: 0.375rem; display: none;"></div>
        </form>
      </div>
    `;

    const prevBtn = content.querySelector('.prev');
    const nextBtn = content.querySelector('.next');
    const monthLabel = content.querySelector('.current-month');
    const grid = content.querySelector('.calendar-grid');
    const formContainer = content.querySelector('.booking-form-container');
    const form = content.querySelector('.booking-form');
    const placeholder = content.querySelector('.placeholder-text');
    const formTitle = content.querySelector('.form-title');
    const messageEl = content.querySelector('.form-message');

    // Fetch Availability
    const fetchAvailability = async () => {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      try {
        const res = await fetch(`${apiUrl}/api/bookings/availability?blockId=${blockId}&startDate=${startDate}&endDate=${endDate}`);
        const data = await res.json();
        
        availability = {};
        if (data.data && data.data.availability) {
          data.data.availability.forEach(item => {
            availability[item.date] = item.booked_seats;
          });
        }
        renderCalendar();
      } catch (err) {
        console.error('Failed to fetch availability', err);
      }
    };

    // Render Calendar
    const renderCalendar = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      monthLabel.textContent = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay(); // 0 = Sunday
      
      grid.innerHTML = '';
      
      // Headers
      ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
        grid.innerHTML += `<div style="text-align: center; font-size: 0.75rem; color: #6b7280; padding: 0.25rem;">${d}</div>`;
      });

      // Empty days
      for (let i = 0; i < startingDay; i++) {
        grid.innerHTML += '<div></div>';
      }

      // Days
      const today = new Date();
      today.setHours(0,0,0,0);

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const offset = dateObj.getTimezoneOffset();
        const localDate = new Date(dateObj.getTime() - (offset*60*1000));
        const dateKey = localDate.toISOString().split('T')[0];

        const booked = availability[dateKey] || 0;
        const available = totalCapacity - booked;
        const isPast = localDate < today;
        const isSelected = selectedDate === dateKey;

        const el = document.createElement('button');
        el.style.cssText = `
          padding: 0.25rem; 
          border: 1px solid ${isSelected ? '#4f46e5' : '#e5e7eb'}; 
          border-radius: 0.25rem; 
          background: ${isSelected ? '#4f46e5' : '#fff'}; 
          color: ${isSelected ? '#fff' : '#111827'};
          height: 3.5rem; 
          width: 100%; 
          cursor: ${isPast || available <= 0 ? 'not-allowed' : 'pointer'};
          opacity: ${isPast || available <= 0 ? '0.5' : '1'};
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center;
        `;
        el.disabled = isPast || available <= 0;
        el.innerHTML = `
          <span style="font-weight: 600; font-size: 0.875rem;">${d}</span>
          ${!isPast ? `<span style="font-size: 0.625rem; margin-top: 0.125rem;">${available > 0 ? available + ' left' : 'Full'}</span>` : ''}
        `;

        el.addEventListener('click', () => {
          if (el.disabled) return;
          selectedDate = dateKey;
          renderCalendar(); // Re-render to update selection
          showForm();
        });

        grid.appendChild(el);
      }
    };

    const showForm = () => {
      placeholder.style.display = 'none';
      form.style.display = 'block';
      formTitle.textContent = `Book for ${new Date(selectedDate).toLocaleDateString()}`;
      messageEl.style.display = 'none';
    };

    // Event Listeners
    prevBtn.addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      fetchAvailability();
    });

    nextBtn.addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      fetchAvailability();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking...';
      messageEl.style.display = 'none';

      try {
        const res = await fetch(`${apiUrl}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteId,
            blockId,
            name: formData.get('name'),
            email: formData.get('email'),
            seats: parseInt(formData.get('seats'), 10),
            date: selectedDate,
            totalSeats: totalCapacity,
            recipientEmail: config.recipientEmail
          })
        });

        const data = await res.json();

        if (data.success) {
          messageEl.textContent = 'Booking confirmed! Check your email.';
          messageEl.style.backgroundColor = '#d1fae5';
          messageEl.style.color = '#065f46';
          messageEl.style.display = 'block';
          form.reset();
          selectedDate = null;
          setTimeout(() => {
            fetchAvailability();
            placeholder.style.display = 'flex';
            form.style.display = 'none';
          }, 2000);
        } else {
          throw new Error(data.error || 'Failed to book');
        }
      } catch (err) {
        messageEl.textContent = err.message;
        messageEl.style.backgroundColor = '#fee2e2';
        messageEl.style.color = '#991b1b';
        messageEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = config.buttonText;
      }
    });

    // Init
    fetchAvailability();
  });
})();