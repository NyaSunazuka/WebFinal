const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pool = require('./db');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

// หน้า login
app.get('/', (req, res) => {
  res.render('login');
});

// ตรวจสอบการล็อคอิน
// ตรวจสอบการล็อคอิน
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(`
            SELECT s.*, c.curr_name_th AS curriculum_name
            FROM student s
            JOIN curriculum c ON s.curriculum_id = c.id
            WHERE s.first_name = $1 AND s.id = $2`,
            [username, password] // ใช้ id แทน student_id
        );

        if (result.rows.length > 0) {
            const student = result.rows[0];

            // อัพเดทสถานะและ active_date
            await pool.query(
                'UPDATE student_list SET Status = $1, active_date = $2 WHERE student_id = $3',
                ['มาแล้ว', new Date(), student.id]
            );

            // ส่งไปยังหน้า success
            res.render('success', { student });
        } else {
            // ถ้าข้อมูลไม่ถูกต้อง
            res.send('Login failed. Please check your First Name and Student ID.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('An error occurred during login.');
    }
});

// หน้าดูรายชื่อว่าใครมาแล้ว (รองรับการเลือก section)
app.get('/attendance', async (req, res) => {
    const sectionId = req.query.section_id || null; // ดึง section_id จาก query string
    try {
        const sectionsResult = await pool.query('SELECT * FROM sectlion');
        const sections = sectionsResult.rows;

        let students = [];
        if (sectionId) {
            const studentsResult = await pool.query(`
                SELECT s.*, sl.active_date, sl.status, sec.section 
                FROM student_list sl 
                JOIN student s ON sl.student_id = s.id 
                JOIN sectlion sec ON sl.section_id = sec.id
                WHERE sl.section_id = $1`, [sectionId]);
            students = studentsResult.rows;
        }

        res.render('attendance', { sections, students, selectedSection: sectionId });
    } catch (error) {
        console.error(error);
        res.send('Error occurred');
    }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});