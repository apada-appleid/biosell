import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Prisma client keys:', Object.keys(prisma));
    
    // Check if 'setting' exists on the prisma client
    console.log('Does prisma.setting exist?', typeof prisma.setting !== 'undefined');
    
    // Try to access the setting model
    if (typeof prisma.setting !== 'undefined') {
      // @ts-ignore - Ignore the TypeScript error about the setting property not existing
      const settingsCount = await prisma.setting.count();
      console.log('Settings count:', settingsCount);
      
      // @ts-ignore - Ignore the TypeScript error about the setting property not existing
      const allSettings = await prisma.setting.findMany();
      console.log('All settings:', allSettings);
    }
    
    // List all tables in the database using raw query
    const allTables = await prisma.$queryRaw`SHOW TABLES;`;
    console.log('All tables in database:', allTables);
    
    // Check specifically for the settings table
    const settingsTable = await prisma.$queryRaw`SHOW TABLES LIKE 'settings';`;
    console.log('Settings table check:', settingsTable);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Done!'))
  .catch((e) => console.error(e)); 