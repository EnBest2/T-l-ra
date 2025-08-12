// A magyar ünnepnapok kiszámítása dinamikusan
function getHolidaysForYear(year) {
    const holidays = [];
    holidays.push(`${year}-01-01`, `${year}-05-01`, `${year}-08-20`, `${year}-10-23`, `${year}-11-01`, `${year}-12-25`, `${year}-12-26`);

    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, g = Math.floor((8 * b + 13) / 25), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), easterMonth = Math.floor((h + l - 7 * m + 114) / 31), easterDay = ((h + l - 7 * m + 114) % 31) + 1;

    const easterDate = new Date(year, easterMonth - 1, easterDay);
    const goodFriday = new Date(easterDate), easterMonday = new Date(easterDate), pentecostMonday = new Date(easterDate);
    goodFriday.setDate(easterDate.getDate() - 3);
    easterMonday.setDate(easterDate.getDate() + 1);
    pentecostMonday.setDate(easterDate.getDate() + 50);

    holidays.push(formatDate(goodFriday), formatDate(easterMonday), formatDate(pentecostMonday));
    return holidays;
}

// Segédfüggvény a dátumok kezeléséhez
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// A naptár generálása
function renderCalendar() {
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonth = monthSelect.value;
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.innerHTML = '';
    
    // Hét napjainak fejléce
    const weekdays = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.textContent = day;
        header.style.fontWeight = 'bold';
        calendarContainer.appendChild(header);
    });

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        const dateString = formatDate(currentDate);

        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        dayElement.dataset.date = dateString;
        
        dayElement.addEventListener('click', () => {
            dayElement.classList.toggle('selected');
            updateLeaveDays();
        });

        // Üres helyek a hét elején
        if (day === 1) {
            const firstDayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
            for (let i = 0; i < firstDayOfWeek; i++) {
                calendarContainer.appendChild(document.createElement('div'));
            }
        }

        calendarContainer.appendChild(dayElement);
    }
}

// A rejtett mező frissítése
function updateLeaveDays() {
    const selectedDays = Array.from(document.querySelectorAll('.calendar-day.selected'))
                            .map(el => el.dataset.date);
    document.getElementById('leaveDays').value = selectedDays.join(',');
}

// A hónapválasztó feltöltése
function populateMonthSelect() {
    const monthSelect = document.getElementById('monthSelect');
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
        const option = document.createElement('option');
        option.value = formatDate(date).slice(0, 7);
        option.textContent = monthName;
        monthSelect.appendChild(option);
    }
    monthSelect.addEventListener('change', () => {
        renderCalendar();
        updateLeaveDays();
    });
    renderCalendar();
}

// A számítási logika
function calculateSalary() {
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
    const selectedMonth = document.getElementById('monthSelect').value;
    const isPerformanceBonusEnabled = document.getElementById('performanceBonus').checked;
    const isMorningShiftStart = document.getElementById('shiftStart').checked;
    const overtimeHoursInput = parseFloat(document.getElementById('overtimeHours').value) || 0;
    const leaveDays = document.getElementById('leaveDays').value.split(',').filter(s => s);

    if (isNaN(hourlyRate) || hourlyRate <= 0) {
        alert('Kérlek adj meg érvényes nettó órabért!');
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const holidays = getHolidaysForYear(parseInt(year, 10));

    let totalSalary = 0;
    let workdays = 0;
    let tableBody = document.querySelector('#detailsTable tbody');
    tableBody.innerHTML = '';
    
    // Munkanapok száma a túlóra elosztásához
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        const dateString = formatDate(currentDate);
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays.includes(dateString) && !leaveDays.includes(dateString)) {
            workdays++;
        }
    }
    const dailyOvertime = workdays > 0 ? overtimeHoursInput / workdays : 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        const dateString = formatDate(currentDate);

        let regularHours = 0;
        let dailyWage = 0;
        let dailyLabel = '';
        let currentOvertime = 0;
        
        const isHoliday = holidays.includes(dateString);
        const isLeave = leaveDays.includes(dateString);

        if (isHoliday || isLeave) {
            regularHours = 8;
            dailyWage = regularHours * hourlyRate;
            dailyLabel = isHoliday ? 'Ünnepnap' : 'Szabadság';
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            dailyLabel = 'Hétvége';
            dailyWage = 0;
        } else {
            let weekNumber = Math.ceil((day + new Date(year, month - 1, 1).getDay()) / 7);
            if (new Date(year, month - 1, 1).getDay() === 0) {
                weekNumber = Math.ceil((day + 1) / 7);
            }

            let currentShiftIsMorning = (isMorningShiftStart && weekNumber % 2 !== 0) || (!isMorningShiftStart && weekNumber % 2 === 0);

            // Délelőtti műszak
            if (currentShiftIsMorning) {
                regularHours = 8;
                dailyWage = regularHours * hourlyRate;
            }
            // Délutáni műszak
            else {
                regularHours = 8;
                const bonusHours = 5.5; // Ez az eredeti leírásból van
                dailyWage = (regularHours - bonusHours) * hourlyRate + (bonusHours * hourlyRate * 1.3);
            }
            dailyLabel = regularHours > 0 ? 'Rendes munkanap' : 'Szabadnap';

            // Túlóra hozzáadása a munkanapokhoz
            if (dailyOvertime > 0) {
                currentOvertime = dailyOvertime;
                dailyWage += currentOvertime * hourlyRate * 1.8;
            }
        }
        totalSalary += dailyWage;
        
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = `${day}. (${currentDate.toLocaleDateString('hu-HU', { weekday: 'short' })})`;
        row.insertCell(1).textContent = regularHours || dailyLabel;
        row.insertCell(2).textContent = currentOvertime.toFixed(2);
        row.insertCell(3).textContent = `${Math.round(dailyWage).toLocaleString('hu-HU')} Ft`;
    }

    if (isPerformanceBonusEnabled) {
        totalSalary *= 1.1; // 10% mozgóbér
    }
    
    document.getElementById('finalSalary').textContent = `${Math.round(totalSalary).toLocaleString('hu-HU')} Ft`;
}

// Az oldal betöltésekor
document.addEventListener('DOMContentLoaded', () => {
    populateMonthSelect();
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js').then(registration => {
                console.log('SW regisztráció sikeres: ', registration.scope);
            }).catch(err => {
                console.log('SW regisztráció sikertelen: ', err);
            });
        });
    }
});
