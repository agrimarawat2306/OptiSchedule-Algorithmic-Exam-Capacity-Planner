const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/schedule', (req, res) => {
    console.log('Received POST request to /api/schedule with payload:', req.body);
    const payload = req.body;

    let inputText = `${payload.classrooms}\n${payload.accommodation}\n`;
    inputText += `${payload.shifts}\n${payload.duration}\n${payload.gap}\n`;
    inputText += `${payload.departments.length}\n`;
    
    payload.departments.forEach(dept => {
        inputText += `${dept.name}\n${dept.code}\n${dept.students}\n${dept.exams}\n`;
    });
    
    inputText += `4\n5\n`; 

    fs.writeFileSync('input.txt', inputText);

    const exeCommand = process.platform === 'win32' ? 'ExamPlanner.exe' : './ExamPlanner';

    exec(`${exeCommand} < input.txt`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return res.status(500).json({ error: "Failed to run C++ algorithm." });
        }

        try {
            const csvData = fs.readFileSync('ExamSchedule.csv', 'utf8');
            
            const lines = csvData.trim().split('\n');
            const headers = lines[0].split(',');
            const results = lines.slice(1).map(line => {
                const values = line.split(',');
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header.trim()] = values[index].trim();
                });
                return obj;
            });

            res.json({ success: true, data: results });
            
        } catch (err) {
            console.error("Error reading CSV:", err);
            res.status(500).json({ error: "Failed to read output data." });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`C++ Engine Bridge Active.`);
});