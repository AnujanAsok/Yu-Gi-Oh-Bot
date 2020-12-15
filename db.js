import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yu-gi-oh-inventory.firebaseio.com",
});

const db = admin.database();

export const getUser = async (message) => {
  const userRef = db.ref(`users/${message.author.id}`);
  const snapshot = await userRef.once("value");
  const userData = snapshot.val();
  return userData;
};

export default db;
