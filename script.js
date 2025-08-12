// A magyar ünnepnapok kiszámítása dinamikusan
function getHolidaysForYear(year) {
    const holidays = [];

    // Fix ünnepek
    holidays.push(`${year}-01-01`); // Újév
    holidays.push(`${year}-05-01`); // Munka Ünnepe
    holidays.push(`${year}-08-20`); // Államalapítás ünnepe
    holidays.push(`${year}-10-23`); // 1956-os forradalom
    holidays.push(`${year}-11-01`); // Mindenszentek
    holidays.push(`${year}-12-25`); // Karácsony
    holidays.push(`${year}-12-26`); // Karácsony másnapja

    // Húsvét és Pünkösd (Gauss-algoritmus alapján)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const g = Math.floor((8 * b + 13) / 25);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const easterDay = ((h + l - 7 * m + 114) % 31) + 1;

    const easterDate = new Date(year, easterMonth - 1, easterDay);
    const goodFriday = new Date(easterDate);
    goodFriday.setDate(easterDate.getDate() - 3);
    const easterMonday = new Date(easterDate);
    easterMonday.setDate(easterDate.getDate() + 1);
    const pentecostMonday = new Date(easterDate);
    pentecostMonday.setDate(easterDate.getDate() + 50);

    holidays.push(formatDate(goodFriday)); // Nagypéntek
    holidays.push(formatDate(easterMonday)); // Húsvét hétfő
    holidays.push(formatDate(pentecostMonday)); // Pünkösd hétfő

    return holidays;
}

// Segédfüggvény a dátumok kezeléséhez
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// A hónapválasztó feltöltése
function populateMonthSelect() {
    const monthSelect = document.getElementById('monthSelect');
    const now = new Date();
    for (let i = 0; i < 24; i++) { // 24 hónapra előre
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
        const option = document.createElement('option');
        option.value = formatDate(date).slice(0, 7);
        option.textContent = monthName;
        monthSelect.appendChild(option);
    }
}

// A számítási logika
function calculateSalary() {
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
    const selectedMonth = document.getElementById('monthSelect').value;
    const isPerformanceBonusEnabled = document.getElementById('performanceBonus').checked;
    const isMorningShiftStart = document.getElementById('shiftStart').checked;
    const overtimeHoursInput = parseFloat(document.getElementById('overtimeHours').value) || 0;
    const leaveDaysInput = document.getElementById('leaveDays').value;
    const leaveDays = leaveDaysInput.split(',').map(s => s.trim()).filter(s => s);

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

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay(); // 0 = vasárnap, 1 = hétfő, ..., 6 = szombat
        const dateString = formatDate(currentDate);

        let regularHours = 0;
        let overtimeHours = 0;
        let dailyWage = 0;
        let dailyLabel = '';

        if (holidays.includes(dateString)) {
            regularHours = 8;
            dailyWage = regularHours * hourlyRate;
            dailyLabel = 'Ünnepnap';
            totalSalary += dailyWage;
        } else if (leaveDays.includes(dateString)) {
            regularHours = 8;
            dailyWage = regularHours * hourlyRate;
            dailyLabel = 'Szabadság';
            totalSalary += dailyWage;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            dailyLabel = 'Hétvége';
            dailyWage = 0;
        } else {
            // Munkanapok (hétfő-péntek)
            workdays++;
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
                // Hétfőtől csütörtökig 10 óra
                if (dayOfWeek >= 1 && dayOfWeek <= 4) {
                    regularHours = 10;
                    const bonusHours = 5.5;
                    dailyWage = (regularHours - bonusHours) * hourlyRate + (bonusHours * hourlyRate * 1.3);
                }
                // Péntek 8 óra
                else if (dayOfWeek === 5) {
                    regularHours = 8;
                    dailyWage = regularHours * hourlyRate;
                }
            }
            totalSalary += dailyWage;
            dailyLabel = 'Rendes munkanap';
        }

        const row = tableBody.insertRow();
        row.insertCell(0).textContent = `${day}. (${currentDate.toLocaleDateString('hu-HU', { weekday: 'short' })})`;
        row.insertCell(1).textContent = regularHours || dailyLabel;
        row.insertCell(2).textContent = overtimeHours;
        row.insertCell(3).textContent = `${Math.round(dailyWage).toLocaleString('hu-HU')} Ft`;
    }
    
    // Túlóra elosztása a munkanapokra és a végösszeghez adása
    const dailyOvertime = overtimeHoursInput / workdays;
    for (let i = 0; i < tableBody.rows.length; i++) {
        const row = tableBody.rows[i];
        if (row.cells[1].textContent.includes('óra') || row.cells[1].textContent.includes('Rendes munkanap')) {
             row.cells[2].textContent = dailyOvertime.toFixed(2);
             const currentDailyWage = parseFloat(row.cells[3].textContent.replace(/\sFt/g, '').replace(/,/g, ''));
             const newDailyWage = currentDailyWage + dailyOvertime * hourlyRate * 1.8;
             row.cells[3].textContent = `${Math.round(newDailyWage).toLocaleString('hu-HU')} Ft`;
             totalSalary += dailyOvertime * hourlyRate * 1.8;
        }
    }


    // Mozgóbér hozzáadása, ha be van kapcsolva
    if (isPerformanceBonusEnabled) {
        totalSalary *= 1.1; // 10% mozgóbér
    }
    
    document.getElementById('finalSalary').textContent = `${Math.round(totalSalary).toLocaleString('hu-HU')} Ft`;
}

// Az oldal betöltésekor
document.addEventListener('DOMContentLoaded', () => {
    populateMonthSelect();
    // Service worker regisztrációja a PWA-hoz
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
