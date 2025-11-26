import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqPv-u0OJtysiCYSQjcdMb6zJHTrBA6bc",
  authDomain: "viajes-fh.firebaseapp.com",
  databaseURL: "https://viajes-fh-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "viajes-fh",
  storageBucket: "viajes-fh.firebasestorage.app",
  messagingSenderId: "572278294722",
  appId: "1:572278294722:web:09c67b95790dc47b52135b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// 导出所有需要的对象和函数
export { db, auth, ref, set, onValue, get, signInAnonymously, onAuthStateChanged };