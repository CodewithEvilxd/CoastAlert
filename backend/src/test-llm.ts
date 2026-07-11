import dotenv from 'dotenv';
import path from 'path';
import { chatCommandCenter } from './controllers/aiController';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../.env') });

const testLLM = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Database connected.');

    const mockReq = {
      body: {
        question: "Summarize today's threats",
        region: "Mumbai"
      }
    } as any;

    const mockRes = {
      status: (code: number) => {
        console.log('Status code returned:', code);
        return mockRes;
      },
      json: (data: any) => {
        console.log('\n--- AI RESPONSE RECEIVED ---');
        console.log(data.reply);
        console.log('----------------------------\n');
      }
    } as any;

    console.log('Sending query to chatCommandCenter controller...');
    await chatCommandCenter(mockReq, mockRes);
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err: any) {
    console.error('Test failed:', err.message);
  }
};

testLLM();
