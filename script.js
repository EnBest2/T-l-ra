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

let currentAction = 'none'; // 'leave' vagy 'overtime'
let overtimeData = {};

function setAction(action) {
    currentAction = action;
}

// A naptár generálása
function renderCalendar() {
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonth = monthSelect.value;
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.innerHTML = '';
    
    // A hét napjainak fejléce
    const weekdays = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.textContent = day;
        header.style.fontWeight = 'bold';
        calendarContainer.appendChild(header);
    });

    const leaveDays = document.getElementById('leaveDays').value.split(',').filter(s => s);
    overtimeData = JSON.parse(document.getElementById('overtimeDays').value || '{}');

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        const dateString = formatDate(currentDate);

        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        dayElement.dataset.date = dateString;

        if (leaveDays.includes(dateString)) {
            dayElement.classList.add('leave');
        } else if (overtimeData[dateString]) {
            dayElement.classList.add('overtime');
        }
        
        dayElement.addEventListener('click', () => {
            if (currentAction === 'leave') {
                if (dayElement.classList.contains('leave')) {
                    dayElement.classList.remove('leave');
                } else {
                    dayElement.classList.remove('overtime');
                    dayElement.classList.add('leave');
                    delete overtimeData[dateString];
                }
            } else if (currentAction === 'overtime') {
                if (dayElement.classList.contains('overtime')) {
                    dayElement.classList.remove('overtime');
                    delete overtimeData[dateString];
                } else {
                    const hours = prompt('Hány órát túlórázott ezen a napon?');
                    if (hours !== null && !isNaN(hours) && parseFloat(hours) > 0) {
                        dayElement.classList.remove('leave');
                        dayElement.classList.add('overtime');
                        overtimeData[dateString] = parseFloat(hours);
                    }
                }
            }
            updateLeaveAndOvertimeDays();
            calculateSalary();
        });

        if (day === 1) {
            const firstDayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
            for (let i = 0; i < firstDayOfWeek; i++) {
                calendarContainer.appendChild(document.createElement('div'));
            }
        }
        calendarContainer.appendChild(dayElement);
    }
}

function updateLeaveAndOvertimeDays() {
    const leaveDays = Array.from(document.querySelectorAll('.calendar-day.leave'))
                               .map(el => el.dataset.date);
    document.getElementById('leaveDays').value = leaveDays.join(',');
    document.getElementById('overtimeDays').value = JSON.stringify(overtimeData);
}

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
        saveState();
        calculateSalary();
    });
    renderCalendar();
}

function calculateSalary() {
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
    const selectedMonth = document.getElementById('monthSelect').value;
    const isPerformanceBonusEnabled = document.getElementById('performanceBonus').checked;
    const isMorningShiftStart = document.getElementById('shiftStart').checked;
    const leaveDays = document.getElementById('leaveDays').value.split(',').filter(s => s);
    overtimeData = JSON.parse(document.getElementById('overtimeDays').value || '{}');

    if (isNaN(hourlyRate) || hourlyRate <= 0) {
        //alert('Kérlek adj meg érvényes nettó órabért!');
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const holidays = getHolidaysForYear(parseInt(year, 10));

    let totalSalary = 0;
    let totalOvertimePay = 0;
    let tableBody = document.querySelector('#detailsTable tbody');
    tableBody.innerHTML = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        const dateString = formatDate(currentDate);

        let regularHours = 0;
        let dailyWage = 0;
        let dailyLabel = '';
        let currentOvertimeHours = 0;
        
        const isHoliday = holidays.includes(dateString);
        const isLeave = leaveDays.includes(dateString);
        const isOvertime = overtimeData[dateString];

        if (isHoliday || isLeave) {
            regularHours = 8;
            dailyWage = regularHours * hourlyRate;
            dailyLabel = isHoliday ? 'Ünnepnap' : 'Szabadság';
        } else if (isOvertime) {
            currentOvertimeHours = overtimeData[dateString];
            dailyWage = currentOvertimeHours * hourlyRate * 1.8;
            totalOvertimePay += dailyWage;
            dailyLabel = 'Túlóra';
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            dailyLabel = 'Hétvége';
            dailyWage = 0;
        } else {
            let weekNumber = Math.ceil((day + new Date(year, month - 1, 1).getDay()) / 7);
            if (new Date(year, month - 1, 1).getDay() === 0) {
                weekNumber = Math.ceil((day + 1) / 7);
            }

            let currentShiftIsMorning = (isMorningShiftStart && weekNumber % 2 !== 0) || (!isMorningShiftStart && weekNumber % 2 === 0);

            // Délelőtti műszak: 5:30-13:30 (8 óra)
            if (currentShiftIsMorning) {
                regularHours = 8;
                dailyWage = regularHours * hourlyRate;
            }
            // Délutáni műszak: 13:30-21:30 (8 óra)
            else {
                regularHours = 8;
                const bonusHours = 3.5;
                dailyWage = (regularHours) * hourlyRate + (bonusHours * hourlyRate * 0.3);
            }
            dailyLabel = regularHours > 0 ? `${regularHours} óra` : 'Szabadnap';
        }
        totalSalary += dailyWage;

        const row = tableBody.insertRow();
        row.insertCell(0).textContent = `${day}. (${currentDate.toLocaleDateString('hu-HU', { weekday: 'short' })})`;
        row.insertCell(1).textContent = dailyLabel;
        row.insertCell(2).textContent = currentOvertimeHours > 0 ? `${currentOvertimeHours} óra` : '-';
        row.insertCell(3).textContent = `${Math.round(dailyWage).toLocaleString('hu-HU')} Ft`;
    }

    if (isPerformanceBonusEnabled) {
        totalSalary *= 1.1; // 10% mozgóbér
    }
    
    document.getElementById('finalSalary').textContent = `${Math.round(totalSalary).toLocaleString('hu-HU')} Ft`;
    document.getElementById('overtimePay').textContent = `${Math.round(totalOvertimePay).toLocaleString('hu-HU')} Ft`;
    saveState();
}

function saveCalculation() {
    const selectedMonth = document.getElementById('monthSelect').value;
    const finalSalary = document.getElementById('finalSalary').textContent;
    const overtimePay = document.getElementById('overtimePay').textContent;
    const calculationDetails = document.getElementById('detailsTable').innerHTML;
    
    const savedCalculations = JSON.parse(localStorage.getItem('saved-calculations') || '[]');
    const newEntry = {
        date: new Date().toLocaleString('hu-HU'),
        month: document.getElementById('monthSelect').options[document.getElementById('monthSelect').selectedIndex].text,
        finalSalary: finalSalary,
        overtimePay: overtimePay,
        details: calculationDetails
    };
    savedCalculations.push(newEntry);
    localStorage.setItem('saved-calculations', JSON.stringify(savedCalculations));
    alert('A számítás sikeresen elmentve!');
}

function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = '';
    
    const savedCalculations = JSON.parse(localStorage.getItem('saved-calculations') || '[]');
    if (savedCalculations.length === 0) {
        historyContainer.innerHTML = 'Jelenleg nincs mentett előzmény.';
    } else {
        savedCalculations.forEach((calc, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('history-entry');
            entryDiv.innerHTML = `
                <h4>${calc.month} havi fizetés - ${calc.date}</h4>
                <p>Nettó fizetés: ${calc.finalSalary}</p>
                <p>Túlóra bér: ${calc.overtimePay}</p>
                <button class="delete-btn" data-index="${index}">Törlés</button>
            `;
            historyContainer.appendChild(entryDiv);
        });
    }

    modal.style.display = 'block';

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            deleteCalculation(index);
        });
    });
}

function deleteCalculation(index) {
    const savedCalculations = JSON.parse(localStorage.getItem('saved-calculations') || '[]');
    savedCalculations.splice(index, 1);
    localStorage.setItem('saved-calculations', JSON.stringify(savedCalculations));
    showHistoryModal();
}

function saveState() {
    const state = {
        hourlyRate: document.getElementById('hourlyRate').value,
        leaveDays: document.getElementById('leaveDays').value,
        overtimeDays: document.getElementById('overtimeDays').value, // Ezt a kulcsot használjuk az overtime adatok tárolására.
        monthSelect: document.getElementById('monthSelect').value,
        performanceBonus: document.getElementById('performanceBonus').checked,
        shiftStart: document.getElementById('shiftStart').checked
    };
    localStorage.setItem('salary-calculator-state', JSON.stringify(state));
}

function loadState() {
    const state = JSON.parse(localStorage.getItem('salary-calculator-state'));
    if (state) {
        document.getElementById('hourlyRate').value = state.hourlyRate;
        document.getElementById('leaveDays').value = state.leaveDays;
        document.getElementById('overtimeDays').value = state.overtimeDays;
        document.getElementById('monthSelect').value = state.monthSelect;
        document.getElementById('performanceBonus').checked = state.performanceBonus;
        document.getElementById('shiftStart').checked = state.shiftStart;
        renderCalendar();
        calculateSalary();
    }
}

// Az oldal betöltésekor
document.addEventListener('DOMContentLoaded', () => {
    populateMonthSelect();
    loadState();

    document.getElementById('setLeaveDay').addEventListener('click', () => setAction('leave'));
    document.getElementById('setOvertimeDay').addEventListener('click', () => setAction('overtime'));
    document.getElementById('showHistoryBtn').addEventListener('click', showHistoryModal);
    document.getElementById('saveCalculationBtn').addEventListener('click', saveCalculation);

    const modal = document.getElementById('historyModal');
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});
