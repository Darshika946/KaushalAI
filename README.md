# KaushalAI: AI-Powered Career Mentorship & Interview Platform

## Project Overview

**KaushalAI** is an AI-powered web application designed to empower youth by improving their interview readiness and career development. It combines AI capabilities with curated learning resources to offer mock interviews, skill enhancement, resume building, and challenge-based assessments.

---

## Tech Stack

| Layer          | Technology                                  |
|----------------|----------------------------------------------|
| Frontend       | React JS                                     |
| Styling        | Tailwind CSS                                 |
| Backend        | Express (Node.js)                            |
| Authentication | JWT (JSON Web Tokens)                        |
| Database       | MongoDB                                      |
| Python Backend | Flask                                        |
| AI APIs        | FastAPI                                      |
| AI Model       | Gemini AI                                    |

---

## Project Flow

1. **Login & Signup Page**
   - Secure user registration and login for learners.

2. **Home Page**
   - Displays all core features of the platform with easy navigation.

3. **Mock Interview Page**
   - AI-powered interview simulator.
   - Choose domain, language, difficulty, and interview type (HR, Technical, Soft Skills).
   - Get real-time feedback and score.

4. **Chatbot Page**
   - AI-powered assistant chatbot.
   - Ask career-related questions, interview tips, process insights, etc.

5. **Upskill Page**
   - Personalized resources for selected domains.
   - Displays certifications, learning content (YouTube), and important topics.

6. **Resume Builder Page**
   - Choose from pre-designed resume templates.
   - Fill out personal and professional details.
   - Download the resume as a PDF.

7. **Daily and Weekly Challenges**
   - Daily & Weekly quizzes (MCQs).
   - Questions based on aptitude, technical, HR, etc.
   - Earn points and track performance.

---

## Main Pages

- Login Page ![Screenshot (69)](https://github.com/user-attachments/assets/f458bd13-95a7-4f28-99b0-5df6439e95cf)

- Signup Page ![image](https://github.com/user-attachments/assets/9fb66bda-6c4c-4353-99fe-4c95b2b899f3)

- Home Page ![Screenshot (70)](https://github.com/user-attachments/assets/e0712e5b-4273-4268-b11b-3d0a366c27fd)

- Mock Interview (Instruction) ![Screenshot (79)](https://github.com/user-attachments/assets/c2c81743-2a45-4257-9ff5-3b9fa8299dd1)

- Mock Interview (Multi Language Support) ![image](https://github.com/user-attachments/assets/c6b70a51-ae22-4036-b569-5855be51df57) ![image](https://github.com/user-attachments/assets/f9936704-5041-4d4c-8e86-f38991bbedf9)

- Mock Interview (Evaluation) ![image](https://github.com/user-attachments/assets/a5d282ae-bd71-4e2a-9b70-99c6df93db2f)

- Chatbot ![Screenshot (73)](https://github.com/user-attachments/assets/7c895ba8-3105-47dd-ac8a-0e3630237a96)

- Upskilling ![Screenshot (74)](https://github.com/user-attachments/assets/8404c66d-ecd5-400c-a4f7-a15579847f1d)

- Resume Builder (Template) ![Screenshot (76)](https://github.com/user-attachments/assets/2f1b5261-9914-40e2-a67c-2d61b2087b74)

- Resume Builder ![Screenshot (77)](https://github.com/user-attachments/assets/42c1a49f-7b9b-4de2-8dc0-ebfe82ccb1fa)

- Daily Challenges and Weekly Challenges ![Screenshot (78)](https://github.com/user-attachments/assets/c97bf616-2c35-4b1d-9f62-8a4c76bc04db)

---

## How to Run the Project

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

### Backend (Node + MongoDB)

```bash
cd backend
npm install
npm start
```

### .env should contain:

```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=8000
```

## Python AI Server

### 1. Mock Interview API (Flask)

```bash
cd server
python mock_interview_api.py
```

### 2. Chatbot API (FastAPI)

```bash
cd server
python -m uvicorn train_model:app --reload --port 5000
```

---

## Folder Structure - KaushalAI

| Path                                         | Description                                      |
|----------------------------------------------|--------------------------------------------------|
| `frontend/`                                   | Frontend React application                       |
| -- `src/`                                    | Source folder                                    |
| -- `assets/images/`                          | Static images and logos                          |
| -- `components/navigation/Layout.jsx`        | Layout component for page structure              |
| -- `pages/auth/`                             | Login and signup pages                           |
| -- `pages/chatbot/`                          | AI chatbot interface                             |
| -- `pages/daily/`                            | Daily/Weekly challenges                          |
| -- `pages/home/`                             | Homepage and feature highlights                  |
| -- `pages/mock/`                             | Mock interview trainer                           |
| -- `pages/ResumeBuilderPage/`                | Resume builder interface                         |
| -- `pages/upskill/`                          | Upskilling content and resources                 |
| -- `App.jsx`                                 | Root React component                             |
| -- `index.html`                              | HTML entry point                                 |
| `tailwind.config.js`                          | Tailwind CSS configuration                       |

| Path                                         | Description                                      |
|----------------------------------------------|--------------------------------------------------|
| `backend/`                                    | Backend Node.js server                           |
| -- `controllers/auth.controller.js`          | Authentication logic                             |
| -- `controllers/ai.controller.js`            | AI interview, resume, and chat logic             |
| -- `db/connectMongoDB.js`                    | MongoDB connection setup                         |
| -- `lib/gemini.js`                           | Gemini API integration service                   |
| -- `middleware/protectRoute.js`              | JWT-based route protection                       |
| -- `models/user.model.js`                    | Mongoose schema/model for users                  |
| -- `routes/auth.route.js`                    | Authentication-related routes                    |
| -- `routes/ai.route.js`                      | AI-related endpoints                             |
| -- `.env`                                     | Environment variable configuration               |
| -- `server.js`                               | Entry point for the backend server               |

| Path                                         | Description                                      |
|----------------------------------------------|--------------------------------------------------|
| `server/`                                     | AI services (Python-based)                       |
| -- `app.py`                                  | Base FastAPI app (if needed)                     |
| -- `mock_interview_api.py`                   | Flask-based AI mock interview API                |
| -- `train_model.py`                          | FastAPI-powered chatbot training/interaction     |

---

### Summary of Features

- JWT-based User Authentication
- AI Interview Simulation & Evaluation
- Smart Chatbot for Interview Prep
- Curated Upskilling Suggestions
- Resume Generation & PDF Export
- Daily & Weekly Coding/MCQ Challenges
