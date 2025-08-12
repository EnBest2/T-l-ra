// A magyar ünnepnapok (ISO 8601 formátumban: YYYY-MM-DD)
// Ezeket a napokat a program automatikusan kezeli, mint szabadnapokat.
const HUNGARIAN_HOLIDAYS = {
    '2025': [
        '2025-01-01', // Újév
        '2025-04-18', // Nagypéntek
        '2025-04-21', // Húsvét hétfő
        '2025-05-01', // Munka Ünnepe
        '2025-06-09', // Pünkösd hétfő
        '2025-08-20', // Államalapítás ünnepe
        '2025-10-23', // 1956-os forradalom
        '2025-11-01', // Mindenszentek
        '2025-12-25', // Karácsony
        '2025-12-26' // Karácsony másnapja
    ],
    '2026': [
        '2026-01-01', // Újév
        '2026-04-03', // Nagypéntek
        '2026-04-06', // Húsvét hétfő
        '2026-05-01', // Munka Ünnepe
        '2026-05-25', // Pünkösd hétfő
        '2026-08-20', // Államalapítás ünnepe
        '2026-10-23', // 1956-os forradalom
        '2026-11-01', // Mindenszentek
        '2026-12-25', // Karácsony
        '2026-12-26' // Karácsony másnapja
    ]
};

// Segédfüggvény a dátumok kezeléséhez
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// A hónapválasztó feltöltése a jelenlegi és a következő hónapokkal
function populateMonthSelect() {
    const monthSelect = document.getElementById('monthSelect');
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
        const option = document.createElement('option');
        option.value = formatDate(date).slice(0, 7); // pl.: 2025-08
        option.textContent = monthName;
        monthSelect.appendChild(option);
    }
}

// Számítási függvény
function calculateSalary() {
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
    const selectedMonth = document.getElementById('monthSelect').value;
    const isPerformanceBonusEnabled = document.getElementById('performanceBonus').checked;
    const isMorningShiftStart = document.getElementById('shiftStart').checked;

    if (isNaN(hourlyRate) || hourlyRate <= 0) {
        alert('Kérlek adj meg érvényes nettó órabért!');
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const holidays = HUNGARIAN_HOLIDAYS[year] || [];

    let totalSalary = 0;
    let tableBody = document.querySelector('#detailsTable tbody');
    tableBody.innerHTML = '';

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay(); // 0 = vasárnap, 1 = hétfő, ..., 6 = szombat
        const dateString = formatDate(currentDate);

        let regularHours = 0;
        let overtimeHours = 0;
        let dailyWage = 0;

        // Ünnepnapokon nem dolgozunk
        if (holidays.includes(dateString)) {
            // Nem dolgozunk, de a táblázatba beírjuk az ünnepnap nevet
            const holidayName = holidays.find(h => h === dateString);
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = `${day}. (${currentDate.toLocaleDateString('hu-HU', { weekday: 'short' })})`;
            row.insertCell(1).textContent = 'Ünnepnap';
            row.insertCell(2).textContent = '-';
            row.insertCell(3).textContent = '0 Ft';
            continue;
        }

        // Munkanapok
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            let currentShiftType = '';
            
            // A műszak típusának meghatározása a hónap kezdete alapján
            const weekNumber = Math.ceil((day + new Date(year, month - 1, 1).getDay() + 1) / 7);
            if (isMorningShiftStart) {
                currentShiftType = weekNumber % 2 !== 0 ? 'morning' : 'afternoon';
            } else {
                currentShiftType = weekNumber % 2 !== 0 ? 'afternoon' : 'morning';
            }

            // Délelőtti műszak
            if (currentShiftType === 'morning') {
                regularHours = 8;
                dailyWage = regularHours * hourlyRate;
            } 
            // Délutáni műszak
            else if (currentShiftType === 'afternoon') {
                // Hétfőtől csütörtökig 10 óra
                if (dayOfWeek >= 1 && dayOfWeek <= 4) {
                    regularHours = 10;
                    
                    // Pótlék számítása 18:00 és 23:30 között (5.5 óra)
                    const afternoonBonusHours = 5.5;
                    const baseWage = (regularHours - afternoonBonusHours) * hourlyRate;
                    const bonusWage = afternoonBonusHours * hourlyRate * 1.3;
                    dailyWage = baseWage + bonusWage;
                }
                // Péntek szabad
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
            row.insertCell(3).textContent = `${dailyWage.toLocaleString('hu-HU')} Ft`;
        }
    }

    // Mozgóbér hozzáadása, ha be van kapcsolva
    if (isPerformanceBonusEnabled) {
        totalSalary *= 1.1; // 10% mozgóbér
    }

    // Végső fizetés megjelenítése
    document.getElementById('finalSalary').textContent = `${Math.round(totalSalary).toLocaleString('hu-HU')} Ft`;
}

// Az oldal betöltésekor
document.addEventListener('DOMContentLoaded', () => {
    populateMonthSelect();
    // A service worker regisztrációja a PWA-hoz
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
