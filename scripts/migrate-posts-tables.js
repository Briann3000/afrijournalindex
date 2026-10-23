const mariadb = require('mariadb');

async function migrate() {
  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });
  const conn = await pool.getConnection();

  try {
    console.log('Creating post table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`post\` (
        \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
        \`authorId\` VARCHAR(191) NOT NULL,
        \`postType\` VARCHAR(50) NOT NULL DEFAULT 'UPDATE',
        \`title\` VARCHAR(500) NULL,
        \`content\` TEXT NOT NULL,
        \`attachmentUrl\` TEXT NULL,
        \`attachmentName\` VARCHAR(255) NULL,
        \`attachmentType\` VARCHAR(50) NULL DEFAULT 'PDF',
        \`tags\` VARCHAR(500) NULL,
        \`likesCount\` INT NOT NULL DEFAULT 0,
        \`commentsCount\` INT NOT NULL DEFAULT 0,
        \`sharesCount\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX \`post_authorId_idx\` (\`authorId\`),
        INDEX \`post_postType_idx\` (\`postType\`),
        INDEX \`post_createdAt_idx\` (\`createdAt\`),
        CONSTRAINT \`post_authorId_fkey\` FOREIGN KEY (\`authorId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating post_comment table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`post_comment\` (
        \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
        \`postId\` VARCHAR(191) NOT NULL,
        \`authorId\` VARCHAR(191) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX \`post_comment_postId_idx\` (\`postId\`),
        INDEX \`post_comment_authorId_idx\` (\`authorId\`),
        CONSTRAINT \`post_comment_postId_fkey\` FOREIGN KEY (\`postId\`) REFERENCES \`post\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`post_comment_authorId_fkey\` FOREIGN KEY (\`authorId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating post_like table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`post_like\` (
        \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
        \`postId\` VARCHAR(191) NOT NULL,
        \`userId\` VARCHAR(191) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY \`post_like_postId_userId_key\` (\`postId\`, \`userId\`),
        INDEX \`post_like_postId_idx\` (\`postId\`),
        INDEX \`post_like_userId_idx\` (\`userId\`),
        CONSTRAINT \`post_like_postId_fkey\` FOREIGN KEY (\`postId\`) REFERENCES \`post\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`post_like_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate();
