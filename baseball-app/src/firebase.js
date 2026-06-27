import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
	apiKey: "AIzaSyBNraqJkP87-9x-XXxAs3gcz6oQJ82n2jk",
	authDomain: "baseball-app-513e5.firebaseapp.com",
	databaseURL: "https://baseball-app-513e5-default-rtdb.firebaseio.com",
	projectId: "baseball-app-513e5",
	storageBucket: "baseball-app-513e5.firebasestorage.app",
	messagingSenderId: "172676630851",
	appId: "1:172676630851:web:56a97ffbbaa7eb9165c7f6"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
