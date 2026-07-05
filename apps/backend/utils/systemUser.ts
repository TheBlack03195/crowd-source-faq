import { User } from '../models/User.js';

const AI_ASSISTANT_EMAIL = 'ai-assistant@system.invalid';


export async function getOrCreateAiUser() {
  let user = await User.findOne({ email: AI_ASSISTANT_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'AI Assistant',
      email: AI_ASSISTANT_EMAIL,
      password: Math.random().toString(36).slice(2) + Date.now().toString(36),
      role: 'moderator',
    });
  }
  return user;
}
