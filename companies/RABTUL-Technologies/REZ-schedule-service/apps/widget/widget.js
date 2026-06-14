// ReZ Schedule - Embeddable Booking Widget
// Usage: <script src="https://your-domain.com/widget.js" data-username="glamstudio" data-slug="haircut-styling"></script>

(function() {
  // Configuration
  const API_BASE = window.REZ_SCHEDULE_API || 'http://localhost:4080/api';

  // Create styles
  const styles = document.createElement('style');
  styles.textContent = `
    .rez-schedule-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 480px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .rez-schedule-header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .rez-schedule-header h3 {
      margin: 0 0 8px;
      font-size: 18px;
    }
    .rez-schedule-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .rez-schedule-content {
      padding: 20px;
    }
    .rez-schedule-date-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 16px;
    }
    .rez-schedule-date {
      text-align: center;
      padding: 8px 4px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .rez-schedule-date:hover:not(.disabled) {
      background: #f3f4f6;
    }
    .rez-schedule-date.selected {
      background: #6366f1;
      color: white;
    }
    .rez-schedule-date.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .rez-schedule-date-day {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .rez-schedule-date-num {
      font-size: 16px;
      font-weight: 600;
    }
    .rez-schedule-time-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    }
    .rez-schedule-time-slot {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }
    .rez-schedule-time-slot:hover:not(.disabled) {
      border-color: #6366f1;
    }
    .rez-schedule-time-slot.selected {
      background: #6366f1;
      color: white;
      border-color: #6366f1;
    }
    .rez-schedule-time-slot.disabled {
      opacity: 0.4;
      cursor: not-allowed;
      text-decoration: line-through;
    }
    .rez-schedule-form {
      display: none;
    }
    .rez-schedule-form.active {
      display: block;
    }
    .rez-schedule-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .rez-schedule-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .rez-schedule-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .rez-schedule-btn:hover {
      opacity: 0.9;
    }
    .rez-schedule-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .rez-schedule-success {
      text-align: center;
      padding: 32px;
      display: none;
    }
    .rez-schedule-success.active {
      display: block;
    }
    .rez-schedule-success-icon {
      width: 64px;
      height: 64px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 32px;
    }
    .rez-schedule-loading {
      text-align: center;
      padding: 40px;
    }
    .rez-schedule-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: rez-spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes rez-spin {
      to { transform: rotate(360deg); }
    }
    .rez-schedule-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .rez-schedule-nav-btn {
      padding: 8px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      cursor: pointer;
    }
    .rez-schedule-nav-btn:hover {
      background: #e5e7eb;
    }
  `;
  document.head.appendChild(styles);

  // Widget class
  class ReZScheduleWidget {
    constructor(config) {
      this.container = config.container;
      this.username = config.username;
      this.slug = config.slug;
      this.eventType = null;
      this.slots = [];
      this.selectedDate = null;
      this.selectedSlot = null;
      this.step = 'loading';

      this.render();
    }

    async init() {
      try {
        const res = await fetch(`${API_BASE}/event-types/public/${this.username}/${this.slug}`);
        const data = await res.json();

        if (data.success) {
          this.eventType = data.data;
          this.step = 'date';
          this.render();
        } else {
          this.renderError(data.error || 'Failed to load');
        }
      } catch (err) {
        this.renderError('Network error');
      }
    }

    render() {
      switch (this.step) {
        case 'loading':
          this.renderLoading();
          break;
        case 'date':
          this.renderDatePicker();
          break;
        case 'time':
          this.renderTimeSlots();
          break;
        case 'form':
          this.renderForm();
          break;
        case 'success':
          this.renderSuccess();
          break;
        case 'error':
          this.renderError('Something went wrong');
          break;
      }
    }

    renderLoading() {
      this.container.innerHTML = `
        <div class="rez-schedule-loading">
          <div class="rez-schedule-spinner"></div>
          <p>Loading...</p>
        </div>
      `;
    }

    renderDatePicker() {
      const today = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let datesHtml = '';

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const isPast = date < today;

        datesHtml += `
          <div class="rez-schedule-date ${isPast ? 'disabled' : ''}" data-date="${date.toISOString()}">
            <div class="rez-schedule-date-day">${days[date.getDay()]}</div>
            <div class="rez-schedule-date-num">${date.getDate()}</div>
          </div>
        `;
      }

      this.container.innerHTML = `
        <div class="rez-schedule-header">
          <h3>${this.eventType.title}</h3>
          <p>with ${this.eventType.user.name} · ${this.eventType.duration} min</p>
        </div>
        <div class="rez-schedule-content">
          <h4 style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">Select a Date</h4>
          <div class="rez-schedule-date-grid">
            ${datesHtml}
          </div>
        </div>
      `;

      this.container.querySelectorAll('.rez-schedule-date:not(.disabled)').forEach(el => {
        el.onclick = () => this.selectDate(new Date(el.dataset.date));
      });
    }

    async selectDate(date) {
      this.selectedDate = date;
      this.step = 'loading';
      this.render();

      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 1);

      try {
        const res = await fetch(
          `${API_BASE}/availability/${this.username}/${this.slug}?startDate=${date.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const data = await res.json();

        if (data.success && data.data.slots) {
          this.slots = data.data.slots.filter(s => s.available);
          this.step = 'time';
        } else {
          this.slots = [];
          this.step = 'time';
        }
        this.render();
      } catch (err) {
        this.renderError('Failed to load slots');
      }
    }

    renderTimeSlots() {
      let slotsHtml = '';

      if (this.slots.length === 0) {
        slotsHtml = '<p style="text-align: center; color: #6b7280; grid-column: span 3;">No available slots</p>';
      } else {
        this.slots.forEach((slot, i) => {
          const time = new Date(slot.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          slotsHtml += `<div class="rez-schedule-time-slot" data-slot="${i}">${time}</div>`;
        });
      }

      this.container.innerHTML = `
        <div class="rez-schedule-header">
          <h3>${this.eventType.title}</h3>
          <p>${this.selectedDate.toLocaleDateString()} · ${this.eventType.duration} min</p>
        </div>
        <div class="rez-schedule-content">
          <h4 style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">Select a Time</h4>
          <div class="rez-schedule-time-grid">
            ${slotsHtml}
          </div>
        </div>
      `;

      this.container.querySelectorAll('.rez-schedule-time-slot').forEach(el => {
        el.onclick = () => {
          const idx = parseInt(el.dataset.slot);
          this.selectSlot(this.slots[idx]);
        };
      });
    }

    selectSlot(slot) {
      this.selectedSlot = slot;
      this.step = 'form';
      this.render();
    }

    renderForm() {
      this.container.innerHTML = `
        <div class="rez-schedule-header">
          <h3>${this.eventType.title}</h3>
          <p>${new Date(this.selectedSlot.startTime).toLocaleString()}</p>
        </div>
        <div class="rez-schedule-content">
          <h4 style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">Your Details</h4>
          <input type="text" class="rez-schedule-input" id="rez-name" placeholder="Your name" required>
          <input type="email" class="rez-schedule-input" id="rez-email" placeholder="Email address" required>
          <input type="tel" class="rez-schedule-input" id="rez-phone" placeholder="Phone (optional)">
          <button class="rez-schedule-btn" onclick="widget.confirmBooking()">Confirm Booking</button>
        </div>
      `;
    }

    async confirmBooking() {
      const name = document.getElementById('rez-name').value;
      const email = document.getElementById('rez-email').value;
      const phone = document.getElementById('rez-phone').value;

      if (!name || !email) {
        alert('Please fill in required fields');
        return;
      }

      const btn = this.container.querySelector('.rez-schedule-btn');
      btn.disabled = true;
      btn.textContent = 'Booking...';

      try {
        const res = await fetch(`${API_BASE}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventTypeId: this.eventType.id,
            startTime: this.selectedSlot.startTime,
            endTime: this.selectedSlot.endTime,
            attendeeName: name,
            attendeeEmail: email,
            attendeePhone: phone || undefined,
          }),
        });

        const data = await res.json();

        if (data.success) {
          this.step = 'success';
          this.bookingUid = data.data.uid;
          this.render();
        } else {
          this.renderError(data.error || 'Booking failed');
        }
      } catch (err) {
        this.renderError('Network error');
      }
    }

    renderSuccess() {
      this.container.innerHTML = `
        <div class="rez-schedule-content">
          <div class="rez-schedule-success active">
            <div class="rez-schedule-success-icon">✓</div>
            <h3 style="margin: 0 0 8px;">Booking Confirmed!</h3>
            <p style="color: #6b7280; margin-bottom: 16px;">You will receive a confirmation email shortly.</p>
            <p style="font-size: 14px; color: #6b7280;">Booking ID: ${this.bookingUid}</p>
          </div>
        </div>
      `;
    }

    renderError(message) {
      this.container.innerHTML = `
        <div class="rez-schedule-content">
          <div style="text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 16px;">😕</div>
            <h3 style="margin: 0 0 8px;">Oops!</h3>
            <p style="color: #6b7280; margin-bottom: 16px;">${message}</p>
            <button class="rez-schedule-btn" onclick="location.reload()">Try Again</button>
          </div>
        </div>
      `;
    }
  }

  // Initialize widgets
  window.ReZScheduleWidget = ReZScheduleWidget;

  document.querySelectorAll('[data-rez-schedule]').forEach(el => {
    const username = el.dataset.rezUsername;
    const slug = el.dataset.rezSlug;
    if (username && slug) {
      new ReZScheduleWidget({ container: el, username, slug }).init();
    }
  });
})();
