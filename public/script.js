document.addEventListener('DOMContentLoaded', () => {
    const addDeptBtn = document.getElementById('add-dept-btn');
    const generateBtn = document.getElementById('generate-btn');
    const deptsContainer = document.getElementById('departments-container');
    const inputSection = document.getElementById('input-section');
    const outputSection = document.getElementById('output-section');
    const tableContainer = document.getElementById('table-container');
    
    const classroomsInput = document.getElementById('classrooms');
    const accommodationInput = document.getElementById('accommodation');
    const totalSeatsInput = document.getElementById('total-seats');

    let deptCount = 0;
    let scheduleData = [];

    function updateTotalSeats() {
        const c = parseInt(classroomsInput.value) || 0;
        const a = parseInt(accommodationInput.value) || 0;
        totalSeatsInput.value = c * a;
    }

    classroomsInput.addEventListener('input', updateTotalSeats);
    accommodationInput.addEventListener('input', updateTotalSeats);

    function createDeptRow() {
        deptCount++;
        const row = document.createElement('div');
        row.className = 'dept-row';
        row.innerHTML = `
            <input type="text" placeholder="Department Name" class="dept-name" required>
            <input type="text" placeholder="Dept Code" class="dept-code" required>
            <input type="number" placeholder="Students" class="dept-students" min="1" required>
            <input type="number" placeholder="Exams" class="dept-exams" min="1" required>
            <button type="button" class="btn danger remove-btn" title="Remove Department">X</button>
        `;
        
        row.querySelector('.remove-btn').addEventListener('click', () => {
            row.remove();
        });
        
        deptsContainer.appendChild(row);
    }

    createDeptRow();
    
    addDeptBtn.addEventListener('click', createDeptRow);

    generateBtn.addEventListener('click', async () => {
        const classrooms = document.getElementById('classrooms').value;
        const accommodation = document.getElementById('accommodation').value;
        const shifts = document.getElementById('shifts').value;
        const duration = document.getElementById('duration').value;
        const gap = document.getElementById('gap').value;

        if (!classrooms || !accommodation) {
            alert('Please fill out all Global Constraints fields.');
            return;
        }

        const deptRows = document.querySelectorAll('.dept-row');
        const departments = [];
        
        for (const row of deptRows) {
            const name = row.querySelector('.dept-name').value.trim();
            const code = row.querySelector('.dept-code').value.trim();
            const students = row.querySelector('.dept-students').value;
            const exams = row.querySelector('.dept-exams').value;
            
            if (!name || !code || !students || !exams) {
                alert('Please fill out all department fields.');
                return;
            }
            
            departments.push({ name, code, students, exams });
        }

        if (departments.length === 0) {
            alert('Add at least one department.');
            return;
        }

        const payload = {
            classrooms,
            accommodation,
            shifts,
            duration,
            gap,
            departments
        };

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            const response = await fetch('http://localhost:3000/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.success) {
                scheduleData = result.data;
                inputSection.classList.add('hidden');
                outputSection.classList.remove('hidden');
                window.showTable('dept-table');
            } else {
                alert('Error generating schedule: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server. Error: ' + err.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Optimal Schedule';
        }
    });

    window.showTable = function(type) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.tab-btn[onclick*="${type}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (!scheduleData || scheduleData.length === 0) {
            tableContainer.innerHTML = '<p>No data available.</p>';
            return;
        }

        let html = '<table><thead><tr>';
        
        if (type === 'dept-table') {
            html += '<th>Department</th><th>Exam Number</th><th>Day</th><th>Shift</th><th>Time Slot</th>';
        } else if (type === 'day-table') {
            html += '<th>Day</th><th>Shift</th><th>Time Slot</th><th>Department</th><th>Exam Number</th>';
        } else if (type === 'room-table') {
            html += '<th>Day</th><th>Department</th><th>Exam Number</th><th>Room</th><th>Roll Numbers</th>';
        }
        
        html += '</tr></thead><tbody>';

        let displayData = [...scheduleData];
        
        if (type === 'dept-table' || type === 'day-table') {
            const seen = new Set();
            displayData = displayData.filter(row => {
                const uniqueKey = `${row.Department}-${row['Exam Number']}-${row.Day}-${row.Shift}`;
                if (seen.has(uniqueKey)) return false;
                seen.add(uniqueKey);
                return true;
            });
        }

        if (type === 'day-table' || type === 'room-table') {
            displayData.sort((a, b) => parseInt(a.Day) - parseInt(b.Day));
        } else if (type === 'dept-table') {
            displayData.sort((a, b) => a.Department.localeCompare(b.Department));
        }

        displayData.forEach(row => {
            html += '<tr>';
            if (type === 'dept-table') {
                html += `<td>${row.Department}</td><td>${row['Exam Number']}</td><td>${row.Day}</td><td>${row.Shift}</td><td>${row['Time Slot']}</td>`;
            } else if (type === 'day-table') {
                html += `<td>${row.Day}</td><td>${row.Shift}</td><td>${row['Time Slot']}</td><td>${row.Department}</td><td>${row['Exam Number']}</td>`;
            } else if (type === 'room-table') {
                html += `<td>${row.Day}</td><td>${row.Department}</td><td>${row['Exam Number']}</td><td>${row.Room}</td><td>${row['Roll Numbers']}</td>`;
            }
            html += '</tr>';
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    };
});