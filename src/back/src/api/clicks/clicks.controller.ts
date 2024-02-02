import { Controller, Get, Header } from '@nestjs/common';
import Redis from 'ioredis';

console.log(process.env.REDIS_SERVER);
const client = new Redis({
  host: 'eu2-learning-dane-32666.upstash.io',
  port: 32666,
  password: '01082a7f147849a7bf623acf830ca41d',
});

client.on('error', (err) => console.log('Redis Client Error', err));

@Controller('api/clicks')
export class ClicksController {
  @Get()
  @Header('Content-type', 'application/json')
  @Header('Access-Control-Allow-Origin', '*')
  async clicks() {
    const clicks = parseInt(await client.get('clicks')) || 0;
    return { clicks: clicks };
  }

  @Get('incr')
  @Header('Content-type', 'application/json')
  @Header('Access-Control-Allow-Origin', '*')
  async incr() {
    await client.incr('clicks');
    const clicks = parseInt(await client.get('clicks'));
    return { clicks: clicks };
  }
}
