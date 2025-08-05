// MongoDB initialization script
db = db.getSiblingDB('mushaf_with_notes');

// Create collections with initial indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.createCollection('mushafs');
db.mushafs.createIndex({ owner: 1, createdAt: -1 });
db.mushafs.createIndex({ 'settings.isPublic': 1 });

db.createCollection('pages');
db.pages.createIndex({ pageNumber: 1 }, { unique: true });
db.pages.createIndex({ 'wordCoordinates.wordId': 1 });
db.pages.createIndex({ 'wordCoordinates.surah': 1, 'wordCoordinates.ayah': 1 });

db.createCollection('notes');
db.notes.createIndex({ mushaf: 1, page: 1 });
db.notes.createIndex({ user: 1, createdAt: -1 });
db.notes.createIndex({ category: 1 });
db.notes.createIndex({ tags: 1 });

db.createCollection('wordinteractions');
db.wordinteractions.createIndex({ 
  mushaf: 1, 
  user: 1, 
  wordId: 1, 
  interactionType: 1 
}, { unique: true });
db.wordinteractions.createIndex({ mushaf: 1, page: 1 });
db.wordinteractions.createIndex({ user: 1, interactionType: 1 });

db.createCollection('lettermarks');
db.lettermarks.createIndex({ 
  mushaf: 1, 
  user: 1, 
  wordId: 1, 
  letterPosition: 1,
  markType: 1
}, { unique: true });
db.lettermarks.createIndex({ mushaf: 1, page: 1 });
db.lettermarks.createIndex({ user: 1, category: 1 });

print('Database initialized with collections and indexes');