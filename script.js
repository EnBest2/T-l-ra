// A magyar ünnepnapok (ISO 8601 formátumban: YYYY-MM-DD)
const HUNGARIAN_HOLIDAYS = {
    '2025': [
        '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01', '2025-06-09',
        '2025-08-20', '2025-10-23', '2025-11-01', '2025-12-25', '2025-12-26'
    ],
    '2026': [
        '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-01', '2026-05-25',
        '2026-08-20', '2026-10-23', '2026-11-01', '2026-12-25', '2026-12-26'
    ]
};

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
    for (let i = 0; i < 12; i++) {
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

    if (isNaN(hourlyRate) || hourlyRate <= 0) {
        alert('Kérlek adj meg érvényes nettó órabért!');
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const holidays = HUNGARIAN_HOLIDAYS[year] || [];

    let totalSalary = 0;
    let totalOvertimePay = overtimeHoursInput * hourlyRate * 1.8;
    let tableBody = document.querySelector('#detailsTable tbody');
    tableBody.innerHTML = '';

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay(); // 0 = vasárnap, 1 = hétfő, ..., 6 = szombat
        const dateString = formatDate(currentDate);

        let regularHours = 0;
        let overtimeHours = 0;
        let dailyWage = 0;

        if (holidays.includes(dateString) || dayOfWeek === 0 || dayOfWeek === 6) {
            // Hétvégén és ünnepnapon nincs munkavégzés a beállítás szerint
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = `${day}. (${currentDate.toLocaleDateString('hu-HU', { weekday: 'short' })})`;
            row.insertCell(1).textContent = holidays.includes(dateString) ? 'Ünnepnap' : 'Szabadnap';
            row.insertCell(2).textContent = '-';
            row.insertCell(3).textContent = '0 Ft';
            continue;
        }

        // Munkanapok (hétfő-péntek)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            let weekNumber = Math.ceil((day + new Date(year, month - 1, 1).getDay()) / 7);
            if (new Date(year, month - 1, 1).getDay() === 0) { // Ha a hónap vasárnappal kezdődik
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
                // Hétfőtől csütörtökig napi 10 óra
                if (dayOfWeek >= 1 && dayOfWeek <= 4) {
                    regularHours = 10;
                    // Pótlék számítása: 18:00-tól 23:30-ig (5.5 óra)
                    const bonusHours = 5.5;
                    dailyWage = (regularHours - bonusHours) * hourlyRate + (bonusHours * hourlyRate * 1.3);
                }
                // Péntek szabad a délutános hétben
                else if (dayOfWeek === 5) {
                    regularHours = 0;
                    dailyWage = 0;
                }
            }
            
            totalSalary += dailyWage;
            
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = `${day}. (${currentDate.toLocaleDateString('hu-HU', { weekday: 'short' })})`;
            row.insertCell(1).textContent = regularHours;
            row.insertCell(2).textContent = overtimeHours;
            row.insertCell(3).textContent = `${Math.round(dailyWage).toLocaleString('hu-HU')} Ft`;
        }
    }

    // Túlórák és mozgóbér hozzáadása
    let finalSalary = totalSalary + totalOvertimePay;
    if (isPerformanceBonusEnabled) {
        finalSalary *= 1.1; // 10% mozgóbér
    }
    
    document.getElementById('finalSalary').textContent = `${Math.round(finalSalary).toLocaleString('hu-HU')} Ft`;
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
