class CoffeeTracker {
    constructor() {
        this.coffeeData = JSON.parse(localStorage.getItem('coffeeData')) || [];
        this.currentPeriod = 'weekly';
        this.dailyLimit = 4;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.setCurrentTime();
    }

    setupEventListeners() {
        // Add coffee button
        document.getElementById('addCoffeeBtn').addEventListener('click', () => {
            this.showAddForm();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetToday();
        });

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddForm();
        });

        // Coffee form submission
        document.getElementById('coffeeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCoffee();
        });

        // History tab buttons
        document.querySelectorAll('.history-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.history-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.renderHistoryChart();
            });
        });

        // Re-render chart on window resize for responsiveness
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.renderHistoryChart();
            }, 200);
        });
    }

    showAddForm() {
        document.getElementById('addCoffeeForm').style.display = 'block';
        document.getElementById('addCoffeeForm').scrollIntoView({ behavior: 'smooth' });
        this.setCurrentTime();
    }

    hideAddForm() {
        document.getElementById('addCoffeeForm').style.display = 'none';
        this.clearForm();
    }

    setCurrentTime() {
        const now = new Date();
        const timeString = now.toTimeString().slice(0, 5);
        document.getElementById('coffeeTime').value = timeString;
    }

    addCoffee() {
        const type = document.getElementById('coffeeType').value;
        const size = document.getElementById('coffeeSize').value;
        const time = document.getElementById('coffeeTime').value;
        const notes = document.getElementById('coffeeNotes').value;

        if (!type || !size || !time) {
            alert('Please fill in all required fields');
            return;
        }

        const coffee = {
            id: Date.now(),
            type,
            size,
            time,
            notes,
            date: new Date().toDateString()
        };

        this.coffeeData.push(coffee);
        this.saveData();
        this.updateDisplay();
        this.hideAddForm();
        
        // Show success message
        this.showNotification('Coffee added successfully! ☕');
    }

    deleteCoffee(id) {
        if (confirm('Are you sure you want to delete this coffee entry?')) {
            this.coffeeData = this.coffeeData.filter(coffee => coffee.id !== id);
            this.saveData();
            this.updateDisplay();
            this.showNotification('Coffee entry deleted');
        }
    }

    resetToday() {
        if (confirm('Are you sure you want to reset today\'s coffee count?')) {
            const today = new Date().toDateString();
            this.coffeeData = this.coffeeData.filter(coffee => coffee.date !== today);
            this.saveData();
            this.updateDisplay();
            this.showNotification('Today\'s coffee count has been reset');
        }
    }

    getTodaysCoffee() {
        const today = new Date().toDateString();
        return this.coffeeData.filter(coffee => coffee.date === today);
    }

    updateDisplay() {
        this.updateTodayCount();
        this.updateCoffeeList();
        this.updateStatistics();
        this.renderHistoryChart();
    }

    updateTodayCount() {
        const todaysCoffee = this.getTodaysCoffee();
        document.getElementById('todayCount').textContent = todaysCoffee.length;
    }

    updateCoffeeList() {
        const coffeeList = document.getElementById('coffeeList');
        const todaysCoffee = this.getTodaysCoffee();

        if (todaysCoffee.length === 0) {
            coffeeList.innerHTML = '<p class="empty-message">No coffee recorded today. Add your first cup!</p>';
            return;
        }

        // Sort by time (latest first)
        todaysCoffee.sort((a, b) => {
            const timeA = new Date(`2000/01/01 ${a.time}`);
            const timeB = new Date(`2000/01/01 ${b.time}`);
            return timeB - timeA;
        });

        coffeeList.innerHTML = todaysCoffee.map(coffee => `
            <div class="coffee-item">
                <div class="coffee-meta">
                    <div class="coffee-details">
                        <div class="coffee-type">${coffee.type}</div>
                        <div class="coffee-size">${coffee.size}</div>
                        ${coffee.notes ? `<div class="coffee-notes">"${coffee.notes}"</div>` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="coffee-time">${this.formatTime(coffee.time)}</div>
                        <button class="delete-btn" onclick="tracker.deleteCoffee(${coffee.id})" title="Delete this entry">×</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateStatistics() {
        const totalCups = this.coffeeData.length;
        document.getElementById('totalCups').textContent = totalCups;

        // Calculate average per day
        if (totalCups === 0) {
            document.getElementById('avgPerDay').textContent = '0';
            document.getElementById('favoriteType').textContent = '-';
            return;
        }

        const dates = [...new Set(this.coffeeData.map(coffee => coffee.date))];
        const avgPerDay = (totalCups / dates.length).toFixed(1);
        document.getElementById('avgPerDay').textContent = avgPerDay;

        // Find favorite coffee type
        const typeCount = {};
        this.coffeeData.forEach(coffee => {
            typeCount[coffee.type] = (typeCount[coffee.type] || 0) + 1;
        });

        const favoriteType = Object.keys(typeCount).reduce((a, b) => 
            typeCount[a] > typeCount[b] ? a : b
        );
        document.getElementById('favoriteType').textContent = favoriteType;
    }

    formatTime(time24) {
        const [hours, minutes] = time24.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }

    clearForm() {
        document.getElementById('coffeeForm').reset();
    }

    saveData() {
        localStorage.setItem('coffeeData', JSON.stringify(this.coffeeData));
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        // Add CSS animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getHistoryData(days) {
        const result = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toDateString();
            const count = this.coffeeData.filter(c => c.date === dateStr).length;
            result.push({ date, dateStr, count });
        }
        return result;
    }

    renderHistoryChart() {
        const canvas = document.getElementById('historyChart');
        if (!canvas) return;

        const days = this.currentPeriod === 'monthly' ? 30 : 7;
        const data = this.getHistoryData(days);
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size to fill container
        const container = canvas.parentElement;
        const cssWidth = container.clientWidth || 700;
        const cssHeight = Math.max(200, Math.min(300, cssWidth * 0.4));

        canvas.style.width = cssWidth + 'px';
        canvas.style.height = cssHeight + 'px';
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const W = cssWidth;
        const H = cssHeight;

        // Layout constants
        const paddingTop = 20;
        const paddingBottom = 45;
        const paddingLeft = 40;
        const paddingRight = 15;
        const chartWidth = W - paddingLeft - paddingRight;
        const chartHeight = H - paddingTop - paddingBottom;

        // Clear canvas
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#f8f9fa';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, 12);
        ctx.fill();

        const maxCount = Math.max(...data.map(d => d.count), this.dailyLimit, 1);
        const yScale = chartHeight / (maxCount + 1);

        const barTotalWidth = chartWidth / days;
        const barWidth = Math.max(8, barTotalWidth * 0.6);
        const barGap = barTotalWidth * 0.4;

        const MIN_AXIS_FONT = 10;
        const MAX_AXIS_FONT = 13;
        const AXIS_FONT_SCALE = 60;
        const MIN_VALUE_FONT = 9;
        const MAX_VALUE_FONT = 12;
        const VALUE_FONT_SCALE = 65;
        const MIN_LABEL_FONT = 9;
        const MAX_LABEL_FONT = 11;
        const LABEL_FONT_SCALE = 70;

        // Draw gridlines and y-axis labels
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#999';
        ctx.font = `${Math.max(MIN_AXIS_FONT, Math.min(MAX_AXIS_FONT, W / AXIS_FONT_SCALE))}px Poppins, sans-serif`;
        ctx.textAlign = 'right';

        const gridSteps = Math.min(maxCount + 1, 6);
        for (let i = 0; i <= gridSteps; i++) {
            const val = Math.round((maxCount + 1) * i / gridSteps);
            const y = paddingTop + chartHeight - val * yScale;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(W - paddingRight, y);
            ctx.stroke();
            ctx.fillText(val, paddingLeft - 5, y + 4);
        }

        // Draw daily limit line
        const limitY = paddingTop + chartHeight - this.dailyLimit * yScale;
        ctx.save();
        ctx.strokeStyle = '#ee5a24';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, limitY);
        ctx.lineTo(W - paddingRight, limitY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw bars and x-axis labels
        data.forEach((d, i) => {
            const x = paddingLeft + i * barTotalWidth + barGap / 2;
            const barH = d.count * yScale;
            const y = paddingTop + chartHeight - barH;

            // Bar colour: exceeded = red gradient, normal = green gradient
            const exceeded = d.count >= this.dailyLimit;
            const grad = ctx.createLinearGradient(x, y, x, paddingTop + chartHeight);
            if (exceeded) {
                grad.addColorStop(0, '#ff6b6b');
                grad.addColorStop(1, '#ee5a24');
            } else {
                grad.addColorStop(0, '#00b894');
                grad.addColorStop(1, '#00cec9');
            }

            ctx.fillStyle = grad;
            if (d.count > 0) {
                ctx.beginPath();
                const radius = Math.min(4, barWidth / 2);
                ctx.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
                ctx.fill();
            }

            // Value label on top of bar
            if (d.count > 0) {
                ctx.fillStyle = exceeded ? '#ee5a24' : '#00b894';
                ctx.font = `bold ${Math.max(MIN_VALUE_FONT, Math.min(MAX_VALUE_FONT, W / VALUE_FONT_SCALE))}px Poppins, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(d.count, x + barWidth / 2, y - 4);
            }

            // X-axis date labels
            const fontSize = Math.max(MIN_LABEL_FONT, Math.min(MAX_LABEL_FONT, W / LABEL_FONT_SCALE));
            ctx.fillStyle = '#666';
            ctx.font = `${fontSize}px Poppins, sans-serif`;
            ctx.textAlign = 'center';

            const isToday = d.dateStr === new Date().toDateString();
            const label = days === 7
                ? d.date.toLocaleDateString('en-US', { weekday: 'short' })
                : d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            if (isToday) {
                ctx.fillStyle = '#667eea';
                ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
            }

            ctx.fillText(label, x + barWidth / 2, H - paddingBottom + 16);

            // Dot below label for today
            if (isToday) {
                ctx.beginPath();
                ctx.arc(x + barWidth / 2, H - paddingBottom + 26, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#667eea';
                ctx.fill();
            }
        });
    }

    // Export data function
    exportData() {
        const dataStr = JSON.stringify(this.coffeeData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'coffee-data.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import data function
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.coffeeData = importedData;
                    this.saveData();
                    this.updateDisplay();
                    this.showNotification('Data imported successfully!');
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                alert('Error importing data. Please make sure the file is valid.');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the coffee tracker when the page loads
let tracker;

document.addEventListener('DOMContentLoaded', () => {
    tracker = new CoffeeTracker();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add coffee quickly
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            tracker.showAddForm();
        }
        
        // Escape to close form
        if (e.key === 'Escape') {
            const form = document.getElementById('addCoffeeForm');
            if (form.style.display !== 'none') {
                tracker.hideAddForm();
            }
        }
    });
});

// Add some utility functions for potential future enhancements
const CoffeeUtils = {
    // Calculate caffeine content based on coffee type and size
    estimateCaffeine(type, size) {
        const caffeineMap = {
            'Espresso': { base: 63, multiplier: 1 },
            'Americano': { base: 150, multiplier: 1 },
            'Latte': { base: 150, multiplier: 1 },
            'Cappuccino': { base: 150, multiplier: 1 },
            'Macchiato': { base: 75, multiplier: 1 },
            'Mocha': { base: 95, multiplier: 1 },
            'French Press': { base: 107, multiplier: 1 },
            'Cold Brew': { base: 200, multiplier: 1 },
            'Drip Coffee': { base: 95, multiplier: 1 }
        };

        const sizeMultiplier = {
            'Small': 0.75,
            'Medium': 1,
            'Large': 1.25,
            'Extra Large': 1.5
        };

        const coffee = caffeineMap[type] || { base: 95, multiplier: 1 };
        const sizeM = sizeMultiplier[size] || 1;
        
        return Math.round(coffee.base * coffee.multiplier * sizeM);
    },

    // Get coffee emoji based on type
    getCoffeeEmoji(type) {
        const emojiMap = {
            'Espresso': '☕',
            'Americano': '☕',
            'Latte': '🥛',
            'Cappuccino': '☕',
            'Macchiato': '☕',
            'Mocha': '🍫',
            'French Press': '☕',
            'Cold Brew': '🧊',
            'Drip Coffee': '☕'
        };
        return emojiMap[type] || '☕';
    }
};