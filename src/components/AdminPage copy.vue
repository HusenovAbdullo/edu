<template>
    <div>
        <h2>Admin Paneli</h2>

        <h3>Foydalanuvchilar natijalari</h3>
        <button @click="downloadResultsAsExcel">Excel formatida yuklab olish</button>

        <table border="1">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Foydalanuvchi</th>
                    <th>Ball</th>
                    <th>Jami Savollar</th>
                    <th>Foiz</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(result, index) in userResults" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ result.name || result.username }}</td>
                    <td>{{ result.score }}</td>
                    <td>{{ result.total || '-' }}</td>
                    <td>{{ result.percentage || '-' }}%</td>
                </tr>
            </tbody>
        </table>



        <div>
            <h3>Yangi savol qo‘shish</h3>
            <input v-model="newQuestion.text" placeholder="Savolni kiriting" />
            <div v-for="(option, index) in newQuestion.options" :key="index">
                <input v-model="newQuestion.options[index]" :placeholder="'Variant ' + (index + 1)" />
                <button @click="removeOption(index)">X</button>
            </div>
            <button @click="addOption">Variant qo‘shish</button>
            <input v-model="newQuestion.correct" placeholder="To‘g‘ri javobni kiriting" />
            <button @click="addQuestion">Savol qo‘shish</button>
        </div>

        <h3>Test fayl yuklash</h3>
        <input type="file" @change="uploadFile" accept=".docx" />

        <h3>Mavjud test savollari</h3>
        <button @click="toggleSelectAll">
            {{ selectAll ? "Barchasini bekor qilish" : "Barchasini tanlash" }}
        </button>

        <button @click="removeSelectedQuestions" :disabled="!selectedQuestions.length">Tanlanganlarni o‘chirish</button>

        <ul>
            <li v-for="(question, index) in questions" :key="index">
                <input type="checkbox" v-model="selectedQuestions" :value="index" />

                {{ question.text }}
                <ul>
                    <li v-for="(option, i) in question.options" :key="i">{{ option }}</li>
                </ul>
                (To‘g‘ri javob: {{ question.correct }})
            </li>
        </ul>



        <button @click="downloadQuestions">Word formatida yuklab olish</button>
        <ul>
            <li v-for="(question, index) in questions" :key="index">
                {{ question.text }}
                <ul>
                    <li v-for="(option, i) in question.options" :key="i">{{ option }}</li>
                </ul>
                (To‘g‘ri javob: {{ question.correct }})
            </li>
        </ul>
    </div>
</template>

<script>
import fileDownload from "js-file-download";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

export default {
    data() {
        return {
            questions: JSON.parse(localStorage.getItem("testQuestions")) || [],

            selectedQuestions: [], // 🆕 Tanlangan savollarni saqlash uchun
            selectAll: false, // 🆕 Barcha savollarni tanlash uchun bayroq
            userResults: JSON.parse(localStorage.getItem("testResults")) || [],
            newQuestion: {
                text: "",
                options: ["", "", "", ""],
                correct: ""
            },
            file: null, // Fayl saqlash uchun o'zgaruvchi
        };
    },
    methods: {
        // Excel faylni yuklab olish funksiyasi
        downloadResultsAsExcel() {
            const data = this.userResults.map((result, index) => ({
                "#": index + 1,
                "Foydalanuvchi": result.name || result.username,
                "Ball": result.score,
                "Jami Savollar": result.total || "-",
                "Foiz": result.percentage || "-",
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Natijalar");

            // Faylni yuklab olish
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            fileDownload(blob, "foydalanuvchi_natijalari.xlsx");
        },
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedQuestions = [];
            } else {
                this.selectedQuestions = this.questions.map((_, index) => index);
            }
            this.selectAll = !this.selectAll;
        },
        addOption() {
            if (this.newQuestion.options.length < 6) {
                this.newQuestion.options.push("");
            } else {
                alert("Ko‘pi bilan 6 ta variant qo‘shishingiz mumkin!");
            }
        },
        removeOption(index) {
            this.newQuestion.options.splice(index, 1);
        },
        addQuestion() {
            if (!this.newQuestion.text.trim() || this.newQuestion.options.some(opt => !opt.trim()) || !this.newQuestion.correct.trim()) {
                alert("Barcha maydonlarni to‘ldiring!");
                return;
            }
            this.questions.push({ ...this.newQuestion });
            localStorage.setItem("testQuestions", JSON.stringify(this.questions));
            this.newQuestion = { text: "", options: ["", "", "", ""], correct: "" };
        },

        removeSelectedQuestions() {
            this.questions = this.questions.filter((_, index) => !this.selectedQuestions.includes(index));
            localStorage.setItem("testQuestions", JSON.stringify(this.questions));
            this.selectedQuestions = [];
            this.selectAll = false;
        },
        toggleSelection(index) {
            if (this.selectedQuestions.includes(index)) {
                this.selectedQuestions = this.selectedQuestions.filter(i => i !== index);
            } else {
                this.selectedQuestions.push(index);
            }
        },
        removeQuestion(index) {
            if (confirm("Haqiqatan ham ushbu savolni o‘chirmoqchimisiz?")) {
                this.questions.splice(index, 1);
                localStorage.setItem("testQuestions", JSON.stringify(this.questions));
            }
        },
        async uploadFile(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const arrayBuffer = e.target.result;
                    mammoth.extractRawText({ arrayBuffer })
                        .then(result => {
                            const text = result.value;
                            this.parseQuestions(text);
                        })
                        .catch(err => console.error("Xatolik: ", err));
                };
                reader.readAsArrayBuffer(file);
            }
        },
        parseQuestions(text) {
            const lines = text.split('\n');
            let currentQuestion = null;

            lines.forEach(line => {
                line = line.trim();

                if (line.match(/^\d+\./)) {
                    if (currentQuestion) {
                        this.questions.push(currentQuestion);
                    }
                    currentQuestion = { text: line.replace(/^\d+\.\s*/, ''), options: [], correct: "" };
                } else if (line.match(/^[A-E]\)/)) {
                    currentQuestion.options.push(line.replace(/^[A-E]\)\s*/, ''));
                } else if (line.includes("To‘g‘ri javob:")) {
                    currentQuestion.correct = line.split(":")[1].trim();
                }
            });

            if (currentQuestion) {
                this.questions.push(currentQuestion);
            }

            localStorage.setItem("testQuestions", JSON.stringify(this.questions));
        },
        downloadQuestions() {
            let content = "Test Savollari\n\n";
            this.questions.forEach((q, i) => {
                content += `${i + 1}. ${q.text}\n`;
                q.options.forEach((opt, j) => {
                    content += `   ${String.fromCharCode(65 + j)}) ${opt}\n`;
                });
                content += `   To‘g‘ri javob: ${q.correct}\n\n`;
            });
            const blob = new Blob([content], { type: "application/msword" });
            fileDownload(blob, "test_savollari.doc");
        }
    }
    ,
};
</script>

<style scoped>
table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

th,
td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

th {
    background-color: #2c3e50;
    color: white;
}

input[type="text"],
input[type="file"] {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
}

button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    margin: 5px;
}

button:hover {
    background-color: #35495e;
}

ul {
    list-style: none;
    padding: 0;
}

li {
    background: #f0f0f0;
    margin: 5px 0;
    padding: 8px;
    border-radius: 4px;
}

input[type="checkbox"] {
    margin-right: 10px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

th,
td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: center;
}

th {
    background-color: #f4f4f4;
}
</style>
