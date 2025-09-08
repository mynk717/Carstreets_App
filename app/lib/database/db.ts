<<<<<<< HEAD
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveCars(cars: any[]) {
  await prisma.car.deleteMany(); // Clear old data
  
  for (const car of cars) {
    await prisma.car.create({
      data: {
        title: car.title,
        brand: car.brand,
        model: car.model,
        variant: car.variant || null,
        price: car.price,
        year: car.year,
        fuelType: car.fuelType,
        transmission: car.transmission,
        kmDriven: car.kmDriven,
        location: car.location,
        images: JSON.stringify(car.images),
        description: car.description,
        sellerType: car.sellerType,
        postedDate: car.postedDate,
        owners: car.owners,
        isVerified: car.isVerified,
        isFeatured: car.isFeatured,
        dataSource: car.dataSource,
        olxProfile: car.olxProfile,
        olxProfileId: car.olxProfileId,
        originalUrl: car.originalUrl,
        attribution: car.attribution,
        carStreetsListed: car.carStreetsListed,
      },
    });
  }
}

export async function fetchCars() {
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return cars.map(car => ({
    ...car,
    images: JSON.parse(car.images),
  }));
=======
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import { Car } from '../../types'

let db: any = null

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'data', 'carstreets.db'),
      driver: sqlite3.Database
    })
    
    // Create cars table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cars (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        variant TEXT,
        price INTEGER NOT NULL,
        year INTEGER NOT NULL,
        fuel_type TEXT NOT NULL,
        transmission TEXT NOT NULL,
        km_driven INTEGER NOT NULL,
        location TEXT NOT NULL,
        images TEXT, -- JSON array of image URLs
        description TEXT,
        seller_type TEXT DEFAULT 'Individual',
        posted_date TEXT NOT NULL,
        owners INTEGER DEFAULT 1,
        is_verified BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        data_source TEXT DEFAULT 'openai-enhanced',
        olx_profile TEXT DEFAULT 'carstreets',
        olx_profile_id TEXT DEFAULT '569969876',
        original_url TEXT,
        attribution_note TEXT,
        car_streets_listed BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create scraping_jobs table for tracking
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scraping_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        status TEXT DEFAULT 'running', -- running, completed, failed
        cars_scraped INTEGER DEFAULT 0,
        errors TEXT,
        notes TEXT
      )
    `)
    
    console.log('✅ Database initialized')
  }
  
  return db
}

export async function saveCarsToDatabase(cars: Car[]): Promise<void> {
  const database = await getDatabase()
  
  // Start transaction
  await database.run('BEGIN TRANSACTION')
  
  try {
    // Clear existing cars (fresh weekly data)
    await database.run('DELETE FROM cars')
    
    // Insert new cars
    for (const car of cars) {
      await database.run(`
        INSERT INTO cars (
          id, title, brand, model, variant, price, year, fuel_type,
          transmission, km_driven, location, images, description,
          seller_type, posted_date, owners, is_verified, is_featured,
          data_source, olx_profile, olx_profile_id, original_url,
          attribution_note, car_streets_listed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        car.id, car.title, car.brand, car.model, car.variant || null,
        car.price, car.year, car.fuelType, car.transmission, car.kmDriven,
        car.location, JSON.stringify(car.images), car.description,
        car.sellerType, car.postedDate, car.owners, car.isVerified ? 1 : 0,
        car.isFeatured ? 1 : 0, car.dataSource, car.olxProfile || null,
        car.olxProfileId || null, car.originalUrl, car.attributionNote || null,
        car.carStreetsListed ? 1 : 0
      ])
    }
    
    await database.run('COMMIT')
    console.log(`✅ Saved ${cars.length} cars to database`)
    
  } catch (error) {
    await database.run('ROLLBACK')
    console.error('❌ Database save failed:', error)
    throw error
  }
}

export async function getCarsFromDatabase(): Promise<Car[]> {
  const database = await getDatabase()
  
  const rows = await database.all('SELECT * FROM cars ORDER BY created_at DESC')
  
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    brand: row.brand,
    model: row.model,
    variant: row.variant,
    price: row.price,
    year: row.year,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    kmDriven: row.km_driven,
    location: row.location,
    images: JSON.parse(row.images || '[]'),
    description: row.description,
    sellerType: row.seller_type,
    postedDate: row.posted_date,
    owners: row.owners,
    isVerified: !!row.is_verified,
    isFeatured: !!row.is_featured,
    dataSource: row.data_source,
    olxProfile: row.olx_profile,
    olxProfileId: row.olx_profile_id,
    originalUrl: row.original_url,
    attributionNote: row.attribution_note,
    carStreetsListed: !!row.car_streets_listed
  }))
}

export async function shouldRunScraping(): Promise<boolean> {
  const database = await getDatabase()
  
  const lastJob = await database.get(`
    SELECT completed_at FROM scraping_jobs 
    WHERE status = 'completed' 
    ORDER BY completed_at DESC 
    LIMIT 1
  `)
  
  if (!lastJob) return true // No previous scraping
  
  const lastScrapingDate = new Date(lastJob.completed_at)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  return lastScrapingDate < weekAgo
>>>>>>> 1b71d0462f3415cc4320d48c0006735cc730ced5
}
