// Debug helper: reset one or all users' passwords to a known value.
// Usage: node reset-password.mjs <USER_ID> <NEW_PASSWORD>   (single user)
//        node reset-password.mjs --all <NEW_PASSWORD>       (every user)
// Example: node reset-password.mjs --all 'Password@123'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendDir, '.env') });

const { User } = await import(path.join(backendDir, 'src/models/user.model.js'));
const { hashPassword } = await import(path.join(backendDir, 'src/utils/password.js'));

const [, , userId, newPassword] = process.argv;
if (!userId || !newPassword) {
  console.error('Usage: node reset-password.mjs <USER_ID|--all> <NEW_PASSWORD>');
  process.exit(1);
}

const baseUri = (process.env.MONGODB_URI || '').replace(/\/+$/, '');
const uri = baseUri ? `${baseUri}/apar` : 'mongodb://localhost:27017/apar';
await mongoose.connect(uri);

const hash = await hashPassword(newPassword);

if (userId === '--all') {
  const users = await User.find({}, 'user_id email');
  for (const u of users) {
    await User.updateOne({ _id: u._id }, { password_hash: hash });
    console.log(`Password reset for ${u.user_id} (${u.email})`);
  }
  console.log(`Done. ${users.length} user(s) updated.`);
} else {
  const res = await User.findOneAndUpdate({ user_id: userId }, { password_hash: hash });
  console.log(res ? `Password reset for ${userId} (${res.email})` : 'User not found');
}
process.exit(0);
