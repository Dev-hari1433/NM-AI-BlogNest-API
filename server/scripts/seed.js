const dns = require('dns');
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {}
}

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Blog = require('../src/models/Blog');
const Embedding = require('../src/models/Embedding');
const { generateEmbedding } = require('../src/services/embeddingService');

async function seedDatabase() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[DB CONNECTED] Successfully connected to Atlas.\n');

  try {
    // 1. Clean existing seed records if present
    await User.deleteMany({
      email: {
        $in: [
          'admin@blognest.com',
          'editor@blognest.com',
          'author@blognest.com',
          'reader@blognest.com'
        ]
      }
    });

    // 2. Create the 4 standard role users
    console.log('--- Creating 4 Role Users ---');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@blognest.com',
      password: 'Password123!',
      role: 'admin',
      bio: 'Platform administrator with global management privileges.'
    });
    console.log(`✓ Admin created:  admin@blognest.com  (Password: Password123!)`);

    const editor = await User.create({
      name: 'Senior Editor',
      email: 'editor@blognest.com',
      password: 'Password123!',
      role: 'editor',
      bio: 'Content editor responsible for publishing and moderation.'
    });
    console.log(`✓ Editor created: editor@blognest.com (Password: Password123!)`);

    const author = await User.create({
      name: 'AI Tech Author',
      email: 'author@blognest.com',
      password: 'Password123!',
      role: 'author',
      bio: 'Author focused on Artificial Intelligence and Vector Search.'
    });
    console.log(`✓ Author created: author@blognest.com (Password: Password123!)`);

    const reader = await User.create({
      name: 'Community Reader',
      email: 'reader@blognest.com',
      password: 'Password123!',
      role: 'reader',
      bio: 'Reader and active community commenter.'
    });
    console.log(`✓ Reader created: reader@blognest.com (Password: Password123!)\n`);

    // 3. Create a sample category
    let category = await Category.findOne({ name: 'Artificial Intelligence' });
    if (!category) {
      category = await Category.create({
        name: 'Artificial Intelligence',
        description: 'Articles discussing Machine Learning, LLMs, and Vector Databases.'
      });
      console.log(`✓ Category created: ${category.name}`);
    }

    // 4. Create a sample published blog with author
    let sampleBlog = await Blog.findOne({ title: 'Understanding Vector Search and Neural Embeddings' });
    if (!sampleBlog) {
      sampleBlog = await Blog.create({
        title: 'Understanding Vector Search and Neural Embeddings',
        content: 'Vector search transforms unstructured text into high-dimensional numerical vectors. By computing cosine similarity between query embeddings and document embeddings, search engines find conceptually relevant articles even when keywords differ completely.',
        category: category._id,
        author: author._id,
        tags: ['ai', 'vector-search', 'embeddings', 'mongodb'],
        status: 'published'
      });
      console.log(`✓ Sample Blog created: ${sampleBlog.title}`);

      // Generate real Gemini vector embedding
      try {
        console.log('Generating Gemini 768-dim vector embedding...');
        const textToEmbed = `${sampleBlog.title}\n\n${sampleBlog.content}\n\nTags: ${sampleBlog.tags.join(', ')}`;
        const vector = await generateEmbedding(textToEmbed);
        await Embedding.create({
          blogId: sampleBlog._id,
          vector: vector,
          model: 'gemini-embedding-001',
          textChunk: textToEmbed
        });
        console.log('✓ Vector embedding stored in Atlas embeddings collection.');
      } catch (err) {
        console.warn('⚠️ Could not generate Gemini embedding during seed (check API key):', err.message);
      }
    }

    console.log('\n======================================================');
    console.log('Database Seeding Completed Successfully!');
    console.log('======================================================\n');
    console.log('Ready-to-use login credentials:');
    console.log('1. Admin:  admin@blognest.com  / Password123!');
    console.log('2. Editor: editor@blognest.com / Password123!');
    console.log('3. Author: author@blognest.com / Password123!');
    console.log('4. Reader: reader@blognest.com / Password123!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('Error during seeding:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
