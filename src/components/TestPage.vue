<template>
    <div class="quiz-wrapper">
        <div v-if="showPopup" class="popup">
            <div class="popup-content">
                <h2>Ismingizni kiriting</h2>
                <input v-model="username" placeholder="Ismingizni kiriting" />
                <button @click="startTest">Testni boshlash</button>
            </div>
        </div>

        <aside class="sidebar">
            <div v-for="(question, idx) in displayedQuestions" :key="idx" class="question-circle" :class="{
                active: idx === currentQuestionIndex,
                answered: answers[idx] !== undefined
            }" @click="goToQuestion(idx)">
                {{ idx + 1 }}
            </div>
        </aside>

        <div class="quiz-content">
            <div class="question-mark" style="cursor: default;">
                Dasturchilar:
                <span class="developer" @click="openTelegram('https://t.me/chiko_uz')"
                    style="cursor: pointer; color: #6b476d; text-decoration: underline;">
                    Husenov Abdullo
                </span>
                &nbsp;&nbsp;
                <span class="developer" @click="openTelegram('https://t.me/firuzovic')"
                    style="cursor: pointer; color: #6b476d; text-decoration: underline;">
                    Xalimov Shoxijaxon
                </span>
            </div>


            <div class="logo"></div>

            <div class="timer" style="color: aliceblue; float: right;">Qolgan vaqt: {{ formattedTime }}</div> <br><br>
            <div class="ism" style="color: aliceblue; float: right;">Foydalanuvchi: {{ username }}&nbsp;&nbsp;</div>
            <br><br>
            <h2 class="question-text" style="color: #ffff;">{{ displayedQuestions[currentQuestionIndex].text }}</h2>

            <div class="options">
                <div v-for="(option, i) in displayedQuestions[currentQuestionIndex].options" :key="i" class="option"
                    @click="answers[currentQuestionIndex] = option">
                    <label>
                        <span class="option-label">{{ getOptionLetter(i) }}</span>
                        <input type="radio" :name="'q' + currentQuestionIndex" :value="option"
                            v-model="answers[currentQuestionIndex]" />
                        {{ option }}
                    </label>
                </div>
            </div>

            <div v-if="showResultPopup" class="result-popup">
                <div class="popup-content">
                    <h2>Test natijalari</h2>
                    <p><strong>Foydalanuvchi:</strong> {{ testResult.username }}</p>
                    <p><strong>To‘g‘ri javoblar:</strong> {{ testResult.score }} / {{ testResult.total }}</p>
                    <p><strong>Foiz:</strong> {{ testResult.percentage }}%</p>
                    <button @click="closeResultPopup">Yopish</button>

                </div>
            </div>


            <div class="quiz-footer">
                <button v-if="!isLastQuestion" @click="nextQuestion">Keyingisi</button>
                <button v-else @click="submitTest">Yakunlash</button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data() {
        return {
            username: "",
            showPopup: true,
            currentQuestionIndex: 0,
            displayedQuestions: [],
            answers: [],
            timeLeft: 3600,
            timer: null,
            showResultPopup: false,
            testResult: null,
            startTime: null, // Test boshlanish vaqti
        };
    },
    created() {
        this.fetchQuestions();
        window.addEventListener("beforeunload", this.preventRefresh);
    },
    beforeUnmount() {
        window.removeEventListener("beforeunload", this.preventRefresh);
    },
    computed: {
        isLastQuestion() {
            return this.currentQuestionIndex === this.displayedQuestions.length - 1;
        },
        formattedTime() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        }
    },
    methods: {
        openTelegram(url) {
            window.open(url, '_blank');
        },
        async fetchQuestions() {
            try {
                const response = await axios.get("https://edu.pochta.uz/api/v1/random-tests/");
                this.displayedQuestions = response.data.map(q => ({
                    text: q.question,
                    options: q.answers.map(a => a.answer),
                    correct: q.answers.find(a => a.is_correct)?.answer
                }));
            } catch (error) {
                console.error("Testlarni olishda xatolik:", error);
                alert("Testlarni yuklashda xatolik yuz berdi");
            }
        },
        preventRefresh(event) {
            event.preventDefault();
            event.returnValue = "Test jarayonida sahifani yangilash mumkin emas!";
        },
        closeResultPopup() {
            this.showResultPopup = false;
            this.username = "";
            this.answers = [];
            this.currentQuestionIndex = 0;
            this.timeLeft = 3600;
            this.showPopup = true;
            this.fetchQuestions();
        },
        getOptionLetter(index) {
            return String.fromCharCode(65 + index);
        },
        nextQuestion() {
            if (this.currentQuestionIndex < this.displayedQuestions.length - 1) {
                this.currentQuestionIndex++;
            }
        },
        goToQuestion(index) {
            this.currentQuestionIndex = index;
        },
        startTest() {
            if (!this.username) {
                alert("Ismingizni kiriting!");
                return;
            }
            this.showPopup = false;
            this.startTime = Date.now(); // Boshlanish vaqtini saqlab qo'yamiz
            this.startTimer();
        },
        startTimer() {
            this.timer = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                } else {
                    clearInterval(this.timer);
                    this.submitTest();
                }
            }, 1000);
        },
        async submitTest() {
            clearInterval(this.timer);
            let score = 0;
            this.displayedQuestions.forEach((q, idx) => {
                if (this.answers[idx] === q.correct) {
                    score++;
                }
            });
            let totalQuestions = this.displayedQuestions.length;
            let percentage = ((score / totalQuestions) * 100).toFixed(2);

            let elapsedTimeInSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            let elapsedMinutes = Math.floor(elapsedTimeInSeconds / 60);
            let elapsedSeconds = elapsedTimeInSeconds % 60;
            let elapsedTimeFormatted = `${elapsedMinutes}:${elapsedSeconds < 10 ? "0" : ""}${elapsedSeconds}`;

            this.testResult = {
                username: this.username,
                score: score,
                total: totalQuestions,
                percentage: percentage,
                time: elapsedTimeFormatted
            };

            this.showResultPopup = true;
            try {
                await axios.post("https://edu.pochta.uz/api/v1/test-results/", {
                    fish: this.username,
                    correct_answers: score,
                    incorrect_answers: totalQuestions - score,
                    percentage: parseFloat(percentage),
                    time: elapsedTimeFormatted // Yuboriladigan vaqt
                });
            } catch (error) {
                console.error("Natijalarni yuborishda xatolik:", error);
                alert("Natijalarni yuborishda xatolik yuz berdi");
            }
        }


    }
};
</script>





<style scoped>
@media (max-width: 768px) {
    .question-mark {
        font-size: 14px;
        /* Bu o'lchamni o'zingizga moslab o'zgartiring */
    }
}


.logo {
    width: 200px;
    /* Logoning o‘lchamini o'zingizga moslang */
    height: 50px;
    background-image: url('https://new.pochta.uz/media/logo-1.svg');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    float: left;
}



.result-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.popup-content {
    background: white;
    padding: 30px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    text-align: center;
}

.popup-content button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    border-radius: 5px;
}

.popup-content button:hover {
    background-color: #35495e;
}



.option.selected {
    background-color: #4caf50 !important;
    color: white;
}


.popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    /* Xiralik */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    transition: opacity 0.3s ease;
}

.popup-content {
    background: white;
    padding: 50px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    text-align: center;
    z-index: 1001;
}

.quiz-wrapper {
    opacity: 1;
    transition: opacity 0.3s ease;
}

.quiz-wrapper.hidden {
    opacity: 0;
}




.popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffffed;
    padding: 50px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    text-align: center;
    z-index: 1000;
}

.popup-content input {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.popup-content button {
    background-color: #2c3e50;
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    border-radius: 5px;
}

.popup-content button:hover {
    background-color: #35495e;
}

/* Test oynasini yashirish */
.quiz-wrapper {
    display: none;
}

.quiz-wrapper.active {
    display: flex;
}




.question-circle.answered {
    background-color: #4caf50;
    /* Yashil rang */
    color: #fff;
}




/* Umumiy konteyner */
.quiz-wrapper {
    display: flex;
    flex-direction: row;
    min-height: 100vh;
    background-color: #183e98;
    /* Yorqin sariq fon */
    font-family: Arial, sans-serif;
    position: relative;
}

/* Chap tomondagi doira-raqamlar */
.sidebar {
    background-color: #2c3e50;
    width: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
}

.question-circle {
    width: 35px;
    height: 35px;
    background-color: #fff;
    color: #000;
    border-radius: 50%;
    margin: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
}

.question-circle:hover {
    transform: scale(1.1);
}

.question-circle.active {
    background-color: #ff5722;
    color: #fff;
}

/* Asosiy savol bloki */
.quiz-content {
    flex: 1;
    position: relative;
    padding: 10px 20px;
}

/* Katta savol belgisi */
.question-mark {
    position: fixed;
    bottom: 20px;
    right: 40px;
    font-size: 20px;
    color: #ff572261;
    opacity: 1.15;
    z-index: 1000;
}


/* Savol matni */
.question-text {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
    z-index: 1;
}

/* Variantlar ro'yxati */
.options {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    z-index: 1;
}

/* Har bir variant */
.option {
    background-color: #fff;
    border-radius: 12px;
    padding: 10px 20px;
    flex: 0 0 45%;
    /* 2 ta variant yonma-yon joylashadi */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: transform 0.2s;
}

.option:hover {
    transform: scale(1.02);
}

.option label {
    cursor: pointer;
}

/* Variantning chap tomondagi harfi (A, B, C, D) */
.option-label {
    display: inline-block;
    background-color: #2c3e50;
    color: #fff;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    text-align: center;
    line-height: 30px;
    margin-right: 10px;
    font-weight: bold;
}

/* Pastdagi tugma */
.quiz-footer {
    margin-top: 30px;
}

.quiz-footer button {
    background-color: #2c3e50;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
}

.quiz-footer button:hover {
    background-color: #35495e;
}

/* O'ng tomondagi natijalar paneli */
.results-panel {
    width: 300px;
    background-color: #fff;
    padding: 20px;
}

.results-panel h3 {
    margin-top: 0;
}

.results-panel input {
    width: 100%;
    padding: 8px;
    margin-bottom: 20px;
}

.results-panel ul {
    list-style: none;
    padding: 0;
}

.results-panel li {
    background: #f0f0f0;
    margin: 5px 0;
    padding: 8px;
    border-radius: 4px;
}

@media (max-width: 768px) {
    .question-mark {
        font-size: 14px;
        /* Bu o'lchamni o'zingizga moslab o'zgartiring */
    }
}
</style>