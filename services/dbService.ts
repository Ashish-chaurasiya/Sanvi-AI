
import { User, UserCareerProfile, LearningPath, TopicChat, ChatMessage } from "../types";
import { STORAGE_KEYS } from "../constants";

const safeParse = (data: string | null, fallback: any = {}) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.warn("Sanvii DB Warning: Attempting recovery for malformed storage JSON.");
    try {
      let fixed = data.trim();
      
      // Handle unclosed strings if storage was cut off mid-write
      const quoteCount = (fixed.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        fixed += '"';
      }

      if (!fixed.endsWith('}') && !fixed.endsWith(']')) {
        const lastBrace = fixed.lastIndexOf('}');
        const lastBracket = fixed.lastIndexOf(']');
        const cutAt = Math.max(lastBrace, lastBracket);
        if (cutAt !== -1) {
          return JSON.parse(fixed.substring(0, cutAt + 1));
        }
      }
      return JSON.parse(fixed);
    } catch (innerE) {
      console.error("Sanvii DB Recovery: Failed completely.");
    }
    return fallback;
  }
};

export const dbService = {
  // --- USER AUTH ---
  getUsers(): any[] {
    return safeParse(localStorage.getItem(STORAGE_KEYS.USERS_DB), []);
  },

  register(name: string, email: string, pass: string): User {
    const users = this.getUsers();
    const newUser: User & { password?: string } = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password: pass,
      createdAt: Date.now(),
      avatar: `https://picsum.photos/seed/${email}/200`
    };
    users.push(newUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
    } catch (e) {
      console.error("Storage quota exceeded", e);
    }
    return newUser;
  },

  login(email: string, pass: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser as User;
    }
    return null;
  },

  // --- PROFILE ---
  getProfile(userId: string): UserCareerProfile | null {
    const profiles = safeParse(localStorage.getItem('sanvii_profiles_db'), {});
    return profiles[userId] || null;
  },

  saveProfile(profile: UserCareerProfile): void {
    try {
      const profiles = safeParse(localStorage.getItem('sanvii_profiles_db'), {});
      profiles[profile.userId] = profile;
      localStorage.setItem('sanvii_profiles_db', JSON.stringify(profiles));
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  },

  // --- MULTI-LEARNING PATHS ---
  getLearningPaths(userId: string): LearningPath[] {
    const allPaths = safeParse(localStorage.getItem('sanvii_all_paths_db'), {});
    return allPaths[userId] || [];
  },

  saveLearningPaths(userId: string, paths: LearningPath[]): void {
    try {
      const allTopicPaths = safeParse(localStorage.getItem('sanvii_all_paths_db'), {});
      allTopicPaths[userId] = paths;
      localStorage.setItem('sanvii_all_paths_db', JSON.stringify(allTopicPaths));
    } catch (e) {
      console.error("Failed to save learning paths (Quota limit)", e);
    }
  },

  getActivePathId(userId: string): string | null {
    const activeIds = safeParse(localStorage.getItem('sanvii_active_path_ids'), {});
    return activeIds[userId] || null;
  },

  // Fix: Completed cut-off setActivePathId method
  setActivePathId(userId: string, pathId: string): void {
    try {
      const activeIds = safeParse(localStorage.getItem('sanvii_active_path_ids'), {});
      activeIds[userId] = pathId;
      localStorage.setItem('sanvii_active_path_ids', JSON.stringify(activeIds));
    } catch (e) {
      console.error("Failed to set active path", e);
    }
  },

  // Fix: Added missing getMessages method
  getMessages(userId: string): ChatMessage[] {
    const allMessages = safeParse(localStorage.getItem('sanvii_messages_db'), {});
    return allMessages[userId] || [];
  },

  // Fix: Added missing saveMessages method
  saveMessages(userId: string, messages: ChatMessage[]): void {
    try {
      const allMessages = safeParse(localStorage.getItem('sanvii_messages_db'), {});
      allMessages[userId] = messages;
      localStorage.setItem('sanvii_messages_db', JSON.stringify(allMessages));
    } catch (e) {
      console.error("Failed to save messages:", e);
    }
  },

  // Fix: Added missing getTopicChats method
  getTopicChats(userId: string): Record<string, TopicChat> {
    const allTopicChats = safeParse(localStorage.getItem('sanvii_topic_chats_db'), {});
    return allTopicChats[userId] || {};
  },

  // Fix: Added missing saveTopicChats method
  saveTopicChats(userId: string, chats: Record<string, TopicChat>): void {
    try {
      const allTopicChats = safeParse(localStorage.getItem('sanvii_topic_chats_db'), {});
      allTopicChats[userId] = chats;
      localStorage.setItem('sanvii_topic_chats_db', JSON.stringify(allTopicChats));
    } catch (e) {
      console.error("Failed to save topic chats:", e);
    }
  }
};
