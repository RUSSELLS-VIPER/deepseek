import mongoose from 'mongoose'

let cached = global.mongoose || { conn: null, promise: null }

export default async function connectDB() {
    if (cached.conn) return cached.conn
    
    if (!cached.promise) {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set')
        }
        cached.promise = mongoose.connect(process.env.MONGODB_URI).then(() => mongoose)
    }
    
    try {
        cached.conn = await cached.promise
        return cached.conn
    } catch (error) {
        cached.promise = null
        cached.conn = null
        console.error('Error connecting to MongoDB:', error.message)
        throw error
    }
}