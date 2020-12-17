import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yu-gi-oh-inventory.firebaseio.com",
});

const db = admin.database();

export const getUser = async (userID) => {
  const userRef = db.ref(`users/${userID}`);
  const snapshot = await userRef.once("value");
  return snapshot.val();
};

export default db;
